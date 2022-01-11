
const { Arena, Diary, Info, Player, Profile, Wallet, Match } = require('../db')
const { Op } = require('sequelize')
const { yescom, nocom } = require('../static/commands.json')
const { DRT, fiend, thunder, zombie, king, shrine, gem, orb, swords, beast, blue, bronze, cactus, cavebob, checkmark, skull, familiar, battery, com, credits, cultured, diamond, dinosaur, DOC, LPK, dragon, egg, emptybox, evil, FiC, fire, fish, god, gold, hook, koolaid, leatherbound, legend, lmfao, mad, master, merchant, milleye, moai, mushroom, no, ORF, TEB, FON, warrior, spellcaster, plant, platinum, rar, red, reptile, rock, rocks, rose, sad, scr, silver, soldier, starchips, stardust, stare, stoned, sup, tix, ult, wokeaf, yellow, yes, ygocard } = require('../static/emojis.json')
const { arenaRole } = require('../static/roles.json')
const { arenaChannelId } = require('../static/channels.json')
const { client } = require('../static/clients.js')
const { check6TribesComplete, completeTask } = require('./diary')
const { shuffleArray, getRandomElement, capitalize } = require('./utility.js')
const { awardCard } = require('./award.js')
const { decks, vouchers, prizes, victories, apcs, verbs, encouragements } = require('../static/arenas.json')

//GET ARENA SAMPLE DECK
const getArenaSample = async (message, query) => {
    if (query && query.includes('bea')) return 'beast'
    if (query && query.includes('dino')) return 'dinosaur'
    if (query && query.includes('drag')) return 'dragon'
    if (query && query.includes('fiend')) return 'fiend'
    if (query && query.includes('fish')) return 'fish'
    if (query && query.includes('plant')) return 'plant'
    if (query && query.includes('rep')) return 'reptile'
    if (query && query.includes('rock')) return 'rock'
    if (query && (query.includes('spell') || query.includes('cast'))) return 'spellcaster'
    if (query && query.includes('thun')) return 'thunder'
    if (query && query.includes('war')) return 'warrior'
    if (query && query.includes('zom')) return 'zombie'

    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send({ content: `Please select a tribe:\n(1) Beast\n(2) Dinosaur\n(3) Dragon\n(4) Fiend\n(5) Fish\n(6) Plant\n(7) Reptile\n(8) Rock\n(9) Spellcaster\n(10) Thunder\n(11) Warrior\n(12) Zombie`})
	const collector = await msg.channel.awaitMessages({ filter,
		max: 1,
		time: 10000
	}).catch((err) => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
	})

    let tribe = false
    const response = collector.first().content.toLowerCase()
    if(response.includes('thun') || response.includes('10')) tribe = 'thunder'
    else if(response.includes('war') || response.includes('11')) tribe = 'warrior'
    else if(response.includes('zom') || response.includes('12')) tribe = 'zombie'
    else if(response.includes('bea') || response.includes('1')) tribe = 'beast' 
    else if(response.includes('dino') || response.includes('2')) tribe = 'dinosaur'
    else if(response.includes('drag') || response.includes('3')) tribe = 'dragon'
    else if(response.includes('fish') || response.includes('4')) tribe = 'fiend'
    else if(response.includes('fiend') || response.includes('5')) tribe = 'fish'
    else if(response.includes('plant') || response.includes('6')) tribe = 'plant'
    else if(response.includes('rep') || response.includes('7')) tribe = 'reptile'
    else if(response.includes('rock') || response.includes('8')) tribe = 'rock'
    else if(response.includes('spell') || response.includes('cast') || response.includes('9')) tribe = 'spellcaster'
    else message.channel.send({ content: `Please specify a valid tribe.`})
    return tribe
}

//START ARENA
const startArena = async() => {
    const channel = client.channels.cache.get(arenaChannelId)
    channel.send({ content: `Arena players, please check your DMs!`})
    const allArenaEntries = await Arena.findAll({ include: Player })
    const contestants = shuffleArray(["P1", "P2", "P3", "P4"])

    getConfirmation(allArenaEntries[0], contestants[0])
    getConfirmation(allArenaEntries[1], contestants[1])
    getConfirmation(allArenaEntries[2], contestants[2])
    getConfirmation(allArenaEntries[3], contestants[3])

    const info = await Info.findOne({ where: {
        element: 'arena'
    }})

    for (let i = 1; i < 12; i ++) {
        setTimeout(async () => {
            const count = await Arena.count({ where: {
                active: true
            } })
    
            const active = await Info.count({ where: {
                element: 'arena',
                status: 'active'
            } })

            if (count === 4 && !active) {
                info.round = 1
                info.status = 'active'
                await info.save()
                assignArenaRoles(allArenaEntries)
                setTimeout(() => {
                    channel.send({ content: `<@&${arenaRole}>, square-up gamers! The Arena starts in 10 seconds. ${cavebob}\n\nP.S. If you aren't playing within 5 minutes of this message, **it's a game loss**!`})
                }, 1000)
                return setTimeout(() => {
                    return startRound(info)
                }, 11000)
            }
        }, i * 5000)
    }

    return setTimeout(async () => {
        const count = await Arena.count({ where: {
            active: true
        } })

        const active = await Info.count({ where: {
            element: 'arena',
            status: 'active'
        } })

        if (count !== 4 && !active) {
            const missingArenaEntries = await Arena.findAll({ 
                where: { 
                    active: false
                },
                include: Player
            })

            const names = missingArenaEntries.map((entry) => entry.player.name)

            await resetArena(info, allArenaEntries)

            for (let i = 0; i < missingArenaEntries.length; i++) {
                const entry = missingArenaEntries[i]
                await entry.destroy()
            }
            
            return channel.send({ content: `Unfortunately, The Arena cannot begin without 4 players.\n\nThe following players have been removed from the queue:\n${names.sort().join("\n")}`})
        } else if (count === 4 && !active) {
            info.round = 1
            info.status = 'active'
            await info.save()
            assignArenaRoles(allArenaEntries)
            setTimeout(() => {
                channel.send({ content: `<@&${arenaRole}>, square-up gamers! The Arena starts in 10 seconds. ${cavebob}\n\nP.S. If you aren't playing within 5 minutes of this message, **it's a game loss**!`})
            }, 1000)
            return setTimeout(() => {
                return startRound(info)
            }, 11000)
        }
    }, 61000)
}

//GET CONFIRMATION
const getConfirmation = async (arena_entry, contestant) => {
    const channel = client.channels.cache.get(arenaChannelId)
    const guild = client.guilds.cache.get("842476300022054913")
    const playerId = arena_entry.playerId
    const member = guild.members.cache.get(playerId)
    if (!member || playerId !== member.user.id) return
    const filter = m => m.author.id === playerId
	const msg = await member.send({ content: `Please confirm your participation in the Arena by selecting a tribe:\n(1) Beast\n(2) Dinosaur\n(3) Dragon\n(4) Fiend\n(5) Fish\n(6) Plant\n(7) Reptile\n(8) Rock\n(9) Spellcaster\n(10) Thunder\n(11) Warrior\n(12) Zombie`})
	const collector = await msg.channel.awaitMessages({ filter,
		max: 1,
		time: 60000
	}).catch((err) => {
		console.log(err)
        return member.send({ content: `Sorry, time's up.`})
	})

    let tribe
    const response = collector.first().content.toLowerCase()
    if(response.includes('thun') || response.includes('10')) tribe = 'thunder'
    else if(response.includes('war') || response.includes('11')) tribe = 'warrior'
    else if(response.includes('zom') || response.includes('12')) tribe = 'zombie'
    else if(response.includes('bea') || response.includes('1')) tribe = 'beast' 
    else if(response.includes('dino') || response.includes('2')) tribe = 'dinosaur'
    else if(response.includes('drag') || response.includes('3')) tribe = 'dragon'
    else if(response.includes('fish') || response.includes('4')) tribe = 'fiend'
    else if(response.includes('fiend') || response.includes('5')) tribe = 'fish'
    else if(response.includes('plant') || response.includes('6')) tribe = 'plant'
    else if(response.includes('rep') || response.includes('7')) tribe = 'reptile'
    else if(response.includes('rock') || response.includes('8')) tribe = 'rock'
    else if(response.includes('spell') || response.includes('cast') || response.includes('9')) tribe = 'spellcaster'
    else message.channel.send({ content: `Please specify a valid tribe.`})

    const count = await Info.count({ where: {
        element: 'arena',
        status: 'confirming'
    } })

    if (!count) return member.send({ content: `Sorry, time expired.`})

    if (tribe) {
        arena_entry.active = true
        arena_entry.tribe = tribe
        arena_entry.contestant = contestant
        await arena_entry.save()
        member.send({ content: `Thanks! This is your Arena deck (staples in the side). You may cut it down to 40 cards:\n${decks[tribe].url}\n${decks[tribe].screenshot}`})
        return channel.send({ content: `${member.user.username} confirmed their participation in the Arena!`})
    } else {
        return getConfirmation(arena_entry)
    }
}

//ASSIGN ARENA ROLES
const assignArenaRoles = (entries) => {
    const guild = client.guilds.cache.get("842476300022054913")
    entries.forEach((entry) => {
        const member = guild.members.cache.get(entry.playerId)
        member.roles.add(arenaRole)
    })
}

//START ROUND
const startRound = async (info, entries) => {
    const channel = client.channels.cache.get(arenaChannelId)
    const guild = client.guilds.cache.get("842476300022054913")

    if (info.round === 5) {
        const voucher = vouchers[entries[1].tribe]
        const quantity = 6
        const wallet = await Wallet.findOne({ where: { playerId: entries[1].playerId }})
        wallet[voucher] += quantity
        await wallet.save()
        channel.send({ content: `<@${entries[1].playerId}> ${getRandomElement(verbs)} ${quantity} ${eval(voucher)} from the Arena. ${getRandomElement(encouragements)}`})
        
        const tribe = entries[0].tribe
        const playerId = entries[0].playerId
        const profile = await Profile.findOne({ where: { playerId } })
        profile[`${tribe}_wins`]++
        await profile.save()
        await awardCard(channel, playerId, prizes[tribe])

        channel.send({ content: `Congratulations to <@${playerId}> on a brilliant victory` +
            ` with the ${capitalize(tribe)} ${eval(tribe)} deck.` +
            ` ${victories[tribe]}` +
            ` You truly deserve the ${apcs[tribe]}!`
    })

        completeTask(channel, playerId, 'm10', 12000)
        if (await check6TribesComplete(playerId, 1)) completeTask(channel, playerId, 'h8', 4000)
        if (await check6TribesComplete(playerId, 3)) completeTask(channel, playerId, 'l6', 5000)
        return endArena(info, entries)
    } else if (info.round === 4) {
        if (entries[0].score > entries[1].score) {
        //1st place outright
            for (let i = 1; i < entries.length; i++) {
                const entry = entries[i]
                const voucher = vouchers[entry.tribe]
                const quantity = entry.score + 2
                const wallet = await Wallet.findOne({ where: { playerId: entry.playerId }})
                wallet[voucher] += quantity
                await wallet.save()
                channel.send({ content: `<@${entry.playerId}> ${getRandomElement(verbs)} ${quantity} ${eval(voucher)} from the Arena. ${getRandomElement(encouragements)}`})
            }

            const tribe = entries[0].tribe
            const playerId = entries[0].playerId
            const profile = await Profile.findOne({ where: { playerId } })
            profile[`${tribe}_wins`]++
            await profile.save()
            await awardCard(channel, playerId, prizes[tribe])

            channel.send({ content: `Congratulations to <@${playerId}> on a brilliant victory` +
                ` with the ${capitalize(tribe)} ${eval(tribe)} deck.` +
                ` ${victories[tribe]}` +
                ` You truly deserve the ${apcs[tribe]}!`
        })

            completeTask(channel, playerId, 'm10', 12000)
            if (await check6TribesComplete(playerId, 1)) completeTask(channel, playerId, 'h8', 4000)
            if (await check6TribesComplete(playerId, 3)) completeTask(channel, playerId, 'l6', 5000)
            return endArena(info, entries)
        } else if ((entries[0].score === entries[1].score) && entries[1].score > entries[2].score) {
        //2 way tie
            for (let i = 2; i < entries.length; i++) {
                const entry = entries[i]
                const voucher = vouchers[entry.tribe]
                const quantity = entry.score + 2
                const wallet = await Wallet.findOne({ where: { playerId: entry.playerId }})
                wallet[voucher] += quantity
                await wallet.save()
                channel.send({ content: `<@${entry.playerId}> ${getRandomElement(verbs)} ${quantity} ${eval(voucher)} from the Arena. ${getRandomElement(encouragements)}`})
                const member = guild.members.cache.get(entry.playerId)
                member.roles.remove(arenaRole)
                entry.score = 0
                await entry.save()
            }

            entries[0].score = 1
            await entries[0].save()

            entries[1].score = 1
            await entries[1].save()

            const title = `<!> <!> <!> ARENA FINALS <!> <!> <!>` 
            const match = `${eval(entries[0].tribe)} <@${entries[0].playerId}> ${eval(entries[0].tribe)}` +
            ` vs ${eval(entries[1].tribe)} <@${entries[1].playerId}> ${eval(entries[1].tribe)}`

            return channel.send({ content: `${title}\n${match}`})
        } else {
        //3 way tie
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i]
                const voucher = vouchers[entry.tribe]
                const quantity = i < 3 ? entry.score + 5 : entry.score + 2
                const wallet = await Wallet.findOne({ where: { playerId: entry.playerId }})
                wallet[voucher] += quantity
                await wallet.save()
                channel.send({ content: `<@${entry.playerId}> ${getRandomElement(verbs)} ${quantity} ${eval(voucher)} from the Arena. ${getRandomElement(encouragements)}`})
            }

            channel.send({ content: `The shadows grew long over the battlefield, and the gladiators had little more left to give. Being so, the elders of the Tribes briefly met to negotiate a temporary ceasefire. No winner could be determined in this Arena.`})
            return endArena(info, entries)
        }
    } else {
        const P1 = await Arena.findOne({ where: { contestant: "P1" }, include: Player})
        const P2 = await Arena.findOne({ where: { contestant: "P2" }, include: Player})
        const P3 = await Arena.findOne({ where: { contestant: "P3" }, include: Player})
        const P4 = await Arena.findOne({ where: { contestant: "P4" }, include: Player})
    
        if (!P1 || !P2 || !P3 || !P4) return channel.send({ content: `Critical error. Missing contestant in the database.`})
    
        const pairings = info.round === 1 ? [[P1, P2], [P3, P4]] :
            info.round === 2 ? [[P1, P3], [P2, P4]] :
            info.round === 3 ? [[P1, P4], [P2, P3]] : 
            null
    
        const title = `${shrine}    ---------    Arena Round ${info.round}    ---------    ${shrine}\n${beast} ${dinosaur} ${dragon} ${fiend} ${fish} ${plant} ${reptile} ${rock} ${spellcaster} ${thunder} ${warrior} ${zombie}` 
        const matches = pairings.map((pairing, index) => {
            if (pairing[0].active === false && pairing[1].active === false) {
                setTimeout(() => doubleForfeit(pairing[0].playerId, pairing[1].playerId), index * 1000 + 1000)
                return `Match ${index + 1}: ~~<@${pairing[0].player.name}~~ vs ~~<@${pairing[1].player.name}>~~ (both forfeit)`
            } else if (pairing[0].active === false && pairing[1].active === true) {
                setTimeout(() => forfeit(winnerId = pairing[1].playerId, loserId = pairing[0].playerId), index * 1000 + 1000)
                return `Match ${index + 1}: ~~<@${pairing[0].player.name}~~ vs <@${pairing[1].player.name}> (${pairing[0].player.name} forfeits)`
            } else if (pairing[0].active === true && pairing[1].active === false) {
                setTimeout(() => forfeit(winnerId = pairing[0].playerId, loserId = pairing[1].playerId), index * 1000 + 1000)
                return `Match ${index + 1}: <@${pairing[0].playerId}> vs ~~<@${pairing[1].playerId}>~~ (${pairing[1].player.name} forfeits)`
            } else {
                return `Match ${index + 1}: <@${pairing[0].playerId}> vs <@${pairing[1].playerId}>`
            }
        })

        return channel.send({ content: `${title}\n${matches.join("\n")}`})
    }
}

//FORFEIT
const forfeit = async (winnerId, loserId) => {
        const channel = client.channels.cache.get(arenaChannelId)
        const info = await Info.findOne({ where: { element: 'arena' } })
		if (!info) return channel.send({ content: `Error: could not find game: "arena".`})

		const losingPlayer = await Player.findOne({ where: { id: loserId }, include: [Arena, Wallet] })
		const winningPlayer = await Player.findOne({ where: { id: winnerId }, include: [Arena, Wallet] })
		if (!winningPlayer || !losingPlayer) return channel.send({ content: `Could not process forfeiture.`})
		
		winningPlayer.wallet.starchips += 5
		await winningPlayer.wallet.save()

		losingPlayer.arena.is_playing = false
		await losingPlayer.arena.save()

		winningPlayer.arena.score++
		winningPlayer.arena.is_playing = false
		await winningPlayer.arena.save()

		channel.send({ content: `${losingPlayer.name} (+0${starchips}), your Arena loss to ${winningPlayer.name} (+5${starchips}) has been recorded.`})
		return checkArenaProgress(info) 
}

//DOUBLE FORFEIT
const doubleForfeit = async (player1Id, player2Id) => {
    const channel = client.channels.cache.get(arenaChannelId)
    const info = await Info.findOne({ where: { element: 'arena' } })
    if (!info) return channel.send({ content: `Error: could not find game: "arena".`})

    const contestant1 = await Player.findOne({ where: { id: player1Id }, include: Player })
    const contestant2 = await Player.findOne({ where: { id: player2Id }, include: Player })
    if (!contestant1 || !contestant2) return channel.send({ content: `Could not process double forfeiture.`})
    
    contestant1.is_playing = false
    await contestant1.save()

    contestant2.is_playing = false
    await contestant2.save()

    channel.send({ content: `The double Arena forfeiture between ${contestant1.player.name} (+0${starchips}) and ${contestant2.player.name} (+0${starchips}) has been recorded.`})
    return checkArenaProgress(info) 
}

//POST STANDINGS
const postStandings = async (info, entries) => {
    const channel = client.channels.cache.get(arenaChannelId)

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        entry.is_playing = true
        await entry.save()
    }

    const title = `${king}  ---  Arena Round ${info.round} Standings  ---  ${king} `
    const standings = entries.map((entry, index) => {
        return `${index + 1}. ${entry.player.name} ${eval(entry.tribe)} - ${entry.score} W`
    })

    info.round++
    await info.save()

    channel.send({ content: `${title}\n${standings.join("\n")}`})
    
    return setTimeout(() => {
        startRound(info, entries)
    }, 10000)
}

//END ARENA
const endArena = async (info, entries) => {
    info.status = 'pending'
    info.round = null
    await info.save()
    const guild = client.guilds.cache.get("842476300022054913")

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const member = guild.members.cache.get(entry.playerId)
        member.roles.remove(arenaRole)
        await entry.destroy()
    }
}

//RESET ARENA
const resetArena = async (info, entries) => {
    info.status = 'pending'
    info.round = null
    await info.save()
    const guild = client.guilds.cache.get("842476300022054913")

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const member = guild.members.cache.get(entry.playerId)
        member.roles.remove(arenaRole)
        entry.active = false
        entry.tribe = null
        entry.contestant = null
        await entry.save()
    }
}

//CHECK ARENA PROGRESS
const checkArenaProgress = async (info) => {
    const entries = await Arena.findAll({ include: Player, order: [["score", "DESC"]]})
    if (!entries) return channel.send({ content: `Critical error. Missing entries in the database.`}) 

    if (info.round === 4) {
        info.round = 5
        await info.save()
        return setTimeout(() => startRound(info, entries), 3000)
    }

    const scores = entries.map((entry) => entry.score)
    const progress_report = entries.map((entry) => entry.is_playing)
    const sum = scores.reduce((a, b) => a + b)

    if (sum % 2 === 0 && !progress_report.includes(true)) return setTimeout(() => postStandings(info, entries), 3000)
}

module.exports = {
    checkArenaProgress,
    endArena,
    getArenaSample,
    resetArena,
    startArena,
    startRound
}
