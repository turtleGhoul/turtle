const { EmbedBuilder, SlashCommandBuilder } = require('@discordjs/builders');
const User = require('../../User');
const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ComponentType } = require('discord.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName("todolist")
        .setDescription("erstellt eine to-do-liste!"),

    async execute(interaction) {

        const userId = interaction.user.id;

        let userData = await User.findOne({ userId: userId });

        if (!userData) {
            userData = new User({ userId: userId });
            await userData.save();
        }
       
        const ToDoEmbed = new EmbedBuilder()
            .setTitle("To-Do List")
            .setDescription(`1. ${userData.list1}\n2. ${userData.list2}\n3. ${userData.list3}\n4. ${userData.list4}\n5. ${userData.list5}`)
            .setColor(0x5CE65C)
            .setTimestamp();

        const ToDoSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('todolist_select')
            .setPlaceholder('choose einen slot')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Slot 1')
                    .setValue('list1'),

                new StringSelectMenuOptionBuilder()
                    .setLabel('Slot 2')
                    .setValue('list2'),

                new StringSelectMenuOptionBuilder()
                    .setLabel('Slot 3')
                    .setValue('list3'),
                
                new StringSelectMenuOptionBuilder()
                    .setLabel('Slot 4')
                    .setValue('list4'),
                
                new StringSelectMenuOptionBuilder()
                    .setLabel('Slot 5')
                    .setValue('list5'),

            )

            const row = new ActionRowBuilder().addComponents(ToDoSelectMenu);

            const response = await interaction.reply({ embeds: [ToDoEmbed], components: [row], fetchresponse: true });

            const collector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 900000 });

            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: 'erm.. das ist nicht deine liste', ephemeral: true });
                } 

                const selectedSlot = i.values[0];

                const modal = new ModalBuilder()
                    .setCustomId('todolist_modal_' + selectedSlot)
                    .setTitle('to-do ' + selectedSlot);

                const taskInput = new TextInputBuilder()
                    .setCustomId('todo_input')
                    .setLabel('deine quest')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);


                modal.addComponents(new ActionRowBuilder().addComponents(taskInput));


                await i.showModal(modal);

                try {
                    const modalSubmit = await i.awaitModalSubmit({
                        filter: (i) => i.customId === `todolist_modal_${selectedSlot}`,
                        time: 70000
                    });

                    const submitedText = modalSubmit.fields.getTextInputValue('todo_input');

                    const updatedData = await User.findOneAndUpdate(
                        { userId: userId },
                        { $set: { [selectedSlot]: submitedText } },
                        { new: true }
                    );

                    const EditedToDoEmbed = new EmbedBuilder()
                        .setTitle("To-Do List")
                        .setDescription(`1. ${updatedData.list1}\n2. ${updatedData.list2}\n3. ${updatedData.list3}\n4. ${updatedData.list4}\n5. ${updatedData.list5}`)
                        .setColor(0x5CE65C)
                        .setTimestamp();

                    await response.edit({ embeds: [EditedToDoEmbed], components: [row] });

                    await modalSubmit.reply({ content: 'deine to-do-liste wurde aktualisiert!', ephemeral: true });

                } catch (error) {
                    console.error(error);
                    await menuInteraction.reply({ content: 'whoopsie.. , etwas ist schief gelaufen ;(', ephemeral: true });
                }

                collector.on('end', async () => {
                    response.edit({ components: [] }).catch(() => {});
                });
            });
    }
};
