const Player = require('../models/playerSchema');

module.exports = {
    name: 'start',
        description: 'Create your rescue profile!',
            async execute(message) {
                    const existingPlayer = await Player.findOne({ userId: message.author.id });
                            if (existingPlayer) {
                                        return message.channel.send(`${message.author}, you already have a profile!`);
                                                }

                                                        const newPlayer = new Player({
                                                                    userId: message.author.id,
                                                                                username: message.author.username
                                                                                        });

                                                                                                await newPlayer.save();
                                                                                                        message.channel.send(`Welcome ${message.author}! Your rescue profile is ready. Start rescuing by using !rescue.`);
                                                                                                            }
                                                                                                            };