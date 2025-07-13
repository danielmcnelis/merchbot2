
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { Binder, ForgedInventory, ForgedPrint, ForgedSet, Info, Player, Wallet } from '../database/index.js'
import { calculateNewMarketPrice, getBuyerConfirmation } from '../functions/transaction.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
const {AOD, CTP, FON, com, rar, sup, ult, scr, stardust, merchant, lipton} = emojis
import channels from '../static/channels.json' with { type: 'json' }
const {botSpamChannelId} = channels

export default {
    data: new SlashCommandBuilder()
        .setName('dump')
        .setDescription('Sell many cards at once! 🚛 (Hint: Cards in Binder cannot be dumped)')
        .addNumberOption(option =>
            option
                .setName('keep')
                .setDescription('How many copies do you wish to keep?')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('rarity')
                .setDescription('Which rarity do you wish to dump?')
                .setRequired(true)
                .addChoices(
                    { name: 'All', value: 'all' },
                    { name: 'Common', value: 'com' },
                    { name: 'Rare', value: 'rar' },
                    { name: 'Super', value: 'sup' },
                    { name: 'Ultra', value: 'ult' },
                    { name: 'Secret', value: 'scr' },
                )
        )
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
                        forSale: true,
                        type: {[Op.or]: ['core', 'mini']}
                    },
                    limit: 5,
                    order: [["forSale", "DESC"], ["createdAt", "DESC"]]
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
            if (interaction.channel.id !== botSpamChannelId) return interaction.reply({ content: `Command not valid outside of <#${botSpamChannelId}>.` })
            const keep = interaction.options.getNumber('keep')
            if (keep < 0) return interaction.reply({ content: `You cannot keep less than 0 cards.`})
            const rarity = interaction.options.getString('rarity')
            const setCode = interaction.options.getString('set')
            const sellerDiscordId = interaction.user.id
            const seller = await Player.findByDiscordId(sellerDiscordId)
            const sellersWallet = await Wallet.findOne({ where: { playerId: seller.id }})
            const merchbotDiscordId = '584215266586525696'
            const merchbot = await Player.findByDiscordId(merchbotDiscordId)
            const merchbotWallet = await Wallet.findOne({ where: { playerId: merchbot.id }})

            if (!sellersWallet) return interaction.reply({ content: `You are not in the database. Type **/play** to begin the game.`})

            const info = await Info.findOne({ where: { element: 'shop'} })
            if (info.status === 'closed') return interaction.reply({ content: `Sorry, The Shop ${merchant} is currently closed.` })

            const binders = [...await Binder.findAll({ where: { playerId: seller.id }})].map((b) => b.cardCode)
            
            let sellersInvs = rarity === 'all' ? await ForgedInventory.findAll({
                where: {
                    playerId: seller.id,
                    quantity: {[Op.gt]: keep},
                    cardCode: {[Op.startsWith]: setCode}
                },
                order: [["cardCode", "ASC"]],
                include: ForgedPrint
            }) : await ForgedInventory.findAll({
                where: {
                    playerId: seller.id,
                    quantity: {[Op.gt]: keep},
                    cardCode: {[Op.startsWith]: setCode},
                    '$forgedPrint.rarity$': rarity
                },
                order: [["cardCode", "ASC"]],
                include: ForgedPrint
            })

            sellersInvs = sellersInvs.filter((i) => !binders.includes(i.cardCode))

            let totalPrice = 0
            const differences = []
            let totalCards = 0
            const cards = []

            for (let i = 0; i < sellersInvs.length; i++) {
                const sellersInv = sellersInvs[i]
                const difference = sellersInv.quantity - keep
                differences.push(difference)
                totalCards += difference
                const price = difference * Math.ceil(sellersInv.forgedPrint.marketPrice * 0.7)
                totalPrice += price
                cards.push(`${difference}x ${eval(sellersInv.forgedPrint.rarity)}${sellersInv.cardName}`)
            }
        
            const timestamp = new Date().getTime()

            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId(`Dump-${timestamp}-Yes`)
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId(`Dump-${timestamp}-No`)
                    .setLabel('No')
                    .setStyle(ButtonStyle.Primary)
                )

            await interaction.reply({ content: `Are you sure you want to sell the following ${totalCards} ${setCode}${eval(setCode)} cards to The Shop ${merchant} for ${totalPrice}${stardust}? ${lipton}`})
                    
            for (let i = 0; i < cards.length; i+=20) {
                interaction.channel.send({ content: cards.slice(i, i+20).join("\n")})
            }

            const message = await interaction.channel.send({ content: `Dump confirmed?`, components: [row] })

            const filter = i => i.customId.startsWith(`Dump-${timestamp}`) && i.user.id === interaction.user.id;

            try {
                const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                if (confirmation.customId.includes('Yes')) {
                    for (let i = 0; i < sellersInvs.length; i++) {
                        const sellersInv = sellersInvs[i]
                        const difference = differences[i]
                        const factor = sellersInv.forgedPrint.isFrozen ? 1 : 0.7
                        const price = difference * Math.ceil(sellersInv.forgedPrint.marketPrice * factor)
                        const print = sellersInv.forgedPrint
                        const buyersInv = await ForgedInventory.findOne({
                            where: {
                                playerId: merchbot.id,
                                forgedPrintId: print.id
                            }
                        })

                        if (buyersInv) {
                            buyersInv.quantity+=difference
                            await buyersInv.save()
                        } else {
                            await ForgedInventory.create({
                                cardName: print.cardName,
                                cardCode: print.cardCode,
                                cardId: print.cardId,
                                forgedPrintId: print.id,
                                quantity: difference,
                                playerName: merchbot.name,
                                playerId: merchbot.id
                            })
                        }
                        
                        sellersInv.quantity-=difference
                        await sellersInv.save()
                        merchbotWallet.stardust-=price
                        await merchbotWallet.save()
                        sellersWallet.stardust+=price
                        await sellersWallet.save()
    
                        const newMarketPrice = calculateNewMarketPrice(difference, price, print)
                        await print.update({ marketPrice: newMarketPrice })
                    }

                    return await message.edit({ content: `You sold ${totalCards} ${setCode}${eval(setCode)} cards to The Shop ${merchant} for ${totalPrice}${stardust}!`, components: [] })
                    // return interaction.editReply({ , components: [] });        
                } else {
                    await message.edit({ content: `Not a problem. Nothing was sold to The Shop ${merchant}.`, components: [] })
                }
            } catch (err) {
                console.log(err)
                await message.edit({ content: `Sorry, time's up. Nothing was sold to The Shop ${merchant}.`, components: [] });
            }                        
        } catch (err) {
            console.log(err)
        }
    }
}