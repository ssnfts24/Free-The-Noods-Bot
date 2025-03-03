const Player = require('../models/playerSchema');

module.exports = {
    name: 'rescue',
        description: 'Attempt to rescue a Nood from a Scarling!',
            async execute(message) {
                    let player = await Player.findOne({ userId: message.author.id });
                            if (!player) {
                                        return message.channel.send(`${message.author}, please create a profile first using !start.`);
                                                }

                                                        // Random outcome
                                                                const outcomes = ['success', 'failure', 'scarling'];
                                                                        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

                                                                                if (outcome === 'success') {
                                                                                            player.rescuedNoods = (player.rescuedNoods || 0) + 1;
                                                                                                        player.points = (player.points || 0) + 10;
                                                                                                                    await player.save();
                                                                                                                                message.channel.send(`🎉 Success! You rescued a Nood and earned 10 points. Total rescued: ${player.rescuedNoods}.`);
                                                                                                                                        } else if (outcome === 'failure') {
                                                                                                                                                    message.channel.send(`😞 Your rescue attempt failed... Try again later!`);
                                                                                                                                                            } else if (outcome === 'scarling') {
                                                                                                                                                                        message.channel.send(`⚠️ A Scarling appears! Type !attack to try and defeat it.`);
                                                                                                                                                                                }
                                                                                                                                                                                    }
                                                                                                                                                                                    };