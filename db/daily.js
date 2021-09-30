
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
    },
    alchemy_5: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    alchemy_6: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    last_alchemy: {
        type: Sequelize.DATE,
        allowNull: true
    },
    last_box: {
        type: Sequelize.DATE,
        allowNull: true
    },
    last_wager: {
        type: Sequelize.DATE,
        allowNull: true
    },
    last_reduce: {
        type: Sequelize.DATE,
        allowNull: true
    },
    fon_packs: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    }
})

module.exports = Daily