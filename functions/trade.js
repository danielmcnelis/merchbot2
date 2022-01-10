

//TRADE FUNCTIONS
const { Inventory, Player, Set, Trade, Print, Wallet } = require('../db')
const { Op } = require('sequelize')
const { yescom, nocom } = require('../static/commands.json')
const { starchips, stardust, com, rar, sup, ult, scr, skull, familiar, battery, egg, cactus, hook, moai, mushroom, rose, orb, gem, swords } = require('../static/emojis.json')
const { findCard } = require('./search.js')
const { updateBinder } = require('./binder.js')
const { selectPrint } = require('./print.js')
const { capitalize } = require('./utility.js')
const { completeTask } = require('./diary')
const merchbotId = '584215266586525696'

//GET INITIATOR CONFIRMATION
const getInitiatorConfirmation = async (message, cards, player) => {
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send({ content: cards.length > 1 ? `Are you sure you want to trade the following to ${player.name}?\n${cards.join("\n")}` : `Are you sure you want to trade ${cards[0]} to ${player.name}?`})
	const collector = msg.channel.createMessageCollector({ filter,
		max: 1,
		time: 15000
	})

	collector.on('collect', async (collected) => {
		if (!yescom.includes(collected.content.toLowerCase())) return false		
		else return true
	})
    
    collector.on('end', () => {
		message.channel.send({ content: `Sorry, time's up.`})
        return false
	})

    return collector
}


//GET RECEIVER SIDE
const getReceiverSide = async (message, cards, player) => {
    const filter = m => m.author.id === player.id
	const msg = await message.channel.send({ content: `${player.name}, you are you being offered:\n${cards.join("\n")}\n\nWhat do you wish to trade in return?`})
	const collector = msg.channel.createMessageCollector({ filter,
		max: 1,
		time: 60000
	})
	
	collector.on('collect', collected => {
		if (collected.content.startsWith('!')) {
			message.channel.send({ content: `Please do not respond with bot commands. Simply type what you would like to trade.`})
			return false
		} else {
			return collector.first().content.split(';')
		}
	})
    
    collector.on('end', () => {
		message.channel.send({ content: `Sorry, time's up.`})
        return false
	})

    return collector
}


//GET RECEIVER CONFIRMATION
const getReceiverConfirmation = async (message, cards, player) => {
    const filter = m => m.author.id === player.id
	const msg = await message.channel.send({ content: cards.length > 1 ? `Are you sure you want to trade the following to ${message.author.username}?\n${cards.join("\n")}` : `Are you sure you want to trade ${cards[0]} to ${message.author.username}?`})
	const collector = msg.channel.createMessageCollector({ filter,
		max: 1,
		time: 15000
	})

	collector.on('collect', async (collected) => {
		if (!yescom.includes(collected.content.toLowerCase())) {
			message.channel.send({ content: `No problem. Have a nice day.`})
			return false
		} else {
			return true
		}
	})
    
    collector.on('end', () => {
		message.channel.send({ content: `Time's up.`})
        return false
	})

    return collector
}

//GET FINAL CONFIRMATION
const getFinalConfirmation = async (message, cards, player) => {
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send({ content: `${player.name}, you will receive:\n${cards.join("\n")}\n\nDo you accept this trade?`})
	const collector = msg.channel.createMessageCollector({ filter,
		max: 1,
		time: 15000
	})

	collector.on('collect', async (collected) => {
		const response = collected.content.toLowerCase()
		if (!yescom.includes(response)) {
			message.channel.send({ content: `No problem. Have a nice day.`})
			return false
		} else {
			return true
		}
	})
    
    collector.on('end', () => {
		message.channel.send({ content: `Time's up.`})
        return false
	})

    return collector
}

//GET TRADE SUMMARY
const getTradeSummary = async (message, inputs, player, fuzzyPrints) => {
	const wallet = player.wallet
	const printQuantities = []
	const walletQuantities = []
	const cards = []
	const prints = []
	const walletFields = []
	const invs = []
	
	for (let i = 0; i < inputs.length; i++) {
		const input = inputs[i]
		const args = input.split(' ').filter((el) => el !== '')
		if (!args.length) continue
		const quantity = isFinite(args[0]) ? parseInt(args[0]) : 1
		if (quantity < 1) {
			message.channel.send({ content: `Sorry, ${quantity} is not a valid quantity.`})
			return false
		} 
		const query = isFinite(args[0]) ? args.slice(1).join(' ') : args.join(' ')

		if (!query) {
			message.channel.send({ content: `Please specify the card(s) you wish to trade.`})
			return false
		}

		let walletField
		if (query === 'd' || query === 'sd' || query === 'stardust' || query === 'dust' ) walletField = 'stardust'
		if (query === 'cactus' || query === 'cactuses' || query === 'cacti') walletField = 'cactus'
		if (query === 'egg' || query === 'eggs') walletField = 'egg'
		if (query === 'hook' || query === 'hooks') walletField = 'hook'
		if (query === 'moai' || query === 'moais' ) walletField = 'moai'
		if (query === 'mushroom' || query === 'mushrooms') walletField = 'mushroom'
		if (query === 'rose' || query === 'roses' ) walletField = 'rose'
		if (query === 'sword' || query === 'swords' ) walletField = 'swords'
		if (query === 'orb' || query === 'orbs' ) walletField = 'orb'
		if (query === 'gem' || query === 'gems' ) walletField = 'gem'
		if (query === 'skull' || query === 'skulls' ) walletField = 'skull'
		if (query === 'familiar' || query === 'familiars' ) walletField = 'familiar'
		if (query === 'battery' || query === 'batteries' ) walletField = 'battery'

		const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
		const card_name = await findCard(query, fuzzyPrints)
		const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
		const print = valid_card_code && !walletField ? await Print.findOne({ where: { card_code: card_code }}) :
		card_name && !walletField ? await selectPrint(message, player.id, card_name, private = false, inInv = true) :
		null

		if (card_name && !print) {
			message.channel.send({ content: `You do not have any copies of ${card_name}.`})
			return false
		} else if (!print && !walletField) {
			message.channel.send({ content: `Sorry, I do not recognize the card: "${query}".`})
			return false
		} else if (print && print.set_code === 'FPC') {
			message.channel.send({ content: `You cannot trade prize cards.`})
			return false
		}

		if (inputs.length === 1 && walletField === 'stardust') {
			message.channel.send({ content: `You cannot trade only ${stardust}. Please use **!buy** or **!sell** for this transaction.`})
			return false
		}

		const card = walletField ? `${eval(walletField)} ${capitalize(walletField)}` :
		`${eval(print.rarity)}${print.card_code} - ${print.card_name}`

		const inv = print && !walletField ? await Inventory.findOne({ 
			where: { 
				printId: print.id,
				playerId: player.id,
				quantity: { [Op.gt]: 0 }
			}
		}) : null
	
		if (!inv && !wallet[walletField]) {
			message.channel.send({ content: 
				`You do not have any ${walletField ? '' : 'copies of '} ${card}.`
			})
			return false
		} 
	
		if (inv && inv.quantity < quantity || wallet && wallet[walletField] < quantity) {
			message.channel.send({ content: `You only have ${inv ? inv.quantity : wallet[walletField]} ${card}.`})
			return false
		}
	
		if (!walletField) {
			printQuantities.push(quantity)
			prints.push(print)
			invs.push(inv)
		} else {
			walletQuantities.push(quantity)
			walletFields.push(walletField)
		}

		cards.push(`${quantity} ${card}`)
	}

    const summary = {
		printQuantities,
		walletQuantities,
		cards,
		prints,
		walletFields,
		invs
    }
	
    return summary
}

//PROCESS TRADE
const processTrade = async (message, transaction_id, initiatorSummary, receiverSummary, initiatingPlayer, receivingPlayer) => {
	const initiator_wallet = initiatingPlayer.wallet
	const initiator_print_quants = initiatorSummary.printQuantities
	const initiator_prints = initiatorSummary.prints
	const initiator_invs = initiatorSummary.invs
	const initiator_wallet_quants = initiatorSummary.walletQuantities
	const initiator_wallet_fields = initiatorSummary.walletFields

	const receiver_wallet = receivingPlayer.wallet
	const receiver_print_quants = receiverSummary.printQuantities
	const receiver_prints = receiverSummary.prints
	const receiver_invs = receiverSummary.invs
	const receiver_wallet_quants = receiverSummary.walletQuantities
	const receiver_wallet_fields = receiverSummary.walletFields

	//INITIATOR CARDS PROCESSED
	for (let i = 0; i < initiator_invs.length; i++) {
		const inv = initiator_invs[i]
		const quantity = initiator_print_quants[i]
		const print = initiator_prints[i]

		await Trade.create({
			sender_name: initiatingPlayer.name,
			senderId: initiatingPlayer.id,
			receiver_name: receivingPlayer.name,
			receiverId: receivingPlayer.id,
			transaction_id: transaction_id,
			item: inv.card_code,
			quantity: quantity
		})

		inv.quantity -= quantity
		await inv.save()

		await updateBinder(initiatingPlayer)
	
		const mirror_inv = await Inventory.findOne({ 
			where: { 
				card_code: print.card_code,
				printId: print.id,
				playerId: receivingPlayer.id
			}
		})

		if (mirror_inv) {
			mirror_inv.quantity += quantity
			await mirror_inv.save()
		} else {
			await Inventory.create({ 
				card_code: print.card_code,
				quantity: quantity,
				printId: print.id,
				playerId: receivingPlayer.id
			})

			if (print.rarity === 'scr') completeTask(message.channel, receivingPlayer.id, 'm4')
		}

		if (print.set_code === 'APC' && ( (mirror_inv && mirror_inv.quantity >= 3) ||  quantity >= 3 ) ) completeTask(message.channel, receivingPlayer.id, 'h5', 4000)
	}

	//INITIATOR CURRENCIES PROCESSED
	for (let i = 0; i < initiator_wallet_fields.length; i++) {
		const field = initiator_wallet_fields[i]
		const quantity = initiator_wallet_quants[i]

		await Trade.create({
			sender_name: initiatingPlayer.name,
			senderId: initiatingPlayer.id,
			receiver_name: receivingPlayer.name,
			receiverId: receivingPlayer.id,
			transaction_id: transaction_id,
			item: field,
			quantity: quantity
		})

		initiator_wallet[field] -= quantity
		await initiator_wallet.save()
		
		receiver_wallet[field] += quantity
		await receiver_wallet.save()
	}

	//RECEIVER CARDS PROCESSED
	for (let i = 0; i < receiver_invs.length; i++) {
		const inv = receiver_invs[i]
		const quantity = receiver_print_quants[i]
		const print = receiver_prints[i]

		await Trade.create({
			sender_name: receivingPlayer.name,
			senderId: receivingPlayer.id,
			receiver_name: initiatingPlayer.name,
			receiverId: initiatingPlayer.id,
			transaction_id: transaction_id,
			item: inv.card_code,
			quantity: quantity
		})

		inv.quantity -= quantity
		await inv.save()
	
		await updateBinder(receivingPlayer)

		const mirror_inv = await Inventory.findOne({ 
			where: { 
				card_code: print.card_code,
				printId: print.id,
				playerId: initiatingPlayer.id
			}
		})

		if (mirror_inv) {
			mirror_inv.quantity += quantity
			await mirror_inv.save()
		} else {
			await Inventory.create({ 
				card_code: print.card_code,
				quantity: quantity,
				printId: print.id,
				playerId: initiatingPlayer.id
			})

			if (print.rarity === 'scr') completeTask(message.channel, initiatingPlayer.id, 'm4')
		}

		if (print.set_code === 'APC' && ( (mirror_inv && mirror_inv.quantity >= 3) ||  quantity >= 3 ) ) completeTask(message.channel, initiatingPlayer.id, 'h5', 4000)
	}

	//RECEIVER CURRENCIES PROCESSED
	for (let i = 0; i < receiver_wallet_fields.length; i++) {
		const field = receiver_wallet_fields[i]
		const quantity = receiver_wallet_quants[i]

		await Trade.create({
			sender_name: receivingPlayer.name,
			senderId: receivingPlayer.id,
			receiver_name: initiatingPlayer.name,
			receiverId: initiatingPlayer.id,
			transaction_id: transaction_id,
			item: field,
			quantity: quantity
		})
		
		receiver_wallet[field] -= quantity
		await receiver_wallet.save()

		initiator_wallet[field] += quantity
		await initiator_wallet.save()
	}
	
	return true
}


module.exports = {
    getFinalConfirmation,
    getInitiatorConfirmation,
    getReceiverSide,
    getReceiverConfirmation,
	getTradeSummary,
	processTrade
}
