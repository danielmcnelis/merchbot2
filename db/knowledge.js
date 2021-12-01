
const Sequelize = require('sequelize')
const {db} = require('./db')

const Knowledge = db.define('knowledge', {
    question: {
        type: Sequelize.TEXT,  
        defaultValue: false
    }
})

module.exports = Knowledge

