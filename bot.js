
const Discord = require('discord.js')
const FuzzySet = require('fuzzyset')
const fs = require('fs')
const merchbotId = '584215266586525696'
const { Op } = require('sequelize')
const { blue, red, stoned, stare, wokeaf, koolaid, cavebob, evil, FOA, merchant, FiC, approve, lmfao, god, legend, master, diamond, platinum, gold, silver, bronze, ROCK, sad, mad, beast, dragon, machine, spellcaster, warrior, zombie, starchips, stardust, com, rar, sup, ult, scr, checkmark, emptybox } = require('./static/emojis.json')
const { checklistcom, startcom, infocom, dbcom, noshowcom, legalcom, listcom, pfpcom, botcom, rolecom, statscom, profcom, losscom, h2hcom, undocom, rankcom, manualcom, deckscom, replayscom, yescom, nocom } = require('./static/commands.json')
const { botRole, modRole, adminRole, tourRole, toRole, fpRole, muteRole, arenaRole } = require('./static/roles.json')
const { welcomeChannel, announcementsChannel, registrationChannel, duelRequestsChannel, marketPlaceChannel, shopChannel, tournamentChannel, arenaChannel, keeperChannel, triviaChannel, draftChannel, gauntletChannel } = require('./static/channels.json')
const { ss1_warrior, ss1_spellcaster } = require('./static/starter_decks.json')
const types = require('./static/types.json')
const status = require('./static/status.json')
const diaries = require('./static/diaries.json')
const errors = require('./static/errors.json')
const muted = require('./static/muted.json')
const { Card, Match, Player, Tournament, Print, Set, Wallet, Diary, Inventory, Arena, Trivia, Keeper, Gauntlet, Draft, Daily, Binder, Wishlist, Profile } = require('./db')
const { isSameDay, fetchAllCards, fetchAllUniquePrints, hasProfile, capitalize, restore, recalculate, revive, createProfile, createPlayer, isNewUser, isAdmin, isMod, getMedal, checkDeckList, getRandomElement, getRandomSubset } = require('./functions/utility.js')
const { saveYDK, saveAllYDK } = require('./functions/decks.js')
const { seed, askForDBUsername, getDeckListTournament, directSignUp, removeParticipant, getParticipants, findOpponent } = require('./functions/tournament.js')
const { makeSheet, addSheet, writeToSheet } = require('./functions/sheets.js')
const { askForCardSlot, selectPrint } = require('./functions/print.js')
const { uploadDeckFolder } = require('./functions/drive.js')
const { findCard } = require('./functions/search.js')
const { updateShop } = require('./functions/shop.js')
const { awardPack } = require('./functions/packs.js')
const { getInitiatorConfirmation, getPartnerSide, getPartnerConfirmation, getFinalConfirmation } = require('./functions/trade.js')
const { askToChangeProfile, getFavoriteColor, getFavoriteQuote, getFavoriteAuthor, getFavoriteCard } = require('./functions/profile.js')
const { client, challongeClient } = require('./static/clients.js')
let fuzzyCards
let fuzzyCards2

//READY
client.on('ready', async () => {
	const allCards = await fetchAllCards()
	const allUniquePrints = await fetchAllUniquePrints()
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

	if (status.shop === 'open') {
		const channel = client.channels.cache.get(shopChannel)
		channel.bulkDelete(100)
		channel.bulkDelete(100)
		channel.bulkDelete(100)
		updateShop(channel)
		setInterval(() => updateShop(channel), 1000 * 60 * 5)
	}

	console.log('MerchBot is online!')
})
  
//WELCOME
client.on('guildMemberAdd', async (member) => {
    const channel = client.channels.cache.get(welcomeChannel)
    const mutedPeople = JSON.parse(fs.readFileSync('./static/muted.json'))['mutedPeople']

    if (mutedPeople.includes(member.user.id)) {
            member.roles.add(muteRole)
            return channel.send(`${member} Nice mute evasion, punk. LOL! ${lmfao}`)
        }

    if (await isNewUser(member.user.id)) {
        createPlayer(member.user.id, member.user.username, member.user.tag) 
        return channel.send(`${member} Welcome to the Forged in Chaos ${FiC} Discord server! Type **!start** to begin playing. ${legend}`)
    } else {
        return channel.send(`${member} Welcome back to the Forged in Chaos ${FiC} Discord server! We missed you. ${approve}`)
    }
})
    
//GOODBYE
client.on('guildMemberRemove', member => client.channels.cache.get(welcomeChannel).send(`Oh dear. ${member.user.username} has left the server. ${sad}`))

//COMMANDS
client.on('message', async (message) => {
    if (!message.guild || message.author.bot || (!message.content.startsWith("!") && !message.content.startsWith("{") && !message.content.startsWith("["))) return

    const messageArray = message.content.split(" ")
	for(let zeta = 0; zeta < messageArray.length; zeta ++) {
		if (messageArray[zeta] == '') { 
			messageArray.splice(zeta, 1)
			zeta--
		}
	}

    const cmd = messageArray[0].toLowerCase()
    const args = messageArray.slice(1)
    const maid = message.author.id

//CARD SEARCH 
if ((message.content.startsWith(`{`) && message.content.endsWith(`}`)) || (message.content.startsWith(`[`) && message.content.endsWith(`]`)) ) {
	const query = message.content.slice(1 , -1)
	const card_name = findCard(query, fuzzyCards, fuzzyCards2)
	if (!card_name) return message.channel.send(`Could not find card: "${query}"`)

	const card = await Card.findOne({ 
		where: { 
			name: {
				[Op.iLike]: card_name
			}
		}
	})

	if (!card) return message.channel.send(`Could not find card: "${query}"`)
	const color = card.card === "Spell" ? "#42f578" : card.card === "Trap" ? "#e624ed" : (card.card === "Monster" && card.category === "Normal") ? "#faf18e" : (card.card === "Monster" && card.category === "Effect") ? "#f5b042" : (card.card === "Monster" && card.category === "Fusion") ? "#a930ff" : (card.card === "Monster" && card.category === "Ritual") ? "#3b7cf5" : (card.card === "Monster" && card.category === "Synchro") ? "#ebeef5" : (card.card === "Monster" && card.category === "Xyz") ? "#6e6e6e" : null

	const classes = []
	if (card.type) classes.push(card.type)
	if (card.class) classes.push(card.class)
	if (card.subclass) classes.push(card.subclass)
	if (card.category) classes.push(card.category)

	const labels = card.card === "Monster" ? `**Attribute:** ${card.attribute}\n**Level:** ${card.level}\n**[** ${classes.join(" / ")} **]**` : `**Category:** ${card.category}` 
	const stats = card.card === "Monster" ? `**ATK:** ${card.atk} **DEF** ${card.def}` : ''

	const cardEmbed = new Discord.MessageEmbed()
		.setColor(color)
		.setTitle(card.name)
		.setThumbnail(`https://ygoprodeck.com/pics/${card.image}`)
		.setDescription(`${labels}\n\n${card.description}\n\n${stats}`)

	return message.channel.send(cardEmbed)
}

//PING 
    if (cmd === `!ping`) return message.channel.send('pong')

//SETS
if (cmd === `!sets`) {
	if (!isAdmin(message.member)) return message.channel.send(`You do not have permission to do that.`)

	const SS1 = {
		code: "SS1",
		name: "Starter Series 1",
		type: "starter_deck",
		emoji_1: "warrior",
		emoji_2: "spellcaster",
		set_size: 32,
		commons: 30,
		ultras: 2,
		unit_price: 75
	}

	const FOA = {
		code: "FOA",
		name: "Forest of the Ancients",
		type: "core",
		emoji_1: "FOA",
		emoji_2: "FOA",
		set_size: 100,
		commons: 48,
		rares: 24,
		supers: 16,
		ultras: 10,
		secrets: 2,
		specials: 4,
		spec_for_sale: true,
		unit_price: 15,
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

	await Set.create(SS1)
	await Set.create(FOA)
	return message.channel.send(`I created 2 dummy sets: SS1 and FOA.`)
}

//PRINT 
if (cmd === `!print`) {
	if (!isAdmin(message.member)) return message.channel.send(`You do not have permission to do that.`)

	const card_name = args.join(' ')
	const card = await Card.findOne({ where: { name: card_name }})
	if (!card) return message.channel.send(`I could not find ${card_name} in the Format Library database.`)

	const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`What set does this printing of ${card_name} belong to?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 10000
	}).then(async collected => {
		const set_code = collected.first().content.toUpperCase()
		
		const set = await Set.findOne({ where: { code: set_code } })
		if (!set) return message.channel.send(`Cannot find set code: ${set_code}.`)
		const set_id = set.id

		return askForCardSlot(message, card_name, card.id, set_code, set_id)
	}).catch(err => {
		console.log(err)
		return message.channel.send(`Sorry, time's up.`)
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
	const playerId = messageArray[1].replace(/[\\<>@#&!]/g, "")
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

//STARTER
if(startcom.includes(cmd)) {
	if(status['transaction'] !== "waiting") return message.channel.send("Another transaction is in progress. Please wait.")
	if(await isNewUser(maid)) await createPlayer(maid, message.author.username, message.author.tag)
	if(await hasProfile(maid)) return message.channel.send("You already received your first Starter Deck.")

	const filter = m => m.author.id === maid
	await message.channel.send(`Howdy, champ! Which deck would you like to start?\n- (1) Warrior\'s Pride  ${warrior}\n- (2) Spellcaster\'s Wrath ${spellcaster}\n\nIf you know which Starter Deck you would like, type it into the chat.`)
	
	message.channel.awaitMessages(filter, {
		max: 1,
		time: 30000
	}).then(async collected => {
		const response = collected.first().content.toLowerCase()
		let starterDeck

		if(response.includes('war') || response.includes(warrior) || response === "1") {
			starterDeck = "ss1_warrior"
		} else if(response.includes('cast') || response.includes(spellcaster) || response === "2") {
			starterDeck = "ss1_spellcaster"
		}

		const keys = Object.keys(eval(starterDeck))

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i]
			const print = await Print.findOne( { where: { card_code: key } })
			if (!print.id) return console.log(`${key} does not exist in the Print database.`)

			const inv = await Inventory.findOne({ where: { 
				card_code: print.card_code,
				printId: print.id,
				playerId: maid
			}})

			if (inv) {
				inv.quantity += eval(starterDeck)[key]
				await inv.save()
			} else {
				await Inventory.create({ 
					card_code: print.card_code,
					quantity: eval(starterDeck)[key],
					printId: print.id,
					playerId: maid
				})
			}
		}

		if (!starterDeck) return message.channel.send('You did not select a valid Starter Deck. Please type the **!start** command to try again.')
		await createProfile(maid, starterDeck.slice(4))

		return message.channel.send('Congratulations, you have begun the game!')
	}).catch(err => {
		return message.channel.send('You did not respond in time. Please type the **!start** command to try again.')
	})
}


//LAUNCH SHOP
if(cmd === `!initiateshop`) {
	if (!isAdmin(message.member)) return message.channel.send(`You do not have permission to do that.`)
	
	if (!(await isNewUser(merchbotId))) return message.channel.send(`The Shop has already been initiated.`)
	await createPlayer(merchbotId, 'MerchBot', 'MerchBot#1002')
	await createProfile(merchbotId, 'none')

	return message.channel.send('Congratulations, you initiated The Shop!')
}


//MUTE 
if(cmd === `!mute`) {
	if (!isMod(message.member)) return message.channel.send("You do not have permission to do that.")
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
	if (!isMod(message.member)) return message.channel.send("You do not have permission to do that.")
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
	if (!message.member.roles.cache.some(role => role.id === fpRole)) {
		message.member.roles.add(fpRole)
		return message.channel.send(`You now have the Forged Players role.`)
	} else {
		message.member.roles.remove(fpRole)
		return message.channel.send(`You no longer have the Forged Players role.`)
	}
}

//BOT USER GUIDE 
if (botcom.includes(cmd)) {
	const botEmbed = new Discord.MessageEmbed()
		.setColor('#38C368')
		.setTitle('MerchBot')
		.setDescription('A Manager Bot for Forged in Chaos.\n' )
		.setURL('https://forgedinchaos.com/')
		.setAuthor('Jazz#2704', 'https://i.imgur.com/wz5TqmR.png', 'https://formatlibrary.com/')
		.setThumbnail('https://i.imgur.com/PeJ2Q5n.png')
		.addField('Card Commands', '\n!inv - (set or card) - View your inventory.\n!checklist - (set) - View a checklist.\n!start - Get your first starter deck or buy one.\n!pack - (set) - Buy a pack.\n!box - (set) - Buy a box of packs.\n!calc - (set) - Post the resale value of a set.')
		.addField('Trade Commands', '\n!trade - (@user + quantity + card) - Initiate a trade with another player.\n!binder - (card or @user) - Add or remove a card from your binder, or post another user\'s binder.\n!wish - (card or @user) - Add or remove a card from your wishlist, or post another user\'s wishlist.\n!search - (card) - Search for cards in binders or wishlists.')
		.addField('Shop Commands', '\n!buy - (@user + quantity + card + price) - Buy a card from the shop or a player.\n!sell - (@user + quantity + card + price) - Sell a card to the shop or a player.\n!dump - (set + rarity + quantity to keep + card exceptions) - Sell cards in bulk to the the shop based on rarity.\n!barter - (card) - Exchange vouchers for certain cards.\n!shop - (card) - Check the shop value of a card.\n!bid - Privately bid on a card when the shop is closed.\n!bids - View your bids.\n!cancel - Cancel a bid.')
		.addField('Duel Commands', '\n!stats - (@user) - Post a player’s stats and currency.\n!loss - (@user) - Report a loss to another player.\n!top - (number) - Post the server’s top rated players (100 max).\n!h2h - (@user + @user) - Post the H2H record between 2 players.\n!undo - Undo the last loss if you reported it by mistake.')
		.addField('Tournament Commands', '\n!join - Register for the upcoming tournament.\n!resubmit - Resubmit your deck list for the tournament. \n!drop - Drop from the current tournament. \n!show - Post the Challonge link for the current tournament.')
		.addField('Format Commands', '\n!legal - Privately check if your deck is legal. \n!banlist - View the Forbidden and Limited list.')
		.addField('Mini Game Commands', '\n!trivia - Join or leave the Trivia queue.\n!arena - Join or leave the Arena queue.\n!draft - Join or leave the Draft queue.\n!challenge (@user) - Challenge a player to the Gauntlet.\n!q - Check the queue.\n!vouchers - Check your Arena vouchers.')
		.addField('Player Commands', '\n!role - Add or remove the Forged Players role.\n!db - (username) - Set your DuelingBook username. \n!diary (e, m, h, or l) - Check your achievement diaries.\n!daily - Get daily rewards for checking in.\n!gift (@user + card) - Gift a card to another player.\n!prof (@user) - Post a player’s profile.\n!edit - Edit your profile.\n!grind (quantity) - Convert some Starchips into Stardust.\n!alc (card) - Convert a card into Starchips.')
		.addField('Server Commands', '\n!info - View information about a channel.\n!ref (@user) - Send a referral bonus to another player.\n!bot - View the MerchBot User Guide.\n!mod - View the Moderator Guide.')
	
	message.author.send(botEmbed)
	return message.channel.send("I messaged you the MerchBot User Guide.")
}

//MOD USER GUIDE 
if (cmd === `!mod`) {
	if (!isMod(message.member)) return message.channel.send("You do not have permission to do that.")
	const botEmbed = new Discord.MessageEmbed()
		.setColor('#38C368')
		.setTitle('MerchBot')
		.setDescription('A Manager Bot for Forged in Chaos.\n' )
		.setURL('https://forgedinchaos.com/')
		.setAuthor('Jazz#2704', 'https://i.imgur.com/wz5TqmR.png', 'https://formatlibrary.com/')
		.setThumbnail('https://i.imgur.com/PeJ2Q5n.png')
		.addField('Mod-Only Event Commands', '\n!manual - (@winner + @loser) - Manually record a match result.\n!undo - Undo the last match, even if you did not report it.\n!award - (@user + quantity + item) - Award a prize to a player.\n!steal - (@user + quantity + item) - Steal an item from a player.')
		.addField('Mod-Only Tournament Commands', '\n!create - (tournament name) - Create a new tournament.  \n!signup - (@user) - Directly add a player to the bracket. \n!noshow - (@user) - Report a no-show. \n!remove - (@user) - Remove a player from the bracket. \n!seed - Assign seeds to participants based on rankings. \n!start - Start the next tournament. \n!end - End the current tournament.')
		.addField('Mod-Only Discipline Commands', '\n!mute - (@user) - Mute a user.\n!unmute - (@user) - Unmute a user.')
		.addField('Mod-Only Status Commands', '\n!status - (element) - Check the status of a game element.\n!reset - (element) - Reset a game element to its default status.\n!freeze - (element) - Freeze a game element.')
		.addField('Mod-Only Shop Commands', '\n!open - Open the shop.\n!close - Close the shop.\n!update - Restart shop updates if the bot crashes.\n!count - Calculate how many packs to open for the shop.\n!adjust - (card + new price) - Adjust the inherent value of a card.')
		.addField('Admin-Only Commands', '\n!census - Update the information of all players in the database.\n!recalc - Recaluate all player stats for a specific format if needed.\n!rename - (@user) - Rename a player in the database.\n!grindall - Grind everyone\'s Starchips into Stardust.')
		
	message.author.send(botEmbed)
	return message.channel.send("I messaged you the Mod-Only Guide.")
}

//INFO //working but needs content editing
if(infocom.includes(cmd)) {
	if (message.channel.id == duelRequestsChannel) { 
		return message.channel.send(`${master} --- Ranked Play --- ${master}`+ 
		`\nThis is a Constructed Format based on the cards that you own.`+
		` You can check your Inventory with the **!inv** command.`+
		` After you build a deck, go to <#${duelRequestsChannel}> and tag **@Forged Players** to find an opponent.`+
		`\n\nWe designed this game to reward effort.`+
		` The lower your rating, the more ${starchips} you'll earn.`+
		` This discourages farming and helps new players get better cards.`+
		` You can check ratings with the **!stats** command.`+
		`\n\nDisclaimer: Logs exist and admins can view inventories.`+
		` Playing with cards you don't own will not be tolerated.`+
		`\n\nIn addition, you must follow the Forbidden and Limited List:`, {files: ["./public/banlist.png"]})
	}

	if (message.channel.id == marketPlaceChannel) { 
		return message.channel.send(`${merchant} --- Market Place --- ${merchant}`+ 
		`\nTo get the cards you need in Forged in Chaos, you need to buy, sell, and trade.`+
		`\n\nPut cards in your Binder with **!bind**,`+
		` add cards to your Wishlist with **!wish**,`+
		` and find what you're looking for with **!search**.`+
		` Then come to the <#${marketPlaceChannel}> to use the **!trade** command.`+
		`\n\nIf you can't find a trading partner, you can also browse the <#${shopChannel}>.`+
		` Each card has two prices: the cost to buy and the price to sell.`+
		` Sick of using Discord? Visit the Shop online at https://forgedinchaos.com.`+
		`\n\nOn Tuesday and Friday nights, the Shop closes and opens some packs to restock.`+
		` During the Night, players use the **!bid** command in private.`+
		` The next Day, the Shop opens and the cards are sold to the highest bidders!`)
	}

	if (message.channel.id == tournamentChannel) { 
		return message.channel.send(`${legend} --- Tournaments --- ${legend}`+ 
		`\nHere at the Forged Discord server, we host Tournaments with the help of bots and humans alike.`+
		`\n\nLarger Tournaments will be announced in advance by our Event Staff in the <#${tournamentChannel}>.`+
		` To sign up for a Tournament, simply come to the <#${tournamentChannel}> and use the **!join** command.`+
		` The Tournament Organizer will handle the rest, so keep an eye out for their instructions.`+
		`\n\nAs a token of our appreciation, each tournament participant gets a Chaos Pack just for entering.`+
		` If you do well, you can win additional Chaos Packs and other prizes.`)
	}

	if (message.channel.id == arenaChannel) { 
		return message.channel.send(`${beastEmoji} ${dragonEmoji} ${machineEmoji} --- The Arena --- ${spellcaster} ${warrior} ${zombieEmoji}`+ 
		`\nIn this channel, you get to test out the game's most powerful cards.`+
		` Simply align yourself with a Tribe and wage war at their side.`+
		`\n\nTo compete in the Arena, type **!join** in <#${arenaChannel}>.`+
		` It requires 6 players to launch.`+
		` When it starts, you are loaned a 60-card deck, and you get 5 minutes to cut up to 20 cards.`+
		`\n\nThe Arena is a Round Robin, singles-games tournament.`+
		` Winners receive 6${starchips}, losers receive 2${starchips}.`+
		` To report a loss, type **!loss @opponent**, then wait for the next round.`+
		`\n\nThe Champion of the Arena walks away with an ${ultEmoji}Arena-exclusive Prize Card according to their Tribe!`+
		` Everyone else receives Vouchers for each game they won.`+
		` You can use **!barter "card"** to exchange 8 Vouchers for a Tribal prize card.`, {files: ["https://i.imgur.com/iYTTIUW.png"]})
	}

	if (message.channel.id == gauntletChannel) { 
		return message.channel.send(`${gloveEmoji} --- The Gauntlet --- ${gloveEmoji}`+ 
		`\nThe Gauntlet is the ultimate test of endurance and technical play.`+
		` In this 2-Player game-mode, you're asked to succeed with Starter Decks from every generation of Forged`+
		` from Spellcaster's Wrath ${spellcaster} to Zombie's Curse ${zombieEmoji}.`
		`\n\nTo enter the Gauntlet, simply use **!challenge @opponent** <#${gauntletChannel}>.`+
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

	if (message.channel.id == keeperChannel) { 
		return message.channel.send(`${beastEmoji} ${dragonEmoji} ${machineEmoji} --- Keeper of the Forge --- ${spellcaster} ${warrior} ${zombieEmoji}`+ 
		`\nIn this channel, you get to test out the game's most powerful cards.`+
		` Simply align yourself with a Tribe and wage war at their side.`+
		`\n\nTo compete in the Arena, type **!join** in <#${arenaChannel}>.`+
		` It requires 6 players to launch.`+
		` When it starts, you are loaned a 60-card deck, and you get 5 minutes to cut up to 20 cards.`+
		`\n\nThe Arena is a Round Robin, singles-games tournament.`+
		` Winners receive 6${starchips}, losers receive 2${starchips}.`+
		` To report a loss, type **!loss @opponent**, then wait for the next round.`+
		`\n\nThe Champion of the Arena walks away with an ${ultEmoji}Arena-exclusive Prize Card according to their Tribe!`+
		` Everyone else receives Vouchers for each game they won.`+
		` You can use **!barter "card"** to exchange 8 Vouchers for a Tribal prize card.`, {files: ["https://i.imgur.com/iYTTIUW.png"]})
	}

	if (message.channel.id == "603825650360647691") { 
		return message.channel.send(fireEmoji + " --- Keeper of the Forge --- " + fireEmoji +
		"\nThis is a constructed format intended to introduce the Deck Master concept. As the Keeper of the Forge, your job is simple: Keep the flame burning bright." +
		"\n\nIn Keeper duels, each player places a Keeper on the Field to protect their flame. Should your Keeper ever leave the Field, it\'s game over. In addition to using card effects to protect your Keeper, you may also pay 1000 LP. It takes guts and ingenuity to succeed at this new style of dueling, so I wish you godspeed!" + 
		"\n\nRules:" +
		"\n1. Place your Keeper in the EMZ at the start of the duel. If placed from the Hand, draw a card." +
		"\n2. The Keeper cannot leave the EMZ by its own effect." +
		"\n3. The Keeper is unaffected by card effects on each player\'s first turn." +
		"\n4. The Keeper cannot attack your opponent\'s Keeper." +
		"\n5. The Keeper cannot attack directly, except with a card such as \"Overpowering Eye\"." +
		"\n6. Other monsters you contol MAY attack directly." +
		"\n7. The Keeper cannot be tributed." +
		"\n8. Control of the Keeper cannot switch." +
		"\n9. If your Keeper would leave the Field, you must pay 1000 LP to protect it." +
		"\n\nKeeper games are played as singles (not matches). Losers must report in the <#603825650360647691> channel using the **!loss** command. Winners receive 6" + starchip + " while losers receive 2" + starchip + "." +
		"\n\nIn addition, you must follow the Keeper-specific Forbidden and Limited List:", {files: ["https://i.imgur.com/Btlasys.png"]})
	}

	if (message.channel.id == triviaChannel) { 
		return message.channel.send(`${beastEmoji} ${dragonEmoji} ${machineEmoji} --- Trivia Center --- ${spellcaster} ${warrior} ${zombieEmoji}`+ 
		`\nThe King of Games must also be a student of the game.`+
		` That means you must be familiar with the old Champions and their decks,`+
		` as well as the names, effects, and artworks of important cards.`+
		` In addition, we\'ll keep you on your toes with some non-Yu-Gi-Oh! questions, covering topics such as:`+
		` \n- TV, Anime, Film\n- Science\n- Geography\n- History\n- Pop Culture\n- Forged Facts (!)`+
		`\n\nTo enter Trivia contests, simply use the **!trivia** command in the <#603825673404022822> channel.`+
		` It requires 5 players to launch.`+
		` When it starts, you will have 16 seconds to respond to each question sent via DM.`+
		`\n\nThe Arena is a Round Robin, singles-games tournament.`+
		` If you get them right--you get a point! After 10 rounds, the top 2 bookworms will split 6" + starchip + " for their performance.`+
		`\n\nAs you play more Trivia, your Profile will keep a record of your acumen.`+
		` There are 500 total questions, so hit the books and then hit those keys! <:approve:586704386617507840>`)
	}
		
	if (message.channel.id == draftChannel) { 
		return message.channel.send(`${beastEmoji} --- Draft Room --- ${zombieEmoji}`+ 
		`\nIn this channel, you get to test out the game's most powerful cards.`+
		` Simply align yourself with a Tribe and wage war at their side.`+
		`\n\nTo compete in the Arena, type **!join** in <#${arenaChannel}>.`+
		` It requires 6 players to launch.`+
		` When it starts, you are loaned a 60-card deck, and you get 5 minutes to cut up to 20 cards.`+
		`\n\nThe Arena is a Round Robin, singles-games tournament.`+
		` Winners receive 6${starchips}, losers receive 2${starchips}.`+
		` To report a loss, type **!loss @opponent**, then wait for the next round.`+
		`\n\nThe Champion of the Arena walks away with an ${ultEmoji}Arena-exclusive Prize Card according to their Tribe!`+
		` Everyone else receives Vouchers for each game they won.`+
		` You can use **!barter "card"** to exchange 8 Vouchers for a Tribal prize card.`)
	}

	return message.channel.send("Use this command in channels such as <#${duelRequestChannel}>, <#${marketPlaceChannel}>, <#${tournamentChannel}>, <#${arenaChannel}>, <#${keeperChannel}>, <#${triviaChannel}>, and <#${gauntletChannel}> to learn how those parts of the game work.")
}

//EDIT
if(cmd == `!edit`) {
	const profile = await Profile.findOne({ where: { playerId: maid } })
	if (!profile) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	const wantsToChangeColor = await askToChangeProfile(message, 'color')
	const favorite_color = wantsToChangeColor ? await getFavoriteColor(message) : ''
	if (favorite_color === 'unrecognized') message.channel.send(`Sorry, I do not recognize that color.`)
	
	const wantsToChangeQuote = await askToChangeProfile(message, 'quote')
	const new_quote = wantsToChangeQuote ? await getFavoriteQuote(message) : null
	const new_author = wantsToChangeQuote ? await getFavoriteAuthor(message) : null

	const wantsToChangeCard = await askToChangeProfile(message, 'card')
	const new_card = wantsToChangeCard ? await getFavoriteCard(message, fuzzyPrints, fuzzyPrints2) : null

	if (favorite_color.startsWith("#")) profile.favorite_color = favorite_color
	if (new_quote) profile.quote = new_quote
	if (new_author) profile.author = new_author
	if (new_card && new_card !== 'not found') profile.favorite_card = new_card
	await profile.save()
	if (new_card === 'not found') return
	if (!favorite_color.startsWith("#") && !new_quote && !new_card) return message.channel.send(`Not a problem. Have a nice day.`)

	return message.channel.send(`Your profile has been updated!`)
}

//CALCULATE //not working
if(cmd == `!calc` || cmd == `!calculate`) {
	if(!args[0]) return message.channel.send(`Please specify a valid set code.`)

	var setcode = args[0].toLowerCase();
	var net = 0;
	var net2 = 0;
	var net3 = 0;
	var net4 = 0;
	
	return message.channel.send(`The resale value of an Ascent of Dragons ${aodEmoji} Box is ${Math.round(0.9*net)} ${stardust}, and a Pack is ${Math.round(0.9*net/24)} ${stardust}`)
}

//VOUCHERS //not working
if(cmd == `!vouchers` || cmd == `!voucher` || cmd == `!vouch` || cmd == `!v`) {
	return message.channel.send(`Your Vouchers:`)
}

//PROFILE
if(cmd == `!prof` || cmd == `!profile`) {
	const playerId = (messageArray.length === 1 ? maid : messageArray[1].replace(/[\\<>@#&!]/g, ""))
	const player = await Player.findOne({ 
		where: { 
			id: playerId
		},
		include: [Wallet, Arena, Diary, Draft, Gauntlet, Keeper, Trivia, Profile]
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
	const deck_name = player.profile.first_deck === 'warrior' ? `Warrior's Pride` : `Spellcaster's Wrath`
	const favorite_card = await Card.findOne({ 
		where: { 
			name: player.profile.favorite_card
		}
	})
	const favorite_card_image = favorite_card ? `https://ygoprodeck.com/pics/${favorite_card.image}` : ''
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
	const diary_keys = Object.keys(player.diary)
	diary_keys.forEach(function(key) {
		if (player.diary[key]) {
			if (key.startsWith('e')) easy_tasks++
			else if (key.startsWith('m')) medium_tasks++
			else if (key.startsWith('h')) hard_tasks++
			else if (key.startsWith('l')) elite_tasks++
			else if (key.startsWith('s')) master_tasks++
		}
	})

	const easy_summary = easy_tasks / 12 === 1 ? `100% ${legend}` : `${Math.round(easy_tasks / 12 * 100)}%`
	const medium_summary = medium_tasks / 12 === 1 ? `100% ${legend}` : `${Math.round(medium_tasks / 10 * 100)}%`
	const hard_summary = hard_tasks / 12 === 1 ? `100% ${legend}` : `${Math.round(hard_tasks / 8 * 100)}%`
	const elite_summary = elite_tasks / 12 === 1 ? `100% ${legend}` : `${Math.round(elite_tasks / 6 * 100)}%`
	const master_summary = master_tasks / 12 === 1 ? `100% ${legend}` : `${Math.round(master_tasks / 4 * 100)}%`

	let correct_answers = 0
	const trivia_keys = Object.keys(player.trivium)
	trivia_keys.forEach(function(key) {
		if (key.startsWith('question') && player.trivium[key]) correct_answers++
	})

	let beasts = ''
	let dragons = ''
	let machines = ''
	let spellcasters = ''
	let warriors = ''
	let zombies = ''
	for (let i = 0; i < player.beast_wins && i < 3; i++) beasts += `${beast} `
	for (let i = 0; i < player.dragon_wins && i < 3; i++) dragons += `${dragon} `
	for (let i = 0; i < player.machine_wins && i < 3; i++) machines += `${machine} `
	for (let i = 0; i < player.spellcaster_wins && i < 3; i++) spellcasters += `${spellcaster} `
	for (let i = 0; i < player.warrior_wins && i < 3; i++) warriors += `${warrior} `
	for (let i = 0; i < player.zombie_wins && i < 3; i++) zombies += `${zombie} `

	const win_rate = player.wins || player.losses ? `${Math.round(player.wins / (player.wins + player.losses) * 100)}%` : `N/A`
	const keeper_win_rate = player.keeper.wins || player.keeper.losses ? `${Math.round(player.keeper.wins / (player.keeper.wins + player.keeper.losses) * 100)}%` : `N/A`

	const profileEmbed = new Discord.MessageEmbed()
		.setColor(player.profile.favorite_color)
		.setThumbnail(avatar)
		.setTitle(`**${player.name}'s Player Profile**`)
		.setDescription(`Member Since: ${month} ${day}, ${year}\nFirst Deck: ${eval(player.profile.first_deck)} ${deck_name} ${eval(player.profile.first_deck)}`)
		.addField('Diary Progress', `Easy Diary: ${easy_summary}\nMedium Diary: ${medium_summary}\nHard Diary: ${hard_summary}\nElite Diary: ${elite_summary}\nMaster Diary: ${master_summary}`)
		.addField('Ranked Stats', `Best Medal: ${getMedal(player.best_stats, true)}\nWin Rate: ${win_rate}\nHighest Elo: ${player.best_stats.toFixed(2)}\nVanquished Foes: ${player.vanquished_foes}\nLongest Streak: ${player.longest_streak}`)
		.addField('Arena Stats', `Beast Wins: ${player.arena.beast_wins} ${beasts}\nDragon Wins: ${player.arena.dragon_wins} ${dragons}\nMachine Wins: ${player.arena.machine_wins} ${machines}\nSpellcaster Wins: ${player.arena.spellcaster_wins} ${spellcasters}\nWarrior Wins: ${player.arena.warrior_wins} ${warriors}\nZombie Wins: ${player.arena.zombie_wins} ${zombies}`)
		.addField('Other Stats', `Net Worth: ${Math.floor(networth)}${starchips}\nTrade Partners: ${player.trade_partners}\nKeeper Wins: ${player.keeper.wins}\nKeeper Win Rate: ${keeper_win_rate}\nTrivia Wins: ${player.trivium.wins}\nTrivia Answers: ${correct_answers} out of 500`)
		.setImage(favorite_card_image)
		.setFooter(quote)

	return message.channel.send(profileEmbed)
}

//REFERRAL
if(cmd === `!ref` || cmd === `!refer` || cmd === `!referral`) {
	if (!args.length) return message.channel.send(`No player specified.`)
	const referrer = messageArray[1].replace(/[\\<>@#&!]/g, "")
	if (!referrer || referrer.length < 17 || referrer.length > 18) return message.channel.send(`No player specified.`)

	const referringPlayer = await Player.findOne({ where: { id: referrer }, include: Wallet })
	if (!referringPlayer) return message.channel.send(`That person is not in the database.`)

	const playerProfile = await Profile.findOne({ where: { playerId: maid }})
	if (!playerProfile) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	if (playerProfile.referral) return message.channel.send(`You already gave a referral.`)
	
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

//GIFT //not working
if(cmd === `!gift`) {
	return Merch.data.awardStarchips(client, message, rMem, 30)
}

//RESET //not working
if(cmd === `!reset`) {
	if(message.member.roles.has('584227140237787152') || message.member.roles.has('584227970986541066') || message.member.roles.has('590682273402191900') || message.member.roles.has('672002703840247808')) {
		if(args.length == 0) { return message.channel.send("You did not select a valid Status:\n- Transaction (x)\n- Shop (s)\n- Profile (p)\n- Bids (b)\n- Loss (l)\n- Arena (a)\n- Draft (d)\n- Gauntlet (g)\n- Trivia (v)\n- Tournament (r)"); }

	if(args[0].toLowerCase() == 'transaction' || args[0].toLowerCase() == 'transactions' || args[0].toLowerCase() == 'trans' || args[0].toLowerCase() == 'x') { return Merch.data.resetTransactionStatus(client, message, 1); }
	if(args[0].toLowerCase() == 'profile' || args[0].toLowerCase() == 'prof' || args[0].toLowerCase() == 'p') { return Merch.data.resetProfileStatus(client, message, 1); }
	if(args[0].toLowerCase() == 'bids' || args[0].toLowerCase() == 'bid' || args[0].toLowerCase() == 'b') { return Merch.data.resetBidStatus(client, message, 1); }
	if(args[0].toLowerCase() == 'arena' || args[0].toLowerCase() == 'a') { return Merch.data.resetArenaStatus(client, message, 1); }
	if(args[0].toLowerCase() == 'shop' || args[0].toLowerCase() == 's') { return Merch.data.resetShopStatus(client, message, 1); }
	if(args[0].toLowerCase() == 'loss' || args[0].toLowerCase() == 'l') { return Merch.data.resetLossComStatus(client, message, 1); }
	if(args[0].toLowerCase() == 'gauntlet' || args[0].toLowerCase() == 'g') { return Merch.data.resetGauntletStatus(client, message, 1); }
	if(args[0].toLowerCase() == 'trivia' || args[0].toLowerCase() == 'v') { return Merch.data.resetTriviaStatus(client, message, 1); }
	if(args[0].toLowerCase() == 'draft' || args[0].toLowerCase() == 'd') { return Merch.data.resetDraftStatus(client, message, 1); }
	if(args[0].toLowerCase() == 'tournament' || args[0].toLowerCase() == 'tournaments' || args[0].toLowerCase() == 'tour' || args[0].toLowerCase() == 'r') { return Merch.data.resetTournamentStatus(client, message, 1); }}
}

//FREEZE //not working
if(cmd === `!freeze`) {
	if(message.member.roles.has('584227140237787152') || message.member.roles.has('584227970986541066') || message.member.roles.has('590682273402191900') || message.member.roles.has('672002703840247808')) {

	if(args[0].toLowerCase() == 'transaction' || args[0].toLowerCase() == 'transactions' || args[0].toLowerCase() == 'trans' || args[0].toLowerCase() == 'x') { return Merch.data.freezeTransactionStatus(client, message, 1); }
	if(args[0].toLowerCase() == 'profile' || args[0].toLowerCase() == 'prof' || args[0].toLowerCase() == 'p') { return Merch.data.freezeProfileStatus(client, message, 1); }
	if(args[0].toLowerCase() == 'bid' || args[0].toLowerCase() == 'b') { return Merch.data.freezeBidStatus(client, message, 1); }
	if(args[0].toLowerCase() == 'arena' || args[0].toLowerCase() == 'a') { return Merch.data.freezeArenaStatus(client, message, 1); }
	if(args[0].toLowerCase() == 'trivia' || args[0].toLowerCase() == 'v') { return Merch.data.freezeTriviaStatus(client, message, 1); }
	if(args[0].toLowerCase() == 'tournament' || args[0].toLowerCase() == 'tournaments' || args[0].toLowerCase() == 'tour' || args[0].toLowerCase() == 'r') { return Merch.data.freezeTournamentStatus(client, message, 1); }}
}

//STATUS //not working
if(cmd === `!status`) {
	if(args.length == 0) { return message.channel.send("You did not select a valid Status:\n- Shop (s)\n- Transaction (x)\n- Update (u)\n- Profile (p)\n- Bid (b)\n- Loss (l)\n- Arena (a)\n- Gauntlet (g)\n- Trivia (v)\n- Tournament (r)"); }

	if(args[0].toLowerCase() == 'transaction' || args[0].toLowerCase() == 'transactions' || args[0].toLowerCase() == 'trans' || args[0].toLowerCase() == 'x') { return message.channel.send("The Transaction Status is: " + status['transaction'] + "."); }
	if(args[0].toLowerCase() == 'profile' || args[0].toLowerCase() == 'prof' || args[0].toLowerCase() == 'p') { return message.channel.send("The Profile Status is: " + status['profile'] + "."); }
	if(args[0].toLowerCase() == 'shop' || args[0].toLowerCase() == 's') { return message.channel.send("The Shop has been: " + status['shop'] + "for " + (Date.now() - status['time']) + "ms." ); }
	if(args[0].toLowerCase() == 'arena' || args[0].toLowerCase() == 'a') { return message.channel.send("The Arena Status is: " + status['arena'] + ". The Round is " + status['arenaRound'] + "."); }
	if(args[0].toLowerCase() == 'gauntlet' || args[0].toLowerCase() == 'g') { return message.channel.send("The Gauntlet Status is: " + status['gauntlet'] + "."); }
	if(args[0].toLowerCase() == 'loss' || args[0].toLowerCase() == 'l') { return message.channel.send("The Loss Command Status is: " + status['losscom'] + "."); }
	if(args[0].toLowerCase() == 'trivia' || args[0].toLowerCase() == 'v') { return message.channel.send("The Trivia Status is: " + status['trivia'] + "."); }
	if(args[0].toLowerCase() == 'bid' || args[0].toLowerCase() == 'b') { return message.channel.send("The Bid Status is: " + status['bidding'] + "."); }
	if(args[0].toLowerCase() == 'update') { return message.channel.send("The Update Status is: " + updating + "."); }
	if(args[0].toLowerCase() == 'tournament' || args[0].toLowerCase(1) == 'tournaments' || args[0].toLowerCase() == 'tour' || args[0].toLowerCase() == 'r') { return message.channel.send("The Tournament Status is: " + status['tournament'] + "."); }
}

//COUNT //not working
if(cmd === `!count`) {
	var corePacks;
	var miniPacks;
	var weightedCount = counter['phr']+((1/2)*counter['fog'])+((1/2)*counter['cri'])+((8/15)*counter['ssh'])+((4/15)*counter['etd'])+((4/15)*counter['poe'])+((6/15)*counter['wsp'])+(5*counter['sds'])-7*counter['newbies'];

	return message.channel.send("In this cycle " + counter['newbies'] + " Newbies began playing and The Shop has sold:" +

	"\n- " + counter['phr'] + " Pack(s) of PHR " + foaEmoji +
	"\n- " + counter['ssh'] + " Pack(s) of SSH " + sshEmoji +
	"\n- " + counter['fog'] + " Pack(s) of FOG " + fogEmoji +
	"\n- " + counter['etd'] + " Pack(s) of ETD " + etdEmoji +
	"\n- " + counter['cri'] + " Pack(s) of CRI " + criEmoji +
	"\n- " + counter['poe'] + " Pack(s) of POE " + poeEmoji +
	"\n- " + counter['sds'] + " Starter Deck(s) " + dinoEmoji + " " + phishEmoji +

	"\n\nThis means The Shop would open " + corePacks + " Pack(s) of PHR " + phrEmoji + " and " + miniPacks + " Pack(s) of SSH " + sshEmoji + " to restock our Inventory if we closed now.")
}

//CHART //not working
if(cmd === `!chart`) {
	return message.channel.send("\n" + beastcount + " - " + beastbar)
}

//MYTRADES //not working
if(cmd === `!trades`) {
	return
}

//WRITE //not working
if(cmd === `!write`) {
	return message.channel.send("Please specify a valid File Entry.")
}

//BURN //not working
if(cmd === `!burn`) {
	return message.channel.send("Please specify a valid File Entry.")
}

//RNG
if(cmd === `!rng`) {
	if(!args[0]) return message.channel.send(`Please specify an upper limit.`)
	return message.channel.send(`Your random number is: ${Math.floor((Math.random() * args[0]) + 1)}`)
}

//DAIRY
if(cmd === `!dairy`) return message.channel.send('<:cow:598743989101002762>')

//DIARY //not working
if(cmd === `!diary`) {
	const diary = await Diary.findOne({ where: { playerId: maid } })
	if (!diary) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	const easy_complete = diary.e1 && diary.e2 && diary.e3 && diary.e4 && diary.e5 && diary.e6 && diary.e7 && diary.e8 && diary.e9 && diary.e10 && diary.e11 && diary.e12
	const moderate_complete = diary.m1 && diary.m2 && diary.m3 && diary.m4 && diary.m5 && diary.m6 && diary.m7 && diary.m8 && diary.m9 && diary.m10
	const hard_complete = diary.h1 && diary.h2 && diary.h3 && diary.h4 && diary.h5 && diary.h6 && diary.h7 && diary.h8
	const elite_complete = diary.l1 && diary.l2 && diary.l3 && diary.l4 && diary.l5 && diary.l6
	const master_complete = diary.s1 && diary.s2 && diary.s3 && diary.s4
	const input = args[0] ? args[0].toLowerCase() : ''
	const tasks = []
	let bonuses
	let diary_to_display

	if (input) {
		if(input === 'e' || input === 'ez' || input === 'easy' || input.startsWith('ea')) { diary_to_display = 'Easy'; bonuses = diaries.Easy.bonuses }
		else if(input === 'm' || input.startsWith('me')) { diary_to_display = 'Moderate'; bonuses = diaries.Moderate.bonuses }
		else if(input === 'h' || input.startsWith('ha')) { diary_to_display = 'Hard'; bonuses = diaries.Hard.bonuses }
		else if(input === 'l' || input.startsWith('el')) { diary_to_display = 'Elite'; bonuses = diaries.Elite.bonuses }
		else if(input === 's' || input.startsWith('ma')) { diary_to_display = 'Master'; bonuses = diaries.Master.bonuses }
	} else if (!diary_to_display) {
		if (master_complete || elite_complete) { diary_to_display = 'Master'; bonuses = diaries.Master.bonuses }
		else if (hard_complete) { diary_to_display = 'Elite'; bonuses = diaries.Elite.bonuses }
		else if (moderate_complete) { diary_to_display = 'Hard'; bonuses = diaries.Hard.bonuses }
		else if (easy_complete) { diary_to_display = 'Moderate'; bonuses = diaries.Moderate.bonuses }
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

	if (diary_to_display === 'Moderate') {
		if(diary.m1) { score++ ;tasks.push(`~~${diaries.Moderate.m1}~~`)} else tasks.push(diaries.Moderate.m1)
		if(diary.m2) { score++ ;tasks.push(`~~${diaries.Moderate.m2}~~`)} else tasks.push(diaries.Moderate.m2)
		if(diary.m3) { score++ ;tasks.push(`~~${diaries.Moderate.m3}~~`)} else tasks.push(diaries.Moderate.m3)
		if(diary.m4) { score++ ;tasks.push(`~~${diaries.Moderate.m4}~~`)} else tasks.push(diaries.Moderate.m4)
		if(diary.m5) { score++ ;tasks.push(`~~${diaries.Moderate.m5}~~`)} else tasks.push(diaries.Moderate.m5)
		if(diary.m6) { score++ ;tasks.push(`~~${diaries.Moderate.m6}~~`)} else tasks.push(diaries.Moderate.m6)
		if(diary.m7) { score++ ;tasks.push(`~~${diaries.Moderate.m7}~~`)} else tasks.push(diaries.Moderate.m7)
		if(diary.m8) { score++ ;tasks.push(`~~${diaries.Moderate.m8}~~`)} else tasks.push(diaries.Moderate.m8)
		if(diary.m9) { score++ ;tasks.push(`~~${diaries.Moderate.m9}~~`)} else tasks.push(diaries.Moderate.m9)
		if(diary.m10) { score++ ;tasks.push(`~~${diaries.Moderate.m10}~~`)} else tasks.push(diaries.Moderate.m10)
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

	if (diary_to_display === 'Master') {
		if(diary.s1) { score++ ;tasks.push(`~~${diaries.Master.s1}~~`)} else tasks.push(diaries.Master.s1)
		if(diary.s2) { score++ ;tasks.push(`~~${diaries.Master.s2}~~`)} else tasks.push(diaries.Master.s2)
		if(diary.s3) { score++ ;tasks.push(`~~${diaries.Master.s3}~~`)} else tasks.push(diaries.Master.s3)
		if(diary.s4) { score++ ;tasks.push(`~~${diaries.Master.s4}~~`)} else tasks.push(diaries.Master.s4)
		score = Math.round(score / 4 * 100)
	}

	const diary_image = diary_to_display === 'Easy' ? 'https://i.imgur.com/bZpSKCG.jpg' :
		diary_to_display === 'Moderate' ? 'https://i.imgur.com/deUr5ts.jpg' :
		diary_to_display === 'Hard' ? 'https://i.imgur.com/ZOAwIED.jpg' :
		diary_to_display === 'Elite' ? 'https://i.imgur.com/rGgVdBm.jpg' :
		'https://i.imgur.com/rGgVdBm.jpg'
		

	const diaryEmbed = new Discord.MessageEmbed()
		.setThumbnail(diary_image)
		.addField(`${score === 100 ? `${checkmark} `: ''}${diary_to_display} Diary - ${score}% Complete${score === 100 ? ` ${checkmark}` : ''}`, `${tasks.join("\n")}`)
		.addField(`${score === 100 ? `${legend} Bonus - Active ${legend}` : `Bonus`}`,`${bonuses.join("\n")}`)

	message.author.send(diaryEmbed);
	return message.channel.send(`I messaged you the ${diary_to_display} Diary.`)
}

//BINDER
if(cmd === `!bind` || cmd === `!binder`) {
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
	const binder = await Binder.findOne({ where: { playerId }, include: Player})
	if (!binder && playerId === maid) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	if (!binder && playerId !== maid) return message.channel.send(`That user is not in the database.`)

	if (!args.length || playerId !== maid) {
		const results = []
		for (let i = 0; i < 18; i++) {
			if(binder[`slot_${i + 1}`]) results.push(binder[`slot_${i + 1}`])
		}

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

	const query = args.join(' ')
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	const card_name = findCard(query, fuzzyPrints, fuzzyPrints2)
	const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name) : null
	if (!print) return message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
	const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`

	const inv = await Inventory.findOne({ 
		where: { 
			printId: print.id,
			playerId: maid,
			quantity: { [Op.gt]: 0 }
		}
	})

	if (!inv) return message.channel.send(`You do not have any copies of ${card}.`)

	let success = false
	let i = 0

	while (!success && i < 18) {
		if (!binder[`slot_${i + 1}`]) {
			success = true
			binder[`slot_${i + 1}`] = card
			await binder.save()
		} else {
			i++
		}
	}

	if (!success) return message.channel.send(`Your binder is full. Please remove a card or empty it to make room.`)
	else return message.channel.send(`You added ${card} to your binder.`)
}

//SEARCH
if(cmd === `!search`) {
	if (!args.length) return message.channel.send(`Please specify a card to search for.`)

	const allBinders = await Binder.findAll({ include: Player })
	const allWishlists = await Wishlist.findAll({ include: Player })
	
	const query = args.join(' ')
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	const card_name = findCard(query, fuzzyPrints, fuzzyPrints2)
	const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name) : null
	if (!print) return message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
	const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`

	const binderResults = []
	const wishlistResults = []

	allBinders.forEach(function(binder) {
		for (let i = 0; i < 18; i++) {
			if (binder[`slot_${(i + 1)}`] === card) binderResults.push(binder.player.name)
		}
	})

	binderResults.sort()
	
	allWishlists.forEach(function(wishlist) {
		for (let i = 0; i < 10; i++) {
			if (wishlist[`slot_${(i + 1)}`] === card) wishlistResults.push(wishlist.player.name)
		}
	})

	wishlistResults.sort()

	return message.channel.send(`Search results for ${card}:\n**Binders:**\n${binderResults.length ? binderResults.join('\n') : 'N/A'}\n\n**Wishlists:**\n${wishlistResults.length ? wishlistResults.join('\n') : 'N/A'}`)
}

//WISHLIST
if(cmd === `!wish` || cmd === `!wishlist`) {
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
	const wishlist = await Wishlist.findOne({ where: { playerId }, include: Player})
	if (!wishlist && playerId === maid) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	if (!wishlist && playerId !== maid) return message.channel.send(`That user is not in the database.`)

	if (!args.length || playerId !== maid) {
		const results = []
		for (let i = 0; i < 18; i++) {
			if(wishlist[`slot_${i + 1}`]) results.push(wishlist[`slot_${i + 1}`])
		}

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

	const query = args.join(' ')
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	const card_name = findCard(query, fuzzyPrints, fuzzyPrints2)
	const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name) : null
	if (!print) return message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
	const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`

	let success = false
	let i = 0

	while (!success && i < 18) {
		if (!wishlist[`slot_${i + 1}`]) {
			success = true
			wishlist[`slot_${i + 1}`] = card
			await wishlist.save()
		} else {
			i++
		}
	}

	if (!success) return message.channel.send(`Your wishlist is full. Please remove a card or empty it to make room.`)
	else return message.channel.send(`You added ${card} to your wishlist.`)
}

//STATS
if (statscom.includes(cmd)) {
	const playerId = (messageArray.length === 1 ? maid : messageArray[1].replace(/[\\<>@#&!]/g, ""))
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

	const index = allRecords.length ? allRecords.findIndex(record => record.dataValues.id === playerId) : -1

	const rank = (index === -1 ? `N/A` : `#${index + 1} out of ${allRecords.length}`)
	const medal = getMedal(player.stats, true)

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
	const oppo = messageArray[1].replace(/[\\<>@#&!]/g, "")
	const winner = message.guild.members.cache.get(oppo)
	const loser = message.guild.members.cache.get(maid)
	const winningPlayer = await Player.findOne({ where: { id: oppo } })
	const losingPlayer = await Player.findOne({ where: { id: maid } })
	const winnersWallet = await Wallet.findOne({ where: {playerId: oppo } })
	const losersWallet = await Wallet.findOne({ where: {playerId: maid } })

	if (!oppo || oppo == '@') return message.channel.send(`No player specified.`)
	if (oppo == maid) return message.channel.send(`You cannot lose a match to yourself.`)
	if (winner.roles.cache.some(role => role.id === botRole)) return message.channel.send(`Sorry, Bots do not play Forged in Chaos... *yet*.`)
	if (oppo.length < 17 || oppo.length > 18) return message.channel.send(`To report a loss, type **!loss @opponent**.`)
	if (!losingPlayer) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	if (!winningPlayer) return message.channel.send(`That person is not in the database.`)
	
	if (status['status'] === 'active' && (loser.roles.cache.some(role => role.id === tourRole) || winner.roles.cache.some(role => role.id === tourRole))) {
		return challongeClient.matches.index({
			id: status['tournament'],
			callback: (err, data) => {
				if (err) {
					return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
				} else {
					const tournamentChannel = formats[status['format']] ? formats[status['format']].channel : null
					if (formatChannel !== tournamentChannel) {
						return message.channel.send(`Please report this match in the appropriate channel: <#${tournamentChannel}>.`)
					} else {
						return getParticipants(message, data, loser, winner, formatName, formatDatabase)
					}
				}
			}
		}) 
	}

	const origStatsWinner = winningPlayer.stats
	const origStatsLoser = losingPlayer.stats
	const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origStatsWinner - origStatsLoser) / 400))))))
	const chipsWinner = Math.round((delta+5)) < 9 ? 9 : Math.round((delta)) > 30 ? 30 : Math.round((delta+5))
	const chipsLoser = (origStatsLoser - origStatsWinner) < 72 ? 5 : (origStatsLoser - origStatsWinner) >=150 ? 3 : 4

	winningPlayer.stats += delta
	winningPlayer.backup = origStatsWinner
	winningPlayer.wins++
	winningPlayer.current_streak++
	if (winningPlayer.current_streak > winningPlayer.longest_streak) winningPlayer.longest_streak = winningPlayer.current_streak
	if (winningPlayer.stats > winningPlayer.best_stats) winningPlayer.best_stats = winningPlayer.stats
	await winningPlayer.save()
	
	losingPlayer.stats -= delta
	losingPlayer.backup = origStatsLoser
	losingPlayer.losses++
	losingPlayer.current_streak = 0
	await losingPlayer.save()

	winnersWallet.starchips += chipsWinner
	await winnersWallet.save()

	losersWallet.starchips += chipsLoser
	await losersWallet.save()

	await Match.create({ game: "ranked", winner: winner.user.id, loser: loser.user.id, delta: delta, chipsWinner: chipsWinner, chipsLoser: chipsLoser })
	return message.reply(`Your loss to ${winner.user.username} has been recorded. ${winner.user.username} earned ${chipsWinner}${starchips}, and you earned ${chipsLoser}${starchips}.`)
}

//MANUAL
if (manualcom.includes(cmd)) {
	const winnerId = messageArray[1].replace(/[\\<>@#&!]/g, "")
	const loserId = messageArray[2].replace(/[\\<>@#&!]/g, "")
	const winner = message.guild.members.cache.get(winnerId)
	const loser = message.guild.members.cache.get(loserId)
	const winningPlayer = await Player.findOne({ where: { id: winnerId } })
	const losingPlayer = await Player.findOne({ where: { id: loserId } })
	const winnersWallet = await Wallet.findOne({ where: { playerId: winnerId } })
	const losersWallet = await Wallet.findOne({ where: { playerId: loserId } })

	if (!isMod(message.member)) return message.channel.send(`You do not have permission to do that.`)
	if (!winner || !loser) return message.channel.send(`Please specify 2 players.`)
	if (winner === loser) return message.channel.send(`Please specify 2 different players.`)
	if (winner.roles.cache.some(role => role.id === botRole) || loser.roles.cache.some(role => role.id === botRole)) return message.channel.send(`Sorry, Bots do not play Forged in Chaos... *yet*.`)
	if (!losingPlayer) return message.channel.send(`Sorry, ${loser.user.username} is not in the database.`)
	if (!winningPlayer) (`Sorry, ${winner.user.username} was not in the database.`)

	if (status['status'] === 'active' && (winner.roles.cache.some(role => role.id === tourRole) || loser.roles.cache.some(role => role.id === tourRole))) {
		return challongeClient.matches.index({
			id: status['tournament'],
			callback: (err, data) => {
				if (err) {
					return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
				} else {
					if (message.channel !== tournamentChannel) {
						return message.channel.send(`Please report this match in the appropriate channel: <#${tournamentChannel}>.`)
					} else {
						return getParticipants(message, data, loser, winner)
					}
				}
			}
		}) 
	}

	const origStatsWinner = winningPlayer.stats
	const origStatsLoser = losingPlayer.stats
	const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origStatsWinner - origStatsLoser) / 400))))))
	const chipsWinner = Math.round((delta+5)) < 9 ? 9 : Math.round((delta)) > 30 ? 30 : Math.round((delta+5))
	const chipsLoser = (origStatsLoser - origStatsWinner) < 72 ? 5 : (origStatsLoser - origStatsWinner) >=150 ? 3 : 4

	winningPlayer.stats += delta
	winningPlayer.backup = origStatsWinner
	winningPlayer.wins++
	winningPlayer.current_streak++
	if (winningPlayer.current_streak > winningPlayer.longest_streak) winningPlayer.longest_streak = winningPlayer.current_streak
	if (winningPlayer.stats > winningPlayer.best_stats) winningPlayer.best_stats = winningPlayer.stats
	await winningPlayer.save()
	
	losingPlayer.stats -= delta
	losingPlayer.backup = origStatsLoser
	losingPlayer.losses++
	losingPlayer.current_streak = 0
	await losingPlayer.save()

	winnersWallet.starchips += chipsWinner
	await winnersWallet.save()

	losersWallet.starchips += chipsLoser
	await losersWallet.save()

	await Match.create({ game: "ranked", winner: winner.user.id, loser: loser.user.id, delta: delta, chipsWinner: chipsWinner, chipsLoser: chipsLoser })
	return message.channel.send(`A manual loss by ${loser.user.username} to ${winner.user.username} has been recorded. ${winner.user.username} earned ${chipsWinner}${starchips}, and ${loser.user.username} earned ${chipsLoser}${starchips}.`)
}

//NO SHOW
if (noshowcom.includes(cmd)) {
	const noShowId = messageArray[1].replace(/[\\<>@#&!]/g, "")
	const noShow = message.guild.members.cache.get(noShowId)
	const noShowPlayer = await Tournament.findOne({ where: { playerId: noShowId } })
	const noShowEntry = await Tournament.findOne({ where: { playerId: noShowId } })

	if (!isMod(message.member)) return message.channel.send("You do not have permission to do that.")
	if (!noShow) return message.channel.send("Please specify a player. Be sure they are not invisible.")
	if (!noShowEntry || !noShow.roles.cache.some(role => role.id === tourRole)) return message.channel.send(`Sorry, ${noShow.user.username} was is not in the tournament.`)

	return challongeClient.matches.index({
		id: status['tournament'],
		callback: (err, data) => {
			if (err) {
				return message.channel.send(`Error: the current tournament could not be accessed.`)
			} else {
				if (message.channel !== tournamentChannel) {
					return message.channel.send(`Please report this no show in the appropriate channel: <#${tournamentChannel}>.`)
				} else {
					return findOpponent(message, data, noShow, noShowPlayer)
				}
			}
		}
	}) 
}

//H2H
if (h2hcom.includes(cmd)) {
	if (messageArray.length === 1) return message.channel.send("Please specify at least 1 other player.")
	if (messageArray.length > 3) return message.channel.send("You may only compare 2 players at a time.")
	const player1Id = messageArray[1].replace(/[\\<>@#&!]/g, "")
	const player2Id = (messageArray.length === 2 ? maid : messageArray[2].replace(/[\\<>@#&!]/g, ""))

	const player1 = await Player.findOne({ where: { id: player1Id } })
	const player2 = await Player.findOne({ where: { id: player2Id } })
	
	if (player1Id === player2Id) return message.channel.send(`Please specify 2 different players.`)
	if (!player1 && player2Id === maid) return message.channel.send(`That user is not in the database.`)
	if (!player1 && player2Id !== maid) return message.channel.send(`The first user is not in the database.`)
	if (!player2 && player2Id === maid) return message.channel.send(`You are not in the database.`)
	if (!player2 && player2Id !== maid) return message.channel.send(`The second user is not in the database.`)

	const p1Wins = await Match.count({ where: { winner: player1Id, loser: player2Id } })
	const p2Wins = await Match.count({ where: { winner: player2Id, loser: player1Id } })

	return message.channel.send(`${FiC} --- H2H Results --- ${FiC}`+
	`\n${player1.name} has won ${p1Wins}x`+
	`\n${player2.name} has won ${p2Wins}x`)
}

//UNDO
if (undocom.includes(cmd)) {
	const allMatches = await Match.findAll()
	const lastMatch = allMatches.slice(-1)[0]
	const winnerId = lastMatch.winner
	const loserId = lastMatch.loser
	const winner = message.guild.members.cache.get(winnerId)
	const loser = message.guild.members.cache.get(loserId)
	const winningPlayer = await Player.findOne({ where: { id: winnerId } })
	const losingPlayer = await Player.findOne({ where: { id: loserId } })
	const winnersWallet = await Wallet.findOne({ where: { playerId: winnerId } })
	const losersWallet = await Wallet.findOne({ where: { playerId: loserId } })
	const prompt = (isMod(message.member) ? '' : ' Please get a Moderator to help you.')

	if (maid !== loserId && !isMod(message.member)) return message.channel.send(`The last recorded match was ${loser.name}'s loss to ${winner.name}.${prompt}`)
	if (winningPlayer.backup === null && maid !== loserId) return message.channel.send(`${winner.name} has no backup stats.${prompt}`)
	if (winningPlayer.backup === null && maid === loserId) return message.channel.send(`Your last opponent, ${winner.name}, has no backup stats.${prompt}`)
	if (losingPlayer.backup === null  && maid !== loserId) return message.channel.send(`${loser.name} has no backup stats.${prompt}`)
	if (losingPlayer.backup === null && maid === loserId) return message.channel.send(`You have no backup stats.${prompt}`)

	winningPlayer.stats = winningPlayer.backup
	winningPlayer.backup = null
	winningPlayer.wins--
	winningPlayer.current_streak--
	await winningPlayer.save()

	losingPlayer.stats = losingPlayer.backup
	losingPlayer.backup = null
	losingPlayer.losses--
	await losingPlayer.save()
	
	winnersWallet.starchips -= lastMatch.chipsWinner
	await winnersWallet.save()

	losersWallet.starchips -= lastMatch.chipsLoser
	await losersWallet.save()

	await lastMatch.destroy()

	return message.channel.send(`The last match in which ${winner.user.username} defeated ${loser.user.username} has been erased.`)
}

//RANK
if (rankcom.includes(cmd)) {
	const x = parseInt(args[0]) || 10
	const result = []
	x === 1 ? result[0] = `${FiC} --- The Best Forged Player --- ${FiC}`
	: result[0] = `${FiC} --- Top ${x} Forged Players --- ${FiC}`

	if (x < 1) return message.channel.send("Please provide a number greater than 0.")
	if (x > 100 || isNaN(x)) return message.channel.send("Please provide a number less than or equal to 100.")
	
	const allPlayers = await Player.findAll({ 
		where: {
			[Op.or]: [ { wins: { [Op.gt]: 0 } }, { losses: { [Op.gt]: 0 } } ]
		},
		order: [['stats', 'DESC']]
	})
			
	if (x > allPlayers.length) return message.channel.send(`I need a smaller number. We only have ${allPlayers.length} Forged players.`)

	const topPlayers = allPlayers.slice(0, x)

	for (let i = 0; i < x; i++) result[i+1] = `${(i+1)}. ${getMedal(topPlayers[i].stats)} ${topPlayers[i].name}`

	message.channel.send(result.slice(0,30))
	if (result.length > 30) message.channel.send(result.slice(30,60))
	if (result.length > 60) message.channel.send(result.slice(60,90))
	if (result.length > 90) message.channel.send(result.slice(90))
	return
}
    
//QUEUE
if(cmd === `!queue` || cmd === `!q`) {
	return
}

//ARENA
if(cmd === `!arena` || cmd === `!brandis` || cmd === `!aretos`) {
	return
}

//TRIVIA
if(cmd === `!trivia`) {
	return
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

		return message.channel.send(`You ground ${x}${starchips} into ${x * 10}${stardust}.`)
	}).catch(err => {
		console.log(err)
		return message.channel.send(`Sorry, time's up.`)
	})
}

//DAILY
if(cmd === `!daily`) {
	const daily = await Daily.findOne({ where: { playerId: maid }, include: Player })
	const diary = await Diary.findOne({ where: { playerId: maid } })
	if (!daily || !diary) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)

	const date = new Date()
	const hoursLeftInDay = 23 - date.getHours()
	const minsLeftInHour = 60 - date.getMinutes()

	//if (isSameDay(daily.last_check_in, date)) return message.channel.send(`You already used **!daily** today. Try again in ${hoursLeftInDay} ${hoursLeftInDay === 1 ? 'hour' : 'hours'} and ${minsLeftInHour} ${minsLeftInHour === 1 ? 'minute' : 'minutes'}.`)

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

	if (!print.id) return console.log(`${card} does not exist in the Print database.`)

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

	const easy_complete = diary.e1 && diary.e2 && diary.e3 && diary.e4 && diary.e5 && diary.e6 && diary.e7 && diary.e8 && diary.e9 && diary.e10 && diary.e11 && diary.e12
	const moderate_complete = diary.m1 && diary.m2 && diary.m3 && diary.m4 && diary.m5 && diary.m6 && diary.m7 && diary.m8 && diary.m9 && diary.m10
	const hard_complete = diary.h1 && diary.h2 && diary.h3 && diary.h4 && diary.h5 && diary.h6 && diary.h7 && diary.h8
	const elite_complete = diary.l1 && diary.l2 && diary.l3 && diary.l4 && diary.l5 && diary.l6
	const master_complete = diary.s1 && diary.s2 && diary.s3 && diary.s4

	if ((daily.cobble_progress + daysPassed + 1) >= 7) {
		daily.cobble_progress = 0
		let num = master_complete ? 5 : elite_complete ? 4 : hard_complete ? 3 : moderate_complete ? 2 :  easy_complete ? 1 : 1
		if (num) setTimeout(() => {
			message.channel.send(`Oh look, ${daily.player.name}, you cobbled together a pack!`, {files:[`./public/packs/7outof7.png`]})
			awardPack(message, set, num)
		}, 4000)
	} else {
		daily.cobble_progress += (daysPassed + 1)
		setTimeout(() => {
			message.channel.send(`Hey, ${daily.player.name}, keep cobblin', buddy.`, {files:[`./public/packs/${daily.cobble_progress}outof7.png`]})
		}, 4000)
	}

	daily.last_check_in = date
	await daily.save()

	message.channel.send(`1... 2...`)
	return setTimeout(() => message.channel.send(`${enthusiasm} ${daily.player.name} pulled ${eval(print.rarity)}${print.card_code} - ${print.card_name} from the grab bag! ${emoji}`), 2000)
}

//ALCHEMY
if(cmd === `!alc` ||cmd === `!alch` || cmd === `!alchemy`) {
	const wallet = await Wallet.findOne({ 
		where: { id: maid },
		include: Player
	})

	if (!wallet) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	
	const query = args.join(" ")
	
	if (!args[0]) return message.channel.send(`Please specify the card you wish to transmute.`)

	const card_name = findCard(query, fuzzyPrints, fuzzyPrints2)
	const card_code = `${query.slice(0, 3).toUpperCase()}-${item.slice(-3)}`
	const print = await Print.findOne({ where: { card_code: card_code }})
	const prints = await Print.findAll({ 
		where: { card_name: { [Op.iLike]: card_name } },
		order: [['createdAt', 'ASC']]
	})

	if (!print && !prints.length) return message.channel.send(`Could not find card: "${query}"`)

	const award = print ? ` ${eval(print.rarity)}${print.card_code} - ${print.card_name}` : prints.length ? ` ${eval(prints[0].rarity)}${prints[0].card_code} - ${prints[0].card_name}` : walletEmoji 

	const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`Are you sure you want to award ${quantity}${award} to ${player.name}?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send(`No problem. Have a nice day.`)
		
		if (print) {
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
			}
		} else if (prints.length) {
			const inv = await Inventory.findOne({ where: { 
				card_code: prints[0].card_code,
				printId: prints[0].id,
				playerId: recipient
			}})
	
			if (inv) {
				inv.quantity += quantity
				await inv.save()
			} else {
				await Inventory.create({ 
					card_code: prints[0].card_code,
					quantity: quantity,
					printId: prints[0].id,
					playerId: recipient
				})
			}
		} else {
			player.wallet[walletField] += quantity
			await player.wallet.save()
		}
	
		return message.channel.send(`${player.name} was awarded ${quantity}${award}. Congratulations!`)
	}).catch(err => {
		console.log(err)
		return message.channel.send(`Sorry, time's up.`)
	})
}

//AWARD
if(cmd === `!award`) {
	if (!isMod(message.member)) return message.channel.send("You do not have permission to do that.")
	const recipient = args[0].replace(/[\\<>@#&!]/g, "")
	if (recipient === maid) return message.channel.send(`You cannot give an award to yourself.`)
	if (isNaN(recipient) || recipient.length < 17) return message.channel.send(`Please @ mention a user to award.`)

	const player = await Player.findOne({ 
		where: { id: recipient },
		include: Wallet
	})

	if (!player) return message.channel.send(`That user is not in the database.`)

	const quantity = parseInt(args[1])
	const item = args.slice(2).join(" ")
	
	if (!args[1] && !item) return message.channel.send(`Please specify the item you wish to award.`)
	if (!quantity) return message.channel.send(`Please specify the number of items you wish to award.`)
	if (!item) return message.channel.send(`Please specify the item you wish to award.`)

	const card_name = findCard(item, fuzzyPrints, fuzzyPrints2)
	const card_code = `${item.slice(0, 3).toUpperCase()}-${item.slice(-3)}`
	const print = await Print.findOne({ where: { card_code: card_code }})
	const prints = await Print.findAll({ 
		where: { card_name: { [Op.iLike]: card_name } },
		order: [['createdAt', 'ASC']]
	})

	let walletEmoji, walletField
	if (item === 'sc' || item === 'starchip' || item === 'starchips' || item === 'chip' || item === 'chips') walletEmoji = starchips, walletField = 'starchips'
	if (item === 'sd' ||item === 'stardust' || item === 'dust') walletEmoji = stardust, walletField = 'stardust'

	if (!print && !prints.length && !walletEmoji) return message.channel.send(`Sorry, I do not recognize the item: "${item}".`)

	const award = print ? ` ${eval(print.rarity)}${print.card_code} - ${print.card_name}` : prints.length ? ` ${eval(prints[0].rarity)}${prints[0].card_code} - ${prints[0].card_name}` : walletEmoji 

	const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`Are you sure you want to award ${quantity}${award} to ${player.name}?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send(`No problem. Have a nice day.`)
		
		if (print) {
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
			}
		} else if (prints.length) {
			const inv = await Inventory.findOne({ where: { 
				card_code: prints[0].card_code,
				printId: prints[0].id,
				playerId: recipient
			}})
	
			if (inv) {
				inv.quantity += quantity
				await inv.save()
			} else {
				await Inventory.create({ 
					card_code: prints[0].card_code,
					quantity: quantity,
					printId: prints[0].id,
					playerId: recipient
				})
			}
		} else {
			player.wallet[walletField] += quantity
			await player.wallet.save()
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
	const target = args[0].replace(/[\\<>@#&!]/g, "")
	if (target === maid) return message.channel.send(`You cannot steal something from yourself.`)
	if (isNaN(target) || target.length < 17) return message.channel.send(`Please @ mention a user to steal from.`)

	const player = await Player.findOne({ 
		where: { id: target },
		include: Wallet
	})

	if (!player) return message.channel.send(`That user is not in the database.`)

	const quantity = parseInt(args[1])
	const item = args.slice(2).join(" ")
	
	if (!args[1] && !item) return message.channel.send(`Please specify the item you wish to steal.`)
	if (!quantity) return message.channel.send(`Please specify the number of items you wish to steal.`)
	if (!item) return message.channel.send(`Please specify the item you wish to steal.`)

	const card_code = `${item.slice(0, 3).toUpperCase()}-${item.slice(-3)}`

	const print = await Print.findOne({ where: { card_code: card_code }})

	const prints = await Print.findAll({ 
		where: { card_name: { [Op.iLike]: item } },
		order: [['createdAt', 'ASC']]
	})

	let walletEmoji, walletField
	if (item === 'sc' || item === 'starchip' || item === 'starchips' || item === 'chip' || item === 'chips') walletEmoji = starchips, walletField = 'starchips'
	if (item === 'sd' ||item === 'stardust' || item === 'dust') walletEmoji = stardust, walletField = 'stardust'

	if (!print && !prints.length && !walletEmoji) return message.channel.send(`Sorry, I do not recognize the item: "${item}".`)

	const loot = print ? ` ${eval(print.rarity)}${print.card_code} - ${print.card_name}` : prints.length ? ` ${eval(prints[0].rarity)}${prints[0].card_code} - ${prints[0].card_name}` : walletEmoji 

	const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`Are you sure you want to steal ${quantity}${loot} from ${player.name}?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send(`No problem. Have a nice day.`)
		
		if (print) {
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
		} else if (prints.length) {
			const inv = await Inventory.findOne({ where: { 
				card_code: prints[0].card_code,
				printId: prints[0].id,
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
		} else {
			if (!player.wallet[walletField]) {
				return message.channel.send(`Sorry, ${player.name} does not have any${loot}.`)
			} else if (player.wallet[walletField] < quantity) {
				return message.channel.send(`Sorry, ${player.name} only has ${inv.quantity}${loot}.`)
			} else {
				player.wallet[walletField] -= quantity
				await player.wallet.save()
			}
		}
	
		return message.channel.send(`Yikes! You stole ${quantity}${loot} from ${player.name}.`)
	}).catch(err => {
		console.log(err)
		return message.channel.send(`Sorry, time's up.`)
	})
}

//GRINDALL
if(cmd === `!grindall`) {
	if (!isAdmin(message.member)) return message.channel.send(`You do not have permission to do that.`)
	const allWallets = await Wallet.findAll()

	const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`Are you sure you want to grind everyone's ${starchips}s into ${stardust}?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send(`No problem. Have a nice day.`)

		for (let i = 0; i < allWallets.length; i++) {
			const wallet = allWallets[i]
			wallet.stardust += wallet.starchips * 10
			wallet.starchips = 0
			await wallet.save()
		}
	
		return message.channel.send(`Every player's ${starchips}s have been ground into ${stardust}!`)
	}).catch(err => {
		console.log(err)
		return message.channel.send(`Sorry, time's up.`)
	})
}

//HOLIDAYCHEER
if(cmd === `!holidaycheer`) {
	return
}

//INVENTORY
if(cmd === `!inventory` || cmd === `!inv`) { 
	const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
	if (playerId !== maid && !isMod(message.member)) return message.channel.send(`You do not have permission to do that.`)

	const player = await Player.findOne({ where: { id: playerId }})
	if (!player) return message.channel.send(playerId === maid ? `You are not in the database. Type **!start** to begin the game.` : `That person is not in the database.`)

	const query = playerId === maid ? args.join(' ') : args.length > 1 ? args.slice(1).join(' ') : null
	const set_code = query.toUpperCase()
	const valid_set_code = !!(set_code.length === 3 && await Set.count({where: { code: set_code }}))
	const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
	const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	const card_name = query && !valid_set_code && !valid_card_code ? findCard(query, fuzzyPrints, fuzzyPrints2) : null
	const print = valid_card_code ? await Print.findOne({ where: { card_code } }) : card_name ? await selectPrint(message, maid, card_name) : null
	if (card_name && !print) return

	const inventory = !query ? await Inventory.findAll({ 
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
	if (!inventory.length && print) results.push(`${eval(print.rarity)}${print.card_code} - ${print.card_name} - 0`)

	for (let i = 0; i < inventory.length; i++) {
		const row = inventory[i]
		const code = row.card_code.slice(0,3)

		try {
			if (!codes.includes(code) && !card_name) {
				codes.push(code)
				const set = await Set.findOne({ where: { code } })
				if (set) results.push(`${codes.length > 1 ? '\n' : ''}${eval(set.emoji_1)} --- ${set.name} --- ${eval(set.emoji_2)}`) 
			}
		} catch (err) {
			console.log(err)
		}

		results.push(`${eval(row.print.rarity)}${row.card_code} - ${row.print.card_name} - ${row.quantity}`) 
	}

	for (let i = 0; i < results.length; i += 30) {
		if (results[i+31] && results[i+31].startsWith("\n")) {
			message.author.send(results.slice(i, i+31))
			i++
		} else {
			message.author.send(results.slice(i, i+30))
		}
	}

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
				if (set) results.push(`${codes.length > 1 ? '\n' : ''}${eval(set.emoji_1)} --- ${set.name} --- ${eval(set.emoji_2)}`) 
			}
		} catch (err) {
			console.log(err)
		}

		const box_emoji = cards.includes(row.card_code) ? checkmark : emptybox

		results.push(`${box_emoji} ${eval(row.rarity)}${row.card_code} - ${row.card_name}`) 
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
	const code = args[0] || 'FOA'
	if (code.startsWith('SS')) return message.channel.send(`Sorry, Starter Series cards are not sold by the pack.`)
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
	if (!set.for_sale) return message.channel.send(`Sorry, ${set.name}${eval(set.emoji_1)} is out of stock.`)

	const wallet = await Wallet.findOne( { where: { playerId: maid }, include: Player })
	if (!wallet) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	const money = wallet[set.currency]
	if (money < set.unit_price) return message.channel.send(`Sorry, ${wallet.player.name}, you only have ${money}${eval(set.currency)} and ${set.name}${eval(set.emoji_1)} packs cost ${set.unit_price}${eval(set.currency)}.`)

	const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`${wallet.player.name}, have ${money}${eval(set.currency)}. Do you want to spend ${set.unit_price}${eval(set.currency)} on a ${set.name}${eval(set.emoji_1)} pack?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send(`No problem. Have a nice day.`)

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

		const results = [`${eval(set.emoji_1)} - ${set.name} Pack - ${eval(set.emoji_2)}`]

		for (let i = 0; i < yourPack.length; i++) {
			const print = await Print.findOne({ where: {
				card_code: yourPack[i]
			}})

			if (!print.id) return console.log(`${card} does not exist in the Print database.`)
			results.push(`${eval(print.rarity)}${print.card_code} - ${print.card_name}`)

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

		wallet[set.currency] -= set.unit_price
		await wallet.save()

		message.channel.send(`Thank you for your purchase! I messaged you the contents of your ${set.name} Pack.`)
		return message.author.send(results.join('\n'))
	}).catch(err => {
		console.log(err)
		return message.channel.send(`Sorry, time's up.`)
	})
}

//BOX
if(cmd === `!box`) {
	const code = args[0] || 'FOA'
	if (code.startsWith('SS')) return message.channel.send(`Sorry, Starter Series cards are not sold by the box.`)
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
	if (!set.for_sale) return message.channel.send(`Sorry, ${set.name}${eval(set.emoji_1)} is out of stock.`)
	if (!set.packs_per_box) return message.channel.send(`Sorry, ${set.name}${eval(set.emoji_1)} is experiencing a glitch in the database. Please get an Admin to help you.`)

	const wallet = await Wallet.findOne( { where: { playerId: maid }, include: Player })
	if (!wallet) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	const money = wallet[set.currency]
	if (money < set.box_price) return message.channel.send(`Sorry, ${wallet.player.name}, you only have ${money}${eval(set.currency)} and ${set.name}${eval(set.emoji_1)} packs cost ${set.box_price}${eval(set.currency)}.`)

	const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`${wallet.player.name}, have ${money}${eval(set.currency)}. Do you want to spend ${set.box_price}${eval(set.currency)} on a ${set.name}${eval(set.emoji_1)} box?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send(`No problem. Have a nice day.`)
		
		const results = []
		for (let j = 0; j < set.packs_per_box; j++) {
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
	
			results.push(`\n${eval(set.emoji_1)} - ${set.name} Pack ${j + 1} - ${eval(set.emoji_2)}`)
	
			for (let i = 0; i < yourPack.length; i++) {
				const print = await Print.findOne({ where: {
					card_code: yourPack[i]
				}})
	
				if (!print.id) return console.log(`${card} does not exist in the Print database.`)
				results.push(`${eval(print.rarity)}${print.card_code} - ${print.card_name}`)
	
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
	
		}

		wallet[set.currency] -= set.box_price
		await wallet.save()

		for (let i = 0; i < results.length; i += ((set.cards_per_pack * 3) + 1) ) {
			message.author.send(results.slice(i, i + (set.cards_per_pack * 3) + 1))
		}

		return message.channel.send(`Thank you for your purchase! I messaged you the contents of your ${set.name} Box.`)
	}).catch(err => {
		console.log(err)
		return message.channel.send(`Sorry, time's up.`)
	})
}

//DUMP
if(cmd === `!dump`) {
	return
}

//SELL
if(cmd === `!sell`) {
	if (!args.length) return message.channel.send(`Please specify the card(s) you wish to sell.`)
	const buyer = message.mentions.users.first() ? message.mentions.users.first().id : merchbotId	
	if (buyer === maid) return message.channel.send(`You cannot sell cards to yourself.`)

	const sellingPlayer = await Player.findOne({ 
		where: { id: maid },
		include: Wallet
	})

	const buyingPlayer = await Player.findOne({ 
		where: { id: buyer },
		include: Wallet
	})

	if (!sellingPlayer) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	if (!buyingPlayer) return message.channel.send(`That user is not in the database.`)

	const inputs = args.join(' ').split('; ')
	if (buyer !== merchbotId && inputs.length > 1) return message.channel.send(`You cannot sell different cards to a player in the same transaction.`)
	const quantities = []
	const cards = []
	const prints = []
	sellerInvs = []		
	let price = buyer === merchbotId ? null : parseInt(args[args.length - 1])
	
	for (let i = 0; i < inputs.length; i++) {
		const arguments = inputs[i].split(' ')
		const quantity = isFinite(parseInt(arguments[0])) ? parseInt(arguments[0]) : isFinite(parseInt(arguments[1])) ? parseInt(arguments[1]) : 1
		const endOfQuery = buyer === merchbotId ? arguments.length : -1
		const query = isFinite(parseInt(arguments[0])) ? arguments.slice(1, endOfQuery).join(' ') : buyer !== merchbotId ? arguments.slice(1, endOfQuery).join(' ') : arguments.slice(0, endOfQuery).join(' ')
	
		if (buyer !== merchbotId && isNaN(price)) return message.channel.send(`Please specify your asking price in ${stardust} at the end of the command.`)
		if (!query) return message.channel.send(`Please specify the card(s) you wish to sell.`)

		const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
		const card_name = findCard(query, fuzzyPrints, fuzzyPrints2)
		const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	
		const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name) : null
		if (!print) return message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
		if (buyer === merchbotId) price += Math.ceil(print.market_price * 0.7) * quantity
		const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`

		const sellerInv = await Inventory.findOne({ 
			where: { 
				printId: print.id,
				playerId: maid,
				quantity: { [Op.gt]: 0 }
			}
		})

		if (!sellerInv) return message.channel.send(`You do not have any copies of ${card}.`)
		if (sellerInv.quantity < quantity) return message.channel.send(`You only have ${sellerInv.quantity} ${sellerInv.quantity > 1 ? 'copies' : 'copy'} of ${card}.`)
	
		quantities.push(quantity)
		prints.push(print)
		sellerInvs.push(sellerInv)
		cards.push(`${quantity} ${card}`)
	}

	if (buyer !== merchbotId && buyingPlayer.wallet.stardust < price) return message.channel.send(`Sorry, ${buyingPlayer.name} only has ${buyingPlayer.wallet.stardust}${stardust}.`)

	const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`Are you sure you want to sell${cards.length > 1 ? `:\n${cards.join('\n')}\nT` : ` ${cards[0]} t`}o ${buyer === merchbotId ? 'The Shop' : buyingPlayer.name} for ${price}${stardust}?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send(`No problem. Have a nice day.`)

		for (let i = 0; i < cards.length; i++) {
			const buyerInv = await Inventory.findOne({ 
				where: { 
					card_code: prints[i].card_code,
					printId: prints[i].id,
					playerId: buyer
				}
			})
	
			if (buyerInv) {
				buyerInv.quantity += quantities[i]
				await buyerInv.save()
			} else {
				await Inventory.create({ 
					card_code: prints[i].card_code,
					quantity: quantities[i],
					printId: prints[i].id,
					playerId: buyer
				})
			}
	
			sellerInvs[i].quantity -= quantities[i]
			await sellerInvs[i].save()
		}

		buyingPlayer.wallet.stardust -= parseInt(price)
		await buyingPlayer.wallet.save()

		sellingPlayer.wallet.stardust += parseInt(price)
		await sellingPlayer.wallet.save()
		
		return message.channel.send(`You sold ${cards.length > 1 ? `the following to The Shop for ${price}${stardust}:\n${cards.join('\n')}` : `${quantities[0]} ${quantities[0] > 1 ? 'copies' : 'copy'} of ${cards[0]} to ${buyingPlayer.name} for ${price}${stardust}.`}`)
	}).catch(err => {
		console.log(err)
		return message.channel.send(`Sorry, time's up.`)
	})
}

//BUY
if(cmd === `!buy`) {
	if (!args.length) return message.channel.send(`Please specify the card(s) you wish to buy.`)
	const seller = message.mentions.users.first() ? message.mentions.users.first().id : merchbotId	
	if (seller === maid) return message.channel.send(`You cannot buy cards from yourself.`)

	const buyingPlayer = await Player.findOne({ 
		where: { id: maid },
		include: Wallet
	})

	const sellingPlayer = await Player.findOne({ 
		where: { id: seller },
		include: Wallet
	})

	if (!buyingPlayer) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	if (!sellingPlayer) return message.channel.send(`That user is not in the database.`)

	const inputs = args.join(' ').split('; ')
	if (seller !== merchbotId && inputs.length > 1) return message.channel.send(`You cannot buy different cards from a player in the same transaction.`)
	const quantities = []
	const cards = []
	const prints = []
	sellerInvs = []		
	let price = seller === merchbotId ? null : parseInt(args[args.length - 1])
	
	for (let i = 0; i < inputs.length; i++) {
		const arguments = inputs[i].split(' ')
		const quantity = isFinite(parseInt(arguments[0])) ? parseInt(arguments[0]) : isFinite(parseInt(arguments[1])) ? parseInt(arguments[1]) : 1
		const endOfQuery = seller === merchbotId ? arguments.length : -1
		const query = isFinite(parseInt(arguments[0])) ? arguments.slice(1, endOfQuery).join(' ') : seller !== merchbotId ? arguments.slice(1, endOfQuery).join(' ') : arguments.slice(0, endOfQuery).join(' ')
	
		if (seller !== merchbotId && isNaN(price)) return message.channel.send(`Please specify your offer price in ${stardust} at the end of the command.`)
		if (!query) return message.channel.send(`Please specify the card(s) you wish to buy.`)

		const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
		const card_name = findCard(query, fuzzyPrints, fuzzyPrints2)
		const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	
		const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name) : null
		if (!print) return message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
		if (seller === merchbotId) price += Math.ceil(print.market_price * 1.1) * quantity
		const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`

		const sellerInv = await Inventory.findOne({ 
			where: { 
				printId: print.id,
				playerId: seller,
				quantity: { [Op.gt]: 0 }
			}
		})

		if (!sellerInv) return message.channel.send(`${seller === merchbotId ? `${card} is out of stock` : `${sellingPlayer.name} does not have any copies of ${card}`}.`)
		if (sellerInv.quantity < quantity) return message.channel.send(`${seller === merchbotId ? `The Shop only has ${sellerInv.quantity} ${sellerInv.quantity > 1 ? 'copies' : 'copy'} of ${card} in stock.` : `${sellingPlayer.name} only has ${sellerInv.quantity} ${sellerInv.quantity > 1 ? 'copies' : 'copy'} of ${card}.`}`)
	
		quantities.push(quantity)
		prints.push(print)
		sellerInvs.push(sellerInv)
		cards.push(`${quantity} ${card}`)
	}

	if (buyingPlayer.wallet.stardust < price) return message.channel.send(`Sorry, you only have ${buyingPlayer.wallet.stardust}${stardust} and ${cards.length === 1 ? `${cards[0]} costs ${price}${stardust}.` : `the following cards cost ${price}${stardust}:\n${cards.join('\n')}`}`)

	const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`Are you sure you want to buy${cards.length > 1 ? `:\n${cards.join('\n')}\nF` : ` ${cards[0]} f`}rom ${seller === merchbotId ? 'The Shop' : sellingPlayer.name} for ${price}${stardust}?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send(`No problem. Have a nice day.`)

		for (let i = 0; i < cards.length; i++) {
			const buyerInv = await Inventory.findOne({ 
				where: { 
					card_code: prints[i].card_code,
					printId: prints[i].id,
					playerId: maid
				}
			})
	
			if (buyerInv) {
				buyerInv.quantity += quantities[i]
				await buyerInv.save()
			} else {
				await Inventory.create({ 
					card_code: prints[i].card_code,
					quantity: quantities[i],
					printId: prints[i].id,
					playerId: maid
				})
			}
	
			sellerInvs[i].quantity -= quantities[i]
			await sellerInvs[i].save()
		}

		buyingPlayer.wallet.stardust -= parseInt(price)
		await buyingPlayer.wallet.save()

		sellingPlayer.wallet.stardust += parseInt(price)
		await sellingPlayer.wallet.save()
		
		return message.channel.send(`You bought ${cards.length > 1 ? `the following from The Shop for ${price}${stardust}:\n${cards.join('\n')}` : `${quantities[0]} ${quantities[0] > 1 ? 'copies' : 'copy'} of ${cards[0]} from ${sellingPlayer.name} for ${price}${stardust}.`}`)
	}).catch(err => {
		console.log(err)
		return message.channel.send(`Sorry, time's up.`)
	})
}

//BARTER
if(cmd === `!barter`) {
	return
}

//BID
if(cmd === `!bid`) {
	return
}

//BIDS
if(cmd === `!bids` || cmd === `!allbids` || cmd === `!mybids`) {
	return
}

//CANCEL
if(cmd === `!cancel` || cmd === `!cancelbid`) {
	return
}

//TRADE
if(cmd === `!trade`) {
	if (!args.length) return message.channel.send(`Please specify the card(s) you wish to trade.`)
	const partner = message.mentions.users.first() ? message.mentions.users.first().id : null
	if (partner === maid) return message.channel.send(`You cannot trade cards with yourself.`)	
	if (!partner) return message.channel.send(`Please tag the user you want to trade with.`)
	
	const initiatingPlayer = await Player.findOne({ 
		where: { id: maid },
		include: Wallet
	})

	const receivingPlayer = await Player.findOne({ 
		where: { id: partner },
		include: Wallet
	})

	if (!initiatingPlayer) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	if (!receivingPlayer) return message.channel.send(`That user is not in the database.`)

	const inputs = args.join(' ').split('; ')
	const quantities = []
	const cards = []
	const prints = []
	initiatorInvs = []
	
	for (let i = 0; i < inputs.length; i++) {
		const arguments = inputs[i].split(' ')
		const quantity = isFinite(parseInt(arguments[0])) ? parseInt(arguments[0]) : isFinite(parseInt(arguments[1])) ? parseInt(arguments[1]) : 1
		const query = isFinite(parseInt(arguments[0])) ? arguments.slice(1).join(' ') : isFinite(parseInt(arguments[1])) ? arguments.slice(2).join(' ') : arguments.join(' ')
		if (!query) return message.channel.send(`Please specify the card(s) you wish to trade.`)

		const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
		const card_name = findCard(query, fuzzyPrints, fuzzyPrints2)
		const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	
		const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, maid, card_name) : null
		if (!print) return message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
		const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`

		const initiatorInv = await Inventory.findOne({ 
			where: { 
				printId: print.id,
				playerId: maid,
				quantity: { [Op.gt]: 0 }
			}
		})

		if (!initiatorInv) return message.channel.send(`You do not have any copies of ${card}.`)
		if (initiatorInv.quantity < quantity) return message.channel.send(`You only have ${initiatorInv.quantity} ${initiatorInv.quantity > 1 ? 'copies' : 'copy'} of ${card}.`)
	
		quantities.push(quantity)
		prints.push(print)
		initiatorInvs.push(initiatorInv)
		cards.push(`${quantity} ${card}`)
	}

	const initiator_confirmation = await getInitiatorConfirmation(message, cards, receivingPlayer)
	if (!initiator_confirmation) return message.channel.send(`No problem. Have a nice day.`)
	const partner_side = await getPartnerSide(message, cards, receivingPlayer)
	const partner_inputs = partner_side.join(' ').split('; ')
	const partner_quantities = []
	const partner_cards = []
	const partner_prints = []
	partnerInvs = []
	
	for (let i = 0; i < partner_inputs.length; i++) {
		const arguments = partner_inputs[i].split(' ')
		const quantity = isFinite(parseInt(arguments[0])) ? parseInt(arguments[0]) : isFinite(parseInt(arguments[1])) ? parseInt(arguments[1]) : 1
		const query = isFinite(parseInt(arguments[0])) ? arguments.slice(1).join(' ') : arguments.join(' ')
		if (!query) return message.channel.send(`Please specify the card(s) you wish to trade.`)

		const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
		const card_name = findCard(query, fuzzyPrints, fuzzyPrints2)
		const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	
		const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, partner, card_name) : null
		if (!print) return message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
		const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`

		const partnerInv = await Inventory.findOne({ 
			where: { 
				printId: print.id,
				playerId: partner,
				quantity: { [Op.gt]: 0 }
			}
		})

		if (!partnerInv) return message.channel.send(`You do not have any copies of ${card}.`)
		if (partnerInv.quantity < quantity) return message.channel.send(`You only have ${partnerInv.quantity} ${partnerInv.quantity > 1 ? 'copies' : 'copy'} of ${card}.`)
	
		partner_quantities.push(quantity)
		partner_prints.push(print)
		partnerInvs.push(partnerInv)
		partner_cards.push(`${quantity} ${card}`)
	}

	const partner_confirmation = await getPartnerConfirmation(message, partner_cards, receivingPlayer)
	if (!partner_confirmation) return message.channel.send(`No problem. Have a nice day.`)
	const final_confirmation = await getFinalConfirmation(message, partner_cards, initiatingPlayer)
	if (!final_confirmation) return message.channel.send(`Sorry, ${receivingPlayer.name}, this trade has been rejected.`)

	for (let i = 0; i < initiatorInvs.length; i++) {
		initiatorInvs[i].quantity -= quantities[i]
		await initiatorInvs[i].save()
	
		const partnerInv2 = await Inventory.findOne({ 
			where: { 
				card_code: prints[i].card_code,
				printId: prints[i].id,
				playerId: partner
			}
		})
	
		if (partnerInv2) {
			partnerInv2.quantity += quantities[i]
			await partnerInv2.save()
		} else {
			await Inventory.create({ 
				card_code: prints[i].card_code,
				quantity: quantities[i],
				printId: prints[i].id,
				playerId: partner
			})
		}
	}

	for (let i = 0; i < partnerInvs.length; i++) {
		partnerInvs[i].quantity -= partner_quantities[i]
		await partnerInvs[i].save()
	
		const initiatorInv2 = await Inventory.findOne({ 
			where: { 
				card_code: partner_prints[i].card_code,
				printId: partner_prints[i].id,
				playerId: maid
			}
		})
	
		if (initiatorInv2) {
			initiatorInv2.quantity += partner_quantities[i]
			await initiatorInv2.save()
		} else {
			await Inventory.create({ 
				card_code: partner_prints[i].card_code,
				quantity: partner_quantities[i],
				printId: partner_prints[i].id,
				playerId: maid
			})
		}
	}

	message.channel.send(`${receivingPlayer.name} received:\n${cards.join("\n")}\n...and...`)
	return setTimeout(() => message.channel.send(`${initiatingPlayer.name} received:\n${partner_cards.join("\n")}\n...Trade complete!`), 3000)
}

//GAUNTLET
if(cmd === `!challenge` || cmd === `!gauntlet`) {
	if(message.channel.id !== "639907734589800458") { return message.channel.send("This command is not valid outside of the <#639907734589800458> channel.") }

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

	if (status['gauntlet'] == 'confirming') { return message.reply("The Gauntlet confirmation process is currently underway. Please wait."); }

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

		status['gauntlet'] = "confirming";
		fs.writeFile("./status.json", JSON.stringify(status), (err) => {
			if (err) console.log(err) });

	return Merch.data.getGauntletConfirmation(client, message, maid, rMem);
}

//NICKNAMES
if(cmd === `!nicknames` || cmd === `!nicks`) {
	return
}

//UPDATE
if(cmd === `!update`) {
	return
}

//OPEN
if(cmd === `!open`) {
	return
}

//CLOSE
if(cmd === `!close`) {
	return
}

//ADJUST
if(cmd === `!adjust`) {
	return
}

})
