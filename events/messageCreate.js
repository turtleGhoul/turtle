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
        const gangId = "1446402065168334941"

        if(message.author.id === "593787819693178900") {
            if ( message.guild.id === gangId )  {
                const hasImg = message.attachments.size > 0

                if ( hasImg )   {
                    return message.react(`🖕`)
                } else  {
                    const randomizer = Math.random()
                    if ( randomizer <= 0.20 )   {
                        return message.react(`🖕`)
                    }
                }
            } else {
                return message.react(`🖕`)
            }
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