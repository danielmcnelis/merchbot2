
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { ForgedInventory, ForgedPrint, Info, Player, Wallet } from '../database/index.js'
import { calculateNewMarketPrice, getBuyerConfirmation } from '../functions/transaction.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
const {com, rar, sup, ult, scr, stardust, merchant, scheming} = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('sell')
		.setDescription(`Sell cards to The Shop or a player! 💰`)
        .addNumberOption(option =>
            option
                .setName('quantity')
                .setDescription('How many copies do you wish to sell?')
                .setRequired(true)
        )
        .addNumberOption(option =>
            option
                .setName('print')
                .setDescription('Which card do you wish to sell?')
                .setAutocomplete(true)
                .setRequired(true)
        )
        .addUserOption(option =>
            option
                .setName('buyer')
                .setDescription('Tag the buyer.')
                .setRequired(false)
        )
        .addNumberOption(option =>
            option
                .setName('price')
                .setDescription('Enter the price you agreed to pay.')
                .setRequired(false)
        ),
        async autocomplete(interaction) {
            try {
                const focusedValue = interaction.options.getFocused()

                const prints = await ForgedPrint.findAll({
                    where: {
                        [Op.or]: {
                            cardName: {[Op.iLike]: `${focusedValue}%`},
                            cardCode: {[Op.iLike]: `${focusedValue}%`}
                        }
                    },
                    limit: 5,
                    order: [["cardName", "ASC"], ["createdAt", "ASC"]]
                })

                await interaction.respond(
                    prints.map(print => ({ name: `${print.cardName} (${print.cardCode})`, value: print.id })),
                )
            } catch (err) {
                console.log(err)
            }
        },
	async execute(interaction) {
        try {
            const quantity = interaction.options.getNumber('quantity')
            if (quantity < 1) return interaction.reply({ content: `You cannot sell less than 1 card.`})
            const printId = interaction.options.getNumber('print')
            const print = await ForgedPrint.findOne({ where: { id: printId }})
            const card = `${eval(print.rarity)}${print.cardCode} - ${print.cardName}`
            const sellerDiscordId = interaction.user.id
            const seller = await Player.findByDiscordId(sellerDiscordId)
            const sellersWallet = await Wallet.findOne({ where: { playerId: seller.id }})
            const merchbotDiscordId = '584215266586525696'
            const buyerDiscordId = interaction.options.getUser('buyer')?.id || merchbotDiscordId
            const buyer = await Player.findByDiscordId(buyerDiscordId)
            const buyersWallet = await Wallet.findOne({ where: { playerId: buyer.id }})

            if (sellerDiscordId === buyerDiscordId) return interaction.reply({ content: `You cannot sell cards to yourself.`})
            if (!sellersWallet) return interaction.reply({ content: `You are not in the database. Type **/play** to begin the game.`})
            if (!buyersWallet) return interaction.reply({ content: `That user is not in the database.`})

            const shopSale = buyerDiscordId === merchbotDiscordId
            const info = await Info.findOne({ where: { element: 'shop'} })
            if (shopSale && info.status === 'closed') return interaction.reply({ content: `Sorry, The Shop ${merchant} is currently closed.` })
            const price = shopSale ? Math.ceil(print.marketPrice * 0.7) : interaction.options.getNumber('price')
            if (shopSale && interaction.options.getNumber('price') && interaction.options.getNumber('price') !== price) return interaction.reply({ content: `Please leave the "price" option blank when selling cards to The Shop. ${merchant}` })
            if (!shopSale && !price) return interaction.reply({ content: `Please specifiy the price.`})
            const shopBuybackPrice = Math.ceil(print.marketPrice * 0.7)
            if (price < 1) return interaction.reply({ content: `You cannot sell a card for less than 1${stardust}.` })
            if (!shopSale && price < shopBuybackPrice) return interaction.reply({ content: `You cannot sell a card for less ${stardust} than The Shop ${merchant} would pay for it.` })
            if (price > buyersWallet.stardust) return interaction.reply({ content: `Sorry, you ${buyer.name} only has ${buyersWallet.stardust}${stardust}.` })
            
            const sellersInv = await ForgedInventory.findOne({
                where: {
                    forgedPrintId: print.id,
                    playerId: seller.id
                }
            })

            const buyersInv = await ForgedInventory.findOne({
                where: {
                    forgedPrintId: print.id,
                    playerId: buyer.id
                }
            })

            if (!shopSale && ((buyersInv && (buyersInv.quantity + quantity > 3)) || quantity > 3 )) {
                return interaction.reply({ content: `${buyer.name} cannot acquire more than 3 copies of a card.`})
            } 

            if (!sellersInv || sellersInv.quantity < quantity) return interaction.reply({ content: `Sorry, ${shopSale ? `The Shop ${merchant}` : buyer.name} does not have ${quantity} ${quantity === 1 ? 'copy' : 'copies'} of ${card}.`})

            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId(`Sell-Yes`)
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId(`Sell-No`)
                    .setLabel('No')
                    .setStyle(ButtonStyle.Primary)
                )

            await interaction.reply({ content: `Are you sure you want to sell ${quantity} ${card} to ${shopSale ? `The Shop ${merchant}` : buyer.name} for ${price}${stardust}? ${scheming}`, components: [row] })

            const filter = i => i.customId.startsWith('Sell-') && i.user.id === interaction.user.id;

            try {
                const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                if (confirmation.customId.includes('Yes') && shopSale) {
                    await confirmation.update({ components: [] })
                    if (buyersInv) {
                        buyersInv.quantity+=quantity
                        await buyersInv.save()
                    } else {
                        await ForgedInventory.create({
                            cardName: print.cardName,
                            cardCode: print.cardCode,
                            forgedPrintId: print.id,
                            quantity: quantity,
                            playerName: buyer.name,
                            playerId: buyer.id
                        })
                    }
                    
                    sellersInv.quantity-=quantity
                    await sellersInv.save()
                    buyersWallet.stardust-=price
                    await buyersWallet.save()
                    sellersWallet.stardust+=price
                    await sellersWallet.save()

                    const newMarketPrice = calculateNewMarketPrice(quantity, price, print)
                    await print.update({ marketPrice: newMarketPrice })

                    return interaction.editReply({ content: `You sold ${quantity} ${card} to The Shop ${merchant} for ${price}${stardust}!`, components: [] });        
                } else if (confirmation.customId.includes('Yes') && !shopSale) {
                    await interaction.editReply({ content: `Okay, waiting for ${buyer.name}'s confirmation.`, components: [] });        
                    return getBuyerConfirmation(interaction, buyer, seller, quantity, print, card, price, buyersInv, sellersInv, buyersWallet, sellersWallet)
                } else {
                    await confirmation.update({ components: [] })
                    await confirmation.editReply({ content: `Not a problem. Nothing was sold to ${shopSale ? `The Shop ${merchant}` : seller.name}.`, components: [] })
                }
            } catch (err) {
                console.log(err)
                await interaction.editReply({ content: `Sorry, time's up. Nothing was sold to ${shopSale ? `The Shop ${merchant}` : seller.name}.`, components: [] });
            }                        
        } catch (err) {
            console.log(err)
        }
	}
}