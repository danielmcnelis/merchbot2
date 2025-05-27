import { Sequelize } from 'sequelize'
import {db} from './db.js'
import { customAlphabet } from 'nanoid'

export const Player = db.define('players', {
    id: {
        type: Sequelize.STRING,
        primaryKey: true,
        unique: true
    },
    name: {
      type: Sequelize.STRING
    },
    email: {
      type: Sequelize.STRING
    },
    alternateEmail: {
      type: Sequelize.STRING
    },
    pfp: {
      type: Sequelize.STRING
    },
    discordName: {
      type: Sequelize.STRING
    },
    globalName: {
      type: Sequelize.STRING
    },
    discordId: {
      type: Sequelize.STRING
    },
    discordPfp: {
      type: Sequelize.STRING
    },
    googleId: {
      type: Sequelize.STRING
    },
    googlePfp: {
      type: Sequelize.TEXT
    },
    duelingBookName: {
      type: Sequelize.STRING
    },
    duelingBookPfp: {
      type: Sequelize.STRING
    },
    firstName: {
      type: Sequelize.STRING
    },
    lastName: {
      type: Sequelize.STRING
    },
    country: {
      type: Sequelize.STRING
    },
    timeZone: {
      type: Sequelize.STRING
    },
    hash: {
      type: Sequelize.STRING
    },
    isAdmin: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    isContentManager: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    isCreator: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    triviaWins: {
      type: Sequelize.INTEGER
    },
    isSubscriber: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    subscriberTier: {
      type: Sequelize.STRING
    },
    isHidden: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    youtube: {
        type: Sequelize.STRING
    },
    twitch: {
        type: Sequelize.STRING
    },
    twitter: {
        type: Sequelize.STRING
    },
    isForgedSubscriber: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    forgedSubscriberTier: {
      type: Sequelize.STRING
    }
  })

  Player.findById = (id) => Player.findOne({ where: { id: id }})
  
  Player.findByDiscordId = (id) => Player.findOne({ where: { discordId: id }})

    Player.generateId = async () => {
        const base58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
        const id = customAlphabet(base58, 22)()
        return id
    }