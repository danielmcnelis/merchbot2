
import { SlashCommandBuilder } from 'discord.js'
import { Binder, ForgedPrint, Wishlist, Player} from '../database/index.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
const {com, rar, sup, ult, scr} = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('search')
		.setDescription('Search binders and wishlists for a card! 🔍')
        .addNumberOption(option =>
            option
                .setName('print')
                .setDescription('Enter search query.')
                .setAutocomplete(true)
                .setRequired(false)
        ),
        async autocomplete(interaction) {
            try {
                const focusedValue = interaction.options.getFocused()

                const prints = await ForgedPrint.findAll({
                    where: {
                        [Op.or]: {
                            cardName: {[Op.iLike]: `${focusedValue}%`},
                            cardCode: {[Op.iLike]: `${focusedValue}%`}
                        }
                    },
                    limit: 5,
                    order: [["cardName", "ASC"], ["createdAt", "ASC"]]
                })

                await interaction.respond(
                    prints.map(print => ({ name: `${print.cardName} (${print.cardCode})`, value: print.id })),
                )
            } catch (err) {
                console.log(err)
            }
        },
	async execute(interaction) {
        try {        
            const printId = interaction.options.getNumber('print')
            const print = await ForgedPrint.findOne({ where: { id: printId }})
            const card = `${eval(print.rarity)}${print.cardCode} - ${print.cardName}`
        
            const allBinders = await Binder.findAll({ where: { forgedPrintId: printId } , include: Player })
            const allWishlists = await Wishlist.findAll({ where: { forgedPrintId: printId } , include: Player })
            
            const membersMap = await interaction.guild.members.fetch()
            const memberIds = [...membersMap.keys()]
            const activePlayersWithPrintInBinder = allBinders.filter((binder) => memberIds.includes(binder.player.discordId)).map((binder) => binder.playerName)
            const activePlayersWithPrintInWishlist = allWishlists.filter((wishlist) => memberIds.includes(wishlist.player.discordId)).map((wishlist) => wishlist.playerName)
        
            activePlayersWithPrintInBinder.sort()
            activePlayersWithPrintInWishlist.sort()
        
            return interaction.reply({ content: `Search results for ${card}:\n**Binders:**\n${activePlayersWithPrintInBinder.length ? activePlayersWithPrintInBinder.join('\n') : 'N/A'}\n\n**Wishlists:**\n${activePlayersWithPrintInWishlist.length ? activePlayersWithPrintInWishlist.join('\n') : 'N/A'}`})
        } catch (err) {
            console.log(err)
        }
	}
}