
const axios = require('axios')
const { challongeAPIKey } = require('../secrets.json')
const { registrationChannelId } = require('../static/channels.json')
const { tourRole } = require('../static/roles.json')
const { orange, soldier, FiC } = require('../static/emojis.json')
const { Arena, Binder, Card, Daily, Diary, Draft, Entry, Gauntlet, Info, Inventory, Knowledge, Match, Player, Print, Profile, Set, Tournament, Trade, Trivia, Wallet, Wishlist } = require('../db')
const { client } = require('../static/clients.js')
const { saveYDK, saveAllYDK } = require('./decks.js')
const { capitalize, shuffleArray } = require('./utility.js')

//ASK FOR DB NAME
const askForDBName = async (member, player, override = false, error = false, attempt = 1) => {
    const filter = m => m.author.id === member.user.id
    const pronoun = override ? `${player.name}'s` : 'your'
    const greeting = override ? '' : 'Hi! '
    const prompt = error ? `I think you're getting ahead of yourself. First, I need ${pronoun} DuelingBook name.`
    : `${greeting}This appears to be ${player.name}'s first tournament in our system. Can you please provide ${pronoun} DuelingBook name?`
	const msg = await member.user.send({ content: prompt})

    const collector = msg.channel.createMessageCollector({ filter,
		max: 1,
        time: 30000
    })
    
    collector.on('collect', async (collected) => {
        const dbName = collected.first().content
        if (dbName.includes("duelingbook.com/deck") || dbName.includes("imgur.com")) {
            if (attempt >= 3) {
                member.user.send({ content: `Sorry, time's up. Go back to the server and try again.`})
                return false
            } else {
                return askForDBName(member, player, override, true, attempt++)
            }
        } else {
            await player.update({
                duelingBook: dbName
            })
            member.user.send({ content: `Thanks! I saved ${pronoun} DuelingBook name as: ${dbName}. If that's wrong, go back to the server and type **!db name**.`})
            return dbName
        }
    })
    
    collector.on('end', () => {
        member.user.send({ content: `Sorry, time's up. Go back to the server and try again.`})
        return false
    })

    return collected
}

//GET DECK LIST TOURNAMENT
const getDeckList = async (member, player, tournamentName, override = false) => {            
    const filter = m => m.author.id === member.user.id
    const pronoun = override ? `${player.name}'s` : 'your'
    const msg = await member.user.send({ content: `Please provide a duelingbook.com/deck link for ${pronoun} tournament deck.`});
    const collector = msg.channel.createMessageCollector({ filter,
        max: 1,
        time: 180000
    })
    
    collector.on('collect', async (collected) => {
        const url = collected.first().content
        if (url.includes("www.duelingbook.com/deck")) {		
            member.send({ content: 'Thanks. Please wait while I download the .YDK file. This can take up to 30 seconds.'})
            const issues = await saveYDK(player, url, tournamentName)

            if (override) {
                member.send({ content: `Thanks, ${member.user.username}, I saved a copy of ${pronoun} deck. ${soldier}`})
                return url
            } else if (issues['illegalCards'].length || issues['forbiddenCards'].length || issues['limitedCards'].length || issues['semiLimitedCards'].length) {
                let response = `I'm sorry, ${member.user.username}, ${pronoun} deck is not legal. ${orange}`
                if (issues['illegalCards'].length) response += `\n\nThe following cards are not in this game:\n${issues['illegalCards'].join('\n')}`
                if (issues['forbiddenCards'].length) response += `\n\nThe following cards are forbidden:\n${issues['forbiddenCards'].join('\n')}`
                if (issues['limitedCards'].length) response += `\n\nThe following cards are limited:\n${issues['limitedCards'].join('\n')}`
                if (issues['semiLimitedCards'].length) response += `\n\nThe following cards are semi-limited:\n${issues['semiLimitedCards'].join('\n')}`
                response += `\n\nPlease edit ${pronoun} deck and try again once it's legal. If you believe this message is in error, contact the Tournament Organizer.`
            
                member.send({ content: response})
                return false
            } else if (issues['unrecognizedCards'].length) {
                let response = `I'm sorry, ${member.user.username}, the following card IDs were not found in our database:\n${issues['unrecognizedCards'].join('\n')}`
                response += `\n\nThese cards are either alternate artwork, new to the TCG, OCG only, or incorrect in our database. Please contact the Tournament Organizer or the Admin if you can't resolve this.`
                
                member.send({ content: response})
                return false
             } else {
                member.send({ content: `Thanks, ${member.user.username}, ${pronoun} deck is perfectly legal. ${soldier}`})
                return url
            }
        } else {
            member.send({ content: "Sorry, I only accept duelingbook.com/deck links."})
            return false
        }
    })
    
    collector.on('end', () => {
        member.send({ content: `Sorry, time's up. Go back to the server and try again.`})
        return false
    })

    return collected
}


//DIRECT SIGN UP
const directSignUp = async (message, player, resubmission = false) => {            
    const filter = m => m.author.id === member.user.id
    const msg = await message.author.send({ content: `Please provide a duelingbook.com/deck link for ${player.name}'s tournament deck.`});
    const collector = msg.channel.createMessageCollector({ filter,
        max: 1,
        time: 60000
    })

    collector.on('collect', async (collected) => {
        const url = collected.first().content
        if (url.includes("duelingbook.com/deck")) {		
            message.author.send({ content: `Thanks, ${message.author.username}, I now have the link to ${player.name}'s tournament deck. ${soldier}`})
            return url
        } else {
            message.author.send({ content: "Sorry, I only accept duelingbook.com/deck links."})
            return false
        }
    })
    
    collector.on('end', () => {
        member.user.send({ content: `Sorry, time's up. To try again, go back to the Discord server type **!join**.`})
        return false
    })

    return collected
}

//GET DECK NAME
const getDeckName = async (member, player, override = false) => {
    const pronoun = override ? `${player.name}'s` : 'your'
	const msg = await member.send({ content: `Please provide the common name for ${pronoun} deck (i.e. Chaos Control, Chaos Turbo, Warrior, etc.).`})
    const filter = m => m.author.id === member.user.id
    const collector = msg.channel.createMessageCollector({ filter,
		max: 1,
        time: 20000
    })

    collector.on('collect', async (collected) => {
        const response = collected.first().content.toLowerCase()
        return response
    })
    
    collector.on('end', () => {    
        member.send({ content: `Sorry, time's up.`})
        return false
    })

    return collected
}


//SEED
const seed = async (message, tournamentId) => {
    const entries = await Entry.findAll({ 
        where: { 
            tournamentId: tournamentId
         }, 
         include: Player,
         order: [[Player, 'stats', 'DESC']]
    })

    const expEntries = entries.filter((e) => (e.player.wins !== 0 || e.player.losses !== 0)).map((e) => [e.participantId, e.player.name])
    const newbieEntries = entries.filter((e) => (e.player.wins === 0 && e.player.losses === 0)).map((e) => [e.participantId, e.player.name])
    const seeds = [...expEntries, ...shuffleArray(newbieEntries)]

    let count = 0

    for (let i = 0; i < seeds.length; i++) {
        const participantId = seeds[i][0]
        const name = seeds[i][1]

        try {
            await axios({
                method: 'put',
                url: `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournamentId}/participants/${participantId}.json`,
                data: {
                    participant: {
                        seed: i+1
                    }
                }
            })

            message.channel.send({ content: `${name} is now the ${i+1} seed.`})
            count++
        } catch (err) {
            console.log(err)
        }   
    }

    return count === seeds.length
}

// SELECT TOURNAMENT
const selectTournament = async (message, tournaments, playerId) => {
    if (tournaments.length === 0) return false
    if (tournaments.length === 1) return tournaments[0]
    const options = tournaments.map((tournament, index) => `(${index + 1}) ${tournament.name}`)
    const filter = m => m.author.id === playerId
    const msg = await message.channel.send({ content: `Please select a tournament:\n${options.join('\n')}`})
    const collector = msg.channel.createMessageCollector({ filter,
        max: 1,
        time: 15000
    })
    
    collector.on('collect', collected => {
        const num = parseInt(collected.first().content.match(/\d+/))
        if (!num || !tournaments[num - 1]) {
            message.channel.send({ content: `Sorry, ${collected.first().content} is not a valid option.`})
            return null
        }
        else return tournaments[num - 1]
    })
    
    collector.on('end', () => {
        return null
    })

    return collected
}


//REMOVE PARTICIPANT
const removeParticipant = async (message, member, entry, tournament, drop = false) => {    
    try {
        const success = await axios({
            method: 'delete',
            url: `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournament.id}/participants/${entry.participantId}.json`,
        })

        if (success) {
            await entry.destroy()
            member.roles.remove(tourRole)
        
            if (drop) {
                return message.channel.send({ content: `I removed you from the tournament. Better luck next time!`})
            } else {
                return message.channel.send({ content: `${member.user.username} has been removed from the tournament.`})
            }
        } else if (!success && drop) {
            console.log(1)
            return message.channel.send({ content: `Hmm... I don't see you in the participants list.`})
        } else if (!success && !drop) {
            console.log(1)
            return message.channel.send({ content: `I could not find ${member.user.username} in the participants list.`})
        }

    } catch (err) {
        console.log(err)
        if (drop) {
            console.log(2)
            return message.channel.send({ content: `Hmm... I don't see you in the participants list.`})
        } else {
            console.log(2)
            return message.channel.send({ content: `I could not find ${member.user.username} in the participants list.`})
        }
    }   

}

//GET TOURNAMENT
const getTournament = async (tournament) => {
    try {
        const { data } = await axios.get(
            `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournament.id}.json`
        )
        return data
    } catch (err) {
        console.log(err)
    }
}

//GET MATCHES
const getMatches = async (tournamentId) => {
    try {
        const { data } = await axios.get(
            `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournamentId}/matches.json`
        )
        return data
    } catch (err) {
        console.log(err)
    }
}

//PUT MATCH RESULT
const putMatchResult = async (tournamentId, matchId, winnerId, scores) => {
    try {
        const success = await axios({
            method: 'put',
            url: `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournamentId}/matches/${matchId}.json`,
            data: {
                match: {
                    winner_id: winnerId,
                    scores_csv: scores
                }
            }
        })
        return !!success
    } catch (err) {
        console.log(err)
    }   
}


//POST PARTICIPANT
const postParticipant = async (tournament, player) => {
    try {
        const { data } = await axios({
            method: 'post',
            url: `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournament.id}/participants.json`,
            data: {
                participant: {
                    name: player.name
                }
            }
        })
        return data
    } catch (err) {
        console.log(err)
    }   
}

//FIND NEXT MATCH
const findNextMatch = (matchesArr, matchId, participantId) => {
    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.state === 'complete') continue
        if (match.prerequisite_match_ids_csv.includes(matchId) && (match.player1_id === participantId || match.player2_id === participantId)) {
            return match.id
        }
    }

    return false
}

//FIND OTHER PRE REQ MATCH
const findOtherPreReqMatch = (matchesArr, nextMatchId, completedMatchId) => {
    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.id === nextMatchId) {
            const pre_reqs = match.prerequisite_match_ids_csv.split(",")
            if (pre_reqs[0] === completedMatchId) {
                const pairing = getPairing(matchesArr, pre_reqs[1])
                return pairing
            } else if (pre_reqs[1] === completedMatchId) {
                const pairing = getPairing(matchesArr, pre_reqs[0])
                return pairing
            } 
            else return false
        }
    }

    return false
}

//GET PAIRING
const getPairing = (matchesArr, matchId) => {
    let p1 = null
    let p2 = null

    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.id === matchId) {
            p1 = match.player1_id
            p2 = match.player2_id
            break
        }
    }

    const pairing = {
        p1,
        p2
    }

    return pairing
}

//FIND NEXT OPPONENT
const findNextOpponent = async (tournamentId, matchesArr, matchId, participantId) => {
    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.id === matchId) {
            const player1_id = match.player1_id
            const player2_id = match.player2_id
            if (player1_id === participantId) {
                if (!player2_id) return false
                const opponentEntry = await Entry.findOne({
                    where: {
                        tournamentId: tournamentId,
                        participantId: player2_id
                    },
                    include: Player
                })

                return opponentEntry
            } else if (player2_id === participantId) {
                if (!player1_id) return false
                const opponentEntry = await Entry.findOne({
                    where: {
                        tournamentId: tournamentId,
                        participantId: player1_id
                    },
                    include: Player
                }) 

                return opponentEntry
            }
        }
    }

    return false
}

//CHECK CHALLONGE PAIRING
const checkChallongePairing = (match, p1, p2) => (match.player1_id === p1 && match.player2_id === p2) || (match.player1_id === p2 && match.player2_id === p1)

//FIND NO SHOW OPPONENT
const findNoShowOpponent = (match, noShowParticipantId) => {
    if (match.player1_id === noShowParticipantId) return match.player2_id
    if (match.player2_id === noShowParticipantId) return match.player1_id
    else return false
}

// GET TOURNAMENT TYPE
const getTournamentType = async (message) => {
    let tournamentType
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send({ content: `What type of tournament is this?\n(1) Single Elimination\n(2) Double Elimination\n(3) Swiss\n(4) Round Robin`})
	const collector = msg.channel.createMessageCollector({ filter,
		max: 1,
		time: 30000
	})
    
    collector.on('collect', collected => {
		const response = collected.first().content.toLowerCase()
        if (response.includes(1) || response.startsWith('single')) tournamentType = 'single elimination'
        else if (response.includes(2) || response.startsWith('double')) tournamentType = 'double elimination'
        else if (response.includes(3) || response.startsWith('swiss')) tournamentType = 'swiss'
        else if (response.includes(4) || response.startsWith('round')) tournamentType = 'round robin'
        else return 
	})
    
    collector.on('end', () => {
        message.channel.send({ content: `Sorry, time's up.`})
	})

    return tournamentType
}

// GENERATE SHEET DATA
const generateSheetData = async () => {
    const allDecks = await Entry.findAll()
    const typeData = {}
    const catData = {}
    const sheet1Data = [['Player', 'Deck', 'Type', 'Link']]
    const sheet2DataA = [['Deck', 'Entries', 'Percent']]
    const sheet2DataB = [[], ['Category', 'Entries', 'Percent']]

    allDecks.forEach(function (deck) {
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
    askForDBName,
    checkChallongePairing,
    directSignUp,
    findOtherPreReqMatch,
    findNextMatch,
    findNextOpponent,
    findNoShowOpponent,
    generateSheetData,
    getDeckList,
    getDeckName,
    getPairing,
    getTournamentType,
    getMatches,
    getTournament,
    putMatchResult,
    postParticipant,
    removeParticipant,
    seed,
    selectTournament
}