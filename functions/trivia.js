
const { Diary, Info, Knowledge, Player, Profile, Trivia, Wallet } = require('../db')
const { Op } = require('sequelize')
const FuzzySet = require('fuzzyset')
const { yescom, nocom } = require('../static/commands.json')
const { gradcap, yes, no, orange, cultured, megaphone, amongmfao, dummy, wut, starchips, stardust } = require('../static/emojis.json')
const { triviaRole } = require('../static/roles.json')
const { triviaChannelId } = require('../static/channels.json')
const { client } = require('../static/clients.js')
const { completeTask } = require('./diary')
const { shuffleArray, getRandomElement, getRandomSubset, capitalize } = require('./utility.js')
const trivia = require('../trivia.json')
const { Message } = require('discord.js')

const startTrivia = async (guild) => {
    const channel = client.channels.cache.get(triviaChannelId)
    channel.send(`Trivia players, please check your DMs!`)
    const allTriviaEntries = await Trivia.findAll({ include: Player })

    getTriviaConfirmation(guild, channel, allTriviaEntries[0])
    getTriviaConfirmation(guild, channel, allTriviaEntries[1])
    getTriviaConfirmation(guild, channel, allTriviaEntries[2])
    getTriviaConfirmation(guild, channel, allTriviaEntries[3])

    const triviaArr = Object.entries(trivia)
    const questionsArr = getRandomSubset(triviaArr, 10)

    const info = await Info.findOne({ where: {
        element: 'trivia'
    }})

    for (let i = 1; i < 12; i ++) {
        setTimeout(async () => {
            const count = await Trivia.count({ where: {
                active: true
            } })
    
            const active = await Info.count({ where: {
                element: 'trivia',
                status: 'active'
            } })

            if (count === 4 && !active) {
                info.round = 1
                info.status = 'active'
                await info.save()
                assignTriviaRoles(guild, allTriviaEntries)
                setTimeout(() => {
                    channel.send(`<@&${triviaRole}>, look alive bookworms! Trivia starts in 10 seconds. ${wut}\n\nP.S. Remember: answer questions **in your DMs**.`)
                }, 1000)
                return setTimeout(() => {
                    return askQuestion(guild, channel, info, allTriviaEntries, questionsArr)
                }, 11000)
            }
        }, i * 5000)
    }

    setTimeout(async () => {
        const count = await Trivia.count({ where: {
            active: true
        } })

        const active = await Info.count({ where: {
            element: 'trivia',
            status: 'active'
        } })

        if (count !== 4 && !active) {
            const missingTriviaEntries = await Trivia.findAll({ 
                where: { 
                    active: false
                },
                include: Player
            })

            const names = missingTriviaEntries.map((entry) => entry.player.name)

            await resetTrivia(guild, info, allTriviaEntries)

            for (let i = 0; i < missingTriviaEntries.length; i++) {
                const entry = missingTriviaEntries[i]
                await entry.destroy()
            }
            
            return channel.send(`Unfortunately, Trivia cannot begin without 5 players.\n\nThe following players have been removed from the queue:\n${names.sort().join("\n")}`)
        } else if (count === 4 && !active) {
            info.round = 1
            info.status = 'active'
            await info.save()
            assignTriviaRoles(guild, allTriviaEntries)
            setTimeout(() => {
                channel.send(`<@&${triviaRole}>, look alive bookworms! Trivia starts in 10 seconds. ${wut}\n\nP.S. Remember: answer questions **in your DMs**.`)
            }, 1000)
            return setTimeout(() => {
                return askQuestion(guild, channel, info, allTriviaEntries, questionsArr)
            }, 11000)
        }
    }, 61000)
}

const getTriviaConfirmation = async (guild, channel, trivia_entry) => {
    const playerId = trivia_entry.playerId
    const member = guild.members.cache.get(playerId)
    if (!member || playerId !== member.user.id) return
    const filter = m => m.author.id === playerId
	const msg = await member.send(`Do you still wish to play Trivia?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 60000
	}).then(async collected => {
		const response = collected.first().content.toLowerCase()

        const count = await Info.count({ where: {
            element: 'trivia',
            status: 'confirming'
        } })

        if (!count) return member.send(`Sorry, time expired.`)

        if(yescom.includes(response)) {
            trivia_entry.active = true
            await trivia_entry.save()
            member.send(`Thanks! Trivia will be starting very soon.\n\nP.S. If you have a disability that affects your typing, please contact Jazz about making Trivia more accessible. 👋`)
            return channel.send(`${member.user.username} confirmed their participation in Trivia!`)
        } else {
            member.send(`Okay, sorry to see you go!`)
            return channel.send(`Oof. ${member.user.username} ducked out of Trivia!`)
        }
	}).catch(err => {
		console.log(err)
        return member.send(`Sorry, time's up.`)
	})
}


const getAnswer = async (guild, entry, question) => {
    const playerId = entry.playerId
    const extraTime = playerId === '257021989078827010' ? 4000 : 0
    const member = guild.members.cache.get(playerId)
    if (!member || playerId !== member.user.id) return
    const filter = m => m.author.id === playerId
	const msg = await member.send(question)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 16000 + extraTime
	}).then(async collected => {
		const response = collected.first().content
        entry.answer = response
        await entry.save()
        return member.send(`Thanks!`)
	}).catch(async err => {
		console.log(err)
        entry.answer = 'no answer'
        await entry.save()
        return member.send(`Time's up!`)
	})
}

const assignTriviaRoles = (guild, entries) => {
    entries.forEach((entry) => {
        const member = guild.members.cache.get(entry.playerId)
        member.roles.add(triviaRole)
    })
}

const askQuestion = async (guild, channel, info, entries, questionsArr) => {
    const questionNumber = questionsArr[info.round - 1][0]
    const { question, answers, stringency } = questionsArr[info.round - 1][1]
	let fuzzyAnswers = FuzzySet([], false)
    answers.forEach((a) =>  fuzzyAnswers.add(a))

    channel.send(`${megaphone}  ------  Question #${info.round}  ------  ${dummy}\n${question}\n\n`)
    
    getAnswer(guild, entries[0], question)
    getAnswer(guild, entries[1], question)
    getAnswer(guild, entries[2], question)
    getAnswer(guild, entries[3], question)

    setTimeout(async() => {
        const updatedEntries = await Trivia.findAll({ include: Player})

        const score_0 = await checkAnswer(updatedEntries[0].answer, fuzzyAnswers, stringency)
        const score_1 = await checkAnswer(updatedEntries[1].answer, fuzzyAnswers, stringency)
        const score_2 = await checkAnswer(updatedEntries[2].answer, fuzzyAnswers, stringency)
        const score_3 = await checkAnswer(updatedEntries[3].answer, fuzzyAnswers, stringency)
    
        if (score_0 === true) updatedEntries[0].score++, checkKnowledge(updatedEntries[0].playerId, questionNumber)
        if (score_1 === true) updatedEntries[1].score++, checkKnowledge(updatedEntries[1].playerId, questionNumber)
        if (score_2 === true) updatedEntries[2].score++, checkKnowledge(updatedEntries[2].playerId, questionNumber)
        if (score_3 === true) updatedEntries[3].score++, checkKnowledge(updatedEntries[3].playerId, questionNumber)
    
        await updatedEntries[0].save()
        await updatedEntries[1].save()
        await updatedEntries[2].save()
        await updatedEntries[3].save()

        let name = updatedEntries[0].player.name
        let timedOut = updatedEntries[0].answer === 'no answer' ? true : false
        let answer = updatedEntries[0].answer
        let score = score_0
        channel.send(`${name}${timedOut ? ` did not answer in time. That's a shame. ${orange}` : ` said: ${answer}. ${score ? `Correct! ${cultured}` : `That ain't it! ${amongmfao}`}`}`)

        setTimeout(() => {
            let name = updatedEntries[1].player.name
            let timedOut = updatedEntries[1].answer === 'no answer' ? true : false
            let answer = updatedEntries[1].answer
            let score = score_1
            channel.send(`${name}${timedOut ? ` did not answer in time. That's a shame. ${orange}` : ` said: ${answer}. ${score ? `Correct! ${cultured}` : `That ain't it! ${amongmfao}`}`}`)
        }, 2000)

        setTimeout(() => {
            let name = updatedEntries[2].player.name
            let timedOut = updatedEntries[2].answer === 'no answer' ? true : false
            let answer = updatedEntries[2].answer
            let score = score_2
            channel.send(`${name}${timedOut ? ` did not answer in time. That's a shame. ${orange}` : ` said: ${answer}. ${score ? `Correct! ${cultured}` : `That ain't it! ${amongmfao}`}`}`)
        }, 4000)

        setTimeout(() => {
            let name = updatedEntries[3].player.name
            let timedOut = updatedEntries[3].answer === 'no answer' ? true : false
            let answer = updatedEntries[3].answer
            let score = score_3
            channel.send(`${name}${timedOut ? ` did not answer in time. That's a shame. ${orange}` : ` said: ${answer}. ${score ? `Correct! ${cultured}` : `That ain't it! ${amongmfao}`}`}`)
        }, 6000)
        
        if (!score_0 && !score_1 && !score_2 && !score_3) {
            setTimeout(() => channel.send(`The correct answer is: **${answers[0]}**`), 8000)
        }

        return setTimeout(() => postTriviaStandings(guild, channel, info, updatedEntries, questionsArr), 11000)
    }, 21000)
}

const checkAnswer = async (answer, fuzzyAnswers, stringency) => {
    const matching = fuzzyAnswers.get(answer, null, stringency) || []
	matching.sort((a, b) => b[0] - a[0])
	if (!matching[0]) return false
    else return true
}

const checkKnowledge = async (playerId, questionNumber) => {
    const count = await Knowledge.count({ where: { playerId: playerId, [questionNumber]: true } })
    if (!count) {
        const knowledge = await Knowledge.findOne({ where: { playerId: playerId } })
        knowledge[questionNumber] = true
        await knowledge.save()
    }
}

const postTriviaStandings = async (guild, channel, info, entries, questions) => {
    entries.sort((a, b) => b.score - a.score)
    const title = `${no} --- Trivia ${info.round < 10 ? `Round ${info.round}` : 'Final'} Standings --- ${yes}`
    const standings = entries.map((entry, index) => {
        const score = entry.score
        let enthusiasm = ''
        for (let i = 0; i < score; i++) enthusiasm += `${gradcap} `
        const unit = score === 1 ? 'pt' : 'pts'
       return `${index + 1}. <@${entry.playerId}> - ${score}${unit} ${enthusiasm}`
    })
    channel.send(`${title}\n${standings.join("\n")}`)

    info.round++
    await info.save()

    return setTimeout(() => {
        if (info.round <= 10) return askQuestion(guild, channel, info, entries, questions)
        else return endTrivia(guild, channel, info, entries)
    }, 10000)
}

const endTrivia = async (guild, channel, info, entries) => {
    info.status = 'pending'
    info.round = null
    await info.save()

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const score = entry.score
        const member = guild.members.cache.get(entry.playerId)
        member.roles.remove(triviaRole)

        if (score >= 3) {
            const wallet = await Wallet.findOne({ where: { playerId: entry.playerId }, include: Player })
            const reward = score - 2
            wallet.starchips += reward
            await wallet.save()
            setTimeout(() => channel.send(`<@${wallet.playerId}> was awarded ${reward}${starchips} for an impressive display of knowledge. Congratulations!`), i * 1000 + 1000)
        } else if (score < 3 && score > 0) {
            const wallet = await Wallet.findOne({ where: { playerId: entry.playerId }, include: Player })
            const reward = (score * 5)
            wallet.stardust += reward
            await wallet.save()
            setTimeout(() => channel.send(`<@${wallet.playerId}> was awarded ${reward}${stardust} for their effort. Thanks for playing!`), i * 1000 + 1000)
        } 

        let correct_answers = 0
        const knowledge = await Knowledge.findOne({ where: { playerId: entry.playerId }})
        const knowledge_keys = Object.keys(knowledge.dataValues)
        knowledge_keys.forEach(function(key) {
            if (key.startsWith('question') && knowledge[key] === true) correct_answers++
        })

        completeTask(channel, entry.playerId, 'e11', i * 2000 + 2000)
        if (correct_answers >= 20) completeTask(channel, entry.playerId, 'm9', i * 2000 + 2000)
        if (correct_answers >= 50) completeTask(channel, entry.playerId, 'h7', i * 2000 + 2000)
        if (correct_answers >= 200) completeTask(channel, entry.playerId, 'l5', i * 2000 + 2000)
        await entry.destroy()
    }
}

const resetTrivia = async (info, entries) => {
    info.status = 'pending'
    info.round = null
    await info.save()
    const guild = client.guilds.cache.get("842476300022054913")

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const member = guild.members.cache.get(entry.playerId)
        member.roles.remove(triviaRole)
        entry.active = false
        entry.score = 0
        await entry.save()
    }
}

module.exports = {
    askQuestion,
    resetTrivia,
    startTrivia
}
