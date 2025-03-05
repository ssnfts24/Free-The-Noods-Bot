module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const welcomeChannelId = 'Free The Noods Game Bot'; // Replace with your channel ID
    const channel = member.guild.channels.cache.get(welcomeChannelId);
    if (!channel) return;
    const welcomeMessage = `Welcome to Free The Noods, ${member.user}! Enjoy your stay!`;
    channel.send(welcomeMessage);
  }
};