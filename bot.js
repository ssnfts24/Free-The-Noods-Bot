require('dotenv').config();
const { Client, Intents, Collection } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');

const client = new Client({
    intents: [
            Intents.FLAGS.GUILDS,
                    Intents.FLAGS.GUILD_MESSAGES,
                            Intents.FLAGS.GUILD_MEMBERS
                                ]
                                });

                                // Command Collection
                                client.commands = new Collection();
                                const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

                                for (const file of commandFiles) {
                                    const command = require(`./commands/${file}`);
                                        client.commands.set(command.name, command);
                                        }

                                        // Connect to MongoDB
                                        mongoose.connect(process.env.MONGO_URI, {
                                            useNewUrlParser: true,
                                                useUnifiedTopology: true
                                                }).then(() => console.log('✅ Database Connected'))
                                                .catch(err => console.error(err));

                                                // Bot Ready
                                                client.once('ready', () => {
                                                    console.log(`✅ Logged in as ${client.user.tag}`);
                                                    });

                                                    // Command Listener
                                                    client.on('messageCreate', async (message) => {
                                                        if (!message.content.startsWith('!') || message.author.bot) return;
                                                            const args = message.content.slice(1).split(/ +/);
                                                                const commandName = args.shift().toLowerCase();
                                                                    if (!client.commands.has(commandName)) return;
                                                                        try {
                                                                                await client.commands.get(commandName).execute(message, args);
                                                                                    } catch (error) {
                                                                                            console.error(error);
                                                                                                    message.reply("❌ There was an error executing that command.");
                                                                                                        }
                                                                                                        });

                                                                                                        client.login(process.env.TOKEN);