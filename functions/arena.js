
const { Arena, Diary, Info, Player, Profile, Wallet } = require('../db')
const { Op } = require('sequelize')
const { yescom, nocom } = require('../static/commands.json')
const { fire, tix, credits, blue, red, stoned, stare, wokeaf, koolaid, cavebob, evil, DOC, merchant, FiC, approve, lmfao, god, legend, master, diamond, platinum, gold, silver, bronze, rocks, sad, mad, beast, dinosaur, fish, plant, reptile, rock, starchips, egg, cactus, hook, moai, mushroom, rose, stardust, com, rar, sup, ult, scr, checkmark, emptybox } = require('../static/emojis.json')
const { arenaRole } = require('../static/roles.json')
const { arenaChannel } = require('../static/channels.json')
const { client } = require('../static/clients.js')
const { shuffleArray, getRandomElement, capitalize } = require('./utility.js')
const { awardCard } = require('./award.js')
const arenas = require('../static/arenas.json')

//GET ARENA SAMPLE DECK
const getArenaSample = async (message) => {
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`Please select a tribe:\n(1) Beast\n(2) Dinosaur\n(3) Fish\n(4) Plant\n(5) Reptile\n(6) Rock`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 10000
	}).then(collected => {
        let tribe
		const response = collected.first().content.toLowerCase()
        if(response.includes('bea') || response.includes('1')) tribe = 'beast' 
        else if(response.includes('dino') || response.includes('2')) tribe = 'dinosaur'
        else if(response.includes('fish') || response.includes('3')) tribe = 'fish'
        else if(response.includes('plant') || response.includes('4')) tribe = 'plant'
        else if(response.includes('rep') || response.includes('5')) tribe = 'reptile'
        else if(response.includes('rock') || response.includes('6')) tribe = 'rock'
        else message.channel.send(`Please specify a valid tribe.`)
        return tribe
	}).catch(err => {
		console.log(err)
        message.channel.send(`Sorry, time's up.`)
        return false
	})

    return collected
}

const startArena = async(guild) => {
    const allArenaEntries = await Arena.findAll({ include: Player })

    const contestants = shuffleArray(["P1", "P2", "P3", "P4", "P5", "P6"])
    console.log('contestants', contestants)
    console.log('shuffleArray(contestants)', shuffleArray(contestants))
    console.log('shuffleArray(contestants)', shuffleArray(contestants))
    console.log('shuffleArray(contestants)', shuffleArray(contestants))
    console.log('shuffleArray(contestants)', shuffleArray(contestants))

    getConfirmation(guild, allArenaEntries[0], contestants[0])
    getConfirmation(guild, allArenaEntries[1], contestants[1])
    getConfirmation(guild, allArenaEntries[2], contestants[2])
    getConfirmation(guild, allArenaEntries[3], contestants[3])
    getConfirmation(guild, allArenaEntries[4], contestants[4])
    getConfirmation(guild, allArenaEntries[5], contestants[5])

    const info = await Info.findOne({ where: {
        element: 'arena'
    }})

    return setTimeout(async () => {
        const count = await Arena.count({ where: {
            active: true
        } })

        if (!count === 6) {
            const missingArenaEntries = await Arena.findAll({ 
                where: { 
                    active: false
                },
                include: Player
            })

            const names = missingArenaEntries.map((entry) => entry.player.name)

            await resetArena(info, allArenaEntries)
            await missingArenaPlayers.destroy()
            return channel.send(`Unfortunately, The Arena cannot begin without 6 players.\n\nThe following players have been removed from the queue:\n${names.sort().join()}`)
        } else {
            info.round = 1
            info.status = 'active'
            await info.save()
            assignArenaRoles(guild, allArenaEntries)
            return startRound(info)
        }
    }, 61000)
}

const getConfirmation = async (guild, arena_entry, contestant) => {
    const channel = client.channels.cache.get(arenaChannel)
    const playerId = arena_entry.playerId
    const member = guild.members.cache.get(playerId)
    if (!member || playerId !== member.user.id) return
    const filter = m => m.author.id === playerId
	const msg = await member.send(`Please confirm your participation in the Arena by selecting a tribe:\n(1) Beast\n(2) Dinosaur\n(3) Fish\n(4) Plant\n(5) Reptile\n(6) Rock`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 60000
	}).then(async collected => {
        let tribe
		const response = collected.first().content.toLowerCase()
        if(response.includes('bea') || response.includes('1')) tribe = 'beast'
        else if(response.includes('dino') || response.includes('2')) tribe = 'dinosaur'
        else if(response.includes('fish') || response.includes('3')) tribe = 'fish'
        else if(response.includes('plant') || response.includes('4')) tribe = 'plant'
        else if(response.includes('rep') || response.includes('5')) tribe = 'reptile'
        else if(response.includes('rock') || response.includes('6')) tribe = 'rock'
        else member.send(`Please specify a valid tribe.`)

        const count = await Info.count({ where: {
            element: 'arena',
            status: 'confirming'
        } })

        if (!count) return member.send(`Sorry, time expired.`)

        if (tribe) {
            arena_entry.active = true
            arena_entry.tribe = tribe
            arena_entry.contestant = contestant
            await arena_entry.save()
            member.send(`Thanks! This is your Arena deck (staples in side). You may cut it down to 40 cards:\n${arenas[tribe].url}\n${arenas[tribe].screenshot}`)
            return channel.send(`${member.user.username} confirmed their participation in the Arena!`)
        } else {
            return getConfirmation(arena_entry)
        }
	}).catch(err => {
		console.log(err)
        return member.send(`Sorry, time's up.`)
	})
}

const assignArenaRoles = (guild, entries) => {
    entries.forEach((entry) => {
        const member = guild.members.cache.get(entry.playerId)
        console.log('attempting to assign arena role')
        member.roles.add(arenaRole)
    })
}

const startRound = async (info, entries) => {
    const channel = client.channels.cache.get(arenaChannel)
    console.log(`Starting Round ${info.round}`)

    if (info.round === 6) {
        const vouchers = {
            "beast":"mushroom",
            "dinosaur":"egg",
            "fish":"hook",
            "plant":"rose",
            "reptile":"cactus",
            "rock":"moai"
        }

        const prizes = {
            "beast":"APC-001",
            "dinosaur":"APC-005",
            "fish":"APC-004",
            "plant":"APC-003",
            "reptile":"APC-006",
            "rock":"APC-002"
        }

        const victory = {
            "beast":"Today, you attacked your foes with the viciousness of a wolverine!",
            "dinosaur":"Today, you crushed your foes with the weight of a sauropod!",
            "fish":"Today, you rushed your foes with the quickness of a marlin!",
            "plant":"Today, you astonished your foes with the beauty of a princess!",
            "reptile":"Today, you paralyzed your foes with the venom of a cobra!",
            "rock":"Today, you rolled your foes with the ease of a boulder!"
        }

        const cards = {
            "beast":`${ult}APC-001 - Desmanian Devil`,
            "dinosaur":`${ult}APC-005 - Spacetime Transcendence`,
            "fish":`${ult}APC-004 - Moray of Greed`,
            "plant":`${ult}APC-003 - Rose Lover`,
            "reptile":`${ult}APC-006 - Viper's Rebirth`,
            "rock":`${ult}APC-002 - Koa'ki Meiru Guardian`,
        }

        const verb = [
            "salvaged",
            "recovered",
            "collected",
            "picked up",
            "walked away with",
            "smuggled",
            "copped",
            "pocketed",
            "lifted",
            "boosted",
            "nabbed",
            "grabbed",
            "yanked",
            "hoisted",
            "snagged",
            "stole",
            "ran off with",
            "swiped",
            "claimed",
            "brought back",
            "got their paws on",
            "banked",
            "looted",
            "found",
            "took",
            "banked"
        ]

        const encouragement = [
            "Pretty sweet!",
            "Hey it's something.",
            "We take those.",
            "No cap.",
            "You'll get 'em next time, kid.",
            "Not bad!",
            "Good looks!",
            "All in a day's work.",
            "Nice job!",
            "Cool!",
            "Maybe nobody will notice.",
            "Better than nothing.",
            "Legit.",
            "Can't wait to cross this off the Diary!",
            "This is better than what you're gonna get with Daily tomorrow...",
            "Sick score!",
            "Better than Woawa probably.",
            "Got sacked hard.",
            "Lost to a topper.",
            "Life's a grind.",
            "That's solid.",
            "Progress is progress.",
            "So close to that APC!",
            "Farming was good today.",
            "At least you didn't waste 2 hours playing Arena...",
            "Be happy you got something.",
            "Maybe throw Jazz a tip!",
            "Who the hell writes these things?"
        ]

        if (entries[0].score > entries[1].score) {
            //1st place outright
            for (let i = 1; i < entries.length; i++) {
                const entry = entries[i]
                const voucher = vouchers[entry.tribe]
                const quantity = entry.score + 1
                const wallet = await Wallet.findOne({ where: { playerId: entry.playerId }})
                wallet[voucher] += quantity
                await wallet.save()
                channel.send(`<@${entry.playerId}> ${getRandomElement(verb)} ${quantity} ${eval(voucher)} from the Arena. ${getRandomElement(encouragement)}`)
            }

            const tribe = entries[0].tribe
            const playerId = entries[0].playerId
            await awardCard(channel, playerId, prizes[tribe])

            channel.send(`Congratulations to <@${playerId}> on a brilliant victory` +
                ` with the ${capitalize(tribe)} ${eval(tribe)} deck.` +
                ` ${victory[tribe]}` +
                ` You truly deserve the ${cards[tribe]}!`
            )
            return endArena(info, entries)
        } else if ((entries[0].score === entries[1].score) && entries[1].score > entries[2].score) {
            //2 way tie
            for (let i = 2; i < entries.length; i++) {
                const entry = entries[i]
                const voucher = vouchers[entry.tribe]
                const quantity = entry.score + 1
                const wallet = await Wallet.findOne({ where: { playerId: entry.playerId }})
                wallet[voucher] += quantity
                await wallet.save()
                channel.send(`<@${entry.playerId}> ${getRandomElement(verb)} ${quantity} ${eval(voucher)} from the Arena. ${getRandomElement(encouragement)}`)
            }

            const title = `<!> <!> <!> ARENA FINALS <!> <!> <!>` 
            const match = `${eval(entries[0].tribe)} <@${entries[0].player.name}> ${eval(entries[0].tribe)}` +
            ` vs ${eval(entries[1].tribe)} <@${entries[1].player.name}> ${eval(entries[1].tribe)}`

            channel.send(`${title}\n${match}`)
            return endArena(info, entries)
        } else if ((entries[0].score === entries[1].score === entries[2].score) && entries[2].score > entries[3].score) {
            //3 way tie
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i]
                const voucher = vouchers[entry.tribe]
                const quantity = i < 3 ? entry.score + 4 : entry.score + 1
                const wallet = await Wallet.findOne({ where: { playerId: entry.playerId }})
                wallet[voucher] += quantity
                await wallet.save()
                channel.send(`<@${entry.playerId}> ${getRandomElement(verb)} ${quantity} ${eval(voucher)} from the Arena. ${getRandomElement(encouragement)}`)
            }

            channel.send(`The shadows grew long over the battlefield, and the gladiators had little more left to give. Being so, the elders of the Tribes briefly met to negotiate a temporary ceasefire. No winner could be determined in this Arena.`)
            return endArena(info, entries)
        } else if ((entries[0].score === entries[1].score === entries[2].score === entries[3].score) && entries[3].score > entries[4].score) {
            //4 way tie
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i]
                const voucher = vouchers[entry.tribe]
                const quantity = i < 4 ? entry.score + 3 : entry.score + 1
                const wallet = await Wallet.findOne({ where: { playerId: entry.playerId }})
                wallet[voucher] += quantity
                await wallet.save()
                channel.send(`<@${entry.playerId}> ${getRandomElement(verb)} ${quantity} ${eval(voucher)} from the Arena. ${getRandomElement(encouragement)}`)
            }

            channel.send(`The shadows grew long over the battlefield, and the gladiators had little more left to give. Being so, the elders of the Tribes briefly met to negotiate a temporary ceasefire. No winner could be determined in this Arena.`)
            return endArena(info, entries)
        } else {
             //5 way tie
             for (let i = 0; i < entries.length; i++) {
                const entry = entries[i]
                const voucher = vouchers[entry.tribe]
                const quantity = i < 5 ? entry.score + 3 : entry.score + 1
                const wallet = await Wallet.findOne({ where: { playerId: entry.playerId }})
                wallet[voucher] += quantity
                await wallet.save()
                channel.send(`<@${entry.playerId}> ${getRandomElement(verb)} ${quantity} ${eval(voucher)} from the Arena. ${getRandomElement(encouragement)}`)
            }

            channel.send(`The shadows grew long over the battlefield, and the gladiators had little more left to give. Being so, the elders of the Tribes briefly met to negotiate a temporary ceasefire. No winner could be determined in this Arena.`)
            return endArena(info, entries)
        }
    } else {
        const P1 = await Arena.findOne({ where: { contestant: "P1" }, include: Player})
        const P2 = await Arena.findOne({ where: { contestant: "P2" }, include: Player})
        const P3 = await Arena.findOne({ where: { contestant: "P3" }, include: Player})
        const P4 = await Arena.findOne({ where: { contestant: "P4" }, include: Player})
        const P5 = await Arena.findOne({ where: { contestant: "P5" }, include: Player})
        const P6 = await Arena.findOne({ where: { contestant: "P6" }, include: Player})
    
        if (!P1 || !P2 || !P3 || !P4 || !P5 || !P6) return channel.send(`Critical error. Missing contestant in the database.`)
    
        const pairings = info.round === 1 ? [[P1, P2], [P3, P4], [P5, P6]] :
            info.round === 2 ? [[P1, P3], [P2, P5], [P4, P6]] :
            info.round === 3 ? [[P1, P4], [P2, P6], [P3, P5]] : 
            info.round === 4 ? [[P1, P5], [P2, P4], [P3, P6]] : 
            info.round === 5 ? [[P1, P6], [P2, P3], [P4, P5]] : 
            null
    
        const title = `------  Arena Round ${info.round}  ------\n${beast}   ${dinosaur}   ${fish}   ${plant}   ${reptile}   ${rock}` 
        const matches = pairings.map((pairing, index) => {
            return `Match ${index + 1}: <@${pairing[0].playerId}> vs <@${pairing[1].playerId}>`
        })

        return channel.send(`${title}\n${matches.join("\n")}`)
    }
}

const postStandings = async (info, entries) => {
    const channel = client.channels.cache.get(arenaChannel)
    console.log(`Round ${info.round} Standings`)

    if (info.round === 6) {
        return console.log('it is round 6')
    } else {
        const title = `---  Arena Round ${info.round} Standings  ---`
        const standings = entries.map((entry, index) => {
            return `${index + 1}. ${entry.player.name} ${eval(entry.tribe)} - ${entry.score} W`
        })

        info.round++
        console.log('new: info.round', info.round)
        await info.save()

        channel.send(`${title}\n${standings.join("\n")}`)
        
        return setTimeout(() => {
            startRound(info, entries)
        }, 15000)
    }
}

const endArena = async (info, entries) => {
    info.status = 'pending'
    info.round = null
    await info.save()
    const guild = client.guilds.cache.get("842476300022054913")

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const member = guild.members.cache.get(entry.playerId)
        console.log('attempting to remove arena role')
        member.roles.remove(arenaRole)
        await entry.destroy()
    }
}

const resetArena = async (info, entries) => {
    info.status = 'pending'
    info.round = null
    await info.save()
    const guild = client.guilds.cache.get("842476300022054913")

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const member = guild.members.cache.get(entry.playerId)
        console.log('attempting to remove arena role')
        member.roles.remove(arenaRole)
        entry.active = false
        entry.tribe = null
        entry.contestant = null
        await entry.save()
    }
}

const checkArenaProgress = async (info) => {
    console.log('checking if arena round is done')
    const entries = await Arena.findAll({ include: Player, order: [["score", "DESC"]]})
    if (!entries) return channel.send(`Critical error. Missing entries in the database.`) 
    
    const scores = entries.map((entry) => entry.score)
    const sum = scores.reduce((a, b) => a + b)

    if (sum % 3 === 0) return setTimeout(() => postStandings(info, entries), 3000)
}

module.exports = {
    checkArenaProgress,
    getArenaSample,
    resetArena,
    startArena,
    startRound
}
