
import { SlashCommandBuilder } from 'discord.js'
import emojis from '../static/emojis.json' with { type: 'json' }
import { Card, Status} from '../database/index.js'
const {FiC} = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('banlist')
		.setDescription('View the banlist! 🚫'),
	async execute(interaction) {
        try {       
            const banlist = 'June 2025'
            const forbidden = [...await Status.findAll({  
                where: { 
                    banlist, restriction: 'forbidden', category: 'Forged' 
                }, 
                include: Card,
                order: [[Card, 'sortPriority', 'ASC'], ['cardName', 'ASC']]
            })].map((s) => s.cardName)

            const limited = [...await Status.findAll({  
                where: {  
                    banlist, restriction: 'limited', category: 'Forged' 
                }, include: Card ,
                order: [[Card, 'sortPriority', 'ASC'], ['cardName', 'ASC']]
            })].map((s) => s.cardName)

            const semiLimited = [...await Status.findAll({  
                where: {  
                    banlist, restriction: 'semi-limited', category: 'Forged' 
                }, include: Card,
                order: [[Card, 'sortPriority', 'ASC'], ['cardName', 'ASC']]
            })].map((s) => s.cardName)

            await interaction.user.send({ content: `**~ ${FiC} - FORBIDDEN & LIMITED LIST ${FiC} ~**` +
                `\n\n**The following cards are forbidden:**` + 
                `\n${forbidden.length ? forbidden.join('\n') : 'N/A'}` + 
                `\n\n**The following cards are limited:**` + 
                `\n${limited.length ? limited.join('\n') : 'N/A'}` +
                `\n\n**The following cards are semi-limited:**` + 
                `\n${semiLimited.length ? semiLimited.join('\n') : 'N/A'}`
            })

            return interaction.reply({ content: `I messaged you the Forbidden & Limited list. ${FiC}`})
        } catch (err) {
            console.log(err)
        }
	}
}