
import { Sequelize } from 'sequelize'
import {db} from './db.js'

export const Card = db.define('cards', {
    name: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },
    cleanName: {
      type: Sequelize.STRING,
      unique: true
    },
    konamiCode: {
      type: Sequelize.STRING
    },
    ypdId: {
      type: Sequelize.STRING
    },
    artworkId: {
      type: Sequelize.STRING
    },
    isTcgLegal: {
      type: Sequelize.BOOLEAN
    },
    isOcgLegal: {
      type: Sequelize.BOOLEAN
    },
    isSpeedLegal: {
      type: Sequelize.BOOLEAN
    },
    category: {
      type: Sequelize.STRING
    },
    icon: {
      type: Sequelize.STRING
    },
    isNormal: {
      type: Sequelize.BOOLEAN
    },
    isEffect: {
      type: Sequelize.BOOLEAN
    },
    isFusion: {
      type: Sequelize.BOOLEAN
    },
    isRitual: {
      type: Sequelize.BOOLEAN
    },
    isSynchro: {
      type: Sequelize.BOOLEAN
    },
    isXyz: {
      type: Sequelize.BOOLEAN
    },
    isPendulum: {
      type: Sequelize.BOOLEAN
    },
    isLink: {
      type: Sequelize.BOOLEAN
    },
    isFlip: {
      type: Sequelize.BOOLEAN
    },
    isGemini: {
      type: Sequelize.BOOLEAN
    },
    isSpirit: {
      type: Sequelize.BOOLEAN
    },
    isToon: {
      type: Sequelize.BOOLEAN
    },
    isTuner: {
      type: Sequelize.BOOLEAN
    },
    isUnion: {
      type: Sequelize.BOOLEAN
    },
    attribute: {
      type: Sequelize.STRING
    },
    type: {
      type: Sequelize.STRING
    },
    level: {
      type: Sequelize.INTEGER
    },
    rating: {
      type: Sequelize.INTEGER
    },
    arrows: {
      type: Sequelize.STRING
    },
    scale: {
      type: Sequelize.INTEGER
    },
    atk: {
      type: Sequelize.STRING
    },
    def: {
      type: Sequelize.STRING
    },
    pendulumEffect: {
      type: Sequelize.TEXT
    },
    description: {
      type: Sequelize.TEXT
    },
    tcgDate: {
      type: Sequelize.STRING
    },
    ocgDate: {
      type: Sequelize.STRING
    },
    speedDate: {
      type: Sequelize.STRING
    },
    color: {
      type: Sequelize.STRING
    },
    isExtraDeck: {
      type: Sequelize.BOOLEAN
    },
    sortPriority: {
      type: Sequelize.INTEGER
    }
})

