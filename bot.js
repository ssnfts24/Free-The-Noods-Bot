require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Create a new Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,             // For guild-related events
    GatewayIntentBits.GuildMessages,      // For message events in guilds
    GatewayIntentBits.MessageContent,     // For reading message content
    GatewayIntentBits.GuildMembers        // For guild member events (e.g., welcome)
  ]
});

// Set up command collection and cooldowns
client.commands = new Collection();
client.cooldowns = new Collection();

// Dynamically load all command files from the /commands folder
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.name, command);
}

// Connect to MongoDB using the connection string from .env
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ Database Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Bot ready event
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
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
    console.error(`Error executing command ${command.name}:`, error);
    message.reply("❌ There was an error executing that command.");
  }
});

// Log in to Discord with your bot token
client.login(process.env.TOKEN);