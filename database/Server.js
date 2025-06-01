import { Sequelize } from 'sequelize'
import { db } from './db'

export const Server = db.define('servers', {
  id: {
    primaryKey: true,
    type: Sequelize.STRING
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  communityName: {
    type: Sequelize.STRING
  },
  access: {
    type: Sequelize.STRING,
    defaultValue: 'free'
  },
  formatName: {
    type: Sequelize.STRING
  },
  formatId: {
    type: Sequelize.INTEGER
  },
  hasInternalLadder: {
    type: Sequelize.BOOLEAN
  },
  size: {
    type: Sequelize.INTEGER
  },
  ownerId: {
    type: Sequelize.STRING
  },
  logo: {
    type: Sequelize.STRING
  },
  challongeApiKey: {
      type: Sequelize.STRING
  },
  challongeSubdomain: {
      type: Sequelize.STRING
  },
  welcomeChannelId: {
      type: Sequelize.STRING
  },
  botSpamChannelId: {
      type: Sequelize.STRING
  },
  adminRoleId: {
      type: Sequelize.STRING
  },
  moderatorRoleId: {
      type: Sequelize.STRING
  },
  judgeRoleId: {
      type: Sequelize.STRING
  },
  tournamentRoleId: {
      type: Sequelize.STRING
  },
  inviteLink: {
    type: Sequelize.STRING
  },
  discordIconId: {
    type: Sequelize.STRING
  },
  logoName: {
    type: Sequelize.STRING
  },
  hasRatedPermission: {
    type: Sequelize.BOOLEAN
  }
})

Server.findById = async (id) => await Server.findOne({ where: { id }})

Server.findOrCreateByIdOrName = async (id, name) => {
    const [server] = await Server.findOrCreate({ where: { id, name }})
    return server
}