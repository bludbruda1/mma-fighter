import { formatTime, simulateTimePassing, isKnockedOut } from "./helper.js";
import { calculateDamage, calculateProbabilities, calculateProbability, calculateStaminaImpact, calculateSubmissionProbability } from "./fightCalculations";

// Constants for fight simulation
const ROUNDS_PER_FIGHT = 3; // Number of rounds in a fight

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
  STANDING: 'standing',
  CLINCH_OFFENCE: 'clinchOffence',
  CLINCH_DEFENCE: 'clinchDefence',
  GROUND_FULL_GUARD_TOP: 'groundFullGuardTop',
  GROUND_FULL_GUARD_BOTTOM: 'groundFullGuardBottom',
  GROUND_HALF_GUARD_TOP: 'groundHalfGuardTop',
  GROUND_HALF_GUARD_BOTTOM: 'groundHalfGuardBottom',
  GROUND_SIDE_CONTROL_TOP: 'groundSideControlTop',
  GROUND_SIDE_CONTROL_BOTTOM: 'groundSideControlBottom',
  GROUND_MOUNT_TOP: 'groundMountTop',
  GROUND_MOUNT_BOTTOM: 'groundMountBottom',
  GROUND_BACK_CONTROL_OFFENCE: 'groundBackControlOffence',
  GROUND_BACK_CONTROL_DEFENCE: 'groundBackControlDefence'
};

const SUBMISSION_TYPES = {
  ARMBAR: {
    name: "Armbar",
    difficultyModifier: 1.0,
    applicablePositions: [
      FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP,
      FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM,
      FIGHTER_POSITIONS.GROUND_MOUNT_TOP,
      FIGHTER_POSITIONS.GROUND_BACK_CONTROL_OFFENCE
    ]
  },
  TRIANGLE_CHOKE: {
    name: "Triangle Choke",
    difficultyModifier: 1.2,
    applicablePositions: [
      FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM,
      FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM
    ]
  },
  REAR_NAKED_CHOKE: {
    name: "Rear-Naked Choke",
    difficultyModifier: 0.8,
    applicablePositions: [
      FIGHTER_POSITIONS.GROUND_BACK_CONTROL_OFFENCE
    ]
  },
  LEG_LOCK: {
    name: "Leg Lock",
    difficultyModifier: 1.3,
    applicablePositions: [
      FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP,
      FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM,
      FIGHTER_POSITIONS.GROUND_HALF_GUARD_TOP,
      FIGHTER_POSITIONS.GROUND_HALF_GUARD_BOTTOM
    ]
  },
  GUILLOTINE: {
    name: "Guillotine",
    difficultyModifier: 1.1,
    applicablePositions: [
      FIGHTER_POSITIONS.STANDING,
      FIGHTER_POSITIONS.CLINCH_OFFENCE,
      FIGHTER_POSITIONS.CLINCH_DEFENCE,
      FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP
    ]
  }
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
 * Gives actions that are possible from the position a fighter is in in
 * @param {Object} fighter - fighter in position
 * @returns {string} Possible actions the fighter can do
 */
const getAvailableActions = (fighter) => {
  switch (fighter.position) {
    case FIGHTER_POSITIONS.STANDING:
      return ['punch', 'kick', 'takedownAttempt', 'clinchAttempt'];
    case FIGHTER_POSITIONS.CLINCH_OFFENCE:
      return ['clinchStrike', 'clinchTakedown'];
    case FIGHTER_POSITIONS.CLINCH_DEFENCE:
      return ['clinchStrike', 'clinchTakedown', 'clinchExit'];
    case FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP:
    case FIGHTER_POSITIONS.GROUND_HALF_GUARD_TOP:
      return ['positionAdvance', 'groundPunch', 'submission'];
    case FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM:
    case FIGHTER_POSITIONS.GROUND_HALF_GUARD_BOTTOM:
      return ['sweep', 'submission', 'getUpAttempt'];
    case FIGHTER_POSITIONS.GROUND_SIDE_CONTROL_TOP:
      return ['positionAdvance', 'groundPunch', 'submission'];
    case FIGHTER_POSITIONS.GROUND_SIDE_CONTROL_BOTTOM:
      return ['recoverGuard', 'escape'];
    case FIGHTER_POSITIONS.GROUND_MOUNT_TOP:
      return ['groundPunch', 'submission'];
    case FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM:
      return ['escape', 'sweep'];
    case FIGHTER_POSITIONS.GROUND_BACK_CONTROL_OFFENCE:
      return ['groundPunch', 'submission'];
    case FIGHTER_POSITIONS.GROUND_BACK_CONTROL_DEFENCE:
      return ['escape'];
    default:
      return [];
  }
};

// Action Functions

/**
 * Perform a kick action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @param {string} kickType - Type of kick (leg kick, body kick, head kick etc)
 * @param {number} comboCount - Number of strikes already in this combo
 * @returns {string} Outcome of the action
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

  // Log the kick
  attacker.stats.kicksThrown = (attacker.stats.kicksThrown || 0) + 1;
  attacker.stats[`${kickType}sThrown`] =
    (attacker.stats[`${kickType}sThrown`] || 0) + 1;

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

  // Use COMBO_CHANCE, reduced for each strike in the combo
  const comboChance = COMBO_CHANCE * Math.pow(0.8, comboCount);

  // Determine if a combo follows (only for certain kick types and if not at max combo length)
  const comboFollows =
    ["headKick", "bodyKick", "legKick"].includes(kickType) &&
    Math.random() < comboChance &&
    comboCount < MAX_COMBO_LENGTH - 1;

  if (outcome < hitChance) {
    // Hit logic
    const { damage, target } = calculateDamage(
      attacker.Rating.kicking,
      kickType
    );
    defender.health[target] = Math.max(0, defender.health[target] - damage);

    // Update attacker's stats
    attacker.stats.kicksLanded = (attacker.stats.kicksLanded || 0) + 1;
    attacker.stats[`${kickType}sLanded`] =
      (attacker.stats[`${kickType}sLanded`] || 0) + 1;

    console.log(
      `${defender.name} is hit by the ${displayKickType} for ${JSON.stringify(
        damage
      )} damage`
    );

    // Special case for leg kicks
    if (kickType === "legKick") {
      console.log(`${defender.name}'s mobility is affected by the leg kick`);
      // We could implement additional effects here, like reduced movement or increased chance of knockdown
    }

    return [`${kickType}Landed`, timePassed, comboFollows];
  } else if (outcome < hitChance + blockChance) {
    // Block logic
    defender.stats.kicksBlocked = (defender.stats.kicksBlocked || 0) + 1;
    defender.stats[`${kickType}sBlocked`] =
      (defender.stats[`${kickType}sBlocked`] || 0) + 1;

    console.log(`${defender.name} blocks the ${displayKickType}`);

    // Special case for checked leg kicks
    if (kickType === "legKick") {
      const { damage, target } = calculateDamage(
        defender.Rating.kickDefence,
        "legKick"
      );
      attacker.health[target] = Math.max(0, attacker.health[target] - damage);
      console.log(
        `${attacker.name} takes ${damage} damage to the ${target} from the checked leg kick`
      );
    }

    return [`${kickType}Blocked`, timePassed, comboFollows];
  } else if (outcome < hitChance + blockChance + evadeChance) {
    // Evade logic
    defender.stats.kicksEvaded = (defender.stats.kicksEvaded || 0) + 1;
    defender.stats[`${kickType}sEvaded`] =
      (defender.stats[`${kickType}sEvaded`] || 0) + 1;

    console.log(`${defender.name} evades the ${displayKickType}`);
    return [`${kickType}Evaded`, timePassed, comboFollows];
  } else {
    // Miss logic
    attacker.stats.kicksMissed = (attacker.stats.kicksMissed || 0) + 1;
    attacker.stats[`${kickType}sMissed`] =
      (attacker.stats[`${kickType}sMissed`] || 0) + 1;

    console.log(
      `${attacker.name}'s ${displayKickType} misses ${defender.name}`
    );
    return [`${kickType}Missed`, timePassed, comboFollows];
  }
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

  // Log the punch
  attacker.stats.punchesThrown = (attacker.stats.punchesThrown || 0) + 1;
  attacker.stats[`${punchType}sThrown`] =
    (attacker.stats[`${punchType}sThrown`] || 0) + 1;

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

  // Use COMBO_CHANCE, reduced for each punch in the combo
  const comboChance = COMBO_CHANCE * Math.pow(0.8, comboCount);

  // Determine if a combo follows (only for certain punch types and if not at max combo length)
  const comboFollows =
    ["jab", "cross", "hook", "uppercut", "bodyPunch"].includes(punchType) &&
    Math.random() < comboChance &&
    comboCount < MAX_COMBO_LENGTH - 1;

  if (outcome < hitChance) {
    // Hit logic
    const { damage, target } = calculateDamage(
      attacker.Rating.striking,
      punchType
    );
    defender.health[target] = Math.max(0, defender.health[target] - damage);

    // Update attacker's stats
    attacker.stats.punchesLanded = (attacker.stats.punchesLanded || 0) + 1;
    attacker.stats[`${punchType}sLanded`] =
      (attacker.stats[`${punchType}sLanded`] || 0) + 1;

    console.log(
      `${defender.name} is hit by the ${displayPunchType} for ${JSON.stringify(
        damage
      )} damage`
    );

    return [`${punchType}Landed`, timePassed, comboFollows];
  } else if (outcome < hitChance + blockChance) {
    // Block logic
    defender.stats.punchesBlocked = (defender.stats.punchesBlocked || 0) + 1;
    defender.stats[`${punchType}sBlocked`] =
      (defender.stats[`${punchType}sBlocked`] || 0) + 1;

    console.log(`${defender.name} blocks the ${displayPunchType}`);
    return [`${punchType}Blocked`, timePassed, comboFollows];
  } else if (outcome < hitChance + blockChance + evadeChance) {
    // Evade logic
    defender.stats.punchesEvaded = (defender.stats.punchesEvaded || 0) + 1;
    defender.stats[`${punchType}sEvaded`] =
      (defender.stats[`${punchType}sEvaded`] || 0) + 1;

    console.log(`${defender.name} evades the ${displayPunchType}`);
    return [`${punchType}Evaded`, timePassed, comboFollows];
  } else {
    // Miss logic
    attacker.stats.punchesMissed = (attacker.stats.punchesMissed || 0) + 1;
    attacker.stats[`${punchType}sMissed`] =
      (attacker.stats[`${punchType}sMissed`] || 0) + 1;

    console.log(
      `${attacker.name}'s ${displayPunchType} misses ${defender.name}`
    );
    return [`${punchType}Missed`, timePassed, comboFollows];
  }
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

    // Decrease stamina for each additional punch in the combo
    attacker.stamina = Math.max(0, attacker.stamina - 1);
  }

  return [totalOutcome, totalTime];
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
    const { damage, target } = calculateDamage(
      attacker.Rating.groundOffence * staminaImpact,
      "groundPunch"
    );
    defender.health[target] = Math.max(0, defender.health[target] - damage);

    //update stats
    attacker.stats.groundPunchsLanded =
      (attacker.stats.groundPunchsLanded || 0) + 1;
    attacker.stats.punchesLanded = (attacker.stats.punchesLanded || 0) + 1;
    console.log(
      `${defender.name} is hit by the ground punch for ${damage} damage to the ${target}`
    );

    return "groundPunchLanded";
  } else {
    defender.stats.groundPunchsBlocked =
      (defender.stats.groundPunchsBlocked || 0) + 1;
    defender.stats.punchesBlocked = (defender.stats.punchesBlocked || 0) + 1;
    console.log(`${defender.name} blocks the ground punch`);
    return "groundPunchBlocked";
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

    attacker.stats.clinchEntered = (attacker.stats.clinchEntered || 0) + 1;
    console.log(
      `${attacker.name} successfully gets ${defender.name} in a clinch against the cage`
    );
    return "clinchSuccessful";
  } else {
    console.log(`${defender.name} defends the clinch attempt`);
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

    attacker.stats.clinchExits = (attacker.stats.clinchExits || 0) + 1;

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

  attacker.stats.clinchStrikesThrown =
    (attacker.stats.clinchStrikesThrown || 0) + 1;
  attacker.stats.punchesThrown = (attacker.stats.punchesThrown || 0) + 1;

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
    const { damage, target } = calculateDamage(
      attacker.Rating.clinchStriking,
      "clinchStrike"
    );
    defender.health[target] = Math.max(0, defender.health[target] - damage);

    // Update attacker's stats
    attacker.stats.clinchStrikesLanded =
      (attacker.stats.clinchStrikesLanded || 0) + 1;
    attacker.stats.punchesLanded = (attacker.stats.punchesLanded || 0) + 1;

    console.log(
      `${defender.name} is hit by the clinch strike for ${damage} damage to the ${target}`
    );
    return [`clinchStrikeLanded`, timePassed];
  } else if (outcome < hitChance + blockChance) {
    // Block logic
    defender.stats.clinchStrikesBlocked =
      (defender.stats.clinchStrikesBlocked || 0) + 1;
    defender.stats.punchesBlocked = (attacker.stats.punchesBlocked || 0) + 1;

    console.log(`${defender.name} blocks the clinch strike`);
    return [`clinchStrikeBlocked`, timePassed];
  } else if (outcome < hitChance + blockChance + evadeChance) {
    // Evade logic
    defender.stats.clinchStrikesEvaded =
      (defender.stats.clinchStrikesEvaded || 0) + 1;
    defender.stats.punchesEvaded = (defender.stats.punchesEvaded || 0) + 1;

    console.log(`${defender.name} evades the clinch strike`);
    return [`clinchStrikeEvaded`, timePassed];
  } else {
    // Miss logic
    attacker.stats.clinchStrikesMissed =
      (attacker.stats.clinchStrikesMissed || 0) + 1;
    attacker.stats.punchesMissed = (attacker.stats.punchesMissed || 0) + 1;

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

  attacker.stats.takedownsAttempted =
    (attacker.stats.takedownsAttempted || 0) + 1;
  attacker.stats.clinchTakedownsAttempted =
    (attacker.stats.clinchTakedownsAttempted || 0) + 1;

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
    attacker.stats.takedownsLanded = (attacker.stats.takedownsLanded || 0) + 1;
    attacker.stats.clinchTakedownsSuccessful =
      (attacker.stats.clinchTakedownsSuccessful || 0) + 1;

    // Reset clinch state and move to ground
    attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
    defender.position = FIGHTER_POSITIONS.GROUND_HALF_GUARD_BOTTOM;

    console.log(
      `${attacker.name} successfully ${takedownType}s ${defender.name} for ${damage} damage`
    );
    return `clinch${
      takedownType.charAt(0).toUpperCase() + takedownType.slice(1)
    }Successful`;
  } else {
    defender.stats.takedownsDefended =
      (attacker.stats.takedownsDefended || 0) + 1;
    defender.stats.clinchTakedownsDefended =
      (attacker.stats.clinchTakedownsDefended || 0) + 1;
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
 * @param {number} staminaImpact - Stamina impact on the action
 * @returns {string} Outcome of the action
 */
const doTakedown = (attacker, defender, staminaImpact) => {
  console.log(`${attacker.name} attempts a takedown on ${defender.name}`);
  attacker.stats.takedownsAttempted = (attacker.stats.takedownsAttempted || 0) + 1;
  if (
    Math.random() < calculateProbability(
      attacker.Rating.takedownOffence * staminaImpact,
      defender.Rating.takedownDefence
    )
  ) {
    attacker.stats.takedownsLanded = (attacker.stats.takedownsLanded || 0) + 1;

    // Update ground states
    attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
    defender.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;

    // Calculate damage for successful takedowns
    const { damage, target } = calculateDamage(
      attacker.Rating.takedownOffence * staminaImpact,
      "takedown"
    );

    // Apply damage
    defender.health[target] = Math.max(0, defender.health[target] - damage);

    console.log(
      `${attacker.name} successfully takes down ${defender.name} for ${damage} damage`
    );
    return "takedownLanded";
  } else {
    defender.stats.takedownsDefended =
      (defender.stats.takedownsDefended || 0) + 1;

    console.log(`${defender.name} defends the takedown`);
    // Both fighters remain standing
    attacker.position = FIGHTER_POSITIONS.STANDING;
    defender.position = FIGHTER_POSITIONS.STANDING;

    return "takedownDefended";
  }
};

/**
 * Attempt to advance position in ground fighting
 * @param {Object} attacker - Attacking fighter attempting to advance position
 * @param {Object} defender - Defending fighter
 * @param {number} staminaImpact - Stamina impact on the action
 * @returns {string} Outcome of the action
 */
const doPositionAdvance = (attacker, defender, staminaImpact) => {
  console.log(`${attacker.name} attempts to advance position`);
  
  const successProbability = calculateProbability(
    attacker.Rating.groundOffence * staminaImpact,
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
        return 'positionAdvanceInvalid';
    }
    
    attacker.position = newAttackerPosition;
    defender.position = newDefenderPosition;
    
    // Decrease stamina
    attacker.stamina = Math.max(0, attacker.stamina - 5);
    defender.stamina = Math.max(0, defender.stamina - 3);
    
    console.log(`${attacker.name} successfully advances to ${newAttackerPosition}`);
    return 'positionAdvanceSuccessful';
  } else {
    // Decrease stamina (less than successful attempt)
    attacker.stamina = Math.max(0, attacker.stamina - 3);
    defender.stamina = Math.max(0, defender.stamina - 1);
    
    console.log(`${attacker.name} fails to advance position`);
    return 'positionAdvanceFailed';
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
        return 'sweepInvalid';
    }
    
    attacker.position = newAttackerPosition;
    defender.position = newDefenderPosition;
    
    console.log(`${attacker.name} successfully sweeps ${defender.name} and is now in ${newAttackerPosition}`);
    return 'sweepSuccessful';
  } else {
    
    console.log(`${attacker.name} fails to sweep ${defender.name}`);
    return 'sweepFailed';
  }
};

/**
 * Attempt to escape from a disadvantageous ground position
 * @param {Object} attacker - Fighter attempting to escape (initially in bottom position)
 * @param {Object} defender - Fighter in top position
 * @returns {string} Outcome of the action
 */
const doEscape = (attacker, defender ) => {
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
        return 'escapeInvalid';
    }
    
    attacker.position = newAttackerPosition;
    defender.position = newDefenderPosition;
    
    console.log(`${attacker.name} successfully escapes to ${newAttackerPosition}`);
    return 'escapeSuccessful';
  } else {
    console.log(`${attacker.name} fails to escape`);
    return 'escapeFailed';
  }
};

/**
 * Perform an action to get up when on the ground
 * @param {Object} attacker - Fighter attempting to get up
 * @param {Object} defender - Opponent fighter
 * @returns {string} Outcome of the action
 */
const doGetUp = (attacker, defender ) => {
  console.log(`${attacker.name} attempts to get up`);
  attacker.stats.getUpsAttempted = (attacker.stats.getUpsAttempted || 0) + 1;
  if (
    Math.random() <
    calculateProbability(
      attacker.Rating.getUpAbility,
      defender.Rating.groundOffence
    )
  ) {
    attacker.stats.getUpsSuccessful = (attacker.stats.getUpsSuccessful || 0) + 1;

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
    submission => submission.applicablePositions.includes(attacker.position)
  );
  const chosenSubmission = applicableSubmissions[Math.floor(Math.random() * applicableSubmissions.length)];
  console.log(`${attacker.name} attempts a ${chosenSubmission.name} on ${defender.name}`);

  attacker.stats.submissionsAttempted = (attacker.stats.submissionsAttempted || 0) + 1;

  // Calculate submission probabilities
  const { successChance, defenseChance, escapeChance } = calculateSubmissionProbability(attacker, defender, chosenSubmission);

  // Determine the outcome
  const outcome = Math.random();
  const timePassed = simulateTimePassing("submission");

  if (outcome < successChance) {
    attacker.stats.submissionsLanded = (attacker.stats.submissionsLanded || 0) + 1;
    console.log(`${attacker.name} successfully submits ${defender.name} with a ${chosenSubmission.name}!`);
    defender.isSubmitted = true;
    return ["submissionSuccessful", timePassed];
  } else if (outcome < successChance + defenseChance) {
    defender.stats.submissionsDefended = (defender.stats.submissionsDefended || 0) + 1;
    console.log(`${defender.name} defends against the ${chosenSubmission.name}`);
    return ["submissionDefended", timePassed];
  } else if (outcome < successChance + defenseChance + escapeChance) {
    console.log(`${defender.name} escapes from the ${chosenSubmission.name} attempt`);
    return ["submissionEscaped", timePassed];
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
  if (fighter.position === FIGHTER_POSITIONS.STANDING && opponent.position === FIGHTER_POSITIONS.STANDING) {
    // Standing logic
    const rand = Math.random() * 100;
    let cumulativeProbability = 0;
    const tendencies = fighter.Tendency.standingTendency;

    if (rand < (cumulativeProbability += tendencies.punchTendency)) {
      // Determine punch type
      const punchRand = Math.random() * 100;
      if (punchRand < 20) return "jab";
      if (punchRand < 40) return "cross";
      if (punchRand < 55) return "hook";
      if (punchRand < 70) return "uppercut";
      if (punchRand < 80) return "bodyPunch";
      if (punchRand < 87) return "overhand";
      if (punchRand < 94) return "spinningBackfist";
      return "supermanPunch";
    }
    if (rand < (cumulativeProbability += tendencies.kickTendency)) {
      // Determine kick type
      const kickRand = Math.random() * 100;
      if (kickRand < 40) return "legKick";
      if (kickRand < 70) return "bodyKick";
      return "headKick";
    }
    if (rand < (cumulativeProbability += tendencies.takedownTendency)) {
      return "takedownAttempt";
    }
    if (rand < (cumulativeProbability += tendencies.clinchingTendency)) {
      return "clinchAttempt";
    }
    // If none of the above, default to jab
    return "jab";
  } else {
    // Ground and clinch logic
    const availableActions = getAvailableActions(fighter);
    const action = availableActions[Math.floor(Math.random() * availableActions.length)];
    
    switch (action) {
      case 'positionAdvance':
        return 'positionAdvance';
      case 'groundPunch':
        return 'groundPunch';
      case 'submission':
        return 'submission';
      case 'sweep':
        return 'sweep';
      case 'escape':
        return 'escape';
      case 'getUpAttempt':
        return 'getUpAttempt';
      case 'clinchStrike':
        return 'clinchStrike';
      case 'clinchTakedown':
        return 'clinchTakedown';
      case 'clinchExit':
        return 'clinchExit';
      default:
        return 'groundPunch'; // fallback action
    }
  }
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

  // Decrease stamina for the initial action
  fighter.stamina = Math.max(0, fighter.stamina - 2);
  const staminaImpact = calculateStaminaImpact(fighter.stamina);

  let outcome;
  let timePassed = 0;

  switch (actionType) {
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
    case "takedownAttempt":
      outcome = doTakedown(fighter, opponentFighter, staminaImpact);
      timePassed = simulateTimePassing("takedownAttempt");
      break;
    case "getUpAttempt":
      outcome = doGetUp(fighter, opponentFighter, staminaImpact);
      timePassed = simulateTimePassing("getUpAttempt");
      break;
    case "positionAdvance":
      outcome = doPositionAdvance(fighter, opponentFighter);
      timePassed = simulateTimePassing("positionAdvance");
      break;
    case "sweep":
      outcome = doSweep (fighter, opponentFighter);
      timePassed = simulateTimePassing("sweep");
      break;
    case "escape":
      outcome = doEscape (fighter, opponentFighter);
      timePassed = simulateTimePassing("escape");
      break;
    case "groundPunch":
      outcome = doGroundPunch(fighter, opponentFighter, staminaImpact);
      timePassed = simulateTimePassing("groundPunch");
      break;
    case "submission":
      outcome = doSubmission(fighter, opponentFighter);
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

  // Check for knockout using the isKnockedOut function
  if (isKnockedOut(opponentFighter)) {
    const knockoutPart = Object.keys(opponentFighter.health).find(
      (part) => opponentFighter.health[part] <= 0
    );
    console.log(
      `${opponentFighter.name} is knocked out due to ${knockoutPart} damage!`
    );
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
    fighter.position = FIGHTER_POSITIONS.STANDING;
    fighter.stamina = Math.min(100, fighter.stamina + 20); // Recover 20 stamina between rounds
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
    const [roundWinner, timePassed] = simulateAction(
      fighters,
      actionFighter,
      currentTime
    );

    // Simulate time passing
    currentTime -= timePassed;

    // Check for KO or submission
    if (roundWinner !== null) {
      if (isKnockedOut(fighters[1 - roundWinner])) {
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

  console.log("\n===End of Round===");

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
        (fighter.stats.takedownsLanded || 0) -
        (initialStats[index].takedownsLanded || 0)
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
  let method = "decision";
  let roundEnded = ROUNDS_PER_FIGHT;

  console.log("\n--- Fight Simulation Begins ---\n");
  console.log(`${fighters[0].name} vs ${fighters[1].name}\n`);

  for (let round = 1; round <= ROUNDS_PER_FIGHT; round++) {
    console.log(`\n=== Round ${round} ===`);
    const roundWinner = simulateRound(fighters, round);

    // Check if the round ended early (KO or submission)
    if (roundWinner !== null) {
      // Determine if it's a KO or submission
      if (isKnockedOut(fighters[1 - roundWinner])) {
        method = "knockout";
      } else if (fighters[1 - roundWinner].isSubmitted) {
        method = "submission";
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
      fighter.isSubmitted = false;
    });

    // Display round result
    const roundResult =
      fighters[0].roundsWon > fighters[1].roundsWon
        ? 0
        : fighters[1].roundsWon > fighters[0].roundsWon
        ? 1
        : "draw";
    console.log(
      `\nRound ${round} Result: ${
        roundResult === "draw"
          ? "Draw"
          : fighters[roundResult].name + " wins the round"
      }`
    );
  }

  // Determine the overall winner
  let winner;
  if (method === "decision") {
    winner =
      fighters[0].roundsWon > fighters[1].roundsWon
        ? 0
        : fighters[1].roundsWon > fighters[0].roundsWon
        ? 1
        : "draw";
    if (winner === "draw") {
      method = "draw";
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
    console.log(
      `${fighters[winner].name} defeats ${
        fighters[1 - winner].name
      } by ${method} in round ${roundEnded}!`
    );
  }

  return {
    winner: winner === "draw" ? null : winner,
    winnerName: winner === "draw" ? null : fighters[winner].name,
    loserName: winner === "draw" ? null : fighters[1 - winner].name,
    method: method,
    roundEnded: roundEnded,
    fighterStats: [fighters[0].stats, fighters[1].stats],
    fighterHealth: [fighters[0].health, fighters[1].health],
    fighterMaxHealth: [fighters[0].maxHealth, fighters[1].maxHealth],
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
  FIGHTER_POSITIONS,
  SUBMISSION_TYPES
};
