
import { Daily, Info, ForgedSet, Wallet } from '../database/index.js'
import { SlashCommandBuilder } from 'discord.js'
import { createPlayer, isProgrammer } from '../functions/utility.js'
// import { AOD } from '../static/emojis.json' with { type: 'json' }

export default {
	data: new SlashCommandBuilder()
		.setName('update')
		.setDescription('Admin Only - Update the game! 💾'),
	async execute(interaction) {
        if (!isProgrammer(interaction.member)) return await interaction.editReply({ content: `You do not have permission to do that.`})
        
        try {
            const merchbot = interaction.guild.members.cache.get('584215266586525696')
            console.log('merchbot', merchbot)
            if ((await Wallet.count({ where: { playerName: 'MerchBot' } }))) {
               await interaction.reply({ content: `The Shop has already been initialized.` })
            } else {
                await Info.create({
                    element: "shop",
                    status: "open"
                })

                // const player = await createPlayer(merchbot)
                // if (!player) return interaction.reply('Unable to create MerchBot player.')
                await Wallet.create({ playerId: player.id, playerName: player.name })
                await Daily.create({ playerId: player.id, playerName: player.name })
                await interaction.reply({ content: `You initialized The Shop!`})
            }
        } catch (err) {
            console.log(err)
            await interaction.reply({ content: `Error: Unable to create The Shop.`})
        }

        try {
            const AOD = {
                code: "AOD",
                name: "Ascent of Dragons",
                type: "core",
                emoji: "AOD",
                altEmoji: "AOD",
                size: 200,
                commons: 96,
                rares: 40,
                supers: 36,
                ultras: 20,
                secrets: 8,
                specials: 0,
                specForSale: false,
                unitPrice: 15,
                unitSales: 0,
                cardsPerPack: 9,
                boxPrice: 300,
                packsPerBox: 24,
                specPrice: 40,
                packsPerSpec: 3,
                commonsPerPack: 7,
                raresPerPack: 1,
                commonsPerBox: 168,
                raresPerBox: 24,
                supersPerBox: 18,
                ultrasPerBox: 5,
                secretsPerBox: 1,
                specsPerSpec: 2
            }
        
            await ForgedSet.create(AOD)
            return await interaction.channel.send({ content: `Created a new set, Ascent of Dragons (AOD).`})
        } catch (err) {
            console.log(err)
            return await interaction.channel.send({ content: `Ascent of Dragons (AOD) has already been created.`})
        }
	}
}