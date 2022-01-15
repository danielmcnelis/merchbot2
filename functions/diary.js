

const { Daily, Diary, Inventory, Set, Profile, Wallet } = require('../db')
const { Op } = require('sequelize')
const { awardPack } = require('./packs.js')
const { beast, blue, bronze, cactus, cavebob, checkmark, com, credits, cultured, diamond, dinosaur, DOC, LPK, DRT, fiend, thunder, zombie, egg, emptybox, skull, familiar, battery, evil, FiC, fire, fish, god, gold, hook, koolaid, leatherbound, legend, lmfao, mad, master, merchant, milleye, moai, mushroom, no, ORF, TEB, FON, warrior, spellcaster, dragon, plant, platinum, rar, red, reptile, rock, rocks, rose, sad, scr, silver, soldier, starchips, stardust, stare, stoned, sup, tix, ult, wokeaf, yellow, yes, ygocard } = require('../static/emojis.json')
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

    if (count) return false

    const allSets = await Set.findAll({ where: { type: 'core' }})

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
    
        if (setInv.length >= set.size) return true
    }
    
    return false
}


const check6TribesComplete = async (playerId, goal = 1) => {
    const task = goal === 1 ? 'h8' : 'l6'

    const count = await Diary.count({
        where: {
            playerId: playerId,
            [task]: true
        }
    })

    if (count) return false

    let score = 0
    
    const profile = await Profile.findOne({ where: { playerId: playerId }})
    if (profile.beast_wins >= goal) score++
    if (profile.dinosaur_wins >= goal) score++
    if (profile.dragon_wins >= goal) score++
    if (profile.fish_wins >= goal) score++
    if (profile.plant_wins >= goal) score++
    if (profile.reptile_wins >= goal) score++
    if (profile.rock_wins >= goal) score++
    if (profile.spellcaster_wins >= goal) score++
    if (profile.warrior_wins >= goal) score++

    if (score >= 6) return true
    else return false
}


const completeTask = async (channel, playerId, task, milliseconds = 2000) => {
    if (playerId === merchbotId) return
    const count = await Diary.count({
        where: {
            playerId: playerId,
            [task]: true
        }
    })

    if (count) return

    const diary = await Diary.findOne({ where: { playerId } })
    const wallet = await Wallet.findOne({ where: { playerId } })
    if (!diary || !wallet) return
    diary[task] = true
    await diary.save()

    const difficulty = task.startsWith('e') ? 'Easy' :
        task.startsWith('m') ? 'Medium' : 
        task.startsWith('h') ? 'Hard' : 
        task.startsWith('l') ? 'Elite' : 
        'Master'
    
    const reward = difficulty === 'Easy' ? 3 :
        difficulty === 'Medium' ? 6 :
        difficulty === 'Hard' ? 9 :
        difficulty === 'Elite' ? 12 :
        15

    wallet.starchips += reward
    await wallet.save()

    return setTimeout(() => {
        const task_num = task.slice(1)
        const full_text = diaries[difficulty][task]
        const task_text_only = full_text.slice(full_text.indexOf(") ") + 2)
        channel.send({ content: `<@${playerId}>, Congrats! You earned ${reward}${starchips} for completing Task #${task_num} in the ${difficulty} Diary${leatherbound}!` +
            `\n${legend} ${task_text_only} ${legend}`
    })
        return checkDiaryComplete(channel, playerId, diary, difficulty)
    }, milliseconds)
}

const checkDiaryComplete = async (channel, playerId, diary, difficulty) => {
    if (
        ( 
            difficulty === 'Easy' &&
            diary.e1 && diary.e2 && diary.e3 && diary.e4 && diary.e5 && diary.e6 && diary.e7 && diary.e8 && diary.e9 && diary.e10 && diary.e11 && diary.e12
        ) || (
            difficulty === 'Medium' &&
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
            channel.send({ content: `<@${playerId}>, Congrats! You completed your ${difficulty} Diary${leatherbound}!`})
            channel.send({ content: `\n${blue} ${koolaid} ${legend} ${cavebob} ${cultured}`})

            const gotSecret = await awardPack(channel, playerId, null)
			if (gotSecret) await completeTask(channel, playerId, 'm4')
            return
        }, 2000)
    }
}

module.exports = {
    check6TribesComplete,
    checkCoreSetComplete,
    completeTask
}
