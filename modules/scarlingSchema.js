const mongoose = require('mongoose');

const scarlingSchema = new mongoose.Schema({
  // Basic identification for the scarling within a specific guild and channel.
  guildId: { type: String, required: true, index: true },
  channelId: { type: String, required: true },

  // Core level and status.
  level: { type: Number, default: 1 },
  status: { type: String, enum: ['active', 'defeated', 'fled'], default: 'active' },

  // Health and combat stats.
  maxHP: { type: Number, default: 100 },
  currentHP: { type: Number, default: 100 },
  attack: { type: Number, default: 10 },
  defense: { type: Number, default: 5 },
  agility: { type: Number, default: 5 },

  // Special abilities (names or codes for special moves or effects).
  abilities: { type: [String], default: [] },

  // Rewards for defeating this scarling.
  xpReward: { type: Number, default: 50 },
  pointsReward: { type: Number, default: 5 },

  // Elite flag: an elite scarling might be stronger and grant higher rewards.
  isElite: { type: Boolean, default: false },

  // Modifiers can be used to store temporary buffs/debuffs (e.g., bonusDamage, bonusDefense).
  modifiers: {
    type: Map,
    of: Number,
    default: { bonusDamage: 0, bonusDefense: 0 }
  },

  // Conditions (like "poisoned", "stunned", etc.) currently affecting the scarling.
  conditions: { type: [String], default: [] },

  // Battle history: records of individual encounters with this scarling.
  battleHistory: [{
    outcome: { type: String, enum: ['victory', 'defeat', 'counterattacked', 'escaped'], default: 'escaped' },
    damageTaken: { type: Number, default: 0 },
    damageDealt: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
  }],

  // Timestamps to track when the scarling spawned and was last updated.
  spawnedAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },

  // Optional: Additional properties for dynamic events, such as a temporary buff or debuff.
  dynamicEvents: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Scarling', scarlingSchema);