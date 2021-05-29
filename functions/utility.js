
//UTILITY FUNCTIONS

const { adminRole, modRole } = require('../static/roles.json')
const { mad, sad, ROCK, bronze, silver, gold, platinum, diamond, master, legend, god, approve } = require('../static/emojis.json')
const Names = require('../static/names.json')
const {saveYDK} = require('./decks.js')
const { Arena, Binder, Daily, Diary, Draft, Gauntlet, Inventory, Keeper, Match, Player, Print, Profile, Set, Tournament, Trade, Trivia, Wallet, Wishlist  } = require('../db/index.js')

//CREATE PLAYER
const createPlayer = async (id, username = null, tag = null, z = 0) => {
    setTimeout(async function() {
        try {
            await Player.create({
                id: `${id}`,
                name: `${username}`,
                tag: `${tag}`
            })
        } catch (err) {
            console.log(err)
        }
    }, z*100)
}


//CREATE PROFILE
const createProfile = async (playerId, first_deck, z = 0) => {
    const date = new Date()
    const month = `${date.getMonth() + 1}`
    const day = `${date.getDate()}`
    const year = `${date.getFullYear()}`
    
    try {
        await Arena.create({playerId})
        await Binder.create({playerId})
        await Daily.create({playerId})
        await Diary.create({playerId})
        await Draft.create({playerId})
        await Gauntlet.create({playerId})
        await Keeper.create({playerId})
        await Profile.create({
            playerId,
            first_deck,
            start_date: `${[year, month, day].join('-')}`
        })
        await Trivia.create({playerId})
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
            console.log(`adding ${playerId} to the database`)
            const username = Names[playerId] ? Names[playerId] : null
            await createPlayer(playerId, username)
        } else {
            console.log(`${player.name} AKA player ${z} already exists`)
        }
    }, z*100)
}


//RESTORE
const restore = async (winner, loser, format, z) => {
    return setTimeout(async function() {
        const winnersRow = await eval(format).findOne({ where: { playerId: winner }})
        const losersRow = await eval(format).findOne({ where: { playerId: loser }})

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
        await Match.create({ format: format, winner: winner, loser: loser, delta })
        console.log(`Match ${z}: a ${format} format loss by ${loser} to ${winner} has been added to the database.`)
    }, z*100)
}


//RECALCULATE
const recalculate = async (match, winner, loser, format, z) => {
    return setTimeout(async function() {
        const winnersRow = await eval(format).findOne({ where: { playerId: winner }})
        const losersRow = await eval(format).findOne({ where: { playerId: loser }})

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

        console.log(`Match ${z}: a ${format} format loss by ${loser} to ${winner} has been incorporated in the recalculation.`)
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


//CHECK DECK LIST
const checkDeckList = async (client, message, member, formatName, formatEmoji, formatDate, formatList) => {  
    const filter = m => m.author.id === member.user.id
    const msg = await member.user.send(`Please provide a duelingbook.com/deck link for the ${formatName} Format ${formatEmoji} deck you would like to check for legality.`);
    const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 180000
    }).then(async collected => {
        if (collected.first().content.startsWith("https://www.duelingbook.com/deck") || collected.first().content.startsWith("www.duelingbook.com/deck") || collected.first().content.startsWith("duelingbook.com/deck")) {		
            message.author.send('Thanks. Please wait while I download the .YDK file. This can take up to 30 seconds.')

            const url = collected.first().content
            const issues = await saveYDK(message.author, url, formatDate, formatList)
            
            if (issues['illegalCards'].length || issues['forbiddenCards'].length || issues['limitedCards'].length || issues['semiLimitedCards'].length) {
                let response = `I'm sorry, ${message.author.username}, your deck is not legal for ${formatName} Format. ${formatEmoji}`
                if (issues['illegalCards'].length) response += `\n\nThe following cards are not included in this format:\n${issues['illegalCards'].join('\n')}`
                if (issues['forbiddenCards'].length) response += `\n\nThe following cards are forbidden:\n${issues['forbiddenCards'].join('\n')}`
                if (issues['limitedCards'].length) response += `\n\nThe following cards are limited:\n${issues['limitedCards'].join('\n')}`
                if (issues['semiLimitedCards'].length) response += `\n\nThe following cards are semi-limited:\n${issues['semiLimitedCards'].join('\n')}`
            
                return message.author.send(response)
            } else {
                return message.author.send(`Your ${formatName} Format ${formatEmoji} deck is perfectly legal. You are good to go! ${approve}`)
            }
        } else {
            return message.author.send("Sorry, I only accept duelingbook.com/deck links.")      
        }
    }).catch(err => {
        console.log(err)
        return message.author.send(`Sorry, time's up. If you wish to try again, go back to the Discord server and use the **!check** command.`)
    })
}


//GET RANDOM ELEMENT
const getRandomElement = (arr) => {
    console.log('arr.len', arr.length)
    const index = Math.floor((arr.length) * Math.random())
    return arr[index]
}

//GET RANDOM SUBSET
const getRandomSubset = (arr, n) => {
    console.log('arr.length', arr.length)
    console.log('n', n)
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

module.exports = {
    capitalize,
    checkDeckList,
    createPlayer,
    createProfile,
    getMedal,
    getRandomElement,
    getRandomSubset,
    hasProfile,
    isAdmin,
    isMod,
    isNewUser,
    recalculate,
    restore,
    revive
}
