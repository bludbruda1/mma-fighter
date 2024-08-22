import { formatTime, simulateTimePassing, isKnockedOut } from "./helper.js";

// Constants for fight simulation
const ROUNDS_PER_FIGHT = 3; // Number of rounds in a fight

// Constants for strike damages
const STRIKE_DAMAGE = {
  jab: {damage: 2, target: 'head'},
  cross: {damage: 4, target: 'head'},
  hook: {damage: 5, target: 'head'},
  uppercut: {damage: 6, target: 'head'},
  overhand: {damage: 7, target: 'head'}, 
  spinningBackfist: {damage: 5, target: 'head'},
  supermanPunch: {damage: 6, target: 'head'}, 
  bodyPunch: {damage: 3, target: 'body'},
  headKick: {damage: 9, target: 'head'},
  bodyKick: {damage: 8, target: 'body'},
  legKick: {damage: 7, target: 'legs'},
  takedown: {damage: 9, target: 'body'},
  groundPunch: {damage: 3, target: 'head'}
};

const DAMAGE_VARIATION_FACTOR = 0.25;
const RATING_DAMAGE_FACTOR = 0.3;

//constants for combinations
const COMBO_CHANCE = 0.4; // 40% chance to attempt a combo after a successful punch
const COMBO_SUCCESS_MODIFIER = 0.8; // Each subsequent punch in a combo is 20% less likely to land
const COMBO_FOLLOW_UPS = {
  jab: ["jab", "cross", "hook", "overhand", "bodyPunch"],
  cross: ["hook", "uppercut", "bodyPunch"],
  hook: ["uppercut", "cross", "bodyPunch"],
  uppercut: ["hook", "cross"],
  bodyPunch: ["hook", "uppercut", "cross", "overhand"]
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

  let {damage: baseDamage, target } = STRIKE_DAMAGE[strikeType];

  // Special case for ground punches: randomize between head and body
  if (strikeType === 'groundPunch') {
    target = Math.random() < 0.7 ? 'head' : 'body';
  }

  const randomFactor = 1 + (Math.random() * 2 - 1) * DAMAGE_VARIATION_FACTOR;
  const ratingFactor = baseRating * RATING_DAMAGE_FACTOR;

  // Calculate total damage
  const totalDamage = Math.round((baseDamage + ratingFactor) * randomFactor);
  
  return { damage: totalDamage, target };
};

// Action Functions

/**
 * Perform a kick action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @param {number} staminaImpact - Stamina impact on the action
 * @returns {string} Outcome of the action
 */
const doKick = (
  attacker,
  defender, 
  staminaImpact, 
  kickType
) => {

    // This just cleans up the text output, eventually we will have commentary file that will do this and we can remove this. Its only for the techniques with two words lol
    let displayKickType = kickType;
    if (kickType === 'legKick') {
      displayKickType = 'leg kick';
    } else if (kickType === 'bodyKick') {
      displayKickType = 'body kick';
    } else if (kickType === 'headKick') {
      displayKickType = 'head kick';
    }

  console.log(`${attacker.name} throws a ${displayKickType} at ${defender.name}`);

  const successChance = calculateProbability(
    attacker.Rating.kicking * staminaImpact,
    defender.Rating.kickDefence
  );

  if (Math.random() < successChance) {
    const { damage, target } = calculateDamage(attacker.Rating.kicking * staminaImpact, kickType);
    defender.health[target] = Math.max(0, defender.health[target] - damage);

    attacker.stats.kicksLanded = (attacker.stats.kicksLanded || 0) + 1;
    attacker.stats[`${kickType}sLanded`] = (attacker.stats[`${kickType}sLanded`] || 0) + 1;

    console.log(`${defender.name} is hit by the ${displayKickType} for ${JSON.stringify(damage)} damage`);
    
    // Special case for leg kicks
    if (kickType === 'legKick') {
      console.log(`${defender.name}'s mobility is affected by the leg kick`);
      // We could implement additional effects here, like reduced movement or increased chance of knockdown
    }

    return [`${kickType}Landed`, simulateTimePassing(kickType), false]; // Kicks don't lead to combos in this system
  } else {
    defender.stats.kicksBlocked = (defender.stats.kicksBlocked || 0) + 1;
    defender.stats[`${kickType}sBlocked`] = (defender.stats[`${kickType}sBlocked`] || 0) + 1;

    console.log(`${defender.name} blocks the ${displayKickType}`);

    // Special case for checked leg kicks
    if (kickType === 'legKick') {
      const { damage, target } = calculateDamage(defender.Rating.legKickDefence, 'legKick');
      attacker.health[target] = Math.max(0, attacker.health[target] - damage);
      console.log(`${attacker.name} takes ${damage} damage to the ${target} from the checked leg kick`);
    }

    return [`${kickType}Blocked`, simulateTimePassing(kickType), false];
  }
};


/**
 * Perform a single punch action
 * @param {Object} attacker - Attacking fighter
 * @param {Object} defender - Defending fighter
 * @param {number} staminaImpact - Stamina impact on the action
 * @param {string} punchType - Type of punch (jab, cross, hook, uppercut etc)
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

  // This just cleans up the text output, eventually we will have commentary file that will do this and we can remove this. Its only for the techniques with two words lol
  let displayPunchType = punchType;
  if (punchType === 'spinningBackfist') {
    displayPunchType = 'spinning backfist';
  } else if (punchType === 'supermanPunch') {
    displayPunchType = 'superman punch';
  } else if (punchType === 'bodyPunch') {
    displayPunchType = 'punch to the body';
  }

  console.log(
    `${attacker.name} throws a ${displayPunchType}${
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
    const { damage, target } = calculateDamage(attacker.Rating.striking * staminaImpact, punchType);
    defender.health[target] = Math.max(0, defender.health[target] - damage);

    // Update overall punch stats
    attacker.stats.punchesLanded = (attacker.stats.punchesLanded || 0) + 1;

    // Update specific punch type stats
    attacker.stats[`${punchType}sLanded`] =
      (attacker.stats[`${punchType}sLanded`] || 0) + 1;

    console.log(
      `${defender.name} is hit by the ${displayPunchType} for ${JSON.stringify(damage)} damage`
    );

    // Determine if a combo follows
    const comboFollows = ['jab', 'cross', 'hook', 'uppercut', 'bodyPunch'].includes(punchType) && Math.random() < COMBO_CHANCE && comboCount < 2;

    return [punchType + "Landed", timePassed, comboFollows];
  } else {
    defender.stats.punchesBlocked = (defender.stats.punchesBlocked || 0) + 1;

    // Update specific punch type blocked stats
    defender.stats[`${punchType}sBlocked`] =
      (defender.stats[`${punchType}sBlocked`] || 0) + 1;

    console.log(`${defender.name} blocks the ${displayPunchType}`);
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

    // Check if the defender is knocked out after each punch
    if (isKnockedOut(defender)) {
      console.log(`${defender.name} is knocked out by the combo!`);
      break;
    }

    if (!comboFollows) break;

    comboCount++;
    const followUpOptions = COMBO_FOLLOW_UPS[currentPunch];
    currentPunch =
      followUpOptions[Math.floor(Math.random() * followUpOptions.length)];
    console.log(`${attacker.name} follows up with a ${currentPunch}`);

    // Decrease stamina for each additional punch in the combo
    attacker.stamina = Math.max(0, attacker.stamina - 1);
    staminaImpact = calculateStaminaImpact(attacker.stamina);
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
    const { damage, target } = calculateDamage(attacker.Rating.groundOffence * staminaImpact, "groundPunch");
    defender.health[target] = Math.max(0, defender.health[target] - damage);

    //update stats
    attacker.stats.groundPunchsLanded = (attacker.stats.groundPunchsLanded || 0) + 1;
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
  attacker.stats.takedownsAttempted = (attacker.stats.takedownsAttempted || 0) + 1;
  if (
    Math.random() <
    calculateProbability(
      attacker.Rating.takedownOffence * staminaImpact,
      defender.Rating.takedownDefence
    )
  ) {
    attacker.stats.takedownsLanded = (attacker.stats.takedownsLanded || 0) + 1;

    // Update ground states
    attacker.isStanding = false;
    attacker.isGroundOffense = true;
    attacker.isGroundDefense = false;
    defender.isStanding = false;
    defender.isGroundOffense = false;
    defender.isGroundDefense = true;

    // Calculate damage for successful takedowns
    const { damage, target } = calculateDamage(attacker.Rating.takedownOffence * staminaImpact, "takedown");

    // Apply damage
    defender.health[target] = Math.max(0, defender.health[target] - damage);

    console.log(
      `${attacker.name} successfully takes down ${defender.name} for ${damage} damage`
    );
    return "takedownLanded";
  } else {
    defender.stats.takedownsDefended = (defender.stats.takedownsDefended || 0) + 1;

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
  fighter.stats.getUpsAttempted = (fighter.stats.getUpsAttempted || 0) + 1;
  if (
    Math.random() <
    calculateProbability(
      fighter.Rating.getUpAbility * staminaImpact,
      opponent.Rating.groundOffence
    )
  ) {
    fighter.stats.getUpsSuccessful = (fighter.stats.getUpsSuccessful || 0) + 1;
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
  attacker.stats.submissionsAttempted = (attacker.stats.submissionsAttempted || 0) + 1;
  if (
    Math.random() <
    calculateProbability(
      attacker.Rating.submissionOffense * staminaImpact,
      defender.Rating.submissionDefense
    )
  ) {
    attacker.stats.submissionsLanded = (attacker.stats.submissionsLanded || 0) + 1;
    console.log(`${attacker.name} successfully submits ${defender.name}!`);
    // flags that the loser has been submitted
    defender.isSubmitted = true;
    return "submissionSuccessful";
  } else {
    defender.stats.submissionsDefended = (defender.stats.submissionsDefended || 0) + 1;
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
      // Determine punch type
      const punchRand = Math.random() * 100;
      if (punchRand < 20) return "jab";
      if (punchRand < 40) return "cross";
      if (punchRand < 55) return "hook";
      if (punchRand < 70) return "uppercut";
      if (punchRand < 80) return "bodyPunch";  // Added body punch
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
    // If none of the above, default to jab
    return "jab";
  } else if (fighter.isGroundOffense) {
    // Ground offense logic
    const rand = Math.random() * 100;
    let cumulativeProbability = 0;
    const tendencies = fighter.Tendency.groundOffenseTendency;
    
    if (rand < (cumulativeProbability += tendencies.punchTendency)) {
      return "groundPunch";
    }
    if (rand < (cumulativeProbability += tendencies.submissionTendency)) {
      return "submission";
    }
    return "getUpAttempt";
  } else if (fighter.isGroundDefense) {
    // Ground defense logic
    const rand = Math.random() * 100;
    let cumulativeProbability = 0;
    const tendencies = fighter.Tendency.groundDefenseTendency;
    
    if (rand < (cumulativeProbability += tendencies.punchTendency)) {
      return "groundPunch";
    }
    if (rand < (cumulativeProbability += tendencies.submissionTendency)) {
      return "submission";
    }
    return "getUpAttempt";
  }
  // This should never happen, but requires a return statement
  return "jab";
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
      [outcome, timePassed] = doCombo(fighter, opponentFighter, staminaImpact, actionType);
      break;
      case "overhand":
      case "spinningBackfist":
      case "supermanPunch":
        // These new punches are single actions, not part of combos
      [outcome, timePassed] = doPunch(fighter, opponentFighter, staminaImpact, actionType);
      break;
    case "headKick":
    case "bodyKick":
    case "legKick":
      [outcome, timePassed] = doKick(fighter, opponentFighter, staminaImpact, actionType);
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

  // Check for knockout using the isKnockedOut function
  if (isKnockedOut(opponentFighter)) {
    const knockoutPart = Object.keys(opponentFighter.health).find(part => opponentFighter.health[part] <= 0);
    console.log(`${opponentFighter.name} is knocked out due to ${knockoutPart} damage!`);
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
  let currentTime = 300; // 5 minutes in seconds
  
  // Track initial stats for this round
  const initialStats = fighters.map((fighter) => ({ 
    ...fighter.stats,
    health: { ...fighter.health }
  }));

  while (currentTime > 0) {
    const actionFighter = pickFighter(fighters, lastActionFighter);
    const [roundWinner, timePassed] = simulateAction(fighters, actionFighter, currentTime);
    
    // Simulate time passing
    currentTime -= timePassed;
    
    // Check for KO or submission
    if (roundWinner !== null) {
      if (isKnockedOut(fighters[1 - roundWinner])) {
        console.log(`\n${fighters[roundWinner].name} wins by KO in round ${roundNumber} at ${formatTime(currentTime)}!`);
      } else {
        console.log(`\n${fighters[roundWinner].name} wins by submission in round ${roundNumber} at ${formatTime(currentTime)}!`);
      }
      return roundWinner;
    }
    
    lastActionFighter = actionFighter;
  }

  console.log("\n===End of Round===");
  
  // Determine round winner based on damage dealt
  const damageDealt = fighters.map((fighter, index) => 
    Object.keys(fighter.health).reduce((total, part) => 
      total + (initialStats[index].health[part] - fighter.health[part]), 0)
  );
  
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
    
    // Striking stats
    console.log("Striking:");
    console.log(`  Punches Landed: ${(fighter.stats.punchesLanded || 0 ) - (initialStats[index].punchesLanded || 0 )}`);
    console.log(`    Jabs: ${(fighter.stats.jabsLanded || 0) - (initialStats[index].jabsLanded || 0)}`);
    console.log(`    Crosses: ${(fighter.stats.crossesLanded || 0) - (initialStats[index].crossesLanded || 0)}`);
    console.log(`    Hooks: ${(fighter.stats.hooksLanded || 0) - (initialStats[index].hooksLanded || 0)}`);
    console.log(`    Uppercuts: ${(fighter.stats.uppercutsLanded || 0) - (initialStats[index].uppercutsLanded || 0)}`);
    console.log(`    Body Punches: ${(fighter.stats.bodyPunchsLanded || 0) - (initialStats[index].bodyPunchsLanded || 0)}`);
    console.log(`  Kicks Landed: ${(fighter.stats.kicksLanded|| 0) - (initialStats[index].kicksLanded|| 0)}`);
    console.log(`    Head Kicks: ${(fighter.stats.headKicksLanded || 0) - (initialStats[index].headKicksLanded || 0)}`);
    console.log(`    Body Kicks: ${(fighter.stats.bodyKicksLanded || 0) - (initialStats[index].bodyKicksLanded || 0)}`);
    console.log(`    Leg Kicks: ${(fighter.stats.legKicksLanded || 0) - (initialStats[index].legKicksLanded || 0)}`);
    
    // Grappling stats
    console.log("Grappling:");
    console.log(`  Takedowns: ${(fighter.stats.takedownsLanded|| 0 ) - (initialStats[index].takedownsLanded|| 0 )} / ${(fighter.stats.takedownsAttempted|| 0 ) - (initialStats[index].takedownsAttempted|| 0 )}`);
    console.log(`  Submissions Attempted: ${(fighter.stats.submissionsAttempted|| 0 ) - (initialStats[index].submissionsAttempted|| 0 )}`);
    console.log(`  Submissions Landed: ${(fighter.stats.submissionsLanded|| 0 ) - (initialStats[index].submissionsLanded|| 0 )}`);
    
    // Ground stats
    console.log("Ground Game:");
    console.log(`  Ground Strikes Landed: ${(fighter.stats.groundPunchsLanded|| 0 ) - (initialStats[index].groundPunchsLanded|| 0 )}`);
    
    // Defense stats
    console.log("Defense:");
    console.log(`  Strikes Blocked: ${((fighter.stats.punchesBlocked|| 0 ) + (fighter.stats.kicksBlocked|| 0 )) - ((initialStats[index].punchesBlocked|| 0 ) + (initialStats[index].kicksBlocked|| 0 ))}`);
    console.log(`  Takedowns Defended: ${(fighter.stats.takedownsDefended|| 0 ) - (initialStats[index].takedownsDefended|| 0 )}`);
    console.log(`  Submissions Defended: ${(fighter.stats.submissionsDefended|| 0 ) - (initialStats[index].submissionsDefended|| 0 )}`);
    
    // Health and stamina
    console.log("Health and Stamina:");
    console.log(`  Current Health: Head: ${fighter.health.head}/${fighter.maxHealth.head}, Body: ${fighter.health.body}/${fighter.maxHealth.body}, Legs: ${fighter.health.legs}/${fighter.maxHealth.legs}`);
    console.log(`  Damage Taken: Head: ${initialStats[index].health.head - fighter.health.head}, Body: ${initialStats[index].health.body - fighter.health.body}, Legs: ${initialStats[index].health.legs - fighter.health.legs}`);
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
      Object.keys(fighter.health).forEach(part => {
        fighter.health[part] = Math.min(fighter.health[part] + 10, fighter.maxHealth[part]);
      });
      fighter.isSubmitted = false;
    });

    // Display round result
    const roundResult = fighters[0].roundsWon > fighters[1].roundsWon ? 0 : 
                        fighters[1].roundsWon > fighters[0].roundsWon ? 1 : 'draw';
    console.log(`\nRound ${round} Result: ${roundResult === 'draw' ? 'Draw' : fighters[roundResult].name + ' wins the round'}`);
  }

  // Determine the overall winner
  let winner;
  if (method === "decision") {
    winner = fighters[0].roundsWon > fighters[1].roundsWon ? 0 : 
             fighters[1].roundsWon > fighters[0].roundsWon ? 1 : 'draw';
    if (winner === 'draw') {
      method = "draw";
    }
  } else {
    winner = fighters[0].health.head <= 0 || fighters[0].health.body <= 0 || fighters[0].health.legs <= 0 || fighters[0].isSubmitted ? 1 : 0;
  }

  // Display fight result
  console.log("\n--- Fight Simulation Ends ---\n");
  if (method === "draw") {
    console.log("The fight ends in a draw!");
  } else {
    console.log(`${fighters[winner].name} defeats ${fighters[1-winner].name} by ${method} in round ${roundEnded}!`);
  }

  // Display final fight stats
  displayFightStats(fighters);

  return {
    winner: winner === 'draw' ? null : winner,
    winnerName: winner === 'draw' ? null : fighters[winner].name,
    loserName: winner === 'draw' ? null : fighters[1-winner].name,
    method: method,
    roundEnded: roundEnded,
  };
};

/**
 * Display fight stats at the end of the fight
 * @param {Object[]} fighters - Array of fighter objects
 */
const displayFightStats = (fighters) => {
  console.log("\n=== Final Fight Statistics ===\n");

  // Display detailed stats for each fighter
  fighters.forEach((fighter, index) => {
    console.log(`\n${fighter.name}:`);
    
    // Striking stats
    console.log("Striking:");
    console.log(`  Total Punches Landed: ${fighter.stats.punchesLanded || 0}`);
    console.log(`  Total Kicks Landed: ${fighter.stats.kicksLanded || 0}`);
    console.log("  Strikes by Type:");
    console.log(`    Jabs: ${fighter.stats.jabsLanded || 0}`);
    console.log(`    Crosses: ${fighter.stats.crossesLanded || 0}`);
    console.log(`    Hooks: ${fighter.stats.hooksLanded || 0}`);
    console.log(`    Uppercuts: ${fighter.stats.uppercutsLanded || 0}`);
    console.log(`    Overhands: ${fighter.stats.overhandsLanded || 0}`);
    console.log(`    Spinning Backfists: ${fighter.stats.spinningBackfistsLanded || 0}`);
    console.log(`    Superman Punches: ${fighter.stats.supermanPunchsLanded || 0}`);
    console.log(`    Body Punches: ${fighter.stats.bodyPunchsLanded || 0}`);
    console.log(`    Head Kicks: ${fighter.stats.headKicksLanded || 0}`);
    console.log(`    Body Kicks: ${fighter.stats.bodyKicksLanded || 0}`);
    console.log(`    Leg Kicks: ${fighter.stats.legKicksLanded || 0}`);
    
    // Grappling stats
    console.log("Grappling:");
    console.log(`  Takedowns: ${fighter.stats.takedownsLanded || 0} / ${fighter.stats.takedownsAttempted || 0}`);
    console.log(`  Takedown Accuracy: ${(((fighter.stats.takedownsLanded || 0) / (fighter.stats.takedownsAttempted || 1)) * 100).toFixed(2)}%`);
    console.log(`  Takedowns Defended: ${fighter.stats.takedownsDefended || 0}`);
    console.log(`  Submissions Attempted: ${fighter.stats.submissionsAttempted || 0}`);
    console.log(`  Submissions Landed: ${fighter.stats.submissionsLanded || 0}`);
    
    // Ground stats
    console.log("Ground Game:");
    console.log(`  Ground Strikes Landed: ${fighter.stats.groundPunchsLanded || 0}`);
    
    // Defense stats
    console.log("Defense:");
    console.log(`  Strikes Blocked/Evaded: ${(fighter.stats.punchesBlocked || 0) + (fighter.stats.kicksBlocked || 0)}`);
    
    // Damage stats
    console.log("Damage:");
    console.log(`  Damage Dealt: ${(fighter.maxHealth.head + fighter.maxHealth.body + fighter.maxHealth.legs) - (fighters[1-index].health.head + fighters[1-index].health.body + fighters[1-index].health.legs)}`);
    console.log(`  Damage Absorbed: ${(fighter.maxHealth.head + fighter.maxHealth.body + fighter.maxHealth.legs) - (fighter.health.head + fighter.health.body + fighter.health.legs)}`);
    
    // Final health
    console.log("Final Health:");
    console.log(`  Head: ${fighter.health.head}/${fighter.maxHealth.head}`);
    console.log(`  Body: ${fighter.health.body}/${fighter.maxHealth.body}`);
    console.log(`  Legs: ${fighter.health.legs}/${fighter.maxHealth.legs}`);
  });
};

export {
  simulateFight,
  displayFightStats,
  doKick,
  doPunch,
  doGroundPunch,
  doTakedown,
  doGetUp,
  doSubmission,
  calculateStaminaImpact,
};
