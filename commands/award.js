
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { ForgedInventory, ForgedPrint, ForgedSet, Player, Wallet } from '../database/index.js'
import { Op } from 'sequelize'
import { isMod } from '../functions/utility.js'
import { awardBox, awardPacks } from '../functions/packs.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const {AOD, FON, com, rar, sup, ult, scr, stardust, starchips, droplets, mushrooms, gems, bolts, roses, firecrackers, moais, orbs, shields, skulls, koolaid} = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('award')
		.setDescription('Admin Only - Award something to a player. 🏅')
        .addNumberOption(option =>
            option
                .setName('quantity')
                .setDescription('How much do you wish to award?')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('item')
                .setDescription('What do you wish to award?')
				.setAutocomplete(true)
                .setRequired(true)
        )
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('Tag the player to award.')
                .setRequired(true)
        )
    	.setContexts(InteractionContextType.Guild),
        async autocomplete(interaction) {
            try {
                const focusedValue = interaction.options.getFocused()

                const prints = [...await ForgedPrint.findAll({
                    where: {
                        [Op.or]: {
                            cardName: {[Op.iLike]: `${focusedValue}%`},
                            cardCode: {[Op.iLike]: `${focusedValue}%`}
                        }
                    },
                    limit: 5,
                    order: [["cardName", "ASC"], ["createdAt", "ASC"]]
                })].map((p) => `${p.cardName} (${p.cardCode})`)

                const packs = [...await ForgedSet.findAll({
                    where: {
                        forSale: true
                    },
                    order: [["createdAt", "DESC"]]
                })].map((s) => `Pack(s) of ${s.name}`)

                // const boxes = [...await ForgedSet.findAll({
                //     where: {
                //         forSale: true
                //     },
                //     order: [['createdAt', 'DESC']]
                // })].map((s) => `Box(es) of ${s.name}`)

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
                
                if ('pack(s) of '.includes(focusedValue.toLowerCase())) {
                    prints.push(...packs)
                }

                // if ('box of '.includes(focusedValue.toLowerCase())) {
                //     prints.push(...boxes)
                // }


                await interaction.respond(
                    prints.map(print => ({ name: print, value: print })),
                )
            } catch (err) {
                console.log(err)
            }
        },
	async execute(interaction) {
        try {      
            await interaction.deferReply()
            if (!isMod(interaction.member)) return await interaction.editReply({ content: "You do not have permission to do that."})
            const quantity = interaction.options.getNumber('quantity')
            if (quantity < 1) return await interaction.editReply({ content: `You cannot award less than 1 item.`})
            const item = interaction.options.getString('item')
            if (item.includes('Pack(s) of ') && quantity > 24) return await interaction.editReply({ content: `You cannot award more than 24 packs at a time.`}) 
            const cardCode = item.includes('(') ? item.slice(-8, -1) : null
            const print = cardCode ? await ForgedPrint.findOne({ where: { cardCode }}) : null
            const card = print ? `${eval(print.rarity)}${print.cardCode} - ${print.cardName}` : null
            const currency = item === 'StarDust' || item === 'StarChips'  || item === 'Droplets'  || item === 'Mushrooms'
                || item === 'Gems'  || item === 'Bolts'  || item === 'Roses'  || item === 'Firecrackers' 
                || item === 'Moais'  || item === 'Orbs'  || item === 'Shields'  || item === 'Skulls' ? 
                item.toLowerCase() : null
            const set = await ForgedSet.findOne({ where: { name: item.slice(11) }})
            const loot = card ? card :
                currency ? eval(currency) :
                set ? `${item}${eval(set.code)}` :
                ''

            const award = item.includes('Pack(s) of ') && quantity === 24 ? `1 Box of ${set.name} ${eval(set.code)}` : `${quantity} ${loot}`

            const user = interaction.options.getUser('player')
            const discordId = user.id
            if (interaction.user.id === discordId) return await interaction.editReply({ content: `You cannot award ${koolaid} things to yourself.`})
            const player = await Player.findByDiscordId(discordId)
            const member = interaction.guild.members.cache.get(discordId)
            const wallet = await Wallet.findOne({ where: { playerId: player.id }})
            const inv = await ForgedInventory.findOne({ where: { cardCode: cardCode, playerId: player.id }})

            const timestamp = new Date().getTime()

            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId(`Award-${timestamp}-Yes`)
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId(`Award-${timestamp}-No`)
                    .setLabel('No')
                    .setStyle(ButtonStyle.Primary)
                )

            await interaction.editReply({ content: `Are you sure you want to award ${award} to ${player.name}? ${koolaid}`, components: [row] })

            const filter = i => i.customId.startsWith(`Award-${timestamp}`) && i.user.id === interaction.user.id;

            try {
                const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                if (confirmation.customId.includes('Yes')) {
                    await confirmation.update({ components: [] })
                    if (card && inv) {
                        inv.quantity+=quantity
                        await inv.save()
                    } else if (card && !inv) {
                        await ForgedInventory.create({
                            cardName: print.cardName,
                            cardCode: cardCode,
                            cardId: print.cardId,
                            forgedPrintId: print.id,
                            quantity: quantity,
                            playerName: player.name,
                            playerId: player.id
                        })
                    } else if (currency) {
                        wallet[currency]+=quantity
                        await wallet.save()
                    } else if (item.includes('Pack(s) of ')) {
                        if (quantity === 24) {
                            awardBox(interaction.channel, member, set)
                        } else {
                            awardPacks(interaction.channel, member, set, quantity)
                        }
                    } else {
                        return await interaction.editReply({ content: `Error: unable to find inventory or currency for ${player.name}.`})
                    }

                    return interaction.editReply({ content: `You awarded ${award} to ${player.name}. ${koolaid}`, components: [] });        
                } else {
                    await confirmation.update({ components: [] })
                    return await confirmation.editReply({ content: `Not a problem. ${award} ${quantity === 1 || award.includes('Box of') ? 'was' : 'were'} not awarded to ${player.name}.`, components: [] })
                }
            } catch (err) {
                console.log(err)
                return await interaction.editReply({ content: `Sorry, time's up. ${award} ${quantity === 1 || award.includes('Box of') ? 'was' : 'were'} not awarded to ${player.name}.`, components: [] });
            }
        } catch (err) {
            console.log(err)
        }
	}
}