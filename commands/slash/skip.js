const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('skip song'),

    async execute(interaction) {
        
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ 
                content: 'uuhm.. es läuft nix, was ich überspringen könnte', 
                ephemeral: true 
            });
        }
        
        const currentTrack = queue.currentTrack;

        queue.node.skip();

        
        return interaction.reply(`**${currentTrack.title}** übersprungen`);
    },
};