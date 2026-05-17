
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { ForgedInventory, ForgedPrint, Player, Trade, Wallet } from '../database/index.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
const { scheming, robbed, starchips, LDM } = emojis
import channels from '../static/channels.json' with { type: 'json' }
const { marketPlaceChannelId, arenaChannelId } = channels

export default {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('View your net worth or Arena stats! 🪎')
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('The player you want to check.')
                .setRequired(false)
        )
    	.setContexts(InteractionContextType.Guild),
        async execute(interaction) {
        try {
            console.log('?')
            await interaction.deferReply()
            const user = interaction.options.getUser('player') || interaction.user
            const player = await Player.findOne({ where: { discordId: user?.id } })

            if (interaction.channelId === marketPlaceChannelId) {
                const wallet = await Wallet.findOne({ where: { playerId: player.id }, include: Player})
                if (!wallet && player.id === interaction.user.id) return await interaction.editReply({ content: `You are not in the database. Type **/play** to begin the game.`})
                if (!wallet && player.id !== interaction.user.id) return await interaction.editReply({ content: `That user is not in the database.`})
            
                let networth = wallet.stardust * 0.1 + wallet.starchips
                let completeSets = []
                let printCount = 0
                let ldmCount = 0

                const printTotal = await ForgedPrint.count()
                
                const invs = await ForgedInventory.findAll({ where: { playerId: player.id }, include: [ForgedPrint] })
                for (let i = 0; i < invs.length; i++) {
                    const inv = invs[i]
                    networth += inv.quantity * inv.forgedPrint.marketPrice * 0.1
                    if (inv.quantity > 0) printCount++
                    if ((inv.cardCode.startsWith('LDM-0') || inv.cardCode.startsWith('LDM-1')) && inv.quantity >= 3) ldmCount++
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

                    console.log('neworth i', networth, i)
                    allNetworths.push(networth)
                }

                allNetworths.sort()
                console.log('allNetworths', allNetworths)
                const networkRanking = findIndex(networth) + 1

                console.log('ldmCount', ldmCount)
                if (ldmCount === 200) completeSets.push(`Linked Dimensions ${LDM}`)

                const tradeCount = await Trade.count({
                    where: {
                        [Op.or]: {
                            recipientId: playerId,
                            senderId: playerId
                        }
                    }
                })

                const results = `${scheming} --- Marketplace Stats --- ${scheming}`
                results.push(`Name: ${player.name}`)
                results.push(`Net Worth: ${networth} ${starchips}`)
                results.push(`Ranking: ${networkRanking} out of ${totalPlayers}`)
                results.push(`Prints: ${printCount} out of ${printTotal}`)
                results.push(`Complete Sets: ${completeSets.length ? completeSets.join(',') : 'N/A'}`)
                results.push(`Trades: ${tradeCount} ${robbed}`)
            
                return await interaction.editReply({ content: results.join('\n').toString()})
            } else if (interaction.channelId === arenaChannelId) {
                console.log('arena stats')
            }
        } catch (err) {
            console.log(err)
        }
	}
}