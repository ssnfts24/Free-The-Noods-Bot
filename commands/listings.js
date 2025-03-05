// commands/listings.js
const { listMarketplace } = require('../utils/marketplaceUtils');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'listings',
  description: 'Display all active marketplace listings.',
  cooldown: 5,
  async execute(message, args) {
    const listings = await listMarketplace();
    if (!listings.length) {
      return message.channel.send('There are no active marketplace listings at the moment.');
    }
    
    const embed = new EmbedBuilder()
      .setTitle('Marketplace Listings')
      .setColor(0x0099ff)
      .setTimestamp();

    listings.forEach(listing => {
      embed.addFields({
        name: `${listing.itemName} (ID: ${listing._id})`,
        value: `Seller: ${listing.sellerId}\nQuantity: ${listing.quantity}\nPrice per item: ${listing.pricePerItem}\nNegotiation: ${listing.negotiationOpen ? 'Open' : 'Closed'}`
      });
    });
    
    message.channel.send({ embeds: [embed] });
  }
};