const { blue, red, stoned, stare, wokeaf, koolaid, cavebob, evil, DOC, merchant, FiC, approve, lmfao, god, legend, master, diamond, platinum, gold, silver, bronze, ROCK, sad, mad, beast, dragon, machine, spellcaster, warrior, zombie, starchips, stardust, com, rar, sup, ult, scr, checkmark, emptybox } = require('../static/emojis.json')
const { yescom } = require('../static/commands.json')
const { capitalize } = require('./utility')

const askForGrindAllConfirmation = async (message, index = 0) => {
    const prompts = [
        `Are you sure you want to grind everyone's ${starchips}s into ${stardust}?`,
        `${capitalize(message.author.username)}, Listen pal. Hold on just a moment there. Are you sure you **ABSOLUTELY CERTAIN** you want to grind everyone's ${starchips}s into ${stardust}?`,
        `So this isn't cyber bullying rite now.` +
        `\n\nFr` +
        `\nWho tf is <@${message.author.id}>` +
        `\n\nHe's never ben involved in fkn anything untill now.` +
        `\n\nThis really isn't fair.` +
        `\n\nFolks just hoppin on for no reason` +
        `\n\nU sure u wanna ground up everyones ${starchips} brah?` +
        `\n\nMake em all n2 ${stardust}?` +
        `\n\nCuz that's wack`,
        `Mr. <@${message.author.id}>.\nMR. <@${message.author.id}>.\n\nThis is the FINAL prompt. If you answer "y" you are DONE.\n\nAre you 100%, no, NO, **1000%** sure you *WANT* to **GRIND EVERYONE'S** ${starchips}s into ${stardust}???`
    ]
	const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`${prompts[index]}`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
        const response = collected.first().content.toLowerCase()
		if (yescom.includes(response)) return true
        else {
            message.channel.send(`Not a problem. Have a nice day.`)
            return false
        }
	}).catch(err => {
		console.log(err)
		message.channel.send(`Sorry, time's up.`)
        return false
	})

    return collected
}

module.exports = {
    askForGrindAllConfirmation
}
