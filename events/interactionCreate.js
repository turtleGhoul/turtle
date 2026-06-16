const { Events, EmbedBuilder } = require('discord.js');
const pet_shop = require("../config.js");
const User = require('../User.js');

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction) {
        
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.slashCommands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'whoopsie.. , etwas ist schief gelaufen ;(', ephemeral: true });
                }
            }
            return;
        }

        // select menus


        if (interaction.isStringSelectMenu()) {
            
            if (interaction.customId === 'buySelect') {
                
                await interaction.deferUpdate();

                const userId = interaction.user.id;
                const petKey = interaction.values[0];
                const pet = pet_shop[petKey];

                if (!pet) {
                    return interaction.followUp({ content: "nicht erhältlich", ephemeral: true });
                }

                let user = await User.findOne({ userId: userId });
                if (!user) {
                    user = new User({ userId: userId });
                    await user.save();
                }

                if (user.collectedpets.includes(petKey)) {
                    return interaction.followUp({ content: `${pet.name} bereits im besitz`, ephemeral: true });
                }

                if (user.gutschein > 0) {
                    user.gutschein -= 1;
                    user.collectedpets.push(petKey);
                    await user.save();
                    await interaction.followUp({content: `${pet.name}  gekauft :>`, ephemeral: true})
                    return
                }

                if (user.coins < pet.price) {
                    return interaction.followUp({ content: `Du hast nicht genug Coins! **${pet.name}** kostet ${pet.price} Coins. Du hast nur ${user.coins}.`, ephemeral: true });
                }

                user.coins -= pet.price;
                user.collectedpets.push(petKey);
                
                await user.save();

                await interaction.followUp({content: `${pet.name}  gekauft :>`, ephemeral: true})
            }
        }
    },
};