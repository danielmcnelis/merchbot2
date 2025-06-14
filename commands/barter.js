
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { ForgedInventory, ForgedPrint, Info, Player, Wallet } from '../database/index.js'
import { calculateNewMarketPrice, getSellerConfirmation, checkBinderForRemoval, checkWishlistForRemoval } from '../functions/transaction.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
import arenas from '../static/arenas.json' with { type: 'json' }
const { vouchers } = arenas
const {com, rar, sup, ult, scr, stardust, merchant, blue, mushrooms, gems, bolts, orbs, shields, skulls} = emojis
import channels from '../static/channels.json' with { type: 'json' }
const { marketPlaceChannelId, botSpamChannelId } = channels

export default {
	data: new SlashCommandBuilder()
        .setName('barter')
        .setDescription(`Exchange vouchers for an Arena Prize Card. 👒`)
        .addNumberOption(option =>
            option
                .setName('card')
                .setDescription('Which Arena Prize Card do you wish to receive?')
                .setAutocomplete(true)
                .setRequired(true)
        )
    	.setContexts(InteractionContextType.Guild),
        async autocomplete(interaction) {
            try {
                const focusedValue = interaction.options.getFocused()

                const prints = await ForgedPrint.findAll({
                    where: {
                        cardCode: {[Op.startsWith]: "APC"},
                        [Op.or]: {
                            cardName: {[Op.iLike]: `${focusedValue}%`},
                            cardCode: {[Op.iLike]: `${focusedValue}%`}
                        }
                    },
                    limit: 6,
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
            const printId = interaction.options.getNumber('card')
            console.log(printId)
            const print = await ForgedPrint.findOne({ where: { id: printId }})
            const card = `${eval(print.rarity)}${print.cardCode} - ${print.cardName}`
            const voucher = print.cardCode === 'APC-004' ? 'mushrooms' :
                    print.cardCode === 'APC-002' ? 'gems' :
                    print.cardCode === 'APC-003' ? 'bolts' :
                    print.cardCode === 'APC-001' ? 'orbs' :
                    print.cardCode === 'APC-005' ? 'shields' :
                    print.cardCode === 'APC-006' ? 'skulls' :
                    null 

            if (!voucher) return interaction.reply({ content: `Error: No voucher found for ${card}.` })

            const buyerDiscordId = interaction.user.id
            const buyer = await Player.findByDiscordId(buyerDiscordId)
            const buyersWallet = await Wallet.findOne({ where: { playerId: buyer.id }})
            const merchbotDiscordId = '584215266586525696'
            const sellerDiscordId = merchbotDiscordId
            const seller = await Player.findByDiscordId(sellerDiscordId)
            const sellersWallet = await Wallet.findOne({ where: { playerId: seller.id }})

            if (!buyersWallet) return interaction.reply({ content: `You are not in the database. Type **/play** to begin the game.`})
            if (!sellersWallet) return interaction.reply({ content: `That user is not in the database.`})

            const info = await Info.findOne({ where: { element: 'shop'} })
            // if (info.status === 'closed') return interaction.reply({ content: `Sorry, The Shop ${merchant} is currently closed.` })
            if (10 > buyersWallet[voucher]) return interaction.reply({ content: `Sorry, you only have ${buyersWallet[voucher]} ${eval(voucher)}.` })
            
            const buyersInv = await ForgedInventory.findOne({
                where: {
                    forgedPrintId: print.id,
                    playerId: buyer.id
                }
            })

            const timestamp = new Date().getTime()

            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId(`Barter-${timestamp}-Yes`)
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId(`Barter-${timestamp}-No`)
                    .setLabel('No')
                    .setStyle(ButtonStyle.Secondary)
                )
            

            await interaction.reply({ content: `Are you sure you want to exchange 10 ${eval(voucher)} for ${card}? ${blue}`, components: [row] })

            const filter = i => i.customId.startsWith(`Barter-${timestamp}`) && i.user.id === interaction.user.id;
            
            let confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 }).catch(async (err) => {
                console.log(err)
                await confirmation.update({ components: [] })
                await interaction.editReply({ content: `Sorry, time's up. Nothing was exchanged with The Shop. ${merchant}`, components: [] });
            })

            try {
                if (confirmation.customId.includes('Yes')) {
                    await confirmation.update({ components: [] })
                    if (buyersInv) {
                        buyersInv.quantity+=1
                        await buyersInv.save()
                    } else {
                        await ForgedInventory.create({
                            cardName: print.cardName,
                            cardCode: print.cardCode,
                            forgedPrintId: print.id,
                            quantity: 1,
                            playerName: buyer.name,
                            playerId: buyer.id
                        })
                    }
                    
                    buyersWallet[voucher]-=10
                    await buyersWallet.save()
                    sellersWallet[voucher]+=10
                    await sellersWallet.save()

                    await checkWishlistForRemoval(buyer.id, print.id, 1)

                    return interaction.editReply({ content: `You received 1 ${card} from The Shop ${merchant} in exchange for 10 ${eval(voucher)}!`, components: [] });        
                } else {
                    await confirmation.update({ components: [] })
                    await confirmation.editReply({ content: `Not a problem. Nothing was exchanged with The Shop. ${merchant}`, components: [] })
                }
            } catch (err) {
                console.log(err)
            }                        
        } catch (err) {
            console.log(err)
        }
	}
}