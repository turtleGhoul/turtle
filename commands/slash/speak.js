const { SlashCommandBuilder } = require('discord.js');
const googleTTS  = require('google-tts-api');
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

        await interaction.deferReply({ ephemeral: true });

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

        try {
            
            await entersState(connection, VoiceConnectionStatus.Ready, 2000);

            const player = createAudioPlayer();
            
            const resource = createAudioResource(url);

            connection.subscribe(player);
            player.play(resource);

            await interaction.followUp({ content: 'yap yap', ephemeral: true });

            player.on(AudioPlayerStatus.Idle, () => {
                connection.destroy();
            });

            player.on('error', error => {
                console.error('Fehler beim AudioPlayer:', error);
                connection.destroy();
            });

        } catch (error) {
            connection.destroy();
            await interaction.followUp({ content: 'whoopsie.. etwas ist schiefgelaufen ', ephemeral: true });
        }
        

        player.on(AudioPlayerStatus.Idle, () => {
            connection.destroy();
        });
    },
};
        
