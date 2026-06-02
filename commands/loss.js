
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { ArenaEntry, Info, Player, Wallet } from '../database/index.js'
import { checkArenaProgress } from '../functions/arena.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const { arena } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('loss')
		.setDescription('Report your loss in The Arena! 🤼')
    	.setContexts(InteractionContextType.Guild)
        .addUserOption(option =>
            option
                .setName('opponent')
                .setDescription('Tag your opponent.')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            // if (interaction.channel.id !== '1378129840691220631') return await interaction.reply({ content: `Try using **/arena** in the <#1378129840691220631> channel. ${arena}`})
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
            if (!losingEntry.isPlaying) return await interaction.editReply({ content: `Error: You have already played your Arena match for this round.` })
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

            let chipsWinner = 4
            let chipsLoser = 2
            const winnerIsSupporter = winningMember.roles.cache.has('1488934384827371731') || winningPlayer.forgedSubscriberTier === 'Supporter'
            const winnerIsPatron = winningMember.roles.cache.has('1488935689189068870') || winningPlayer.forgedSubscriberTier === 'Patron'
            const winnerIsBenefactor = winningMember.roles.cache.has('1488936887187013652') || winningMember.roles.cache.has('1488566624536494368') || winningPlayer.forgedSubscriberTier === 'Benefactor'
            const loserIsSupporter = losingMember.roles.cache.has('1488934384827371731') || losingPlayer.forgedSubscriberTier === 'Supporter'
            const loserIsPatron = losingMember.roles.cache.has('1488935689189068870') || losingPlayer.forgedSubscriberTier === 'Patron'
            const loserIsBenefactor = losingMember.roles.cache.has('1488936887187013652') || losingMember.roles.cache.has('1488566624536494368')  || losingPlayer.forgedSubscriberTier === 'Benefactor'
            
            const chipBonusWinner =  winnerIsBenefactor ? 2 :
                winnerIsPatron ? 1.6 :
                loserIsBenefactor ? 1.5 :
                winnerIsSupporter ? 1.3 :
                loserIsPatron ? 1.2 :
                loserIsSupporter ? 1.1 :
                1
            
            const chipBonusLoser =  loserIsBenefactor ? 2 :
                loserIsPatron ? 1.6 :
                loserIsSupporter ? 1.3 :
                1
                
            chipsWinner = Math.round(chipsWinner * chipBonusWinner)
            chipsLoser = Math.round(chipsLoser * chipBonusLoser)
            if (chipsWinner <= chipsLoser) chipsWinner = chipsLoser + 1
            
            const newChipsWinner = winnersWallet.starchips + chipsWinner
            const newChipsLoser = losersWallet.starchips + chipsLoser

            await winnersWallet.update({ starchips: newChipsWinner })
            await losersWallet.update({ starchips: newChipsLoser })

            const content = `${losingPlayer.name} (+${chipsLoser}<:starchips:1488939806053498931>), your Arena ${arena} loss to <@${winningPlayer.discordId}> (+${chipsWinner}<:starchips:1488939806053498931>) has been recorded.`
            await interaction.editReply({ content })
            return checkArenaProgress()
        } catch (err) {
            console.log(err)
        }
    }
}