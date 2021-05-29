
const Sequelize = require('sequelize')
const {db} = require('./db')

const Print = db.define('print', {
  card_name: {
    type: Sequelize.STRING,
    allowNull: true
  },
  card_id: {
    type: Sequelize.STRING,
    allowNull: true
  },
  set_code: {
    type: Sequelize.STRING,
    allowNull: true
  },
  card_slot: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  card_code: {
    type: Sequelize.STRING,
    allowNull: true
  },
  rarity: {
    type: Sequelize.STRING,
    allowNull: true
  },
  market_price: {
    type: Sequelize.FLOAT,
    defaultValue: 10.00,
    allowNull: false
  }
})

module.exports = Print
