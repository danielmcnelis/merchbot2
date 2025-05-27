
import secrets from '../secrets.json' with { type: "json" } 
const {discordBotToken} = secrets
import { Client, GatewayIntentBits } from 'discord.js'

const client = new Client({ 
    intents: [ 
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions, 
        GatewayIntentBits.DirectMessages
    ],
    partials: [
        'MESSAGE',
        'CHANNEL',
        'REACTION',
        'GUILD_MEMBER',
        'USER'
    ]
})

client.login(discordBotToken)

export { client }