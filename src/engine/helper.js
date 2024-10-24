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
  jab: { timeRange: [2,3], staminaImpact: 0.3 },
  cross: { timeRange: [2,3], staminaImpact: 0.6 },
  hook: { timeRange: [3,4], staminaImpact: 0.8 },
  uppercut: { timeRange: [3,4], staminaImpact: 0.8 },
  overhand: { timeRange: [3,4], staminaImpact: 1.0 },
  spinningBackfist: { timeRange: [3,5], staminaImpact: 1.2 },
  supermanPunch: { timeRange: [3,5], staminaImpact: 1.2 },
  bodyPunch: { timeRange: [2,3], staminaImpact: 0.5 },

  // Kicks
  headKick: { timeRange: [4,6], staminaImpact: 3.5 },
  bodyKick: { timeRange: [4,6], staminaImpact: 3.0 },
  legKick: { timeRange: [2,4], staminaImpact: 2.0 },

  // Grappling
  singleLegTakedown: { timeRange: [5,8], staminaImpact: 4.0 },
  doubleLegTakedown: { timeRange: [6,9], staminaImpact: 4.5 },
  tripTakedown: { timeRange: [4,7], staminaImpact: 3.0 },
  throwTakedown: { timeRange: [5,8], staminaImpact: 4.0 },
  sprawl: { timeRange: [3, 6], staminaImpact: 3.0 },
  getUpAttempt: { timeRange: [5,10], staminaImpact: 3.5 },

  // Clinch
  clinchAttempt: { timeRange: [2,4], staminaImpact: 2.0 },
  clinchStrike: { timeRange: [2,3], staminaImpact: 1.0 },
  clinchTakedown: { timeRange: [5,10], staminaImpact: 4.0 },
  clinchExit: { timeRange: [2,4], staminaImpact: 2.0 },

  // Ground actions
  groundPunch: { timeRange: [1,2], staminaImpact: 0.5 },
  groundElbow: { timeRange: [1,2], staminaImpact: 0.5 },
  submission: { timeRange: [5,14], staminaImpact: 5.0 },
  rearNakedChoke: { timeRange: [3,10], staminaImpact: 5.0 }, 
  triangleChoke: { timeRange: [3,10], staminaImpact: 5.0 }, 
  guillotine: { timeRange: [3,10], staminaImpact: 5.0 }, 
  armbar: { timeRange: [3,10], staminaImpact: 5.0 }, 
  postureUp: { timeRange: [3,6], staminaImpact: 2.5 },
  pullIntoGuard: { timeRange: [3,6], staminaImpact: 2.5 },
  positionAdvance: { timeRange: [6,10], staminaImpact: 3.0 },
  sweep: { timeRange: [6,10], staminaImpact: 4.0 },
  escape: { timeRange: [4,8], staminaImpact: 3.5 },

  // Combo actions
  comboPunch: { timeRange: [1,2], staminaImpact: null }, // Additional time and stamina for each punch in a combo after the first

  // Other actions
  wait: { timeRange: [3,9], staminaImpact: -2.0 }, // Negative stamina impact means recovery
  seekFinish: { timeRange: [1,3], staminaImpact: null}, // fighter trying to finish the fight off
  fightStart: { timeRange: [2,15], staminaImpact: 0 } // no stamina impact
};

// Factors affecting stamina recovery
const STAMINA_FACTORS = {
  // Base recovery rate per second when actively resting (e.g., circling)
  BASE_RECOVERY_RATE: 0.2,
  
  // Recovery multiplier between rounds
  ROUND_BREAK_RECOVERY: 0.15, // Recover 15% of missing stamina between rounds
  
  // Damage impact on stamina
  BODY_DAMAGE_FACTOR: 0.05, // Each point of body damage reduces stamina by 5%
    
  // Cardio rating impact
  CARDIO_MODIFIER_MIN: 0.7, // Worst case for low cardio
  CARDIO_MODIFIER_MAX: 1.3, // Best case for high cardio
  
  // Progressive fatigue
  FATIGUE_ACCUMULATION: 0.005, // Each action becomes 0.5% more tiring as fight progresses
  
  // Combo multipliers
  COMBO_STAMINA_MULTIPLIER: 1.05, // Each subsequent strike in a combo costs 5% more stamina
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
  if (['punch', 'kick', 'groundStrike', 'clinchStrike'].includes(actionType)) {
    attacker.stats.totalStrikesAttempted = (attacker.stats.totalStrikesAttempted || 0) + 1;
    if (outcome === 'landed') {
      attacker.stats.totalStrikesLanded = (attacker.stats.totalStrikesLanded || 0) + 1;
    }
  }
};

export { 
  formatTime, 
  simulateTimePassing, 
  actionProperties, 
  STAMINA_FACTORS, 
  isKnockedOut, 
  updateFightStats 
};