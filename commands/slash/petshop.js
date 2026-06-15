const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const pet_shop = require("../../config.js");
const User = require('../../User');

module.exports = {

    data: new SlashCommandBuilder()
        .setName("petshop")
        .setDescription("kaufe ein haustierchen"),
    
    async execute(interaction)  {

        const id = interaction.author.userId

        let user = await User.findOne({ userId: id })
        if ( !user )    {
            user = new User({ userId: id })
            await user.save()
        }

        const coins = user.coins
        const gutschein = user.gutschein
        const collectedpets = user.collectedpets

        let shopDescription = `balance: **${coins}**\n`

        if (gutschein > 0)  {
            shopDescription += `gutscheine: **${gutschein}**\n`
        }

        shopDescription += `ANGEBOT\n\n`

        Object.keys(pet_shop).forEach(key =>   {

            const pet = pet_shop[key]
            const inBesitz = collectedpets.includes(key)

            if  ( inBesitz )    {
                shopDescription += `${pet.emoji} | **${pet.name}** -- in besitz`
            } else {
                shopDescription += `${pet.emoji} | **${pet.name}** -- ${pet.price}`
            }
        })

        const embed = new EmbedBuilder()
            .setTitle("Pet Shop")
            .setDescription(shopDescription)
            .setColor(0x5CE65C)
            .setTimestamp()

        await interaction.reply({ embeds: [ embed ]})
    }

}