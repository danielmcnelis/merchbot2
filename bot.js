
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
import { createPlayer, isNewUser } from './functions/utility.js'
import { applyPriceDecay, checkShopShouldBe, getMidnightCountdown, getShopCountdown, openShop, closeShop, checkShopOpen, postBids, updateShop, clearDailies } from './functions/shop.js'

// STATIC IMPORTS
import channels from './static/channels.json' with { type: "json" }
const { staffChannelId, welcomeChannelId } = channels
import { client } from './static/clients.js'
import roles from './static/roles.json' with { type: "json" }
const { modRole } = roles

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
		} else {
			postBids()
		}
	}, 1000 * 60 * 10)

	if (!shopShouldBe) return client.channels.cache.get(staffChannelId).send({ content: `<@&${adminRole}>, The Shop status could not be read from the database.`})
	if (!shopOpen && shopShouldBe === 'open') client.channels.cache.get(staffChannelId).send({ content: `<@&${modRole}>, The Shop is unexpectedly closed. Please use the command **/open** to open The Shop.`})
	if (shopOpen && shopShouldBe === 'closed') client.channels.cache.get(staffChannelId).send({ content: `<@&${modRole}>, The Shop is unexpectedly open. Please use the command **/close** to close The Shop.`})

	if (shopShouldBe === 'closed') {
		return setTimeout(() => openShop(), shopCountdown)
	} else if (shopShouldBe === 'open') {
		return setTimeout(() => closeShop(), shopCountdown)
	}
})

// COMMANDS
client.on(Events.InteractionCreate, async interaction => {
    try {
        if (!interaction.isChatInputCommand()) return
    
        const command = interaction.client.commands.get(interaction.commandName)
        if (!command) return console.error(`No command matching ${interaction.commandName} was found.`)
    
        if (command.data.name === 'card') {
            return command.execute(interaction, fuzzyCards)
        } else {
            return command.execute(interaction)
        }
    } catch (err) {
        console.log(err)
    }
})

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