
const Discord = require('discord.js')
const Canvas = require('canvas')
const FuzzySet = require('fuzzyset')
const fs = require('fs')
const axios = require('axios')
const merchbotId = '584215266586525696'
const { Op } = require('sequelize')
const { ygocard, fire, tix, credits, blue, red, yellow, stoned, stare, leatherbound, wokeaf, koolaid, cavebob, evil, DOC, ORF, milleye, merchant, FiC, approve, lmfao, god, legend, master, diamond, platinum, gold, silver, bronze, rocks, sad, mad, beast, dinosaur, fish, plant, reptile, rock, starchips, egg, cactus, hook, moai, mushroom, rose, stardust, cultured, com, rar, sup, ult, scr, checkmark, emptybox, yes, no } = require('./static/emojis.json')
const { aliuscom, nicknamecom, joincom, bindercom, wishlistcom, invcom, calccom, bracketcom, dropcom, queuecom, checklistcom, startcom, infocom, dbcom, noshowcom, legalcom, listcom, pfpcom, botcom, rolecom, statscom, profcom, losscom, h2hcom, undocom, rankcom, manualcom, yescom, nocom, deckcom } = require('./static/commands.json')
const { bookwormsRole, gamersRole, triviaRole, botRole, modRole, adminRole, tourRole, toRole, fpRole, muteRole, arenaRole, ambassadorRole } = require('./static/roles.json')
const { gutterChannelId, generalChannelId, rulesChannelId, rulingsChannelId, introChannelId, discussionChannelId, staffChannelId, botSpamChannelId, welcomeChannelId, announcementsChannelId, registrationChannelId, replaysChannelId, duelRequestsChannelId, marketPlaceChannelId, shopChannelId, tournamentChannelId, arenaChannelId, keeperChannelId, triviaChannelId, draftChannelId, gauntletChannelId, bugreportsChannelId, suggestionsChannelId } = require('./static/channels.json')
const decks = require('./static/decks.json')
const types = require('./static/types.json')
const diaries = require('./static/diaries.json')
const arenas = require('./static/arenas.json')
const errors = require('./static/errors.json')
const trivia = require('./trivia.json')
const ygoprodeck = require('./static/ygoprodeck.json')
const muted = require('./static/muted.json')
const prints = require('./static/prints.json')
const nicknames = require('./static/nicknames.json')
const statuses = require('./static/statuses.json')
const { 
    getBuyerConfirmation,
    getSellerConfirmation,
    getInvoiceMerchBotPurchase,
    getInvoiceMerchBotSale,
    getInvoiceP2PSale,
    processMerchBotSale,
    processP2PSale } = require('./functions/transaction.js')
const { getNewStatus } = require('./functions/status.js')
const { checkArenaProgress, getArenaSample, resetArena, startArena, startRound, endArena } = require('./functions/arena.js')
const { askQuestion, resetTrivia, startTrivia } = require('./functions/trivia.js')
const { askForGrindAllConfirmation } = require('./functions/mod.js')
const { Arena, Auction, Bid, Binder, Card, Daily, Diary, Draft, Entry, Gauntlet, Info, Inventory, Knowledge, Match, Nickname, Player, Print, Profile, Set, Tournament, Trade, Trivia, Wallet, Wishlist, Status } = require('./db')
const { getRandomString, isSameDay, isWithinXHours, hasProfile, capitalize, recalculate, createProfile, createPlayer, isNewUser, isAdmin, isAmbassador, isArenaPlayer, isJazz, isMod, isTourPlayer, isVowel, getMedal, getRandomElement, getRandomSubset } = require('./functions/utility.js')
const { checkDeckList, saveYDK, saveAllYDK, awardStarterDeck, getShopDeck } = require('./functions/decks.js')
const { askForBidCancellation, askForBidPlacement, manageBidding } = require('./functions/bids.js')
const { selectTournament, getTournamentType, seed, askForDBUsername, getDeckListTournament, getDeckNameTournament, directSignUp, removeParticipant, generateSheetData, getMatches, checkChallongePairing, putMatchResult, findNextMatch, findNextOpponent, findOtherPreReqMatch} = require('./functions/tournament.js')
const { makeSheet, addSheet, writeToSheet } = require('./functions/sheets.js')
const { askForAdjustConfirmation, askForCardSlot, collectNicknames, getNewMarketPrice, askForSetToPrint, selectPrint, askForRarity } = require('./functions/print.js')
const { uploadDeckFolder } = require('./functions/drive.js')
const { fetchAllCardNames, fetchAllCards, fetchAllUniquePrintNames, findCard, search } = require('./functions/search.js')
const { getBarterCard, getVoucher, getTradeInCard, getBarterDirection, askForBarterConfirmation, checkShopShouldBe, getShopCountdown, openShop, closeShop, askForDumpConfirmation, checkShopOpen, getDumpRarity, askForExclusions, getExclusions, getExcludedPrintIds, getDumpQuantity, postBids, updateShop,  } = require('./functions/shop.js')
const { awardPack } = require('./functions/packs.js')
const { createTrade, processTrade, getTradeSummary, getFinalConfirmation, getInitiatorConfirmation, getReceiverSide, getReceiverConfirmation } = require('./functions/trade.js')
const { askToChangeProfile, getFavoriteColor, getFavoriteQuote, getFavoriteAuthor, getFavoriteCard } = require('./functions/profile.js')
const { checkCoreSetComplete, completeTask } = require('./functions/diary.js')
const { client, challongeClient } = require('./static/clients.js')
const { challongeAPIKey } = require('./secrets.json')
let fuzzyCards
let fuzzyCards2

//READY
client.on('ready', async () => {
	console.log('MerchBot is online!')
	const allCards = await fetchAllCardNames()
	const allUniquePrints = await fetchAllUniquePrintNames()
	fuzzyCards = FuzzySet([], false)
    fuzzyCards2 = FuzzySet([], false, 2, 3)

	fuzzyPrints = FuzzySet([], false)
    fuzzyPrints2 = FuzzySet([], false, 2, 3)

    allCards.forEach(function(card) {
        fuzzyCards.add(card)
        fuzzyCards2.add(card)
    })

    allUniquePrints.forEach(function(card) {
        fuzzyPrints.add(card)
        fuzzyPrints2.add(card)
    })

	const shopShouldBe = checkShopShouldBe()
	const shopCountdown = getShopCountdown()
	const shopOpen = await checkShopOpen()
	const hoursLeftInPeriod = Math.floor(shopCountdown / (3600000))
	const minsLeftInPeriod = Math.ceil((shopCountdown % 3600000)/ 60000)

	if (shopOpen) {
		updateShop()
	} else {
		postBids()
	}

	setInterval(async () =>  {
		const shopOpen = await checkShopOpen()
		if (shopOpen) updateShop()
	}, 1000 * 60 * 10)

	if (!shopShouldBe) return client.channels.cache.get(staffChannelId).send(`<@&${adminRole}>, The Shop status could not be read from the database.`)
	if (!shopOpen && shopShouldBe === 'open') client.channels.cache.get(staffChannelId).send(`<@&${modRole}>, The Shop is unexpectedly closed. Type **!open** to manually open it.`)
	if (shopOpen && shopShouldBe === 'closed') client.channels.cache.get(staffChannelId).send(`<@&${modRole}>, The Shop is unexpectedly open. Type **!close** to manually close it.`)

	if (shopShouldBe === 'closed') {
		return setTimeout(() => openShop(), shopCountdown)
	} else if (shopShouldBe === 'open') {
		return setTimeout(() => closeShop(), shopCountdown)
	}
})
  
//WELCOME
client.on('guildMemberAdd', async (member) => {
    const welcomeChannel = client.channels.cache.get(welcomeChannelId)
    const mutedPeople = JSON.parse(fs.readFileSync('./static/muted.json'))['mutedPeople']

    if (mutedPeople.includes(member.user.id)) {
            member.roles.add(muteRole)
            return welcomeChannel.send(`${member} Nice mute evasion, punk. LOL! ${lmfao}`)
        }

    if (await isNewUser(member.user.id)) {
        createPlayer(member.user.id, member.user.username, member.user.tag) 
        return welcomeChannel.send(`${member} Welcome to the Forged in Chaos ${FiC} Discord server! Go to <#${botSpamChannelId}> and type **!start** to begin playing. ${legend}`)
    } else {
        return welcomeChannel.send(`${member} Welcome back to the Forged in Chaos ${FiC} Discord server! We missed you. ${approve}`)
    }
})
    
//GOODBYE
client.on('guildMemberRemove', member => client.channels.cache.get(welcomeChannelId).send(`Oh dear. ${member.user.username} has left the server. ${sad}`))

//COMMANDS
client.on('message', async (message) => {
    const mcid = message.channel.id
    if (
		//no commands in DMs
		!message.guild || 
		//no commands from bots
		message.author.bot || 
		//only allow commands starting with !, { or [
		(!message.content.startsWith("!") && !message.content.includes("{") && !message.content.includes("[")) ||
		//only allow !start and !bot in welcome
		!message.content.startsWith("!start") && !message.content.startsWith("!bot") && mcid === welcomeChannelId ||
		//only allow card searches in suggestions, discussion and rulings
		message.content.startsWith("!") &&  (
			mcid === suggestionsChannelId ||
			mcid === discussionChannelId ||
			mcid === rulingsChannelId
		) ||
		//only allow !clear in discussion, replays, rules, shop, intro, bugreports
		!message.content.startsWith("!clear") && ( 
			mcid === replaysChannelId || 
			mcid === rulesChannelId ||
			mcid === shopChannelId || 
			mcid === introChannelId || 
			mcid === bugreportsChannelId
		)
	) return

	//remove extra spaces between arguments
    const messageArray = message.content.split(" ")
	for(let zeta = 0; zeta < messageArray.length; zeta ++) {
		if (messageArray[zeta] == '') { 
			messageArray.splice(zeta, 1)
			zeta--
		}
	}

	//convert all commands to lower case
    const cmd = messageArray[0].toLowerCase()
    const args = messageArray.slice(1)
    const maid = message.author.id

//CARD SEARCH 1
if (!message.content.startsWith("!") && message.content.includes(`{`) && message.content.includes(`}`)) {
	if (message.member.roles.cache.some(role => role.id === triviaRole)) return message.channel.send(`You cannot search for cards while playing Trivia.`)
	const query = message.content.slice(message.content.indexOf('{') + 1, message.content.indexOf('}'))
	const cardEmbed = await search(query, fuzzyCards, fuzzyCards2)
	if (!cardEmbed) return message.channel.send(`Could not find card: "query".`)
	else return message.channel.send(cardEmbed)
}

//CARD SEARCH 2
if (!message.content.startsWith("!") && message.content.includes(`[`) && message.content.includes(`]`)) {
	if (message.member.roles.cache.some(role => role.id === triviaRole)) return message.channel.send(`You cannot search for cards while playing Trivia.`)
	const query = message.content.slice(message.content.indexOf('[') + 1, message.content.indexOf(']'))
	const cardEmbed = await search(query, fuzzyCards, fuzzyCards2)
	if (!cardEmbed) return message.channel.send(`Could not find card: "query".`)
	else return message.channel.send(cardEmbed)
}

//PING 
    if (cmd === `!ping`) return message.channel.send('pong')


//TEST
if(cmd === `!test`) {
	// const canvas = Canvas.createCanvas(105, 158)
	// const context = canvas.getContext('2d')
	// const background = await Canvas.loadImage(`https://ygoprodeck.com/pics/89631139.jpg`)
	// context.drawImage(background, 0, 0, canvas.width, canvas.height)
	// const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `bewd.png`)
	// return message.channel.send(`Behold!`, attachment)
}


//IMPORT_DATA
if (cmd === `!import_data`) {
	if (!isJazz(message.member)) return message.channel.send(`You do not have permission to do that.`)
	const { data } = await axios.get('https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=Yes')
	fs.writeFile("./static/ygoprodeck.json", JSON.stringify(data), (err) => { 
		if (err) console.log(err)
	})

	return message.channel.send(`Successfully imported the latest data from ygoprodeck.com.`)
}

//IMPORT_IMAGES
if (cmd === `!import_images`) {
	if (!isJazz(message.member)) return message.channel.send(`You do not have permission to do that.`)
	const allPrints = await Print.findAll({ order: [["card_name", "ASC"]] })

	for (let i = 0; i <= allPrints.length; i++) {
		const print = allPrints[i]
		console.log(`trying ${print.card_name}`)
		const card = await Card.findOne({ where: {
			name: print.card_name
		}})

		if (!card) {
			console.log(`failure for ${print.card_name}`)
			continue
		} 

		console.log(`found card ${card.name}, ${card.image}`)
		const url = `https://ygoprodeck.com/pics/${card.image}`
		const writer = fs.createWriteStream(`./public/card_images/${card.image}`)

		const response = await axios({
			url,
			method: 'GET',
			responseType: 'stream'
		})

		const success = await response.data.pipe(writer)
		console.log(`success = ${!!success} for ${card.image}`)
	}

	return message.channel.send(`Successfully imported high quality images for Forged in Chaos cards from YGOPRODeck.`)
}

//IMPORT_IMAGES
if (cmd === `!import_missing_images`) {
	if (!isJazz(message.member)) return message.channel.send(`You do not have permission to do that.`)
	const file_names = fs.readdirSync('./public/card_images')
	const all_cards = await Card.findAll()
	let count = 0
	let successes = 0
	
	for (let i = 0; i <= all_cards.length; i++) {
		const name = all_cards[i].name
		const image_url = all_cards[i].image
		if (!file_names.includes(image_url)) {
			console.log('missing', image_url)
			count++
			const url = `https://ygoprodeck.com/pics/${image_url}`
			const writer = fs.createWriteStream(`./public/card_images/${image_url}`)

			const response = await axios({
				url,
				method: 'GET',
				responseType: 'stream'
			})

			const success = await response.data.pipe(writer)
			if (success) successes++
			console.log(`${success ? 'SUCCESS' : 'FAILURE'} downloading ${name} from ${image_url}`)
		}
	}

	return message.channel.send(`Successfully downloaded ${successes} out of ${count} images from YGOPRODeck.com!`)
}

//UPDATE 
if (cmd === `!update`) {
	if (!isJazz(message.member)) return message.channel.send(`You do not have permission to do that.`)
	const allCards = await Card.findAll()
	const allCardNames = allCards.map((card) => card.name)

	const newCards = ygoprodeck.data.filter((card) => {
		if (!allCardNames.includes(card.name)) return card
	})

	if (!newCards.length) return message.channel.send(`Could not find any new Yu-Gi-Oh! cards on YGOPRODeck.com.`)

	let created = 0

	for (let i = 0; i < newCards.length; i++) {
		const newCard = newCards[i]
		if (newCard.type === 'Token' || newCard.name.includes('(Skill Card)') || (!newCard.misc_info[0].tcg_date && !newCard.misc_info[0].ocg_date) ) continue
		const image = `${newCard.id}.jpg`
		const name = newCard.name
		const newCardTypeArr = newCard.type.split(" ")
		const card = newCardTypeArr.includes('Monster') ? 'Monster' : newCardTypeArr.includes('Spell') ? 'Spell' : 'Trap'
		const category = newCardTypeArr[0] === 'Tuner' ? 'Effect' : card === 'Spell' || card === 'Trap' ? newCard.race : newCardTypeArr[0]
		const card_class =  newCardTypeArr[0] === 'Tuner' ? 'Tuner' : newCardTypeArr[1] !== 'Monster' && newCardTypeArr[1] !== 'Card' ? newCardTypeArr[1] : card === 'Monster' && category !== 'Effect' ? 'Effect' : null
		const subclass = newCardTypeArr[2] || null
		const attribute = newCard.attribute ? capitalize(newCard.attribute.toLowerCase()) : null
		const type = card === 'Monster' ? newCard.race : null
		const level = newCard.level || newCard.rank || newCard.linkVal || null
		const atk = newCard.atk || newCard.atk === 0 ? newCard.atk : null
		const def = newCard.def || newCard.def === 0 ? newCard.def : null
		const description = newCard.desc
		const date = newCard.misc_info[0].tcg_date || newCard.misc_info[0].ocg_date
		
		try {
			await Card.create({
				image,
				name,
				card,
				category,
				class: card_class,
				subclass,
				attribute,
				type,
				level,
				atk,
				def,
				description,
				date
			})
		} catch (err) {
			console.log(err)
		}

		created++
	}	

	if (!created) return message.channel.send(`Could not find any new Yu-Gi-Oh! cards on YGOPRODeck.com.`)
	return message.channel.send(`You added ${created} new cards from YGOPRODeck.com to the Format Library database.`)
}


//FIX_ATK/DEF 
if (cmd === `!fix_atk/def`) {
	if (!isAdmin(message.member)) return message.channel.send(`You do not have permission to do that.`)
	const ygoprodeckCards = ygoprodeck.data
	let updated = 0

	for (let i = 0; i < ygoprodeckCards.length; i++) {
		if (ygoprodeckCards[i].atk === 0 || ygoprodeckCards[i].def === 0) {
			const card = await Card.findOne({ where: { name: ygoprodeckCards[i].name }})
			if (!card) {
				continue
			}
			const atk = ygoprodeckCards[i].atk === 0 ? 0 : null
			const def = ygoprodeckCards[i].def === 0 ? 0 : null
			card.atk = atk
			card.def = def
			await card.save() 
			updated++
		}
	}

	return message.channel.send(`You fixed the ATK/DEF stats of ${updated} cards in the Format Library database.`)
}

//ORF
if (cmd === `!orf`) {
	if (!isJazz(message.member)) return message.channel.send(`You do not have permission to do that.`)
	const ORF = {
		code: "ORF",
		name: "Origin of Fire",
		type: "mini",
		emoji: "ORF",
		alt_emoji: "ORF",
		size: 50,
		commons: 24,
		rares: 10,
		supers: 10,
		ultras: 6,
		unit_price: 10,
		spec_for_sale: false,
		unit_sales: 0,
		cards_per_pack: 5,
		packs_per_box: 8,
		commons_per_pack: 3,
		rares_per_pack: 1,
		commons_per_box: 24,
		rares_per_box: 8,
		supers_per_box: 7,
		ultras_per_box: 1,
		secrets_per_box: 0
	}

	await Set.create(ORF)
	message.channel.send(`I created a new set: ORF.`)
}

//INIT
if (cmd === `!init`) {
	if (!isJazz(message.member)) return message.channel.send(`You do not have permission to do that.`)
	const count = await Info.count()
	if (count) return message.channel.send(`The game has already been initialized.`)

	await Info.create({
		element: "shop",
		status: "open"
	})

	await Info.create({
		element: "arena",
		status: "pending"
	})
	
	await Info.create({
		element: "trivia",
		status: "pending"
	})

	const SS1 = {
		code: "SS1",
		name: "Starter Series 1",
		type: "starter_deck",
		emoji: "fish",
		alt_emoji: "rock",
		size: 31,
		commons: 29,
		ultras: 2,
		unit_price: 75
	}

	const DOC = {
		code: "DOC",
		name: "Dawn of Chaos",
		type: "core",
		emoji: "DOC",
		alt_emoji: "DOC",
		size: 200,
		commons: 96,
		rares: 40,
		supers: 36,
		ultras: 20,
		secrets: 8,
		specials: 0,
		spec_for_sale: false,
		unit_price: 15,
		unit_sales: 0,
		cards_per_pack: 9,
		box_price: 315,
		packs_per_box: 24,
		spec_price: 40,
		packs_per_spec: 3,
		commons_per_pack: 7,
		rares_per_pack: 1,
		commons_per_box: 168,
		rares_per_box: 24,
		supers_per_box: 18,
		ultras_per_box: 5,
		secrets_per_box: 1,
		specs_per_spec: 2
	}

	const APC = {
		code: "APC",
		name: "Arena Prize Cards",
		type: "promot",
		emoji: "master",
		alt_emoji: "master",
		size: 8,
		ultras: 8,
		unit_price: 24
	}

	await Set.create(SS1)
	await Set.create(DOC)
	await Set.create(APC)

	for (let i = 0; i < prints.length; i++) {
		await Print.create({
			"card_name": prints[i].card_name,
			"card_id": prints[i].card_id,
			"set_code": prints[i].set_code,
			"card_slot": prints[i].card_slot,
			"card_code": prints[i].card_code,
			"rarity": prints[i].rarity,
			"market_price": prints[i].market_price,
			"setId": prints[i].setId
		})
	}

	for (let i = 0; i < nicknames.length; i++) {
		await Nickname.create({
			"card_name": nicknames[i].card_name,
			"alius": nicknames[i].alius
		})
	}

	for (let i = 0; i < statuses.length; i++) {
		await Status.create({
			"name": statuses[i].name,
			"konami_code": statuses[i].konami_code,
			"current": statuses[i].current
		})
	}

	message.channel.send(`I created 3 sets (SS1, DOC, APC), ${prints.length} prints, ${nicknames.length} nicknames, and ${statuses.length} statuses. Please reset the bot for these changes to take full effect.`)

	if (!(await isNewUser(merchbotId))) return message.channel.send(`The Shop has already been initiated.`)
	await createPlayer(merchbotId, 'MerchBot', 'MerchBot#1002')
	await createProfile(merchbotId, 'none')

	return message.channel.send(`You initialized The Shop!`)
}

//ALIUS 
if (aliuscom.includes(cmd)) {
	if (!isAdmin(message.member) && !isMod(message.member) && !isAmbassador(message.member)) return message.channel.send(`You do not have permission to do that.`)

	const query = args.join(' ')
	if (!query) return message.channel.send(`Please specify a card you would like to create aliuses for.`)
	const card_name = await findCard(query, fuzzyPrints, fuzzyPrints2)
	if (!card_name) return message.channel.send(`Could not find card: "${query}".`)
	const card = await Card.findOne({ where: { name: card_name }})
	if (!card) return message.channel.send(`I could not find "${card_name}" in the Format Library database.`)

	const new_nicknames = await collectNicknames(message, card_name)
	const values = [...new_nicknames.values()]
	if (!values.length) return message.channel.send(`Sorry, time's up.`)

	for (let i = 0; i < values.length; i++) {
		const alius = values[i].content.toLowerCase()
		const old_nick = await Nickname.findOne({ where: { alius } })
		if (old_nick) {
			message.channel.send(`Error: "${alius}" is already being used for ${old_nick.card_name}.`)
			continue
		} else {
			const new_nick = await Nickname.create({
				alius,
				card_name
			})

			if (!new_nick) {
				message.channel.send(`Error: "${alius}" is already being used for ${old_nick.card_name}.`)
			} else {
				message.channel.send(`Created an alius for ${card_name}: ${alius}`)
			} 
		}

	}
}

//NICKNAME 
if (nicknamecom.includes(cmd)) {
	const query = args.join(' ')
	if (!query) return message.channel.send(`Please specify a card you would like to nickname.`)
	const card_name = await findCard(query, fuzzyCards, fuzzyCards2)
	if (!card_name) return message.channel.send(`Could not find card: "${query}".`)
	const card = await Card.findOne({ where: { name: card_name }})
	if (!card) return message.channel.send(`I could not find "${card_name}" in the Format Library database.`)

	const allNicknames = await Nickname.findAll({ where: { card_name: card_name } })
	if (!allNicknames) return message.channel.send(`Could not find any nicknames for: ${card_name}.`)
	const names_only =  allNicknames.map((nick) => nick.alius )
	
	return message.channel.send(`Nicknames for ${card_name}:\n${names_only.sort().join("\n")}`)
}




//PRINT 
if (cmd === `!print`) {
	if (!isAdmin(message.member)) return message.channel.send(`You do not have permission to do that.`)

	const info = await Info.findOne({ where: { element: 'set_to_print' }})
	const set_code = info ? info.status : null
	let set = set_code ? await Set.findOne({ where: { code: set_code }}) : await askForSetToPrint(message)
	if (!set) return message.channel.send(`Could not find set.`)
	const currentCount = await Print.count({ where: { set_code: set.code }})
	if (currentCount >= set.size) set = await askForSetToPrint(message)
	if (!set) return message.channel.send(`Could not find set.`)
	
	const query = args.join(' ')
	if (!query) return message.channel.send(`Please specify a card you would like to print.`)
	const card_name = await findCard(query, fuzzyCards, fuzzyCards2)
	if (!card_name) return message.channel.send(`Could not find card: "${query}".`)
	const card = await Card.findOne({ where: { name: card_name }})
	if (!card) return message.channel.send(`I could not find "${card_name}" in the Format Library database.`)

	const currentPrints = await Print.findAll({ where: { set_code: set.code }, order: [["card_slot", "DESC"]]})
	const card_slot = currentPrints.length ? currentPrints[0].card_slot + 1 : set.type === 'core' ? 0 : 1
	const zeros = card_slot < 10 ? '00' : card_slot < 100 ? '0' : ''
	const card_code = `${set.code}-${zeros}${card_slot}`

	const rarity_matrix = ["scr"]
	if (set.type === 'core') {
		for (let i = 0; i < set.commons; i++) {
			rarity_matrix.push("com")
		}
	
		for (let i = 0; i < set.rares; i++) {
			rarity_matrix.push("rar")
		}
	
		for (let i = 0; i < set.supers; i++) {
			rarity_matrix.push("sup")
		}
	
		for (let i = 0; i < set.ultras; i++) {
			rarity_matrix.push("ult")
		}
	
		for (let i = 1; i < set.secrets; i++) {
			rarity_matrix.push("scr")
		}
	}

	const rarity = set.type === 'core' ? rarity_matrix[card_slot] : await askForRarity(message, set, currentPrints)
	if (!rarity) return message.channel.send(`Something is wrong with the rarity.`)

	const market_price = rarity === 'com' ? 9 :
		rarity === 'rar' ? 40 :
		rarity === 'sup' ? 64 :
		rarity === 'ult' && set.code.startsWith("SS") ? 109 :
		rarity === 'ult' && set.code === "APC" ? 360 :
		rarity === 'ult' ? 184 :
		rarity === 'scr' ? 256 :
		20

	const print = {
		card_name: card.name,
		card_id: card.id,
		set_code: set.code,
		setId: set.id,
		card_code,
		card_slot,
		rarity,
		market_price
	}

	await Print.create(print)

	return message.channel.send(`Created a new print: ${eval(rarity)}${card_code} - ${card_name} - ${stardust}${market_price}`)
}


//SAVE_NICKNAMES
if (cmd === `!save_nicknames`) {
	if (!isAdmin(message.member)) return message.channel.send('You do not have permission to do that.')
	
	const nicknamesArr = []
	const allNicknames = await Nickname.findAll({ order: [["card_name", "ASC"]] })
	for (let i = 0; i < allNicknames.length; i++) {
		const nickname = allNicknames[i]
		const elem = {
			"alius": nickname.alius,
			"card_name": nickname.card_name
		}
		nicknamesArr.push(elem)
	}

	return fs.writeFile("./static/nicknames.json", JSON.stringify(nicknamesArr), (err) => { 
		if (err) console.log(err)
		else message.channel.send(`You saved ${allNicknames.length} nicknames(s) to a local file!`)
	})
}
 

//SAVE_STATUSES
if (cmd === `!save_statuses`) {
	if (!isAdmin(message.member)) return message.channel.send('You do not have permission to do that.')
	
	const statusArr = []
	const allStatuses = await Status.findAll({ order: [["name", "ASC"]] })
	for (let i = 0; i < allStatuses.length; i++) {
		const status = allStatuses[i]
		const elem = {
			"name": status.name,
			"konami_code": status.konami_code,
			"current": status.current
		}
		statusArr.push(elem)
	}

	return fs.writeFile("./static/statuses.json", JSON.stringify(statusArr), (err) => { 
		if (err) console.log(err)
		else message.channel.send(`You saved ${allStatuses.length} statuses to a local file!`)
	})
}
 

//SAVE_PRINTS
if (cmd === `!save_prints`) {
	if (!isAdmin(message.member)) return message.channel.send('You do not have permission to do that.')
	const printsArr = []
	const allPrints = await Print.findAll({ order: [["card_code", "ASC"]] })
	for (let i = 0; i < allPrints.length; i++) {
		const print = allPrints[i]
		const market_price = print.rarity === 'com' ? 9 :
			print.rarity === 'rar' ? 40 :
			print.rarity === 'sup' ? 64 :
			print.rarity === 'ult' && print.set_code.startsWith("SS") ? 109 :
			print.rarity === 'ult' && print.set_code === "APC" ? 360 :
			print.rarity === 'ult' ? 184 :
			print.rarity === 'scr' ? 256 :
			20

		const elem = {
			"card_name": print.card_name,
			"card_id": print.card_id,
			"set_code": print.set_code,
			"card_slot": print.card_slot,
			"card_code": print.card_code,
			"rarity": print.rarity,
			"market_price": market_price,
			"setId": print.setId
		}
		printsArr.push(elem)
	}

	return fs.writeFile("./static/prints.json", JSON.stringify(printsArr), (err) => { 
		if (err) console.log(err)
		else message.channel.send(`You saved ${allPrints.length} print(s) to a local file!`)
	})
}
 

//AVATAR 
if (pfpcom.includes(cmd)) {
	const person = message.mentions.users.first()
	const reply = person ? person.displayAvatarURL() : message.author.displayAvatarURL()
	return message.channel.send(reply)
}

//NAME
if (cmd === `!name`) {
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : null
	if (!playerId) return	
	const member = message.guild.members.cache.get(playerId)
	const player = await Player.findOne({ where: { id: playerId } })
	return message.channel.send(`The database name of ${member.user.username} is: ${player.name}.`)
}

//DUELINGBOOK NAME
if (dbcom.includes(cmd)) {
	const person = message.mentions.users.first()
	const playerId = person ? person.id : maid
	const player = await Player.findOne({ where: { id: playerId } })

	if (person && player.duelingBook) return message.channel.send(`${player.name}'s DuelingBook name is: ${player.duelingBook}.`)
	if (person && !player.duelingBook) return message.channel.send(`${player.name} does not have a DuelingBook name in our database.`)

	if (args.length) {
		player.duelingBook = args.join(' ')
		await player.save()
		return message.channel.send(`Your DuelingBook username has been set to: ${player.duelingBook}.`)
	} else if ( player.duelingBook) {
		return message.channel.send(`Your DuelingBook username is: ${player.duelingBook}.`)
	} else {
		return message.channel.send(`You do not have a DuelingBook username registered to our database. Please use the command **!db** followed by your DuelingBook username to register it.`)
	}
}

//STARTER OR START
if(startcom.includes(cmd)) {
	if (( message.channel === client.channels.cache.get(tournamentChannelId) && isMod(message.member) ) || isJazz(message.member) ) {
		const tournaments = await Tournament.findAll({ where: { state: 'pending' }, order: [['createdAt', 'ASC']] })
		const tournament = await selectTournament(message, tournaments, maid)
		if (!tournament) return message.channel.send(`Error: Could not find pending tournament.`)
        const { name, id, url } = tournament
		const unregistered = await Entry.findAll({ where: { participantId: null, tournamentId: id } })
        if (unregistered.length) return message.channel.send('One of more players has not been signed up. Please check the Database.')
		const entries = await Entry.findAll({ where: { tournamentId: id } })
		const set = await Set.findOne({ where: { code: 'CH1' } })
		if (!entries.length || !set) return message.channel.send(`Error: missing needed information.`)
		const { sheet1Data, sheet2Data } = await generateSheetData()
		const success = await seed(message, id)
		if (!success) return message.channel.send(`Error seeding tournament. Please try again or start it manually.`)

        await challongeClient.tournaments.start({
            id: id,
            callback: async (err) => {
                if (err) {
                    return message.channel.send(`Error: ${name} could not be initialized.`)
                } else {
                    tournament.state = 'underway'
					await tournament.save()
                    const spreadsheetId = await makeSheet(`${name} Deck Lists`, sheet1Data)
                    await addSheet(spreadsheetId, 'Summary')
                    await writeToSheet(spreadsheetId, 'Summary', 'RAW', sheet2Data)
                    //await uploadDeckFolder(name)
					
					if (entries.length > 8) {
						message.channel.send(`Please wait while I open some pack(s)... ${blue}`)
						for (let i = 0; i < entries.length; i++) {
							const playerId = entries[i].playerId
							await awardPack(message.channel, playerId, set, 1, false)
						}
					}

					return message.channel.send(`Let's go! Your tournament is starting now: https://challonge.com/${url} ${FiC}`)
                }
            }
        })
	} else {
		if(await isNewUser(maid)) await createPlayer(maid, message.author.username, message.author.tag)
		if(await hasProfile(maid)) return message.channel.send("You already received your first Starter Deck.")
	
		const set = await Set.findOne({ where: {
			code: 'DOC'
		}})
	
		if (!set) return message.channel.send(`Could not find set: "DOC".`)
	
		const filter = m => m.author.id === maid
		await message.channel.send(`Greetings, champ! Which deck would you like to start?\n- (1) Dinosaur\'s Power  ${dinosaur}\n- (2) Plant\'s Harmony ${plant}`)
		
		message.channel.awaitMessages(filter, {
			max: 1,
			time: 30000
		}).then(async collected => {
			const response = collected.first().content.toLowerCase()
			let starter
	
			if(response.includes('dino') || response.includes(dinosaur) || response.includes("(1)") || response === "1") {
				starter = 'dinosaur'
			} else if(response.includes('plant') || response.includes(plant) || response.includes === "(2)" || response === "2") {
				starter = 'plant'
			}
	
			if (!starter) return message.channel.send('You did not select a valid Starter Deck. Please type **!start** to try again.')
	
			await awardStarterDeck(maid, starter)
			await createProfile(maid, starter)
			message.member.roles.add(fpRole)
			message.channel.send(`Excellent choice, ${message.author.username}! ${legend}` +
			`\nYou received a copy of ${starter === "dinosaur" ? `Dinosaur's Power ${dinosaur}` : `Plant's Harmony ${plant}`} and the **Forged Players** role! ${wokeaf}` +
			`\nPlease wait while I open some packs... ${blue}`
			)
	
			const gotSecret = await awardPack(message.channel, maid, set, 16)
			await completeTask(message.channel, maid, 'e1')
			if (gotSecret) await completeTask(message.channel, maid, 'm4', 4000)
			return message.channel.send(`I wish you luck on your journey, new duelist! ${master}`)
		}).catch(err => {
			console.log(err)
			return message.channel.send(`Sorry, time's up.`)
		})
	}
}

//MUTE 
if(cmd === `!mute`) {
	if (!isAdmin(message.member) && !isMod(message.member)) return message.channel.send("You do not have permission to do that.")
	const member = message.mentions.members.first()
	if (!member) return message.channel.send(`Please tag the user you wish to mute.`)
	const mutedPeople = JSON.parse(fs.readFileSync('./static/muted.json'))['mutedPeople']

	if (!member.roles.cache.some(role => role.id === muteRole)) {
		member.roles.add(muteRole)

		const newMutes = mutedPeople
		newMutes.push(member.user.id)

		muted['mutedPeople'] = newMutes
		fs.writeFile("./static/muted.json", JSON.stringify(muted), (err) => { 
			if (err) console.log(err)
		})
		return message.channel.send(`${member.user.username} now has the Mute role.`)
	} else {
		return message.channel.send(`That user is already muted.`)
	}
}

//UNMUTE 
if(cmd === `!unmute`) {
	if (!isAdmin(message.member)) return message.channel.send("You do not have permission to do that.")
	const member = message.mentions.members.first()
	if (!member) return message.channel.send(`Please tag the user you wish to unmute.`)
	const mutedPeople = JSON.parse(fs.readFileSync('./static/muted.json'))['mutedPeople']

	if (member.roles.cache.some(role => role.id === muteRole)) {
		member.roles.remove(muteRole)

		const filteredMutes = mutedPeople.filter(id => id !== member.user.id)

		muted['mutedPeople'] = filteredMutes
		fs.writeFile("./static/muted.json", JSON.stringify(muted), (err) => { 
			if (err) console.log(err)
		})
		return message.channel.send(`${member.user.username} no longer has the Mute role.`)
	} else {
		return message.channel.send(`That user was not muted.`)
	}
}
    
//ROLE 
if (rolecom.includes(cmd)) {
	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	: message.channel === client.channels.cache.get(triviaChannelId) ? "Trivia"
	: null

	if (game === 'Arena') {
		if (!message.member.roles.cache.some(role => role.id === gamersRole)) {
			message.member.roles.add(gamersRole)
			return message.channel.send(`You now have the Gamers role.`)
		} else {
			message.member.roles.remove(gamersRole)
			return message.channel.send(`You no longer have the Gamers role.`)
		}
	} else if (game === 'Trivia') {
		if (!message.member.roles.cache.some(role => role.id === bookwormsRole)) {
			message.member.roles.add(bookwormsRole)
			return message.channel.send(`You now have the Bookworms role.`)
		} else {
			message.member.roles.remove(bookwormsRole)
			return message.channel.send(`You no longer have the Bookworms role.`)
		}
	} else {
		if (!message.member.roles.cache.some(role => role.id === fpRole)) {
			message.member.roles.add(fpRole)
			return message.channel.send(`You now have the Forged Players role.`)
		} else {
			message.member.roles.remove(fpRole)
			return message.channel.send(`You no longer have the Forged Players role.`)
		}
	}
}

//BOT USER GUIDE 
if (botcom.includes(cmd)) {
	const botEmbed = new Discord.MessageEmbed()
		.setColor('#8062cc')
		.setTitle('MerchBot - User Manual')
		.setDescription('A Manager Bot for Forged in Chaos.' )
		.setURL('https://forgedinchaos.com/')
		.setAuthor('Jazz#2704', 'https://i.imgur.com/wz5TqmR.png', 'https://formatlibrary.com/')
		.setThumbnail('https://i.imgur.com/p8H4dcu.png')
		.addField('Player Commands',
			`!start - Start the game.`
			+ `\n!prof (@user) - Post a player’s profile.`
			+ `\n!edit - Edit your profile.`
			+ `\n!diary (e, m, h, or l) - Check your Achievement Diaries.`
			+ `\n!db (name) - Set your DuelingBook name.`
			+ `\n!role - Add or remove the Forged Players role.`
		)
		.addField('Daily Commands',
			`!daily - Get daily rewards for checking in.`
			+ `\n!alc (card) - Convert a card into ${starchips}.`
		)
		.addField('Inventory Commands',
			`!inv (set or card) - View your Inventory.`
			+ `\n!checklist (set or card) - View your Checklist.`
			+ `\n!wallet (@user) - Post a player’s Wallet.`
			+ `\n!grind (num) - Convert some ${starchips} into ${stardust}.`
		)
		.addField('Shop Commands', 
			`!pack (set + num) - Buy 1 or more Packs.`
			+ `\n!box (set) - Buy a box of 24 Packs.`
			+ `\n!deck (name) - Buy a Starter Deck.`
			+ `\n!shop (card) - Check the shop value of a card.`
			+ `\n!buy (num + card) - Buy a card from The Shop.`
			+ `\n!sell (num + card) - Sell a card to The Shop.`
			+ `\n!dump (set) - Bulk sell cards to the The Shop.`
			+ `\n!barter (card) - Exchange vouchers for certain cards.`
			+ `\n!count - Post how many packs The Shop will open.`
			+ `\n!bid - Bid on new cards when The Shop is closed.`
			+ `\n!calc (set) - Post the resale value of a set.`
		)
		.addField('Marketplace Commands', 
			`!buy (@user + num + card + ${stardust}) - Buy a card from another player.`
			+ `\n!sell (@user + num + card + ${stardust}) - Sell a card to another player.`
			+ `\n!trade (@user + num + card) - Trade with another player.`
			+ `\n!binder (card) - Add or remove a card from your Binder.`
			+ `\n!wish (card) - Add or remove a card from your Wishlist.`
			+ `\n!search (card) - Search for cards in Binders and Wishlists.`
		)
		.addField('Duel Commands',
			`!stats (@user) - Post a player’s stats.`
			+ `\n!loss (@user) - Report a loss to another player.`
			+ `\n!top (number) - Post the server’s top rated players.`
			+ `\n!h2h (@user + @user) - Post the H2H record between 2 players.`
			+ `\n!undo - Undo the last loss if you made a mistake.`
			//+ `\n!legal - Check if your deck is legal.`
			+ `\n!banlist - View the Forbidden and Limited list.`
		)
		.addField('Tournament Commands',
			`!join - Register for a tournament.`
			+ `\n!resubmit - Resubmit your deck for a tournament.`
			+ `\n!drop - Drop from a tournament.`
			+ `\n!bracket - Post the bracket for a tournament.`
		)
		.addField('Minigame Commands', 
			`!join - Join the minigame queue.`
			+ `\n!leave - Leave the minigame queue.`
			+ `\n!q - Check the minigame queue.`
			//+ `\n!challenge (@user) - Challenge a player to the Gauntlet.`
		)
		.addField('Misc. Commands',
			`!bot - View the MerchBot User Manual.`
			+ (isAdmin(message.member) || isMod(message.member) ? `\n!mod - View the Moderator User Manual.` : '')
			+ `\n!info - Post information about a channel.`
			+ `\n!ref (@user) - Send a referral bonus to another player.`
		)
	
	message.author.send(botEmbed)
	return message.channel.send("I messaged you the MerchBot User Manual.")
}

//MOD USER GUIDE 
if (cmd === `!mod`) {
	if (!isMod(message.member) && !isAdmin(message.member)) return message.channel.send("You do not have permission to do that.")
	const botEmbed = new Discord.MessageEmbed()
		.setColor('#8062cc')
		.setTitle('MerchBot - Moderator User Manual')
		.setDescription('A Manager Bot for Forged in Chaos.' )
		.setURL('https://forgedinchaos.com/')
		.setAuthor('Jazz#2704', 'https://i.imgur.com/wz5TqmR.png', 'https://formatlibrary.com/')
		.setThumbnail('https://i.imgur.com/p8H4dcu.png')
		.addField('Mod-Only Game Commands',
			`!manual (@winner + @loser) - Manually record a match result.`
			+ `\n!undo - Undo the last match, even if you did not report it.`
			+ `\n!award (@user + num + item) - Award an item to a player.`
			+ `\n!steal (@user + num + item) - Steal an item from a player.`
			+ `\n!adjust (card) - Adjust the market price of a card.`
		)
		.addField('Mod-Only Tournament Commands',
			`!create (tournament name) - Create a new tournament.`
			+ `\n!signup (@user) - Directly add a player to the bracket.`
			+ `\n!remove (@user) - Remove a player from the bracket.`
			+ `\n!start - Start the next tournament.`
			+ `\n!noshow (@user) - Report a tournament no-show.`
			+ `\n!end - End the current tournament.`
		)
		.addField('Mod-Only Discipline Commands',
			`!mute (@user) - Mute a user.`
			+ `\n!unmute (@user) - Unmute a user.`
		)
		.addField('Admin-Only Commands', 
			`!census - Update the information of all players in the database.`
			+ `\n!recalc - Recaluate all player stats if needed.`
			+ `\n!grindall - Grind everyone\'s Starchips into Stardust.`
		)
		
	message.author.send(botEmbed)
	return message.channel.send("I messaged you the Moderator User Manual.")
}

//INFO
if(infocom.includes(cmd)) {
	if (mcid == duelRequestsChannelId) { 
		return message.channel.send(`${master} --- Ranked Play --- ${master}`+ 
		`\nThis is a Constructed Format based on the cards that you own.`+
		` You can check your Inventory with the **!inv** command.`+
		` After you build a deck, go to <#${duelRequestsChannelId}> and tag **@Forged Players** to find an opponent.`+
		`\n\nWe designed this game to reward effort.`+
		` The lower your rating, the more ${starchips} you'll earn.`+
		` This discourages farming and helps new players get better cards.`+
		` You can check ratings with the **!stats** command.`+
		`\n\nDisclaimer: Logs exist and admins can view inventories.`+
		` Playing with cards you don't own will not be tolerated.`+
		`\n\nIn addition, you must follow the Forbidden and Limited List.`, {files: ["https://i.imgur.com/R0TcKar.png"]})
	}

	if (mcid == marketPlaceChannelId) { 
		return message.channel.send(`${merchant} --- Market Place --- ${merchant}`+ 
		`\nTo get the cards you need in Forged in Chaos, you need to buy, sell, and trade.`+
		`\n\nPut cards in your Binder with **!bind**,`+
		` add cards to your Wishlist with **!wish**,`+
		` and find what you're looking for with **!search**.`+
		` Then come to the <#${marketPlaceChannelId}> to use the **!trade** command.`+
		`\n\nIf you can't find a trading partner, you can also browse the <#${shopChannelId}>.`+
		` Each card has two prices: the cost to buy and the price to sell.`+
		// ` Sick of using Discord? Visit the Shop online at https://forgedinchaos.com.`+
		`\n\nOn Tuesday and Friday nights, the Shop closes and opens some packs to restock.`+
		` During the Night, players use the **!bid** command in private.`+
		` The next Day, the Shop opens and the cards are sold to the highest bidders!`)
	}

	if (mcid == tournamentChannelId) { 
		return message.channel.send(`${legend} --- Tournaments --- ${legend}`+ 
		`\nTo sign up for a Tournament, simply come to the <#${tournamentChannelId}> and use the **!join** command.`+
		` The Tournament Organizer will handle the rest, so keep an eye out for their instructions.`+
		`\n\nAs a token of our appreciation, each tournament participant gets a Chaos Pack just for entering.`+
		` If you do well, you can win additional Chaos Packs and other prizes.`)
	}

	if (mcid == arenaChannelId) { 
		return message.channel.send(`${beast}   ${dinosaur}   ${fish}  ----- The Arena -----  ${plant}   ${reptile}   ${rock}`+ 
		`\nIn this channel, you get to test out the game's most powerful cards.`+
		` Simply align yourself with a Tribe and wage war at their side.`+
		`\n\nTo compete in the Arena, type **!join** in <#${arenaChannelId}>.`+
		` It requires 6 players to launch.`+
		` When it starts, you are loaned a 60-card deck, and you get 5 minutes to cut it down to no fewer than 40 cards.`+
		`\n\nThe Arena is a Round Robin, singles-games tournament.`+
		` Winners receive 4${starchips}, losers receive 2${starchips}.`+
		` To report a loss, type **!loss @opponent**, then wait for the next round.`+
		`\n\nThe Champion of the Arena walks away with an ${ult}Arena Prize Card according to their Tribe!`+
		` Everyone else receives Vouchers for their wins.`+
		` You can use **!barter** to exchange Vouchers for APCs.`)
	}

	if (mcid == gauntletChannelId) { 
		return message.channel.send(`${gloveEmoji} --- The Gauntlet --- ${gloveEmoji}`+ 
		`\nThe Gauntlet is the ultimate test of endurance and technical play.`+
		` In this 2-Player game-mode, you're asked to succeed with Starter Decks from every generation of Forged`+
		` from Fish's Ire ${fish} to Rock's Foundation ${rock}.`
		`\n\nTo enter the Gauntlet, simply use **!challenge @opponent** <#${gauntletChannelId}>.`+
		` Once a challenge is accepted, each player will receive a Starter Deck via DM.`+
		` The Gauntlet is separated into \"legs\" for each of the Starter Deck generations.`+
		`\n\nIn addition, there are a few Gauntlet-specific rules:`+
		` 1. The minimum deck requirement is 30 cards.`+
		` 2. Both players start the duel with 6000 LP.`+
		` 3. Losers must switch decks.`+
		` 4. Winners must keep their deck.`
		`\n\nGauntlet games are played as singles (not matches).`+
		` Losers must report in the <#639907734589800458> channel with the **!loss** command.`+
		` Winners receive 4" + starchip + " while losers receive 2" + starchip + ".`+
		` The winner of each leg receives a random Starter Deck " + ultEmoji + " from that generation.`+
		` Whoever wins the most legs wins the Gauntlet, and receives an additional 10" + starchip + ".`)
	}

	if (mcid == keeperChannelId) { 
		return message.channel.send(`${fire} --- Keeper of the Forge --- ${fire}`+ 
		`\nIn this channel, you get to `+
		` woof.`)	}

	if (mcid == triviaChannelId) { 
		return message.channel.send(`${stoned} --- Trivia Center --- ${stoned}`+ 
		`\nThe King of Games must also be a student of the game.`+
		` That means being familiar with the old Champions and their decks,`+
		` as well as historically important cards.`+
		` We'll also keep you on your toes with some non-Yu-Gi-Oh! questions, covering topics such as:`+
		` \n- TV, Anime, Film\n- Science\n- Geography\n- History\n- Pop Culture\n- FiC Facts (!)`+
		`\n\nTo enter a Trivia contest, simply find 4 friends and get everyone to type **!join**.`+
		` You will have 16 seconds to respond to each question via DM.`+
		` After 10 rounds, the top 2 bookworms split 6 ${starchips} for their performance.`+
		`\n\nAs you play more Trivia, your Profile will keep a record of your acumen.`+
		` There are 1000 total questions, so hit the books and then hit those keys! ${red}`)
	}
		
	if (mcid == draftChannelId) { 
		return message.channel.send(`${puzzle} --- Draft Room --- ${puzzle}`+ 
		`\nIn this channel, you get to test out the game's most powerful cards.`+
		` Simply align yourself with a Tribe and wage war at their side.`+
		`\n\nTo compete in the Arena, type **!join** in <#${arenaChannelId}>.`+
		` It requires 6 players to launch.`+
		` When it starts, you are loaned a 60-card deck, and you get 5 minutes to cut up to 20 cards.`+
		`\n\nThe Arena is a Round Robin, singles-games tournament.`+
		` Winners receive 6${starchips}, losers receive 2${starchips}.`+
		` To report a loss, type **!loss @opponent**, then wait for the next round.`+
		`\n\nThe Champion of the Arena walks away with an ${ult}Arena-exclusive Prize Card according to their Tribe!`+
		` Everyone else receives Vouchers for each game they won.`+
		` You can use **!barter "card"** to exchange 8 Vouchers for a Tribal prize card.`)
	}

	return message.channel.send(`Use this command in channels such as <#${duelRequestsChannelId}>, <#${marketPlaceChannelId}>, <#${tournamentChannelId}>, <#${arenaChannelId}> and <#${triviaChannelId}> to learn how those parts of the game work.`)
}


//DECK
if(deckcom.includes(cmd)) {
	if (mcid === arenaChannelId) {
		const deck = await getArenaSample(message, args[0])
		if (!deck) return
		if (!arenas.decks[deck]) return message.channel.send(`I do not recognize that tribe.`)

		return message.channel.send(`Arena ${capitalize(deck)} ${eval(deck)} Deck (staples in the side):\n<${arenas.decks[deck].url}>\n${arenas.decks[deck].screenshot}`)
	} else {
		const wallet = await Wallet.findOne( { where: { playerId: maid }, include: Player })
		const merchbot_wallet = await Wallet.findOne( { where: { playerId: merchbotId } })
		if (!wallet || !merchbot_wallet) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)

		const deck = await getShopDeck(message, args[0])
		const valid_decks = ["fish", "rock", "dinosaur", "plant"]
		if (!deck) return
		if (!valid_decks.includes(deck)) return message.channel.send(`Sorry, I do not have that deck for sale.`)

		const set = await Set.findOne({ where: { 
			code: decks[deck].set_code
		}})

		if (!set) return message.channel.send(`Could not find set with code "${decks[deck].set_code}".`)
		if (!set.for_sale) return message.channel.send(`Sorry, ${set.name} ${eval(set.emoji)} ${eval(set.alt_emoji)} is out of stock.`)
		const money = wallet[set.currency]
		if (money < set.unit_price) return message.channel.send(`Sorry, ${wallet.player.name}, you only have ${money}${eval(set.currency)} and ${decks[deck].name} ${eval(deck)} costs ${set.unit_price}${eval(set.currency)}.`)

		const filter = m => m.author.id === message.author.id
		const msg = await message.channel.send(`${wallet.player.name}, you have ${money}${eval(set.currency)}. Do you want to spend ${set.unit_price}${eval(set.currency)} on a copy of ${decks[deck].name} ${eval(deck)}?`)
		const collected = await msg.channel.awaitMessages(filter, {
			max: 1,
			time: 15000
		}).then(async collected => {
			if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send(`No problem. Have a nice day.`)
			const code = deck === 'plant' || deck === 'dinosaur' ? 'SS2' : 'SS1'
			const set = await Set.findOne({ where: { code: code } })
			set.unit_sales++
			await set.save()
			await awardStarterDeck(maid, deck)
			return message.channel.send(`Thank you for your purchase! I updated your Inventory with a copy of ${decks[deck].name} ${eval(deck)}.`)
		}).catch(err => {
			console.log(err)
			return message.channel.send(`Sorry, time's up.`)
		})
	}
}

//EDIT
if(cmd == `!edit`) {
	if (mcid !== botSpamChannelId &&
		mcid !== generalChannelId
	) return message.channel.send(`Please use this command in <#${botSpamChannelId}> or <#${generalChannelId}>.`)

	const profile = await Profile.findOne({ where: { playerId: maid } })
	if (!profile) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	const wantsToChangeColor = await askToChangeProfile(message, 'color')
	const color = wantsToChangeColor ? await getFavoriteColor(message) : ''
	if (color === 'unrecognized') message.channel.send(`Sorry, I do not recognize that color.`)
	
	const wantsToChangeQuote = await askToChangeProfile(message, 'quote')
	const new_quote = wantsToChangeQuote ? await getFavoriteQuote(message) : null
	const new_author = new_quote && wantsToChangeQuote ? await getFavoriteAuthor(message) : null

	const wantsToChangeCard = await askToChangeProfile(message, 'card')
	const new_card = wantsToChangeCard ? await getFavoriteCard(message, fuzzyPrints, fuzzyPrints2) : null

	if (color.startsWith("#")) profile.color = color
	if (new_quote) profile.quote = new_quote
	if (new_author) profile.author = new_author
	if (new_card === 'none') profile.card = null
	if (new_card && new_card !== 'none') profile.card = new_card
	await profile.save()
	if (new_card === 'not found') return
	if (!color.startsWith("#") && !new_quote && !new_card) return message.channel.send(`Not a problem. Have a nice day.`)

	return message.channel.send(`Your profile has been updated!`)
}

//CALCULATE
if(calccom.includes(cmd)) {
	if (!args.length) return message.channel.send(`Please specify a valid set code.`)
	const set_code = args[0].toUpperCase()
	const set = await Set.findOne({ where: { code: set_code } })
	if(!set) return message.channel.send(`I do not recognize the set code: "${set_code}"`)	
	const commons = await Print.findAll({ where: { set_code, rarity: "com" } })
	const rares = await Print.findAll({ where: { set_code, rarity: "rar" } })
	const supers = await Print.findAll({ where: { set_code, rarity: "sup" } })
	const ultras = await Print.findAll({ where: { set_code, rarity: "ult" } })
	const secrets = await Print.findAll({ where: { set_code, rarity: "scr" } })
	if(!commons.length && !rares.length && !supers.length && !ultras.length && !secrets.length) return message.channel.send(`Could not find prints for the set: "${set_code}"`)
	
	const avgMarketPrice = (array) => { 
		const total = array.reduce((a, b) => {
			return  { market_price: parseInt(a.market_price) + parseInt(b.market_price) }
		})
		
		return total.market_price / array.length
	}

	const avgComPrice = commons.length ? avgMarketPrice(commons) : 1
	const avgRarPrice = rares.length ? avgMarketPrice(rares) : 1
	const avgSupPrice = supers.length ? avgMarketPrice(supers) : 1
	const avgUltPrice = ultras.length ? avgMarketPrice(ultras) : 1
	const avgScrPrice = secrets.length ? avgMarketPrice(secrets) : 1
	const avgBoxPrice = (avgComPrice * set.commons_per_box) 
	+ (avgRarPrice * set.rares_per_box) 
	+ (avgSupPrice * set.supers_per_box) 
	+ (avgUltPrice * set.ultras_per_box) 
	+ (avgScrPrice * set.secrets_per_box) 

	return message.channel.send(`The average resale value of ${isVowel(set.name.charAt(0)) ? 'an' : 'a'} ${set.name} ${eval(set.emoji)} Box is ${avgBoxPrice}${stardust}.`)
}

//PROFILE
if(profcom.includes(cmd)) {
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
	const player = await Player.findOne({ 
		where: { 
			id: playerId
		},
		include: [Arena, Diary, Draft, Gauntlet, Knowledge, Profile, Trivia, Wallet]
	})

	if (!player && maid === playerId) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	if (!player && maid !== playerId) return message.channel.send(`That user is not in the database.`)

	const inventory = await Inventory.findAll({ 
		where: { 
			playerId
		},
		include: [Print]
	})

	const member = message.mentions.users.first()
	const avatar = member ? member.displayAvatarURL() : message.author.displayAvatarURL()
	const day = parseInt(player.profile.start_date.slice(-2))
	const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "November", "December"]
	const month = months[parseInt(player.profile.start_date.slice(5, 7)) - 1]
	const year = player.profile.start_date.slice(0, 4)
	const deck_name = player.profile.starter === 'fish' ? `Fish's Ire` : player.profile.starter === 'rock' ? `Rock's Foundation` : ''
	const card = await Card.findOne({ 
		where: { 
			name: player.profile.card
		}
	})
	
	const card_image = card ? `https://ygoprodeck.com/pics/${card.image}` : ''
	const quote = player.profile.quote ? `"${player.profile.quote}" -- ${player.profile.author}` : ''

	let networth = parseInt(player.wallet.starchips) + parseInt(player.wallet.stardust / 10)
	inventory.forEach(function(row) {
		networth += parseInt(row.print.market_price * row.quantity / 10)
	})

	let easy_tasks = 0
	let medium_tasks = 0
	let hard_tasks = 0
	let elite_tasks = 0
	let master_tasks = 0
	const diary_keys = Object.keys(player.diary.dataValues)
	diary_keys.forEach(function(key) {
		if (player.diary[key] === true) {
			if (key.startsWith('e')) easy_tasks++
			else if (key.startsWith('m')) medium_tasks++
			else if (key.startsWith('h')) hard_tasks++
			else if (key.startsWith('l')) elite_tasks++
			//else if (key.startsWith('s')) master_tasks++
		}
	})

	const easy_summary = easy_tasks / 12 === 1 ? `100% ${legend}` : `${Math.round(easy_tasks / 12 * 100)}%`
	const medium_summary = medium_tasks / 10 === 1 ? `100% ${legend}` : `${Math.round(medium_tasks / 10 * 100)}%`
	const hard_summary = hard_tasks / 8 === 1 ? `100% ${legend}` : `${Math.round(hard_tasks / 8 * 100)}%`
	const elite_summary = elite_tasks / 6 === 1 ? `100% ${legend}` : `${Math.round(elite_tasks / 6 * 100)}%`
	//const master_summary = master_tasks / 12 === 1 ? `100% ${legend}` : `${Math.round(master_tasks / 4 * 100)}%`
	//\nMaster Diary: ${master_summary}

	let correct_answers = 0
	const knowledge_keys = Object.keys(player.knowledge.dataValues)
	knowledge_keys.forEach(function(key) {
		if (key.startsWith('question') && player.knowledge[key]) correct_answers++
	})

	let beasts = ''
	let dinosaurs = ''
	let fishes = ''
	let plants = ''
	let reptiles = ''
	let rocks = ''
	for (let i = 0; i < player.profile.beast_wins && i < 3; i++) beasts += `${beast} `
	for (let i = 0; i < player.profile.dinosaur_wins && i < 3; i++) dinosaurs += `${dinosaur} `
	for (let i = 0; i < player.profile.fish_wins && i < 3; i++) fishes += `${fish} `
	for (let i = 0; i < player.profile.plant_wins && i < 3; i++) plants += `${plant} `
	for (let i = 0; i < player.profile.reptile_wins && i < 3; i++) reptiles += `${reptile} `
	for (let i = 0; i < player.profile.rock_wins && i < 3; i++) rocks += `${rock} `

	const win_rate = player.wins || player.losses ? `${Math.round(player.wins / (player.wins + player.losses) * 100)}%` : `N/A`
	//const keeper_win_rate = player.keeper_wins || player.keeper_losses ? `${Math.round(player.keeper_wins / (player.keeper_wins + player.keeper_losses) * 100)}%` : `N/A`
	//\nKeeper Wins: ${player.keeper_wins}\nKeeper Win Rate: ${keeper_win_rate}

	const profileEmbed = new Discord.MessageEmbed()
		.setColor(player.profile.color)
		.setThumbnail(avatar)
		.setTitle(`**${player.name}'s Player Profile**`)
		.setDescription(`Member Since: ${month} ${day}, ${year}${deck_name ? `\nFirst Deck: ${eval(player.profile.starter)} ${deck_name} ${eval(player.profile.starter)}` : ""}`)
		.addField('Diary Progress', `Easy Diary: ${easy_summary}\nMedium Diary: ${medium_summary}\nHard Diary: ${hard_summary}\nElite Diary: ${elite_summary}`)
		.addField('Ranked Stats', `Best Medal: ${getMedal(player.best_stats, true)}\nWin Rate: ${win_rate}\nHighest Elo: ${player.best_stats.toFixed(2)}\nVanquished Foes: ${player.vanquished_foes}\nLongest Streak: ${player.longest_streak}`)
		.addField('Arena Stats', `Beast Wins: ${player.profile.beast_wins} ${beasts}\nDinosaur Wins: ${player.profile.dinosaur_wins} ${dinosaurs}\nFish Wins: ${player.profile.fish_wins} ${fishes}\nPlant Wins: ${player.profile.plant_wins} ${plants}\nReptile Wins: ${player.profile.reptile_wins} ${reptiles}\nRock Wins: ${player.profile.rock_wins} ${rocks}`)
		.addField('Other Stats', `Net Worth: ${Math.floor(networth)}${starchips}\nTrade Partners: ${player.profile.trade_partners}\nTrivia Wins: ${player.profile.trivia_wins}\nTrivia Answers: ${correct_answers} out of 1000`)
		.setImage(card_image)
		.setFooter(quote)

	return message.channel.send(profileEmbed)
}

//REFERRAL
if(cmd === `!ref` || cmd === `!refer` || cmd === `!referral`) {
	const playerProfile = await Profile.findOne({ where: { playerId: maid }})
	const diary = await Diary.findOne({ where: { playerId: maid }})
	if (!playerProfile || !diary) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	if (playerProfile.referral) return message.channel.send(`You already gave a referral.`)

	const easy_complete = diary.e1 && diary.e2 && diary.e3 && diary.e4 && diary.e5 && diary.e6 && diary.e7 && diary.e8 && diary.e9 && diary.e10 && diary.e11 && diary.e12
	if (!easy_complete) return message.channel.send(`You must complete your Easy Diary before you are allowed to give a referral.`)

	if (!args.length) return message.channel.send(`No player specified.`)
	const referrer = message.mentions.users.first() ? message.mentions.users.first().id : null	
	if (!referrer || referrer.length < 17 || referrer.length > 18) return message.channel.send(`No player specified.`)

	const referringPlayer = await Player.findOne({ where: { id: referrer }, include: Wallet })
	if (!referringPlayer) return message.channel.send(`That person is not in the database.`)

	const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`Are you sure you want to give a referral to ${referringPlayer.name}?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send(`No problem. Have a nice day.`)

		referringPlayer.wallet.starchips += 15
		await referringPlayer.wallet.save()

		playerProfile.referral = true
		await playerProfile.save()

		return message.channel.send(`Okay! <@${referringPlayer.id}> was awarded 15${starchips} for a referral.`)
	}).catch(err => {
		console.log(err)
		return message.channel.send(`Sorry, time's up.`)
	})
}

//REFERRAL
if(cmd === `!reset_ref`) {
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : null	
	if (!playerId) return message.channel.send(`Please specify a player.`)
	if (!isAdmin(message.member)) return message.channel.send(`You do not have permission to do that.`)
	if (maid === playerId) return message.channel.send(`You cannot reset your own referral.`)
	const playerProfile = await Profile.findOne({ where: { playerId: playerId }})
	const diary = await Diary.findOne({ where: { playerId: playerId }})
	if (!playerProfile || !diary) return message.channel.send(`That player is not in the database.`)
	if (playerProfile.referral === false) return message.channel.send(`That player has not given a referral.`)

	const easy_complete = diary.e1 && diary.e2 && diary.e3 && diary.e4 && diary.e5 && diary.e6 && diary.e7 && diary.e8 && diary.e9 && diary.e10 && diary.e11 && diary.e12
	if (easy_complete) return message.channel.send(`That player has completed the Easy Diary. Their referral is valid.`)

	playerProfile.referral = false
	await playerProfile.save()

	return message.channel.send(`${message.mentions.users.first().username}'s referral was reset.`)
}

//SHOP
if (cmd === `!shop`) {
	if (!args.length) {
		const date = new Date()
		const day = date.getDay()
		const hours = date.getHours()
		const mins = date.getMinutes()
	
		let shopStatus
		let dayShopReverts
		let hourShopReverts
		let hoursLeftInPeriod
		const minsLeftInPeriod = 60 - mins
	
		if ((day === 6 && hours >= 14) || day === 0 || day === 1 || (day === 2 && hours < 16)) {
			shopStatus = 'open'
			dayShopReverts = 'Tuesday'
			hourShopReverts = '4pm'
			hoursLeftInPeriod = day === 6 ? 23 - hours + 24 * 2 + 16 :
				day === 0 ? 23 - hours + 24 + 16 :
				day === 1 ? 23 - hours + 16 :
				day === 2 ? 15 - hours :
				null
		} else if ((day === 2 && hours >= 16) || (day === 3 && hours < 8)) {
			shopStatus = 'closed'
			dayShopReverts = 'Wednesday'
			hourShopReverts = '8am'
			hoursLeftInPeriod = day === 2 ? 23 - hours + 8 :
				day === 3 ? 7 - hours :
				null
		} else if ((day === 3 && hours >= 8) || day === 4 || (day === 5 && hours < 22)) {
			shopStatus = 'open'
			dayShopReverts = 'Friday'
			hourShopReverts = '10pm'
			hoursLeftInPeriod = day === 3 ? 23 - hours + 24 + 22 :
				day === 4 ? 23 - hours + 22 :
				day === 5 ? 21 - hours :
				null
		} else if ((day === 5 && hours >= 22) || (day === 6 && hours < 14)) {
			shopStatus = 'closed'
			dayShopReverts = 'Saturday'
			hourShopReverts = '2pm'
			hoursLeftInPeriod = day === 5 ? 23 - hours + 14 :
				day === 6 ? 13 - hours  :
				null
		}
	
		return message.channel.send(`The Shop will ${shopStatus === 'open' ? 'close' : 'open'} in ${hoursLeftInPeriod} hours and ${minsLeftInPeriod} minutes, on ${dayShopReverts} at ${hourShopReverts} EST.`)
	} else {
		const query = args.join(' ')
		const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
		const card_name = await findCard(query, fuzzyPrints, fuzzyPrints2)
		const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
		const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name) : null
		const count = print && print.set_code === 'CH1' ? await Inventory.count({ where: { printId: print.id }}) : true
		if (!print || !count) return message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
		const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`
		const inv = await Inventory.findOne({ where: {
			printId: print.id,
			playerId: merchbotId,
			quantity: { [Op.gt]: 0 }
		}})

		const auction = await Auction.findOne({ where: { printId: print.id } })
		const market_price = print.market_price
		const selling_price = Math.ceil(market_price * 1.1)
		const buying_price = Math.ceil(market_price * 0.7)
		if (!inv) return message.channel.send(`${selling_price}${stardust}| ${buying_price}${stardust}-${card} - Out of Stock.`)
		return message.channel.send(`${selling_price}${stardust}| ${buying_price}${stardust}-${card} - ${inv.quantity}${auction ? ` - ${no}`: ''}`)
	}
}


//POPULATION
if (cmd === `!pop` || cmd === `!population`) {
	if (mcid !== botSpamChannelId &&
		mcid !== generalChannelId &&
		mcid !== marketPlaceChannelId
	) return message.channel.send(`Please use this command in <#${marketPlaceChannelId}>, <#${botSpamChannelId}> or <#${generalChannelId}>.`)

	if (!args.length) return message.channel.send(`Please specify a card.`)

	const query = args.join(' ')
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const card_name = await findCard(query, fuzzyPrints, fuzzyPrints2)
	const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }, include: Set}) : card_name ? await selectPrint(message, maid, card_name) : null
	const count = print && print.set_code === 'CH1' ? await Inventory.count({ where: { printId: print.id }}) : true
	if (!print || !count) return message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
	const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`
	const set = await Set.findOne({ where: { id: print.setId }})
	const invs = await Inventory.findAll({ where: {
		printId: print.id,
		quantity: { [Op.gt]: 0 }
	}})

	const quants = invs.map((i) => i.quantity)
	const total = quants.length ? quants.reduce((a, b) => a + b) : 0

	const equivalentPrints = await Print.findAll({ where: {
		set_code: print.set_code,
		rarity: print.rarity
	}})

	let total_equivalents = 0
	for (let i = 0; i < equivalentPrints.length; i++) {
		const eq_print = equivalentPrints[i]
		const eq_invs = await Inventory.findAll({ where: { 
			printId: eq_print.id,
			quantity: { [Op.gt]: 0 }  
		}})

		if (!eq_invs.length) continue
		const eq_quants = eq_invs.map((i) => i.quantity)
		const subtotal = eq_quants.reduce((a, b) => a + b)
		total_equivalents += subtotal
	}

	const avg_eq_pop = Math.round(10 * total_equivalents / equivalentPrints.length) / 10

	const merchbotinv = await Inventory.findOne({ where: {
		printId: print.id,
		quantity: { [Op.gt]: 0 },
		playerId: merchbotId
	}})

	const shop_pop = merchbotinv ? merchbotinv.quantity : 0
	const shop_percent = total ? `${Math.round(1000 * shop_pop / total) / 10}%` : 'N/A'
	return message.channel.send(`${ygocard} --- Population Stats --- ${ygocard}\n${card}\nTotal Population: ${total}\nAvg ${eval(print.rarity)} ${print.set_code} ${eval(set.emoji)} Pop: ${avg_eq_pop}\nShop Inventory: ${shop_percent}`)
}

//COUNT
if(cmd === `!count`) {
	if (mcid !== botSpamChannelId &&
		mcid !== generalChannelId &&
		mcid !== marketPlaceChannelId &&
		mcid !== gutterChannelId
	) return message.channel.send(`Please use this command in <#${marketPlaceChannelId}>, <#${botSpamChannelId}> or <#${generalChannelId}>.`)

	const allSetsForSale = await Set.findAll({ where: { for_sale: true }, order: [['createdAt', 'DESC']]})
	const results = [`In this cycle The Shop has sold:`]
	let weightedCount = 0
	let most_recent = false

	for (let i = 0; i < allSetsForSale.length; i++) {
		const set = allSetsForSale[i]
		if (set.type === 'core') {
			if (!most_recent) most_recent = 'core'
			if (set.currency === 'starchips') {
				weightedCount += set.unit_sales
			} else {
				weightedCount += (set.unit_sales / 2)
			}

			results.push(`- ${set.unit_sales} ${set.unit_sales === 1 ? 'Pack' : 'Packs'} of ${set.code} ${eval(set.emoji)}`)
		} else if (set.type === 'starter_deck') {
			if (set.currency === 'starchips') {
				weightedCount += (set.unit_sales * 5)
			} else {
				weightedCount += (set.unit_sales * 5 / 2)
			}

			results.push(`- ${set.unit_sales} Starter ${set.unit_sales === 1 ? 'Deck' : 'Decks'} ${eval(set.emoji)} ${eval(set.alt_emoji)}`)
		} else if (set.type === 'mini') {
			if (!most_recent) most_recent = 'mini'
			if (set.currency === 'starchips') {
				weightedCount += (set.unit_sales * 2 / 3)
			} else {
				weightedCount += (set.unit_sales / 3)
			}

			results.push(`- ${set.unit_sales} ${set.unit_sales === 1 ? 'Pack' : 'Packs'} of ${set.code} ${eval(set.emoji)}`)
		}
	}

	if (weightedCount < 1) weightedCount = 1 
    const core_count = most_recent === 'core' ?  Math.ceil(weightedCount / 8) : Math.ceil(weightedCount / 32)
    const mini_count = most_recent === 'core' ?  0 : Math.ceil(weightedCount * 9 / 64)
	results.push(`\nIf The Shop closed now, we'd open ${mini_count} ${mini_count === 1 ? 'Pack' : 'Packs'} of ORF ${ORF} and ${core_count} ${core_count === 1 ? 'Pack' : 'Packs'} of DOC ${DOC} to restock our inventory.`)
	return message.channel.send(results.join("\n"))
}

//CHART
if(cmd === `!chart`) {
	const allProfiles = await Profile.findAll()
	let beastWins = 0
	let dinosaurWins = 0
	let fishWins = 0
	let plantWins = 0
	let reptileWins = 0
	let rockWins = 0

	for (let i = 0; i < allProfiles.length; i++) {
		const profile = allProfiles[i]
		beastWins += profile.beast_wins
		dinosaurWins += profile.dinosaur_wins
		fishWins += profile.fish_wins
		plantWins += profile.plant_wins
		reptileWins += profile.reptile_wins
		rockWins += profile.rock_wins
	}

	const winsArr = [beastWins, dinosaurWins, fishWins, plantWins, reptileWins, rockWins]
	winsArr.sort((a, b) => b - a)
	const longest = winsArr[0]
	const totalWinners = beastWins + dinosaurWins + fishWins + plantWins + reptileWins + rockWins

	const beastBars = Math.round((beastWins / longest) * 10)
	const dinosaurBars = Math.round((dinosaurWins / longest) * 10)
	const fishBars = Math.round((fishWins / longest) * 10)
	const plantBars = Math.round((plantWins / longest) * 10)
	const reptileBars = Math.round((reptileWins / longest) * 10)
	const rockBars = Math.round((rockWins / longest) * 10)

	let beasts = beast
	let dinosaurs = dinosaur
	let fishes = fish
	let plants = plant
	let reptiles = reptile
	let rocks = rock

	for (let i = 1; i < beastBars; i++) beasts += beast
	for (let i = 1; i < dinosaurBars; i++) dinosaurs += dinosaur
	for (let i = 1; i < fishBars; i++) fishes += fish
	for (let i = 1; i < plantBars; i++) plants += plant
	for (let i = 1; i < reptileBars; i++) reptiles += reptile
	for (let i = 1; i < rockBars; i++) rocks += rock

	const arr = [
		[beastWins, `${beast} - ${beastWins} - ${beasts}`], 
		[dinosaurWins, `${dinosaur} - ${dinosaurWins} - ${dinosaurs}`], 
		[fishWins, `${fish} - ${fishWins} - ${fishes}`], 
		[plantWins, `${plant} - ${plantWins} - ${plants}`], 
		[reptileWins, `${reptile} - ${reptileWins} - ${reptiles}`], 
		[rockWins, `${rock} - ${rockWins} - ${rocks}`]
	]

	return message.channel.send(
		`There have been ${totalWinners} Arena winners. Conquest breakdown:\n` +
		arr.sort((a, b) => b[0] - a[0]).map((el) => el[1]).join("\n")
	)
}

//HISTORY
if (cmd === `!hist` || cmd === `!history`) {
	const query = args.join(' ')
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	const card_name = await findCard(query, fuzzyPrints, fuzzyPrints2)
	const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name) : null
	const count = print && print.set_code === 'CH1' ? await Inventory.findOne({ where: { printId: print.id } }) : true
	if (!print || !count) return message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
	const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`
	const item = print.card_code

	const trades = await Trade.findAll({ 
		where: { 
			item: item
		},
		order: [['createdAt', 'DESC']]
	})

	if (!trades.length) return message.channel.send(`There have been no trades involving ${card}.`)

	const transaction_ids = trades.slice(0, 10).map((t) => t.transaction_id)
	const summaries = []
	const map = {
		stardust: {
			card_name: null,
			card_code: null,
			rarity: 'stardust'
		},
		mushroom: {
			card_name: null,
			card_code: null,
			rarity: 'mushroom'
		},
		egg: {
			card_name: null,
			card_code: null,
			rarity: 'egg'
		},
		hook: {
			card_name: null,
			card_code: null,
			rarity: 'hook'
		},
		rose: {
			card_name: null,
			card_code: null,
			rarity: 'rose'
		},
		cactus: {
			card_name: null,
			card_code: null,
			rarity: 'cactus'
		},
		moai: {
			card_name: null,
			card_code: null,
			rarity: 'moai'
		}
	}

	const all_prints = await Print.findAll()

	for (let i = 0; i < all_prints.length; i++) {
		const print = all_prints[i]
		const card_code = print.card_code
		map[card_code] = {
			card_name: print.card_name,
			card_code: print.card_code,
			rarity: print.rarity
		}
	}

	const today = new Date()

	for (let i = 0; i < transaction_ids.length; i++) {
		const transaction_id = transaction_ids[i]
		const trade_components = await Trade.findAll({ where: { transaction_id: transaction_id } })
		if (!trade_components.length) continue
		const sender_name = trade_components[0].sender_name
		const receiver_name = trade_components[0].receiver_name
		const date = trade_components[0].createdAt
		const days = (today.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) / (1000*60*60*24)
		const summary = {
			days: days,
			p1_name: sender_name,
			p2_name: receiver_name,
			p1_receives: [],
			p2_receives: []
		}

		for (let j = 0; j < trade_components.length; j++) {
			const component = trade_components[j]
			const item = `${component.quantity}${eval(map[component.item].rarity)} ${map[component.item].card_code ? `${map[component.item].card_code} - ` : ''}${map[component.item].card_name || ''}`

			if (component.sender_name === summary.p1_name) summary.p2_receives.push(item)
			else summary.p1_receives.push(item)
		}
		
		summaries.push(summary)	
	}

	const results = []

	for (let i = 0; i < summaries.length; i++) {
		const summary = summaries[i]
		const days = summary.days
		results.push(`**Trade ${i+1}** - ${days ? days : 'Earlier Today'} ${days === 0 ? '' : days === 1 ? 'Day Ago' : 'Days Ago'}\n${summary.p1_name} received:\n${summary.p1_receives.join("\n")}\n${summary.p2_name} received:\n${summary.p2_receives.join("\n")}`)
	}

	message.channel.send(`I sent you the trade history you requested.`)
	for (let i = 0 ; i < results.length; i++) message.author.send(results[i])
	return
}

//TRADES
if(cmd === `!trades`) {
	if (mcid !== botSpamChannelId &&
		mcid !== gutterChannelId
	) return message.channel.send(`Please use this command in <#${botSpamChannelId}>.`)

	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
	const player = await Player.findOne({ where: { id: playerId } })
	if (!player) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)

	const trades = await Trade.findAll({ where: { 
		[Op.or]: [{ senderId: playerId }, { receiverId: playerId }]
	}})

	if (!trades.length) return message.channel.send(`You have not made any trades.`)

	const summaries = []
	const partners = []
	const transaction_ids = []
	const map = {
		stardust: {
			card_name: null,
			card_code: null,
			rarity: 'stardust'
		},
		mushroom: {
			card_name: null,
			card_code: null,
			rarity: 'mushroom'
		},
		egg: {
			card_name: null,
			card_code: null,
			rarity: 'egg'
		},
		hook: {
			card_name: null,
			card_code: null,
			rarity: 'hook'
		},
		rose: {
			card_name: null,
			card_code: null,
			rarity: 'rose'
		},
		cactus: {
			card_name: null,
			card_code: null,
			rarity: 'cactus'
		},
		moai: {
			card_name: null,
			card_code: null,
			rarity: 'moai'
		}
	}

	const all_prints = await Print.findAll()

	for (let i = 0; i < all_prints.length; i++) {
		const print = all_prints[i]
		const card_code = print.card_code
		map[card_code] = {
			card_name: print.card_name,
			card_code: print.card_code,
			rarity: print.rarity
		}
	}

	for (let i = 0; i < trades.length; i++) {
		const trade = trades[i]
		const transaction_id = trade.transaction_id
		const senderId = trade.senderId
		const receiverId = trade.receiverId
		const sender_name = trade.sender_name
		const receiver_name = trade.receiver_name
		const item = `${trade.quantity} ${eval(map[trade.item].rarity)} ${map[trade.item].card_code ? `${map[trade.item].card_code} - ` : ''}${map[trade.item].card_name || ''}`
		if (senderId !== maid && !partners.includes(senderId)) partners.push(senderId)
		if (receiverId !== maid && !partners.includes(receiverId)) partners.push(receiverId)

		if (transaction_ids.includes(transaction_id)) {
			const summary = summaries[summaries.length-1]
			if (summary.p1_name === sender_name) {
				summary.p2_receives.push(item)
			} else {
				summary.p1_receives.push(item)
			}
		} else {
			transaction_ids.push(transaction_id)
			const summary = {
				p1_name: sender_name,
				p2_name: receiver_name,
				p1_receives: [],
				p2_receives: [item]
			}
			summaries.push(summary)
		}
	}
	
	const players = []
	const results = []

	for (let i = 0; i < partners.length; i++) {
		const player = await Player.findOne({ where: { id: partners[i] }})
		if (!player) continue
		players.push(player.name)
	}

	for (let i = 0; i < summaries.length; i++) {
		const summary = summaries[i]
		results.push(`Trade ${i+1}:\n${summary.p1_name} received:\n${summary.p1_receives.join("\n")}\n\n${summary.p2_name} received:\n${summary.p2_receives.join("\n")}`)
	}

	players.sort()
	message.channel.send(`You have traded with the following players:\n${players.join("\n")}`)
	// message.channel.send(`${results.slice(0, 5).join("\n----------------\n") + "\n----------------"}`)
	// for (let i = 5 ; i < results.length; i += 5) {
	// 	message.channel.send(results.slice(i, i + 5).join("\n----------------\n") + "\n----------------")
	// }
	return
}



//RNG
if(cmd === `!rng`) {
	const num = parseInt(args[0])
	if(isNaN(num)) return message.channel.send(`Please specify an upper limit.`)
	const result = Math.floor((Math.random() * num) + 1)
	return message.channel.send(`You rolled a **${result}** with a ${num}-sided die.`)
}

//ROLL
if(cmd === `!roll` || cmd === `!die` || cmd === `!dice`) {
	const result = Math.floor((Math.random() * 6) + 1)
	return message.channel.send(`You rolled a **${result}** with a 6-sided die.`)
}

//FLIP
if(cmd === `!flip` || cmd === `!coin`) {
	 const coin = Math.floor((Math.random() * 2)) === 0 ? 'Heads' : 'Tails'
	 return message.channel.send(`Your coin flip landed on: **${coin}**!`)
}

//DAIRY
if(cmd === `!dairy`) return message.channel.send('🐮')

//SHIP
if(cmd === `!ship`) return message.channel.send('🚢')

//DIARY
if(cmd === `!diary`) {
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
	if (playerId !== maid && !isAdmin(message.member) && !isMod(message.member)) return message.channel.send(`You do not have permission to do that.`)
	const diary = await Diary.findOne({ where: { playerId: playerId } })
	if (!diary) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	const easy_complete = diary.e1 && diary.e2 && diary.e3 && diary.e4 && diary.e5 && diary.e6 && diary.e7 && diary.e8 && diary.e9 && diary.e10 && diary.e11 && diary.e12
	const medium_complete = diary.m1 && diary.m2 && diary.m3 && diary.m4 && diary.m5 && diary.m6 && diary.m7 && diary.m8 && diary.m9 && diary.m10
	const hard_complete = diary.h1 && diary.h2 && diary.h3 && diary.h4 && diary.h5 && diary.h6 && diary.h7 && diary.h8
	const elite_complete = diary.l1 && diary.l2 && diary.l3 && diary.l4 && diary.l5 && diary.l6
	//const master_complete = diary.s1 && diary.s2 && diary.s3 && diary.s4
	const input = message.mentions.users.first() && args[1] ? args[1].toLowerCase() :
				message.mentions.users.first() && !args[1] ? null :
				!message.mentions.users.first() && args[0] ? args[0].toLowerCase() :
				null

	const tasks = []
	let bonuses
	let diary_to_display

	if (input) {
		if(input === 'e' || input === 'ez' || input === 'easy' || input.startsWith('ea')) { diary_to_display = 'Easy'; bonuses = diaries.Easy.bonuses }
		else if(input === 'm' || input.startsWith('me') || input.startsWith('mo')) { diary_to_display = 'Medium'; bonuses = diaries.Medium.bonuses }
		else if(input === 'h' || input.startsWith('ha')) { diary_to_display = 'Hard'; bonuses = diaries.Hard.bonuses }
		else if(input === 'l' || input.startsWith('el')) { diary_to_display = 'Elite'; bonuses = diaries.Elite.bonuses }
		else return message.channel.send(`I do not recognize the "${input}" Diary.`)
		//else if(input === 's' || input.startsWith('ma')) { diary_to_display = 'Master'; bonuses = diaries.Master.bonuses }
	} else if (!diary_to_display) {
		//if (master_complete || elite_complete) { diary_to_display = 'Master'; bonuses = diaries.Master.bonuses }
		if (hard_complete) { diary_to_display = 'Elite'; bonuses = diaries.Elite.bonuses }
		else if (medium_complete) { diary_to_display = 'Hard'; bonuses = diaries.Hard.bonuses }
		else if (easy_complete) { diary_to_display = 'Medium'; bonuses = diaries.Medium.bonuses }
		else { diary_to_display = 'Easy'; bonuses = diaries.Easy.bonuses }
	}

	let score = 0
	
	if (diary_to_display === 'Easy') {
		if(diary.e1) { score++ ;tasks.push(`~~${diaries.Easy.e1}~~`)} else tasks.push(diaries.Easy.e1)
		if(diary.e2) { score++ ;tasks.push(`~~${diaries.Easy.e2}~~`)} else tasks.push(diaries.Easy.e2)
		if(diary.e3) { score++ ;tasks.push(`~~${diaries.Easy.e3}~~`)} else tasks.push(diaries.Easy.e3)
		if(diary.e4) { score++ ;tasks.push(`~~${diaries.Easy.e4}~~`)} else tasks.push(diaries.Easy.e4)
		if(diary.e5) { score++ ;tasks.push(`~~${diaries.Easy.e5}~~`)} else tasks.push(diaries.Easy.e5)
		if(diary.e6) { score++ ;tasks.push(`~~${diaries.Easy.e6}~~`)} else tasks.push(diaries.Easy.e6)
		if(diary.e7) { score++ ;tasks.push(`~~${diaries.Easy.e7}~~`)} else tasks.push(diaries.Easy.e7)
		if(diary.e8) { score++ ;tasks.push(`~~${diaries.Easy.e8}~~`)} else tasks.push(diaries.Easy.e8)
		if(diary.e9) { score++ ;tasks.push(`~~${diaries.Easy.e9}~~`)} else tasks.push(diaries.Easy.e9)
		if(diary.e10) { score++ ;tasks.push(`~~${diaries.Easy.e10}~~`)} else tasks.push(diaries.Easy.e10)
		if(diary.e11) { score++ ;tasks.push(`~~${diaries.Easy.e11}~~`)} else tasks.push(diaries.Easy.e11)
		if(diary.e12) { score++ ;tasks.push(`~~${diaries.Easy.e12}~~`)} else tasks.push(diaries.Easy.e12)
		score = Math.round(score / 12 * 100)
	}

	if (diary_to_display === 'Medium') {
		if(diary.m1) { score++ ;tasks.push(`~~${diaries.Medium.m1}~~`)} else tasks.push(diaries.Medium.m1)
		if(diary.m2) { score++ ;tasks.push(`~~${diaries.Medium.m2}~~`)} else tasks.push(diaries.Medium.m2)
		if(diary.m3) { score++ ;tasks.push(`~~${diaries.Medium.m3}~~`)} else tasks.push(diaries.Medium.m3)
		if(diary.m4) { score++ ;tasks.push(`~~${diaries.Medium.m4}~~`)} else tasks.push(diaries.Medium.m4)
		if(diary.m5) { score++ ;tasks.push(`~~${diaries.Medium.m5}~~`)} else tasks.push(diaries.Medium.m5)
		if(diary.m6) { score++ ;tasks.push(`~~${diaries.Medium.m6}~~`)} else tasks.push(diaries.Medium.m6)
		if(diary.m7) { score++ ;tasks.push(`~~${diaries.Medium.m7}~~`)} else tasks.push(diaries.Medium.m7)
		if(diary.m8) { score++ ;tasks.push(`~~${diaries.Medium.m8}~~`)} else tasks.push(diaries.Medium.m8)
		if(diary.m9) { score++ ;tasks.push(`~~${diaries.Medium.m9}~~`)} else tasks.push(diaries.Medium.m9)
		if(diary.m10) { score++ ;tasks.push(`~~${diaries.Medium.m10}~~`)} else tasks.push(diaries.Medium.m10)
		score = Math.round(score / 10 * 100)
	}

	if (diary_to_display === 'Hard') {
		if(diary.h1) { score++ ;tasks.push(`~~${diaries.Hard.h1}~~`)} else tasks.push(diaries.Hard.h1)
		if(diary.h2) { score++ ;tasks.push(`~~${diaries.Hard.h2}~~`)} else tasks.push(diaries.Hard.h2)
		if(diary.h3) { score++ ;tasks.push(`~~${diaries.Hard.h3}~~`)} else tasks.push(diaries.Hard.h3)
		if(diary.h4) { score++ ;tasks.push(`~~${diaries.Hard.h4}~~`)} else tasks.push(diaries.Hard.h4)
		if(diary.h5) { score++ ;tasks.push(`~~${diaries.Hard.h5}~~`)} else tasks.push(diaries.Hard.h5)
		if(diary.h6) { score++ ;tasks.push(`~~${diaries.Hard.h6}~~`)} else tasks.push(diaries.Hard.h6)
		if(diary.h7) { score++ ;tasks.push(`~~${diaries.Hard.h7}~~`)} else tasks.push(diaries.Hard.h7)
		if(diary.h8) { score++ ;tasks.push(`~~${diaries.Hard.h8}~~`)} else tasks.push(diaries.Hard.h8)
		score = Math.round(score / 8 * 100)
	}

	if (diary_to_display === 'Elite') {
		if(diary.l1) { score++ ;tasks.push(`~~${diaries.Elite.l1}~~`)} else tasks.push(diaries.Elite.l1)
		if(diary.l2) { score++ ;tasks.push(`~~${diaries.Elite.l2}~~`)} else tasks.push(diaries.Elite.l2)
		if(diary.l3) { score++ ;tasks.push(`~~${diaries.Elite.l3}~~`)} else tasks.push(diaries.Elite.l3)
		if(diary.l4) { score++ ;tasks.push(`~~${diaries.Elite.l4}~~`)} else tasks.push(diaries.Elite.l4)
		if(diary.l5) { score++ ;tasks.push(`~~${diaries.Elite.l5}~~`)} else tasks.push(diaries.Elite.l5)
		if(diary.l6) { score++ ;tasks.push(`~~${diaries.Elite.l6}~~`)} else tasks.push(diaries.Elite.l6)
		score = Math.round(score / 6 * 100)
	}

	// if (diary_to_display === 'Master') {
	// 	if(diary.s1) { score++ ;tasks.push(`~~${diaries.Master.s1}~~`)} else tasks.push(diaries.Master.s1)
	// 	if(diary.s2) { score++ ;tasks.push(`~~${diaries.Master.s2}~~`)} else tasks.push(diaries.Master.s2)
	// 	if(diary.s3) { score++ ;tasks.push(`~~${diaries.Master.s3}~~`)} else tasks.push(diaries.Master.s3)
	// 	if(diary.s4) { score++ ;tasks.push(`~~${diaries.Master.s4}~~`)} else tasks.push(diaries.Master.s4)
	// 	score = Math.round(score / 4 * 100)
	// }

	const diary_image = diary_to_display === 'Easy' ? 'https://i.imgur.com/bZpSKCG.jpg' :
		diary_to_display === 'Medium' ? 'https://i.imgur.com/deUr5ts.jpg' :
		diary_to_display === 'Hard' ? 'https://i.imgur.com/ZOAwIED.jpg' :
		diary_to_display === 'Elite' ? 'https://i.imgur.com/rGgVdBm.jpg' :
		'https://i.imgur.com/rGgVdBm.jpg'
		

	const diaryEmbed = new Discord.MessageEmbed()
		.setThumbnail(diary_image)
		.addField(`${score === 100 ? `${checkmark} `: ''}${diary_to_display} Diary - ${score}% Complete${score === 100 ? ` ${checkmark}` : ''}`, `${tasks.join("\n")}`)
		.addField(`${score === 100 ? `${legend} Bonus - Active ${legend}` : `Bonus`}`,`${bonuses.join("\n")}`)

	message.author.send(diaryEmbed);
	return message.channel.send(`I messaged you ${playerId === maid ? 'the' : `that player's`} ${diary_to_display} Diary. ${leatherbound}`)
}

//BINDER
if(bindercom.includes(cmd)) {
	if (mcid !== botSpamChannelId &&
		mcid !== generalChannelId &&
		mcid !== marketPlaceChannelId
	) return message.channel.send(`Please use this command in <#${marketPlaceChannelId}>, <#${botSpamChannelId}> or <#${generalChannelId}>.`)

	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
	const binder = await Binder.findOne({ where: { playerId }, include: Player})
	if (!binder && playerId === maid) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	if (!binder && playerId !== maid) return message.channel.send(`That user is not in the database.`)

	if (!args.length || playerId !== maid) {
		const prints = []
		
		for (let i = 0; i < 18; i++) {
			const card_code = binder[`slot_${i + 1}`]
			if (!card_code) continue
			const print = await Print.findOne({ where: { card_code }})
			prints.push(print)
		}

		prints.sort((a, b) => b.market_price - a.market_price)
		const results = prints.map((print) => `${eval(print.rarity)}${print.card_code} - ${print.card_name}`)

		if (!results.length) return message.channel.send(`${playerId === maid ? 'Your' : `${binder.player.name}'s`} binder is empty.`)
		else return message.channel.send(`**${binder.player.name}'s Binder**\n${results.join('\n')}`)
	}

	if (args[0] === 'e' || args[0] === 'clear' || args[0] === 'empty') {
		binder.slot_1 = null
		binder.slot_2 = null
		binder.slot_3 = null
		binder.slot_4 = null
		binder.slot_5 = null
		binder.slot_6 = null
		binder.slot_7 = null
		binder.slot_8 = null
		binder.slot_9 = null
		binder.slot_10 = null
		binder.slot_11 = null
		binder.slot_12 = null
		binder.slot_13 = null
		binder.slot_14 = null
		binder.slot_15 = null
		binder.slot_16 = null
		binder.slot_17 = null
		binder.slot_18 = null

		await binder.save()
		return message.channel.send(`Your binder has been emptied.`)
	}

	const inputs = args.join(' ').replace(/\s+/g, ' ').split(";").map((el) => el.trim())

	for (let j = 0; j < inputs.length; j++) {
		const query = inputs[j]
		const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
		const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
		const card_name = await findCard(query, fuzzyPrints, fuzzyPrints2)
		const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name) : null
		const count = print && print.set_code === 'CH1' ? await Inventory.findOne({ where: { printId: print.id } }) : true
		if (!print || !count) {
			message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
			continue
		}
		const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`

		const binderKeys = Object.keys(binder.dataValues)
		let foundCopy = false
		
		for (let i = 0; i < binderKeys.length; i++) {
			const key = binderKeys[i]
			if (binder[key] === print.card_code) {
				binder[key] = null
				await binder.save()
				message.channel.send(`You removed ${card} from your binder.`)
				foundCopy = true
				break
			}
		}

		if (foundCopy) continue

		const inv = await Inventory.findOne({ 
			where: { 
				printId: print.id,
				playerId: maid,
				quantity: { [Op.gt]: 0 }
			}
		})

		if (!inv) {
			message.channel.send(`You do not have any copies of ${card}.`)
			continue
		} 

		let success = false
		let i = 0
		while (!success && i < 18) {
			if (!binder[`slot_${i + 1}`]) {
				success = true
				binder[`slot_${i + 1}`] = print.card_code
				await binder.save()
				message.channel.send(`You added ${card} to your binder.`)
				completeTask(message.channel, maid, 'e7')
			} else {
				i++
			}
		}

		if (!success) return message.channel.send(`Your binder is full. Please remove a card or empty it to make room.`)
	}

	return 
}

//SEARCH
if(cmd === `!search`) {
	if (mcid !== botSpamChannelId &&
		mcid !== generalChannelId &&
		mcid !== marketPlaceChannelId
	) return message.channel.send(`Please use this command in <#${marketPlaceChannelId}>, <#${botSpamChannelId}> or <#${generalChannelId}>.`)

	if (!args.length) return message.channel.send(`Please specify a card to search for.`)

	const allBinders = await Binder.findAll({ include: Player })
	const allWishlists = await Wishlist.findAll({ include: Player })
	
	const membersMap = await message.guild.members.fetch()
	const memberIds = [...membersMap.keys()]
	const filtered_binders = allBinders.filter((binder) => memberIds.includes(binder.playerId))
	const filtered_wishlists = allWishlists.filter((wishlist) => memberIds.includes(wishlist.playerId))

	const query = args.join(' ')
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	const card_name = await findCard(query, fuzzyPrints, fuzzyPrints2)
	const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name) : null
	const count = print && print.set_code === 'CH1' ? await Inventory.findOne({ where: { printId: print.id } }) : true
	if (!print || !count) return message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
	const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`

	const binderResults = []
	const wishlistResults = []

	filtered_binders.forEach(function(binder) {
		for (let i = 0; i < 18; i++) {
			if (binder[`slot_${(i + 1)}`] === print.card_code) binderResults.push(binder.player.name)
		}
	})
	
	filtered_wishlists.forEach(function(wishlist) {
		for (let i = 0; i < 10; i++) {
			if (wishlist[`slot_${(i + 1)}`] === print.card_code) wishlistResults.push(wishlist.player.name)
		}
	})

	binderResults.sort()
	wishlistResults.sort()

	return message.channel.send(`Search results for ${card}:\n**Binders:**\n${binderResults.length ? binderResults.join('\n') : 'N/A'}\n\n**Wishlists:**\n${wishlistResults.length ? wishlistResults.join('\n') : 'N/A'}`)
}

//WISHLIST
if(wishlistcom.includes(cmd)) {
	if (mcid !== botSpamChannelId &&
		mcid !== generalChannelId &&
		mcid !== marketPlaceChannelId
	) return message.channel.send(`Please use this command in <#${marketPlaceChannelId}>, <#${botSpamChannelId}> or <#${generalChannelId}>.`)

	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
	const wishlist = await Wishlist.findOne({ where: { playerId }, include: Player})
	if (!wishlist && playerId === maid) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	if (!wishlist && playerId !== maid) return message.channel.send(`That user is not in the database.`)

	if (!args.length || playerId !== maid) {
		const prints = []
		
		for (let i = 0; i < 10; i++) {
			const card_code = wishlist[`slot_${i + 1}`]
			if (!card_code) continue
			const print = await Print.findOne({ where: { card_code }})
			prints.push(print)
		}

		prints.sort((a, b) => b.market_price - a.market_price)
		const results = prints.map((print) => `${eval(print.rarity)}${print.card_code} - ${print.card_name}`)

		if (!results.length) return message.channel.send(`${playerId === maid ? 'Your' : `${wishlist.player.name}'s`} wishlist is empty.`)
		else return message.channel.send(`**${wishlist.player.name}'s Wishlist**\n${results.join('\n')}`)
	}

	if (args[0] === 'e' || args[0] === 'clear' || args[0] === 'empty') {
		wishlist.slot_1 = null
		wishlist.slot_2 = null
		wishlist.slot_3 = null
		wishlist.slot_4 = null
		wishlist.slot_5 = null
		wishlist.slot_6 = null
		wishlist.slot_7 = null
		wishlist.slot_8 = null
		wishlist.slot_9 = null
		wishlist.slot_10 = null

		await wishlist.save()
		return message.channel.send(`Your wishlist has been emptied.`)
	}
	
	const inputs = args.join(' ').replace(/\s+/g, ' ').split(";").map((el) => el.trim())
	for (let j = 0; j < inputs.length; j++) {
		const query = inputs[j]
		const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
		const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
		const card_name = await findCard(query, fuzzyPrints, fuzzyPrints2)
		const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name) : null
		const count = print && print.set_code === 'CH1' ? await Inventory.findOne({ where: { printId: print.id } }) : true
		if (!print || !count) {
			message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
			continue
		}
		const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`

		const wishlistKeys = Object.keys(wishlist.dataValues)
		let foundCopy = false
		
		for (let i = 0; i < wishlistKeys.length; i++) {
			const key = wishlistKeys[i]
			if (wishlist[key] === print.card_code) {
				wishlist[key] = null
				await wishlist.save()
				message.channel.send(`You removed ${card} from your wishlist.`)
				foundCopy = true
				break
			}
		}

		if (foundCopy) continue

		let success = false
		let i = 0
		while (!success && i < 10) {
			if (!wishlist[`slot_${i + 1}`]) {
				success = true
				wishlist[`slot_${i + 1}`] = print.card_code
				await wishlist.save()
				message.channel.send(`You added ${card} to your wishlist.`)
			} else {
				i++
			}
		}

		if (!success) return message.channel.send(`Your wishlist is full. Please remove a card or empty it to make room.`)
	}

	return
}

//WALLET
if(cmd === `!wallet`) {
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
	const wallet = await Wallet.findOne({ where: { playerId }, include: Player})
	if (!wallet && playerId === maid) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	if (!wallet && playerId !== maid) return message.channel.send(`That user is not in the database.`)

	const results = [`${FiC} --- ${wallet.player.name}'s Wallet --- ${FiC}`]
	results.push(`Starchips: ${wallet.starchips}${starchips}`)
	results.push(`Stardust: ${wallet.stardust}${stardust}`)
	if (wallet.tickets) results.push(`Tickets: ${wallet.tickets} ${tix}`)
	if (wallet.credits) results.push(`Credits: ${wallet.credits} ${credits}`)
	if (wallet.mushroom) results.push(`Mushrooms: ${wallet.mushroom} ${mushroom}`)
	if (wallet.moai) results.push(`Moai: ${wallet.moai} ${moai}`)
	if (wallet.rose) results.push(`Roses: ${wallet.rose} ${rose}`)
	if (wallet.hook) results.push(`Hooks: ${wallet.hook} ${hook}`)
	if (wallet.egg) results.push(`Eggs: ${wallet.egg} ${egg}`)
	if (wallet.cactus) results.push(`Cacti: ${wallet.cactus} ${cactus}`)

	return message.channel.send(results.join('\n'))
}

//STATS
if (statscom.includes(cmd)) {
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
	const player = await Player.findOne({ where: { id: playerId } })
	const wallet = await Wallet.findOne({ where: { playerId } })

	if (!wallet && maid === playerId) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	if (!wallet && maid !== playerId) return message.channel.send(`That user is not in the database.`)

	const allRecords = await Player.findAll({ 
		where: {
			[Op.or]: [ { wins: { [Op.gt]: 0 } }, { losses: { [Op.gt]: 0 } } ]
		},
		order: [['stats', 'DESC']]
	})


	const membersMap = await message.guild.members.fetch()
	const memberIds = [...membersMap.keys()]
	const filtered_records = allRecords.filter((record) => memberIds.includes(record.id))
			
	const index = filtered_records.length ? filtered_records.findIndex(record => record.dataValues.id === playerId) : -1

	const rank = (index === -1 ? `N/A` : `#${index + 1} out of ${filtered_records.length}`)
	const medal = getMedal(player.stats, true)

	if (playerId === maid) completeTask(message.channel, maid, 'e4')

	return message.channel.send(`${FiC} --- Forged Player Stats --- ${FiC}`+
	`\nName: ${player.name}`+
	`\nMedal: ${medal}`+
	`\nStarchips: ${wallet.starchips}${starchips}`+
	`\nStardust: ${wallet.stardust}${stardust}`+
	`\nRanking: ${rank}`+
	`\nWins: ${player.wins}, Losses: ${player.losses}`+
	`\nElo Rating: ${player.stats.toFixed(2)}`)
}

//LOSS
if (losscom.includes(cmd)) {
	const oppo = message.mentions.users.first() ? message.mentions.users.first().id : null	
	if (!oppo) return message.channel.send(`No player specified.`)
	if (oppo === maid) return message.channel.send(`You cannot lose a match to yourself.`)

	const winner = message.guild.members.cache.get(oppo)
	const loser = message.guild.members.cache.get(maid)
	const winningPlayer = await Player.findOne({ where: { id: oppo }, include: [Diary, Wallet] })
	const losingPlayer = await Player.findOne({ where: { id: maid }, include: [Diary, Wallet] })

	if (winner.roles.cache.some(role => role.id === botRole)) return message.channel.send(`Sorry, Bots do not play Forged in Chaos... *yet*.`)
	if (oppo.length < 17 || oppo.length > 18) return message.channel.send(`To report a loss, type **!loss @opponent**.`)
	if (!losingPlayer) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	if (!winningPlayer) return message.channel.send(`That user is not in the database.`)
	
	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	//: message.channel === client.channels.cache.get(draftChannelId) ? "Draft"
	: message.channel === client.channels.cache.get(tournamentChannelId) ? "Tournament"
	: "Ranked"

	const hasArenaRole = isArenaPlayer(message.member)
	const hasTourRole = isTourPlayer(message.member)

	if (hasTourRole && game === 'Tournament') {
		const losingEntry = await Entry.findOne({ where: { playerId: losingPlayer.id }, include: Player })
		if (!losingEntry) return message.channel.send(`You are not an active member of any tournaments.`)

		const winningEntry = await Entry.findOne({ where: { playerId: winningPlayer.id }, include: Player })
		if (!winningEntry) return message.channel.send(`That person is not an active member of any tournaments.`)
		const tournamentId = losingEntry.tournamentId
		if (tournamentId !== winningEntry.tournamentId) return message.channel.send(`Sorry, you are not in the same tournament as ${winningPlayer.name}.`)

		const tournament = await Tournament.findOne({ 
			where: { 
				id: tournamentId
			}
		})

		if (!tournament) return message.channel.send(`Sorry I could not find your tournament in the database.`)
		if (tournament.state === 'pending') return message.channel.send(`Sorry, ${tournament.name} has not started yet.`)
		if (tournament.state !== 'underway') return message.channel.send(`Sorry, ${tournament.name} is not underway.`)
		const matchesArr = await getMatches(tournamentId)
		let matchId = false
		let scores = false
		for (let i = 0; i < matchesArr.length; i++) {
			const match = matchesArr[i].match
			if (match.state !== 'open') continue
			if (checkChallongePairing(match, losingEntry.participantId, winningEntry.participantId)) {
				matchId = match.id
				scores = match.player1_id === winningEntry.participantId ? "1-0" : "0-1"
				break
			}
		}
		
		const success = await putMatchResult(tournamentId, matchId, winningEntry.participantId, scores)
		if (!success) return message.channel.send(`Error: could not update bracket for ${tournament.name}.`)

		losingEntry.losses++
		await losingEntry.save()
		
		const diary = winningPlayer.diary
		const easy_complete = diary.e1 && diary.e2 && diary.e3 && diary.e4 && diary.e5 && diary.e6 && diary.e7 && diary.e8 && diary.e9 && diary.e10 && diary.e11 && diary.e12
		const bonus = easy_complete ? 1 : 0
		const date = new Date()
		date.setHours(0, 0, 0, 0)
		const d = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
		const m = (date.getMonth() + 1) < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1
		const y = date.getFullYear()
		const today = `${y}-${m}-${d}`
		const count = await Match.count({
			where: {
				winnerId: winningPlayer.id,
				game_mode: {
					[Op.or]: ['ranked', 'tournament']
				},
				createdAt: {
					[Op.gte]: today
				}
			}
		})
		const bonus2 = count ? 0 : 3
		const origStatsWinner = winningPlayer.stats
		const origStatsLoser = losingPlayer.stats
		const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origStatsWinner - origStatsLoser) / 400))))))
		const chipsWinner = Math.round((delta)) + bonus < 6 ? 6 : Math.round((delta)) > 20 ? 20 : Math.round((delta)) + bonus
		const chipsLoser = (origStatsLoser - origStatsWinner) < 72 ? 3 : (origStatsLoser - origStatsWinner) >=150 ? 1 : 2

		const previouslyDefeated = await Match.count({
			where: {
				winnerId: winningPlayer.id,
				loserId: losingPlayer.id
			}
		})

		winningPlayer.stats += delta
		winningPlayer.backup = origStatsWinner
		winningPlayer.wins++
		winningPlayer.current_streak++
		if (!previouslyDefeated) winningPlayer.vanquished_foes++
		if (winningPlayer.current_streak > winningPlayer.longest_streak) winningPlayer.longest_streak = winningPlayer.current_streak
		if (winningPlayer.stats > winningPlayer.best_stats) winningPlayer.best_stats = winningPlayer.stats
		await winningPlayer.save()

		winningPlayer.wallet.starchips += (chipsWinner + bonus2)
		await winningPlayer.wallet.save()

		losingPlayer.stats -= delta
		losingPlayer.backup = origStatsLoser
		losingPlayer.losses++
		losingPlayer.current_streak = 0
		await losingPlayer.save()

		losingPlayer.wallet.starchips += chipsLoser
		await losingPlayer.wallet.save()

		await Match.create({
			game_mode: "tournament",
			winner_name: winningPlayer.name,
			winnerId: winningPlayer.id,
			loser_name: losingPlayer.name,
			loserId: losingPlayer.id,
			delta: delta,
			chipsWinner: (chipsWinner + bonus2),
			chipsLoser: chipsLoser
		})

		completeTask(message.channel, winningPlayer.id, 'e3')
		completeTask(message.channel, winningPlayer.id, 'm8', 3000)
		if (winningPlayer.stats >= 530) completeTask(message.channel, winningPlayer.id, 'm1', 4000)
		if (winningPlayer.stats >= 590) completeTask(message.channel, winningPlayer.id, 'h1', 4000)
		if (winningPlayer.stats >= 650) completeTask(message.channel, winningPlayer.id, 'l1', 4000)
		if (winningPlayer.current_streak >= 3) completeTask(message.channel, winningPlayer.id, 'm2', 5000) 
		if (winningPlayer.vanquished_foes >= 20) completeTask(message.channel, winningPlayer.id, 'h2', 5000) 
		if (winningPlayer.current_streak >= 10) completeTask(message.channel, winningPlayer.id, 'l2', 5000)
		if (bonus2) setTimeout(() => message.channel.send(`<@${winningPlayer.id}>, Congrats! You earned an additional +3${starchips} for your first ranked win of the day! ${legend}`), 2000)
		message.channel.send(`${losingPlayer.name} (+${chipsLoser}${starchips}), your Tournament loss to ${winningPlayer.name} (+${chipsWinner}${starchips}) has been recorded.`)
		const updatedMatchesArr = await getMatches(tournamentId)
		const winnersNextMatch = findNextMatch(updatedMatchesArr, matchId, winningEntry.participantId)
		const winnersNextOpponent = winnersNextMatch ? await findNextOpponent(tournamentId, updatedMatchesArr, winnersNextMatch, winningEntry.participantId) : null
		const winnerMatchWaitingOn = winnersNextOpponent ? null : findOtherPreReqMatch(updatedMatchesArr, winnersNextMatch, matchId) 
		const winnerWaitingOnP1 = winnerMatchWaitingOn && winnerMatchWaitingOn.p1 && winnerMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournamentId, participantId: winnerMatchWaitingOn.p1 } }) : null
		const winnerWaitingOnP2 = winnerMatchWaitingOn && winnerMatchWaitingOn.p1 && winnerMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournamentId, participantId: winnerMatchWaitingOn.p2 } }) : null

		const loserEliminated = tournament.tournament_type === 'single elimination' ? true :
			tournament.tournament_type === 'double elimination' && losingEntry.losses >= 2 ? true :
			false

		if (loserEliminated) message.member.roles.remove(tourRole)

		const losersNextMatch = loserEliminated ? null : findNextMatch(updatedMatchesArr, matchId, losingEntry.participantId)
		const losersNextOpponent = losersNextMatch ? await findNextOpponent(tournamentId, updatedMatchesArr, losersNextMatch, winningEntry.participantId) : null
		const loserMatchWaitingOn = losersNextOpponent ? null : findOtherPreReqMatch(updatedMatchesArr, losersNextMatch, matchId) 
		const loserWaitingOnP1 = loserMatchWaitingOn && loserMatchWaitingOn.p1 && loserMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournamentId, participantId: loserMatchWaitingOn.p1 }, include: Player }) : null
		const loserWaitingOnP2 = loserMatchWaitingOn && loserMatchWaitingOn.p1 && loserMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournamentId, participantId: loserMatchWaitingOn.p2 }, include: Player }) : null

		setTimeout(() => {
			if (loserEliminated) return message.channel.send(`${losingPlayer.name}, You are eliminated from the tournament. Better luck next time!`)
			else if (losersNextOpponent) return message.channel.send(`New Match: <@${losingPlayer.id}> vs. <@${losersNextOpponent.playerId}>. Good luck to both duelists.`)
			else if (loserMatchWaitingOn && loserWaitingOnP1 && loserWaitingOnP2) {
				return message.channel.send(`${losingPlayer.name}, You are waiting for the result of ${loserWaitingOnP1.name} vs ${loserWaitingOnP2.name}.`)
			}
			else return message.channel.send(`${losingPlayer.name}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`)
		}, 2000)

		setTimeout(() => {
			if (!winnersNextMatch) return message.channel.send(`<@${winningPlayer.id}>, You won the tournament! Congratulations on your stellar performance! ${FiC}`)
			else if (winnersNextOpponent) return message.channel.send(`New Match: <@${winningPlayer.id}> vs. <@${winnersNextOpponent.playerId}>. Good luck to both duelists.`)
			else if (loserMatchWaitingOn && winnerWaitingOnP1 && winnerWaitingOnP2) {
				return message.channel.send(`${winningPlayer.name}, You are waiting for the result of ${winnerWaitingOnP1.name} vs ${winnerWaitingOnP2.name}.`)
			}
			else return message.channel.send(`${winningPlayer.name}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`)
		}, 4000)

		return
	} else if (!hasTourRole && game === 'Tournament') {
		return message.channel.send(`You do not have the Tournament Players role. Please report your loss in the appropriate channel.`)
	} else if (hasArenaRole && game === 'Arena') {
		const losingContestant = await Arena.findOne({ where: { playerId: maid }})
		if (!losingContestant) return message.channel.send(`You are not in the current Arena.`)
		const winningContestant = await Arena.findOne({ where: { playerId: oppo }})
		if (!winningContestant) return message.channel.send(`That player is not your Arena opponent.`)
		if (!losingContestant.is_playing || !winningContestant.is_playing) return message.channel.send(`Your match result was already recorded for this round of the Arena.`)

		const info = await Info.findOne({ where: { element: 'arena' } })
		if (!info) return message.channel.send(`Error: could not find game: "arena".`)
		
		const pairings = info.round === 1 ? [["P1", "P2"], ["P3", "P4"], ["P5", "P6"]] :
			info.round === 2 ? [["P1", "P3"], ["P2", "P5"], ["P4", "P6"]] :
			info.round === 3 ? [["P1", "P4"], ["P2", "P6"], ["P3", "P5"]] : 
			info.round === 4 ? [["P1", "P5"], ["P2", "P4"], ["P3", "P6"]] : 
			info.round === 5 ? [["P1", "P6"], ["P2", "P3"], ["P4", "P5"]] : 
			null
	
		let correct_pairing = info.round === 6 ? true : false
		if (!correct_pairing) {
			for (let i = 0; i < 3; i++) {
				if ((pairings[i][0] === losingContestant.contestant && 
						pairings[i][1] === winningContestant.contestant) ||
					(pairings[i][0] === winningContestant.contestant &&
						pairings[i][1] === losingContestant.contestant)) correct_pairing = true
			}
		}

		if (!correct_pairing) return message.channel.send(`That player is not your Arena opponent.`)

		winningPlayer.arena_wins++
		await winningPlayer.save()

		winningPlayer.wallet.starchips += 4
		await winningPlayer.wallet.save()

		losingPlayer.arena_losses++
		await losingPlayer.save()
	
		losingPlayer.wallet.starchips += 2
		await losingPlayer.wallet.save()

		losingContestant.is_playing = false
		await losingContestant.save()

		winningContestant.score++
		winningContestant.is_playing = false
		await winningContestant.save()

		await Match.create({ 
			game_mode: "arena",
			winner_name: winningPlayer.name,
			winnerId: winningPlayer.id,
			loser_name: losingPlayer.name,
			loserId: losingPlayer.id,
			delta: 0,
			chipsWinner: 4,
			chipsLoser: 2
		})

		message.channel.send(`${losingPlayer.name} (+2${starchips}), your Arena loss to ${winner.user.username} (+4${starchips}) has been recorded.`)
		return checkArenaProgress(info)
	} else if (!hasArenaRole && game === 'Arena') {
		return message.channel.send(`You do not have the Arena Players role. Please report your loss in the appropriate channel.`)
	} else if (hasArenaRole && game !== 'Arena') {
		return message.channel.send(`You have the Arena Players role. Please report your Arena loss in <#${arenaChannelId}>, or get a Moderator to help you.`)
	} else if (!hasArenaRole && game === 'Ranked') {
		const diary = winningPlayer.diary
		const easy_complete = diary.e1 && diary.e2 && diary.e3 && diary.e4 && diary.e5 && diary.e6 && diary.e7 && diary.e8 && diary.e9 && diary.e10 && diary.e11 && diary.e12
		const bonus = easy_complete ? 1 : 0
		const date = new Date()
		date.setHours(0, 0, 0, 0)
		const d = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
		const m = (date.getMonth() + 1) < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1
		const y = date.getFullYear()
		const today = `${y}-${m}-${d}`
		const count = await Match.count({
			where: {
				winnerId: winningPlayer.id,
				game_mode: {
					[Op.or]: ['ranked', 'tournament']
				},
				createdAt: {
					[Op.gte]: today
				}
			}
		})
		const bonus2 = count ? 0 : 3
		const origStatsWinner = winningPlayer.stats
		const origStatsLoser = losingPlayer.stats
		const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origStatsWinner - origStatsLoser) / 400))))))
		const chipsWinner = Math.round((delta)) + bonus < 6 ? 6 : Math.round((delta)) > 20 ? 20 : Math.round((delta)) + bonus
		const chipsLoser = (origStatsLoser - origStatsWinner) < 72 ? 3 : (origStatsLoser - origStatsWinner) >=150 ? 1 : 2

		const previouslyDefeated = await Match.count({
			where: {
				winnerId: winningPlayer.id,
				loserId: losingPlayer.id
			}
		})

		winningPlayer.stats += delta
		winningPlayer.backup = origStatsWinner
		winningPlayer.wins++
		winningPlayer.current_streak++
		if (!previouslyDefeated) winningPlayer.vanquished_foes++
		if (winningPlayer.current_streak > winningPlayer.longest_streak) winningPlayer.longest_streak = winningPlayer.current_streak
		if (winningPlayer.stats > winningPlayer.best_stats) winningPlayer.best_stats = winningPlayer.stats
		await winningPlayer.save()

		winningPlayer.wallet.starchips += (chipsWinner + bonus2)
		await winningPlayer.wallet.save()

		losingPlayer.stats -= delta
		losingPlayer.backup = origStatsLoser
		losingPlayer.losses++
		losingPlayer.current_streak = 0
		await losingPlayer.save()

		losingPlayer.wallet.starchips += chipsLoser
		await losingPlayer.wallet.save()

		await Match.create({
			game_mode: "ranked",
			winner_name: winningPlayer.name,
			winnerId: winningPlayer.id,
			loser_name: losingPlayer.name,
			loserId: losingPlayer.id,
			delta: delta,
			chipsWinner: (chipsWinner + bonus2),
			chipsLoser: chipsLoser
		})

		completeTask(message.channel, winningPlayer.id, 'e3')
		if (winningPlayer.stats >= 530) completeTask(message.channel, winningPlayer.id, 'm1', 3000)
		if (winningPlayer.stats >= 590) completeTask(message.channel, winningPlayer.id, 'h1', 3000)
		if (winningPlayer.stats >= 650) completeTask(message.channel, winningPlayer.id, 'l1', 3000)
		if (winningPlayer.current_streak === 3) completeTask(message.channel, winningPlayer.id, 'm2', 5000) 
		if (winningPlayer.vanquished_foes === 20) completeTask(message.channel, winningPlayer.id, 'h2', 5000) 
		if (winningPlayer.current_streak === 10) completeTask(message.channel, winningPlayer.id, 'l2', 5000)
		if (bonus2) setTimeout(() => message.channel.send(`<@${winningPlayer.id}>, Congrats! You earned an additional +3${starchips} for winning your 1st Ranked Match of the day! ${legend}`), 2000)
		return message.channel.send(`${losingPlayer.name} (+${chipsLoser}${starchips}), your loss to ${winningPlayer.name} (+${chipsWinner}${starchips}) has been recorded.`)
	}
}

//MANUAL
if (manualcom.includes(cmd)) {
	if (!isAdmin(message.member) && !isMod(message.member)) return message.channel.send(`You do not have permission to do that.`)

	const usersMap = message.mentions.users
	const userIds = [...usersMap.keys()]	
	const winnerId = message.mentions.users.first() ? message.mentions.users.first().id : null	
	const loserId = userIds.length > 1 ? userIds[1] : null	
	if (!winnerId || !loserId) return message.channel.send(`Please specify 2 players.`)
	if (winnerId === loserId) return message.channel.send(`Please specify 2 different players.`)

	const winner = message.guild.members.cache.get(winnerId)
	const loser = message.guild.members.cache.get(loserId)
	const winningPlayer = await Player.findOne({ where: { id: winnerId }, include: [Diary, Wallet] })
	const losingPlayer = await Player.findOne({ where: { id: loserId }, include: [Diary, Wallet] })

	if (winner.roles.cache.some(role => role.id === botRole) || loser.roles.cache.some(role => role.id === botRole)) return message.channel.send(`Sorry, Bots do not play Forged in Chaos... *yet*.`)
	if (!losingPlayer) return message.channel.send(`Sorry, ${loser.user.username} is not in the database.`)
	if (!winningPlayer) (`Sorry, ${winner.user.username} was not in the database.`)

	if (winner.roles.cache.some(role => role.id === arenaRole) || loser.roles.cache.some(role => role.id === arenaRole)) {
		if (message.channel !== client.channels.cache.get(arenaChannelId)) return message.channel.send(`Please report this loss in: <#${arenaChannelId}>`)
		
		const losingContestant = await Arena.findOne({ where: { playerId: loserId }})
		if (!losingContestant) return message.channel.send(`You are not in the current Arena.`)
		const winningContestant = await Arena.findOne({ where: { playerId: winnerId }})
		if (!winningContestant) return message.channel.send(`That player is not your Arena opponent.`)

		const info = await Info.findOne({ where: { element: 'arena' } })
		if (!info) return message.channel.send(`Error: could not find game: "arena".`)

		const pairings = info.round === 1 ? [["P1", "P2"], ["P3", "P4"], ["P5", "P6"]] :
            info.round === 2 ? [["P1", "P3"], ["P2", "P5"], ["P4", "P6"]] :
            info.round === 3 ? [["P1", "P4"], ["P2", "P6"], ["P3", "P5"]] : 
            info.round === 4 ? [["P1", "P5"], ["P2", "P4"], ["P3", "P6"]] : 
            info.round === 5 ? [["P1", "P6"], ["P2", "P3"], ["P4", "P5"]] : 
            null
	
		if (pairings) {
			let correct_pairing = false
			for (let i = 0; i < 3; i++) {
				if ((pairings[i][0] === losingContestant.contestant && 
						pairings[i][1] === winningContestant.contestant) ||
					(pairings[i][0] === winningContestant.contestant &&
						pairings[i][1] === losingContestant.contestant)) correct_pairing = true
			}

			if (!correct_pairing) return message.channel.send(`That player is not your Arena opponent.`)
		}
		
		losingPlayer.arena_losses++
		await losingPlayer.save()

		losingPlayer.wallet.starchips += 2
		await losingPlayer.wallet.save()
	
		losingContestant.is_playing = false
		await losingContestant.save()

		winningPlayer.arena_wins++
		await winningPlayer.save()

		winningPlayer.wallet.starchips += 4
		await winningPlayer.wallet.save()

		winningContestant.score++
		winningContestant.is_playing = false
		await winningContestant.save()

		await Match.create({
			game_mode: "arena",
			winner_name: winningPlayer.name,
			winnerId: winningPlayer.id,
			loser_name: losingPlayer.name,
			loserId: losingPlayer.id,
			delta: 0,
			chipsWinner: 4,
			chipsLoser: 2
		})

		message.channel.send(`A manual Arena loss by ${losingPlayer.name} (+2${starchips}) to ${winningPlayer.name} (+4${starchips}) has been recorded.`)
		return checkArenaProgress(info)
	} else {
		const diary = winningPlayer.diary
		const easy_complete = diary.e1 && diary.e2 && diary.e3 && diary.e4 && diary.e5 && diary.e6 && diary.e7 && diary.e8 && diary.e9 && diary.e10 && diary.e11 && diary.e12
		const bonus = easy_complete ? 1 : 0
		const origStatsWinner = winningPlayer.stats
		const origStatsLoser = losingPlayer.stats
		const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origStatsWinner - origStatsLoser) / 400))))))
		const chipsWinner = Math.round((delta)) + bonus < 6 ? 6 : Math.round((delta)) > 20 ? 20 : Math.round((delta)) + bonus
		const chipsLoser = (origStatsLoser - origStatsWinner) < 72 ? 3 : (origStatsLoser - origStatsWinner) >=150 ? 1 : 2

		const previouslyDefeated = await Match.count({
			where: {
				winnerId: winningPlayer.id,
				loserId: losingPlayer.id
			}
		})

		winningPlayer.stats += delta
		winningPlayer.backup = origStatsWinner
		winningPlayer.wins++
		winningPlayer.current_streak++
		if (!previouslyDefeated) winningPlayer.vanquished_foes++
		if (winningPlayer.current_streak > winningPlayer.longest_streak) winningPlayer.longest_streak = winningPlayer.current_streak
		if (winningPlayer.stats > winningPlayer.best_stats) winningPlayer.best_stats = winningPlayer.stats
		await winningPlayer.save()
		
		losingPlayer.stats -= delta
		losingPlayer.backup = origStatsLoser
		losingPlayer.losses++
		losingPlayer.current_streak = 0
		await losingPlayer.save()
	
		winningPlayer.wallet.starchips += chipsWinner
		await winningPlayer.wallet.save()
	
		losingPlayer.wallet.starchips += chipsLoser
		await losingPlayer.wallet.save()
	
		await Match.create({ 
			game: "ranked",
			winner_name: winningPlayer.name,
			winnerId: winningPlayer.id,
			loser_name: losingPlayer.name,
			loserId: losingPlayer.id,
			delta: delta,
			chipsWinner: chipsWinner,
			chipsLoser: chipsLoser
		})

		completeTask(message.channel, winningPlayer.id, 'e3')
		if (winningPlayer.stats >= 530) completeTask(message.channel, winningPlayer.id, 'm1', 3000)
		if (winningPlayer.stats >= 590) completeTask(message.channel, winningPlayer.id, 'h1', 3000)
		if (winningPlayer.stats >= 650) completeTask(message.channel, winningPlayer.id, 'l1', 3000)
		if (winningPlayer.current_streak === 3) completeTask(message.channel, winningPlayer.id, 'm2', 5000) 
		if (winningPlayer.vanquished_foes === 20) completeTask(message.channel, winningPlayer.id, 'h2', 5000) 
		if (winningPlayer.current_streak === 10) completeTask(message.channel, winningPlayer.id, 'l2', 5000)
		return message.channel.send(`A manual loss by ${losingPlayer.name} (+${chipsLoser}${starchips}) to ${winningPlayer.name} (+${chipsWinner}${starchips}) has been recorded.`)
	}
}

//NO SHOW
if (noshowcom.includes(cmd)) {
	if (!isMod(message.member)) return message.channel.send('You do not have permission to do that.')
	const noShowId = message.mentions.users.first() ? message.mentions.users.first().id : null	
	const noShowMember = message.mentions.members.first() || null	
	if (!noShowId) return message.channel.send("Please specify a player.")
	if (!noShowMember) return message.channel.send("Could not find member in the server.")
	const noShowPlayer = await Player.findOne({ where: { id: noShowId } })
	if (!noShowPlayer) return message.channel.send(`That user is not in the database.`)

	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	: message.channel === client.channels.cache.get(draftChannelId) ? "Draft"
	: message.channel === client.channels.cache.get(tournamentChannelId) ? "Tournament"
	: null

	if (!game) return message.channel.send(`Try using **${cmd}** in channels like: <#${arenaChannelId}>.`)
	
	if (game === 'Tournament') {
		const noShowEntry = await Entry.findOne({ where: { playerId: noShowId }, include: Player })
	
		if (!noShowEntry || !noShow.roles.cache.some(role => role.id === tourRole)) return message.channel.send(
			`Sorry, ${noShow.user.username} is not in the tournament.`
			)
	
		const tournaments = await Tournament.findAll({ order: [['createdAt', 'ASC']] })
		if (!tournaments.length) return message.channel.send(`There is no active tournament.`)
	
		const tournament = await selectTournament(message, tournaments, maid)
		if (!tournament) return message.channel.send(`Please select a valid tournament.`)
		
		return challongeClient.matches.index({
			id: tournament.id,
			callback: (err, data) => {
				if (err) {
					return message.channel.send(`Could not find tournament: "${tournament.name}".`)
				} else {
					return findOpponent(message, data, noShow, noShowEntry)
				}
			}
		}) 
	} else if (game === 'Arena') {
		if (!noShowMember.roles.cache.some(role => role.id === arenaRole)) return message.channel.send(`${noShowPlayer.name} does not appear to have the Arena Players role.`)
			
		const noShowContestant = await Arena.findOne({ where: { playerId: noShowId }})
		if (!noShowContestant) return message.channel.send(`That player is not in the current Arena.`)

		const info = await Info.findOne({ where: { element: 'arena' } })
		if (!info) return message.channel.send(`Error: could not find game: "arena".`)

		const pairings = info.round === 1 ? [["P1", "P2"], ["P3", "P4"], ["P5", "P6"]] :
			info.round === 2 ? [["P1", "P3"], ["P2", "P5"], ["P4", "P6"]] :
			info.round === 3 ? [["P1", "P4"], ["P2", "P6"], ["P3", "P5"]] : 
			info.round === 4 ? [["P1", "P5"], ["P2", "P4"], ["P3", "P6"]] : 
			info.round === 5 ? [["P1", "P6"], ["P2", "P3"], ["P4", "P5"]] : 
			null
	
		let PX = false

		if (pairings) {
			for (let i = 0; i < 3; i++) {
				if (pairings[i][0] === noShowContestant.contestant) PX = pairings[i][1]
				if (PX) break
				if (pairings[i][1] === noShowContestant.contestant) PX = pairings[i][0]
				if (PX) break
			}

			if (!PX) return message.channel.send(`Could not find Arena opponent. Please try **!manual**.`)
		}
		
		const winningContestant = await Arena.findOne({ where: { contestant: PX }})
		if (!winningContestant) return message.channel.send(`Could not find Arena opponent. Please try **!manual**.`)
			
		const winningPlayer = await Player.findOne({ where: { id: winningContestant.playerId }, include: Wallet })
		if (!winningPlayer) return message.channel.send(`Could not find Arena opponent in the database.`)
	
		noShowContestant.is_playing = false
		await noShowContestant.save()

		winningPlayer.wallet.starchips += 4
		await winningPlayer.wallet.save()

		winningContestant.score++
		winningContestant.is_playing = false
		await winningContestant.save()

		message.channel.send(`A no-show by ${noShowPlayer.name} (+0${starchips}) to ${winningPlayer.name} (+4${starchips}) has been recorded.`)
		return checkArenaProgress(info)
	}
	
}

//H2H
if (h2hcom.includes(cmd)) {
	const game_mode = message.channel === client.channels.cache.get(arenaChannelId) ? 'arena' :
		message.channel === client.channels.cache.get(keeperChannelId) ? 'keeper' :
		message.channel === client.channels.cache.get(draftChannelId) ? 'draft' :
		'ranked'

	const usersMap = message.mentions.users
	const userIds = [...usersMap.keys()]
	const player1Id = message.mentions.users.first() ? message.mentions.users.first().id : null	
	const player2Id = userIds.length > 1 ? userIds[1] : maid	

	if (!player1Id) return message.channel.send("Please specify at least 1 other player.")
	if (player1Id === player2Id) return message.channel.send(`Please specify 2 different players.`)

	const player1 = await Player.findOne({ where: { id: player1Id } })
	const player2 = await Player.findOne({ where: { id: player2Id } })
	
	if (!player1 && player2Id === maid) return message.channel.send(`That user is not in the database.`)
	if (!player1 && player2Id !== maid) return message.channel.send(`The first user is not in the database.`)
	if (!player2 && player2Id === maid) return message.channel.send(`You are not in the database.`)
	if (!player2 && player2Id !== maid) return message.channel.send(`The second user is not in the database.`)

	const p1Wins = game_mode !== 'ranked' ? await Match.count({ where: { winnerId: player1Id, loserId: player2Id, game_mode: game_mode } }) :
		await Match.count({ where: { winnerId: player1Id, loserId: player2Id, [Op.or]: [{ game_mode: 'ranked' }, { game_mode: 'tournament' }] } })
		
	const p2Wins = game_mode !== 'ranked' ? await Match.count({ where: { winnerId: player2Id, loserId: player1Id, game_mode: game_mode } }) :
		await Match.count({ where: { winnerId: player2Id, loserId: player1Id, [Op.or]: [{ game_mode: 'ranked' }, { game_mode: 'tournament' }] } })
	
	return message.channel.send(`${FiC} --- H2H ${capitalize(game_mode)} Results --- ${FiC}`+
	`\n${player1.name} has won ${p1Wins}x`+
	`\n${player2.name} has won ${p2Wins}x`)
}

//UNDO
if (undocom.includes(cmd)) {
	const game_mode = message.channel === client.channels.cache.get(arenaChannelId) ? 'arena' :
		message.channel === client.channels.cache.get(keeperChannelId) ? 'keeper' :
		message.channel === client.channels.cache.get(draftChannelId) ? 'draft' :
		'ranked'

	const allMatches = await Match.findAll({ where: { game_mode } })
	const lastMatch = allMatches.slice(-1)[0]
	const winnerId = lastMatch.winnerId
	const loserId = lastMatch.loserId
	const winningPlayer = await Player.findOne({ where: { id: winnerId }, include: Wallet })
	const losingPlayer = await Player.findOne({ where: { id: loserId }, include: Wallet })
	
	const prompt = (isMod(message.member) ? '' : ' Please get a Moderator to help you.')
	if (maid !== loserId && !isMod(message.member)) return message.channel.send(`You did not participate in the last recorded match.${prompt}`)

	if (game_mode === 'arena') {
		const winningContestant = await Arena.findOne({ where: { playerId: winnerId }})
		const losingContestant = await Arena.findOne({ where: { playerId: loserId }})

		winningContestant.score--
		winningContestant.is_playing = true
		await winningContestant.save()

		losingContestant.is_playing = true
		await losingContestant.save()

		winningPlayer.arena_wins--
		await winningPlayer.save()

		winningPlayer.wallet.starchips -= lastMatch.chipsWinner
		await winningPlayer.wallet.save()

		losingPlayer.arena_losses--
		await losingPlayer.save()

		losingPlayer.wallet.starchips -= lastMatch.chipsLoser
		await losingPlayer.wallet.save()
	
		await lastMatch.destroy()
		return message.channel.send(`The last Arena match in which ${winningPlayer.name} (-${lastMatch.chipsWinner}${starchips}) defeated ${losingPlayer.name} (-${lastMatch.chipsLoser}${starchips}) has been erased.`)
	} else {
		if (!winningPlayer.backup && maid !== loserId) return message.channel.send(`${winningPlayer.name} has no backup stats.${prompt}`)
		if (!winningPlayer.backup && maid === loserId) return message.channel.send(`Your last opponent, ${winningPlayer.name}, has no backup stats.${prompt}`)
		if (!losingPlayer.backup && maid !== loserId) return message.channel.send(`${losingPlayer.name} has no backup stats.${prompt}`)
		if (!losingPlayer.backup && maid === loserId) return message.channel.send(`You have no backup stats.${prompt}`)
	
		winningPlayer.stats = winningPlayer.backup
		winningPlayer.backup = null
		winningPlayer.wins--
		winningPlayer.current_streak--
		await winningPlayer.save()
	
		losingPlayer.stats = losingPlayer.backup
		losingPlayer.backup = null
		losingPlayer.losses--
		await losingPlayer.save()
		
		winningPlayer.wallet.starchips -= lastMatch.chipsWinner
		await winningPlayer.wallet.save()
	
		losingPlayer.wallet.starchips -= lastMatch.chipsLoser
		await losingPlayer.wallet.save()
	
		await lastMatch.destroy()
		return message.channel.send(`The last match in which ${winningPlayer.name} (-${lastMatch.chipsWinner}${starchips}) defeated ${losingPlayer.name} (-${lastMatch.chipsLoser}${starchips}) has been erased.`)
	}
}

//RANK
if (rankcom.includes(cmd)) {
	if (mcid !== botSpamChannelId &&
		mcid !== generalChannelId &&
		mcid !== duelRequestsChannelId &&
		mcid !== tournamentChannelId &&
		mcid !== arenaChannelId &&
		mcid !== triviaChannelId &&
		mcid !== marketPlaceChannelId
	) return message.channel.send(`Please use this command in <#${botSpamChannelId}>, <#${duelRequestsChannelId}> or <#${generalChannelId}>.`)
	
	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	: message.channel === client.channels.cache.get(triviaChannelId) ? "Trivia"
	: message.channel === client.channels.cache.get(draftChannelId) ? "Draft"
	: message.channel === client.channels.cache.get(marketPlaceChannelId) ? "Market"
	: "Ranked"
	
	const x = parseInt(args[0]) || 10
	if (x < 1) return message.channel.send("Please provide a number greater than 0.")
	if (x > 100 || isNaN(x)) return message.channel.send("Please provide a number less than or equal to 100.")
	const membersMap = await message.guild.members.fetch()
	const memberIds = [...membersMap.keys()]
	const result = []
	
	if (game === 'Ranked') {
		x === 1 ? result[0] = `${FiC} --- The Best Forged Player --- ${FiC}`
		: result[0] = `${FiC} --- Top ${x} Forged Players --- ${FiC}`
		
		const allPlayers = await Player.findAll({ 
			where: {
				[Op.or]: [ { wins: { [Op.gt]: 0 } }, { losses: { [Op.gt]: 0 } } ]
			},
			order: [['stats', 'DESC']]
		})
	
		const filtered_players = allPlayers.filter((player) => memberIds.includes(player.id))
		if (x > filtered_players.length) return message.channel.send(`I need a smaller number. We only have ${filtered_players.length} Forged players.`)
		const topPlayers = filtered_players.slice(0, x)
		for (let i = 0; i < x; i++) result[i+1] = `${(i+1)}. ${getMedal(topPlayers[i].stats)} ${topPlayers[i].name}`
	} else if (game === 'Market') {
		x === 1 ? result[0] = `${FiC} --- The Wealthiest Player --- ${FiC}`
		: result[0] = `${FiC} --- Top ${x} Richest Players --- ${FiC}`
		
		const allWallets = await Wallet.findAll({ where: { playerId: { [Op.not]: merchbotId } }, include: Player })
		const filtered_wallets = allWallets.filter((wallet) => memberIds.includes(wallet.playerId))
		if (x > filtered_wallets.length) return message.channel.send(`I need a smaller number. We only have ${filtered_wallets.length} Forged players.`)
		const transformed_wallets = []

		for (let i = 0; i < filtered_wallets.length; i++) {
			const w = filtered_wallets[i]
			const inv = await Inventory.findAll({ where: {playerId: w.playerId }, include: Print })
			let networth = parseInt(w.starchips) + (parseInt(w.stardust) / 10)
			inv.forEach((row) => {
				networth += (parseInt(row.print.market_price) * parseInt(row.quantity) / 10)
			})
		
			transformed_wallets.push([w.player.name, Math.round(networth)])
		}

		transformed_wallets.sort((a, b) => b[1] - a[1])
		const topWallets = transformed_wallets.slice(0, x)
		for (let i = 0; i < x; i++) result[i+1] = `${(i+1)}. ${(topWallets[i][1])}${starchips} - ${topWallets[i][0]}`
	} else if (game === 'Arena') {
		x === 1 ? result[0] = `${FiC} --- The Champion of the Arena --- ${FiC}`
		: result[0] = `${FiC} --- Top ${x} Arena Players --- ${FiC}`
		
		const allProfiles = await Profile.findAll({ 
			where: {
				[Op.or]: [ 
					{ beast_wins: { [Op.gt]: 0 } }, 
					{ dinosaur_wins: { [Op.gt]: 0 } }, 
					{ fish_wins: { [Op.gt]: 0 } }, 
					{ plant_wins: { [Op.gt]: 0 } }, 
					{ reptile_wins: { [Op.gt]: 0 } }, 
					{ rock_wins: { [Op.gt]: 0 } } 
				]
			},
			include: Player,
			order: [[Player, 'name', 'ASC']]
		})
	
		const filtered_profiles = allProfiles.filter((profile) => memberIds.includes(profile.playerId))
		if (x > filtered_profiles.length) return message.channel.send(`I need a smaller number. We only have ${filtered_profiles.length} Arena winners.`)
		const transformed_profiles = filtered_profiles.map((p) => [p.player.name, p.beast_wins, p.dinosaur_wins, p.fish_wins, p.plant_wins, p.reptile_wins, p.rock_wins])
		transformed_profiles.sort((a, b) => (b[1] + b[2] + b[3] + b[4] + b[5] + b[6]) - (a[1] + a[2] + a[3] + a[4] + a[5] + a[6]))
		const topProfiles = transformed_profiles.slice(0, x)
		for (let i = 0; i < x; i++) {
			const p = topProfiles[i]
			result[i+1] = `${(i+1)}. ${p[1] + p[2] + p[3] + p[4] + p[5] + p[6]} W - ${p[0]} - ${p[1] ? `${beast} ` : ''}${p[2] ? `${dinosaur} ` : ''}${p[3] ? `${fish} ` : ''}${p[4] ? `${plant} ` : ''}${p[5] ? `${reptile} ` : ''}${p[6] ? `${rock} ` : ''}`
		} 
	} else if (game === 'Trivia') {
		x === 1 ? result[0] = `${FiC} --- The Top Bookworm --- ${FiC}`
		: result[0] = `${FiC} --- Top ${x} Trivia Players --- ${FiC}`
		
		const allKnowledges = await Knowledge.findAll({ 
			include: Player,
			order: [[Player, 'name', 'ASC']]
		})

		const transformed_knowledges = []

		for (let i = 0; i < allKnowledges.length; i++) {
			const smarts = allKnowledges[i]
			let correct_answers = 0
			const knowledge_keys = Object.keys(smarts.dataValues)
			knowledge_keys.forEach(function(key) {
				if (key.startsWith('question') && smarts[key]) correct_answers++
			})

			if (correct_answers > 0) transformed_knowledges.push([smarts.player.name, smarts.playerId, correct_answers])
		}

		const filtered_knowledges = transformed_knowledges.filter((p) => memberIds.includes(p[1]))
		if (x > filtered_knowledges.length) return message.channel.send(`I need a smaller number. We only have ${filtered_knowledges.length} Trivia players.`)
		filtered_knowledges.sort((a, b) => b[2] - a[2])
		const topBookworms = filtered_knowledges.slice(0, x)

		for (let i = 0; i < x; i++) {
			result[i+1] = `${i+1}. ${topBookworms[i][2]} ${cultured} - ${topBookworms[i][0]}`
		} 
	}

	message.channel.send(result.slice(0,30))
	if (result.length > 30) message.channel.send(result.slice(30,60))
	if (result.length > 60) message.channel.send(result.slice(60,90))
	if (result.length > 90) message.channel.send(result.slice(90))
	return
}
    
//QUEUE
if(queuecom.includes(cmd)) {
	if (message.channel === client.channels.cache.get(arenaChannelId)) {
		const queue = await Arena.findAll({ include: Player })
		if (!queue.length) return message.channel.send(`The Arena queue is empty.`)
		const results = []
		queue.forEach((row) => {
			results.push(row.player.name)
		})
		return message.channel.send(results.join("\n"))
	} else if (message.channel === client.channels.cache.get(draftChannelId)) {
		const queue = await Draft.findAll({ where: { active: false }, include: Player })
		if (!queue.length) return message.channel.send(`The Draft queue is empty.`)
		const results = []
		queue.forEach((row) => {
			results.push(row.player.name)
		})
		return message.channel.send(results.join("\n"))
	} else if (message.channel === client.channels.cache.get(triviaChannelId)) {
		const queue = await Trivia.findAll({ include: Player })
		if (!queue.length) return message.channel.send(`The Trivia queue is empty.`)
		const results = []
		queue.forEach((row) => {
			results.push(row.player.name)
		})
		return message.channel.send(results.join("\n"))
	} else {
		return message.channel.send(`Try using **${cmd}** in channels like: <#${arenaChannelId}> or <#${triviaChannelId}>.`)
	}
}


//JOIN
if(joincom.includes(cmd)) {
	const member = message.member
	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	: message.channel === client.channels.cache.get(triviaChannelId) ? "Trivia"
	: message.channel === client.channels.cache.get(draftChannelId) ? "Draft"
	: message.channel === client.channels.cache.get(tournamentChannelId) ? "Tournament"
	: null

	if (!game) return message.channel.send(`Try using **${cmd}** in channels like: <#${arenaChannelId}> or <#${triviaChannelId}>.`)
	
	const player = await Player.findOne({ where: { id: maid }})
	if (!player) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)

	if (game === 'Tournament') {
		if (isTourPlayer(member)) return message.channel.send(`Sorry, you can only play in one tournament at a time.`)
		const tournaments = await Tournament.findAll({ where: { state: 'pending' }, order: [['createdAt', 'ASC']] })
		const count = await Tournament.count({ where: { state: 'underway' } })
		const tournament = await selectTournament(message, tournaments, maid)
		if (!tournament && count) return message.channel.send(`Sorry, the tournament already started.`)
		if (!tournament && !count) return message.channel.send(`There is no active tournament.`)

		// const info = await Info.findOne({ where: {
		// 	element: 'registration',
		// 	status: 'waiting'
		// }})

		// if (!info) return message.channel.send(`Someone else is signing up for a tournament. Please wait.`)
		
		return challongeClient.tournaments.show({
			id: tournament.id,
			callback: async (err, data) => {
				if (err) {
					return message.channel.send(`Could not find tournament: "${tournament.name}".`)
				} else {
					message.channel.send(`Please check your DMs.`)
					const dbName = player.duelingBook ? player.duelingBook : await askForDBUsername(member, player)
					if (!dbName) return
					const deckListUrl = await getDeckListTournament(member, player, resubmission = false)
					if (!deckListUrl) return
					const deckName = await getDeckNameTournament(member, player)
					if (!deckName) return

					challongeClient.participants.create({
						id: tournament.id,
						participant: {
							name: member.user.username
						},
						callback: async (err, data) => {
							if (err) {
								console.log(err)
								return message.author.send(`Error: "${tournament.name}" could not be accessed.`)
							} else {												
								member.roles.add(tourRole)
								await Entry.create({
									pilot: player.name,
									url: deckListUrl,
									name: deckName,
									type: deckName,
									category: 'Other',
									participantId: data.participant.id,
									playerId: player.id,
									tournamentId: tournament.id
								})

								message.author.send(`Thanks! I have all the information we need from you. Good luck in the tournament!`)
								return client.channels.cache.get(tournamentChannelId).send(`<@${player.id}> is now registered for the tournament!`)
							}
						}
					})	
				}
			}
		})
	}

	const alreadyIn = await eval(game).count({ where: { playerId: maid} })
	const info = await Info.findOne({ where: { element: game.toLowerCase() } })
	if (!info) return message.channel.send(`Could not find game-mode: "${game}".`)
	if (info.status !== 'pending') return message.channel.send(`Sorry, ${ game === 'Trivia' ? 'Trivia' : `the ${game}` } already started.`)

	if (!alreadyIn) {
		const count = await eval(game).count()
		if (game === 'Arena' && count >= 6 || game === 'Trivia' && count === 5) {
			return message.channel.send(`Sorry, ${player.name}, ${ game === 'Trivia' ? 'Trivia' : `the ${game}` } is full.`)
		} 

		await eval(game).create({ playerId: maid })
		message.channel.send(`You joined the ${game} queue.`)
		
		if (game === 'Arena' && count === 5) {
			info.status = 'confirming'
			await info.save()
			return startArena(message.guild)
		} else if (game === 'Trivia' && count === 4) {
			info.status = 'confirming'
			await info.save()
			return startTrivia(message.guild)
		}

	} else {
		return message.channel.send(`You were already in the ${game} queue.`)
	}
}


//RESUBMIT
if(cmd === '!resubmit') {
	const member = message.member	
	const player = await Player.findOne({ where: { id: maid }})
	if (!player) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	if (!isTourPlayer(member)) return message.channel.send(`You are not currently signed-up for a tournament.`)
	const entries = await Entry.findAll({ where: { playerId: player.id }, include: Tournament })
	if (!entries.length) return message.channel.send(`You are not currently signed-up for a tournament.`)
	const entry = entries.filter((e) => e.tournament.state === 'pending')[0]
	if (!entry) return message.channel.send(`Sorry, the tournament already started.`)
	
	return challongeClient.tournaments.show({
		id: entry.tournament.id,
		callback: async (err, data) => {
			if (err) {
				return message.channel.send(`Could not find tournament: "${tournament.name}".`)
			} else {
				message.channel.send(`Please check your DMs.`)
				const deckListUrl = await getDeckListTournament(member, player, resubmission = true)
				if (!deckListUrl) return
				const deckName = await getDeckNameTournament(member, player)
				if (!deckName) return

				await entry.update({
					url: deckListUrl,
					name: deckName,
					type: deckName
				})

				return message.author.send(`Thanks! I have your updated deck list for the tournament.`)
			}	
		}
	})
}

//RESET
if (cmd === `!reset`) {
	if (!isMod(message.member)) return message.channel.send('You do not have permission to do that.')
	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	: message.channel === client.channels.cache.get(triviaChannelId) ? "Trivia"
	: message.channel === client.channels.cache.get(draftChannelId) ? "Draft"
	: null

	if (!game) return message.channel.send(`Try using **${cmd}** in channels like: <#${arenaChannelId}> or <#${triviaChannelId}>.`)
	
	const info = await Info.findOne({ where: { element: game.toLowerCase() }})
	if (!info) return message.channel.send(`Could not find game-mode: "${game}".`)

	const entries = await eval(game).findAll()
	if (!entries) return message.channel.send(`Could not find any entries for: "${game}".`)

	if (game === 'Arena') {
		resetArena(info, entries)
	} else if (game === 'Trivia') {
		resetTrivia(message.guild, info, entries)
	}

	return message.channel.send(`${game === 'Trivia' ? 'Trivia' : `The ${game}`} has been reset.`)
}

//RESUME
if (cmd === `!resume`) {
	if (!isMod(message.member)) return message.channel.send('You do not have permission to do that.')
	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	: message.channel === client.channels.cache.get(triviaChannelId) ? "Trivia"
	: message.channel === client.channels.cache.get(draftChannelId) ? "Draft"
	: null

	if (!game) return message.channel.send(`Try using **${cmd}** in channels like: <#${arenaChannelId}> or <#${triviaChannelId}>.`)
	const role = game === 'Trivia' ? triviaRole : game === 'Arena' ? arenaRole : null

	const info = await Info.findOne({ where: { element: game.toLowerCase() }})
	if (!info) return message.channel.send(`Could not find game-mode: "${game}".`)

	const entries = await eval(game).findAll()
	if (!entries) return message.channel.send(`Could not find any entries for: "${game}".`)

	if (game === 'Arena') {
		startRound(info, entries)
	} else if (game === 'Trivia') {
		const triviaArr = Object.entries(trivia)
		const questionsArr = getRandomSubset(triviaArr, 10)
		setTimeout(() => askQuestion(message.guild, message.channel, info, entries, questionsArr), 30000)
	}

	return message.channel.send(`${role ? `<@&${role}>, ` : ''} ${game === 'Trivia' ? 'Trivia will resume in 30 seconds.' : `The ${game} can now resume.`}`)
}

//END
if (cmd === `!end`) {
	if (!isMod(message.member) && !isJazz(message.member)) return message.channel.send('You do not have permission to do that.')
	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	: message.channel === client.channels.cache.get(tournamentChannelId) ? "Tournament"
	: message.channel === client.channels.cache.get(triviaChannelId) ? "Trivia"
	: message.channel === client.channels.cache.get(draftChannelId) ? "Draft"
	: "Tournament"

	if (!game) return message.channel.send(`Try using **${cmd}** in channels like: <#${arenaChannelId}>, <#${tournamentChannelId}> or <#${triviaChannelId}>.`)
	const role = game === 'Trivia' ? triviaRole : game === 'Arena' ? arenaRole : game === 'Tournament' ? tourRole : null
	
	if (game === 'Tournament') {
		if (!args.length) return message.channel.send(`Please specify the name of the tournament you wish to end.`)
		const name = args[0]
		const tournament = await Tournament.findOne({ where: { name: { [Op.iLike]: name } } })
		if (!tournament) return message.channel.send(`Could not find tournament: "${name}".`)

		const { status } = await axios({
			method: 'post',
			url: `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournament.id}/finalize.json`
		})

		if (status === 200) {
			const allEntries = await Entry.findAll({ where: { tournamentId: tournament.id }})
			for (let i = 0; i < allEntries.length; i++) {
				const entry = allEntries[i]
				const playerId = entry.playerId	
				await entry.destroy()
				const count = await Entry.count({ where: { playerId: playerId } })
				if (count) {
					continue
				} else { 
					const member = message.guild.members.cache.get(playerId)
					if (!member) continue
					member.roles.remove(role)
				}
			}

			await tournament.destroy()
			return message.channel.send(`Congrats! The results of ${tournament.name} ${FiC} have been finalized.`)
		} else {
			return message.channel.send(`Unable to finalize ${tournament.name} ${FiC} on Challonge.com.`)
		}

	}

	const info = await Info.findOne({ where: { element: game.toLowerCase() }})
	if (!info) return message.channel.send(`Could not find game-mode: "${game}".`)

	const entries = await eval(game).findAll()
	if (!entries) return message.channel.send(`Could not find any entries for: "${game}".`)

	if (game === 'Arena') {
		endArena(message.channel, info, entries)
	} else if (game === 'Trivia') {
		return message.channel.send(`This is not programmed for Trivia yet.`)
	}

	return message.channel.send(`${role ? `<@&${role}>, ` : ''} ${game === 'Trivia' ? 'Trivia has come to an end.' : `The ${game} has come to an end.`}`)
}

//DROP
if(dropcom.includes(cmd)) {
	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	: message.channel === client.channels.cache.get(triviaChannelId) ? "Trivia"
	: message.channel === client.channels.cache.get(draftChannelId) ? "Draft"
	: message.channel === client.channels.cache.get(tournamentChannelId) ? "Tournament"
	: null

	const role = game === 'Arena' ? arenaRole : game === 'Trivia' ? triviaRole : game === 'Draft' ? draftRole : game === 'Tournament' ? tourRole : null
	if (game === 'Trivia' && message.member.roles.cache.some(role => role.id === arenaRole)) return message.channel.send(`You cannot join Trivia while playing in the Arena.`)

	if (!game) return message.channel.send(
		`Try using **${cmd}** in channels like: <#${arenaChannelId}> or <#${triviaChannelId}>.`
		)
	
	if (game === 'Tournament') {
		const tournaments = await Tournament.findAll({ order: [['createdAt', 'ASC']] })
		if (!tournaments.length) return message.channel.send(`There is no active tournament.`)

		const tournament = await selectTournament(message, tournaments, maid)
		if (!tournament) return message.channel.send(`Please select a valid tournament.`)
		
		const entry = await Entry.findOne({ where: { playerId: maid }, include: Player})
		if (!entry) return message.channel.send(`You are not in the tournament.`)

		return challongeClient.participants.index({
			id: tournament.id,
			callback: async (err, data) => {
				if (err) {
					return message.channel.send(`Could not find tournament: "${tournament.name}".`)
				} else {
					return removeParticipant(message, message.member, data, entry.participantId, tournament.id, true)
				}
			}
		})
	}

	const entry = await eval(game).findOne({ where: { playerId: maid} })
	const info = await Info.findOne({ where: { element: game.toLowerCase() } })

	if (info.status === 'pending' && entry) {
		await entry.destroy()
		return message.channel.send(`You are no longer in the ${game} queue.`)
	} else if (info.status === 'active' && entry) {
		entry.active = false
		await entry.save()
		message.member.roles.remove(role)
		return message.channel.send(`<@${maid}> dropped out of ${game === 'Trivia' ? '' : 'the '}${game}.`)
	} else if (info.status === 'confirming' && entry) {
		return message.channel.send(`You cannot drop during the confirmation process.`)
	} else {
		return message.channel.send(`You were not in the ${game} queue.`)
	}
}


//REMOVE
if (cmd.toLowerCase() === `!remove`) {
	if (!isMod(message.member)) return message.channel.send('You do not have permission to do that.')
	const member = message.mentions.members.first()
	const playerId = member && member.user ? member.user.id : null
	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	: message.channel === client.channels.cache.get(triviaChannelId) ? "Trivia"
	: message.channel === client.channels.cache.get(draftChannelId) ? "Draft"
	: message.channel === client.channels.cache.get(tournamentChannelId) ? "Tournament"
	: null

	if (!game) return message.channel.send(`Try using **${cmd}** in channels like: <#${tournamentChannelId}>, <#${arenaChannelId}> or <#${triviaChannelId}>.`)
	if (!playerId) return message.channel.send(`Please specify the player you wish to remove from ${game !== 'Trivia' ? 'the' : ''} ${game}.`)

	if (game === 'Tournament') {
		const tournaments = await Tournament.findAll({ order: [['createdAt', 'ASC']] })
		if (!tournaments.length) return message.channel.send(`There is no active tournament.`)

		const tournament = await selectTournament(message, tournaments, maid)
		if (!tournament) return message.channel.send(`Please select a valid tournament.`)
		
		const entry = await Entry.findOne({ where: { playerId }, include: Player})
		if (!entry) return message.channel.send(`That user is not in the tournament.`)

		return challongeClient.participants.index({
			id: tournament.id,
			callback: (err, data) => {
				if (err) {
					return message.channel.send(`Could not find tournament: "${tournament.name}".`)
				} else {
					return removeParticipant(message, member, data, entry.participantId, tournament.id)
				}
			}
		})
	}

	const entry = await eval(game).findOne({ where: { playerId } })
	if (entry) {
		await entry.destroy()
		return message.channel.send(`${member.user.username} has been removed from the ${game} queue.`)
	} else {
		return message.channel.send(`${member.user.username} was not in the ${game} queue.`)
	}
}

//CREATE 
if (cmd === `!create`) {
	if (!isMod(message.member) && !isJazz(message.member)) return message.channel.send('You do not have permission to do that.')
	if (!args.length) return message.channel.send(`Please provide a name for the new tournament.`)

	const tournament_type = await getTournamentType(message)
	if (!tournament_type) return message.channel.send(`Please select a valid tournament type.`)
	
	const str = getRandomString(10, '0123456789abcdefghijklmnopqrstuvwxyz')
	const name = args[0]

	try {
		const { status, data } = await axios({
			method: 'post',
			url: 'https://api.challonge.com/v1/tournaments.json',
			data: {
				api_key: challongeAPIKey,
				tournament: {
					name: name,
					url: name,
					tournament_type: tournament_type,
					gameName: 'Yu-Gi-Oh!',
				}
			}
		})
		
		if (status === 200) {
			await Tournament.create({ 
				id: data.tournament.id,
				name: data.tournament.name,
				state: data.tournament.state,
				swiss_rounds: data.tournament.swiss_rounds, 
				tournament_type: data.tournament.tournament_type,
				url: data.tournament.url
			})
		
			return message.channel.send(`You created a new tournament:\nName: ${data.tournament.name} ${FiC}\nType: ${capitalize(data.tournament.tournament_type)}\nBracket: https://challonge.com/${data.tournament.url}`)
		} else {
			return message.channel.send(`Unable to create tournament on Challonge.com.`)
		}
	} catch (err) {
		try {
			const { status, data } = await axios({
				method: 'post',
				url: 'https://api.challonge.com/v1/tournaments.json',
				data: {
					api_key: challongeAPIKey,
					tournament: {
						name: name,
						url: str,
						tournament_type: tournament_type,
						gameName: 'Yu-Gi-Oh!',
					}
				}
			})
			
			if (status === 200) {
				await Tournament.create({ 
					id: data.tournament.id,
					name: data.tournament.name,
					state: data.tournament.state,
					swiss_rounds: data.tournament.swiss_rounds, 
					tournament_type: data.tournament.tournament_type,
					url: data.tournament.url
				})
			
				return message.channel.send(`You created a new tournament:\nName: ${data.tournament.name} ${FiC}\nType: ${capitalize(data.tournament.tournament_type)}\nBracket: https://challonge.com/${data.tournament.url}`)
			} else {
				return message.channel.send(`Unable to create tournament on Challonge.com.`)
			}
		} catch (err) {
			return message.channel.send(`Error: Unable to create tournament on Challonge.com.`)
		}
	}
}

//BRACKET
if (bracketcom.includes(cmd)) {
	const tournaments = await Tournament.findAll({ order: [['createdAt', 'ASC']]})
	const tournament = await selectTournament(message, tournaments, maid)
	if (!tournament) return message.channel.send('There is no active tournament.')

	challongeClient.tournaments.show({
		id: tournament.id,
		callback: (err) => {
			if (err) {
				return message.channel.send(`Error: "${tournament.name}" could not be found.`)
			} else {
				return message.channel.send(`Name: ${tournament.name} ${FiC}\nType: ${capitalize(tournament.tournament_type)}\nBracket: <https://challonge.com/${tournament.url}>`)
			}
		}
	})  
}


//DESTROY
if (cmd === `!destroy`) {
	if (!isAdmin(message.member) && !isJazz(message.member)) return message.channel.send('You do not have permission to do that.')
	if (!args.length) return message.channel.send(`Please specify the name of the tournament you wish to destroy.`)

	const name = args[0]
	const tournament = await Tournament.findOne({ where: { name: { [Op.iLike]: name } } })
	if (!tournament) return message.channel.send(`Could not find tournament: "${name}".`)
	const tournamentId = tournament.id

	try {
		const { status } = await axios({
			method: 'delete',
			url: `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournament.id}.json`
		})
	
		if (status && status === 200) {
			const allEntries = await Entry.findAll({ where: { tournamentId: tournamentId }})
			for (let i = 0; i < allEntries.length; i++) {
				const entry = allEntries[i]
				const playerId = entry.playerId	
				await entry.destroy()
				const count = await Entry.count({ where: { playerId: playerId } })
				if (count) {
					continue
				} else { 
					const member = message.guild.members.cache.get(playerId)
					if (!member) continue
					member.roles.remove(role)
				}
			}
	
			await tournament.destroy()
			return message.channel.send(`Yikes! You deleted ${tournament.name} ${FiC} from your Challonge account.`)
		} else {
			return message.channel.send(`Unable to delete tournament from Challonge account.`)
		}
	} catch (err) {
		return message.channel.send(`Error: Unable to delete tournament from Challonge account.`)
	}
}


//GRIND
if(cmd === `!grind`) {
	const x = parseInt(args[0])
	if (!x || isNaN(x)) return message.channel.send(`Please provide the number of ${starchips} that you wish to grind to ${stardust}.`)
	if (x < 1) return message.channel.send(`You grind less than 1${starchips}.`)
	if (x % 1 !== 0) return message.channel.send(`You cannot grind part of a ${starchips}.`)

	const wallet = await Wallet.findOne({ where: { playerId: maid } })
	if (!wallet) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	if (x > wallet.starchips) return message.channel.send(`You only have ${wallet.starchips}${starchips}.`)

	const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`Are you sure you want to grind ${x}${starchips} into ${x * 10}${stardust}?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send(`No problem. Have a nice day.`)

		wallet.starchips -= x
		wallet.stardust += x * 10
		await wallet.save()

		completeTask(message.channel, maid, 'e9')
		return message.channel.send(`You ground ${x}${starchips} into ${x * 10}${stardust}.`)
	}).catch(err => {
		console.log(err)
		return message.channel.send(`Sorry, time's up.`)
	})
}

//DAILY
if(cmd === `!daily`) {
	if (mcid !== botSpamChannelId && mcid !== generalChannelId) return message.channel.send(`Please use this command in <#${botSpamChannelId}> or <#${generalChannelId}>.`)
	const daily = await Daily.findOne({ where: { playerId: maid }, include: Player })
	const diary = await Diary.findOne({ where: { playerId: maid } })
	if (!daily || !diary) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)

	const date = new Date()
	const hoursLeftInDay = date.getMinutes() === 0 ? 24 - date.getHours() : 23 - date.getHours()
	const minsLeftInHour = date.getMinutes() === 0 ? 0 : 60 - date.getMinutes()

	if (daily.last_check_in && isSameDay(daily.last_check_in, date)) return message.channel.send(`You already used **!daily** today. Try again in ${hoursLeftInDay} ${hoursLeftInDay === 1 ? 'hour' : 'hours'} and ${minsLeftInHour} ${minsLeftInHour === 1 ? 'minute' : 'minutes'}.`)

	const daysPassed = daily.last_check_in ? (date.setHours(0, 0, 0, 0) - daily.last_check_in.setHours(0, 0, 0, 0)) / (1000*60*60*24) : 1

	const sets = await Set.findAll({ 
		where: { 
			type: 'core',
			for_sale: true
		},
		order: [['createdAt', 'DESC']]
	})

	const set = sets[0]
	if (!set) return message.channel.send(`No core set found.`)

	const commons = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "com"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const rares = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "rar"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const supers = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "sup"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const ultras = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "ult"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const secrets = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "scr"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})
	
	const odds = []
	for (let i = 0; i < set.commons_per_box; i++) odds.push("commons")
	for (let i = 0; i < set.rares_per_box; i++) odds.push("rares")
	for (let i = 0; i < set.supers_per_box; i++) odds.push("supers")
	for (let i = 0; i < set.ultras_per_box; i++) odds.push("ultras")
	for (let i = 0; i < set.secrets_per_box; i++) odds.push("secrets")

	const luck = getRandomElement(odds)
	const yourCard = getRandomElement(eval(luck))
	const enthusiasm = luck === "commons" ? `Ho-Hum.` : luck === "rares" ? `Not bad.` : luck === 'supers' ? `Cool beans!` : luck === 'ultras' ? `Now *that's* based!` : `Holy $#%t balls!`
	const emoji = luck === "commons" ? cavebob : luck === "rares" ? stoned : luck === 'supers' ? blue : luck === 'ultras' ? wokeaf : koolaid

	const print = await Print.findOne({ where: {
		card_code: yourCard
	}})

	if (!print.id) return message.channel.send(`Error: ${yourCard} does not exist in the Print database.`)

	const card = await Card.findOne({ where: {
		name: print.card_name
	}})

	const inv = await Inventory.findOne({ where: { 
		card_code: print.card_code,
		printId: print.id,
		playerId: maid
	}})

	if (inv) {
		inv.quantity++
		await inv.save()
	} else {
		await Inventory.create({ 
			card_code: print.card_code,
			quantity: 1,
			printId: print.id,
			playerId: maid
		})

		if (print.rarity === 'scr') completeTask(message.channel, maid, 'm4', 4000)
	}

	if (await checkCoreSetComplete(maid, 1)) completeTask(message.channel, maid, 'h4', 4000)
	if (await checkCoreSetComplete(maid, 3)) completeTask(message.channel, maid, 'l3', 5000)

	const easy_complete = diary.e1 && diary.e2 && diary.e3 && diary.e4 && diary.e5 && diary.e6 && diary.e7 && diary.e8 && diary.e9 && diary.e10 && diary.e11 && diary.e12
	const medium_complete = diary.m1 && diary.m2 && diary.m3 && diary.m4 && diary.m5 && diary.m6 && diary.m7 && diary.m8 && diary.m9 && diary.m10
	const hard_complete = diary.h1 && diary.h2 && diary.h3 && diary.h4 && diary.h5 && diary.h6 && diary.h7 && diary.h8
	const elite_complete = diary.l1 && diary.l2 && diary.l3 && diary.l4 && diary.l5 && diary.l6
	const master_complete = diary.s1 && diary.s2 && diary.s3 && diary.s4

	if (easy_complete && (daily.cobble_progress + daysPassed) >= 7) {
		daily.cobble_progress = 0
		let num = master_complete ? 5 : elite_complete ? 4 : hard_complete ? 3 : medium_complete ? 2 : 1
		if (num) setTimeout(async () => {
			message.channel.send(`Oh look, ${daily.player.name}, you cobbled together a pack!`, {files:[`./public/packs/7outof7.png`]})
			const gotSecret = await awardPack(message.channel, daily.playerId, set, num)
			if (gotSecret) completeTask(message.channel, daily.playerId, 'm4')
		}, 4000)
	} else {
		daily.cobble_progress += (daysPassed)
		if (easy_complete) {
			setTimeout(() => {
				message.channel.send(`Hey, ${daily.player.name}, keep cobblin', buddy.`, {files:[`./public/packs/${daily.cobble_progress}outof7.png`]})
			}, 4000)
		}
	}

	daily.last_check_in = date
	await daily.save()

	const canvas = Canvas.createCanvas(105, 158)
	const context = canvas.getContext('2d')
	const background = fs.existsSync(`./public/card_images/${card.image}`) ? 
						await Canvas.loadImage(`./public/card_images/${card.image}`) :
						await Canvas.loadImage(`https://ygoprodeck.com/pics/${card.image}`)
	if (background && canvas && context) context.drawImage(background, 0, 0, canvas.width, canvas.height)
	const attachment = background && canvas && context ? new Discord.MessageAttachment(canvas.toBuffer(), `${card.name}.png`) : false

	message.channel.send(`1... 2...`)
	return setTimeout(() => message.channel.send(`${enthusiasm} ${daily.player.name} pulled ${eval(print.rarity)}${print.card_code} - ${print.card_name} from the grab bag! ${emoji}`, attachment), 2000)
}

//ALCHEMY
if(cmd === `!alc` ||cmd === `!alch` || cmd === `!alchemy`) {
	if (mcid !== botSpamChannelId && mcid !== generalChannelId) return message.channel.send(`Please use this command in <#${botSpamChannelId}> or <#${generalChannelId}>.`)
	const wallet = await Wallet.findOne({ 
		where: { playerId: maid },
		include: Player
	})

	const daily = await Daily.findOne({ 
		where: { playerId: maid },
		include: Player
	})

	const diary = await Diary.findOne({ 
		where: { playerId: maid },
		include: Player
	})

	const easy_complete = diary.e1 && diary.e2 && diary.e3 && diary.e4 && diary.e5 && diary.e6 && diary.e7 && diary.e8 && diary.e9 && diary.e10 && diary.e11 && diary.e12
	const medium_complete = diary.m1 && diary.m2 && diary.m3 && diary.m4 && diary.m5 && diary.m6 && diary.m7 && diary.m8 && diary.m9 && diary.m10
	const hard_complete = diary.h1 && diary.h2 && diary.h3 && diary.h4 && diary.h5 && diary.h6 && diary.h7 && diary.h8
	const elite_complete = diary.l1 && diary.l2 && diary.l3 && diary.l4 && diary.l5 && diary.l6
	//const master_complete = diary.s1 && diary.s2 && diary.s3 && diary.s4

	if (!wallet || !daily || !diary) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	
	const date = new Date()
	const hoursLeftInDay = date.getMinutes() === 0 ? 24 - date.getHours() : 23 - date.getHours()
	const minsLeftInHour = date.getMinutes() === 0 ? 0 : 60 - date.getMinutes()

	if (daily.last_alchemy && !isSameDay(daily.last_alchemy, date)) {
		daily.alchemy_1 = false
		daily.alchemy_2 = false
		daily.alchemy_3 = false
		daily.alchemy_4 = false
		daily.alchemy_5 = false
		await daily.save()
	}

	if (
		(
			daily.alchemy_1 &&
			(daily.alchemy_2 || !easy_complete) &&
			(daily.alchemy_3 || !medium_complete) &&
			(daily.alchemy_4 || !hard_complete) &&
			(daily.alchemy_5 || !elite_complete)
		)
	) return message.channel.send(`You exhausted your alchemic powers for the day. Try again in ${hoursLeftInDay} ${hoursLeftInDay === 1 ? 'hour' : 'hours'} and ${minsLeftInHour} ${minsLeftInHour === 1 ? 'minute' : 'minutes'}.`)

	const query = args.join(" ")
	
	if (!args[0]) return message.channel.send(`Please specify the card you wish to transmute into ${starchips}.`)
	
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const card_name = await findCard(query, fuzzyPrints, fuzzyPrints2)
	const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))

	const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name) : null
	if (!print) return message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
	const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`
	const value = print.rarity === 'com' ? 1 : print.rarity === 'rar' ? 2 : print.rarity === 'sup' ? 4 : print.rarity === 'ult' ? 8 : 16 

	const inv = await Inventory.findOne({ 
		where: { 
			printId: print.id,
			playerId: maid,
			quantity: { [Op.gt]: 0 }
		}
	})

	if (!inv) return message.channel.send(`You do not have any copies of ${card}.`)

	const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`Are you sure you want to transmute ${card} into ${value}${starchips}?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send(`No problem. Have a nice day.`)
		
		inv.quantity--
		await inv.save()

		wallet.starchips += value
		await wallet.save()
	
		if (!daily.alchemy_1) {
			daily.alchemy_1 = true
		} else if (!daily.alchemy_2) {
			daily.alchemy_2 = true
		} else if (!daily.alchemy_3) {
			daily.alchemy_3 = true
		} else if (!daily.alchemy_4) {
			daily.alchemy_4 = true
		} else {
			daily.alchemy_5 = true
		}

		daily.last_alchemy = date
		await daily.save()

		completeTask(message.channel, maid, 'e5')
		return message.channel.send(`You transmuted ${card} into ${value}${starchips}!`)
	}).catch(err => {
		console.log(err)
		return message.channel.send(`Sorry, time's up.`)
	})
}


//WRITE
if(cmd === `!write`) {
	if (!isMod(message.member)) return message.channel.send("You do not have permission to do that.")
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : null	
	if (playerId === maid) return message.channel.send(`You cannot cross off your own Diary achievements.`)
	if (!playerId) return message.channel.send(`Please @ mention a user to write in their Diary.`)

	const achievement = args[1] ? args[1].toLowerCase() : null
	const valid_tasks = [
		"e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12",
		"m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10",
		"h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8",
		"l1", "l2", "l3", "l4", "l5", "l6",
	]

	if (!achievement) return message.channel.send(`Please specify an achievement (E4, M7, H1, L2, etc.)`)
	if (!valid_tasks.includes(achievement)) return message.channel.send(`Sorry, ${achievement.toUpperCase()} is not a valid task.`)

	const diary = await Diary.findOne({ where: { playerId: playerId } })
	if (!diary) return message.channel.send(`That user is not in the database.`)

	if (diary[achievement] === true) return message.channel.send(`That user already completed task ${achievement.toUpperCase()}.`)
	else if (diary[achievement] === false) return completeTask(message.channel, playerId, achievement)
}


//BURN
if(cmd === `!burn`) {
	if (!isMod(message.member)) return message.channel.send("You do not have permission to do that.")
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : null	
	if (playerId === maid) return message.channel.send(`You cannot undo achievements from your own Diary.`)
	if (!playerId) return message.channel.send(`Please @ mention a user to burn a hole in their Diary.`)

	const achievement = args[1] ? args[1].toLowerCase() : null
	const valid_tasks = [
		"e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12",
		"m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10",
		"h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8",
		"l1", "l2", "l3", "l4", "l5", "l6",
	]

	if (!achievement) return message.channel.send(`Please specify an achievement (E4, M7, H1, L2, etc.)`)
	if (!valid_tasks.includes(achievement)) return message.channel.send(`Sorry, ${achievement.toUpperCase()} is not a valid task.`)
	const difficulty = achievement.startsWith('e') ? 'Easy' : achievement.startsWith('m') ? 'Medium' : achievement.startsWith('h') ? 'Hard' : 'Elite'

	const diary = await Diary.findOne({ where: { playerId: playerId }, include: Player })
	if (!diary) return message.channel.send(`That user is not in the database.`)

	if (diary[achievement] === false) return message.channel.send(`That user has not completed task:\n**${diaries[difficulty][achievement]}**.`)
	else if (diary[achievement] === true) {
		diary[achievement] = false
		await diary.save()
		return message.channel.send(`You undid an achievement in ${diary.player.name}'s Diary:\n**${diaries[difficulty][achievement]}**`)
	}
}


//AWARD
if(cmd === `!award`) {
	if (!isMod(message.member) && !isAdmin(message.member) &&!isJazz(message.member)) return message.channel.send("You do not have permission to do that.")
	const recipient = message.mentions.users.first() ? message.mentions.users.first().id : null	
	if (!recipient) return message.channel.send(`Please @ mention a user to award.`)
	if (recipient === maid) return message.channel.send(`You cannot give an award to yourself.`)

	const player = await Player.findOne({ 
		where: { id: recipient },
		include: Wallet
	})

	if (!player) return message.channel.send(`That user is not in the database.`)

	const quantity = parseInt(args[1]) ? parseInt(args[1]) : 1
	const query = parseInt(args[1]) ? args.slice(2).join(" ").toLowerCase() : args.slice(1).join(" ").toLowerCase()
	if (!quantity || !query) return message.channel.send(`Please specify the query you wish to award.`)

	let set_code = query.includes('chaospack') || query.includes('chaos pack') || query === 'ch1' ? 'CH1' :
	query === 'pack' || query === 'packs' || query === 'doc' ? 'DOC' : null

	if (set_code) {
		const set = await Set.findOne({ where: { code: set_code } })
		if (!set) return message.channel.send(`Could not find set: "${set_code}".`)
		const filter = m => m.author.id === message.author.id
		const msg = await message.channel.send(`Are you sure you want to award ${quantity} ${set_code} ${eval(set.emoji)} ${quantity > 1 ? 'Packs' : 'Pack'} to ${player.name}?`)
		const collected = await msg.channel.awaitMessages(filter, {
			max: 1,
			time: 15000
		}).then(async collected => {
			if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send(`No problem. Have a nice day.`)
			message.channel.send(`Please wait while I open your ${quantity > 1 ? 'packs' : 'pack'}... ${blue}`)			
			return awardPack(message.channel, recipient, set, quantity)
		}).catch(err => {
			console.log(err)
			return message.channel.send(`Sorry, time's up.`)
		})

		return
		// if (set_code === 'CH1') return setTimeout(() => {
		// 	return completeTask(message.channel, recipient, 'm8')
		// }, 5000)
	}

	set_code = query.slice(0, 3).toUpperCase()
	const valid_set_code = !!(set_code.length === 3 && await Set.count({where: { code: set_code }}))
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	const card_name = query && !valid_set_code && !valid_card_code ? await findCard(query, fuzzyPrints, fuzzyPrints2) : null
	const print = valid_card_code ? await Print.findOne({ where: { card_code } }) : card_name ? await selectPrint(message, maid, card_name) : null

	let walletField
	if (query === 'sc' || query === 'starchip' || query === 'starchips' || query === 'chip' || query === 'chips') walletEmoji = starchips, walletField = 'starchips'
	if (query === 'sd' ||query === 'stardust' || query === 'dust') walletField = 'stardust'
	if (query === 'cactus' || query === 'cactuses' || query === 'cacti' || query === 'cactis' ) walletField = 'cactus'
	if (query === 'egg' || query === 'eggs') walletField = 'egg'
	if (query === 'hook' || query === 'hooks') walletField = 'hook'
	if (query === 'moai' || query === 'moais' ) walletField = 'moai'
	if (query === 'mushroom' || query === 'mushrooms' || query === 'shroom' || query === 'shrooms') walletField = 'mushroom'
	if (query === 'rose' || query === 'roses' ) walletField = 'rose'

	if (!print && !walletField) return message.channel.send(`Sorry, I do not recognize the item: "${query}".`)
	const award = walletField ? `${eval(walletField)}` : ` ${eval(print.rarity)}${print.card_code} - ${print.card_name}` 

	const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`Are you sure you want to award ${quantity}${award} to ${player.name}?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send(`No problem. Have a nice day.`)
		
		if (walletField) {
			player.wallet[walletField] += quantity
			await player.wallet.save()
		} else {
			const set = await Set.findOne({ where: { code: print.set_code } })

			const inv = await Inventory.findOne({ where: { 
				card_code: print.card_code,
				printId: print.id,
				playerId: recipient
			}})
	
			if (inv) {
				inv.quantity += quantity
				await inv.save()
			} else {
				await Inventory.create({ 
					card_code: print.card_code,
					quantity: quantity,
					printId: print.id,
					playerId: recipient
				})

				if (print.rarity === 'scr') completeTask(message.channel, recipient, 'm4')
			}

			if ( print.set_code === 'APC' && (( inv && inv.quantity >= 3 ) || quantity >= 3 ) ) completeTask(message.channel, recipient, 'h5', 4000)
			if (await checkCoreSetComplete(recipient, 1)) completeTask(message.channel, recipient, 'h4', 4000)
			if (await checkCoreSetComplete(recipient, 3)) completeTask(message.channel, recipient, 'l3', 5000)	
		}
	
		return message.channel.send(`${player.name} was awarded ${quantity}${award}. Congratulations!`)
	}).catch(err => {
		console.log(err)
		return message.channel.send(`Sorry, time's up.`)
	})
}

//STEAL
if(cmd === `!steal`) {
	if (!isMod(message.member)) return message.channel.send("You do not have permission to do that.")
	const target = message.mentions.users.first() ? message.mentions.users.first().id : null	
	if (target === maid) return message.channel.send(`You cannot steal something from yourself.`)
	if (!target || isNaN(target) || target.length < 17) return message.channel.send(`Please @ mention a user to steal from.`)

	const player = await Player.findOne({ 
		where: { id: target },
		include: Wallet
	})

	if (!player) return message.channel.send(`That user is not in the database.`)

	const quantity = parseInt(args[1]) ? parseInt(args[1]) : 1
	const query = parseInt(args[1]) ? args.slice(2).join(" ") : args.slice(1).join(" ")	
	if (!quantity || !query) return message.channel.send(`Please specify the item you wish to steal.`)

	const set_code = query.toUpperCase()
	const valid_set_code = !!(set_code.length === 3 && await Set.count({where: { code: set_code }}))
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	const card_name = query && !valid_set_code && !valid_card_code ? await findCard(query, fuzzyPrints, fuzzyPrints2) : null
	const print = valid_card_code ? await Print.findOne({ where: { card_code } }) : card_name ? await selectPrint(message, maid, card_name) : null
	if (card_name && !print) return

	let walletField
	if (query === 'sc' || query === 'starchip' || query === 'starchips' || query === 'chip' || query === 'chips') walletField = 'starchips'
	if (query === 'sd' ||query === 'stardust' || query === 'dust') walletField = 'stardust'
	if (query === 'cactus' || query === 'cactuses' || query === 'cacti' || query === 'cactis' ) walletField = 'cactus'
	if (query === 'egg' || query === 'eggs') walletField = 'egg'
	if (query === 'hook' || query === 'hooks') walletField = 'hook'
	if (query === 'moai' || query === 'moais' ) walletField = 'moai'
	if (query === 'mushroom' || query === 'mushrooms' || query === 'shroom' || query === 'shrooms') walletField = 'mushroom'
	if (query === 'rose' || query === 'roses' ) walletField = 'rose'

	if (!print && !walletField) return message.channel.send(`Sorry, I do not recognize the item: "${query}".`)
	const loot = walletField ? `${eval(walletField)}` : ` ${eval(print.rarity)}${print.card_code} - ${print.card_name}` 

	const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`Are you sure you want to steal ${quantity}${loot} from ${player.name}?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send(`No problem. Have a nice day.`)
		
		if (walletField) {
			player.wallet[walletField] -= quantity
			await player.wallet.save()
		} else if (print) {
			const inv = await Inventory.findOne({ where: { 
				card_code: print.card_code,
				printId: print.id,
				playerId: target
			}})
	
			if (!inv) {
				return message.channel.send(`Sorry, ${player.name} does not have an inventory slot for${loot}.`)
			} else if (inv.quantity < quantity) {
				return message.channel.send(`Sorry, ${player.name} only has ${inv.quantity}${loot}.`)
			} else {
				inv.quantity -= quantity
				await inv.save()
			}
		} else {
			const inv = await Inventory.findOne({ where: { 
				card_code: print.card_code,
				printId: print.id,
				playerId: target
			}})
	
			if (!inv) {
				return message.channel.send(`Sorry, ${player.name} does not have any${loot}.`)
			} else if (inv.quantity < quantity) {
				return message.channel.send(`Sorry, ${player.name} only has ${inv.quantity}${loot}.`)
			} else {
				inv.quantity -= quantity
				await inv.save()
			}
		}
	
		return message.channel.send(`Yikes! You stole ${quantity}${loot} from ${player.name}.`)
	}).catch(err => {
		console.log(err)
		return message.channel.send(`Sorry, time's up.`)
	})
}

//RECALC
    // Use this command to recalculate every player's Elo from scratch.
    // This is needed when matches are directly added or deleted using postgreSQL.
    // It's also required after using the !combine command, but the bot will remind you to do it.
if (cmd === `!recalc`) {
	if (!isJazz(message.member)) return message.channel.send(`You do not have permission to do that.`)
	message.channel.send(`Recalculating data. Please wait...`)
	const players = await Player.findAll()
    const matches = await Match.findAll({
            where: {
                game_mode: {
					[Op.or]: ['ranked', 'tournament']
				},
            }, order: [['createdAt', 'ASC']]
        })

    console.log(`Found ${matches.length} ranked and tournament matches.`)
	for (let i = 0; i < players.length; i++) {
		const player = players[i]
		player.stats = 500
		player.backup = 0
		player.wins = 0
		player.losses = 0
		player.best_stats = 500
		player.vanquished_foes = 0
		player.current_streak = 0
		player.longest_streak = 0
		await player.save()
	}

	for (let i = 0; i < matches.length; i++) {
		await recalculate(match, i+1)	
		if (i + 1 === matches.length) return message.channel.send(`Recalculation complete!`)
	} 
}

//CENSUS
if (cmd === `!census`) {
	if (!isAdmin(message.member)) return message.channel.send(`You do not have permission to do that.`)
	const membersMap = await message.guild.members.fetch()
	const memberIds = [...membersMap.keys()]
	let update_count = 0
	let create_count = 0
	console.log('memberIds.length', memberIds.length)
	for (let i = 0; i < memberIds.length; i++) {
		const id = memberIds[i]
		console.log('id', id)
		const member = membersMap.get(id)
		console.log('!!member', !!member)
		const name = member.user.username
		const tag = member.user.tag
		console.log('name', name)
		console.log('tag', tag)
		const player = await Player.findOne({ where: { id: id } })
		if (player && (player.name !== name || player.tag !== tag)) {
			update_count++
			console.log('updating...')
			player.name = name
			player.tag = tag
			await player.save()
		} else if (!player && !member.user.bot) {
			create_count++
			console.log('creating...')
			await createPlayer(id, name, tag)
		}

		if (i + 1 === memberIds.length) return message.channel.send(`Census complete! You added ${create_count} ${create_count === 1 ? 'player' : 'players'} to the database and updated ${update_count} ${update_count === 1 ? 'other' : 'others'}.`)
	}
}

//GRINDALL
if(cmd === `!grindall`) {
	if (!isAdmin(message.member)) return message.channel.send(`You do not have permission to do that.`)

	const confirmation_1 = await askForGrindAllConfirmation(message, 0)
	if (!confirmation_1) return
	const confirmation_2 = await askForGrindAllConfirmation(message, 1)
	if (!confirmation_2) return
	const confirmation_3 = await askForGrindAllConfirmation(message, 2)
	if (!confirmation_3) return
	const confirmation_4 = await askForGrindAllConfirmation(message, 3)
	if (!confirmation_4) return

	const allWallets = await Wallet.findAll()
	for (let i = 0; i < allWallets.length; i++) {
		const wallet = allWallets[i]
		wallet.stardust += wallet.starchips * 10
		wallet.starchips = 0
		await wallet.save()
	}

	return message.channel.send(`Every player's ${starchips}s have been ground into ${stardust}!`)


}

//INVENTORY
if(invcom.includes(cmd)) { 
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
	if (playerId !== maid && !isMod(message.member)) return message.channel.send(`You do not have permission to do that.`)

	const player = await Player.findOne({ where: { id: playerId }})
	if (!player) return message.channel.send(playerId === maid ? `You are not in the database. Type **!start** to begin the game.` : `That person is not in the database.`)

	const query = playerId === maid ? args.join(' ') : args.length > 1 ? args.slice(1).join(' ') : ''
	const set_code = query.toUpperCase()
	const valid_set_code = !!(set_code.length === 3 && await Set.count({where: { code: set_code }}))
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	const card_name = query && !valid_set_code && !valid_card_code ? await findCard(query, fuzzyPrints, fuzzyPrints2) : null
	const print = valid_card_code ? await Print.findOne({ where: { card_code } }) : card_name ? await selectPrint(message, maid, card_name) : null
	if (card_name && !print) return
	const count = print && print.set_code === 'CH1' ? await Inventory.count({ where: { printId: print.id } }) : true

	const inventory = !query.length ? await Inventory.findAll({ 
		where: { 
			playerId,
			quantity: {
				[Op.gte]: 1
			}
		 },
		include: [Print, Player],
		order: [['card_code', 'ASC']]
	}) : valid_set_code ? await Inventory.findAll({
		where: {
			playerId,
			card_code: {
				[Op.startsWith]: set_code
			},
			quantity: {
				[Op.gte]: 1
			}
		},
		include: [Print, Player],
		order: [['card_code', 'ASC']]
	}) : valid_card_code ? await Inventory.findAll({ 
		where: { 
			playerId,
			card_code: card_code,
			quantity: {
				[Op.gte]: 1
			}
		},
		include: [Print, Player]
	}) : print ? await Inventory.findAll({ 
		where: { 
			playerId,
			printId: print.id,
			quantity: {
				[Op.gte]: 1
			}
		},
		include: [Print, Player]
	}) : []
	
	const results = [`${player.name}'s Inventory:`]
	const codes = []

	if (!inventory.length && !print) return message.channel.send(`Sorry, I do not recognize: "${query}".`)
	if (!inventory.length && print) results.push(`${eval(print.rarity)}${print.card_code} - ${count ? print.card_name : '???'} - 0`)

	for (let i = 0; i < inventory.length; i++) {
		const row = inventory[i]
		const code = row.card_code.slice(0,3)

		try {
			if (!codes.includes(code) && !card_name) {
				codes.push(code)
				const set = await Set.findOne({ where: { code } })
				if (set) results.push(`${codes.length > 1 ? '\n' : ''}${eval(set.emoji)} --- ${set.name} --- ${eval(set.alt_emoji)}`) 
			}
		} catch (err) {
			console.log(err)
		}

		const count_2 = row.print.set_code === 'CH1' ? await Inventory.count({ where: { printId: row.printId } }) : true
		results.push(`${eval(row.print.rarity)}${row.card_code} - ${count_2 ? row.print.card_name : '???'} - ${row.quantity}`) 
	}

	for (let i = 0; i < results.length; i += 30) {
		if (results[i+31] && results[i+31].startsWith("\n")) {
			message.author.send(results.slice(i, i+31))
			i++
		} else {
			message.author.send(results.slice(i, i+30))
		}
	}

	if (playerId === maid) completeTask(message.channel, maid, 'e2')
	return message.channel.send(`I messaged you the Inventory you requested.`)
}

//CHECKLIST
if(checklistcom.includes(cmd)) {
	const set_code = args.length ? args[0].toUpperCase() : null
	const valid_set_code = !!(set_code && set_code.length === 3 && await Set.count({where: { code: set_code }}))
	if (set_code && !valid_set_code) return message.channel.send(`Sorry, I do not recognize the set code: "${set_code}".`)

	const inventory = valid_set_code ? await Inventory.findAll({
		where: {
			playerId: maid,
			card_code: {
				[Op.startsWith]: set_code
			},
			quantity: {
				[Op.gte]: 1
			}
		},
		include: [Print],
		order: [['card_code', 'ASC']]
	}) : await Inventory.findAll({ 
		where: { 
			playerId: maid,
			quantity: {
				[Op.gte]: 1
			}
		},
		include: Print,
		order: [['card_code', 'ASC']]
	})

	const allPrints = valid_set_code ? await Print.findAll({ 
		where: {
			set_code: set_code
		},
		order: [['card_code', 'ASC']]
	}) : await Print.findAll({ 
		order: [['card_code', 'ASC']]
	})

	if (!inventory) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	if (!allPrints) return message.channel.send(`Sorry, something is wrong with the database.`)

	const results = []
	const codes = []
	const cards = inventory.map((card) => card.print.card_code)

	for (let i = 0; i < allPrints.length; i++) {
		const row = allPrints[i]
		const code = row.card_code.slice(0,3)

		try {
			if (!codes.includes(code)) {
				codes.push(code)
				const set = await Set.findOne({ where: { code } })
				if (set) results.push(`${codes.length > 1 ? '\n' : ''}${eval(set.emoji)} --- ${set.name} --- ${eval(set.alt_emoji)}`) 
			}
		} catch (err) {
			console.log(err)
		}

		const box_emoji = cards.includes(row.card_code) ? checkmark : emptybox
		const count = code === 'CH1' ? await Inventory.count({ where: { printId: row.id } }) : true
		results.push(`${box_emoji} ${eval(row.rarity)}${row.card_code} - ${count ? row.card_name : '???'}`) 
	}

	for (let i = 0; i < results.length; i += 30) {
		if (results[i+31] && results[i+31].startsWith("\n")) {
			message.author.send(results.slice(i, i+31))
			i++
		} else {
			message.author.send(results.slice(i, i+30))
		}
	}

	return message.channel.send(`I messaged you the Checklist you requested.`)
}

//PACK
if(cmd === `!pack`) {
	const num = args.length === 1 && isFinite(args[0]) ? parseInt(args[0]) : args.length > 1 && isFinite(args[1]) ? parseInt(args[1]) : 1
	const code = args.length === 1 && !isFinite(args[0]) ? args[0] : args.length > 1 && !isFinite(args[1]) ? args[1] : 'ORF'
	if (code && code.startsWith('SS')) return message.channel.send(`Sorry, Starter Series cards are not sold by the pack.`)
	const set = await Set.findOne({ where: { code: code.toUpperCase() }})

	const commons = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "com"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const rares = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "rar"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const supers = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "sup"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const ultras = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "ult"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const secrets = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "scr"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	if (!set) return message.channel.send(`There is no set with the code "${code.toUpperCase()}".`)
	if (!set.for_sale) return message.channel.send(`Sorry, ${set.name} ${eval(set.emoji)} is out of stock.`)

	const wallet = await Wallet.findOne( { where: { playerId: maid }, include: Player })
	const merchbot_wallet = await Wallet.findOne( { where: { playerId: merchbotId } })
	if (!wallet || !merchbot_wallet) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	const money = wallet[set.currency]
	if (money < (set.unit_price * num)) return message.channel.send(`Sorry, ${wallet.player.name}, you only have ${money}${eval(set.currency)} and ${num > 1 ? `${num} ` : ''}${set.name} ${eval(set.emoji)} Packs cost ${num * set.unit_price}${eval(set.currency)}.`)

	const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`${wallet.player.name}, you have ${money}${eval(set.currency)}. Do you want to spend ${num * set.unit_price}${eval(set.currency)} on ${num > 1 ? num : 'a'} ${set.name} ${eval(set.emoji)} Pack${num > 1 ? 's' : ''}?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send(`No problem. Have a nice day.`)
		
		message.channel.send(`Thank you for your purchase! I'll send you the contents of your ${set.name} ${eval(set.emoji)} Pack${num > 1 ? 's' : ''}.`)
		let gotSecret = false

		for (let j = 0; j < num; j++) {
			const images = []
			const results = [`\n${eval(set.emoji)} - ${set.name} Pack${num > 1 ? ` ${j + 1}` : ''} - ${eval(set.alt_emoji)}`]
			const yourCommons = set.commons_per_pack > 1 ? getRandomSubset(commons, set.commons_per_pack) : set.secrets_per_pack === 1 ? [getRandomElement(commons)] : []
			const yourRares = set.rares_per_pack > 1 ? getRandomSubset(rares, set.rares_per_pack) : set.rares_per_pack === 1 ? [getRandomElement(rares)] : []
			const yourSupers = set.supers_per_pack > 1 ? getRandomSubset(supers, set.supers_per_pack) : set.supers_per_pack === 1 ? [getRandomElement(supers)] : []
			const yourUltras = set.ultras_per_pack > 1 ? getRandomSubset(ultras, set.ultras_per_pack) : set.ultras_per_pack === 1 ? [getRandomElement(ultras)] : []
			const yourSecrets = set.secrets_per_pack > 1 ? getRandomSubset(secrets, set.secrets_per_pack) : set.secrets_per_pack === 1 ? [getRandomElement(secrets)] :  []

			const odds = []
			if (!yourCommons.length) for (let i = 0; i < set.commons_per_box; i++) odds.push("commons")
			if (!yourRares.length) for (let i = 0; i < set.rares_per_box; i++) odds.push("rares")
			if (!yourSupers.length) for (let i = 0; i < set.supers_per_box; i++) odds.push("supers")
			if (!yourUltras.length) for (let i = 0; i < set.ultras_per_box; i++) odds.push("ultras")
			if (!yourSecrets.length) for (let i = 0; i < set.secrets_per_box; i++) odds.push("secrets")

			const luck = getRandomElement(odds)
			const yourFoil = getRandomElement(eval(luck))

			const yourPack = [...yourCommons.sort(), ...yourRares.sort(), ...yourSupers.sort(), ...yourUltras.sort(), ...yourSecrets.sort(), yourFoil]

			for (let i = 0; i < yourPack.length; i++) {
				const print = await Print.findOne({ where: {
					card_code: yourPack[i]
				}})

				if (!print.id) return message.channel.send(`Error: ${yourPack[i]} does not exist in the Print database.`)
				results.push(`${eval(print.rarity)}${print.card_code} - ${print.card_name}`)

				const card = await Card.findOne({ where: {
					name: print.card_name
				}})
		
				images.push(`${card.image}`)
			
				const inv = await Inventory.findOne({ where: { 
					card_code: print.card_code,
					printId: print.id,
					playerId: maid
				}})

				if (inv) {
					inv.quantity++
					await inv.save()
				} else {
					await Inventory.create({ 
						card_code: print.card_code,
						quantity: 1,
						printId: print.id,
						playerId: maid
					})

					if (print.rarity === 'scr') gotSecret = true
				}
			}

			const card_width = 57
			const canvas = Canvas.createCanvas(card_width * set.cards_per_pack, 80)
			const context = canvas.getContext('2d')

			for (let i = 0; i < set.cards_per_pack; i++) {
				const card = fs.existsSync(`./public/card_images/${images[i]}`) ? 
				await Canvas.loadImage(`./public/card_images/${images[i]}`) :
				await Canvas.loadImage(`https://ygoprodeck.com/pics/${images[i]}`)
				if (canvas && context && card) context.drawImage(card, card_width * i, 0, card_width, canvas.height)
			}
	
			const attachment =  canvas && context ?
				new Discord.MessageAttachment(canvas.toBuffer(), `pack_${j+1}.png`) :
				false
			message.author.send(results.join("\n"), attachment)
		}

		wallet[set.currency] -= (set.unit_price * num)
		await wallet.save()

		merchbot_wallet.stardust += set.currency === 'stardust' ? set.unit_price * num : set.unit_price * num * 10
		await merchbot_wallet.save()

		set.unit_sales += num
		await set.save()

		completeTask(message.channel, maid, 'e6')
		if (set.type === 'core' && num >= 5) completeTask(message.channel, maid, 'm3', 3000)
		if (gotSecret) completeTask(message.channel, maid, 'm4', 5000)
		if (set.type === 'core' && await checkCoreSetComplete(maid, 1)) completeTask(message.channel, 'h4', 5000)
		if (set.type === 'core' && await checkCoreSetComplete(maid, 3)) completeTask(message.channel, 'l3', 6000)
		return
	}).catch(err => {
		console.log(err)
		return message.channel.send(`Sorry, time's up.`)
	})
}

//BOX
if(cmd === `!box`) {
	const code = args[0] || 'DOC'
	if (code.startsWith('SS')) return message.channel.send(`Sorry, Starter Series cards are not sold by the box.`)
	const set = await Set.findOne({ where: { code: code.toUpperCase() }})
	if (!set) return message.channel.send(`There is no set with the code "${code.toUpperCase()}".`)
	if (!set.for_sale) return message.channel.send(`Sorry, ${set.name} ${eval(set.emoji)} is out of stock.`)
	if (!set.packs_per_box) return message.channel.send(`Sorry, ${set.name} ${eval(set.emoji)} is experiencing a glitch in the database. Please get an Admin to help you.`)

	const wallet = await Wallet.findOne( { where: { playerId: maid }, include: Player })
	const merchbot_wallet = await Wallet.findOne( { where: { playerId: merchbotId } })
	if (!wallet || !merchbot_wallet) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	const money = wallet[set.currency]
	if (money < set.box_price) return message.channel.send(`Sorry, ${wallet.player.name}, you only have ${money}${eval(set.currency)} and ${set.name} ${eval(set.emoji)} Boxes cost ${set.box_price}${eval(set.currency)}.`)

	const commons = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "com"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const rares = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "rar"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const supers = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "sup"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const ultras = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "ult"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const secrets = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "scr"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`${wallet.player.name}, you have ${money}${eval(set.currency)}. Do you want to spend ${set.box_price}${eval(set.currency)} on a ${set.name} ${eval(set.emoji)} Box?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send(`No problem. Have a nice day.`)
		
		message.channel.send(`Thank you for your purchase! I'll send you the contents of your ${set.name} ${eval(set.emoji)} Box.`)
		const num = set.packs_per_box
		for (let j = 0; j < num; j++) {
			const images = []
			const results = [`\n${eval(set.emoji)} - ${set.name} Pack${num > 1 ? ` ${j + 1}` : ''} - ${eval(set.alt_emoji)}`]
			const yourCommons = set.commons_per_pack > 1 ? getRandomSubset(commons, set.commons_per_pack) : set.secrets_per_pack === 1 ? [getRandomElement(commons)] : []
			const yourRares = set.rares_per_pack > 1 ? getRandomSubset(rares, set.rares_per_pack) : set.rares_per_pack === 1 ? [getRandomElement(rares)] : []
			const yourSupers = set.supers_per_pack > 1 ? getRandomSubset(supers, set.supers_per_pack) : set.supers_per_pack === 1 ? [getRandomElement(supers)] : []
			const yourUltras = set.ultras_per_pack > 1 ? getRandomSubset(ultras, set.ultras_per_pack) : set.ultras_per_pack === 1 ? [getRandomElement(ultras)] : []
			const yourSecrets = set.secrets_per_pack > 1 ? getRandomSubset(secrets, set.secrets_per_pack) : set.secrets_per_pack === 1 ? [getRandomElement(secrets)] :  []
	
			const odds = []
			if (!yourCommons.length) for (let i = 0; i < set.commons_per_box; i++) odds.push("commons")
			if (!yourRares.length) for (let i = 0; i < set.rares_per_box; i++) odds.push("rares")
			if (!yourSupers.length) for (let i = 0; i < set.supers_per_box; i++) odds.push("supers")
			if (!yourUltras.length) for (let i = 0; i < set.ultras_per_box; i++) odds.push("ultras")
			if (!yourSecrets.length) for (let i = 0; i < set.secrets_per_box; i++) odds.push("secrets")
	
			const luck = odds[j]
			const yourFoil = getRandomElement(eval(luck))
	
			const yourPack = [...yourCommons.sort(), ...yourRares.sort(), ...yourSupers.sort(), ...yourUltras.sort(), ...yourSecrets.sort(), yourFoil]
		
			for (let i = 0; i < yourPack.length; i++) {
				const print = await Print.findOne({ where: {
					card_code: yourPack[i]
				}})
	
				if (!print.id) return console.log(`${card} does not exist in the Print database.`)
				results.push(`${eval(print.rarity)}${print.card_code} - ${print.card_name}`)
	
				const card = await Card.findOne({ where: {
					name: print.card_name
				}})
		
				images.push(`${card.image}`)
				
				const inv = await Inventory.findOne({ where: { 
					card_code: print.card_code,
					printId: print.id,
					playerId: maid
				}})
	
				if (inv) {
					inv.quantity++
					await inv.save()
				} else {
					await Inventory.create({ 
						card_code: print.card_code,
						quantity: 1,
						printId: print.id,
						playerId: maid
					})
				}
			}
	
			const card_1 = fs.existsSync(`./public/card_images/${images[0]}`) ? 
				await Canvas.loadImage(`./public/card_images/${images[0]}`) :
				await Canvas.loadImage(`https://ygoprodeck.com/pics/${images[0]}`)

			const card_2 = fs.existsSync(`./public/card_images/${images[1]}`) ? 
				await Canvas.loadImage(`./public/card_images/${images[1]}`) :
				await Canvas.loadImage(`https://ygoprodeck.com/pics/${images[1]}`)

			const card_3 = fs.existsSync(`./public/card_images/${images[2]}`) ? 
				await Canvas.loadImage(`./public/card_images/${images[2]}`) :
				await Canvas.loadImage(`https://ygoprodeck.com/pics/${images[2]}`)

			const card_4 = fs.existsSync(`./public/card_images/${images[3]}`) ? 
				await Canvas.loadImage(`./public/card_images/${images[3]}`) :
				await Canvas.loadImage(`https://ygoprodeck.com/pics/${images[3]}`)

			const card_5 = fs.existsSync(`./public/card_images/${images[4]}`) ? 
				await Canvas.loadImage(`./public/card_images/${images[4]}`) :
				await Canvas.loadImage(`https://ygoprodeck.com/pics/${images[4]}`)

			const card_6 = fs.existsSync(`./public/card_images/${images[5]}`) ? 
				await Canvas.loadImage(`./public/card_images/${images[5]}`) :
				await Canvas.loadImage(`https://ygoprodeck.com/pics/${images[5]}`)

			const card_7 = fs.existsSync(`./public/card_images/${images[6]}`) ? 
				await Canvas.loadImage(`./public/card_images/${images[6]}`) :
				await Canvas.loadImage(`https://ygoprodeck.com/pics/${images[6]}`)

			const card_8 = fs.existsSync(`./public/card_images/${images[7]}`) ? 
				await Canvas.loadImage(`./public/card_images/${images[7]}`) :
				await Canvas.loadImage(`https://ygoprodeck.com/pics/${images[7]}`)

			const card_9 = fs.existsSync(`./public/card_images/${images[8]}`) ? 
				await Canvas.loadImage(`./public/card_images/${images[8]}`) :
				await Canvas.loadImage(`https://ygoprodeck.com/pics/${images[8]}`)
			
			const card_width = 57
			const canvas = Canvas.createCanvas(card_width * 9, 80)
			const context = canvas.getContext('2d')
	
			if (canvas && context && card_1) context.drawImage(card_1, 0, 0, card_width, 80)
			if (canvas && context && card_2) context.drawImage(card_2, card_width, 0, card_width, canvas.height)
			if (canvas && context && card_3) context.drawImage(card_3, card_width * 2, 0, card_width, canvas.height)
			if (canvas && context && card_4) context.drawImage(card_4, card_width * 3, 0, card_width, canvas.height)
			if (canvas && context && card_5) context.drawImage(card_5, card_width * 4, 0, card_width, canvas.height)
			if (canvas && context && card_6) context.drawImage(card_6, card_width * 5, 0, card_width, canvas.height)
			if (canvas && context && card_7) context.drawImage(card_7, card_width * 6, 0, card_width, canvas.height)
			if (canvas && context && card_8) context.drawImage(card_8, card_width * 7, 0, card_width, canvas.height)
			if (canvas && context && card_9) context.drawImage(card_9, card_width * 8, 0, card_width, canvas.height)
			const attachment =  canvas && context ?
				new Discord.MessageAttachment(canvas.toBuffer(), `pack_${j+1}.png`) :
				false
		
			message.author.send(results.join("\n"), attachment)
		}

		wallet[set.currency] -= set.box_price
		await wallet.save()

		merchbot_wallet.stardust += set.currency === 'stardust' ? set.box_price : set.box_price * 10
		await merchbot_wallet.save()

		set.unit_sales += 24
		await set.save()

		completeTask(message.channel, maid, 'e6')
		completeTask(message.channel, maid, 'm3', 3000)
		completeTask(message.channel, maid, 'm4', 4000)
		completeTask(message.channel, maid, 'h3', 5000)
		if (await checkCoreSetComplete(maid, 1)) completeTask(message.channel, 'h4', 5000)
		if (await checkCoreSetComplete(maid, 3)) completeTask(message.channel, 'l3', 6000)
		return
	}).catch(err => {
		console.log(err)
		return message.channel.send(`Sorry, time's up.`)
	})
}

//DUMP
if(cmd === `!dump`) {
	if (mcid !== botSpamChannelId &&
		mcid !== generalChannelId &&
		mcid !== marketPlaceChannelId
	) return message.channel.send(`Please use this command in <#${marketPlaceChannelId}>, <#${botSpamChannelId}> or <#${generalChannelId}>.`)

	const set_code = args.length ? args[0].toUpperCase() : 'DOC'
	const set = await Set.findOne({where: { code: set_code }})
	if (!set) return message.channel.send(`Sorry, I do not recognized the set code: "${set_code}".`)
	const player = await Player.findOne({ where: { id: maid }, include: Wallet })
	if (!player) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	const merchbot_wallet = await Wallet.findOne({ where: { playerId: merchbotId } })
	if (!merchbot_wallet) return message.channel.send(`That user is not in the database.`)
	
	const rarity = await getDumpRarity(message)
	if (rarity === 'unrecognized') return message.channel.send(`Please specify a valid rarity.`)
	if (!rarity) return

	const quantityToKeep = await getDumpQuantity(message, rarity, set_code)
	if (!quantityToKeep && quantityToKeep !== 0) return message.channel.send(`Please specify a valid quanity.`)

	const wish_to_exclude = await askForExclusions(message)
	const exclusions = wish_to_exclude ? await getExclusions(message, rarity, set) : null
	const excluded_prints = exclusions ? await getExcludedPrintIds(message, rarity, set, exclusions) : null
	if (excluded_prints === false) return
	
	const unfilteredInv = await Inventory.findAll({
		where: {
			card_code: { [Op.startsWith]: set_code },
			playerId: maid,
			quantity: { [Op.gt]: quantityToKeep }
		}, include: Print,
		order: [["card_code", "ASC"]]
	})

	const inv = rarity === 'all' && !excluded_prints ? unfilteredInv :
				rarity === 'all' && excluded_prints.length ? unfilteredInv.filter((el) => !excluded_prints.includes(el.printId) ) :
				rarity !== 'all' && !excluded_prints ? unfilteredInv.filter((el) => el.print.rarity === rarity) :
				rarity !== 'all' && excluded_prints.length ? unfilteredInv.filter((el) => !excluded_prints.includes(el.printId) && el.print.rarity === rarity) :
				[]

	if (!inv.length) return message.channel.send(`You do not have more than ${quantityToKeep} ${quantityToKeep === 1 ? 'copy' : 'copies'} of any ${rarity === 'all' ? '' : `${eval(rarity)} `}${set_code} ${eval(set_code)} cards.`)

	const cards = []
	let compensation = 0
	let count = 0

	for (let i = 0; i < inv.length; i++) {
		const sellerInv = inv[i]
		const print = sellerInv.print
		const quantityToSell = sellerInv.quantity - quantityToKeep
		count += quantityToSell
		cards.push(`${quantityToSell} ${eval(print.rarity)}${print.card_name}`)
		const price = Math.ceil(print.market_price * 0.7) * quantityToSell
		compensation += price
	}

	const dumpConfirmation = await askForDumpConfirmation(message, set, cards, compensation)
	if (!dumpConfirmation) return

	let m6success = false

	for (let i = 0; i < inv.length; i++) {
		const sellerInv = inv[i]
		const print = sellerInv.print
		const quantityToSell = sellerInv.quantity - quantityToKeep
		const price = Math.ceil(print.market_price * 0.7) * quantityToSell

		const newPrice = quantityToSell >= 16 ? price / quantityToSell :
						( price + ( (16 - quantityToSell) * sellerInv.print.market_price ) ) / 16

		if (print.rarity !== 'com' && quantityToSell >= 5) m6success = true

		const merchCount = await Inventory.count({where: {
			printId: print.id,
			playerId: merchbotId
		}})

        if (!merchCount) {
            await Inventory.create({ 
                card_code: print.card_code,
                printId: print.id,
                playerId: merchbotId
            })
        }

		const merchbotInv = await Inventory.findOne({ where: {
			card_code: print.card_code,
			printId: print.id,
			playerId: merchbotId
		}})

        const auction = await Auction.findOne({ where: { printId: print.id }})
		
        if (auction) {
            auction.quantity += quantityToSell
            await auction.save()
        } else if (merchbotInv.quantity < 1) {
            await Auction.create({
                card_code: print.card_code,
                quantity: quantityToSell,
                printId: print.id
            })
        } 

		merchbotInv.quantity += quantityToSell
		await merchbotInv.save()

		print.market_price = newPrice
		await print.save()

		sellerInv.quantity -= quantityToSell
		await sellerInv.save()
	}

	player.wallet.stardust += compensation
	await player.wallet.save()

	merchbot_wallet.stardust -= compensation
	await merchbot_wallet.save()

	if (m6success) completeTask(message.channel, maid, 'm6')
	return message.channel.send(`You sold ${count} ${rarity === 'all' ? '' : eval(rarity)}${set.code} ${set.emoji === set.alt_emoji ? eval(set.emoji) : `${eval(set.emoji)} ${eval(set.alt_emoji)}`} ${count === 1 ? 'card' : 'cards'} to The Shop for ${compensation}${stardust}.`)
}

//SELL
if(cmd === `!sell`) {
	if (mcid !== botSpamChannelId &&
		mcid !== generalChannelId &&
		mcid !== marketPlaceChannelId
	) return message.channel.send(`Please use this command in <#${marketPlaceChannelId}>, <#${botSpamChannelId}> or <#${generalChannelId}>.`)

	if (!args.length) return message.channel.send(`Please specify the card(s) you wish to sell.`)
	const sellerId = maid
	const buyerId = message.mentions.users.first() ? message.mentions.users.first().id : merchbotId	
	if (buyerId === sellerId) return message.channel.send(`You cannot sell cards to yourself.`)
	const shopSale = !!(buyerId === merchbotId)

	const sellingPlayer = await Player.findOne({ 
		where: { id: sellerId },
		include: Wallet
	})

	const buyingPlayer = await Player.findOne({ 
		where: { id: buyerId },
		include: Wallet
	})

	if (!sellingPlayer) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	if (!buyingPlayer) return message.channel.send(`That user is not in the database.`)

	const line_items = message.mentions.users.first() ? args.slice(1).join(' ').replace(/\s+/g, ' ').split(";").map((el) => el.trim()) :
														args.join(' ').replace(/\s+/g, ' ').split(";").map((el) => el.trim())
	if (!shopSale && line_items.length > 1) return message.channel.send(`You cannot sell different cards to a player in the same transaction.`)

	const invoice = shopSale ? await getInvoiceMerchBotSale(message, line_items, sellingPlayer) : await getInvoiceP2PSale(message, line_item = line_items[0], buyingPlayer, sellingPlayer)
	if (!invoice) return

	if (invoice.total_price > buyingPlayer.wallet.stardust) return message.channel.send(`Sorry, ${buyingPlayer.name} only has ${buyingPlayer.wallet.stardust} and ${invoice.quantities[0] > 1 ? `${invoice.quantities[0]} copies of ` : ''}${invoice.cards[0]} costs ${invoice.total_price}${stardust}.`)

	const sellerConfirmation = await getSellerConfirmation(message, invoice, buyingPlayer, sellingPlayer, shopSale, mention = false)
	if (!sellerConfirmation) return

	const buyerConfirmation = !shopSale ? await getBuyerConfirmation(message, invoice, buyingPlayer, sellingPlayer, shopSale, mention = true) : true
	if (!buyerConfirmation) return

	const processSale = shopSale ? await processMerchBotSale(message, invoice, buyingPlayer, sellingPlayer) : await processP2PSale(message, invoice, buyingPlayer, sellingPlayer) 
	if (!processSale) return

	if (invoice.m4success === true) completeTask(message.channel, buyerId, 'm4')

	if (shopSale) {
		if (invoice.m6success === true) completeTask(message.channel, maid, 'm6')
		return message.channel.send(`You sold ${invoice.cards.length > 1 ? `the following to The Shop for ${invoice.total_price}${stardust}:\n${invoice.cards.join('\n')}` : `${invoice.cards[0]} to The Shop for ${invoice.total_price}${stardust}`}.`)
	} else {
		if (await checkCoreSetComplete(buyerId, 1)) completeTask(message.channel, buyerId, 'h4', 4000)
		if (await checkCoreSetComplete(buyerId, 3)) completeTask(message.channel, buyerId, 'l3', 5000)
		return message.channel.send(`${sellingPlayer.name} sold ${invoice.card} to ${buyingPlayer.name} for ${invoice.total_price}${stardust}.`)
	}
}

//BUY
if(cmd === `!buy`) {
	if (mcid !== botSpamChannelId &&
		mcid !== generalChannelId &&
		mcid !== marketPlaceChannelId
	) return message.channel.send(`Please use this command in <#${marketPlaceChannelId}>, <#${botSpamChannelId}> or <#${generalChannelId}>.`)

	if (!args.length) return message.channel.send(`Please specify the card(s) you wish to buy.`)
	const buyerId = maid
	const sellerId = message.mentions.users.first() ? message.mentions.users.first().id : merchbotId	
	if (buyerId === sellerId) return message.channel.send(`You cannot buy cards from yourself.`)
	const shopSale = !!(sellerId === merchbotId)
	const info = await Info.findOne({ where: { element: 'shop'} })
	if (shopSale && info.status === 'closed') return message.channel.send(`Sorry, The Shop is closed.`)

	const sellingPlayer = await Player.findOne({ 
		where: { id: sellerId },
		include: Wallet
	})

	const buyingPlayer = await Player.findOne({ 
		where: { id: buyerId },
		include: Wallet
	})

	if (!buyingPlayer) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	if (!sellingPlayer) return message.channel.send(`That user is not in the database.`)

	const line_item = message.mentions.users.first() ? args.slice(1).join(' ').replace(/\s+/g, ' ').split(";").map((el) => el.trim()) :
														args.join(' ').replace(/\s+/g, ' ').split(";").map((el) => el.trim())
	if (line_item.length > 1) return message.channel.send(`You cannot buy different cards in the same transaction.`)

	const invoice = shopSale ? await getInvoiceMerchBotPurchase(message, line_item, buyingPlayer) : await getInvoiceP2PSale(message, line_item[0], buyingPlayer, sellingPlayer)
	if (!invoice) return

	if (invoice.total_price > buyingPlayer.wallet.stardust) return message.channel.send(`Sorry, you only have ${buyingPlayer.wallet.stardust}${stardust} and ${invoice.cards[0]} costs ${invoice.total_price}${stardust}.`)

	const buyerConfirmation = await getBuyerConfirmation(message, invoice, buyingPlayer, sellingPlayer, shopSale, mention = false)
	if (!buyerConfirmation) return

	const sellerConfirmation = shopSale ? true : await getSellerConfirmation(message, invoice, buyingPlayer, sellingPlayer, shopSale, mention = true)
	if (!sellerConfirmation) return

	const processSale = shopSale ? await processMerchBotSale(message, invoice, buyingPlayer, sellingPlayer) : await processP2PSale(message, invoice, buyingPlayer, sellingPlayer) 
	if (!processSale) return

	if (invoice.m4success === true) completeTask(message.channel, buyerId, 'm4')

	if (shopSale) {
		completeTask(message.channel, buyerId, 'e10')
		return message.channel.send(`You bought ${invoice.cards.length > 1 ? `the following from The Shop for ${invoice.total_price}${stardust}:\n${invoice.cards.join('\n')}` : `${invoice.cards[0]} from The Shop for ${invoice.total_price}${stardust}`}.`)
	} else {
		if (await checkCoreSetComplete(buyerId, 1)) completeTask(message.channel, buyerId, 'h4', 4000)
		if (await checkCoreSetComplete(buyerId, 3)) completeTask(message.channel, buyerId, 'l3', 5000)
		return message.channel.send(`${buyingPlayer.name} bought ${invoice.card} from ${sellingPlayer.name} for ${invoice.total_price}${stardust}.`)
	}
}

//BARTER
if(cmd === `!barter`) {
	const player = await Player.findOne({  
		where: { id: maid }, 
		include: [Diary, Wallet]
	})

	const diary = player.diary
	const wallet = player.wallet
	const medium_complete = diary.m1 && diary.m2 && diary.m3 && diary.m4 && diary.m5 && diary.m6 && diary.m7 && diary.m8 && diary.m9 && diary.m10
	if (!player) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)

	const direction = await getBarterDirection(message)
	if (!direction) return
	let voucher = direction === 'get_card' ? await getVoucher(message, direction) : null
	const selected_option = direction === 'get_card' ? await getBarterCard(message, voucher, medium_complete) : await getTradeInCard(message, medium_complete)
	if (!selected_option) return
	if (!voucher) voucher = selected_option[3]

	const print = await Print.findOne({ where: { card_code: selected_option[1] } })
	const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`
	if (!print) return message.channel.send(`Could not find card: "${selected_option[1]}".`)

	const price = selected_option[0]
	if (direction === 'get_card' && wallet[voucher] < price) return message.channel.send(`Sorry, you only have ${wallet[voucher]} ${eval(voucher)} and ${card} costs ${price} ${eval(voucher)}.`)

	const inv = await Inventory.findOne({ where: {
		printId: print.id,
		card_code: print.card_code,
		playerId: maid 
	}})

	if (direction === 'get_vouchers' && (!inv || inv.quantity < 1)) return message.channel.send(`Sorry, you do not have any copies of ${card}.`)

	const confirmation = await askForBarterConfirmation(message, voucher, card, price, direction)
	if (!confirmation) return

	if (inv && direction === 'get_card') {
		inv.quantity++
		await inv.save()

		wallet[voucher] -= price
		await wallet.save()
	} else if (!inv && direction === 'get_card') {
		await Inventory.create({
			printId: print.id,
			card_code: print.card_code,
			playerId: maid,
			quantity: 1
		})

		wallet[voucher] -= price
		await wallet.save()
	} else if (inv && direction === 'get_vouchers') {
		inv.quantity--
		await inv.save()

		wallet[voucher] += price
		await wallet.save()
	} else {
		return message.channel.send(`Something went wrong. You do not appear to have any copies of ${card}.`)
	}

	
	if (direction === 'get_card' && print.set_code === 'APC' && inv && inv.quantity >= 3 ) completeTask(message.channel, maid, 'h5')
	if (direction === 'get_card' && print.set_code !== 'APC' && await checkCoreSetComplete(maid, 1)) completeTask(message.channel, maid, 'h4')
	if (direction === 'get_card' && print.set_code !== 'APC' && await checkCoreSetComplete(maid, 3)) completeTask(message.channel, maid, 'l3', 3000)
	const response = direction === 'get_card' ? `Thanks! You exchanged ${price} ${eval(voucher)} for a copy of ${card}.` :
				`Thanks! You exchanged a copy of ${card} for ${price} ${eval(voucher)}.`
	return message.channel.send(response)
}


//BID
if(cmd === `!bid`) {
	const player = await Player.findOne({  
		where: { id: maid }, 
		include: [Bid, Wallet],
		order: [[Bid, 'amount', 'DESC']]})
	if (!player) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)

	const info = await Info.findOne({ where: { element: 'shop' }})
	if (info.status !== 'closed') return message.channel.send(`Bidding is only available when The Shop is closed..`)

    const count = await Auction.count()
    if (!count) return message.channel.send(`Sorry, there are no singles up for auction tonight.`)
    
	message.channel.send(`Please check your DMs.`)

	if (player.bids.length === 3) {
		return askForBidCancellation(message, player)
	} else if (player.bids.length) {
		return manageBidding(message, player)
	} else {
		return askForBidPlacement(message, player)
	}
}

//TRADE
if(cmd === `!trade`) {
	if (mcid !== botSpamChannelId &&
		mcid !== generalChannelId &&
		mcid !== marketPlaceChannelId
	) return message.channel.send(`Please use this command in <#${marketPlaceChannelId}>, <#${botSpamChannelId}> or <#${generalChannelId}>.`)

	const initiatorId = maid
	const recieverId = message.mentions.users.first() ? message.mentions.users.first().id : null
	if (!recieverId) return message.channel.send(`Please tag the user you want to trade with.`)
	if (recieverId === initiatorId) return message.channel.send(`You cannot trade cards with yourself.`)
	if (!(args.length >= 2)) return message.channel.send(`Please specify the card(s) you wish to trade.`)	
	
	const initiatingPlayer = await Player.findOne({ 
		where: { id: initiatorId },
		include: Wallet
	})

	if (!initiatingPlayer) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)

	const receivingPlayer = await Player.findOne({ 
		where: { id: recieverId },
		include: Wallet
	})

	if (!receivingPlayer) return message.channel.send(`That user is not in the database.`)

	const initiator_side = args.slice(1).join(' ').replace(/\s+/g, ' ').split(";").map((el) => el.trim())
	const initiatorSummary = await getTradeSummary(message, initiator_side, initiatingPlayer)
	if (!initiatorSummary) return
	const initiator_confirmation = await getInitiatorConfirmation(message, initiatorSummary.cards, receivingPlayer)
	if (!initiator_confirmation) return message.channel.send(`No problem. Have a nice day.`)

	const receiver_side = await getReceiverSide(message, initiatorSummary.cards, receivingPlayer)
	if (!receiver_side) return
	const receiverSummary = await getTradeSummary(message, receiver_side, receivingPlayer)
	if (!receiverSummary) return
	const receiver_confirmation = await getReceiverConfirmation(message, receiverSummary.cards, receivingPlayer)
	if (!receiver_confirmation) return setTimeout(() => message.channel.send(`Sorry, ${initiatingPlayer.name}, this trade has been rejected.`), 2000)
	
	const final_confirmation = await getFinalConfirmation(message, receiverSummary.cards, initiatingPlayer)
	if (!final_confirmation) return setTimeout(() => message.channel.send(`Sorry, ${receivingPlayer.name}, this trade has been rejected.`), 2000)

	const lastTrade = await Trade.findAll({ order: [['createdAt', 'DESC']]})
	const transaction_id = lastTrade.length ? parseInt(lastTrade[0].transaction_id) + 1 : 1

	const tradeHistory1 = await Trade.count({ 
		where: {
			senderId: initiatingPlayer.id,
			receiverId: receivingPlayer.id
		}
	})

	const tradeHistory2 = await Trade.count({ 
		where: {
			senderId: receivingPlayer.id,
			receiverId: initiatingPlayer.id
		}
	})

	if (tradeHistory1 + tradeHistory2 === 0) {
		const senderProfile = await Profile.findOne({where: { playerId: initiatingPlayer.id } })
		senderProfile.trade_partners++
		await senderProfile.save()
		if (senderProfile.trade_partners >= 20) completeTask(message.channel, initiatingPlayer.id, 'm7', 5000)

		const receiverProfile = await Profile.findOne({where: { playerId: receivingPlayer.id } })
		receiverProfile.trade_partners++
		await receiverProfile.save()
		if (receiverProfile.trade_partners >= 20) completeTask(message.channel, receivingPlayer.id, 'm7', 8000)
	}

	const processed_trade = await processTrade(message, transaction_id, initiatorSummary, receiverSummary, initiatingPlayer, receivingPlayer)
	if (!processed_trade) return

	completeTask(message.channel, initiatingPlayer.id, 'e8', 5000)
	if (await checkCoreSetComplete(initiatingPlayer.id, 1)) completeTask(message.channel, initiatingPlayer.id, 'h4', 5000)
	if (await checkCoreSetComplete(initiatingPlayer.id, 3)) completeTask(message.channel, initiatingPlayer.id, 'l3', 6000)

	completeTask(message.channel, receivingPlayer.id, 'e8', 8000)
	if (await checkCoreSetComplete(receivingPlayer.id, 1)) completeTask(message.channel, receivingPlayer.id, 'h4', 8000)
	if (await checkCoreSetComplete(receivingPlayer.id, 3)) completeTask(message.channel, receivingPlayer.id, 'l3', 9000)
	
	message.channel.send(`${receivingPlayer.name} received:\n${initiatorSummary.cards.join("\n")}\n...and...`)
	return setTimeout(() => message.channel.send(`${initiatingPlayer.name} received:\n${receiverSummary.cards.join("\n")}\n...Trade complete!`), 3000)
}

//GAUNTLET
if(cmd === `!challenge` || cmd === `!gauntlet`) {
	if(mcid !== "639907734589800458") { return message.channel.send("This command is not valid outside of the <#639907734589800458> channel.") }

	var person1 = message.channel.members.find('id', maid);
	if(!person1) { return message.channel.send("<@" + maid + ">You are not cached in the server, so you cannot play in the Gauntlet. Please change your visibility to \"Online\" to cache yourself."); }

	let rawdata = fs.readFileSync('sds023.json');
	let gauntletdata = fs.readFileSync('room.json');
	let lineup = JSON.parse(gauntletdata);
	var check;
	var initiate;
	var arrc = [];
	var rMem;

	let arra = Object.keys(lineup);
	let arrb = arra.map(function (k) {
		return lineup[k]; });

	let i = 0;
	for (i = 0; i < arrb.length; i++) {
		arrc[i] = names[arrb[i]]; }

	//if (status['gauntlet'] == 'confirming') { return message.reply("The Gauntlet confirmation process is currently underway. Please wait."); }

	if (messageArray.length > 1) { rMem = messageArray[1].replace(/[\\<>@#&!]/g, ""); }
	if (messageArray.length == 1) { return message.channel.send("\nIf you wish to challenge another player please provide:\n- an @ mention\n\n Example: **!gauntlet @Jazz**"); }

	if(!(rawdata.includes(maid))) { return message.channel.send(`You are not in the database. Type **!start** to begin the game.`) }

	if(maid === mb) { return; }
	if(rMem == maid) { return message.channel.send("You cannot challenge yourself to the Gauntlet."); }
	if(rMem == mb) { return message.channel.send ("You cannot challenge me to the Gauntlet."); } 

	if(args.length !== 0) {
		if(args[0].toLowerCase() == 'queue' || args[0].toLowerCase() == 'q') {
			if(arrc.length == 0) { return message.channel.send("The Gauntlet queue is empty."); }
		else { return message.channel.send(arrc.sort()); }}}

	if(gauntletdata.includes(maid)) { return message.channel.send("You are already fighting in the Gauntlet against " + names[room[maid]] + "."); }
	if(gauntletdata.includes(rMem)) { return message.channel.send("That player is already fighting in the Gauntlet against " + names[room[rMem]] + "."); }

	var person2 = message.channel.members.find('id', rMem);
	if(!person2) { return message.channel.send("<@" + rMem + ">, You are not cached in the server, so you cannot play in the Gauntlet. Please change your visibility to \"Online\" to cache yourself."); }

	return Merch.data.getGauntletConfirmation(client, message, maid, rMem);
}

//CLEAR
if(cmd === `!clear`) {
	if (!isAdmin(message.member)) return message.channel.send("You do not have permission to do that.")
    return message.channel.bulkDelete(100)
}

//CLEAR
if(cmd === `!clear_all`) {
	if (!isJazz(message.member)) return message.channel.send("You do not have permission to do that.")
    return setInterval(() => message.channel.bulkDelete(100), 5000) 
}

//OPEN
if(cmd === `!open`) {
	if (!isMod(message.member) && !isJazz(message.member)) return message.channel.send("You do not have permission to do that.")
	message.channel.send(`Opening the shop now.`)
	return openShop()
}

//CLOSE
if(cmd === `!close`) {
	if (!isMod(message.member) && !isJazz(message.member)) return message.channel.send("You do not have permission to do that.")
	message.channel.send(`Closing the shop now.`)
	return closeShop()
}

//ADJUST
if(cmd === `!adjust`) {
	if (!isAdmin(message.member)) return message.channel.send("You do not have permission to do that.")
	if (!args.length) return message.channel.send(`Please specify the card you wish to adjust.`)
	
	const query = args.join(' ')	
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const card_name = await findCard(query, fuzzyPrints, fuzzyPrints2)
	const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name) : null
	if (!print) return message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
	const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`

	const confirmation = await askForAdjustConfirmation(message, card, print.market_price)
	if (!confirmation) return message.channel.send(`No problem. Have a nice day.`)

	const newPrice = await getNewMarketPrice(message)
	if (!newPrice) return message.channel.send(`Sorry, you did not specify a valid price.`)

	print.market_price = newPrice
	await print.save()

	return message.channel.send(`The market price of ${card} has been adjusted to ${newPrice}${stardust}.`)
}

//MOVE
if(cmd === `!move`) {
	if (!isAdmin(message.member)) return message.channel.send("You do not have permission to do that.")
	if (!args.length) return message.channel.send(`Please specify the card you wish to move on the Forbidden & Limited list.`)
	
	const query = args.join(' ')
	const card_name = await findCard(query, fuzzyPrints, fuzzyPrints2)
	const card = card_name ? await Card.findOne({ where: { name: card_name }}) : null
	if (!card) return message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
	let konami_code = card.image.slice(0, -4)
	while (konami_code.length < 8) konami_code = '0' + konami_code
	
	const status = await Status.findOne({ where: {
		name: card_name,
		konami_code
	} })

	const old_status = status ? status.current : 'unlimited'
	const new_status = await getNewStatus(message, card, old_status)
	if (!new_status) return
	if (new_status === 'do not change') return message.channel.send(`Okay, ${card_name} will remain ${old_status}.`)
	else {
		if (status) {
			status.current = new_status
			await status.save()
		} else {
			await Status.create({
				name: card_name,
				konami_code,
				current: new_status
			})
		}

		return message.channel.send(`Okay, ${card_name} has been moved from "${old_status}" to "${new_status}".`)
	}
}

//BANLIST
if (listcom.includes(cmd)) {
	const forbidden = await Status.findAll({  where: { current: 'forbidden' } })
	const limited = await Status.findAll({  where: { current: 'limited' } })
	const semi_limited = await Status.findAll({  where: { current: 'semi-limited' } })

	const forbiddenNames = forbidden.length ? forbidden.map((card) => card.name).sort() : [`N/A`]
	const limitedNames = limited.length ? limited.map((card) => card.name).sort() : [`N/A`]
	const semi_limitedNames = semi_limited.length ? semi_limited.map((card) => card.name).sort() : [`N/A`]

	message.author.send(`**~ ${FiC} - FORBIDDEN & LIMITED LIST ${FiC} ~**` +
	`\n\n**The following cards are forbidden:**` + 
	`\n${forbiddenNames.join('\n')}` + 
	`\n\n**The following cards are limited:**` + 
	`\n${limitedNames.join('\n')}` + 
	`\n\n**The following cards are semi-limited:**` + 
	`\n${semi_limitedNames.join('\n')}`)	

	return message.channel.send(`I messaged you the Forbidden & Limited list. ${FiC}`)
}

})
