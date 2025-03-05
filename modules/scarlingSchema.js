const mongoose = require('mongoose');

const scarlingSchema = new mongoose.Schema({
  // Basic identification for the scarling within a specific guild and channel.
  guildId: { type: String, required: true, index: true },
  channelId: { type: String, required: true },

  // Core level and status.
  level: { type: Number, default: 1, min: 1 },
  status: { type: String, enum: ['active', 'defeated', 'fled'], default: 'active' },

  // Health and combat stats.
  maxHP: { type: Number, default: 100, min: 0 },
  currentHP: { type: Number, default: 100, min: 0 },
  attack: { type: Number, default: 10, min: 0 },
  defense: { type: Number, default: 5, min: 0 },
  agility: { type: Number, default: 5, min: 0 },

  // Special abilities (names or codes for special moves or effects).
  abilities: { type: [String], default: [] },

  // Rewards for defeating this scarling.
  xpReward: { type: Number, default: 50, min: 0 },
  pointsReward: { type: Number, default: 5, min: 0 },

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
  dynamicEvents: { type: [String], default: [] },

  // Advanced AI and behavior fields
  aiBehavior: { type: String, enum: ['aggressive', 'defensive', 'adaptive'], default: 'adaptive' },
  spawnChance: { type: Number, default: 0.1, min: 0, max: 1 }, // probability between 0 and 1
  strategy: { type: String, enum: ['random', 'targeted', 'balanced'], default: 'balanced' },

  // Current active buffs on the scarling (with name, bonus value, and expiration)
  currentBuffs: [{
    name: { type: String, required: true },
    value: { type: Number, required: true },
    expiresAt: { type: Date, required: true }
  }]
}, { timestamps: true });

/**
 * Virtual property to calculate the effective attack value
 * by adding the base attack, any bonus from modifiers, and active buffs.
 */
scarlingSchema.virtual('effectiveAttack').get(function() {
  let modifierBonus = this.modifiers.get('bonusDamage') || 0;
  let buffBonus = 0;
  const now = new Date();
  if (this.currentBuffs && this.currentBuffs.length) {
    this.currentBuffs.forEach(buff => {
      if (buff.expiresAt > now) buffBonus += buff.value;
    });
  }
  return this.attack + modifierBonus + buffBonus;
});

/**
 * Instance method to apply damage to the scarling.
 * Returns the updated currentHP.
 */
scarlingSchema.methods.applyDamage = function(damage) {
  this.currentHP = Math.max(this.currentHP - damage, 0);
  return this.currentHP;
};

/**
 * Instance method to check if the scarling is defeated.
 * Returns true if currentHP is zero.
 */
scarlingSchema.methods.isDefeated = function() {
  return this.currentHP <= 0;
};

/**
 * Instance method to update the scarling's status based on its health.
 */
scarlingSchema.methods.updateStatus = function() {
  if (this.isDefeated()) {
    this.status = 'defeated';
  }
  // Additional status logic can be added here (e.g., if currentHP is very low, set status to 'fled')
  return this.status;
};

module.exports = mongoose.model('Scarling', scarlingSchema);