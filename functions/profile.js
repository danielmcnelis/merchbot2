
//PROFILE FUNCTIONS
const { Inventory, Print } = require('../db')
const { yescom, nocom } = require('../static/commands.json')
const { com, rar, sup, ult, scr, blue, champion, FiC, leatherbound, legend, megaphone, sherthonk, stoned, yellow, wtf } = require('../static/emojis.json')
const { findCard } = require('./search.js')

const askToChangeProfile = async (message, field) => {
    const prompt = field === 'color' ? 'your profile color' : field === 'quote' ? 'your favorite quote' : 'your favorite card'
    const filter = m => m.author.id === message.author.id
	message.channel.send({ content: `Would you like to change ${prompt}?`})
	return await message.channel.awaitMessages({ filter,
		max: 1,
		time: 15000
	}).then((collected) => {
		const response = collected.first().content.toLowerCase()
		return yescom.includes(response)
	}).catch((err) => {
		console.log(err)
		return false
	})
}

const getFavoriteColor = async (message) => {
    const filter = m => m.author.id === message.author.id
	message.channel.send({ content: `Please select a color:\n(1) Red\n(2) Orange\n(3) Yellow\n(4) Green\n(5) Blue\n(6) Indigo\n(7) Magenta\n(8) Pink\n(9) Gold\n(10) Silver`})
	return await message.channel.awaitMessages({ filter,
		max: 1,
		time: 30000
	}).then((collected) => {
		const response = collected.first().content.toLowerCase()
		const favorite_color = response.includes('silver') || response.includes('10') ? '#bccbd6' :
			response.includes('red') || response.includes('1') ? '#f53636' :
			response.includes('orange') || response.includes('2') ? '#fc842d' :
			response.includes('green') || response.includes('4') ? '#63d46d' :
			response.includes('yellow') || response.includes('3') ? '#fceb77' :
			response.includes('blue') || response.includes('5') ? '#3c91e6' :
			response.includes('indigo') || response.includes('6') ? '#5c5fab' :
			response.includes('magenta') || response.includes('7') ? '#ed1a79' :
			response.includes('pink') || response.includes('8') ? '#eb7cad' :
			response.includes('gold') || response.includes('9') ? '#f0bf3a' :
			'unrecognized'

		return favorite_color
	}).catch((err) => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
		return false
	})

}

const getFavoriteQuote = async (message) => {
    const filter = m => m.author.id === message.author.id
	message.channel.send({ content: `Please respond with a new quote.`})
	return await message.channel.awaitMessages({ filter,
		max: 1,
		time: 30000
	}).then((collected) => {
		const favorite_quote = collected.first().content
		if (favorite_quote.length > 200) {
			message.channel.send({ content: `Sorry, that quote is too long. It should be no more than 200 characters.`})
			return false
		} else {
			return favorite_quote
		}
	}).catch((err) => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
		return false
	})
}

const getFavoriteAuthor = async (message) => {
    const filter = m => m.author.id === message.author.id
	message.channel.send({ content: `To whom is this quote attributed?`})
	return await message.channel.awaitMessages({ filter,
		max: 1,
		time: 30000
	}).then((collected) => {
		const favorite_author = collected.first().content
		if (favorite_author.length > 50) {
			message.channel.send({ content: `Sorry, that author is too long. It should be no more than 50 characters.`})
			return false
		} else {
			return favorite_author
		}
	}).catch((err) => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
		return false
	})
}

const getFavoriteCard = async (message, fuzzyPrints) => {
    const filter = m => m.author.id === message.author.id
	message.channel.send({ content: `Please name a card in Forged in Chaos.`})
	return await message.channel.awaitMessages({ filter,
		max: 1,
		time: 30000
	}).then(async (collected) => {
		const response = collected.first().content
		if (response === 'none') return 'none'
		const favorite_card = await findCard(response, fuzzyPrints)
		const print = await Print.findOne({ where: { card_name: favorite_card }})
		const count = await Inventory.count({ where: { printId: print.id }})
		if (!favorite_card || !count) message.channel.send({ content: `Could not find card: "${response}".`})
		return favorite_card
	}).catch((err) => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
		return false
	})
}

// GET RESET CONFIRMATION
const getResetConfirmation = async (message, attempt = 1) => {
	const prompt = attempt === 1 ? `You are allowed to do a clean reset of your ${FiC} account every 30 days. Are you sure you want to do a reset? ${sherthonk}` :
		attempt === 2 ? `Seriously. This cannot ${stoned} be undone. All your cards ${com} ${rar} ${sup} ${ult} ${scr} will be donated to The Shop. Your achievements ${legend} ${champion} ${leatherbound} will be erased. Are you sure you want to reset your ${FiC} acccount? ${yellow}` :
		`${wtf} HOMIE, THIS IS YOUR ${megaphone} **FINAL CHANCE** ${megaphone} TO BACK OUT. ARE YOU **COMPLETELY** 💯 ABOUT THIS? ${blue}`

	const filter = m => m.author.id === message.author.id
	message.channel.send({ content: prompt})
	return await message.channel.awaitMessages({ filter,
		max: 1,
		time: 15000
	}).then((collected) => {
		const response = collected.first().content.toLowerCase()
		return yescom.includes(response)
	}).catch((err) => {
		console.log(err)
		message.channel.send({ content: `Sorry, time's up.`})
		return false
	})
}


module.exports = {
    askToChangeProfile,
    getFavoriteColor,
    getFavoriteQuote,
    getFavoriteAuthor,
    getFavoriteCard,
	getResetConfirmation
}
