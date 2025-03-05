const mongoose = require('mongoose');

// Schema for an individual inventory item.
const inventoryItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  rarity: {
    type: String,
    default: 'common',
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary']
  },
  nonTradeable: { type: Boolean, default: false },
  effects: { type: Map, of: Number, default: {} }
}, { _id: false });

// Main Player Schema for the bot.
const playerSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true },
  points: { type: Number, default: 0 },
  rescuedNoods: { type: Number, default: 0 },
  
  // RPG progression fields.
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  
  // Health fields for battle simulation.
  health: { type: Number, default: 100 },
  maxHealth: { type: Number, default: 100 },
  
  // Player attributes that can influence battles.
  attributes: {
    strength: { type: Number, default: 10 },
    agility: { type: Number, default: 10 },
    luck: { type: Number, default: 10 }
  },
  
  // Inventory of items.
  inventory: [inventoryItemSchema],
  
  // List of achievement IDs the player has earned.
  achievements: { type: [String], default: [] },
  
  // Battle history records for analytics.
  battleHistory: [{
    outcome: { type: String, enum: ['victory', 'defeat', 'counterattacked', 'escaped'], default: 'escaped' },
    damageTaken: { type: Number, default: 0 },
    damageDealt: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Timestamps for activity.
  lastActive: { type: Date, default: Date.now },
  lastDaily: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
