
import { Sequelize } from 'sequelize'
import {db} from './db.js'

export const ForgedPrint = db.define('forgedPrints', {
  cardName: {
    type: Sequelize.STRING,
    allowNull: true
  },
  cardId: {
    type: Sequelize.STRING,
    allowNull: true
  },
  forgedSetCode: {
    type: Sequelize.STRING,
    allowNull: true
  },
  cardSlot: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  cardCode: {
    type: Sequelize.STRING,
    allowNull: true,
    unique: true
  },
  rarity: {
    type: Sequelize.STRING,
    allowNull: true
  },
  marketPrice: {
    type: Sequelize.FLOAT,
    defaultValue: 10.00,
    allowNull: false
  },
  trendingUp: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: true
  },
  trendingDown: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: true
  }
})
