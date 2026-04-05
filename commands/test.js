
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
                const coreSets = await ForgedSet.findAll({ 
                    where: { 
                        type: 'core',
                        forSale: true
                    },
                    order: [['createdAt', 'DESC']]
                })
    
                const coc = await ForgedSet.findOne({ 
                    where: { 
                        code: 'COC',
                        type: 'core',
                        forSale: true
                    }
                })
    
                const set = coreSets[0]
                if (!set) return interaction.editReply({ content: `No core set found.`})
    
                // const commons = [...await ForgedPrint.findAll({ 
                //     where: {
                //         forgedSetId: set.id,
                //         rarity: "com"
                //     },
                //     order: [['cardSlot', 'ASC']]
                // })].map((p) => p.cardCode)
    
                const rares = [...await ForgedPrint.findAll({ 
                    where: {
                        forgedSetId: set.id,
                        rarity: "rar"
                    },
                    order: [['cardSlot', 'ASC']]
                })].map((p) => p.cardCode)
    
                const supers = [...await ForgedPrint.findAll({ 
                    where: {
                        forgedSetId: set.id,
                        rarity: "sup"
                    },
                    order: [['cardSlot', 'ASC']]
                })].filter((p) => !p.cardCode.includes('-SE')).map((p) => p.cardCode)
    
                const ultras = [...await ForgedPrint.findAll({ 
                    where: {
                        forgedSetId: set.id,
                        rarity: "ult"
                    },
                    order: [['cardSlot', 'ASC']]
                })].map((p) => p.cardCode)
    
                const secrets = [...await ForgedPrint.findAll({ 
                    where: {
                        forgedSetId: set.id,
                        rarity: "scr"
                    },
                    order: [['cardSlot', 'ASC']]
                })].map((p) => p.cardCode)
                
                const odds = []
                // for (let i = 0; i < set.commonsPerBox; i++) odds.push("commons")
                for (let i = 0; i < set.raresPerBox; i++) odds.push("rares")
                for (let i = 0; i < set.supersPerBox; i++) odds.push("supers")
                for (let i = 0; i < set.ultrasPerBox; i++) odds.push("ultras")
                for (let i = 0; i < set.secretsPerBox; i++) odds.push("secrets")
    

                for (let i = 0; i < 1000; i++) {
                    const luck = getRandomElement(odds)
                    const yourCard = getRandomElement(eval(luck))

                    const print = await ForgedPrint.findOne({ where: {
                        cardCode: yourCard
                    }})

                    console.log(`(${print.rarity}) ${print.cardCode} - ${print.cardName}`)
                }

                // await awardPromosToShop()
                await interaction.editReply('🧪')
            }
        } catch (err) {
            console.log(err)
        }
    }
}