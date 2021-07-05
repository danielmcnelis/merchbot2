
//UTILITY FUNCTIONS

const { adminRole, modRole, ambassadorRole } = require('../static/roles.json')
const { mad, sad, rocks, bronze, silver, gold, platinum, diamond, master, legend, god, approve } = require('../static/emojis.json')
const Names = require('../static/names.json')
const { Arena, Binder, Card, Daily, Diary, Draft, Gauntlet, Info, Inventory, Knowledge, Match, Player, Print, Profile, Set, Tournament, Trade, Trivia, Wallet, Wishlist  } = require('../db/index.js')
const merchbotId = '584215266586525696'
const quotes = require('../static/quotes.json')

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
const createProfile = async (playerId, starter) => {
    const card = starter === 'fish' ? 'Rage of the Deep Sea' : starter === 'rock' ? 'Guardian Sphinx' : null
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
const recalculate = async (match, winner, loser, z) => {
    return setTimeout(async function() {
        const winnersRow = await Player.findOne({ where: { playerId: winner }})
        const losersRow = await Player.findOne({ where: { playerId: loser }})

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

//IS AMBASSADOR?
const isAmbassador = (member) => member.roles.cache.some(role => role.id === ambassadorRole)

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
    isAmbassador,
    isMod,
    isNewUser,
    isSameDay,
    isVowel,
    recalculate,
    shuffleArray
}
