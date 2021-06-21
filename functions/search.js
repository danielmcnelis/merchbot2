
//SEARCH FUNCTIONS
const { Card, Print  } = require('../db/index.js')

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
    findCard
}
