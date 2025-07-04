
// PACKAGES
// import axios from 'axios'
// import Canvas from 'canvas'
// import Discord from 'discord.js'
// import fs from 'fs'
import FuzzySet from 'fuzzyset'
import { Collection, Events } from 'discord.js'
// const { exec, execFile, execFileSync, spawn } = require('child_process')

// USEFUL CONSTANTS
const fuzzyCards = FuzzySet([], false)
const fuzzyPrints = FuzzySet([], false)
// const merchbotId = '584215266586525696'

// DATABASE IMPORTS
import { Auction, Bid, Binder, Card, Daily, Entry, Info, ForgedInventory, Match, Player, Pool, ForgedPrint, ForgedSet, Tournament, Trade, Wallet, Wishlist, Status } from './database/index.js'
import { Op } from 'sequelize'

// FUNCTION IMPORTS
import { fetchAllCardNames, fetchAllUniquePrintNames } from './functions/search.js'
import { createPlayer, isNewUser, runFrequentTasks } from './functions/utility.js'
import { awardPacks } from './functions/packs.js'
import { applyPriceDecay, checkShopShouldBe, getMidnightCountdown, getShopCountdown, openShop, closeShop, checkShopOpen, postBids, updateShop, clearDailies } from './functions/shop.js'

// STATIC IMPORTS
import channels from './static/channels.json' with { type: "json" }
const { staffChannelId, welcomeChannelId } = channels
import { client } from './static/clients.js'
import roles from './static/roles.json' with { type: "json" }
const { modRole, adminRole } = roles

import commands from './commands/index.js'
client.commands = new Collection()
Object.values(commands.globalCommands).forEach((command) => client.commands.set(command.data.name, command))


//READY
client.on('ready', async () => {
	console.log('MerchBot is online!')
	const allCards = await fetchAllCardNames()
    allCards.forEach((card) => fuzzyCards.add(card))
	const allUniquePrints = await fetchAllUniquePrintNames()
    allUniquePrints.forEach((card) => fuzzyPrints.add(card))

	const midnightCountdown = getMidnightCountdown()
	// const midnightCountdown = -10000
	// setTimeout(() => clearDailies(), midnightCountdown)
	setTimeout(() => applyPriceDecay(), midnightCountdown + 10000)
	
    try {
        // RUN FREQUENT TASKS
        setTimeout(() => runFrequentTasks(client), 10 * 60 * 1000)
    } catch (err) {
        console.log(err)
    }

	const shopShouldBe = checkShopShouldBe()
	const shopCountdown = getShopCountdown()
	const shopOpen = await checkShopOpen()

	if (shopOpen) {
		updateShop()
	} else {
		postBids()
	}

	setInterval(async () =>  {
		const shopOpen = await checkShopOpen()
		if (shopOpen) {
			updateShop()
		}
	}, 1000 * 60 * 5)

	if (!shopShouldBe) return client.channels.cache.get(staffChannelId).send({ content: `<@&${adminRole}>, The Shop status could not be read from the database.`})
	if (!shopOpen && shopShouldBe === 'open') client.channels.cache.get(staffChannelId).send({ content: `<@&${adminRole}>, The Shop is unexpectedly closed. Please use the command **/open** to open The Shop.`})
	if (shopOpen && shopShouldBe === 'closed') client.channels.cache.get(staffChannelId).send({ content: `<@&${adminRole}>, The Shop is unexpectedly open. Please use the command **/close** to close The Shop.`})

	if (shopShouldBe === 'closed') {
		setTimeout(() => openShop(), shopCountdown)
	} else if (shopShouldBe === 'open') {
		setTimeout(() => closeShop(), shopCountdown)
	}

    // CHECK DAILY RATE LIMITER
    const daily = await Daily.findOne({ where: {
        isProcessing: true
    }})

    if (daily) {
        await daily.update({ isProcessing: false })
        const programmer = await client.users.fetch('194147938786738176')
        await programmer.send({ content: `${daily.playerName}'s daily (cobble progress ${daily.cobbleProgress}) was interrupted.` })
    }
})

// SUBSCRIPTION
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    try {
        if (oldMember.guild.id !== '1372580468297568458') return
        const oldRoles = oldMember.roles.cache
        const newRoles = newMember.roles.cache
    
        const wasSubscriber = oldRoles.has('1375131866847252544')
        const isSubscriber = newRoles.has('1375131866847252544')
        const hadForgedFlamethrowers = oldRoles.has('1390711044879421611')
        const gotForgedFlamethrowers = newRoles.has('1390711044879421611')

        if (!hadForgedFlamethrowers && gotForgedFlamethrowers) {
            const set = await ForgedSet.findOne({
                where: {
                    type: 'core',
                    forSale: true,
                },
                order: [['createdAt', 'DESC']]
            })

            const guild = client.guilds.cache.get('1372580468297568458')
            const channel = guild.channels.cache.get('1372580469039693976')
            awardPacks(channel, newMember, set, 3)
        }
    
        if (wasSubscriber && !isSubscriber) {
            const programmer = await client.users.fetch('194147938786738176')
                        
            const player = await Player.findOne({
                where: {
                    discordId: oldMember.id
                }
            })
    
            const subscriberTier = player.forgedSubscriberTier
            await player.update({ isForgedSubscriber: false, forgedSubscriberTier: null })
            return await programmer.send({ content: `${oldMember.user?.username} is no longer a Subscriber (${subscriberTier}).` })
        } else if (!wasSubscriber && isSubscriber) {
            const programmer = await client.users.fetch('194147938786738176')
            
            const player = await Player.findOne({
                where: {
                    discordId: oldMember.id
                }
            })
    
            const isSupporter = newRoles.has('1375131869036810302')
            const isPatron = newRoles.has('1375132712070811689')
            const isBenefactor = newRoles.has('1375133829521608784')
            
            if (isSupporter) {
                await player.update({ isForgedSubscriber: true, forgedSubscriberTier: 'Supporter' })
                console.log(`Welcome ${oldMember.user?.username} to the Supporter Tier!`)
                return await programmer.send({ content: `Welcome ${oldMember.user?.username} to the Supporter Tier!` })
            } else if (isPatron) {
                await player.update({ isForgedSubscriber: true, forgedSubscriberTier: 'Patron' })
                console.log(`Welcome ${oldMember.user?.username} to the Patron Tier!`)
                return await programmer.send({ content: `Welcome ${oldMember.user?.username} to the Premium Tier!` })
            } else if (isBenefactor) {
                await player.update({ isForgedSubscriber: true, forgedSubscriberTier: 'Benefactor' })
                console.log(`Welcome ${oldMember.user?.username} to the Benefactor Tier!`)
                return await programmer.send({ content: `Welcome ${oldMember.user?.username} to the Benefactor Tier!` })
            } else {
                await player.update({ isForgedSubscriber: true, forgedSubscriberTier: 'Unknown' })
                console.log(`Welcome ${oldMember.user?.username} to the Subscribers(?)!`)
                return await programmer.send({ content: `Welcome ${oldMember.user?.username} to the Subscribers(?)!` })
            }
        }
    } catch (err) {
        console.log(err)
    }
});

try {
    // COMMANDS
    client.on(Events.InteractionCreate, async interaction => {
        try {
            if (!interaction.isChatInputCommand()) return
        
            const command = interaction.client.commands.get(interaction.commandName)
            if (!command) return console.error(`No command matching ${interaction.commandName} was found.`)                
            
            return command.execute(interaction).catch((err) => console.log(err))
        } catch (err) {
            console.log(err)
        }
    })
} catch (err) {
    console.log(err)
}

try {
    // AUTO COMPLETE
    client.on(Events.InteractionCreate, async (interaction) => {
        try {
            if (!interaction.isAutocomplete()) return

            const command = interaction.client.commands.get(interaction.commandName)
            if (!command) return console.error(`No command matching ${interaction.commandName} was found.`)
        
            return command.autocomplete(interaction)
        } catch (err) {
            console.log(err)
        }
    })
} catch (err) {
    console.log(err)
}

// BUTTON SUBMIT
// client.on(Events.InteractionCreate, async (interaction) => {
//     try {
//         if (!interaction.isButton()) return

//         if (interaction.message?.content?.includes('is valued at')) {
//             await interaction.update({ components: [] }).catch((err) => console.log(err))
//             const customId = interaction.customId
//             const isConfirmed = customId.charAt(0) === 'Y'
//             const entryId = customId.slice(1)
//             return handleTriviaConfirmation(interaction, entryId, isConfirmed)
//         }
//     } catch (err) {
//         console.log(err)
//     }
// })