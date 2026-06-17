const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../../User');
const pet_shop = require('../../config.js');
const { execute } = require('./user.js');
const user = require('./user.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`race`)
        .setDescription(`starte ein rennen`),
    
    async execute(interaction)  {
        await interaction.deferReply()

        const ersteller = await User.findOne({ userId: interaction.user.id })
        if( !ersteller || !ersteller.pet || ersteller.pet === `none`)   {
            return interaction.followUp({ content: `du hast kein tier ausgerüstet..`, ephemeral: true})
        }

        const teilnehmer = [{
            userId: interaction.user.id,
            username: interaction.user.username,
            petKey: ersteller.pet,
            emoji: pet_shop[ersteller.pet]?.emoji || `🐾`,
            name: ersteller.petname !== `none` ? ersteller.petname : pet_shop[ersteller.pet].name,
            position: 0
        }]

        const joinButton = new ButtonBuilder()
            .setCustomId(`joinButton`)
            .setLabel(`join`)
            .setStyle(ButtonStyle.Success)
        
        const buttonRow = new ActionRowBuilder().addComponents(joinButton)

        const embed = new EmbedBuilder()
            .setTitle(`race`)
            .setDescription(`schreibt euch über den button ein`)
            .setColor(0x5CE65C)
        
        const response = await interaction.editReply({ embeds: [embed], components: [buttonRow] })

        const collector = response.createMessageComponentCollector({
            time:30000
        })

        collector.on(`collect`, async i => {

            if ( i.customId === `joinButton`)   {

                if (teilnehmer.some(p => p.userId === i.user.id))  {
                    return i.reply({content: `du bist schon dabei..`, ephemeral: true})
                }

                const player = await User.findOne({userId: i.user.id})
                if (!player || !player.pet || player.pet === `none`) {
                    return i.reply({content: `rüste erst ein tier aus..`, ephemeral: true})
                }

                teilnehmer.push({
                    userId: i.user.id,
                    username: i.user.username,
                    petKey: player.pet,
                    emoji: pet_shop[player.pet].emoji || `🐾`,
                    name: player.petname !== `none` ? player.petname : pet_shop[player.pet].name,
                    position: 0
                })

                const embedText = teilnehmer.map(p => `${p.username} -- ${p.name} ${p.emoji}`).join(`\n`)
                embed.setDescription(`schreibt euch über den button ein\n\n**Teilnehmer:**\n${embedText}`)

                await i.update({embeds: [embed], components: [buttonRow]})
            }
        })

        collector.on(`end`, async () =>    {

            joinButton.setDisabled(true)
            await interaction.editReply({components: [buttonRow]})

            if ( teilnehmer.length < 2 )    {
                return interaction.followUp(`niemand hat sich eingeschrieben. das rennen wurde abgebrochen ;<`)
            }

            await race(interaction, embed, teilnehmer)
        })

        const delay = ms => new Promise(res => setTimeout(res, ms));

        async function race(interaction, embed, teilnehmer) {
            const trackLength = 10
            let winner = null

            for ( const player of teilnehmer )  {
                const dbUser = await User.findOne({userId: player.userId})
                const currentXP = dbUser.petEXP

                const xpBonus = Math.min((currentXP / 100) * 0.1, 1.0)
                player.bonus = xpBonus
            }

            embed.setTitle(`das rennen läuft...`)

            let startText = '';
            for (const player of teilnehmer) {
            player.position = 0;
            const lane = player.emoji + '- '.repeat(trackLength) + '🧀';
            startText += `**${player.username}** (${player.name})\n${lane}\n\n`;
            }

            embed.setDescription(startText);
            await interaction.editReply({ embeds: [embed] });
            await delay(2000);

            while (!winner) {
                let raceTrackText = ``

                for ( const player of teilnehmer )  {
                    const steps = Math.floor(Math.random() * 3) + 1

                    player.position += ( steps + player.bonus )

                    if ( player.position >= trackLength )   {
                        player.position = trackLength
                        if ( !winner ) winner = player
                    }

                    const visualPosition = Math.floor(player.position)
                    const remainingTrack = Math.max(0, trackLength - visualPosition)

                    const lane = '- '.repeat(visualPosition) + player.emoji + '- '.repeat(remainingTrack) + '🧀';
                    const bonusText = player.bonus > 0 ? ` [+${player.bonus.toFixed(1)}]` : '';
                    raceTrackText += `**${player.username}** (${player.name})${bonusText}\n${lane}\n\n`;
                }
                
                embed.setDescription(raceTrackText)
                await interaction.editReply({ embeds: [embed] })

                await delay(1500)
            }

            const coinReward = 50
            const xpReward = 30

            let endReportText = `🏁 | ${winner.name} gewinnt für ${winner.username} das rennen!\n\n+30 xp\n+50 coins`

            for ( const player of teilnehmer )  {
                const isWinner = (player.userId === winner.userId)

                if ( isWinner ) {
                    const dbUser = await User.findOne({userId: player.userId})
                    if ( dbUser )   {
                        dbUser.coins = dbUser.coins + coinReward
                        dbUser.petEXP = dbUser.petEXP + xpReward
                        await dbUser.save()
                    }
                }
            }

            embed.setTitle(`rennen beendet`)
                .setDescription(endReportText)

            await interaction.editReply({embeds: [embed], components: []})

        }
    }
}