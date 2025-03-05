// commands/collect.js
const Player = require('../models/playerSchema');

module.exports = {
  name: 'collect',
  description: 'Collect a new Nood and add it to your inventory.',
  cooldown: 10,
  async execute(message, args) {
    const player = await Player.findOne({ userId: message.author.id });
    if (!player) {
      return message.channel.send(`You need to create a profile first using !start.`);
    }
    
    // Define possible nood types, with randomness and rarities
    const noodTypes = [
      { name: 'Spicy Nood', rarity: 'rare' },
      { name: 'Cheesy Nood', rarity: 'common' },
      { name: 'Garlic Nood', rarity: 'uncommon' },
      { name: 'Extra Nood', rarity: 'epic' }
    ];
    
    const selectedNood = noodTypes[Math.floor(Math.random() * noodTypes.length)];
    
    // Check if player already has this nood in inventory
    const itemIndex = player.inventory.findIndex(item => item.itemName === selectedNood.name);
    if (itemIndex !== -1) {
      // Increment quantity
      player.inventory[itemIndex].quantity += 1;
    } else {
      // Add new item to inventory
      player.inventory.push({
        itemName: selectedNood.name,
        quantity: 1,
        rarity: selectedNood.rarity
      });
    }
    
    await player.save();
    message.channel.send(`🎉 You have collected a **${selectedNood.name}** (${selectedNood.rarity}). Check your inventory with !inventory.`);
  }
};