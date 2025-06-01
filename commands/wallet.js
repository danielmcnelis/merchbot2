
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { Player, Wallet } from '../database/index.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const {FiC, stardust, starchips} = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('wallet')
		.setDescription('Inspect someone\'s wallet! 👛')
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('The player you want to check.')
                .setRequired(false)
        )
    	.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
        try {
            const user = interaction.options.getUser('player') || interaction.user
            const player = await Player.findOne({ where: { discordId: user?.id } })
            const wallet = await Wallet.findOne({ where: { playerId: player.id }, include: Player})
            if (!wallet && player.id === interaction.user.id) return await interaction.reply({ content: `You are not in the database. Type **!start** to begin the game.`})
            if (!wallet && player.id !== interaction.user.id) return await interaction.reply({ content: `That user is not in the database.`})
        
            const results = [`${FiC} --- ${wallet.player.name}'s Wallet --- ${FiC}`]
            results.push(`Starchips: ${wallet.starchips}${starchips}`)
            results.push(`Stardust: ${wallet.stardust}${stardust}`)
        
            return await interaction.reply({ content: results.join('\n').toString()})
        } catch (err) {
            console.log(err)
        }
	}
}