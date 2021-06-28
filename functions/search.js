
//SEARCH FUNCTIONS
const Discord = require('discord.js')
const { Op } = require('sequelize')
const { Card, Print } = require('../db/index.js')

//CARD SEARCH
const search = async (query, fuzzyCards, fuzzyCards2) => {
	const card_name = findCard(query, fuzzyCards, fuzzyCards2)
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

	const cardEmbed = new Discord.MessageEmbed()
		.setColor(color)
		.setTitle(card.name)
		.setThumbnail(`https://ygoprodeck.com/pics/${card.image}`)
		.setDescription(`${labels}\n\n${card.description}\n\n${stats}`)

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
	console.log('allUniquePrintNames[0, 10]', allUniquePrintNames[0, 10])

	const allForgedCards = allCards.filter(card => allUniquePrintNames.includes(card.name))
	console.log('allForgedCards[0]', allForgedCards[0])
    return allForgedCards
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
const findCard = (query, fuzzyCards, fuzzyCards2) => {
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
    findCard,
	search
}
