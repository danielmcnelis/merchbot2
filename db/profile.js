
const Sequelize = require('sequelize')
const {db} = require('./db')

const Profile = db.define('profile', {
    start_date: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    first_deck: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    favorite_card: {
        type: Sequelize.STRING,
        allowNull: true
    },
    favorite_color: {
        type: Sequelize.STRING,        
        allowNull: true
    },
    quote: {
        type: Sequelize.TEXT,  
        defaultValue: `My grandpa's deck has no pathetic cards.`,      
        allowNull: true
    },
    author: {
        type: Sequelize.STRING,     
        defaultValue: `Yugi`,         
        allowNull: true
    },
    referral: {
        type: Sequelize.BOOLEAN,  
        defaultValue: false,
        allowNull: false
    }
})

module.exports = Profile

