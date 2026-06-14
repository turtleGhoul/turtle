const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus, entersState, VoiceConnectionStatus, StreamType } = require('@discordjs/voice');
const { Readable } = require('stream');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('speak')
        .setDescription(`lass mich im voice reden`),

    async execute(interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.editReply({ content: 'musst in nem voice sein' });
        }

        const buffer = Buffer.alloc(48000 * 2);
        for (let i = 0; i < buffer.length; i++) {
            buffer[i] = Math.floor(Math.random() * 256);
        }

        const silenceStream = Readable.from(buffer);

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 5000);

            const player = createAudioPlayer();
            const resource = createAudioResource(silenceStream, {
                inputType: StreamType.Raw
            });

            connection.subscribe(player);
            player.play(resource);

            await interaction.followUp({ content: 'Teste internen Audio-Stream...', flags: [MessageFlags.Ephemeral] });

            player.on(AudioPlayerStatus.Idle, () => {
                connection.destroy();
            });

            player.on('error', error => {
                console.error(error);
                connection.destroy();
            });

        } catch (error) {
            console.error(error);
            connection.destroy();
            await interaction.followUp({ content: 'whoopsie.. etwas ist schiefgelaufen', flags: [MessageFlags.Ephemeral] });
        }
    },
};