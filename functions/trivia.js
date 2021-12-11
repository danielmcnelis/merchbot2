
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

const startTrivia = async () => {
    const channel = client.channels.cache.get(triviaChannelId)
    channel.send(`Trivia players, please check your DMs!`)
    const entries = await Trivia.findAll({ include: Player })

    for (let i = 0; i < entries.length; i++) {
        getTriviaConfirmation(entries[i])
    }

    const all_questions = Object.entries(trivia)
    const questions = getRandomSubset(all_questions, 10)
    const info = await Info.findOne({ where: { element: 'trivia' }})

    for (let i = 1; i < 12; i ++) {
        setTimeout(async () => {
            const count = await Trivia.count({ where: { active: true }})
            const active = await Info.count({ where: { element: 'trivia', status: 'active' }})

            if (count >= 4 && !active) {
                const missing_entries = await Trivia.findAll({ where: { active: false }, include: Player })
                for (let i = 0; i < missing_entries.length; i++) {
                    const entry = missing_entries[i]
                    await entry.destroy()
                }
            
                info.round = 1
                info.status = 'active'
                await info.save()
                assignTriviaRoles(entries)
                setTimeout(() => {
                    channel.send(`<@&${triviaRole}>, look alive bookworms! Trivia starts in 10 seconds. ${wut}\n\nP.S. Remember: answer questions **in your DMs**.`)
                }, 1000)
                return setTimeout(() => {
                    return askQuestion(info, questions)
                }, 11000)
            }
        }, i * 5000)
    }

    setTimeout(async () => {
        const count = await Trivia.count({ where: { active: true }})
        const active = await Info.count({ where: { element: 'trivia', status: 'active' }})

        if (count < 4 && !active) {
            const missing_entries = await Trivia.findAll({ 
                where: { 
                    active: false
                },
                include: Player
            })

            await resetTrivia(info, entries)

            const names = missing_entries.map((entry) => entry.player.name)

            for (let i = 0; i < missing_entries.length; i++) {
                const entry = missing_entries[i]
                await entry.destroy()
            }
            
            return channel.send(`Unfortunately, Trivia cannot begin without 4 players.\n\nThe following players have been removed from the queue:\n${names.sort().join("\n")}`)
        } else if (count >= 4 && !active) {
            const missing_entries = await Trivia.findAll({ where: { active: false }, include: Player })
            for (let i = 0; i < missing_entries.length; i++) {
                const entry = missing_entries[i]
                await entry.destroy()
            }

            info.round = 1
            info.status = 'active'
            await info.save()
            assignTriviaRoles(entries)
            setTimeout(() => {
                channel.send(`<@&${triviaRole}>, look alive bookworms! Trivia starts in 10 seconds. ${wut}\n\nP.S. Remember: answer questions **in your DMs**.`)
            }, 1000)
            return setTimeout(() => {
                return askQuestion(info, questionsArr)
            }, 11000)
        }
    }, 61000)
}

const getTriviaConfirmation = async (trivia_entry) => {
    const guild = client.guilds.cache.get("842476300022054913")
    const channel = client.channels.cache.get(triviaChannelId)
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
            member.send(`Thanks! Trivia will be starting very soon.`)
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


const getAnswer = async (entry, question, round) => {
    const guild = client.guilds.cache.get("842476300022054913")
    const playerId = entry.playerId
    const member = guild.members.cache.get(playerId)
    if (!member || playerId !== member.user.id) return
    const filter = m => m.author.id === playerId
	const msg = await member.send(`${megaphone}  ------  Question #${round}  ------  ${dummy}\n${question}`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 20000
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

const assignTriviaRoles = (entries) => {    
    const guild = client.guilds.cache.get("842476300022054913")
    entries.forEach((entry) => {
        const member = guild.members.cache.get(entry.playerId)
        member.roles.add(triviaRole)
    })
}

const askQuestion = async (info, questionsArr) => {
    const channel = client.channels.cache.get(triviaChannelId)
    const questionNumber = questionsArr[info.round - 1][0]
    const { question, answers, stringency } = questionsArr[info.round - 1][1]
	let fuzzyAnswers = FuzzySet([], false)
    answers.forEach((a) =>  fuzzyAnswers.add(a))

    channel.send(`${megaphone}  ------  Question #${info.round}  ------  ${dummy}\n${question}\n\n`)
    
    const entries = await Trivia.findAll({ include: Player })
    entries.forEach((entry) => {
        getAnswer(entry, question, info.round)
    })

    setTimeout(async() => {
        const updatedEntries = await Trivia.findAll({ include: Player})
        let atLeastOneCorrect = false

        for (let i = 0; i < updatedEntries.length; i++) {
            const entry = updatedEntries[i]
            const score = await checkAnswer(entry.answer, fuzzyAnswers, stringency)
            if (score === true) { 
                atLeastOneCorrect = true
                entry.score++
                await checkKnowledge(entry.playerId, questionNumber)
            }

            await entry.save()

            setTimeout(() => {
                const name = entry.player.name
                const timedOut = entry.answer === 'no answer' ? true : false
                const answer = entry.answer
                channel.send(`${name}${timedOut ? ` did not answer in time. That's a shame. ${orange}` : ` said: ${answer}. ${score ? `Correct! ${cultured}` : `That ain't it! ${amongmfao}`}`}`)
            }, i * 2000)
        }
        
        if (!atLeastOneCorrect) {
            setTimeout(() => channel.send(`The correct answer is: **${answers[0]}**`), updatedEntries.length * 2000)
        }

        return setTimeout(() => postTriviaStandings(info, updatedEntries, questionsArr), updatedEntries.length * 2000 + 3000)
    }, 22000)
}

const checkAnswer = async (answer, fuzzyAnswers, stringency) => {
    const matching = fuzzyAnswers.get(answer, null, stringency) || []
	matching.sort((a, b) => b[0] - a[0])
	if (!matching[0]) return false
    else return true
}

const checkKnowledge = async (playerId, questionNumber) => {
    const question = questionNumber.slice(questionNumber.indexOf("_") + 1)
    const count = await Knowledge.count({ where: { question: question, playerId: playerId } })
    if (!count) {
        await Knowledge.create({ 
            question: question, 
            playerId: playerId
        })
    }
}

const postTriviaStandings = async (info, entries, questions) => {
    const channel = client.channels.cache.get(triviaChannelId)
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
        if (info.round <= 10) return askQuestion(info, questions)
        else return endTrivia(info, entries)
    }, 10000)
}

const endTrivia = async (info, entries) => {
    const guild = client.guilds.cache.get("842476300022054913")
    const channel = client.channels.cache.get(triviaChannelId)
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

        const correct_answers = await Knowledge.count({ where: { playerId: entry.playerId }})
        completeTask(channel, entry.playerId, 'e11', i * 2000 + 2000)
        if (correct_answers >= 20) completeTask(channel, entry.playerId, 'm9', i * 2000 + 2000)
        if (correct_answers >= 50) completeTask(channel, entry.playerId, 'h7', i * 2000 + 2000)
        if (correct_answers >= 200) completeTask(channel, entry.playerId, 'l5', i * 2000 + 2000)
        await entry.destroy()
    }
}

const resetTrivia = async (info, entries) => {
    const guild = client.guilds.cache.get("842476300022054913")

    info.status = 'pending'
    info.round = null
    await info.save()

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
    endTrivia,
    resetTrivia,
    startTrivia
}
