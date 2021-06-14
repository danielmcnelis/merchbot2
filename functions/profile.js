
//PROFILE FUNCTIONS
const { yescom, nocom } = require('../static/commands.json')
const { findCard } = require('./search.js')

const askToChangeProfile = async (message, field) => {
    let answer = false
    const prompt = field === 'color' ? 'your profile color' : field === 'quote' ? 'your favorite quote' : 'your favorite card'
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`Would you like to change ${prompt}?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		if (yescom.includes(collected.first().content.toLowerCase())) answer = true
	}).catch(err => {
		console.log(err)
	})

    return answer
}

const getFavoriteColor = async (message) => {
    let favorite_color = ''
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`Please select a color:\n(1) Red\n(2) Orange\n(3) Yellow\n(4) Green\n(5) Blue\n(6) Indigo\n(7) Magenta\n(8) Pink\n(9) Gold\n(10) Silver`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 30000
	}).then(collected => {
		const response = collected.first().content.toLowerCase()
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
	}).catch(err => {
		console.log(err)
        message.channel.send(`Sorry, time's up.`)
	})

    return favorite_color
}

const getFavoriteQuote = async (message) => {
    let favorite_quote
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`Please respond with a new quote.`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 30000
	}).then(collected => {
		favorite_quote = collected.first().content
	}).catch(err => {
		console.log(err)
        message.channel.send(`Sorry, time's up.`)
	})

    return favorite_quote
}

const getFavoriteAuthor = async (message) => {
    let favorite_author = "unknown"
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`To whom is this quote attributed?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 30000
	}).then(collected => {
		favorite_author = collected.first().content
	}).catch(err => {
		console.log(err)
        message.channel.send(`Sorry, time's up.`)
	})

    return favorite_author
}

const getFavoriteCard = async (message, fuzzyPrints, fuzzyPrints2) => {
    let favorite_card
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`Please name a card in Forged in Chaos.`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 30000
	}).then(collected => {
		const response = collected.first().content
        favorite_card = findCard(response, fuzzyPrints, fuzzyPrints2) || 'not found'
        if (favorite_card === 'not found') message.channel.send(`Could not find card: ${response}`)
	}).catch(err => {
		console.log(err)
        message.channel.send(`Sorry, time's up.`)
	})

    return favorite_card
}

module.exports = {
    askToChangeProfile,
    getFavoriteColor,
    getFavoriteQuote,
    getFavoriteAuthor,
    getFavoriteCard
}
