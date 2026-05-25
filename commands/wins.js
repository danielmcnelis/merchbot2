
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { ArenaProfile } from '../database/index.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
const { arena, destiny, flip, machine, monarch, reptile, spellcaster } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('wins')
		.setDescription('Post Arena wins. 🥇')
    	.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
        try {
            const arenaProfiles = await ArenaProfile.findAll()
            let destinyWins = 0
            let flipWins = 0
            let machineWins = 0
            let monarchWins = 0
            let reptileWins = 0
            let spellcasterWins = 0

            for (let i = 0; i < arenaProfiles.length; i++) {
                const arenaProfile = arenaProfiles[i]
                destinyWins += arenaProfile.destinyWins
                flipWins += arenaProfile.flipWins
                machineWins += arenaProfile.machineWins
                monarchWins += arenaProfile.monarchWins
                reptileWins += arenaProfile.reptileWins
                spellcasterWins += arenaProfile.spellcasterWins
            }

            await interaction.reply({ content: 
                `${arena} __**Arena Wins**__ 🥇` +
                `\nDestiny Tribe ${destiny} - ${destinyWins}W` +
                `\nFlip Tribe ${flip} - ${flipWins}W` +
                `\nMachine Tribe ${machine} - ${machineWins}W` +
                `\nMonarch Tribe ${monarch} - ${monarchWins}W` +
                `\nReptile Tribe ${reptile} - ${reptileWins}W` +
                `\nSpellcaster Tribe ${spellcaster} - ${spellcasterWins}W`
            })
        } catch (err) {
            console.log(err)
        }
	}
}