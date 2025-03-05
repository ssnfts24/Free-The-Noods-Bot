const mongoose = require('mongoose');

// Advanced schema for individual inventory items
const inventoryItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  // Optional: Define item effects as a map, e.g., { "luck": 0.1 } for a 10% luck bonus.
  effects: { type: Map, of: Number, default: {} }
}, { _id: false });

// Schema to track individual battle outcomes
const battleHistorySchema = new mongoose.Schema({
  outcome: { type: String, enum: ['victory', 'defeat', 'timeout'], required: true },
  pointsEarned: { type: Number, default: 0 },
  rescuedNoods: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

// Main Player schema
const playerSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true },
  points: { type: Number, default: 0 },
  rescuedNoods: { type: Number, default: 0 },
  
  // RPG progression fields
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  // Health stats for battle calculations (could be dynamic per battle)
  health: { type: Number, default: 100 },
  maxHealth: { type: Number, default: 100 },
  
  // Attributes that can affect battle outcomes
  attributes: {
    strength: { type: Number, default: 10 },
    agility: { type: Number, default: 10 },
    luck: { type: Number, default: 10 }
  },
  
  // Array of inventory items with enhanced properties
  inventory: [inventoryItemSchema],
  
  // List of achievement identifiers the player has earned
  achievements: { type: [String], default: [] },
  
  // Record of past battles for tracking performance and analytics
  battleHistory: [battleHistorySchema],
  
  // Timestamp for when the player was last active (useful for cooldowns, rewards, etc.)
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);