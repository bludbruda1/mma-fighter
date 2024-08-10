import { formatTime, simulateTimePassing } from "./helper.js";

// Constants for fight simulation
const ROUNDS_PER_FIGHT = 3; // Number of rounds in a fight
const SIGNIFICANT_HIT_CHANCE = 0.1; // 10% chance of significant hit
const BASE_PUNCH_DAMAGE = 4;
const BASE_KICK_DAMAGE = 9;
const DAMAGE_VARIATION_FACTOR = 0.25;
const SIGNIFICANT_STRIKE_MULTIPLIER = 1.7;
const LEG_KICK_MULTIPLIER = 1.1;
const RATING_DAMAGE_FACTOR = 0.3;

//Functions that set up an action

/**
 * Determine which fighter performs the next action
 * @param {Object[]} fighters - Array of fighter objects
 * @param {number|undefined} lastActionFighter - Index of the fighter who performed the last action
 * @returns {number} Index of the selected fighter
 */
const pickFighter = (fighters, lastActionFighter) => {
  let ratios = [fighters[0].Rating.output, fighters[1].Rating.output];
  if (lastActionFighter !== undefined) {
    ratios[lastActionFighter] *= 0.9; // Slightly decrease chance of same fighter acting twice in a row
  }
  const sum = ratios[0] + ratios[1];
  if (sum === 0) {
    return Math.random() < 0.5 ? 0 : 1; // Random choice if both ratios are 0
  }
  const rand = Math.random() * sum;
  return rand < ratios[0] ? 0 : 1;
};

/**
 * Calculate probability of a successful action
 * @param {number} offenseRating - Attacker's offensive rating
 * @param {number} defenseRating - Defender's defensive rating
 * @returns {number} Probability of success
 */
const calculateProbability = (offenseRating, defenseRating) => {
  return offenseRating / (offenseRating + defenseRating);
};

/**
 * Calculate damage for a strike
 * @param {number} baseRating - Attacker's base rating
 * @param {boolean} isKick - Whether the strike is a kick
 * @param {boolean} isLegKick - Whether the strike is a leg kick
 * @param {boolean} isSignificant - Whether the strike is significant
 * @returns {number} Calculated damage
 */
const calculateDamage = (
  baseRating,
  isKick,
  isLegKick,
  isSignificant = false
) => {
  const baseDamage = isKick ? BASE_KICK_DAMAGE : BASE_PUNCH_DAMAGE;
  const randomFactor = 1 + (Math.random() * 2 - 1) * DAMAGE_VARIATION_FACTOR;
  const significantMultiplier = isSignificant
    ? SIGNIFICANT_STRIKE_MULTIPLIER
    : 1;
  const legKickMultiplier = isLegKick ? LEG_KICK_MULTIPLIER : 1;
  const ratingFactor = baseRating * RATING_DAMAGE_FACTOR;
  return Math.round(
    (baseDamage + ratingFactor) *
      randomFactor *
      significantMultiplier *
      legKickMultiplier
  );
};

/**
 * Calculate stamina impact on action effectiveness
 * @param {number} stamina - Current stamina of the fighter
 * @returns {number} Stamina impact factor
 */
const calculateStaminaImpact = (stamina) => {
  return 0.7 + 0.3 * (stamina / 100); // Effectiveness ranges from 70% to 100%
};

/**
 * Determine if a strike is significant
 * @returns {boolean} Whether the strike is significant
 */
const isSignificantHit = () => {
  return Math.random() < SIGNIFICANT_HIT_CHANCE;
};

// Action Functions

/**
 * Perform a kick action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @param {number} staminaImpact - Stamina impact on the action
 * @param {boolean} isSignificant - Whether the kick is significant
 * @returns {string} Outcome of the action
 */
const doKick = (attacker, defender, staminaImpact, isSignificant) => {
  console.log(
    `${attacker.name} throws a${isSignificant ? " significant" : ""} kick at ${
      defender.name
    }`
  );
  if (
    Math.random() <
    calculateProbability(
      attacker.Rating.kicking * staminaImpact,
      defender.Rating.kickDefence
    )
  ) {
    const damage = calculateDamage(
      attacker.Rating.kicking * staminaImpact,
      true,
      false,
      isSignificant
    );
    defender.currentHealth -= damage;
    attacker.stats.kicksLanded++;
    if (isSignificant) attacker.stats.significantKicksLanded++;
    console.log(
      `${defender.name} is hit by the${
        isSignificant ? " significant" : ""
      } kick for ${damage} damage`
    );
    return isSignificant ? "significantKickLanded" : "kickLanded";
  } else {
    defender.stats.kicksBlocked++;
    console.log(
      `${defender.name} blocks the${isSignificant ? " significant" : ""} kick`
    );
    return isSignificant ? "significantKickBlocked" : "kickBlocked";
  }
};

/**
 * Perform a punch action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @param {number} staminaImpact - Stamina impact on the action
 * @param {boolean} isSignificant - Whether the punch is significant
 * @returns {string} Outcome of the action
 */
const doPunch = (attacker, defender, staminaImpact, isSignificant) => {
  console.log(
    `${attacker.name} throws a${isSignificant ? " significant" : ""} punch at ${
      defender.name
    }`
  );
  if (
    Math.random() <
    calculateProbability(
      attacker.Rating.striking * staminaImpact,
      defender.Rating.strikingDefence
    )
  ) {
    const damage = calculateDamage(
      attacker.Rating.striking * staminaImpact,
      false,
      false,
      isSignificant
    );
    defender.currentHealth -= damage;
    attacker.stats.punchesLanded++;
    if (isSignificant) attacker.stats.significantPunchesLanded++;
    console.log(
      `${defender.name} is hit by the${
        isSignificant ? " significant" : ""
      } punch for ${damage} damage`
    );
    return isSignificant ? "significantPunchLanded" : "punchLanded";
  } else {
    defender.stats.punchesBlocked++;
    console.log(
      `${defender.name} blocks the${isSignificant ? " significant" : ""} punch`
    );
    return isSignificant ? "significantPunchBlocked" : "punchBlocked";
  }
};

/**
 * Perform a leg kick action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @param {number} staminaImpact - Stamina impact on the action
 * @returns {string} Outcome of the action
 */
const doLegKick = (attacker, defender, staminaImpact) => {
  console.log(`${attacker.name} throws a leg kick`);
  if (
    Math.random() <
    calculateProbability(
      attacker.Rating.legKickOffence * staminaImpact,
      defender.Rating.legKickDefence
    )
  ) {
    const damage = calculateDamage(
      attacker.Rating.legKickOffence * staminaImpact,
      true,
      true
    );
    defender.currentHealth -= damage;
    attacker.stats.legKicksLanded++;
    attacker.stats.significantKicksLanded++;
    console.log(`${defender.name} is hit by the leg kick`);
    console.log(`${defender.name} takes ${damage} damage from the leg kick`);
    return "kickLanded";
  } else {
    const damage = calculateDamage(defender.Rating.legKickDefence, true, true);
    attacker.currentHealth -= damage;
    defender.stats.legKicksChecked++;
    console.log(`${defender.name} checks the kick`);
    console.log(
      `${attacker.name} takes ${damage} damage from the checked kick`
    );
    return "kickChecked";
  }
};

/**
 * Perform a ground punch action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @param {number} staminaImpact - Stamina impact on the action
 * @returns {string} Outcome of the action
 */
const doGroundPunch = (attacker, defender, staminaImpact) => {
  console.log(`${attacker.name} throws a ground punch at ${defender.name}`);
  if (
    Math.random() <
    calculateProbability(
      attacker.Rating.groundOffence * staminaImpact,
      defender.Rating.groundDefence
    )
  ) {
    const damage = calculateDamage(
      attacker.Rating.groundOffence * staminaImpact,
      false,
      false
    );
    defender.currentHealth -= damage;
    attacker.stats.groundPunchesLanded++;
    console.log(
      `${defender.name} is hit by the ground punch for ${damage} damage`
    );
    return "groundPunchLanded";
  } else {
    console.log(`${defender.name} blocks the ground punch`);
    return "groundPunchBlocked";
  }
};

/**
 * Perform a takedown action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @param {number} staminaImpact - Stamina impact on the action
 * @returns {string} Outcome of the action
 */
const doTakedown = (attacker, defender, staminaImpact) => {
  console.log(`${attacker.name} attempts a takedown on ${defender.name}`);
  attacker.stats.takedownsAttempted++;
  if (
    Math.random() <
    calculateProbability(
      attacker.Rating.takedownOffence * staminaImpact,
      defender.Rating.takedownDefence
    )
  ) {
    attacker.stats.takedownsLanded++;
    // Update ground states
    attacker.isStanding = false;
    attacker.isGroundOffense = true;
    attacker.isGroundDefense = false;
    defender.isStanding = false;
    defender.isGroundOffense = false;
    defender.isGroundDefense = true;
    // Add some damage for successful takedowns
    const damage = Math.round(10 * staminaImpact);
    defender.currentHealth -= damage;
    console.log(
      `${attacker.name} successfully takes down ${defender.name} for ${damage} damage`
    );
    return "takedownLanded";
  } else {
    defender.stats.takedownsDefended++;
    console.log(`${defender.name} defends the takedown`);
    // Both fighters remain standing
    attacker.isStanding = true;
    attacker.isGroundOffense = false;
    attacker.isGroundDefense = false;
    defender.isStanding = true;
    defender.isGroundOffense = false;
    defender.isGroundDefense = false;
    return "takedownDefended";
  }
};

/**
 * Perform an action to get up when on the ground
 * @param {Object} fighter - Fighter attempting to get up
 * @param {Object} opponent - Opponent fighter
 * @param {number} staminaImpact - Stamina impact on the action
 * @returns {string} Outcome of the action
 */
const doGetUp = (fighter, opponent, staminaImpact) => {
  console.log(`${fighter.name} attempts to get up`);
  fighter.stats.getUpsAttempted++;
  if (
    Math.random() <
    calculateProbability(
      fighter.Rating.getUpAbility * staminaImpact,
      opponent.Rating.groundOffence
    )
  ) {
    fighter.stats.getUpsSuccessful++;
    // Reset both fighters to standing position
    fighter.isStanding = true;
    fighter.isGroundOffense = false;
    fighter.isGroundDefense = false;
    opponent.isStanding = true;
    opponent.isGroundOffense = false;
    opponent.isGroundDefense = false;
    console.log(`${fighter.name} successfully gets up`);
    return "getUpSuccessful";
  } else {
    console.log(`${fighter.name} fails to get up`);
    return "getUpFailed";
  }
};

/**
 * Perform a submission action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @param {number} staminaImpact - Stamina impact on the action
 * @returns {string} Outcome of the action
 */
const doSubmission = (attacker, defender, staminaImpact) => {
  console.log(`${attacker.name} attempts a submission on ${defender.name}`);
  attacker.stats.submissionsAttempted++;
  if (
    Math.random() <
    calculateProbability(
      attacker.Rating.submissionOffense * staminaImpact,
      defender.Rating.submissionDefense
    )
  ) {
    attacker.stats.submissionsLanded++;
    console.log(`${attacker.name} successfully submits ${defender.name}!`);
    // flags that the loser has been submitted
    defender.isSubmitted = true;
    return "submissionSuccessful";
  } else {
    defender.stats.submissionsDefended++;
    console.log(`${defender.name} defends the submission`);
    return "submissionDefended";
  }
};

// Main Simulation Functions

/**
 * Determine the next action based on fighter's position and tendencies
 * @param {Object} fighter - Current fighter
 * @param {Object} opponent - Opponent fighter
 * @returns {string} The determined action
 */
const determineAction = (fighter, opponent) => {
  if (fighter.isStanding && opponent.isStanding) {
    // Standing logic
    const rand = Math.random() * 100;
    let cumulativeProbability = 0;
    const tendencies = fighter.Tendency.standingTendency;
    if (rand < (cumulativeProbability += tendencies.punchTendency))
      return isSignificantHit() ? "significantPunch" : "punch";
    if (rand < (cumulativeProbability += tendencies.kickTendency))
      return isSignificantHit() ? "significantKick" : "kick";
    if (rand < (cumulativeProbability += tendencies.legKickTendency))
      return "legKick";
    return "takedownAttempt";
  } else if (fighter.isGroundOffense) {
    // Ground offense logic
    const rand = Math.random() * 100;
    let cumulativeProbability = 0;
    const tendencies = fighter.Tendency.groundOffenseTendency;
    if (rand < (cumulativeProbability += tendencies.punchTendency))
      return "groundPunch";
    if (rand < (cumulativeProbability += tendencies.submissionTendency))
      return "submission";
    return "getUpAttempt";
  } else if (fighter.isGroundDefense) {
    // Ground defense logic
    const rand = Math.random() * 100;
    let cumulativeProbability = 0;
    const tendencies = fighter.Tendency.groundDefenseTendency;
    if (rand < (cumulativeProbability += tendencies.punchTendency))
      return "groundPunch";
    if (rand < (cumulativeProbability += tendencies.submissionTendency))
      return "submission";
    return "getUpAttempt";
  }
  // This should never happen, but TypeScript requires a return statement
  return "punch";
};

/**
 * Simulate one single action
 * @param {Object[]} fighters - Array of fighter objects
 * @param {number} actionFighter - Index of the current action fighter
 * @param {number} currentTime - Current time in the round
 * @returns {[number|null, number]} Winner (if any) and time passed
 */
const simulateAction = (fighters, actionFighter, currentTime) => {
  const opponent = actionFighter === 0 ? 1 : 0;
  const fighter = fighters[actionFighter];
  const opponentFighter = fighters[opponent];
  const actionType = determineAction(fighter, opponentFighter);
  console.log(`\n[${formatTime(currentTime)}]`);
  
  // Decrease stamina
  fighter.stamina = Math.max(0, fighter.stamina - 2);
  const staminaImpact = calculateStaminaImpact(fighter.stamina);

  let outcome;
  let timePassed = 0;  // Initialize timePassed to 0 aka no time has passed before the action takes place 

  switch (actionType) {
    case "punch":
    case "significantPunch":
      outcome = doPunch(
        fighter,
        opponentFighter,
        staminaImpact,
        actionType === "significantPunch"
      );
      break;
    case "kick":
    case "significantKick":
      outcome = doKick(
        fighter,
        opponentFighter,
        staminaImpact,
        actionType === "significantKick"
      );
      break;
    case "legKick":
      outcome = doLegKick(fighter, opponentFighter, staminaImpact);
      break;
    case "takedownAttempt":
      outcome = doTakedown(fighter, opponentFighter, staminaImpact);
      break;
    case "getUpAttempt":
      outcome = doGetUp(fighter, opponentFighter, staminaImpact);
      break;
    case "groundPunch":
      outcome = doGroundPunch(fighter, opponentFighter, staminaImpact);
      break;
    case "submission":
      outcome = doSubmission(fighter, opponentFighter, staminaImpact);
      if (outcome === "submissionSuccessful") {
        return [actionFighter, 0]; // Submission ends the fight immediately
      }
      break;
    default:
      console.error(`Unknown action type: ${actionType}`);
      outcome = "unknownAction";
      break;
  }

  // Ensure health doesn't go below 0 and check for knockout
  opponentFighter.currentHealth = Math.max(0, opponentFighter.currentHealth);
  if (opponentFighter.currentHealth === 0) {
    return [actionFighter, 0]; // Knockout with no time passed
  }

  // Calculate time passed only if the fight continues
  timePassed = Math.min(simulateTimePassing(actionType), currentTime);

if (opponentFighter.isSubmitted) {
  return [actionFighter, timePassed]; // Submission (should not happen here, but just in case)
}

return [null, timePassed]; // Fight continues
};

/**
 * Simulate a single round of the fight
 * @param {Object[]} fighters - Array of fighter objects
 * @param {number} roundNumber - Current round number
 * @returns {number|null} Winner of the round (if any)
 */
const simulateRound = (fighters, roundNumber) => {
  console.log(`\nRound ${roundNumber} begins!`);
  // Reset fighters to standing position and recover some stamina at the start of the round
  fighters.forEach((fighter) => {
    fighter.isStanding = true;
    fighter.isGroundOffense = false;
    fighter.isGroundDefense = false;
    fighter.stamina = Math.min(100, fighter.stamina + 20); // Recover 20 stamina between rounds
  });
  let lastActionFighter;
  let currentTime = 300; // possibly update in future to allow customization of the round length (in seconds)
  // Track initial stats for this round
  const initialStats = fighters.map((fighter) => ({ ...fighter.stats }));
  while (currentTime > 0) {
    const actionFighter = pickFighter(fighters, lastActionFighter);
    const [roundWinner, timePassed] = simulateAction(
      fighters,
      actionFighter,
      currentTime
    );
    // Simulate time passing
    currentTime -= Math.round(timePassed);
    // Check for KO or submission
    if (roundWinner !== null) {
      if (fighters[1 - roundWinner].currentHealth <= 0) {
        console.log(
          `\n${
            fighters[roundWinner].name
          } wins by KO in round ${roundNumber} at ${formatTime(currentTime)}!`
        );
      } else {
        console.log(
          `\n${
            fighters[roundWinner].name
          } wins by submission in round ${roundNumber} at ${formatTime(
            currentTime
          )}!`
        );
      }
      return roundWinner;
    }
    lastActionFighter = actionFighter;
  }
  console.log("\nEnd of Round");
  // Determine round winner based on damage dealt
  const damageDealt = [
    fighters[1].maxHealth - fighters[1].currentHealth,
    fighters[0].maxHealth - fighters[0].currentHealth,
  ];
  const roundWinner = damageDealt[0] > damageDealt[1] ? 0 : 1;
  fighters[roundWinner].roundsWon++;
  // Display round stats
  displayRoundStats(fighters, roundNumber, initialStats);
  return null; // No KO or submission
};

/**
 * Display the stats for a round
 * @param {Object[]} fighters - Array of fighter objects
 * @param {number} roundNumber - Current round number
 * @param {Object[]} initialStats - Initial stats at the start of the round
 */
const displayRoundStats = (fighters, roundNumber, initialStats) => {
  console.log(`\nRound ${roundNumber} Stats:`);
  fighters.forEach((fighter, index) => {
    console.log(`\n${fighter.name}:`);
    console.log(
      `  Punches Landed: ${
        fighter.stats.punchesLanded - initialStats[index].punchesLanded
      }`
    );
    console.log(
      `  Kicks Landed: ${
        fighter.stats.kicksLanded - initialStats[index].kicksLanded
      }`
    );
    console.log(
      `  Significant Punches: ${
        fighter.stats.significantPunchesLanded -
        initialStats[index].significantPunchesLanded
      }`
    );
    console.log(
      `  Significant Kicks: ${
        fighter.stats.significantKicksLanded -
        initialStats[index].significantKicksLanded
      }`
    );
    console.log(
      `  Leg Kicks Landed: ${
        fighter.stats.legKicksLanded - initialStats[index].legKicksLanded
      }`
    );
    console.log(
      `  Leg Kicks Checked: ${
        fighter.stats.legKicksChecked - initialStats[index].legKicksChecked
      }`
    );
    console.log(
      `  Takedowns Landed: ${
        fighter.stats.takedownsLanded - initialStats[index].takedownsLanded
      }`
    );
    console.log(
      `  Ground Punches Landed: ${
        fighter.stats.groundPunchesLanded -
        initialStats[index].groundPunchesLanded
      }`
    );
    console.log(
      `  Submissions Attempted: ${
        fighter.stats.submissionsAttempted -
        initialStats[index].submissionsAttempted
      }`
    );
    console.log(
      `  Submissions Landed: ${
        fighter.stats.submissionsLanded - initialStats[index].submissionsLanded
      }`
    );
    console.log(
      `  Current Position: ${
        fighter.isStanding
          ? "Standing"
          : fighter.isGroundOffense
          ? "Ground Offense"
          : "Ground Defense"
      }`
    );
    console.log(
      `  Current Health: ${fighter.currentHealth}/${fighter.maxHealth}`
    );
  });
};

/**
 * Simulate the entire fight
 * @param {Object[]} fighters - Array of fighter objects
 * @returns {number} Index of the winning fighter
 */
const simulateFight = (fighters) => {
  let method = "decision";
  let roundEnded = ROUNDS_PER_FIGHT;

  for (let round = 1; round <= ROUNDS_PER_FIGHT; round++) {
    const roundWinner = simulateRound(fighters, round);

    // Check if the round ended early (KO or submission)
    if (roundWinner !== null) {
      // Determine if it's a KO or submission
      if (fighters[1 - roundWinner].currentHealth <= 0) {
        method = "knockout";
      } else if (fighters[1 - roundWinner].isSubmitted) {
        method = "submission";
      }
      roundEnded = round;
      displayFightStats(fighters, roundWinner);
      return {
        winner: roundWinner,
        winnerName: fighters[roundWinner].name,
        loserName: fighters[1 - roundWinner].name,
        method: method,
        roundEnded: roundEnded,
      };
    }

    // Reset fighters' health for the next round
    fighters.forEach((fighter) => {
      fighter.currentHealth = Math.min(
        fighter.currentHealth + 20,
        fighter.maxHealth
      );
      fighter.isSubmitted = false;
    });
  }

  // If we've reached this point, it's a decision
  method = "decision";
  // Determine winner by rounds won
  const winner = fighters[0].roundsWon > fighters[1].roundsWon ? 0 : 1;
  console.log(`${fighters[winner].name} wins by ${method}!`);
  displayFightStats(fighters, winner);
  return {
    winner: winner,
    winnerName: fighters[winner].name,
    loserName: fighters[1 - winner].name,
    method: method,
    roundEnded: roundEnded,
  };
};

/**
 * Display fight stats at the end of the fight
 * @param {Object[]} fighters - Array of fighter objects
 * @param {number} winner - Index of the winning fighter
 */
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
    console.log(`  Total Takedowns Landed: ${fighter.stats.takedownsLanded}`);
    console.log(
      `  Total Ground Punches Landed: ${fighter.stats.groundPunchesLanded}`
    );
    console.log(
      `  Total Submissions Attempted: ${fighter.stats.submissionsAttempted}`
    );
    console.log(
      `  Total Submissions Landed: ${fighter.stats.submissionsLanded}`
    );
    console.log(
      `  Total Submissions Defended: ${fighter.stats.submissionsDefended}`
    );
    console.log(`  Rounds Won: ${fighter.roundsWon}`);
    console.log(
      `  Final Health: ${fighter.currentHealth}/${fighter.maxHealth}`
    );
  });
};

export {
  simulateFight,
  displayFightStats,
  doKick,
  doPunch,
  doLegKick,
  doGroundPunch,
  doTakedown,
  doGetUp,
  doSubmission,
  isSignificantHit,
  calculateStaminaImpact,
};
