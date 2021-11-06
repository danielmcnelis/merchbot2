
//UTILITY FUNCTIONS

const { adminRole, ambassadorRole, arenaRole, draftRole, modRole, tourRole } = require('../static/roles.json')
const { mad, sad, rocks, bronze, silver, gold, platinum, diamond, master, legend, god } = require('../static/emojis.json')
const { Op } = require('sequelize')
const { Arena, Auction, Binder, Card, Daily, Diary, Draft, Gauntlet, Info, Inventory, Knowledge, Match, Player, Print, Profile, Reset, Set, Tournament, Trade, Trivia, Wallet, Wishlist  } = require('../db/index.js')
const merchbotId = '584215266586525696'
const quotes = require('../static/quotes.json')

//CREATE PLAYER
const createPlayer = async (id, username = null, tag = null, muted = false) => {
    try {
        await Player.create({
            id: id,
            name: username,
            tag: tag,
            muted: muted
        })
    } catch (err) {
        console.log(err)
    }
}

// RESET PLAYER
const resetPlayer = async (message, player) => {
    const invs = await Inventory.findAll({ where: { playerId: player.id }, order: [["card_code", "ASC"]] })

    for (let i = 0; i < invs.length; i++) {
        const inv = invs[i]
        const quantity = inv.quantity
        const printId = inv.printId
        const card_code = inv.card_code

        const count = await Inventory.count({ 
			where: { 
				printId: printId,
				playerId: merchbotId
			}
		})

        if (!count) {
            console.log(`Creating ${card_code} Inventory for MerchBot.`)
            await Inventory.create({ 
                card_code: card_code,
                printId: printId,
                playerId: merchbotId
            })
        }

		const merchbot_inv = await Inventory.findOne({ 
			where: { 
				printId: printId,
				playerId: merchbotId
			}
		})

        if (!merchbot_inv) return message.channel.send(`Database error: Could not find or create MerchBot Inventory for: ${card_code}.`)

        if (merchbot_inv.quantity <= 0) {
            const auction = await Auction.findOne({ where: { card_code: card_code, printId: printId }})
            if (!auction) {
                console.log(`Create Auction for ${card_code}.`)
                await Auction.create({
                    card_code: card_code,
                    quantity: quantity,
                    printId: printId
                })
            } else {
                console.log(`Adding ${quantity} ${card_code} to the Auction.`)
                auction.quantity += quantity
                await auction.save()
            }
        }

        console.log(`Donating ${quantity} ${card_code} to MerchBot.`)
        merchbot_inv.quantity += quantity
        await merchbot_inv.save()

        console.log(`Destroying ${player.name}'s ${card_code} Inventory.`)
        await inv.destroy()
    }

    console.log('RESETING ALL PLAYER STATS NOW!')
    player.stats = 500
    player.backup = 0
    player.wins = 0
    player.losses = 0
    player.vanquished_foes = 0
    player.best_stats = 500
    player.current_streak = 0
    player.longest_streak = 0
    player.arena_wins = 0
    player.arena_losses = 0
    player.arena_stats = 500
    player.arena_backup = 0
    player.keeper_wins = 0
    player.keeper_losses = 0
    player.keeper_stats = 500
    player.keeper_backup = 0
    player.draft_wins = 0
    player.draft_losses = 0
    player.draft_stats = 500
    player.draft_backup = 0
    player.gauntlet_wins = 0
    player.gauntlet_losses = 0
    player.gauntlet_stats = 500
    player.gauntlet_backup = 0
    player.pauper_wins = 0
    player.pauper_losses = 0
    player.pauper_stats = 500
    player.pauper_backup = 0
    await player.save()

    console.log('DELETING ALL PLAYER PROFILE FIELDS NOW!')
    const binder = await Binder.findOne({ where: { playerId: player.id }})
    await binder.destroy()

    const daily = await Daily.findOne({ where: { playerId: player.id }})
    await daily.destroy()

    const diary = await Diary.findOne({ where: { playerId: player.id }})
    await diary.destroy()

    const knowledge = await Knowledge.findOne({ where: { playerId: player.id }})
    await knowledge.destroy()

    const profile = await Profile.findOne({ where: { playerId: player.id }})
    await profile.destroy()

    const wallet = await Wallet.findOne({ where: { playerId: player.id }})
    await wallet.destroy()

    const wishlist = await Wishlist.findOne({ where: { playerId: player.id }})
    await wishlist.destroy()

    console.log('SAVING RESET DATE!')
    const date = new Date()
    await Reset.create({ 
        date: date,
        playerId: player.id
    })
    
    player.last_reset = date
    await player.save()

    return message.channel.send(`Your account has been successfully reset. All your cards and progress have been wiped.`)
}

//GET RANDOM STRING
const getRandomString = (length, chars) => {
    let result = '';
    for (let i = length; i > 0; --i) {
        result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
}

//CONVERT CARDS ARRAY TO OBJECT
const convertArrayToObject = (arr) => {
    const obj = {}
    arr.forEach(elem => {
        if (!obj[elem]) {
            obj[elem] = 1
        } else {
            obj[elem]++
        }
    })
    return obj
}

//CREATE PROFILE
const createProfile = async (playerId, starter) => {
    const card = starter === 'reptile' ? 'Dark Alligator' :
        starter === 'warrior' ? 'Gilford the Lightning' :
        starter === 'dragon' ? 'White-Horned Dragon' :
        starter === 'spellcaster' ? 'Dark Red Enchanter' :
        starter === 'dinosaur' ? 'Sauropod Brachion' :
        starter === 'plant' ? 'Sylvan Guardioak' :
        starter === 'fish' ? 'Rage of the Deep Sea' :
        starter === 'rock' ? 'Guardian Sphinx' :
        null
    const date = new Date()
    const month = `0${date.getMonth() + 1}`
    const day = `0${date.getDate()}`
    const year = `${date.getFullYear()}`

    const elem = getRandomElement(quotes)
    const quote = elem.quote
    const author = elem.author
    
    const colors = ['#f53636', '#fc842d', '#fceb77', '#63d46d', '#3c91e6', '#5c5fab', '#ed1a79', '#eb7cad', '#f0bf3a', '#bccbd6']
    const color = getRandomElement(colors)

    try {
        await Binder.create({playerId})
        await Daily.create({playerId})
        await Diary.create({playerId})
        await Knowledge.create({playerId})
        await Profile.create({
            playerId,
            starter,
            card,
            color,
            quote,
            author,
            start_date: `${[year, month.slice(-2), day.slice(-2)].join('-')}`
        })
        await Wallet.create({playerId})
        await Wishlist.create({playerId})
    } catch (err) {
        console.log(err)
    }
}

//RECALCULATE
const recalculate = async (match, z) => {
    const winnerId = match.winnerId
    const loserId = match.loserId
    const winningPlayer = await Player.findOne({ where: { id: winnerId }})
    const losingPlayer = await Player.findOne({ where: { id: loserId }})
    const origStatsWinner = winningPlayer.stats
	const origStatsLoser = losingPlayer.stats
	const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origStatsWinner - origStatsLoser) / 400))))))
    const previouslyDefeated = await Match.count({
        where: {
            winnerId: winningPlayer.id,
            loserId: losingPlayer.id,
            createdAt: { [Op.lt]: match.createdAt }
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

    match.delta = delta
    await match.save()
    console.log(`Match ${z}: a loss by ${losingPlayer.name} to ${winningPlayer.name} has been incorporated in the recalculation.`)
}


//IS NEW USER?
const isNewUser = async (playerId) => {
    const count = await Player.count({ where: { id: playerId } })
    return !count
}

//IS JAZZ?
const isJazz = (member) => member.user.id === '194147938786738176'

//IS ADMIN?
const isAdmin = (member) => member.roles.cache.some(role => role.id === adminRole || member.user.id === '194147938786738176')

//IS MOD?
const isMod = (member) => member.roles.cache.some(role => role.id === modRole || role.id === adminRole || member.user.id === '194147938786738176')

//IS AMBASSADOR?
const isAmbassador = (member) => member.roles.cache.some(role => role.id === ambassadorRole || role.id === modRole || role.id === adminRole || member.user.id === '194147938786738176')

//IS ARENA PLAYER?
const isArenaPlayer = (member) => member.roles.cache.some(role => role.id === arenaRole)

//IS DRAFT PLAYER?
const isDraftPlayer = (member) => member.roles.cache.some(role => role.id === draftRole)

//IS TOUR PLAYER?
const isTourPlayer = (member) => member.roles.cache.some(role => role.id === tourRole || role.id === '864960157758914570')

//HAS PROFILE?
const hasProfile = async (playerId) => {
    const profile = await Profile.findOne({ where: { playerId }})
    return !!profile
}

//IS VOWEL?
const isVowel = (char) => /^[aeiou]$/.test(char.toLowerCase())

//GET ARENA VICTORIES
const getArenaVictories = (p) => p.beast_wins + p.dinosaur_wins + p.dragon_wins + p.fiend_wins + p.fish_wins + p.plant_wins + p.reptile_wins + p.rock_wins + p.spellcaster_wins + p.thunder_wins + p.warrior_wins + p.zombie_wins

//GET MEDAL
const getMedal = (stats, title = false) => {
    if (title) {
        return stats <= 230 ? `Tilted ${mad}`
        : (stats > 230 && stats <= 290) ?  `Chump ${sad}`
        : (stats > 290 && stats <= 350) ?  `Rock ${rocks}`
        : (stats > 350 && stats <= 410) ?  `Bronze ${bronze}`
        : (stats > 410 && stats <= 470) ?  `Silver ${silver}`
        : (stats > 470 && stats <= 530) ?  `Gold ${gold}`
        : (stats > 530 && stats <= 590) ?  `Platinum ${platinum}`
        : (stats > 590 && stats <= 650) ?  `Diamond ${diamond}`
        : (stats > 650 && stats <= 710) ?  `Master ${master}`
        : (stats > 710 && stats <= 770) ?  `Legend ${legend}`
        : `Deity ${god}`
    } else {
        return stats <= 230 ? mad
        : (stats > 230 && stats <= 290) ? sad
        : (stats > 290 && stats <= 350) ? rocks
        : (stats > 350 && stats <= 410) ? bronze
        : (stats > 410 && stats <= 470) ? silver
        : (stats > 470 && stats <= 530) ? gold
        : (stats > 530 && stats <= 590) ? platinum
        : (stats > 590 && stats <= 650) ? diamond
        : (stats > 650 && stats <= 710) ? master
        : (stats > 710 && stats <= 770) ? legend
        : god
    }
}


//CAPITALIZE
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

//GET RANDOM ELEMENT
const getRandomElement = (arr) => {
    const index = Math.floor((arr.length) * Math.random())
    return arr[index]
}

//GET RANDOM SUBSET
const getRandomSubset = (arr, n) => {
    const shuffledArr = arr.slice(0)
    let i = arr.length
    let temp
    let index

    while (i--) {
        index = Math.floor((i + 1) * Math.random())
        temp = shuffledArr[index]
        shuffledArr[index] = shuffledArr[i]
        shuffledArr[i] = temp
    }

    return shuffledArr.slice(0, n)
}

//SHUFFLE ARRAY
const shuffleArray = (arr) => {
    let i = arr.length
    let temp
    let index

    while (i--) {
        index = Math.floor((i + 1) * Math.random())
        temp = arr[index]
        arr[index] = arr[i]
        arr[i] = temp
    }

    return arr
}

//IS SAME DAY
const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()


//IS WITHIN X HOURS
const isWithinXHours = (x = 24, t1, t2) => Math.abs(t1 - t2) <= (x * 60 * 60 * 1000)


//GET DECK CATEGORY
const getDeckCategory = (deckType) => {
    return (deckType === 'aggro bomb') ? 'aggro'
        : (deckType === 'counter fairy') ? 'lockdown'
        : (deckType === 'ben kei otk') ? 'combo'
        : (deckType === 'cat control') ? 'control'
        : 'other'
}

module.exports = {
    capitalize,
    convertArrayToObject,
    createPlayer,
    createProfile,
    getArenaVictories,
    getDeckCategory,
    getMedal,
    getRandomElement,
    getRandomString,
    getRandomSubset,
    hasProfile,
    isAdmin,
    isAmbassador,
    isArenaPlayer,
    isDraftPlayer,
    isJazz,
    isMod,
    isTourPlayer,
    isNewUser,
    isSameDay,
    isVowel,
    isWithinXHours,
    recalculate,
    resetPlayer,
    shuffleArray
}
