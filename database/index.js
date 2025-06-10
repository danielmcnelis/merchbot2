
import { db } from './db.js'
import { ArenaEntry } from './ArenaEntry.js'
import { ArenaProfile } from './ArenaProfile.js'
import { Auction } from './Auction.js'
import { Bid } from './Bid.js'
import { Binder } from './Binder.js'
import { Card } from './Card.js'
import { Daily } from './Daily.js'
import { Deck } from './Deck.js'
import { DeckType } from './DeckType.js'
import { Entry } from './Entry.js'
import { Event } from './Event.js'
import { ForgedInventory } from './ForgedInventory.js'
import { ForgedPrint } from './ForgedPrint.js'
import { ForgedSet } from './ForgedSet.js'
import { Server } from './Server.js'
import { Stats } from './Stats.js'
import { Status } from './Status.js'
import { Info } from './Info.js'
import { Match } from './Match.js'
import { Matchup } from './Matchup.js'
import { Player } from './Player.js'
import { Pool } from './Pool.js'
import { Proposal } from './Proposal.js'
import { Replay } from './Replay.js'
import { Tournament } from './Tournament.js'
import { Trade } from './Trade.js'
import { Wallet } from './Wallet.js'
import { Wishlist } from './Wishlist.js'

Card.hasMany(ForgedPrint)
ForgedPrint.belongsTo(Card)

Card.hasMany(Status)
Status.belongsTo(Card)

ArenaProfile.belongsTo(Player)
Player.hasOne(ArenaProfile)

ArenaEntry.belongsTo(Player)
Player.hasOne(ArenaEntry)

Entry.belongsTo(Player)
Player.hasOne(Entry)

ForgedSet.hasMany(ForgedPrint)
ForgedPrint.belongsTo(ForgedSet)

Player.hasOne(Wallet)
Wallet.belongsTo(Player)

Player.hasMany(Bid)
Bid.belongsTo(Player)

Auction.hasMany(Bid)
Bid.belongsTo(Auction)

Player.hasMany(ForgedInventory)
ForgedInventory.belongsTo(Player)

ForgedPrint.hasMany(Bid)
Bid.belongsTo(ForgedPrint)

ForgedPrint.hasMany(Wishlist)
Wishlist.belongsTo(ForgedPrint)

ForgedPrint.hasMany(Binder)
Binder.belongsTo(ForgedPrint)

ForgedPrint.hasMany(ForgedInventory)
ForgedInventory.belongsTo(ForgedPrint)

ForgedPrint.hasMany(Auction)
Auction.belongsTo(ForgedPrint)

Tournament.hasMany(Entry)
Entry.belongsTo(Tournament)

Player.hasOne(Daily)
Daily.belongsTo(Player)

Player.hasOne(Binder)
Binder.belongsTo(Player)

Player.hasOne(Wishlist)
Wishlist.belongsTo(Player)

Stats.belongsTo(Player)
Player.hasMany(Stats)

Stats.belongsTo(Server)
Server.hasMany(Stats)

export {
  db,
  ArenaEntry,
  ArenaProfile,
  Auction,
  Bid,
  Binder,
  Card,
  Daily,
  Deck,
  DeckType,
  Entry,
  Event,
  ForgedInventory,
  ForgedPrint,
  ForgedSet,
  Server,
  Stats,
  Status,
  Info,
  Match,
  Matchup,
  Player,
  Pool,
  Proposal,
  Replay,
  Tournament,
  Trade,
  Wallet,
  Wishlist
}
