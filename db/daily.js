
const Sequelize = require('sequelize')
const {db} = require('./db')

const Daily = db.define('daily', {
    daily_bonus: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    last_check_in: {
        type: Sequelize.DATE,
        allowNull: true
    },
    cobble_progress: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    alchemy_1: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    alchemy_2: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    alchemy_3: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    alchemy_4: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
})

module.exports = Daily