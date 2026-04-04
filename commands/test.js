
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, SlashCommandBuilder } from 'discord.js'
// import { purgeDuplicatePrices, updateMinMedMaxRarities, assignSeasonalLadderRoles, downloadOriginalArtworks, purgeBetaCards, downloadMissingCardImages, recalculateStats, downloadNewCards, lookForAllPotentialPairs, cleanUpPools, manageSubscriptions, updateGlobalNames, updateMarketPrices, conductCensus, calculateStandings, updateAvatars, updateDeckThumbs, updateDeckType, updateDecks, updateBlogPosts, isProgrammer, runMonthlyTasks, runNightlyTasks, updateServers, runFrequentTasks } from '@fl/bot-functions'
// import { emojis } from '@fl/bot-emojis'
// import { client } from '../client'
// import { s3FileExists } from '@fl/bot-functions'
// import { Match, Tournament, Server, TriviaQuestion } from '@fl/models'
import { ArenaProfile, Binder, Card, ForgedInventory, Wishlist, Player, ForgedPrint, ForgedSet, ArenaEntry } from '../database/index.js'
import { Op } from 'sequelize'
import {isProgrammer} from '../functions/utility.js'
import {applyPriceDecay} from '../functions/shop.js'
import {startRound, postStandings} from '../functions/arena.js'
import {awardPromosToShop} from '../functions/packs.js'
// import axios from 'axios'
// import { assignTournamentRoles, recalculateAllStats } from '../../../bot-functions/src'
// import { Stats } from '../../../models/src'
// import { config } from '@fl/config'

export const calcBoxPrice = async () => {
    const sets = await ForgedSet.findAll({ where: {
        //  currency: 'stardust',
         forSale: true,
         type: {[Op.or]: ['core', 'mini']}
    } })

    if(!sets.length) return	

    for (let i = 0; i < sets.length; i++) {
        const set = sets[i]
        const setCode = set.code

        if (set.type === 'core' || set.type === 'mini') {
            const commons = [...await ForgedPrint.findAll({ where: { forgedSetCode: setCode, rarity: "com" } })].map((p) => Math.round(p.marketPrice) || 1)
            const rares = [...await ForgedPrint.findAll({ where: { forgedSetCode: setCode, rarity: "rar" } })].map((p) => Math.round(p.marketPrice) || 1)
            const supers = [...await ForgedPrint.findAll({ where: { forgedSetCode: setCode, rarity: "sup" } })].filter((p) => !p.cardCode.includes('-SE')).map((p) => Math.round(p.marketPrice) || 1)
            const ultras = [...await ForgedPrint.findAll({ where: { forgedSetCode: setCode, rarity: "ult" } })].map((p) => Math.round(p.marketPrice) || 1)
            const secrets = [...await ForgedPrint.findAll({ where: { forgedSetCode: setCode, rarity: "scr" } })].map((p) => Math.round(p.marketPrice) || 1)
            
            const avgComPrice = commons.length ? commons.reduce((a, b) => a + b) / commons.length : 0
            console.log('avgComPrice', avgComPrice)
            const avgRarPrice = rares.length ? rares.reduce((a, b) => a + b) / rares.length : 0
            console.log('avgRarPrice', avgRarPrice)
            const avgSupPrice = supers.length ? supers.reduce((a, b) => a + b) / supers.length : 0
            console.log('avgSupPrice', avgSupPrice)
            const avgUltPrice = ultras.length ? ultras.reduce((a, b) => a + b) / ultras.length : 0
            console.log('avgUltPrice', avgUltPrice)
            const avgScrPrice = secrets.length ? secrets.reduce((a, b) => a + b) / secrets.length : 0
            console.log('avgScrPrice', avgScrPrice)
            const avgBoxPrice = (avgComPrice * set.commonsPerBox) 
                + (avgRarPrice * set.raresPerBox)
                + (avgSupPrice * set.supersPerBox)
                + (avgUltPrice * set.ultrasPerBox)
                + (avgScrPrice * set.secretsPerBox)
            console.log('avgBoxPrice', avgBoxPrice)

            const avgPackPrice = avgBoxPrice / set.packsPerBox
            const unitPrice = Math.round(avgPackPrice / 10) * 10
            const boxPrice = unitPrice < 150 ? Math.round(24 * unitPrice / 100) * 100 : 3600
            console.log(`${set.name} avgPackPrice: ${avgPackPrice}, unitPrice: ${unitPrice}, boxPrice: ${boxPrice}`)
        }
    }
}

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Admin Only - Performs a test. 🧪')
    	.setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        try {
            await interaction.deferReply()
            if (isProgrammer(interaction.member)) {
                // const invs = await ForgedInventory.findAll({ 
                //     order: [['playerName', 'ASC'], ['cardCode', 'ASC']]
                // })

                // for (let i = 0; i < invs.length; i++) {
                //     const inv = invs[i]
                //     const card = await Card.findOne({
                //         where: {
                //             name: inv.cardName
                //         }
                //     })

                //     if (card) await inv.update({ cardId: card.id })
                // }

                await awardPromosToShop()

                // const entries = await ArenaEntry.findAll({ order: [['score', 'DESC']], include: Player })

                // await postStandings(entries)

                // await applyPriceDecay()

                await interaction.editReply('🧪')
            }
        } catch (err) {
            console.log(err)
        }
    }
}