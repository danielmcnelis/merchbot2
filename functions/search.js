
//SEARCH FUNCTIONS

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
    findCard
}
