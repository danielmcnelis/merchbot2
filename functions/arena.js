
const { Arena, Diary, Info, Player, Profile, Wallet, Match } = require('../db')
const { Op } = require('sequelize')
const { yescom, nocom } = require('../static/commands.json')
const { fire, tix, credits, blue, red, stoned, stare, wokeaf, koolaid, cavebob, evil, DOC, milleye, merchant, FiC, approve, lmfao, god, legend, master, diamond, platinum, gold, silver, bronze, rocks, sad, mad, beast, dinosaur, fish, plant, reptile, rock, starchips, egg, cactus, hook, moai, mushroom, rose, stardust, com, rar, sup, ult, scr, checkmark, emptybox } = require('../static/emojis.json')
const { arenaRole } = require('../static/roles.json')
const { arenaChannelId } = require('../static/channels.json')
const { client } = require('../static/clients.js')
const { completeTask } = require('./diary')
const { shuffleArray, getRandomElement, capitalize } = require('./utility.js')
const { awardCard } = require('./award.js')
const { decks, vouchers, prizes, victories, apcs, verbs, encouragements } = require('../static/arenas.json')

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
    const arenaChannel = client.channels.cache.get(arenaChannelId)
    arenaChannel.send(`Arena players, please check your DMs!`)
    const allArenaEntries = await Arena.findAll({ include: Player })
    const contestants = shuffleArray(["P1", "P2", "P3", "P4", "P5", "P6"])

    getConfirmation(guild, allArenaEntries[0], contestants[0])
    getConfirmation(guild, allArenaEntries[1], contestants[1])
    getConfirmation(guild, allArenaEntries[2], contestants[2])
    getConfirmation(guild, allArenaEntries[3], contestants[3])
    getConfirmation(guild, allArenaEntries[4], contestants[4])
    getConfirmation(guild, allArenaEntries[5], contestants[5])

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

            if (count === 6 && !active) {
                info.round = 1
                info.status = 'active'
                await info.save()
                assignArenaRoles(guild, allArenaEntries)
                setTimeout(() => {
                    channel.send(`<@&${arenaRole}>, square-up gamers! The Arena starts in 10 seconds. ${cavebob}\n\nP.S. If you aren't playing within 5 minutes of this message, **it's a game loss**!`)
                }, 1000)
                return setTimeout(() => {
                    return startRound(info)
                }, 11000)
            }
        }, i * 5000)

    return setTimeout(async () => {
        const count = await Arena.count({ where: {
            active: true
        } })

        if (count !== 6) {
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
            
            return arenaChannel.send(`Unfortunately, The Arena cannot begin without 6 players.\n\nThe following players have been removed from the queue:\n${names.sort().join("\n")}`)
        } else {
            info.round = 1
            info.status = 'active'
            await info.save()
            assignArenaRoles(guild, allArenaEntries)
            setTimeout(() => {
                channel.send(`<@&${arenaRole}>, square-up gamers! The Arena starts in 10 seconds. ${cavebob}\n\nP.S. If you aren't playing within 5 minutes of this message, **it's a game loss**!`)
            }, 1000)
            return setTimeout(() => {
                return startRound(info)
            }, 11000)
        }
    }, 61000)
}

const getConfirmation = async (guild, arena_entry, contestant) => {
    const arenaChannel = client.channels.cache.get(arenaChannelId)
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
            member.send(`Thanks! This is your Arena deck (staples in the side). You may cut it down to 40 cards:\n${decks[tribe].url}\n${decks[tribe].screenshot}`)
            return arenaChannel.send(`${member.user.username} confirmed their participation in the Arena!`)
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
        member.roles.add(arenaRole)
    })
}

const startRound = async (info, entries) => {
    const arenaChannel = client.channels.cache.get(arenaChannelId)
    const guild = client.guilds.cache.get("842476300022054913")

    if (info.round === 7) {
        const voucher = vouchers[entries[1].tribe]
        const quantity = 5
        const wallet = await Wallet.findOne({ where: { playerId: entries[1].playerId }})
        wallet[voucher] += quantity
        await wallet.save()
        arenaChannel.send(`<@${entries[1].playerId}> ${getRandomElement(verbs)} ${quantity} ${eval(voucher)} from the Arena. ${getRandomElement(encouragements)}`)
        
        const tribe = entries[0].tribe
        const playerId = entries[0].playerId
        const profile = await Profile.findOne({ where: { playerId } })
        profile[`${tribe}_wins`]++
        await profile.save()
        await awardCard(arenaChannel, playerId, prizes[tribe])

        arenaChannel.send(`Congratulations to <@${playerId}> on a brilliant victory` +
            ` with the ${capitalize(tribe)} ${eval(tribe)} deck.` +
            ` ${victories[tribe]}` +
            ` You truly deserve the ${apcs[tribe]}!`
        )

        completeTask(arenaChannel, playerId, 'm10', 12000)
        return endArena(arenaChannel, info, entries)
    } else if (info.round === 6) {
        if (entries[0].score > entries[1].score) {
        //1st place outright
            for (let i = 1; i < entries.length; i++) {
                const entry = entries[i]
                const voucher = vouchers[entry.tribe]
                const quantity = entry.score + 1
                const wallet = await Wallet.findOne({ where: { playerId: entry.playerId }})
                wallet[voucher] += quantity
                await wallet.save()
                arenaChannel.send(`<@${entry.playerId}> ${getRandomElement(verbs)} ${quantity} ${eval(voucher)} from the Arena. ${getRandomElement(encouragements)}`)
            }

            const tribe = entries[0].tribe
            const playerId = entries[0].playerId
            const profile = await Profile.findOne({ where: { playerId } })
            profile[`${tribe}_wins`]++
            await profile.save()
            await awardCard(arenaChannel, playerId, prizes[tribe])

            arenaChannel.send(`Congratulations to <@${playerId}> on a brilliant victory` +
                ` with the ${capitalize(tribe)} ${eval(tribe)} deck.` +
                ` ${victories[tribe]}` +
                ` You truly deserve the ${apcs[tribe]}!`
            )

            completeTask(arenaChannel, playerId, 'm10', 12000)
            return endArena( arenaChannel, info, entries)
        } else if ((entries[0].score === entries[1].score) && entries[1].score > entries[2].score) {
        //2 way tie
            for (let i = 2; i < entries.length; i++) {
                const entry = entries[i]
                const voucher = vouchers[entry.tribe]
                const quantity = entry.score + 1
                const wallet = await Wallet.findOne({ where: { playerId: entry.playerId }})
                wallet[voucher] += quantity
                await wallet.save()
                arenaChannel.send(`<@${entry.playerId}> ${getRandomElement(verbs)} ${quantity} ${eval(voucher)} from the Arena. ${getRandomElement(encouragements)}`)
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

            return arenaChannel.send(`${title}\n${match}`)
        } else if ((entries[0].score === entries[1].score === entries[2].score) && entries[2].score > entries[3].score) {
        //3 way tie
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i]
                const voucher = vouchers[entry.tribe]
                const quantity = i < 3 ? entry.score + 4 : entry.score + 1
                const wallet = await Wallet.findOne({ where: { playerId: entry.playerId }})
                wallet[voucher] += quantity
                await wallet.save()
                arenaChannel.send(`<@${entry.playerId}> ${getRandomElement(verbs)} ${quantity} ${eval(voucher)} from the Arena. ${getRandomElement(encouragements)}`)
            }

            arenaChannel.send(`The shadows grew long over the battlefield, and the gladiators had little more left to give. Being so, the elders of the Tribes briefly met to negotiate a temporary ceasefire. No winner could be determined in this Arena.`)
            return endArena( arenaChannel, info, entries)
        } else if ((entries[0].score === entries[1].score === entries[2].score === entries[3].score) && entries[3].score > entries[4].score) {
        //4 way tie
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i]
                const voucher = vouchers[entry.tribe]
                const quantity = i < 4 ? entry.score + 3 : entry.score + 1
                const wallet = await Wallet.findOne({ where: { playerId: entry.playerId }})
                wallet[voucher] += quantity
                await wallet.save()
                arenaChannel.send(`<@${entry.playerId}> ${getRandomElement(verbs)} ${quantity} ${eval(voucher)} from the Arena. ${getRandomElement(encouragements)}`)
            }

            arenaChannel.send(`The shadows grew long over the battlefield, and the gladiators had little more left to give. Being so, the elders of the Tribes briefly met to negotiate a temporary ceasefire. No winner could be determined in this Arena.`)
            return endArena( arenaChannel, info, entries)
        } else {
             //5 way tie
             for (let i = 0; i < entries.length; i++) {
                const entry = entries[i]
                const voucher = vouchers[entry.tribe]
                const quantity = i < 5 ? entry.score + 3 : entry.score + 1
                const wallet = await Wallet.findOne({ where: { playerId: entry.playerId }})
                wallet[voucher] += quantity
                await wallet.save()
                arenaChannel.send(`<@${entry.playerId}> ${getRandomElement(verbs)} ${quantity} ${eval(voucher)} from the Arena. ${getRandomElement(encouragements)}`)
            }

            arenaChannel.send(`The shadows grew long over the battlefield, and the gladiators had little more left to give. Being so, the elders of the Tribes briefly met to negotiate a temporary ceasefire. No winner could be determined in this Arena.`)
            return endArena( arenaChannel, info, entries)
        }
    } else {
        const P1 = await Arena.findOne({ where: { contestant: "P1" }, include: Player})
        const P2 = await Arena.findOne({ where: { contestant: "P2" }, include: Player})
        const P3 = await Arena.findOne({ where: { contestant: "P3" }, include: Player})
        const P4 = await Arena.findOne({ where: { contestant: "P4" }, include: Player})
        const P5 = await Arena.findOne({ where: { contestant: "P5" }, include: Player})
        const P6 = await Arena.findOne({ where: { contestant: "P6" }, include: Player})
    
        if (!P1 || !P2 || !P3 || !P4 || !P5 || !P6) return arenaChannel.send(`Critical error. Missing contestant in the database.`)
    
        const pairings = info.round === 1 ? [[P1, P2], [P3, P4], [P5, P6]] :
            info.round === 2 ? [[P1, P3], [P2, P5], [P4, P6]] :
            info.round === 3 ? [[P1, P4], [P2, P6], [P3, P5]] : 
            info.round === 4 ? [[P1, P5], [P2, P4], [P3, P6]] : 
            info.round === 5 ? [[P1, P6], [P2, P3], [P4, P5]] : 
            null
    
        const title = `------  Arena Round ${info.round}  ------\n${beast}   ${dinosaur}   ${fish}   ${plant}   ${reptile}   ${rock}` 
        const matches = pairings.map((pairing, index) => {
            if (pairing[0].active === false && pairing[1].active === false) {
                setTimout(() => doubleForfeit(pairing[0].playerId, pairing[1].playerId), index * 1000 + 1000)
                return `Match ${index + 1}: ~~<@${pairing[0].player.name}~~ vs ~~<@${pairing[1].player.name}>~~ (both forfeit)`
            } else if (pairing[0].active === false && pairing[1].active === true) {
                setTimout(() => forfeit(winnerId = pairing[1].playerId, loserId = pairing[0].playerId), index * 1000 + 1000)
                return `Match ${index + 1}: ~~<@${pairing[0].player.name}~~ vs <@${pairing[1].player.name}> (${pairing[0].player.name} forfeits)`
            } else if (pairing[0].active === true && pairing[1].active === false) {
                setTimout(() => forfeit(winnerId = pairing[0].playerId, loserId = pairing[1].playerId), index * 1000 + 1000)
                return `Match ${index + 1}: <@${pairing[0].playerId}> vs ~~<@${pairing[1].playerId}>~~ (${pairing[1].player.name} forfeits)`
            } else {
                return `Match ${index + 1}: <@${pairing[0].playerId}> vs <@${pairing[1].playerId}>`
            }
        })

        return arenaChannel.send(`${title}\n${matches.join("\n")}`)
    }
}

const forfeit = async (winnerId, loserId) => {
		const info = await Info.findOne({ where: { element: 'arena' } })
		if (!info) return message.channel.send(`Error: could not find game: "arena".`)

		const losingContestant = await Arena.findOne({ where: { playerId: loserId }})
		const winningContestant = await Arena.findOne({ where: { playerId: winnerId }})
		if (!winningContestant || !losingContestant) return message.channel.send(`Could not process forfeiture.`)
		
		winningContestant.wallet.starchips += 3
		await winningPlayer.wallet.save()

		losingContestant.is_playing = false
		await losingContestant.save()

		winningContestant.score++
		winningContestant.is_playing = false
		await winningContestant.save()

		message.channel.send(`${losingPlayer.name} (+0${starchips}), your Arena loss to ${winner.user.username} (+3${starchips}) has been recorded.`)
		return checkArenaProgress(info) 
}

const doubleForfeit = async (player1Id, player2Id) => {
    const info = await Info.findOne({ where: { element: 'arena' } })
    if (!info) return message.channel.send(`Error: could not find game: "arena".`)

    const contestant1 = await Arena.findOne({ where: { playerId: player1Id }, include: Player })
    const contestant2 = await Arena.findOne({ where: { playerId: player2Id }, include: Player })
    if (!contestant1 || !contestant2) return message.channel.send(`Could not process double forfeiture.`)
    
    contestant1.is_playing = false
    await contestant1.save()

    contestant2.is_playing = false
    await contestant2.save()

    message.channel.send(`The double Arena forfeiture between ${contestant1.player.name} (+0${starchips}) and ${contestant2.player.name} (+0${starchips}) has been recorded.`)
    return checkArenaProgress(info) 
}

const postStandings = async (info, entries) => {
    const arenaChannel = client.channels.cache.get(arenaChannelId)

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        entry.is_playing = true
        await entry.save()
    }

    const title = `---  Arena Round ${info.round} Standings  ---`
    const standings = entries.map((entry, index) => {
        return `${index + 1}. ${entry.player.name} ${eval(entry.tribe)} - ${entry.score} W`
    })

    info.round++
    await info.save()

    arenaChannel.send(`${title}\n${standings.join("\n")}`)
    
    return setTimeout(() => {
        startRound(info, entries)
    }, 10000)
}

const endArena = async (channel, info, entries) => {
    info.status = 'pending'
    info.round = null
    await info.save()
    const guild = client.guilds.cache.get("842476300022054913")

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const member = guild.members.cache.get(entry.playerId)
        member.roles.remove(arenaRole)
        completeTask(channel, entry.playerId, 'e12', i * 2000 + 2000)
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
        member.roles.remove(arenaRole)
        entry.active = false
        entry.tribe = null
        entry.contestant = null
        await entry.save()
    }
}

const checkArenaProgress = async (info) => {
    const entries = await Arena.findAll({ include: Player, order: [["score", "DESC"]]})
    if (!entries) return arenaChannel.send(`Critical error. Missing entries in the database.`) 

    if (info.round === 6) {
        info.round = 7
        await info.save()
        return setTimeout(() => startRound(info, entries), 3000)
    }

    const scores = entries.map((entry) => entry.score)
    const progress_report = entries.map((entry) => entry.is_playing)
    const sum = scores.reduce((a, b) => a + b)

    if (sum % 3 === 0 && !progress_report.includes(true)) return setTimeout(() => postStandings(info, entries), 3000)
}

module.exports = {
    checkArenaProgress,
    endArena,
    getArenaSample,
    resetArena,
    startArena,
    startRound
}
