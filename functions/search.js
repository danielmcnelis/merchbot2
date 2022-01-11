
//SEARCH FUNCTIONS
const Discord = require('discord.js')
const fs = require('fs')
const { Op } = require('sequelize')
const { Card, Nickname, Inventory, Print } = require('../db/index.js')

//CARD SEARCH
const search = async (query, fuzzyCards) => {
	const card_name = await findCard(query, fuzzyCards)
	if (!card_name) return false

	const card = await Card.findOne({ 
		where: { 
			name: {
				[Op.iLike]: card_name
			}
		}
	})

	if (!card) return false
	
	const color = card.category === "Spell" ? "#42f578" :
		card.category === "Trap" ? "#e624ed" :
		card.category === "Monster" && card.fusion ? "#a930ff" :
		card.category === "Monster" && card.ritual ? "#3b7cf5" :
		card.category === "Monster" && card.synchro ? "#ebeef5" :
		card.category === "Monster" && card.xyz ? "#6e6e6e" :
		card.category === "Monster" && card.pendulum ? "#a5e096" :
		card.category === "Monster" && card.link ? "#468ef2" :
		card.category === "Monster" && card.normal ? "#faf18e" :
		card.category === "Monster" && card.effect ? "#f5b042" :
		null

	const classes = []
	if (card.normal) classes.push("Normal")
	if (card.fusion) classes.push("Fusion")
	if (card.ritual) classes.push("Ritual")
	if (card.synchro) classes.push("Synchro")
	if (card.xyz) classes.push("Xyz")
	if (card.pendulum) classes.push("Pendulum")
	if (card.link) classes.push("Link")
	if (card.flip) classes.push("Flip")
	if (card.gemini) classes.push("Gemini")
	if (card.spirit) classes.push("Spirit")
	if (card.toon) classes.push("Toon")
	if (card.tuner) classes.push("Tuner")
	if (card.union) classes.push("Union")
	if (card.effect) classes.push("Effect")

	const labels = card.category === "Monster" ? 
		`**Attribute:** ${card.attribute}` + 
		`\n${card.xyz ? `**Rank:** ${card.level}` : card.link ? `**Link Rating:** ${card.rating}` : `**Level:** ${card.level}`}` +
		`\n**Release Date:** ${card.tcg_date || 'OCG Only'}` +
		`\n**[** ${card.type} / ${classes.join(" / ")} **]**` :
		`**Category: ${card.icon}**` +
		`\n**Release Date:** ${card.tcg_date || 'OCG Only'}`
	
	const stats = card.category === "Monster" ? 
			`**ATK:** ${card.atk === null ? '?' : card.atk}` + 
			` ${!card.link ? `**DEF:** ${card.def === null ? '?' : card.def}` : ''}` :
			''
	
	const attachment = fs.existsSync(`./public/card_images/${card.image_file}`) ?
		new Discord.MessageAttachment(`./public/card_images/${card.image_file}`, card.image_file) :
		false

	const thumbnail = attachment ? `attachment://${card.image_file}` : `https://ygoprodeck.com/pics/${card.image_file}`
	const cardEmbed = new Discord.MessageEmbed()
	cardEmbed.setColor(color)
	cardEmbed.setTitle(card.name)
	cardEmbed.setThumbnail(thumbnail)
	cardEmbed.setDescription(`${labels}\n\n${card.description}\n\n${stats}`)
	return { cardEmbed, attachment }
}

//FETCH ALL CARDS
const fetchAllCardNames = async () => {
    const allCardNames = await Card.findAll()
    return allCardNames.map((card) => { return card.name })
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
		if (inv_map[name] >= 1) one_of_names.push(name)
		if (inv_map[name] >= 2) two_of_names.push(name)
		if (inv_map[name] >= 3) three_of_names.push(name)
	})

	const singleIds = allForgedCards.filter(card => one_of_names.includes(card.name)).map(c => c.konami_code)
	const doubleIds = allForgedCards.filter(card => two_of_names.includes(card.name)).map(c => c.konami_code)
	const tripleIds = allForgedCards.filter(card => three_of_names.includes(card.name)).map(c => c.konami_code)

	const summary = {
		singleIds,
		doubleIds,
		tripleIds
	}

    return summary
}



//FETCH UNIQUE PRINTS
const fetchAllUniquePrintNames = async () => {
    const prints = []
    const allUniquePrintNames = []
    const allPrints = await Print.findAll()
    allPrints.forEach((print) => { 
        if (!prints.includes(print.card_name)) {
            prints.push(print.card_name)
            allUniquePrintNames.push(print.card_name)
        }
    })
    allUniquePrintNames.sort()
    return allUniquePrintNames
}

//FIND CARD
const findCard = async (query, fuzzyCards) => {
	const nickname = await Nickname.findOne({ where: { alius: query.toLowerCase() } })
	if (nickname && nickname.card_name) return nickname.card_name 

    const fuzzy_search = fuzzyCards.get(query, null, 0.36) || []
	fuzzy_search.sort((a, b) => b[0] - a[0])
	if (!fuzzy_search[0]) return false

	let partial_match
	if (query.length >= 10) {
		for (let i = 0; i < fuzzy_search.length; i++) {
			const result = fuzzy_search[i][1]
			if (result.replace(/[^\w\s]/gi, "").toLowerCase().includes(query.toLowerCase())) {
				partial_match = result
				break
			}
		}
	}

	const card_name = partial_match ? partial_match :
		fuzzy_search[0][0] > 0.5 ? fuzzy_search[0][1] :
		null
		
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
