
//UTILITY FUNCTIONS

const { adminRole, modRole } = require('../static/roles.json')
const { mad, sad, ROCK, bronze, silver, gold, platinum, diamond, master, legend, god, approve } = require('../static/emojis.json')
const Names = require('../static/names.json')
const { Arena, Binder, Card, Daily, Diary, Draft, Gauntlet, Inventory, Knowledge, Match, Player, Print, Profile, Set, Tournament, Trade, Trivia, Wallet, Wishlist  } = require('../db/index.js')

//CREATE PLAYER
const createPlayer = async (id, username = null, tag = null) => {
    try {
        await Player.create({
            id: `${id}`,
            name: `${username}`,
            tag: `${tag}`
        })
    } catch (err) {
        console.log(err)
    }
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
const convertCardsArrayToObject = (arr) => {
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
const createProfile = async (playerId, first_deck) => {
    const favorite_card = first_deck === 'warrior' ? 'Freed the Matchless General' : 'Chaos Command Magician'
    const date = new Date()
    const month = `0${date.getMonth() + 1}`
    const day = `0${date.getDate()}`
    const year = `${date.getFullYear()}`
    
    try {
        await Binder.create({playerId})
        await Daily.create({playerId})
        await Diary.create({playerId})
        await Knowledge.create({playerId})
        await Profile.create({
            playerId,
            first_deck,
            favorite_card,
            start_date: `${[year, month.slice(-2), day.slice(-2)].join('-')}`
        })
        await Wallet.create({playerId})
        await Wishlist.create({playerId})
    } catch (err) {
        return console.log(err)
    }
}


//REVIVE
const revive = async (playerId, z) => {
	return setTimeout(async function() {
        const player = await Player.findOne({ where: { id: playerId }})

        if (!player) {
            const username = Names[playerId] ? Names[playerId] : null
            await createPlayer(playerId, username)
        }
    }, z*100)
}

//RESTORE
const restore = async (winner, loser, z) => {
    return setTimeout(async function() {
        const winnersRow = await Match.findOne({ where: { playerId: winner }})
        const losersRow = await Match.findOne({ where: { playerId: loser }})

        const statsLoser = losersRow.stats
        const statsWinner = winnersRow.stats
        winnersRow.backup = statsWinner
        losersRow.backup = statsLoser
        const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((statsWinner - statsLoser) / 400))))))
        winnersRow.stats += delta
        losersRow.stats -= delta
        winnersRow.wins++
        losersRow.losses++

        await winnersRow.save()
        await losersRow.save()
        await Match.create({ winner: winner, loser: loser, delta })
        console.log(`Match ${z}: a loss by ${loser} to ${winner} has been added to the database.`)
    }, z*100)
}


//RECALCULATE
const recalculate = async (match, winner, loser, z) => {
    return setTimeout(async function() {
        const winnersRow = await Match.findOne({ where: { playerId: winner }})
        const losersRow = await Match.findOne({ where: { playerId: loser }})

        const statsLoser = losersRow.stats
        const statsWinner = winnersRow.stats
        winnersRow.backup = statsWinner
        losersRow.backup = statsLoser
        const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((statsWinner - statsLoser) / 400))))))
        winnersRow.stats += delta
        losersRow.stats -= delta
        winnersRow.wins++
        losersRow.losses++

        await winnersRow.save()
        await losersRow.save()
        await match.update({ delta })

        console.log(`Match ${z}: a loss by ${loser} to ${winner} has been incorporated in the recalculation.`)
    }, (z*100 + 10000))
}


//IS NEW USER?
const isNewUser = async (playerId) => {
    const count = await Player.count({ where: { id: playerId } })
    return !count
}

//IS ADMIN?
const isAdmin = (member) => member.roles.cache.some(role => role.id === adminRole)

//IS MOD?
const isMod = (member) => member.roles.cache.some(role => role.id === modRole)

//HAS PROFILE?
const hasProfile = async (playerId) => {
    const profile = await Profile.findOne({ where: { playerId }})
    return !!profile
}

//IS VOWEL?
const isVowel = (char) => /^[aeiou]$/.test(char.toLowerCase())

//GET MEDAL
const getMedal = (stats, title = false) => {
    if (title) {
        return stats <= 230 ? `Tilted ${mad}`
        : (stats > 230 && stats <= 290) ?  `Chump ${sad}`
        : (stats > 290 && stats <= 350) ?  `Rock ${ROCK}`
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
        : (stats > 290 && stats <= 350) ? ROCK
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

//IS SAME DAY
const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()

module.exports = {
    capitalize,
    convertCardsArrayToObject,
    createPlayer,
    createProfile,
    getMedal,
    getRandomElement,
    getRandomString,
    getRandomSubset,
    hasProfile,
    isAdmin,
    isMod,
    isNewUser,
    isSameDay,
    isVowel,
    recalculate,
    restore,
    revive
}
