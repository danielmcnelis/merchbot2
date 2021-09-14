
const axios = require('axios')
const { challongeAPIKey } = require('../secrets.json')
const { registrationChannelId } = require('../static/channels.json')
const { tourRole } = require('../static/roles.json')
const { soldier, FiC } = require('../static/emojis.json')
const { Arena, Binder, Card, Daily, Diary, Draft, Entry, Gauntlet, Info, Inventory, Knowledge, Match, Player, Print, Profile, Set, Tournament, Trade, Trivia, Wallet, Wishlist } = require('../db')
const { client, challongeClient } = require('../static/clients.js')
const { saveYDK, saveAllYDK } = require('./decks.js')
const { capitalize, shuffleArray } = require('./utility.js')

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
            
            if (issues['illegalCards'].length || issues['forbiddenCards'].length || issues['limitedCards'].length || issues['semiLimitedCards'].length || issues['phantomCards'].length) {
                let response = `I'm sorry, ${player.name}, your deck is not legal. ${FiC}`
                if (issues['illegalCards'].length) response += `\n\nThe following cards are not in this game:\n${issues['illegalCards'].join('\n')}`
                if (issues['forbiddenCards'].length) response += `\n\nThe following cards are forbidden:\n${issues['forbiddenCards'].join('\n')}`
                if (issues['limitedCards'].length) response += `\n\nThe following cards are limited:\n${issues['limitedCards'].join('\n')}`
                if (issues['semiLimitedCards'].length) response += `\n\nThe following cards are semi-limited:\n${issues['semiLimitedCards'].join('\n')}`
                if (issues['phantomCards'].length) response += `\n\nThe following cards are not in your Inventory at the given quantity:\n${issues['phantomCards'].join('\n')}`
                response += `\n\nPlease edit your deck and try again once it's legal. If you believe this message is in error, contact the Tournament Organizer.`
            
                member.send(response)
                return false
            } else if (issues['unrecognizedCards'].length) {
                let response = `I'm sorry, ${player.name}, the following card IDs were not found in our database:\n${issues['unrecognizedCards'].join('\n')}`
                response += `\n\nThese cards are either alternate artwork, new to the TCG, OCG only, or incorrect in our database. Please contact the Tournament Organizer or the Admin if you can't resolve this.`
                
                member.send(response)
                return false
             } else {
                member.send(`Thanks, ${player.name}, your deck is perfectly legal. ${soldier}`)
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
            message.author.send(`Thanks, ${message.author.username}, I now have the link to ${player.name}'s tournament deck. ${soldier}`)
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

            message.channel.send(`${name} is now the ${i+1} seed.`)
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


//PUT PARTICIPANT
const putParticipant = async (tournament, player) => {
    try {
        const participant = await axios({
            method: 'put',
            url: `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournament.id}/participants.json`,
            data: {
                participant: {
                    name: player.name,
                    seed: 1
                }
            }
        })
        return !!participant
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


// GET TOURNAMENT TYPE
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
    askForDBUsername,
    checkChallongePairing,
    directSignUp,
    findOtherPreReqMatch,
    findNextMatch,
    findNextOpponent,
    generateSheetData,
    getDeckListTournament,
    getDeckNameTournament,
    getPairing,
    getTournamentType,
    getMatches,
    getTournament,
    putMatchResult,
    putParticipant,
    removeParticipant,
    seed,
    selectTournament
}