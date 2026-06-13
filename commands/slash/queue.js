const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data : new SlashCommandBuilder()
        .setName(`queue`)
        .setDescription(`zeigt die queue`),
    
    async execute(i) {
        const queue = useQueue(i.guild.id);

        if(!queue || !queue.isPlaying()) {
            return i.reply(`grade nix am laufen`);
        }

        const current = queue.currentTrack;
        const tracks = queue.tracks.toArray();
        const maxSongs = 10;
        const queueString = tracks.slice(0, maxSongs).map((track, i) => `**${i + 1}.** [${track.title}](${track.url}) - \`${track.duration}\``).join('\n');
        

        if (tracks.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`queue für ${i.guild.name}`)
                .setDescription(`**am laufen:**\n${current.title}\n\n**sonst nix in der queue**`)
                .setColor(0x5CE65C);
            return i.reply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
            .setTitle(`queue für ${i.guild.name}`)
            .addFields(
                { name: `am laufen:`, value: `**${current.title}**` },
                { name: `nächste ${tracks.length > maxSongs ? maxSongs : tracks.length} songs:`, value: queueString || `**sonst nix in der queue**` }
            )
            .setColor(0x5CE65C);

        return i.reply({ embeds: [embed] });
    }       
}   