// utils/tradeUtils.js
module.exports = {
  validateTrade: function(offeringPlayer, itemName, quantity) {
    const item = offeringPlayer.inventory.find(item => item.itemName.toLowerCase() === itemName.toLowerCase());
    if (!item) return { valid: false, message: `You don't have any ${itemName}.` };
    if (item.quantity < quantity) return { valid: false, message: `You only have ${item.quantity} ${itemName}(s).` };
    return { valid: true, item };
  },
  // Additional trade-related utilities can go here.
};