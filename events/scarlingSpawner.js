// events/scarlingSpawner.js
const Scarling = require('../models/scarlingSchema');

module.exports = {
  /**
   * Starts the scarling spawner. It checks every minute for each guild.
   * @param {import('discord.js').Client} client 
   */
  start: async function(client) {
    setInterval(async () => {
      // Loop over all guilds the bot is in
      client.guilds.cache.forEach(async (guild) => {
        // Find an active scarling for this guild
        let scarling = await Scarling.findOne({ guildId: guild.id });
        // Try to find a default text channel to send messages in
        const defaultChannel = guild.channels.cache.find(
          ch => ch.isTextBased() && ch.permissionsFor(guild.members.me).has("SendMessages")
        );
        if (!defaultChannel) return; // Skip if no channel found
        
        if (scarling) {
          // If a scarling exists, check if 10 minutes have passed since last update
          const now = Date.now();
          const lastUpdate = scarling.lastUpdated.getTime();
          const tenMinutes = 10 * 60 * 1000;
          if (now - lastUpdate > tenMinutes) {
            scarling.level += 1;
            scarling.lastUpdated = new Date();
            await scarling.save();
            defaultChannel.send(`⚠️ The scarling has grown stronger! It is now level ${scarling.level}.`);
          }
        } else {
          // If no scarling exists, spawn one with a small chance (e.g., 10% chance per check)
          if (Math.random() < 0.1) {
            let newScarling = new Scarling({
              guildId: guild.id,
              channelId: defaultChannel.id,
              level: 1,
              lastUpdated: new Date()
            });
            await newScarling.save();
            defaultChannel.send(`👹 A wild scarling has appeared! Use \`!battle\` to challenge it!`);
          }
        }
      });
    }, 60 * 1000); // Check every minute
  }
};