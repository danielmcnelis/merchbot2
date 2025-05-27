
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { isAdmin } from '../functions/utility.js'
import { Wallet } from '../database/index.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const {starchips, stardust} = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('grindall')
		.setDescription('Admin Only - Grind all starchips into stardust. 🙊'),
	async execute(interaction) {
        try {
            if (!isAdmin(interaction.member)) return interaction.reply({ content: `You do not have permission to do that.`})
                
            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId(`Grindall-Yes`)
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId(`Grindall-No`)
                    .setLabel('No')
                    .setStyle(ButtonStyle.Primary)
                )

            await interaction.reply({ content: `Are you sure you wish to grind every player's ${starchips} into ${stardust}?`, components: [row] })

            const filter = i => i.customId.startsWith('Grindall-') && i.user.id === interaction.user.id;

            const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 })
            if (confirmation.customId.includes('Yes')) {
                const allWallets = await Wallet.findAll()
                for (let i = 0; i < allWallets.length; i++) {
                    const wallet = allWallets[i]
                    wallet.stardust += wallet.starchips * 10
                    wallet.starchips = 0
                    await wallet.save()
                }
            
                return interaction.editReply({ content: `Every player's ${starchips}s have been ground up into ${stardust}!`, components: []})
            } else {
                await confirmation.update({ components: [] })
                await confirmation.editReply({ content: `Not a problem. No ${starchips} were ground into ${stardust}.`, components: [] })
            }
        } catch (err) {
            console.log(err)
            await interaction.editReply({ content: `Sorry, time's up. No ${starchips} were ground into ${stardust}.`, components: [] });
        }
	}
}