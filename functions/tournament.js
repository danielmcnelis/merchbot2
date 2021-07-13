
const { registrationChannelId } = require('../static/channels.json')
const { tourRole } = require('../static/roles.json')
const { approve, FiC } = require('../static/emojis.json')
const { Arena, Binder, Card, Daily, Diary, Draft, Entry, Gauntlet, Info, Inventory, Knowledge, Match, Player, Print, Profile, Set, Tournament, Trade, Trivia, Wallet, Wishlist } = require('../db')
const { client, challongeClient } = require('../static/clients.js')
const { saveYDK, saveAllYDK } = require('./decks.js')
const { capitalize } = require('./utility.js')
const types = require('../static/types.json')


//ASK FOR DB USERNAME
const askForDBUsername = async (member, player, error = false, attempt = 1) => {
    const filter = m => m.author.id === member.user.id
    const prompt = error ? `I think you're getting ahead of yourself. First, I need your DuelingBook username.`
    : `Hi! This appears to be your first tournament in our system. Can you please provide your DuelingBook username?`
	const msg = await member.user.send(prompt)

    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 30000
    }).then(async (collected) => {
        const dbName = collected.first().content
        if (dbName.includes("duelingbook.com/deck") || dbName.includes("imgur.com")) {
            if (attempt >= 3) {
                member.user.send(`Sorry, time's up. Goodbye.`)
                return false
            } else {
                return askForDBUsername(member, player, true, attempt++)
            }
        } else {
            await player.update({
                duelingBook: dbName
            })
            member.user.send(`Thanks! I saved your DuelingBook username as: ${dbName}. If that's wrong, go back to the Discord server and type **!db username**.`)
            return dbName
        }
    }).catch((err) => {
        console.log(err)
        member.user.send(`Sorry, time's up. Goodbye.`)
        return false
    })

    return collected
}

//GET DECK LIST TOURNAMENT
const getDeckListTournament = async (member, player, resubmission = false) => {            
    const filter = m => m.author.id === member.user.id
    const msg = await member.user.send("Please provide a duelingbook.com/deck link for your tournament deck.");
    const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 180000
    }).then(async (collected) => {
        const url = collected.first().content
        if (url.includes("www.duelingbook.com/deck")) {		
            member.send('Thanks. Please wait while I download the .YDK file. This can take up to 30 seconds.')
            const issues = await saveYDK(member, url)
            
            if (issues['illegalCards'].length || issues['forbiddenCards'].length || issues['limitedCards'].length || issues['semiLimitedCards'].length) {
                let response = `I'm sorry, ${player.name}, your deck is not legal. ${FiC}`
                if (issues['illegalCards'].length) response += `\n\nThe following cards are not in this game:\n${issues['illegalCards'].join('\n')}`
                if (issues['forbiddenCards'].length) response += `\n\nThe following cards are forbidden:\n${issues['forbiddenCards'].join('\n')}`
                if (issues['limitedCards'].length) response += `\n\nThe following cards are limited:\n${issues['limitedCards'].join('\n')}`
                if (issues['semiLimitedCards'].length) response += `\n\nThe following cards are semi-limited:\n${issues['semiLimitedCards'].join('\n')}`
                response += `\n\nPlease edit your deck and try again once it's legal. If you believe this message is in error, contact the Tournament Organizer.`
            
                member.send(response)
                sendToTournamentChannel(player, url, null, false)
                return false
            } else if (issues['unrecognizedCards'].length) {
                let response = `I'm sorry, ${player.name}, the following card IDs were not found in our database:\n${issues['unrecognizedCards'].join('\n')}`
                response += `\n\nThese cards are either alternate artwork, new to the TCG, OCG only, or incorrect in our database. Please contact the Tournament Organizer or the Admin if you can't resolve this.`
                
                member.send(response)
                sendToTournamentChannel(player, url, null, false)
                return false
             } else {
                member.send(`Thanks, ${player.name}, your deck is perfectly legal. ${approve}`)
                return url
            }
        } else {
            member.send("Sorry, I only accept duelingbook.com/deck links.")
            return false
        }
    }).catch((err) => {
        console.log(err)
        member.send(`Sorry, time's up. To try again, go back to the Discord server and type **!join**. Goodbye.`)
        return false
    })

    return collected
}

//DIRECT SIGN UP
const directSignUp = async (message, player, resubmission = false) => {            
    const filter = m => m.author.id === member.user.id
    const msg = await message.author.send(`Please provide a duelingbook.com/deck link for ${player.name}'s tournament deck.`);
    const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 60000
    }).then(async collected => {
        const url = collected.first().content
        if (url.includes("duelingbook.com/deck")) {		
            message.author.send(`Thanks, ${message.author.username}, I now have the link to ${player.name}'s tournament deck. ${approve}`)
            return url
        } else {
            message.author.send("Sorry, I only accept duelingbook.com/deck links.")
            return false
        }
    }).catch(err => {
        console.log(err)
        member.user.send(`Sorry, time's up. To try again, go back to the Discord server type **!join**.`)
        return false
    })

    return collected
}

//GET DECK NAME TOURNAMENT
const getDeckNameTournament = async (member, player) => {
	const msg = await member.send(`Please provide the common name for your deck (i.e. Chaos Control, Quickdraw Plant, Mermail, etc.).`)
    const filter = m => m.author.id === member.user.id
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 60000
    }).then(async collected => {
        const deckName = collected.first().content.toLowerCase()
        return deckName
    }).catch(err => {    
        console.log(err)
        member.send(`Sorry, time's up. To try again, go back to the Discord server type **!join**.`)
        return false
    })

    return collected
}

//SEND TO TOURNAMENT CHANNEL
const sendToTournamentChannel = async (player, url, deckType, legal = true) => {
    return client.channels.cache.get(registrationChannelId).send(
        `<@${player.id}> ${legal ? 'submitted': 'attempted to submit'} their ${legal ? deckType : 'illegal'} deck for the tournament:\n<${url}>`
    )
}

//SEED
const seed = async (message, challongeClient, name, participantId, index) => {
    try {
        await challongeClient.participants.update({
            id: name,
            participantId: participantId,
            participant: {
            seed: index + 1,
            },
            callback: async (err, data) => {
                if (err) {
                    console.log(err)
                    // status['seeded'] = false
                    // fs.writeFile("./static/status.json", JSON.stringify(status), (err) => { 
                    //     if (err) console.log(err)
                    // })
                    return message.channel.send(`Something went wrong. ${data.participant.name} should be the ${index+1} seed but there was an error.`)
                } else {
                    return message.channel.send(`${data.participant.name} is now the ${index+1} seed.`)
                }
            }
        })
    } catch (err) {
        console.log(err)
    }
}

// SELECT TOURNAMENT
const selectTournament = async (message, tournaments) => {
    if (tournaments.length === 1) return tournaments[0]
    const options = tournaments.map((tournament, index) => `(${index + 1}) ${tournament.name}`)
    const filter = m => m.author.id === playerId
    const msg = await message.channel.send(`Please select a tournament:\n${options.join('\n')}`)
    const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 15000
    }).then(collected => {
        const num = parseInt(collected.first().content.match(/\d+/))
        if (!num || !tournaments[num - 1]) {
            message.channel.send(`Sorry, ${collected.first().content} is not a valid option.`)
            return null
        }
        else return tournaments[num - 1]
    }).catch(err => {
        console.log(err)
        return null
    })

    return collected
}


//REMOVE PARTICIPANT
const removeParticipant = async (message, member, participants, participantId, tournamentId, drop = false) => {    
    let participantID
    let keys = Object.keys(participants)

    keys.forEach(function(key) {
        console.log('participants[key]', participants[key])
        if (participants[key].participant.name === member.user.username) {
            participantID = participants[key].participant.id
        }
    })

    return challongeClient.participants.destroy({
        id: tournamentId,
        participantID: participantID,
        callback: async (err) => {
            if (err) {
                if (drop) {
                    return message.channel.send(`Hmm... I don't see you in the participants list.`)
                } else {
                    return message.channel.send(`I could not find ${member.user.username} in the participants list.`)
                }
            } else {
                const entry = await Entry.findOne({ where: { playerId: member.user.id } })
                await entry.destroy()
                member.roles.remove(tourRole)

                if (drop) return message.channel.send(`I removed you from the tournament. Better luck next time!`)
                else return message.channel.send(`${member.user.username} has been removed from the tournament.`)
            }
        }
    })
}


//FIND OPPONENT
const findOpponent = async (message, matches, noShow, noShowPlayer, formatName, formatDatabase) => {
    const noShowPartId = noShowPlayer.participantId
    let keys = Object.keys(matches)
    let winnerPartId
    let winner

    keys.forEach(function(elem) {
        if ((matches[elem].match.player1Id === noShowPartId || matches[elem].match.player2Id === noShowPartId)) {
            if (matches[elem].match.state === 'open') {
                winnerPartId = (matches[elem].match.player1Id === noShowPartId ? matches[elem].match.player2Id : matches[elem].match.player1Id)
            }
        }
    })
    
    try {
        const winningEntry = await Tournament.findOne({ where: { participantId: winnerPartId }})
        winner = message.guild.members.cache.get(winningEntry.playerId)
    } catch (err) {
        console.log(err)
    }

    return getParticipants(message, matches, noShow, winner, formatName, formatDatabase, true)
}


//ADD MATCH RESULT
const addMatchResult = async (message, matches, participants, loser, winner, formatName, formatDatabase, noshow = false) => {
    let loserId
    let winnerId
    let matchId
    let matchComplete = false
    let score
    let players = Object.keys(participants)

    try {
        let winnerEntry = await Tournament.findOne({
            where: {
                playerId: winner.user.id
            }
        })

        winnerId = winnerEntry.participantId
    } catch (err) {
        console.log(err)
    }

    try {
        let loserEntry = await Tournament.findOne({
            where: {
                playerId: loser.user.id
            }
        })

        loserId = loserEntry.participantId
    } catch (err) {
        console.log(err)
    }

    if (!loserId) {
        players.forEach(function(elem) {
            if (participants[elem].participant.name === loser.user.username) {
                loserId = participants[elem].participant.id
            }
        })
    }

    if (!winnerId) {
        players.forEach(function(elem) {
            if (participants[elem].participant.name === winner.user.username) {
                winnerId = participants[elem].participant.id
            }
        })
    }

    let keys = Object.keys(matches)
    keys.forEach(function(elem) {
        if ( (matches[elem].match.player1Id === loserId && matches[elem].match.player2Id === winnerId) || (matches[elem].match.player2Id === loserId && matches[elem].match.player1Id === winnerId) ) {
            if (matches[elem].match.state === 'complete') {
                matchComplete = true
            } else if (matches[elem].match.state === 'open') {
                matchId = matches[elem].match.id
                if (noshow) {
                    score = '0-0'
                } else if (matches[elem].match.player1Id === loserId) {
                    score = '0-1'
                } else {
                    score = '1-0'
                }
            }
        }
    })

    if (!winnerId) {
        return message.channel.send(`${winner.user.username} is not in the tournament.`)
    } else if (!loserId) {
        return message.channel.send(`${loser.user.username} is not in the tournament.`)
    } else if (matchComplete && !matchId) {
        return message.channel.send(`The match result between ${winner.user.username} and ${loser.user.username} was already recorded.`)
    } else if (!matchComplete && !matchId) {
        return message.channel.send(`${winner.user.username} and ${loser.user.username} were not supposed to play a match.`)
    } else if (matchId) {
        challongeClient.matches.update({
            id: status['tournament'],
            matchId: matchId,
            match: {
              scoresCsv: score,
              winnerId: winnerId
            },
            callback: async (err) => {
                if (err) {
                    return message.channel.send(`Error: The match between ${winner.user.username} and ${loser.user.username} could not be updated.`)
                } else if (!noshow) {
                    const winningPlayersRecord = await eval(formatDatabase).findOne({ where: { playerId: winner.user.id } })
                    const losingPlayersRecord = await eval(formatDatabase).findOne({ where: { playerId: loser.user.id } })
                    const winningPlayer = await Player.findOne({ where: { id: winner.user.id }, include: [ { model: Tournament, attribute: 'type' } ] })
                    const losingPlayer = await Player.findOne({ where: { id: loser.user.id }, include: [ { model: Tournament, attribute: 'type' } ] })
                    const statsLoser = losingPlayersRecord.stats
                    const statsWinner = winningPlayersRecord.stats
                    winningPlayersRecord.backup = statsWinner
                    losingPlayersRecord.backup = statsLoser
                    const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((statsWinner - statsLoser) / 400))))))
                    winningPlayersRecord.stats += delta
                    losingPlayersRecord.stats -= delta
                    winningPlayersRecord.wins++
                    losingPlayersRecord.losses++
                    try {
                        await winningPlayersRecord.save()
                        await losingPlayersRecord.save()
                    } catch (err) {
                        console.log(err)
                    }
                    
                    try {
                        await Match.create({
                            game_mode: 'tournament',
                            winner_name: winningPlayer.name,
                            winnerId: winningPlayer.id,
                            loser_name: winningPlayer.name,
                            loserId: losingPlayer.id,
                            delta,
                            chipsWinner,
                            chipsLoser
                        })
                    } catch (err) {
                        console.log(err)
                    }

                    try {
                        await Matchup.create({ 
                            format: formatDatabase, 
                            winningType: winningPlayer.tournament.type, 
                            losingType: losingPlayer.tournament.type, 
                            wasTournament: true, 
                            tournamentName: status['tournament'] 
                        })
                    } catch (err) {
                        console.log(err)
                    }

                    try {
                        const entry = await Tournament.findOne({ where: { playerId: loser.user.id } })
                        entry.losses++
                        await entry.save()
                    } catch (err) {
                        console.log(err)
                    }
                         
                    message.channel.send(`<@${loser.user.id}>, Your ${formatName} tournament loss to ${winner.user.username} has been recorded.`)
                    return setTimeout(function() {
                        getUpdatedMatchesObject(message, participants, matchId, loserId, winnerId, loser, winner)
                    }, 3000)	
                } else {
                    try {
                        const entry = await Tournament.findOne({ where: { playerId: loser.user.id } })
                        entry.losses++
                        await entry.save()
                    } catch (err) {
                        console.log(err)
                    }
                         
                    message.channel.send(`<@${loser.user.id}>, Your ${formatName} tournament match against ${winner.user.username} has been recorded as a no-show.`)
                    return setTimeout(function() {
                        getUpdatedMatchesObject(message, participants, matchId, loserId, winnerId, loser, winner)
                    }, 3000)
                }
            }
        })
    }
}


//GET UPDATED MATCHES OBJECT
const getUpdatedMatchesObject = async (message, participants, matchId, loserId, winnerId, loser, winner) => {
    return challongeClient.matches.index({
        id: status['tournament'],
        callback: (err, data) => {
            if (err) {
                return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
            } else {
                return checkMatches(message, data, participants, matchId, loserId, winnerId, loser, winner)
            }
        }
    }) 
}




//CHECK MATCHES
const checkMatches = async (message, matches, participants, matchId, loserId, winnerId, loser, winner) => {
    let winnerNextMatchId
    let winnerWaitingOnMatchId
    let winnerNextOppoPartId
    let winnerWaitingOnP1Id
    let winnerWaitingOnP2Id
    let winnerMatchWaitingOnP1Name
    let winnerMatchWaitingOnP2Name

    let loserNextMatchId
    let loserWaitingOnMatchId
    let loserNextOppoPartId
    let loserWaitingOnP1Id
    let loserWaitingOnP2Id
    let loserMatchWaitingOnP1Name
    let loserMatchWaitingOnP2Name

    let keys = Object.keys(matches)
    let players = Object.keys(participants)

    keys.forEach(function(elem) {
        if ((matches[elem].match.player1Id === winnerId || matches[elem].match.player2Id === winnerId)) {
            if (matches[elem].match.state === 'pending') {
                if (matches[elem].match.player1Id) {
                    winnerWaitingOnMatchId = matches[elem].match.player2PrereqMatchId
                } else {
                    winnerWaitingOnMatchId = matches[elem].match.player1PrereqMatchId
                }
            } else if (matches[elem].match.state === 'open') {
                winnerNextMatchId = matches[elem].match.id
                winnerNextOppoPartId = (matches[elem].match.player1Id === winnerId ? matches[elem].match.player2Id : matches[elem].match.player1Id)
            }
        }

        if ((matches[elem].match.player1Id === loserId || matches[elem].match.player2Id === loserId)) {
            if (matches[elem].match.state === 'pending') {
                if (matches[elem].match.player1Id) {
                    loserWaitingOnMatchId = matches[elem].match.player2PrereqMatchId
                } else {
                    loserWaitingOnMatchId = matches[elem].match.player1PrereqMatchId
                }
            } else if (matches[elem].match.state === 'open') {
                loserNextMatchId = matches[elem].match.id
                loserNextOppoPartId = (matches[elem].match.player1Id === loserId ? matches[elem].match.player2Id : matches[elem].match.player1Id)
            }
        }
    })


    keys.forEach(function(elem) {
        if (matches[elem].match.id === winnerWaitingOnMatchId) {
            winnerWaitingOnP1Id = matches[elem].match.player2Id
            winnerWaitingOnP2Id = matches[elem].match.player1Id
        }

        if (matches[elem].match.id === loserWaitingOnMatchId) {
            loserWaitingOnP1Id = matches[elem].match.player2Id
            loserWaitingOnP2Id = matches[elem].match.player1Id
        }  
    })

    players.forEach(function(elem) {
         if (participants[elem].participant.id === winnerNextOppoPartId) winnerNextOppoName = participants[elem].participant.name
         if (participants[elem].participant.id === loserNextOppoPartId) loserNextOppoName = participants[elem].participant.name
         if (participants[elem].participant.id === winnerWaitingOnP1Id) winnerMatchWaitingOnP1Name = participants[elem].participant.name
         if (participants[elem].participant.id === winnerWaitingOnP2Id) winnerMatchWaitingOnP2Name = participants[elem].participant.name
         if (participants[elem].participant.id === loserWaitingOnP1Id) loserMatchWaitingOnP1Name = participants[elem].participant.name
         if (participants[elem].participant.id === loserWaitingOnP2Id) loserMatchWaitingOnP2Name = participants[elem].participant.name
    })

    if (loserWaitingOnMatchId) {
        if (loserMatchWaitingOnP1Name && loserMatchWaitingOnP2Name) {
            message.channel.send(`${loser.user.username}, You are waiting for the result of ${loserMatchWaitingOnP1Name} vs ${loserMatchWaitingOnP2Name}.`)
        } else {
            message.channel.send(`${loser.user.username}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`) 
        }
    } else if (loserNextOppoPartId) {
        const opponent = await Tournament.findOne({ 
            where: { 
                participantId: loserNextOppoPartId 
            }, 
            include: Player 
        })
        const losingPlayer = await Player.findOne({ where: { id: loser.user.id } })
        const opponentDB = opponent.player.duelingBook ? ` (DB: ${opponent.player.duelingBook})` : ``
        const loserDB = losingPlayer.duelingBook ? ` (DB: ${losingPlayer.duelingBook})` : ``
        message.channel.send(`New Match: <@${loser.user.id}>${loserDB} vs <@${opponent.playerId}>${opponentDB}. Good luck to both duelists.`)
    } else {
        const entry = await Tournament.findOne({ where: { playerId: loser.user.id } })
        const winningPlayer = await Player.findOne({ where: { id: winner.user.id } })
        const losingPlayer = await Player.findOne({ where: { id: loser.user.id } })
        const winnerDB = winningPlayer.duelingBook ? ` (DB: ${winningPlayer.duelingBook})` : ``
        const loserDB = losingPlayer.duelingBook ? ` (DB: ${losingPlayer.duelingBook})` : ``
        if (entry.losses === 1) {
            return message.channel.send(`New Match: <@${loser.user.id}>${loserDB} vs <@${winner.user.id}>${winnerDB}. Good luck to both duelists.`)
        } else {
            loser.roles.remove(tourRole)
            message.channel.send(`${loser.user.username}, You are eliminated from the tournament. Better luck next time!`)
        }
    }

    if (winnerWaitingOnMatchId) {
        if (winnerMatchWaitingOnP1Name && winnerMatchWaitingOnP2Name) {
            message.channel.send(`${winner.user.username}, You are waiting for the result of ${winnerMatchWaitingOnP1Name} vs ${winnerMatchWaitingOnP2Name}.`)
        } else {
            message.channel.send(`${winner.user.username}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`) 
        }
    } else if (winnerNextOppoPartId && (winnerNextOppoPartId !== loserId)) {
        const opponent = await Tournament.findOne({ 
            where: { 
                participantId: winnerNextOppoPartId
            },
            include: Player 
        })
        const winningPlayer = await Player.findOne({ where: { id: winner.user.id } })
        const opponentDB = opponent.player.duelingBook ? ` (DB: ${opponent.player.duelingBook})` : ``
        const winnerDB = winningPlayer.duelingBook ? ` (DB: ${winningPlayer.duelingBook})` : ``
        message.channel.send(`New Match: <@${winner.user.id}>${winnerDB} vs <@${opponent.playerId}>${opponentDB}. Good luck to both duelists.`)
    } else if (!winnerNextOppoPartId && !winnerWaitingOnMatchId) {
        winner.roles.remove(tourRole)
        message.channel.send(`<@${winner.user.id}>, You won the tournament! Congratulations on your stellar performance!`)
    }
    
    return
}

const getTournamentType = async (message) => {
    let tournamentType
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`What type of tournament is this?\n(1) Double Elimination\n(2) Single Elimination\n(3) Swiss\n(4) Round Robin`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 30000
	}).then(collected => {
		const response = collected.first().content.toLowerCase()
        if (response.includes(1) || response.startsWith('double')) tournamentType = 'double elimination'
        else if (response.includes(2) || response.startsWith('single')) tournamentType = 'single elimination'
        else if (response.includes(3) || response.startsWith('swiss')) tournamentType = 'swiss'
        else if (response.includes(4) || response.startsWith('round')) tournamentType = 'round robin'
        else return 
	}).catch(err => {
		console.log(err)
        message.channel.send(`Sorry, time's up.`)
	})

    return tournamentType
}

const generateSheetData = async () => {
    const allDecks = await Entry.findAll()
    const typeData = {}
    const catData = {}
    const sheet1Data = [['Player', 'Deck', 'Type', 'Link']]
    const sheet2DataA = [['Deck', 'Entries', 'Percent']]
    const sheet2DataB = [[], ['Category', 'Entries', 'Percent']]

    allDecks.forEach(function (deck) {
        console.log(deck.type)
        console.log(deck.category)
        console.log(deck.pilot)
        console.log(deck.name)
        console.log(deck.url)
        typeData[deck.type] ? typeData[deck.type]++ : typeData[deck.type] = 1
        catData[deck.category] ? catData[deck.category]++ : catData[deck.category] = 1
        const row = [deck.pilot, deck.name, deck.type, deck.url]
        sheet1Data.push(row)
    })

    let typeDataArr = Object.entries(typeData).sort((b, a) => b[0].localeCompare(a[0]))
    let catDataArr = Object.entries(catData).sort((b, a) => b[0].localeCompare(a[0]))

    let typeDataArr2 = typeDataArr.map(function(elem) {
        return [elem[0], elem[1], `${(elem[1], elem[1] / allDecks.length * 100).toFixed(2)}%`]
    })

    let catDataArr2 = catDataArr.map(function(elem) {
        return [capitalize(elem[0]), elem[1], `${(elem[1], elem[1] / allDecks.length * 100).toFixed(2)}%`]
    })

    const sheet2Data = [...sheet2DataA, ...typeDataArr2, ...sheet2DataB, ...catDataArr2]

    const data = {
        sheet1Data,
        sheet2Data
    }

    return data
}

module.exports = {
    askForDBUsername,
    getDeckListTournament,
    getDeckNameTournament,
    sendToTournamentChannel,
    removeParticipant,
    directSignUp,
    seed,
    generateSheetData,
    findOpponent,
    getUpdatedMatchesObject,
    addMatchResult,
    getTournamentType,
    selectTournament
}