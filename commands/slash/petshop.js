const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require("discord.js")
const pet_shop = require("../../config.js");
const User = require('../../User');

module.exports = {

    data: new SlashCommandBuilder()
        .setName("petshop")
        .setDescription("kaufe ein haustierchen"),
    
    async execute(interaction)  {

        const id = interaction.user.id

        let user = await User.findOne({ userId: id })
        if ( !user )    {
            user = new User({ userId: id })
            await user.save()
        }

        const coins = user.coins
        const gutschein = user.gutschein
        const collectedpets = user.collectedpets

        let shopDescription = `balance: **${coins}**\n\n`

        if (gutschein > 0)  {
            shopDescription += `gutscheine: **${gutschein}**\n\n`
        }

        shopDescription += `**ANGEBOT**\n\n`

        const menuOptions = []

        Object.keys(pet_shop).forEach(key =>   {

            const pet = pet_shop[key]
            const inBesitz = collectedpets.includes(key)

            if  ( inBesitz )    {
                shopDescription += `${pet.emoji} | **${pet.name}** -- in besitz\n`
            } else {
                shopDescription += `${pet.emoji} | **${pet.name}** -- ${pet.price}\n`

                menuOptions.push({
                    label: pet.name,
                    value: key,
                    description: `${pet.price} coins`,
                    emoji: pet.emoji
                })
            }

        })
        
        const buySelectMenu = new StringSelectMenuBuilder()
            .setCustomId("buySelect")
            .setPlaceholder(menuOptions.length > 0 ? `einkaufswagen` : `schon alle tiere in besitz`)

        if  ( menuOptions.length > 0 )  {
            buySelectMenu.addOptions(menuOptions)
        }  else {
            buySelectMenu.addOptions([
                {
                    label: `leer`,
                    value: `none`
                }
            ])
            buySelectMenu.setDisabled(true)
        }
        
        const embed = new EmbedBuilder()
            .setTitle("Pet Shop")
            .setDescription(shopDescription)
            .setColor(0x5CE65C)
            .setTimestamp()

        const row = new ActionRowBuilder()
            .addComponents(buySelectMenu)

        await interaction.reply({ embeds: [ embed ], components: [row]})
    }

}