const mongoose = require('mongoose');

const scarlingSchema = new mongoose.Schema({
  // Basic identification
  guildId: { type: String, required: true, index: true },
  channelId: { type: String, required: true },

  // Core attributes
  level: { type: Number, default: 1, min: 1 },
  status: { type: String, enum: ['active', 'defeated', 'fled'], default: 'active' },
  
  // Health and combat stats
  maxHP: { type: Number, default: 100, min: 0 },
  currentHP: { type: Number, default: 100, min: 0 },
  attack: { type: Number, default: 10, min: 0 },
  defense: { type: Number, default: 5, min: 0 },
  agility: { type: Number, default: 5, min: 0 },

  // Special abilities
  abilities: { type: [String], default: [] },

  // Rewards for defeating this scarling
  xpReward: { type: Number, default: 50, min: 0 },
  pointsReward: { type: Number, default: 5, min: 0 },

  // Elite flag
  isElite: { type: Boolean, default: false },

  // Temporary buffs/debuffs
  modifiers: {
    type: Map,
    of: Number,
    default: { bonusDamage: 0, bonusDefense: 0 }
  },

  // Conditions currently affecting the scarling
  conditions: { type: [String], default: [] },

  // Battle history
  battleHistory: [{
    outcome: { type: String, enum: ['victory', 'defeat', 'counterattacked', 'escaped'], default: 'escaped' },
    damageTaken: { type: Number, default: 0 },
    damageDealt: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
  }],

  // Timestamps
  spawnedAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },

  // Dynamic events and advanced behavior fields
  dynamicEvents: { type: [String], default: [] },
  aiBehavior: { type: String, enum: ['aggressive', 'defensive', 'adaptive'], default: 'adaptive' },
  spawnChance: { type: Number, default: 0.1, min: 0, max: 1 },
  strategy: { type: String, enum: ['random', 'targeted', 'balanced'], default: 'balanced' },

  // Active buffs
  currentBuffs: [{
    name: { type: String, required: true },
    value: { type: Number, required: true },
    expiresAt: { type: Date, required: true }
  }]
}, { timestamps: true });

/**
 * Virtual property to calculate effective attack.
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
 * Instance method to apply damage.
 */
scarlingSchema.methods.applyDamage = function(damage) {
  this.currentHP = Math.max(this.currentHP - damage, 0);
  return this.currentHP;
};

/**
 * Instance method to check if defeated.
 */
scarlingSchema.methods.isDefeated = function() {
  return this.currentHP <= 0;
};

/**
 * Instance method to update status based on HP.
 */
scarlingSchema.methods.updateStatus = function() {
  if (this.isDefeated()) {
    this.status = 'defeated';
  }
  // Additional logic (e.g., fleeing at low HP) can be added.
  return this.status;
};

module.exports = mongoose.model('Scarling', scarlingSchema);
