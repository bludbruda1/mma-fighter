import { FIGHTER_POSITIONS } from "./FightSim.js";
import { FIGHTING_STYLES } from "./mmaStyles.js";

// Constants for strike damages
const STRIKE_DAMAGE = {
  //standing punches
  jab: { damage: 2, target: "head" },
  cross: { damage: 4, target: "head" },
  hook: { damage: 5, target: "head" },
  uppercut: { damage: 6, target: "head" },
  overhand: { damage: 7, target: "head" },
  spinningBackfist: { damage: 5, target: "head" },
  supermanPunch: { damage: 6, target: "head" },
  bodyPunch: { damage: 3, target: "body" },
  //kicks
  headKick: { damage: 9, target: "head" },
  bodyKick: { damage: 7, target: "body" },
  legKick: { damage: 7, target: "legs" },
  //other
  takedown: { damage: 1, target: "body" },
  clinchStrike: { damage: 1, target: "head" },
  groundPunch: { damage: 1, target: "head" },
  groundElbow: { damage: 1, target: "head" },
};

const POWER_FACTOR = 0.5;
const VARIABILITY_FACTOR = 0.3;
const CRITICAL_HIT_CHANCE = 0.05;
const CRITICAL_HIT_MULTIPLIER = 2;
const KNOCKOUT_BASE_CHANCE = 0.05; 
const MAX_KNOCKOUT_CHANCE = 0.25;
const MAX_STUN_CHANCE = 0.30; 


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
 * Calculate probability of a successful takedown
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @returns {number} Probability of success
 */
const calculateTDProbability = (attacker, defender) => {
  const offensiveSkill = attacker.Rating.takedownOffence;
  const defensiveSkill = defender.Rating.takedownDefence;
  const difference = offensiveSkill - defensiveSkill;

  // Base probabilities
  let landsChance, defendedChance, sprawlChance;

  if (difference >= 15) {
    landsChance = 0.60;
    defendedChance = 0.30;
    sprawlChance = 0.10;
  } else if (difference >= 10) {
    landsChance = 0.50;
    defendedChance = 0.35;
    sprawlChance = 0.15;
  } else if (difference >= 5) {
    landsChance = 0.40;
    defendedChance = 0.40;
    sprawlChance = 0.20;
  } else if (difference >= 1) {
    landsChance = 0.33;
    defendedChance = 0.42;
    sprawlChance = 0.25;
  } else if (difference === 0) {
    landsChance = 0.25;
    defendedChance = 0.45;
    sprawlChance = 0.30;
  } else if (difference >= -4) {
    landsChance = 0.20;
    defendedChance = 0.45;
    sprawlChance = 0.35;
  } else if (difference >= -9) {
    landsChance = 0.125;
    defendedChance = 0.475;
    sprawlChance = 0.40;
  } else if (difference >= -14) {
    landsChance = 0.075;
    defendedChance = 0.475;
    sprawlChance = 0.45;
  } else {
    landsChance = 0.02;
    defendedChance = 0.48;
    sprawlChance = 0.50;
  }

  return { landsChance, defendedChance, sprawlChance };
};

/**
 * Calculate probability of a successful submssion
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @returns {number} Probability of success
 */
const calculateSubmissionProbability = (attacker, defender) => {
  const offensiveSkill = attacker.Rating.submissionOffence;
  const defensiveSkill = defender.Rating.submissionDefence;
  const difference = offensiveSkill - defensiveSkill;

  // Base probabilities
  let successChance, failChance;

  if (difference >= 35) {
    successChance = 0.99;
    failChance = 0.01;
  } else if (difference >= 30) {
    successChance = 0.95;
    failChance = 0.05;
  } else if (difference >= 25) {
    successChance = 0.85;
    failChance = 0.15;
  } else if (difference >= 20) {
    successChance = 0.75;
    failChance = 0.25;
  } else if (difference >= 15) {
    successChance = 0.60;
    failChance = 0.40;
  } else if (difference >= 10) {
    successChance = 0.50;
    failChance = 0.50;
  } else if (difference >= 5) {
    successChance = 0.40;
    failChance = 0.60;
  } else if (difference >= 1) {
    successChance = 0.33;
    failChance = 0.67;
  } else if (difference === 0) {
    successChance = 0.25;
    failChance = 0.85;
  } else if (difference >= -4) {
    successChance = 0.20;
    failChance = 0.8;
  } else if (difference >= -9) {
    successChance = 0.125;
    failChance = 0.875;
  } else if (difference >= -14) {
    successChance = 0.075;
    failChance = 0.925;
  } else if (difference >= -20) {
    successChance = 0.05;
    failChance = 0.95;
  } else if (difference >= -30) {
    successChance = 0.01;
    failChance = 0.99;
  } else {
    successChance = 0.02;
    failChance = 0.98;
  }

  console.log(`successChance: ${successChance} failChance: ${failChance}`);


  return { successChance, failChance };
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
 * Determines the next action for a fighter in a standing position
 * @param {Object} attacker - The fighter object
 * @param {Object} defender - The opponent fighter object
 * @returns {string} The determined action
 */
const determineStandingAction = (attacker, defender) => {
  const style = FIGHTING_STYLES[attacker.fightingStyle];
  const strikingOffence = attacker.Rating.striking;
  const strikingDefence = defender.Rating.strikingDefence;
  const takedownOffence = attacker.Rating.takedownOffence;
  const takedownDefence = defender.Rating.takedownDefence;
  const clinchOffence = (attacker.Rating.clinchStriking + attacker.Rating.clinchTakedown + attacker.Rating.clinchControl) / 3;
  const clinchDefence = defender.Rating.clinchDefence;
  const attackerStamina = attacker.stamina / 100;

  // Evaluate attackers strengths
  const strikingVsTakedown = strikingOffence - takedownOffence;
  const strikingVsClinch = strikingOffence - clinchOffence;
  const takedownVsClinch = takedownOffence - clinchOffence; 
  const takedownVsStriking = takedownOffence - strikingOffence;
  const clinchVsStriking = clinchOffence - strikingOffence;
  const clinchVsTakedown = clinchOffence - takedownOffence;

  // Evaluate differences between attacker and defender
  const strikingDif = strikingOffence - strikingDefence;
  const takedownDif = takedownOffence - takedownDefence;
  const clinchDif = clinchOffence - clinchDefence;

  // Calculate base chances
  let strikeChance = style.standing.strikeChance + ((strikingVsTakedown / 50 + strikingVsClinch / 50 ) / 2) + (strikingDif / 50);
  let takedownChance = style.standing.takedownChance + ((takedownVsClinch / 50 + takedownVsStriking / 50 ) / 2) + (takedownDif / 50);
  let clinchChance = style.standing.clinchChance + ((clinchVsStriking / 50 + clinchVsTakedown / 50 ) / 2) + (clinchDif / 50);
  let waitChance = style.standing.waitChance + (1 - attackerStamina); // More likely to wait when tired

  // Normalize probabilities
  const total = strikeChance + takedownChance + clinchChance + waitChance;
  strikeChance /= total;
  takedownChance /= total;
  clinchChance /= total;
  waitChance /= total;

  // Choose action based on probabilities
  const random = Math.random();
  if (random < strikeChance) {
    return determineStrikeType(attacker);
  } else if (random < strikeChance + takedownChance) {
    return determineTakedownType(attacker);
  } else if (random < strikeChance + takedownChance + clinchChance) {
    return "clinchAttempt";
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
  const attackerStamina = fighter.stamina / 100;

  // Determine if the fighter is in an offensive or defensive position
  const isOffensive = [
    FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP,
    FIGHTER_POSITIONS.GROUND_FULL_GUARD_POSTURE_UP,
    FIGHTER_POSITIONS.GROUND_HALF_GUARD_TOP,
    FIGHTER_POSITIONS.GROUND_SIDE_CONTROL_TOP,
    FIGHTER_POSITIONS.GROUND_MOUNT_TOP,
    FIGHTER_POSITIONS.GROUND_MOUNT_POSTURE_UP,
    FIGHTER_POSITIONS.GROUND_BACK_CONTROL_OFFENCE,
  ].includes(fighter.position);

  // Define available actions based on position
  let availableActions = ['groundPunch', 'groundElbow','getUpAttempt'];

  if (isOffensive) {
    availableActions.push('positionAdvance');
    // Add option for posturing up where it's applicable
    if ([
      FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP,
      FIGHTER_POSITIONS.GROUND_MOUNT_TOP,
    ].includes(fighter.position)) {
      availableActions.push('postureUp');
    }
    // Add armbar option for positions where it's applicable
    if ([
      FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP,
    ].includes(fighter.position)) {
      availableActions.push('armbar');
    }
    // Add rear-naked choke option for positions where it's applicable
    if (fighter.position === FIGHTER_POSITIONS.GROUND_BACK_CONTROL_OFFENCE) {
      availableActions.push('rearNakedChoke');
    }
  } else {
    if ([
      FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM,
      FIGHTER_POSITIONS.GROUND_HALF_GUARD_BOTTOM,
      FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM
    ].includes(fighter.position)) {
      availableActions.push('sweep');
    }
    if ([
      FIGHTER_POSITIONS.GROUND_SIDE_CONTROL_BOTTOM,
      FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM,
      FIGHTER_POSITIONS.GROUND_BACK_CONTROL_DEFENCE
    ].includes(fighter.position)) {
      availableActions.push('escape');
    }
    // Add guillotine option for positions where it's applicable
    if ([
      FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM,
      FIGHTER_POSITIONS.GROUND_HALF_GUARD_BOTTOM
    ].includes(fighter.position)) {
      availableActions.push('guillotine');
    }
      // Add armbar option for positions where it's applicable
      if ([
        FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM,
      ].includes(fighter.position)) {
        availableActions.push('armbar');
      }
    // Add traingle option for positions where it's applicable
    if ([
      FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM,
      FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM
    ].includes(fighter.position)) {
      availableActions.push('triangleChoke');
    }
  }

  // Calculate probabilities for each available action
  let actionProbabilities = {};
  let totalProbability = 0;

  availableActions.forEach(action => {
    let probability;
    switch (action) {
      case 'groundPunch':
        probability = (isOffensive ? groundOffence : groundDefence) * 0.4 * attackerStamina;
        break;
      case 'groundElbow':
        probability = (isOffensive ? groundOffence : groundDefence) * 0.4 * attackerStamina;
        break;
      case 'rearNakedChoke':
        probability = submissionOffence * 0.35 * attackerStamina;
        break;
      case 'triangleChoke':
        probability = submissionOffence * 0.2 * attackerStamina;
        break;
      case 'guillotine':
        probability = submissionOffence * 0.25 * attackerStamina;
        break;
      case 'armbar':
        probability = submissionOffence * 0.15 * attackerStamina;
        break;
      case 'postureUp':
        probability = groundOffence * 0.2 * attackerStamina;
        break;
      case 'positionAdvance':
        probability = groundOffence * 0.2 * attackerStamina;
        break;
      case 'sweep':
        probability = groundOffence * 0.15 * attackerStamina;
        break;
      case 'escape':
        probability = groundDefence * 0.15 * attackerStamina;
        break;
      case 'getUpAttempt':
        probability = (isOffensive ? 0.1 : 0.2) * attackerStamina;
        break;
      default:
        probability = 0;
    }
    actionProbabilities[action] = probability;
    totalProbability += probability;
  });

  // Normalize probabilities
  Object.keys(actionProbabilities).forEach(action => {
    actionProbabilities[action] /= totalProbability;
  });

  // Choose action based on probabilities
  const random = Math.random();
  let cumulativeProbability = 0;
  for (let action in actionProbabilities) {
    cumulativeProbability += actionProbabilities[action];
    if (random < cumulativeProbability) {
      return action;
    }
  }

  // Fallback to groundPunch if something goes wrong
  return 'groundPunch';
};

/**
 * Determines the next action for a fighter in a clinch position
 * @param {Object} attacker - The fighter object
 * @param {Object} defender - The opponent fighter object
 * @returns {string} The determined action
 */
const determineClinchAction = (attacker) => {
  const style = FIGHTING_STYLES[attacker.fightingStyle];
  const clinchStriking = attacker.Rating.clinchStriking;
  const clinchTakedown = attacker.Rating.clinchTakedown;

  // Evaluate attackers clinch strengths
  const clinchStrikingVsClinchTakedown = clinchStriking - clinchTakedown;

  // Calculate base chances
  let total = style.clinch.strikeChance + style.clinch.takedownChance + style.clinch.exitChance;
  let strikeChance = Math.MAX( 0,( style.clinch.strikeChance / total ) + (clinchStrikingVsClinchTakedown / 50))
  let takedownChance = Math.MAX( 0,( style.clinch.takedownChance / total ) + (clinchStrikingVsClinchTakedown / 50));
  let exitChance = style.clinch.exitChance / total;

  // Normalize probabilities
  total = strikeChance + takedownChance + exitChance;
  strikeChance /= total;
  takedownChance /= total;
  exitChance /= total;

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
 * @param {Object} attacker - The fighter object
 * @returns {string} The specific strike type
 */
const determineStrikeType = (attacker) => {
  const style = FIGHTING_STYLES[attacker.fightingStyle];
  
  // Relevant ratings
  const punchPower = attacker.Rating.punchPower;
  const kickPower = attacker.Rating.kickPower;
  const punchSpeed = attacker.Rating.handSpeed;
  const kickSpeed = attacker.Rating.kickSpeed;
  const punchAccuracy = attacker.Rating.punchAccuracy;
  const kickAccuracy = attacker.Rating.kickAccuracy;

  // Evaluate striker's strengths
  const punchVsKick = (punchPower + punchSpeed + punchAccuracy) - (kickPower + kickSpeed + kickAccuracy);

  // Calculate punch vs kick probability
  let punchProbability = style.standing.punchPreference + (punchVsKick / 150);  // Dividing by 150 to keep the influence moderate
  punchProbability = Math.max(0.1, Math.min(0.9, punchProbability));  // Clamp between 0.1 and 0.9

  // Determine if it's a punch or a kick
  if (Math.random() < punchProbability) {
    // It's a punch
    const punchTypes = ["jab", "cross", "hook", "uppercut", "overhand", "spinningBackfist", "supermanPunch"];
    let punchWeights = [...style.standing.punchWeights];  // Create a copy of the style's punch weights

    // Adjust weights based on fighter's ratings
    punchWeights[0] *= (punchSpeed + punchAccuracy) / 100;  // jab
    punchWeights[1] *= (punchPower + punchAccuracy) / 100;  // cross
    punchWeights[2] *= (punchPower + punchSpeed) / 100;     // hook
    punchWeights[3] *= punchPower / 50;                     // uppercut
    punchWeights[4] *= punchPower / 50;                     // overhand
    punchWeights[5] *= (punchSpeed + punchAccuracy) / 100;  // spinningBackfist
    punchWeights[6] *= (punchPower + punchAccuracy) / 100;  // supermanPunch

    return weightedRandomChoice(punchTypes, punchWeights);
  } else {
    // It's a kick
    const kickTypes = ["legKick", "bodyKick", "headKick"];
    let kickWeights = [...style.standing.kickWeights];  // Create a copy of the style's kick weights

    // Adjust weights based on fighter's ratings
    kickWeights[0] *= (kickSpeed + kickAccuracy) / 100;  // legKick
    kickWeights[1] *= (kickPower + kickAccuracy) / 100;  // bodyKick
    kickWeights[2] *= (kickPower + kickSpeed) / 100;     // headKick

    return weightedRandomChoice(kickTypes, kickWeights);
  }
};

/**
 * Determines the specific type of takedown for a fighter
 * @param {Object} attacker - The fighter object
 * @returns {string} The specific takedown type
 */
const determineTakedownType = (attacker) => {
    
  // Relevant ratings
  const wrestlingSkill = attacker.Rating.takedownOffence;
  const judoSkill = attacker.Rating.clinchTakedown;

  // Calculate probabilities
  let singleLegProb = 0.3 + (wrestlingSkill / 200);
  let doubleLegProb = 0.3 + (wrestlingSkill / 200);
  let tripProb = 0.2 + (judoSkill / 200);
  let throwProb = 0.2 + (judoSkill / 200);

  // Normalize probabilities
  const total = singleLegProb + doubleLegProb + tripProb + throwProb;
  singleLegProb /= total;
  doubleLegProb /= total;
  tripProb /= total;
  throwProb /= total;

  // Choose takedown type based on probabilities
  const random = Math.random();
  if (random < singleLegProb) {
    return "singleLegTakedown";
  } else if (random < singleLegProb + doubleLegProb) {
    return "doubleLegTakedown";
  } else if (random < singleLegProb + doubleLegProb + tripProb) {
    return "tripTakedown";
  } else {
    return "throwTakedown";
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
 * @param {number} cardio - Cardio rating of the fighter
 * @returns {number} Stamina impact factor
 */
const calculateStaminaImpact = (stamina, cardio) => {
  const baseImpact = 0.7 + 0.3 * (stamina / 100); // Effectiveness ranges from 70% to 100%
  const cardioFactor = 1 + (cardio - 50) / 100; // Cardio rating effect (50 is considered average)
  return baseImpact * cardioFactor;
};

/**
 * Calculate the damage and effects of a strike
 * @param {Object} attacker - The attacking fighter
 * @param {Object} defender - The defending fighter
 * @param {string} strikeType - The type of strike (e.g., 'jab', 'cross', 'hook', 'uppercut', 'headKick', 'bodyKick', 'legKick')
 * @returns {Object} An object containing the following properties:
 *   - damage {number}: The amount of damage dealt
 *   - target {string}: The body part targeted ('head', 'body', or 'legs')
 *   - isCritical {boolean}: Whether the strike was a critical hit
 *   - isKnockout {boolean}: Whether the strike resulted in a knockout
 *   - isStun {boolean}: Whether the strike resulted in a stun
 *   - knockoutProbability {number}: The calculated probability of a knockout
 */
const calculateStrikeDamage = (attacker, defender, strikeType) => {
  if (!STRIKE_DAMAGE[strikeType]) {
    throw new Error("Invalid strike type " + strikeType);
  }

  let { damage: baseDamage, target } = STRIKE_DAMAGE[strikeType];

  // Special case for ground punches and clinch strikes: randomize between head and body
  if (strikeType === "groundPunch" || strikeType === "clinchStrike") {
    target = Math.random() < 0.7 ? "head" : "body";
  }

   // Determine if it's a punch or a kick
  const isPunch = ["jab", "cross", "hook", "uppercut", "overhand", "spinningBackfist", "supermanPunch", "bodyPunch", "groundPunch", "groundElbow", "clinchStrike"].includes(strikeType);

  // Apply power factor based on the attacker's rating
  const powerFactor = 1 + (isPunch ? attacker.Rating.punchPower : attacker.Rating.kickPower) / 100 * POWER_FACTOR;

  // Add variability to the damage
  const variability = 1 + (Math.random() * 2 - 1) * VARIABILITY_FACTOR;

  // Calculate total damage
  let totalDamage = Math.round(baseDamage * powerFactor * variability);

  // Calculate damage multiplier for postured-up positions
  let postureDamageMultiplier = 1;
  if (attacker.position === FIGHTER_POSITIONS.GROUND_FULL_GUARD_POSTURE_UP ||
      attacker.position === FIGHTER_POSITIONS.GROUND_MOUNT_POSTURE_UP) {
    // Increase damage by 30-50% when postured up
    postureDamageMultiplier = 1 + (0.3 + Math.random() * 0.2);
  }

  // Apply the multiplier to the total damage
  totalDamage = Math.round(totalDamage * postureDamageMultiplier);

  // Check for critical hit
  const isCritical = Math.random() < CRITICAL_HIT_CHANCE;
  if (isCritical) {
    totalDamage *= CRITICAL_HIT_MULTIPLIER;
  }

  // Calculate effective toughness (combination of toughness and chin for head strikes)
  const effectiveToughness = target === "head" 
    ? (defender.Rating.toughness * 0.35 + defender.Rating.chin * 0.65)
    : defender.Rating.toughness;

  // Calculate damage reduction based on defender's toughness and chin
  const damageReduction = target === "head" 
    ? 1 - (effectiveToughness / 200) // Max 50% reduction for head strikes
    : 1 - (defender.Rating.toughness / 300); // Max 33% reduction for body strikes

  totalDamage = Math.round(totalDamage * damageReduction);

  // Calculate knockout and stun probabilities (not applicable for ground strikes)
  let knockoutProbability = 0;
  let isKnockout = false;
  let isStun = false;

  if (strikeType !== "groundPunch" || strikeType !== "groundElbow" || strikeType !== "clinchStrike" ) {
    knockoutProbability = calculateKnockoutProbability(attacker, defender, totalDamage, target, strikeType);
    isKnockout = Math.random() < knockoutProbability;

    // Determine if the strike causes a stun (more likely than a knockout)
    const stunProbability = Math.min(knockoutProbability * 2, MAX_STUN_CHANCE);
    isStun = !isKnockout && Math.random() < stunProbability;
  }

  return {
    damage: totalDamage,
    target,
    isCritical,
    isStun,
    isKnockout,
    knockoutProbability  // Added for debugging purposes
  };
};


const calculateKnockoutProbability = (attacker, defender, damageDealt, target, strikeType) => {
  if (target !== "head" || strikeType === "jab") {
    return 0; // No knockout chance for body shots or jabs
  }

  const isPunch = ["hook", "uppercut", "overhand", "spinningBackfist", "supermanPunch"].includes(strikeType);
  const strikePower = isPunch ? attacker.Rating.punchPower : attacker.Rating.kickPower;
  const defenderChin = defender.Rating.chin;
  const defenderCurrentHealth = defender.health.head;
  const defenderMaxHealth = defender.maxHealth.head;

  // Calculate power factor (emphasize very high punch power)
  let powerFactor = strikePower / 100;
  if (strikePower >= 95) {
    powerFactor *= 1.5; // 50% boost for very high strike power
  }

  // Calculate chin vulnerability (emphasize weak chin)
  let chinVulnerability = (100 - defenderChin) / 100;
  if (defenderChin <= 70) {
    chinVulnerability *= 1.5; // 50% increased vulnerability for weak chin
  }

  // Calculate health factor
  const healthFactor = 1 - (defenderCurrentHealth / defenderMaxHealth);

  // Calculate damage factor
  const damageFactor = damageDealt / 100; // Normalize damage to 0-1 range

  // Calculate base knockout probability
  let knockoutProbability = KNOCKOUT_BASE_CHANCE * powerFactor * chinVulnerability * (1 + healthFactor) * (1 + damageFactor);

  // Adjust probability for kicks (generally lower than punches)
  if (!isPunch) {
    knockoutProbability *= 0.8; // 20% reduction for kicks
  }

  // Apply random factor
  knockoutProbability *= (1 + (Math.random() - 0.5) * 0.4); // +/- 20% randomness

  // Clamp the probability between 0 and MAX_KNOCKOUT_CHANCE
  return Math.min(Math.max(knockoutProbability, 0), MAX_KNOCKOUT_CHANCE);
};

export {
  calculateStrikeDamage,
  calculateProbabilities,
  calculateProbability,
  calculateTDProbability,
  calculateSubmissionProbability,
  calculateStaminaImpact,
  determineStandingAction,
  determineGroundAction,
  determineClinchAction,
};