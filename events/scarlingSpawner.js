// events/scarlingSpawner.js
const Scarling = require('../models/scarlingSchema');

module.exports = {
  /**
   * Starts the scarling spawner. It runs every minute and, for each guild:
   *  - If a scarling is already active, and 10 minutes have passed since its last update,
   *    it increases the scarling’s level and notifies the channel.
   *  - If no scarling is active, it randomly selects an active text channel and, with a set chance,
   *    spawns a new scarling in that channel, alerting players.
   * @param {import('discord.js').Client} client 
   */
  start: async function (client) {
    setInterval(async () => {
      // Loop over all guilds the bot is in
      client.guilds.cache.forEach(async (guild) => {
        // Get all text channels where the bot can send messages
        const textChannels = guild.channels.cache.filter(ch =>
          ch.isTextBased() &&
          ch.permissionsFor(guild.members.me)?.has("SendMessages")
        );
        if (!textChannels.size) return; // Skip if no suitable channels

        // Look for an active scarling in this guild (status 'active')
        let scarling = await Scarling.findOne({ guildId: guild.id, status: 'active' });
        if (scarling) {
          // If a scarling exists, check if 10 minutes have passed since last update
          const now = Date.now();
          const lastUpdate = scarling.lastUpdated.getTime();
          const tenMinutes = 10 * 60 * 1000;
          if (now - lastUpdate > tenMinutes) {
            scarling.level += 1;
            scarling.lastUpdated = new Date();
            await scarling.save();
            const spawnChannel = guild.channels.cache.get(scarling.channelId);
            if (spawnChannel && spawnChannel.isTextBased()) {
              spawnChannel.send(`⚠️ The lurking Scarling has grown stronger! It is now level ${scarling.level}.`);
            }
          }
        } else {
          // No active scarling exists. Decide to spawn one with a 15% chance per check.
          if (Math.random() < 0.15) {
            // Filter channels to only include active ones (those with a recent message within 5 minutes)
            const activeChannels = textChannels.filter(ch => {
              if (!ch.lastMessage) return false;
              const lastMsgTime = ch.lastMessage.createdTimestamp;
              return (Date.now() - lastMsgTime) < (5 * 60 * 1000);
            });

            let spawnChannel;
            if (activeChannels.size > 0) {
              // Choose a random active channel
              const randomIndex = Math.floor(Math.random() * activeChannels.size);
              spawnChannel = Array.from(activeChannels.values())[randomIndex];
            } else {
              // Fallback: choose any available text channel
              const allChannels = Array.from(textChannels.values());
              spawnChannel = allChannels[Math.floor(Math.random() * allChannels.length)];
            }

            // Create a new scarling with a random starting level (1 to 2) and status 'active'
            let newScarling = new Scarling({
              guildId: guild.id,
              channelId: spawnChannel.id,
              level: Math.floor(Math.random() * 2) + 1, // Level 1 or 2
              lastUpdated: new Date(),
              status: 'active'
            });
            await newScarling.save();
            spawnChannel.send(`👹 A wild Scarling is lurking here at level ${newScarling.level}! Hurry and challenge it with \`!battle\` before it grows even stronger!`);
          }
        }
      });
    }, 60 * 1000); // Runs every minute
  }
};