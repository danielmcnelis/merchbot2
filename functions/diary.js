

const { Daily, Diary, Inventory, Set } = require('../db')
const { Op } = require('sequelize')
const { awardPack } = require('./packs.js')
const { cultured, leatherbound, fire, tix, credits, blue, red, stoned, stare, wokeaf, koolaid, cavebob, evil, DOC, merchant, FiC, approve, lmfao, god, legend, master, diamond, platinum, gold, silver, bronze, rocks, sad, mad, beast, dinosaur, fish, plant, reptile, rock, starchips, egg, cactus, hook, moai, mushroom, rose, stardust, com, rar, sup, ult, scr, checkmark, emptybox } = require('../static/emojis.json')
const diaries = require('../static/diaries.json')
const merchbotId = '584215266586525696'

const checkCoreSetComplete = async (playerId, quantity = 1) => {
    const task = quantity === 1 ? 'h4' : 'l3'

    const count = await Diary.count({
        where: {
            playerId: playerId,
            [task]: true
        }
    })

    if (count) {
        console.log(`this player already completed ${task}`)
        return false
    }

    const allSets = await Set.findAll({ where: { type: 'core' }})
    console.log(`checking ${allSets.length} core sets`)

    for (let i = 0; i < allSets.length; i++) {
        const set = allSets[i]
        const setInv = await Inventory.findAll({
            where: {
                playerId: playerId,
                card_code: {
                    [Op.startsWith]: set.code
                },
                quantity: {
                    [Op.gte]: quantity
                }
            }
        })
    
        console.log(`player has ${quantity}x of ${setInv.length} out of ${set.size} cards in ${set.code}`)
        if (setInv.length >= set.size) return true
    }

    console.log('found 0 complete sets')
    return false
}

const completeTask = async (channel, playerId, task, milliseconds = 2000) => {
    if (playerId === merchbotId) return console.log('abort task completion for @MerchBot')

    const count = await Diary.count({
        where: {
            playerId: playerId,
            [task]: true
        }
    })

    if (count) return

    const diary = await Diary.findOne({ where: { playerId } })
    if (!diary) return console.log(`Error: could not find player's Diary.`)
    diary[task] = true
    await diary.save()

    const difficulty = task.startsWith('e') ? 'Easy' :
        task.startsWith('m') ? 'Moderate' : 
        task.startsWith('h') ? 'Hard' : 
        task.startsWith('l') ? 'Elite' : 
        'Master'
    
    return setTimeout(() => {
        const task_num = task.slice(1)
        const full_text = diaries[difficulty][task]
        const task_text_only = full_text.slice(full_text.indexOf(") ") + 2)
        channel.send(`<@${playerId}>, Congrats! You completed Task #${task_num} in the ${difficulty} Diary${leatherbound}!` +
            `\n${legend} ${task_text_only} ${legend}`
        )
        return checkDiaryComplete(channel, playerId, diary, difficulty)
    }, milliseconds)
}

const checkDiaryComplete = async (channel, playerId, diary, difficulty) => {
    if (
        ( 
            difficulty === 'Easy' &&
            diary.e1 && diary.e2 && diary.e3 && diary.e4 && diary.e5 && diary.e6 && diary.e7 && diary.e8 && diary.e9 && diary.e10 && diary.e11 && diary.e12
        ) || (
            difficulty === 'Moderate' &&
            diary.m1 && diary.m2 && diary.m3 && diary.m4 && diary.m5 && diary.m6 && diary.m7 && diary.m8 && diary.m9 && diary.m10
        ) || (
            difficulty === 'Hard' &&
            diary.h1 && diary.h2 && diary.h3 && diary.h4 && diary.h5 && diary.h6 && diary.h7 && diary.h8
        ) || (
            difficulty === 'Elite' &&
            diary.l1 && diary.l2 && diary.l3 && diary.l4 && diary.l5 && diary.l6
        )
    ) {
        return setTimeout(async () => {
            const num = difficulty === 'Elite' ? 4 : difficulty === 'Hard' ? 3 : difficulty === 'Moderate' ? 2 : 1 
            channel.send(`<@${playerId}>, Congrats! You completed your ${difficulty} Diary${leatherbound}!`)
            channel.send(`\n${blue} ${koolaid} ${legend} ${cavebob} ${cultured}`)

            const daily = await Daily.findOne({ where: { playerId }})
            daily.cobble_progress = 0
            await daily.save()

            return awardPack(channel, playerId, null, num)
        }, 2000)
    }
}

module.exports = {
    checkCoreSetComplete,
    completeTask
}
