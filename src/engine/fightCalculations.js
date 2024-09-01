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
 * @param {number} offenseRating - Attacker's offensive rating
 * @param {number} defenseRating - Defender's defensive rating
 * @returns {number} Probability of success
 */
const calculateProbability = (offenseRating, defenseRating) => {
    return offenseRating / (offenseRating + defenseRating);
  };
  
  /**
   * Calculate outcome probabilities for a fighting action
   * @param {Object} attacker - Attacking fighter
   * @param {Object} defender - Defending fighter
   * @param {string} actionType - Type of action (e.g., 'punch', 'kick' etc)
   * @returns {Object} Probabilities of hit, block, evade, and miss
   */
  const calculateProbabilities = (attacker, defender, actionType) => {
    let offenseRating, defenseRating, evasiveness, accuracy;
    let hitChanceBase, hitChanceMax, missChanceBase, evadeChanceBase;
  
    if (actionType === "punch") {
      offenseRating =
        (attacker.Rating.striking * (attacker.Rating.handSpeed / 100)) / 100;
      defenseRating = defender.Rating.strikingDefence / 100;
      evasiveness = defender.Rating.headMovement / 100;
      accuracy = attacker.Rating.punchAccuracy / 100;
      hitChanceBase = 0.3;
      hitChanceMax = 0.5;
      missChanceBase = 0.2;
      evadeChanceBase = 0.2;
    } else if (actionType === "kick") {
      offenseRating =
        (attacker.Rating.kicking * (attacker.Rating.kickSpeed / 100)) / 100;
      defenseRating = defender.Rating.kickDefence / 100;
      evasiveness =
        (defender.Rating.headMovement + defender.Rating.footwork) / 2 / 100;
      accuracy = attacker.Rating.kickAccuracy / 100;
      hitChanceBase = 0.25;
      hitChanceMax = 0.45;
      missChanceBase = 0.25;
      evadeChanceBase = 0.25;
    } else if (actionType === "clinchStrike") {
      offenseRating = attacker.Rating.clinchStriking / 100;
      defenseRating = defender.Rating.clinchControl / 100;
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
    let hitChance = hitChanceBase + 0.2 * offenseRating;
    hitChance += 0.1 * Math.max(0, Math.min(1, offenseRating - defenseRating));
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
  
    console.log(`Offense Rating: ${offenseRating}`);
    console.log(`Defense Rating: ${defenseRating}`);
    console.log(`Evasiveness: ${evasiveness}`);
    console.log(`Accuracy: ${accuracy}`);
  
    console.log(`Hit Chance: ${(hitChance * 100).toFixed(2)}%`);
    console.log(`Block Chance: ${(blockChance * 100).toFixed(2)}%`);
    console.log(`Evade Chance: ${(evadeChance * 100).toFixed(2)}%`);
    console.log(`Miss Chance: ${(missChance * 100).toFixed(2)}%`);
  
    return { hitChance, blockChance, evadeChance, missChance };
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
    calculateStaminaImpact
  };