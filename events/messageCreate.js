const { Events } = require('discord.js');   

module.exports = {
    name : Events.MessageCreate,
    once : false,
    async execute(message) {
        if(message.author.bot) return;

        // instant reply:
        
        if(message.content.toLowerCase() === "turtle") {
            return message.reply("ni hao");
        }

        // valerie 
        if(message.author.id === "593787819693178900") {
            return message.react(`🖕`)
        }

        if(message.content.toLowerCase() === "valerie") {
            return message.reply("👌 hat reingeschaut");
        }

        if(!message.content.toLowerCase().startsWith(process.env.prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = message.client.textCommands.get(commandName);
        if(!command) return;

        try {
            await command.execute(message, args);
        } catch (error) {
            console.error(error);
            await message.reply("whoopsie.. , etwas ist schief gelaufen ;(");
        }
    }
}