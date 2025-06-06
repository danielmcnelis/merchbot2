
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { ForgedInventory, ForgedPrint, ForgedSet, Player, Wallet } from '../database/index.js'
import { Op } from 'sequelize'
import { isMod } from '../functions/utility.js'
import { awardBox, awardPacks } from '../functions/packs.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const {AOD, com, rar, sup, ult, scr, stardust, starchips, koolaid} = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('award-partial-box')
		.setDescription('Admin Only - Award missing packs from a box to a player. 🏅')
        .addNumberOption(option =>
            option
                .setName('quantity')
                .setDescription('How many packs do you wish to award?')
                .setRequired(true)
        )
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('Tag the player to award.')
                .setRequired(true)
        ),
	async execute(interaction) {
        try {      
            if (!isMod(interaction.member)) return interaction.reply({ content: "You do not have permission to do that."})
            const quantity = interaction.options.getNumber('quantity')
            if (quantity < 1) return interaction.reply({ content: `You cannot award less than 1 item.`})
            const set = await ForgedSet.findOne({ where: { name: 'Ascent of Dragons' }})
            const award = `${quantity} Pack(s) from a partial Box of ${set.name} ${eval(set.code)}`
            const user = interaction.options.getUser('player')
            const discordId = user.id
            if (interaction.user.id === discordId) return interaction.reply({ content: `You cannot award ${koolaid} things to yourself.`})
            const player = await Player.findByDiscordId(discordId)
            const member = interaction.guild.members.cache.get(discordId)
            
            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId(`Award-Partial-Box-Yes`)
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId(`Award-Partial-Box-No`)
                    .setLabel('No')
                    .setStyle(ButtonStyle.Primary)
                )

            await interaction.reply({ content: `Are you sure you want to award ${award} to ${player.name}? ${koolaid}`, components: [row] })

            const filter = i => i.customId.startsWith('Award-Partial-Box-') && i.user.id === interaction.user.id;

            try {
                const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                if (confirmation.customId.includes('Yes')) {
                    await confirmation.update({ components: [] })
                    awardBox(interaction.channel, member, set, quantity)
                    return interaction.editReply({ content: `You awarded ${award} to ${player.name}. ${koolaid}`, components: [] });        
                } else {
                    await confirmation.update({ components: [] })
                    await confirmation.editReply({ content: `Not a problem. ${award} ${quantity === 1 ? 'was' : 'were'} not awarded to ${player.name}.`, components: [] })
                }
            } catch (err) {
                console.log(err)
                await interaction.editReply({ content: `Sorry, time's up. ${award} ${quantity === 1 ? 'was' : 'were'} not awarded to ${player.name}.`, components: [] });
            }
        } catch (err) {
            console.log(err)
        }
	}
}