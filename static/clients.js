
const Discord = require('discord.js')
const { discordBotToken} = require('../secrets.json')
const client = new Discord.Client()
client.login(discordBotToken)

module.exports = {
    client
}