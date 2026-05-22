
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { ForgedInventory, ForgedPrint, Player, Transaction, Trade, Wallet } from '../database/index.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
const { king, master, scheming, robbed, starchips, rock, gold, treasure, LDM } = emojis
import channels from '../static/channels.json' with { type: 'json' }
const { marketPlaceChannelId, arenaChannelId } = channels

export default {
	data: new SlashCommandBuilder()
		.setName('networth')
		.setDescription('View your net worth! 🪎')
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('The player you want to check.')
                .setRequired(false)
        )
    	.setContexts(InteractionContextType.Guild),
        async execute(interaction) {
        try {
            await interaction.deferReply()
            const user = interaction.options.getUser('player') || interaction.user
            const player = await Player.findOne({ where: { discordId: user?.id } })

            const wallet = await Wallet.findOne({ where: { playerId: player.id }, include: Player})
            if (!wallet && player.id === interaction.user.id) return await interaction.editReply({ content: `You are not in the database. Type **/play** to begin the game.`})
            if (!wallet && player.id !== interaction.user.id) return await interaction.editReply({ content: `That user is not in the database.`})
        
            let networth = wallet.stardust * 0.1 + wallet.starchips

            let completeSets = []
            let printCount = 0
            let ldmCount = 0

            const printTotal = await ForgedPrint.count()
            
            const invs = await ForgedInventory.findAll({ 
                where: { 
                    playerId: player.id 
                }, 
                include: ForgedPrint
            })

            for (let i = 0; i < invs.length; i++) {
                const inv = invs[i]
                networth += inv.quantity * inv.forgedPrint.marketPrice * 0.1
                if (inv.quantity > 0) printCount++
                if ((inv.cardCode.includes('LDM-0') || inv.cardCode.includes('LDM-1')) && inv.quantity >= 3) ldmCount++
            }

            const totalPlayers = await Wallet.count() - 1
            const allNetworths = []

            const wallets = await Wallet.findAll({
                where: {
                    playerId: {[Op.not]: 'ZXyLL1wTcEZXSZYtegEuTr'}
                },
                include: [Player]
            })

            for (let i = 0; i < wallets.length; i++) {
                const wallet = wallets[i]
                let networth = wallet.stardust * 0.1 + wallet.starchips
                const invs = await ForgedInventory.findAll({ where: { playerId: wallet.player.id }, include: [ForgedPrint] })
                for (let i = 0; i < invs.length; i++) {
                    const inv = invs[i]
                    networth += inv.quantity * inv.forgedPrint.marketPrice * 0.1
                }

                allNetworths.push(networth)
            }

            allNetworths.sort((a, b) => b - a)
            const networthRanking = allNetworths.indexOf(networth) + 1

            if (ldmCount === 200) completeSets.push(`LDM ${LDM}`)

            const tradeCount = await Transaction.count({
                where: {
                    [Op.or]: {
                        playerAId: player.id,
                        playerBId: player.id
                    },
                    description: {
                        [Op.includes]: 'traded'
                    }
                }
            })

            const medal = networthRanking <= 0.1 * allNetworths.length ? king :
                networthRanking > 0.1 * allNetworths.length && networthRanking <= 0.2 * allNetworths.length ? master :
                networthRanking > 0.2 * allNetworths.length && networthRanking <= 0.8 * allNetworths.length ? scheming :
                rock

            const results = [`${treasure} --- Net Worth Stats --- ${treasure}`]
            results.push(`Name: ${player.name}`)
            results.push(`Net Worth: ${Math.round(networth)} ${starchips}`)
            results.push(`Ranking: ${networthRanking} out of ${totalPlayers} ${medal}`)
            results.push(`Prints: ${printCount} out of ${printTotal} :flower_playing_cards:`)
            results.push(`Complete Sets: ${completeSets.length ? completeSets.join(',') : 'N/A'}`)
            results.push(`Trades: ${tradeCount} ${robbed}`)
        
            return await interaction.editReply({ content: results.join('\n').toString()})
        } catch (err) {
            console.log(err)
        }
	}
}