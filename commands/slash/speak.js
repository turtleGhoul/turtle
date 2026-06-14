const { SlashCommandBuilder } = require('discord.js');
const { googleTTS } = require('google-tts-api');
const { createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus } = require('@discordjs/voice');

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

        const voiceChannel = interaction.member.voice.channel;
        const text = interaction.options.getString('text');

        if (!voiceChannel) {
            return interaction.reply({ content: 'musst in nem voice sein', ephemeral: true });
        }

        if (text.length > 200) {
            return interaction.reply({ content: 'der text ist zu lang, bitte kürze ihn auf 200 zeichen', ephemeral: true });
        }

        const url = googleTTS.getAudioUrl(text, {
            lang: 'de',
            slow: false,
            host: 'https://translate.google.com',
        }); 

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(url);


        connection.subscribe(player);
        player.play(resource);

        player.on(AudioPlayerStatus.Idle, () => {
            connection.destroy();
        });
    },
};
        
