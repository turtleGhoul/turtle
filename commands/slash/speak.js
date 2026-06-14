const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const say = require('say');
const path = require('path');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('speak')
        .setDescription(`lass mich im voice reden`)
        .addStringOption(option =>
            option.setName('text')
                .setDescription('was soll ich sagen bruda?')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const voiceChannel = interaction.member.voice.channel;
        const text = interaction.options.getString('text');

        if (!voiceChannel) {
            return interaction.editReply({ content: 'musst in nem voice sein' });
        }

        if (text.length > 200) {
            return interaction.editReply({ content: 'der text ist zu lang, bitte kürze ihn auf 200 zeichen' });
        }

        const tempFilePath = path.join(__dirname, `tts_${Date.now()}.wav`);

        say.export(text, null, 1, tempFilePath, async (err) => {
            if (err) {
                console.error(err);
                return interaction.editReply({ content: 'Fehler bei der Spracherzeugung.' });
            }

            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            try {
                await entersState(connection, VoiceConnectionStatus.Ready, 5000);

                const player = createAudioPlayer();
                const resource = createAudioResource(tempFilePath);

                connection.subscribe(player);
                player.play(resource);

                await interaction.followUp({ content: 'yap yap', flags: [MessageFlags.Ephemeral] });

                const fallbackTimeout = setTimeout(() => {
                    if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                        connection.destroy();
                    }
                    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                }, 15000);

                player.on(AudioPlayerStatus.Idle, () => {
                    clearTimeout(fallbackTimeout);
                    connection.destroy();
                    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                });

                player.on('error', error => {
                    console.error(error);
                    clearTimeout(fallbackTimeout);
                    connection.destroy();
                    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                });

            } catch (error) {
                console.error(error);
                connection.destroy();
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                await interaction.followUp({ content: 'whoopsie.. etwas ist schiefgelaufen', flags: [MessageFlags.Ephemeral] });
            }
        });
    },
};