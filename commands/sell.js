// commands/sell.js
const Player = require('../models/playerSchema');
const { createListing } = require('../utils/marketplaceUtils');

module.exports = {
  name: 'sell',
  description: 'List an item from your inventory for sale in the marketplace. Usage: !sell <itemName> <quantity> <pricePerItem>',
  cooldown: 10,
  async execute(message, args) {
    if (args.length < 3) {
      return message.channel.send('Usage: !sell <itemName> <quantity> <pricePerItem>');
    }
    const itemName = args[0];
    const quantity = parseInt(args[1]);
    const pricePerItem = parseInt(args[2]);

    if (isNaN(quantity) || isNaN(pricePerItem)) {
      return message.channel.send('Quantity and price must be valid numbers.');
    }

    let seller = await Player.findOne({ userId: message.author.id });
    if (!seller) {
      return message.channel.send(`${message.author}, please create a profile first using !start.`);
    }

    const result = await createListing(seller, itemName, quantity, pricePerItem);
    // Save seller changes after deduction.
    await seller.save();
    message.channel.send(result.message);
  }
};