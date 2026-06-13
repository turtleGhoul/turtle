const { SlashCommandBuilder } = require("discord.js");
const { useMainPlayer } = require("discord-player");

module.exports = {
    data : new SlashCommandBuilder()
        .setName(`play`)
        .setDescription(`add song zur queue`)
        .addStringOption(option =>
            option.setName(`song`)
                .setDescription(`song name or url`)
                .setRequired(true)
        ),

    async execute(i) {
        const player = useMainPlayer();
        const channel = i.member.voice.channel;

        if(!channel) {
            return i.reply(`musst in nem voice sein`);
        }
        
        await i.deferReply();
        
        const query = i.options.getString(`song`, true);

        try {
            const { track, queue } = await player.play(channel, query, {
                nodeOptions: {
                    metadata: i.channel,
                    leaveOnEmpty: true,
                    leaveOnEnd: false,
                },
            });
            
            if(queue.tracks.size > 0) {
                return i.followUp(`**${track.title}** zur queue geaddet`);
            } else {
                return i.followUp(`**${track.title}** geaddet`);
            }
        } catch (error) {
            console.error(error);
            return i.followUp(`whoopsie.. , etwas ist schief gelaufen ;(`);
        }  
    }
}   