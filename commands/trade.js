// commands/trade.js
const Player = require('../models/playerSchema');
const { processTrade, negotiateListing } = require('../utils/marketplaceUtils');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'trade',
  description: 'Initiate a trade with another player. Usage: !trade @user <itemName> <quantity> <proposedPrice>',
  cooldown: 15,
  async execute(message, args) {
    if (args.length < 4) {
      return message.channel.send('Usage: !trade @user <itemName> <quantity> <proposedPrice>');
    }
    
    const target = message.mentions.users.first();
    if (!target) {
      return message.channel.send('Please mention a valid user to trade with.');
    }
    
    const itemName = args[1];
    const quantity = parseInt(args[2]);
    const proposedPrice = parseInt(args[3]);
    if (isNaN(quantity) || isNaN(proposedPrice)) {
      return message.channel.send('Quantity and proposed price must be valid numbers.');
    }
    
    let offeringPlayer = await Player.findOne({ userId: message.author.id });
    let targetPlayer = await Player.findOne({ userId: target.id });
    
    if (!offeringPlayer || !targetPlayer) {
      return message.channel.send('Both players must have a profile. Use !start to create one.');
    }
    
    // First, validate and process the direct trade.
    const tradeResult = processTrade(offeringPlayer, targetPlayer, itemName, quantity);
    if (!tradeResult.success) {
      return message.channel.send(tradeResult.message);
    }
    
    // Now, simulate a negotiation on the proposed price.
    // For this example, we assume a simple negotiation function.
    const listing = {
      pricePerItem: tradeResult.tradeValue / quantity,
      negotiationOpen: true
    };
    const negotiation = negotiateListing(listing, proposedPrice);
    
    const negotiationEmbed = new EmbedBuilder()
      .setTitle('Trade Negotiation')
      .setDescription(negotiation.message)
      .setColor(negotiation.outcome === 'accepted' ? 0x00ff00 : (negotiation.outcome === 'counter' ? 0xffff00 : 0xff0000))
      .setFooter({ text: `Outcome: ${negotiation.outcome}` });
    
    message.channel.send({ embeds: [negotiationEmbed] });
    
    // If accepted or countered, finalize the trade (for simplicity, if countered we accept the new price)
    if (negotiation.outcome !== 'rejected') {
      message.channel.send(`Trade finalized: ${tradeResult.message}`);
    } else {
      message.channel.send(`Trade canceled due to negotiation failure.`);
    }
    
    // Save both players after trade.
    await offeringPlayer.save();
    await targetPlayer.save();
  }
};