
//UTILITY FUNCTIONS

// DATABASE IMPORTS
import { Auction, Binder, Card, Daily, Info, ForgedInventory, Match, Player, Wallet, Wishlist } from '../database/index.js'
import { Op } from 'sequelize'
// const { exec } = require('child_process')
import { createRequire } from "module"
const require = createRequire(import.meta.url)
const Canvas = require('canvas')
import {AttachmentBuilder} from 'discord.js'

// STATIC IMPORTS
import emojis from '../static/emojis.json' with { type: 'json' }
const { mad, sad, rocks, bronze, silver, gold, platinum, diamond, master, legend, god } = emojis
import roles from '../static/roles.json' with { type: 'json' }
const { adminRole, judgeRole, arenaRole, draftRole, modRole, tourRole } = roles
const merchbotId = '584215266586525696'
import * as quotes from '../static/quotes.json' with { type: 'json' }

//CLEAR STATUS
export const clearStatus = async (element) => {
    const info = await Info.findOne({ where: { element } })
    if (!info) throw new Error(`Could not find Info where element = ${element}`)
    info.status = 'free'
    console.log(`${element} is now free`)
    await info.save()
}

//GET CONFIRMATION
export const getConfirmation = async (channel, pleasantry = true) => {
    return await channel.awaitMessages({ filter,
        max: 1,
        time: 15000
    }).then((collected) => {
        const response = collected.first().content.toLowerCase()
        if (yescom.includes(response)) {
            return true
        } else if (pleasantry) {
            channel.send({ content: `Not a problem. Have a nice day.`})
            return false
        } else {
            return false
        }
    }).catch((err) => {
        console.log(err)
        channel.send({ content: `Sorry, time's up.`})
        return false
    })
}

//CREATE PLAYER
export const createPlayer = async (member, x = 0) => {
    if (x >= 2) return
    if (member && (member.user.id === '584215266586525696' || !member.user.bot)) {
        try {
            const id = await Player.generateId()
            console.log('id', id)
            const newPlayer = await Player.create({
                id: id,
                name: `${member.user?.username}`,
                discordId: `${member.user?.id}`,
                discordName: `${member.user?.username}`
            })

            return newPlayer
        } catch (err) {
            console.log(err)
            const existingPlayer = await Player.findOne({
                where: {
                    discordName: `${member.user?.username}`
                }
            })

            if (existingPlayer) {
                try {
                    await existingPlayer.update({ 
                        name: `Deleted User ${existingPlayer.discordName} ${existingPlayer.discordId}`, 
                        discordName: `Deleted User ${existingPlayer.discordName} ${existingPlayer.discordId}` 
                    })
                    const newPlayer = await createPlayer(member, x++)
                    if (newPlayer) {
                        await combinePlayers(existingPlayer, newPlayer)
                    }
                } catch (err) {
                    console.log(err)
                    return
                }
            }
        }
    }
}

// RESET PLAYER
// export const resetPlayer = async (message, player) => {
//     const invs = await Inventory.findAll({ where: { playerId: player.id }, order: [["cardCode", "ASC"]] })

//     for (let i = 0; i < invs.length; i++) {
//         const inv = invs[i]
//         const quantity = inv.quantity
//         const printId = inv.printId
//         const cardCode = inv.cardCode

//         const count = await Inventory.count({ 
// 			where: { 
// 				printId: printId,
// 				playerId: merchbotId
// 			}
// 		})

//         if (!count) {
//             await Inventory.create({ 
//                 cardCode: cardCode,
//                 printId: printId,
//                 playerId: merchbotId
//             })
//         }

// 		const merchbot_inv = await Inventory.findOne({ 
// 			where: { 
// 				printId: printId,
// 				playerId: merchbotId
// 			}
// 		})

//         if (!merchbot_inv) return message.channel.send({ content: `Database error: Could not find or create MerchBot Inventory for: ${cardCode}.`})

//         if (merchbot_inv.quantity <= 0) {
//             const auction = await Auction.findOne({ where: { cardCode: cardCode, printId: printId }})
//             if (!auction) {
//                 console.log(`Create Auction for ${cardCode}.`)
//                 await Auction.create({
//                     cardCode: cardCode,
//                     quantity: quantity,
//                     printId: printId
//                 })
//             } else {
//                 auction.quantity += quantity
//                 await auction.save()
//             }
//         }

//         console.log(`Donating ${quantity} ${cardCode} to MerchBot.`)
//         merchbot_inv.quantity += quantity
//         await merchbot_inv.save()

//         console.log(`Destroying ${player.name}'s ${cardCode} Inventory.`)
//         await inv.destroy()
//     }

//     player.stats = 500
//     player.backup = 0
//     player.wins = 0
//     player.losses = 0
//     player.vanquished_foes = 0
//     player.best_stats = 500
//     player.current_streak = 0
//     player.longest_streak = 0
//     player.arena_wins = 0
//     player.arena_losses = 0
//     player.arena_stats = 500
//     player.arena_backup = 0
//     player.keeper_wins = 0
//     player.keeper_losses = 0
//     player.keeper_stats = 500
//     player.keeper_backup = 0
//     player.draft_wins = 0
//     player.draft_losses = 0
//     player.draft_stats = 500
//     player.draft_backup = 0
//     player.gauntlet_wins = 0
//     player.gauntlet_losses = 0
//     player.gauntlet_stats = 500
//     player.gauntlet_backup = 0
//     player.pauper_wins = 0
//     player.pauper_losses = 0
//     player.pauper_stats = 500
//     player.pauper_backup = 0
//     await player.save()

//     const binder = await Binder.findOne({ where: { playerId: player.id }})
//     if (binder) await binder.destroy()

//     const daily = await Daily.findOne({ where: { playerId: player.id }})
//     if (daily) await daily.destroy()

//     // const diary = await Diary.findOne({ where: { playerId: player.id }})
//     // if (diary) await diary.destroy()

//     // const knowledges = await Knowledge.findAll({ where: { playerId: player.id }})
    
//     // for (let i = 0; i < knowledges.length; i++) {
//     //     const knowledge = knowledges[i]
//     //     await knowledge.destroy()
//     // }

//     // const profile = await Profile.findOne({ where: { playerId: player.id }})
//     // if (profile) await profile.destroy()

//     const wallet = await Wallet.findOne({ where: { playerId: player.id }})
//     if (wallet) await wallet.destroy()

//     const wishlist = await Wishlist.findOne({ where: { playerId: player.id }})
//     if (wishlist) await wishlist.destroy()

//     const date = new Date()
//     await Reset.create({ 
//         date: date,
//         playerId: player.id
//     })
    
//     player.lastReset = date
//     await player.save()

//     return message.channel.send({ content: `Your account has been successfully reset. All your cards and progress have been wiped.`})
// }

//GET RANDOM STRING
export const generateRandomString = (length, chars) => {
    let result = '';
    for (let i = length; i > 0; --i) {
        result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
}

//CONVERT CARDS ARRAY TO OBJECT
export const convertArrayToObject = (arr) => {
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
export const createProfile = async (playerId) => {
    try {
    } catch (err) {
        console.log(err)
    }
}

//RECALCULATE
export const recalculate = async (match, z) => {
    const winnerId = match.winnerId
    const loserId = match.loserId
    const winningPlayer = await Player.findOne({ where: { id: winnerId }})
    const losingPlayer = await Player.findOne({ where: { id: loserId }})
    const origStatsWinner = winningPlayer.stats
	const origStatsLoser = losingPlayer.stats
	const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origStatsWinner - origStatsLoser) / 400))))))
    const previouslyDefeated = await ForgedMatch.count({
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
    console.log(`ForgedMatch ${z}: a loss by ${losingPlayer.name} to ${winningPlayer.name} has been incorporated in the recalculation.`)
}


//IS NEW USER?
export const isNewUser = async (playerId) => {
    const count = await Player.count({ where: { id: playerId } })
    return !count
}

//IS JAZZ?
export const isProgrammer = (member) => member && member.user.id === '194147938786738176'

//IS ADMIN?
export const isAdmin = (member) => member && member.roles.cache.some(role => role.id === adminRole || member.user.id === '194147938786738176')

//IS MOD?
export const isMod = (member) => member && member.roles.cache.some(role => role.id === modRole || role.id === adminRole || member.user.id === '194147938786738176')

//IS Judge?
export const isJudge = (member) => member && member.roles.cache.some(role => role.id === judgeRole || role.id === modRole || role.id === adminRole || member.user.id === '194147938786738176')

//IS ARENA PLAYER?
export const isArenaPlayer = (member) => member && member.roles.cache.some(role => role.id === arenaRole)

//IS DRAFT PLAYER?
export const isDraftPlayer = (member) => member && member.roles.cache.some(role => role.id === draftRole)

//IS TOUR PLAYER?
export const isTourPlayer = (member) => member && member.roles.cache.some(role => role.id === tourRole || role.id === '864960157758914570')

//HAS PROFILE?
export const hasProfile = async (playerId) => {
    const profile = await Profile.findOne({ where: { playerId }})
    return !!profile
}

//IS VOWEL?
export const isVowel = (char) => /^[aeiou]$/.test(char.toLowerCase())

//GET ARENA VICTORIES
export const getArenaVictories = (p) => p.beast_wins + p.dinosaur_wins + p.dragon_wins + p.fiend_wins + p.fish_wins + p.plant_wins + p.reptile_wins + p.rock_wins + p.spellcaster_wins + p.thunder_wins + p.warrior_wins + p.zombie_wins

//GET MEDAL
export const getMedal = (stats, title = false) => {
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

//GET RARITY
export const getRarity = (str = '') => {
    const rarity = str.includes('com') ? 'com' :
        str.includes('rar') ? 'rar' :
        str.includes('sup') ? 'sup' :
        str.includes('ult') ? 'ult' : 
        str.includes('sec') || str.includes('scr') ? 'scr' :
        false
    
    return rarity
}

//CAPITALIZE
export const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

//GET RANDOM ELEMENT
export const getRandomElement = (arr = []) => {
    const index = Math.floor((arr.length) * Math.random())
    return arr[index]
}

//GET RANDOM SUBSET
export const getRandomSubset = (arr, n) => {
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
export const shuffleArray = (arr) => {
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
export const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()


//IS WITHIN X HOURS
export const isWithinXHours = (x = 24, t1, t2) => Math.abs(t1 - t2) <= (x * 60 * 60 * 1000)


//GET DECK CATEGORY
export const getDeckCategory = (deckType) => {
    return (deckType === 'aggro bomb') ? 'aggro'
        : (deckType === 'counter fairy') ? 'lockdown'
        : (deckType === 'ben kei otk') ? 'combo'
        : (deckType === 'cat control') ? 'control'
        : 'other'
}

// CONVERY DATE TO YYYYMMDD
export const convertDateToYYYYMMDD = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

// DRAW CARD IMAGE
export const drawCardImage = async (cardName) => {
    try {
        const canvas = Canvas.createCanvas(420, 632)
        const context = canvas.getContext('2d', {pixelFormat: 'RGB30'})
        const card = await Card.findOne({ where: { name: cardName }})
        const image = await Canvas.loadImage(`https://cdn.formatlibrary.com/images/cards/${card.artworkId}.jpg`)
        context.drawImage(image, 0, 0, 420, 632)
        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: `${card.name}.jpg` })
        return attachment
    } catch (err) {
        console.log(err)
    }
}

// RUN FREQUENT TASKS
export const runFrequentTasks = async (client) => {
    console.log('runSomewhatFrequentTasks()')
    await manageSubscriptions(client)

    return setTimeout(() => runFrequentTasks(client), 10 * 60 * 1000)
}

// MANAGE SUBSCRIBERS
export const manageSubscriptions = async (client) => {
    let a = 0
    let b = 0

    try {
        const benefactorRoleId = '1375133829521608784'
        const patronRoleId = '1375132712070811689'
        const supporterRoleId = '1375131869036810302'

        const guild = await client.guilds.fetch('1372580468297568458')
        const membersMap = await guild.members.fetch()
        const programmer = await client.users.fetch('194147938786738176')
        const players = await Player.findAll()
                        
        for (let i = 0; i < players.length; i++) {
            try {
                const player = players[i]
                const member = await membersMap.get(player.discordId)

                if (player.isForgedSubscriber && player.discordId !== '379851431752237057' && player.discordId !== '626843317010694176' && player.discordId !== '332277643384979466' && !member?._roles.includes(benefactorRoleId) && !member?._roles.includes(patronRoleId) && !member?._roles.includes(supporterRoleId)) {
                    await programmer.send({ content: `${player.name} is no longer a Subscriber (${player.forgedSubscriberTier}).`})
                    console.log(`${player.name} is no longer a Subscriber (${player.forgedSubscriberTier}).`)
                    await player.update({ isForgedSubscriber: false, forgedSubscriberTier: null })
                    b++
                } else if (member?._roles.includes(benefactorRoleId) && (!player.isForgedSubscriber || player.forgedSubscriberTier !== 'Benefactor') && player.discordId !== '379851431752237057' && player.discordId !== '332277643384979466' && player.discordId !== '626843317010694176') {
                    await programmer.send({ content: `Welcome ${player.name} to the Forged in Chaos Benefactor Tier!`})
                    console.log(`Welcome ${player.name} to the Forged in Chaos Benefactor Tier!`)
                    await player.update({ isForgedSubscriber: true, forgedSubscriberTier: 'Benefactor' })
                    a++
                } else if (member?._roles.includes(patronRoleId) && (!player.isForgedSubscriber || player.forgedSubscriberTier !== 'Patron') && player.discordId !== '379851431752237057' && player.discordId !== '332277643384979466' && player.discordId !== '626843317010694176') {
                    await programmer.send({ content: `Welcome ${player.name} to the Forged in Chaos Patron Tier!`})
                    console.log(`Welcome ${player.name} to the Forged in Chaos Patron Tier!`)
                    await player.update({ isForgedSubscriber: true, forgedSubscriberTier: 'Patron' })
                    a++
                } else if (member?._roles.includes(supporterRoleId) && (!player.isForgedSubscriber || player.forgedSubscriberTier !== 'Supporter') && player.discordId !== '379851431752237057' && player.discordId !== '332277643384979466' && player.discordId !== '626843317010694176') {
                    await programmer.send({ content: `Welcome ${player.name} to the Forged in Chaos Supporter Tier!`})
                    console.log(`Welcome ${player.name} to the Forged in Chaos Supporter Tier!`)
                    await player.update({ isForgedSubscriber: true, forgedSubscriberTier: 'Supporter' })
                    a++
                }
            } catch (err) {
                console.log(err)
            }
        }
    } catch (err) {
        console.log(err)
    }

    return console.log(`added ${a} new subscriptions and removed ${b} old subscriptions`)
}