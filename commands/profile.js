// commands/profile.js
const Player = require('../models/playerSchema');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'profile',
  description: 'Display your profile and stats.',
  cooldown: 5,
  async execute(message, args) {
    let player = await Player.findOne({ userId: message.author.id });
    if (!player) {
      return message.channel.send(`${message.author}, please create a profile first using !start.`);
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`${message.author.username}'s Profile`)
      .setColor(0x0099ff)
      .addFields(
        { name: 'Level', value: `${player.level}`, inline: true },
        { name: 'XP', value: `${player.xp}`, inline: true },
        { name: 'Points', value: `${player.points}`, inline: true },
        { name: 'Rescued Noods', value: `${player.rescuedNoods}`, inline: true },
        { name: 'Health', value: `${player.health}/${player.maxHealth}`, inline: true },
        { name: 'Attributes', value: `Strength: ${player.attributes.strength}\nAgility: ${player.attributes.agility}\nLuck: ${player.attributes.luck}`, inline: true }
      )
      .setFooter({ text: 'Keep leveling up for greater rewards!' })
      .setTimestamp();
    
    message.channel.send({ embeds: [embed] });
  }
};