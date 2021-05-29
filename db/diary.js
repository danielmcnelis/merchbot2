
const Sequelize = require('sequelize')
const {db} = require('./db')

const Diary = db.define('diary', {
    e1: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    e2: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    e3: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    e4: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    e5: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    e6: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    e7: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    e8: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    e9: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    e10: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    e11: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    e12: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    m1: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    m2: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    m3: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    m4: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    m5: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    m6: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    m7: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    m8: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    m9: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    m10: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    h1: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    h2: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    h3: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    h4: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    h5: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    h6: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    h7: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    h8: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    l1: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    l2: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    l3: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    l4: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    l5: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    l6: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    s1: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    s2: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    s3: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    s4: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
})

module.exports = Diary

