const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus, entersState, VoiceConnectionStatus, StreamType, NoSubscriberBehavior } = require('@discordjs/voice');
const https = require('https');

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

        const postData = `msg=${encodeURIComponent(text)}&lang=Hans&source=ttsmp3`;

        const options = {
            hostname: 'ttsmp3.com',
            path: '/makemp3.php',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            
            res.on('end', async () => {
                try {
                    const responseJson = JSON.parse(body);
                    if (!responseJson.URL) return interaction.editReply({ content: 'Fehler bei der Spracherzeugung.' });

                    const audioUrl = responseJson.URL;

                    const connection = joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: voiceChannel.guild.id,
                        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                        selfDeaf: false
                    });

                    await entersState(connection, VoiceConnectionStatus.Ready, 5000);

                    const player = createAudioPlayer({
                        behaviors: {
                            noSubscriber: NoSubscriberBehavior.Play
                        }
                    });

                    const resource = createAudioResource(audioUrl, {
                        inputType: StreamType.Arbitrary
                    });

                    connection.subscribe(player);
                    
                    process.nextTick(() => {
                        player.play(resource);
                    });

                    await interaction.followUp({ content: 'yap yap', flags: [MessageFlags.Ephemeral] });

                    const fallbackTimeout = setTimeout(() => {
                        if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                            connection.destroy();
                        }
                    }, 15000);

                    player.on(AudioPlayerStatus.Idle, () => {
                        clearTimeout(fallbackTimeout);
                        connection.destroy();
                    });

                    player.on('error', error => {
                        console.error(error);
                        clearTimeout(fallbackTimeout);
                        connection.destroy();
                    });

                } catch (e) {
                    console.error(e);
                    connection.destroy();
                    interaction.editReply({ content: 'whoopsie.. Serverfehler.' });
                }
            });
        });

        req.on('error', (error) => {
            console.error(error);
            interaction.editReply({ content: 'whoopsie.. Verbindungsfehler.' });
        });

        req.write(postData);
        req.end();
    },
};