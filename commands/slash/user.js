const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder } = require("@discordjs/builders");
const { SlashCommandBuilder } = require("@discordjs/builders");
const pet_shop = require("../../config.js");
const User = require('../../User');
const { FileUploadAssertions, ButtonStyle, TextInputStyle } = require("discord.js");


module.exports = {
    data: new SlashCommandBuilder()
        .setName("user")
        .setDescription("ganzes profil"),
        
    async execute(interaction) {

        const id = interaction.user.id

        let user = await User.findOne({ userId: id })
                if ( !user )    {
                    user = new User({ userId: id })
                    await user.save()
                }

        let collectedPetsText = `keine tiere im besitz`
        if ( user.collectedpets && user.collectedpets.length > 0 )  {

            const petList = user.collectedpets.map(key =>   {

                const petConfig = pet_shop[key]

                if ( petConfig )    {
                    return `${petConfig.emoji} ${petConfig.name}`
                }
                return key
            })
            
            collectedPetsText = `> ` + petList.join(`\n> `)
        }

        let activePetText = `none`
        if ( user.pet && user.pet !== `none` && pet_shop[user.pet]) {
            const petConfig = pet_shop[user.pet]

            if ( user.petname !== `none`)   {
                activePetText = `**${user.petname}** (${petConfig.petname})`
            } else {
                activePetText = `**${petConfig.name}**`
            }
        }

        const menuOptions = []

        Object.keys(pet_shop).forEach(key   =>  {
            
            const pet = pet_shop[key]
            const collectedPets = user.collectedpets.includes(key)

            if ( collectedPets )    {
                
                menuOptions.push({
                    label: pet.name,
                    value: key,
                    emoji: { name: pet.emoji }
                })

            } else  {
                return
            }
        })

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`equpipPetSelect`)
            .setPlaceholder(`active pet`)

        if  ( menuOptions.length > 0 )  {
            selectMenu.addOptions(menuOptions)
        }  else {
            selectMenu.addOptions([
                {
                    label: `leer`,
                    value: `none`
                }
            ])
            selectMenu.setDisabled(true)
        }

        const SelectRow = new ActionRowBuilder().addComponents(selectMenu)

        let ButtonRow = null
        if ( user.collectedpets )   {
            const button = new ButtonBuilder()
                    .setCustomId(`nicknameButton`)
                    .setLabel(`change petname`)
                    .setStyle(ButtonStyle.Success)
            
            ButtonRow = new ActionRowBuilder().addComponents(button)
        }

        const components = [ SelectRow ]  
        if ( ButtonRow )    {
            components.push(ButtonRow)
        }


        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}`)
            .setDescription(`coins: ${user.coins}\nactive pet: ${activePetText}\nxp: ${user.petEXP}`)
            .addFields(
                {
                    name: `collected pets:`, value: collectedPetsText, inline: true
                },
                {
                    name: `collected badges:`, value: `coming soon..`, inline: true
                }
            )
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setColor(0x5CE65C)
            .setTimestamp()


        const response = await interaction.reply({embeds: [embed], components: components })

        const collector = response.createMessageComponentCollector({
            time: 900000
        })

        collector.on(`collect`, async i =>  {
            if ( i.user.id !== interaction.user.id )    {
                return i.reply({ content: `mach das bei deinem eigenem profil..`, emphemeral: true})
            }

            if ( i.isStringSelectMenu() && i.customId === "equipPetSelect") {
                const chosen = i.values[0]

                user.pet = chosen
                await user.save()

                await i.reply({content: `auf gehts ${pet_shop[chosen].name}!!`})
            }

            if ( i.isButton() && i.customId === "nicknameButton")   {

                const modal = new ModalBuilder()
                    .setCustomId(`nicknameModal`)
                    .setTitle(`Nickname`)

                const nameInput = new TextInputBuilder()
                    .setCustomId(`nicknameInput`)
                    .setLabel(`wie soll ich heißen?`)
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setPlaceholder(`z.B. ketaminsniffer 3000`)
                    .setRequired(true)
                
                const modalActionRow = new ActionRowBuilder().addComponents(nameInput)

                modal.addComponents(modalActionRow)

                await i.showModal(modal)

                try {
                    const modalInteraction = await i.awaitModalSubmit({
                        filter: mi => mi.customId === `nicknameModal` && mi.user.id === interaction.user.id,
                        time: 120000
                    })

                    const newName = modalInteraction.fields.getTextInputValue(`nicknameInput`)

                    user.petname = newName
                    await user.save()

                    await modalInteraction.reply({content: `umbenannt zu ${newName}`, ephemeral: true})

                } catch ( error )   {
                    return
                }
            }
        })
    }
};
