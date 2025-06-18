

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, SlashCommandBuilder } from 'discord.js'
// import { purgeDuplicatePrices, updateMinMedMaxRarities, assignSeasonalLadderRoles, downloadOriginalArtworks, purgeBetaCards, downloadMissingCardImages, recalculateStats, downloadNewCards, lookForAllPotentialPairs, cleanUpPools, manageSubscriptions, updateGlobalNames, updateMarketPrices, conductCensus, calculateStandings, updateAvatars, updateDeckThumbs, updateDeckType, updateDecks, updateBlogPosts, isProgrammer, runMonthlyTasks, runNightlyTasks, updateServers, runFrequentTasks } from '@fl/bot-functions'
// import { emojis } from '@fl/bot-emojis'
// import { client } from '../client'
// import { s3FileExists } from '@fl/bot-functions'
// import { Match, Tournament, Server, TriviaQuestion } from '@fl/models'
import { ArenaProfile, Binder, Card, ForgedInventory, ForgedPrint, Status, Tournament, Wishlist } from '../database/index.js'
import { Op } from 'sequelize'
import {isProgrammer} from '../functions/utility.js'
import {applyPriceDecay} from '../functions/shop.js'
// import axios from 'axios'
// import { assignTournamentRoles, recalculateAllStats } from '../../../bot-functions/src'
// import { Stats } from '../../../models/src'
// import { config } from '@fl/config'

// GET FORGED ISSUES
export const getForgedIssues = async (player, deckArr, format) => {
    const deck = convertArrayToObject(deckArr)   
    const cardIds = [...await ForgedPrint.findAll({ include: Card })].flatMap(fp => [fp.card.konamiCode, fp.card.ypdId])
    const forbiddenIds = [...await Status.findAll({ where: { banlist: format.banlist, category: 'Forged', restriction: 'forbidden' }, include: Card })].flatMap(s => [s.card.konamiCode, s.card.ydpId])
    const limitedIds = [...await Status.findAll({ where: { banlist: format.banlist, category: 'Forged', restriction: 'limited' }, include: Card })].flatMap(s => [s.card.konamiCode, s.card.ydpId])
    const semiIds = [...await Status.findAll({ where: { banlist: format.banlist, category: 'Forged', restriction: 'semi-limited' }, include: Card })].flatMap(s => [s.card.konamiCode, s.card.ydpId])
    
    const illegalCards = []
    const forbiddenCards = []
    const limitedCards = []
    const semiLimitedCards = []
    const unrecognizedCards = []

    const totalQuantities = {}

    const keys = Object.keys(deck)
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        let konamiCode = keys[i]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode 
        if (konamiCode === '00000000' && format.name === 'Advanced') continue
        const card = await Card.findOne({ where: { [Op.or]: { konamiCode: konamiCode, ypdId: konamiCode } } })

        totalQuantities[card.name] = deck[key]

        if (!cardIds.includes(konamiCode)) {
            if (card) {
                illegalCards.push(card.name)
            } else {
                unrecognizedCards.push(konamiCode)
            }
        } else if (forbiddenIds.includes(konamiCode)) {
            if (card) forbiddenCards.push(card.name)
        } else if ((format.isHighlander || limitedIds.includes(konamiCode)) && deck[key] > 1) {
            if (card) limitedCards.push(card.name)
        } else if (semiIds.includes(konamiCode) && deck[key] > 2) {
            if (card) semiLimitedCards.push(card.name)
        }
    }

    const quantityKeys = Object.keys(totalQuantities)
    const zeroCopiesOwned = []
    const oneCopyOwned = []
    const twoCopiesOwned = []

    for (let i = 0; i < quantityKeys.length; i++) {
        const quantityKey = quantityKeys[i]
        let quantityOwned = 0

        const invs = await ForgedInventory.findAll({
            where: {
                playerId: player.id,
                cardName: quantityKey
            }
        })

        for (let j = 0; j < invs.length; j++) {
            const inv = invs[j]
            quantityOwned+=inv.quantity
        }

        if (quantityOwned < totalQuantities[quantityKey]) {
            if (quantityOwned === 0 && !illegalCards.includes(quantityKey)) {
                zeroCopiesOwned.push(quantityKey)
            } else if (quantityOwned === 1) {
                oneCopyOwned.push(quantityKey)
            } else if (quantityOwned === 2) {
                twoCopiesOwned.push(quantityKey)
            }
        }
    }
    
    illegalCards.sort()
    forbiddenCards.sort()
    limitedCards.sort()
    semiLimitedCards.sort()
    unrecognizedCards.sort()
    zeroCopiesOwned.sort()
    oneCopyOwned.sort()
    twoCopiesOwned.sort()

    const issues = {
        illegalCards,
        forbiddenCards,
        limitedCards,
        semiLimitedCards,
        unrecognizedCards,
        zeroCopiesOwned,
        oneCopyOwned,
        twoCopiesOwned
    }

    return issues
}

export default {
    data: new SlashCommandBuilder()
        .setName('deckchecks')
        .setDescription('Admin Only - Check tournament decks. 🧪')
        .addNumberOption(option =>
            option
                .setName('tournament')
                .setDescription('Which tournament do you wish to check?')
                .setAutocomplete(true)
                .setRequired(true)
        )
    	.setContexts(InteractionContextType.Guild),
        async autocomplete(interaction) {
            try {
                const focusedValue = interaction.options.getFocused()

                const tournaments = await Tournament.findAll({
                    where: {
                        formatName: 'Forged in Chaos',
                        [Op.or]: {
                            name: {[Op.iLike]: `${focusedValue}%`},
                        }
                    },
                    limit: 5,
                    order: [["createdAt", "DESC"]]
                })

                await interaction.respond(
                    tournaments.map(t => ({ name: `${t.name}`, value: t.id })),
                )
            } catch (err) {
                console.log(err)
            }
        },
    async execute(interaction) {
        try {
            await interaction.deferReply()
            if (isProgrammer(interaction.member)) {
                const tournamentId = interaction.options.getNumber('tournament')
                const entries = await Entry.findAll({ where: { tournamentId }, include: Player, order: [['playerName', 'ASC']]})
                for (let i = 0; i < entries.length; i++) {
                    const entry = entries[i]
                    const ydk = entry.ydk

                    const main = ydk.split('#main')[1].split('#extra')[0].split(/[\s]+/).map((e) => e.replace(/\D/g,'')).filter((e) => e.length)
                    const extra = ydk.split('#extra')[1].split('!side')[0].split(/[\s]+/).map((e) => e.replace(/\D/g,'')).filter((e) => e.length)
                    const side = ydk.split('!side')[1].split(/[\s]+/).map((e) => e.replace(/\D/g,'')).filter((e) => e.length)    

                    const deckArr = [...main, ...extra, ...side,]
                    const issues = await getForgedIssues(player, deckArr, format)
        
                    const { zeroCopiesOwned, oneCopyOwned, twoCopiesOwned } = issues
                    
                    if (zeroCopiesOwned?.length || oneCopyOwned?.length || twoCopiesOwned?.length) {
                        await interaction.channel.send({ content: `High Alert: <@${entry.player.discordId}> does not own every card in their deck.`}).catch((err) => console.log(err))
                    } else {
                        await interaction.channel.send({ content: `${entry.player} owns all the cards in their deck.`}).catch((err) => console.log(err))
                    } 
                }

                await interaction.editReply('🧪')
            }
        } catch (err) {
            console.log(err)
        }
    }
}
