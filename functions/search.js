
//SEARCH FUNCTIONS
const Discord = require('discord.js')
const fs = require('fs')
const { Op } = require('sequelize')
const { Card, Nickname, Inventory, Print } = require('../db/index.js')

//CARD SEARCH
const search = async (query, fuzzyCards, fuzzyCards2) => {
	const card_name = await findCard(query, fuzzyCards, fuzzyCards2)
	if (!card_name) return false

	const card = await Card.findOne({ 
		where: { 
			name: {
				[Op.iLike]: card_name
			}
		}
	})

	if (!card) return false
	const color = card.card === "Spell" ? "#42f578" : card.card === "Trap" ? "#e624ed" : (card.card === "Monster" && card.category === "Normal") ? "#faf18e" : (card.card === "Monster" && card.category === "Effect") ? "#f5b042" : (card.card === "Monster" && card.category === "Fusion") ? "#a930ff" : (card.card === "Monster" && card.category === "Ritual") ? "#3b7cf5" : (card.card === "Monster" && card.category === "Synchro") ? "#ebeef5" : (card.card === "Monster" && card.category === "Xyz") ? "#6e6e6e" : null

	const classes = []
	if (card.type) classes.push(card.type)
	if (card.class) classes.push(card.class)
	if (card.subclass) classes.push(card.subclass)
	if (card.category) classes.push(card.category)

	const labels = card.card === "Monster" ? `**Attribute:** ${card.attribute}\n**Level:** ${card.level}\n**Release Date:** ${card.date}\n**[** ${classes.join(" / ")} **]**` : `**Category:** ${card.category}\n**Release Date:** ${card.date}` 
	const stats = card.card === "Monster" ? `**ATK:** ${card.atk} **DEF:** ${card.def}` : ''
	
	const attachment = fs.existsSync(`./public/card_images/${card.image}`) ?
		new Discord.MessageAttachment(`./public/card_images/${card.image}`, card.image) :
		false

	const thumbnail = attachment ? `attachment://${card.image}` : `https://ygoprodeck.com/pics/${card.image}`
	const cardEmbed = new Discord.MessageEmbed()
	if (attachment) cardEmbed.attachFiles(attachment) 
	cardEmbed.setColor(color)
	cardEmbed.setTitle(card.name)
	cardEmbed.setThumbnail(thumbnail)
	cardEmbed.setDescription(`${labels}\n\n${card.description}\n\n${stats}`)
	return cardEmbed
}

//FETCH ALL CARDS
const fetchAllCardNames = async () => {
    const allCardNames = await Card.findAll().map(function(card) { return card.name })
    return allCardNames
}

//FETCH ALL CARDS
const fetchAllCards = async () => {
    const allCards = await Card.findAll()
    return allCards
}

//FETCH ALL FORGED CARDS
const fetchAllForgedCards = async () => {
    const allCards = await fetchAllCards()
	const allUniquePrintNames = await fetchAllUniquePrintNames()
	const allForgedCards = allCards.filter(card => allUniquePrintNames.includes(card.name))
    return allForgedCards
}

//FETCH ALL YOUR SINGLES
const getInventorySummary = async (allForgedCards, playerId) => {
	const invs = await Inventory.findAll({ 
		where: {
			playerId: playerId,
			quantity: {
				[Op.gte]: 1
			}
		},
		include: Print
	})

	const inv_map = {}

	for (let i = 0; i < invs.length; i++) {
		const inv = invs[i]
		const quantity = inv.quantity
		const name = inv.print.card_name
		if (inv_map[name]) inv_map[name] += quantity
		else inv_map[name] = quantity
	}

	const names = Object.keys(inv_map)
	const one_of_names = []
	const two_of_names = []
	const three_of_names = []

	names.forEach((name) => {
		if (inv_map[name] === 1) one_of_names.push(name)
		else if (inv_map[name] === 2) two_of_names.push(name)
		else if (inv_map[name] >= 3) three_of_names.push(name)
	})

	console.log('one_of_names', one_of_names)
	console.log('two_of_names', two_of_names)
	console.log('three_of_names', three_of_names)

	const yourSingles = allForgedCards.filter(card => one_of_names.includes(card.name))
	const yourDoubles = allForgedCards.filter(card => two_of_names.includes(card.name))
	const yourTriples = allForgedCards.filter(card => three_of_names.includes(card.name))

	const summary = {
		yourSingles,
		yourDoubles,
		yourTriples
	}

    return summary
}



//FETCH UNIQUE PRINTS
const fetchAllUniquePrintNames = async () => {
    const prints = []
    const allUniquePrintNames = []
    const allPrints = await Print.findAll()
    allPrints.forEach(function(print) { 
        if (!prints.includes(print.card_name)) {
            prints.push(print.card_name)
            allUniquePrintNames.push(print.card_name)
        }
    })
    allUniquePrintNames.sort()
    return allUniquePrintNames
}

//FIND CARD
const findCard = async (query, fuzzyCards, fuzzyCards2) => {
	const nickname = await Nickname.findOne({ where: { alius: query.toLowerCase() } })
	if (nickname && nickname.card_name) return nickname.card_name 

    const fuzzy_card = fuzzyCards.get(query, null, 0.36) || []
	const fuzzy_card_2 = fuzzyCards2.get(query, null, 0.36) || []
	const fuzzy_results = [...fuzzy_card, ...fuzzy_card_2]

	fuzzy_card.sort((a, b) => b[0] - a[0])
	fuzzy_results.sort((a, b) => b[0] - a[0])

	if (!fuzzy_results[0]) return

	let alternate
	if (query.length >= 10) {
		for (let i = 0; i < fuzzy_card.length; i++) {
			if (fuzzy_card[i][1].replace(/[^\w\s]/gi, "").toLowerCase().includes(query.toLowerCase())) {
				alternate = fuzzy_card[i][1]
				break
			}
		}
	}

	if (fuzzy_results[0][0] < 0.9) {
		for (let i = 0; i < fuzzy_card.length; i++) {
			if (fuzzy_card[i][1].replace(/[^\w\s]/gi, "").toLowerCase().startsWith(query.toLowerCase())) {
				alternate = fuzzy_card[i][1]
				break
			}
		}
	}

	const card_name = alternate ? alternate : fuzzy_results[0][0] > 0.5 ? fuzzy_results[0][1] : null
    return card_name
}

module.exports = {
	fetchAllCardNames,
	fetchAllCards,
	fetchAllForgedCards,
	fetchAllUniquePrintNames,
	getInventorySummary,
    findCard,
	search
}
