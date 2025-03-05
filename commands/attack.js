const Player = require('../models/playerSchema');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'attack',
  description: 'Engage in an epic multi-phase battle with a Scarling! Use interactive commands each round to boost your chance, endure enemy counterattacks, and deliver a finishing blow.',
  cooldown: 10,
  async execute(message, args) {
    // 1. Ensure the player has a profile.
    let player = await Player.findOne({ userId: message.author.id });
    if (!player) {
      return message.channel.send(`${message.author}, please create a profile first using !start.`);
    }
    
    // 2. Set up battle parameters.
    // Simulate enemy level (could later be replaced by a persistent enemy model).
    const enemyLevel = Math.floor(Math.random() * 3) + 1; // Level 1 to 3
    let enemyHP = enemyLevel * 50; // Enemy HP scales with level.
    let playerHP = 100; // For this battle, assume player starts with 100 HP.
    
    // Base win chance: start with 60% and reduce by 10% per enemy level.
    let baseChance = 0.6 - (enemyLevel * 0.1); // Level 1: 50%, Level 2: 40%, Level 3: 30%
    
    // Check for bonus from player's inventory (e.g., a "Lucky Charm").
    let itemBonus = 0;
    const luckyCharm = player.inventory.find(item => item.itemName.toLowerCase() === "lucky charm");
    if (luckyCharm && luckyCharm.quantity > 0) {
      itemBonus = 0.1; // +10% bonus if present.
    }
    
    // 3. Send an initial battle embed.
    const battleEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("⚔️ Scarling Battle Initiated!")
      .setDescription(`A wild Scarling (Level ${enemyLevel}) appears with **${enemyHP} HP**!\nYour HP: **${playerHP}**\n\n**Base Win Chance:** ${(baseChance * 100).toFixed(0)}%\n**Lucky Charm Bonus:** ${luckyCharm ? "+10%" : "None"}\n\nFor each round, choose your move within 10 seconds:\n• \`!counter\` : +20% bonus\n• \`!dodge\`   : +10% bonus\n• \`!block\`   : +5% bonus\n\nGood luck, warrior!`)
      .setFooter({ text: "The battle will span multiple rounds." });
    
    await message.channel.send({ embeds: [battleEmbed] });
    
    // 4. Begin a multi-round battle loop (max 5 rounds).
    let round = 1;
    let battleOver = false;
    // Overall reward multiplier increases if you finish quickly.
    let overallRewardMultiplier = 1;
    
    while (!battleOver && round <= 5) {
      // Round header embed.
      await message.channel.send(`**Round ${round}**: Choose your move now: \`!counter\`, \`!dodge\`, or \`!block\` (10 seconds)`);
      
      // Set up a message collector for bonus moves.
      const bonusFilter = response =>
        ['!counter', '!dodge', '!block'].includes(response.content.toLowerCase()) &&
        response.author.id === message.author.id;
      
      let roundBonus = 0;
      try {
        const collected = await message.channel.awaitMessages({ filter: bonusFilter, max: 1, time: 10000, errors: ['time'] });
        const response = collected.first().content.toLowerCase();
        if (response === '!counter') roundBonus = 0.2;
        else if (response === '!dodge') roundBonus = 0.1;
        else if (response === '!block') roundBonus = 0.05;
        await message.channel.send(`✅ \`${response}\` received. Bonus of ${(roundBonus * 100).toFixed(0)}% for this round.`);
      } catch (err) {
        await message.channel.send(`⌛ No move received. Proceeding with base stats for this round.`);
      }
      
      // Calculate final chance for this round.
      const finalChance = Math.min(1, baseChance + itemBonus + roundBonus);
      const roll = Math.random();
      
      // Build an embed for round result.
      const roundEmbed = new EmbedBuilder()
        .setTitle(`Round ${round} ${roll < finalChance ? "Victory" : "Defeat"}`)
        .setColor(roll < finalChance ? 0x00ff00 : 0xff0000)
        .setFooter({ text: `Chance: ${(finalChance * 100).toFixed(0)}% (rolled ${(roll * 100).toFixed(0)}%)` });
      
      if (roll < finalChance) {
        // Player successfully lands an attack.
        let damage = Math.floor(Math.random() * 20) + 10; // Damage between 10 and 30.
        enemyHP -= damage;
        roundEmbed.setDescription(`You hit the Scarling for **${damage} damage**!\nEnemy HP is now **${Math.max(enemyHP, 0)}**.`);
      } else {
        // Failed move: enemy counterattacks.
        let counterDamage = Math.floor(Math.random() * 15) + 5; // Damage between 5 and 20.
        playerHP -= counterDamage;
        roundEmbed.setDescription(`The Scarling counterattacked, dealing **${counterDamage} damage**!\nYour HP is now **${Math.max(playerHP, 0)}**.`);
      }
      
      await message.channel.send({ embeds: [roundEmbed] });
      
      // Check battle conditions.
      if (enemyHP <= 0) {
        battleOver = true;
        overallRewardMultiplier = 1.5; // Bonus if enemy is defeated early.
      } else if (playerHP <= 0) {
        battleOver = true;
        overallRewardMultiplier = 0; // No reward if you lose.
      } else {
        round++;
      }
    }
    
    // 5. Final battle outcome.
    if (enemyHP <= 0) {
      // Initiate a finishing blow phase for extra rewards.
      const finishEmbed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setTitle("🔥 Finishing Blow Opportunity!")
        .setDescription("The Scarling is gravely wounded! Type `!finish` within 5 seconds to deliver a critical finishing blow and double your rewards.")
        .setFooter({ text: "Act fast for extra glory!" });
      await message.channel.send({ embeds: [finishEmbed] });
      
      let finishBonus = 1; // Normal reward multiplier.
      const finishFilter = response => response.content.toLowerCase() === '!finish' && response.author.id === message.author.id;
      try {
        const finishCollected = await message.channel.awaitMessages({ filter: finishFilter, max: 1, time: 5000, errors: ['time'] });
        finishBonus = 2; // Double rewards on finishing blow.
        await message.channel.send(`✅ Finishing blow successful! Critical damage dealt.`);
      } catch (err) {
        await message.channel.send(`⌛ You failed to deliver the finishing blow. Proceeding with normal rewards.`);
      }
      
      // Calculate final rewards.
      let rewardPoints = Math.floor(5 * overallRewardMultiplier * finishBonus);
      let rewardNoods = Math.floor(1 * overallRewardMultiplier * finishBonus);
      
      player.points = (player.points || 0) + rewardPoints;
      player.rescuedNoods = (player.rescuedNoods || 0) + rewardNoods;
      await player.save();
      
      const victoryEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("🎉 Battle Victory!")
        .setDescription(`You have defeated the Scarling!\n\n**Rounds Fought:** ${round}\n**Your Remaining HP:** ${playerHP}`)
        .addFields(
          { name: "Enemy Level", value: `${enemyLevel}`, inline: true },
          { name: "Rewards", value: `+${rewardPoints} Points\n+${rewardNoods} Rescued Nood`, inline: true }
        )
        .setFooter({ text: `Overall reward multiplier: ${overallRewardMultiplier}x, Finishing blow bonus: ${finishBonus}x` });
      
      await message.channel.send({ embeds: [victoryEmbed] });
    } else if (playerHP <= 0) {
      const defeatEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("💥 Battle Defeat")
        .setDescription("You were defeated by the Scarling.\nTrain harder and try again!")
        .setFooter({ text: "No rewards earned." });
      await message.channel.send({ embeds: [defeatEmbed] });
    } else {
      // Battle ended without a decisive outcome (e.g., reached max rounds).
      const timeoutEmbed = new EmbedBuilder()
        .setColor(0xffff00)
        .setTitle("⌛ Battle Timeout")
        .setDescription("The battle ended without a decisive victory. The Scarling flees the arena!")
        .setFooter({ text: "No rewards earned." });
      await message.channel.send({ embeds: [timeoutEmbed] });
    }
  }
};