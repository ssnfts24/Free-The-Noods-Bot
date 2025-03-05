// commands/daily.js
const Player = require('../models/playerSchema');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'daily',
  description: 'Claim your daily reward!',
  cooldown: 10,
  async execute(message, args) {
    let player = await Player.findOne({ userId: message.author.id });
    if (!player) {
      return message.channel.send(`${message.author}, please create a profile first using !start.`);
    }
    
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (player.lastDaily && now - player.lastDaily.getTime() < oneDay) {
      const timeLeft = oneDay - (now - player.lastDaily.getTime());
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      return message.channel.send(`Please wait ${hours} hours and ${minutes} minutes before claiming your next daily reward.`);
    }
    
    // Reward calculation
    const rewardPoints = 20;
    const rewardItemChance = Math.random();
    let rewardItem = null;
    if (rewardItemChance < 0.2) {
      rewardItem = "Health Potion";
    }
    
    player.points += rewardPoints;
    player.lastDaily = new Date();
    if (rewardItem) {
      const existingItem = player.inventory.find(i => i.itemName.toLowerCase() === rewardItem.toLowerCase());
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        player.inventory.push({ itemName: rewardItem, quantity: 1, rarity: "uncommon" });
      }
    }
    await player.save();
    
    const embed = new EmbedBuilder()
      .setTitle('Daily Reward Claimed')
      .setColor(0x00ff00)
      .setDescription(`You received ${rewardPoints} points${rewardItem ? ` and a ${rewardItem}!` : '!'}`)
      .setTimestamp();
    message.channel.send({ embeds: [embed] });
  }
};