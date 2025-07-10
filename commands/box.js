
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { Card, Player, ForgedInventory, ForgedPrint, ForgedSet, Wallet } from '../database/index.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
import { getRandomElement, getRandomSubset } from '../functions/utility.js'
import { drawPack } from '../functions/packs.js'
const {com, rar, sup, ult, scr, AOD, CTP, FON, starchips, stardust} = emojis


export default {
	data: new SlashCommandBuilder()
		.setName('box')
		.setDescription('Purchase a box! 📦')
        .addStringOption(str =>
            str
                .setName('set')
                .setDescription('Enter set query.')
                .setAutocomplete(true)
                .setRequired(true)
        )
    	.setContexts(InteractionContextType.Guild),
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
            const num = 24
            const code = interaction.options.getString('set')
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
            if (money < (Math.round(set.boxPrice * discount))) return interaction.reply({ content: `Sorry, ${player.name}, you only have ${money}${eval(set.currency)} and ${set.name} ${eval(set.emoji)} Boxes cost ${Math.round(set.boxPrice * discount)}${eval(set.currency)}.`})
            
            const timestamp = new Date().getTime()

            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId(`Box-${timestamp}-Yes`)
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId(`Box-${timestamp}-No`)
                    .setLabel('No')
                    .setStyle(ButtonStyle.Primary)
                )

            await interaction.reply({ content: `${player.name}, you have ${money}${eval(set.currency)}. Do you want to spend ${Math.round(set.boxPrice * discount)}${eval(set.currency)} on a ${set.name} ${eval(set.emoji)} Box?`, components: [row] })

            const filter = i => i.customId.startsWith(`Box-${timestamp}`) && i.user.id === interaction.user.id;

            try {
                const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                if (confirmation.customId.includes('Yes')) {

                    const updatedWallet = await Wallet.findOne({ where: { playerId: player.id }})

                    const updateMoney = updatedWallet[set.currency]
                    if (updateMoney < (Math.round(set.boxPrice * discount))) return interaction.editReply({ content: `Sorry, ${player.name}, you only have ${money}${eval(set.currency)} and a Box of ${set.name} ${eval(set.emoji)} costs ${Math.round(set.boxPrice * discount)}${eval(set.currency)}.`})
                    
                    updatedWallet[set.currency] -= (Math.round(set.boxPrice * discount))
                    await updatedWallet.save()

                    merchbotWallet.stardust += set.currency === 'stardust' ? set.boxPrice * discount : set.boxPrice * discount * 10
                    await merchbotWallet.save()

                    set.unitSales += num
                    await set.save()

                    interaction.editReply({ content: `Thank you for your purchase! I'll send you the contents of your ${set.name} ${eval(set.emoji)} Box.`, components: []})
                    // const boxes = Math.floor(num / set.packsPerBox)
                    // const packsFromBoxes = boxes * set.packsPerBox

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
    
                            const luck = odds[j]
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
                        } catch (err) {
                            console.log(err)
                        }
                    }

                    wallet[set.currency] -= (Math.round(set.boxPrice * discount))
                    await wallet.save()

                    merchbotWallet.stardust += set.currency === 'stardust' ? set.boxPrice * discount * 10 : set.boxPrice * 10
                    await merchbotWallet.save()

                    set.unitSales += num
                    await set.save()
                    return
                } else {
                    await confirmation.editReply({ content: `Not a problem. No box was purchased.`, components: [] })
                }
            } catch (err) {
                console.log(err)
                await interaction.editReply({ content: `Sorry, time's up. No box was purchased.`, components: [] });
            }
        } catch (err) {
            console.log(err)
        }
	}
}