// commands/buy.js
const Player = require('../models/playerSchema');
const { purchaseListing } = require('../utils/marketplaceUtils');

module.exports = {
  name: 'buy',
  description: 'Purchase an item from the marketplace. Usage: !buy <listingID> <quantity>',
  cooldown: 10,
  async execute(message, args) {
    if (args.length < 2) {
      return message.channel.send('Usage: !buy <listingID> <quantity>');
    }
    const listingId = args[0];
    const quantity = parseInt(args[1]);
    if (isNaN(quantity) || quantity < 1) {
      return message.channel.send('Quantity must be a valid number greater than 0.');
    }
    
    let buyer = await Player.findOne({ userId: message.author.id });
    if (!buyer) {
      return message.channel.send(`${message.author}, please create a profile first using !start.`);
    }
    
    const result = await purchaseListing(buyer, listingId, quantity);
    // Save buyer changes after purchase.
    await buyer.save();
    message.channel.send(result.message);
  }
};