
const Sequelize = require('sequelize')
const {db} = require('./db')

const Pool = db.define('pool', {
    pack_code: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    card_code: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    card_name: {
        type: Sequelize.TEXT,
        allowNull: false
    }
})

module.exports = Pool

