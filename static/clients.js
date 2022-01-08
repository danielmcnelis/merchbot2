
const { discordBotToken} = require('../secrets.json')
const { Client, Intents } = require('discord.js')
const client = new Client({ 
    intents: [ 
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_MEMBERS, 
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MESSAGES, 
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.DIRECT_MESSAGES
    ] 
})

client.login(discordBotToken)

module.exports = {
    client
}