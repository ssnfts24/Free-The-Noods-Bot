// commands/inventory.js
const Player = require('../models/playerSchema');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'inventory',
  description: 'View your current inventory of items.',
  cooldown: 5,
  async execute(message, args) {
    let player = await Player.findOne({ userId: message.author.id });
    if (!player) {
      return message.channel.send(`${message.author}, please create a profile first using !start.`);
    }
    if (!player.inventory.length) {
      return message.channel.send('Your inventory is empty. Use commands like !collect or !sell to acquire items.');
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`${message.author.username}'s Inventory`)
      .setColor(0x0099ff)
      .setTimestamp();
    
    player.inventory.forEach(item => {
      embed.addFields({
        name: item.itemName,
        value: `Quantity: ${item.quantity}\nRarity: ${item.rarity || 'common'}`,
        inline: true
      });
    });
    
    message.channel.send({ embeds: [embed] });
  }
};