
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { Daily, ForgedInventory, ForgedPrint, Player, Wallet } from '../database/index.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
const {starchips, com, rar, sup, ult, scr} = emojis
import {updateBinder} from '../functions/binder.js'
import { isSameDay } from '../functions/utility.js'

export default {
	data: new SlashCommandBuilder()
		.setName('alchemy')
		.setDescription('Covert cards into starchips! 🧙')
        .addNumberOption(option =>
            option
                .setName('print')
                .setDescription('Enter search query.')
                .setAutocomplete(true)
                .setRequired(true)
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
            const player = await Player.findByDiscordId(interaction.user.id)
            const wallet = await Wallet.findOne({ where: { playerId: player.id }})
            const daily = await Daily.findOne({ where: { playerId: player.id }})

            if (!wallet || !daily) return interaction.reply({ content: `You are not in the database. Type **/play** to begin the game.`})

            const alchemyUses = player.forgedSubscriberTier === 'Supporter' ? 2 :
                player.forgedSubscriberTier === 'Patron' ? 3 :
                player.forgedSubscriberTier === 'Benefactor' ? 4 :
                1

            console.log('player.forgedSubscriberTier', player.forgedSubscriberTier)
            console.log('alchemyUses', alchemyUses)
            
            const date = new Date()
            const hoursLeftInDay = date.getMinutes() === 0 ? 24 - date.getHours() : 23 - date.getHours()
            const minsLeftInHour = date.getMinutes() === 0 ? 0 : 60 - date.getMinutes()

            if (daily.lastAlchemy && !isSameDay(daily.lastAlchemy, date)) {
                daily.alchemy1 = false
                daily.alchemy2 = false
                daily.alchemy3 = false
                daily.alchemy4 = false
                await daily.save()
            }

            if (
                (daily.alchemy1 && alchemyUses === 1) ||
                (daily.alchemy2 && alchemyUses === 2) ||
                (daily.alchemy3 && alchemyUses === 3) ||
                (daily.alchemy4 && alchemyUses === 4)
            ) return interaction.reply({ content: `You exhausted your alchemic powers for the day. Try again in ${hoursLeftInDay} ${hoursLeftInDay === 1 ? 'hour' : 'hours'} and ${minsLeftInHour} ${minsLeftInHour === 1 ? 'minute' : 'minutes'}.`})

            const printId = interaction.options.getNumber('print')
            const print = await ForgedPrint.findOne({ where: { id: printId }})
            const card = `${eval(print.rarity)}${print.cardCode} - ${print.cardName}`
            const value = print.rarity === 'com' ? 1 : print.rarity === 'rar' ? 2 : print.rarity === 'sup' ? 4 : print.rarity === 'ult' ? 8 : 16 

            const inv = await ForgedInventory.findOne({ 
                where: { 
                    forgedPrintId: print.id,
                    playerId: player.id,
                    quantity: { [Op.gt]: 0 }
                }
            })

            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId(`Alchemy-Yes`)
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId(`Alchemy-No`)
                    .setLabel('No')
                    .setStyle(ButtonStyle.Primary)
                )

            await interaction.reply({ content: `Are you sure you want to transmute ${card} into ${value}${starchips}?`, components: [row] })

            const filter = i => i.customId.startsWith('Alchemy-') && i.user.id === interaction.user.id;

            try {
                const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                if (confirmation.customId.includes('Yes')) {
                    inv.quantity--
                    await inv.save()

                    await updateBinder(player.id, print.id)

                    wallet.starchips += value
                    await wallet.save()
                
                    if (!daily.alchemy1) {
                        daily.alchemy1 = true
                    } else if (!daily.alchemy2) {
                        daily.alchemy2 = true
                    } else if (!daily.alchemy3) {
                        daily.alchemy3 = true
                    } else {
                        daily.alchemy4 = true
                    }

                    daily.lastAlchemy = date
                    await daily.save()

                    return interaction.editReply({ content: `You transmuted ${card} into ${value}${starchips}!`, components: []})
                } else {
                    await confirmation.update({ components: [] })
                    await confirmation.editReply({ content: `Not a problem. ${card} was not transmuted into ${starchips}.`, components: [] })
                }
            } catch (err) {
                console.log(err)
                await interaction.editReply({ content: `Sorry, time's up. ${card} was not transmuted into ${starchips}.`, components: [] });
            }                
        } catch (err) {
            console.log(err)
        }
    }
}