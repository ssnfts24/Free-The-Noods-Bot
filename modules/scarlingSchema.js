// models/scarlingSchema.js
const mongoose = require('mongoose');

const scarlingSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  level: { type: Number, default: 1 },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scarling', scarlingSchema);