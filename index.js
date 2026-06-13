const fs = require(`node:fs`);
const path = require(`node:path`);
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');
const mongoose = require('mongoose');
const User = require('./User');
require('dotenv').config();
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
    rest: {
        globalRequestsPerSecond: 50,
    }
});

mongoose.connect(process.env.mongo_uri)
    .then(() => console.log('MongoDB verbunden'))
    .catch(err => console.error('MongoDB Verbindungsfehler:', err));

// music events

const player = new Player(client, {

    bridgeProvider:  {
        bridgeGuard: true,
        defaultBridge: "soundcloud",
    }        
});

player.extractors.loadMulti(DefaultExtractors);
 

player.events.on(`playerStart`, (queue, track) => {
    queue.metadata.send(`**${track.title}** am laufen`);
});

player.events.on(`emptyQueue`, (queue) => {
    queue.metadata.send(`keine tracks über. fütter mich!`);
});



client.once(Events.ClientReady, c => {
    console.log(`ni hao , ${c.user.tag} ist ready!`);
});

client.textCommands = new Collection();
client.slashCommands = new Collection();

const textPath = path.join(__dirname, `commands/text`);
if(fs.existsSync(textPath)) {
    const textFiles = fs.readdirSync(textPath).filter(file => file.endsWith(`.js`));
    for(const file of textFiles) {
        const command = require(path.join(textPath, file));
        client.textCommands.set(command.name, command);
    }
}

const slashPath = path.join(__dirname, `commands/slash`);
if(fs.existsSync(slashPath)) {
    const slashFiles = fs.readdirSync(slashPath).filter(file => file.endsWith(`.js`));
    for ( const file of slashFiles) {
        const command = require(path.join(slashPath, file));
        client.slashCommands.set(command.data.name, command);
    }
}

const eventsPath = path.join(__dirname, `events`);
if(fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(`.js`));
    for (const file of eventFiles) {
        const event = require(path.join(eventsPath, file));
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.login(process.env.bot_token);