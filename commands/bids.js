
import { SlashCommandBuilder } from 'discord.js'
import { Bid, ForgedPrint, Player } from '../database/index.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const { stardust, com, rar, sup, ult, scr } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('bids')
		.setDescription('Check your current bids for the auction!'),
	async execute(interaction) {
        try {  
            if (interaction.guildId) return interaction.reply(`Try using **/bids** by DM'ing it to me.`)
            const discordId = interaction.user.id
            const player = await Player.findByDiscordId(discordId)
            const bids = await Bid.findAll({ where: { playerId: player.id }, include: ForgedPrint, order: [['amount', 'DESC']]})
            if (!bids.length) return interaction.reply({ content: `You do not have any bids currently placed.`})
            const bidsSummary = bids.map((b) => `- ${eval(b.forgedPrint.rarity)}${b.cardCode} ${b.cardName} - ${b.amount}${stardust}`)
            return interaction.reply({ content: `Your current bids are as followed:\n${bidsSummary.join('\n')}\n\nYou may cancel one of the above bids by using the **/bid** command`})
        } catch (err) {
            console.log(err)
        }
	}
}