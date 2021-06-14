

//TRADE FUNCTIONS
const { yescom } = require('../static/commands.json')

const getInitiatorConfirmation = async (message, cards, player) => {
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(cards.length > 1 ? `Are you sure you want to trade the following to ${player.name}?\n${cards.join("\n")}` : `Are you sure you want to trade ${cards[0]} to ${player.name}?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return false		
		else return true
	}).catch(err => {
		console.log(err)
		message.channel.send(`Sorry, time's up.`)
        return false
	})

    return collected
}


//TRADE FUNCTIONS
const getPartnerSide = async (message, cards, player) => {
    const filter = m => m.author.id === player.id
	const msg = await message.channel.send(`${player.name}, you are you being offered:\n${cards.join("\n")}\n\nWhat do you wish to trade in return?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 45000
	}).then(collected => {
		return collected.first().content
	}).catch(err => {
		console.log(err)
		message.channel.send(`Sorry, time's up.`)
        return false
	})

    return collected.split(" ")
}


//TRADE FUNCTIONS
const getPartnerConfirmation = async (message, cards, player) => {
    const filter = m => m.author.id === player.id
	const msg = await message.channel.send(cards.length > 1 ? `Are you sure you want to trade the following to ${message.author.username}?\n${cards.join("\n")}` : `Are you sure you want to trade ${cards[0]} to ${message.author.username}?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return false		
		else return true
	}).catch(err => {
		console.log(err)
		message.channel.send(`Sorry, time's up.`)
        return false
	})

    return collected
}

//TRADE FUNCTIONS
const getFinalConfirmation = async (message, cards, player) => {
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`${player.name}, you will receive:\n${cards.join("\n")}\n\nDo you accept this trade?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send(`No problem. Have a nice day.`)		
		else return true
	}).catch(err => {
		console.log(err)
		message.channel.send(`Sorry, time's up.`)
        return false
	})

    return collected
}

module.exports = {
    getInitiatorConfirmation,
    getPartnerSide,
    getPartnerConfirmation,
    getFinalConfirmation
}
