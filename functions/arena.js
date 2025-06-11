
import { Op } from 'sequelize'
import { ArenaEntry, Info, Player, Wallet, ArenaProfile } from '../database/index.js'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'

import roles from '../static/roles.json' with { type: 'json' }
const { arenaRole } = roles
import emojis from '../static/emojis.json' with { type: 'json' }
const { cavebob, AOD, king, arena, beast, dragon, warrior, spellcaster, machine, zombie, starchips } = emojis
import channels from '../static/channels.json' with { type: 'json' }
const { arenaChannelId } = channels
import arenas from '../static/arenas.json' with { type: 'json' }
const { decks, vouchers, prizes, victories, apcs, verbs, encouragements } = arenas 

import { client } from '../static/clients.js'
import { shuffleArray, getRandomElement, capitalize } from './utility.js'
import { awardCard } from './award.js'

const tribes = [
    '(1) Beast', 
    '(2) Dinosaur',
    '(3) Machine', 
    '(4) Spellcaster', 
    '(5) Warrior', 
    '(6) Zombie'
]

//GET ARENA SAMPLE DECK
export const getArenaSample = async (interaction, query) => {
    const directTribe = getTribe(query)
    if (directTribe) return directTribe

    const filter = m => m.author.id === message.author.id
	message.channel.send({ content: `Please select a tribe:${tribes.join('\n')}`})
	return await message.channel.awaitMessages({ 
        filter,
		max: 1,
		time: 10000
	}).then((collected) => {
        const response = collected.first().content.toLowerCase()
        return getTribe(response)
	}).catch((err) => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
	})
}

// GET TRIBE
export const getTribe = (query = '') => {
    // MAKE THIS BUTTONS


    // const tribe = query.includes('thun') || query.includes('10') ? 'thunder' :
    //     query.includes('war') || query.includes('11') ? 'warrior' :
    //     query.includes('zom') || query.includes('12') ? 'zombie' :
    //     query.includes('bea') || query.includes('1') ? 'beast' :
    //     query.includes('dino') || query.includes('2') ? 'dinosaur' :
    //     query.includes('drag') || query.includes('3') ? 'dragon' :
    //     query.includes('fiend') || query.includes('4') ? 'fiend' :
    //     query.includes('fish') || query.includes('5') ? 'fish' :
    //     query.includes('plant') || query.includes('6') ? 'plant' :
    //     query.includes('rep') || query.includes('7') ? 'reptile' :
    //     query.includes('rock') || query.includes('8') ? 'rock' :
    //     query.includes('spell') || query.includes('cast') || query.includes('9') ? 'spellcaster' :
    //     false

    // return tribe
}

//START ARENA
export const initiateArena = async(interaction) => {
    const channel = client.channels.cache.get(arenaChannelId)
    channel.send({ content: `Arena players, please check your DMs!`})
    const arenaEntries = await ArenaEntry.findAll({ include: Player })
    const contestants = shuffleArray(["P1", "P2", "P3", "P4", "P5", "P6"])
    
    const info = await Info.findOne({ where: {
        element: 'arena'
    }})
    await info.update({ status: 'confirming' })

    getArenaConfirmation(arenaEntries[0], contestants[0])
    getArenaConfirmation(arenaEntries[1], contestants[1])
    getArenaConfirmation(arenaEntries[2], contestants[2])
    getArenaConfirmation(arenaEntries[3], contestants[3])
    getArenaConfirmation(arenaEntries[4], contestants[4])
    getArenaConfirmation(arenaEntries[5], contestants[5])


    for (let i = 1; i < 12; i ++) {
        setTimeout(async () => {
            const count = await ArenaEntry.count({ where: {
                status: 'confirmed'
            } })
    
            const active = await Info.count({ where: {
                element: 'arena',
                status: 'active'
            } })

            if (count === 6 && !active) {
                info.round = 1
                info.status = 'active'
                await info.save()
                assignArenaRoles(arenaEntries)
                setTimeout(() => {
                    channel.send({ content: `<@&${arenaRole}>, square-up gamers! The Arena starts in 10 seconds. ${cavebob}\n\nP.S. If you aren't playing within 5 minutes of this message, **it's a game loss**!`})
                }, 1000)
                return setTimeout(() => {
                    return startRound()
                }, 11000)
            }
        }, i * 5000)
    }

    return setTimeout(async () => {
        const count = await ArenaEntry.count({ where: {
            status: 'confirmed'
        } })

        const active = await Info.count({ where: {
            element: 'arena',
            status: 'active'
        } })

        if (count !== 6 && !active) {
            const missingArenaEntries = await ArenaEntry.findAll({ 
                where: {
                    status: {[Op.not]: 'confirmed' }
                },
                include: Player
            })

            const names = missingArenaEntries.map((arenaEntry) => arenaEntry.player.name)

            await resetArena(arenaEntries)

            for (let i = 0; i < missingArenaEntries.length; i++) {
                const arenaEntry = missingArenaEntries[i]
                await arenaEntry.destroy()
            }

            await info.update({ status: 'pending' })
            
            return channel.send({ content: `Unfortunately, The Arena cannot begin without 6 players.\n\nThe following players have been removed from the queue:\n${names.sort().join("\n")}`})
        } else if (count === 6 && !active) {
            info.round = 1
            info.status = 'active'
            await info.save()
            assignArenaRoles(arenaEntries)
            setTimeout(() => {
                channel.send({ content: `<@&${arenaRole}>, square-up gamers! The Arena starts in 10 seconds. ${cavebob}\n\nP.S. If you aren't playing within 5 minutes of this message, **it's a game loss**!`})
            }, 1000)
            return setTimeout(() => {
                return startRound()
            }, 11000)
        }
    }, 61000)
}

//GET ARENA CONFIRMATION
export const getArenaConfirmation = async (arenaEntry, contestant) => {
    const arenaChannel = client.channels.cache.get(arenaChannelId)
    const guild = client.guilds.cache.get("1372580468297568458")
    const playerId = arenaEntry.player.discordId
    const member = await guild.members.fetch(playerId)
    if (!member) return arenaChannel.send({ content: `${arenaEntry.playerName} cannot be sent DMs.` })
    
    const timestamp = new Date().getTime()

    const row1 = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
            .setCustomId(`Arena-${timestamp}-Beast`)
            .setLabel('Beast')
            .setStyle(ButtonStyle.Primary)
        )

        .addComponents(new ButtonBuilder()
            .setCustomId(`Arena-${timestamp}-Dragon`)
            .setLabel('Dragon')
            .setStyle(ButtonStyle.Primary)
        )

        .addComponents(new ButtonBuilder()
            .setCustomId(`Arena-${timestamp}-Machine`)
            .setLabel('Machina')
            .setStyle(ButtonStyle.Primary)
        )

        .addComponents(new ButtonBuilder()
            .setCustomId(`Arena-${timestamp}-Spellcaster`)
            .setLabel('Spellcaster')
            .setStyle(ButtonStyle.Primary)
        )

    const row2 = new ActionRowBuilder()
            .addComponents(new ButtonBuilder()
                .setCustomId(`Arena-${timestamp}-Warrior`)
                .setLabel('Warrior')
                .setStyle(ButtonStyle.Primary)
            )

            .addComponents(new ButtonBuilder()
                .setCustomId(`Arena-${timestamp}-Zombie`)
                .setLabel('Zombie')
                .setStyle(ButtonStyle.Primary)
            )
            
            .addComponents(new ButtonBuilder()
            .setCustomId(`Arena-${timestamp}-No`)
            .setLabel('No')
            .setStyle(ButtonStyle.Primary)
        )
            
    const message = await member.user.send({ content: `Please select a tribe for The Arena. ${arena} If you no longer want to play, press "No".`, components: [row1, row2] })

    const filter = i => i.customId.includes(`Arena-${timestamp}`) && i.user.id === member.user.id;

    try {
        const confirmation = await message.awaitMessageComponent({ filter, time: 30000 })
        if (!confirmation.customId.includes('No')) {
            const count = await Info.count({ where: {
                element: 'arena',
                status: 'confirming'
            } })

            if (!count) return member.send({ content: `Sorry, time expired.`})
            const tribe = confirmation.customId.slice(20)

            await arenaEntry.update({
                isConfirmed: true,
                tribe: tribe,
                contestant: contestant
            })
                
            await confirmation.update({ components: [] })
            member.send({ content: `Thanks! This is your Arena deck. You may cut it down to 40 cards:\n${decks[tribe].url}\n${decks[tribe].screenshot}`})
            return await arenaChannel.send({ content: `${arenaEntry.playerName} confirmed their participation in The Arena! ${arena}` })
        } else {
            await confirmation.update({ components: [] })
            return
        }
    } catch (err) {
        console.log(err)
        return
    }
}

//ASSIGN ARENA ROLES
export const assignArenaRoles = async (arenaEntries) => {
    const guild = client.guilds.cache.get("1372580468297568458")
    for (let i = 0; i < arenaEntries.length; i++) {
        const arenaEntry = arenaEntries[i]
        const member = await guild.members.fetch(arenaEntry.player.discordId)
        member.roles.add(arenaRole)
    }
}

//START ROUND
export const startRound = async (arenaEntries) => {
    const info = await Info.findOne({ where: { element: 'arena' }})
    const channel = client.channels.cache.get(arenaChannelId)
    const guild = client.guilds.cache.get("1372580468297568458")

    if (info.round === 5) {
        // VOUCHERS
        // const voucher = vouchers[arenaEntries[1].tribe]
        // const quantity = 6
        // const wallet = await Wallet.findOne({ where: { playerId: arenaEntries[1].playerId }})
        // wallet[voucher] += quantity
        // await wallet.save()
        // channel.send({ content: `<@${arenaEntries[1].playerId}> ${getRandomElement(verbs)} ${quantity} ${eval(voucher)} from the Arena. ${getRandomElement(encouragements)}`})
        
        const tribe = arenaEntries[0].tribe
        const playerId = arenaEntries[0].playerId
        const profile = await ArenaProfile.findOne({ where: { playerId } })
        profile[`${tribe}Wins`] += 1
        await profile.save()
        await awardCard(channel, playerId, prizes[tribe])

        channel.send({ content: `Congratulations to <@${playerId}> on a brilliant victory` +
            ` with the ${capitalize(tribe)} ${eval(tribe)} deck.` +
            ` ${victories[tribe]}` +
            ` You truly deserve the ${apcs[tribe]}!`
        })

        // completeTask(channel, playerId, 'm10', 12000)
        // if (await check6TribesComplete(playerId, 1)) completeTask(channel, playerId, 'h8', 4000)
        // if (await check6TribesComplete(playerId, 3)) completeTask(channel, playerId, 'l6', 5000)
        return endArena(arenaEntries)
    } else if (info.round === 4) {
        if (arenaEntries[0].score > arenaEntries[1].score) {
        //1st place outright
            // VOUCHERS
            // for (let i = 1; i < arenaEntries.length; i++) {
            //     const arenaEntry = arenaEntries[i]
            //     const voucher = vouchers[arenaEntry.tribe]
            //     const quantity = arenaEntry.score + 2
            //     const wallet = await Wallet.findOne({ where: { playerId: arenaEntry.playerId }})
            //     wallet[voucher] += quantity
            //     await wallet.save()
            //     channel.send({ content: `<@${arenaEntry.playerId}> ${getRandomElement(verbs)} ${quantity} ${eval(voucher)} from the Arena. ${getRandomElement(encouragements)}`})
            // }

            const tribe = arenaEntries[0].tribe
            const playerId = arenaEntries[0].playerId
            const profile = await ArenaProfile.findOne({ where: { playerId } })
            profile[`${tribe}Wins`]++
            await profile.save()
            await awardCard(channel, playerId, prizes[tribe])

            channel.send({ content: `Congratulations to <@${playerId}> on a brilliant victory` +
                ` with the ${capitalize(tribe)} ${eval(tribe)} deck.` +
                ` ${victories[tribe]}` +
                ` You truly deserve the ${apcs[tribe]}!`
        })

            // completeTask(channel, playerId, 'm10', 12000)
            // if (await check6TribesComplete(playerId, 1)) completeTask(channel, playerId, 'h8', 4000)
            // if (await check6TribesComplete(playerId, 3)) completeTask(channel, playerId, 'l6', 5000)
            return endArena(arenaEntries)
        } else if ((arenaEntries[0].score === arenaEntries[1].score) && arenaEntries[1].score > arenaEntries[2].score) {
        //2 way tie
            for (let i = 2; i < arenaEntries.length; i++) {
                const arenaEntry = arenaEntries[i]
                // VOUCHERS
                // const voucher = vouchers[arenaEntry.tribe]
                // const quantity = arenaEntry.score + 2
                // const wallet = await Wallet.findOne({ where: { playerId: arenaEntry.playerId }})
                // wallet[voucher] += quantity
                // await wallet.save()
                // channel.send({ content: `<@${arenaEntry.playerId}> ${getRandomElement(verbs)} ${quantity} ${eval(voucher)} from the Arena. ${getRandomElement(encouragements)}`})
                const member = await guild.members.fetch(arenaEntry.player.discordId)
                member.roles.remove(arenaRole)
                arenaEntry.score = 0
                await arenaEntry.save()
            }

            arenaEntries[0].score = 1
            await arenaEntries[0].save()

            arenaEntries[1].score = 1
            await arenaEntries[1].save()

            const title = `<!> <!> <!> ARENA FINALS <!> <!> <!>` 
            const match = `${eval(arenaEntries[0].tribe)} <@${arenaEntries[0].playerId}> ${eval(arenaEntries[0].tribe)}` +
            ` vs ${eval(arenaEntries[1].tribe)} <@${arenaEntries[1].playerId}> ${eval(arenaEntries[1].tribe)}`

            return channel.send({ content: `${title}\n${match}`})
        } else {
        //3 way tie
            // VOUCHERS
            // for (let i = 0; i < arenaEntries.length; i++) {
            //     const arenaEntry = arenaEntries[i]
            //     const voucher = vouchers[arenaEntry.tribe]
            //     const quantity = i < 3 ? arenaEntry.score + 5 : arenaEntry.score + 2
            //     const wallet = await Wallet.findOne({ where: { playerId: arenaEntry.playerId }})
            //     wallet[voucher] += quantity
            //     await wallet.save()
            //     channel.send({ content: `<@${arenaEntry.playerId}> ${getRandomElement(verbs)} ${quantity} ${eval(voucher)} from the Arena. ${getRandomElement(encouragements)}`})
            // }

            channel.send({ content: `The shadows grew long over the battlefield, and the gladiators had little more left to give. Being so, the elders of the Tribes briefly met to negotiate a temporary ceasefire. No winner could be determined in this Arena.`})
            return endArena(arenaEntries)
        }
    } else {
        const P1 = await ArenaEntry.findOne({ where: { contestant: "P1" }, include: Player})
        const P2 = await ArenaEntry.findOne({ where: { contestant: "P2" }, include: Player})
        const P3 = await ArenaEntry.findOne({ where: { contestant: "P3" }, include: Player})
        const P4 = await ArenaEntry.findOne({ where: { contestant: "P4" }, include: Player})
        const P5 = await ArenaEntry.findOne({ where: { contestant: "P5" }, include: Player})
        const P6 = await ArenaEntry.findOne({ where: { contestant: "P6" }, include: Player})
    
        if (!P1 || !P2 || !P3 || !P4 || !P5 || !P6) return channel.send({ content: `Critical error. Missing contestant in the database.`})
    
        const pairings = info.round === 1 ? [[P1, P2], [P3, P4], [P5, P6]] :
            info.round === 2 ? [[P1, P6], [P2, P3], [P4, P5]] :
            info.round === 3 ? [[P1, P5], [P2, P4], [P3, P6]] :
            info.round === 4 ? [[P1, P4], [P2, P6], [P3, P5]] :
            info.round === 5 ? [[P1, P3], [P2, P5], [P4, P6]] : 
            null
    
        const title = `${arena}    ---------    Arena Round ${info.round}    ---------    ${arena}\n${beast} ${dragon} ${machine} ${spellcaster} ${warrior} ${zombie}` 
        const matches = pairings.map((pairing, index) => {
            if (pairing[0].active === false && pairing[1].active === false) {
                setTimeout(() => doubleForfeit(pairing[0].playerId, pairing[1].playerId), index * 1000 + 1000)
                return `Match ${index + 1}: ~~<@${pairing[0].player.name}~~ vs ~~<@${pairing[1].player.name}>~~ (both forfeit)`
            } else if (pairing[0].active === false && pairing[1].active === true) {
                setTimeout(() => forfeit(pairing[1].playerId, pairing[0].playerId), index * 1000 + 1000)
                return `Match ${index + 1}: ~~<@${pairing[0].player.name}~~ vs <@${pairing[1].player.name}> (${pairing[0].player.name} forfeits)`
            } else if (pairing[0].active === true && pairing[1].active === false) {
                setTimeout(() => forfeit(pairing[0].playerId, pairing[1].playerId), index * 1000 + 1000)
                return `Match ${index + 1}: <@${pairing[0].playerId}> vs ~~<@${pairing[1].playerId}>~~ (${pairing[1].player.name} forfeits)`
            } else {
                return `Match ${index + 1}: <@${pairing[0].playerId}> vs <@${pairing[1].playerId}>`
            }
        })

        return channel.send({ content: `${title}\n${matches.join("\n")}`})
    }
}

//FORFEIT
export const forfeit = async (winnerId, loserId) => {
        const channel = client.channels.cache.get(arenaChannelId)
        const info = await Info.findOne({ where: { element: 'arena' } })
		if (!info) return channel.send({ content: `Error: could not find game: "arena".`})

		const losingPlayer = await Player.findOne({ where: { id: loserId }, include: [Wallet] })
        const losingEntry = await ArenaEntry.findOne({ where: { playerId: loserId }})
		const winningPlayer = await Player.findOne({ where: { id: winnerId }, include: [Wallet] })
        const winningEntry = await ArenaEntry.findOne({ where: { playerId: winnerId }})
        if (!winningPlayer || !losingPlayer) return channel.send({ content: `Could not process forfeiture.`})
		
		winningPlayer.wallet.starchips += 4
		await winningPlayer.wallet.save()

		losingEntry.isPlaying = false
		await losingEntry.save()

		winningEntry.score++
		winningEntry.isPlaying = false
		await winningEntry.save()

		channel.send({ content: `${losingPlayer.name} (+0${starchips}), your Arena loss to ${winningPlayer.name} (+5${starchips}) has been recorded.`})
		return checkArenaProgress() 
}

//DOUBLE FORFEIT
export const doubleForfeit = async (player1Id, player2Id) => {
    const channel = client.channels.cache.get(arenaChannelId)
    const info = await Info.findOne({ where: { element: 'arena' } })
    if (!info) return channel.send({ content: `Error: could not find game: "arena".`})

    const contestant1 = await ArenaEntry.findOne({ where: { playerId: player1Id } })
    const contestant2 = await ArenaEntry.findOne({ where: { playerId: player2Id } })
    if (!contestant1 || !contestant2) return channel.send({ content: `Could not process double forfeiture.`})
    
    contestant1.isPlaying = false
    await contestant1.save()

    contestant2.isPlaying = false
    await contestant2.save()

    channel.send({ content: `The double Arena forfeiture between ${contestant1.playerName} (+0${starchips}) and ${contestant2.playerName} (+0${starchips}) has been recorded.`})
    return checkArenaProgress() 
}

//POST STANDINGS
export const postStandings = async (arenaEntries) => {
    const info = await Info.findOne({ where: { element: 'arena' }})
    const channel = client.channels.cache.get(arenaChannelId)

    for (let i = 0; i < arenaEntries.length; i++) {
        const arenaEntry = arenaEntries[i]
        arenaEntry.isPlaying = true
        await arenaEntry.save()
    }

    const title = `${king}  ---  Arena Round ${info.round} Standings  ---  ${king} `
    const standings = arenaEntries.map((arenaEntry, index) => {
        return `${index + 1}. ${arenaEntry.playerName} ${eval(arenaEntry.tribe)} - ${arenaEntry.score} W`
    })

    info.round++
    await info.save()

    channel.send({ content: `${title}\n${standings.join("\n")}`})
    
    return setTimeout(() => {
        startRound(arenaEntries)
    }, 10000)
}

//END ARENA
export const endArena = async (arenaEntries) => {
    const info = await Info.findOne({ where: { element: 'arena' }})
    info.status = 'pending'
    info.round = null
    await info.save()
    const guild = client.guilds.cache.get("1372580468297568458")

    for (let i = 0; i < arenaEntries.length; i++) {
        const arenaEntry = arenaEntries[i]
        const member = await guild.members.fetch(arenaEntry.player.discordId)
        member.roles.remove(arenaRole)
        await arenaEntry.destroy()
    }
}

//RESET ARENA
export const resetArena = async (arenaEntries) => {
    const info = await Info.findOne({ where: { element: 'arena' }})
    info.status = 'pending'
    info.round = null
    await info.save()
    const guild = client.guilds.cache.get("1372580468297568458")

    for (let i = 0; i < arenaEntries.length; i++) {
        const arenaEntry = arenaEntries[i]
        const member = await guild.members.fetch(arenaEntry.player.discordId)
        member.roles.remove(arenaRole)
        arenaEntry.active = false
        arenaEntry.tribe = null
        arenaEntry.contestant = null
        await arenaEntry.save()
    }
}

//CHECK ARENA PROGRESS
export const checkArenaProgress = async () => {
    const info = await Info.findOne({ where: { element: 'arena' }})
    const arenaEntries = await ArenaEntry.findAll({ include: Player, order: [["score", "DESC"]]})
    // if (!arenaEntries) return channel.send({ content: `Critical error. Missing arenaEntries in the database.`}) 

    // if (info.round === 4) {
    //     info.round = 5
    //     await info.save()
    //     return setTimeout(() => startRound(arenaEntries), 3000)
    // }

    const scores = arenaEntries.map((arenaEntry) => arenaEntry.score)
    const progress_report = arenaEntries.map((arenaEntry) => arenaEntry.isPlaying)
    const sum = scores.reduce((a, b) => a + b)

    if (sum % 3 === 0 && !progress_report.includes(true)) return setTimeout(() => postStandings(arenaEntries), 3000)
}

//GET ARENA CONFIRMATIONS
// export const getArenaConfirmations = async (interaction) => {
//     interaction.channel.send({ content: `Arena players, please check your DMs!`})
//     const arenaEntries = await ArenaEntry.findAll({ include: Player })
//     for (let i = 0; i < arenaEntries.length; i++) getArenaConfirmation(interaction, arenaEntries[i])
//     let round = 1

//     for (let i = 1; i < 12; i ++) {
//         setTimeout(async () => {
//             const playing = await ArenaEntry.count({ where: { status: 'playing' }})
//             if (playing) return
//             const unconfirmed = await ArenaEntry.count({ where: { isConfirmed: false }})

//             if (!unconfirmed) {
//                 for (let j = 0; j < arenaEntries.length; j++) {
//                     const arenaEntry = arenaEntries[j]
//                     await arenaEntry.update({ status: 'playing' })
//                 }

//                 assignArenaRoles(arenaEntries)
//                 setTimeout(() => {
//                     interaction.channel.send({ content: `<@&${arenaRole}>, look alive gamers! The Arena starts in 10 seconds. ${skipper}\n\nP.S. If you aren't playing within 5 minutes of this message, it's a game loss!`})
//                 }, 1000)

//                 return setTimeout(() => { return askQuestion(interaction, round, questions) }, 11000)
//             }
//         }, i * 5000)
//     }

//     return setTimeout(async () => {
//         const playing = await ArenaEntry.count({ where: { status: 'playing' }})
//         if (playing) return

//         const missingEntries = await ArenaEntry.findAll({ where: { isConfirmed: false }})
//         const missingNames = missingEntries.map((arenaEntry) => arenaEntry.playerName)

//         for (let i = 0; i < missingEntries.length; i++) {
//             const arenaEntry = missingEntries[i]
//             await arenaEntry?.destroy()
//         }

//         const remainingEntries = await ArenaEntry.findAll({ where: { isConfirmed: true }})

//         if (remainingEntries.length < 6) {    
//             for (let i = 0; i < remainingEntries.length; i++) {
//                 const arenaEntry = remainingEntries[i]
//                 await arenaEntry?.update({ status: 'pending', isConfirmed: false })
//             }

//             return interaction.channel.send({ content: `Unfortunately, The Arena ${arena} cannot begin without at least 6 players.\n\nThe following players have been removed from the queue:\n${missingNames.sort().join("\n")}`})
//         } else {
//             for (let i = 0; i < remainingEntries.length; i++) {
//                 const arenaEntry = arenaEntries[i]
//                 await arenaEntry?.update({ status: 'playing' })
//             }

//             assignArenaRoles(arenaEntries)
//             setTimeout(() => {
//                 interaction.channel.send({ content: `<@&${arenaRole}>, look alive gamers! The Arena starts in 10 seconds. ${cavebob}`})
//             }, 1000)

//             return setTimeout(() => { return sendArenaPairings(interaction, round) }, 11000)
//         }
//     }, 61000)
// }