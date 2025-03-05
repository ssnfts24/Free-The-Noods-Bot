// commands/upgrade.js
const Player = require('../models/playerSchema');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'upgrade',
  description: 'Upgrade your attributes. Usage: !upgrade <attribute> <amount>',
  cooldown: 10,
  async execute(message, args) {
    if (args.length < 2) {
      return message.channel.send('Usage: !upgrade <attribute> <amount>\nValid attributes: strength, agility, luck');
    }
    
    const attribute = args[0].toLowerCase();
    const amount = parseInt(args[1]);
    const validAttributes = ['strength', 'agility', 'luck'];
    
    if (!validAttributes.includes(attribute)) {
      return message.channel.send(`Invalid attribute. Valid options are: ${validAttributes.join(', ')}`);
    }
    if (isNaN(amount) || amount < 1) {
      return message.channel.send('Upgrade amount must be a positive number.');
    }
    
    let player = await Player.findOne({ userId: message.author.id });
    if (!player) {
      return message.channel.send(`${message.author}, please create a profile first using !start.`);
    }
    
    // Determine cost: e.g., cost per point increases with current attribute value.
    const currentValue = player.attributes[attribute] || 10;
    const costPerPoint = Math.ceil(currentValue * 1.5);
    const totalCost = costPerPoint * amount;
    
    if (player.points < totalCost) {
      return message.channel.send(`You need ${totalCost} points to upgrade ${attribute} by ${amount} points. You currently have ${player.points} points.`);
    }
    
    player.points -= totalCost;
    player.attributes[attribute] += amount;
    await player.save();
    
    const embed = new EmbedBuilder()
      .setTitle('Upgrade Successful!')
      .setColor(0x00ff00)
      .setDescription(`Your ${attribute} has been increased by ${amount} points.\nCost: ${totalCost} points.`)
      .setFooter({ text: 'Keep upgrading to dominate the battles!' })
      .setTimestamp();
    
    message.channel.send({ embeds: [embed] });
  }
};