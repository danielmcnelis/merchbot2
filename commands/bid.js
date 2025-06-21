
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { Auction, Bid, ForgedInventory, ForgedPrint, Info, Player, Wallet } from '../database/index.js'
import { Op } from 'sequelize'
// import { askForBidPlacement, askForBidCancellation, manageBidding} from '../functions/bids.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const { stardust, com, rar, sup, ult, scr, thinkygo, merchant } = emojis

// ASK FOR BID AMOUNT
const askForBidAmount = async (interaction, player, card, auction, wallet) => {
    try {
        const merchbotSalePrice = Math.ceil(auction.forgedPrint.marketPrice * 1.1)
        const filter = m => m.author.id === interaction.user.id
        const message = await interaction.user.send({ content: `${card} is sold for ${merchbotSalePrice}${stardust}. How much ${stardust} do you wish to bid?`}).catch((err) => console.log(err))
        if (!message || !message.channel) return false
        return await message.channel.awaitMessages({
            filter,
            max: 1,
            time: 5 * 30 * 1000
        }).then(async (collected) => {
            const response = collected.first().content
            const amount = parseInt(response)
            if (isNaN(amount)) return interaction.user.send({ content: `Error: Please repeat the **/bid** command and reply with a number.`})

            if (wallet.stardust < amount) { 
                return interaction.user.send({ content: `You cannot bid more ${stardust} than you have in your Wallet (${wallet.stardust}${stardust}).}`})
            } else if (amount < merchbotSalePrice) {
                return interaction.user.send({ content: `${card} is sold for ${merchbotSalePrice}${stardust} in The Shop, ${merchant} so you cannot bid less ${stardust} than that.`})
            } else {
                await Bid.create({
                    auctionId: auction.id,
                    cardName: auction.cardName,
                    cardCode: auction.cardCode,
                    forgedPrintId: auction.forgedPrintId,
                    playerId: player.id,
                    playerName: player.name,
                    amount: amount
                })
    
                return interaction.user.send({ content: `You placed a bid on ${card} for ${amount}${stardust}!`})
            }
        }).catch((err) => {
            console.log(err)
            return interaction.user.send({ content: `Sorry, time's up. Please try the **/bid** command again.`}).catch((err) => console.log(err))
        })
    } catch (err) {
        console.log(err)
        return interaction.user.send({ content: `Unknown error. Please try the **/bid** command again.`}).catch((err) => console.log(err))
    }
}

// ASK FOR BID CANCELLATION
const askForBidCancellation = async (interaction, card, bid) => {
    // try {
        // const filter = m => m.author.id === interaction.user.id
        // const message = await interaction.user.send({ content: `Are you sure you want to cancel your ${bid.amount}${stardust} on ${card}?`}).catch((err) => console.log(err))
        // if (!message || !message.channel) return false

        const timestamp = new Date().getTime()

        const row = new ActionRowBuilder()
            .addComponents(new ButtonBuilder()
                .setCustomId(`Bid-${timestamp}-Yes`)
                .setLabel('Yes')
                .setStyle(ButtonStyle.Primary)
            )

            .addComponents(new ButtonBuilder()
                .setCustomId(`Bid-${timestamp}-No`)
                .setLabel('No')
                .setStyle(ButtonStyle.Primary)
            )

        await interaction.user.send({ content: `Are you sure you want to cancel your ${bid.amount}${stardust} on ${card}?`, components: [row]})

        const filter = i => i.customId.startsWith(`Bid-${timestamp}`) && i.user.id === interaction.user.id;

        try {
            const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 })
            if (confirmation.customId.includes('Yes')) {
                await bid.destroy()
                return interaction.editReply({ content: `You cancelled your ${bid.amount}${stardust} bid on ${card}.`, components: [] });        
            } else {
                await confirmation.editReply({ content: `Not a problem. Your ${bid.amount}${stardust} bid on ${card} was not cancelled.`, components: [] })
            }
        } catch (err) {
            console.log(err)
            await interaction.editReply({ content: `Sorry, time's up. Your ${bid.amount}${stardust} bid on ${card} was not cancelled.`, components: [] });
        }     

        // return await message.channel.awaitMessages({
        //     filter,
        //     max: 1,
        //     time: 5 * 30 * 1000
        // }).then(async (collected) => {
        //     const response = collected.first().content.toLowerCase().includes('y')
        //     if (!isNaN(amount)) return message.channel.send({ content: `Error: Please repeat the **/bid** command and reply with "yes" or "no".`})
        //     if (bid) {
        //         const originalAmount = bid.amount
        //         await bid.update({
        //             cardName: auction.cardName,
        //             cardCode: auction.cardCode,
        //             forgedPrintId: auction.forgedPrintId,
        //             playerId: player.id,
        //             playerName: player.name,
        //             amount: amount
        //         })

        //         return message.channel.send({ content: `You changed your bid on ${card} from ${originalAmount}${stardust} to ${amount}${stardust}!`})
        //     } else {
        //         await Bid.create({
        //             cardName: auction.cardName,
        //             cardCode: auction.cardCode,
        //             forgedPrintId: auction.forgedPrintId,
        //             playerId: player.id,
        //             playerName: player.name,
        //             amount: amount
        //         })

        //         return message.channel.send({ content: `You placed a bid on ${card} for ${amount}${stardust}!`})
        //     }                
        // }).catch((err) => {
        //     console.log(err)
        //     user.send({ content: `Sorry, time's up. Please try again.`}).catch((err) => console.log(err))
        //     return undefined
        // })
    // } catch (err) {
    //     return console.log(err)
    // }
}

export default {
	data: new SlashCommandBuilder()
		.setName('bid')
		.setDescription('Bid for a card at auction! 🤑')
        .addNumberOption(option =>
            option
                .setName('auction')
                .setDescription('Enter auction query.')
                .setAutocomplete(true)
                .setRequired(true)
        ),
        async autocomplete(interaction) {
            try {
                const focusedValue = interaction.options.getFocused()

                const prints = await Auction.findAll({
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
            const info = await Info.findOne({ where: { element: 'shop' }})
            if (info.status !== 'closed') return interaction.reply({ content: `Bidding is only available while The Shop ${merchant} is closed. 🌙`})

            // const count = await Auction.count()
            // if (!count) return interaction.reply({ content: `Sorry, there are no singles up for auction tonight.`})

            if (interaction.guildId) return interaction.reply(`Try using **/bid** by DM'ing it to me.`)
            const auctionId = interaction.options.getNumber('auction')            
            const discordId = interaction.user.id
            const player = await Player.findByDiscordId(discordId)
            const wallet = await Wallet.findOne({ where: { playerId: player.id }})
            if (!wallet) return interaction.reply({ content: `You are not in the database. Type **/play** to begin the game.`})
            
            const auction = await Auction.findOne({ where: { id: auctionId }, include: ForgedPrint})
            const card = `${eval(auction.forgedPrint.rarity)}${auction.cardCode} - ${auction.cardName}`
            const bids = await Bid.findAll({ where: { playerId: player.id }, include: ForgedPrint,  order: [['amount', 'DESC']]})
            const existingBid = await Bid.findOne({ where: { playerId: player.id, auctionId: auctionId }})
            const bidsSummary = bids.map((b) => `- ${eval(b.forgedPrint.rarity)}${b.cardCode} - ${b.cardName} - ${b.amount}${stardust}`)

            if (existingBid) {
                // return console.log('existing bid')
                await interaction.reply({ content: `${thinkygo}`})
                return askForBidCancellation(interaction, card, existingBid)
                // return askForBidAmount(interaction, player, card, auction, bid)
            } else if (bids.length >= 3) {
                return interaction.reply({ content: `Sorry, you cannot place more than 3 bids. Your current bids are as followed:\n${bidsSummary.join('\n')}\n\nYou may cancel a bid by using the **/bid** command and choosing a print that has an existing bid.`})
            } else {
                const inv = await ForgedInventory.findOne({ where: { playerId: player.id, forgedPrintId: auction.forgedPrintId }})
                if (inv && inv.quantity >= 3) return interaction.reply({ content: `Sorry, you already have ${inv.quantity} copies of ${card}.`})
                await interaction.reply({ content: `${thinkygo}`})
                return askForBidAmount(interaction, player, card, auction, wallet)
            }

            // if (bids.length === 3) {
            // } else if (player.bids.length) {
            //     return manageBidding(interaction.message, player)
            // } else {
            //     return askForBidPlacement(interaction.message, player)
            // }
        } catch (err) {
            console.log(err)
        }
	}
}