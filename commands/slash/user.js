const { EmbedBuilder } = require("@discordjs/builders");
const { SlashCommandBuilder } = require("@discordjs/builders");
const pet_shop = require("../../config.js");
const User = require('../../User');


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


        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}`)
            .setDescription(`coins: ${user.coins}\n
                active pet: ${user.pet}\n
                collected pets: ${user.collectedpets}`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setColor(0x5CE65C)
            .setTimestamp()


        await interaction.reply({embeds: [embed]})
    }
};
