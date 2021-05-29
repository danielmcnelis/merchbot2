
const Discord = require('discord.js')
const fs = require('fs')
const { Op } = require('sequelize')
const { FOA, merchant, FiC, approve, lmfao, god, legend, master, diamond, platinum, gold, silver, bronze, ROCK, sad, mad, beast, dragon, machine, spellcaster, warrior, zombie, starchips, stardust, com, rar, sup, ult, scr, checkmark, emptybox } = require('./static/emojis.json')
const { checklistcom, startcom, infocom, dbcom, noshowcom, legalcom, listcom, pfpcom, botcom, rolecom, statscom, profcom, losscom, h2hcom, undocom, rankcom, manualcom, deckscom, replayscom, yescom, nocom } = require('./static/commands.json')
const { botRole, modRole, adminRole, tourRole, toRole, fpRole, muteRole, arenaRole } = require('./static/roles.json')
const { welcomeChannel, announcementsChannel, registrationChannel, duelRequestsChannel, marketPlaceChannel, shopChannel, tournamentChannel, arenaChannel, keeperChannel, triviaChannel, draftChannel, gauntletChannel } = require('./static/channels.json')
const { ss1_warrior, ss1_spellcaster } = require('./static/starter_decks.json')
const types = require('./static/types.json')
const status = require('./static/status.json')
const errors = require('./static/errors.json')
const muted = require('./static/muted.json')
const { Card, Match, Player, Tournament, Print, Set, Wallet, Diary, Inventory, Arena, Trivia, Keeper, Gauntlet, Draft, Daily, Binder, Wishlist, Profile } = require('./db')
const { hasProfile, capitalize, restore, recalculate, revive, createProfile, createPlayer, isNewUser, isAdmin, isMod, getMedal, checkDeckList, getRandomElement, getRandomSubset } = require('./functions/utility.js')
const { saveYDK, saveAllYDK } = require('./functions/decks.js')
const { seed, askForDBUsername, getDeckListTournament, directSignUp, removeParticipant, getParticipants, findOpponent } = require('./functions/tournament.js')
const { makeSheet, addSheet, writeToSheet } = require('./functions/sheets.js')
const { askForCardSlot } = require('./functions/print.js')
const { uploadDeckFolder } = require('./functions/drive.js')
const { client, challongeClient } = require('./static/clients.js')

//READY 
client.on('ready', () => console.log('MerchBot is online!'))
  
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
	const card_name = message.content.slice(1 , -1)

	const card = await Card.findOne({ 
		where: { 
			name: {
				[Op.iLike]: card_name
			}
		}
	})
	if (!card) return message.channel.send(`Could not find card: {${card_name}}`)
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

		return askForCardSlot(client, message, message.member, card_name, card.id, set_code, set_id)
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
		keys.forEach(async function(key) {
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
		})

		if (!starterDeck) return message.channel.send('You did not select a valid Starter Deck. Please type the **!start** command to try again.')
		await createProfile(maid, starterDeck.slice(4))

		return message.channel.send('Congratulations, you have begun the game!')
	}).catch(err => {
		return message.channel.send('You did not respond in time. Please type the **!start** command to try again.')
	})
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

//EDIT //not working
if(cmd == `!edit`) {
	const profile = Profile.findOne({ where: { playerId: maid } })
	if(!profile) return message.channel.send(`You are not in the FiC4 database. Type **!start** to begin playing.`)
	return getColor(client, message, maid)
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


//PROFILE //not working
if(cmd == `!prof` || cmd == `!profile`) {
	let database = fs.readFileSync('sds023.json');

	favoritecard = favorites[rMem];
	if(favoritecard == 0 && firstDeck[rMem] == 'warrior') { favoritecard = 'https://i.imgur.com/k4uXQz3.jpg'; }
	if(favoritecard == 0 && firstDeck[rMem] == 'spellcaster') { favoritecard = 'https://i.imgur.com/ztKTyi3.jpg'; }
	if(favoritecard == 0 && firstDeck[rMem] == 'fairy') { favoritecard = 'https://i.imgur.com/BCzo7Ru.jpg'; }
	if(favoritecard == 0 && firstDeck[rMem] == 'plant') { favoritecard = 'https://i.imgur.com/0IUFu0W.jpg'; }
	if(favoritecard == 0 && firstDeck[rMem] == 'beast') { favoritecard = 'https://i.imgur.com/PVn3ptZ.jpg'; }
	if(favoritecard == 0 && firstDeck[rMem] == 'zombie') { favoritecard = 'https://i.imgur.com/wJupnEA.jpg'; }
	if(favoritecard == 0 && firstDeck[rMem] == 'psychic') { favoritecard = 'https://i.imgur.com/cRrbGVr.jpg'; }
	if(favoritecard == 0 && firstDeck[rMem] == 'fiend') { favoritecard = 'https://i.imgur.com/SBGjC0x.jpg'; }
	if(favoritecard == 0 && firstDeck[rMem] == 'dinosaur') { favoritecard = 'https://i.imgur.com/6n2pZeq.jpg'; }
	if(favoritecard == 0 && firstDeck[rMem] == 'fish') { favoritecard = 'https://i.imgur.com/c2IMBOE.jpg'; }

	quote = quotes[rMem];
	if(quote == 0) { quote = 'My Grandpa\'s deck has no pathetic cards.'; }

	speaker = speakers[rMem];
	if(speaker == 0) { speaker = 'Yugi'; }

	const profileEmbed = new Discord.RichEmbed()
		.setColor(colour)
		.setThumbnail(person.avatarURL)
		.setTitle('**' + names[rMem] + '\'s Player Profile**')
		.setDescription('Member Since: ' + month + ' ' + day + ', ' + year + '\nFirst Deck: ' + starterdeck)
		.addField('Diary Progress', 'Easy Diary: ' + easyEmote + '\nModerate Diary: ' + moderateEmote + '\nHard Diary: ' + hardEmote + '\nElite Diary: ' + eliteEmote)
		.addField('Ranked Stats', 'Best Medal: ' + medal + '\nWin Rate: ' + winrate + '\nHighest Elo: ' + bestStats[rMem].toFixed(2) + '\nVanquished Foes: ' + uniqueWins[rMem] + '\nLongest Streak: ' + bestStreaks[rMem])
		.addField('Arena Stats', 'Beast Wins: ' + beastWins[rMem] + ' ' + beasts + '\nDragon Wins: ' + dragonWins[rMem] + ' ' + dragons + '\nMachine Wins: ' + machineWins[rMem] + ' ' + machines + '\nSpellcaster Wins: ' + spellcasterWins[rMem] + ' ' + spellcasters + '\nWarrior Wins: ' + warriorWins[rMem] + ' ' + warriors + '\nZombie Wins: ' + zombieWins[rMem] + ' ' + zombies + '\nFairy Wins: ' + fairyWins[rMem] + ' ' + fairies + '\nInsect Wins: ' + insectWins[rMem] + ' ' + insects + '\nPlant Wins: ' + plantWins[rMem] + ' ' + plants + '\nRock Wins: ' + rockWins[rMem] + ' ' + rocks + '\nWater Wins: ' + waterWins[rMem] + ' ' + waters + '\nWind Wins: ' + windWins[rMem] + ' ' + winds + '\nFiend Wins: ' + fiendWins[rMem] + ' ' + fiends + '\nPsychic Wins: ' + psychicWins[rMem] + ' ' + psychics)
		.addField('Other Stats', 'Net Worth: ' + net + starchip + '\nTrade Partners: ' + uniquePartners[rMem] + '\nKeeper Wins: ' + keeperWins[rMem] + '\nKeeper Win Rate: ' + keeperWinrate + '\nTrivia Wins: ' + triviaWins[rMem] + '\nTrivia Answers: ' + smarts + ' out of ' + 500)
		.setImage(favoritecard)
		.setFooter('\"' + quote + '\" -- ' + speaker);

	if(message.channel.id !== "586621036347260928") {
		return client.channels.get("587519455278399488").send(profileEmbed)
	} else {
		return client.channels.get("586621036347260928").send(profileEmbed)
	}
}

//REFERRAL //not working
if(cmd === `!ref` || cmd === `!refer` || cmd === `!referral`) {
	return Merch.data.awardStarchips(client, message, rMem, 30)
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
	const eliteEmbed = new Discord.RichEmbed()
		.setThumbnail('https://i.imgur.com/rGgVdBm.jpg')
		.addField(diary, prompt1 + "\n" + prompt2 + "\n" + prompt3 + "\n" + prompt4 + "\n" + prompt5 + "\n" + prompt6)
		.addField(bonus,'1) +1 Daily use of Alchemy.\n2) +1 Free Pack per week.\n3) Tournament Bonus - Extra Packs.')

	message.author.send(eliteEmbed);
	return message.channel.send("I messaged you the Elite Diary that you requested.")
}

//BINDER //not working
if(cmd === `!bind` || cmd === `!binder`) {
	return
}

//SEARCH //not working
if(cmd === `!search`) {
	return
}

//WISHLIST //not working
if(cmd === `!wish` || cmd === `!wishlist`) {
	return
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
	if (winningPlayer.stats > winningPlayer.bestStats) winningPlayer.bestStats = winningPlayer.stats
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
	if (winningPlayer.stats > winningPlayer.bestStats) winningPlayer.bestStats = winningPlayer.stats
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
	return
}

//ALCHEMY
if(cmd === `!alc` ||cmd === `!alch` || cmd === `!alchemy`) {
	return
}

//AWARDS
if(cmd === `!award`) {
	const recipient = args[0].replace(/[\\<>@#&!]/g, "")
	const item = args[1]
	if (!recipient) return message.channel.send(`Please @ mention a user to award.`)
	if (!item) return message.channel.send(`Please specify the item you wish to award.`)

	const player = await Player.findOne({ where: { id: recipient } })
	if (!player) return message.channel.send(`That user is not in the database.`)

	return message.channel.send('Perhaps another time would be better.')
}

//STEAL
if(cmd === `!steal`) {
	return message.channel.send('Perhaps another time would be better.')
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

		allWallets.forEach(async function(wallet) {
			wallet.stardust += wallet.starchips * 10
			wallet.starchips = 0
			await wallet.save()
		})
	
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
	const inventory = await Inventory.findAll({ 
		where: { playerId: maid },
		include: Print,
		order: [['card_code', 'ASC']]
	})

	if (!inventory) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)

	const results = []
	const codes = []

	for (let i = 0; i < inventory.length; i++) {
		const row = inventory[i]
		const code = row.card_code.slice(0,3)

		try {
			if (!codes.includes(code)) {
				codes.push(code)
				const set = await Set.findOne({ where: { code } })
				if (set) results.push(`\n\n${eval(set.emoji_1)} --- ${set.name} --- ${eval(set.emoji_2)}`) 
			}
		} catch (err) {
			console.log(err)
		}

		results.push(`${eval(row.print.rarity)}${row.card_code} - ${row.print.card_name} - ${row.quantity}`) 
	}

	for (let i = 0; i < results.length; i += 30) {
		message.author.send(results.slice(i, i+30))
	}

	return message.channel.send(`I messaged you the Inventory you requested.`)
}

//CHECKLIST
if(checklistcom.includes(cmd)) {
	const inventory = await Inventory.findAll({ 
		where: { playerId: maid },
		include: Print,
		order: [['card_code', 'ASC']]
	})

	const allPrints = await Print.findAll({ 
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
				if (set) results.push(`\n${eval(set.emoji_1)} --- ${set.name} --- ${eval(set.emoji_2)}`) 
			}
		} catch (err) {
			console.log(err)
		}

		const box_emoji = cards.includes(row.card_code) ? checkmark : emptybox

		results.push(`${box_emoji} ${eval(row.rarity)}${row.card_code} - ${row.card_name}`) 
	}

	for (let i = 0; i < results.length; i += 30) {
		message.author.send(results.slice(i, i+30))
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

		//wallet[set.currency] -= set.unit_price
		//await wallet.save()

		return message.channel.send(`You purchased a pack!`)
	}).catch(err => {
		console.log(err)
		return message.channel.send(`Sorry, time's up.`)
	})
}

//BOX
if(cmd === `!box`) {
	const code = args[0] || 'FOA'
	const set = await Set.findOne({ where: { code: code.toUpperCase() }})
	if (!set) return message.channel.send(`There is no set with the code "${code.toUpperCase()}".`)
	if (!set.for_sale) return message.channel.send(`Sorry, ${set.name}${eval(set.emoji_1)} is out of stock.`)

	const wallet = await Wallet.findOne( { where: { playerId: maid }, include: Player })
	if (!wallet) return message.channel.send(`You are not in the database. Type **!start** to begin the game.`)
	const money = wallet[set.currency]
	if (money < set.box_price) return message.channel.send(`Sorry, ${wallet.player.name}, you only have ${money}${eval(set.currency)} and ${set.name}${eval(set.emoji_1)} boxes cost ${set.box_price}${eval(set.currency)}.`)

	const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`${wallet.player.name}, have ${money}${eval(set.currency)}. Do you want to spend ${set.box_price}${eval(set.currency)} on a ${set.name}${eval(set.emoji_1)} box?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		if (!yescom.includes(collected.first().content.toLowerCase())) return message.channel.send(`No problem. Have a nice day.`)

		wallet[set.currency] -= set.box_price
		await wallet.save()

		return message.channel.send(`You purchased a box!`)
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
	return
}

//BUY
if(cmd === `!buy`) {
	return
}

//BARTER
if(cmd === `!barter`) {
	return
}

//BID
if(cmd === `!bid`) {
	return
}

//BID
if(cmd === `!bids` || cmd === `!allbids` || cmd === `!mybids`) {
	return
}

//CANCEL
if(cmd === `!cancel` || cmd === `!cancelbid`) {
	return
}

//TRADE
if(cmd === `!trade`) {
	return
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
