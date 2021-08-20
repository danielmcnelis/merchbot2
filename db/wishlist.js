
const Sequelize = require('sequelize')
const {db} = require('./db')

const Wishlist = db.define('wishlist', {
    slot_1: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    slot_2: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    slot_3: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    slot_4: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    slot_5: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    slot_6: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    slot_7: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    slot_8: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    slot_9: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    slot_10: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    slot_11: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    slot_12: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    slot_13: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    slot_14: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    slot_15: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    slot_16: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    slot_17: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    slot_18: {
        type: Sequelize.TEXT,
        allowNull: true
    }
})

module.exports = Wishlist