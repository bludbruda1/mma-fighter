import { formatTime, simulateTimePassing } from "./helper.js";

// Constants for fight simulation
const ROUNDS_PER_FIGHT = 3; // Number of rounds in a fight
const PUNCH_DAMAGE = {
  jab: 2, // Quick, less powerful
  cross: 4, // More power, straight punch
  hook: 5, // Strong, circular punch
  uppercut: 6, // Most powerful, upward punch
};
const BASE_KICK_DAMAGE = 9;
const DAMAGE_VARIATION_FACTOR = 0.25;
const LEG_KICK_MULTIPLIER = 1.1;
const RATING_DAMAGE_FACTOR = 0.3;

const COMBO_CHANCE = 0.4; // 40% chance to attempt a combo after a successful punch
const COMBO_SUCCESS_MODIFIER = 0.8; // Each subsequent punch in a combo is 20% less likely to land
const COMBO_FOLLOW_UPS = {
  jab: ["jab", "cross", "hook"],
  cross: ["hook", "uppercut"],
  hook: ["uppercut", "cross"],
  uppercut: ["hook", "cross"],
};

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
 * @param {string} strikeType - Type of strike (punch type or 'groundPunch')
 * @returns {number} Calculated damage
 */
const calculateDamage = (baseRating, isKick, isLegKick, strikeType = null) => {
  let baseDamage;
  if (isKick) {
    baseDamage = BASE_KICK_DAMAGE;
  } else if (strikeType === "groundPunch") {
    baseDamage = PUNCH_DAMAGE.jab; // Using jab damage as base for ground punches
  } else if (PUNCH_DAMAGE[strikeType]) {
    baseDamage = PUNCH_DAMAGE[strikeType];
  } else {
    throw new Error("Invalid strike type: " + strikeType);
  }

  const randomFactor = 1 + (Math.random() * 2 - 1) * DAMAGE_VARIATION_FACTOR;
  const legKickMultiplier = isLegKick ? LEG_KICK_MULTIPLIER : 1;
  const ratingFactor = baseRating * RATING_DAMAGE_FACTOR;

  return Math.round(
    (baseDamage + ratingFactor) * randomFactor * legKickMultiplier
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

// Action Functions

/**
 * Perform a kick action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @param {number} staminaImpact - Stamina impact on the action
 * @returns {string} Outcome of the action
 */
const doKick = (attacker, defender, staminaImpact) => {
  console.log(`${attacker.name} throws a kick at ${defender.name}`);
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
      false
    );
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

/**
 * Perform a single punch action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @param {number} staminaImpact - Stamina impact on the action
 * @param {string} punchType - Type of punch (jab, cross, hook, uppercut)
 * @param {number} comboCount - Number of punches already in this combo
 * @returns {[string, number, boolean]} Outcome of the action, time passed, and whether a combo follows
 */
const doPunch = (
  attacker,
  defender,
  staminaImpact,
  punchType,
  comboCount = 0
) => {
  console.log(
    `${attacker.name} throws a ${punchType}${
      comboCount > 0 ? " (combo punch #" + (comboCount + 1) + ")" : ""
    } at ${defender.name}`
  );

  const successChance =
    calculateProbability(
      attacker.Rating.striking * staminaImpact,
      defender.Rating.strikingDefence
    ) * Math.pow(COMBO_SUCCESS_MODIFIER, comboCount);

  const timePassed = comboCount === 0 ? simulateTimePassing(punchType) : 2;

  if (Math.random() < successChance) {
    const damage = calculateDamage(
      attacker.Rating.striking * staminaImpact,
      false,
      false,
      punchType
    );
    defender.currentHealth -= damage;

    // Update overall punch stats
    attacker.stats.punchesLanded++;

    // Update specific punch type stats
    attacker.stats[`${punchType}sLanded`] =
      (attacker.stats[`${punchType}sLanded`] || 0) + 1;

    console.log(
      `${defender.name} is hit by the ${punchType} for ${damage} damage`
    );

    // Determine if a combo follows
    const comboFollows = Math.random() < COMBO_CHANCE && comboCount < 2;

    return [punchType + "Landed", timePassed, comboFollows];
  } else {
    defender.stats.punchesBlocked++;

    // Update specific punch type blocked stats
    defender.stats[`${punchType}sBlocked`] =
      (defender.stats[`${punchType}sBlocked`] || 0) + 1;

    console.log(`${defender.name} blocks the ${punchType}`);
    return [`${punchType}Blocked`, timePassed, false];
  }
};

/**
 * Execute a full combo sequence or single punch
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @param {number} staminaImpact - Stamina impact on the action
 * @param {string} initialPunch - Type of the initial punch
 * @returns {[string, number]} Full combo outcome and total time passed
 */
const doCombo = (attacker, defender, staminaImpact, initialPunch) => {
  let comboCount = 0;
  let totalOutcome = "";
  let totalTime = 0;
  let currentPunch = initialPunch;

  while (true) {
    const [outcome, time, comboFollows] = doPunch(
      attacker,
      defender,
      staminaImpact,
      currentPunch,
      comboCount
    );
    totalOutcome += (comboCount > 0 ? " + " : "") + outcome;
    totalTime += time;

    if (!comboFollows) break;

    comboCount++;
    const followUpOptions = COMBO_FOLLOW_UPS[currentPunch];
    currentPunch =
      followUpOptions[Math.floor(Math.random() * followUpOptions.length)];
    console.log(`${attacker.name} follows up with a ${currentPunch}`);
  }

  return [totalOutcome, totalTime];
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
      false,
      "groundPunch"
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
    if (rand < (cumulativeProbability += tendencies.punchTendency)) {
      const punchTypes = ["jab", "cross", "hook", "uppercut"];
      return punchTypes[Math.floor(Math.random() * punchTypes.length)];
    }
    if (rand < (cumulativeProbability += tendencies.kickTendency))
      return "kick";
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

  // Decrease stamina only for the initial action
  fighter.stamina = Math.max(0, fighter.stamina - 2);
  const staminaImpact = calculateStaminaImpact(fighter.stamina);

  let outcome;
  let timePassed = 0;

  switch (actionType) {
    case "jab":
    case "cross":
    case "hook":
    case "uppercut":
      [outcome, timePassed] = doCombo(
        fighter,
        opponentFighter,
        staminaImpact,
        actionType
      );
      break;
    case "kick":
      outcome = doKick(fighter, opponentFighter, staminaImpact);
      timePassed = simulateTimePassing("kick");
      break;
    case "legKick":
      outcome = doLegKick(fighter, opponentFighter, staminaImpact);
      timePassed = simulateTimePassing("legKick");
      break;
    case "takedownAttempt":
      outcome = doTakedown(fighter, opponentFighter, staminaImpact);
      timePassed = simulateTimePassing("takedownAttempt");
      break;
    case "getUpAttempt":
      outcome = doGetUp(fighter, opponentFighter, staminaImpact);
      timePassed = simulateTimePassing("getUpAttempt");
      break;
    case "groundPunch":
      outcome = doGroundPunch(fighter, opponentFighter, staminaImpact);
      timePassed = simulateTimePassing("groundPunch");
      break;
    case "submission":
      outcome = doSubmission(fighter, opponentFighter, staminaImpact);
      timePassed = simulateTimePassing("submission");
      if (outcome === "submissionSuccessful") {
        return [actionFighter, timePassed];
      }
      break;
    default:
      console.error(`Unknown action type: ${actionType}`);
      outcome = "unknownAction";
      timePassed = 1; // Default to 1 second for unknown actions
      break;
  }

  // Ensure health doesn't go below 0 and check for knockout
  opponentFighter.currentHealth = Math.max(0, opponentFighter.currentHealth);
  if (opponentFighter.currentHealth === 0) {
    return [actionFighter, timePassed];
  }

  if (opponentFighter.isSubmitted) {
    return [actionFighter, timePassed];
  }

  return [null, timePassed];
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
      `  Jabs Landed: ${
        fighter.stats.jabsLanded - initialStats[index].jabsLanded
      }`
    );
    console.log(
      `  Crosses Landed: ${
        fighter.stats.crossesLanded - initialStats[index].crossesLanded
      }`
    );
    console.log(
      `  Hooks Landed: ${
        fighter.stats.hooksLanded - initialStats[index].hooksLanded
      }`
    );
    console.log(
      `  Uppercuts Landed: ${
        fighter.stats.uppercutsLanded - initialStats[index].uppercutsLanded
      }`
    );
    console.log(
      `  Kicks Landed: ${
        fighter.stats.kicksLanded - initialStats[index].kicksLanded
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
  calculateStaminaImpact,
};
