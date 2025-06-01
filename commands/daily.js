
import { AttachmentBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { Daily, ForgedInventory, ForgedPrint, ForgedSet, Player } from '../database/index.js'
import { drawCardImage, getRandomElement, isSameDay} from '../functions/utility.js'
import { awardBox, awardPacks } from '../functions/packs.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const { cavebob, dimmadome, blue, scheming, koolaid, com, rar, sup, ult, scr } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('daily')
		.setDescription('Receive your daily bonus! 🎁')
    	.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
        try {             
            const player = await Player.findByDiscordId(interaction.user.id)
            const daily = await Daily.findOne({ where: { playerId: player.id } })
            if (!daily) return interaction.reply({ content: `You are not in the database. Type **/play** to begin the game.`})

            const date = new Date()
            const hoursLeftInDay = date.getMinutes() === 0 ? 24 - date.getHours() : 23 - date.getHours()
            const minsLeftInHour = date.getMinutes() === 0 ? 0 : 60 - date.getMinutes()
            
            if (daily.lastDaily && isSameDay(daily.lastDaily, date)) return interaction.reply({ content: `You already used **/daily** today. Try again in ${hoursLeftInDay} ${hoursLeftInDay === 1 ? 'hour' : 'hours'} and ${minsLeftInHour} ${minsLeftInHour === 1 ? 'minute' : 'minutes'}.`})

            const daysPassed = daily.lastDaily ? Math.round( ( date.setHours(0, 0, 0, 0) - daily.lastDaily.setHours(0, 0, 0, 0) ) / (1000*60*60*24) ) : 1

            const sets = await ForgedSet.findAll({ 
                where: { 
                    type: 'core',
                    forSale: true
                },
                order: [['createdAt', 'DESC']]
            })

            const set = sets[0]
            if (!set) return interaction.reply({ content: `No core set found.`})

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
            
            const odds = []
            for (let i = 0; i < set.commonsPerBox; i++) odds.push("commons")
            for (let i = 0; i < set.raresPerBox; i++) odds.push("rares")
            for (let i = 0; i < set.supersPerBox; i++) odds.push("supers")
            for (let i = 0; i < set.ultrasPerBox; i++) odds.push("ultras")
            for (let i = 0; i < set.secretsPerBox; i++) odds.push("secrets")

            const luck = getRandomElement(odds)
            const yourCard = getRandomElement(eval(luck))
            const enthusiasm = luck === "commons" ? `Ho-Hum.` : luck === "rares" ? `Not bad.` : luck === 'supers' ? `Cool beans!` : luck === 'ultras' ? `Now *that's* sick!` : `Holy $#%t balls!`
            const emoji = luck === "commons" ? cavebob : luck === "rares" ? dimmadome : luck === 'supers' ? blue : luck === 'ultras' ? scheming : koolaid

            const print = await ForgedPrint.findOne({ where: {
                cardCode: yourCard
            }})

            const inv = await ForgedInventory.findOne({ where: { 
                forgedPrintId: print.id,
                playerId: player.id
            }})

            if (inv) {
                inv.quantity++
                await inv.save()
            } else {
                await ForgedInventory.create({ 
                    cardCode: print.cardCode,
                    cardName: print.cardName,
                    quantity: 1,
                    forgedPrintId: print.id,
                    playerName: player.name,
                    playerId: player.id
                })
            }

            if ((daily.cobbleProgress + daysPassed) >= 7) {
                daily.cobbleProgress = 0

                const num = player.forgedSubscriberTier === 'Supporter' ? 6 :
                    player.forgedSubscriberTier === 'Patron' ? 12 :
                    player.forgedSubscriberTier === 'Benefactor' ? 24 :
                    1

                const packImage = new AttachmentBuilder(`./public/7outof7.png`, { name: `pack.png` })
                // let num = masterComplete ? 5 : eliteComplete ? 4 : hardComplete ? 3 : mediumComplete ? 2 : 1
                if (num) setTimeout(async () => {
                    if (num === 24) {
                        awardBox(interaction.channel, interaction.member, set)
                    } else {
                        awardPacks(interaction.channel, interaction.member, set, num)
                    }
                    interaction.channel.send({ content: `Oh look, ${daily.playerName}, you cobbled together a pack!`, files: [packImage]})
                }, 4000)
            } else {
                daily.cobbleProgress += daysPassed
                // const image = daily.cobbleProgress === 1 ? packImage1 :
                //     daily.cobbleProgress === 2 ? packImage2 :
                //     daily.cobbleProgress === 3 ? packImage3 :
                //     daily.cobbleProgress === 4 ? packImage4 :
                //     daily.cobbleProgress === 5 ? packImage5 :
                //     packImage6

                const packImage = new AttachmentBuilder(`./public/${daily.cobbleProgress}outof7.png`, { name: `pack.png` })
                setTimeout(() => {
                    interaction.channel.send({ content: `Hey, ${daily.playerName}, keep cobblin', buddy.`, files: [packImage]})
                }, 4000)
            }

            daily.lastDaily = date
            await daily.save()

            const attachment = await drawCardImage(print.cardName)
            interaction.reply({ content: `1... 2...`})
            return setTimeout(() => interaction.channel.send({ content: `${enthusiasm} ${daily.playerName} pulled ${eval(print.rarity)}${print.cardCode} - ${print.cardName} from the grab bag! ${emoji}`, files: [attachment] }), 2000)
        } catch (err) {
            console.log(err)
        }
	}
}