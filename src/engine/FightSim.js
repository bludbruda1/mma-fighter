Object.defineProperty(exports, "__esModule", { value: true });
// export each action so that we can use them as logged events for displaying in the Fight Summary
exports.displayFightStats =
  exports.simulateFight =
  exports.doLegKick =
  exports.probLegKick =
  exports.doPunch =
  exports.probPunch =
  exports.doKick =
  exports.probKick =
    void 0;

const ROUNDS_PER_FIGHT = 3; // How many rounds will be in the fight
const ACTIONS_PER_ROUND = 50; // Basic simulation for 5 minutes with 10 actions per minute

// Pick which fighter is going to do something
const pickFighter = (fighters, lastActionFighter) => {
  let ratios = [fighters[0].Rating.output, fighters[1].Rating.output];
  // If lastActionFighter is provided, slightly decrease their chance of being picked again
  if (lastActionFighter !== undefined) {
    ratios[lastActionFighter] *= 0.9;
  }
  const sum = ratios[0] + ratios[1];
  // Special case for both fighters having 0 ratio - randomly pick one
  if (sum === 0) {
    return Math.random() < 0.5 ? 0 : 1;
  }
  const rand = Math.random() * sum;
  // If rand is less than the ratio of fighter 0, pick fighter 0, otherwise pick fighter 1
  return rand < ratios[0] ? 0 : 1;
};

// Kick
// The probability that the kick lands
const probKick = (kickingRating, kickDefence) => {
  const total = kickingRating + kickDefence;
  const probability = total > 0 ? kickingRating / total : 0;
  if (isNaN(probability) || probability < 0 || probability > 1) {
    console.error(`Invalid probability for kick: ${probability}`);
  }
  return probability;
};
exports.probKick = probKick;

// perofrming the kick action with an attacker and defender parameter
const doKick = (attacker, defender) => {
  console.log(`${attacker.name} throws a kick at ${defender.name}`);
  const probability = (0, exports.probKick)(
    attacker.Rating.kicking,
    defender.Rating.kickDefence
  );
  if (Math.random() < probability) {
    const damage = calculateDamage(attacker.Rating.kicking, true, false);
    if (isNaN(damage)) {
      console.error(
        `Calculated NaN damage for kick. Kicking Rating: ${attacker.Rating.kicking}`
      );
    }
    defender.currentHealth -= damage;
    attacker.stats.kicksLanded++;
    console.log(`${defender.name} is hit by the kick for ${damage} damage`);
    return "kickLanded";
  } else {
    defender.stats.kicksBlocked++;
    console.log(`${defender.name} blocks the kick`);
    return "kickBlocked";
  }
};
exports.doKick = doKick;

// Punch
// The probability that the punch lands
const probPunch = (strikingRating, strikingDefence) => {
  const total = strikingRating + strikingDefence;
  const probability = total > 0 ? strikingRating / total : 0;
  if (isNaN(probability) || probability < 0 || probability > 1) {
    console.error(`Invalid probability for punch: ${probability}`);
  }
  return probability;
};
exports.probPunch = probPunch;

// perofrming the punch action with an attacker and defender parameter
const doPunch = (attacker, defender) => {
  console.log(`${attacker.name} throws a punch at ${defender.name}`);
  const probability = (0, exports.probPunch)(
    attacker.Rating.striking,
    defender.Rating.strikingDefence
  );
  if (Math.random() < probability) {
    const damage = calculateDamage(attacker.Rating.striking, false, false);
    if (isNaN(damage)) {
      console.error(
        `Calculated NaN damage for punch. Striking Rating: ${attacker.Rating.striking}`
      );
    }
    defender.currentHealth -= damage;
    attacker.stats.punchesLanded++;
    console.log(`${defender.name} is hit by the punch for ${damage} damage`);
    return "punchLanded";
  } else {
    defender.stats.punchesBlocked++;
    console.log(`${defender.name} blocks the punch`);
    return "punchBlocked";
  }
};
exports.doPunch = doPunch;

// Leg Kick
// The probability that the leg kick lands
const probLegKick = (legKickOffence, legKickDefence) => {
  const total = legKickOffence + legKickDefence;
  const probability = total > 0 ? legKickOffence / total : 0;
  if (isNaN(probability) || probability < 0 || probability > 1) {
    console.error(`Invalid probability for leg kick: ${probability}`);
  }
  return probability;
};
exports.probLegKick = probLegKick;

const doLegKick = (attacker, defender) => {
  console.log(`${attacker.name} throws a leg kick at ${defender.name}`);

  // Calculate the probability of the leg kick landing
  const probability = (0, exports.probLegKick)(
    attacker.Rating.legKickOffence,
    defender.Rating.legKickDefence
  );

  // Check if the probability is valid
  if (isNaN(probability) || probability < 0 || probability > 1) {
    console.error(`Invalid probability for leg kick: ${probability}`);
    return "invalidProbability";
  }

  // Determine if the leg kick lands based on the valid probability
  if (Math.random() < probability) {
    // Leg kick lands
    const damage = calculateDamage(attacker.Rating.legKickOffence, true, true);
    if (isNaN(damage)) {
      console.error(
        `Calculated NaN damage for leg kick. Offence: ${attacker.Rating.legKickOffence}`
      );
    }
    defender.currentHealth -= damage;
    attacker.stats.legKicksLanded++;
    attacker.stats.significantKicksLanded++; // All landed leg kicks are counted as a significant kick in the stats (not the damage modifier)
    console.log(`${defender.name} is hit by the leg kick for ${damage} damage`);
    return "kickLanded";
  } else {
    // Leg kick is checked
    const damage = calculateDamage(defender.Rating.legKickDefence, true, true);
    if (isNaN(damage)) {
      console.error(
        `Calculated NaN damage for checked leg kick. Defence: ${defender.Rating.legKickDefence}`
      );
    }
    attacker.currentHealth -= damage;
    defender.stats.legKicksChecked++;
    console.log(`${defender.name} checks the leg kick`);
    console.log(
      `${attacker.name} takes ${damage} damage from the checked leg kick`
    );
    return "kickChecked";
  }
};
exports.doLegKick = doLegKick;

const isSignificantHit = () => {
  return Math.random() < 0.1; // 10% chance of significant hit
};

const calculateDamage = (baseRating, isKick, isLegKick) => {
  const baseDamage = isKick ? 15 : 10;
  const variationFactor = 0.3; // 30% variation for the damage
  const randomFactor = 1 + (Math.random() * 2 - 1) * variationFactor;
  const significantMultiplier = isSignificantHit() ? 1.5 : 1; // 50% more damage for significant strikes
  const legKickMultiplier = isLegKick ? 1.2 : 1; // 20% more damage for leg kicks
  const damage =
    (baseDamage + baseRating * 0.5) *
    randomFactor *
    significantMultiplier *
    legKickMultiplier;
  return isNaN(damage) ? 0 : Math.round(damage);
};

// Determine action based on fighter's tendencies
const determineAction = (fighter) => {
  const rand = Math.random() * 100;
  if (rand < fighter.Tendency.punchTendency) {
    return "punch";
  } else if (
    rand <
    fighter.Tendency.punchTendency + fighter.Tendency.kickTendency
  ) {
    return "kick";
  } else {
    return "legKick";
  }
};

// Simulate an action
const simulateAction = (fighters, actionFighter) => {
  const opponent = actionFighter === 0 ? 1 : 0;
  const fighter = fighters[actionFighter];
  // Determine action type based on fighter's tendencies
  const actionType = determineAction(fighter);
  switch (actionType) {
    case "punch":
      (0, exports.doPunch)(fighter, fighters[opponent]);
      break;
    case "kick":
      (0, exports.doKick)(fighter, fighters[opponent]);
      break;
    case "legKick":
      (0, exports.doLegKick)(fighter, fighters[opponent]);
      break;
    default:
      console.error(`Unexpected action type: ${actionType}`);
      return "invalidAction";
  }
  if (fighters[opponent].currentHealth <= 0) {
    return actionFighter; // Return the winner if there's a knockout
  }
  return null; // Fight continues
};

// Display the stats for a round
const displayRoundStats = (fighters, roundNumber) => {
  console.log(`\nRound ${roundNumber} Stats:`);
  fighters.forEach((fighter, index) => {
    console.log(`\n${fighter.name}:`);
    console.log(`  Punches Landed: ${fighter.stats.punchesLanded}`);
    console.log(`  Kicks Landed: ${fighter.stats.kicksLanded}`);
    console.log(
      `  Significant Punches: ${fighter.stats.significantPunchesLanded}`
    );
    console.log(`  Significant Kicks: ${fighter.stats.significantKicksLanded}`);
    console.log(`  Leg Kicks Landed: ${fighter.stats.legKicksLanded}`);
    console.log(`  Leg Kicks Checked: ${fighter.stats.legKicksChecked}`);
    console.log(
      `  Current Health: ${fighter.currentHealth}/${fighter.maxHealth}`
    );
  });
};

// Simulate a single round
const simulateRound = (fighters, roundNumber) => {
  // Announce round start
  console.log(`\nRound ${roundNumber} begins!`);
  let lastActionFighter;
  // Track initial stats for this round
  const initialStats = fighters.map((fighter) =>
    Object.assign({}, fighter.stats)
  );
  for (let action = 0; action < ACTIONS_PER_ROUND; action++) {
    const actionFighter = pickFighter(fighters, lastActionFighter);
    const roundWinner = simulateAction(fighters, actionFighter);
    // Immediate KO announcement
    if (roundWinner !== null) {
      console.log(
        `\n${fighters[roundWinner].name} wins by KO in round ${roundNumber}!`
      );
      return roundWinner;
    }
    lastActionFighter = actionFighter;
  }
  // Determine round winner based on damage dealt
  const damageDealt = [
    fighters[1].maxHealth - fighters[1].currentHealth,
    fighters[0].maxHealth - fighters[0].currentHealth,
  ];
  const roundWinner = damageDealt[0] > damageDealt[1] ? 0 : 1;
  fighters[roundWinner].roundsWon++;
  // Display round stats
  displayRoundStats(fighters, roundNumber);
  // Display strikes landed this round
  fighters.forEach((fighter, index) => {
    console.log(`\n${fighter.name} landed this round:`);
    console.log(
      `  Punches: ${
        fighter.stats.punchesLanded - initialStats[index].punchesLanded
      }`
    );
    console.log(
      `  Kicks: ${fighter.stats.kicksLanded - initialStats[index].kicksLanded}`
    );
    console.log(
      `  Leg Kicks: ${
        fighter.stats.legKicksLanded - initialStats[index].legKicksLanded
      }`
    );
  });
  return null;
};

// Simulate the entire fight
const simulateFight = (fighters) => {
  for (let round = 1; round <= ROUNDS_PER_FIGHT; round++) {
    const roundWinner = simulateRound(fighters, round);
    // This handles a KO
    if (roundWinner !== null) {
      displayFightStats(fighters, roundWinner);
      return roundWinner;
    }
    // Reset fighters' health for the next round
    fighters.forEach((fighter) => {
      fighter.currentHealth = Math.min(
        fighter.currentHealth + 20,
        fighter.maxHealth
      );
    });
  }
  // Determine winner by rounds won if no knockout
  const winner = fighters[0].roundsWon > fighters[1].roundsWon ? 0 : 1;
  console.log(`${fighters[winner].name} wins by decision!`);
  displayFightStats(fighters, winner);
  return winner;
};
exports.simulateFight = simulateFight;

// Display fight stats at the end of the fight
const displayFightStats = (fighters, winner) => {
  const loser = winner === 0 ? 1 : 0;
  console.log("\nFight Results:");
  console.log(`${fighters[winner].name} defeats ${fighters[loser].name}`);
  console.log("\nFinal Stats:");
  fighters.forEach((fighter, index) => {
    console.log(`\n${fighter.name}:`);
    console.log(`  Total Punches Landed: ${fighter.stats.punchesLanded}`);
    console.log(`  Total Kicks Landed: ${fighter.stats.kicksLanded}`);
    console.log(`  Total Punches Blocked: ${fighter.stats.punchesBlocked}`);
    console.log(`  Total Kicks Blocked: ${fighter.stats.kicksBlocked}`);
    console.log(
      `  Total Significant Punches: ${fighter.stats.significantPunchesLanded}`
    );
    console.log(
      `  Total Significant Kicks: ${fighter.stats.significantKicksLanded}`
    );
    console.log(`  Total Leg Kicks Landed: ${fighter.stats.legKicksLanded}`);
    console.log(`  Total Leg Kicks Checked: ${fighter.stats.legKicksChecked}`);
    console.log(`  Rounds Won: ${fighter.roundsWon}`);
    console.log(
      `  Final Health: ${fighter.currentHealth}/${fighter.maxHealth}`
    );
  });
};
exports.displayFightStats = displayFightStats;
