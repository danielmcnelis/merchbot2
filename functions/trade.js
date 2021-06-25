

//TRADE FUNCTIONS
const { yescom, nocom } = require('../static/commands.json')
const { starchips, stardust } = require('../static/emojis.json')
const merchbotId = '584215266586525696'

//GET SELLER CONFIRMATION
const getSellerConfirmation = async (message, mention = false, seller, cards, price, buyer, buyingPlayer) => {
	const filter = m => m.author.id === seller
	const msg = await message.channel.send(`${mention ? `<@${seller}>, Do you agree` : 'Are you sure you want'} to sell${cards.length > 1 ? `:\n${cards.join('\n')}\nT` : ` ${cards[0]} t`}o ${buyer === merchbotId ? 'The Shop' : buyingPlayer.name} for ${price}${stardust}?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		const response = collected.first().content.toLowerCase()
		if (yescom.includes(response)) {
			return true
		} else {
			message.channel.send(`No problem. Have a nice day.`)
			return false
		}
	}).catch(err => {
		console.log(err)
		message.channel.send(`Sorry, time's up.`)
        return false
	})

	return collected
}

//GET BUYER CONFIRMATION
const getBuyerConfirmation = async (message, mention = false, buyer, cards, price, seller, sellingPlayer) => {
	const filter = m => m.author.id === buyer
	const msg = await message.channel.send(`${mention ? `<@${buyer}>, Do you agree` : 'Are you sure you want'} to buy${cards.length > 1 ? `:\n${cards.join('\n')}\nF` : ` ${cards[0]} f`}rom ${seller === merchbotId ? 'The Shop' : sellingPlayer.name} for ${price}${stardust}?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		const response = collected.first().content.toLowerCase()
		if (yescom.includes(response)) {
			return true
		} else {
			message.channel.send(`No problem. Have a nice day.`)
			return false
		}
	}).catch(err => {
		console.log(err)
		message.channel.send(`Sorry, time's up.`)
        return false
	})

	return collected
}

//GET INITIATOR CONFIRMATION
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


//GET PARTNER SIDE
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


//GET PARTNER CONFIRMATION
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

//GET FINAL CONFIRMATION
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
	getBuyerConfirmation,
    getInitiatorConfirmation,
    getPartnerSide,
    getPartnerConfirmation,
    getFinalConfirmation,
	getSellerConfirmation
}
