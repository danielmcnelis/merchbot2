
import { Sequelize } from 'sequelize'
import {db} from './db.js'

export const ForgedSet = db.define('forgedSets', {
  code: {
    type: Sequelize.STRING,
    allowNull: false
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  type: {
    type: Sequelize.STRING,
    defaultValue: "core",
    allowNull: false
  },
  emoji: {
    type: Sequelize.STRING,
    allowNull: false
  },
  altEmoji: {
    type: Sequelize.STRING,
    allowNull: false
  },
  size: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  commons: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  rares: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  supers: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  ultras: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  secrets: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  specials: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  currency: {
    type: Sequelize.STRING,
    defaultValue: "starchips",
    allowNull: false
  },
  forSale: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  specsForSale: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  unitPrice: {
    type: Sequelize.INTEGER,
    defaultValue: 15,
    allowNull: false
  },
  unitSales: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  cardsPerPack: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  boxPrice: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  packsPerBox: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  specPrice: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  packsPerSpec: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  commonsPerPack: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  raresPerPack: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  supersPerPack: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  ultrasPerPack: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  secretsPerPack: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  commonsPerBox: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  raresPerBox: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  supersPerBox: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  ultrasPerBox: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  secretsPerBox: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  specsPerSpec: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  }
})