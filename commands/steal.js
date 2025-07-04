
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { ForgedInventory, ForgedPrint, Player, Wallet } from '../database/index.js'
import { Op } from 'sequelize'
import { isMod } from '../functions/utility.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const {com, rar, sup, ult, scr, stardust, starchips, droplets, mushrooms, gems, bolts, roses, firecrackers, moais, orbs, shields, skulls, robbed} = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('steal')
		.setDescription('Admin Only - Take something away from a player. 🥷')
        .addNumberOption(option =>
            option
                .setName('quantity')
                .setDescription('How much do you wish to steal?')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('item')
                .setDescription('What do you wish to steal?')
				.setAutocomplete(true)
                .setRequired(true)
        )
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('Tag the player to steal from.')
                .setRequired(true)
        )
    	.setContexts(InteractionContextType.Guild),
        async autocomplete(interaction) {
            try {
                const focusedValue = interaction.options.getFocused()

                const prints = [...await ForgedPrint.findAll({
                    where: {
                        [Op.or]: {
                            cardName: {[Op.iLike]: `%${focusedValue}%`},
                            cardCode: {[Op.iLike]: `%${focusedValue}%`}
                        }
                    },
                    limit: 5,
                    order: [["cardName", "ASC"], ["createdAt", "ASC"]]
                })].map((p) => `${p.cardName} (${p.cardCode})`)

                if ('starchips'.includes(focusedValue.toLowerCase())) {
                    prints.push('StarChips')
                }

                if ('stardust'.includes(focusedValue.toLowerCase())) {
                    prints.push('StarDust')
                }

                if ('droplets'.includes(focusedValue.toLowerCase())) {
                    prints.push('Droplets')
                }

                if ('mushrooms'.includes(focusedValue.toLowerCase())) {
                    prints.push('Mushrooms')
                }

                if ('gems'.includes(focusedValue.toLowerCase())) {
                    prints.push('Gems')
                }

                if ('bolts'.includes(focusedValue.toLowerCase())) {
                    prints.push('Bolts')
                }

                if ('roses'.includes(focusedValue.toLowerCase())) {
                    prints.push('Roses')
                }

                if ('firecrackers'.includes(focusedValue.toLowerCase())) {
                    prints.push('Firecrackers')
                }

                if ('moais'.includes(focusedValue.toLowerCase())) {
                    prints.push('Moais')
                }

                if ('orbs'.includes(focusedValue.toLowerCase())) {
                    prints.push('Orbs')
                }

                if ('shields'.includes(focusedValue.toLowerCase())) {
                    prints.push('Shields')
                }

                if ('skulls'.includes(focusedValue.toLowerCase())) {
                    prints.push('Skulls')
                }

                await interaction.respond(
                    prints.map(print => ({ name: print, value: print })),
                )
            } catch (err) {
                console.log(err)
            }
        },
	async execute(interaction) {
        try {      
            if (!isMod(interaction.member)) return interaction.reply({ content: "You do not have permission to do that."})
            const quantity = interaction.options.getNumber('quantity')
            if (quantity < 1) return interaction.reply({ content: `You cannot steal ${robbed} less than 1 item.`})
            const item = interaction.options.getString('item')
            const cardCode = item !== 'StarDust' && item !== 'StarChips' ? item.slice(-8, -1) : null
            const print = cardCode ? await ForgedPrint.findOne({ where: { cardCode }}) : null
            const card = print ? `${eval(print.rarity)}${print.cardCode} - ${print.cardName}` : null
            const currency = !print ? item.toLowerCase() : null
            const loot = card || eval(currency)
            const user = interaction.options.getUser('player')
            const discordId = user.id
            const player = await Player.findByDiscordId(discordId)
            const wallet = await Wallet.findOne({ where: { playerId: player.id }})
            const inv = await ForgedInventory.findOne({ where: { cardCode: cardCode, playerId: player.id }})

            if ((inv && inv.quantity < quantity) || (currency && wallet[currency].quantity < quantity)) {
                return await interaction.reply({content: `Sorry, ${player.name} does not have ${quantity}${loot}.`})
            }

            const timestamp = new Date().getTime()
            
            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId(`Steal-${timestamp}-Yes`)
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId(`Steal-${timestamp}-No`)
                    .setLabel('No')
                    .setStyle(ButtonStyle.Primary)
                )

            await interaction.reply({ content: `Are you sure you want to steal ${quantity}${loot} from ${player.name}? ${robbed}`, components: [row] })

            const filter = i => i.customId.startsWith(`Steal-${timestamp}`) && i.user.id === interaction.user.id;

            try {
                const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                if (confirmation.customId.includes('Yes')) {
                    if (inv) {
                        console.log('quantity', quantity)
                        console.log('inv.quantity', inv.quantity)
                        inv.quantity-=quantity
                        console.log('inv.quantity', inv.quantity)
                        await inv.save()
                        console.log('inv.quantity', inv.quantity)
                    } else if (currency) {
                        wallet[currency]-=quantity
                        await wallet.save()
                    } else {
                        return interaction.editReply({ content: `Error: unable to find inventory or currency for ${player.name}.`})
                    }

                    return interaction.editReply({ content: `Yikes! You stole ${quantity}${loot} from ${player.name}. ${robbed}`, components: [] });        
                } else {
                    await interaction.editReply({ content: `Not a problem. No ${loot} was stolen from ${player.name}.`, components: [] })
                }
            } catch (err) {
                console.log(err)
                await interaction.editReply({ content: `Sorry, time's up. No ${loot} was stolen from ${player.name}.`, components: [] });
            }
        } catch (err) {
            console.log(err)
        }
	}
}