
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { Daily, Player, Wallet, ForgedInventory, ForgedPrint, ForgedSet} from '../database/index.js'
import emojis from '../static/emojis.json' with { type: 'json' }
import { drawCardImage, getRandomElement, isSameDay } from '../functions/utility.js'
const { AOD, FON, stardust, cavebob, dimmadome, blue, scheming, koolaid, com, rar, sup, ult, scr } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('wager')
		.setDescription('Wager StarDust on a random card! 🎰')
        .addNumberOption(option =>
            option
                .setName('stardust')
                .setDescription('How much StarDust do you wish to wager?')
                .setRequired(true)
        )
    	.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
        try {
            const x = interaction.options.getNumber('stardust')
            if (!x || x < 1) return interaction.reply({ content: `Please provide the amount of ${stardust} that you wish to wager.`})
            if (x > 1000) return interaction.reply({ content: `You cannot wager more than 1000${stardust}.`})

            const player = await Player.findByDiscordId(interaction.user.id)
            const wallet = await Wallet.findOne({ where: { playerId: player.id } })
            const daily = await Daily.findOne({ where: { playerId: player.id } })
            if (!wallet || !daily) return interaction.reply({ content: `You are not in the database. Type **/play** to begin the game.`})
            if (x > wallet.stardust) return interaction.reply({ content: `You only have ${wallet.stardust}${stardust}.`})

            const date = new Date()
            const hoursLeftInDay = date.getMinutes() === 0 ? 24 - date.getHours() : 23 - date.getHours()
            const minsLeftInHour = date.getMinutes() === 0 ? 0 : 60 - date.getMinutes()

            if (daily.lastWager && isSameDay(daily.lastWager, date)) return interaction.reply({ content: `You already used **/wager** today. Try again in ${hoursLeftInDay} ${hoursLeftInDay === 1 ? 'hour' : 'hours'} and ${minsLeftInHour} ${minsLeftInHour === 1 ? 'minute' : 'minutes'}.`})

            const sets = await ForgedSet.findAll({ 
                where: { 
                    type: 'core',
                    forSale: true
                },
                order: [['createdAt', 'DESC']]
            })

            const set = sets[0]
            if (!set) return interaction.reply({ content: `No core set found.`})

            const timestamp = new Date().getTime()
            
            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId(`Wager-${timestamp}-Yes`)
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId(`Wager-${timestamp}-No`)
                    .setLabel('No')
                    .setStyle(ButtonStyle.Primary)
                )

            await interaction.reply({ content: `Are you sure you want to wager ${x}${stardust} on a random ${set.code} ${eval(set.emoji)} card?`, components: [row] })
            const filter = i => i.customId.startsWith(`Wager-${timestamp}`) && i.user.id === interaction.user.id;

            try {
                const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                if (confirmation.customId.includes('Yes')) {
                    wallet.stardust -= x
                    await wallet.save()

                    let best = 1
                    const matrix = new Array(3600)
                        matrix.fill(1, 0, 3463)
                        matrix.fill(2, 3463, 3559)
                        matrix.fill(3, 3559, 3591)
                        matrix.fill(4, 3591, 3599)
                        matrix.fill(5, 3599, 3600)
    
                    for (let i = 0; i < x; i++) {
                        const sample = getRandomElement(matrix)
                        if (sample > best) best = sample
                    }
    
                    const rarity = best === 5 ? "scr" :
                        best === 4 ? "ult" :
                        best === 3 ? "sup" :
                        best === 2 ? "rar" :
                        "com"
    
                    const prints = await ForgedPrint.findAll({ 
                        where: {
                            forgedSetId: set.id,
                            rarity: rarity
                        },
                        order: [['cardSlot', 'ASC']]
                    })
    
                    const print = getRandomElement(prints)	
                
                    const inv = await ForgedInventory.findOne({ where: { 
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
    
                    daily.lastWager = date
                    await daily.save()
    
                    const attachment = await drawCardImage(print.cardName)
                    const enthusiasm = rarity === "com" ? `Ho-Hum.` : rarity === "rar" ? `Not bad.` : rarity === 'sup' ? `Cool beans!` : rarity === 'ult' ? `Now *that's* sick!` : `Holy $#%t balls!`
                    const emoji = rarity === "com" ? cavebob : rarity === "rar" ? dimmadome : rarity === 'sup' ? blue : rarity === 'ult' ? scheming : koolaid
                
                    interaction.editReply({ content: `1... 2...`, components: []})
                    return setTimeout(() => interaction.channel.send({ content: `${enthusiasm} ${player.name} won ${eval(print.rarity)}${print.cardCode} - ${print.cardName} off their wager! ${emoji}`, files: [attachment] }), 2000)            
                } else {
                    await interaction.editReply({ content: `Not a problem. No ${stardust} was wagered.`, components: [] })
                }
            } catch (err) {
                console.log(err)
                await interaction.editReply({ content: `Sorry, time's up. No ${stardust} was wagered.`, components: [] });
            }
        } catch (err) {
            console.log(err)
        }
	}
}