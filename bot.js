
// PACKAGES
const axios = require('axios')
const Canvas = require('canvas')
const Discord = require('discord.js')
const fs = require('fs')
const FuzzySet = require('fuzzyset')

// USEFUL CONSTANTS
const fuzzyCards = FuzzySet([], false)
const fuzzyPrints = FuzzySet([], false)
const merchbotId = '584215266586525696'

// DATABASE IMPORTS
const { Arena, Auction, Bid, Binder, Card, Daily, Diary, Draft, Entry, Gauntlet, Info, Inventory, Knowledge, Match, Nickname, Player, Pool, Print, Profile, Set, Tournament, Trade, Trivia, Wallet, Wishlist, Status } = require('./db')
const { Op } = require('sequelize')

// FUNCTION IMPORTS
const { checkArenaProgress, endArena , getArenaSample, resetArena, startArena, startRound } = require('./functions/arena.js')
const { askForBidCancellation, askForBidPlacement, manageBidding } = require('./functions/bids.js')
const { updateBinder } = require('./functions/binder.js')
const { awardStarterDeck, getDeckType, getShopDeck } = require('./functions/decks.js')
const { checkCoreSetComplete, completeTask } = require('./functions/diary.js')
const { checkDraftProgress, endDraft, resetDraft, sendInventories, createPacks, startDraft, startDraftRound, draftCards } = require('./functions/draft.js')
//const { uploadDeckFolder } = require('./functions/drive.js')
const { askForGrindAllConfirmation, askForThanosConfirmation } = require('./functions/mod.js')
const { awardPack } = require('./functions/packs.js')
const { askForAdjustConfirmation, collectNicknames, getNewMarketPrice, askForSetToPrint, selectPrint, askForRarity } = require('./functions/print.js')
const { askToChangeProfile, getFavoriteColor, getFavoriteQuote, getFavoriteAuthor, getFavoriteCard, getResetConfirmation } = require('./functions/profile.js')
const { fetchAllCardNames, fetchAllUniquePrintNames, findCard, search } = require('./functions/search.js')
const { addSheet, makeSheet, writeToSheet } = require('./functions/sheets.js')
const { applyPriceDecay, getBarterCard, getBarterQuery, getVoucher, getTribe, getTradeInCard, getBarterDirection, askForBarterConfirmation, checkShopShouldBe, getMidnightCountdown, getShopCountdown, openShop, closeShop, askForDumpConfirmation, checkShopOpen, getDumpRarity, askForExclusions, getExclusions, getExcludedPrintIds, getDumpQuantity, postBids, updateShop, clearDailies  } = require('./functions/shop.js')
const { getNewStatus } = require('./functions/status.js')
const { askForDBName, checkChallongePairing, findNextMatch, findNextOpponent, findOtherPreReqMatch, findNoShowOpponent, generateSheetData, getDeckList, getDeckName, getMatches, getTournament, getTournamentType, putMatchResult, postParticipant, removeParticipant, seed, selectTournament } = require('./functions/tournament.js')
const { processTrade, getTradeSummary, getFinalConfirmation, getInitiatorConfirmation, getReceiverSide, getReceiverConfirmation } = require('./functions/trade.js')
const { getBuyerConfirmation, getInvoiceMerchBotPurchase, getInvoiceMerchBotSale, getInvoiceP2PSale, getSellerConfirmation, processMerchBotSale, processP2PSale } = require('./functions/transaction.js')
const { askQuestion, endTrivia, resetTrivia, startTrivia } = require('./functions/trivia.js')
const { clearStatus, generateRandomString, isSameDay, hasProfile, capitalize, recalculate, createProfile, createPlayer, isNewUser, isAdmin, isAmbassador, isArenaPlayer, isDraftPlayer, isJazz, isMod, isTourPlayer, isVowel, isWithinXHours, getArenaVictories, getDeckCategory, getMedal, getRandomElement, getRandomSubset, getRarity, killFirefox, resetPlayer } = require('./functions/utility.js')

// STATIC IMPORTS
const arenas = require('./static/arenas.json')
const { arenaChannelId, botSpamChannelId, bugreportsChannelId, discussionChannelId, draftChannelId, duelRequestsChannelId, pauperChannelId, gauntletChannelId, generalChannelId, gutterChannelId, introChannelId, keeperChannelId, marketPlaceChannelId, replaysChannelId, rulesChannelId, rulingsChannelId, shopChannelId, staffChannelId, suggestionsChannelId, tournamentChannelId, triviaChannelId, welcomeChannelId } = require('./static/channels.json')
const { client } = require('./static/clients.js')
const { alchemycom, aliuscom, bindercom, botcom, boxcom, bracketcom, calccom, checklistcom, dailycom, dbcom, deckcom, dicecom, dropcom, flipcom, h2hcom, historycom, infocom, invcom, joincom, listcom, losscom, manualcom, nicknamecom, noshowcom, packcom, pfpcom, populationcom, profcom, queuecom, rankcom, reducecom, referralcom, rolecom, specialcom, startcom, statscom, undocom, walletcom, wishlistcom, yescom } = require('./static/commands.json')
const decks = require('./static/decks.json')
const diaries = require('./static/diaries.json')
const { abuser, aight, galaxy, orange, robbed, king, beast, blue, bonk, bronze, cactus, cavebob, checkmark, com, skull, familiar, battery, credits, cultured, diamond, dinosaur, DOC, LPK, egg, emptybox, evil, FiC, fire, fish, forgestone, god, gold, greenmark, hook, hmmm, koolaid, leatherbound, legend, lmfao, lmf3dao, mad, master, merchant, milleye, moai, mushroom, no, ORF, TEB, FON, warrior, shrine, spellcaster, DRT, fiend, thunder, zombie, dragon, plant, platinum, rar, red, reptile, rock, rocks, rose, sad, scr, silver, soldier, starchips, stardust, stare, stoned, downward, upward, sup, tix, tres, ult, vince, wokeaf, yellow, green, waah, wut, yes, ygocard, orb, swords, gem, champion, open, closed, fishstare, draft } = require('./static/emojis.json')
const jazz = require('./static/jazz.json')
const { adminRole, arenaRole, botRole, draftRole, expertRole, fpRole, modRole, muteRole, noviceRole, tourRole, triviaRole } = require('./static/roles.json')
const { challongeAPIKey } = require('./secrets.json')
const trivia = require('./trivia.json')
const ygoprodeck = require('./static/ygoprodeck.json')

//READY
client.on('ready', async () => {
	console.log('MerchBot is online!')
	const allCards = await fetchAllCardNames()
    allCards.forEach((card) => fuzzyCards.add(card))
	const allUniquePrints = await fetchAllUniquePrintNames()
    allUniquePrints.forEach((card) => fuzzyPrints.add(card))

	const midnightCountdown = getMidnightCountdown()

	setTimeout(() => clearDailies(), midnightCountdown)
	setTimeout(() => applyPriceDecay(), midnightCountdown + 10000)
	
	const shopShouldBe = checkShopShouldBe()
	const shopCountdown = getShopCountdown()
	const shopOpen = await checkShopOpen()

	if (shopOpen) {
		updateShop()
	} else {
		postBids()
	}

	setInterval(async () =>  {
		const shopOpen = await checkShopOpen()
		if (shopOpen) {
			updateShop()
		} else {
			postBids()
		}
	}, 1000 * 60 * 10)

	if (!shopShouldBe) return client.channels.cache.get(staffChannelId).send({ content: `<@&${adminRole}>, The Shop status could not be read from the database.`})
	if (!shopOpen && shopShouldBe === 'open') client.channels.cache.get(staffChannelId).send({ content: `<@&${modRole}>, The Shop is unexpectedly closed.`})
	if (shopOpen && shopShouldBe === 'closed') client.channels.cache.get(staffChannelId).send({ content: `<@&${modRole}>, The Shop is unexpectedly open.`})

	if (shopShouldBe === 'closed') {
		return setTimeout(() => openShop(), shopCountdown)
	} else if (shopShouldBe === 'open') {
		return setTimeout(() => closeShop(), shopCountdown)
	}
})
  
//WELCOME
client.on('guildMemberAdd', async (member) => {
	const userId = member.user.id
    const channel = client.channels.cache.get(welcomeChannelId)
	const player = await Player.findOne({ where: { id: userId }})
    if (player && player.muted) member.roles.add(muteRole)

    if (await isNewUser(userId)) {
        createPlayer(userId, member.user.username, member.user.tag) 
        return channel.send({ content: `${member} Welcome to the Forged in Chaos ${FiC} Discord server! Go to <#${botSpamChannelId}> and type **!start** to begin playing. ${legend}`})
    } else {
		const player = await Player.findOne({ where: { id: userId }})
		if (player.stats >= 530) member.roles.add(expertRole)
		else member.roles.add(noviceRole)
        return channel.send({ content: `${member} Welcome back to the Forged in Chaos ${FiC} Discord server! We missed you. ${soldier}`})
    }
})
    
//GOODBYE
client.on('guildMemberRemove', member => client.channels.cache.get(welcomeChannelId).send({ content: `Oh dear. ${member.user.username} has left the server. ${sad}`}))

//COMMANDS
client.on('messageCreate', async (message) => {
    const mcid = message.channel.id
    if (
		//no commands in DMs
		!message.guild || 
		//no commands from bots
		message.author.bot || 
		//do not allow users to parrot @everyone with the bot
		message.content.includes('@everyone') ||
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
		//no commands in replays, rules, shop, intro, bugreports
		mcid === replaysChannelId || 
		mcid === rulesChannelId ||
		mcid === shopChannelId || 
		mcid === introChannelId || 
		mcid === bugreportsChannelId
	) return

	//remove extra spaces between arguments
    const marr = message.content.split(' ')
	for(let i = 0; i < marr.length; i++) {
		if (marr[i] === '') { 
			marr.splice(i, 1)
			i--
		}
	}

	//convert all commands to lowercase
    const cmd = marr[0].toLowerCase()
    const args = marr.slice(1)
    const maid = message.author.id

//CARD SEARCH USING CURLY BRACKETS
if (!message.content.startsWith("!") && message.content.includes(`{`) && message.content.includes(`}`)) { 
	if (message.member.roles.cache.some(role => role.id === triviaRole)) return message.channel.send({ content: `You cannot search for cards while playing Trivia.`})
	const query = message.content.slice(message.content.indexOf('{') + 1, message.content.indexOf('}'))
	const { cardEmbed, attachment } = await search(query, fuzzyCards)
	if (!cardEmbed) return message.channel.send({ content: `Could not find card: "${query}".`})
	if (attachment) {
		return message.channel.send({ embeds: [cardEmbed], files: [attachment] })
	} else {
		return message.channel.send({ embeds: [cardEmbed] })
	}
}

//PING 
if (cmd === `!ping`) return message.channel.send({ content: '🏓'})

//TEST
if(cmd === `!test`) {
	if (isJazz(message.member)) {
		
		} else {
		return message.channel.send({ content: '🧪'})
	}
}

//DECAY
if(cmd === `!decay`) {
	if (isJazz(message.member)) {
		return applyPriceDecay()
	} else {
		return message.channel.send({ content: 'You do not have permission to do that.'})
	}
}

//FIX
if(cmd === `!fix`) {
	if (isJazz(message.member)) {		
		const playerId = '194147938786738176'
		for (let i = 0; i < jazz.length; i++) {
			const el = jazz[i]
			const card_code = el.slice(0, el.indexOf(' - '))
			const quantity = parseInt(el.slice(-1))
			const print = await Print.findOne({
				where: {
					card_code
				}
			})

			if (!print) {
				console.log(`NO PRINT for ${card_code}`)
				continue
			} 

			const inv = await Inventory.create({
				card_code,
				quantity,
				playerId,
				printId: print.id
			})

			if (!inv) {
				console.log(`FAILED to CREATE inv: ${card_code} - ${quantity}`)
				continue
			} 
		}

		return message.channel.send({ content: `Jazz's inventory was restored.`})
	} else {
		return message.channel.send({ content: '🛠️'})
	}
}


//DING
if(cmd === `!ding`) return message.channel.send({ content: '🚪'})

//HI
if(cmd === `!hi`) return message.channel.send({ content: '👋'})

//WHAT
if(cmd === `!what`) return message.channel.send({ content: '❓'})

//5MIN
if(cmd === `!5min`) return message.channel.send({ content: fishstare })

//SHIT
if(cmd === `!shit`) return message.channel.send({ content: '💩' })

//STOP
if(cmd === `!stop`) return message.channel.send({ content: '🛑' })

//AJT
if(cmd === `!ajt` || cmd === `!ajtbls`) return message.channel.send({ content: '🧑‍🌾' })

//ALISAE
if(cmd === `!alisae`) return message.channel.send({ content: stoned })

//ARETOS
if(cmd === `!aretos`) return message.channel.send({ content: hmmm })

//CALEB
if(cmd === `!caleb`) return message.channel.send({ content: robbed })

//CAMERON
if(cmd === `!cam` || cmd === `!cameron`) return message.channel.send({ content: stare })

//DYL
if(cmd === `!dyl`) return message.channel.send({ content: soldier })

//FUSION
if(cmd === `!fusion`) return message.channel.send({ content: '🐈' })

//INDICUD
if(cmd === `!indicud` || cmd === `!indi`) return message.channel.send({ content: fish })

//JAZZ
if(cmd === `!jazz`) return message.channel.send({ content: '🎷' })

//KIZARU
if(cmd === `!kizaru`) return message.channel.send({ content: '🇮🇹' })

//LITO
if(cmd === `!lito`) return message.channel.send({ content: aight })

//LIVD
if(cmd === `!livd`) return message.channel.send({ content: moai })

//NB96
if(cmd === `!nb96`) return message.channel.send({ content: dragon })

//PAYDRO
if(cmd === `!paydro` || cmd === `!itspaydro18`) return message.channel.send({ content: cavebob })

//RANDAGE
if(cmd === `!randage`) return message.channel.send({ content: lmf3dao })

//RIKKU
if(cmd === `!rikku`) return message.channel.send({ content: yes })

//SCOOPS
if(cmd === `!scoops` || cmd === `!jmoney`) return message.channel.send({ content: vince })

//STLF
if(cmd === `!stlf`) return message.channel.send({ content: waah })

//SUPREME
if(cmd === `!supreme`) return message.channel.send({ content: '💀' })

//SUPERB
if(cmd === `!superb`) return message.channel.send({ content: red })

//VULDREAD
if(cmd === `!vuldread`) return message.channel.send({ content: bonk })

//ZOIDBERG
if(cmd === `!zoidberg`) return message.channel.send({ content: '🦞' })

//YELLOW
if(cmd === `!yellow`) return message.channel.send({ content: '🟨' })

//YUNO
if(cmd === `!yuno` || cmd === `!yunogasai666`) return message.channel.send({ content: cultured })

//OPERATION
if(cmd === `!operation`) return message.channel.send({ content: '❄️☃️❄️☃️❄️' })

//IMPORT_DATA
if (cmd === `!import_card_data`) {
	if (!isJazz(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})
	const { data } = await axios.get('https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=Yes')
	fs.writeFile("./static/ygoprodeck.json", JSON.stringify(data), (err) => { 
		if (err) console.log(err)
	})

	return message.channel.send({ content: `Successfully imported the latest data from ygoprodeck.com.`})
}

//IMPORT_PRINT_IMAGES
if (cmd === `!import_print_images`) {
	if (!isJazz(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})
	const allPrints = await Print.findAll({ order: [["card_name", "ASC"]] })

	for (let i = 0; i <= allPrints.length; i++) {
		const print = allPrints[i]
		const card = await Card.findOne({ where: {
			name: print.card_name
		}})

		if (!card) {
			console.log(`failure for ${print.card_name}`)
			continue
		} 

		console.log(`found card ${card.name}, ${card.image_file}`)
		const url = `https://ygoprodeck.com/pics/${card.image_file}`
		const writer = fs.createWriteStream(`./public/card_images/${card.image_file}`)
		
		const response = await axios({
			url,
			method: 'GET',
			responseType: 'stream'
		})

		const success = await response.data.pipe(writer)
		console.log(`success = ${!!success} for ${card.image_file}`)
	}

	return message.channel.send({ content: `Successfully imported high quality images for Forged in Chaos cards from YGOPRODeck.`})
}

//IMPORT_ALL_IMAGES
if (cmd === `!import_all_images`) {
	if (!isJazz(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})
	const file_names = fs.readdirSync('./public/card_images')
	const all_cards = await Card.findAll()
	let count = 0
	let successes = 0
	
	for (let i = 0; i <= all_cards.length; i++) {
		const name = all_cards[i].name
		const image_url = all_cards[i].image_file
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

	return message.channel.send({ content: `Successfully downloaded ${successes} out of ${count} images from YGOPRODeck.com!`})
}

//UPDATE CARDS
if (cmd === `!update_cards`) {
	if (!isJazz(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})
	const cards = await Card.findAll()
	const cardNames = cards.map((c) => c.name)

	const newCards = ygoprodeck.data.filter((c) => {
		if (!cardNames.includes(c.name)) return c
	})

	if (!newCards.length) return message.channel.send({ content: `Could not find any new Yu-Gi-Oh! cards on YGOPRODeck.com.`})

	let created = 0

	for (let i = 0; i < newCards.length; i++) {
		const card = newCards[i]
		if (
			card.type === 'Token' || 
			card.name.includes('(Skill Card)') || 
			(!card.misc_info[0].tcg_date && !card.misc_info[0].ocg_date) 
		) continue

		const image_file = `${card.id}.jpg`
		const name = card.name
		let konami_code = card.id
		while (konami_code.length < 8) konami_code = '0' + konami_code
		const category = card.type.includes('Monster') ? 'Monster' : card.type.includes('Spell') ? 'Spell' : 'Trap'
		const tcg_legal = card.misc_info[0].formats.includes('TCG')
		const ocg_legal = card.misc_info[0].formats.includes('OCG')
		const icon = category === 'Spell' || category === 'Trap' ? card.race : null
		const normal = category === 'Monster' && card.type.includes('Normal')
		const effect = category === 'Monster' && card.type.includes('Effect')
		const fusion = category === 'Monster' && card.type.includes('Fusion')
		const ritual = category === 'Monster' && card.type.includes('Ritual')
		const synchro = category === 'Monster' && card.type.includes('Synchro')
		const xyz = category === 'Monster' && card.type.includes('Xyz')
		const pendulum = category === 'Monster' && card.type.includes('Pendulum')
		const link = category === 'Monster' && card.type.includes('Link')
		const flip = category === 'Monster' && card.type.includes('Flip')
		const gemini = category === 'Monster' && card.type.includes('Gemini')
		const spirit = category === 'Monster' && card.type.includes('Spirit')
		const toon = category === 'Monster' && card.type.includes('Toon')
		const tuner = category === 'Monster' && card.type.includes('Tuner')
		const union = category === 'Monster' && card.type.includes('Union')
		const attribute = card.attribute
		const type = category === 'Monster' ? card.race : null
		const level = card.level || card.rank
		const rating = card.linkVal
		const atk = card.atk
		const def = card.def
		const description = card.desc
		const tcg_date = card.misc_info[0].tcg_date 
		const ocg_date = card.misc_info[0].ocg_date
		
		try {
			await Card.create({
				name,
				konami_code,
				tcg_legal,
				ocg_legal,
				image_file,
				category,
				icon,
				normal,
				effect,
				fusion,
				ritual,
				synchro,
				xyz,
				pendulum,
				link,
				flip,
				gemini,
				spirit,
				toon,
				tuner,
				union,
				attribute,
				type,
				level,
				rating,
				atk,
				def,
				description,
				tcg_date,
				ocg_date
			})
		} catch (err) {
			console.log(err)
		}

		created++
	}	

	if (!created) return message.channel.send({ content: `Could not find any new Yu-Gi-Oh! cards on YGOPRODeck.com.`})
	return message.channel.send({ content: `You added ${created} new cards from YGOPRODeck.com to the Format Library database.`})
}

//FIX CARDS 
if (cmd === `!fix_cards`) {
	if (!isJazz(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})
	const ygoprodeckCards = ygoprodeck.data
	let updated = 0
	
	for (let i = 0; i < ygoprodeckCards.length; i++) {
		const ypd_card = ygoprodeckCards[i]
		const card = await Card.findOne({ where: { name: ypd_card.name }})
		if (!card) {
			continue
		}
		console.log('card.name', card.name)
		let arrows = ''
		if (ypd_card.linkmarkers && ypd_card.linkmarkers.length) {
			ypd_card.linkmarkers.forEach((lm) => arrows += `-${lm.charAt(0)}`)
			card.arrows = arrows.slice(1)
		}

		card.ocg_date = ypd_card.misc_info[0].ocg_date
		await card.save() 
		updated++
	}

	console.log('ygoprodeckCards.length', ygoprodeckCards.length)
	return message.channel.send({ content: `You fixed the information for ${updated} cards in the Format Library database.`})
}

//NEW SET
if (cmd === `!new_set`) {
	if (!isJazz(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})
	
	const set = {
		code: "LP1",
		name: "Luxury Pack 1",
		type: "mini",
		emoji: "LPK",
		alt_emoji: "LPK",
		size: 20,
		commons: 0,
		rares: 0,
		supers: 10,
		ultras: 5,
		secrets: 5,
		specials: 0,
		for_sale: false,
		spec_for_sale: false,
		unit_price: 60,
		unit_sales: 0,
		cards_per_pack: 5,
		packs_per_box: 1,
		supers_per_pack: 3,
		ultras_per_pack: 1,
		secrets_per_pack: 1,
		commons_per_box: 0,
		rares_per_box: 0,
		supers_per_box: 3,
		ultras_per_box: 1,
		secrets_per_box: 1
	}

	await Set.create(set)
	message.channel.send({ content: `I created a new set: ${set.name} ${eval(set.emoji)}${set.emoji !== set.alt_emoji ? ` ${eval(set.alt_emoji)}` : ''}.`})
}


//KONAMI
if (cmd === `!konami`) {
	if (!isJazz(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})
	const prints = await Print.findAll()

	for (let i = 0; i < prints.length; i++) {
		const print = prints[i]
		const card = await Card.findOne({
			where: {
				name: print.card_name
			}
		})

		if (print.card_id !== card.id) {
			console.log(`print.card_id !== card.id`, print.card_name, 'is:', print.card_id, 'should be:', card.id)
			print.card_id = card.id
		}

		let konami_code = card.konami_code
		while (konami_code.length < 8) konami_code = '0' + konami_code
		print.konami_code = konami_code

		const color = card.category === 'Monster' && card.fusion ? 'purple' :
			card.category === 'Monster' && card.normal ? 'yellow' :
			card.category === 'Monster' && card.ritual ? 'blue' :
			card.category === 'Monster' && card.effect ? 'orange' :
			card.category === 'Spell' ? 'green' :
			card.category === 'Trap' ? 'violet' :
			null
		
		print.color = color
				
		await print.save()
	}
}

//INIT
if (cmd === `!init`) {
	if (!isJazz(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})
	const count = await Info.count()
	if (count) return message.channel.send({ content: `The game has already been initialized.`})

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

	message.channel.send({ content: `I created 3 sets (SS1, DOC, LPK, APC). Please reset the bot for these changes to take full effect.`})

	if (!(await isNewUser(merchbotId))) return message.channel.send({ content: `The Shop has already been initiated.`})
	await createPlayer(merchbotId, 'MerchBot', 'MerchBot#1002')
	await createProfile(merchbotId, 'none')

	return message.channel.send({ content: `You initialized The Shop!`})
}

//ALIUS 
if (aliuscom.includes(cmd)) {
	if (!isAmbassador(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})
	const query = args.join(' ')
	if (!query) return message.channel.send({ content: `Please specify a card.`})
	const card_name = await findCard(query, fuzzyPrints)
	if (!card_name) return message.channel.send({ content: `Could not find card: "${query}".`})
	const card = await Card.findOne({ where: { name: card_name }})
	if (!card) return message.channel.send({ content: `I could not find "${card_name}" in the Format Library database.`})

	const new_nicknames = await collectNicknames(message, card_name)
	const values = [...new_nicknames.values()]
	if (!values.length) return message.channel.send({ content: `Sorry, time's up.`})

	for (let i = 0; i < values.length; i++) {
		const alius = values[i].content.toLowerCase()
		const old_nick = await Nickname.findOne({ where: { alius } })
	
		if (old_nick) {
			message.channel.send({ content: `"${alius}" was previously used for ${old_nick.card_name}.`})
			await old_nick.destroy()
		} 

		try {
			await Nickname.create({
				alius,
				card_name
			})
			
			message.channel.send({ content: `Created an alius for ${card_name}: ${alius}`})
		} catch (err) {
			console.log(err)
			message.channel.send({ content: `"${alius}" was already being used for ${card_name}.`})
		}
	}
}

//NICKNAMES
if (nicknamecom.includes(cmd)) {
	const query = args.join(' ')
	if (!query) return message.channel.send({ content: `Please specify a card.`})
	const card_name = await findCard(query, fuzzyCards)
	if (!card_name) return message.channel.send({ content: `Could not find card: "${query}".`})
	const card = await Card.findOne({ where: { name: card_name }})
	if (!card) return message.channel.send({ content: `I could not find "${card_name}" in the Format Library database.`})

	const allNicknames = await Nickname.findAll({ where: { card_name: card_name } })
	if (!allNicknames) return message.channel.send({ content: `Could not find any nicknames for: ${card_name}.`})
	const names_only =  allNicknames.map((nick) => nick.alius )
	
	return message.channel.send({ content: `Nicknames for ${card_name}:\n${names_only.sort().join("\n")}`})
}

//PRINT 
if (cmd === `!print`) {
	if (!isAdmin(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})
	const info = await Info.findOne({ where: { element: 'set_to_print' }})
	const set_code = info ? info.status : null
	let set = set_code ? await Set.findOne({ where: { code: set_code }}) : await askForSetToPrint(message)
	if (!set) return message.channel.send({ content: `Could not find set.`})
	const currentCount = await Print.count({ where: { set_code: set.code }})
	if (currentCount >= set.size) set = await askForSetToPrint(message)
	if (!set) return message.channel.send({ content: `Could not find set.`})
	
	const query = args.join(' ')
	if (!query) return message.channel.send({ content: `Please specify a card you would like to print.`})
	const card_name = await findCard(query, fuzzyCards)
	if (!card_name) return message.channel.send({ content: `Could not find card: "${query}".`})
	const card = await Card.findOne({ where: { name: card_name }})
	if (!card) return message.channel.send({ content: `I could not find "${card_name}" in the Format Library database.`})

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

		for (let i = 0; i < set.specials; i++) {
			rarity_matrix.push("sup")
		}
	}

	const rarity = set.type === 'core' ? rarity_matrix[card_slot] : await askForRarity(message, set, currentPrints)
	if (!rarity) return message.channel.send({ content: `Something is wrong with the rarity.`})

	const market_price = rarity === 'com' ? 9 :
		rarity === 'rar' ? 40 :
		rarity === 'sup' ? 64 :
		rarity === 'ult' && set.code === "APC" ? 360 :
		rarity === 'ult' ? 184 :
		rarity === 'scr' ? 256 :
		20

	const draft = !!set_code.startsWith('GL')
	const hidden = !!set_code.startsWith('CH')

	let frozen = false
	const prints = await Print.findAll({ where: { card_name: card_name } })
	for (let i = 0; i < prints.length; i++) {
		frozen = true
		const old_print = prints[i]
		old_print.frozen = true
		await old_print.save()
	}

	const print = {
		card_name: card.name,
		card_id: card.id,
		set_code: set.code,
		setId: set.id,
		card_code,
		card_slot,
		rarity,
		market_price,
		trending_down: false,
		trending_up: false,
		draft,
		hidden,
		frozen
	}

	await Print.create(print)


	return message.channel.send({ content: `Created a new print: ${eval(rarity)}${card_code} - ${card_name} - ${stardust}${market_price}`})
}
 

//AVATAR 
if (pfpcom.includes(cmd)) {
	const user = message.mentions.users.first()
	const avatar = user ? user.displayAvatarURL() : message.author.displayAvatarURL()
	return message.channel.send({ content: avatar })
}


//DUELINGBOOK NAME
if (dbcom.includes(cmd)) {
	const user = message.mentions.users.first()
	const playerId = user ? user.id : maid
	const player = await Player.findOne({ where: { id: playerId } })

	if (user && player.duelingBook) return message.channel.send({ content: `${player.name}'s DuelingBook name is: ${player.duelingBook}.` })
	if (user && !player.duelingBook) return message.channel.send({ content: `${player.name} does not have a DuelingBook name in our database.` })

	if (args.length) {
		player.duelingBook = args.join(' ')
		await player.save()
		return message.channel.send({ content: `Your DuelingBook username has been set to: ${player.duelingBook}.` })
	} else if (player.duelingBook) {
		return message.channel.send({ content: `Your DuelingBook username is: ${player.duelingBook}.` })
	} else {
		return message.channel.send({ content: `You do not have a DuelingBook username registered to our database. Please use the command **!db** followed by your DuelingBook username to register it.` })
	}
}


//STARTER OR START
if(startcom.includes(cmd)) {
	if ( message.channel === client.channels.cache.get(tournamentChannelId) && isMod(message.member) ) {
		const tournaments = await Tournament.findAll({ where: { state: 'pending' }, order: [['createdAt', 'ASC']] })
		const tournament = await selectTournament(message, tournaments, maid)
		if (!tournament) return message.channel.send({ content: `Error: Could not find pending tournament.`})
        const { name, id, url } = tournament
		const unregistered = await Entry.findAll({ where: { participantId: null, tournamentId: id } })
        if (unregistered.length) return message.channel.send({ content: 'One of more players has not been signed up. Please check the Database.'})
		const entries = await Entry.findAll({ where: { tournamentId: id } })
		const set = await Set.findOne({ where: { code: 'CH2' } })
		if (!entries.length || !set) return message.channel.send({ content: `Error: missing needed information.`})
		const { sheet1Data, sheet2Data } = await generateSheetData()
		const success = await seed(message, id)
		if (!success) return message.channel.send({ content: `Error seeding tournament. Please try again or start it manually.`})

		const { status } = await axios({
			method: 'post',
			url: `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournament.id}/start.json`
		})

		if (status === 200) { 
			tournament.state = 'underway'
			await tournament.save()
			const spreadsheetId = await makeSheet(`${name} Deck Lists`, sheet1Data)
			await addSheet(spreadsheetId, 'Summary')
			await writeToSheet(spreadsheetId, 'Summary', 'RAW', sheet2Data)
			//await uploadDeckFolder(name)
			
			message.channel.send({ content: `Please wait while I open some pack(s)... ${blue}`})
			for (let i = 0; i < entries.length; i++) {
				const playerId = entries[i].playerId
				const wallet = await Wallet.findOne({ where: { playerId: playerId }})
				wallet.stardust -= 50
				await wallet.save()
				await awardPack(message.channel, playerId, set, 1)
			}
	
			return message.channel.send({ content: `Let's go! Your tournament is starting now: https://challonge.com/${url} ${FiC}`})
		} else {
			return message.channel.send({ content: `Error: could not access Challonge.com.`})
		}
	} else {
		if(await isNewUser(maid)) await createPlayer(maid, message.author.username, message.author.tag)
		if(await hasProfile(maid)) return message.channel.send({ content: "You already received your first Starter Deck."})
		const set1 = await Set.findOne({ where: { code: 'DOC' }})
		const set2 = await Set.findOne({ where: { code: 'ORF' }})
		const set3 = await Set.findOne({ where: { code: 'TEB' }})
		const set4 = await Set.findOne({ where: { code: 'FON' }})
		const set5 = await Set.findOne({ where: { code: 'DRT' }})
		const set6 = await Set.findOne({ where: { code: 'LP1' }})
		if (!set1 || !set2 || !set3 || !set4 || !set5 || !set6) return message.channel.send({ content: `Could not find sets: "DOC", "ORF", "TEB", "FON", "DRT", or "LP1".`})
	
		const filter = m => m.author.id === maid
		message.channel.send({ content: `Greetings, champ! Which deck would you like to start?\n- (1) Reptile\'s Charm ${reptile}\n- (2) Warrior\'s Legend ${warrior}`})
		await message.channel.awaitMessages({ filter,
			max: 1,
			time: 30000
		}).then(async (collected) => {
			const response = collected.first().content.toLowerCase()
			const starter = response.includes('rep') || response.includes(reptile) || response.includes("(1)") || response === "1" ? 'reptile' :
				response.includes('war') || response.includes(warrior) || response.includes === "(2)" || response === "2" ? 'warrior' :
				null
	
			if (!starter) return message.channel.send({ content: 'You did not select a valid Starter Deck. Please type **!start** to try again.'})
			await awardStarterDeck(maid, starter)
			await createProfile(maid, starter)
			message.member.roles.add(fpRole)
			message.member.roles.add(noviceRole)
			message.channel.send({ content: `Excellent choice, ${message.author.username}! ${legend}` +
			`\nYou received a copy of ${starter === "reptile" ? `Reptile's Charm ${reptile}` : `Warrior's Legend ${warrior}`} and the **Forged Players** role! ${wokeaf}` +
			`\nPlease wait while I open some packs... ${blue}`
			})
	
			await awardPack(message.channel, maid, set1, 24)
			await awardPack(message.channel, maid, set2, 24)
			await awardPack(message.channel, maid, set3, 24)
			await awardPack(message.channel, maid, set4, 24)
			await awardPack(message.channel, maid, set5, 24)
			await awardPack(message.channel, maid, set6, 5)
			await completeTask(message.channel, maid, 'e1')
			await completeTask(message.channel, maid, 'm4', 4000)
			return message.channel.send({ content: `I wish you luck on your journey, new duelist! ${master}`})
		}).catch((err) => {
			console.log(err)
			return message.channel.send({ content: `Sorry, time's up.`})
		})
	}
}

//MUTE 
if(cmd === `!mute`) {
	if (!isMod(message.member)) return message.channel.send({ content: "You do not have permission to do that."})
	const member = message.mentions.members.first()
	if (!member) return message.channel.send({ content: `Please tag the user you wish to mute.`})
	const player = await Player.findOne({ where: { id: member.user.id }})
	if (!player) await createPlayer(member.user.id, member.user.username, member.user.tag, muted = true)

	if (!member.roles.cache.some(role => role.id === muteRole)) {
		if (player) {
			player.muted = true
			await player.save()
		}

		member.roles.add(muteRole)
		return message.channel.send({ content: `${member.user.username} now has the Mute role.`})
	} else {
		return message.channel.send({ content: `That user is already muted.`})
	}
}

//UNMUTE 
if(cmd === `!unmute`) {
	if (!isAdmin(message.member)) return message.channel.send({ content: "You do not have permission to do that."})
	const member = message.mentions.members.first()
	if (!member) return message.channel.send({ content: `Please tag the user you wish to mute.`})
	const player = await Player.findOne({ where: { id: member.user.id }})
	if (!player) await createPlayer(member.user.id, member.user.username, member.user.tag, muted = false)

	if (member.roles.cache.some(role => role.id === muteRole)) {
		if (player) {
			player.muted = false
			await player.save()
		}

		member.roles.remove(muteRole)
		return message.channel.send({ content: `${member.user.username} no longer has the Mute role.`})
	} else {
		return message.channel.send({ content: `That user was not muted.`})
	}
}
    
//ROLE 
if (rolecom.includes(cmd)) {
	if (!message.member.roles.cache.some(role => role.id === fpRole)) {
		message.member.roles.add(fpRole)
		return message.channel.send({ content: `You now have the Forged Players role.`})
	} else {
		message.member.roles.remove(fpRole)
		return message.channel.send({ content: `You no longer have the Forged Players role.`})
	}
}

//BOT USER GUIDE 
if (botcom.includes(cmd)) {
	const rank = isJazz(message.member) ? 4 :
		isAdmin(message.member) ? 3 :
		isMod(message.member) ? 2 :
		isAmbassador(message.member) ? 1 :
		null
	
	const position = rank >= 3 ? 'Admin' :
		rank === 2 ? 'Mod' :
		rank === 1 ? 'Ambassador' :
		null

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
			+ `\n!spec (set) - Buy a Special Edition with 3 Packs.`
			+ `\n!box (set) - Buy a Box of 24 Packs.`
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
			+ `\n!hist (card) - View the trade history for a card.`
			+ `\n!pop (card) - Post the population stats for a card.`
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
			+ rank ? `\n!mod - View the ${position} User Manual.` : ''
			+ `\n!info - Post information about a channel.`
			+ `\n!ref (@user) - Send a referral bonus to another player.`
		)
	
	message.author.send({ embeds: [botEmbed]})
	return message.channel.send({ content: "I messaged you the MerchBot User Manual." })
}

//MOD USER GUIDE 
if (cmd === `!mod`) {
	const rank = isJazz(message.member) ? 4 :
		isAdmin(message.member) ? 3 :
		isMod(message.member) ? 2 :
		isAmbassador(message.member) ? 1 :
		null

	const position = rank >= 3 ? 'Admin' :
		rank === 2 ? 'Mod' :
		rank === 1 ? 'Ambassador' :
		null
	
	if (!rank) return message.channel.send({ content: "You do not have permission to do that."})
	const botEmbed = new Discord.MessageEmbed()
		.setColor('#8062cc')
		.setTitle(`MerchBot - ${position} User Manual`)
		.setDescription('A Manager Bot for Forged in Chaos.' )
		.setURL('https://forgedinchaos.com/')
		.setAuthor('Jazz#2704', 'https://i.imgur.com/wz5TqmR.png', 'https://formatlibrary.com/')
		.setThumbnail('https://i.imgur.com/p8H4dcu.png')
		.addField(`Main Game Commands`,
			`!alias (card) - Add nicknames for a card.`
			+ rank >= 2 ? `\n!manual (@winner + @loser) - Manually record a match result.` : ''
			+ rank >= 2 ? `\n!undo - Undo the last match, even if you did not report it.` : ''
			+ rank >= 2 ? `\n!award (@user + num + item) - Award an item to a player.` : ''
			+ rank >= 2 ? `\n!steal (@user + num + item) - Steal an item from a player.` : ''
		)
		.addField(`Mini-Game Commands`,
			`!remove (@user) - Remove a player from a mini-game.`
			+ `\n!reset - Reset a mini-game.`
			+ `\n!resume - Resume a stalled mini-game.`
			+ `\n!end - End a mini-game.`
		)
		
	if (rank >= 2) {
		botEmbed.addField('Mod-Only Discipline Commands',
			`!mute (@user) - Mute a user.`
			+ `\n!unmute (@user) - Unmute a user.`
		)
	}

	if (rank >= 3) {
		botEmbed.addField('Tournament Commands',
			`!create (tournament name) - Create a new tournament.`
			+ `\n!signup (@user) - Directly add a player to the bracket.`
			+ `\n!remove (@user) - Remove a player from the bracket.`
			+ `\n!start - Start the next tournament.`
			+ `\n!noshow (@user) - Report a tournament no-show.`
			+ `\n!end (tournament) - End a tournament.`
			+ `\n!destroy (tournament) - Destroy a tournament.`
		)

		botEmbed.addField('Admin-Only Commands', 
			`!adjust (card) - Adjust the market price of a card.`
			+ `\n!move (card) - Move a card on the Forbidden & Limited List.`
			+ `\n!print (card) - Print a card in the next set.`
			+ `\n!census - Update the information of all players in the database.`
			+ `\n!grindall - Grind everyone\'s Starchips into Stardust.`
			+ `\n!recalc - Recaluate all player stats if needed.`
		)
	}
		
	message.author.send({ embeds: [botEmbed]})
	return message.channel.send({ content: `I messaged you the ${position} User Manual.`})
}

//INFO
if(infocom.includes(cmd)) {
	if (mcid == duelRequestsChannelId) { 
		return message.channel.send({ content: `${master} --- Ranked Play --- ${master}`+ 
		`\nThis is a Constructed Format based on the cards that you own.`+
		` You can check your Inventory with the **!inv** command.`+
		` After you build a deck, go to <#${duelRequestsChannelId}> and tag **@Forged Players** to find an opponent.`+
		`\n\nWe designed this game to reward effort.`+
		` The lower your rating, the more ${starchips} you'll earn.`+
		` This discourages farming and helps new players get better cards.`+
		` You can check ratings with the **!stats** command.`+
		`\n\nDisclaimer: Logs exist and admins can view inventories.`+
		` Playing with cards you don't own will not be tolerated.`+
		`\n\nIn addition, you must follow the ${FiC} Forbidden and Limited List.`+
		` Type **!banlist** to view it.`})
	}

	if (mcid == marketPlaceChannelId) { 
		return message.channel.send({ content: `${merchant} --- Market Place --- ${merchant}`+ 
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
		` The next Day, the Shop opens and the cards are sold to the highest bidders!`})
	}

	if (mcid == tournamentChannelId) { 
		return message.channel.send({ content: `${legend} --- Tournaments --- ${legend}`+ 
		`\nTo sign up for a Tournament, simply come to the <#${tournamentChannelId}> and use the **!join** command.`+
		` The Tournament Organizer will handle the rest, so keep an eye out for their instructions.`+
		`\n\nThe tournament entry fee is 50${stardust}` +
		` Each participant gets a Chaos Pack just for entering.`+
		` If you do well, you can win additional Chaos Packs and other prizes.`})
	}

	if (mcid == arenaChannelId) { 
		message.channel.send({ content: 
			`${beast}  ${dinosaur}  ${dragon}  ${fiend}  ${fish}  ${plant}  --- The Arena ---  ${reptile}  ${rock}  ${spellcaster}  ${thunder}  ${warrior}  ${zombie}`+ 
			`\nIn this channel, you get to test out the game's most powerful cards.`+
			` Simply align yourself with a Tribe and wage war at their side.`+
			`\n\nTo compete in the Arena, type **!join** in <#${arenaChannelId}>.`+
			` It requires 4 players to launch.`+
			` When it starts, you are loaned a 75-card deck, and you get 5 minutes to cut it down to no fewer than 40 cards.`+
			`\n\nThe Arena is a Round Robin, singles-games tournament.`+
			` Winners receive 5${starchips}, losers receive 3${starchips}.`+
			` To report a loss, type **!loss @opponent**, then wait for the next round.`+
			`\n\nThe Champion of the Arena walks away with an ${ult}Arena Prize Card according to their Tribe!`+
			` Everyone else receives Vouchers for their wins.`+
			` You can use **!barter** to exchange Vouchers for APCs.`
		})

		return message.channel.send({ content: 
			`Once you complete the Medium Diary, extended bartering is available for the following cards:` +
			`\n${ult}DOC-180 - Peropero Cerperus - 10 ${mushroom}` +
			`\n${ult}TEB-135 - Green Baboon, Defender of the Forest - 10 ${mushroom}` +
			`\n${ult}ORF-046 - X-Saber Airbellum - 10 ${mushroom}` +
			`\n${ult}DOC-174 - Block Golem - 10 ${moai}` +
			`\n${ult}DOC-178 - Mardel, Generaider Boss of Light - 10 ${rose}` +
			`\n${ult}TEB-134 - Dandylion - 10 ${rose}` +
			`\n${ult}DOC-181 - Sharkraken - 10 ${hook}` +
			`\n${ult}TEB-132 - Citadel Whale - 10 ${hook}` +
			`\n${ult}DOC-176 - Giant Rex - 10 ${egg}` +
			`\n${ult}DOC-177 - Ipiria - 10 ${cactus}` +
			`\n${ult}DOC-182 - Sinister Serpent - 10 ${cactus}` +
			`\n${ult}DOC-185 - Worm Xex - 10 ${cactus}` +
			`\n${ult}ORF-047 - Elemental HERO Nova Master - 10 ${swords}` +
			`\n${ult}DOC-188 - Reinforcement of the Army - 10 ${swords}` +
			`\n${ult}TEB-136 - Infernoble Knight - Roland - 10 ${swords}` +
			`\n${ult}TEB-130 - Altergeist Meluseek - 10 ${orb}` +
			`\n${ult}TEB-137 - Shaddoll Dragon - 10 ${orb}` +
			`\n${ult}DOC-175 - Breaker the Magical Warrior - 10 ${orb}` +
			`\n${ult}TEB-141 - Dragon Ravine - 10 ${gem}`
		})
	}

	if (mcid == gauntletChannelId) { 
		return message.channel.send({ content: `${gloveEmoji} --- The Gauntlet --- ${gloveEmoji}`+ 
		`\nThe Gauntlet is the ultimate test of endurance and technical play.`+
		` In this 2-Player game-mode, you're asked to succeed with Starter Decks from every generation of Forged`+
		` from Fish's Ire ${fish} to Spellcaster's Art ${spellcaster}.`
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
		` Whoever wins the most legs wins the Gauntlet, and receives an additional 10" + starchip + ".`})
	}

	if (mcid == pauperChannelId) { 
		return message.channel.send({ content: `${com} --- Pauper Format --- ${rar}`+ 
		`\nIn this channel, the rich and the poor fight on an even playing field!`+
		` This is a constructed format using cards in your Inventory.`+
		` However, only cards that were **originally printed** as commons ${com} are allowed in this format.`+
		` This means cards such as Starter Deck copies of Bottomless Trap Hole cannot be played.`+
		`\n\nPauper Format is played as single games, not matches.`+
		` Winners receive 4${starchips}, losers receive 2${starchips}.`+
		` To report a loss, type **!loss @opponent**.`+
		` These games do not affect your ranking for Tournaments, Diary tasks, etc.` +
		`\n\nDo you have what it takes to become a master budget player? ${cavebob}`})
	}

	if (mcid == keeperChannelId) { 
		return message.channel.send({ content: `${fire} --- Keeper of the Forge --- ${fire}`+ 
		`\nIn this channel, you get to `+
		` woof.`})	}

	if (mcid == triviaChannelId) { 
		return message.channel.send({ content: `${stoned} --- Trivia Center --- ${stoned}`+ 
		`\nThe King of Games must also be a student of the game.`+
		` That means being familiar with the old Champions and their decks,`+
		` as well as historically important cards.`+
		` We'll also keep you on your toes with some non-Yu-Gi-Oh! questions, covering topics such as:`+
		` \n- TV, Anime, Film\n- Science\n- Geography\n- History\n- Pop Culture\n- FiC Facts (!)`+
		`\n\nTo enter a Trivia contest, simply find 4 friends and get everyone to type **!join**.`+
		` You will have 16 seconds to respond to each question via DM.`+
		` Do **not** look up answers online -- doing so will get you banned from Trivia.` +
		` After 10 rounds, players earn ${starchips} or ${stardust} for their performance.`+
		`\n\nAs you play more Trivia, your Profile will keep a record of your acumen.`+
		` There are 2150 total questions, so hit the books and then hit those keys! ${red}`})
	}
		
	if (mcid == draftChannelId) { 
		return message.channel.send({ content: `${puzzle} --- Draft Room --- ${puzzle}`+ 
		`\nIn this channel,`})
	}

	return message.channel.send({ content: `Use this command in channels such as <#${duelRequestsChannelId}>, <#${marketPlaceChannelId}>, <#${tournamentChannelId}>, <#${arenaChannelId}> and <#${triviaChannelId}> to learn how those parts of the game work.`})
}


//DECK
if(deckcom.includes(cmd)) {
	if (mcid === arenaChannelId) {
		const deck = await getArenaSample(message, args[0])
		if (!deck) return message.channel.send(`Please specify a valid tribe.`)
		if (!arenas.decks[deck]) return message.channel.send({ content: `I do not recognize that tribe.`})

		return message.channel.send({ content: `Arena ${capitalize(deck)} ${eval(deck)} Deck (staples in the side):\n<${arenas.decks[deck].url}>\n${arenas.decks[deck].screenshot}`})
	} else {
		const player = await Player.findOne( { where: { id: maid }, include: [Diary, Wallet] })
		const wallet = player.wallet
		const diary = player.diary
		
		const merchbot_wallet = await Wallet.findOne( { where: { playerId: merchbotId } })
		if (!wallet || !merchbot_wallet) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})

		const deck = await getShopDeck(message, args[0])
		const valid_decks = ["reptile", "warrior", "dragon", "spellcaster", "dinosaur", "plant", "fish", "rock"]
		if (!deck) return message.channel.send({ content: `Please specify a valid deck.`})
		if (!valid_decks.includes(deck)) return message.channel.send({ content: `Sorry, I do not have that deck for sale.`})

		const set = await Set.findOne({ where: { 
			code: decks[deck].set_code
		}})

		const hard_complete = diary.h1 && diary.h2 && diary.h3 && diary.h4 && diary.h5 && diary.h6 && diary.h7 && diary.h8
		const discount = hard_complete && set.currency === 'stardust' ? (1 / 1.1) : 1

		if (!set) return message.channel.send({ content: `Could not find set with code "${decks[deck].set_code}".`})
		if (!set.for_sale) return message.channel.send({ content: `Sorry, ${set.name} ${eval(set.emoji)} ${eval(set.alt_emoji)} is not available.`})
		const money = wallet[set.currency]
		if (money < set.unit_price * discount) return message.channel.send({ content: `Sorry, ${player.name}, you only have ${money}${eval(set.currency)} and ${decks[deck].name} ${eval(deck)} costs ${set.unit_price * discount}${eval(set.currency)}.`})

		const filter = m => m.author.id === message.author.id
		message.channel.send({ content: `${player.name}, you have ${money}${eval(set.currency)}. Do you want to spend ${set.unit_price * discount}${eval(set.currency)} on a copy of ${decks[deck].name} ${eval(deck)}?`})
		await message.channel.awaitMessages({ filter,
			max: 1,
			time: 15000
		}).then(async (collected) => {
			if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send({ content: `No problem. Have a nice day.`})
			const code = deck === 'reptile' || deck === 'warrior' ? 'SS4' :
				deck === 'dragon' || deck === 'spellcaster' ? 'SS3' :
				deck === 'plant' || deck === 'dinosaur' ? 'SS2' :
				'SS1'
			const set = await Set.findOne({ where: { code: code } })
			wallet[set.currency] -= (set.unit_price * discount)
			await wallet.save()
			set.unit_sales++
			await set.save()
			await awardStarterDeck(maid, deck)
			return message.channel.send({ content: `Thank you for your purchase! I updated your Inventory with a copy of ${decks[deck].name} ${eval(deck)}.`})
		}).catch((err) => {
			console.log(err)
			return message.channel.send({ content: `Sorry, time's up.`})
		})
	}
}

//EDIT
if(cmd == `!edit`) {
	if (mcid !== botSpamChannelId) return message.channel.send({ content: `Please use this command in <#${botSpamChannelId}>.`})
	const profile = await Profile.findOne({ where: { playerId: maid } })
	if (!profile) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})
	const wantsToChangeColor = await askToChangeProfile(message, 'color')
	const color = wantsToChangeColor ? await getFavoriteColor(message) : ''
	if (color === 'unrecognized') message.channel.send({ content: `Sorry, I do not recognize that color.`})
	
	const wantsToChangeQuote = await askToChangeProfile(message, 'quote')
	const new_quote = wantsToChangeQuote ? await getFavoriteQuote(message) : null
	const new_author = new_quote && wantsToChangeQuote ? await getFavoriteAuthor(message) : null

	const wantsToChangeCard = await askToChangeProfile(message, 'card')
	const new_card = wantsToChangeCard ? await getFavoriteCard(message, fuzzyPrints) : null

	if (color.startsWith("#")) profile.color = color
	if (new_quote) profile.quote = new_quote
	if (new_author) profile.author = new_author
	if (new_card === 'none') profile.card = null
	if (new_card && new_card !== 'none') profile.card = new_card
	await profile.save()
	if (new_card === 'not found') return
	if (!color.startsWith("#") && !new_quote && !new_card) return message.channel.send({ content: `Not a problem. Have a nice day.`})

	return message.channel.send({ content: `Your profile has been updated!`})
}

//CALCULATE
if(calccom.includes(cmd)) {
	if (!args.length) return message.channel.send({ content: `Please specify a valid set code.`})
	const set_code = args[0].toUpperCase()
	const set = await Set.findOne({ where: { code: set_code } })
	if(!set) return message.channel.send({ content: `I do not recognize the set code: "${set_code}"`})	

	if (set.type === 'core' || set.type === 'mini' || set.type === 'tour') {
		const commons = [...await Print.findAll({ where: { set_code: set_code, rarity: "com" } })].map((p) => Math.ceil(0.7 * parseInt(p.market_price)))
		const rares = [...await Print.findAll({ where: { set_code: set_code, rarity: "rar" } })].map((p) => Math.ceil(0.7 * parseInt(p.market_price)))
		const supers = [...await Print.findAll({ where: { set_code: set_code, rarity: "sup" } })].filter((p) => !p.card_code.includes('-SE')).map((p) => Math.ceil(0.7 * parseInt(p.market_price)))
		const ultras = [...await Print.findAll({ where: { set_code: set_code, rarity: "ult" } })].map((p) => Math.ceil(0.7 * parseInt(p.market_price)))
		const secrets = [...await Print.findAll({ where: { set_code: set_code, rarity: "scr" } })].map((p) => Math.ceil(0.7 * parseInt(p.market_price)))
		const avgComPrice = commons.length ? commons.reduce((a, b) => a + b) / commons.length : 0
		const avgRarPrice = rares.length ? rares.reduce((a, b) => a + b) / rares.length : 0
		const avgSupPrice = supers.length ? supers.reduce((a, b) => a + b) / supers.length : 0
		const avgUltPrice = ultras.length ? ultras.reduce((a, b) => a + b) / ultras.length : 0
		const avgScrPrice = secrets.length ? secrets.reduce((a, b) => a + b) / secrets.length : 0
		const avgBoxPrice = (avgComPrice * set.commons_per_box) 
			+ (avgRarPrice * set.rares_per_box) 
			+ (avgSupPrice * set.supers_per_box) 
			+ (avgUltPrice * set.ultras_per_box) 
			+ (avgScrPrice * set.secrets_per_box) 

		const avgPackPrice = avgBoxPrice / set.packs_per_box

		if (set.type === 'core') {
			return message.channel.send({ content: `The average trade-in value of ${isVowel(set.name.charAt(0)) ? 'an' : 'a'} ${set.name} ${eval(set.emoji)} Pack is ${avgPackPrice.toFixed(2)}${stardust} and a Box is ${avgBoxPrice.toFixed(2)}${stardust}.`})
		} else {
			return message.channel.send({ content: `The average trade-in value of ${isVowel(set.name.charAt(0)) ? 'an' : 'a'} ${set.name} ${eval(set.emoji)} Pack is ${avgPackPrice.toFixed(2)}${stardust}.`})
		}
	} else if (set.type === 'starter_deck') {
		const prints = await Print.findAll({ where: { set_code: set_code }})
		let deck1Price = 0
		let deck2Price = 0
		let deck1
		let deck2

		const deck_names = Object.keys(decks)
		deck_names.forEach((d) => {
			if(decks[d].set_code === set_code) {
				if (!deck1) deck1 = d
				else deck2 = d
			}
		})
		
		for (let i = 0; i < prints.length; i++) {
			const print = prints[i]
			const market_price = print.market_price
			const d1quantity = decks[deck1].cards[print.card_code] || 0
			const d2quantity = decks[deck2].cards[print.card_code] || 0
			deck1Price += (d1quantity * Math.ceil(0.7 * market_price))
			deck2Price += (d2quantity * Math.ceil(0.7 * market_price))
		}

		return message.channel.send({ content: `The trade-in value of ${decks[deck1].name} ${eval(set.emoji)} is ${Math.round(deck1Price * 100) / 100}${stardust} and ${decks[deck2].name} ${eval(set.alt_emoji)} is ${Math.round(deck2Price * 100) / 100}${stardust}.`})		
	} else if (set.type === 'promo') {
		const prints = [...await Print.findAll({ where: { set_code: set_code }})].map((p) => Math.ceil(0.7 * parseInt(p.market_price)))
		const avgPrice = prints.length ? prints.reduce((a, b) => a + b) / prints.length : 0
		return message.channel.send({ content: `The average trade-in value of ${isVowel(set.name.charAt(0)) ? 'an' : 'a'} ${set.name} ${eval(set.emoji)} Promo is ${avgPrice.toFixed(2)}${stardust}.`})
	}
}

//PROFILE
if(profcom.includes(cmd)) {
	if (mcid !== generalChannelId && mcid !== botSpamChannelId) return message.channel.send({ content: `Please use this command in <#${botSpamChannelId}> or <#${generalChannelId}>.`})
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
	const player = await Player.findOne({ 
		where: { 
			id: playerId
		},
		include: [Arena, Diary, Draft, Gauntlet, Profile, Trivia, Wallet]
	})

	if (!player && maid === playerId) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})
	if (!player && maid !== playerId) return message.channel.send({ content: `That user is not in the database.`})

	const inventory = await Inventory.findAll({ 
		where: { 
			playerId
		},
		include: [Print]
	})

	const member = message.mentions.users.first()
	const avatar = member ? member.displayAvatarURL() : message.author.displayAvatarURL()
	const day = parseInt(player.profile.start_date.slice(-2))
	const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
	const month = months[parseInt(player.profile.start_date.slice(5, 7)) - 1]
	const year = player.profile.start_date.slice(0, 4)
	const deck_name = player.profile.starter === 'fish' ? `Fish's Ire` :
		player.profile.starter === 'rock' ? `Rock's Foundation` :
		player.profile.starter === 'dinosaur' ? `Dinosaur's Power` :
		player.profile.starter === 'plant' ? `Plant's Harmony` :
		player.profile.starter === 'dragon' ? `Dragon's Inferno` :
		player.profile.starter === 'spellcaster' ? `Spellcaster's Art` :
		player.profile.starter === 'reptile' ? `Reptile's Charm` :
		player.profile.starter === 'warrior' ? `Warrior's Legend` :
		''
	const card = await Card.findOne({ 
		where: { 
			name: player.profile.card
		}
	})
	
	const card_image = card ? `https://ygoprodeck.com/pics/${card.image_file}` : ''
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

	const correct_answers = await Knowledge.count({ where: { playerId: playerId }})
	let beasts = ''
	let dinosaurs = ''
	let fishes = ''
	let plants = ''
	let reptiles = ''
	let rocks = ''
	let dragons = ''
	let spellcasters = ''
	let warriors = ''
	let fiends = ''
	let thunders = ''
	let zombies = ''
	for (let i = 0; i < player.profile.beast_wins && i < 3; i++) beasts += `${beast} `
	for (let i = 0; i < player.profile.dinosaur_wins && i < 3; i++) dinosaurs += `${dinosaur} `
	for (let i = 0; i < player.profile.fish_wins && i < 3; i++) fishes += `${fish} `
	for (let i = 0; i < player.profile.plant_wins && i < 3; i++) plants += `${plant} `
	for (let i = 0; i < player.profile.reptile_wins && i < 3; i++) reptiles += `${reptile} `
	for (let i = 0; i < player.profile.rock_wins && i < 3; i++) rocks += `${rock} `
	for (let i = 0; i < player.profile.dragon_wins && i < 3; i++) dragons += `${dragon} `
	for (let i = 0; i < player.profile.spellcaster_wins && i < 3; i++) spellcasters += `${spellcaster} `
	for (let i = 0; i < player.profile.warrior_wins && i < 3; i++) warriors += `${warrior} `
	for (let i = 0; i < player.profile.fiend_wins && i < 3; i++) fiends += `${fiend} `
	for (let i = 0; i < player.profile.thunder_wins && i < 3; i++) thunders += `${thunder} `
	for (let i = 0; i < player.profile.zombie_wins && i < 3; i++) zombies += `${zombie} `

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
		.addField('Arena Stats', `Beast Wins: ${player.profile.beast_wins} ${beasts}\nDinosaur Wins: ${player.profile.dinosaur_wins} ${dinosaurs}\nFish Wins: ${player.profile.fish_wins} ${fishes}\nPlant Wins: ${player.profile.plant_wins} ${plants}\nReptile Wins: ${player.profile.reptile_wins} ${reptiles}\nRock Wins: ${player.profile.rock_wins} ${rocks}\nDragon Wins: ${player.profile.dragon_wins} ${dragons}\nSpellcaster Wins: ${player.profile.spellcaster_wins} ${spellcasters}\nWarrior Wins: ${player.profile.warrior_wins} ${warriors}\nFiend Wins: ${player.profile.fiend_wins} ${fiends}\nThunder Wins: ${player.profile.thunder_wins} ${thunders}\nWarrior Wins: ${player.profile.zombie_wins} ${zombies}`)
		.addField('Other Stats', `Net Worth: ${Math.floor(networth)}${starchips}\nTrade Partners: ${player.profile.trade_partners}\nTrivia Wins: ${player.profile.trivia_wins}\nTrivia Answers: ${correct_answers} out of 2150`)
		.setImage(card_image)
		.setFooter(quote)

	return message.channel.send({ embeds: [profileEmbed] })
}

//REFERRAL
if(referralcom.includes(cmd)) {
	const player = await Player.findOne({ where: { id: maid }, include: [Diary, Profile]})
	if (!player) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})
	const diary = player.diary
	const profile = player.profile
	if (!profile || !diary) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})
	if (player.last_reset) return message.channel.send({ content: `You cannot give a referral after resetting your account.`})
	if (profile.referral) return message.channel.send({ content: `You already gave a referral.`})

	const easy_complete = diary.e1 && diary.e2 && diary.e3 && diary.e4 && diary.e5 && diary.e6 && diary.e7 && diary.e8 && diary.e9 && diary.e10 && diary.e11 && diary.e12
	if (!easy_complete) return message.channel.send({ content: `You must complete your Easy Diary before you are allowed to give a referral.`})

	if (!args.length) return message.channel.send({ content: `No player specified.`})
	const referrer = message.mentions.users.first() ? message.mentions.users.first().id : null
	if (!referrer || referrer.length < 17 || referrer.length > 18) return message.channel.send({ content: `No player specified.`})

	const referringPlayer = await Player.findOne({ where: { id: referrer }, include: Wallet })
	if (!referringPlayer) return message.channel.send({ content: `That person is not in the database.`})

	const filter = m => m.author.id === message.author.id
	message.channel.send({ content: `Are you sure you want to give a referral to ${referringPlayer.name}?`})
	await message.channel.awaitMessages({ filter,
		max: 1,
		time: 15000
	}).then(async (collected) => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send({ content: `No problem. Have a nice day.`})

		referringPlayer.wallet.starchips += 15
		await referringPlayer.wallet.save()

		profile.referral = true
		await profile.save()

		return message.channel.send({ content: `Okay! <@${referringPlayer.id}> was awarded 15${starchips} for a referral.`})
	}).catch((err) => {
		console.log(err)
		return message.channel.send({ content: `Sorry, time's up.`})
	})
}

//SHOP
if (cmd === `!shop`) {
	if (!args.length) {
		const date = new Date()
		const day = date.getDay()
		const hours = date.getHours()
		const mins = date.getMinutes()
	
		let shopStatus
		let shopEmoji
		let nextAction
		let nextEmoji
		let dayShopReverts
		let hourShopReverts
		let hoursLeftInPeriod
		const minsLeftInPeriod = 60 - mins
	
		if ((day === 6 && hours >= 14) || day === 0 || day === 1 || (day === 2 && hours < 16)) {
			shopStatus = 'open'
			shopEmoji = open
			nextAction = 'close'
			nextEmoji = closed
			dayShopReverts = 'Tuesday'
			hourShopReverts = '4pm'
			hoursLeftInPeriod = day === 6 ? 23 - hours + 24 * 2 + 16 :
				day === 0 ? 23 - hours + 24 + 16 :
				day === 1 ? 23 - hours + 16 :
				day === 2 ? 15 - hours :
				null
		} else if ((day === 2 && hours >= 16) || (day === 3 && hours < 8)) {
			shopStatus = 'closed'
			shopEmoji = closed
			nextAction = 'open'
			nextEmoji = open
			dayShopReverts = 'Wednesday'
			hourShopReverts = '8am'
			hoursLeftInPeriod = day === 2 ? 23 - hours + 8 :
				day === 3 ? 7 - hours :
				null
		} else if ((day === 3 && hours >= 8) || day === 4 || (day === 5 && hours < 22)) {
			shopStatus = 'open'
			shopEmoji = open
			nextAction = 'close'
			nextEmoji = closed
			dayShopReverts = 'Friday'
			hourShopReverts = '10pm'
			hoursLeftInPeriod = day === 3 ? 23 - hours + 24 + 22 :
				day === 4 ? 23 - hours + 22 :
				day === 5 ? 21 - hours :
				null
		} else if ((day === 5 && hours >= 22) || (day === 6 && hours < 14)) {
			shopStatus = 'closed'
			shopEmoji = closed
			nextAction = 'open'
			nextEmoji = open
			dayShopReverts = 'Saturday'
			hourShopReverts = '2pm'
			hoursLeftInPeriod = day === 5 ? 23 - hours + 14 :
				day === 6 ? 13 - hours  :
				null
		}
	
		return message.channel.send({ content: `The Shop ${merchant} is ${shopStatus} ${shopEmoji}. It will ${nextAction} in ${hoursLeftInPeriod} hours and ${minsLeftInPeriod} minutes, on ${dayShopReverts} at ${hourShopReverts} ET. ${nextEmoji}`})
	} else {
		const query = args.join(' ')
		const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
		const card_name = await findCard(query, fuzzyPrints)
		const set_code = query.toUpperCase()
		const valid_set_code = !!(await Set.count({ where: { code: set_code }}) && set_code !== 'GL1')
		const rarity =  query === 'com' || query === 'common' || query === 'commmons' ? 'com' :
				query === 'rar' || query === 'rare' || query === 'rares' ? 'rar' :
				query === 'sup' || query === 'super' || query === 'supers' ? 'sup' :
				query === 'ult' || query === 'ultra' || query === 'ultras' ? 'ult' :
				query === 'scr' || query === 'secret' || query === 'secrets' ? 'scr' :
				null
		if (valid_set_code) {
			const set = await Set.findOne({ where: { code: set_code }})
			const prints = await Print.findAll({ where: { set_code: set_code } })
			const commons = prints.filter((p) => p.rarity === 'com').sort((a, b) => b.market_price - a.market_price)
			const rares = prints.filter((p) => p.rarity === 'rar').sort((a, b) => b.market_price - a.market_price)
			const supers = prints.filter((p) => p.rarity === 'sup').sort((a, b) => b.market_price - a.market_price)
			const ultras = prints.filter((p) => p.rarity === 'ult').sort((a, b) => b.market_price - a.market_price)
			const secrets = prints.filter((p) => p.rarity === 'scr').sort((a, b) => b.market_price - a.market_price)

			const results = [`**${set.code} ${eval(set.emoji)}${set.emoji !== set.alt_emoji ? ` ${eval(set.alt_emoji)}` : ''} Price List**`]
			
			for (let i = 0; i < secrets.length; i++) {
				const print = secrets[i]
				const inv = await Inventory.findOne({ where: { playerId: merchbotId, printId: print.id }})
				const market_price = print.market_price
				const buying_price = Math.floor(market_price * 0.7) > 0 ? Math.floor(market_price * 0.7) : 1
				const selling_price = Math.floor(market_price * 1.1) > buying_price ? Math.floor(market_price * 1.1) : buying_price + 1
				results.push(`${selling_price}${stardust}| ${buying_price}${stardust} - ${eval(print.rarity)}${print.card_code} - ${print.card_name} - ${inv && inv.quantity ? inv.quantity : 'Out of Stock'}`)
			}
			
			for (let i = 0; i < ultras.length; i++) {
				const print = ultras[i]
				const inv = await Inventory.findOne({ where: { playerId: merchbotId, printId: print.id }})
				const market_price = print.market_price
				const buying_price = Math.floor(market_price * 0.7) > 0 ? Math.floor(market_price * 0.7) : 1
				const selling_price = Math.floor(market_price * 1.1) > buying_price ? Math.floor(market_price * 1.1) : buying_price + 1
				results.push(`${selling_price}${stardust}| ${buying_price}${stardust} - ${eval(print.rarity)}${print.card_code} - ${print.card_name} - ${inv && inv.quantity ? inv.quantity : 'Out of Stock'}`)
			}
			
			for (let i = 0; i < supers.length; i++) {
				const print = supers[i]
				const inv = await Inventory.findOne({ where: { playerId: merchbotId, printId: print.id }})
				const market_price = print.market_price
				const buying_price = Math.floor(market_price * 0.7) > 0 ? Math.floor(market_price * 0.7) : 1
				const selling_price = Math.floor(market_price * 1.1) > buying_price ? Math.floor(market_price * 1.1) : buying_price + 1
				results.push(`${selling_price}${stardust}| ${buying_price}${stardust} - ${eval(print.rarity)}${print.card_code} - ${print.card_name} - ${inv && inv.quantity ? inv.quantity : 'Out of Stock'}`)
			}
			
			for (let i = 0; i < rares.length; i++) {
				const print = rares[i]
				const inv = await Inventory.findOne({ where: { playerId: merchbotId, printId: print.id }})
				const market_price = print.market_price
				const buying_price = Math.floor(market_price * 0.7) > 0 ? Math.floor(market_price * 0.7) : 1
				const selling_price = Math.floor(market_price * 1.1) > buying_price ? Math.floor(market_price * 1.1) : buying_price + 1
				results.push(`${selling_price}${stardust}| ${buying_price}${stardust} - ${eval(print.rarity)}${print.card_code} - ${print.card_name} - ${inv && inv.quantity ? inv.quantity : 'Out of Stock'}`)
			}

			for (let i = 0; i < commons.length; i++) {
				const print = commons[i]
				const inv = await Inventory.findOne({ where: { playerId: merchbotId, printId: print.id }})
				const market_price = print.market_price
				const buying_price = Math.floor(market_price * 0.7) > 0 ? Math.floor(market_price * 0.7) : 1
				const selling_price = Math.floor(market_price * 1.1) > buying_price ? Math.floor(market_price * 1.1) : buying_price + 1
				results.push(`${selling_price}${stardust}| ${buying_price}${stardust} - ${eval(print.rarity)}${print.card_code} - ${print.card_name} - ${inv && inv.quantity ? inv.quantity : 'Out of Stock'}`)
			}

			message.channel.send({ content: `I messaged you the ${set.code} ${eval(set.emoji)}${set.emoji !== set.alt_emoji ? ` ${eval(set.alt_emoji)}` : ''} Price List.`})
			for (let i = 0 ; i < results.length; i+=10) message.author.send({ content: results.slice(i, i+10).join('\n').toString()})
			return
		} else if (rarity) {
			const prints = await Print.findAll({ where: { rarity: rarity, draft: false }, order: [['market_price', 'DESC']] })
			const results = [`**${eval(rarity)} Price List**`]
			
			for (let i = 0; i < prints.length; i++) {
				const print = prints[i]
				const inv = await Inventory.findOne({ where: { playerId: merchbotId, printId: print.id }})
				const market_price = print.market_price
				const buying_price = Math.floor(market_price * 0.7) > 0 ? Math.floor(market_price * 0.7) : 1
				const selling_price = Math.floor(market_price * 1.1) > buying_price ? Math.floor(market_price * 1.1) : buying_price + 1
				results.push(`${selling_price}${stardust}| ${buying_price}${stardust} - ${eval(print.rarity)}${print.card_code} - ${print.card_name} - ${inv && inv.quantity ? inv.quantity : 'Out of Stock'}`)
			}

			message.channel.send({ content: `I messaged you the ${eval(rarity)} Price List.`})
			for (let i = 0 ; i < results.length; i+=10) message.author.send({ content: results.slice(i, i+10).join('\n').toString()})
			return
		}

		const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
		const prints = valid_card_code ? await Print.findAll({ where: { card_code: card_code, draft: false }, order: [['createdAt', 'ASC']]}) : card_name ? await Print.findAll({ where: { card_name: card_name }, order: [['createdAt', 'ASC']]}) : null
		if (!prints || !prints.length) return message.channel.send({ content: `Sorry, I do not recognize the card: "${query}".`})
		const results = []

		for (let i = 0; i < prints.length; i++) {
			const print = prints[i]
			if (print.draft || print.hidden) continue
			const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`
			const inv = await Inventory.findOne({ where: {
				printId: print.id,
				playerId: merchbotId,
				quantity: { [Op.gt]: 0 }
			}})
	
			const auction = await Auction.findOne({ where: { printId: print.id } })
			const market_price = print.market_price
			const buying_price = Math.floor(market_price * 0.7) > 0 ? Math.floor(market_price * 0.7) : 1			
			const selling_price = Math.floor(market_price * 1.1) > buying_price ? Math.floor(market_price * 1.1) : buying_price + 1

			if (!inv) {
				results.push(`${selling_price}${stardust}| ${buying_price}${stardust}-${card} - Out of Stock${print.frozen ? " - ❄️" : print.trending_up ? ` - ${upward}` : ''}${print.trending_down ? ` - ${downward}` : ''}`)
			} else {
				results.push(`${selling_price}${stardust}| ${buying_price}${stardust}-${card} - ${inv.quantity}${print.frozen ? " - ❄️" : print.trending_up ? ` - ${upward}` : ''}${print.trending_down ? ` - ${downward}` : ''}${auction ? ` - ${no}`: ''}`)
			}
		}

		return message.channel.send({ content: results.join('\n').toString()})
	}
}


//POPULATION
if (populationcom.includes(cmd)) {
	if (!args.length) return message.channel.send({ content: `Please specify a card.`})
	const query = args.join(' ')
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const card_name = await findCard(query, fuzzyPrints)
	const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	const prints = valid_card_code ? await Print.findAll({ where: { card_code: card_code }, order: [['createdAt', 'ASC']]}) : card_name ? await Print.findAll({ where: { card_name: card_name }, order: [['createdAt', 'ASC']]}) : null
	if (!prints || !prints.length) return message.channel.send({ content: `Sorry, I do not recognize the card: "${query}".`})
	const results = []

	for (let i = 0; i < prints.length; i++) {
		const print = prints[i]
		if (print.draft || print.hidden) continue
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

		results.push(`${ygocard} --- Population Stats --- ${ygocard}\n${card}\nTotal Population: ${total}\nAvg ${eval(print.rarity)} ${print.set_code} ${eval(set.emoji)} Pop: ${avg_eq_pop}\nShop Inventory: ${shop_percent}`)
	}
	
	return message.channel.send({ content: results.join('\n').toString()})
}

//COUNT
if(cmd === `!count`) {
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

			results.push(`- ${set.unit_sales} ${set.unit_sales === 1 ? 'Pack' : 'Packs'} of DOC ${DOC} and ${set.code} ${eval(set.emoji)}`)
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
    const count = Math.ceil(weightedCount / 8)
	results.push(
		`\nIf The Shop closed now, we'd open:` + 
		`\n- ${count} ${count === 1 ? 'Pack' : 'Packs'} of DRT ${DRT}` +
		`\n- ${count} ${count === 1 ? 'Pack' : 'Packs'} of FON ${FON}` +
		`\n- ${count} ${count === 1 ? 'Pack' : 'Packs'} of TEB ${TEB}` +
		`\n- ${count} ${count === 1 ? 'Pack' : 'Packs'} of ORF ${ORF}` +
		`\n- ${count} ${count === 1 ? 'Pack' : 'Packs'} of DOC ${DOC}`
	)
	return message.channel.send({ content: results.join('\n').toString()})
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
	let dragonWins = 0
	let spellcasterWins = 0
	let warriorWins = 0
	let fiendWins = 0
	let thunderWins = 0
	let zombieWins = 0

	for (let i = 0; i < allProfiles.length; i++) {
		const profile = allProfiles[i]
		beastWins += profile.beast_wins
		dinosaurWins += profile.dinosaur_wins
		fishWins += profile.fish_wins
		plantWins += profile.plant_wins
		reptileWins += profile.reptile_wins
		rockWins += profile.rock_wins
		dragonWins += profile.dragon_wins
		spellcasterWins += profile.spellcaster_wins
		warriorWins += profile.warrior_wins
		fiendWins += profile.fiend_wins
		thunderWins += profile.thunder_wins
		zombieWins += profile.zombie_wins
	}

	const winsArr = [beastWins, dinosaurWins, fishWins, plantWins, reptileWins, rockWins, dragonWins, spellcasterWins, warriorWins, fiendWins, thunderWins, zombieWins]
	winsArr.sort((a, b) => b - a)
	const longest = winsArr[0]
	const totalWinners = beastWins + dinosaurWins + fishWins + plantWins + reptileWins + rockWins + dragonWins + spellcasterWins + warriorWins + fiendWins + thunderWins + zombieWins

	const beastBars = Math.round((beastWins / longest) * 10)
	const dinosaurBars = Math.round((dinosaurWins / longest) * 10)
	const fishBars = Math.round((fishWins / longest) * 10)
	const plantBars = Math.round((plantWins / longest) * 10)
	const reptileBars = Math.round((reptileWins / longest) * 10)
	const rockBars = Math.round((rockWins / longest) * 10)
	const dragonBars = Math.round((dragonWins / longest) * 10)
	const spellcasterBars = Math.round((spellcasterWins / longest) * 10)
	const warriorBars = Math.round((warriorWins / longest) * 10)
	const fiendBars = Math.round((fiendWins / longest) * 10)
	const thunderBars = Math.round((thunderWins / longest) * 10)
	const zombieBars = Math.round((zombieWins / longest) * 10)

	let beasts = beast
	let dinosaurs = dinosaur
	let fishes = fish
	let plants = plant
	let reptiles = reptile
	let rocks = rock
	let dragons = dragon
	let spellcasters = spellcaster
	let warriors = warrior
	let fiends = fiend
	let thunders = thunder
	let zombies = zombie

	for (let i = 1; i < beastBars; i++) beasts += beast
	for (let i = 1; i < dinosaurBars; i++) dinosaurs += dinosaur
	for (let i = 1; i < fishBars; i++) fishes += fish
	for (let i = 1; i < plantBars; i++) plants += plant
	for (let i = 1; i < reptileBars; i++) reptiles += reptile
	for (let i = 1; i < rockBars; i++) rocks += rock
	for (let i = 1; i < dragonBars; i++) dragons += dragon
	for (let i = 1; i < spellcasterBars; i++) spellcasters += spellcaster
	for (let i = 1; i < warriorBars; i++) warriors += warrior
	for (let i = 1; i < fiendBars; i++) fiends += fiend
	for (let i = 1; i < thunderBars; i++) thunders += thunder
	for (let i = 1; i < zombieBars; i++) zombies += zombie

	const arr = [
		[beastWins, `${beast} - ${beastWins} - ${beasts}`], 
		[dinosaurWins, `${dinosaur} - ${dinosaurWins} - ${dinosaurs}`], 
		[fishWins, `${fish} - ${fishWins} - ${fishes}`], 
		[plantWins, `${plant} - ${plantWins} - ${plants}`], 
		[reptileWins, `${reptile} - ${reptileWins} - ${reptiles}`], 
		[rockWins, `${rock} - ${rockWins} - ${rocks}`],
		[dragonWins, `${dragon} - ${dragonWins} - ${dragons}`], 
		[spellcasterWins, `${spellcaster} - ${spellcasterWins} - ${spellcasters}`], 
		[warriorWins, `${warrior} - ${warriorWins} - ${warriors}`], 
		[fiendWins, `${fiend} - ${fiendWins} - ${fiends}`], 
		[thunderWins, `${thunder} - ${thunderWins} - ${thunders}`], 
		[zombieWins, `${zombie} - ${zombieWins} - ${zombies}`]
	].sort((a, b) => b[0] - a[0]).map((e) => e[1])

	message.channel.send({ content: `There have been ${totalWinners} Arena winners. Conquest breakdown:`})
	message.channel.send({ content: arr.slice(0, 6).join("\n")})
	return message.channel.send({ content: arr.slice(6).join("\n")})
}


//HISTORY
if (historycom.includes(cmd)) {
	const query = args.join(' ')
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	const card_name = await findCard(query, fuzzyPrints)
	const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name) : null
	if (!print || print.draft || print.hidden) return message.channel.send({ content: `Sorry, I do not recognize the card: "${query}".`})
	const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`
	const item = print.card_code

	const trades = await Trade.findAll({ 
		where: { 
			item: item
		},
		order: [['createdAt', 'DESC']]
	})

	if (!trades.length) return message.channel.send({ content: `There have been no trades involving ${card}.`})

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
		gem: {
			card_name: null,
			card_code: null,
			rarity: 'gem'
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
		},
		orb: {
			card_name: null,
			card_code: null,
			rarity: 'orb'
		},
		swords: {
			card_name: null,
			card_code: null,
			rarity: 'swords'
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

	message.channel.send({ content: `I messaged you the trade history for ${card}.`})
	for (let i = 0 ; i < results.length; i++) {
		message.author.send({ content: results[i].toString()})
	}

	return
}

//TRADES
if(cmd === `!trades`) {
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
	const player = await Player.findOne({ where: { id: playerId } })
	if (!player) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})

	const cutoff = player.last_reset ? player.last_reset : player.createdAt
	
	const trades = await Trade.findAll({ where: { 
		[Op.or]: [{ senderId: playerId }, { receiverId: playerId }],
		createdAt: { [Op.gte]: cutoff }
	}})

	if (!trades.length) return message.channel.send({ content: `You have not made any trades.`})
	const partnerIds = []
	const partnerNames = []

	for (let i = 0; i < trades.length; i++) {
		const trade = trades[i]
		const senderId = trade.senderId
		const receiverId = trade.receiverId
		const sender_name = trade.sender_name
		const receiver_name = trade.receiver_name
		if (senderId !== maid && !partnerIds.includes(senderId)) {
			partnerIds.push(senderId)
			partnerNames.push(sender_name)
		} else if (receiverId !== maid && !partnerIds.includes(receiverId)) {
			partnerIds.push(receiverId)
			partnerNames.push(receiver_name)
		} 
	}

	partnerNames.sort()
	message.channel.send({ content: `I messaged you your trading summary.`})
	return message.author.send({ content: `You have traded with ${partnerNames.length} players:\n${partnerNames.join("\n")}`})
}

// RNG
if(cmd === `!rng`) {
	const num = parseInt(args[0])
	if(isNaN(num) || num < 1) return message.channel.send({ content: `Please specify an upper limit.`})
	const result = Math.floor((Math.random() * num) + 1)
	return message.channel.send({ content: `You rolled a **${result}** with a ${num}-sided die.`})
}

// DICE
if(dicecom.includes(cmd)) {
	const result = Math.floor((Math.random() * 6) + 1)
	return message.channel.send({ content: `You rolled a **${result}** with a 6-sided die.`})
}

// FLIP
if(flipcom.includes(cmd)) {
	 const coin = Math.floor((Math.random() * 2)) === 0 ? 'Heads' : 'Tails'
	 return message.channel.send({ content: `Your coin flip landed on: **${coin}**!`})
}

//DAIRY
if(cmd === `!dairy`) return message.channel.send({ content: '🐮'})

//SHIP
if(cmd === `!ship`) return message.channel.send({ content: '🚢'})

//POOP
if(cmd === `!poop`) return message.channel.send({ content: '💩'})

//WALL-E
if(cmd === `!walley` || cmd === `!walle`) return message.channel.send({ content: '🤖'})


//DIARY
if(cmd === `!diary`) {
	const user = message.mentions.users.first()
	const playerId = user ? user.id : maid
	if (playerId !== maid && !isAdmin(message.member) && !isMod(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})
	const diary = await Diary.findOne({ where: { playerId: playerId } })
	if (!diary) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})
	const easy_complete = diary.e1 && diary.e2 && diary.e3 && diary.e4 && diary.e5 && diary.e6 && diary.e7 && diary.e8 && diary.e9 && diary.e10 && diary.e11 && diary.e12
	const medium_complete = diary.m1 && diary.m2 && diary.m3 && diary.m4 && diary.m5 && diary.m6 && diary.m7 && diary.m8 && diary.m9 && diary.m10
	const hard_complete = diary.h1 && diary.h2 && diary.h3 && diary.h4 && diary.h5 && diary.h6 && diary.h7 && diary.h8
	//const elite_complete = diary.l1 && diary.l2 && diary.l3 && diary.l4 && diary.l5 && diary.l6

	const input = user && args[1] ? args[1].toLowerCase() :
				user && !args[1] ? null :
				!user && args[0] ? args[0].toLowerCase() :
				null

	const tasks = []
	let bonuses
	let diary_to_display

	if (input) {
		if(input === 'e' || input === 'ez' || input === 'easy' || input.startsWith('ea')) { diary_to_display = 'Easy'; bonuses = diaries.Easy.bonuses }
		else if(input === 'm' || input.startsWith('me') || input.startsWith('mo')) { diary_to_display = 'Medium'; bonuses = diaries.Medium.bonuses }
		else if(input === 'h' || input.startsWith('ha')) { diary_to_display = 'Hard'; bonuses = diaries.Hard.bonuses }
		else if(input === 'l' || input.startsWith('el')) { diary_to_display = 'Elite'; bonuses = diaries.Elite.bonuses }
		else return message.channel.send({ content: `I do not recognize the "${input}" Diary.`})
		//else if(input === 's' || input.startsWith('ma')) { diary_to_display = 'Master'; bonuses = diaries.Master.bonuses }
	} else if (!diary_to_display) {
		//if (elite_complete) { diary_to_display = 'Master'; bonuses = diaries.Master.bonuses }
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

	message.author.send({ embeds: [diaryEmbed] })
	return message.channel.send({ content: `I messaged you ${playerId === maid ? 'the' : `that player's`} ${diary_to_display} Diary. ${leatherbound}`})
}

//BINDER
if(bindercom.includes(cmd)) {
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
	const binder = await Binder.findOne({ where: { playerId }, include: Player})
	if (!binder && playerId === maid) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})
	if (!binder && playerId !== maid) return message.channel.send({ content: `That user is not in the database.`})

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

		if (!results.length) return message.channel.send({ content: `${playerId === maid ? 'Your' : `${binder.player.name}'s`} binder is empty.`})
		else return message.channel.send({ content: `**${binder.player.name}'s Binder**\n${results.join('\n')}`})
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
		return message.channel.send({ content: `Your binder has been emptied.`})
	}

	const inputs = args.join(' ').replace(/\s+/g, ' ').split(";").map((el) => el.trim())

	for (let j = 0; j < inputs.length; j++) {
		const query = inputs[j]
		const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
		const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
		const card_name = await findCard(query, fuzzyPrints)
		const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name, private = false, inInv = true) : null
		
		if (!print && !card_name) {
			message.channel.send({ content: `Sorry, I do not recognize the card: "${query}".`})
			continue
		}

		if (!print && card_name) {
			message.channel.send({ content: `You do not have any copies of ${card_name}.`})
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
				message.channel.send({ content: `You removed ${card} from your binder.`})
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
			message.channel.send({ content: `You do not have any copies of ${card}.`})
			continue
		} 

		let success = false
		let i = 0
		while (!success && i < 18) {
			if (!binder[`slot_${i + 1}`]) {
				success = true
				binder[`slot_${i + 1}`] = print.card_code
				await binder.save()
				message.channel.send({ content: `You added ${card} to your binder.`})
				completeTask(message.channel, maid, 'e7')
			} else {
				i++
			}
		}

		if (!success) return message.channel.send({ content: `Your binder is full. Please remove a card or empty it to make room.`})
	}

	return 
}

//SEARCH
if(cmd === `!search`) {
	if (!args.length) return message.channel.send({ content: `Please specify a card to search for.`})
	const allBinders = await Binder.findAll({ include: Player })
	const allWishlists = await Wishlist.findAll({ include: Player })
	
	const membersMap = await message.guild.members.fetch()
	const memberIds = [...membersMap.keys()]
	const filtered_binders = allBinders.filter((binder) => memberIds.includes(binder.playerId))
	const filtered_wishlists = allWishlists.filter((wishlist) => memberIds.includes(wishlist.playerId))

	const query = args.join(' ')
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	const card_name = await findCard(query, fuzzyPrints)
	const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name) : null
	if (!print) return message.channel.send({ content: `Sorry, I do not recognize the card: "${query}".`})
	const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`

	const binderResults = []
	const wishlistResults = []

	filtered_binders.forEach(function(binder) {
		for (let i = 0; i < 18; i++) {
			if (binder[`slot_${(i + 1)}`] === print.card_code) binderResults.push(binder.player.name)
		}
	})
	
	filtered_wishlists.forEach(function(wishlist) {
		for (let i = 0; i < 18; i++) {
			if (wishlist[`slot_${(i + 1)}`] === print.card_code) wishlistResults.push(wishlist.player.name)
		}
	})

	binderResults.sort()
	wishlistResults.sort()

	return message.channel.send({ content: `Search results for ${card}:\n**Binders:**\n${binderResults.length ? binderResults.join('\n') : 'N/A'}\n\n**Wishlists:**\n${wishlistResults.length ? wishlistResults.join('\n') : 'N/A'}`})
}

//WISHLIST
if(wishlistcom.includes(cmd)) {
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
	const wishlist = await Wishlist.findOne({ where: { playerId }, include: Player})
	if (!wishlist && playerId === maid) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})
	if (!wishlist && playerId !== maid) return message.channel.send({ content: `That user is not in the database.`})

	if (!args.length || playerId !== maid) {
		const prints = []
		
		for (let i = 0; i < 18; i++) {
			const card_code = wishlist[`slot_${i + 1}`]
			if (!card_code) continue
			const print = await Print.findOne({ where: { card_code }})
			prints.push(print)
		}

		prints.sort((a, b) => b.market_price - a.market_price)
		const results = prints.map((print) => `${eval(print.rarity)}${print.card_code} - ${print.card_name}`)

		if (!results.length) return message.channel.send({ content: `${playerId === maid ? 'Your' : `${wishlist.player.name}'s`} wishlist is empty.`})
		else return message.channel.send({ content: `**${wishlist.player.name}'s Wishlist**\n${results.join('\n')}`})
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
		wishlist.slot_11 = null
		wishlist.slot_12 = null
		wishlist.slot_13 = null
		wishlist.slot_14 = null
		wishlist.slot_15 = null
		wishlist.slot_16 = null
		wishlist.slot_17 = null
		wishlist.slot_18 = null

		await wishlist.save()
		return message.channel.send({ content: `Your wishlist has been emptied.`})
	}
	
	const inputs = args.join(' ').replace(/\s+/g, ' ').split(";").map((el) => el.trim())
	for (let j = 0; j < inputs.length; j++) {
		const query = inputs[j]
		const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
		const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
		const card_name = await findCard(query, fuzzyPrints)
		const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name) : null
		if (!print) {
			message.channel.send({ content: `Sorry, I do not recognize the card: "${query}".`})
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
				message.channel.send({ content: `You removed ${card} from your wishlist.`})
				foundCopy = true
				break
			}
		}

		if (foundCopy) continue

		let success = false
		let i = 0
		while (!success && i < 18) {
			if (!wishlist[`slot_${i + 1}`]) {
				success = true
				wishlist[`slot_${i + 1}`] = print.card_code
				await wishlist.save()
				message.channel.send({ content: `You added ${card} to your wishlist.`})
			} else {
				i++
			}
		}

		if (!success) return message.channel.send({ content: `Your wishlist is full. Please remove a card or empty it to make room.`})
	}

	return
}

//WALLET
if(walletcom.includes(cmd)) {
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
	const wallet = await Wallet.findOne({ where: { playerId }, include: Player})
	if (!wallet && playerId === maid) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})
	if (!wallet && playerId !== maid) return message.channel.send({ content: `That user is not in the database.`})

	const results = [`${FiC} --- ${wallet.player.name}'s Wallet --- ${FiC}`]
	results.push(`Starchips: ${wallet.starchips}${starchips}`)
	results.push(`Stardust: ${wallet.stardust}${stardust}`)
	results.push(`Forgestones: ${wallet.forgestone}${forgestone}`)
	if (wallet.tickets) results.push(`Tickets: ${wallet.tickets} ${tix}`)
	if (wallet.credits) results.push(`Credits: ${wallet.credits} ${credits}`)
	if (wallet.mushroom) results.push(`Mushrooms: ${wallet.mushroom} ${mushroom}`)
	if (wallet.moai) results.push(`Moai: ${wallet.moai} ${moai}`)
	if (wallet.rose) results.push(`Roses: ${wallet.rose} ${rose}`)
	if (wallet.hook) results.push(`Hooks: ${wallet.hook} ${hook}`)
	if (wallet.egg) results.push(`Eggs: ${wallet.egg} ${egg}`)
	if (wallet.cactus) results.push(`Cacti: ${wallet.cactus} ${cactus}`)
	if (wallet.swords) results.push(`Swords: ${wallet.swords} ${swords}`)
	if (wallet.orb) results.push(`Orbs: ${wallet.orb} ${orb}`)
	if (wallet.gem) results.push(`Gems: ${wallet.gem} ${gem}`)
	if (wallet.skull) results.push(`Skulls: ${wallet.skull} ${skull}`)
	if (wallet.familiar) results.push(`Familiars: ${wallet.familiar} ${familiar}`)
	if (wallet.battery) results.push(`Batteries: ${wallet.battery} ${battery}`)

	return message.channel.send({ content: results.join('\n').toString()})
}

//STATS
if (statscom.includes(cmd)) {
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
	const player = await Player.findOne({ 
		where: { id: playerId },
		include: [Profile, Wallet] 
	})

	if (!player && maid === playerId) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})
	if (!player && maid !== playerId) return message.channel.send({ content: `That user is not in the database.`})

	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	: message.channel === client.channels.cache.get(pauperChannelId) ? "Pauper"
	: message.channel === client.channels.cache.get(draftChannelId) ? "Draft"
	: message.channel === client.channels.cache.get(triviaChannelId) ? "Trivia"
	: message.channel === client.channels.cache.get(marketPlaceChannelId) ? "Market"
	: "Ranked"

	const allPlayers = await Player.findAll({
		include: [Profile, Wallet]
	})

	const membersMap = await message.guild.members.fetch()
	const memberIds = [...membersMap.keys()]
	const active_players = allPlayers.filter((player) => memberIds.includes(player.id))
	
	if (game === 'Ranked') {
		const filtered_players = active_players.filter((player) => player.wins || player.losses)
		const sorted_players = filtered_players.sort((a, b) => b.stats - a.stats)
		const index = sorted_players.length ? sorted_players.findIndex((player) => player.id === playerId) : null
		const rank = index !== null ? `#${index + 1} out of ${sorted_players.length}` : `N/A`
		const medal = getMedal(player.stats, title = true)		
		if (playerId === maid) completeTask(message.channel, maid, 'e4')
		
		return message.channel.send({ content: 
			`${FiC} --- Ranked Stats --- ${FiC}`
			+ `\nName: ${player.name}`
			+ `\nMedal: ${medal}`
			+ `\nStarchips: ${player.wallet.starchips}${starchips}`
			+ `\nStardust: ${player.wallet.stardust}${stardust}`
			+ `\nRanking: ${rank}`
			+ `\nElo Rating: ${player.stats.toFixed(2)}`
			+ `\nWins: ${player.wins}, Losses: ${player.losses}`
			+ `\nWin Rate: ${player.wins || player.losses ? `${(100 * player.wins / (player.wins + player.losses)).toFixed(2)}%` : 'N/A'}`
		})
	} else if (game === 'Market') {
		const transformed_wallets = []
		const filtered_players = active_players.filter((player) => player.wallet && player.id !== merchbotId)

		for (let i = 0; i < filtered_players.length; i++) {
			const w = filtered_players[i].wallet
			const invs = await Inventory.findAll({ where: { playerId: w.playerId }, include: Print })
			let networth = parseInt(w.starchips) + (parseInt(w.stardust) / 10)
			invs.forEach((inv) => networth += (parseInt(inv.print.market_price) * parseInt(inv.quantity) / 10))
			transformed_wallets.push([w.playerId, Math.round(networth)])
		}

		transformed_wallets.sort((a, b) => b[1] - a[1])
		const index = transformed_wallets.length ? transformed_wallets.findIndex((w) => w[0] === playerId) : null
		const rank = index !== null ? `#${index + 1} out of ${transformed_wallets.length}` : `N/A`
		const networth = transformed_wallets[index][1]
		const pCount = await Print.count({ where: { hidden: false, draft: false } })
		const iCount = await Inventory.count({ where: { playerId: playerId, quantity: { [Op.gt]: 0 }, draft: false } })
		const tCount = await Trade.count({ where: { [Op.or]: [ { senderId: playerId }, { receiverId: playerId }] } })

		return message.channel.send({ content: 
			`${king} --- Marketplace Stats --- ${king}`
			+ `\nName: ${player.name}`
			+ `\nRanking: ${rank}`
			+ `\nNet Worth: ${networth} ${starchips}`
			+ `\nPrints: ${iCount} out of ${pCount} ${ygocard}`
			+ `\nTrades: ${tCount} ${robbed}`
			+ `\nPartners: ${player.profile.trade_partners} ${merchant}`
		})
	} else if (game === 'Trivia') {
		const transformed_knowledges = []

		const allKnowledges = await Knowledge.findAll()

		const playerIds = []
		for (let i = 0; i < allKnowledges.length; i++) {
			const knowledge = allKnowledges[i]
			const playerId = knowledge.playerId
			if (!playerIds.includes(playerId)) playerIds.push(playerId)
		}

		for (let i = 0; i < playerIds.length; i++) {
			const playerId = playerIds[i]
			const correct_answers = await Knowledge.count({ where: { playerId: playerId }})
			transformed_knowledges.push([playerId, correct_answers])
		}

		transformed_knowledges.sort((a, b) => b[1] - a[1])
		const index = transformed_knowledges.length ? transformed_knowledges.findIndex((k) => k[0] === playerId) : null
		const rank = index !== null ? `#${index + 1} out of ${transformed_knowledges.length}` : `N/A`
		const smarts = transformed_knowledges[index][1]
		
		return message.channel.send({ content: 
			`${no} --- Trivia Stats --- ${yes}`
			+ `\nName: ${player.name}`
			+ `\nRanking: ${rank}`
			+ `\nCorrectly Answered: ${smarts} ${stoned}`
		})
	} else if (game === 'Arena') {
		const filtered_players = active_players.filter((player) => player.arena_wins || player.arena_losses)
		const sorted_players = filtered_players.sort((a, b) => {
			const difference = getArenaVictories(b.profile) - getArenaVictories(a.profile)
			if (difference) return difference
			else return b.arena_stats - a.arena_stats
		})

		const index = sorted_players.length ? sorted_players.findIndex((player) => player.id === playerId) : null
		const rank = index !== null ? `#${index + 1} out of ${sorted_players.length}` : `N/A`
		const medal = getMedal(player.arena_stats, title = true)

		const p = player.profile
		const victories = getArenaVictories(p)

		return message.channel.send({ content: 
			`${shrine} --- Arena Stats --- ${shrine}`
			+ `\nName: ${player.name}`
			+ `\nRanking: ${rank}`
			+ `\nVictories: ${victories} ${champion}`
			+ `${p.beast_wins ? `\nBeast Wins: ${p.beast_wins} ${p.beast_wins >= 3 ? `${beast} ${beast} ${beast}` : p.beast_wins >= 2 ? `${beast} ${beast}` : `${beast}`}` : ''}`
			+ `${p.dinosaur_wins ? `\nDinosaur Wins: ${p.dinosaur_wins} ${p.dinosaur_wins >= 3 ? `${dinosaur} ${dinosaur} ${dinosaur}` : p.dinosaur_wins >= 2 ? `${dinosaur} ${dinosaur}` : `${dinosaur}`}` : ''}`
			+ `${p.dragon_wins ? `\nDragon Wins: ${p.dragon_wins} ${p.dragon_wins >= 3 ? `${dragon} ${dragon} ${dragon}` : p.dragon_wins >= 2 ? `${dragon} ${dragon}` : `${dragon}`}` : ''}`
			+ `${p.fiend_wins ? `\nFiend Wins: ${p.fiend_wins} ${p.fiend_wins >= 3 ? `${fiend} ${fiend} ${fiend}` : p.fiend_wins >= 2 ? `${fiend} ${fiend}` : `${fiend}`}` : ''}`
			+ `${p.fish_wins ? `\nFish Wins: ${p.fish_wins} ${p.fish_wins >= 3 ? `${fish} ${fish} ${fish}` : p.fish_wins >= 2 ? `${fish} ${fish}` : `${fish}`}` : ''}`
			+ `${p.plant_wins ? `\nPlant Wins: ${p.plant_wins} ${p.plant_wins >= 3 ? `${plant} ${plant} ${plant}` : p.plant_wins >= 2 ? `${plant} ${plant}` : `${plant}`}` : ''}`
			+ `${p.reptile_wins ? `\nReptile Wins: ${p.reptile_wins} ${p.reptile_wins >= 3 ? `${reptile} ${reptile} ${reptile}` : p.reptile_wins >= 2 ? `${reptile} ${reptile}` : `${reptile}`}` : ''}`
			+ `${p.rock_wins ? `\nRock Wins: ${p.rock_wins} ${p.rock_wins >= 3 ? `${rock} ${rock} ${rock}` : p.rock_wins >= 2 ? `${rock} ${rock}` : `${rock}`}` : ''}`
			+ `${p.spellcaster_wins ? `\nSpellcaster Wins: ${p.spellcaster_wins} ${p.spellcaster_wins >= 3 ? `${spellcaster} ${spellcaster} ${spellcaster}` : p.spellcaster_wins >= 2 ? `${spellcaster} ${spellcaster}` : `${spellcaster}`}` : ''}`
			+ `${p.thunder_wins ? `\nThunder Wins: ${p.thunder_wins} ${p.thunder_wins >= 3 ? `${thunder} ${thunder} ${thunder}` : p.thunder_wins >= 2 ? `${thunder} ${thunder}` : `${thunder}`}` : ''}`
			+ `${p.warrior_wins ? `\nWarrior Wins: ${p.warrior_wins} ${p.warrior_wins >= 3 ? `${warrior} ${warrior} ${warrior}` : p.warrior_wins >= 2 ? `${warrior} ${warrior}` : `${warrior}`}` : ''}`
			+ `${p.zombie_wins ? `\nZombie Wins: ${p.zombie_wins} ${p.zombie_wins >= 3 ? `${zombie} ${zombie} ${zombie}` : p.zombie_wins >= 2 ? `${zombie} ${zombie}` : `${zombie}`}` : ''}`
			+ `\nMedal: ${medal}`
			+ `\nElo Rating: ${player.arena_stats.toFixed(2)}`
			+ `\nWins: ${player.arena_wins}, Losses: ${player.arena_losses}`
			+ `\nWin Rate: ${player.arena_wins || player.arena_losses ? `${(100 * player.arena_wins / (player.arena_wins + player.arena_losses)).toFixed(2)}%` : 'N/A'}`
		})
	} else if (game === 'Pauper') {
		const filtered_players = active_players.filter((player) => player.pauper_wins || player.pauper_losses)
		const sorted_players = filtered_players.sort((a, b) => b.pauper_stats - a.pauper_stats)
		const index = sorted_players.length ? sorted_players.findIndex((player) => player.id === playerId) : null
		const rank = index !== null ? `#${index + 1} out of ${sorted_players.length}` : `N/A`
		const medal = getMedal(player.pauper_stats, title = true)

		return message.channel.send({ content: 
			`${com} --- Pauper Stats --- ${com}`
			+ `\nName: ${player.name}`
			+ `\nMedal: ${medal}`
			+ `\nRanking: ${rank}`
			+ `\nElo Rating: ${player.pauper_stats.toFixed(2)}`
			+ `\nWins: ${player.pauper_wins}, Losses: ${player.pauper_losses}`
			+ `\nWin Rate: ${player.pauper_wins || player.pauper_losses ? `${(100 * player.pauper_wins / (player.pauper_wins + player.pauper_losses)).toFixed(2)}%` : 'N/A'}`
		})
	} else if (game === 'Draft') {
		const filtered_players = active_players.filter((player) => player.draft_wins || player.draft_losses)
		const sorted_players = filtered_players.sort((a, b) => b.draft_stats - a.draft_stats)
		const index = sorted_players.length ? sorted_players.findIndex((player) => player.id === playerId) : null
		const rank = index !== null ? `#${index + 1} out of ${sorted_players.length}` : `N/A`
		const medal = getMedal(player.draft_stats, title = true)

		return message.channel.send({ content: 
			`${draft} --- Draft Stats --- ${draft}`
			+ `\nName: ${player.name}`
			+ `\nMedal: ${medal}`
			+ `\nRanking: ${rank}`
			+ `\nElo Rating: ${player.draft_stats.toFixed(2)}`
			+ `\nWins: ${player.draft_wins}, Losses: ${player.draft_losses}`
			+ `\nWin Rate: ${player.draft_wins || player.draft_losses ? `${(100 * player.draft_wins / (player.draft_wins + player.draft_losses)).toFixed(2)}%` : 'N/A'}`
		})
	}
}

//LOSS
if (losscom.includes(cmd)) {
	const oppo = message.mentions.users.first() ? message.mentions.users.first().id : null	
	if (!oppo) return message.channel.send({ content: `No player specified.`})
	if (oppo === maid) return message.channel.send({ content: `You cannot lose a match to yourself.`})

	const winner = message.guild.members.cache.get(oppo)
	const loser = message.guild.members.cache.get(maid)
	const winningPlayer = await Player.findOne({ where: { id: oppo }, include: [Diary, Wallet] })
	const losingPlayer = await Player.findOne({ where: { id: maid }, include: [Diary, Wallet] })

	if (winner.roles.cache.some(role => role.id === botRole)) return message.channel.send({ content: `Sorry, Bots do not play Forged in Chaos... *yet*.`})
	if (oppo.length < 17 || oppo.length > 18) return message.channel.send({ content: `To report a loss, type **!loss @opponent**.`})
	if (!losingPlayer) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})
	if (!winningPlayer) return message.channel.send({ content: `That user is not in the database.`})
	
	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	: message.channel === client.channels.cache.get(draftChannelId) ? "Draft"
	: message.channel === client.channels.cache.get(pauperChannelId) ? "Pauper"
	: message.channel === client.channels.cache.get(tournamentChannelId) ? "Tournament"
	: "Ranked"

	const date = new Date()
	date.setHours(0, 0, 0, 0)
	const d = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
	const m = (date.getMonth() + 1) < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1
	const y = date.getFullYear()
	const today = `${y}-${m}-${d}`

	const hasArenaRole = isArenaPlayer(message.member)
	const hasDraftRole = isDraftPlayer(message.member)
	const hasTourRole = isTourPlayer(message.member)

	if (hasTourRole && game === 'Tournament') {
		const losingEntry = await Entry.findOne({ where: { playerId: losingPlayer.id }, include: Player })
		if (!losingEntry) return message.channel.send({ content: `You are not an active member of any tournaments.`})

		const winningEntry = await Entry.findOne({ where: { playerId: winningPlayer.id }, include: Player })
		if (!winningEntry) return message.channel.send({ content: `That person is not an active member of any tournaments.`})
		const tournamentId = losingEntry.tournamentId
		if (tournamentId !== winningEntry.tournamentId) return message.channel.send({ content: `Sorry, you are not in the same tournament as ${winningPlayer.name}.`})

		const tournament = await Tournament.findOne({ 
			where: { 
				id: tournamentId
			}
		})

		if (!tournament) return message.channel.send({ content: `Sorry I could not find your tournament in the database.`})
		if (tournament.state === 'pending') return message.channel.send({ content: `Sorry, ${tournament.name} has not started yet.`})
		if (tournament.state !== 'underway') return message.channel.send({ content: `Sorry, ${tournament.name} is not underway.`})
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
		if (!success) return message.channel.send({ content: `Error: could not update bracket for ${tournament.name}.`})

		losingEntry.losses++
		await losingEntry.save()
		
		const diary = winningPlayer.diary
		const easy_complete = diary.e1 && diary.e2 && diary.e3 && diary.e4 && diary.e5 && diary.e6 && diary.e7 && diary.e8 && diary.e9 && diary.e10 && diary.e11 && diary.e12
		const diary_bonus = easy_complete ? 1 : 0
		
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

		const daily_bonus = count ? 0 : 3
		const pack_bonus = count === 1
		const origStatsWinner = winningPlayer.stats
		const origStatsLoser = losingPlayer.stats
		const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origStatsWinner - origStatsLoser) / 400))))))
		const chipsWinner = Math.round((delta)) + 5 < 9 ? 9 : Math.round((delta)) + 5 > 29 ? 29 : Math.round((delta)) + 5
		const chipsLoser = (origStatsLoser - origStatsWinner) < 72 ? 5 : (origStatsLoser - origStatsWinner) >=150 ? 3 : 4

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

		winningPlayer.wallet.starchips += (chipsWinner + daily_bonus + diary_bonus)
		await winningPlayer.wallet.save()

		losingPlayer.stats -= delta
		losingPlayer.backup = origStatsLoser
		losingPlayer.losses++
		losingPlayer.current_streak = 0
		await losingPlayer.save()

		losingPlayer.wallet.starchips += chipsLoser
		await losingPlayer.wallet.save()

		if (winningPlayer.stats >= 530 && !winner.roles.cache.some(role => role.id === expertRole)) {
			winner.roles.add(expertRole)
			winner.roles.remove(noviceRole)
		}

		if (losingPlayer.stats < 530 && !loser.roles.cache.some(role => role.id === noviceRole)) {
			loser.roles.add(noviceRole)
			loser.roles.remove(expertRole)
		}

		await Match.create({
			game_mode: "tournament",
			winner_name: winningPlayer.name,
			winnerId: winningPlayer.id,
			loser_name: losingPlayer.name,
			loserId: losingPlayer.id,
			delta: delta,
			chipsWinner: (chipsWinner + daily_bonus + diary_bonus),
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
		if (daily_bonus) setTimeout(() => message.channel.send({ content: `<@${winningPlayer.id}>, Congrats! You earned an additional +3${starchips} for your first ranked win of the day! ${legend}`}), 2000)
		if (pack_bonus) setTimeout(async () => {
			const set1 = await Set.findOne({ where: { code: 'DOC' }})
			const set2 = await Set.findOne({ where: { code: 'TEB' }})
			await awardPack(message.channel, winningPlayer.id, set1)
			await awardPack(message.channel, winningPlayer.id, set2)
			message.channel.send({ content: `<@${winningPlayer.id}>, Congrats! You earned a bonus pack of DOC ${DOC} and TEB ${TEB} for your second ranked win of the day! ${god}`})
		}, 2000)
		message.channel.send({ content: `${losingPlayer.name} (+${chipsLoser}${starchips}), your Tournament loss to ${winningPlayer.name} (+${chipsWinner + diary_bonus}${starchips}) has been recorded.`})
		
		const updatedMatchesArr = await getMatches(tournamentId)
		const winnerNextMatch = findNextMatch(updatedMatchesArr, matchId, winningEntry.participantId)
		const winnerNextOpponent = winnerNextMatch ? await findNextOpponent(tournamentId, updatedMatchesArr, winnerNextMatch, winningEntry.participantId) : null
		const winnerMatchWaitingOn = winnerNextOpponent ? null : findOtherPreReqMatch(updatedMatchesArr, winnerNextMatch, matchId) 
		const winnerWaitingOnP1 = winnerMatchWaitingOn && winnerMatchWaitingOn.p1 && winnerMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournamentId, participantId: winnerMatchWaitingOn.p1 } }) : null
		const winnerWaitingOnP2 = winnerMatchWaitingOn && winnerMatchWaitingOn.p1 && winnerMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournamentId, participantId: winnerMatchWaitingOn.p2 } }) : null

		const loserEliminated = tournament.tournament_type === 'single elimination' ? true :
			tournament.tournament_type === 'double elimination' && losingEntry.losses >= 2 ? true :
			false

		if (loserEliminated) {
			message.member.roles.remove(tourRole)
			await losingEntry.destroy()
		}

		const loserNextMatch = loserEliminated ? null : findNextMatch(updatedMatchesArr, matchId, losingEntry.participantId)
		const loserNextOpponent = loserNextMatch ? await findNextOpponent(tournamentId, updatedMatchesArr, loserNextMatch, losingEntry.participantId) : null
		const loserMatchWaitingOn = loserNextOpponent ? null : findOtherPreReqMatch(updatedMatchesArr, loserNextMatch, matchId) 
		const loserWaitingOnP1 = loserMatchWaitingOn && loserMatchWaitingOn.p1 && loserMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournamentId, participantId: loserMatchWaitingOn.p1 }, include: Player }) : null
		const loserWaitingOnP2 = loserMatchWaitingOn && loserMatchWaitingOn.p1 && loserMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournamentId, participantId: loserMatchWaitingOn.p2 }, include: Player }) : null

		setTimeout(() => {
			if (loserEliminated) return message.channel.send({ content: `${losingPlayer.name}, You are eliminated from the tournament. Better luck next time!`})
			else if (loserNextOpponent) return message.channel.send({ content: `New Match: <@${losingPlayer.id}> vs. <@${loserNextOpponent.playerId}>. Good luck to both duelists.`})
			else if (loserMatchWaitingOn && loserWaitingOnP1 && loserWaitingOnP2) {
				return message.channel.send({ content: `${losingPlayer.name}, You are waiting for the result of ${loserWaitingOnP1.name} vs ${loserWaitingOnP2.name}.`})
			}
			else return message.channel.send({ content: `${losingPlayer.name}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`})
		}, 2000)

		setTimeout(() => {
			if (!winnerNextMatch) return message.channel.send({ content: `<@${winningPlayer.id}>, You won the tournament! Congratulations on your stellar performance! ${FiC}`})
			else if (winnerNextOpponent) return message.channel.send({ content: `New Match: <@${winningPlayer.id}> vs. <@${winnerNextOpponent.playerId}>. Good luck to both duelists.`})
			else if (winnerMatchWaitingOn && winnerWaitingOnP1 && winnerWaitingOnP2) {
				return message.channel.send({ content: `${winningPlayer.name}, You are waiting for the result of ${winnerWaitingOnP1.name} vs ${winnerWaitingOnP2.name}.`})
			}
			else return message.channel.send({ content: `${winningPlayer.name}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`})
		}, 4000)

		return
	} else if (!hasTourRole && game === 'Tournament') {
		return message.channel.send({ content: `You do not have the Tournament Players role. Please report your loss in the appropriate channel.`})
	} else if (hasArenaRole && game === 'Arena') {
		const losingContestant = await Arena.findOne({ where: { playerId: maid }})
		if (!losingContestant) return message.channel.send({ content: `You are not in the current Arena.`})
		const winningContestant = await Arena.findOne({ where: { playerId: oppo }})
		if (!winningContestant) return message.channel.send({ content: `That player is not your Arena opponent.`})
		if (!losingContestant.is_playing || !winningContestant.is_playing) return message.channel.send({ content: `Your match result was already recorded for this round of the Arena.`})

		const info = await Info.findOne({ where: { element: 'arena' } })
		if (!info) return message.channel.send({ content: `Error: could not find game: "arena".`})
		
		const pairings = info.round === 1 ? [["P1", "P2"], ["P3", "P4"]] :
            info.round === 2 ? [["P1", "P3"], ["P2", "P4"]] :
            info.round === 3 ? [["P1", "P4"], ["P2", "P3"]] : 
            null
	
		let correct_pairing = info.round === 4 ? true : false
		if (!correct_pairing) {
			for (let i = 0; i < 2; i++) {
				if ((pairings[i][0] === losingContestant.contestant && 
						pairings[i][1] === winningContestant.contestant) ||
					(pairings[i][0] === winningContestant.contestant &&
						pairings[i][1] === losingContestant.contestant)) correct_pairing = true
			}
		}

		if (!correct_pairing) return message.channel.send({ content: `That player is not your Arena opponent.`})

		const origStatsWinner = winningPlayer.arena_stats
		const origStatsLoser = losingPlayer.arena_stats
		const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origStatsWinner - origStatsLoser) / 400))))))
		
		winningPlayer.arena_stats += delta
		winningPlayer.arena_backup = origStatsWinner
		winningPlayer.arena_wins++
		await winningPlayer.save()

		losingPlayer.arena_stats -= delta
		losingPlayer.arena_backup = origStatsLoser
		losingPlayer.arena_losses++
		await losingPlayer.save()
	
		winningPlayer.wallet.starchips += 5
		await winningPlayer.wallet.save()

		losingPlayer.wallet.starchips += 3
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
			delta: delta,
			chipsWinner: 5,
			chipsLoser: 3
		})

		message.channel.send({ content: `${losingPlayer.name} (+3${starchips}), your Arena loss to ${winner.user.username} (+5${starchips}) has been recorded.`})
		return checkArenaProgress(info)
	} else if (!hasArenaRole && game === 'Arena') {
		const voucher = await getTribe(message, winningPlayer)
		if (!voucher) return message.channel.send({ content: `Please have ${winningPlayer.name} specify their tribe.`})
		const origStatsWinner = winningPlayer.arena_stats
		const origStatsLoser = losingPlayer.arena_stats
		const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origStatsWinner - origStatsLoser) / 400))))))
		
		winningPlayer.arena_stats += delta
		winningPlayer.arena_backup = origStatsWinner
		winningPlayer.arena_wins++
		await winningPlayer.save()

		losingPlayer.arena_stats -= delta
		losingPlayer.arena_backup = origStatsLoser
		losingPlayer.arena_losses++
		await losingPlayer.save()
	
		winningPlayer.wallet.starchips += 3
		winningPlayer.wallet[voucher]++
		await winningPlayer.wallet.save()

		losingPlayer.wallet.starchips += 2
		await losingPlayer.wallet.save()

		await Match.create({ 
			game_mode: "arena",
			winner_name: winningPlayer.name,
			winnerId: winningPlayer.id,
			loser_name: losingPlayer.name,
			loserId: losingPlayer.id,
			delta: delta,
			chipsWinner: 3,
			chipsLoser: 2
		})

		message.channel.send({ content: `${losingPlayer.name} (+2${starchips}), your Arena loss to ${winner.user.username} (+3${starchips}, +1${eval(voucher)}) has been recorded.`})
	} else if (hasArenaRole && game !== 'Arena') {
		return message.channel.send({ content: `You have the Arena Players role. Please report your Arena loss in <#${arenaChannelId}>, or get a Moderator to help you.`})
	} else if (hasDraftRole && game === 'Draft') {
		const losingContestant = await Draft.findOne({ where: { playerId: maid }})
		if (!losingContestant) return message.channel.send({ content: `You are not in the current Draft.`})
		const winningContestant = await Draft.findOne({ where: { playerId: oppo }})
		if (!winningContestant) return message.channel.send({ content: `That player is not your Draft opponent.`})
		if (!losingContestant.is_playing || !winningContestant.is_playing) return message.channel.send({ content: `Your match result was already recorded for this round of the Draft.`})

		const info = await Info.findOne({ where: { element: 'draft' } })
		if (!info) return message.channel.send({ content: `Error: could not find game: "draft".`})
		
		const pairings = info.round === 1 ? [["P1", "P2"], ["P3", "P4"]] :
            info.round === 2 ? [["P1", "P3"], ["P2", "P4"]] :
            info.round === 3 ? [["P1", "P4"], ["P2", "P3"]] : 
            null
	
		let correct_pairing = info.round === 4 ? true : false
		if (!correct_pairing) {
			for (let i = 0; i < 2; i++) {
				if ((pairings[i][0] === losingContestant.contestant && 
						pairings[i][1] === winningContestant.contestant) ||
					(pairings[i][0] === winningContestant.contestant &&
						pairings[i][1] === losingContestant.contestant)) correct_pairing = true
			}
		}

		if (!correct_pairing) return message.channel.send({ content: `That player is not your Draft opponent.`})

		const origStatsWinner = winningPlayer.draft_stats
		const origStatsLoser = losingPlayer.draft_stats
		const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origStatsWinner - origStatsLoser) / 400))))))
		
		winningPlayer.draft_stats += delta
		winningPlayer.draft_backup = origStatsWinner
		winningPlayer.draft_wins++
		await winningPlayer.save()

		losingPlayer.draft_stats -= delta
		losingPlayer.draft_backup = origStatsLoser
		losingPlayer.draft_losses++
		await losingPlayer.save()
	
		winningPlayer.wallet.starchips += 15
		await winningPlayer.wallet.save()

		losingPlayer.wallet.starchips += 8
		await losingPlayer.wallet.save()

		losingContestant.is_playing = false
		await losingContestant.save()

		winningContestant.score++
		winningContestant.is_playing = false
		await winningContestant.save()

		await Match.create({ 
			game_mode: "draft",
			winner_name: winningPlayer.name,
			winnerId: winningPlayer.id,
			loser_name: losingPlayer.name,
			loserId: losingPlayer.id,
			delta: delta,
			chipsWinner: 15,
			chipsLoser: 8
		})

		message.channel.send({ content: `${losingPlayer.name} (+8${starchips}), your Draft loss to ${winner.user.username} (+15${starchips}) has been recorded.`})
		return checkDraftProgress(info)
	} else if (!hasDraftRole && game === 'Draft') {
		return message.channel.send({ content: `You do not have the Draft Players role. Please report your loss in the appropriate channel.`})
	} else if (hasDraftRole && game !== 'Draft') {
		return message.channel.send({ content: `You have the Draft Players role. Please report your Draft loss in <#${draftChannelId}>, or get a Moderator to help you.`})
	} else if (!hasArenaRole && !hasDraftRole && game === 'Pauper') {
		const origStatsWinner = winningPlayer.pauper_stats
		const origStatsLoser = losingPlayer.pauper_stats
		const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origStatsWinner - origStatsLoser) / 400))))))
		
		winningPlayer.pauper_stats += delta
		winningPlayer.pauper_backup = origStatsWinner
		winningPlayer.pauper_wins++
		await winningPlayer.save()
		
		losingPlayer.pauper_stats -= delta
		losingPlayer.pauper_backup = origStatsLoser
		losingPlayer.pauper_losses++
		await losingPlayer.save()

		winningPlayer.wallet.starchips += 4
		await winningPlayer.wallet.save()

		losingPlayer.wallet.starchips += 2
		await losingPlayer.wallet.save()

		await Match.create({
			game_mode: "pauper",
			winner_name: winningPlayer.name,
			winnerId: winningPlayer.id,
			loser_name: losingPlayer.name,
			loserId: losingPlayer.id,
			delta: delta,
			chipsWinner: 4,
			chipsLoser: 2
		})

		return message.channel.send({ content: `${losingPlayer.name} (+2${starchips}), your Pauper loss to ${winningPlayer.name} (+4${starchips}) has been recorded.`})
	} else if (!hasArenaRole && game === 'Ranked') {
		const diary = winningPlayer.diary
		const easy_complete = diary.e1 && diary.e2 && diary.e3 && diary.e4 && diary.e5 && diary.e6 && diary.e7 && diary.e8 && diary.e9 && diary.e10 && diary.e11 && diary.e12
		const diary_bonus = easy_complete ? 1 : 0
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
		const daily_bonus = count ? 0 : 3
		const pack_bonus = count === 1
		const origStatsWinner = winningPlayer.stats
		const origStatsLoser = losingPlayer.stats
		const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origStatsWinner - origStatsLoser) / 400))))))
		const chipsWinner = (Math.round((delta)) + 5) < 9 ? 10 : (Math.round((delta)) + 5) > 29 ? 29 : (Math.round((delta)) + 5)
		const chipsLoser = (origStatsLoser - origStatsWinner) < 72 ? 5 : (origStatsLoser - origStatsWinner) >=150 ? 3 : 4

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

		winningPlayer.wallet.starchips += (chipsWinner + diary_bonus + daily_bonus)
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
			chipsWinner: (chipsWinner + diary_bonus + daily_bonus),
			chipsLoser: chipsLoser
		})

		if (winningPlayer.stats >= 530 && !winner.roles.cache.some(role => role.id === expertRole)) {
			winner.roles.add(expertRole)
			winner.roles.remove(noviceRole)
		}

		if (losingPlayer.stats < 530 && !loser.roles.cache.some(role => role.id === noviceRole)) {
			loser.roles.add(noviceRole)
			loser.roles.remove(expertRole)
		}

		completeTask(message.channel, winningPlayer.id, 'e3')
		if (winningPlayer.stats >= 530) completeTask(message.channel, winningPlayer.id, 'm1', 3000)
		if (winningPlayer.stats >= 590) completeTask(message.channel, winningPlayer.id, 'h1', 3000)
		if (winningPlayer.stats >= 650) completeTask(message.channel, winningPlayer.id, 'l1', 3000)
		if (winningPlayer.current_streak === 3) completeTask(message.channel, winningPlayer.id, 'm2', 5000) 
		if (winningPlayer.vanquished_foes === 20) completeTask(message.channel, winningPlayer.id, 'h2', 5000) 
		if (winningPlayer.current_streak === 10) completeTask(message.channel, winningPlayer.id, 'l2', 5000)
		if (daily_bonus) setTimeout(() => message.channel.send({ content: `<@${winningPlayer.id}>, Congrats! You earned an additional +3${starchips} for winning your 1st Ranked Match of the day! ${legend}`}), 2000)
		if (pack_bonus) setTimeout(async () => {
			const set1 = await Set.findOne({ where: { code: 'DOC' }})
			const set2 = await Set.findOne({ where: { code: 'TEB' }})
			await awardPack(message.channel, winningPlayer.id, set1)
			await awardPack(message.channel, winningPlayer.id, set2)
			message.channel.send({ content: `<@${winningPlayer.id}>, Congrats! You earned a bonus pack of  DOC ${DOC} and TEB ${TEB} for your second ranked win of the day! ${god}`})
		}, 2000)
		return message.channel.send({ content: `${losingPlayer.name} (+${chipsLoser}${starchips}), your loss to ${winningPlayer.name} (+${chipsWinner + diary_bonus}${starchips}) has been recorded.`})
	}
}

//MANUAL
if (manualcom.includes(cmd)) {
	if (!isMod(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})

	const usersMap = message.mentions.users
	const userIds = [...usersMap.keys()]	
	const winnerId = message.mentions.users.first() ? message.mentions.users.first().id : args.length > 0 ? args[0]	: null
	const loserId = userIds.length > 1 ? userIds[1] : args.length > 1 ? args[1] : null	
	if (!winnerId || !loserId) return message.channel.send({ content: `Please specify 2 players.`})
	if (winnerId === loserId) return message.channel.send({ content: `Please specify 2 different players.`})

	const winner = message.guild.members.cache.get(winnerId)
	const loser = message.guild.members.cache.get(loserId)
	const winningPlayer = await Player.findOne({ where: { id: winnerId }, include: [Diary, Wallet] })
	const losingPlayer = await Player.findOne({ where: { id: loserId }, include: [Diary, Wallet] })

	if ((winner && winner.roles.cache.some(role => role.id === botRole)) || (loser && loser.roles.cache.some(role => role.id === botRole))) return message.channel.send({ content: `Sorry, Bots do not play Forged in Chaos... *yet*.`})
	if (!losingPlayer && loser) return message.channel.send({ content: `Sorry, ${loser.user.username} is not in the database.`})
	if (!losingPlayer && !loser) return message.channel.send({ content: `Sorry, I cannot find user ${loserId} in the database.`})
	if (!winningPlayer) (`Sorry, ${winner.user.username} was not in the database.`)

	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	: message.channel === client.channels.cache.get(draftChannelId) ? "Draft"
	: message.channel === client.channels.cache.get(pauperChannelId) ? "Pauper"
	: message.channel === client.channels.cache.get(tournamentChannelId) ? "Tournament"
	: "Ranked"

	if ((winner && winner.roles.cache.some(role => role.id === arenaRole)) || (loser && loser.roles.cache.some(role => role.id === arenaRole))) {
		if (game !== "Arena") return message.channel.send({ content: `Please report this loss in: <#${arenaChannelId}>`})
		
		const losingContestant = await Arena.findOne({ where: { playerId: loserId }})
		if (!losingContestant) return message.channel.send({ content: `You are not in the current Arena.`})
		const winningContestant = await Arena.findOne({ where: { playerId: winnerId }})
		if (!winningContestant) return message.channel.send({ content: `That player is not the correct Arena opponent.`})

		const info = await Info.findOne({ where: { element: 'arena' } })
		if (!info) return message.channel.send({ content: `Error: could not find game: "arena".`})
	
		const pairings = info.round === 1 ? [["P1", "P2"], ["P3", "P4"]] :
            info.round === 2 ? [["P1", "P3"], ["P2", "P4"]] :
            info.round === 3 ? [["P1", "P4"], ["P2", "P3"]] : 
            null

		let correct_pairing = info.round === 4 ? true : false
		if (!correct_pairing) {
			for (let i = 0; i < 2; i++) {
				if ((pairings[i][0] === losingContestant.contestant && 
						pairings[i][1] === winningContestant.contestant) ||
					(pairings[i][0] === winningContestant.contestant &&
						pairings[i][1] === losingContestant.contestant)) correct_pairing = true
			}
		}

		if (!correct_pairing) return message.channel.send({ content: `That player is not the correct Arena opponent.`})
		
		const origStatsWinner = winningPlayer.arena_stats
		const origStatsLoser = losingPlayer.arena_stats
		const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origStatsWinner - origStatsLoser) / 400))))))

		losingPlayer.arena_losses++
		losingPlayer.arena_stats -= delta
		losingPlayer.arena_backup = origStatsLoser
		await losingPlayer.save()

		losingPlayer.wallet.starchips += 3
		await losingPlayer.wallet.save()
	
		losingContestant.is_playing = false
		await losingContestant.save()

		winningPlayer.arena_wins++
		winningPlayer.arena_stats += delta
		winningPlayer.arena_backup = origStatsWinner
		await winningPlayer.save()

		winningPlayer.wallet.starchips += 5
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
			delta: delta,
			chipsWinner: 5,
			chipsLoser: 3
		})

		message.channel.send({ content: `A manual Arena loss by ${losingPlayer.name} (+3${starchips}) to ${winningPlayer.name} (+5${starchips}) has been recorded.`})
		return checkArenaProgress(info)
	} else if ((winner && winner.roles.cache.some(role => role.id === draftRole)) || (loser && loser.roles.cache.some(role => role.id === draftRole))) {
		if (game !== "Draft") return message.channel.send({ content: `Please report this loss in: <#${draftChannelId}>`})
		
		const losingContestant = await Draft.findOne({ where: { playerId: loserId }})
		if (!losingContestant) return message.channel.send({ content: `You are not in the current Draft.`})
		const winningContestant = await Draft.findOne({ where: { playerId: winnerId }})
		if (!winningContestant) return message.channel.send({ content: `That player is not the correct Draft opponent.`})

		const info = await Info.findOne({ where: { element: 'draft' } })
		if (!info) return message.channel.send({ content: `Error: could not find game: "draft".`})
	
		const pairings = info.round === 1 ? [["P1", "P2"], ["P3", "P4"]] :
            info.round === 2 ? [["P1", "P3"], ["P2", "P4"]] :
            info.round === 3 ? [["P1", "P4"], ["P2", "P3"]] : 
            null

		let correct_pairing = info.round === 4 ? true : false
		if (!correct_pairing) {
			for (let i = 0; i < 2; i++) {
				if ((pairings[i][0] === losingContestant.contestant && 
						pairings[i][1] === winningContestant.contestant) ||
					(pairings[i][0] === winningContestant.contestant &&
						pairings[i][1] === losingContestant.contestant)) correct_pairing = true
			}
		}

		if (!correct_pairing) return message.channel.send({ content: `That player is not your Draft opponent.`})
		
		const origStatsWinner = winningPlayer.arena_stats
		const origStatsLoser = losingPlayer.arena_stats
		const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origStatsWinner - origStatsLoser) / 400))))))

		losingPlayer.draft_losses++
		losingPlayer.draft_stats -= delta
		losingPlayer.draft_backup = origStatsLoser
		await losingPlayer.save()

		losingPlayer.wallet.starchips += 8
		await losingPlayer.wallet.save()
	
		losingContestant.is_playing = false
		await losingContestant.save()

		winningPlayer.draft_wins++
		winningPlayer.draft_stats += delta
		winningPlayer.draft_backup = origStatsWinner
		await winningPlayer.save()

		winningPlayer.wallet.starchips += 15
		await winningPlayer.wallet.save()

		winningContestant.score++
		winningContestant.is_playing = false
		await winningContestant.save()

		await Match.create({
			game_mode: "draft",
			winner_name: winningPlayer.name,
			winnerId: winningPlayer.id,
			loser_name: losingPlayer.name,
			loserId: losingPlayer.id,
			delta: delta,
			chipsWinner: 15,
			chipsLoser: 8
		})

		message.channel.send({ content: `A manual Draft loss by ${losingPlayer.name} (+8${starchips}) to ${winningPlayer.name} (+15${starchips}) has been recorded.`})
		return checkDraftProgress(info)
	} else if (game === 'Pauper') {
		winningPlayer.pauper_wins++
		await winningPlayer.save()

		winningPlayer.wallet.starchips += 4
		await winningPlayer.wallet.save()

		losingPlayer.pauper_losses++
		await losingPlayer.save()

		losingPlayer.wallet.starchips += 2
		await losingPlayer.wallet.save()

		await Match.create({
			game_mode: "pauper",
			winner_name: winningPlayer.name,
			winnerId: winningPlayer.id,
			loser_name: losingPlayer.name,
			loserId: losingPlayer.id,
			delta: 0,
			chipsWinner: 4,
			chipsLoser: 2
		})

		return message.channel.send({ content: `A manual Pauper loss by ${losingPlayer.name} (+1${starchips}) to ${winningPlayer.name} (+3${starchips}) has been recorded.`})
	} else {
		const diary = winningPlayer.diary
		const easy_complete = diary.e1 && diary.e2 && diary.e3 && diary.e4 && diary.e5 && diary.e6 && diary.e7 && diary.e8 && diary.e9 && diary.e10 && diary.e11 && diary.e12
		const diary_bonus = easy_complete ? 1 : 0
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
		const daily_bonus = count ? 0 : 3
		const pack_bonus = count === 1
		const origStatsWinner = winningPlayer.stats
		const origStatsLoser = losingPlayer.stats
		const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origStatsWinner - origStatsLoser) / 400))))))
		const chipsWinner = (Math.round((delta)) + 5) < 9 ? 10 : (Math.round((delta)) + 5) > 29 ? 29 : (Math.round((delta)) + 5)
		const chipsLoser = (origStatsLoser - origStatsWinner) < 72 ? 5 : (origStatsLoser - origStatsWinner) >=150 ? 3 : 4

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

		winningPlayer.wallet.starchips += (chipsWinner + diary_bonus + daily_bonus)
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
			chipsWinner: (chipsWinner + diary_bonus + daily_bonus),
			chipsLoser: chipsLoser
		})

		if (winningPlayer.stats >= 530 && winner && !winner.roles.cache.some(role => role.id === expertRole)) {
			winner.roles.add(expertRole)
			winner.roles.remove(noviceRole)
		}

		if (losingPlayer.stats < 530 && loser && !loser.roles.cache.some(role => role.id === noviceRole)) {
			loser.roles.add(noviceRole)
			loser.roles.remove(expertRole)
		}

		completeTask(message.channel, winningPlayer.id, 'e3')
		if (winningPlayer.stats >= 530) completeTask(message.channel, winningPlayer.id, 'm1', 3000)
		if (winningPlayer.stats >= 590) completeTask(message.channel, winningPlayer.id, 'h1', 3000)
		if (winningPlayer.stats >= 650) completeTask(message.channel, winningPlayer.id, 'l1', 3000)
		if (winningPlayer.current_streak === 3) completeTask(message.channel, winningPlayer.id, 'm2', 5000) 
		if (winningPlayer.vanquished_foes === 20) completeTask(message.channel, winningPlayer.id, 'h2', 5000) 
		if (winningPlayer.current_streak === 10) completeTask(message.channel, winningPlayer.id, 'l2', 5000)
		if (daily_bonus) setTimeout(() => message.channel.send({ content: `<@${winningPlayer.id}>, Congrats! You earned an additional +3${starchips} for winning your 1st Ranked Match of the day! ${legend}`}), 2000)
		if (pack_bonus) setTimeout(async () => {
			const set = await Set.findOne({ where: { code: 'DOC' }})
			await awardPack(message.channel, winningPlayer.id, set)
			message.channel.send({ content: `<@${winningPlayer.id}>, Congrats! You earned a bonus pack of ${set.code} ${eval(set.code)} for your second ranked win of the day! ${god}`})
		}, 2000)
		return message.channel.send({ content: `A manual loss by ${losingPlayer.name} (+${chipsLoser}${starchips}) to ${winningPlayer.name} (+${chipsWinner + diary_bonus}${starchips}) has been recorded.`})		
	}
}

//NO SHOW
if (noshowcom.includes(cmd)) {
	if (!isMod(message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
	const noShowId = message.mentions.users.first() ? message.mentions.users.first().id : null	
	const noShowMember = message.mentions.members.first() || null	
	if (!noShowId) return message.channel.send({ content: "Please specify a player."})
	if (!noShowMember) return message.channel.send({ content: "Could not find member in the server."})
	const noShowPlayer = await Player.findOne({ where: { id: noShowId } })
	if (!noShowPlayer) return message.channel.send({ content: `That user is not in the database.`})

	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	: message.channel === client.channels.cache.get(draftChannelId) ? "Draft"
	: message.channel === client.channels.cache.get(tournamentChannelId) ? "Tournament"
	: null

	if (!game) return message.channel.send({ content: `Try using **${cmd}** in channels like: <#${arenaChannelId}>.`})
	
	if (game === 'Tournament') {
		const noShowEntry = await Entry.findOne({ where: { playerId: noShowId }, include: [Player, Tournament] })
	
		if (!noShowEntry || !noShowMember.roles.cache.some(role => role.id === tourRole)) {
			return message.channel.send({ content: `Sorry, ${noShow.user.username} is not in the tournament.`})
		} 
	
		const tournament = noShowEntry.tournament
		if (tournament.state === 'pending') return message.channel.send({ content: `Sorry, ${tournament.name} has not started yet.`})
		if (tournament.state !== 'underway') return message.channel.send({ content: `Sorry, ${tournament.name} is not underway.`})
		
		const matchesArr = await getMatches(tournament.id)
		let matchId = false
		let winnerParticipantId = false
		let scores = "0-0"
		for (let i = 0; i < matchesArr.length; i++) {
			const match = matchesArr[i].match
			if (match.state !== 'open') continue
			winnerParticipantId = findNoShowOpponent(match, noShowEntry.participantId)
			if (winnerParticipantId) {
				matchId = match.id
				break
			}
		}

		const winningEntry = await Entry.findOne({ where: { participantId: winnerParticipantId, tournamentId: tournament.id }, include: Player })
		if (!winningEntry) return message.channel.send({ content: `Error: could not find opponent.`})

		const success = await putMatchResult(tournament.id, matchId, winningEntry.participantId, scores)
		if (!success) return message.channel.send({ content: `Error: could not update bracket for ${tournament.name}.`})

		noShowEntry.losses++
		await noShowEntry.save()
		
		message.channel.send({ content: `${noShowEntry.player.name}, your Tournament loss to ${winningEntry.player.name} has been recorded as a no-show.`})
		
		const updatedMatchesArr = await getMatches(tournament.id)
		const winnerNextMatch = findNextMatch(updatedMatchesArr, matchId, winningEntry.participantId)
		const winnerNextOpponent = winnerNextMatch ? await findNextOpponent(tournament.id, updatedMatchesArr, winnerNextMatch, winningEntry.participantId) : null
		const winnerMatchWaitingOn = winnerNextOpponent ? null : findOtherPreReqMatch(updatedMatchesArr, winnerNextMatch, matchId) 
		const winnerWaitingOnP1 = winnerMatchWaitingOn && winnerMatchWaitingOn.p1 && winnerMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: winnerMatchWaitingOn.p1 } }) : null
		const winnerWaitingOnP2 = winnerMatchWaitingOn && winnerMatchWaitingOn.p1 && winnerMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: winnerMatchWaitingOn.p2 } }) : null

		const noShowEliminated = tournament.tournament_type === 'single elimination' ? true :
			tournament.tournament_type === 'double elimination' && noShowEntry.losses >= 2 ? true :
			false

		if (noShowEliminated) {
			noShowMember.roles.remove(tourRole)
			await noShowEntry.destroy()
		}

		const noShowNextMatch = noShowEliminated ? null : findNextMatch(updatedMatchesArr, matchId, noShowEntry.participantId)
		const noShowNextOpponent = noShowNextMatch ? await findNextOpponent(tournament.id, updatedMatchesArr, noShowNextMatch, noShowEntry.participantId) : null
		const noShowMatchWaitingOn = noShowNextOpponent ? null : findOtherPreReqMatch(updatedMatchesArr, noShowNextMatch, matchId) 
		const noShowWaitingOnP1 = noShowMatchWaitingOn && noShowMatchWaitingOn.p1 && noShowMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: noShowMatchWaitingOn.p1 }, include: Player }) : null
		const noShowWaitingOnP2 = noShowMatchWaitingOn && noShowMatchWaitingOn.p1 && noShowMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: noShowMatchWaitingOn.p2 }, include: Player }) : null

		setTimeout(() => {
			if (noShowEliminated) return message.channel.send({ content: `${noShowPlayer.name}, You are eliminated from the tournament. Better luck next time!`})
			else if (noShowNextOpponent) return message.channel.send({ content: `New Match: <@${noShowPlayer.id}> vs. <@${noShowNextOpponent.playerId}>. Good luck to both duelists.`})
			else if (noShowMatchWaitingOn && noShowWaitingOnP1 && noShowWaitingOnP2) {
				return message.channel.send({ content: `${noShowPlayer.name}, You are waiting for the result of ${noShowWaitingOnP1.name} vs ${noShowWaitingOnP2.name}.`})
			}
			else return message.channel.send({ content: `${noShowPlayer.name}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`})
		}, 2000)

		setTimeout(() => {
			if (!winnerNextMatch) return message.channel.send({ content: `<@${winningEntry.playerId}>, You won the tournament! Congratulations on your stellar performance! ${FiC}`})
			else if (winnerNextOpponent) return message.channel.send({ content: `New Match: <@${winningEntry.playerId}> vs. <@${winnerNextOpponent.playerId}>. Good luck to both duelists.`})
			else if (winnerMatchWaitingOn && winnerWaitingOnP1 && winnerWaitingOnP2) {
				return message.channel.send({ content: `${winningEntry.player.name}, You are waiting for the result of ${winnerWaitingOnP1.name} vs ${winnerWaitingOnP2.name}.`})
			}
			else return message.channel.send({ content: `${winningEntry.player.name}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`})
		}, 4000)
	} else if (game === 'Arena') {
		if (!noShowMember.roles.cache.some(role => role.id === arenaRole)) return message.channel.send({ content: `${noShowPlayer.name} does not appear to have the Arena Players role.`})
			
		const noShowContestant = await Arena.findOne({ where: { playerId: noShowId }})
		if (!noShowContestant) return message.channel.send({ content: `That player is not in the current Arena.`})

		const info = await Info.findOne({ where: { element: 'arena' } })
		if (!info) return message.channel.send({ content: `Error: could not find game: "arena".`})

		const pairings = info.round === 1 ? [["P1", "P2"], ["P3", "P4"]] :
			info.round === 2 ? [["P1", "P3"], ["P2", "P4"]] :
			info.round === 3 ? [["P1", "P4"], ["P2", "P3"]] : 
			null
	
		let PX = false

		let correct_pairing = info.round === 4 ? true : false

		if (!correct_pairing) {
			for (let i = 0; i < 2; i++) {
				if (pairings[i][0] === noShowContestant.contestant) PX = pairings[i][1]
				if (PX) break
				if (pairings[i][1] === noShowContestant.contestant) PX = pairings[i][0]
				if (PX) break
			}
		}

		if (!PX) return message.channel.send({ content: `Could not find Arena opponent. Please try **!manual**.`})
			
		const winningContestant = await Arena.findOne({ where: { contestant: PX }})
		if (!winningContestant) return message.channel.send({ content: `Could not find Arena opponent. Please try **!manual**.`})
			
		const winningPlayer = await Player.findOne({ where: { id: winningContestant.playerId }, include: Wallet })
		if (!winningPlayer) return message.channel.send({ content: `Could not find Arena opponent in the database.`})
	
		noShowContestant.is_playing = false
		await noShowContestant.save()

		winningPlayer.wallet.starchips += 5
		await winningPlayer.wallet.save()

		winningContestant.score++
		winningContestant.is_playing = false
		await winningContestant.save()

		message.channel.send({ content: `A no-show by ${noShowPlayer.name} (+0${starchips}) to ${winningPlayer.name} (+5${starchips}) has been recorded.`})
		return checkArenaProgress(info)
	} else if (game === 'Draft') {
		if (!noShowMember.roles.cache.some(role => role.id === draftRole)) return message.channel.send({ content: `${noShowPlayer.name} does not appear to have the Draft Players role.`})
			
		const noShowContestant = await Draft.findOne({ where: { playerId: noShowId }})
		if (!noShowContestant) return message.channel.send({ content: `That player is not in the current Draft.`})

		const info = await Info.findOne({ where: { element: 'draft' } })
		if (!info) return message.channel.send({ content: `Error: could not find game: "draft".`})

		const pairings = info.round === 1 ? [["P1", "P2"], ["P3", "P4"]] :
			info.round === 2 ? [["P1", "P3"], ["P2", "P4"]] :
			info.round === 3 ? [["P1", "P4"], ["P2", "P3"]] : 
			null
	
		let PX = false

		let correct_pairing = info.round === 4 ? true : false

		if (!correct_pairing) {
			for (let i = 0; i < 2; i++) {
				if (pairings[i][0] === noShowContestant.contestant) PX = pairings[i][1]
				if (PX) break
				if (pairings[i][1] === noShowContestant.contestant) PX = pairings[i][0]
				if (PX) break
			}
		}

		if (!PX) return message.channel.send({ content: `Could not find Draft opponent. Please try **!manual**.`})
			
		const winningContestant = await Draft.findOne({ where: { contestant: PX }})
		if (!winningContestant) return message.channel.send({ content: `Could not find Draft opponent. Please try **!manual**.`})
			
		const winningPlayer = await Player.findOne({ where: { id: winningContestant.playerId }, include: Wallet })
		if (!winningPlayer) return message.channel.send({ content: `Could not find Draft opponent in the database.`})
	
		noShowContestant.is_playing = false
		await noShowContestant.save()

		winningPlayer.wallet.starchips += 15
		await winningPlayer.wallet.save()

		winningContestant.score++
		winningContestant.is_playing = false
		await winningContestant.save()

		message.channel.send({ content: `A no-show by ${noShowPlayer.name} (+0${starchips}) to ${winningPlayer.name} (+15${starchips}) has been recorded.`})
		return checkDraftProgress(info)
	}
	
}

//H2H
if (h2hcom.includes(cmd)) {
	const game_mode = message.channel === client.channels.cache.get(arenaChannelId) ? 'arena' :
		message.channel === client.channels.cache.get(pauperChannelId) ? 'pauper' :
		'ranked'

	const emoji = message.channel === client.channels.cache.get(arenaChannelId) ? 'shrine' :
		message.channel === client.channels.cache.get(pauperChannelId) ? 'com' :
		'FiC'
	
	const usersMap = message.mentions.users
	const userIds = [...usersMap.keys()]
	const player1Id = message.mentions.users.first() ? message.mentions.users.first().id : null	
	const player2Id = userIds.length > 1 ? userIds[1] : maid	

	if (!player1Id) return message.channel.send({ content: "Please specify at least 1 other player."})
	if (player1Id === player2Id) return message.channel.send({ content: `Please specify 2 different players.`})

	const player1 = await Player.findOne({ where: { id: player1Id } })
	const player2 = await Player.findOne({ where: { id: player2Id } })
	
	if (!player1 && player2Id === maid) return message.channel.send({ content: `That user is not in the database.`})
	if (!player1 && player2Id !== maid) return message.channel.send({ content: `The first user is not in the database.`})
	if (!player2 && player2Id === maid) return message.channel.send({ content: `You are not in the database.`})
	if (!player2 && player2Id !== maid) return message.channel.send({ content: `The second user is not in the database.`})

	const p1Wins = game_mode !== 'ranked' ? await Match.count({ where: { winnerId: player1Id, loserId: player2Id, game_mode: game_mode } }) :
		await Match.count({ where: { winnerId: player1Id, loserId: player2Id, [Op.or]: [{ game_mode: 'ranked' }, { game_mode: 'tournament' }] } })
		
	const p2Wins = game_mode !== 'ranked' ? await Match.count({ where: { winnerId: player2Id, loserId: player1Id, game_mode: game_mode } }) :
		await Match.count({ where: { winnerId: player2Id, loserId: player1Id, [Op.or]: [{ game_mode: 'ranked' }, { game_mode: 'tournament' }] } })
	
	return message.channel.send({ content: `${eval(emoji)} --- H2H ${capitalize(game_mode)} Results --- ${eval(emoji)}`+
	`\n${player1.name} has won ${p1Wins}x`+
	`\n${player2.name} has won ${p2Wins}x`})
}

//UNDO
if (undocom.includes(cmd)) {
	const game_mode = message.channel === client.channels.cache.get(arenaChannelId) ? 'arena' :
		message.channel === client.channels.cache.get(keeperChannelId) ? 'keeper' :
		message.channel === client.channels.cache.get(pauperChannelId) ? 'pauper' :
		message.channel === client.channels.cache.get(draftChannelId) ? 'draft' :
		'ranked'

	const allMatches = await Match.findAll({ where: { game_mode } })
	const lastMatch = allMatches.slice(-1)[0]
	const winnerId = lastMatch.winnerId
	const loserId = lastMatch.loserId
	const winningPlayer = await Player.findOne({ where: { id: winnerId }, include: Wallet })
	const losingPlayer = await Player.findOne({ where: { id: loserId }, include: Wallet })
	
	const prompt = (isMod(message.member) ? '' : ' Please get a Moderator to help you.')
	if (maid !== loserId && !isMod(message.member)) return message.channel.send({ content: `You did not participate in the last recorded match.${prompt}`})

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
		return message.channel.send({ content: `The last Arena match in which ${winningPlayer.name} (-${lastMatch.chipsWinner}${starchips}) defeated ${losingPlayer.name} (-${lastMatch.chipsLoser}${starchips}) has been erased.`})
	} if (game_mode === 'pauper') {
		winningPlayer.arena_wins--
		await winningPlayer.save()

		winningPlayer.wallet.starchips -= lastMatch.chipsWinner
		await winningPlayer.wallet.save()

		losingPlayer.pauper_losses--
		await losingPlayer.save()

		losingPlayer.wallet.starchips -= lastMatch.chipsLoser
		await losingPlayer.wallet.save()
	
		await lastMatch.destroy()
		return message.channel.send({ content: `The last Pauper match in which ${winningPlayer.name} (-${lastMatch.chipsWinner}${starchips}) defeated ${losingPlayer.name} (-${lastMatch.chipsLoser}${starchips}) has been erased.`})
	} else {
		if (!winningPlayer.backup && maid !== loserId) return message.channel.send({ content: `${winningPlayer.name} has no backup stats.${prompt}`})
		if (!winningPlayer.backup && maid === loserId) return message.channel.send({ content: `Your last opponent, ${winningPlayer.name}, has no backup stats.${prompt}`})
		if (!losingPlayer.backup && maid !== loserId) return message.channel.send({ content: `${losingPlayer.name} has no backup stats.${prompt}`})
		if (!losingPlayer.backup && maid === loserId) return message.channel.send({ content: `You have no backup stats.${prompt}`})
	
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
		return message.channel.send({ content: `The last match in which ${winningPlayer.name} (-${lastMatch.chipsWinner}${starchips}) defeated ${losingPlayer.name} (-${lastMatch.chipsLoser}${starchips}) has been erased.`})
	}
}

//RANK
if (rankcom.includes(cmd)) {
	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	: message.channel === client.channels.cache.get(triviaChannelId) ? "Trivia"
	: message.channel === client.channels.cache.get(draftChannelId) ? "Draft"
	: message.channel === client.channels.cache.get(pauperChannelId) ? "Pauper"
	: message.channel === client.channels.cache.get(marketPlaceChannelId) ? "Market"
	: "Ranked"
	
	const x = parseInt(args[0]) || 10
	if (x < 1) return message.channel.send({ content: "Please provide a number greater than 0."})
	if (x > 100 || isNaN(x)) return message.channel.send({ content: "Please provide a number less than or equal to 100."})
	const membersMap = await message.guild.members.fetch()
	const memberIds = [...membersMap.keys()]
	const result = []
	
	if (game === 'Ranked') {
		x === 1 ? result[0] = `${FiC} --- ${champion} The Best Forged Player ${champion} --- ${FiC}`
		: result[0] = `${FiC} --- Top ${x} Forged Players --- ${FiC}`
		
		const allPlayers = await Player.findAll({ 
			where: {
				[Op.or]: [ { wins: { [Op.gt]: 0 } }, { losses: { [Op.gt]: 0 } } ]
			},
			order: [['stats', 'DESC']]
		})
	
		const filtered_players = allPlayers.filter((player) => memberIds.includes(player.id))
		if (x > filtered_players.length) return message.channel.send({ content: `I need a smaller number. We only have ${filtered_players.length} Forged players.`})
		const topPlayers = filtered_players.slice(0, x)
		for (let i = 0; i < x; i++) result[i+1] = `${(i+1)}. ${getMedal(topPlayers[i].stats)} ${topPlayers[i].name}`
	} else if (game === 'Market') {
		x === 1 ? result[0] = `${king} --- ${champion} The Wealthiest Player ${champion} --- ${king}`
		: result[0] = `${king} --- Top ${x} Richest Players --- ${king}`
		
		const allWallets = await Wallet.findAll({ where: { playerId: { [Op.not]: merchbotId } }, include: Player })
		const filtered_wallets = allWallets.filter((wallet) => memberIds.includes(wallet.playerId))
		if (x > filtered_wallets.length) return message.channel.send({ content: `I need a smaller number. We only have ${filtered_wallets.length} Forged players.`})
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
		x === 1 ? result[0] = `${shrine} --- ${champion} The Champion of the Arena ${champion} --- ${shrine}`
		: result[0] = `${shrine} --- Top ${x} Arena Players --- ${shrine}`
		
		const players = await Player.findAll({ 
			where: {
				[Op.or]: [ 
					{ arena_wins: { [Op.gt]: 0 } }, 
					{ arena_losses: { [Op.gt]: 0 } }
				]
			},
			include: Profile,
			order: [['name', 'ASC']]
		})
	
		const filtered_players = players.filter((player) => memberIds.includes(player.id))
		if (x > filtered_players.length) return message.channel.send({ content: `I need a smaller number. We only have ${filtered_players.length} Arena players.`})
		
		const sorted_players = filtered_players.sort((a, b) => {
			const difference = getArenaVictories(b.profile) - getArenaVictories(a.profile)
			if (difference) return difference
			else return b.arena_stats - a.arena_stats
		})
		
		const top_players = sorted_players.slice(0, x)
		for (let i = 0; i < x; i++) {
			const player = top_players[i]
			const profile = player.profile
			const wins = getArenaVictories(profile)
			result[i+1] = `${(i+1)}. ${player.name}${wins ? ' - ' : ''}${profile.beast_wins ? `${beast} ` : ''}${profile.dinosaur_wins ? `${dinosaur} ` : ''}${profile.fish_wins ? `${fish} ` : ''}${profile.plant_wins ? `${plant} ` : ''}${profile.reptile_wins ? `${reptile} ` : ''}${profile.rock_wins ? `${rock} ` : ''}${profile.dragon_wins ? `${dragon} ` : ''}${profile.spellcaster_wins ? `${spellcaster} ` : ''}${profile.warrior_wins ? `${warrior} ` : ''}${profile.fiend_wins ? `${fiend} ` : ''}${profile.thunder_wins ? `${thunder} ` : ''}${profile.zombie_wins ? `${zombie} ` : ''}`
		}
	} else if (game === 'Pauper') {
		x === 1 ? result[0] = `${com} --- ${champion} The People's Champion ${champion} --- ${com}`
		: result[0] = `${com} --- Top ${x} Pauper Players --- ${com}`
		
		const players = await Player.findAll({
			where: {
				[Op.or]: [ 
					{ pauper_wins: { [Op.gt]: 0 } }, 
					{ pauper_losses: { [Op.gt]: 0 } }
				]
			}
		})
	
		const filtered_players = players.filter((player) => memberIds.includes(player.id))
		if (x > filtered_players.length) return message.channel.send({ content: `I need a smaller number. We only have ${filtered_players.length} Pauper players.`})
		filtered_players.sort((a, b) => b.pauper_stats - a.pauper_stats) 

		const topProfiles = filtered_players.slice(0, x)
		for (let i = 0; i < x; i++) {
			const p = topProfiles[i]
			const medal = getMedal(p.pauper_stats, title = false)
			result[i+1] = `${(i+1)}. ${medal} ${p.name}`
		} 
	} else if (game === 'Trivia') {
		x === 1 ? result[0] = `${FiC} --- ${champion} The Top Bookworm ${champion} --- ${FiC}`
		: result[0] = `${FiC} --- Top ${x} Trivia Players --- ${FiC}`
		
		const transformed_knowledges = []
		const allKnowledges = await Knowledge.findAll()
		const playerIds = []
		for (let i = 0; i < allKnowledges.length; i++) {
			const knowledge = allKnowledges[i]
			const playerId = knowledge.playerId
			if (!playerIds.includes(playerId)) playerIds.push(playerId)
		}

		for (let i = 0; i < playerIds.length; i++) {
			const playerId = playerIds[i]
			const correct_answers = await Knowledge.count({ where: { playerId: playerId }})
			if (correct_answers > 0) {
				const player = await Player.findOne({ where: { id: playerId }})
				if(!player) continue
				transformed_knowledges.push([player.name, playerId, correct_answers])
			} 
		}

		const filtered_knowledges = transformed_knowledges.filter((p) => memberIds.includes(p[1]))
		if (x > filtered_knowledges.length) return message.channel.send({ content: `I need a smaller number. We only have ${filtered_knowledges.length} Trivia players.`})
		filtered_knowledges.sort((a, b) => b[2] - a[2])
		const topBookworms = filtered_knowledges.slice(0, x)

		for (let i = 0; i < x; i++) {
			result[i+1] = `${i+1}. ${topBookworms[i][2]} ${cultured} - ${topBookworms[i][0]}`
		} 
	} else if (game === 'Draft') {
		x === 1 ? result[0] = `${draft} --- ${champion} The Draft Expert ${champion} --- ${draft}`
		: result[0] = `${draft} --- Top ${x} Draft Players --- ${draft}`
		
		const players = await Player.findAll({
			where: {
				[Op.or]: [ 
					{ draft_wins: { [Op.gt]: 0 } }, 
					{ draft_losses: { [Op.gt]: 0 } }
				]
			}
		})
	
		const filtered_players = players.filter((player) => memberIds.includes(player.id))
		if (x > filtered_players.length) return message.channel.send({ content: `I need a smaller number. We only have ${filtered_players.length} Draft players.`})
		filtered_players.sort((a, b) => b.draft_stats - a.draft_stats) 

		const topProfiles = filtered_players.slice(0, x)
		for (let i = 0; i < x; i++) {
			const p = topProfiles[i]
			const medal = getMedal(p.draft_stats, title = false)
			result[i+1] = `${(i+1)}. ${medal} ${p.name}`
		} 
	} 

	message.channel.send({ content: result.slice(0, 11).join('\n').toString() })
	if (result.length > 11) message.channel.send({ content: result.slice(11, 41).join('\n').toString()})
	if (result.length > 41) message.channel.send({ content: result.slice(41, 71).join('\n').toString()})
	if (result.length > 71) message.channel.send({ content: result.slice(71).join('\n').toString()})
	return
}
    
//QUEUE
if(queuecom.includes(cmd)) {
	if (message.channel === client.channels.cache.get(arenaChannelId)) {
		const queue = await Arena.findAll({ include: Player })
		if (!queue.length) return message.channel.send({ content: `The Arena queue is empty.`})
		const results = []
		queue.forEach((row) => {
			results.push(row.player.name)
		})
		return message.channel.send({ content: results.join('\n').toString() })
	} else if (message.channel === client.channels.cache.get(draftChannelId)) {
		const queue = await Draft.findAll({ where: { active: false }, include: Player })
		if (!queue.length) return message.channel.send({ content: `The Draft queue is empty.`})
		const results = []
		queue.forEach((row) => {
			results.push(row.player.name)
		})
		return message.channel.send({ content: results.join('\n').toString() })
	} else if (message.channel === client.channels.cache.get(triviaChannelId)) {
		const queue = await Trivia.findAll({ include: Player })
		if (!queue.length) return message.channel.send({ content: `The Trivia queue is empty.`})
		const results = []
		queue.forEach((row) => {
			results.push(row.player.name)
		})
		return message.channel.send({ content: results.join('\n').toString() })
	} else {
		return message.channel.send({ content: `Try using **${cmd}** in channels like: <#${arenaChannelId}> or <#${triviaChannelId}>.`})
	}
}


//JOIN
if(joincom.includes(cmd)) {
	const mention = message.mentions.members.first()
    if (isMod(message.member) && mention) return message.channel.send({ content: `Please type **!signup @user** to register someone else for the tournament.`})
        
	const member = message.member
	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	: message.channel === client.channels.cache.get(triviaChannelId) ? "Trivia"
	: message.channel === client.channels.cache.get(draftChannelId) ? "Draft"
	: message.channel === client.channels.cache.get(tournamentChannelId) ? "Tournament"
	: null

	if (!game) return message.channel.send({ content: `Try using **${cmd}** in channels like: <#${arenaChannelId}> or <#${triviaChannelId}>.`})
	
	const player = await Player.findOne({ where: { id: maid }})
	if (!player) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})

	if (game === 'Tournament') {
        const tournaments = await Tournament.findAll({ where: { state: 'pending' }, order: [['createdAt', 'ASC']] })
        const count = await Tournament.count({ where: { state: 'underway' } })
        const tournament = await selectTournament(message, tournaments, maid)
        if (!tournament && count) return message.channel.send({ content: `Sorry, the tournament already started.`})
        if (!tournament && !count) return message.channel.send({ content: `There is no active tournament.`})
         
        const info = await Info.findOne({ where: { element: 'firefox' }})
        if (!info || info.status !== 'free') {
            return message.channel.send(`Another user is submitting their deck. Please wait a bit and try **!join** again.`)
        } else {
        info.status = 'occupied'
            await info.save()
            message.channel.send({ content: `Please check your DMs.` });
        }
        
		const entry = await Entry.findOne({ where: { playerId: maid, tournamentId: tournament.id } })		
        const dbName = player.duelingBook ? player.duelingBook : await askForDBName(message.member, player)
        if (!dbName) return clearStatus('firefox')
        const deckListUrl = await getDeckList(message.member, player, tournament.name, resubmission = false)
        if (!deckListUrl) return clearStatus('firefox')
        const deckName = await getDeckName(message.member, player)
        const deckType = await getDeckType(player, tournament.name)
        if (!deckType) return
        const deckCategory = getDeckCategory(deckType)
        if (!deckCategory) return
											
        if (!entry) {                                  
            const { participant } = await postParticipant(tournament, player)
            if (!participant) return message.channel.send({ content: `Error: Could not access tournament: ${tournament.name}`})
            
			await Entry.create({
				pilot: player.name,
				url: deckListUrl,
				name: deckName || deckType,
				type: deckType,
				category: deckCategory,
				participantId: participant.id,
				playerId: player.id,
				tournamentId: tournament.id
			})

			member.roles.add(tourRole)
			message.author.send({ content: `Thanks! I have all the information we need from you. Good luck in the tournament!`})
			return client.channels.cache.get(tournamentChannelId).send({ content: `<@${player.id}> is now registered for ${tournament.name}!`})
		} else {
            await entry.update({
                url: deckListUrl,
                name: deckName || deckType,
                type: deckType,
                category: deckCategory
            })
    
            message.author.send({ content: `Thanks! I have your updated deck list for the tournament.`})
            return client.channels.cache.get(tournamentChannelId).send({ content: `<@${player.id}> resubmitted their deck list for ${tournament.name}!`})
        }
	}

	const alreadyIn = await eval(game).count({ where: { playerId: maid} })
	const info = await Info.findOne({ where: { element: game.toLowerCase() } })
	if (!info) return message.channel.send({ content: `Could not find game-mode: "${game}".`})
	if (info.status !== 'pending' && game !== 'Trivia') return message.channel.send({ content: `Sorry, the ${game} already started.`})

	if (!alreadyIn) {
		const count = await eval(game).count()
		if (game === 'Arena' && count >= 4 || game === 'Draft' && count >= 4) {
			return message.channel.send({ content: `Sorry, ${player.name}, the ${game} is full.`})
		} 

		const entry = await eval(game).create({ playerId: maid })
		message.channel.send({ content: `You joined the ${game} queue.`})
		
		if (game === 'Arena' && count === 3) {
			info.status = 'confirming'
			await info.save()
			return startArena()
		} else if (game === 'Draft' && count === 3) {
			info.status = 'confirming'
			await info.save()
			return startDraft(fuzzyPrints)
		} else if (game === 'Trivia') {
			const tCount = await Trivia.count()
			if (tCount === 4) {
				info.status = 'confirming'
				await info.save()
				return startTrivia()
			} else if (tCount >= 5) {
				entry.active = true
				await entry.save()
				message.member.roles.add(triviaRole)
			}
		}
	} else {
		return message.channel.send({ content: `You were already in the ${game} queue.`})
	}
}

//RESET
if (cmd === `!reset`) {
	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	: message.channel === client.channels.cache.get(draftChannelId) ? "Draft"
	: message.channel === client.channels.cache.get(triviaChannelId) ? "Trivia"
	: null

	if (!game) {
		const date = new Date()
		const player = await Player.findOne({ where: { id: maid }})
		const time_diff = player.last_reset ? date.getTime() - player.last_reset.getTime() : date.getTime() - player.createdAt.getTime()
		const days = Math.floor(time_diff / (24 * 60 * 60 * 1000))
		if (player.last_reset && days < 30) {
			return message.channel.send({ content: `Sorry, you cannot reset your account for another ${days === 29 ? 'day' : `${30 - days} days` }.`})
		} else {
			const info = await Info.findOne({ where: { element: 'shop'} })
			if (info.status === 'closed') return message.channel.send({ content: `Sorry, you cannot reset your account while The Shop is closed.`})
			const confirmation1 = await getResetConfirmation(message, attempt = 1)
			if (!confirmation1) return
			const confirmation2 = await getResetConfirmation(message, attempt = 2)
			if (!confirmation2) return
			const confirmation3 = await getResetConfirmation(message, attempt = 3)
			if (!confirmation3) return
			message.channel.send({ content: `Resetting account. Please wait...`})
			return resetPlayer(message, player) 
		}
	} else {
		if (!isAmbassador(message.member) ) return message.channel.send({ content: 'You do not have permission to do that.'})

		const info = await Info.findOne({ where: { element: game.toLowerCase() }})
		if (!info) return message.channel.send({ content: `Could not find game-mode: "${game}".`})
	
		const entries = await eval(game).findAll()
		if (!entries) return message.channel.send({ content: `Could not find any entries for: "${game}".`})
	
		if (game === 'Arena') {
			resetArena(info, entries)
		} else if (game === 'Draft') {
			resetDraft(info, entries)
		} else if (game === 'Trivia') {
			resetTrivia(info, entries)
		}
	
		return message.channel.send({ content: `${game === 'Trivia' ? 'Trivia' : `The ${game}`} has been reset.`})
	}
}

//RESUME
if (cmd === `!resume`) {
	if (!isAmbassador(message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	: message.channel === client.channels.cache.get(triviaChannelId) ? "Trivia"
	: message.channel === client.channels.cache.get(draftChannelId) ? "Draft"
	: null

	if (!game) return message.channel.send({ content: `Try using **${cmd}** in channels like: <#${arenaChannelId}> or <#${triviaChannelId}>.`})
	const role = game === 'Trivia' ? triviaRole : game === 'Arena' ? arenaRole : null

	const info = await Info.findOne({ where: { element: game.toLowerCase() }})
	if (!info) return message.channel.send({ content: `Could not find game-mode: "${game}".`})

	const entries = await eval(game).findAll({ include: Player })
	if (!entries) return message.channel.send({ content: `Could not find any entries for: "${game}".`})

	if (game === 'Arena') {
		startRound(info, entries)
		return message.channel.send({ content: `<@&${role}>, The Arena can now resume.`})
	} if (game === 'Draft') {
		if (info.status === 'drafting') {
			setTimeout(async() => draftCards(fuzzyPrints), 30000)
			return message.channel.send({ content: `<@&${role}>, The Draft will resume in 30 seconds.`})
		} else if (info.status === 'playing') {
			startDraftRound(info, entries)
			return message.channel.send({ content: `<@&${role}>, The Draft can now resume.`})
		}
	} else if (game === 'Trivia') {
		const triviaArr = Object.entries(trivia)
		const questionsArr = getRandomSubset(triviaArr, 10)
		setTimeout(() => askQuestion(info, questionsArr), 30000)
		return message.channel.send({ content: `<@&${role}>, Trivia will resume in 30 seconds.`})
	}
}

//END
if (cmd === `!end`) {
	if (!isAmbassador(message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	: message.channel === client.channels.cache.get(tournamentChannelId) ? "Tournament"
	: message.channel === client.channels.cache.get(triviaChannelId) ? "Trivia"
	: message.channel === client.channels.cache.get(draftChannelId) ? "Draft"
	: "Tournament"

	if (!game) return message.channel.send({ content: `Try using **${cmd}** in channels like: <#${arenaChannelId}>, <#${tournamentChannelId}> or <#${triviaChannelId}>.`})
	const role = game === 'Trivia' ? triviaRole : game === 'Arena' ? arenaRole : game === 'Tournament' ? tourRole : null
	
	if (game === 'Tournament') {
		if (!args.length) return message.channel.send({ content: `Please specify the name of the tournament you wish to end.`})
		const name = args[0]
		const tournament = await Tournament.findOne({ where: { name: { [Op.iLike]: name } } })
		if (!tournament) return message.channel.send({ content: `Could not find tournament: "${name}".`})

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
			return message.channel.send({ content: `Congrats! The results of ${tournament.name} ${FiC} have been finalized.`})
		} else {
			return message.channel.send({ content: `Unable to finalize ${tournament.name} ${FiC} on Challonge.com.`})
		}

	}

	const info = await Info.findOne({ where: { element: game.toLowerCase() }})
	if (!info) return message.channel.send({ content: `Could not find game-mode: "${game}".`})

	const entries = await eval(game).findAll()
	if (!entries) return message.channel.send({ content: `Could not find any entries for: "${game}".`})

	if (game === 'Arena') {
		endArena(info, entries)
	} if (game === 'Draft') {
		endDraft(info, entries)
	} else if (game === 'Trivia') {
		endTrivia(info, entries)
	}

	return message.channel.send({ content: `${role ? `<@&${role}>, ` : ''} ${game === 'Trivia' ? 'Trivia has come to an end.' : `The ${game} has come to an end.`}`})
}

//DROP
if(dropcom.includes(cmd)) {
	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	: message.channel === client.channels.cache.get(triviaChannelId) ? "Trivia"
	: message.channel === client.channels.cache.get(draftChannelId) ? "Draft"
	: message.channel === client.channels.cache.get(tournamentChannelId) ? "Tournament"
	: null

	const role = game === 'Arena' ? arenaRole : game === 'Trivia' ? triviaRole : game === 'Draft' ? draftRole : game === 'Tournament' ? tourRole : null

	if (!game) return message.channel.send({ content: 
		`Try using **${cmd}** in channels like: <#${arenaChannelId}>, <#${tournamentChannelId}>, <#${triviaChannelId}> or <#${draftChannelId}>.`
	})
	
	if (game === 'Tournament') {
		const entry = await Entry.findOne({ where: { playerId: maid }, include: [Player, Tournament]})
		if (!entry) return message.channel.send({ content: `You are not in any tournaments.`})
		const tournament = entry.tournament
		return removeParticipant(message, message.member, entry, tournament, drop = true)
	}

	const entry = await eval(game).findOne({ where: { playerId: maid} })
	const info = await Info.findOne({ where: { element: game.toLowerCase() } })

	if (info.status === 'pending' && entry) {
		await entry.destroy()
		return message.channel.send({ content: `You are no longer in the ${game} queue.`})
	} else if (info.status === 'active' && entry) {
		entry.active = false
		await entry.save()
		message.member.roles.remove(role)
		return message.channel.send({ content: `<@${maid}> dropped out of ${game === 'Trivia' ? '' : 'the '}${game}.`})
	} else if (info.status === 'confirming' && entry) {
		return message.channel.send({ content: `You cannot drop during the confirmation process.`})
	} else {
		return message.channel.send({ content: `You were not in the ${game} queue.`})
	}
}


//REMOVE
if (cmd.toLowerCase() === `!remove`) {
	if (!isAmbassador(message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
	const member = message.mentions.members.first()
	const playerId = member && member.user ? member.user.id : null
	const game = message.channel === client.channels.cache.get(arenaChannelId) ? "Arena"
	: message.channel === client.channels.cache.get(triviaChannelId) ? "Trivia"
	: message.channel === client.channels.cache.get(draftChannelId) ? "Draft"
	: message.channel === client.channels.cache.get(tournamentChannelId) ? "Tournament"
	: null

	if (!game) return message.channel.send({ content: `Try using **${cmd}** in channels like: <#${tournamentChannelId}>, <#${arenaChannelId}> or <#${triviaChannelId}>.`})
	if (!playerId) return message.channel.send({ content: `Please specify the player you wish to remove from ${game !== 'Trivia' ? 'the' : ''} ${game}.`})

	if (game === 'Tournament') {
		const entry = await Entry.findOne({ where: { playerId }, include: [Player, Tournament]})
		if (!entry) return message.channel.send({ content: `That user is not in a tournament.`})
		const tournament = entry.tournament

		return removeParticipant(message, member, entry, tournament, drop = false)
	}

	const entry = await eval(game).findOne({ where: { playerId } })
	if (entry) {
		await entry.destroy()
		return message.channel.send({ content: `${member.user.username} has been removed from the ${game} queue.`})
	} else {
		return message.channel.send({ content: `${member.user.username} was not in the ${game} queue.`})
	}
}

//CREATE 
if (cmd === `!create`) {
	if (!isAdmin(message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
	if (!args.length) return message.channel.send({ content: `Please provide a name for the new tournament.`})
	const tournament_type = await getTournamentType(message)
	if (!tournament_type) return message.channel.send({ content: `Please select a valid tournament type.`})
	const str = generateRandomString(10, '0123456789abcdefghijklmnopqrstuvwxyz')
	const name = args[0].replace(/[^\ws]/gi, "_").replace(/ /g,'')
	
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
		
		if (status && data && status === 200) {
			await Tournament.create({ 
				id: data.tournament.id,
				name: data.tournament.name,
				state: data.tournament.state,
				swiss_rounds: data.tournament.swiss_rounds, 
				tournament_type: data.tournament.tournament_type,
				url: data.tournament.url,
			})

			fs.mkdir(`./decks/${name}`, (err) => {
				if (err) {
					return console.error(err)
				}
				console.log(`made new directory: ./decks/${name}`)
			})

			return message.channel.send({ content: 
				`You created a new tournament:` + 
				`\nName: ${data.tournament.name} ${FiC}` + 
				`\nType: ${capitalize(data.tournament.tournament_type)}` +
				`\nBracket: https://challonge.com/${data.tournament.url}`
			})
		} 
	} catch (err) {
		console.log(err)
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
			
			if (status && data && status === 200) {
				await Tournament.create({ 
					id: data.tournament.id,
					name: data.tournament.name,
					state: data.tournament.state,
					swiss_rounds: data.tournament.swiss_rounds, 
					tournament_type: data.tournament.tournament_type,
					url: data.tournament.url,
				})
				
				fs.mkdir(`./decks/${name}`, (err) => {
					if (err) {
						return console.error(err)
					}
					console.log(`made new directory: ./decks/${name}`)
				})
				
				return message.channel.send({ content: 
					`You created a new tournament:` + 
					`\nName: ${data.tournament.name} ${FiC}` + 
					`\nType: ${capitalize(data.tournament.tournament_type)}` +
					`\nBracket: https://challonge.com/${data.tournament.url}`
				})
			} 
		} catch (err) {
			console.log(err)
			return message.channel.send({ content: `Unable to create tournament on Challonge.com.`})
		}
	}
}

//BRACKET
if (bracketcom.includes(cmd)) {
	const tournaments = await Tournament.findAll({ order: [['createdAt', 'ASC']]})
	const results = []

	for (let i = 0; i < tournaments.length; i++) {
		const tournament = tournaments[i]
		results.push(`Name: ${tournament.name} ${FiC}` +
			`\nType: ${capitalize(tournament.tournament_type)}` +
			`\nBracket: <https://challonge.com/${tournament.url}>`
		)
	}

	return message.channel.send({ content: results.join('\n\n').toString() })
}

// QUIT
if (cmd === '!quit') {
	if (!isMod(message.member)) return message.channel.send({ content: "You do not have permission to do that.", })
	const element = marr.slice(1, marr.length).join(" ")
	if (!element) return message.channel.send({ content: `Please specify the application you wish to quit.` })
	
	if (element === 'firefox') {
		try {
			await killFirefox()
		} catch (err) {
			console.log(err)
			return message.channel.send({ content: `Failed to quit ${capitalize(element)}. ${emoji}`})
		}
	}

	const emoji = element === 'firefox' ? '🦊' : ''
	const cleared = await clearStatus(element)
	if (cleared) {
		return message.channel.send({content: `You force quit ${capitalize(element)}. ${emoji}`})
	} else {
		return message.channel.send({ content: `Failed to quit ${capitalize(element)}. ${emoji}`})
	}
}

//DESTROY
if (cmd === `!destroy`) {
	if (!isAdmin(message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
	if (!args.length) return message.channel.send({ content: `Please specify the name of the tournament you wish to destroy.`})

	const name = args[0]
	const tournament = await Tournament.findOne({ where: { name: { [Op.iLike]: name } } })
	if (!tournament) return message.channel.send({ content: `Could not find tournament: "${name}".`})
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
			return message.channel.send({ content: `Yikes! You deleted ${tournament.name} ${FiC} from your Challonge account.`})
		} else {
			return message.channel.send({ content: `Unable to delete tournament from Challonge account.`})
		}
	} catch (err) {
		return message.channel.send({ content: `Error: Unable to delete tournament from Challonge account.`})
	}
}


//GRIND
if(cmd === `!grind`) {
	const x = parseInt(args[0])
	if (!x || isNaN(x)) return message.channel.send({ content: `Please provide the number of ${starchips} that you wish to grind to ${stardust}.`})
	if (x < 1) return message.channel.send({ content: `You cannot grind less than 1${starchips}.`})
	if (x % 1 !== 0) return message.channel.send({ content: `You cannot grind part of a ${starchips}.`})

	const wallet = await Wallet.findOne({ where: { playerId: maid } })
	if (!wallet) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})
	if (x > wallet.starchips) return message.channel.send({ content: `You only have ${wallet.starchips}${starchips}.`})

	const filter = m => m.author.id === message.author.id
	message.channel.send({ content: `Are you sure you want to grind ${x}${starchips} into ${x * 10}${stardust}?`})
	await message.channel.awaitMessages({ filter,
		max: 1,
		time: 15000
	}).then(async (collected) => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send({ content: `No problem. Have a nice day.`})

		wallet.starchips -= x
		wallet.stardust += x * 10
		await wallet.save()

		completeTask(message.channel, maid, 'e9')
		return message.channel.send({ content: `You ground ${x}${starchips} into ${x * 10}${stardust}.`})
	}).catch((err) => {
		console.log(err)
		return message.channel.send({ content: `Sorry, time's up.`})
	})
}

//DAILY
if(dailycom.includes(cmd)) {
	const daily = await Daily.findOne({ where: { playerId: maid }, include: Player })
	const diary = await Diary.findOne({ where: { playerId: maid } })
	if (!daily || !diary) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})

	const date = new Date()
	const hoursLeftInDay = date.getMinutes() === 0 ? 24 - date.getHours() : 23 - date.getHours()
	const minsLeftInHour = date.getMinutes() === 0 ? 0 : 60 - date.getMinutes()

	if (daily.last_check_in && isSameDay(daily.last_check_in, date)) return message.channel.send({ content: `You already used **!daily** today. Try again in ${hoursLeftInDay} ${hoursLeftInDay === 1 ? 'hour' : 'hours'} and ${minsLeftInHour} ${minsLeftInHour === 1 ? 'minute' : 'minutes'}.`})

	const daysPassed = daily.last_check_in ? Math.round( ( date.setHours(0, 0, 0, 0) - daily.last_check_in.setHours(0, 0, 0, 0) ) / (1000*60*60*24) ) : 1

	const sets = await Set.findAll({ 
		where: { 
			type: 'core',
			for_sale: true
		},
		order: [['createdAt', 'DESC']]
	})

	const set = sets[0]
	if (!set) return message.channel.send({ content: `No core set found.`})

	const commons = [...await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "com"
		},
		order: [['card_slot', 'ASC']]
	})].map((p) => p.card_code)

	const rares = [...await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "rar"
		},
		order: [['card_slot', 'ASC']]
	})].map((p) => p.card_code)

	const supers = [...await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "sup"
		},
		order: [['card_slot', 'ASC']]
	})].filter((p) => !p.card_code.includes('-SE')).map((p) => p.card_code)

	const ultras = [...await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "ult"
		},
		order: [['card_slot', 'ASC']]
	})].map((p) => p.card_code)

	const secrets = [...await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "scr"
		},
		order: [['card_slot', 'ASC']]
	})].map((p) => p.card_code)
	
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

	if (!print.id) return message.channel.send({ content: `Error: ${yourCard} does not exist in the Print database.`})

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
			message.channel.send({ content: `Oh look, ${daily.player.name}, you cobbled together a pack!`, files:[`./public/packs/7outof7.png`]})
			const gotSecret = await awardPack(message.channel, daily.playerId, set, num)
			if (gotSecret) completeTask(message.channel, daily.playerId, 'm4')
		}, 4000)
	} else {
		daily.cobble_progress += daysPassed
		if (easy_complete) {
			setTimeout(() => {
				message.channel.send({ content: `Hey, ${daily.player.name}, keep cobblin', buddy.`, files:[`./public/packs/${daily.cobble_progress}outof7.png`]})
			}, 4000)
		}
	}

	daily.last_check_in = date
	await daily.save()

	const canvas = Canvas.createCanvas(105, 158)
	const context = canvas.getContext('2d')
	const background = fs.existsSync(`./public/card_images/${card.image_file}`) ? 
						await Canvas.loadImage(`./public/card_images/${card.image_file}`) :
						await Canvas.loadImage(`https://ygoprodeck.com/pics/${card.image_file}`)
	if (background && canvas && context) context.drawImage(background, 0, 0, canvas.width, canvas.height)
	const attachment = background && canvas && context ? new Discord.MessageAttachment(canvas.toBuffer(), `${card.name}.png`) : false

	message.channel.send({ content: `1... 2...`})
	return setTimeout(() => message.channel.send({ content: `${enthusiasm} ${daily.player.name} pulled ${eval(print.rarity)}${print.card_code} - ${print.card_name} from the grab bag! ${emoji}`, files: [attachment] }), 2000)
}


//WAGER
if(cmd === `!wager`) {
	const player = await Player.findOne({ where: { id: maid }, include: [Daily, Wallet] })
	if (!player) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})

	const date = new Date()
	const hoursLeftInDay = date.getMinutes() === 0 ? 24 - date.getHours() : 23 - date.getHours()
	const minsLeftInHour = date.getMinutes() === 0 ? 0 : 60 - date.getMinutes()

	if (player.daily.last_wager && isSameDay(player.daily.last_wager, date)) return message.channel.send({ content: `You already used **!wager** today. Try again in ${hoursLeftInDay} ${hoursLeftInDay === 1 ? 'hour' : 'hours'} and ${minsLeftInHour} ${minsLeftInHour === 1 ? 'minute' : 'minutes'}.`})

	const x = parseInt(args[0])
	if (!x || isNaN(x)) return message.channel.send({ content: `Please specify the amount of ${stardust} you wish to wager.`})
	if (x < 1) return message.channel.send({ content: `You cannot wager less than 1${stardust}.`})
	if (x > 1000) return message.channel.send({ content: `You cannot wager more than 1000${stardust}.`})
	if (x % 1 !== 0) return message.channel.send({ content: `You cannot wager partial ${stardust}.`})
	if (x > player.wallet.stardust) return message.channel.send({ content: `You only have ${player.wallet.stardust}${stardust}.`})

	const sets = await Set.findAll({ 
		where: { 
			type: 'core',
			for_sale: true
		},
		order: [['createdAt', 'DESC']]
	})

	const set = sets[0]
	if (!set) return message.channel.send({ content: `No core set found.`})

	const filter = m => m.author.id === message.author.id
	await message.channel.send({ content: `Are you sure you want to wager ${x}${stardust} on a random ${set.code} ${eval(set.emoji)} card?`})
	await message.channel.awaitMessages({ filter,
		max: 1,
		time: 15000
	}).then(async (collected) => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send({ content: `No problem. Have a nice day.`})

		player.wallet.stardust -= x
		await player.wallet.save()

		let best = 1
		const matrix = new Array(3600)
		matrix.fill(1, 0, 3463)
		matrix.fill(2, 3463, 3559)
		matrix.fill(3, 3559, 3591)
		matrix.fill(4, 3591, 3599)
		matrix.fill(5, 3599, 3600)

		for (let i = 0; i < x; i++) {
			const sample = getRandomElement(matrix)
			if (sample > best) best = sample
		}

		const rarity = best === 5 ? "scr" :
		best === 4 ? "ult" :
		best === 3 ? "sup" :
		best === 2 ? "rar" :
		"com"

		const prints = await Print.findAll({ 
			where: {
				setId: set.id,
				rarity: rarity
			},
			order: [['card_slot', 'ASC']]
		})

		const print = getRandomElement(prints)	
		const card = await Card.findOne({ where: { name: print.card_name }})
	
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

		player.daily.last_wager = date
		await player.daily.save()

		if (await checkCoreSetComplete(maid, 1)) completeTask(message.channel, maid, 'h4', 4000)
		if (await checkCoreSetComplete(maid, 3)) completeTask(message.channel, maid, 'l3', 5000)

		const canvas = Canvas.createCanvas(105, 158)
		const context = canvas.getContext('2d')
		const background = fs.existsSync(`./public/card_images/${card.image_file}`) ? 
							await Canvas.loadImage(`./public/card_images/${card.image_file}`) :
							await Canvas.loadImage(`https://ygoprodeck.com/pics/${card.image_file}`)
		if (background && canvas && context) context.drawImage(background, 0, 0, canvas.width, canvas.height)
		const attachment = background && canvas && context ? new Discord.MessageAttachment(canvas.toBuffer(), `${card.name}.png`) : false
		const enthusiasm = rarity === "com" ? `Ho-Hum.` : rarity === "rar" ? `Not bad.` : rarity === 'sup' ? `Cool beans!` : rarity === 'ult' ? `Now *that's* based!` : `Holy $#%t balls!`
		const emoji = rarity === "com" ? cavebob : rarity === "rar" ? stoned : rarity === 'sup' ? blue : rarity === 'ult' ? wokeaf : koolaid
	
		message.channel.send({ content: `1... 2...`})
		return setTimeout(() => message.channel.send({ content: `${enthusiasm} ${player.name} won ${eval(print.rarity)}${print.card_code} - ${print.card_name} off their wager! ${emoji}`, files: [attachment] }), 2000)
	}).catch((err) => {
		console.log(err)
		return message.channel.send({ content: `Sorry, time's up.`})
	})
}


//ALCHEMY
if(alchemycom.includes(cmd)) {
	const player = await Player.findOne({ where: { id: maid }, include: [Daily, Diary, Wallet]})
	const wallet = player.wallet
	const daily = player.daily
	const diary = player.diary

	const easy_complete = diary.e1 && diary.e2 && diary.e3 && diary.e4 && diary.e5 && diary.e6 && diary.e7 && diary.e8 && diary.e9 && diary.e10 && diary.e11 && diary.e12
	const medium_complete = diary.m1 && diary.m2 && diary.m3 && diary.m4 && diary.m5 && diary.m6 && diary.m7 && diary.m8 && diary.m9 && diary.m10
	const hard_complete = diary.h1 && diary.h2 && diary.h3 && diary.h4 && diary.h5 && diary.h6 && diary.h7 && diary.h8
	const elite_complete = diary.l1 && diary.l2 && diary.l3 && diary.l4 && diary.l5 && diary.l6
	//const master_complete = diary.s1 && diary.s2 && diary.s3 && diary.s4

	if (!player) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})
	
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
	) return message.channel.send({ content: `You exhausted your alchemic powers for the day. Try again in ${hoursLeftInDay} ${hoursLeftInDay === 1 ? 'hour' : 'hours'} and ${minsLeftInHour} ${minsLeftInHour === 1 ? 'minute' : 'minutes'}.`})

	const query = args.join(" ")
	
	if (!args[0]) return message.channel.send({ content: `Please specify the card you wish to transmute into ${starchips}.`})
	
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const card_name = await findCard(query, fuzzyPrints)
	const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))

	const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name, private = false, inInv = true) : null
	if (!print) return message.channel.send({ content: `Sorry, I do not recognize the card: "${query}".`})
	if (print.set_code === 'FPC') return message.channel.send({ content: `You cannot use alchemy on FPCs.`})
	const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`
	const value = print.rarity === 'com' ? 1 : print.rarity === 'rar' ? 2 : print.rarity === 'sup' ? 4 : print.rarity === 'ult' ? 8 : 16 

	const inv = await Inventory.findOne({ 
		where: { 
			printId: print.id,
			playerId: maid,
			quantity: { [Op.gt]: 0 }
		}
	})

	if (!inv) return message.channel.send({ content: `You do not have any copies of ${card}.`})

	const filter = m => m.author.id === message.author.id
	message.channel.send({ content: `Are you sure you want to transmute ${card} into ${value}${starchips}?`})
	await message.channel.awaitMessages({ filter,
		max: 1,
		time: 15000
	}).then(async (collected) => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send({ content: `No problem. Have a nice day.`})
		
		inv.quantity--
		await inv.save()

		await updateBinder(player)

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
		return message.channel.send({ content: `You transmuted ${card} into ${value}${starchips}!`})
	}).catch((err) => {
		console.log(err)
		return message.channel.send({ content: `Sorry, time's up.`})
	})
}



//REDUCE
if(reducecom.includes(cmd)) {
	const player = await Player.findOne({ where: { id: maid }, include: [Daily, Wallet]})
	const wallet = player.wallet
	const daily = player.daily

	if (!player) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})
	
	const date = new Date()
	const hoursLeftInDay = date.getMinutes() === 0 ? 24 - date.getHours() : 23 - date.getHours()
	const minsLeftInHour = date.getMinutes() === 0 ? 0 : 60 - date.getMinutes()

	if (daily.last_reduce && isSameDay(daily.last_reduce, date)) return message.channel.send({ content: `You exhausted your reductive powers for the day. Try again in ${hoursLeftInDay} ${hoursLeftInDay === 1 ? 'hour' : 'hours'} and ${minsLeftInHour} ${minsLeftInHour === 1 ? 'minute' : 'minutes'}.`})

	const query = args.join(" ")
	
	if (!args[0]) return message.channel.send({ content: `Please specify the card you wish to break down into ${forgestone}.`})
	
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const card_name = await findCard(query, fuzzyPrints)
	const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))

	const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name, private = false, inInv = true) : null
	if (!print) return message.channel.send({ content: `Sorry, I do not recognize the card: "${query}".`})
	if (print.set_code === 'FPC') return message.channel.send({ content: `You cannot use reduce on FPCs.`})
	const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`
	const value = print.rarity === 'com' ? 1 : print.rarity === 'rar' ? 2 : print.rarity === 'sup' ? 4 : print.rarity === 'ult' ? 8 : 16 

	const inv = await Inventory.findOne({ 
		where: { 
			printId: print.id,
			playerId: maid,
			quantity: { [Op.gt]: 0 }
		}
	})

	if (!inv) return message.channel.send({ content: `You do not have any copies of ${card}.`})

	const filter = m => m.author.id === message.author.id
	message.channel.send({ content: `Are you sure you want to reduce ${card} into ${value}${forgestone}?`})
	await message.channel.awaitMessages({ filter,
		max: 1,
		time: 15000
	}).then(async (collected) => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send({ content: `No problem. Have a nice day.`})
		
		inv.quantity--
		await inv.save()

		await updateBinder(player)

		wallet.forgestone += value
		await wallet.save()
	
		daily.last_reduce = date
		await daily.save()

		return message.channel.send({ content: `You broke down ${card} into ${value}${forgestone}!`})
	}).catch((err) => {
		console.log(err)
		return message.channel.send({ content: `Sorry, time's up.`})
	})
}




//WRITE
if(cmd === `!write`) {
	if (!isMod(message.member)) return message.channel.send({ content: "You do not have permission to do that."})
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : null	
	if (playerId === maid) return message.channel.send({ content: `You cannot cross off your own Diary achievements.`})
	if (!playerId) return message.channel.send({ content: `Please @ mention a user to write in their Diary.`})

	const achievement = args[1] ? args[1].toLowerCase() : null
	const valid_tasks = [
		"e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12",
		"m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10",
		"h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8",
		"l1", "l2", "l3", "l4", "l5", "l6",
	]

	if (!achievement) return message.channel.send({ content: `Please specify an achievement (E4, M7, H1, L2, etc.)`})
	if (!valid_tasks.includes(achievement)) return message.channel.send({ content: `Sorry, ${achievement.toUpperCase()} is not a valid task.`})

	const diary = await Diary.findOne({ where: { playerId: playerId } })
	if (!diary) return message.channel.send({ content: `That user is not in the database.`})

	if (diary[achievement] === true) return message.channel.send({ content: `That user already completed task ${achievement.toUpperCase()}.`})
	else if (diary[achievement] === false) return completeTask(message.channel, playerId, achievement)
}


//BURN
if(cmd === `!burn`) {
	if (!isMod(message.member)) return message.channel.send({ content: "You do not have permission to do that."})
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : null	
	if (playerId === maid) return message.channel.send({ content: `You cannot undo achievements from your own Diary.`})
	if (!playerId) return message.channel.send({ content: `Please @ mention a user to burn a hole in their Diary.`})

	const achievement = args[1] ? args[1].toLowerCase() : null
	const valid_tasks = [
		"e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12",
		"m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10",
		"h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8",
		"l1", "l2", "l3", "l4", "l5", "l6",
	]

	if (!achievement) return message.channel.send({ content: `Please specify an achievement (E4, M7, H1, L2, etc.)`})
	if (!valid_tasks.includes(achievement)) return message.channel.send({ content: `Sorry, ${achievement.toUpperCase()} is not a valid task.`})
	const difficulty = achievement.startsWith('e') ? 'Easy' : achievement.startsWith('m') ? 'Medium' : achievement.startsWith('h') ? 'Hard' : 'Elite'

	const diary = await Diary.findOne({ where: { playerId: playerId }, include: Player })
	if (!diary) return message.channel.send({ content: `That user is not in the database.`})

	if (diary[achievement] === false) return message.channel.send({ content: `That user has not completed task:\n**${diaries[difficulty][achievement]}**.`})
	else if (diary[achievement] === true) {
		diary[achievement] = false
		await diary.save()
		return message.channel.send({ content: `You undid an achievement in ${diary.player.name}'s Diary:\n**${diaries[difficulty][achievement]}**`})
	}
}


//AWARD
if(cmd === `!award`) {
	if (!isMod(message.member)) return message.channel.send({ content: "You do not have permission to do that."})
	const recipient = message.mentions.users.first() ? message.mentions.users.first().id : null	
	if (!recipient) return message.channel.send({ content: `Please @ mention a user to award.`})
	if (recipient === maid) return message.channel.send({ content: `You cannot give an award to yourself.`})

	const player = await Player.findOne({ 
		where: { id: recipient },
		include: Wallet
	})

	if (!player) return message.channel.send({ content: `That user is not in the database.`})

	const quantity = parseInt(args[1]) ? parseInt(args[1]) : 1
	if (quantity < 1) return message.channel.send({ content: `Sorry, ${quantity} is not a valid quantity.`})
	const query = parseInt(args[1]) ? args.slice(2).join(" ").toLowerCase() : args.slice(1).join(" ").toLowerCase()
	if (!quantity || !query) return message.channel.send({ content: `Please specify the query you wish to award.`})

	let set_code = query.includes('chaospack') || query.includes('chaos pack') || query === 'ch2' ? 'CH2' :
		query === 'ch1' ? 'CH1' :
		query === 'pack' || query === 'packs' || query === 'drt' ? 'DRT' :
		query === 'teb' ? 'TEB' :
		query === 'orf' ? 'ORF' :
		query === 'doc' ? 'DOC' :
		null

	if (set_code) {
		const set = await Set.findOne({ where: { code: set_code } })
		if (!set) return message.channel.send({ content: `Could not find set: "${set_code}".`})
		const filter = m => m.author.id === message.author.id
		message.channel.send({ content: `Are you sure you want to award ${quantity} ${set_code} ${eval(set.emoji)} ${quantity > 1 ? 'Packs' : 'Pack'} to ${player.name}?`})
		await message.channel.awaitMessages({ filter,
			max: 1,
			time: 15000
		}).then((collected) => {
			if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send({ content: `No problem. Have a nice day.`})
			message.channel.send({ content: `Please wait while I open your ${quantity > 1 ? 'packs' : 'pack'}... ${blue}`})			
			return awardPack(message.channel, recipient, set, quantity)
		}).catch((err) => {
			console.log(err)
			return message.channel.send({ content: `Sorry, time's up.`})
		})
	}

	let walletField
	if (query === 'c' || query === 'sc' || query === 'starchip' || query === 'starchips' || query === 'chip' || query === 'chips') walletEmoji = starchips, walletField = 'starchips'
	if (query === 'd' || query === 'sd' || query === 'stardust' || query === 'dust') walletField = 'stardust'
	if (query === 'f' || query === 'fs' || query === 'forgestone' || query === 'forgestones' || query === 'stone' || query === 'stones') walletField = 'forgestone'
	if (query === 'cactus' || query === 'cactuses' || query === 'cacti' || query === 'cactis' ) walletField = 'cactus'
	if (query === 'egg' || query === 'eggs') walletField = 'egg'
	if (query === 'hook' || query === 'hooks') walletField = 'hook'
	if (query === 'moai' || query === 'moais' ) walletField = 'moai'
	if (query === 'mushroom' || query === 'mushrooms' || query === 'shroom' || query === 'shrooms') walletField = 'mushroom'
	if (query === 'rose' || query === 'roses' ) walletField = 'rose'
	if (query === 'sword' || query === 'swords' ) walletField = 'swords'
	if (query === 'orb' || query === 'orbs' ) walletField = 'orb'
	if (query === 'gem' || query === 'gems' ) walletField = 'gem'
	if (query === 'skull' || query === 'skulls' ) walletField = 'skull'
	if (query === 'familiar' || query === 'familiars' ) walletField = 'familiar'
	if (query === 'battery' || query === 'batteries' ) walletField = 'battery'

	set_code = query.slice(0, 3).toUpperCase()
	const valid_set_code = !!(!walletField && set_code.length === 3 && await Set.count({where: { code: set_code }}))
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const valid_card_code = !walletField && !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	const card_name = query && !walletField && !valid_set_code && !valid_card_code ? await findCard(query, fuzzyPrints) : null
	const print = !walletField && valid_card_code ? await Print.findOne({ where: { card_code } }) : !walletField && card_name ? await selectPrint(message, maid, card_name) : null

	if (!print && !walletField) return message.channel.send({ content: `Sorry, I do not recognize the item: "${query}".`})
	const award = walletField ? `${eval(walletField)}` : ` ${eval(print.rarity)}${print.card_code} - ${print.card_name}` 

	const filter = m => m.author.id === message.author.id
	message.channel.send({ content: `Are you sure you want to award ${quantity}${award} to ${player.name}?`})
	await message.channel.awaitMessages({ filter,
		max: 1,
		time: 15000
	}).then(async (collected) => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send({ content: `No problem. Have a nice day.`})
		
		if (walletField) {
			player.wallet[walletField] += quantity
			await player.wallet.save()
		} else {
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
	
		return message.channel.send({ content: `${player.name} was awarded ${quantity}${award}. Congratulations!`})
	}).catch((err) => {
		console.log(err)
		return message.channel.send({ content: `Sorry, time's up.`})
	})
}

//STEAL
if(cmd === `!steal`) {
	if (!isMod(message.member)) return message.channel.send({ content: "You do not have permission to do that."})
	const target = message.mentions.users.first() ? message.mentions.users.first().id : null	
	if (target === maid) return message.channel.send({ content: `You cannot steal something from yourself.`})
	if (!target || isNaN(target) || target.length < 17) return message.channel.send({ content: `Please @ mention a user to steal from.`})

	const player = await Player.findOne({ 
		where: { id: target },
		include: Wallet
	})

	if (!player) return message.channel.send({ content: `That user is not in the database.`})

	const quantity = parseInt(args[1]) ? parseInt(args[1]) : 1
	if (quantity < 1) return message.channel.send({ content: `Sorry, ${quantity} is not a valid quantity.`})
	const query = parseInt(args[1]) ? args.slice(2).join(" ") : args.slice(1).join(" ")	
	if (!quantity || !query) return message.channel.send({ content: `Please specify the item you wish to steal.`})

	let walletField
	if (query === 'sc' || query === 'starchip' || query === 'starchips' || query === 'chip' || query === 'chips') walletField = 'starchips'
	if (query === 'sd' ||query === 'stardust' || query === 'dust') walletField = 'stardust'
	if (query === 'f' || query === 'fs' || query === 'forgestone' || query === 'forgestones' || query === 'stone' || query === 'stones') walletField = 'forgestone'
	if (query === 'cactus' || query === 'cactuses' || query === 'cacti' || query === 'cactis' ) walletField = 'cactus'
	if (query === 'egg' || query === 'eggs') walletField = 'egg'
	if (query === 'hook' || query === 'hooks') walletField = 'hook'
	if (query === 'moai' || query === 'moais' ) walletField = 'moai'
	if (query === 'mushroom' || query === 'mushrooms' || query === 'shroom' || query === 'shrooms') walletField = 'mushroom'
	if (query === 'rose' || query === 'roses' ) walletField = 'rose'
	if (query === 'sword' || query === 'swords' ) walletField = 'swords'
	if (query === 'orb' || query === 'orbs' ) walletField = 'orb'
	if (query === 'gem' || query === 'gems' ) walletField = 'gem'
	if (query === 'skull' || query === 'skulls' ) walletField = 'skull'
	if (query === 'familiar' || query === 'familiars' ) walletField = 'familiar'
	if (query === 'battery' || query === 'batteries' ) walletField = 'battery'

	const set_code = query.toUpperCase()
	const valid_set_code = !!(!walletField && set_code.length === 3 && await Set.count({where: { code: set_code }}))
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const valid_card_code = !!(!walletField && card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	const card_name = query && !walletField && !valid_set_code && !valid_card_code ? await findCard(query, fuzzyPrints) : null
	const print = !walletField && valid_card_code ? await Print.findOne({ where: { card_code } }) : !walletField && card_name ? await selectPrint(message, maid, card_name) : null
	if (card_name && !print) return

	if (!print && !walletField) return message.channel.send({ content: `Sorry, I do not recognize the item: "${query}".`})
	const loot = walletField ? `${eval(walletField)}` : ` ${eval(print.rarity)}${print.card_code} - ${print.card_name}` 

	const filter = m => m.author.id === message.author.id
	message.channel.send({ content: `Are you sure you want to steal ${quantity}${loot} from ${player.name}?`})
	await message.channel.awaitMessages({ filter,
		max: 1,
		time: 15000
	}).then(async (collected) => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send({ content: `No problem. Have a nice day.`})
		
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
				return message.channel.send({ content: `Sorry, ${player.name} does not have an inventory slot for${loot}.`})
			} else if (inv.quantity < quantity) {
				return message.channel.send({ content: `Sorry, ${player.name} only has ${inv.quantity}${loot}.`})
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
				return message.channel.send({ content: `Sorry, ${player.name} does not have any${loot}.`})
			} else if (inv.quantity < quantity) {
				return message.channel.send({ content: `Sorry, ${player.name} only has ${inv.quantity}${loot}.`})
			} else {
				inv.quantity -= quantity
				await inv.save()
			}
		}
	
		return message.channel.send({ content: `Yikes! You stole ${quantity}${loot} from ${player.name}.`})
	}).catch((err) => {
		console.log(err)
		return message.channel.send({ content: `Sorry, time's up.`})
	})
}

//RECALC
    // Use this command to recalculate every player's Elo from scratch.
    // This is needed when matches are directly added or deleted using postgreSQL.
    // It's also required after using the !combine command, but the bot will remind you to do it.
if (cmd === `!recalc`) {
	if (!isAdmin(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})
	const players = await Player.findAll()
    const matches = await Match.findAll({
            where: {
                game_mode: {
					[Op.or]: ['ranked', 'tournament']
				},
            }, order: [['createdAt', 'ASC']]
        })

	message.channel.send({ content: `Recalculating data for ${matches.length} matches. Please wait...`})
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
		const match = matches[i]
		await recalculate(match, i+1)	
		if (i + 1 === matches.length) return message.channel.send({ content: `Recalculation complete!`})
	} 
}

//CENSUS
if (cmd === `!census`) {
	if (!isAdmin(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})
	message.channel.send({ content: `One moment please.`})
	const membersMap = await message.guild.members.fetch()
	const memberIds = [...membersMap.keys()]
	let update_count = 0
	let create_count = 0
	for (let i = 0; i < memberIds.length; i++) {
		const id = memberIds[i]
		const member = membersMap.get(id)
		const name = member.user.username
		const tag = member.user.tag
		const player = await Player.findOne({ where: { id: id } })
		if (player && (player.name !== name || player.tag !== tag)) {
			update_count++
			player.name = name
			player.tag = tag
			await player.save()
		} else if (!player && !member.user.bot) {
			create_count++
			await createPlayer(id, name, tag)
		}

		if (i + 1 === memberIds.length) return message.channel.send({ content: `Census complete! You added ${create_count} ${create_count === 1 ? 'player' : 'players'} to the database and updated ${update_count} ${update_count === 1 ? 'other' : 'others'}.`})
	}
}

//GRINDALL
if(cmd === `!grindall`) {
	if (!isAdmin(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})
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

	return message.channel.send({ content: `Every player's ${starchips}s have been ground into ${stardust}!`})


}

//INVENTORY
if(invcom.includes(cmd)) { 
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
	if (playerId !== maid && !isMod(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})

	const draft = !!(message.channel === client.channels.cache.get(draftChannelId))
	const player = await Player.findOne({ where: { id: playerId }})
	if (!player) return message.channel.send({ content: playerId === maid ? `You are not in the database. Type **!start** to begin the game.` : `That person is not in the database.`})

	const query = playerId === maid ? args.join(' ') : args.length > 1 ? args.slice(1).join(' ') : ''
	const set_code = query.toUpperCase()
	const valid_set_code = !!(set_code.length === 3 && await Set.count({where: { code: set_code }}))
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	const card_name = query && !valid_set_code && !valid_card_code ? await findCard(query, fuzzyPrints) : null
	const prints = valid_card_code ? await Print.findAll({ where: { card_code, draft } }) : card_name ? await Print.findAll({ where: { card_name, draft } }) : []
	
	const results = [`${player.name}'s Inventory:`]

	if (valid_set_code) {
		const set = await Set.findOne({ where: { code: set_code } })
		if (!set) return message.channel.send({ content: `Could not find set: ${set_code}.`})
		results.push(`${eval(set.emoji)} --- ${set.name} --- ${eval(set.alt_emoji)}`)

		const invs = await Inventory.findAll({
			where: {
				playerId,
				draft: draft,
				card_code: {
					[Op.startsWith]: set_code
				},
				quantity: {
					[Op.gte]: 1
				}
			},
			include: Print,
			order: [['card_code', 'ASC']]
		})

		for (let i = 0; i < invs.length; i++) {
			const inv = invs[i]
			const print = inv.print
			const count = print && (print.set_code === 'CH2') ? await Inventory.count({ where: { printId: print.id } }) : true
			results.push(`${eval(print.rarity)}${print.card_code} - ${count ? `${print.card_name} - ${inv.quantity}` : '??? - 0'}`)
		}
	} else if (prints.length) {
		for (let i = 0; i < prints.length; i++) {
			const print = prints[i]
			const count = print && (print.set_code === 'CH2') ? await Inventory.count({ where: { printId: print.id } }) : true
	
			const invs = valid_card_code ? await Inventory.findAll({ 
				where: { 
					playerId,
					draft: draft,
					card_code: card_code,
					quantity: {
						[Op.gte]: 1
					}
				},
				include: Print
			}) : await Inventory.findAll({ 
				where: { 
					playerId,
					draft: draft,
					printId: print.id,
					quantity: {
						[Op.gte]: 1
					}
				},
				include: Print
			})
			
			if (!invs.length) results.push(`${eval(print.rarity)}${print.card_code} - ${count ? print.card_name : '???'} - 0`)
		
			const codes = []
			for (let i = 0; i < invs.length; i++) {
				const row = invs[i]
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
		
				if (row.print.set_code !== 'HIDDEN') results.push(`${eval(row.print.rarity)}${row.card_code} - ${row.print.card_name} - ${row.quantity}`) 
			}
		}
	} else if (!query.length) {
		const invs = await Inventory.findAll({ 
			where: { 
				playerId,
				draft: draft,
				quantity: {
					[Op.gte]: 1
				}
			 },
			include: Print,
			order: [['card_code', 'ASC']]
		})

		const codes = []
		for (let i = 0; i < invs.length; i++) {
			const row = invs[i]
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
	
			if (row.print.set_code !== 'HIDDEN') results.push(`${eval(row.print.rarity)}${row.card_code} - ${row.print.card_name} - ${row.quantity}`) 
		}
	} else {
		return message.channel.send({ content: `Sorry, I do not recognize: "${query}".`})
	}

	for (let i = 0; i < results.length; i += 30) {
		if (results[i+31] && results[i+31].startsWith("\n")) {
			message.author.send({ content: results.slice(i, i+31).join('\n').toString()})
			i++
		} else {
			message.author.send({ content: results.slice(i, i+30).join('\n').toString()})
		}
	}

	if (playerId === maid) completeTask(message.channel, maid, 'e2')
	return message.channel.send({ content: `I messaged you the Inventory you requested.`})
}

//CHECKLIST
if(checklistcom.includes(cmd)) {
	const set_code = args.length ? args[0].toUpperCase() : null
	const valid_set_code = !!(set_code && set_code.length === 3 && await Set.count({where: { code: set_code }}))
	if (set_code && !valid_set_code) return message.channel.send({ content: `Sorry, I do not recognize the set code: "${set_code}".`})

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

	const trips = valid_set_code ? await Inventory.findAll({
		where: {
			playerId: maid,
			card_code: {
				[Op.startsWith]: set_code
			},
			quantity: {
				[Op.gte]: 3
			}
		},
		include: [Print],
		order: [['card_code', 'ASC']]
	}) : await Inventory.findAll({ 
		where: { 
			playerId: maid,
			quantity: {
				[Op.gte]: 3
			}
		},
		include: Print,
		order: [['card_code', 'ASC']]
	})

	const allPrints = valid_set_code ? await Print.findAll({ 
		where: {
			set_code: set_code,
			draft: false
		},
		order: [['card_code', 'ASC']]
	}) : await Print.findAll({ 
		where: { draft: false },
		order: [['card_code', 'ASC']]
	})

	if (!inventory) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})
	if (!allPrints) return message.channel.send({ content: `Sorry, something is wrong with the database.`})

	const results = []
	const codes = []
	const cards = inventory.map((card) => card.print.card_code)
	const playsets = trips.map((card) => card.print.card_code)

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

		const box_emoji = playsets.includes(row.card_code) ? tres : cards.includes(row.card_code) ? checkmark : emptybox
		const count = (code === 'CH2') ? await Inventory.count({ where: { printId: row.id } }) : true
		results.push(`${box_emoji} ${eval(row.rarity)}${row.card_code} - ${count ? row.card_name : '???'}`) 
	}

	for (let i = 0; i < results.length; i += 20) {
		if (results[i+21] && results[i+21].startsWith("\n")) {
			message.author.send({ content: results.slice(i, i+21).join('\n').toString()})
			i++
		} else {
			message.author.send({ content: results.slice(i, i+20).join('\n').toString()})
		}
	}

	return message.channel.send({ content: `I messaged you the Checklist you requested.`})
}

//PACK
if(packcom.includes(cmd)) {
	let num = 1
	let code = 'DRT'
	for (let i = 0; i < args.length; i++) {
		if (isFinite(args[i])) {
			num = parseInt(args[i])
			break
		} 
	}

	if (num < 1) return message.channel.send({ content: `You cannot buy less than 1 Pack.`})

	for (let i = 0; i < args.length; i++) {
		if (!isFinite(args[i])) {
			code = args[i].toUpperCase()
			break
		} 
	}

	const set = await Set.findOne({ where: { code: code }})
	if (!set) return message.channel.send({ content: `Could not find set code: ${code}.`})
	if (!set.for_sale) return message.channel.send({ content: `Sorry, ${code} ${eval(set.emoji)} Packs are not available.`})

	const commons = [...await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "com"
		},
		order: [['card_slot', 'ASC']]
	})].map((p) => p.card_code)

	const rares = [...await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "rar"
		},
		order: [['card_slot', 'ASC']]
	})].map((p) => p.card_code)

	const supers = [...await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "sup"
		},
		order: [['card_slot', 'ASC']]
	})].filter((p) => !p.card_code.includes('-SE')).map((p) => p.card_code)

	const ultras = [...await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "ult"
		},
		order: [['card_slot', 'ASC']]
	})].map((p) => p.card_code)

	const secrets = [...await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "scr"
		},
		order: [['card_slot', 'ASC']]
	})].map((p) => p.card_code)

	const player = await Player.findOne( { where: { id: maid }, include: [Daily, Diary, Wallet] })
	const wallet = player.wallet
	const daily = player.daily
	const diary = player.diary
	const merchbot_wallet = await Wallet.findOne( { where: { playerId: merchbotId } })
	if (!daily || !diary || !wallet || !merchbot_wallet) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})
	const hard_complete = diary.h1 && diary.h2 && diary.h3 && diary.h4 && diary.h5 && diary.h6 && diary.h7 && diary.h8
    const discount = hard_complete && set.currency === 'stardust' ? (1 / 1.1) : 1

	const money = wallet[set.currency]
	if (money < (Math.round(set.unit_price * discount) * num)) return message.channel.send({ content: `Sorry, ${player.name}, you only have ${money}${eval(set.currency)} and ${num > 1 ? `${num} ` : ''}${set.name} ${eval(set.emoji)} Packs cost ${Math.round(set.unit_price * discount) * num}${eval(set.currency)}.`})
	
	const filter = m => m.author.id === message.author.id
	message.channel.send({ content: `${player.name}, you have ${money}${eval(set.currency)}. Do you want to spend ${Math.round(set.unit_price * discount) * num}${eval(set.currency)} on ${num > 1 ? num : 'a'} ${set.name} ${eval(set.emoji)} Pack${num > 1 ? 's' : ''}?`})
	await message.channel.awaitMessages({ filter,
		max: 1,
		time: 15000
	}).then(async (collected) => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send({ content: `No problem. Have a nice day.`})
		
		message.channel.send({ content: `Thank you for your purchase! I'll send you the contents of your ${set.name} ${eval(set.emoji)} Pack${num > 1 ? 's' : ''}.`})
		let gotSecret = false
		const boxes = Math.floor(num / set.packs_per_box)
		const packs_from_boxes = boxes * set.packs_per_box

		for (let j = 0; j < num; j++) {
			const images = []
			const results = [`\n${eval(set.emoji)} - ${set.name} Pack${num > 1 ? ` ${j + 1}` : ''} - ${eval(set.alt_emoji)}`]
			const yourCommons = set.commons_per_pack > 1 ? getRandomSubset(commons, set.commons_per_pack) : set.commons_per_pack === 1 ? [getRandomElement(commons)] : []
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

			const luck = j < packs_from_boxes ? odds[j % set.packs_per_box] : getRandomElement(odds)
			const yourFoil = getRandomElement(eval(luck))
			const yourPack = [...yourCommons.sort(), ...yourRares.sort(), ...yourSupers.sort(), ...yourUltras.sort(), ...yourSecrets.sort(), yourFoil].filter((e) => !!e)

			for (let i = 0; i < yourPack.length; i++) {
				const print = await Print.findOne({ where: {
					card_code: yourPack[i]
				}})

				if (!print.id) return message.channel.send({ content: `Error: ${yourPack[i]} does not exist in the Print database.`})
				results.push(`${eval(print.rarity)}${print.card_code} - ${print.card_name}`)

				const card = await Card.findOne({ where: {
					name: print.card_name
				}})
		
				images.push(`${card.image_file}`)
			
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
			message.author.send({ content: results.join('\n').toString(), files: [attachment] })
		}

		wallet[set.currency] -= (Math.round(set.unit_price * discount) * num)
		await wallet.save()

		merchbot_wallet.stardust += set.currency === 'stardust' ? set.unit_price * discount * num : set.unit_price * num * 10
		await merchbot_wallet.save()

		set.unit_sales += num
		await set.save()

		completeTask(message.channel, maid, 'e6')
		if (set.type === 'core' && num >= 5) completeTask(message.channel, maid, 'm3', 3000)
		if (gotSecret) completeTask(message.channel, maid, 'm4', 5000)
		if (set.type === 'core' && await checkCoreSetComplete(maid, 1)) completeTask(message.channel, 'h4', 5000)
		if (set.type === 'core' && await checkCoreSetComplete(maid, 3)) completeTask(message.channel, 'l3', 6000)
		return
	}).catch((err) => {
		console.log(err)
		return message.channel.send({ content: `Sorry, time's up.` })
	})
}


//SPECIAL EDITION
if(specialcom.includes(cmd)) {
	let code = args[0] || 'TEB'
	const set = await Set.findOne({ where: { code: code }})
	if (!set) return message.channel.send({ content: `Could not find set code: ${code}.` })
	if (!set.specs_for_sale) return message.channel.send({ content: `Sorry, ${code} ${eval(set.emoji)} Special Editions are not available.` })

	const commons = [...await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "com"
		},
		order: [['card_slot', 'ASC']]
	})].map((p) => p.card_code)

	const rares = [...await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "rar"
		},
		order: [['card_slot', 'ASC']]
	})].map((p) => p.card_code)

	const supers = [...await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "sup"
		},
		order: [['card_slot', 'ASC']]
	})].filter((p) => !p.card_code.includes('-SE')).map((p) => p.card_code)

	const ultras = [...await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "ult"
		},
		order: [['card_slot', 'ASC']]
	})].map((p) => p.card_code)

	const secrets = await [...Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "scr"
		},
		order: [['card_slot', 'ASC']]
	})].map((p) => p.card_code)

	const specials = [...await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "sup",
			card_code: {
				[Op.substring]: ['SE']
			}
		},
		order: [['card_slot', 'ASC']]
	})].map((p) => p.card_code)

	const wallet = await Wallet.findOne( { where: { playerId: maid }, include: Player })
	if (!wallet) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})
	const money = wallet[set.currency]
	if (money < (set.spec_price)) return message.channel.send({ content: `Sorry, ${wallet.player.name}, you only have ${money}${eval(set.currency)} and ${set.name} ${eval(set.emoji)} Special Editions cost ${set.spec_price}${eval(set.currency)}.`})

	const filter = m => m.author.id === message.author.id
	message.channel.send({ content: `${wallet.player.name}, you have ${money}${eval(set.currency)}. Do you want to spend ${set.spec_price}${eval(set.currency)} on a ${set.name} ${eval(set.emoji)} Special Edition?`})
	await message.channel.awaitMessages({ filter,
		max: 1,
		time: 15000
	}).then(async (collected) => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send({ content: `No problem. Have a nice day.`})
		
		message.channel.send({ content: `Thank you for your purchase! I'll send you the contents of your ${set.name} ${eval(set.emoji)} Special Edition.`})
		let gotSecret = false

		const your_spec_1 = getRandomElement(specials.slice(0, 2))
		const your_spec_2 = getRandomElement(specials.slice(2, 4))

		const spec_print_1 = await Print.findOne({ where: {
			card_code: your_spec_1
		}}) 

		const spec_print_2 = await Print.findOne({ where: {
			card_code: your_spec_2
		}}) 

		const spec_inv_1 = await Inventory.findOne({ where: { 
			card_code: spec_print_1.card_code,
			printId: spec_print_1.id,
			playerId: maid
		}})

		if (spec_inv_1) {
			spec_inv_1.quantity++
			await spec_inv_1.save()
		} else {
			await Inventory.create({ 
				card_code: spec_print_1.card_code,
				quantity: 1,
				printId: spec_print_1.id,
				playerId: maid
			})
		}

		const spec_inv_2 = await Inventory.findOne({ where: { 
			card_code: spec_print_2.card_code,
			printId: spec_print_2.id,
			playerId: maid
		}})

		if (spec_inv_2) {
			spec_inv_2.quantity++
			await spec_inv_2.save()
		} else {
			await Inventory.create({ 
				card_code: spec_print_2.card_code,
				quantity: 1,
				printId: spec_print_2.id,
				playerId: maid
			})
		}

		const spec_card_1 = await Card.findOne({ where: {
			name: spec_print_1.card_name
		}}) 

		const spec_card_2 = await Card.findOne({ where: {
			name: spec_print_2.card_name
		}}) 

		const promos_canvas = Canvas.createCanvas(57 * 2, 80)
		const promos_context = promos_canvas.getContext('2d')

		const promo_1 = fs.existsSync(`./public/card_images/${spec_card_1.image_file}`) ? 
		await Canvas.loadImage(`./public/card_images/${spec_card_1.image_file}`) :
		await Canvas.loadImage(`https://ygoprodeck.com/pics/${spec_card_1.image_file}`)
		if (promos_canvas && promos_context && promo_1) promos_context.drawImage(promo_1, 0, 0, 57, 80)
		
		const promo_2 = fs.existsSync(`./public/card_images/${spec_card_2.image_file}`) ? 
		await Canvas.loadImage(`./public/card_images/${spec_card_2.image_file}`) :
		await Canvas.loadImage(`https://ygoprodeck.com/pics/${spec_card_2.image_file}`)
		if (promos_canvas && promos_context && promo_2) promos_context.drawImage(promo_2, 57, 0, 57, 80)

		const promos_attachment = promos_canvas && promos_context ?
			new Discord.MessageAttachment(promos_canvas.toBuffer(), `specials.png`) :
			false

		message.author.send({ content: 
			`${eval(set.emoji)} - ${set.name} Special Edition - ${eval(set.alt_emoji)}`
			+ `\n${eval(spec_print_1.rarity)}${spec_print_1.card_code} - ${spec_print_1.card_name}`
			+ `\n${eval(spec_print_2.rarity)}${spec_print_2.card_code} - ${spec_print_2.card_name}`
		, files: [promos_attachment] })

		const odds = []
		for (let i = 0; i < set.supers_per_box; i++) odds.push("supers")
		for (let i = 0; i < set.ultras_per_box; i++) odds.push("ultras")
		for (let i = 0; i < set.secrets_per_box; i++) odds.push("secrets")
		const lucks = getRandomSubset(odds, 3)

		for (let j = 0; j < 3; j++) {
			const images = []
			const results = [`\n${eval(set.emoji)} - ${set.name} Pack ${j + 1} - ${eval(set.alt_emoji)}`]
			const yourCommons = getRandomSubset(commons, set.commons_per_pack)
			const yourRare = getRandomElement(rares)
			const yourFoil = getRandomElement(eval(lucks[j]))
			const yourPack = [...yourCommons.sort(), yourRare, yourFoil]

			for (let i = 0; i < yourPack.length; i++) {
				const print = await Print.findOne({ where: {
					card_code: yourPack[i]
				}})

				if (!print.id) return message.channel.send({ content: `Error: ${yourPack[i]} does not exist in the Print database.`})
				results.push(`${eval(print.rarity)}${print.card_code} - ${print.card_name}`)

				const card = await Card.findOne({ where: {
					name: print.card_name
				}})
		
				images.push(`${card.image_file}`)
			
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
			message.author.send({ content: results.join('\n').toString(), files: [attachment]})
		}

		wallet[set.currency] -= set.spec_price
		await wallet.save()

		set.unit_sales += 3
		await set.save()

		completeTask(message.channel, maid, 'e6')
		if (gotSecret) completeTask(message.channel, maid, 'm4', 5000)
		if (await checkCoreSetComplete(maid, 1)) completeTask(message.channel, 'h4', 5000)
		if (await checkCoreSetComplete(maid, 3)) completeTask(message.channel, 'l3', 6000)
		return
	}).then((err) => {
		console.log(err)
		return message.channel.send({ content: `Sorry, time's up.`})
	})
}

//BOX
if(boxcom.includes(cmd)) {
	const code = args[0] || 'DRT'
	if (code.startsWith('SS')) return message.channel.send({ content: `Sorry, Starter Series cards are not sold by the box.`})
	const set = await Set.findOne({ where: { code: code.toUpperCase() }})
	if (!set) return message.channel.send({ content: `There is no coreset with the code "${code.toUpperCase()}".`})
	if (!set.box_price) return message.channel.send({ content: `Sorry, ${set.name} ${eval(set.emoji)} is not sold by the box.`})
	if (!set.for_sale) return message.channel.send({ content: `Sorry, ${set.name} ${eval(set.emoji)} are not available.`})
	if (!set.packs_per_box) return message.channel.send({ content: `Sorry, ${set.name} ${eval(set.emoji)} is experiencing a glitch in the database. Please get an Admin to help you.`})

	const player = await Player.findOne( { where: { id: maid }, include: [Daily, Diary, Wallet] })
	const diary = player.diary
    const hard_complete = diary.h1 && diary.h2 && diary.h3 && diary.h4 && diary.h5 && diary.h6 && diary.h7 && diary.h8
    const discount = hard_complete && set.currency === 'stardust' ? (1 / 1.1) : 1

	const merchbot_wallet = await Wallet.findOne( { where: { playerId: merchbotId } })
	if (!player || !merchbot_wallet) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})
	const money = player.wallet[set.currency]
	if (money < Math.round(set.box_price * discount)) return message.channel.send({ content: `Sorry, ${player.name}, you only have ${money}${eval(set.currency)} and ${set.name} ${eval(set.emoji)} Boxes cost ${Math.round(set.box_price * discount)}${eval(set.currency)}.`})
	

	const date = new Date()
	const hoursLeftInDay = date.getMinutes() === 0 ? 24 - date.getHours() : 23 - date.getHours()
	const minsLeftInHour = date.getMinutes() === 0 ? 0 : 60 - date.getMinutes()
	if (player.daily.last_box && isSameDay(player.daily.last_box, date)) return message.channel.send({ content: `You already purchased a Box today. Try again in ${hoursLeftInDay} ${hoursLeftInDay === 1 ? 'hour' : 'hours'} and ${minsLeftInHour} ${minsLeftInHour === 1 ? 'minute' : 'minutes'}.`})

	const commons = [...await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "com"
		},
		order: [['card_slot', 'ASC']]
	})].map((p) => p.card_code)

	const rares = [...await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "rar"
		},
		order: [['card_slot', 'ASC']]
	})].map((p) => p.card_code)

	const supers = [...await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "sup"
		},
		order: [['card_slot', 'ASC']]
	})].filter((p) => !p.card_code.includes('-SE')).map((p) => p.card_code)

	const ultras = [...await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "ult"
		},
		order: [['card_slot', 'ASC']]
	})].map((p) => p.card_code)

	const secrets = [...await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "scr"
		},
		order: [['card_slot', 'ASC']]
	})].map((p) => p.card_code)

	const filter = m => m.author.id === message.author.id
	message.channel.send({ content: `${player.name}, you have ${money}${eval(set.currency)}. Do you want to spend ${Math.round(set.box_price * discount)}${eval(set.currency)} on a ${set.name} ${eval(set.emoji)} Box?`})
	await message.channel.awaitMessages({ filter,
		max: 1,
		time: 15000
	}).then(async (collected) => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send({ content: `No problem. Have a nice day.`})
		
		message.channel.send({ content: `Thank you for your purchase! I'll send you the contents of your ${set.name} ${eval(set.emoji)} Box.`})
		const num = set.packs_per_box
		for (let j = 0; j < num; j++) {
			const images = []
			const results = [`\n${eval(set.emoji)} - ${set.name} Pack${num > 1 ? ` ${j + 1}` : ''} - ${eval(set.alt_emoji)}`]
			const yourCommons = set.commons_per_pack > 1 ? getRandomSubset(commons, set.commons_per_pack) : set.commons_per_pack === 1 ? [getRandomElement(commons)] : []
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
	
				if (!print.id) return console.log(`${yourPack[i]} does not exist in the Print database.`)
				results.push(`${eval(print.rarity)}${print.card_code} - ${print.card_name}`)
	
				const card = await Card.findOne({ where: {
					name: print.card_name
				}})
		
				images.push(`${card.image_file}`)
				
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
		
			message.author.send({ content: results.join('\n').toString(), files: [attachment] })
		}

		player.wallet[set.currency] -= (Math.round(set.box_price * discount))
		await player.wallet.save()

		merchbot_wallet.stardust += set.currency === 'stardust' ? (set.box_price * discount) : set.box_price * 10
		await merchbot_wallet.save()

		set.unit_sales += 24
		await set.save()

		player.daily.last_box = date
		await player.daily.save()
		
		completeTask(message.channel, maid, 'e6')
		completeTask(message.channel, maid, 'm3', 3000)
		completeTask(message.channel, maid, 'm4', 4000)
		completeTask(message.channel, maid, 'h3', 5000)
		if (await checkCoreSetComplete(maid, 1)) completeTask(message.channel, 'h4', 5000)
		if (await checkCoreSetComplete(maid, 3)) completeTask(message.channel, 'l3', 6000)
		return
	}).catch((err) => {
		console.log(err)
		return message.channel.send({ content: `Sorry, time's up.`})
	})
}

//DUMP
if(cmd === `!dump`) {
	if (mcid !== botSpamChannelId) return message.channel.send({ content: `Please use this command in <#${botSpamChannelId}>.`})
	const info = await Info.findOne({ where: { element: 'shop'} })
	if (info.status === 'closed') return message.channel.send({ content: `Sorry, you cannot dump cards while The Shop is closed.`})
	const inputRarity = getRarity(args[0])
	const set_code = args.length ? args[0].toUpperCase() : 'DRT'	
	const set = await Set.findOne({where: { code: set_code }})
	if (!set && !inputRarity) return message.channel.send({ content: `Sorry, I do not recognized the set code: "${set_code}".`})

	const player = await Player.findOne({ where: { id: maid }, include: Wallet })
	if (!player) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})
	const merchbot_wallet = await Wallet.findOne({ where: { playerId: merchbotId } })
	if (!merchbot_wallet) return message.channel.send({ content: `That user is not in the database.`})
	
	const rarity = inputRarity || await getDumpRarity(message)
	if (rarity === 'unrecognized') return message.channel.send({ content: `Please specify a valid rarity.`})
	if (!rarity) return

	const quantityToKeep = await getDumpQuantity(message, rarity, set_code)
	if (!quantityToKeep && quantityToKeep !== 0) return message.channel.send({ content: `Please specify a valid quanity.`})

	const wish_to_exclude = await askForExclusions(message)
	const exclusions = wish_to_exclude ? await getExclusions(message, rarity, set) : null
	const excluded_prints = exclusions ? await getExcludedPrintIds(message, rarity, set, exclusions, fuzzyPrints) : null
	if (excluded_prints === false) return
	
	const unfilteredInv = inputRarity ? await Inventory.findAll({
		where: {
			playerId: maid,
			quantity: { [Op.gt]: quantityToKeep },
			draft: false
		}, include: Print,
		order: [[Print, 'market_price', 'DESC']]
	}) : await Inventory.findAll({
		where: {
			card_code: { [Op.startsWith]: set_code },
			playerId: maid,
			quantity: { [Op.gt]: quantityToKeep }
		}, include: Print,
		order: [["card_code", "ASC"]]
	})

	const inv = rarity === 'all'  && !excluded_prints ? unfilteredInv :
				rarity === 'all' && excluded_prints.length ? unfilteredInv.filter((el) => !excluded_prints.includes(el.printId) ) :
				rarity !== 'all' && !excluded_prints ? unfilteredInv.filter((el) => el.print.rarity === rarity) :
				rarity !== 'all' && excluded_prints.length ? unfilteredInv.filter((el) => !excluded_prints.includes(el.printId) && el.print.rarity === rarity) :
				[]

	if (!inv.length) return message.channel.send({ content: `You do not have more than ${quantityToKeep} ${quantityToKeep === 1 ? 'copy' : 'copies'} of any ${rarity === 'all' ? '' : `${eval(rarity)} `}${set ? `${set_code} ${eval(set.emoji)}` : ''} cards.`})

	const cards = []
	let compensation = 0
	let count = 0

	for (let i = 0; i < inv.length; i++) {
		const sellerInv = inv[i]
		const print = sellerInv.print
		const quantityToSell = sellerInv.quantity - quantityToKeep
		count += quantityToSell
		cards.push(`${quantityToSell} ${eval(print.rarity)}${print.card_name}`)
		const price = Math.floor(print.market_price * 0.7) > 0 ? Math.floor(print.market_price * 0.7) * quantityToSell : quantityToSell
		compensation += price
	}

	const dumpConfirmation = await askForDumpConfirmation(message, set, cards, compensation, count)
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
	
	const prompt = set && set.emoji === set.alt_emoji ? `${set.code} ${eval(set.emoji)}` :
	set && set.emoji !== set.alt_emoji ? `${set.code} ${eval(set.emoji)}${eval(set.alt_emoji)}` :
	''

	return message.channel.send({ content: `You sold ${count} ${rarity === 'all' ? '' : eval(rarity)}${prompt} ${count === 1 ? 'card' : 'cards'} to The Shop for ${compensation}${stardust}.`})
}

//SELL
if(cmd === `!sell`) {
	if (!args.length) return message.channel.send({ content: `Please specify the card(s) you wish to sell.`})
	const sellerId = maid
	const buyerId = message.mentions.users.first() ? message.mentions.users.first().id : merchbotId	
	if (buyerId === sellerId) return message.channel.send({ content: `You cannot sell cards to yourself.`})
	const shopSale = !!(buyerId === merchbotId)

	const sellingPlayer = await Player.findOne({ 
		where: { id: sellerId },
		include: Wallet
	})

	const buyingPlayer = await Player.findOne({ 
		where: { id: buyerId },
		include: Wallet
	})

	if (!sellingPlayer) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})
	if (!buyingPlayer) return message.channel.send({ content: `That user is not in the database.`})

	const line_items = message.mentions.users.first() ? args.slice(1).join(' ').replace(/\s+/g, ' ').split(";").map((el) => el.trim()) :
														args.join(' ').replace(/\s+/g, ' ').split(";").map((el) => el.trim())
	if (!shopSale && line_items.length > 1) return message.channel.send({ content: `You cannot sell different cards to a player in the same transaction.`})

	const invoice = shopSale ? await getInvoiceMerchBotSale(message, line_items, sellingPlayer, fuzzyPrints) : await getInvoiceP2PSale(message, line_item = line_items[0], buyingPlayer, sellingPlayer, fuzzyPrints)
	if (!invoice) return

	if (invoice.total_price > buyingPlayer.wallet.stardust) return message.channel.send({ content: `Sorry, ${buyingPlayer.name} only has ${buyingPlayer.wallet.stardust} and ${invoice.quantities[0] > 1 ? `${invoice.quantities[0]} copies of ` : ''}${invoice.cards[0]} costs ${invoice.total_price}${stardust}.`})

	const sellerConfirmation = await getSellerConfirmation(message, invoice, buyingPlayer, sellingPlayer, shopSale, mention = false)
	if (!sellerConfirmation) return message.channel.send(`No a problem. Have a nice day.`)

	const buyerConfirmation = !shopSale ? await getBuyerConfirmation(message, invoice, buyingPlayer, sellingPlayer, shopSale, mention = true) : true
	if (!buyerConfirmation) return message.channel.send(`No a problem. Have a nice day.`)

	const processSale = shopSale ? await processMerchBotSale(message, invoice, buyingPlayer, sellingPlayer) : await processP2PSale(message, invoice, buyingPlayer, sellingPlayer) 
	if (!processSale) return

	if (invoice.m4success === true) completeTask(message.channel, buyerId, 'm4')

	if (shopSale) {
		if (invoice.m6success === true) completeTask(message.channel, maid, 'm6')
		return message.channel.send({ content: `You sold ${invoice.cards.length > 1 ? `the following to The Shop for ${invoice.total_price}${stardust}:\n${invoice.cards.join('\n')}` : `${invoice.cards[0]} to The Shop for ${invoice.total_price}${stardust}`}.`})
	} else {
		if (await checkCoreSetComplete(buyerId, 1)) completeTask(message.channel, buyerId, 'h4', 4000)
		if (await checkCoreSetComplete(buyerId, 3)) completeTask(message.channel, buyerId, 'l3', 5000)
		return message.channel.send({ content: `${sellingPlayer.name} sold ${invoice.card} to ${buyingPlayer.name} for ${invoice.total_price}${stardust}.`})
	}
}

//BUY
if(cmd === `!buy`) {
	if (!args.length) return message.channel.send({ content: `Please specify the card(s) you wish to buy.`})
	const buyerId = maid
	const sellerId = message.mentions.users.first() ? message.mentions.users.first().id : merchbotId	
	if (buyerId === sellerId) return message.channel.send({ content: `You cannot buy cards from yourself.`})
	const shopSale = !!(sellerId === merchbotId)
	const info = await Info.findOne({ where: { element: 'shop'} })

	const sellingPlayer = await Player.findOne({ 
		where: { id: sellerId },
		include: Wallet
	})

	const buyingPlayer = await Player.findOne({ 
		where: { id: buyerId },
		include: [Diary, Wallet]
	})

	if (!buyingPlayer) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})
	if (!sellingPlayer) return message.channel.send({ content: `That user is not in the database.`})

	const line_item = message.mentions.users.first() ? args.slice(1).join(' ').replace(/\s+/g, ' ').split(";").map((el) => el.trim()) :
														args.join(' ').replace(/\s+/g, ' ').split(";").map((el) => el.trim())
	if (line_item.length > 1) return message.channel.send({ content: `You cannot buy different cards in the same transaction.`})

	const invoice = shopSale ? await getInvoiceMerchBotPurchase(message, line_item, buyingPlayer, fuzzyPrints) : await getInvoiceP2PSale(message, line_item[0], buyingPlayer, sellingPlayer, fuzzyPrints)
	if (!invoice) return

	if (invoice.total_price > buyingPlayer.wallet.stardust) return message.channel.send({ content: `Sorry, you only have ${buyingPlayer.wallet.stardust}${stardust} and ${invoice.cards[0]} costs ${invoice.total_price}${stardust}.`})

	const buyerConfirmation = await getBuyerConfirmation(message, invoice, buyingPlayer, sellingPlayer, shopSale, mention = false)
	if (!buyerConfirmation) return

	const sellerConfirmation = shopSale ? true : await getSellerConfirmation(message, invoice, buyingPlayer, sellingPlayer, shopSale, mention = true)
	if (!sellerConfirmation) return

	const processSale = shopSale ? await processMerchBotSale(message, invoice, buyingPlayer, sellingPlayer) : await processP2PSale(message, invoice, buyingPlayer, sellingPlayer) 
	if (!processSale) return

	if (invoice.m4success === true) completeTask(message.channel, buyerId, 'm4')

	if (shopSale) {
		completeTask(message.channel, buyerId, 'e10')
		return message.channel.send({ content: `You bought ${invoice.cards.length > 1 ? `the following from The Shop for ${invoice.total_price}${stardust}:\n${invoice.cards.join('\n')}` : `${invoice.cards[0]} from The Shop for ${invoice.total_price}${stardust}`}.`})
	} else {
		if (await checkCoreSetComplete(buyerId, 1)) completeTask(message.channel, buyerId, 'h4', 4000)
		if (await checkCoreSetComplete(buyerId, 3)) completeTask(message.channel, buyerId, 'l3', 5000)
		return message.channel.send({ content: `${buyingPlayer.name} bought ${invoice.card} from ${sellingPlayer.name} for ${invoice.total_price}${stardust}.`})
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
	if (!player) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})

	const direction = await getBarterDirection(message)
	if (!direction) return
	let voucher = direction === 'get_card' ? await getVoucher(message, direction) : null

	let print
	let price

	if (voucher === 'forgestone') {
		const query = await getBarterQuery(message)
		const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
		const card_name = await findCard(query, fuzzyPrints)
		const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	
		print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name) : null
		if (!print) return message.channel.send({ content: `Sorry, I do not recognize the card: "${query}".`})
		if (
			print.set_code === 'APC' || 
			print.set_code === 'FPC' ||  
			print.set_code.startsWith('SS') || 
			print.set_code.startsWith('CH')
		) return message.channel.send({ content: `You cannot barter for ${print.set_code} cards.`})

		price = print.rarity === 'com' ? 4 : print.rarity === 'rar' ? 8 : print.rarity === 'sup' ? 16 : print.rarity === 'ult' ? 32 : 64
	} else {
		const selected_option = direction === 'get_card' ? await getBarterCard(message, voucher, medium_complete) : await getTradeInCard(message, medium_complete)
		if (!selected_option) return message.channel.send({ content: `You did not select a valid option.`})
		if (!voucher) voucher = selected_option[3]
	
		price = selected_option[0]
		print = await Print.findOne({ where: { card_code: selected_option[1] } })
		if (!print) return message.channel.send({ content: `Could not find card: "${selected_option[1]}".`})
	}

	const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`
	if (direction === 'get_card' && wallet[voucher] < price) return message.channel.send({ content: `Sorry, you only have ${wallet[voucher]} ${eval(voucher)} and ${card} costs ${price} ${eval(voucher)}.`})

	const inv = await Inventory.findOne({ where: {
		printId: print.id,
		card_code: print.card_code,
		playerId: maid 
	}})

	if (direction === 'get_vouchers' && (!inv || inv.quantity < 1)) return message.channel.send({ content: `Sorry, you do not have any copies of ${card}.`})

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
		return message.channel.send({ content: `Something went wrong. You do not appear to have any copies of ${card}.`})
	}

	if (direction === 'get_card' && print.set_code === 'APC' && inv && inv.quantity >= 3 ) completeTask(message.channel, maid, 'h5')
	if (direction === 'get_card' && print.set_code !== 'APC' && await checkCoreSetComplete(maid, 1)) completeTask(message.channel, maid, 'h4')
	if (direction === 'get_card' && print.set_code !== 'APC' && await checkCoreSetComplete(maid, 3)) completeTask(message.channel, maid, 'l3', 3000)
	const response = direction === 'get_card' ? `Thanks! You exchanged ${price} ${eval(voucher)} for a copy of ${card}.` :
				`Thanks! You exchanged a copy of ${card} for ${price} ${eval(voucher)}.`
	return message.channel.send({ content: response })
}


//BID
if(cmd === `!bid`) {
	const player = await Player.findOne({  
		where: { id: maid }, 
		include: [Bid, Wallet],
		order: [[Bid, 'amount', 'DESC']]})
	if (!player) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})

	const info = await Info.findOne({ where: { element: 'shop' }})
	if (info.status !== 'closed') return message.channel.send({ content: `Bidding is only available when The Shop is closed..`})

    const count = await Auction.count()
    if (!count) return message.channel.send({ content: `Sorry, there are no singles up for auction tonight.`})
    
	message.channel.send({ content: `Please check your DMs.`})

	if (player.bids.length === 3) {
		return askForBidCancellation(message, player, fuzzyPrints)
	} else if (player.bids.length) {
		return manageBidding(message, player, fuzzyPrints)
	} else {
		return askForBidPlacement(message, player, fuzzyPrints)
	}
}

//TRADE
if(cmd === `!trade`) {
	if (mcid !== botSpamChannelId &&
		mcid !== marketPlaceChannelId &&
		mcid !== gutterChannelId
	) return message.channel.send({ content: `Please use this command in <#${botSpamChannelId}> or <#${marketPlaceChannelId}>.`})

	const initiatorId = maid
	const recieverId = message.mentions.users.first() ? message.mentions.users.first().id : null
	if (!recieverId) return message.channel.send({ content: `Please tag the user you want to trade with.`})
	if (recieverId === initiatorId) return message.channel.send({ content: `You cannot trade cards with yourself.`})
	if (!(args.length >= 2)) return message.channel.send({ content: `Please specify the card(s) you wish to trade.`})	
	
	const initiatingPlayer = await Player.findOne({ 
		where: { id: initiatorId },
		include: Wallet
	})

	if (!initiatingPlayer) return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`})

	const receivingPlayer = await Player.findOne({ 
		where: { id: recieverId },
		include: Wallet
	})

	if (!receivingPlayer) return message.channel.send({ content: `That user is not in the database.`})

	const initiator_side = args.slice(1).join(' ').replace(/\s+/g, ' ').split(";").map((el) => el.trim())
	const initiatorSummary = await getTradeSummary(message, initiator_side, initiatingPlayer, fuzzyPrints)
	if (!initiatorSummary) return
	const initiator_confirmation = await getInitiatorConfirmation(message, initiatorSummary.cards, receivingPlayer)
	if (!initiator_confirmation) return message.channel.send({ content: `No problem. Have a nice day.`})

	const receiver_side = await getReceiverSide(message, initiatorSummary.cards, receivingPlayer)
	if (!receiver_side) return
	const receiverSummary = await getTradeSummary(message, receiver_side, receivingPlayer, fuzzyPrints)
	if (!receiverSummary) return
	const receiver_confirmation = await getReceiverConfirmation(message, receiverSummary.cards, receivingPlayer)
	if (!receiver_confirmation) return setTimeout(() => message.channel.send({ content: `Sorry, ${initiatingPlayer.name}, this trade has been rejected.`}), 2000)
	
	const final_confirmation = await getFinalConfirmation(message, receiverSummary.cards, initiatingPlayer)
	if (!final_confirmation) return setTimeout(() => message.channel.send({ content: `Sorry, ${receivingPlayer.name}, this trade has been rejected.`}), 2000)

	const lastTrade = await Trade.findAll({ order: [['createdAt', 'DESC']]})
	const transaction_id = lastTrade.length ? parseInt(lastTrade[0].transaction_id) + 1 : 1

	const initiator_cutoff = initiatingPlayer.last_reset || initiatingPlayer.createdAt

	const initiator_history_1 = await Trade.count({ 
		where: {
			senderId: initiatingPlayer.id,
			receiverId: receivingPlayer.id,
			createdAt: { [Op.gte]: initiator_cutoff }
		}
	})

	const initiator_history_2 = await Trade.count({ 
		where: {
			senderId: receivingPlayer.id,
			receiverId: initiatingPlayer.id,
			createdAt: { [Op.gte]: initiator_cutoff }
		}
	})


	if (initiator_history_1 + initiator_history_2 === 0) {
		const senderProfile = await Profile.findOne({where: { playerId: initiatingPlayer.id } })
		senderProfile.trade_partners++
		await senderProfile.save()
		if (senderProfile.trade_partners >= 20) completeTask(message.channel, initiatingPlayer.id, 'm7', 5000)
	}

	const receiver_cutoff = receivingPlayer.last_reset || receivingPlayer.createdAt

	const receiver_history_1 = await Trade.count({ 
		where: {
			senderId: initiatingPlayer.id,
			receiverId: receivingPlayer.id,
			createdAt: { [Op.gte]: receiver_cutoff }
		}
	})

	const receiver_history_2 = await Trade.count({ 
		where: {
			senderId: receivingPlayer.id,
			receiverId: initiatingPlayer.id,
			createdAt: { [Op.gte]: receiver_cutoff }
		}
	})

	if (receiver_history_1 + receiver_history_2 === 0) {
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
	
	message.channel.send({ content: `${receivingPlayer.name} received:\n${initiatorSummary.cards.join("\n")}\n...and...`})
	return setTimeout(() => message.channel.send({ content: `${initiatingPlayer.name} received:\n${receiverSummary.cards.join("\n")}\n...Trade complete!`}), 3000)
}

//GAUNTLET
if(cmd === `!challenge` || cmd === `!gauntlet`) {
	if(mcid !== "639907734589800458") { return message.channel.send({ content: "This command is not valid outside of the <#639907734589800458> channel."}) }

	var person1 = message.channel.members.find('id', maid);
	if(!person1) { return message.channel.send({ content: "<@" + maid + ">You are not cached in the server, so you cannot play in the Gauntlet. Please change your visibility to \"Online\" to cache yourself."}) }

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

	if (marr.length > 1) { rMem = marr[1].replace(/[\\<>@#&!]/g, ""); }
	if (marr.length == 1) { return message.channel.send({ content: "\nIf you wish to challenge another player please provide:\n- an @ mention\n\n Example: **!gauntlet @Jazz**"}) }

	if(!(rawdata.includes(maid))) { return message.channel.send({ content: `You are not in the database. Type **!start** to begin the game.`}) }

	if(maid === mb) { return; }
	if(rMem == maid) { return message.channel.send({ content: "You cannot challenge yourself to the Gauntlet."}); }
	if(rMem == mb) { return message.channel.send({ content: "You cannot challenge me to the Gauntlet."}) } 

	if(args.length !== 0) {
		if(args[0].toLowerCase() == 'queue' || args[0].toLowerCase() == 'q') {
			if(arrc.length == 0) { return message.channel.send({ content: "The Gauntlet queue is empty."}); }
		else { return message.channel.send({ content: arrc.sort()}) }}}

	if(gauntletdata.includes(maid)) { return message.channel.send({ content: "You are already fighting in the Gauntlet against " + names[room[maid]] + "."}); }
	if(gauntletdata.includes(rMem)) { return message.channel.send({ content: "That player is already fighting in the Gauntlet against " + names[room[rMem]] + "."}); }

	var person2 = message.channel.members.find('id', rMem);
	if(!person2) { return message.channel.send({ content: "<@" + rMem + ">, You are not cached in the server, so you cannot play in the Gauntlet. Please change your visibility to \"Online\" to cache yourself."}); }

	return Merch.data.getGauntletConfirmation(client, message, maid, rMem);
}

//CLEAR
if(cmd === `!clear`) {
	if (!isAdmin(message.member)) return message.channel.send({ content: "You do not have permission to do that."})
    return message.channel.bulkDelete(100)
}

//CLEAR
if(cmd === `!clear_all`) {
	if (!isJazz(message.member)) return message.channel.send({ content: "You do not have permission to do that."})
    return setInterval(() => message.channel.bulkDelete(100), 5000) 
}

//OPEN
if(cmd === `!open`) {
	if (!isJazz(message.member)) return message.channel.send({ content: "You do not have permission to do that."})
	message.channel.send({ content: `Opening the shop now.`})
	return openShop()
}

//CLOSE
if(cmd === `!close`) {
	if (!isJazz(message.member)) return message.channel.send({ content: "You do not have permission to do that."})
	message.channel.send({ content: `Closing the shop now.`})
	return closeShop()
}

//ADJUST
if(cmd === `!adjust`) {
	if (!isAdmin(message.member)) return message.channel.send({ content: "You do not have permission to do that."})
	if (!args.length) return message.channel.send({ content: `Please specify the card you wish to adjust.`})
	
	const query = args.join(' ')	
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const card_name = await findCard(query, fuzzyPrints)
	const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name) : null
	if (!print) return message.channel.send({ content: `Sorry, I do not recognize the card: "${query}".`})
	const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`

	const confirmation = await askForAdjustConfirmation(message, card, print.market_price)
	if (!confirmation) return message.channel.send({ content: `No problem. Have a nice day.`})

	const newPrice = await getNewMarketPrice(message)
	if (!newPrice) return message.channel.send({ content: `Sorry, you did not specify a valid price.`})

	print.market_price = newPrice
	await print.save()

	return message.channel.send({ content: `The market price of ${card} has been adjusted to ${newPrice}${stardust}.`})
}

//MOVE
if(cmd === `!move`) {
	if (!isAdmin(message.member)) return message.channel.send({ content: "You do not have permission to do that."})
	if (!args.length) return message.channel.send({ content: `Please specify the card you wish to move on the Forbidden & Limited list.`})
	
	const query = args.join(' ')
	const card_name = await findCard(query, fuzzyPrints)
	const card = card_name ? await Card.findOne({ where: { name: card_name }}) : null
	if (!card) return message.channel.send({ content: `Sorry, I do not recognize the card: "${query}".`})
	let konami_code = card.konami_code
	while (konami_code.length < 8) konami_code = '0' + konami_code
	
	const status = await Status.findOne({ where: {
		name: card_name,
		konami_code
	} })

	const old_status = status ? status.current : 'unlimited'
	const new_status = await getNewStatus(message, card, old_status)
	if (!new_status) return
	if (new_status === 'do not change') return message.channel.send({ content: `Okay, ${card_name} will remain ${old_status}.`})
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

		const prints = await Print.findAll({ where: { card_name: card_name }})
		for (let i = 0; i < prints.length; i++) {
			const print = prints[i]
			print.frozen = true
			await print.save()
		}

		return message.channel.send({ content: `Okay, ${card_name} has been moved from "${old_status}" to "${new_status}".`})
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

	message.author.send({ content: `**~ ${FiC} - FORBIDDEN & LIMITED LIST ${FiC} ~**` +
	`\n\n**The following cards are forbidden:**` + 
	`\n${forbiddenNames.join('\n')}` + 
	`\n\n**The following cards are limited:**` + 
	`\n${limitedNames.join('\n')}` + 
	`\n\n**The following cards are semi-limited:**` + 
	`\n${semi_limitedNames.join('\n')}`})	

	return message.channel.send({ content: `I messaged you the Forbidden & Limited list. ${FiC}`})
}

})
