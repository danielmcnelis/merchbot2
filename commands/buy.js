
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { ForgedInventory, ForgedPrint, Info, Player, Wallet } from '../database/index.js'
import { calculateNewMarketPrice, getSellerConfirmation, checkBinderForRemoval, checkWishlistForRemoval } from '../functions/transaction.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
const {com, rar, sup, ult, scr, stardust, merchant, fry} = emojis
import channels from '../static/channels.json' with { type: 'json' }
const { marketPlaceChannelId, botSpamChannelId } = channels

export default {
	data: new SlashCommandBuilder()
		.setName('buy')
		.setDescription(`Buy cards from The Shop or a player! 💸`)
        .addNumberOption(option =>
            option
                .setName('quantity')
                .setDescription('How many copies do you wish to buy?')
                .setRequired(true)
        )
        .addNumberOption(option =>
            option
                .setName('print')
                .setDescription('Which card do you wish to buy?')
                .setAutocomplete(true)
                .setRequired(true)
        )
        .addUserOption(option =>
            option
                .setName('seller')
                .setDescription('Tag the seller.')
                .setRequired(false)
        )
        .addNumberOption(option =>
            option
                .setName('price')
                .setDescription('Enter the price you agreed to pay.')
                .setRequired(false)
        )
    	.setContexts(InteractionContextType.Guild),
        async autocomplete(interaction) {
            try {
                const focusedValue = interaction.options.getFocused()

                const prints = await ForgedPrint.findAll({
                    where: {
                        [Op.or]: {
                            cardName: {[Op.iLike]: `%${focusedValue}%`},
                            cardCode: {[Op.iLike]: `%${focusedValue}%`}
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
            if (interaction.channel.id !== botSpamChannelId && interaction.channel.id !== marketPlaceChannelId) return interaction.reply({ content: `Command not valid outside of <#${marketPlaceChannelId}> or <#${botSpamChannelId}>.` })
            const quantity = interaction.options.getNumber('quantity')
            if (quantity < 1) return interaction.reply({ content: `You cannot buy less than 1 card.`})
            const printId = interaction.options.getNumber('print')
            const print = await ForgedPrint.findOne({ where: { id: printId }})
            const card = `${eval(print.rarity)}${print.cardCode} - ${print.cardName}`
            const buyerDiscordId = interaction.user.id
            const buyer = await Player.findByDiscordId(buyerDiscordId)
            const buyersWallet = await Wallet.findOne({ where: { playerId: buyer.id }})
            const merchbotDiscordId = '584215266586525696'

            const sellerDiscordId = interaction.options.getUser('seller')?.id || merchbotDiscordId
            const seller = await Player.findByDiscordId(sellerDiscordId)
            const sellersWallet = await Wallet.findOne({ where: { playerId: seller.id }})

            if (buyerDiscordId === sellerDiscordId) return interaction.reply({ content: `You cannot buy cards from yourself.`})
            if (!buyersWallet) return interaction.reply({ content: `You are not in the database. Type **/play** to begin the game.`})
            if (!sellersWallet) return interaction.reply({ content: `That user is not in the database.`})

            const shopSale = sellerDiscordId === merchbotDiscordId
            const info = await Info.findOne({ where: { element: 'shop'} })
            if (shopSale && info.status === 'closed') return interaction.reply({ content: `Sorry, The Shop ${merchant} is currently closed.` })
            const marketPrice = print.marketPrice
            const shopBuyingPrice = Math.floor(marketPrice * 0.7) > 0 ? Math.floor(marketPrice * 0.7) : 1			
            const shopSellingPrice = Math.floor(marketPrice * 1.1) > shopBuyingPrice ? Math.floor(marketPrice * 1.1) : shopBuyingPrice + 1
            const price = shopSale ? quantity * shopSellingPrice : interaction.options.getNumber('price')
            if (price > buyersWallet.stardust) return interaction.reply({ content: `Sorry, you only have ${buyersWallet.stardust}${stardust}.` })
            if (shopSale && interaction.options.getNumber('price') && interaction.options.getNumber('price') !== price) return interaction.reply({ content: `Please leave the "price" option blank when purchasing cards from The Shop. ${merchant}` })
            if (!shopSale && !price) return interaction.reply({ content: `Please specifiy the price.`})
            const shopBuybackPrice = Math.ceil(print.marketPrice * 0.7)
            if (price < 1) return interaction.reply({ content: `You cannot pay less than 1${stardust} for a card.` })
            if (!shopSale && price < (shopBuybackPrice * quantity)) return interaction.reply({ content: `You cannot buy a card for less ${stardust} than The Shop ${merchant} would pay for it.` })
            if (price > buyersWallet.stardust) return interaction.reply({ content: `Sorry, you only have ${buyersWallet.stardust}${stardust}.` })
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

            if ((buyersInv && (buyersInv.quantity + quantity > 3)) || quantity > 3 ) {
                return interaction.reply({ content: `You cannot acquire more than 3 copies of a card.`})
            }

            if (!sellersInv || sellersInv.quantity < quantity) return interaction.reply({ content: `Sorry, ${shopSale ? `The Shop ${merchant}` : seller.name} does not have ${quantity} ${quantity === 1 ? 'copy' : 'copies'} of ${card}.`})

            const timestamp = new Date().getTime()

            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId(`Buy-${timestamp}-Yes`)
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId(`Buy-${timestamp}-No`)
                    .setLabel('No')
                    .setStyle(ButtonStyle.Primary)
                )
            

            await interaction.reply({ content: `Are you sure you want to buy ${quantity} ${card} from ${shopSale ? `The Shop ${merchant}` : seller.name} for ${price}${stardust}? ${fry}`, components: [row] })

            const filter = i => i.customId.startsWith(`Buy-${timestamp}`) && i.user.id === interaction.user.id;

            try {
                const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                if (confirmation.customId.includes('Yes') && shopSale) {
                    if (buyersInv) {
                        buyersInv.quantity+=quantity
                        await buyersInv.save()
                    } else {
                        await ForgedInventory.create({
                            cardName: print.cardName,
                            cardCode: print.cardCode,
                            cardId: print.cardId,
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

                    await checkBinderForRemoval(seller.id, print.id, quantity)
                    await checkWishlistForRemoval(buyer.id, print.id, quantity)

                    const newMarketPrice = calculateNewMarketPrice(quantity, price, print)
                    await print.update({ marketPrice: newMarketPrice })

                    return interaction.editReply({ content: `You bought ${quantity} ${card} from The Shop ${merchant} for ${price}${stardust}!`, components: [] });        
                } else if (confirmation.customId.includes('Yes') && !shopSale) {
                    await interaction.editReply({ content: `Okay, waiting for ${seller.name}'s confirmation.`, components: [] });        
                    return getSellerConfirmation(interaction, buyer, seller, quantity, print, card, price, buyersInv, sellersInv, buyersWallet, sellersWallet)
                } else {
                    await interaction.editReply({ content: `Not a problem. Nothing was purchased from ${shopSale ? `The Shop ${merchant}` : seller.name}.`, components: [] })
                }
            } catch (err) {
                console.log(err)
                await interaction.editReply({ content: `Sorry, time's up. Nothing was purchased from ${shopSale ? `The Shop ${merchant}` : seller.name}.`, components: [] });
            }                        
        } catch (err) {
            console.log(err)
        }
	}
}