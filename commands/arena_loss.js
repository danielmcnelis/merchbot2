
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { ArenaEntry, Player, Wallet } from '../database/index.js'
import { checkArenaProgress } from '../functions/arena.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const { arena } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('arena_loss')
		.setDescription('Report your loss in The Arena! 🤼‍♂️')
    	.setContexts(InteractionContextType.Guild)
        .addUserOption(option =>
            option
                .setName('opponent')
                .setDescription('Tag your opponent.')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            if (interaction.channel.id !== '1378129840691220631') return await interaction.reply({ content: `Try using **/arena** in the <#1378129840691220631> channel. ${arena}`})
            await interaction.deferReply()
            const winningUser = interaction.options.getUser('opponent')
            const winningMember = await interaction.guild?.members.fetch(winningUser.id).catch((err) => console.log(err))
            const losingMember = interaction.member
            const winningPlayer = await Player.findOne({ where: { discordId: winningUser.id } })
            const losingPlayer = await Player.findOne({ where: { discordId: interaction.user.id } })
            const winnersWallet = await Wallet.findOne({ where: { playerId: winningPlayer.id }})
            const losersWallet = await Wallet.findOne({ where: { playerId: losingPlayer.id }})
            const winningEntry = await ArenaEntry.findOne({ where: { playerId: winningPlayer.id }})
            const losingEntry = await ArenaEntry.findOne({ where: { playerId: losingPlayer.id }})
                
            const P1 = await ArenaEntry.findOne({ where: { contestant: "P1" }, include: Player})
            const P2 = await ArenaEntry.findOne({ where: { contestant: "P2" }, include: Player})
            const P3 = await ArenaEntry.findOne({ where: { contestant: "P3" }, include: Player})
            const P4 = await ArenaEntry.findOne({ where: { contestant: "P4" }, include: Player})
            const P5 = await ArenaEntry.findOne({ where: { contestant: "P5" }, include: Player})
            const P6 = await ArenaEntry.findOne({ where: { contestant: "P6" }, include: Player})
        
            if (!P1 || !P2 || !P3 || !P4 || !P5 || !P6) return channel.send({ content: `Critical error. Missing contestant in the database.`})
                
            let correctPairing = false

            const pairingMatrices = info.round === 1 ? [[P1, P2], [P3, P4], [P5, P6]] :
                info.round === 2 ? [[P1, P6], [P2, P3], [P4, P5]] :
                info.round === 3 ? [[P1, P5], [P2, P4], [P3, P6]] :
                info.round === 4 ? [[P1, P4], [P2, P6], [P3, P5]] :
                info.round === 5 ? [[P1, P3], [P2, P5], [P4, P6]] : 
                null

            for (let i = 0; i < pairingMatrices.length; i++) {
                const pairingMatrix = pairingMatrices[i]
                for (let j = 0; j < pairingMatrix.length; j++) {
                    const pairing = pairingMatrix[j]
                    if (
                        (pairing[0].playerId === winningPlayer.id && pairing[1].playerId === losingPlayer.id) ||
                        (pairing[0].playerId === losingPlayer.id && pairing[1].playerId === winningPlayer.id)
                    ) {
                        correctPairing = true
                        break
                    }
                }
            }

            if (!correctPairing) return interaction.editReply({ content: `Sorry, ${winningPlayer.name} is not your Arena opponent.`})

            const newScore = winningEntry.score + 1
            await winningEntry.update({ score: newScore, isPlaying: false })
            await losingEntry.update({ isPlaying: false })

            const winnerNewChips = winnersWallet.starchips + 4
            const loserNewChips = losersWallet.starchips + 2
            await winnersWallet.update({ starchips: winnerNewChips })
            await losersWallet.update({ starchips: loserNewChips })

            const content = `${losingPlayer.name} (+2$<:starchips:1374362231109718117>), your Arena ${arena} loss to <@${winningPlayer.discordId}> (+4<:starchips:1374362231109718117>) has been recorded.`
            await interaction.editReply({ content })
            return checkArenaProgress()
        } catch (err) {
            console.log(err)
        }
    }
}