
const Sequelize = require('sequelize')
const {db} = require('./db')

const Set = db.define('set', {
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
  emoji_1: {
    type: Sequelize.STRING,
    allowNull: false
  },
  emoji_2: {
    type: Sequelize.STRING,
    allowNull: false
  },
  set_size: {
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
  for_sale: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  specs_for_sale: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  unit_price: {
    type: Sequelize.INTEGER,
    defaultValue: 15,
    allowNull: false
  },
  cards_per_pack: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  box_price: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  packs_per_box: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  spec_price: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  packs_per_spec: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  commons_per_pack: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  rares_per_pack: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  supers_per_pack: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  ultras_per_pack: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  secrets_per_pack: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  commons_per_box: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  rares_per_box: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  supers_per_box: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  ultras_per_box: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  secrets_per_box: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  },
  specs_per_spec: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    allowNull: true
  }
})

module.exports = Set
