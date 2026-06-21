
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { ArenaProfile } from '../database/index.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
const { arena, blackwing, dragon, frog, hero, insect, plant } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('wins')
		.setDescription('Post Arena wins. 🥇')
    	.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
        try {
            const arenaProfiles = await ArenaProfile.findAll()
            let blackwingWins = 0
            let dragonWins = 0
            let frogWins = 0
            let heroWins = 0
            let insectWins = 0
            let plantWins = 0

            for (let i = 0; i < arenaProfiles.length; i++) {
                const arenaProfile = arenaProfiles[i]
                blackwingWins += arenaProfile.blackwingWins
                dragonWins += arenaProfile.dragonWins
                frogWins += arenaProfile.frogWins
                heroWins += arenaProfile.heroWins
                insectWins += arenaProfile.insectWins
                plantWins += arenaProfile.plantWins
            }

            await interaction.reply({ content: 
                `${arena} __**Arena Wins**__ 🥇` +
                `\nBlackwing Tribe ${blackwing} - ${blackwingWins}W` +
                `\nDragon Tribe ${dragon} - ${dragonWins}W` +
                `\nFrog Tribe ${frog} - ${frogWins}W` +
                `\nHERO Tribe ${hero} - ${heroWins}W` +
                `\nInsect Tribe ${insect} - ${insectWins}W` +
                `\nPlant Tribe ${plant} - ${plantWins}W`
            })
        } catch (err) {
            console.log(err)
        }
	}
}