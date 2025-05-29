
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { ForgedInventory, ForgedPrint, Player, Proposal, Wallet } from '../database/index.js'
import { getTraderBConfirmation } from '../functions/transaction.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
const {com, rar, sup, ult, scr, stardust, merchant, scheming} = emojis
import channels from '../static/channels.json' with { type: 'json' }
const { marketPlaceChannelId, botSpamChannelId } = channels

export default {
    data: new SlashCommandBuilder()
        .setName('trade')
        .setDescription('Trade cards with another player! 🧑‍🌾')
        .addUserOption(option =>
            option
                .setName('recipient')
                .setDescription('Tag a player to trade with.')
                .setRequired(true)
        )
        .addNumberOption(option =>
            option
                .setName('quantity-a')
                .setDescription('How many copies of Card A?')
                .setRequired(true)
        )
        .addNumberOption(option =>
            option
                .setName('print-a')
                .setDescription('What is Card A?')
                .setAutocomplete(true)
                .setRequired(true)
        )
        .addNumberOption(option =>
            option
                .setName('quantity-b')
                .setDescription('How many copies of Card B?')
                .setRequired(false)
        )
        .addNumberOption(option =>
            option
                .setName('print-b')
                .setDescription('What is Card B?')
                .setAutocomplete(true)
                .setRequired(false)
        )
        .addNumberOption(option =>
            option
                .setName('quantity-c')
                .setDescription('How many copies of Card C?')
                .setRequired(false)
        )
        .addNumberOption(option =>
            option
                .setName('print-c')
                .setDescription('What is Card C?')
                .setAutocomplete(true)
                .setRequired(false)
        )
        .addNumberOption(option =>
            option
                .setName('stardust')
                .setDescription('How much StarDust if any?')
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
            // PRINT A
            if (interaction.channel.id !== botSpamChannelId && interaction.channel.id !== marketPlaceChannelId) return interaction.reply({ content: `Command not valid outside of <#${marketPlaceChannelId}> or <#${botSpamChannelId}>.` })
            const quantityA = interaction.options.getNumber('quantity-a')
            if (quantityA < 1) return interaction.reply({ content: `You cannot trade less than 1 card.`})
            const printAId = interaction.options.getNumber('print-a')
            const printA = await ForgedPrint.findOne({ where: { id: printAId }})
            const cardA = `${eval(printA.rarity)}${printA.cardCode} - ${printA.cardName}`
            
            // PRINT B
            const quantityB = interaction.options.getNumber('quantity-b')
            const printBId = interaction.options.getNumber('print-b')
            if ((!quantityB && printBId) || (quantityB && !printBId)) return interaction.reply({ content: `Trade form incomplete. Please try again.` })
            if (quantityB && quantityB < 1) return interaction.reply({ content: `You cannot trade less than 1 card.`})
            const printB = printBId ? await ForgedPrint.findOne({ where: { id: printBId }}) : null
            const cardB = printB ? `${eval(printB.rarity)}${printB.cardCode} - ${printB.cardName}` : null

            // PRINT C
            const quantityC = interaction.options.getNumber('quantity-c')
            const printCId = interaction.options.getNumber('print-c')
            if ((!quantityC && printCId) || (quantityC && !printCId)) return interaction.reply({ content: `Trade form incomplete. Please try again.` })
            if (quantityC && quantityC < 1) return interaction.reply({ content: `You cannot trade less than 1 card.`})
            const printC = printCId ? await ForgedPrint.findOne({ where: { id: printCId }}) : null
            const cardC = printC ? `${eval(printC.rarity)}${printC.cardCode} - ${printC.cardName}` : null

            // STARDUST
            const stardustQuantity = interaction.options.getNumber('stardust')
            if (stardustQuantity && stardustQuantity < 1) return interaction.reply({ content: `You cannot trade less than 1${stardust}.`})

            // TRADER A
            const traderADiscordId = interaction.user.id
            const traderA = await Player.findByDiscordId(traderADiscordId)
            const traderAsWallet = await Wallet.findOne({ where: { playerId: traderA.id }})
            if (!traderAsWallet) return interaction.reply({ content: `You are not in the database. Type **/play** to begin the game.`})
            if (stardustQuantity && traderAsWallet.stardust < stardustQuantity) return interaction.reply({ content: `You only have ${traderAsWallet.stardust}${stardust}.`})

            // TRADER B
            const traderBUser = interaction.options.getUser('recipient')
            if (traderBUser?.bot) return await interaction.reply({ content: `You cannot trade cards with bots.`})
            const traderBDiscordId = traderBUser.id
            const traderB = await Player.findByDiscordId(traderBDiscordId)
            const traderBsWallet = await Wallet.findOne({ where: { playerId: traderB.id }})
            if (!traderBsWallet) return interaction.reply({ content: `That user is not in the database.`})

            if (traderADiscordId === traderBDiscordId) return interaction.reply({ content: `You cannot trade cards to yourself.`})

            // PRINT A INVENTORY CHECKS
            const traderAPrintAInv = await ForgedInventory.findOne({
                where: {
                    forgedPrintId: printA.id,
                    playerId: traderA.id
                }
            })

            if (!traderAPrintAInv || traderAPrintAInv.quantity < quantityA) {
                return interaction.reply({ content: `You do not have ${quantityA} ${cardA}.` })
            }

            const traderBPrintAInv = await ForgedInventory.findOne({
                where: {
                    forgedPrintId: printA.id,
                    playerId: traderB.id
                }
            })

            if (traderBPrintAInv && (traderBPrintAInv.quantity + quantityA) > 3) { 
                return interaction.reply({ content: `${traderB.name} cannot acquire more than 3 copies of ${cardA}.` })
            }

            // PRINT B INVENTORY CHECKS
            let traderAPrintBInv
            let traderBPrintBInv
            if (printB) {
                traderAPrintBInv = await ForgedInventory.findOne({
                    where: {
                        forgedPrintId: printB.id,
                        playerId: traderA.id
                    }
                })
    
                if (!traderAPrintBInv || traderAPrintBInv.quantity < quantityB) {
                    return interaction.reply({ content: `You do not have ${quantityB} ${cardB}.` })
                }

                traderBPrintBInv = await ForgedInventory.findOne({
                    where: {
                        forgedPrintId: printB.id,
                        playerId: traderB.id
                    }
                })

                if (traderBPrintBInv && (traderBPrintBInv.quantity + quantityA) > 3) { 
                    return interaction.reply({ content: `${traderB.name} cannot acquire more than 3 copies of ${cardB}.` })
                }
            }

            let traderAPrintCInv
            let traderBPrintCInv
            if (printC) {
                traderAPrintCInv = await ForgedInventory.findOne({
                    where: {
                        forgedPrintId: printC.id,
                        playerId: traderA.id
                    }
                })
    
                if (!traderAPrintCInv || traderAPrintCInv.quantity < quantityC) {
                    return interaction.reply({ content: `You do not have ${quantityC} ${cardC}.` })
                }

                traderBPrintCInv = await ForgedInventory.findOne({
                    where: {
                        forgedPrintId: printB.id,
                        playerId: traderB.id
                    }
                })

                if (traderBPrintCInv && (traderBPrintCInv.quantity + quantityA) > 3) { 
                    return interaction.reply({ content: `${traderB.name} cannot acquire more than 3 copies of ${cardC}.` })
                }
            }

            // const traderAPackage = [{type: 'card', printId: printAId, quantity: quantityA}]
            const traderAPackageSummary = [`${quantityA} ${cardA}`]

            if (printB) {
                // traderAPackage.push({type: 'card', printId: printBId, quantity: quantityB})
                traderAPackageSummary.push(`${quantityB} ${cardB}`)
            }

            if (printC) {
                // traderAPackage.push({type: 'card', printId: printCId, quantity: quantityC})
                traderAPackageSummary.push(`${quantityC} ${cardC}`)
            }

            if (stardustQuantity) {
                // traderAPackage.push({type: 'stardust', printId: null, quantity: stardustQuantity})
                traderAPackageSummary.push(`${stardustQuantity}${stardust}`)
            }

            const existingProposal = await Proposal.findOne({
                where: {
                    senderId: traderB.id,
                    recipientId: traderA.id
                },
                order: [['createdAt', 'DESC']]
            })

            if (existingProposal) {
                const existingProposalPrintA = await ForgedPrint.findOne({ where: { id: existingProposal.forgedPrintAId }})
                const existingProposalCardA = `${eval(existingProposalPrintA.rarity)}${existingProposalPrintA.cardCode} - ${existingProposalPrintA.cardName}`

                const existingProposalPrintB = await ForgedPrint.findOne({ where: { id: existingProposal.forgedPrintBId }})
                const existingProposalCardB = existingProposalPrintB ? `${eval(existingProposalPrintB.rarity)}${existingProposalPrintB.cardCode} - ${existingProposalPrintB.cardName}` : null

                const existingProposalPrintC = await ForgedPrint.findOne({ where: { id: existingProposal.forgedPrintCId }})
                const existingProposalCardC = existingProposalPrintC ? `${eval(existingProposalPrintC.rarity)}${existingProposalPrintC.cardCode} - ${existingProposalPrintC.cardName}` : null

                // EXISTING PROPOSAL PRINT A INVENTORY CHECKS
                const existingProposalTraderBPrintAInv = await ForgedInventory.findOne({
                    where: {
                        forgedPrintId: existingProposal.forgedPrintAId,
                        playerId: traderB.id
                    }
                })

                if (!existingProposalTraderBPrintAInv || existingProposalTraderBPrintAInv.quantity < existingProposal.quantityA) {
                    await interaction.reply({ content: `Error: ${traderB} does not have ${existingProposal.quantityA} ${existingProposalCardA} in accordance with their existing trade proposal with you. Destroying existing proposal.` })
                    return await existingProposal.destroy()
                }

                const existingProposalTraderAPrintAInv = await ForgedInventory.findOne({
                    where: {
                        forgedPrintId: existingProposal.forgedPrintAId,
                        playerId: traderA.id
                    }
                })

                if (existingProposalTraderAPrintAInv && (existingProposalTraderAPrintAInv.quantity + existingProposal.quantityA) > 3) { 
                    await interaction.reply({ content: `Error: You cannot acquire more than 3 copies of ${existingProposalCardA} from your existing trade proposal with ${traderB.name}. Destroying existing proposal.` })
                    return await existingProposal.destroy()
                }

                if (existingProposal.forgedPrintBId) {
                    // EXISTING PROPOSAL PRINT B INVENTORY CHECKS
                    const existingProposalTraderBPrintBInv = await ForgedInventory.findOne({
                        where: {
                            forgedPrintId: existingProposal.forgedPrintBId,
                            playerId: traderB.id
                        }
                    })

                    if (!existingProposalTraderBPrintBInv || existingProposalTraderBPrintBInv.quantity < existingProposal.quantityB) {
                        await interaction.reply({ content: `Error: ${traderB} does not have ${existingProposal.quantityB} ${existingProposalCardB} in accordance with their existing trade proposal with you. Destroying existing proposal.` })
                        return await existingProposal.destroy()
                    }

                    const existingProposalTraderAPrintBInv = await ForgedInventory.findOne({
                        where: {
                            forgedPrintId: existingProposal.forgedPrintBId,
                            playerId: traderA.id
                        }
                    })

                    if (existingProposalTraderAPrintBInv && (existingProposalTraderAPrintBInv.quantity + existingProposal.quantityB) > 3) { 
                        await interaction.reply({ content: `Error: You cannot acquire more than 3 copies of ${existingProposalCardB} from your existing trade proposal with ${traderB.name}. Destroying existing proposal.` })
                        return await existingProposal.destroy()
                    }
                }

                
                if (existingProposal.forgedPrintCId) {
                    // EXISTING PROPOSAL PRINT C INVENTORY CHECKS
                    const existingProposalTraderBPrintCInv = await ForgedInventory.findOne({
                        where: {
                            forgedPrintId: existingProposal.forgedPrintCId,
                            playerId: traderB.id
                        }
                    })

                    if (!existingProposalTraderBPrintCInv || existingProposalTraderBPrintCInv.quantity < existingProposal.quantityC) {
                        await interaction.reply({ content: `Error: ${traderB} does not have ${existingProposal.quantityC} ${existingProposalCardC} in accordance with their existing trade proposal with you. Destroying existing proposal.` })
                        return await existingProposal.destroy()
                    }

                    const existingProposalTraderAPrintCInv = await ForgedInventory.findOne({
                        where: {
                            forgedPrintId: existingProposal.forgedPrintCId,
                            playerId: traderA.id
                        }
                    })

                    if (existingProposalTraderAPrintCInv && (existingProposalTraderAPrintCInv.quantity + existingProposal.quantityC) > 3) { 
                        await interaction.reply({ content: `Error: You cannot acquire more than 3 copies of ${existingProposalCardC} from your existing trade proposal with ${traderB.name}. Destroying existing proposal.` })
                        return await existingProposal.destroy()
                    }
                }

                if (existingProposal.stardustQuantity && traderBsWallet.stardust < existingProposal.stardustQuantity) {
                    await interaction.reply({ content: `Error: ${traderB.name} does not have enough ${stardust} in accordance with their existing trade proposal with you. Destroying existing proposal.` })
                    return await existingProposal.destroy()
                }

                const traderBPackageSummary = [`${existingProposal.quantityA} ${existingProposalCardA}`]
                
                if (existingProposalPrintB) {
                    traderBPackageSummary.push(`${existingProposal.quantityB} ${existingProposalCardB}`)
                }

                if (existingProposalPrintC) {
                    traderBPackageSummary.push(`${existingProposal.quantityC} ${existingProposalCardC}`)
                }

                if (existingProposal.stardustQuantity) {
                    traderBPackageSummary.push(`${existingProposal.stardustQuantity}${stardust}`)
                }
                    
                const row = new ActionRowBuilder()
                    .addComponents(new ButtonBuilder()
                        .setCustomId(`Review-Trade-1of2-Yes`)
                        .setLabel('Yes')
                        .setStyle(ButtonStyle.Primary)
                    )

                    .addComponents(new ButtonBuilder()
                        .setCustomId(`Review-Trade-1of2-No`)
                        .setLabel('No')
                        .setStyle(ButtonStyle.Primary)
                    )

                
                await interaction.reply({ content: `There is an existing trade proposal from ${traderB.name}. Please review both sides of the trade proposal with ${traderB.name} and then confirm "Yes" or "No" that you wish to trade. ${scheming}\nYou will send:\n${traderAPackageSummary.join('\n')}\n\nYou will receive:\n${traderBPackageSummary.join('\n')}`, components: [row] })

                const filter = i => i.customId.startsWith('Review-Trade-1of2-') && i.user.id === interaction.user.id;
    
                try {
                    const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                    if (confirmation.customId.includes('Yes')) {
                        const yourProposal = await Proposal.create({
                            senderName: traderA.name,
                            senderId: traderA.id,
                            recipientName: traderB.name,
                            recipientId: traderB.id,
                            forgedPrintAId: printAId,
                            quantityA: quantityA,
                            forgedPrintBId: printBId,
                            quantityB: quantityB,
                            forgedPrintCId: printCId,
                            quantityC: quantityC,
                            stardustQuantity: stardustQuantity
                        })

                        await interaction.editReply({ content: `Okay, waiting for ${traderB.name}'s trade confirmation.`, components: [] });        
                        return getTraderBConfirmation(interaction, yourProposal, existingProposal, traderA, traderB, traderAPackageSummary, traderBPackageSummary)
                    } else {
                        await existingProposal.destroy()
                        await confirmation.update({ components: [] })
                        await confirmation.editReply({ content: `Not a problem. The existing trading proposal from ${traderB.name} was destroyed and nothing was traded.`, components: [] })
                    }
                } catch (err) {
                    console.log(err)
                    await interaction.editReply({ content: `Sorry, time's up. Nothing was traded to ${traderB.name}.`, components: [] });
                }   
            } else {
                const row = new ActionRowBuilder()
                    .addComponents(new ButtonBuilder()
                        .setCustomId(`Propose-Trade-Yes`)
                        .setLabel('Yes')
                        .setStyle(ButtonStyle.Primary)
                    )

                    .addComponents(new ButtonBuilder()
                        .setCustomId(`Propose-Trade-No`)
                        .setLabel('No')
                        .setStyle(ButtonStyle.Primary)
                    )

                await interaction.reply({ content: `Are you sure you want to trade the following to ${traderB.name}? ${scheming}\n${traderAPackageSummary.join('\n')}`, components: [row] })

                const filter = i => i.customId.startsWith('Propose-Trade-') && i.user.id === interaction.user.id;
    
                try {
                    const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                    if (confirmation.customId.includes('Yes')) {
                        await Proposal.create({
                            senderName: traderA.name,
                            senderId: traderA.id,
                            recipientName: traderB.name,
                            recipientId: traderB.id,
                            forgedPrintAId: printAId,
                            quantityA: quantityA,
                            forgedPrintBId: printBId,
                            quantityB: quantityB,
                            forgedPrintCId: printCId,
                            quantityC: quantityC,
                            stardustQuantity: stardustQuantity
                        })

                        await interaction.editReply({ content: `Okay, waiting for ${traderB.name}'s offer. `, components: [] })
                        return await interaction.channel.send(`<@${traderB.discordId}>, ${traderA.name} is offering you the following items listed below. Please use the **/trade** command to submit your side of the trade.\n${traderAPackageSummary.join('\n')}`)
                    } else {
                        await confirmation.update({ components: [] })
                        await confirmation.editReply({ content: `Not a problem. Nothing was traded to ${traderA.name}.`, components: [] })
                    }
                } catch (err) {
                    console.log(err)
                    await interaction.editReply({ content: `Sorry, time's up. Nothing was traded to ${traderA.name}.`, components: [] });
                }   
            }
        } catch (err) {
            console.log(err)
        }
    }
}