const { EmbedBuilder } = require("@discordjs/builders");
const { SlashCommandBuilder } = require("@discordjs/builders");
const pet_shop = require("../../config.js");
const User = require('../../User');
const { FileUploadAssertions } = require("discord.js");


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
            
            collectedPetsText = petList.join(`\n`)
        }

        let activePetText = `none`
        if ( user.pet && user.pet !== `none` && pet_shop[user.pet]) {
            const petConfig = pet_shop[user.pet]

            if ( user.petname !== `none`)   {
                activePetText = `**${petConfig.petname}** (${petConfig.petname})`
            } else {
                activePetText = `**${petConfig.name}**`
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}`)
            .setDescription(`coins: ${user.coins}\n
                active pet: ${activePetText}`)
            .addFields(
                {
                    name: `collected pets:`, value: collectedPetsText, inline: false
                }
            )
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setColor(0x5CE65C)
            .setTimestamp()


        await interaction.reply({embeds: [embed], })
    }
};
