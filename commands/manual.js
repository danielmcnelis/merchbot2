
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { ArenaEntry, Info, Player, Wallet } from '../database/index.js'
import { checkArenaProgress } from '../functions/arena.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const { arena } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('manual')
		.setDescription(`Mod Only - Manually report an Arena match result! 🔧`)
    	.setContexts(InteractionContextType.Guild)
        .addUserOption(option =>
            option
                .setName('winner')
                .setDescription('Tag the user who won.')
                .setRequired(true))
        .addUserOption(option =>
            option
                .setName('loser')
                .setDescription('Tag the user who lost.')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            if (interaction.channel.id !== '1378129840691220631') return await interaction.reply({ content: `Try using **/arena** in the <#1378129840691220631> channel. ${arena}`})
            await interaction.deferReply()
            const winningUser = interaction.options.getUser('winner')            
            const losingUser = interaction.options.getUser('loser')
            const winningPlayer = await Player.findOne({ where: { discordId: winningUser.id } })
            const losingPlayer = await Player.findOne({ where: { discordId: losingUser.id } })
            const winnersWallet = await Wallet.findOne({ where: { playerId: winningPlayer.id }})
            const losersWallet = await Wallet.findOne({ where: { playerId: losingPlayer.id }})
            const winningEntry = await ArenaEntry.findOne({ where: { playerId: winningPlayer.id }})
            const losingEntry = await ArenaEntry.findOne({ where: { playerId: losingPlayer.id }})
            if (!losingEntry.isPlaying) return await interaction.editReply({ content: `Error: ${losingPlayer.name} has already played your Arena match for this round.` })
            if (!winningEntry.isPlaying) return await interaction.editReply({ content: `Error: ${winningPlayer.name} has already played their Arena match for this round.` })
                
            const P1 = await ArenaEntry.findOne({ where: { contestant: "P1" }, include: Player})
            const P2 = await ArenaEntry.findOne({ where: { contestant: "P2" }, include: Player})
            const P3 = await ArenaEntry.findOne({ where: { contestant: "P3" }, include: Player})
            const P4 = await ArenaEntry.findOne({ where: { contestant: "P4" }, include: Player})
            const P5 = await ArenaEntry.findOne({ where: { contestant: "P5" }, include: Player})
            const P6 = await ArenaEntry.findOne({ where: { contestant: "P6" }, include: Player})
        
            if (!P1 || !P2 || !P3 || !P4 || !P5 || !P6) return channel.send({ content: `Critical error. Missing contestant in the database.`})
                
            let correctPairing = false

            const info = await Info.findOne({ where: { element: 'arena' }})

            const pairings = info.round === 1 ? [[P1, P2], [P3, P4], [P5, P6]] :
                info.round === 2 ? [[P1, P6], [P2, P3], [P4, P5]] :
                info.round === 3 ? [[P1, P5], [P2, P4], [P3, P6]] :
                info.round === 4 ? [[P1, P4], [P2, P6], [P3, P5]] :
                info.round === 5 ? [[P1, P3], [P2, P5], [P4, P6]] : 
                null

            if (pairings && info.round <= 5) {
                for (let j = 0; j < pairings.length; j++) {
                    const pairing = pairings[j]
                    if (
                        (pairing[0].playerId === winningPlayer.id && pairing[1].playerId === losingPlayer.id) ||
                        (pairing[0].playerId === losingPlayer.id && pairing[1].playerId === winningPlayer.id)
                    ) {
                        correctPairing = true
                        break
                    }
                }
    
                if (!correctPairing) return interaction.editReply({ content: `Sorry, ${winningPlayer.name} and ${losingPlayer.name} are not Arena opponents.`})
            }
        
            const newScore = winningEntry.score + 1
            await winningEntry.update({ score: newScore, isPlaying: false })
            await losingEntry.update({ isPlaying: false })

            const winnerNewChips = winnersWallet.starchips + 7
            const loserNewChips = losersWallet.starchips + 4
            await winnersWallet.update({ starchips: winnerNewChips })
            await losersWallet.update({ starchips: loserNewChips })

            const content = `A manual Arena ${arena} loss by <@${losingPlayer.discordId}> (+4<:starchips:1374362231109718117>)  to <@${winningPlayer.discordId}> (+7<:starchips:1374362231109718117>) has been recorded.`
            await interaction.editReply({ content })
            return checkArenaProgress()
        } catch (err) {
            console.log(err)
        }
    }
}