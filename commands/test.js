
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, SlashCommandBuilder } from 'discord.js'
// import { purgeDuplicatePrices, updateMinMedMaxRarities, assignSeasonalLadderRoles, downloadOriginalArtworks, purgeBetaCards, downloadMissingCardImages, recalculateStats, downloadNewCards, lookForAllPotentialPairs, cleanUpPools, manageSubscriptions, updateGlobalNames, updateMarketPrices, conductCensus, calculateStandings, updateAvatars, updateDeckThumbs, updateDeckType, updateDecks, updateBlogPosts, isProgrammer, runMonthlyTasks, runNightlyTasks, updateServers, runFrequentTasks } from '@fl/bot-functions'
// import { emojis } from '@fl/bot-emojis'
// import { client } from '../client'
// import { s3FileExists } from '@fl/bot-functions'
// import { Match, Tournament, Server, TriviaQuestion } from '@fl/models'
import { Binder, Wishlist } from '../database/index.js'
import {isProgrammer} from '../functions/utility.js'
// import axios from 'axios'
// import { assignTournamentRoles, recalculateAllStats } from '../../../bot-functions/src'
// import { Stats } from '../../../models/src'
// import { config } from '@fl/config'

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Admin Only - Performs a test. 🧪')
    	.setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        try {
            await interaction.deferReply()
            if (isProgrammer(interaction.member)) {
                await interaction.editReply('🧪 🧪 🧪')
                const binders = await Binder.findAll({})
                for (let i = 0; i < binders.length; i++) {
                    const binder = binders[i]
                    await binder.update({ quantity: 1 })
                }

                const wishlists = await Wishlist.findAll({})
                for (let i = 0; i < wishlists.length; i++) {
                    const wishlist = wishlists[i]
                    await wishlist.update({ quantity: 1 })
                }
            } else {
                await interaction.editReply('🧪')
            }
        } catch (err) {
            console.log(err)
        }
    }
}