import { FIGHTER_POSITIONS } from "./FightSim.js";

// Constants for strike damages
const STRIKE_DAMAGE = {
  jab: { damage: 2, target: "head" },
  cross: { damage: 4, target: "head" },
  hook: { damage: 5, target: "head" },
  uppercut: { damage: 6, target: "head" },
  overhand: { damage: 7, target: "head" },
  spinningBackfist: { damage: 5, target: "head" },
  supermanPunch: { damage: 6, target: "head" },
  bodyPunch: { damage: 3, target: "body" },
  headKick: { damage: 9, target: "head" },
  bodyKick: { damage: 8, target: "body" },
  legKick: { damage: 7, target: "legs" },
  takedown: { damage: 9, target: "body" },
  clinchStrike: { damage: 3, target: "head" },
  groundPunch: { damage: 3, target: "head" },
};

const DAMAGE_VARIATION_FACTOR = 0.25;
const RATING_DAMAGE_FACTOR = 0.3;

/**
 * Calculate probability of a successful action
 * @param {number} offenceRating - Attacker's offensive rating
 * @param {number} defenceRating - Defender's defensive rating
 * @returns {number} Probability of success
 */
const calculateProbability = (offenceRating, defenceRating) => {
  return offenceRating / (offenceRating + defenceRating);
};

/**
 * Calculate outcome probabilities for a fighting action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @param {string} actionType - Type of action (e.g., 'punch', 'kick' etc)
 * @returns {Object} Probabilities of hit, block, evade, and miss
 */
const calculateProbabilities = (attacker, defender, actionType) => {
  let offenceRating, defenceRating, evasiveness, accuracy;
  let hitChanceBase, hitChanceMax, missChanceBase, evadeChanceBase;

  if (actionType === "punch") {
    offenceRating =
      (attacker.Rating.striking * (attacker.Rating.handSpeed / 100)) / 100;
    defenceRating = defender.Rating.strikingDefence / 100;
    evasiveness = defender.Rating.headMovement / 100;
    accuracy = attacker.Rating.punchAccuracy / 100;
    hitChanceBase = 0.3;
    hitChanceMax = 0.5;
    missChanceBase = 0.2;
    evadeChanceBase = 0.2;
  } else if (actionType === "kick") {
    offenceRating =
      (attacker.Rating.kicking * (attacker.Rating.kickSpeed / 100)) / 100;
    defenceRating = defender.Rating.kickDefence / 100;
    evasiveness =
      (defender.Rating.headMovement + defender.Rating.footwork) / 2 / 100;
    accuracy = attacker.Rating.kickAccuracy / 100;
    hitChanceBase = 0.25;
    hitChanceMax = 0.45;
    missChanceBase = 0.25;
    evadeChanceBase = 0.25;
  } else if (actionType === "clinchStrike") {
    offenceRating = attacker.Rating.clinchStriking / 100;
    defenceRating = defender.Rating.clinchControl / 100;
    evasiveness = defender.Rating.headMovement / 100;
    accuracy = attacker.Rating.punchAccuracy / 100;
    hitChanceBase = 0.35;
    hitChanceMax = 0.55;
    missChanceBase = 0.15;
    evadeChanceBase = 0.15;
  } else {
    // For other action types, return equal probabilities
    return {
      hitChance: 0.25,
      blockChance: 0.25,
      evadeChance: 0.25,
      missChance: 0.25,
    };
  }

  // Calculate hit chance
  let hitChance = hitChanceBase + 0.2 * offenceRating;
  hitChance += 0.1 * Math.max(0, Math.min(1, offenceRating - defenceRating));
  hitChance *= accuracy;
  hitChance = Math.min(hitChanceMax, hitChance);

  // Calculate miss chance
  let missChance = missChanceBase + 0.1 * (1 - accuracy);

  // Calculate evade chance
  let evadeChance = evadeChanceBase + 0.1 * evasiveness;

  // Calculate block chance (remaining probability)
  let blockChance = 1 - (hitChance + missChance + evadeChance);

  // Normalize probabilities to ensure they sum to 1
  const total = hitChance + blockChance + evadeChance + missChance;
  hitChance /= total;
  blockChance /= total;
  evadeChance /= total;
  missChance /= total;

  return { hitChance, blockChance, evadeChance, missChance };
};

/**
 * Calculate the probability of a successful submission
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @param {Object} submissionType - Type of submission being attempted
 * @returns {Object} Probabilities of success, defence, and escape
 */
const calculateSubmissionProbability = (attacker, defender, submissionType) => {
  const offensiveSkill = attacker.Rating.submissionOffence;
  const defensiveSkill = defender.Rating.submissionDefence;
  const attackerStamina = attacker.stamina;
  const defenderStamina = defender.stamina;
  const positionAdvantage = getPositionAdvantage(
    attacker.position,
    defender.position
  );
  const submissionDifficulty = submissionType.difficultyModifier;

  let baseSuccessChance;

  // Determine which calculation to use based on relative skill levels
  if (offensiveSkill > defensiveSkill) {
    baseSuccessChance = calculateOffenceDominantSubmission(
      offensiveSkill,
      defensiveSkill,
      attackerStamina,
      defenderStamina
    );
  } else if (defensiveSkill > offensiveSkill) {
    baseSuccessChance = calculateDefenceDominantSubmission(
      offensiveSkill,
      defensiveSkill,
      attackerStamina,
      defenderStamina
    );
  } else {
    baseSuccessChance = calculateEqualSkillSubmission(
      offensiveSkill,
      attackerStamina,
      defenderStamina
    );
  }

  // Apply position advantage and submission difficulty modifiers
  let successChance =
    (baseSuccessChance * (1 + positionAdvantage)) / submissionDifficulty;

  // Ensure successChance is within [0, 1] range
  successChance = Math.max(0, Math.min(1, successChance));

  // Calculate defence and escape chances
  let defenceChance = 1 - successChance;
  let escapeChance = defenceChance * 0.3; // 30% of unsuccessful attempts result in escape
  defenceChance -= escapeChance;

  return { successChance, defenceChance, escapeChance };
};

const calculateOffenceDominantSubmission = (
  offensiveSkill,
  defensiveSkill,
  attackerStamina,
  defenderStamina
) => {
  const skillDifference = offensiveSkill - defensiveSkill;
  const staminaFactor = calculateStaminaFactor(
    attackerStamina,
    defenderStamina
  );

  // Base chance increases with skill difference
  let baseChance = 0.3 + skillDifference / 200;

  // Apply stamina factor
  baseChance *= staminaFactor;

  // Exponential reduction for very high defence skills
  if (defensiveSkill > 95) {
    baseChance *= Math.pow(0.9, defensiveSkill - 95);
  }

  return baseChance;
};

const calculateDefenceDominantSubmission = (
  offensiveSkill,
  defensiveSkill,
  attackerStamina,
  defenderStamina
) => {
  const skillDifference = defensiveSkill - offensiveSkill;
  const staminaFactor = calculateStaminaFactor(
    attackerStamina,
    defenderStamina
  );

  // Base chance decreases with skill difference
  let baseChance = 0.2 - skillDifference / 250;

  // Apply stamina factor
  baseChance *= staminaFactor;

  // Further reduction for very high defence skills
  if (defensiveSkill > 95) {
    baseChance *= Math.pow(0.8, defensiveSkill - 95);
  }

  return Math.max(0.01, baseChance); // Minimum 1% chance
};

const calculateEqualSkillSubmission = (
  skill,
  attackerStamina,
  defenderStamina
) => {
  const staminaFactor = calculateStaminaFactor(
    attackerStamina,
    defenderStamina
  );

  // Base chance when skills are equal
  let baseChance = 0.25;

  // Apply stamina factor
  baseChance *= staminaFactor;

  // Slight reduction for very high skills
  if (skill > 90) {
    baseChance *= Math.pow(0.95, skill - 90);
  }

  return baseChance;
};

const calculateStaminaFactor = (attackerStamina, defenderStamina) => {
  const staminaDifference = attackerStamina - defenderStamina;

  // Exponential effect of stamina
  let staminaFactor = Math.pow(1.05, staminaDifference / 10);

  // Additional penalty for very low defender stamina
  if (defenderStamina < 30) {
    staminaFactor *= 1 + (30 - defenderStamina) / 50;
  }

  return staminaFactor;
};

/**
 * Calculates the position advantage for ground fighting
 * @param {string} attackerPosition - The attacker's current position
 * @param {string} defenderPosition - The defender's current position
 * @returns {number} The position advantage (0 to 1)
 */
const getPositionAdvantage = (attackerPosition, defenderPosition) => {
  const advantageousPositions = {
    [FIGHTER_POSITIONS.GROUND_BACK_CONTROL_OFFENCE]: 0.3,
    [FIGHTER_POSITIONS.GROUND_MOUNT_TOP]: 0.2,
    [FIGHTER_POSITIONS.GROUND_SIDE_CONTROL_TOP]: 0.1,
    [FIGHTER_POSITIONS.GROUND_HALF_GUARD_TOP]: 0.05,
    [FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP]: 0,
  };

  return advantageousPositions[attackerPosition] || 0;
};

/**
 * Determines the next action for a fighter in a standing position
 * @param {Object} attacker - The fighter object
 * @param {Object} defender - The opponent fighter object
 * @returns {string} The determined action
 */
const determineStandingAction = (attacker, defender) => {
  const strikingOffence = attacker.Rating.striking;
  const strikingDefence = defender.Rating.strikingDefence;
  const takedownOffence = attacker.Rating.takedownOffence;
  const takedownDefence = defender.Rating.takedownDefence;
  const attackerStamina = attacker.stamina / 100;
  const strikingPreference = attacker.Tendency.strikingVsGrappling / 100;

  // Calculate base chances
  let strikeChance =
    (strikingOffence / (strikingOffence + strikingDefence)) *
    strikingPreference *
    attackerStamina;
  let takedownChance =
    (takedownOffence / (takedownOffence + takedownDefence)) *
    (1 - strikingPreference) *
    attackerStamina;
  let waitChance = 0.1 * (1 - attackerStamina); // More likely to wait when tired

  // Normalize probabilities
  const total = strikeChance + takedownChance + waitChance;
  strikeChance /= total;
  takedownChance /= total;
  waitChance /= total;

  // Choose action based on probabilities
  const random = Math.random();
  if (random < strikeChance) {
    return determineStrikeType(attacker);
  } else if (random < strikeChance + takedownChance) {
    return "takedownAttempt";
  } else {
    return "wait";
  }
};

/**
 * Determines the next action for a fighter in a ground position
 * @param {Object} fighter - The fighter object
 * @returns {string} The determined action
 */
const determineGroundAction = (fighter) => {
  const groundOffence = fighter.Rating.groundOffence;
  const groundDefence = fighter.Rating.groundDefence;
  const submissionOffence = fighter.Rating.submissionOffence;
  const submissionDefence = fighter.Rating.submissionDefence;
  const attackerStamina = fighter.stamina / 100;

  // Determine if the fighter is in an offensive or defensive position
  const isOffensive = [
    FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP,
    FIGHTER_POSITIONS.GROUND_HALF_GUARD_TOP,
    FIGHTER_POSITIONS.GROUND_SIDE_CONTROL_TOP,
    FIGHTER_POSITIONS.GROUND_MOUNT_TOP,
    FIGHTER_POSITIONS.GROUND_BACK_CONTROL_OFFENCE,
  ].includes(fighter.position);

  // Calculate base chances for common actions
  let groundPunchChance =
    (groundOffence / (groundOffence + groundDefence)) * 0.4 * attackerStamina;
  let submissionChance =
    (submissionOffence / (submissionOffence + submissionDefence)) *
    0.3 *
    attackerStamina;
  let getUpChance = 0.1 * attackerStamina;
  if (isOffensive) {
    // Offensive-specific action: positionAdvance
    let positionAdvanceChance =
      (groundOffence / (groundOffence + groundDefence)) * 0.2 * attackerStamina;

    // Normalize probabilities
    const total =
      groundPunchChance +
      submissionChance +
      positionAdvanceChance +
      getUpChance;
    groundPunchChance /= total;
    submissionChance /= total;
    positionAdvanceChance /= total;
    getUpChance /= total;

    // Choose action based on probabilities
    const random = Math.random();
    if (random < groundPunchChance) {
      return "groundPunch";
    } else if (random < groundPunchChance + submissionChance) {
      return "submission";
    } else if (
      random <
      groundPunchChance + submissionChance + positionAdvanceChance
    ) {
      return "positionAdvance";
    } else {
      return "getUpAttempt";
    }
  } else {
    // Defensive-specific actions: sweep and escape
    let sweepChance = 0;
    let escapeChance = 0;

    // Calculate sweep chance only for valid positions
    if (
      [
        FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM,
        FIGHTER_POSITIONS.GROUND_HALF_GUARD_BOTTOM,
        FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM,
      ].includes(fighter.position)
    ) {
      sweepChance =
        (groundOffence / (groundOffence + groundDefence)) *
        0.15 *
        attackerStamina;
    }

    // Calculate escape chance only for valid positions
    if (
      [
        FIGHTER_POSITIONS.GROUND_SIDE_CONTROL_BOTTOM,
        FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM,
        FIGHTER_POSITIONS.GROUND_BACK_CONTROL_DEFENCE,
      ].includes(fighter.position)
    ) {
      escapeChance =
        (groundDefence / (groundOffence + groundDefence)) *
        0.15 *
        attackerStamina;
    }

    // Adjust getUpChance for defensive position
    getUpChance = 0.2 * attackerStamina;

    // Normalize probabilities
    const total =
      groundPunchChance +
      submissionChance +
      sweepChance +
      escapeChance +
      getUpChance;
    groundPunchChance /= total;
    submissionChance /= total;
    sweepChance /= total;
    escapeChance /= total;
    getUpChance /= total;

    // Choose action based on probabilities
    const random = Math.random();
    if (random < groundPunchChance) {
      return "groundPunch";
    } else if (random < groundPunchChance + submissionChance) {
      return "submission";
    } else if (random < groundPunchChance + submissionChance + sweepChance) {
      return "sweep";
    } else if (
      random <
      groundPunchChance + submissionChance + sweepChance + escapeChance
    ) {
      return "escape";
    } else {
      return "getUpAttempt";
    }
  }
};

/**
 * Determines the next action for a fighter in a clinch position
 * @param {Object} attacker - The fighter object
 * @param {Object} defender - The opponent fighter object
 * @returns {string} The determined action
 */
const determineClinchAction = (attacker, defender) => {
  const clinchOffence = attacker.Rating.clinchOffence;
  const clinchDefence = defender.Rating.clinchDefence;
  const takedownOffence = attacker.Rating.takedownOffence;
  const takedownDefence = defender.Rating.takedownDefence;
  const attackerStamina = attacker.stamina / 100;

  // Calculate base chances
  let strikeChance =
    (clinchOffence / (clinchOffence + clinchDefence)) * 0.4 * attackerStamina;
  let takedownChance =
    (takedownOffence / (takedownOffence + takedownDefence)) *
    0.4 *
    attackerStamina;
  let breakChance = 0.2 * (1 - attackerStamina); // More likely to break when tired

  // Normalize probabilities
  const total = strikeChance + takedownChance + breakChance;
  strikeChance /= total;
  takedownChance /= total;
  breakChance /= total;

  // Choose action based on probabilities
  const random = Math.random();
  if (random < strikeChance) {
    return "clinchStrike";
  } else if (random < strikeChance + takedownChance) {
    return "clinchTakedown";
  } else {
    return "clinchExit";
  }
};

/**
 * Determines the specific type of strike for a fighter
 * @param {Object} fighter - The fighter object
 * @returns {string} The specific strike type
 */
const determineStrikeType = (fighter) => {
  const stamina = fighter.stamina / 1000;
  const boxing = fighter.Tendency.standupPreference.boxing;
  const kickBoxing = fighter.Tendency.standupPreference.kickBoxing;
  const muayThai = fighter.Tendency.standupPreference.muayThai;
  const karate = fighter.Tendency.standupPreference.karate;
  const taekwondo = fighter.Tendency.standupPreference.taekwondo;

  const totalPreference = boxing + kickBoxing + muayThai + karate + taekwondo;
  const punchPreference =
    (boxing + kickBoxing * 0.5 + muayThai * 0.3) / totalPreference;

  // Determine if it's a punch or a kick
  if (Math.random() < punchPreference * stamina) {
    // It's a punch
    const punchTypes = [
      "jab",
      "cross",
      "hook",
      "uppercut",
      "overhand",
      "spinningBackfist",
      "supermanPunch",
    ];
    const punchWeights = [4, 3.5, 3, 2.5, 2, 1.5, 1];
    return weightedRandomChoice(punchTypes, punchWeights);
  } else {
    // It's a kick
    const kickTypes = ["legKick", "bodyKick", "headKick"];
    const kickWeights = [3, 2, 1];
    return weightedRandomChoice(kickTypes, kickWeights);
  }
};

/**
 * Chooses a random item based on weights
 * @param {string[]} items - Array of items
 * @param {number[]} weights - Array of weights corresponding to items
 * @returns {string} Chosen item
 */
const weightedRandomChoice = (items, weights) => {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    if (random < weights[i]) {
      return items[i];
    }
    random -= weights[i];
  }

  return items[items.length - 1]; // Fallback to last item if something goes wrong
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
 * Calculate damage for a strike
 * @param {number} baseRating - Attacker's base rating
 * @param {string} strikeType - Type of strike
 * @returns {number} Calculated damage
 */
const calculateDamage = (baseRating, strikeType) => {
  if (!STRIKE_DAMAGE[strikeType]) {
    throw new Error("Invalid strike type " + strikeType);
  }

  let { damage: baseDamage, target } = STRIKE_DAMAGE[strikeType];

  // Special case for ground punches: randomize between head and body
  if (strikeType === "groundPunch") {
    target = Math.random() < 0.7 ? "head" : "body";
  }

  // Special case for clinch strikes: randomize between head and body
  if (strikeType === "clinchStrike") {
    target = Math.random() < 0.7 ? "head" : "body";
  }

  const randomFactor = 1 + (Math.random() * 2 - 1) * DAMAGE_VARIATION_FACTOR;
  const ratingFactor = baseRating * RATING_DAMAGE_FACTOR;

  // Calculate total damage
  const totalDamage = Math.round((baseDamage + ratingFactor) * randomFactor);

  return { damage: totalDamage, target };
};

export {
  calculateDamage,
  calculateProbabilities,
  calculateProbability,
  calculateStaminaImpact,
  calculateSubmissionProbability,
  determineStandingAction,
  determineGroundAction,
  determineClinchAction,
};
