


const Canvas = require('canvas')
const Discord = require('discord.js')
const fs = require('fs')
const { Card, Draft, Diary, Info, Player, Pool, Print, Profile, Set, Wallet, Match, Inventory } = require('../db')
const { Op } = require('sequelize')
const { yescom, nocom } = require('../static/commands.json')
const { galaxy, king, shrine, gem, orb, swords, beast, blue, bronze, cactus, cavebob, checkmark, com, credits, cultured, diamond, dinosaur, DOC, dragon, draft, egg, emptybox, evil, FiC, fire, fish, god, gold, hook, koolaid, leatherbound, legend, lmfao, mad, master, merchant, milleye, moai, mushroom, no, ORF, TEB, warrior, spellcaster, plant, platinum, rar, red, reptile, rock, rocks, rose, sad, scr, silver, soldier, starchips, stardust, stare, stoned, sup, tix, ult, wokeaf, yellow, yes, ygocard } = require('../static/emojis.json')
const { draftRole } = require('../static/roles.json')
const { draftChannelId } = require('../static/channels.json')
const { client } = require('../static/clients.js')
const { completeTask } = require('./diary.js')
const { findCard } = require('./search.js')
const { shuffleArray, getRandomElement, getRandomSubset, capitalize } = require('./utility.js')
const { awardCard } = require('./award.js')

//START DRAFT
const startDraft = async(fuzzyPrints) => {
    const channel = client.channels.cache.get(draftChannelId)
    channel.send(`Draft players, please check your DMs!`)
    const entries = await Draft.findAll({ include: Player })
    const contestants = shuffleArray(["P1", "P2", "P3", "P4"])

    getConfirmation(entries[0], contestants[0])
    getConfirmation(entries[1], contestants[1])
    getConfirmation(entries[2], contestants[2])
    getConfirmation(entries[3], contestants[3])

    const info = await Info.findOne({ where: {
        element: 'draft'
    }})

    for (let i = 1; i < 12; i ++) {
        setTimeout(async () => {
            const count = await Draft.count({ where: {
                active: true
            } })
    
            const drafting = await Info.count({ where: {
                element: 'draft',
                status: 'drafting'
            } })

            if (count === 4 && !drafting) {
                info.count = 1
                info.round = 1
                info.status = 'drafting'
                await info.save()
                assignDraftRoles(entries)
                sendUniversalStaples(entries)
                channel.send(`<@&${draftRole}>, pay attention nerds! The Draft starts in 20 seconds. ${koolaid}`)
                return setTimeout(() => {
                    return createPacks(fuzzyPrints)
                }, 20000)
            }
        }, i * 5000)
    }

    return setTimeout(async () => {
        const count = await Draft.count({ where: {
            active: true
        } })

        const drafting = await Info.count({ where: {
            element: 'draft',
            status: 'drafting'
        } })

        if (count !== 4 && !drafting) {
            const missing = await Draft.findAll({ 
                where: { 
                    active: false
                },
                include: Player
            })

            const names = missing.map((entry) => entry.player.name)
            await resetDraft(info, entries)

            for (let i = 0; i < missing.length; i++) {
                const entry = missing[i]
                await entry.destroy()
            }
            
            return channel.send(`Unfortunately, The Draft cannot begin without 4 players.\n\nThe following players have been removed from the queue:\n${names.sort().join("\n")}`)
        } else if (count === 4 && !drafting) {
            info.count = 1
            info.round = 1
            info.status = 'drafting'
            await info.save()
            assignDraftRoles(entries)
            channel.send(`<@&${draftRole}>, pay attention nerds! The Draft starts in 20 seconds. ${koolaid}`)
            return setTimeout(() => {
                return createPacks(fuzzyPrints)
            }, 20000)
        }
    }, 61000)
}

//GET CONFIRMATION
const getConfirmation = async (entry, contestant) => {
    const channel = client.channels.cache.get(draftChannelId)
    const playerId = entry.playerId
    const guild = client.guilds.cache.get("842476300022054913")
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
            entry.active = true
            entry.contestant = contestant
            await entry.save()
            member.send(`Thanks! The Draft will be starting soon. Look out for more DMs.`)
            return channel.send(`${member.user.username} confirmed their participation in the Draft!`)
        } else {
            member.send(`Okay, sorry to see you go!`)
            return channel.send(`Yikes. ${member.user.username} dodged the Draft!`)
        }
	}).catch(err => {
		console.log(err)
        return member.send(`Sorry, time's up.`)
	})
}

//ASSIGN DRAFT ROLES
const assignDraftRoles = (entries) => {
    const guild = client.guilds.cache.get("842476300022054913")
    entries.forEach((entry) => {
        const member = guild.members.cache.get(entry.playerId)
        member.roles.add(draftRole)
    })
}


//CREATE PACKS
const createPacks = async (fuzzyPrints) => {
    const channel = client.channels.cache.get(draftChannelId)
    const set = await Set.findOne({ where: { code: 'GL1' } })
    if (!set) return channel.send(`Could not find set.`)

    const old_pool = await Pool.findAll()
    for (let i = 0; i < old_pool.length; i++) {
        const pool = old_pool[i]
        await pool.destroy()
    }

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
        const pack_commons = getRandomSubset(commons, 12).sort()
        const pack_rares = getRandomSubset(rares, 5).sort()
		const pack_super = getRandomElement(supers)
        const pack = [pack_super, ...pack_rares, ...pack_commons]
        const pack_code = `pack_${j + 1}`

        for (let i = 0; i < pack.length; i++) {
            const card_code = pack[i]
            const print = await Print.findOne({ where: { card_code: card_code }})
            if (!print.id) return channel.send(`${card_code} does not exist in the Print database.`)
    
            const pool = await Pool.create({ 
                pack_code: pack_code,
                card_code: print.card_code,
                card_name: print.card_name,
                printId: print.id
            })

            if (!pool) return channel.send(`Error creating Draft Pool.`)
        }
    }

    return draftCards(fuzzyPrints)
}

// DRAFT CARDS
const draftCards = async (fuzzyPrints) => {
    const info = await Info.findOne({ where: { element: 'draft' }})
    const entries = await Draft.findAll({ include: Player, order: [['contestant', 'ASC']] })
    const pack_1 = await Pool.findAll({ where: { pack_code: 'pack_1' }, include: Print, order: [['id', 'ASC']] })
    const pack_2 = await Pool.findAll({ where: { pack_code: 'pack_2' }, include: Print, order: [['id', 'ASC']] })
    const pack_3 = await Pool.findAll({ where: { pack_code: 'pack_3' }, include: Print, order: [['id', 'ASC']] })
    const pack_4 = await Pool.findAll({ where: { pack_code: 'pack_4' }, include: Print, order: [['id', 'ASC']] })

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
        
    getPick(fuzzyPrints, entries[0], P1_pack, info.count)
    getPick(fuzzyPrints, entries[1], P2_pack, info.count)
    getPick(fuzzyPrints, entries[2], P3_pack, info.count)
    getPick(fuzzyPrints, entries[3], P4_pack, info.count)

    return setTimeout(async() => {
        if (info.count < 16) {
            info.count++
            await info.save()
            return draftCards(fuzzyPrints)
        } else if (info.round < 4) {
            info.count = 1
            info.round++
            await info.save()
            await sendInventories(entries, info.round)
            return setTimeout(async() => createPacks(fuzzyPrints), 60000)
        } else {
            info.count = null
            info.round = 1
            info.status = 'dueling'
            await info.save()
            await sendInventories(entries, false)
            return startDraftRound(info, entries)
        }
    }, (27 - info.count) * 1000)
}

//SEND INVENTORIES
const sendInventories = async (entries, round) => {
    const guild = client.guilds.cache.get("842476300022054913")

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const playerId = entry.playerId
        const name = entry.player.name
        const results = [`${name}'s Draft Inventory:`, `${galaxy} - Galaxy Pack 1 - ${galaxy}`]
        const invs = await Inventory.findAll({ 
            where: {
                playerId: playerId,
                draft: true,
                quantity: {
                    [Op.gte]: 1
                }
            },
           include: Print,
           order: [['card_code', 'ASC']]
        })

		for (let i = 0; i < invs.length; i++) {
			const inv = invs[i]
			const print = inv.print
			results.push(`${eval(print.rarity)}${print.card_code} - ${print.card_name} - ${inv.quantity}`)
		}

        const member = guild.members.cache.get(playerId)
        if (!member || playerId !== member.user.id) continue
        const prompt = round ? `Slick drafting, ${name}! You get a 60 second break before Round ${round}.` :
            `Draft complete! Take up to 10 minutes to build your deck, then find your opponent.`
        member.send(prompt)

        for (let j = 0; j < results.length; j += 30) {
            if (results[j+31] && results[j+31].startsWith("\n")) {
                member.send(results.slice(j, j+31).join('\n'))
                j++
            } else {
                member.send(results.slice(j, j+30).join('\n'))
            }
        }
    }
}

//SEND UNIVERSAL STAPLES
const sendUniversalStaples = async (entries) => {
    const guild = client.guilds.cache.get("842476300022054913")

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const playerId = entry.playerId
                
        await Inventory.create({
            card_code: 'GL1-US1',
            quantity: 1,
            draft: true,
            playerId: playerId,
            printId: 1069
        })

        await Inventory.create({
            card_code: 'GL1-US2',
            quantity: 1,
            draft: true,
            playerId: playerId,
            printId: 1070
        })

        await Inventory.create({
            card_code: 'GL1-US3',
            quantity: 1,
            draft: true,
            playerId: playerId,
            printId: 1075
        })

        await Inventory.create({
            card_code: 'GL1-US4',
            quantity: 1,
            draft: true,
            playerId: playerId,
            printId: 1076
        })

        await Inventory.create({
            card_code: 'GL1-US5',
            quantity: 1,
            draft: true,
            playerId: playerId,
            printId: 1077
        })

        await Inventory.create({
            card_code: 'GL1-US6',
            quantity: 1,
            draft: true,
            playerId: playerId,
            printId: 1078
        })

        const member = guild.members.cache.get(playerId)
        if (!member || playerId !== member.user.id) continue
        
        const draft_inv = await Inventory.findAll({ 
            where: {
                draft: true,
                playerId: playerId
            },
            include: Print
        }).map((i) => `${eval(i.print.rarity)}${i.card_code} - ${i.print.card_name} - ${i.quantity}`)

        member.send(`Your Draft Inventory begins with the 6 universal staples ${galaxy}:\n` + draft_inv.join('\n') + `\n\nThere will be 4 rounds of opening and passing around Galaxy Packs, in which each player selects 16 cards. At the end, you will have 64 drafted cards + 6 universal staples to construct a 40 card deck and side deck. Best of luck!`)
    }
}

//GET PICK
const getPick = async (fuzzyPrints, entry, pack, count) => {
    const playerId = entry.playerId
    const guild = client.guilds.cache.get("842476300022054913")
    const member = guild.members.cache.get(playerId)
    if (!member || playerId !== member.user.id) return
    const cards = pack.map((p, index) => `(${index + 1}) ${eval(p.print.rarity)}${p.card_code} - ${p.card_name}` )

    const pack_code = pack[0].pack_code
    const letter = pack_code === 'pack_1' ? 'A' : 
        pack_code === 'pack_2' ? 'B' : 
        pack_code === 'pack_3' ? 'C' : 
        'D'

    const images = []
    for (let i = 0; i < pack.length; i++) {
        const pool = pack[i]
        const print = pool.print
        const card = await Card.findOne({ where: {
            name: print.card_name
        }})

        images.push(`${card.image}`)
    }

    const card_width = 57
    const cards_per_row = pack.length > 9 ? Math.ceil(pack.length / 2) : pack.length
    const card_height = 80
    const rows_per_pack = pack.length > 9 ? 2 : 1
    const canvas = Canvas.createCanvas(card_width * cards_per_row, card_height * rows_per_pack)
    const context = canvas.getContext('2d')

    for (let i = 0; i < pack.length; i++) {
        const card = fs.existsSync(`./public/card_images/${images[i]}`) ? 
        await Canvas.loadImage(`./public/card_images/${images[i]}`) :
        await Canvas.loadImage(`https://ygoprodeck.com/pics/${images[i]}`)
        const dx = i + 1 > cards_per_row && rows_per_pack > 1 ? card_width * (i - cards_per_row) : card_width * i
        const dy = i + 1 > cards_per_row && rows_per_pack > 1 ? 80 : 0
        if (canvas && context && card) context.drawImage(card, dx, dy, card_width, card_height)
    }

    const attachment = canvas && context ?
        new Discord.MessageAttachment(canvas.toBuffer(), `draft_pack.png`) :
        false

    const filter = m => m.author.id === playerId
	const msg = await member.send(`Please select a card (${23 - count}s):\n${galaxy} - Galaxy Pack ${letter} - ${galaxy}\n${cards.join('\n')}`, attachment)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: (23 - count) * 1000
	}).then(async collected => {
		const response = collected.first().content
        const card_name = await findCard(response, fuzzyPrints)
        
        let pool_selection
        let auto_draft = false
        if (pack.length > 0 && (response.replace(/[^0-9]/g, '') === '1' || card_name === pack[0].card_name)) pool_selection = pack[0]
        if (pack.length > 1 && (response.replace(/[^0-9]/g, '') === '2' || card_name === pack[1].card_name)) pool_selection = pack[1]
        if (pack.length > 2 && (response.replace(/[^0-9]/g, '') === '3' || card_name === pack[2].card_name)) pool_selection = pack[2]
        if (pack.length > 3 && (response.replace(/[^0-9]/g, '') === '4' || card_name === pack[3].card_name)) pool_selection = pack[3]
        if (pack.length > 4 && (response.replace(/[^0-9]/g, '') === '5' || card_name === pack[4].card_name)) pool_selection = pack[4]
        if (pack.length > 5 && (response.replace(/[^0-9]/g, '') === '6' || card_name === pack[5].card_name)) pool_selection = pack[5]
        if (pack.length > 6 && (response.replace(/[^0-9]/g, '') === '7' || card_name === pack[6].card_name)) pool_selection = pack[6]
        if (pack.length > 7 && (response.replace(/[^0-9]/g, '') === '8' || card_name === pack[7].card_name)) pool_selection = pack[7]
        if (pack.length > 8 && (response.replace(/[^0-9]/g, '') === '9' || card_name === pack[8].card_name)) pool_selection = pack[8]
        if (pack.length > 9 && (response.replace(/[^0-9]/g, '') === '10' || card_name === pack[9].card_name)) pool_selection = pack[9]
        if (pack.length > 10 && (response.replace(/[^0-9]/g, '') === '11' || card_name === pack[10].card_name)) pool_selection = pack[10]
        if (pack.length > 11 && (response.replace(/[^0-9]/g, '') === '12' || card_name === pack[11].card_name)) pool_selection = pack[11]
        if (pack.length > 12 && (response.replace(/[^0-9]/g, '') === '13' || card_name === pack[12].card_name)) pool_selection = pack[12]
        if (pack.length > 13 && (response.replace(/[^0-9]/g, '') === '14' || card_name === pack[13].card_name)) pool_selection = pack[13]
        if (pack.length > 14 && (response.replace(/[^0-9]/g, '') === '15' || card_name === pack[14].card_name)) pool_selection = pack[14]
        if (pack.length > 15 && (response.replace(/[^0-9]/g, '') === '16' || card_name === pack[15].card_name)) pool_selection = pack[15]
        if (pack.length > 16 && (response.replace(/[^0-9]/g, '') === '17' || card_name === pack[16].card_name)) pool_selection = pack[16]
        if (pack.length > 17 && (response.replace(/[^0-9]/g, '') === '18' || card_name === pack[17].card_name)) pool_selection = pack[17]
        
        if (!pool_selection) {
            auto_draft = true
            pool_selection = await autoDraft(pack)
            if (!pool_selection) pool_selection = pack[0]
        }

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
        const prompt = auto_draft ? `Sorry, "${response}" is not a valid response. You auto-drafted` : 'Thanks! You selected'
        return member.send(`${prompt}: ${card}.`)
	}).catch(async err => {
		console.log(err)
        const pool_selection = await autoDraft(pack)
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
const autoDraft = async (pack) => {
    const supers = []
    const rares = []
    const commons = []

    for (let i = 0; i < pack.length; i++) {
        const pool = pack[i]
        if (pool.print.rarity === 'sup') {
            supers.push(pool)
        } else if (pool.print.rarity === 'rar') {
            rares.push(pool)
        } else if (pool.print.rarity === 'com') {
            commons.push(pool)
        }
    }

    const pool_selection = supers.length ? getRandomElement(supers) :
        rares.length ? getRandomElement(rares) :
        getRandomElement(commons)
    
    return pool_selection
}


//START DRAFT ROUND
const startDraftRound = async (info, entries) => {
    const channel = client.channels.cache.get(draftChannelId)
    const guild = client.guilds.cache.get("842476300022054913")

    if (info.round === 5) {
        const playerId = entries[0].playerId
        channel.send(`Congratulations to <@${playerId}> on an impressive showing! You truly deserve the TBD!`)
        return endDraft(info, entries)
    } else if (info.round === 4) {
        if (entries[0].score > entries[1].score) {
        //1st place outright
            for (let i = 1; i < entries.length; i++) {
                const entry = entries[i]
                channel.send(`<@${entry.playerId}> garnered X TBD from the Draft. Congrats!`)
            }

            const playerId = entries[0].playerId
            const player = await Player.findOne({ where: { id: playerId } })
            player.draft_wins++
            await player.save()
            channel.send(`Congratulations to <@${playerId}> on an impressive showing! You truly deserve the TBD!`)
            return endDraft(info, entries)
        } else if ((entries[0].score === entries[1].score) && entries[1].score > entries[2].score) {
        //2 way tie
            for (let i = 2; i < entries.length; i++) {
                const entry = entries[i]
                channel.send(`<@${entry.playerId}> garnered X TBD from the Draft. Congrats!`)
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

            return channel.send(`${title}\n${match}`)
        } else {
        //3 way tie
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i]
                channel.send(`<@${entry.playerId}> garnered X TBD from the Draft. Congrats!`)
            }

            channel.send(`No winner could be determined in this Draft.`)
            return endDraft(info, entries)
        }
    } else {
        const P1 = await Draft.findOne({ where: { contestant: "P1" }, include: Player})
        const P2 = await Draft.findOne({ where: { contestant: "P2" }, include: Player})
        const P3 = await Draft.findOne({ where: { contestant: "P3" }, include: Player})
        const P4 = await Draft.findOne({ where: { contestant: "P4" }, include: Player})
    
        if (!P1 || !P2 || !P3 || !P4) return channel.send(`Critical error. Missing contestant in the database.`)
    
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

        return channel.send(`${title}\n${matches.join("\n")}`)
    }
}

//FORFEIT
const forfeit = async (winnerId, loserId) => {
        const channel = client.channels.cache.get(draftChannelId)
		const info = await Info.findOne({ where: { element: 'draft' } })
		if (!info) return channel.send(`Error: could not find game: "draft".`)

		const losingPlayer = await Player.findOne({ where: { id: loserId }, include: [Draft, Wallet] })
		const winningPlayer = await Player.findOne({ where: { id: winnerId }, include: [Draft, Wallet] })
		if (!winningPlayer || !losingPlayer) return channel.send(`Could not process forfeiture.`)
		
		winningPlayer.wallet.starchips += 12
		await winningPlayer.wallet.save()

		losingPlayer.draft.is_playing = false
		await losingPlayer.draft.save()

		winningPlayer.draft.score++
		winningPlayer.draft.is_playing = false
		await winningPlayer.draft.save()

		channel.send(`${losingPlayer.name} (+0${starchips}), your Draft loss to ${winningPlayer.name} (+12${starchips}) has been recorded.`)
		return checkDraftProgress(info) 
}

//DOUBLE FORFEIT
const doubleForfeit = async (player1Id, player2Id) => {
    const channel = client.channels.cache.get(draftChannelId)
    const info = await Info.findOne({ where: { element: 'draft' } })
    if (!info) return channel.send(`Error: could not find game: "draft".`)

    const contestant1 = await Player.findOne({ where: { id: player1Id }, include: Player })
    const contestant2 = await Player.findOne({ where: { id: player2Id }, include: Player })
    if (!contestant1 || !contestant2) return channel.send(`Could not process double forfeiture.`)
    
    contestant1.is_playing = false
    await contestant1.save()

    contestant2.is_playing = false
    await contestant2.save()

    channel.send(`The double Draft forfeiture between ${contestant1.player.name} (+0${starchips}) and ${contestant2.player.name} (+0${starchips}) has been recorded.`)
    return checkDraftProgress(info) 
}

//POST STANDINGS
const postStandings = async (info, entries) => {
    const channel = client.channels.cache.get(draftChannelId)

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

    channel.send(`${title}\n${standings.join("\n")}`)
    
    return setTimeout(() => {
        startDraftRound(info, entries)
    }, 10000)
}

//END DRAFT
const endDraft = async (info, entries) => {
    const pools = await Pool.findAll()

    for (let i = 0; i < pools.length; i++) {
        const pool = pools[i]
        await pool.destroy()
    }

    const draft_invs = await Inventory.findAll({ where: {
        draft: true
    }})

    for (let i = 0; i < draft_invs.length; i++) {
        const inv = draft_invs[i]
        await inv.destroy()
    }

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
    const channel = client.channels.cache.get(draftChannelId)
    const entries = await Draft.findAll({ include: Player, order: [["score", "DESC"]]})
    if (!entries) return channel.send(`Critical error. Missing entries in the database.`) 

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
