
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { Card, ForgedInventory, ForgedPrint, ForgedSet, Player, Wallet } from '../database/index.js'
import { Op } from 'sequelize'
import { drawPack } from '../functions/packs.js'
import { getRandomElement, getRandomSubset } from '../functions/utility.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const { AOD, com, rar, sup, ult, scr, starchips, stardust } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('pack')
		.setDescription('Purchase one or more packs! 🎴')
        .addStringOption(str =>
            str
                .setName('set')
                .setDescription('Enter set query.')
                .setAutocomplete(true)
                .setRequired(true)
        )
        .addNumberOption(option =>
            option
                .setName('quantity')
                .setDescription('How many packs?')
                .setRequired(false)
        ),
        async autocomplete(interaction) {
            try {
                const focusedValue = interaction.options.getFocused()
                const sets = await ForgedSet.findAll({
                    where: {
                        [Op.or]: {
                            name: {[Op.iLike]: `${focusedValue}%`},
                            code: {[Op.iLike]: `${focusedValue}%`}
                        },
                        forSale: true
                    },
                    limit: 5,
                    order: [["createdAt", "DESC"]]
                })

                await interaction.respond(
                    sets.map(set => ({ name: `${set.name} (${set.code})`, value: set.code })),
                )
            } catch (err) {
                console.log(err)
            }
        },
	async execute(interaction) {
        try {     
            const num = interaction.options.getNumber('quantity') || 1
            const code = interaction.options.getString('set')
            if (num < 1) return interaction.reply({ content: `You cannot buy less than 1 pack.`})
            if (num > 24) return interaction.reply({ content: `You cannot buy more than 24 packs.`})

            const set = await ForgedSet.findOne({ where: { code: code }})
            if (!set) return interaction.reply({ content: `Could not find set code: ${code}.`})

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

            const player = await Player.findOne( { where: { discordId: interaction.user.id }, include: [Wallet] })
            const wallet = player.wallet
            const merchbot = await Player.findOne( { where: { discordId: '584215266586525696' }, include: [Wallet] })
            const merchbotWallet = merchbot.wallet
            if (!wallet) return interaction.reply({ content: `You are not in the database. Type **/play** to begin the game.`})
            // const discount = player.forgedSubscription === '' && set.currency === 'stardust' ? (1 / 1.1) : 1
            const discount = 1

            const money = wallet[set.currency]
            if (money < (Math.round(set.unitPrice * discount) * num)) return interaction.reply({ content: `Sorry, ${player.name}, you only have ${money}${eval(set.currency)} and ${num > 1 ? `${num} ` : ''}${set.name} ${eval(set.emoji)} Packs cost ${Math.round(set.unitPrice * discount) * num}${eval(set.currency)}.`})
            
            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId(`Pack-Yes`)
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId(`Pack-No`)
                    .setLabel('No')
                    .setStyle(ButtonStyle.Primary)
                )

            await interaction.reply({ content: `${player.name}, you have ${money}${eval(set.currency)}. Do you want to spend ${Math.round(set.unitPrice * discount) * num}${eval(set.currency)} on ${num > 1 ? num : 'a'} ${set.name} ${eval(set.emoji)} Pack${num > 1 ? 's' : ''}?`, components: [row] })

            const filter = i => i.customId.startsWith('Pack-') && i.user.id === interaction.user.id;

            try {
                const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                if (confirmation.customId.includes('Yes')) {
                    interaction.editReply({ content: `Thank you for your purchase! I'll send you the contents of your ${set.name} ${eval(set.emoji)} Pack${num > 1 ? 's' : ''}.`, components: []})
                    
                    for (let j = 0; j < num; j++) {
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

                    wallet[set.currency] -= (Math.round(set.unitPrice * discount) * num)
                    await wallet.save()

                    merchbotWallet.stardust += set.currency === 'stardust' ? set.unitPrice * discount * num : set.unitPrice * num * 10
                    await merchbotWallet.save()

                    set.unitSales += num
                    await set.save()
                    return
                } else {
                    await confirmation.update({ components: [] })
                    await confirmation.editReply({ content: `Not a problem. No packs were purchased.`, components: [] })
                }
            } catch (err) {
                console.log(err)
                await interaction.editReply({ content: `Sorry, time's up. No packs were purchased.`, components: [] });
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