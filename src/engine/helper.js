/**
 * Convert seconds to M:SS format
 * @param {number} seconds - Total number of seconds
 * @returns {string} Formatted time string in M:SS format
 */
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

/**
 * Object containing the base time range (in seconds) and stamina impact for each action
 * @type {Object.<string, {timeRange: [number, number], staminaImpact: number}>}
 */
const actionProperties = {
  // Punches
  jab: { timeRange: [2,3], staminaImpact: 1 },
  cross: { timeRange: [2,3], staminaImpact: 2 },
  hook: { timeRange: [3,4], staminaImpact: 3 },
  uppercut: { timeRange: [3,4], staminaImpact: 3 },
  overhand: { timeRange: [3,4], staminaImpact: 4 },
  spinningBackfist: { timeRange: [3,5], staminaImpact: 5 },
  supermanPunch: { timeRange: [3,5], staminaImpact: 5 },
  bodyPunch: { timeRange: [2,3], staminaImpact: 2 },

  // Kicks
  headKick: { timeRange: [4,6], staminaImpact: 6 },
  bodyKick: { timeRange: [4,6], staminaImpact: 5 },
  legKick: { timeRange: [2,4], staminaImpact: 3 },

  // Grappling and clinch
  takedownAttempt: { timeRange: [7,10], staminaImpact: 7 },
  getUpAttempt: { timeRange: [5,10], staminaImpact: 5 },
  clinchAttempt: { timeRange: [2,4], staminaImpact: 4 },
  clinchStrike: { timeRange: [2,3], staminaImpact: 3 },
  clinchTakedown: { timeRange: [5,10], staminaImpact: 6 },
  clinchExit: { timeRange: [2,4], staminaImpact: 3 },

  // Ground actions
  groundPunch: { timeRange: [1,2], staminaImpact: 2 },
  submission: { timeRange: [7,14], staminaImpact: 10 },
  positionAdvance: { timeRange: [6,10], staminaImpact: 5 },
  sweep: { timeRange: [6,10], staminaImpact: 7 },
  escape: { timeRange: [4,8], staminaImpact: 6 },

  // Combo actions
  comboPunch: { timeRange: [1,2], staminaImpact: null }, // Additional time and stamina for each punch in a combo after the first

  // Other actions
  wait: { timeRange: [3,9], staminaImpact: -2 }, // Negative stamina impact means recovery
  seekFinish: { timeRange: [1,3], staminaImpact: 15}, // fighter trying to finish the fight off
  fightStart: { timeRange: [2,15], staminaImpact: 0 } // no stamina impact
};

/**
 * Calculate stamina change for a given action
 * @param {string} action - The type of action being performed
 * @param {number} cardio - Cardio rating of the fighter
 * @returns {number} The amount of stamina to be reduced
 */
const calculateStaminaChange = (action, cardio) => {
  const baseStaminaImpact = actionProperties[action].staminaImpact;
  const cardioFactor = 1 - (cardio - 50) / 200; // Cardio rating effect (50 is considered average)
  return baseStaminaImpact * cardioFactor;
};

/**
 * Recover stamina at the end of a round
 * @param {number} currentStamina - Current stamina of the fighter
 * @param {number} cardio - Cardio rating of the fighter
 * @returns {number} The amount of stamina recovered
 */
const recoverStaminaEndRound = (currentStamina, cardio) => {
  const baseRecovery = 20;
  const cardioFactor = 1 + (cardio - 50) / 100; // Cardio rating effect (50 is considered average)
  const recovery = baseRecovery * cardioFactor;
  return Math.min(100, currentStamina + recovery);
};

/**
 * Simulate the passage of time for a given action
 * @param {string} action - The type of action being performed
 * @returns {number} The amount of time that passes, in seconds
 */
function simulateTimePassing(action) {
  const { timeRange } = actionProperties[action];
  const [minTime, maxTime] = timeRange;

  // Calculate a random time within the range
  const randomTime = minTime + Math.random() * (maxTime - minTime);
  
  // Round to the nearest second
  return Math.round(randomTime);
}

/**
 * Check if a fighter is knocked out (any body part has reached 0 health)
 * @param {Object} fighter - The fighter object to check
 * @returns {boolean} True if the fighter is knocked out, false otherwise
 */
const isKnockedOut = (fighter) => {
  return Object.values(fighter.health).some(health => health <= 0);
};

/**
 * Update fight statistics for both fighters
 * @param {Object} attacker - The attacking fighter
 * @param {Object} defender - The defending fighter
 * @param {string} actionType - The type of action (e.g., 'punch', 'takedown', 'submission')
 * @param {string} specificAction - The specific action (e.g., 'jab', 'singleLegTakedown', 'armbar')
 * @param {string} outcome - The outcome of the action ('landed', 'blocked', 'evaded', 'missed', 'defended', 'attempted', 'successful')
 */
const updateFightStats = (attacker, defender, actionType, specificAction, outcome) => {

  // Update outcome-specific stats
  switch (outcome) {
    case 'landed':
      attacker.stats[`${(actionType)}sThrown`] = (attacker.stats[`${(actionType)}sThrown`] || 0) + 1;
      attacker.stats[`${(specificAction)}sThrown`] = (attacker.stats[`${(specificAction)}sThrown`] || 0) + 1;
      attacker.stats[`${(actionType)}sLanded`] = (attacker.stats[`${(actionType)}sLanded`] || 0) + 1;
      attacker.stats[`${(specificAction)}sLanded`] = (attacker.stats[`${(specificAction)}sLanded`] || 0) + 1;
      break;
    case 'blocked':
      attacker.stats[`${(actionType)}sThrown`] = (attacker.stats[`${(actionType)}sThrown`] || 0) + 1;
      attacker.stats[`${(specificAction)}sThrown`] = (attacker.stats[`${(specificAction)}sThrown`] || 0) + 1;
      defender.stats[`${(actionType)}sBlocked`] = (defender.stats[`${(actionType)}sBlocked`] || 0) + 1;
      defender.stats[`${(specificAction)}sBlocked`] = (defender.stats[`${(specificAction)}sBlocked`] || 0) + 1;
      break;
    case 'evaded':
      attacker.stats[`${(actionType)}sThrown`] = (attacker.stats[`${(actionType)}sThrown`] || 0) + 1;
      attacker.stats[`${(specificAction)}sThrown`] = (attacker.stats[`${(specificAction)}sThrown`] || 0) + 1;
      defender.stats[`${(actionType)}sEvaded`] = (attacker.stats[`${(actionType)}sEvaded`] || 0) + 1;
      defender.stats[`${(specificAction)}sEvaded`] = (attacker.stats[`${(specificAction)}sEvaded`] || 0) + 1;
      break;
    case 'missed':
      attacker.stats[`${(actionType)}sThrown`] = (attacker.stats[`${(actionType)}sThrown`] || 0) + 1;
      attacker.stats[`${(specificAction)}sThrown`] = (attacker.stats[`${(specificAction)}sThrown`] || 0) + 1;
      attacker.stats[`${(actionType)}sMissed`] = (attacker.stats[`${(actionType)}sMissed`] || 0) + 1;
      attacker.stats[`${(specificAction)}sMissed`] = (attacker.stats[`${(specificAction)}sMissed`] || 0) + 1;
      break;
    case 'defended':
      attacker.stats[`${(actionType)}sAttempted`] = (attacker.stats[`${(actionType)}sAttempted`] || 0) + 1;
      attacker.stats[`${(specificAction)}sAttempted`] = (attacker.stats[`${(specificAction)}sAttempted`] || 0) + 1;
      defender.stats[`${(actionType)}sDefended`] = (defender.stats[`${(actionType)}sDefended`] || 0) + 1;
      defender.stats[`${(specificAction)}sDefended`] = (defender.stats[`${(specificAction)}sDefended`] || 0) + 1;
      break;
    case 'successful':
      attacker.stats[`${(actionType)}sAttempted`] = (attacker.stats[`${(actionType)}sAttempted`] || 0) + 1;
      attacker.stats[`${(specificAction)}sAttempted`] = (attacker.stats[`${(specificAction)}sAttempted`] || 0) + 1;
      attacker.stats[`${(actionType)}sSuccessful`] = (attacker.stats[`${(actionType)}sSuccessful`] || 0) + 1;
      attacker.stats[`${(specificAction)}sSuccessful`] = (attacker.stats[`${(specificAction)}sSuccessful`] || 0) + 1;
      break;
    default:
      console.warn(`Unknown action outcome: ${outcome}`);
  }

  // If it's a strike, update the total strikes stats
  if (['punch', 'kick', 'groundPunch', 'clinchStrike'].includes(actionType)) {
    attacker.stats.totalStrikesAttempted = (attacker.stats.totalStrikesAttempted || 0) + 1;
    if (outcome === 'landed') {
      attacker.stats.totalStrikesLanded = (attacker.stats.totalStrikesLanded || 0) + 1;
    }
  }
};

export { formatTime, simulateTimePassing, actionProperties, isKnockedOut, calculateStaminaChange, recoverStaminaEndRound, updateFightStats };
