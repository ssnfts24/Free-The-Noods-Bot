const Player = require('../models/playerSchema');

module.exports = {
    name: 'attack',
        description: 'Attack a Scarling during a rescue attempt.',
            async execute(message) {
                    let player = await Player.findOne({ userId: message.author.id });
                            if (!player) {
                                        return message.channel.send(`${message.author}, please create a profile first using !start.`);
                                                }

                                                        const outcomes = ['win', 'lose'];
                                                                const result = outcomes[Math.floor(Math.random() * outcomes.length)];

                                                                        if (result === 'win') {
                                                                                    player.points = (player.points || 0) + 5;
                                                                                                player.rescuedNoods = (player.rescuedNoods || 0) + 1;
                                                                                                            await player.save();
                                                                                                                        message.channel.send(`🔥 You defeated the Scarling! Bonus: +5 points, and you rescued the Nood!`);
                                                                                                                                } else {
                                                                                                                                            message.channel.send(`💥 You failed to defeat the Scarling. The rescue attempt is lost.`);
                                                                                                                                                    }
                                                                                                                                                        }
                                                                                                                                                        };