const mongoose = require('mongoose');

/**
 * MarketListing Schema: Represents an item listed for sale in the marketplace.
 * Now includes negotiationHistory and listingExpiry to further enhance dynamic pricing.
 */
const marketListingSchema = new mongoose.Schema({
  sellerId: { type: String, required: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  pricePerItem: { type: Number, required: true, min: 0 },
  negotiationOpen: { type: Boolean, default: true }, // Whether the seller is open to negotiate.
  negotiationHistory: [{ 
    proposedPrice: Number, 
    outcome: { type: String, enum: ['accepted', 'counter', 'rejected'] },
    timestamp: { type: Date, default: Date.now }
  }],
  listingExpiry: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } // Expires in 7 days.
}, { timestamps: true });

const MarketListing = mongoose.model('MarketListing', marketListingSchema);

/**
 * Validates if the offeringPlayer has the required quantity of an item to list or trade.
 * @param {Object} offeringPlayer - The player object.
 * @param {String} itemName - Name of the item.
 * @param {Number} quantity - Quantity to list/trade.
 * @returns {Object} { valid: Boolean, message: String, item: Object (if valid) }
 */
function validateTrade(offeringPlayer, itemName, quantity) {
  const item = offeringPlayer.inventory.find(
    i => i.itemName.toLowerCase() === itemName.toLowerCase()
  );
  if (!item) return { valid: false, message: `You don't have any ${itemName}.` };
  if (item.quantity < quantity) return { valid: false, message: `You only have ${item.quantity} ${itemName}(s).` };
  if (item.nonTradeable) return { valid: false, message: `${itemName} is not tradeable.` };
  return { valid: true, item };
}

/**
 * Calculates the trade value for an item based on its rarity and quantity.
 * @param {Object} item - The item object (should include a "rarity" field).
 * @param {Number} quantity - Quantity being traded.
 * @returns {Number} The calculated trade value.
 */
function calculateItemValue(item, quantity) {
  const rarityMultipliers = {
    common: 1,
    uncommon: 1.5,
    rare: 2,
    epic: 3,
    legendary: 5
  };
  const multiplier = rarityMultipliers[item.rarity.toLowerCase()] || 1;
  const baseValue = 10; // Base value per item.
  return quantity * baseValue * multiplier;
}

/**
 * Processes an immediate trade between two players.
 * Deducts items from offeringPlayer and adds them to targetPlayer.
 * @param {Object} offeringPlayer - The player offering the items.
 * @param {Object} targetPlayer - The receiving player.
 * @param {String} itemName - The item to trade.
 * @param {Number} quantity - The quantity to trade.
 * @returns {Object} { success: Boolean, tradeValue: Number, message: String }
 */
function processTrade(offeringPlayer, targetPlayer, itemName, quantity) {
  const validation = validateTrade(offeringPlayer, itemName, quantity);
  if (!validation.valid) return { success: false, message: validation.message };

  const tradeValue = calculateItemValue(validation.item, quantity);

  // Deduct the items from offeringPlayer.
  validation.item.quantity -= quantity;
  if (validation.item.quantity === 0) {
    offeringPlayer.inventory = offeringPlayer.inventory.filter(
      i => i.itemName.toLowerCase() !== itemName.toLowerCase()
    );
  }

  // Add items to targetPlayer.
  const targetItem = targetPlayer.inventory.find(
    i => i.itemName.toLowerCase() === itemName.toLowerCase()
  );
  if (targetItem) {
    targetItem.quantity += quantity;
  } else {
    targetPlayer.inventory.push({
      itemName: validation.item.itemName,
      quantity: quantity,
      rarity: validation.item.rarity,
      effects: validation.item.effects || {},
      nonTradeable: validation.item.nonTradeable || false
    });
  }

  return { success: true, tradeValue, message: `Trade processed: transferred ${quantity} ${itemName}(s) valued at ${tradeValue} trade points.` };
}

/**
 * Initiates a negotiation between buyer and seller over a marketplace listing.
 * The buyer proposes a new price per item.
 * This function simulates a multi-round negotiation with random outcomes.
 * @param {Object} listing - The marketplace listing.
 * @param {Number} proposedPrice - The buyer's proposed price per item.
 * @returns {Object} Negotiation result: { outcome: 'accepted'|'counter'|'rejected', newPrice: Number|null, message: String }
 */
function negotiateListing(listing, proposedPrice) {
  // Only allow negotiation if the listing is open.
  if (!listing.negotiationOpen) {
    return { outcome: 'rejected', newPrice: null, message: 'Negotiation is not available for this listing.' };
  }

  // Record the negotiation attempt.
  listing.negotiationHistory.push({
    proposedPrice,
    outcome: 'pending'
  });

  // Determine ideal range (90-110% of the listing price).
  const idealLow = listing.pricePerItem * 0.9;
  const idealHigh = listing.pricePerItem * 1.1;

  let outcome, newPrice, message;
  if (proposedPrice >= idealLow && proposedPrice <= idealHigh) {
    outcome = 'accepted';
    newPrice = proposedPrice;
    message = 'The seller accepts your offer.';
  } else if (proposedPrice < idealLow) {
    // Low offers may be countered.
    newPrice = Math.round(listing.pricePerItem * 0.95);
    outcome = Math.random() < 0.6 ? 'counter' : 'rejected';
    message = outcome === 'counter'
      ? `The seller counters with a price of ${newPrice} per item.`
      : 'The seller rejects your low offer.';
  } else {
    // Offers that are too high: seller might counter with a slight discount.
    newPrice = Math.round(listing.pricePerItem * 0.98);
    outcome = Math.random() < 0.6 ? 'counter' : 'accepted';
    message = outcome === 'counter'
      ? `The seller counters with a price of ${newPrice} per item.`
      : 'The seller accepts your generous offer.';
  }

  // Update the negotiation attempt outcome.
  const lastAttempt = listing.negotiationHistory[listing.negotiationHistory.length - 1];
  lastAttempt.outcome = outcome;

  return { outcome, newPrice, message };
}

/**
 * Lists all tradable items from a player's inventory.
 * Filters out non-tradeable items.
 * @param {Object} player - The player object.
 * @returns {Array} List of tradable item objects.
 */
function listTradableItems(player) {
  return player.inventory.filter(item => !item.nonTradeable);
}

/**
 * Marketplace Functions
 */

/**
 * Creates a new marketplace listing.
 * Deducts the items from the seller's inventory and creates a listing document.
 * @param {Object} seller - The seller player object.
 * @param {String} itemName - The name of the item.
 * @param {Number} quantity - The quantity to list.
 * @param {Number} pricePerItem - The asking price per item.
 * @returns {Object} { success: Boolean, listing: Object, message: String }
 */
async function createListing(seller, itemName, quantity, pricePerItem) {
  // Validate that the seller has enough items.
  const validation = validateTrade(seller, itemName, quantity);
  if (!validation.valid) return { success: false, message: validation.message };

  // Deduct the items from the seller's inventory.
  validation.item.quantity -= quantity;
  if (validation.item.quantity === 0) {
    seller.inventory = seller.inventory.filter(
      i => i.itemName.toLowerCase() !== itemName.toLowerCase()
    );
  }
  // (Ensure seller.save() is called after this function in your command.)

  // Create a new marketplace listing.
  const listing = new MarketListing({
    sellerId: seller.userId,
    itemName: validation.item.itemName,
    quantity,
    pricePerItem,
    negotiationOpen: true,
    negotiationHistory: []
  });
  await listing.save();
  return { success: true, listing, message: `Listing created for ${quantity} ${itemName}(s) at ${pricePerItem} each.` };
}

/**
 * Lists all active marketplace listings.
 * @returns {Array} Array of listing objects.
 */
async function listMarketplace() {
  // Optionally, filter out expired listings.
  const now = new Date();
  return await MarketListing.find({ listingExpiry: { $gt: now } });
}

/**
 * Purchases an item from a marketplace listing.
 * Updates the seller's and buyer's inventories accordingly.
 * @param {Object} buyer - The buyer player object.
 * @param {String} listingId - The ID of the marketplace listing.
 * @param {Number} quantity - The quantity to purchase.
 * @returns {Object} { success: Boolean, message: String }
 */
async function purchaseListing(buyer, listingId, quantity) {
  const listing = await MarketListing.findById(listingId);
  if (!listing) return { success: false, message: 'Listing not found.' };
  if (quantity > listing.quantity) {
    return { success: false, message: `Only ${listing.quantity} available in this listing.` };
  }

  const totalPrice = listing.pricePerItem * quantity;
  // Here, implement a check for buyer's currency/points if needed.

  // Process the purchase by updating the listing.
  listing.quantity -= quantity;
  if (listing.quantity === 0) {
    await listing.deleteOne();
  } else {
    await listing.save();
  }

  // Add items to the buyer's inventory (or update if already exists).
  const buyerItem = buyer.inventory.find(i => i.itemName.toLowerCase() === listing.itemName.toLowerCase());
  if (buyerItem) {
    buyerItem.quantity += quantity;
  } else {
    buyer.inventory.push({
      itemName: listing.itemName,
      quantity,
      rarity: "common" // Optionally copy rarity from seller if available.
    });
  }
  // (Ensure buyer.save() is called after this function in your command.)

  return { success: true, message: `Purchase successful: ${quantity} ${listing.itemName}(s) for a total of ${totalPrice} trade points.` };
}

module.exports = {
  // Trade/Negotiation Utilities
  validateTrade,
  calculateItemValue,
  processTrade,
  listTradableItems,
  negotiateListing,
  // Marketplace Functions
  createListing,
  listMarketplace,
  purchaseListing,
  MarketListing // Export the model for use elsewhere if needed.
};