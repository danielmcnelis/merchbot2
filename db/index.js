const { db, db2 } = require('./db')

const Card = require('./card')
const Match = require('./match')
const Trade = require('./trade')
const Player = require('./player')
const Tournament = require('./tournament')
const Print = require('./print')
const Set = require('./set')
const Wallet = require('./wallet')
const Diary = require('./diary')
const Inventory = require('./inventory')
const Arena = require('./arena')
const Trivia = require('./trivia')
const Keeper = require('./keeper')
const Gauntlet = require('./gauntlet')
const Draft = require('./draft')
const Daily = require('./daily')
const Binder = require('./binder')
const Wishlist = require('./wishlist')
const Profile = require('./profile')

Tournament.belongsTo(Player)
Player.hasOne(Tournament)

Set.hasMany(Print)
Print.belongsTo(Set)

Player.hasOne(Wallet)
Wallet.belongsTo(Player)

Player.hasOne(Diary)
Diary.belongsTo(Player)

Player.hasMany(Inventory)
Inventory.belongsTo(Player)

Print.hasMany(Inventory)
Inventory.belongsTo(Print)

Player.hasOne(Arena)
Arena.belongsTo(Player)

Player.hasOne(Trivia)
Trivia.belongsTo(Player)

Player.hasOne(Keeper)
Keeper.belongsTo(Player)

Player.hasOne(Gauntlet)
Gauntlet.belongsTo(Player)

Player.hasOne(Draft)
Draft.belongsTo(Player)

Player.hasOne(Daily)
Daily.belongsTo(Player)

Player.hasOne(Binder)
Binder.belongsTo(Player)

Player.hasOne(Wishlist)
Wishlist.belongsTo(Player)

Player.hasOne(Profile)
Profile.belongsTo(Player)

module.exports = {
  db,
  db2,
  Card,
  Match,
  Trade,
  Player,
  Tournament,
  Print,
  Set,
  Wallet,
  Diary,
  Inventory,
  Arena,
  Trivia,
  Keeper,
  Gauntlet,
  Draft,
  Daily,
  Binder,
  Wishlist,
  Profile
}
