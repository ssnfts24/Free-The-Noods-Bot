const Player = require('../models/playerSchema');

module.exports = {
    name: 'leaderboard',
        description: 'Display the top rescuers!',
            async execute(message) {
                    const topPlayers = await Player.find().sort({ rescuedNoods: -1 }).limit(5);
                            if (!topPlayers.length) return message.channel.send("No players found.");

                                    let leaderboardText = '🏆 **Top Rescuers** 🏆\n';
                                            topPlayers.forEach((player, index) => {
                                                        leaderboardText += `${index + 1}. **${player.username}** - Rescued: ${player.rescuedNoods || 0} | Points: ${player.points || 0}\n`;
                                                                });
                                                                        message.channel.send(leaderboardText);
                                                                            }
                                                                            };