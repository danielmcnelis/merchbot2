
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, SlashCommandBuilder } from 'discord.js'
import {Player, Wallet} from '../database/index.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const {starchips, stardust} = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('grind')
		.setDescription('Grind StarChips into StarDust! ✨')
		.addNumberOption(option =>
            option
                .setName('starchips')
                .setDescription('How many StarChips do you wish to grind?')
                .setRequired(true)
        )
    	.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
        try {
            const x = interaction.options.getNumber('starchips')
            if (!x || x < 1) return interaction.reply({ content: `Please provide the number of ${starchips} that you wish to grind into ${stardust}.`})
            // if (x % 1 !== 0) return message.channel.send({ content: `You cannot grind part of a ${starchips}.`})

            const player = await Player.findByDiscordId(interaction.user.id)
            const wallet = await Wallet.findOne({ where: { playerId: player.id } })
            if (!wallet) return interaction.reply({ content: `You are not in the database. Type **/play** to begin the game.`})
            if (x > wallet.starchips) return interaction.reply({ content: `You only have ${wallet.starchips}${starchips}.`})

            const timestamp = new Date().getTime()

            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId(`Grind-${timestamp}-Yes`)
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId(`Grind-${timestamp}-No`)
                    .setLabel('No')
                    .setStyle(ButtonStyle.Primary)
                )

            await interaction.reply({ content: `Are you sure you wish to grind ${x}${starchips} into ${x * 10}${stardust}?`, components: [row] })

            const filter = i => i.customId.startsWith(`Grind-${timestamp}`) && i.user.id === interaction.user.id;

            try {
                const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                if (confirmation.customId.includes('Yes')) {
                    wallet.starchips -= x
                    wallet.stardust += x * 10
                    await wallet.save()
        
                    return interaction.editReply({ content: `You ground ${x}${starchips} into ${x * 10}${stardust}!`, components: [] })
                } else {
                    await interaction.editReply({ content: `Not a problem. No ${starchips} were ground into ${stardust}.`, components: [] })
                }
            } catch (err) {
                console.log(err)
                await interaction.editReply({ content: `Sorry, time's up. No ${starchips} were ground into ${stardust}.`, components: [] });
            }
            
        } catch (err) {
            console.log(err)
        }
	}
}