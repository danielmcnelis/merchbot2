
const { Auction, Bid, Card, Match, Player, Tournament, Print, Set, Wallet, Diary, Inventory, Arena, Trivia, Keeper, Gauntlet, Draft, Daily, Binder, Wishlist, Profile, Info } = require('../db')
const { yescom } = require('../static/commands.json')


const getNewStatus = async (message, card, old_status) => {
    const options = ["do not change", "forbidden", "limited", "semi-limited", "unlimited"]
    const filteredOptions = []

    for (let i = 0; i < options.length; i++) {
        const option = options[i]
        if (option === old_status) continue
        filteredOptions.push(`(${filteredOptions.length + 1}) ${option}`)
    }

    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send({ content: `${card.name} is currently ${old_status}. Please select a new status:\n${filteredOptions.join("\n")}`})
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 30000
	}).then(collected => {
		const response = collected.first().content.toLowerCase()
        let index
        if(response.includes('1')) {
            index = 0
        } else if(response.includes('2')) {
            index = 1
        } else if(response.includes('3')) {
            index = 2
        } else if(response.includes('4')) {
            index = 3
        } else {
            message.channel.send({ content: `You did not select a valid option.`})
            return false
        }

        const selected_option = filteredOptions[index]
        return selected_option.slice(4)
	}).catch(err => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
	})

    return collected
} 

module.exports = {
	getNewStatus
}