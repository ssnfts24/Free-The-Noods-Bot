// commands/use.js
const Player = require('../models/playerSchema');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'use',
  description: 'Use an item from your inventory. Usage: !use <itemName>',
  cooldown: 5,
  async execute(message, args) {
    if (!args.length) {
      return message.channel.send('Usage: !use <itemName>');
    }
    const itemName = args.join(' ').toLowerCase();
    
    let player = await Player.findOne({ userId: message.author.id });
    if (!player) {
      return message.channel.send(`${message.author}, please create a profile first using !start.`);
    }
    
    const item = player.inventory.find(i => i.itemName.toLowerCase() === itemName);
    if (!item || item.quantity < 1) {
      return message.channel.send(`You do not have any ${itemName} to use.`);
    }
    
    // Example: Using a "health potion" heals the player.
    let effectMessage = '';
    if (itemName === 'health potion') {
      const healAmount = 30; // Adjust as needed.
      player.health = Math.min(player.health + healAmount, player.maxHealth);
      effectMessage = `You used a Health Potion and restored ${healAmount} HP. Your health is now ${player.health}/${player.maxHealth}.`;
    } else {
      effectMessage = `You used a ${item.itemName}, but nothing happened...`;
    }
    
    // Deduct one item.
    item.quantity -= 1;
    if (item.quantity === 0) {
      player.inventory = player.inventory.filter(i => i.itemName.toLowerCase() !== itemName);
    }
    
    await player.save();
    const embed = new EmbedBuilder()
      .setTitle('Item Used')
      .setDescription(effectMessage)
      .setColor(0x00ff00)
      .setTimestamp();
    
    message.channel.send({ embeds: [embed] });
  }
};