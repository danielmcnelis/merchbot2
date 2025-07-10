
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { Card, ForgedInventory, ForgedPrint, ForgedSet, Player, Wallet } from '../database/index.js'
import { Op } from 'sequelize'
import { drawPack } from '../functions/packs.js'
import { drawCardImage, getRandomElement, getRandomSubset } from '../functions/utility.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const { AOD, CTP, FON, com, rar, sup, ult, scr, starchips, stardust } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('tin')
		.setDescription('Purchase a collector\'s tin! 🎴')
        .addNumberOption(num =>
            num
                .setName('promo')
                .setDescription('Enter promo query.')
                .setAutocomplete(true)
                .setRequired(true)
        )
    	.setContexts(InteractionContextType.Guild),
        async autocomplete(interaction) {
            try {
                const focusedValue = interaction.options.getFocused()
                const prints = await ForgedPrint.findAll({
                    where: {
                        [Op.or]: {
                            cardName: {[Op.iLike]: `${focusedValue}%`},
                            cardCode: {[Op.iLike]: `${focusedValue}%`}
                        },
                        cardCode: {[Op.startsWith]: 'CT1-'}
                    },
                    limit: 6,
                    order: [["cardName", "ASC"]]
                })

                await interaction.respond(
                    prints.map(print => ({ name: `${print.name} (${print.cardCode})`, value: print.id })),
                )
            } catch (err) {
                console.log(err)
            }
        },
	async execute(interaction) {
        try {     
            const promoId = interaction.options.getNumber('promo')
            const promo = await ForgedPrint.findOne({ where: { id: promoId }})
            const player = await Player.findOne( { where: { discordId: interaction.user.id }, include: [Wallet] })
            const wallet = player.wallet
            const merchbot = await Player.findOne( { where: { discordId: '584215266586525696' }, include: [Wallet] })
            const merchbotWallet = merchbot.wallet
            if (!wallet) return interaction.reply({ content: `You are not in the database. Type **/play** to begin the game.`})
            if (wallet.starchips < 100) return interaction.reply({ content: `Sorry, ${player.name}, you only have ${money}${starchips} and Collector's Tins cost 100${starchips}.`})
            
            const timestamp = new Date().getTime()

            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId(`Tin-${timestamp}-Yes`)
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId(`Tin-${timestamp}-No`)
                    .setLabel('No')
                    .setStyle(ButtonStyle.Primary)
                )

            await interaction.reply({ content: `${player.name}, you have ${wallet.starchips}${starchips}. Do you want to spend 100${starchips} on a ${promo.cardName} - Series 1 Collector's Tin?`, components: [row] })

            const filter = i => i.customId.startsWith(`Tin-${timestamp}`) && i.user.id === interaction.user.id;

            try {
                const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                if (confirmation.customId.includes('Yes')) {

                    const updatedWallet = await Wallet.findOne({ where: { playerId: player.id }})
                    if (updatedWallet.starchips < 100) return interaction.editReply({ content: `Sorry, ${player.name}, you only have ${updatedWallet.starchips}${starchips} and Series 1 Collector's Tins cost 100${starchips}.`})
                    
                    updatedWallet.starchips -= 100
                    await updatedWallet.save()

                    merchbotWallet.stardust += 1000
                    await merchbotWallet.save()

                    const set1 = await ForgedSet.findOne({
                        where: {
                            code: 'AOD'
                        }
                    })

                    const set2 = await ForgedSet.findOne({
                        where: {
                            code: 'FON'
                        }
                    })

                    set1.unitSales += 3
                    await set1.save()

                    set2.unitSales += 3
                    await set2.save()
                    
                    interaction.editReply({ content: `Thank you for your purchase! I'll send you the contents of your Series 1 Collector's Tin.`, components: []})
                    
                    const set1Commons = [...await ForgedPrint.findAll({ 
                        where: {
                            forgedSetId: set1.id,
                            rarity: "com"
                        },
                        order: [['cardSlot', 'ASC']]
                    })].map((p) => p.cardCode)

                    const set1Rares = [...await ForgedPrint.findAll({ 
                        where: {
                            forgedSetId: set1.id,
                            rarity: "rar"
                        },
                        order: [['cardSlot', 'ASC']]
                    })].map((p) => p.cardCode)

                    const set1Supers = [...await ForgedPrint.findAll({ 
                        where: {
                            forgedSetId: set1.id,
                            rarity: "sup"
                        },
                        order: [['cardSlot', 'ASC']]
                    })].filter((p) => !p.cardCode.includes('-SE')).map((p) => p.cardCode)

                    const set1Ultras = [...await ForgedPrint.findAll({ 
                        where: {
                            forgedSetId: set1.id,
                            rarity: "ult"
                        },
                        order: [['cardSlot', 'ASC']]
                    })].map((p) => p.cardCode)

                    const set1Secrets = [...await ForgedPrint.findAll({ 
                        where: {
                            forgedSetId: set1.id,
                            rarity: "scr"
                        },
                        order: [['cardSlot', 'ASC']]
                    })].map((p) => p.cardCode)

                    for (let j = 0; j < 3; j++) {
                        const results = [`\n${eval(set1.emoji)} - ${set1.name} Pack ${j + 1} - ${eval(set1.altEmoji)}`]
                        const yourCommons = set1.commonsPerPack > 1 ? getRandomSubset(set1Commons, set1.commonsPerPack) : set1.commonsPerPack === 1 ? [getRandomElement(set1Commons)] : []
                        const yourRares = set1.raresPerPack > 1 ? getRandomSubset(set1Rares, set1.raresPerPack) : set1.raresPerPack === 1 ? [getRandomElement(set1Rares)] : []
                        const yourSupers = set1.supersPerPack > 1 ? getRandomSubset(set1Supers, set1.supersPerPack) : set1.supersPerPack === 1 ? [getRandomElement(set1Supers)] : []
                        const yourUltras = set1.ultrasPerPack > 1 ? getRandomSubset(set1Ultras, set1.ultrasPerPack) : set1.ultrasPerPack === 1 ? [getRandomElement(set1Ultras)] : []
                        const yourSecrets = set1.secretsPerPack > 1 ? getRandomSubset(set1Secrets, set1.secretsPerPack) : set1.secretsPerPack === 1 ? [getRandomElement(set1Secrets)] :  []

                        const odds = []
                        if (!yourCommons.length) for (let i = 0; i < set1.commonsPerBox; i++) odds.push("set1Commons")
                        if (!yourRares.length) for (let i = 0; i < set1.raresPerBox; i++) odds.push("set1Rares")
                        if (!yourSupers.length) for (let i = 0; i < set1.supersPerBox; i++) odds.push("set1Supers")
                        if (!yourUltras.length) for (let i = 0; i < set1.ultrasPerBox; i++) odds.push("set1Ultras")
                        if (!yourSecrets.length) for (let i = 0; i < set1.secretsPerBox; i++) odds.push("set1Secrets")

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

                            if (!print.id) return interaction.reply({ content: `Error: ${yourPack[i]} does not exist in the print database.`})
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
                        interaction.user.send({ content: `${results.join('\n').toString()}`, files: [attachment] }).catch((err) => console.log(err))
                    }


                    const set2Commons = [...await ForgedPrint.findAll({ 
                        where: {
                            forgedSetId: set2.id,
                            rarity: "com"
                        },
                        order: [['cardSlot', 'ASC']]
                    })].map((p) => p.cardCode)

                    const set2Rares = [...await ForgedPrint.findAll({ 
                        where: {
                            forgedSetId: set2.id,
                            rarity: "rar"
                        },
                        order: [['cardSlot', 'ASC']]
                    })].map((p) => p.cardCode)

                    const set2Supers = [...await ForgedPrint.findAll({ 
                        where: {
                            forgedSetId: set2.id,
                            rarity: "sup"
                        },
                        order: [['cardSlot', 'ASC']]
                    })].filter((p) => !p.cardCode.includes('-SE')).map((p) => p.cardCode)

                    const set2Ultras = [...await ForgedPrint.findAll({ 
                        where: {
                            forgedSetId: set2.id,
                            rarity: "ult"
                        },
                        order: [['cardSlot', 'ASC']]
                    })].map((p) => p.cardCode)

                    const set2Secrets = [...await ForgedPrint.findAll({ 
                        where: {
                            forgedSetId: set2.id,
                            rarity: "scr"
                        },
                        order: [['cardSlot', 'ASC']]
                    })].map((p) => p.cardCode)

                    for (let j = 0; j < 3; j++) {
                        const results = [`\n${eval(set2.emoji)} - ${set2.name} Pack ${j + 1} - ${eval(set2.altEmoji)}`]
                        const yourCommons = set2.commonsPerPack > 1 ? getRandomSubset(set2Commons, set2.commonsPerPack) : set2.commonsPerPack === 1 ? [getRandomElement(set2Commons)] : []
                        const yourRares = set2.raresPerPack > 1 ? getRandomSubset(set2Rares, set2.raresPerPack) : set2.raresPerPack === 1 ? [getRandomElement(set2Rares)] : []
                        const yourSupers = set2.supersPerPack > 1 ? getRandomSubset(set2Supers, set2.supersPerPack) : set2.supersPerPack === 1 ? [getRandomElement(set2Supers)] : []
                        const yourUltras = set2.ultrasPerPack > 1 ? getRandomSubset(set2Ultras, set2.ultrasPerPack) : set2.ultrasPerPack === 1 ? [getRandomElement(set2Ultras)] : []
                        const yourSecrets = set2.secretsPerPack > 1 ? getRandomSubset(set2Secrets, set2.secretsPerPack) : set2.secretsPerPack === 1 ? [getRandomElement(set2Secrets)] :  []

                        const odds = []
                        if (!yourCommons.length) for (let i = 0; i < set2.commonsPerBox; i++) odds.push("set2Commons")
                        if (!yourRares.length) for (let i = 0; i < set2.raresPerBox; i++) odds.push("set2Rares")
                        if (!yourSupers.length) for (let i = 0; i < set2.supersPerBox; i++) odds.push("set2Supers")
                        if (!yourUltras.length) for (let i = 0; i < set2.ultrasPerBox; i++) odds.push("set2Ultras")
                        if (!yourSecrets.length) for (let i = 0; i < set2.secretsPerBox; i++) odds.push("set2Secrets")

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

                            if (!print.id) return interaction.reply({ content: `Error: ${yourPack[i]} does not exist in the print database.`})
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
                        interaction.user.send({ content: `${results.join('\n').toString()}`, files: [attachment] }).catch((err) => console.log(err))
                    }

                    const inv = await ForgedInventory.findOne({ where: { 
                        cardCode: promo.cardCode,
                        forgedPrintId: promo.id,
                        playerId: player.id
                    }})

                    if (inv) {
                        inv.quantity++
                        await inv.save()
                    } else {
                        await ForgedInventory.create({ 
                            cardName: promo.cardName,
                            cardCode: promo.cardCode,
                            cardId: promo.cardId,
                            quantity: 1,
                            forgedPrintId: promo.id,
                            playerName: player.name,
                            playerId: player.id
                        })
                    }

                    const yourPromoAttachment = await drawCardImage(promo.cardName)
                    return interaction.user.send({ content: `${CTP} - Series 1 Collector's Tin Promo - ${CTP}\n${eval(promo.rarity)}${promo.cardCode} - ${promo.cardName}`, files: [yourPromoAttachment] }).catch((err) => console.log(err))
                } else {
                    await interaction.editReply({ content: `Not a problem. No Collector's Tin was purchased.`, components: [] })
                }
            } catch (err) {
                console.log(err)
                await interaction.editReply({ content: `Sorry, time's up. No Collector's Tin was purchased.`, components: [] });
            }

            // const filter = m => m.author.id === message.author.id
            // interaction.reply({ content: `${player.name}, you have ${money}${eval(set.currency)}. Do you want to spend ${Math.round(set.unitPrice * discount) * num}${eval(set.currency)} on ${num > 1 ? num : 'a'} ${set.name} ${eval(set.emoji)} Pack${num > 1 ? 's' : ''}?`})
            // await message.channel.awaitMessages({ filter,
            //     max: 1,
            //     time: 15000
            // }).then(async (collected) => {
            //     if (!yescom.includes(collected.first().content.toLowerCase())) return interaction.reply({ content: `No problem. Have a nice day.`})
                
            //     interaction.reply({ content: `Thank you for your purchase! I'll send you the contents of your ${set.name} ${eval(set.emoji)} Pack${num > 1 ? 's' : ''}.`})
            //     let gotSecret = false
            //     const boxes = Math.floor(num / set.packsPerBox)
            //     const packsFromBoxes = boxes * set.packsPerBox

            //     for (let j = 0; j < num; j++) {
            //         const images = []
            //         const results = [`\n${eval(set.emoji)} - ${set.name} Pack${num > 1 ? ` ${j + 1}` : ''} - ${eval(set.altEmoji)}`]
            //         const yourCommons = set.commonsPerPack > 1 ? getRandomSubset(commons, set.commonsPerPack) : set.commonsPerPack === 1 ? [getRandomElement(commons)] : []
            //         const yourRares = set.raresPerPack > 1 ? getRandomSubset(rares, set.raresPerPack) : set.raresPerPack === 1 ? [getRandomElement(rares)] : []
            //         const yourSupers = set.supersPerPack > 1 ? getRandomSubset(supers, set.supersPerPack) : set.supersPerPack === 1 ? [getRandomElement(supers)] : []
            //         const yourUltras = set.ultrasPerPack > 1 ? getRandomSubset(ultras, set.ultrasPerPack) : set.ultrasPerPack === 1 ? [getRandomElement(ultras)] : []
            //         const yourSecrets = set.secretsPerPack > 1 ? getRandomSubset(secrets, set.secretsPerPack) : set.secretsPerPack === 1 ? [getRandomElement(secrets)] :  []

            //         const odds = []
            //         if (!yourCommons.length) for (let i = 0; i < set.commonsPerBox; i++) odds.push("commons")
            //         if (!yourRares.length) for (let i = 0; i < set.raresPerBox; i++) odds.push("rares")
            //         if (!yourSupers.length) for (let i = 0; i < set.supersPerBox; i++) odds.push("supers")
            //         if (!yourUltras.length) for (let i = 0; i < set.ultrasPerBox; i++) odds.push("ultras")
            //         if (!yourSecrets.length) for (let i = 0; i < set.secretsPerBox; i++) odds.push("secrets")

            //         const luck = j < packsFromBoxes ? odds[j % set.packsPerBox] : getRandomElement(odds)
            //         const yourFoil = getRandomElement(eval(luck))
            //         const yourPack = [...yourCommons.sort(), ...yourRares.sort(), ...yourSupers.sort(), ...yourUltras.sort(), ...yourSecrets.sort(), yourFoil].filter((e) => !!e)

            //         for (let i = 0; i < yourPack.length; i++) {
            //             const print = await ForgedPrint.findOne({ where: {
            //                 cardCode: yourPack[i]
            //             }})

            //             if (!print.id) return interaction.reply({ content: `Error: ${yourPack[i]} does not exist in the Print database.`})
            //             results.push(`${eval(print.rarity)}${print.cardCode} - ${print.cardName}`)

            //             const card = await Card.findOne({ where: {
            //                 name: print.cardName
            //             }})
                
            //             images.push(`${card.image_file}`)
                    
            //             const inv = await ForgedInventory.findOne({ where: { 
            //                 cardCode: print.cardCode,
            //                 printId: print.id,
            //                 playerId: maid
            //             }})

            //             if (inv) {
            //                 inv.quantity++
            //                 await inv.save()
            //             } else {
            //                 await ForgedInventory.create({ 
            //                     cardCode: print.cardCode,
            //                     quantity: 1,
            //                     printId: print.id,
            //                     playerId: maid
            //                 })

            //                 if (print.rarity === 'scr') gotSecret = true
            //             }
            //         }

            //         const card_width = 57
            //         const canvas = Canvas.createCanvas(card_width * set.cardsPerPack, 80)
            //         const context = canvas.getContext('2d')

            //         for (let i = 0; i < set.cardsPerPack; i++) {
            //             const card = fs.existsSync(`./public/card_images/${images[i]}`) ? 
            //             await Canvas.loadImage(`./public/card_images/${images[i]}`) :
            //             await Canvas.loadImage(`https://ygoprodeck.com/pics/${images[i]}`)
            //             if (canvas && context && card) context.drawImage(card, card_width * i, 0, card_width, canvas.height)
            //         }
            
            //         const attachment =  canvas && context ?
            //             new Discord.MessageAttachment(canvas.toBuffer(), `pack_${j+1}.png`) :
            //             false
            //         message.author.send({ content: results.join('\n').toString(), files: [attachment] })
            //     }

            //     wallet[set.currency] -= (Math.round(set.unitPrice * discount) * num)
            //     await wallet.save()

            //     merchbotWallet.stardust += set.currency === 'stardust' ? set.unitPrice * discount * num : set.unitPrice * num * 10
            //     await merchbotWallet.save()

            //     set.unitSales += num
            //     await set.save()

            //     completeTask(message.channel, maid, 'e6')
            //     if (set.type === 'core' && num >= 5) completeTask(message.channel, maid, 'm3', 3000)
            //     if (gotSecret) completeTask(message.channel, maid, 'm4', 5000)
            //     if (set.type === 'core' && await checkCoreSetComplete(maid, 1)) completeTask(message.channel, 'h4', 5000)
            //     if (set.type === 'core' && await checkCoreSetComplete(maid, 3)) completeTask(message.channel, 'l3', 6000)
            //     return
            // }).catch((err) => {
            //     console.log(err)
            //     return interaction.reply({ content: `Sorry, time's up.` })
            // })
        } catch (err) {
            console.log(err)
        }
	}
}