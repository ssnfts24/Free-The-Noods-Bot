// commands/battleScarling.js
const Scarling = require('../models/scarlingSchema');

module.exports = {
  name: 'battle',
  description: 'Battle the scarling that roams the server!',
  cooldown: 10,
  async execute(message, args) {
    // Find the scarling for this guild
    const scarling = await Scarling.findOne({ guildId: message.guild.id });
    if (!scarling) {
      return message.channel.send("There is no scarling in the server right now.");
    }
    
    // Define the player's base success chance and adjust for scarling level
    const baseChance = 0.7; // 70% chance when scarling is level 1
    const difficultyModifier = scarling.level * 0.1; // Each level reduces success chance by 10%
    const chanceToWin = Math.max(0, baseChance - difficultyModifier);
    
    if (Math.random() < chanceToWin) {
      // Player wins the battle: remove the scarling
      await Scarling.deleteOne({ guildId: message.guild.id });
      return message.channel.send(`🎉 You defeated the scarling (Level ${scarling.level})!`);
    } else {
      return message.channel.send(`💥 The scarling proved too strong. Try again later!`);
    }
  }
};