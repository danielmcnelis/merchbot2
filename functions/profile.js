
//PROFILE FUNCTIONS
const { Inventory, Print } = require('../db')
const { yescom, nocom } = require('../static/commands.json')
const { com, rar, sup, ult, scr, blue, champion, FiC, leatherbound, legend, megaphone, sherthonk, stoned, yellow, wtf } = require('../static/emojis.json')
const { findCard } = require('./search.js')

const askToChangeProfile = async (message, field) => {
    let answer = false
    const prompt = field === 'color' ? 'your profile color' : field === 'quote' ? 'your favorite quote' : 'your favorite card'
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send({ content: `Would you like to change ${prompt}?`})
	const collector = msg.channel.awaitMessages({ filter,
		max: 1,
		time: 15000
	})

	collector.on('collect', async (collected) => {
		if (yescom.includes(collected.content.toLowerCase())) answer = true
	})

    return answer
}

const getFavoriteColor = async (message) => {
    let favorite_color = ''
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send({ content: `Please select a color:\n(1) Red\n(2) Orange\n(3) Yellow\n(4) Green\n(5) Blue\n(6) Indigo\n(7) Magenta\n(8) Pink\n(9) Gold\n(10) Silver`})
	const collector = msg.channel.awaitMessages({ filter,
		max: 1,
		time: 30000
	})
	
	collector.on('collect', collected => {
		const response = collected.content.toLowerCase()
        if(response.includes('red') || response.includes('1') && !response.includes('0')) favorite_color = '#f53636' 
        else if(response.includes('orange') || response.includes('2')) favorite_color = '#fc842d'
        else if(response.includes('yellow') || response.includes('3')) favorite_color = '#fceb77'
        else if(response.includes('green') || response.includes('4')) favorite_color = '#63d46d'
        else if(response.includes('blue') || response.includes('5')) favorite_color = '#3c91e6'
        else if(response.includes('indigo') || response.includes('6')) favorite_color = '#5c5fab'
        else if(response.includes('magenta') || response.includes('7')) favorite_color = '#ed1a79'
        else if(response.includes('pink') || response.includes('8')) favorite_color = '#eb7cad'
        else if(response.includes('gold') || response.includes('9')) favorite_color = '#f0bf3a'
        else if(response.includes('silver') || response.includes('10')) favorite_color = '#bccbd6'
        else favorite_color = 'unrecognized'
	})
    
    collector.on('end', () => {
        message.channel.send({ content: `Sorry, time's up.`})
	})

    return favorite_color
}

const getFavoriteQuote = async (message) => {
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send({ content: `Please respond with a new quote.`})
	const collector = msg.channel.awaitMessages({ filter,
		max: 1,
		time: 30000
	})
	
	collector.on('collect', collected => {
		const favorite_quote = collected.content
		if (favorite_quote.length > 200) {
			message.channel.send({ content: `Sorry, that quote is too long. It should be no more than 200 characters.`})
			return false
		} else {
			return favorite_quote
		}
	})
    
    collector.on('end', () => {
        message.channel.send({ content: `Sorry, time's up.`})
		return false
	})

    return collector
}

const getFavoriteAuthor = async (message) => {
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send({ content: `To whom is this quote attributed?`})
	const collector = msg.channel.awaitMessages({ filter,
		max: 1,
		time: 30000
	})
	
	collector.on('collect', collected => {
		const favorite_author = collected.content
		if (favorite_author.length > 50) {
			message.channel.send({ content: `Sorry, that author is too long. It should be no more than 50 characters.`})
			return false
		} else {
			return favorite_author
		}
	})
    
    collector.on('end', () => {
        message.channel.send({ content: `Sorry, time's up.`})
	})

    return collector
}

const getFavoriteCard = async (message, fuzzyPrints) => {
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send({ content: `Please name a card in Forged in Chaos.`})
	const collector = msg.channel.awaitMessages({ filter,
		max: 1,
		time: 30000
	})

	collector.on('collect', async (collected) => {
		const response = collected.content
		if (response === 'none') return 'none'
        const favorite_card = await findCard(response, fuzzyPrints) || false
		const print = await Print.findOne({ where: { card_name: favorite_card }})
		const count = await Inventory.count({ where: { printId: print.id }})
		if (!favorite_card || !count) message.channel.send({ content: `Could not find card: "${response}".`})
		return favorite_card
	})
    
    collector.on('end', () => {
        message.channel.send({ content: `Sorry, time's up.`})
		return false
	})

    return collector
}

// GET RESET CONFIRMATION
const getResetConfirmation = async (message, attempt = 1) => {
	const prompt = attempt === 1 ? `You are allowed to do a clean reset of your ${FiC} account every 30 days. Are you sure you want to do a reset? ${sherthonk}` :
		attempt === 2 ? `Seriously. This cannot ${stoned} be undone. All your cards ${com} ${rar} ${sup} ${ult} ${scr} will be donated to The Shop. Your achievements ${legend} ${champion} ${leatherbound} will be erased. Are you sure you want to reset your ${FiC} acccount? ${yellow}` :
		`${wtf} HOMIE, THIS IS YOUR ${megaphone} **FINAL CHANCE** ${megaphone} TO BACK OUT. ARE YOU **COMPLETELY** 💯 ABOUT THIS? ${blue}`

	const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send({ content: prompt})
	const collector = msg.channel.awaitMessages({ filter,
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
		message.channel.send({ content: `Sorry, time's up.`})
		return false
	})

	return collector
}


module.exports = {
    askToChangeProfile,
    getFavoriteColor,
    getFavoriteQuote,
    getFavoriteAuthor,
    getFavoriteCard,
	getResetConfirmation
}
