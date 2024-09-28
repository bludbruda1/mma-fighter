import {
  formatTime,
  simulateTimePassing,
  isKnockedOut,
  calculateStaminaChange,
  recoverStaminaEndRound,
  updateFightStats,
} from "./helper.js";
import {
  calculateStrikeDamage,
  calculateProbabilities,
  calculateProbability,
  calculateTDProbability,
  calculateSubmissionProbability,
  determineStandingAction,
  determineClinchAction,
  determineGroundAction,
} from "./fightCalculations.js";
import { calculateRoundStats } from "./FightStatistics.js";
import { doApplyChoke, doEngageArm, doLockChoke } from "./subStages.js"

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
  GROUND_FULL_GUARD_BOTTOM: "groundFullGuardBottom",
  GROUND_HALF_GUARD_TOP: "groundHalfGuardTop",
  GROUND_HALF_GUARD_BOTTOM: "groundHalfGuardBottom",
  GROUND_SIDE_CONTROL_TOP: "groundSideControlTop",
  GROUND_SIDE_CONTROL_BOTTOM: "groundSideControlBottom",
  GROUND_MOUNT_TOP: "groundMountTop",
  GROUND_MOUNT_BOTTOM: "groundMountBottom",
  GROUND_BACK_CONTROL_OFFENCE: "groundBackControlOffence",
  GROUND_BACK_CONTROL_DEFENCE: "groundBackControlDefence",
};

const SUBMISSION_TYPES = {
  ARMBAR: {
    name: "Armbar",
    difficultyModifier: 1.0,
    applicablePositions: [
      FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP,
      FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM,
      FIGHTER_POSITIONS.GROUND_MOUNT_TOP,
      FIGHTER_POSITIONS.GROUND_BACK_CONTROL_OFFENCE,
    ],
  },
  TRIANGLE_CHOKE: {
    name: "Triangle Choke",
    difficultyModifier: 1.2,
    applicablePositions: [
      FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM,
      FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM,
    ],
  },
  REAR_NAKED_CHOKE: {
    name: "Rear-Naked Choke",
    difficultyModifier: 0.8,
    applicablePositions: [FIGHTER_POSITIONS.GROUND_BACK_CONTROL_OFFENCE],
  },
  LEG_LOCK: {
    name: "Leg Lock",
    difficultyModifier: 1.3,
    applicablePositions: [
      FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP,
      FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM,
      FIGHTER_POSITIONS.GROUND_HALF_GUARD_TOP,
      FIGHTER_POSITIONS.GROUND_HALF_GUARD_BOTTOM,
    ],
  },
  GUILLOTINE: {
    name: "Guillotine",
    difficultyModifier: 1.1,
    applicablePositions: [
      FIGHTER_POSITIONS.STANDING,
      FIGHTER_POSITIONS.CLINCH_OFFENCE,
      FIGHTER_POSITIONS.CLINCH_DEFENCE,
      FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP,
    ],
  },
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

// Action Functions

/**
 * Simulate the start of the fight
 * @param {Object} fighter - The fighter initiating the fight start
 * @param {Object} opponent - The opponent fighter
 * @returns {[string, number]} Outcome of the action and time passed
 */
const doFightStart = (fighter, opponent) => {
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
const doKick = (attacker, defender, kickType, comboCount = 0) => {
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
    updateFightStats(attacker, defender, "kick", kickType, "evaded");

    console.log(`${defender.name} evades the ${displayKickType}`);
    outcomeDescription = `${kickType}Evaded`;
  } else {
    // Miss logic
    attacker.stats.kicksMissed = (attacker.stats.kicksMissed || 0) + 1;
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
const doPunch = (attacker, defender, punchType, comboCount = 0) => {
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
    defender.stats.punchesBlocked = (defender.stats.punchesBlocked || 0) + 1;
    updateFightStats(attacker, defender, "punch", punchType, "blocked");
    outcomeDescription = `${punchType}Blocked`;
    console.log(`${defender.name} blocks the ${displayPunchType}`);
  } else if (outcome < hitChance + blockChance + evadeChance) {
    // Evade logic
    defender.stats.punchesEvaded = (defender.stats.punchesEvaded || 0) + 1;
    updateFightStats(attacker, defender, "punch", punchType, "evaded");
    outcomeDescription = `${punchType}Evaded`;
    console.log(`${defender.name} evades the ${displayPunchType}`);
  } else {
    // Miss logic
    attacker.stats.punchesMissed = (attacker.stats.punchesMissed || 0) + 1;
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
const doCombo = (attacker, defender, initialStrike) => {
  let comboCount = 0;
  let totalOutcome = "";
  let totalTime = 0;
  let currentStrike = initialStrike;

  while (comboCount < MAX_COMBO_LENGTH) {
    const [outcome, time, comboFollows] = currentStrike.includes("Kick")
      ? doKick(attacker, defender, currentStrike, comboCount)
      : doPunch(attacker, defender, currentStrike, comboCount);

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
const doSeekFinish = (attacker, defender) => {
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
 * Perform a ground punch action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @returns {[string, number]} Outcome of the action and time passed
 */
const doGroundPunch = (attacker, defender) => {
  console.log(`${attacker.name} throws a ground punch at ${defender.name}`);

  const hitChance = calculateProbability(
    attacker.Rating.groundOffence,
    defender.Rating.groundDefence
  );

  const timePassed = simulateTimePassing("groundPunch");

  if (Math.random() < hitChance) {
    // Hit logic
    const damageResult = calculateStrikeDamage(
      attacker,
      defender,
      "groundPunch"
    );
    defender.health[damageResult.target] = Math.max(
      0,
      defender.health[damageResult.target] - damageResult.damage
    );

    updateFightStats(attacker, defender, "punch", "groundPunch", "landed");

    console.log(
      `${defender.name} is hit by the ground punch for ${damageResult.damage} damage to the ${damageResult.target}`
    );

    console.log(
      `${defender.name}'s current health - Head: ${defender.health.head}, Body: ${defender.health.body}, Legs: ${defender.health.legs}`
    );
    return ["groundPunchLanded", timePassed];
  } else {
    // Block logic
    updateFightStats(attacker, defender, "punch", "groundPunch", "blocked");
    console.log(`${defender.name} blocks the ground punch`);
    return ["groundPunchBlocked", timePassed];
  }
};

/**
 * Attempt to pull fighter into a clinch position
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @returns {string} Outcome of the action
 */
const doClinch = (attacker, defender) => {
  console.log(`${attacker.name} attempts to clinch ${defender.name}`);
  const clinchChance = calculateProbability(
    attacker.Rating.clinchGrappling,
    defender.Rating.clinchGrappling
  );

  if (Math.random() < clinchChance) {
    // Set attacker's states
    attacker.position = FIGHTER_POSITIONS.CLINCH_OFFENCE;
    defender.position = FIGHTER_POSITIONS.CLINCH_DEFENCE;

    updateFightStats(attacker, defender, "clinch", "clinch", "successful");

    console.log(
      `${attacker.name} successfully gets ${defender.name} in a clinch against the cage`
    );
    return "clinchSuccessful";
  } else {
    console.log(`${defender.name} defends the clinch attempt`);
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
const exitClinch = (defender, attacker) => {
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

    console.log(`${defender.name} successfully exits the clinch`);
    return "clinchExitSuccessful";
  } else {
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
const doClinchStrike = (attacker, defender) => {
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

    updateFightStats(attacker, defender, "punch", "clinchStrike", "landed");

    console.log(
      `${defender.name} is hit by the clinch strike for ${damageResult.damage} damage to the ${damageResult.target}`
    );
    return [`clinchStrikeLanded`, timePassed];
  } else if (outcome < hitChance + blockChance) {
    // Block logic
    updateFightStats(attacker, defender, "punch", "clinchStrike", "blocked");

    console.log(`${defender.name} blocks the clinch strike`);
    return [`clinchStrikeBlocked`, timePassed];
  } else if (outcome < hitChance + blockChance + evadeChance) {
    // Evade logic
    updateFightStats(attacker, defender, "punch", "clinchStrike", "evaded");

    console.log(`${defender.name} evades the clinch strike`);
    return [`clinchStrikeEvaded`, timePassed];
  } else {
    // Miss logic
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
const doClinchTakedown = (attacker, defender) => {
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
const doTakedown = (attacker, defender, takedownType) => {
  console.log(`${attacker.name} attempts a ${takedownType} takedown on ${defender.name}`);

  let timePassed = simulateTimePassing(takedownType);
  let outcome = "";

  const { landsChance, defendedChance, sprawlChance } = calculateTDProbability(attacker, defender);

  const random = Math.random();

  if (random < landsChance) {
    // Fight moves to the ground
    attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
    defender.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;

    updateFightStats(attacker, defender, "takedown", takedownType, "successful");
    console.log(`${attacker.name} successfully takes down ${defender.name} with a ${takedownType}`);
    outcome = `${takedownType}Landed`;
  } else if (random < landsChance + defendedChance) {
    updateFightStats(attacker, defender, "takedown", takedownType, "defended");
    console.log(`${defender.name} defends the ${takedownType} takedown`);

    // Both fighters remain standing
    attacker.position = FIGHTER_POSITIONS.STANDING;
    defender.position = FIGHTER_POSITIONS.STANDING;
    outcome = `${takedownType}Defended`;
  } else if (random < landsChance + defendedChance + sprawlChance) {
    // Sprawl situation
    const [sprawlOutcome, sprawlTimePassed] = doSprawl(defender, attacker);
    if (sprawlOutcome === "successful") {
      updateFightStats(attacker, defender, "takedown", takedownType, "defended");
      outcome = `${takedownType}Defended`;
    } else if (sprawlOutcome === "unsuccessful") {
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
 * Attempt to advance position in ground fighting
 * @param {Object} attacker - Attacking fighter attempting to advance position
 * @param {Object} defender - Defending fighter
 * @returns {string} Outcome of the action
 */
const doPositionAdvance = (attacker, defender) => {
  console.log(`${attacker.name} attempts to advance position`);

  const successProbability = calculateProbability(
    attacker.Rating.groundOffence,
    defender.Rating.groundDefence
  );

  if (Math.random() < successProbability) {
    let newAttackerPosition, newDefenderPosition;

    switch (attacker.position) {
      case FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP:
        newAttackerPosition = FIGHTER_POSITIONS.GROUND_HALF_GUARD_TOP;
        newDefenderPosition = FIGHTER_POSITIONS.GROUND_HALF_GUARD_BOTTOM;
        break;
      case FIGHTER_POSITIONS.GROUND_HALF_GUARD_TOP:
        newAttackerPosition = FIGHTER_POSITIONS.GROUND_SIDE_CONTROL_TOP;
        newDefenderPosition = FIGHTER_POSITIONS.GROUND_SIDE_CONTROL_BOTTOM;
        break;
      case FIGHTER_POSITIONS.GROUND_SIDE_CONTROL_TOP:
        newAttackerPosition = FIGHTER_POSITIONS.GROUND_MOUNT_TOP;
        newDefenderPosition = FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM;
        break;
      case FIGHTER_POSITIONS.GROUND_MOUNT_TOP:
        newAttackerPosition = FIGHTER_POSITIONS.GROUND_BACK_CONTROL_OFFENCE;
        newDefenderPosition = FIGHTER_POSITIONS.GROUND_BACK_CONTROL_DEFENCE;
        break;
      default:
        return "positionAdvanceInvalid";
    }

    attacker.position = newAttackerPosition;
    defender.position = newDefenderPosition;

    console.log(
      `${attacker.name} successfully advances to ${newAttackerPosition}`
    );
    return "positionAdvanceSuccessful";
  } else {
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
const doSweep = (attacker, defender) => {
  console.log(`${attacker.name} attempts a sweep against ${defender.name}`);

  const successProbability = calculateProbability(
    attacker.Rating.groundOffence,
    defender.Rating.groundDefence
  );

  if (Math.random() < successProbability) {
    let newAttackerPosition, newDefenderPosition;

    switch (attacker.position) {
      case FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM:
        newAttackerPosition = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
        newDefenderPosition = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
        break;
      case FIGHTER_POSITIONS.GROUND_HALF_GUARD_BOTTOM:
        newAttackerPosition = FIGHTER_POSITIONS.GROUND_HALF_GUARD_TOP;
        newDefenderPosition = FIGHTER_POSITIONS.GROUND_HALF_GUARD_BOTTOM;
        break;
      case FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM:
        newAttackerPosition = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
        newDefenderPosition = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
        break;
      default:
        return "sweepInvalid";
    }

    attacker.position = newAttackerPosition;
    defender.position = newDefenderPosition;

    console.log(
      `${attacker.name} successfully sweeps ${defender.name} and is now in ${newAttackerPosition}`
    );
    return "sweepSuccessful";
  } else {
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
const doEscape = (attacker, defender) => {
  console.log(`${attacker.name} attempts to escape from ${defender.name}`);

  const successProbability = calculateProbability(
    attacker.Rating.groundDefence,
    defender.Rating.groundOffence
  );

  if (Math.random() < successProbability) {
    let newAttackerPosition, newDefenderPosition;

    switch (attacker.position) {
      case FIGHTER_POSITIONS.GROUND_SIDE_CONTROL_BOTTOM:
        newAttackerPosition = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
        newDefenderPosition = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
        break;
      case FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM:
        newAttackerPosition = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
        newDefenderPosition = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
        break;
      case FIGHTER_POSITIONS.GROUND_BACK_CONTROL_DEFENCE:
        newAttackerPosition = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
        newDefenderPosition = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
        break;
      default:
        return "escapeInvalid";
    }

    attacker.position = newAttackerPosition;
    defender.position = newDefenderPosition;

    console.log(
      `${attacker.name} successfully escapes to ${newAttackerPosition}`
    );
    return "escapeSuccessful";
  } else {
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
const doGetUp = (attacker, defender) => {
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

    console.log(`${attacker.name} successfully gets up`);
    return "getUpSuccessful";
  } else {
    console.log(`${attacker.name} fails to get up`);
    return "getUpFailed";
  }
};

/**
 * Perform a submission action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @returns {string} Outcome of the action
 */
const doSubmission = (attacker, defender) => {
  // Choose a random submission type from the applicable ones
  const applicableSubmissions = Object.values(SUBMISSION_TYPES).filter(
    (submission) => submission.applicablePositions.includes(attacker.position)
  );
  const chosenSubmission =
    applicableSubmissions[
      Math.floor(Math.random() * applicableSubmissions.length)
    ];

  console.log(
    `${attacker.name} attempts a ${chosenSubmission.name} on ${defender.name}`
  );

  // Calculate submission probabilities
  const { successChance, defenceChance, escapeChance } =
    calculateSubmissionProbability(attacker, defender, chosenSubmission);

  // Determine the outcome
  const outcome = Math.random();
  const timePassed = simulateTimePassing("submission");

  if (outcome < successChance) {
    updateFightStats(
      attacker,
      defender,
      "submission",
      chosenSubmission,
      "successful"
    );

    console.log(
      `${attacker.name} successfully submits ${defender.name} with a ${chosenSubmission.name}!`
    );
    defender.isSubmitted = true;
    return ["submissionSuccessful", timePassed, chosenSubmission.name];
  } else if (outcome < successChance + defenceChance) {
    updateFightStats(
      attacker,
      defender,
      "submission",
      chosenSubmission,
      "defended"
    );
    console.log(
      `${defender.name} defends against the ${chosenSubmission.name}`
    );
    return ["submissionDefended", timePassed, null];
  } else if (outcome < successChance + defenceChance + escapeChance) {
    updateFightStats(
      attacker,
      defender,
      "submission",
      chosenSubmission,
      "defended"
    );
    console.log(
      `${defender.name} escapes from the ${chosenSubmission.name} attempt`
    );
    return ["submissionEscaped", timePassed, null];
  }
};

/**
 * Perform a rear naked choke action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @returns {[string, number]} Outcome of the action, time passed
 */

const doRearNakedChoke = (attacker, defender) => {
  console.log(`${attacker.name} is looking for a Rear Naked Choke on ${defender.name}`);

  let timePassed = 0 // This will be updated with each stage in the submission
  let outcome = "";

  // Stage 1: Engage Arm
  if (doEngageArm(attacker, defender)) {
    timePassed += simulateTimePassing("submission");

    // Stage 2: Lock Choke
    if (doLockChoke(attacker, defender)) {
      timePassed += simulateTimePassing("submission");

      // Stage 3: Apply Choke
      if (doApplyChoke(attacker, defender)) {
        timePassed += simulateTimePassing("submission");
        outcome = "submissionSuccessful";
        updateFightStats(attacker, defender, "submission", "rearNakedChoke", "successful");
        console.log(`${attacker.name} successfully submits ${defender.name} with a Rear Naked Choke!`);
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
    position === FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM ||
    position === FIGHTER_POSITIONS.GROUND_HALF_GUARD_TOP ||
    position === FIGHTER_POSITIONS.GROUND_HALF_GUARD_BOTTOM ||
    position === FIGHTER_POSITIONS.GROUND_SIDE_CONTROL_TOP ||
    position === FIGHTER_POSITIONS.GROUND_SIDE_CONTROL_BOTTOM ||
    position === FIGHTER_POSITIONS.GROUND_MOUNT_TOP ||
    position === FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM ||
    position === FIGHTER_POSITIONS.GROUND_BACK_CONTROL_OFFENCE ||
    position === FIGHTER_POSITIONS.GROUND_BACK_CONTROL_DEFENCE
  ) {
    return determineGroundAction(fighter);
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
 * Simulate one single action
 * @param {Object[]} fighters - Array of fighter objects
 * @param {number} actionFighter - Index of the current action fighter
 * @param {number} currentTime - Current time in the round
 * @returns {[number|null, number, string|null]} Winner (if any), time passed, and submission type (if any)
 */
const simulateAction = (fighters, actionFighter, currentTime) => {
  const opponent = actionFighter === 0 ? 1 : 0;
  const fighter = fighters[actionFighter];
  const opponentFighter = fighters[opponent];
  const actionType = determineAction(fighter, opponentFighter);
  console.log(`\n[${formatTime(currentTime)}]`);

  let outcome;
  let timePassed = 0;
  let submissionType = null;

  switch (actionType) {
    case "fightStart":
      [outcome, timePassed] = doFightStart(fighter, opponentFighter);
      break;
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
      [outcome, timePassed] = doCombo(fighter, opponentFighter, actionType);
      break;
    case "clinchAttempt":
      outcome = doClinch(fighter, opponentFighter);
      timePassed = simulateTimePassing("clinchAttempt");
      break;
    case "clinchExit":
      outcome = exitClinch(fighter, opponentFighter);
      timePassed = simulateTimePassing("clinchExit");
      break;
    case "clinchStrike":
      outcome = doClinchStrike(fighter, opponentFighter);
      timePassed = simulateTimePassing("clinchStrike");
      break;
    case "clinchTakedown":
      outcome = doClinchTakedown(fighter, opponentFighter);
      timePassed = simulateTimePassing("clinchTakedown");
      break;
    case "wait":
      outcome = doWait(fighter, opponentFighter);
      timePassed = simulateTimePassing("wait");
      break;
    case "singleLegTakedown":
    case "doubleLegTakedown":
    case "tripTakedown":
    case "throwTakedown":     
      [outcome, timePassed] = doTakedown(fighter, opponentFighter, actionType);
      break;
    case "getUpAttempt":
      outcome = doGetUp(fighter, opponentFighter);
      timePassed = simulateTimePassing("getUpAttempt");
      break;
    case "positionAdvance":
      outcome = doPositionAdvance(fighter, opponentFighter);
      timePassed = simulateTimePassing("positionAdvance");
      break;
    case "sweep":
      outcome = doSweep(fighter, opponentFighter);
      timePassed = simulateTimePassing("sweep");
      break;
    case "escape":
      outcome = doEscape(fighter, opponentFighter);
      timePassed = simulateTimePassing("escape");
      break;
    case "groundPunch":
      [outcome, timePassed] = doGroundPunch(fighter, opponentFighter);
      break;
    case "submission":
      [outcome, timePassed, submissionType] = doSubmission(fighter,opponentFighter);
      break;
    case "rearNakedChoke":
      [outcome, timePassed, submissionType] = doRearNakedChoke(fighter,opponentFighter);
      break;
    default:
      console.error(`Unknown action type: ${actionType}`);
      outcome = "unknownAction";
      timePassed = 1; // Default to 1 second for unknown actions
      break;
  }

  // Apply stamina impact after the action
  const staminaChange = calculateStaminaChange(
    actionType,
    fighter.Rating.cardio
  );
  fighter.stamina = Math.max(0, fighter.stamina - staminaChange);

  // Handle special cases for stamina impact on the defender
  if (
    outcome.includes("Landed") &&
    (actionType === "bodyKick" || actionType === "bodyPunch")
  ) {
    const defenderStaminaChange = staminaChange / 2; // Reduce defender's stamina by half the attacker's stamina change
    opponentFighter.stamina = Math.max(
      0,
      opponentFighter.stamina - defenderStaminaChange
    );
  }
  console.log(`Action: ${actionType}, Outcome: ${outcome}`);
  console.log(
    `Stamina - ${fighter.name}: ${fighter.stamina.toFixed(2)}, ${
      opponentFighter.name
    }: ${opponentFighter.stamina.toFixed(2)}`
  );
  console.log(`Position - ${fighter.name}: ${fighter.position}`);

  // Check for knockout
  if (opponentFighter.isKnockedOut || isKnockedOut(opponentFighter)) {
    console.log(`${opponentFighter.name} has been knocked out!`);
    return [actionFighter, timePassed]; // Return the index of the winning fighter
  }

  // Check for successful submission
  if (outcome === "submissionSuccessful") {
    return [actionFighter, timePassed, submissionType];
  }

  return [null, timePassed, null];
};

/**
 * Simulate a single round of the fight
 * @param {Object[]} fighters - Array of fighter objects
 * @param {number} roundNumber - Current round number
 * @returns {Object} Round result including winner (if any) and submission type (if applicable)
 */
const simulateRound = (fighters, roundNumber) => {
  console.log(`\nRound ${roundNumber} begins!`);

  // Reset fighters to standing position and recover some stamina at the start of the round
  fighters.forEach((fighter) => {
    fighter.position = FIGHTER_POSITIONS.STANDING;
    fighter.stamina = recoverStaminaEndRound(
      fighter.stamina,
      fighter.Rating.cardio
    );
  });

  // Track initial stats for this round
  const initialStats = fighters.map((fighter) => ({
    ...fighter.stats,
    health: { ...fighter.health },
  }));

  let lastActionFighter;
  let currentTime = 300; // 5 minutes in seconds

  while (currentTime > 0) {
    const actionFighter = pickFighter(fighters, lastActionFighter);
    const [roundWinner, timePassed, submissionType] = simulateAction(
      fighters,
      actionFighter,
      currentTime
    );

    // Simulate time passing
    currentTime -= timePassed;

    // Check for KO or submission
    if (roundWinner !== null) {
      if (submissionType) {
        console.log(
          `${
            fighters[roundWinner].name
          } wins by ${submissionType} in round ${roundNumber} at ${formatTime(
            currentTime
          )}!`
        );
      } else {
        console.log(
          `${
            fighters[roundWinner].name
          } wins by KO in round ${roundNumber} at ${formatTime(currentTime)}!`
        );
      }
      // Calculate round statistics before returning
      const roundStats = calculateRoundStats(
        fighters[0],
        fighters[1],
        initialStats[0],
        initialStats[1]
      );
      return { winner: roundWinner, submissionType, roundStats, timeRemaining: currentTime };
    }

    lastActionFighter = actionFighter;
  }

  console.log("\n===End of Round===");

  // Calculate round statistics
  const roundStats = calculateRoundStats(
    fighters[0],
    fighters[1],
    initialStats[0],
    initialStats[1]
  );

  // Calculate health lost for each fighter during this round
  const healthLost = fighters.map((fighter, index) => {
    const initialHealth = initialStats[index].health;
    return (
      initialHealth.head -
      fighter.health.head +
      (initialHealth.body - fighter.health.body) +
      (initialHealth.legs - fighter.health.legs)
    );
  });

  // Determine round winner (fighter who lost less health)
  let roundWinner;
  if (healthLost[0] < healthLost[1]) {
    roundWinner = 0;
  } else if (healthLost[1] < healthLost[0]) {
    roundWinner = 1;
  } else {
    // If health lost is equal, 50% chance for each fighter which is to be improved in the future
    roundWinner = Math.random() < 0.5 ? 0 : 1;
  }

  fighters[roundWinner].roundsWon++;

  console.log(`\nRound ${roundNumber} Result:`);
  console.log(`${fighters[0].name}: Lost ${healthLost[0]} health`);
  console.log(`${fighters[1].name}: Lost ${healthLost[1]} health`);
  console.log(`${fighters[roundWinner].name} wins the round`);

  // Display round stats
  displayRoundStats(fighters, roundNumber, initialStats);

  return { winner: null, submissionType: null, roundStats, timeRemaining: 0 }; // no KO or sub
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
 * @returns {Object} Fight result including winner, method, and round ended
 */
const simulateFight = (fighters) => {
  let method = "Decision";
  let roundEnded = ROUNDS_PER_FIGHT;
  let submissionType = null;
  let roundStats = [];
  let endTime = 0; // Initialize end time

  // Reset the total actions performed counter
  totalActionsPerformed = 0;

  console.log("\n--- Fight Simulation Begins ---\n");
  console.log(`${fighters[0].name} vs ${fighters[1].name}\n`);

  for (let round = 1; round <= ROUNDS_PER_FIGHT; round++) {
    console.log(`\n=== Round ${round} ===`);
    const roundResult = simulateRound(fighters, round);

    // Store round statistics
    roundStats.push(roundResult.roundStats);

    // Calculate end time based on the round and remaining time
    endTime = (round - 1) * 300 + (300 - roundResult.timeRemaining);

    // Check if the round ended early (KO or submission)
    if (roundResult.winner !== null) {
      if (roundResult.submissionType) {
        method = "Submission";
        submissionType = roundResult.submissionType;
      } else {
        method = "Knockout";
      }
      roundEnded = round;
      break;
    }

    // Reset fighters' health for the next round (with some recovery)
    fighters.forEach((fighter) => {
      Object.keys(fighter.health).forEach((part) => {
        fighter.health[part] = Math.min(
          fighter.health[part] + 10,
          fighter.maxHealth[part]
        );
      });
    });
  }

  // Determine the overall winner
  let winner;
  if (method === "Decision") {
    winner = fighters[0].roundsWon > fighters[1].roundsWon ? 0 : 1;
    if (fighters[0].roundsWon === fighters[1].roundsWon) {
      method = "draw";
      winner = "draw";
    }
  } else {
    winner =
      fighters[0].health.head <= 0 ||
      fighters[0].health.body <= 0 ||
      fighters[0].health.legs <= 0 ||
      fighters[0].isSubmitted
        ? 1
        : 0;
  }

  // Display fight result
  console.log("\n--- Fight Simulation Ends ---\n");
  if (method === "draw") {
    console.log("The fight ends in a draw!");
  } else {
    const winMethod =
      method === "Submission" ? `${method} (${submissionType})` : method;
    console.log(
      `${fighters[winner].name} defeats ${
        fighters[1 - winner].name
      } by ${winMethod} in round ${roundEnded}!`
    );
  }

  return {
    winner: winner === "draw" ? null : winner,
    winnerName: winner === "draw" ? null : fighters[winner].name,
    loserName: winner === "draw" ? null : fighters[1 - winner].name,
    method: method,
    submissionType: submissionType,
    roundEnded: roundEnded,
    endTime: endTime,
    fighterStats: [fighters[0].stats, fighters[1].stats],
    fighterHealth: [fighters[0].health, fighters[1].health],
    fighterMaxHealth: [fighters[0].maxHealth, fighters[1].maxHealth],
    roundStats: roundStats, // Add round-by-round statistics to the return object
  };
};

export {
  simulateFight,
  doKick,
  doPunch,
  doGroundPunch,
  doTakedown,
  doGetUp,
  doSubmission,
  doRearNakedChoke,
  FIGHTER_POSITIONS,
  SUBMISSION_TYPES,
};
