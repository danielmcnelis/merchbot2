

// const Canvas = require('canvas')
import { createRequire } from "module";
const require = createRequire(import.meta.url)
const Canvas = require('canvas')

import {AttachmentBuilder} from 'discord.js'
import fs from 'fs'
import { Op } from 'sequelize'
import { Auction, Bid, Card, ForgedPrint, ForgedSet, ForgedInventory, Player } from '../database/index.js'
import { getRandomElement, getRandomSubset } from './utility.js'
import channels from '../static/channels.json' with { type: 'json' }
const { botSpamChannelId } = channels
import { client } from '../static/clients.js'
const merchbotId = '584215266586525696'
import emojis from '../static/emojis.json' with { type: 'json' }
const { AOD, COC, CTP, FON, beast, blue, bronze, cactus, cavebob, DRT, fiend, skull, familiar, battery, thunder, zombie, checkmark, com, credits, cultured, diamond, dinosaur, DOC, LPK, egg, emptybox, evil, FiC, fire, fish, god, gold, hook, koolaid, leatherbound, legend, lmfao, mad, master, merchant, milleye, moai, mushroom, no, ORF, TEB, warrior, spellcaster, dragon, plant, platinum, rar, red, reptile, rock, rocks, rose, sad, scr, silver, soldier, starchips, stardust, stare, dimmadome, sup, tix, ult, wokefrog, yellow, yes, ygocard } = emojis

// AWARD PACKS
export const awardPacks = async (channel, member, set, num = 1) => {
    const player = await Player.findByDiscordId(member.user.id)
	
    const commons = [...await ForgedPrint.findAll({ 
        where: {
            forgedSetId: set.id,
            rarity: "com"
        },
        order: [['cardSlot', 'ASC']]
    })].map((p) => p.cardCode)

    const rares = [...await ForgedPrint.findAll({ 
        where: {
            forgedSetId: set.id,
            rarity: "rar"
        },
        order: [['cardSlot', 'ASC']]
    })].map((p) => p.cardCode)

    const supers = [...await ForgedPrint.findAll({ 
        where: {
            forgedSetId: set.id,
            rarity: "sup"
        },
        order: [['cardSlot', 'ASC']]
    })].filter((p) => !p.cardCode.includes('-SE')).map((p) => p.cardCode)

    const ultras = [...await ForgedPrint.findAll({ 
        where: {
            forgedSetId: set.id,
            rarity: "ult"
        },
        order: [['cardSlot', 'ASC']]
    })].map((p) => p.cardCode)

    const secrets = [...await ForgedPrint.findAll({ 
        where: {
            forgedSetId: set.id,
            rarity: "scr"
        },
        order: [['cardSlot', 'ASC']]
    })].map((p) => p.cardCode)

    for (let j = 0; j < num; j++) {
        try {
            const results = [`\n${eval(set.emoji)} - ${set.name} Pack${num > 1 ? ` ${j + 1}` : ''} - ${eval(set.altEmoji)}`]
            const yourCommons = set.commonsPerPack > 1 ? getRandomSubset(commons, set.commonsPerPack) : set.commonsPerPack === 1 ? [getRandomElement(commons)] : []
            const yourRares = set.raresPerPack > 1 ? getRandomSubset(rares, set.raresPerPack) : set.raresPerPack === 1 ? [getRandomElement(rares)] : []
            const yourSupers = set.supersPerPack > 1 ? getRandomSubset(supers, set.supersPerPack) : set.supersPerPack === 1 ? [getRandomElement(supers)] : []
            const yourUltras = set.ultrasPerPack > 1 ? getRandomSubset(ultras, set.ultrasPerPack) : set.ultrasPerPack === 1 ? [getRandomElement(ultras)] : []
            const yourSecrets = set.secretsPerPack > 1 ? getRandomSubset(secrets, set.secretsPerPack) : set.secretsPerPack === 1 ? [getRandomElement(secrets)] :  []
    
            const odds = []
            if (!yourCommons.length) for (let i = 0; i < set.commonsPerBox; i++) odds.push("commons")
            if (!yourRares.length) for (let i = 0; i < set.raresPerBox; i++) odds.push("rares")
            if (!yourSupers.length) for (let i = 0; i < set.supersPerBox; i++) odds.push("supers")
            if (!yourUltras.length) for (let i = 0; i < set.ultrasPerBox; i++) odds.push("ultras")
            if (!yourSecrets.length) for (let i = 0; i < set.secretsPerBox; i++) odds.push("secrets")
    
            const luck = getRandomElement(odds)
            const yourFoil = getRandomElement(eval(luck))
            const yourPack = [...yourCommons.sort(), ...yourRares.sort(), ...yourSupers.sort(), ...yourUltras.sort(), ...yourSecrets.sort(), yourFoil].filter((e) => !!e)
            
            let yourCardArtworkIds = []
            for (let j = 0; j < yourPack.length; j++) {
                const cardCode = yourPack[j]
                const print = await ForgedPrint.findOne({ where: { cardCode }})
                const card = await Card.findOne({ where: { name: print.cardName }})
                yourCardArtworkIds.push(card.artworkId)
            }
    
            for (let i = 0; i < yourPack.length; i++) {
                const print = await ForgedPrint.findOne({ where: {
                    cardCode: yourPack[i]
                }})
    
                results.push(`${eval(print.rarity)}${print.cardCode} - ${print.cardName}`)
            
                const inv = await ForgedInventory.findOne({ where: { 
                    cardCode: print.cardCode,
                    forgedPrintId: print.id,
                    playerId: player.id
                }})
    
                if (inv) {
                    inv.quantity++
                    await inv.save()
                } else {
                    await ForgedInventory.create({ 
                        cardName: print.cardName,
                        cardCode: print.cardCode,
                        cardId: print.cardId,
                        quantity: 1,
                        forgedPrintId: print.id,
                        playerName: player.name,
                        playerId: player.id
                    })
                }
            }
    
            const attachment = await drawPack(yourCardArtworkIds) || []
            member.send({ content: `${results.join('\n').toString()}`, files: [attachment] }).catch((err) => console.log(err))
        } catch (err) {
            console.log(err)
        }
    }

    return channel.send({ content: `<@${member.user.id}> was awarded ${num === 1 ? 'a' : num} ${num === 1 ? 'Pack' : 'Packs'} of ${set.name}.${eval(set.code)} Congratulations!`})
}

// AWARD PACKS
export const awardBox = async (channel, member, set, offset = 24) => {
    let j = 24 - offset
    const partial = offset !== 24
    const num = 24
    const player = await Player.findByDiscordId(member.user.id)
	
    const commons = [...await ForgedPrint.findAll({ 
        where: {
            forgedSetId: set.id,
            rarity: "com"
        },
        order: [['cardSlot', 'ASC']]
    })].map((p) => p.cardCode)

    const rares = [...await ForgedPrint.findAll({ 
        where: {
            forgedSetId: set.id,
            rarity: "rar"
        },
        order: [['cardSlot', 'ASC']]
    })].map((p) => p.cardCode)

    const supers = [...await ForgedPrint.findAll({ 
        where: {
            forgedSetId: set.id,
            rarity: "sup"
        },
        order: [['cardSlot', 'ASC']]
    })].filter((p) => !p.cardCode.includes('-SE')).map((p) => p.cardCode)

    const ultras = [...await ForgedPrint.findAll({ 
        where: {
            forgedSetId: set.id,
            rarity: "ult"
        },
        order: [['cardSlot', 'ASC']]
    })].map((p) => p.cardCode)

    const secrets = [...await ForgedPrint.findAll({ 
        where: {
            forgedSetId: set.id,
            rarity: "scr"
        },
        order: [['cardSlot', 'ASC']]
    })].map((p) => p.cardCode)

    for (j; j < num; j++) {
        try {
            const results = [`\n${eval(set.emoji)} - ${set.name} Pack${num > 1 ? ` ${j + 1}` : ''} - ${eval(set.altEmoji)}`]
            const yourCommons = set.commonsPerPack > 1 ? getRandomSubset(commons, set.commonsPerPack) : set.commonsPerPack === 1 ? [getRandomElement(commons)] : []
            const yourRares = set.raresPerPack > 1 ? getRandomSubset(rares, set.raresPerPack) : set.raresPerPack === 1 ? [getRandomElement(rares)] : []
            const yourSupers = set.supersPerPack > 1 ? getRandomSubset(supers, set.supersPerPack) : set.supersPerPack === 1 ? [getRandomElement(supers)] : []
            const yourUltras = set.ultrasPerPack > 1 ? getRandomSubset(ultras, set.ultrasPerPack) : set.ultrasPerPack === 1 ? [getRandomElement(ultras)] : []
            const yourSecrets = set.secretsPerPack > 1 ? getRandomSubset(secrets, set.secretsPerPack) : set.secretsPerPack === 1 ? [getRandomElement(secrets)] :  []

            const odds = []
            if (!yourCommons.length) for (let i = 0; i < set.commonsPerBox; i++) odds.push("commons")
            if (!yourRares.length) for (let i = 0; i < set.raresPerBox; i++) odds.push("rares")
            if (!yourSupers.length) for (let i = 0; i < set.supersPerBox; i++) odds.push("supers")
            if (!yourUltras.length) for (let i = 0; i < set.ultrasPerBox; i++) odds.push("ultras")
            if (!yourSecrets.length) for (let i = 0; i < set.secretsPerBox; i++) odds.push("secrets")

            const luck = odds[j]
            const yourFoil = getRandomElement(eval(luck))
            const yourPack = [...yourCommons.sort(), ...yourRares.sort(), ...yourSupers.sort(), ...yourUltras.sort(), ...yourSecrets.sort(), yourFoil].filter((e) => !!e)
            
            let yourCardArtworkIds = []
            for (let k = 0; k < yourPack.length; k++) {
                const cardCode = yourPack[k]
                const print = await ForgedPrint.findOne({ where: { cardCode }})
                const card = await Card.findOne({ where: { name: print.cardName }})
                yourCardArtworkIds.push(card.artworkId)
            }

            for (let i = 0; i < yourPack.length; i++) {
                const print = await ForgedPrint.findOne({ where: {
                    cardCode: yourPack[i]
                }})

                if (!print.id) return interaction.reply({ content: `Error: ${yourPack[i]} does not exist in the Print database.`})
                results.push(`${eval(print.rarity)}${print.cardCode} - ${print.cardName}`)
            
                const inv = await ForgedInventory.findOne({ where: { 
                    cardCode: print.cardCode,
                    forgedPrintId: print.id,
                    playerId: player.id
                }})

                if (inv) {
                    inv.quantity++
                    await inv.save()
                } else {
                    await ForgedInventory.create({ 
                        cardName: print.cardName,
                        cardCode: print.cardCode,
                        cardId: print.cardId,
                        quantity: 1,
                        forgedPrintId: print.id,
                        playerName: player.name,
                        playerId: player.id
                    })
                }
            }

            const attachment = await drawPack(yourCardArtworkIds) || []
            await member.user.send({ content: `${results.join('\n').toString()}`, files: [attachment] }).catch((err) => console.log(err))
        } catch (err) {
            console.log(err)
        }
    }

    return channel.send({ content: `<@${member.user.id}> was awarded a ${partial ? 'partial ' : ''}Box of ${set.name}.${eval(set.code)} Congratulations!`})
}

export const awaitAwardPromosToShop = async () => {
	const botSpamChannel = client.channels.cache.get(botSpamChannelId)
    if (!botSpamChannel) return console.log('Could not find #bot-spam channel.')
    const promos = await ForgedPrint.findAll({
        where: {
            setCode: {[Op.or]: ['CT1', 'CT2']}
        }
    })

    for (let i = 0; i < promos.length; i++) {
        const promo = promos[i]
        
        const inv = await ForgedInventory.findOne({ where: { 
            forgedPrintId: promo.id,
            playerId: 'ZXyLL1wTcEZXSZYtegEuTr'
        }})

        const auction = await Auction.findOne({ where: { 
            cardCode: promo.cardCode
        }})

        if (auction) {
            auction.quantity++
            await auction.save()
        }

        if (!inv || inv.quantity === 0) {
            await Auction.create({
                cardCode: promo.cardCode,
                cardName: promo.cardName,
                forgedPrintId: promo.id,
                quantity: 1
            })
        }

        if (inv) {
            inv.quantity++
            await inv.save()
        } else {
            await ForgedInventory.create({ 
                cardCode: promo.cardCode,
                cardName: promo.cardName,
                cardId: promo.cardId,
                quantity: 1,
                forgedPrintId: promo.id,
                playerName: 'MerchBot',
                playerId: 'ZXyLL1wTcEZXSZYtegEuTr'
            })
        }
    }

    botSpamChannel.send({ content: `<@${merchbotId}> received ${promos.length} Tin Promos!`})

    for (let i = 0; i < promos.length; i += 30) {
        const promo = promos[i]
        botSpamChannel.send({ content: `1 ${eval(promo.rarity)} ${promo.cardCode} - ${promo.cardName}`})
        i++
    }
}

export const awardPacksToShop = async (num, core = true) => {
	const botSpamChannel = client.channels.cache.get(botSpamChannelId)
    if (!botSpamChannel) return console.log('Could not find #bot-spam channel.')

    const sets = core ? 
        await ForgedSet.findAll({ where: {
            type: 'core',
            currency: 'starchips'
        }, order: [["createdAt", "DESC"]]}) :
        await ForgedSet.findAll({ where: {
            type: 'mini',
            currency: 'starchips'
        }, order: [["createdAt", "DESC"]]})
                
    if (!sets.length) return botSpamChannel.send({ content: `No ${core ? 'core' : 'mini'} sets found.`})
    // const set_1 = sets[0]
    // const set_2 = sets[1] ? sets[1] : null

    for (let i = 0; i < sets.length; i++) {
        const set = sets[i]
        if (!set) continue
        const commons = [...await ForgedPrint.findAll({ 
            where: {
                forgedSetId: set.id,
                rarity: "com"
            },
            order: [['cardSlot', 'ASC']]
        })].map((p) => p.cardCode)
    
        const rares = [...await ForgedPrint.findAll({ 
            where: {
                forgedSetId: set.id,
                rarity: "rar"
            },
            order: [['cardSlot', 'ASC']]
        })].map((p) => p.cardCode)
    
        const supers = [...await ForgedPrint.findAll({ 
            where: {
                forgedSetId: set.id,
                rarity: "sup"
            },
            order: [['cardSlot', 'ASC']]
        })].filter((p) => !p.cardCode.includes('-SE')).map((p) => p.cardCode)
        
        const ultras = [...await ForgedPrint.findAll({ 
            where: {
                forgedSetId: set.id,
                rarity: "ult"
            },
            order: [['cardSlot', 'ASC']]
        })].map((p) => p.cardCode)
    
        const secrets = [...await ForgedPrint.findAll({ 
            where: {
                forgedSetId: set.id,
                rarity: "scr"
            },
            order: [['cardSlot', 'ASC']]
        })].map((p) => p.cardCode)
    
        const results = []
        const boxes = Math.floor(num / set.packsPerBox)
        const packs_fromBoxes = boxes * set.packsPerBox
    
        for (let j = 0; j < num; j++) {
            const yourCommons = set.commonsPerPack > 1 ? getRandomSubset(commons, set.commonsPerPack) : set.commonsPerPack === 1 ? [getRandomElement(commons)] : []
            const yourRares = set.raresPerPack > 1 ? getRandomSubset(rares, set.raresPerPack) : set.raresPerPack === 1 ? [getRandomElement(rares)] : []
            const yourSupers = set.supersPerPack > 1 ? getRandomSubset(supers, set.supersPerPack) : set.supersPerPack === 1 ? [getRandomElement(supers)] : []
            const yourUltras = set.ultrasPerPack > 1 ? getRandomSubset(ultras, set.ultrasPerPack) : set.ultrasPerPack === 1 ? [getRandomElement(ultras)] : []
            const yourSecrets = set.secretsPerPack > 1 ? getRandomSubset(secrets, set.secretsPerPack) : set.secretsPerPack === 1 ? [getRandomElement(secrets)] :  []
        
            const odds = []
            if (!yourCommons.length) for (let i = 0; i < set.commonsPerBox; i++) odds.push("commons")
            if (!yourRares.length) for (let i = 0; i < set.raresPerBox; i++) odds.push("rares")
            if (!yourSupers.length) for (let i = 0; i < set.supersPerBox; i++) odds.push("supers")
            if (!yourUltras.length) for (let i = 0; i < set.ultrasPerBox; i++) odds.push("ultras")
            if (!yourSecrets.length) for (let i = 0; i < set.secretsPerBox; i++) odds.push("secrets")
        
            const luck = j < packs_fromBoxes ? odds[j % set.packsPerBox] : getRandomElement(odds)
            const yourFoil = getRandomElement(eval(luck))
        
            const yourPack = [...yourCommons.sort(), ...yourRares.sort(), ...yourSupers.sort(), ...yourUltras.sort(), ...yourSecrets.sort(), yourFoil].filter((e) => !!e)
        
            results.push(`\n${eval(set.emoji)} - ${set.name} Pack${num > 0 ? ` ${j + 1}` : ''} - ${eval(set.altEmoji)}`)
        
            for (let i = 0; i < yourPack.length; i++) {
                const print = await ForgedPrint.findOne({ where: {
                    cardCode: yourPack[i]
                }})
        
                results.push(`${eval(print.rarity)}${print.cardCode} - ${print.cardName}`)
        
                const inv = await ForgedInventory.findOne({ where: { 
                    forgedPrintId: print.id,
                    playerId: 'ZXyLL1wTcEZXSZYtegEuTr'
                }})
        
                const auction = await Auction.findOne({ where: { 
                    cardCode: print.cardCode
                }})
    
                if (auction) {
                    auction.quantity++
                    await auction.save()
                }
    
                if (!inv || inv.quantity === 0) {
                    await Auction.create({
                        cardCode: print.cardCode,
                        cardName: print.cardName,
                        forgedPrintId: print.id,
                        quantity: 1
                    })
                }
    
                if (inv) {
                    inv.quantity++
                    await inv.save()
                } else {
                    await ForgedInventory.create({ 
                        cardCode: print.cardCode,
                        cardName: print.cardName,
                        cardId: print.cardId,
                        quantity: 1,
                        forgedPrintId: print.id,
                        playerName: 'MerchBot',
                        playerId: 'ZXyLL1wTcEZXSZYtegEuTr'
                    })
                }
            }
        }
    
    
        botSpamChannel.send({ content: `<@${merchbotId}> opened ${num === 1 ? 'a' : num} ${num === 1 ? 'Pack' : 'Packs'} of ${set.name} ${eval(set.emoji)}!`})
    
        for (let i = 0; i < results.length; i += 30) {
            if (results[i+30] && results[i+30].includes(set.emoji)) {
                botSpamChannel.send({ content: results.slice(i, i+31).join('\n').toString()})
                i++
            } else {
                botSpamChannel.send({ content: results.slice(i, i+30).join('\n').toString()})
            }
        }
    }
    
    return true
}

// MAKE CANVAS ATTACHMENT
export const makeCanvasAttachment = async (artworkIds = [], width = 57, height = 80, cardsPerRow = 10) => {
    try {
        const rows = Math.ceil(artworkIds.length / cardsPerRow)
        const canvas = Canvas.createCanvas(width * cardsPerRow, height * rows)
        const context = canvas.getContext('2d')

        for (let i = 0; i < artworkIds.length; i++) {
            try {
                const artworkId = artworkIds[i]
                const row = Math.floor(i / cardsPerRow)
                const col = i % cardsPerRow
                const image = await Canvas.loadImage(`https://cdn.formatlibrary.com/images/cards/${artworkId}.jpg`)
                context.drawImage(image, width * col, row * height, width, height)
            } catch (err) {
                console.log(err)
            }
        }

        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: `pack.png` })
        return attachment
    } catch (err) {
        console.log(err)
        return null
    }
}

// DRAW PACK
export const drawPack = async (artworkIds = []) => {
    const packAttachment = await makeCanvasAttachment(artworkIds, 210, 316, 9)
    return packAttachment
}

// DRAW CARD IMAGE
export const drawCardImage = async (cardId) => {
    try {
        const canvas = Canvas.createCanvas(210, 316)
        const context = canvas.getContext('2d')
        const card = await Card.findOne({ where: { id: cardId }})
        const image = await Canvas.loadImage(`https://cdn.formatlibrary.com/images/cards/${card.artworkId}.jpg`)
        context.drawImage(image, 0, 0, 210, 316)
        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: `${card.name}` })
        return attachment
    } catch (err) {
        console.log(err)
    }
}