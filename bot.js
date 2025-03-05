require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const winston = require('winston');

// Initialize logger with Winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'bot.log' })
  ]
});

// Create a new Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,             // For guild-related events
    GatewayIntentBits.GuildMessages,      // For message events in guilds
    GatewayIntentBits.MessageContent,     // For reading message content
    GatewayIntentBits.GuildMembers        // For guild member events (e.g., welcome)
  ]
});

// Set up collections for commands and cooldowns
client.commands = new Collection();
client.cooldowns = new Collection();

// Dynamically load all command files from the /commands folder
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  try {
    const command = require(filePath);
    client.commands.set(command.name, command);
    logger.info(`Loaded command: ${command.name}`);
  } catch (err) {
    logger.error(`Error loading command file ${file}: ${err}`);
  }
}

// Dynamically load event files from the /events folder (if it exists)
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    try {
      const event = require(filePath);
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      logger.info(`Loaded event: ${event.name}`);
    } catch (err) {
      logger.error(`Error loading event file ${file}: ${err}`);
    }
  }
}

// Connect to MongoDB using the connection string from .env
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => logger.info('✅ Database Connected'))
  .catch(err => logger.error(`MongoDB Connection Error: ${err}`));

// Optional: Watch commands folder for changes and reload commands dynamically (development use)
fs.watch(commandsPath, (eventType, filename) => {
  if (filename && filename.endsWith('.js')) {
    try {
      const filePath = path.join(commandsPath, filename);
      delete require.cache[require.resolve(filePath)];
      const newCommand = require(filePath);
      client.commands.set(newCommand.name, newCommand);
      logger.info(`Reloaded command: ${newCommand.name}`);
    } catch (err) {
      logger.error(`Error reloading command ${filename}: ${err}`);
    }
  }
});

// Bot ready event (if not handled in /events)
client.once('ready', () => {
  logger.info(`✅ Logged in as ${client.user.tag}`);
});

// Listen for messages and handle commands
client.on('messageCreate', async message => {
  // Ignore messages from bots or messages not starting with the prefix
  if (message.author.bot) return;
  const prefix = '!';
  if (!message.content.startsWith(prefix)) return;

  // Parse the command and arguments
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  if (!client.commands.has(commandName)) return;
  const command = client.commands.get(commandName);

  // Implement a cooldown system for commands (default: 3 seconds)
  if (!client.cooldowns.has(command.name)) {
    client.cooldowns.set(command.name, new Collection());
  }
  const now = Date.now();
  const timestamps = client.cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;
  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
    if (now < expirationTime) {
      const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
      return message.reply(`please wait ${timeLeft} more second(s) before using the \`${command.name}\` command.`);
    }
  }
  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  // Execute the command and handle any errors
  try {
    await command.execute(message, args, client);
  } catch (error) {
    logger.error(`Error executing command ${command.name}: ${error}`);
    message.reply("❌ There was an error executing that command.");
  }
});

// Graceful shutdown handling
const shutdown = () => {
  logger.info('Shutting down gracefully...');
  client.destroy();
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Log in to Discord with your bot token
client.login(process.env.TOKEN)
  .catch(err => logger.error(`Error logging in: ${err}`));