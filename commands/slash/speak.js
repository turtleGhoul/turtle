const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const googleTTS = require('google-tts-api');
const { createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus, entersState, VoiceConnectionStatus } = require('@discordjs/voice');

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

        const url = googleTTS.getAudioUrl(text, {
            lang: 'de',
            slow: false,
            host: 'https://google.com',
        }); 

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 5000);

            const player = createAudioPlayer();
            const resource = createAudioResource(url);

            connection.subscribe(player);
            player.play(resource);

            await interaction.followUp({ content: 'yap yap', flags: [MessageFlags.Ephemeral] });

            const fallbackTimeout = setTimeout(() => {
                if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                    connection.destroy();
                }
            }, 10000);

            player.on(AudioPlayerStatus.Idle, () => {
                clearTimeout(fallbackTimeout);
                connection.destroy();
            });

            player.on('error', error => {
                console.error(error);
                clearTimeout(fallbackTimeout);
                connection.destroy();
            });

        } catch (error) {
            console.error(error);
            connection.destroy();
            await interaction.followUp({ content: 'whoopsie.. etwas ist schiefgelaufen', flags: [MessageFlags.Ephemeral] });
        }
    },
};