
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { ArenaProfile } from '../database/index.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
const { arena, cydra, dinosaur, fish, paleozoic, shaddoll, spirit } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('wins')
		.setDescription('Post Arena wins. 🥇')
    	.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
        try {
            const arenaProfiles = await ArenaProfile.findAll()
            let cydraWins = 0
            let dinosaurWins = 0
            let fishWins = 0
            let paleozoicWins = 0
            let shaddollWins = 0
            let spiritWins = 0

            for (let i = 0; i < arenaProfiles.length; i++) {
                const arenaProfile = arenaProfiles[i]
                cydraWins += arenaProfile.cydraWins
                dinosaurWins += arenaProfile.dinosaurWins
                fishWins += arenaProfile.fishWins
                paleozoicWins += arenaProfile.paleozoicWins
                shaddollWins += arenaProfile.shaddollWins
                spiritWins += arenaProfile.spiritWins
            }

            await interaction.reply({ content: 
                `${arena} __**Arena Wins**__ 🥇` +
                `\nCyber Dragon Tribe ${cydra} - ${cydraWins}W` +
                `\nDinosaur Tribe ${dinosaur} - ${dinosaurWins}W` +
                `\nFish Tribe ${fish} - ${fishWins}W` +
                `\nPaleozoic Tribe ${paleozoic} - ${paleozoicWins}W` +
                `\nShaddoll Tribe ${shaddoll} - ${shaddollWins}W` +
                `\nSpirit Tribe ${spirit} - ${spiritWins}W`
            })
        } catch (err) {
            console.log(err)
        }
	}
}