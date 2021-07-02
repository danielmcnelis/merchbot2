
const Sequelize = require('sequelize')
const {db} = require('./db')

const Trivia = db.define('trivia', {
    active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    score: {
        type: Sequelize.INTEGER,
        defaultValue: 0,        
        allowNull: false
    },
    answer: {
        type: Sequelize.TEXT,
        defaultValue: '',        
        allowNull: false
    }
})

module.exports = Trivia

