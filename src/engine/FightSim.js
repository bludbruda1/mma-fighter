import {
  formatTime,
  simulateTimePassing,
  isKnockedOut,
  recoverStaminaEndRound,
  updateFightStats,
} from "./helper.js";
import {
  calculateStrikeDamage,
  calculateProbabilities,
  calculateProbability,
  calculateTDProbability,
  calculateClinchProbability,
  determineStandingAction,
  determineClinchAction,
  determineGroundAction,
} from "./fightCalculations.js";
import { calculateRoundStats } from "./FightStatistics.js";
import { doApplyChoke, doEngageArm, doLockChoke, doIsolateArm, doLockTriangle, doApplyPressure, doTrapHead, doCloseGuard } from "./subStages.js"

// Constants for fight simulation
const ROUNDS_PER_FIGHT = 3; // Number of rounds in a fight
let totalActionsPerformed = 0;

// Constants for combinations
const COMBO_CHANCE = 0.4; // 40% chance to attempt a combo after a successful punch
const COMBO_SUCCESS_MODIFIER = 0.8; // Each subsequent punch in a combo is 20% less likely to land
const MAX_COMBO_LENGTH = 4; // Maximum number of punches in a combo
const COMBO_FOLLOW_UPS = {
  // Punch follow-ups
  jab: ["jab", "cross", "hook", "overhand", "bodyPunch", "legKick", "bodyKick"],
  cross: ["hook", "uppercut", "bodyPunch", "headKick", "legKick"],
  hook: ["uppercut", "cross", "bodyPunch", "headKick"],
  uppercut: ["hook", "cross", "bodyKick"],
  overhand: ["hook", "bodyPunch", "legKick"],
  bodyPunch: ["hook", "uppercut", "cross", "overhand", "bodyKick"],

  // Kick follow-ups
  legKick: ["jab", "cross", "hook", "bodyKick", "headKick"],
  bodyKick: ["jab", "cross", "hook", "headKick", "legKick"],
  headKick: ["jab", "cross", "legKick", "bodyKick"],
};

// Constants for positions a fighter can be in
const FIGHTER_POSITIONS = {
  STANDING: "standing",
  CLINCH_OFFENCE: "clinchOffence",
  CLINCH_DEFENCE: "clinchDefence",
  GROUND_FULL_GUARD_TOP: "groundFullGuardTop",
  GROUND_FULL_GUARD_POSTURE_UP: "groundFullGuardPostureUp",
  GROUND_FULL_GUARD_BOTTOM: "groundFullGuardBottom",
  GROUND_HALF_GUARD_TOP: "groundHalfGuardTop",
  GROUND_HALF_GUARD_BOTTOM: "groundHalfGuardBottom",
  GROUND_SIDE_CONTROL_TOP: "groundSideControlTop",
  GROUND_SIDE_CONTROL_BOTTOM: "groundSideControlBottom",
  GROUND_MOUNT_TOP: "groundMountTop",
  GROUND_MOUNT_POSTURE_UP: "groundMountPostureUp",
  GROUND_MOUNT_BOTTOM: "groundMountBottom",
  GROUND_BACK_CONTROL_OFFENCE: "groundBackControlOffence",
  GROUND_BACK_CONTROL_DEFENCE: "groundBackControlDefence",
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
    ratios[lastActionFighter] *= 0.95; // Slightly decrease chance of same fighter acting twice in a row
  }
  const sum = ratios[0] + ratios[1];
  if (sum === 0) {
    return Math.random() < 0.5 ? 0 : 1; // Random choice if both ratios are 0
  }
  const rand = Math.random() * sum;
  return rand < ratios[0] ? 0 : 1;
};

// Action Functions

/**
 * Simulate the start of the fight
 * @param {Object} fighter - The fighter initiating the fight start
 * @param {Object} opponent - The opponent fighter
 * @param {number} currentTime - Current fight time
 * @param {Object} logger - Fight event logger
 * @returns {[string, number]} Outcome of the action and time passed
 */
const doFightStart = (fighter, opponent, currentTime, logger) => {
  const events = [
    `${fighter.name} and ${opponent.name} touch gloves`,
    `${fighter.name} refuses glove touch`,
    `${fighter.name} immediately steps forward and takes the center of the octagon`,
    `${fighter.name} and ${opponent.name} cautiously circle each other`,
    `${fighter.name} feints, looking for an opening`,
    `${fighter.name} verbally taunts ${opponent.name}`,
    `${fighter.name} and ${opponent.name} both stay outside of stiking range moving slowly`,
  ];

  const event = events[Math.floor(Math.random() * events.length)];
  console.log(event);

  // Log the fight start event
  logger.logFightStartAction(fighter, opponent, event, currentTime);

  const timePassed = simulateTimePassing("fightStart");

  return ["fightStarted", timePassed];
};

/**
 * Perform a kick action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @param {string} kickType - Type of kick (leg kick, body kick, head kick etc)
 * @param {number} comboCount - Number of strikes already in this combo
 * @returns {[string, number, boolean]} Outcome of the action, time passed, and whether a combo follows
 */
const doKick = (attacker, defender, kickType, comboCount = 0, currentTime, logger) => {
  // This just cleans up the text output
  let displayKickType = kickType
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();

  console.log(
    `${attacker.name} throws a ${displayKickType}${
      comboCount > 0 ? " (combo strike #" + (comboCount + 1) + ")" : ""
    } at ${defender.name}`
  );

  // Calculate probabilities for this kick
  let { hitChance, blockChance, evadeChance, missChance } =
    calculateProbabilities(attacker, defender, "kick");

  // Apply combo success modifier
  const comboModifier = Math.pow(COMBO_SUCCESS_MODIFIER, comboCount);
  hitChance *= comboModifier;

  // Redistribute the reduced hit chance to other outcomes
  const hitChanceReduction = hitChance * (1 - comboModifier);
  blockChance += hitChanceReduction * 0.5;
  evadeChance += hitChanceReduction * 0.3;
  missChance += hitChanceReduction * 0.2;

  // Normalize probabilities
  const total = hitChance + blockChance + evadeChance + missChance;
  hitChance /= total;
  blockChance /= total;
  evadeChance /= total;
  missChance /= total;

  // Determine the outcome based on calculated probabilities
  const outcome = Math.random();
  const timePassed = comboCount === 0 ? simulateTimePassing(kickType) : 3; // Combo kicks are quicker

  let totalTimePassed = timePassed;
  let outcomeDescription = "";

  if (outcome < hitChance) {
    // Hit logic
    const damageResult = calculateStrikeDamage(attacker, defender, kickType);
    defender.health[damageResult.target] = Math.max(
      0,
      defender.health[damageResult.target] - damageResult.damage
    );

    logger.logStrike(attacker, defender, kickType, "landed", damageResult, currentTime);
    updateFightStats(attacker, defender, "kick", kickType, "landed");

    console.log(
      `${defender.name} is hit by the ${displayKickType} for ${damageResult.damage} damage to the ${damageResult.target}`
    );

    // Special case for leg kicks
    if (kickType === "legKick") {
      console.log(`${defender.name}'s mobility is affected by the leg kick`);
      // We could implement additional effects here, like reduced movement or increased chance of knockdown
    }

    outcomeDescription = `${kickType}Landed`;
    if (damageResult.isCritical) {
      outcomeDescription += "Critical";
      console.log("It's a critical hit!");
    }

    if (damageResult.isKnockout) {
      outcomeDescription += "Knockout";
      console.log(`${defender.name} has been knocked out!`);
      defender.isKnockedOut = true;
    } else if (damageResult.isStun) {
      outcomeDescription += "Stun";
      console.log(`${defender.name} is stunned!`);
      const finishAttempt = doSeekFinish(attacker, defender);

      if (finishAttempt.result === "Knockout") {
        outcomeDescription += "Knockout";
        defender.isKnockedOut = true;
      }

      // Add the time passed during the finish attempt
      totalTimePassed += finishAttempt.timePassed;
    }
  } else if (outcome < hitChance + blockChance) {
    // Block logic
    defender.stats.kicksBlocked = (defender.stats.kicksBlocked || 0) + 1;
    logger.logStrike(attacker, defender, kickType, "blocked", 0, currentTime);
    updateFightStats(attacker, defender, "kick", kickType, "blocked");

    console.log(`${defender.name} blocks the ${displayKickType}`);

    // Special case for checked leg kicks
    if (kickType === "legKick") {
      const damageResult = calculateStrikeDamage(defender, attacker, "legKick");
      attacker.health[damageResult.target] = Math.max(
        0,
        attacker.health[damageResult.target] - damageResult.damage
      );
      console.log(
        `${attacker.name} takes ${damageResult.damage} damage to the ${damageResult.target} from the checked leg kick`
      );
    }

    outcomeDescription = `${kickType}Blocked`;
  } else if (outcome < hitChance + blockChance + evadeChance) {
    // Evade logic
    defender.stats.kicksEvaded = (defender.stats.kicksEvaded || 0) + 1;
    logger.logStrike(attacker, defender, kickType, "evaded", 0, currentTime);
    updateFightStats(attacker, defender, "kick", kickType, "evaded");

    console.log(`${defender.name} evades the ${displayKickType}`);
    outcomeDescription = `${kickType}Evaded`;
  } else {
    // Miss logic
    attacker.stats.kicksMissed = (attacker.stats.kicksMissed || 0) + 1;
    logger.logStrike(attacker, defender, kickType, "missed", 0, currentTime);
    updateFightStats(attacker, defender, "kick", kickType, "missed");

    console.log(
      `${attacker.name}'s ${displayKickType} misses ${defender.name}`
    );
    outcomeDescription = `${kickType}Missed`;
  }

  // Use COMBO_CHANCE, reduced for each strike in the combo
  const comboChance = COMBO_CHANCE * Math.pow(0.8, comboCount);

  // Determine if a combo follows (only for certain kick types and if not at max combo length)
  const comboFollows =
    ["headKick", "bodyKick", "legKick"].includes(kickType) &&
    Math.random() < comboChance &&
    comboCount < MAX_COMBO_LENGTH - 1 &&
    !outcomeDescription.includes("Knockout") &&
    !outcomeDescription.includes("Stun");

  return [outcomeDescription, totalTimePassed, comboFollows];
};

/**
 * Perform a single punch action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @param {string} punchType - Type of punch (jab, cross, hook, uppercut etc)
 * @param {number} comboCount - Number of strikes already in this combo
 * @returns {[string, number, boolean]} Outcome of the action, time passed, and whether a combo follows
 */
const doPunch = (attacker, defender, punchType, comboCount = 0, currentTime, logger) => {
  // This just cleans up the text output
  let displayPunchType = punchType
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();

  console.log(
    `${attacker.name} throws a ${displayPunchType}${
      comboCount > 0 ? " (combo punch #" + (comboCount + 1) + ")" : ""
    } at ${defender.name}`
  );

  // Calculate probabilities for this punch
  let { hitChance, blockChance, evadeChance, missChance } =
    calculateProbabilities(attacker, defender, "punch");

  // Apply combo success modifier
  const comboModifier = Math.pow(COMBO_SUCCESS_MODIFIER, comboCount);
  hitChance *= comboModifier;

  // Redistribute the reduced hit chance to other outcomes
  const hitChanceReduction = hitChance * (1 - comboModifier);
  blockChance += hitChanceReduction * 0.5;
  evadeChance += hitChanceReduction * 0.3;
  missChance += hitChanceReduction * 0.2;

  // Normalize probabilities
  const total = hitChance + blockChance + evadeChance + missChance;
  hitChance /= total;
  blockChance /= total;
  evadeChance /= total;
  missChance /= total;

  // Determine the outcome based on calculated probabilities
  const outcome = Math.random();
  const timePassed = comboCount === 0 ? simulateTimePassing(punchType) : 2; // Combo punches are quicker

  let totalTimePassed = timePassed;
  let outcomeDescription = "";

  if (outcome < hitChance) {
    // Hit logic
    const damageResult = calculateStrikeDamage(attacker, defender, punchType);
    defender.health[damageResult.target] = Math.max(
      0,
      defender.health[damageResult.target] - damageResult.damage
    );

    logger.logStrike(attacker, defender, punchType, "landed", damageResult, currentTime);
    updateFightStats(attacker, defender, "punch", punchType, "landed");

    outcomeDescription = `${punchType}Landed`;
    if (damageResult.isCritical) {
      outcomeDescription += "Critical";
      console.log("It's a critical hit!");
    }

    console.log(
      `${defender.name} is hit by the ${displayPunchType} for ${damageResult.damage} damage to the ${damageResult.target}`
    );

    if (damageResult.isKnockout) {
      outcomeDescription += "Knockout";
      console.log(`${defender.name} has been knocked out!`);
      defender.isKnockedOut = true;
    } else if (damageResult.isStun) {
      outcomeDescription += "Stun";
      console.log(`${defender.name} is stunned!`);
      const finishAttempt = doSeekFinish(attacker, defender, currentTime, logger);

      if (finishAttempt.result === "Knockout") {
        outcomeDescription += "Knockout";
        defender.isKnockedOut = true;
      }

      // Add the time passed during the finish attempt
      totalTimePassed += finishAttempt.timePassed;
    }

  } else if (outcome < hitChance + blockChance) {
    // Block logic
    defender.stats.punchesBlocked = (defender.stats.punchesBlocked || 0) + 1;
    logger.logStrike(attacker, defender, punchType, "blocked", 0, currentTime);
    updateFightStats(attacker, defender, "punch", punchType, "blocked");
    outcomeDescription = `${punchType}Blocked`;
    console.log(`${defender.name} blocks the ${displayPunchType}`);
  } else if (outcome < hitChance + blockChance + evadeChance) {
    // Evade logic
    defender.stats.punchesEvaded = (defender.stats.punchesEvaded || 0) + 1;
    logger.logStrike(attacker, defender, punchType, "evaded", 0, currentTime);
    updateFightStats(attacker, defender, "punch", punchType, "evaded");
    outcomeDescription = `${punchType}Evaded`;
    console.log(`${defender.name} evades the ${displayPunchType}`);
  } else {
    // Miss logic
    attacker.stats.punchesMissed = (attacker.stats.punchesMissed || 0) + 1;
    logger.logStrike(attacker, defender, punchType, "missed", 0, currentTime);
    updateFightStats(attacker, defender, "punch", punchType, "missed");
    outcomeDescription = `${punchType}Missed`;
    console.log(
      `${attacker.name}'s ${displayPunchType} misses ${defender.name}`
    );
  }

  // Use COMBO_CHANCE, reduced for each punch in the combo
  const comboChance = COMBO_CHANCE * Math.pow(0.8, comboCount);

  // Determine if a combo follows (only for certain punch types and if not at max combo length)
  const comboFollows =
    ["jab", "cross", "hook", "uppercut", "bodyPunch"].includes(punchType) &&
    Math.random() < comboChance &&
    comboCount < MAX_COMBO_LENGTH - 1 &&
    !outcomeDescription.includes("Knockout") &&
    !outcomeDescription.includes("Stun");

  console.log(
    `Attacker -${attacker.name} 
       Defender - ${defender.name}
       Punch - ${punchType}
       Punch Thrown - ${attacker.stats.punchsThrown}
       `
  );

  return [outcomeDescription, totalTimePassed, comboFollows];
};

/**
 * Execute a full combo sequence or single strike
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @param {string} initialStrike - Type of the initial strike
 * @returns {[string, number]} Full combo outcome and total time passed
 */
const doCombo = (attacker, defender, initialStrike, currentTime, logger) => {
  let comboCount = 0;
  let totalOutcome = "";
  let totalTime = 0;
  let currentStrike = initialStrike;

  while (comboCount < MAX_COMBO_LENGTH) {
    const [outcome, time, comboFollows] = currentStrike.includes("Kick")
      ? doKick(attacker, defender, currentStrike, comboCount, currentTime, logger)
      : doPunch(attacker, defender, currentStrike, comboCount, currentTime, logger);

    totalOutcome += (comboCount > 0 ? " + " : "") + outcome;
    totalTime += time;

    // Check if the defender is knocked out after each punch
    if (isKnockedOut(defender)) {
      break;
    }

    if (!comboFollows) break;

    comboCount++;
    const followUpOptions = COMBO_FOLLOW_UPS[currentStrike];
    if (!followUpOptions || followUpOptions.length === 0) {
      break;
    }

    currentStrike =
      followUpOptions[Math.floor(Math.random() * followUpOptions.length)];

    // This just cleans up the text output
    let displayStrikeType = currentStrike
      .replace(/([A-Z])/g, " $1")
      .trim()
      .toLowerCase();

    console.log(`${attacker.name} follows up with a ${displayStrikeType}`);
  }

  return [totalOutcome, totalTime];
};

/**
 * Simulate a fighter seeking to finish the fight against a stunned opponent
 * @param {Object} attacker - The attacking fighter
 * @param {Object} defender - The defending (stunned) fighter
 * @returns {Object} The result of the finishing sequence
 */
const doSeekFinish = (attacker, defender, currentTime, logger) => {
  console.log(
    `${attacker.name} is seeking to finish the fight against the stunned ${defender.name}!`
  );

  const MAX_ATTEMPTS = 10;
  let attempts = 0;
  let totalDamage = 0;
  let finishResult = null;

  while (attempts < MAX_ATTEMPTS && !finishResult) {
    attempts++;

    // Determine strike type (favoring power strikes)
    const strikeTypes = ["cross", "hook", "uppercut", "overhand"];
    const strikeType =
      strikeTypes[Math.floor(Math.random() * strikeTypes.length)];

    // Calculate hit probability (higher due to opponent being stunned)
    const { hitChance } = calculateProbabilities(attacker, defender, "punch");
    const stunnedHitChance = Math.min(hitChance * 1.5, 0.9); // 50% increase, max 90%

    if (Math.random() < stunnedHitChance) {
      // Strike lands
      const damageResult = calculateStrikeDamage(
        attacker,
        defender,
        strikeType
      );
      totalDamage += damageResult.damage;

      logger.logStrike(attacker, defender, strikeType, "landed", damageResult, currentTime);
      updateFightStats(attacker, defender, "punch", strikeType, "landed");

      console.log(
        `${attacker.name} lands a ${strikeType} for ${damageResult.damage} damage!`
      );
      if (damageResult.isCritical) {
        console.log("It's a clean hit!");
      }

      // Apply damage
      defender.health[damageResult.target] = Math.max(
        0,
        defender.health[damageResult.target] - damageResult.damage
      );

      // Check for knockout
      if (damageResult.isKnockout || defender.health.head <= 0) {
        finishResult = "knockout";
        console.log(`${defender.name} has been knocked out!`);
        break;
      }

      // Check for stun extension
      if (damageResult.isStun) {
        console.log(`${defender.name} remains stunned!`);
      } else if (Math.random() < 0.15) {
        // 15% chance to recover if not re-stunned
        console.log(`${defender.name} has recovered from the stun!`);
        break;
      }
    } else {
      console.log(`${attacker.name}'s ${strikeType} misses!`);
      logger.logStrike(attacker, defender, strikeType, "missed", 0, currentTime);
      updateFightStats(attacker, defender, "punch", strikeType, "missed");
      // Higher chance for defender to recover when attacker misses
      if (Math.random() < 0.2) {
        // 20% chance to recover on a miss
        console.log(`${defender.name} has recovered!`);
        break;
      }
    }
    console.log(
      `${defender.name}'s current health - Head: ${defender.health.head}, Body: ${defender.health.body}, Legs: ${defender.health.legs}`
    );
  }

  const timePassed = simulateTimePassing("seekFinish") * attempts;

  if (!finishResult) {
    console.log(
      `${attacker.name} couldn't finish the fight. ${defender.name} survives the onslaught!`
    );
  }

  return {
    result: finishResult || "survived",
    damageDealt: totalDamage,
    timePassed: timePassed,
  };
};

/**
 * Chance to a fighter to wait and look for openings
 * @param {Object} fighter - Fighter looking for the opening
 * @param {Object} opponent - Opponent Fighter
 * @returns {string} Outcome of the action
 */
const doWait = (fighter, opponent) => {
  console.log(`${fighter.name} looks for an opening.`);

  return "wait";
};

/**
 * Perform a ground strike action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @param {string} strikeType - Type of ground strike (punch, elbow)
 * @returns {[string, number]} Outcome of the action and time passed
 */
const doGroundStrike = (attacker, defender, strikeType, currentTime, logger) => {
  // This just cleans up the text output
  let displayStrikeType = strikeType
  .replace(/([A-Z])/g, " $1")
  .trim()
  .toLowerCase();
  
  console.log(`${attacker.name} throws a ${displayStrikeType} at ${defender.name}`);

  const hitChance = calculateProbability(
    attacker.Rating.groundStriking,
    defender.Rating.groundDefence
  );

  const timePassed = simulateTimePassing(strikeType);

  if (Math.random() < hitChance) {
    // Hit logic
    const damageResult = calculateStrikeDamage(attacker, defender, strikeType);
    defender.health[damageResult.target] = Math.max(
      0,
      defender.health[damageResult.target] - damageResult.damage
    );

    logger.logStrike(attacker, defender, strikeType, "landed", damageResult, currentTime);
    updateFightStats(attacker, defender, "groundStrike", strikeType, "landed");

    console.log(
      `${defender.name} is hit by the ${displayStrikeType} for ${damageResult.damage} damage to the ${damageResult.target}`
    );

    return [`${strikeType}Landed`, timePassed];
  } else {
    // Block logic
    logger.logStrike(attacker, defender, strikeType, "blocked", 0, currentTime);
    updateFightStats(attacker, defender, "groundStrike", strikeType, "blocked");
    console.log(`${defender.name} blocks the ${displayStrikeType}`);
    return [`${strikeType}Blocked`, timePassed];
  }
};

/**
 * Attempt to pull fighter into a clinch position
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @returns {string} Outcome of the action
 */
const doClinch = (attacker, defender, currentTime, logger) => {
  console.log(`${attacker.name} attempts to clinch ${defender.name}`);
  const { success, failure } = calculateClinchProbability(attacker, defender);

  const random = Math.random();

  if (random < success) {
    // Set attacker's states
    attacker.position = FIGHTER_POSITIONS.CLINCH_OFFENCE;
    defender.position = FIGHTER_POSITIONS.CLINCH_DEFENCE;

    logger.logClinch(attacker, defender, "successful", currentTime);
    updateFightStats(attacker, defender, "clinch", "clinch", "successful");

    console.log(
      `${attacker.name} successfully gets ${defender.name} in a clinch against the cage`
    );
    return "clinchSuccessful";
  } else if (random < success + failure) {
    console.log(`${defender.name} defends the clinch attempt`);
    logger.logClinch(attacker, defender, "defended", currentTime);
    updateFightStats(attacker, defender, "clinch", "clinch", "defended");
    return "clinchFailed";
  }
};

/**
 * Defender attempts to exit clinch position
 *  @param {Object} defender - Defending fighter
 * @param {Object} attacker - Attacking fighter
 * @returns {string} Outcome of the action
 */
const exitClinch = (defender, attacker, currentTime, logger) => {
  console.log(`${defender.name} attempts to exit the clinch`);

  attacker.stats.clinchExits = (attacker.stats.clinchExits || 0) + 1;

  const exitChance = calculateProbability(
    defender.Rating.clinchControl,
    attacker.Rating.clinchGrappling
  );

  if (Math.random() < exitChance) {
    // Successfully exit the clinch
    attacker.position = FIGHTER_POSITIONS.STANDING;
    defender.position = FIGHTER_POSITIONS.STANDING;

    logger.logPositionChange(defender, attacker, "successful", currentTime);
    console.log(`${defender.name} successfully exits the clinch`);
    return "clinchExitSuccessful";
  } else {
    logger.logPositionChange(defender, attacker, "unsuccessful", currentTime);
    console.log(`${defender.name} fails to exit the clinch`);
    return "clinchExitFailed";
  }
};

/**
 * Perform a strike action in the clinch
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @returns {string} Outcome of the action
 */
const doClinchStrike = (attacker, defender, currentTime, logger) => {
  console.log(`${attacker.name} attempts a clinch strike on ${defender.name}`);

  // Calculate probabilities for this clinch strike (I am currently ignoring missChance as it is not needed to fill out the probablities)
  let { hitChance, blockChance, evadeChance } = calculateProbabilities(
    attacker,
    defender,
    "clinchStrike"
  );

  // Determine the outcome based on calculated probabilities
  const outcome = Math.random();
  const timePassed = simulateTimePassing("clinchStrike");

  if (outcome < hitChance) {
    // Hit logic
    const damageResult = calculateStrikeDamage(
      attacker,
      defender,
      "clinchStrike"
    );
    defender.health[damageResult.target] = Math.max(
      0,
      defender.health[damageResult.target] - damageResult.damage
    );

    logger.logStrike(attacker, defender, "clinchStrike", "landed", damageResult, currentTime);
    updateFightStats(attacker, defender, "punch", "clinchStrike", "landed");

    console.log(
      `${defender.name} is hit by the clinch strike for ${damageResult.damage} damage to the ${damageResult.target}`
    );
    return [`clinchStrikeLanded`, timePassed];
  } else if (outcome < hitChance + blockChance) {
    // Block logic
    logger.logStrike(attacker, defender, "clinchStrike", "blocked", 0, currentTime);
    updateFightStats(attacker, defender, "punch", "clinchStrike", "blocked");

    console.log(`${defender.name} blocks the clinch strike`);
    return [`clinchStrikeBlocked`, timePassed];
  } else if (outcome < hitChance + blockChance + evadeChance) {
    // Evade logic
    logger.logStrike(attacker, defender, "clinchStrike", "evaded", 0, currentTime);
    updateFightStats(attacker, defender, "punch", "clinchStrike", "evaded");

    console.log(`${defender.name} evades the clinch strike`);
    return [`clinchStrikeEvaded`, timePassed];
  } else {
    // Miss logic
    logger.logStrike(attacker, defender, "clinchStrike", "missed", 0, currentTime);
    updateFightStats(attacker, defender, "punch", "clinchStrike", "missed");

    console.log(`${attacker.name}'s clinch strike misses ${defender.name}`);
    return [`clinchStrikeMissed`, timePassed];
  }
};

/**
 * Perform a trip or throw action when in the clinch
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @returns {string} Outcome of the action
 */
const doClinchTakedown = (attacker, defender, currentTime, logger) => {
  const takedownType = Math.random() < 0.5 ? "trip" : "throw";
  console.log(
    `${attacker.name} attempts a ${takedownType} from the clinch on ${defender.name}`
  );

  const takedownChance = calculateProbability(
    attacker.Rating.clinchGrappling,
    defender.Rating.clinchControl
  );

  if (Math.random() < takedownChance) {
    let damage;
    if (takedownType === "trip") {
      damage = Math.floor(Math.random() * 10) + 5; // 5-15 damage for trips
    } else {
      damage = Math.floor(Math.random() * 15) + 10; // 10-25 damage for throws
    }

    defender.health.body = Math.max(0, defender.health.body - damage);
    logger.logTakedown(attacker, defender, takedownType, "successful", currentTime);
    updateFightStats(attacker, defender, "takedown", takedownType, "successful");

    // Reset clinch state and move to ground
    attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
    defender.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;

    console.log(
      `${attacker.name} successfully ${takedownType}s ${defender.name} for ${damage} damage`
    );
    return `clinch${
      takedownType.charAt(0).toUpperCase() + takedownType.slice(1)
    }Successful`;
  } else {
    logger.logTakedown(attacker, defender, takedownType, "defended", currentTime);
    updateFightStats(attacker, defender, "takedown", takedownType, "defended");
    console.log(`${defender.name} defends the clinch ${takedownType}`);
    return `clinch${
      takedownType.charAt(0).toUpperCase() + takedownType.slice(1)
    }Failed`;
  }
};

/**
 * Perform a takedown action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @param {string} takedownType - Type of takedown (single leg, double leg, trip, throw)
 * @returns {[string, number]} Outcome of the action, time passed
 */
const doTakedown = (attacker, defender, takedownType, currentTime, logger) => {
  // This just cleans up the text output
  let displayTakedown = takedownType
  .replace(/([A-Z])/g, " $1")
  .trim()
  .toLowerCase();

  console.log(`${attacker.name} attempts a ${displayTakedown} on ${defender.name}`);

  let timePassed = simulateTimePassing(takedownType);
  let outcome = "";

  const { landsChance, defendedChance, sprawlChance } = calculateTDProbability(attacker, defender);

  const random = Math.random();

  if (random < landsChance) {
    // Fight moves to the ground
    attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
    defender.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;

    logger.logTakedown(attacker, defender, takedownType, "successful", currentTime);
    updateFightStats(attacker, defender, "takedown", takedownType, "successful");
    console.log(`${attacker.name} successfully takes down ${defender.name} with a ${displayTakedown}`);
    outcome = `${takedownType}Landed`;
  } else if (random < landsChance + defendedChance) {
    logger.logTakedown(attacker, defender, takedownType, "defended", currentTime);
    updateFightStats(attacker, defender, "takedown", takedownType, "defended");
    console.log(`${defender.name} defends the ${displayTakedown}`);

    // Both fighters remain standing
    attacker.position = FIGHTER_POSITIONS.STANDING;
    defender.position = FIGHTER_POSITIONS.STANDING;
    outcome = `${takedownType}Defended`;
  } else if (random < landsChance + defendedChance + sprawlChance) {
    // Sprawl situation
    const [sprawlOutcome, sprawlTimePassed] = doSprawl(defender, attacker);
    if (sprawlOutcome === "successful") {
      logger.logTakedown(attacker, defender, takedownType, "defended", currentTime);
      updateFightStats(attacker, defender, "takedown", takedownType, "defended");
      outcome = `${takedownType}Defended`;
    } else if (sprawlOutcome === "unsuccessful") {
      logger.logTakedown(attacker, defender, takedownType, "successful", currentTime);
      updateFightStats(attacker, defender, "takedown", takedownType, "successful");
      outcome = `${takedownType}Landed`;
    }
    timePassed += sprawlTimePassed;
  }

return [outcome, timePassed];
};

/**
 * Perform a sprawl action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @returns {[string, number]} Outcome of the action, time passed
 */
const doSprawl = (defender, attacker) => {
  console.log(`${defender.name} attempts to sprawl against ${attacker.name}'s takedown`);
  const sprawlChance = calculateProbability(defender.Rating.takedownDefence, attacker.Rating.takedownOffence);
  const timePassed = simulateTimePassing("sprawl");

  if (Math.random() < sprawlChance) {
    // Successful sprawl
    console.log(`${defender.name} successfully sprawls and defends the takedown`);
    
    // Determine if the defender can capitalize on the sprawl
    if (Math.random() < 0.3) {  // 30% chance to capitalize
      defender.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
      attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
      console.log(`${defender.name} capitalizes on the sprawl and ends up in top position`);
      return ["successful", timePassed];
    } else {
      // Both fighters return to standing
      defender.position = FIGHTER_POSITIONS.STANDING;
      attacker.position = FIGHTER_POSITIONS.STANDING;
      return ["successful", timePassed];
    }
  } else {
    // Failed sprawl, takedown succeeds
    console.log(`${defender.name}'s sprawl attempt fails, ${attacker.name} completes the takedown`);
    attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
    defender.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
    return ["unsuccessful", timePassed];
  }
};

/**
 * Attempt to posture up when either in full mount or full guard
 * @param {Object} attacker - Attacking fighter attempting to posture up
 * @param {Object} defender - Defending fighter
 * @returns {string} Outcome of the action
 */
const doPostureUp = (attacker, defender, currentTime, logger) => {
  console.log(`${attacker.name} attempts to posture up`);

  const successProbability = calculateProbability(
    attacker.Rating.groundOffence,
    defender.Rating.groundDefence
  );

  const timePassed = simulateTimePassing("postureUp");

  if (Math.random() < successProbability) {
    switch (attacker.position) {
      case FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP:
        attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_POSTURE_UP;
        defender.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
        break;
      case FIGHTER_POSITIONS.GROUND_MOUNT_TOP:
        attacker.position = FIGHTER_POSITIONS.GROUND_MOUNT_POSTURE_UP;
        defender.position = FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM;
        break;
      default:
        return ["postureUpInvalid", timePassed] ;
    }

    logger.logPositionChange(attacker, defender, "successful", currentTime);
    console.log(`${attacker.name} successfully postures up`);
    return ["postureUpSuccessful", timePassed] ;

  } else {
    logger.logPositionChange(attacker, defender, "unsuccessful", currentTime);
    console.log(`${defender.name} keeps ${attacker.name} in guard`);
    return ["postureUpUnsuccessful", timePassed] ;
  }
};

/**
 * Attempt to pull a postured-up fighter back into guard
 * @param {Object} defender - Fighter in bottom position attempting to pull into guard
 * @param {Object} attacker - Postured-up fighter
 * @returns {[string, number]} Outcome of the action and time passed
 */
const doPullIntoGuard = (defender, attacker, currentTime, logger) => {
  console.log(`${defender.name} attempts to pull ${attacker.name} back into guard`);

  const successProbability = calculateProbability(
    defender.Rating.groundDefence,
    attacker.Rating.groundControl
  );

  const timePassed = simulateTimePassing("pullIntoGuard");

  if (Math.random() < successProbability) {
    switch (attacker.position) {
      case FIGHTER_POSITIONS.GROUND_FULL_GUARD_POSTURE_UP:
        defender.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
        attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
        break;
      case FIGHTER_POSITIONS.GROUND_MOUNT_POSTURE_UP:
        defender.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
        attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
        break;
      default:
        return ["pullIntoGuardInvalid", timePassed];
    }

    logger.logPositionChange(defender, attacker, "successful", currentTime);
    console.log(`${defender.name} successfully pulls ${attacker.name} back into guard`);
    return ["pullIntoGuardSuccessful", timePassed];

  } else {
    logger.logPositionChange(defender, attacker, "unsuccessful", currentTime);
    console.log(`${defender.name} fails to pull ${attacker.name} back into guard`);
    return ["pullIntoGuardUnsuccessful", timePassed];
  }
};

/**
 * Attempt to advance position in ground fighting
 * @param {Object} attacker - Attacking fighter attempting to advance position
 * @param {Object} defender - Defending fighter
 * @returns {string} Outcome of the action
 */
const doPositionAdvance = (attacker, defender, currentTime, logger) => {
  console.log(`${attacker.name} attempts to advance position`);

  const successProbability = calculateProbability(
    attacker.Rating.groundOffence,
    defender.Rating.groundDefence
  );

  if (Math.random() < successProbability) {
    switch (attacker.position) {
      case FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP:
        attacker.position = FIGHTER_POSITIONS.GROUND_HALF_GUARD_TOP;
        defender.position = FIGHTER_POSITIONS.GROUND_HALF_GUARD_BOTTOM;
        break;
      case FIGHTER_POSITIONS.GROUND_HALF_GUARD_TOP:
        attacker.position = FIGHTER_POSITIONS.GROUND_SIDE_CONTROL_TOP;
        defender.position = FIGHTER_POSITIONS.GROUND_SIDE_CONTROL_BOTTOM;
        break;
      case FIGHTER_POSITIONS.GROUND_SIDE_CONTROL_TOP:
        attacker.position = FIGHTER_POSITIONS.GROUND_MOUNT_TOP;
        defender.position = FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM;
        break;
      case FIGHTER_POSITIONS.GROUND_MOUNT_TOP:
        attacker.position = FIGHTER_POSITIONS.GROUND_BACK_CONTROL_OFFENCE;
        defender.position = FIGHTER_POSITIONS.GROUND_BACK_CONTROL_DEFENCE;
        break;
      default:
        return "positionAdvanceInvalid";
    }

    logger.logPositionChange(attacker, defender, "successful", currentTime);
    console.log(`${attacker.name} successfully advances to ${attacker.position}`);
    return "positionAdvanceSuccessful";
    
  } else {
    logger.logPositionChange(attacker, defender, "unsuccessful", currentTime);
    console.log(`${attacker.name} fails to advance position`);
    return "positionAdvanceFailed";
  }
};

/**
 * Attempt to perform a sweep from a bottom position in ground fighting
 * @param {Object} attacker - Fighter attempting the sweep (initially in bottom position)
 * @param {Object} defender - Fighter in top position
 * @returns {string} Outcome of the action
 */
const doSweep = (attacker, defender, currentTime, logger) => {
  console.log(`${attacker.name} attempts a sweep against ${defender.name}`);

  const successProbability = calculateProbability(
    attacker.Rating.groundOffence,
    defender.Rating.groundDefence
  );

  if (Math.random() < successProbability) {
    switch (attacker.position) {
      case FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM:
        attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
        defender.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
        break;
      case FIGHTER_POSITIONS.GROUND_HALF_GUARD_BOTTOM:
        attacker.position = FIGHTER_POSITIONS.GROUND_HALF_GUARD_TOP;
        defender.position = FIGHTER_POSITIONS.GROUND_HALF_GUARD_BOTTOM;
        break;
      case FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM:
        attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
        defender.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
        break;
      default:
        return "sweepInvalid";
    }

    logger.logPositionChange(attacker, defender, "successful", currentTime);
    console.log(`${attacker.name} successfully sweeps ${defender.name} and is now in ${attacker.position}`);
    return "sweepSuccessful";

  } else {
    logger.logPositionChange(attacker, defender, "unsuccessful", currentTime);
    console.log(`${attacker.name} fails to sweep ${defender.name}`);
    return "sweepFailed";
  }
};

/**
 * Attempt to escape from a disadvantageous ground position
 * @param {Object} attacker - Fighter attempting to escape (initially in bottom position)
 * @param {Object} defender - Fighter in top position
 * @returns {string} Outcome of the action
 */
const doEscape = (attacker, defender, currentTime, logger) => {
  console.log(`${attacker.name} attempts to escape from ${defender.name}`);

  const successProbability = calculateProbability(
    attacker.Rating.groundDefence,
    defender.Rating.groundOffence
  );

  if (Math.random() < successProbability) {
    switch (attacker.position) {
      case FIGHTER_POSITIONS.GROUND_SIDE_CONTROL_BOTTOM:
        attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
        defender.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
        break;
      case FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM:
        attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
        defender.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
        break;
      case FIGHTER_POSITIONS.GROUND_BACK_CONTROL_DEFENCE:
        attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
        defender.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
        break;
      default:
        return "escapeInvalid";
    }

    logger.logPositionChange(attacker, defender, "successful", currentTime);
    console.log(`${attacker.name} successfully escapes to ${attacker.position}`);
    return "escapeSuccessful";

  } else {
    logger.logPositionChange(attacker, defender, "unsuccessful", currentTime);
    console.log(`${attacker.name} fails to escape`);
    return "escapeFailed";
  }
};

/**
 * Perform an action to get up when on the ground
 * @param {Object} attacker - Fighter attempting to get up
 * @param {Object} defender - Opponent fighter
 * @returns {string} Outcome of the action
 */
const doGetUp = (attacker, defender, currentTime, logger) => {
  console.log(`${attacker.name} attempts to get up`);
  if (
    Math.random() <
    calculateProbability(
      attacker.Rating.getUpAbility,
      defender.Rating.groundOffence
    )
  ) {
    // Reset both fighters to standing position
    attacker.position = FIGHTER_POSITIONS.STANDING;
    defender.position = FIGHTER_POSITIONS.STANDING;

    logger.logPositionChange(attacker, defender, "successful", currentTime);  
    console.log(`${attacker.name} successfully gets up`);
    return "getUpSuccessful";
  } else {
    logger.logPositionChange(attacker, defender, "unsuccessful", currentTime);
    console.log(`${attacker.name} fails to get up`);
    return "getUpFailed";
  }
};

/**
 * Perform a rear-naked choke action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @returns {[string, number]} Outcome of the action, time passed
 */

const doRearNakedChoke = (attacker, defender, currentTime, logger) => {
  console.log(`${attacker.name} is looking for a Rear-Naked Choke on ${defender.name}`);

  let timePassed = 5 // min 5 - This will be updated with each stage in the submission
  let outcome = "";

  // Stage 1: Engage Arm
  if (doEngageArm(attacker, defender)) {
    timePassed += simulateTimePassing("rearNakedChoke");
    logger.logSubmission(attacker, defender, "rearNakedChoke", "engageArm", currentTime);

    // Stage 2: Lock Choke
    if (doLockChoke(attacker, defender)) {
      timePassed += simulateTimePassing("rearNakedChoke");
      logger.logSubmission(attacker, defender, "rearNakedChoke", "lockChoke", currentTime);

      // Stage 3: Apply Choke
      if (doApplyChoke(attacker, defender)) {
        timePassed += simulateTimePassing("rearNakedChoke");
        outcome = "submissionSuccessful";
        logger.logSubmission(attacker, defender, "rearNakedChoke", "applyChoke", currentTime);
        updateFightStats(attacker, defender, "submission", "rearNakedChoke", "successful");
        console.log(`${attacker.name} successfully submits ${defender.name} with a Rear-Naked Choke!`);
        defender.isSubmitted = true;
      } else {
        outcome = "submissionDefended";
        updateFightStats(attacker, defender, "submission", "rearNakedChoke", "defended");
      }
    } else {
      outcome = "submissionDefended";
      updateFightStats(attacker, defender, "submission", "rearNakedChoke", "defended");
    }
  } else {
    outcome = "submissionDefended";
    updateFightStats(attacker, defender, "submission", "rearNakedChoke", "defended");
  }

  return [outcome, timePassed, "Rear-Naked Choke" ];
};

/**
 * Perform a guillotine choke action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @returns {[string, number]} Outcome of the action, time passed
 */

const doGuillotine = (attacker, defender, currentTime, logger) => {
  console.log(`${attacker.name} is looking for a Guillotine Choke on ${defender.name}`);

  let timePassed = 5 // min 5 - This will be updated with each stage in the submission
  let outcome = "";

  // Stage 1: Trap Head
  if (doTrapHead(attacker, defender)) {
    timePassed += simulateTimePassing("guillotine");
    logger.logSubmission(attacker, defender, "guillotine", "trapHead", currentTime);

    // Stage 2: Close Guard 
    if (doCloseGuard(attacker, defender)) {
      timePassed += simulateTimePassing("guillotine");
      logger.logSubmission(attacker, defender, "guillotine", "closeGuard", currentTime);

      // Stage 3: Apply Choke
      if (doApplyChoke(attacker, defender)) {
        timePassed += simulateTimePassing("guillotine");
        outcome = "submissionSuccessful";
        logger.logSubmission(attacker, defender, "guillotine", "applyChoke", currentTime);
        updateFightStats(attacker, defender, "submission", "guillotine", "successful");
        console.log(`${attacker.name} successfully submits ${defender.name} with a Guillotine!`);
        defender.isSubmitted = true;
      } else {
        outcome = "submissionDefended";
        updateFightStats(attacker, defender, "submission", "guillotine", "defended");
      }
    } else {
      outcome = "submissionDefended";
      updateFightStats(attacker, defender, "submission", "guillotine", "defended");
    }
  } else {
    outcome = "submissionDefended";
    updateFightStats(attacker, defender, "submission", "guillotine", "defended");
  }

  return [outcome, timePassed, "Guillotine" ];
};

/**
 * Perform a triangle choke action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @returns {[string, number]} Outcome of the action, time passed
 */

const doTriangleChoke = (attacker, defender, currentTime, logger) => {
  console.log(`${attacker.name} is looking for a Triangle Choke on ${defender.name}`);

  let timePassed = 5 // min 5 - This will be updated with each stage in the submission
  let outcome = "";

  // Stage 1: Isolate Arm
  if (doIsolateArm(attacker, defender)) {
    timePassed += simulateTimePassing("triangleChoke");
    logger.logSubmission(attacker, defender, "triabgleChoke", "isolateArm", currentTime);

    // Stage 2: Lock Choke
    if (doLockTriangle(attacker, defender)) {
      timePassed += simulateTimePassing("triangleChoke");
      logger.logSubmission(attacker, defender, "triabgleChoke", "lockTriangle", currentTime);

      // Stage 3: Apply Choke
      if (doApplyPressure(attacker, defender)) {
        timePassed += simulateTimePassing("triangleChoke");
        outcome = "submissionSuccessful";
        logger.logSubmission(attacker, defender, "triabgleChoke", "applyPressure", currentTime);
        updateFightStats(attacker, defender, "submission", "triangleChoke", "successful");
        console.log(`${attacker.name} successfully submits ${defender.name} with a Triangle Choke!`);
        defender.isSubmitted = true;
      } else {
        outcome = "submissionDefended";
        updateFightStats(attacker, defender, "submission", "triangleChoke", "defended");
      }
    } else {
      outcome = "submissionDefended";
      updateFightStats(attacker, defender, "submission", "triangleChoke", "defended");
    }
  } else {
    outcome = "submissionDefended";
    updateFightStats(attacker, defender, "submission", "triangleChoke", "defended");
  }

  return [outcome, timePassed, "Triangle Choke" ];
};

/**
 * Perform a armbar action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @returns {[string, number]} Outcome of the action, time passed
 */

const doArmbar = (attacker, defender, currentTime, logger) => {
  console.log(`${attacker.name} is looking for a armbar on ${defender.name}`);

  let timePassed = 5 // min 5 - This will be updated with each stage in the submission
  let outcome = "";

  // Stage 1: Isolate Arm
  if (doIsolateArm(attacker, defender)) {
    timePassed += simulateTimePassing("armbar");
    logger.logSubmission(attacker, defender, "armbar", "isolateArm", currentTime);

    // Stage 2: Apply pressure
    if (doApplyPressure(attacker, defender)) {
      timePassed += simulateTimePassing("armbar");
      outcome = "submissionSuccessful";
      logger.logSubmission(attacker, defender, "armbar", "applyPressure", currentTime);
      updateFightStats(attacker, defender, "submission", "armbar", "successful");
      console.log(`${attacker.name} successfully submits ${defender.name} with a armbar!`);
      defender.isSubmitted = true;
    } else {
      outcome = "submissionDefended";
      updateFightStats(attacker, defender, "submission", "armbar", "defended");
    }
  } else {
    outcome = "submissionDefended";
    updateFightStats(attacker, defender, "submission", "armbar", "defended");
  }

  return [outcome, timePassed, "Armbar" ];
};

// Main Simulation Functions

/**
 * Determines the next action for a fighter based on their current position
 * @param {Object} fighter - The fighter object
 * @param {Object} opponent - The opponent fighter object
 * @returns {string} The determined action
 */
const determineAction = (fighter, opponent) => {
  // Get the current position of the fighter
  const position = fighter.position;

  // this ensures that the first action in a fight is 'fight start'
  if (totalActionsPerformed === 0) {
    totalActionsPerformed++;
    return "fightStart";
  }
  totalActionsPerformed++;

  if (position === FIGHTER_POSITIONS.STANDING) {
    return determineStandingAction(fighter, opponent);
  } else if (
    position === FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP ||
    position === FIGHTER_POSITIONS.GROUND_FULL_GUARD_POSTURE_UP ||
    position === FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM ||
    position === FIGHTER_POSITIONS.GROUND_HALF_GUARD_TOP ||
    position === FIGHTER_POSITIONS.GROUND_HALF_GUARD_BOTTOM ||
    position === FIGHTER_POSITIONS.GROUND_SIDE_CONTROL_TOP ||
    position === FIGHTER_POSITIONS.GROUND_SIDE_CONTROL_BOTTOM ||
    position === FIGHTER_POSITIONS.GROUND_MOUNT_TOP ||
    position === FIGHTER_POSITIONS.GROUND_MOUNT_POSTURE_UP ||
    position === FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM ||
    position === FIGHTER_POSITIONS.GROUND_BACK_CONTROL_OFFENCE ||
    position === FIGHTER_POSITIONS.GROUND_BACK_CONTROL_DEFENCE
  ) {
    return determineGroundAction(fighter, opponent);
  } else if (
    position === FIGHTER_POSITIONS.CLINCH_OFFENCE ||
    position === FIGHTER_POSITIONS.CLINCH_DEFENCE
  ) {
    return determineClinchAction(fighter, opponent);
  } else {
    console.error(`Unknown position: ${position}`);
    return "wait";
  }
};

/**
 * Simulate a single action in the fight
 * @param {Object[]} fighters - Array of fighter objects
 * @param {number} actionFighter - Index of the fighter performing the action
 * @param {number} currentTime - Current time remaining in the round
 * @param {Object} logger - PlayByPlayLogger instance
 * @returns {[number|null, number, string|null]} Winner (if any), time passed, and submission type (if any)
 */
const simulateAction = (fighters, actionFighter, currentTime, logger) => {
  const opponent = actionFighter === 0 ? 1 : 0;
  const fighter = fighters[actionFighter];
  const opponentFighter = fighters[opponent];
 
  const actionType = determineAction(fighter, opponentFighter);
  console.log(`\n[${formatTime(currentTime)}]`);

  let outcome;
  let timePassed = 0;
  let submissionType = null;

  // Update action counters
  totalActionsPerformed++;

  switch (actionType) {
    case "fightStart":
      [outcome, timePassed] = doFightStart(fighter, opponentFighter, currentTime, logger);
      break;

    // Standing strikes and kicks
    case "jab":
    case "cross":
    case "hook":
    case "uppercut":
    case "bodyPunch":
    case "overhand":
    case "spinningBackfist":
    case "supermanPunch":
    case "headKick":
    case "bodyKick":
    case "legKick":
      [outcome, timePassed] = doCombo(fighter, opponentFighter, actionType, currentTime, logger);
      break;

    // Clinch actions
    case "clinchAttempt":
      outcome = doClinch(fighter, opponentFighter, currentTime, logger);
      timePassed = simulateTimePassing("clinchAttempt");
      break;

    case "clinchExit":
      outcome = exitClinch(fighter, opponentFighter, currentTime, logger);
      timePassed = simulateTimePassing("clinchExit");
      break;

    case "clinchStrike":
      [outcome, timePassed] = doClinchStrike(fighter, opponentFighter, currentTime, logger);
      break;

    case "clinchTakedown":
      outcome = doClinchTakedown(fighter, opponentFighter, currentTime, logger);
      timePassed = simulateTimePassing("clinchTakedown");
      break;

    // Takedowns
    case "singleLegTakedown":
    case "doubleLegTakedown":
    case "tripTakedown":
    case "throwTakedown":
      [outcome, timePassed] = doTakedown(fighter, opponentFighter, actionType, currentTime, logger);
      break;

    // Ground actions
    case "getUpAttempt":
      outcome = doGetUp(fighter, opponentFighter, currentTime, logger);
      timePassed = simulateTimePassing("getUpAttempt");
      break;

    case "postureUp":
      [outcome, timePassed] = doPostureUp(fighter, opponentFighter, currentTime, logger);
      break;

    case "pullIntoGuard":
      [outcome, timePassed] = doPullIntoGuard(fighter, opponentFighter, currentTime, logger);
      break;

    case "positionAdvance":
      outcome = doPositionAdvance(fighter, opponentFighter, currentTime, logger);
      timePassed = simulateTimePassing("positionAdvance");
      break;

    case "sweep":
      outcome = doSweep(fighter, opponentFighter, currentTime, logger);
      timePassed = simulateTimePassing("sweep");
      break;

    case "escape":
      outcome = doEscape(fighter, opponentFighter, currentTime, logger);
      timePassed = simulateTimePassing("escape");
      break;

    // Ground strikes
    case "groundPunch":
    case "groundElbow":
      [outcome, timePassed] = doGroundStrike(fighter, opponentFighter, actionType, currentTime, logger);
      break;

    // Submissions
    case "rearNakedChoke":
      [outcome, timePassed, submissionType] = doRearNakedChoke(fighter, opponentFighter, currentTime, logger);
      break;

    case "triangleChoke":
      [outcome, timePassed, submissionType] = doTriangleChoke(fighter, opponentFighter, currentTime, logger);
      break;

    case "guillotine":
      [outcome, timePassed, submissionType] = doGuillotine(fighter, opponentFighter, currentTime, logger);
      break;

    case "armbar":
      [outcome, timePassed, submissionType] = doArmbar(fighter, opponentFighter, currentTime, logger);
      break;

    case "wait":
      outcome = doWait(fighter, opponentFighter, currentTime, logger);
      timePassed = simulateTimePassing("wait");
      break;

    default:
      console.error(`Unknown action type: ${actionType}`);
      outcome = "unknownAction";
      timePassed = 1;
      break;
  }
  // Log fighter state after action if significant changes occurred
// Only log fighter states when positions change or for significant events
if (outcome?.includes('Successful') && 
    (actionType.includes('Takedown') || 
     actionType.includes('sweep') || 
     actionType.includes('escape') || 
     actionType.includes('getUpAttempt') ||
     actionType.includes('positionAdvance') ||
     actionType.includes('postureUp') ||
     actionType.includes('pullIntoGuard') ||
     actionType.includes('clinch'))) {
  logger.logFighterState(fighter, currentTime - timePassed);
  logger.logFighterState(opponentFighter, currentTime - timePassed);
}

  // Check for knockout or submission
  let roundWinner = null;

  if (typeof outcome === 'string') {
    if (outcome.includes('Knockout')) {
      roundWinner = actionFighter;
    } else if (outcome.includes('submissionSuccessful')) {
      roundWinner = actionFighter;
    }
  }

  // Debug logging
  console.log(`Action: ${actionType}, Outcome: ${outcome}`);
  console.log(
    `Stamina - ${fighter.name}: ${fighter.stamina.toFixed(2)}, ${
      opponentFighter.name
    }: ${opponentFighter.stamina.toFixed(2)}`
  );
  console.log(`Position - ${fighter.name}: ${fighter.position}`);

  return [roundWinner, timePassed, submissionType];
};

export { simulateAction };

/**
 * Simulate one single round of the fight
 * @param {Object[]} fighters - Array of fighter objects
 * @param {number} roundNumber - Current round number
 * @param {Object} logger - PlayByPlayLogger instance
 * @returns {Object} Round result
 */
const simulateRound = (fighters, roundNumber, logger) => {
  console.log(`\n=== Round ${roundNumber} ===`);
    
  // Log round start
  logger.logRoundStart(roundNumber);

  // Track initial stats before stamina recovery
  const initialStats = fighters.map((fighter) => ({
    ...fighter.stats,
    health: { ...fighter.health },
    stamina: fighter.stamina,
    firstname: fighter.firstname,
    lastname: fighter.lastname
  }));

    // Only apply round start recovery and position reset after round 1
    if (roundNumber > 1) {
      fighters.forEach((fighter) => {
        fighter.stamina = Math.max(0, fighter.stamina);
        const bodyDamage = fighter.maxHealth.body - fighter.health.body;
        const previousHealth = { ...fighter.health };
  
        // Apply stamina recovery
        fighter.stamina = recoverStaminaEndRound(
          fighter.stamina,
          fighter.Rating.cardio,
          bodyDamage
        );
  
        // Reset position
        fighter.position = FIGHTER_POSITIONS.STANDING;
        
        // Log recovery and new state with complete fighter data
        logger.logRecovery({
          ...fighter,
          firstname: fighter.firstname,
          lastname: fighter.lastname
        }, previousHealth, fighter.health, 300);
        
        logger.logFighterState({
          ...fighter,
          firstname: fighter.firstname,
          lastname: fighter.lastname
        }, 300);
      });
    } else {
      // For round 1, just set starting positions without recovery
      fighters.forEach((fighter) => {
        fighter.position = FIGHTER_POSITIONS.STANDING;
        logger.logFighterState({
          ...fighter,
          firstname: fighter.firstname,
          lastname: fighter.lastname
        }, 300);
      });
    }

  let lastActionFighter;
  let currentTime = 300;

  while (currentTime > 0) {
    const actionFighter = pickFighter(fighters, lastActionFighter);
    const [roundWinner, timePassed, submissionType] = simulateAction(
      fighters,
      actionFighter,
      currentTime,
      logger
    );

    currentTime -= timePassed;

    if (roundWinner !== null) {
      // Calculate round statistics
      const roundStats = calculateRoundStats(
        fighters[0],
        fighters[1],
        initialStats[0],
        initialStats[1]
      );

      return {
        winner: roundWinner,
        submissionType,
        roundStats,
        timeRemaining: currentTime
      };
    }

    lastActionFighter = actionFighter;
  }

  // End of round processing
  console.log("\n===End of Round===");

  // Calculate round statistics
  const roundStats = calculateRoundStats(
    fighters[0],
    fighters[1],
    initialStats[0],
    initialStats[1]
  );

  // Calculate health lost
  const healthLost = fighters.map((fighter, index) => {
    const initialHealth = initialStats[index].health;
    return (
      initialHealth.head - fighter.health.head +
      (initialHealth.body - fighter.health.body) +
      (initialHealth.legs - fighter.health.legs)
    );
  });

  // Determine round winner
  let roundWinner;
  if (healthLost[0] < healthLost[1]) {
    roundWinner = 0;
  } else if (healthLost[1] < healthLost[0]) {
    roundWinner = 1;
  } else {
    roundWinner = Math.random() < 0.5 ? 0 : 1;
  }

  fighters[roundWinner].roundsWon++;

  // Log round end
  logger.logRoundEnd(roundNumber, roundStats, 0);

  return {
    winner: null,
    submissionType: null,
    roundStats,
    timeRemaining: 0,
    roundWinner,
    healthLost
  };
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

    // Striking stats
    console.log("Striking:");
    console.log(
      `  Punches Thrown: ${
        (fighter.stats.punchesThrown || 0) -
        (initialStats[index].punchesThrown || 0)
      }`
    );
    console.log(
      `  Punches Landed: ${
        (fighter.stats.punchesLanded || 0) -
        (initialStats[index].punchesLanded || 0)
      }`
    );
    console.log(
      `    Jabs: ${
        (fighter.stats.jabsLanded || 0) - (initialStats[index].jabsLanded || 0)
      }`
    );
    console.log(
      `    Crosses: ${
        (fighter.stats.crosssLanded || 0) -
        (initialStats[index].crosssLanded || 0)
      }`
    );
    console.log(
      `    Hooks: ${
        (fighter.stats.hooksLanded || 0) -
        (initialStats[index].hooksLanded || 0)
      }`
    );
    console.log(
      `    Uppercuts: ${
        (fighter.stats.uppercutsLanded || 0) -
        (initialStats[index].uppercutsLanded || 0)
      }`
    );
    console.log(
      `    Body Punches: ${
        (fighter.stats.bodyPunchsLanded || 0) -
        (initialStats[index].bodyPunchsLanded || 0)
      }`
    );
    console.log(
      `  Kicks Thrown: ${
        (fighter.stats.kicksThrown || 0) -
        (initialStats[index].kicksThrown || 0)
      }`
    );
    console.log(
      `  Kicks Landed: ${
        (fighter.stats.kicksLanded || 0) -
        (initialStats[index].kicksLanded || 0)
      }`
    );
    console.log(
      `    Head Kicks: ${
        (fighter.stats.headKicksLanded || 0) -
        (initialStats[index].headKicksLanded || 0)
      }`
    );
    console.log(
      `    Body Kicks: ${
        (fighter.stats.bodyKicksLanded || 0) -
        (initialStats[index].bodyKicksLanded || 0)
      }`
    );
    console.log(
      `    Leg Kicks: ${
        (fighter.stats.legKicksLanded || 0) -
        (initialStats[index].legKicksLanded || 0)
      }`
    );

    // Grappling stats
    console.log("Grappling:");
    console.log(
      `  Takedowns: ${
        (fighter.stats.takedownsSuccessful || 0) -
        (initialStats[index].takedownsSuccessful || 0)
      } / ${
        (fighter.stats.takedownsAttempted || 0) -
        (initialStats[index].takedownsAttempted || 0)
      }`
    );
    console.log(
      `  Submissions Attempted: ${
        (fighter.stats.submissionsAttempted || 0) -
        (initialStats[index].submissionsAttempted || 0)
      }`
    );
    console.log(
      `  Submissions Landed: ${
        (fighter.stats.submissionsLanded || 0) -
        (initialStats[index].submissionsLanded || 0)
      }`
    );

    // Ground stats
    console.log("Ground Game:");
    console.log(
      `  Ground Strikes Landed: ${
        (fighter.stats.groundPunchsLanded || 0) -
        (initialStats[index].groundPunchsLanded || 0)
      }`
    );

    // Defence stats
    console.log("Defence:");
    console.log(
      `  Strikes Blocked: ${
        (fighter.stats.punchesBlocked || 0) +
        (fighter.stats.kicksBlocked || 0) -
        ((initialStats[index].punchesBlocked || 0) +
          (initialStats[index].kicksBlocked || 0))
      }`
    );
    console.log(
      `  Takedowns Defended: ${
        (fighter.stats.takedownsDefended || 0) -
        (initialStats[index].takedownsDefended || 0)
      }`
    );
    console.log(
      `  Submissions Defended: ${
        (fighter.stats.submissionsDefended || 0) -
        (initialStats[index].submissionsDefended || 0)
      }`
    );

    // Health and stamina
    console.log("Health and Stamina:");
    console.log(
      `  Current Health: Head: ${fighter.health.head}/${fighter.maxHealth.head}, Body: ${fighter.health.body}/${fighter.maxHealth.body}, Legs: ${fighter.health.legs}/${fighter.maxHealth.legs}`
    );
    console.log(
      `  Damage Taken: Head: ${
        initialStats[index].health.head - fighter.health.head
      }, Body: ${
        initialStats[index].health.body - fighter.health.body
      }, Legs: ${initialStats[index].health.legs - fighter.health.legs}`
    );
    console.log(`  Current Stamina: ${fighter.stamina}/100`);
  });
};

/**
 * Simulate the entire fight
 * @param {Object[]} fighters - Array of fighter objects
 * @param {Object} logger - PlayByPlayLogger instance
 * @returns {Object} Fight result
 */
const simulateFight = (fighters, logger) => {
  let method = "Decision";
  let roundEnded = ROUNDS_PER_FIGHT;
  let submissionType = null;
  let roundStats = [];
  let endTime = 0;

  totalActionsPerformed = 0;

  // Validate and format fighter data
  const validateFighter = (fighter) => {
    return {
      id: fighter.personid,
      firstname: fighter.firstname,
      lastname: fighter.lastname,
      name: `${fighter.firstname} ${fighter.lastname}`,
      fightingStyle: fighter.fightingStyle,
      weightClass: fighter.weightClass,
      wins: fighter.wins,
      losses: fighter.losses,
      hometown: fighter.hometown,
      nationality: fighter.nationality,
      health: {
        head: Number(fighter.maxHealth.head) || 100,
        body: Number(fighter.maxHealth.body) || 100,
        legs: Number(fighter.maxHealth.legs) || 100,
      },
      maxHealth: {
        head: Number(fighter.maxHealth.head) || 100,
        body: Number(fighter.maxHealth.body) || 100,
        legs: Number(fighter.maxHealth.legs) || 100,
      },
      stamina: Number(fighter.stamina) || 100,
      roundsWon: 0,
      Rating: fighter.Rating,
      stats: {},
      Tendency: fighter.Tendency
    };
  };

  // Validate both fighters
  const validatedFighters = fighters.map(validateFighter);

  // Initialize the fight with complete fighter data
  logger.reset();
  logger.logFightStart([
    {
      ...validatedFighters[0],
      record: `${validatedFighters[0].wins}-${validatedFighters[0].losses}`
    },
    {
      ...validatedFighters[1],
      record: `${validatedFighters[1].wins}-${validatedFighters[1].losses}`
    }
  ]);

  console.log("\n--- Fight Simulation Begins ---\n");

  // Simulate each round
  for (let round = 1; round <= ROUNDS_PER_FIGHT; round++) {
    const roundResult = simulateRound(validatedFighters, round, logger);
    roundStats.push(roundResult.roundStats);

    // Early stoppage
    if (roundResult.winner !== null) {
      submissionType = roundResult.submissionType;
      method = submissionType ? "Submission" : "Knockout";
      roundEnded = round;
      endTime = (round - 1) * 300 + (300 - roundResult.timeRemaining);

      // Log fight end
      logger.logFightEnd({
        winner: roundResult.winner,
        winnerName: validatedFighters[roundResult.winner].name,
        loserName: validatedFighters[1 - roundResult.winner].name,
        method,
        submissionType,
        round: roundEnded,
        finalHealth: {
          fighter1: { ...validatedFighters[0].health },
          fighter2: { ...validatedFighters[1].health }
        }
      }, roundResult.timeRemaining);

      return {
        winner: roundResult.winner,
        winnerName: validatedFighters[roundResult.winner].name,
        loserName: validatedFighters[1 - roundResult.winner].name,
        method,
        submissionType,
        roundEnded,
        endTime,
        fighterStats: [validatedFighters[0].stats, validatedFighters[1].stats],
        fighterHealth: [validatedFighters[0].health, validatedFighters[1].health],
        fighterMaxHealth: [validatedFighters[0].maxHealth, validatedFighters[1].maxHealth],
        roundStats,
      };
    }
  }

  // Decision handling
  const winner = validatedFighters[0].roundsWon > validatedFighters[1].roundsWon ? 0 : 1;
  if (validatedFighters[0].roundsWon === validatedFighters[1].roundsWon) {
    method = "Draw";
  }

  return {
    winner: method === "Draw" ? null : winner,
    winnerName: method === "Draw" ? null : validatedFighters[winner].name,
    loserName: method === "Draw" ? null : validatedFighters[1 - winner].name,
    method,
    submissionType,
    roundEnded,
    endTime: ROUNDS_PER_FIGHT * 300,
    fighterStats: [validatedFighters[0].stats, validatedFighters[1].stats],
    fighterHealth: [validatedFighters[0].health, validatedFighters[1].health],
    fighterMaxHealth: [validatedFighters[0].maxHealth, validatedFighters[1].maxHealth],
    roundStats,
  };
};

export {
  simulateFight,
  doKick,
  doPunch,
  doGroundStrike,
  doTakedown,
  doGetUp,
  doRearNakedChoke,
  doTriangleChoke,
  doGuillotine,
  doArmbar,
  FIGHTER_POSITIONS
};