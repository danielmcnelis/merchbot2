
const { Draft, Diary, Info, Player, Pool, Print, Profile, Set, Wallet, Match, Inventory } = require('../db')
const { Op } = require('sequelize')
const { yescom, nocom } = require('../static/commands.json')
const { king, shrine, gem, orb, swords, beast, blue, bronze, cactus, cavebob, checkmark, com, credits, cultured, diamond, dinosaur, DOC, dragon, draft, egg, emptybox, evil, FiC, fire, fish, god, gold, hook, koolaid, leatherbound, legend, lmfao, mad, master, merchant, milleye, moai, mushroom, no, ORF, TEB, warrior, spellcaster, plant, platinum, rar, red, reptile, rock, rocks, rose, sad, scr, silver, soldier, starchips, stardust, stare, stoned, sup, tix, ult, wokeaf, yellow, yes, ygocard } = require('../static/emojis.json')
const { draftRole } = require('../static/roles.json')
const { draftChannelId } = require('../static/channels.json')
const { client } = require('../static/clients.js')
const { completeTask } = require('./diary')
const { shuffleArray, getRandomElement, getRandomSubset, capitalize } = require('./utility.js')
const { awardCard } = require('./award.js')

//START DRAFT
const startDraft = async(guild) => {
    const draftChannel = client.channels.cache.get(draftChannelId)
    draftChannel.send(`Draft players, please check your DMs!`)
    const allDraftEntries = await Draft.findAll({ include: Player })
    const contestants = shuffleArray(["P1", "P2", "P3", "P4"])

    getConfirmation(guild, allDraftEntries[0], contestants[0])
    getConfirmation(guild, allDraftEntries[1], contestants[1])
    getConfirmation(guild, allDraftEntries[2], contestants[2])
    getConfirmation(guild, allDraftEntries[3], contestants[3])

    const info = await Info.findOne({ where: {
        element: 'draft'
    }})

    for (let i = 1; i < 12; i ++) {
        setTimeout(async () => {
            const count = await Draft.count({ where: {
                active: true
            } })
    
            const active = await Info.count({ where: {
                element: 'draft',
                status: 'active'
            } })

            if (count === 4 && !active) {
                info.round = 1
                info.status = 'active'
                await info.save()
                assignDraftRoles(guild, allDraftEntries)
                setTimeout(() => {
                    draftChannel.send(`<@&${draftRole}>, pay attention nerds! The Draft starts in 10 seconds. ${koolaid}`)
                }, 1000)
                return setTimeout(() => {
                    return startDraftRound(info)
                }, 11000)
            }
        }, i * 5000)
    }

    return setTimeout(async () => {
        const count = await Draft.count({ where: {
            active: true
        } })

        const active = await Info.count({ where: {
            element: 'draft',
            status: 'active'
        } })

        if (count !== 4 && !active) {
            const missingDraftEntries = await Draft.findAll({ 
                where: { 
                    active: false
                },
                include: Player
            })

            const names = missingDraftEntries.map((entry) => entry.player.name)

            await resetDraft(info, allDraftEntries)

            for (let i = 0; i < missingDraftEntries.length; i++) {
                const entry = missingDraftEntries[i]
                await entry.destroy()
            }
            
            return draftChannel.send(`Unfortunately, The Draft cannot begin without 4 players.\n\nThe following players have been removed from the queue:\n${names.sort().join("\n")}`)
        } else if (count === 4 && !active) {
            info.count = 1
            info.round = 1
            info.status = 'drafting'
            await info.save()
            assignDraftRoles(guild, allDraftEntries)
            setTimeout(() => {
                draftChannel.send(`<@&${draftRole}>, pay attention nerds! The Draft starts in 10 seconds. ${koolaid}`)
            }, 1000)
            return setTimeout(() => {
                return createPacks()
            }, 11000)
        }
    }, 61000)
}

//GET CONFIRMATION
const getConfirmation = async (guild, draft_entry) => {
    const draftChannel = client.channels.cache.get(draftChannelId)
    const playerId = draft_entry.playerId
    const member = guild.members.cache.get(playerId)
    if (!member || playerId !== member.user.id) return
    const filter = m => m.author.id === playerId
	const msg = await member.send(`Do you still wish to participate in the Draft?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 60000
	}).then(async collected => {
		const response = collected.first().content.toLowerCase()

        const count = await Info.count({ where: {
            element: 'draft',
            status: 'confirming'
        } })

        if (!count) return member.send(`Sorry, time expired.`)

        if(yescom.includes(response)) {
            draft_entry.active = true
            await draft_entry.save()
            member.send(`Thanks! The Draft will be starting soon. Look out for more DMs.`)
            return draftChannel.send(`${member.user.username} confirmed their participation in the Draft!`)
        } else {
            member.send(`Okay, sorry to see you go!`)
            return draftChannel.send(`Yikes. ${member.user.username} dodged the Draft!`)
        }
	}).catch(err => {
		console.log(err)
        return member.send(`Sorry, time's up.`)
	})
}

//ASSIGN DRAFT ROLES
const assignDraftRoles = (guild, entries) => {
    entries.forEach((entry) => {
        const member = guild.members.cache.get(entry.playerId)
        member.roles.add(draftRole)
    })
}


//CREATE PACKS
const createPacks = async () => {
    const draftChannel = client.channels.cache.get(draftChannelId)
    const set = await Set.findOne({ where: { code: 'GL1' } })
    if (!set) return draftChannel.send(`Could not find set.`)

	const commons = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "com"
		},
		order: [['card_slot', 'ASC']]
	}).map((print) => print.card_code)

	const rares = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "rar"
		},
		order: [['card_slot', 'ASC']]
	}).map((print) => print.card_code)

	const supers = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "sup"
		},
		order: [['card_slot', 'ASC']]
	}).map((print) => print.card_code)


    for (let j = 0; j < 4; j++) {
        const pack_commons = getRandomSubset(commons, 12)
        const pack_rares = getRandomSubset(rares, 5)
        const pack_super = getRandomElement(supers)
        const pack = [...pack_commons, ...pack_rares, pack_super]
        pack.sort((a, b) => a - b)
        const pack_code = `pack_${j + 1}`
        console.log(pack_code, pack)
    
        for (let i = 0; i < pack.length; i++) {
            const card_code = pack[i]
            const print = await Print.findOne({ where: { card_code: card_code }})
            if (!print.id) return message.channel.send(`${card_code} does not exist in the Print database.`)
    
            const pool = await Pool.create({ 
                pack_code: pack_code,
                card_code: print.card_code,
                card_name: print.card_name
            })

            if (!pool) return message.channel.send(`Error creating Draft Pool.`)
        }
    }

    return draftCards()
}

// DRAFT CARDS
const draftCards = async () => {
    const info = await Info.findOne({ where: { element: 'draft' }})
    const entries = await Draft.findAll({ order: [['contestant', 'ASC']] })
    const pack_1 = await Pool.findAll({ where: { pack_code: 'pack_1' }, include: Print, order: [['card_code', 'ASC']] })
    const pack_2 = await Pool.findAll({ where: { pack_code: 'pack_2' }, include: Print, order: [['card_code', 'ASC']] })
    const pack_3 = await Pool.findAll({ where: { pack_code: 'pack_3' }, include: Print, order: [['card_code', 'ASC']] })
    const pack_4 = await Pool.findAll({ where: { pack_code: 'pack_4' }, include: Print, order: [['card_code', 'ASC']] })

    const P1_pack = info.count % 4 === 1 ? pack_1 :
        info.count % 4 === 2 && info.round % 2 === 1 ? pack_2 :
        info.count % 4 === 2 && info.round % 2 === 0 ? pack_4 :
        info.count % 4 === 3 ? pack_3 :
        info.count % 4 === 0 && info.round % 2 === 1 ? pack_4 :
        pack_2 
        
    const P2_pack = info.count % 4 === 1 ? pack_2 :
        info.count % 4 === 2 && info.round % 2 === 1 ? pack_3 :
        info.count % 4 === 2 && info.round % 2 === 0 ? pack_1 :
        info.count % 4 === 3 ? pack_4 :
        info.count % 4 === 0 && info.round % 2 === 1 ? pack_1 :
        pack_3 

    const P3_pack = info.count % 4 === 1 ? pack_3 :
        info.count % 4 === 2 && info.round % 2 === 1 ? pack_4 :
        info.count % 4 === 2 && info.round % 2 === 0 ? pack_2 :
        info.count % 4 === 3 ? pack_1 :
        info.count % 4 === 0 && info.round % 2 === 1 ? pack_2 :
        pack_4 

    const P4_pack = info.count % 4 === 1 ? pack_4 :
        info.count % 4 === 2 && info.round % 2 === 1 ? pack_1 :
        info.count % 4 === 2 && info.round % 2 === 0 ? pack_3 :
        info.count % 4 === 3 ? pack_2 :
        info.count % 4 === 0 && info.round % 2 === 1 ? pack_3 :
        pack_1
        
    getPick(entries[0], P1_pack)
    getPick(entries[1], P2_pack)
    getPick(entries[2], P3_pack)
    getPick(entries[3], P4_pack)

    return setTimeout(async() => {
        if (info.count <= 15) {
            info.count ++
            await info.save()
            return draftCards()
        } else if (info.round <= 3) {
            info.count = 1
            info.round++
            await info.save()
            return draftCards()
        } else {
            info.count = null
            info.round = 1
            info.status = 'dueling'
            await info.save()
            return startDraftRound(info, entries)
        }
    }, 20000)
}

//GET PICK
const getPick = async (entry, pack) => {
    const playerId = entry.playerId
    const member = guild.members.cache.get(playerId)
    if (!member || playerId !== member.user.id) return

    const cards = pack.map((p, index) => `(${index + 1}) - ${eval(p.print.rarity)}${p.card_code} - ${p.card_name}` )

    const filter = m => m.author.id === playerId
	const msg = await member.send(`Please select a card:\n${cards.join('\n')}`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 18000
	}).then(async collected => {
		const response = collected.first().content
        let pool_selection
        if (pack.length > 0 && (response.replaceAll("\\D", "") === 1 || response.includes(pack[0].card_name))) pool_selection = pack[0]
        if (pack.length > 1 && (response.replaceAll("\\D", "") === 2 || response.includes(pack[1].card_name))) pool_selection = pack[1]
        if (pack.length > 2 && (response.replaceAll("\\D", "") === 3 || response.includes(pack[2].card_name))) pool_selection = pack[2]
        if (pack.length > 3 && (response.replaceAll("\\D", "") === 4 || response.includes(pack[3].card_name))) pool_selection = pack[3]
        if (pack.length > 4 && (response.replaceAll("\\D", "") === 5 || response.includes(pack[4].card_name))) pool_selection = pack[4]
        if (pack.length > 5 && (response.replaceAll("\\D", "") === 6 || response.includes(pack[5].card_name))) pool_selection = pack[5]
        if (pack.length > 6 && (response.replaceAll("\\D", "") === 7 || response.includes(pack[6].card_name))) pool_selection = pack[6]
        if (pack.length > 7 && (response.replaceAll("\\D", "") === 8 || response.includes(pack[7].card_name))) pool_selection = pack[7]
        if (pack.length > 8 && (response.replaceAll("\\D", "") === 9 || response.includes(pack[8].card_name))) pool_selection = pack[8]
        if (pack.length > 9 && (response.replaceAll("\\D", "") === 10 || response.includes(pack[9].card_name))) pool_selection = pack[9]
        if (pack.length > 10 && (response.replaceAll("\\D", "") === 11 || response.includes(pack[10].card_name))) pool_selection = pack[10]
        if (pack.length > 11 && (response.replaceAll("\\D", "") === 12 || response.includes(pack[11].card_name))) pool_selection = pack[11]
        if (pack.length > 12 && (response.replaceAll("\\D", "") === 13 || response.includes(pack[12].card_name))) pool_selection = pack[12]
        if (pack.length > 13 && (response.replaceAll("\\D", "") === 14 || response.includes(pack[13].card_name))) pool_selection = pack[13]
        if (pack.length > 14 && (response.replaceAll("\\D", "") === 15 || response.includes(pack[14].card_name))) pool_selection = pack[14]
        if (pack.length > 15 && (response.replaceAll("\\D", "") === 16 || response.includes(pack[15].card_name))) pool_selection = pack[15]
        if (pack.length > 16 && (response.replaceAll("\\D", "") === 17 || response.includes(pack[16].card_name))) pool_selection = pack[16]
        if (pack.length > 17 && (response.replaceAll("\\D", "") === 18 || response.includes(pack[17].card_name))) pool_selection = pack[17]
        
        const card = `${eval(pool_selection.print.rarity)}${pool_selection.card_code} - ${pool_selection.card_name}`

        console.log('time', time)
        if (!pool_selection) return false

        const inv = await Inventory.findOne({ where: {
            card_code: pool_selection.card_code,
            draft: true,
            printId: pool_selection.printId,
            playerId: playerId
        }})

        if (inv) {
            inv.quantity++
            await inv.save()
        } else {
            await Inventory.create({ 
                card_code: pool_selection.card_code,
                quantity: 1,
                draft: true,
                printId: pool_selection.printId,
                playerId: playerId
            })
        }
        return member.send(`Thanks! You selected: ${card}.`)
	}).catch(async err => {
		console.log(err)
        const pool_selection = await autoDraft(entry, pack)
        const card = `${eval(pool_selection.print.rarity)}${pool_selection.card_code} - ${pool_selection.card_name}`
        const inv = await Inventory.findOne({ where: {
            card_code: pool_selection.card_code,
            draft: true,
            printId: pool_selection.printId,
            playerId: playerId
        }})
    
        if (inv) {
            inv.quantity++
            await inv.save()
        } else {
            await Inventory.create({ 
                card_code: pool_selection.card_code,
                quantity: 1,
                draft: true,
                printId: pool_selection.printId,
                playerId: playerId
            })
        }
    
        await pool_selection.destroy()
        return member.send(`Time's up! You auto-drafted: ${card}.`)
	})
}

//AUTO DRAFT
const autoDraft = async (entry, pack) => {
    const playerId = entry.playerId
    let options = []

    for (let i = 0; i < pack.length; i++) {
        const pool = pack[i]
        if (pool.print.rarity === 'sup') { 
            options.push(pool)
            break
        } else if (pool.print.rarity === 'rar') {
            options.push(pool)
        } else if (options.length && options[0].print.rarity !== 'rar') {
            options.push(pool)
        }
    }

    const pool_selection = getRandomElement(options)
    return pool_selection
}


//START DRAFT ROUND
const startDraftRound = async (info, entries) => {
    const draftChannel = client.channels.cache.get(draftChannelId)
    const guild = client.guilds.cache.get("842476300022054913")

    if (info.round === 5) {
        const playerId = entries[0].playerId
        draftChannel.send(`Congratulations to <@${playerId}> on an impressive showing! You truly deserve the TBD!`)
        return endDraft(draftChannel, info, entries)
    } else if (info.round === 4) {
        if (entries[0].score > entries[1].score) {
        //1st place outright
            for (let i = 1; i < entries.length; i++) {
                const entry = entries[i]
                draftChannel.send(`<@${entry.playerId}> garnered X TBD from the Draft. Congrats!`)
            }

            const playerId = entries[0].playerId
            const player = await Player.findOne({ where: { id: playerId } })
            player.draft_wins++
            await player.save()
            draftChannel.send(`Congratulations to <@${playerId}> on an impressive showing! You truly deserve the TBD!`)
            return endDraft( draftChannel, info, entries)
        } else if ((entries[0].score === entries[1].score) && entries[1].score > entries[2].score) {
        //2 way tie
            for (let i = 2; i < entries.length; i++) {
                const entry = entries[i]
                draftChannel.send(`<@${entry.playerId}> garnered X TBD from the Draft. Congrats!`)
                const member = guild.members.cache.get(entry.playerId)
                member.roles.remove(draftRole)
                entry.score = 0
                await entry.save()
            }

            entries[0].score = 1
            await entries[0].save()

            entries[1].score = 1
            await entries[1].save()

            const title = `<!> <!> <!> DRAFT FINALS <!> <!> <!>` 
            const match = `<@${entries[0].playerId}> vs <@${entries[1].playerId}>`

            return draftChannel.send(`${title}\n${match}`)
        } else {
        //3 way tie
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i]
                draftChannel.send(`<@${entry.playerId}> garnered X TBD from the Draft. Congrats!`)
            }

            draftChannel.send(`No winner could be determined in this Draft.`)
            return endDraft( draftChannel, info, entries)
        }
    } else {
        const P1 = await Draft.findOne({ where: { contestant: "P1" }, include: Player})
        const P2 = await Draft.findOne({ where: { contestant: "P2" }, include: Player})
        const P3 = await Draft.findOne({ where: { contestant: "P3" }, include: Player})
        const P4 = await Draft.findOne({ where: { contestant: "P4" }, include: Player})
    
        if (!P1 || !P2 || !P3 || !P4) return draftChannel.send(`Critical error. Missing contestant in the database.`)
    
        const pairings = info.round === 1 ? [[P1, P2], [P3, P4]] :
            info.round === 2 ? [[P1, P3], [P2, P4]] :
            info.round === 3 ? [[P1, P4], [P2, P3]] : 
            null
    
        const title = `${draft}  ------  Draft Round ${info.round}  ------  ${draft}\n` 
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

        return draftChannel.send(`${title}\n${matches.join("\n")}`)
    }
}

//FORFEIT
const forfeit = async (winnerId, loserId) => {
		const info = await Info.findOne({ where: { element: 'draft' } })
		if (!info) return message.channel.send(`Error: could not find game: "draft".`)

		const losingPlayer = await Player.findOne({ where: { id: loserId }, include: [Draft, Wallet] })
		const winningPlayer = await Player.findOne({ where: { id: winnerId }, include: [Draft, Wallet] })
		if (!winningPlayer || !losingPlayer) return message.channel.send(`Could not process forfeiture.`)
		
		winningPlayer.wallet.starchips += 12
		await winningPlayer.wallet.save()

		losingPlayer.draft.is_playing = false
		await losingPlayer.draft.save()

		winningPlayer.draft.score++
		winningPlayer.draft.is_playing = false
		await winningPlayer.draft.save()

		message.channel.send(`${losingPlayer.name} (+0${starchips}), your Draft loss to ${winningPlayer.name} (+12${starchips}) has been recorded.`)
		return checkDraftProgress(info) 
}

//DOUBLE FORFEIT
const doubleForfeit = async (player1Id, player2Id) => {
    const info = await Info.findOne({ where: { element: 'draft' } })
    if (!info) return message.channel.send(`Error: could not find game: "draft".`)

    const contestant1 = await Player.findOne({ where: { id: player1Id }, include: Player })
    const contestant2 = await Player.findOne({ where: { id: player2Id }, include: Player })
    if (!contestant1 || !contestant2) return message.channel.send(`Could not process double forfeiture.`)
    
    contestant1.is_playing = false
    await contestant1.save()

    contestant2.is_playing = false
    await contestant2.save()

    message.channel.send(`The double Draft forfeiture between ${contestant1.player.name} (+0${starchips}) and ${contestant2.player.name} (+0${starchips}) has been recorded.`)
    return checkDraftProgress(info) 
}

//POST STANDINGS
const postStandings = async (info, entries) => {
    const draftChannel = client.channels.cache.get(draftChannelId)

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        entry.is_playing = true
        await entry.save()
    }

    const title = `${king}  ---  Draft Round ${info.round} Standings  ---  ${king} `
    const standings = entries.map((entry, index) => {
        return `${index + 1}. ${entry.player.name} - ${entry.score} W`
    })

    info.round++
    await info.save()

    draftChannel.send(`${title}\n${standings.join("\n")}`)
    
    return setTimeout(() => {
        startDraftRound(info, entries)
    }, 10000)
}

//END DRAFT
const endDraft = async (channel, info, entries) => {
    info.status = 'pending'
    info.round = null
    await info.save()
    const guild = client.guilds.cache.get("842476300022054913")

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const member = guild.members.cache.get(entry.playerId)
        member.roles.remove(draftRole)
        await entry.destroy()
    }
}

//RESET DRAFT
const resetDraft = async (info, entries) => {
    info.status = 'pending'
    info.round = null
    await info.save()
    const guild = client.guilds.cache.get("842476300022054913")

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const member = guild.members.cache.get(entry.playerId)
        member.roles.remove(draftRole)
        entry.active = false
        entry.contestant = null
        await entry.save()
    }
}

//CHECK DRAFT PROGRESS
const checkDraftProgress = async (info) => {
    const entries = await Draft.findAll({ include: Player, order: [["score", "DESC"]]})
    if (!entries) return draftChannel.send(`Critical error. Missing entries in the database.`) 

    if (info.round === 4) {
        info.round = 5
        await info.save()
        return setTimeout(() => startDraftRound(info, entries), 3000)
    }

    const scores = entries.map((entry) => entry.score)
    const progress_report = entries.map((entry) => entry.is_playing)
    const sum = scores.reduce((a, b) => a + b)

    if (sum % 2 === 0 && !progress_report.includes(true)) return setTimeout(() => postStandings(info, entries), 3000)
}

module.exports = {
    checkDraftProgress,
    endDraft,
    resetDraft,
    startDraft,
    startDraftRound
}
