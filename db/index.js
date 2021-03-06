const { db, db2 } = require('./db')

const Arena = require('./arena')
const Auction = require('./auction')
const Bid = require('./bid')
const Binder = require('./binder')
const Card = require('./card')
const Daily = require('./daily')
const Diary = require('./diary')
const Draft = require('./draft')
const Entry = require('./entry')
const Gauntlet = require('./gauntlet')
const Info = require('./info')
const Inventory = require('./inventory')
const Knowledge = require('./knowledge')
const Match = require('./match')
const Nickname = require('./nickname')
const Player = require('./player')
const Pool = require('./pool')
const Print = require('./print')
const Profile = require('./profile')
const Reset = require('./reset')
const Set = require('./set')
const Status = require('./status')
const Tournament = require('./tournament')
const Trade = require('./trade')
const Trivia = require('./trivia')
const Wallet = require('./wallet')
const Wishlist = require('./wishlist')

Entry.belongsTo(Player)
Player.hasOne(Entry)

Set.hasMany(Print)
Print.belongsTo(Set)

Player.hasOne(Wallet)
Wallet.belongsTo(Player)

Player.hasOne(Diary)
Diary.belongsTo(Player)

Player.hasMany(Bid)
Bid.belongsTo(Player)

Auction.hasMany(Bid)
Bid.belongsTo(Auction)

Player.hasMany(Inventory)
Inventory.belongsTo(Player)

Player.hasMany(Reset)
Reset.belongsTo(Player)

Print.hasMany(Inventory)
Inventory.belongsTo(Print)

Print.hasMany(Auction)
Auction.belongsTo(Print)

Print.hasMany(Pool)
Pool.belongsTo(Print)

Tournament.hasMany(Entry)
Entry.belongsTo(Tournament)

Player.hasOne(Arena)
Arena.belongsTo(Player)

Player.hasOne(Gauntlet)
Gauntlet.belongsTo(Player)

Player.hasOne(Trivia)
Trivia.belongsTo(Player)

Player.hasOne(Draft)
Draft.belongsTo(Player)

Player.hasMany(Knowledge)
Knowledge.belongsTo(Player)

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
  Arena,
  Auction,
  Bid,
  Binder,
  Card,
  Daily,
  Diary,
  Draft,
  Entry,
  Gauntlet,
  Info,
  Inventory,
  Knowledge,
  Match,
  Nickname,
  Player,
  Pool,
  Print,
  Profile,
  Reset,
  Set,
  Status,
  Tournament,
  Trade,
  Trivia,
  Wallet,
  Wishlist
}
