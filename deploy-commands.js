require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];

const slashPath = path.join(__dirname, 'commands/slash');

if (fs.existsSync(slashPath)) {
    const slashFiles = fs.readdirSync(slashPath).filter(file => file.endsWith('.js'));
    
    for (const file of slashFiles) {
        const command = require(path.join(slashPath, file));
        if ('data' in command && 'execute' in command) {
            
            commands.push(command.data.toJSON());
        } else {
            console.log(`[WARNUNG] Der Befehl unter ${file} vermisst die "data" oder "execute" Eigenschaft.`);
        }
    }
}


const rest = new REST().setToken(process.env.bot_token);


(async () => {
    try {
        console.log(`mal gucken was wird. ${commands.length} slash-commands`);


        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.client_id, "980437511992147990"),
            { body: [] },
        );

        console.log(`done :> , ${data.length} slash-commands registriert`);
    } catch (error) {
        console.error(error);
    }
})();