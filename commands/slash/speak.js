const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus, entersState, VoiceConnectionStatus, StreamType } = require('@discordjs/voice');
const EasyTTS = require('easy-tts');
const { Readable } = require('stream');

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

        try {
            const tts = new EasyTTS();
            const audioBuffer = await tts.generate(text, { lang: 'de' });
            const audioStream = Readable.from(audioBuffer);

            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            await entersState(connection, VoiceConnectionStatus.Ready, 5000);

            const player = createAudioPlayer();
            const resource = createAudioResource(audioStream, {
                inputType: StreamType.Arbitrary
            });

            connection.subscribe(player);
            player.play(resource);

            await interaction.followUp({ content: 'yap yap', flags: [MessageFlags.Ephemeral] });

            player.on(AudioPlayerStatus.Idle, () => {
                connection.destroy();
            });

            player.on('error', error => {
                console.error(error);
                connection.destroy();
            });

        } catch (error) {
            console.error(error);
            await interaction.followUp({ content: 'whoopsie.. etwas ist schiefgelaufen', flags: [MessageFlags.Ephemeral] });
        }
    },
};