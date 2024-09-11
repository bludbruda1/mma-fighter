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
 * Object containing the base time (in seconds) and stamina impact for each action
 * @type {Object.<string, {time: number, staminaImpact: number}>}
 */
const actionProperties = {
  // Punches
  jab: { time: 2, staminaImpact: 1 },
  cross: { time: 2, staminaImpact: 2 },
  hook: { time: 3, staminaImpact: 3 },
  uppercut: { time: 3, staminaImpact: 3 },
  overhand: { time: 3, staminaImpact: 4 },
  spinningBackfist: { time: 4, staminaImpact: 5 },
  supermanPunch: { time: 4, staminaImpact: 5 },
  bodyPunch: { time: 2, staminaImpact: 2 },

  // Kicks
  headKick: { time: 4, staminaImpact: 6 },
  bodyKick: { time: 4, staminaImpact: 5 },
  legKick: { time: 3, staminaImpact: 4 },

  // Grappling and clinch
  takedownAttempt: { time: 8, staminaImpact: 7 },
  getUpAttempt: { time: 6, staminaImpact: 5 },
  clinchAttempt: { time: 3, staminaImpact: 4 },
  clinchStrike: { time: 2, staminaImpact: 3 },
  clinchTakedown: { time: 7, staminaImpact: 6 },
  clinchExit: { time: 2, staminaImpact: 3 },

  // Ground actions
  groundPunch: { time: 2, staminaImpact: 2 },
  submission: { time: 10, staminaImpact: 10 },
  positionAdvance: { time: 6, staminaImpact: 5 },
  sweep: { time: 6, staminaImpact: 7 },
  escape: { time: 6, staminaImpact: 6 },

  // Combo actions
  comboPunch: { time: 1, staminaImpact: null }, // Additional time and stamina for each punch in a combo after the first

  // Other actions
  wait: { time: 5, staminaImpact: -2 }, // Negative stamina impact means recovery
  seekFinish: {time: 2, staminaImpact: 15} // fighter trying to finish the fight off

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
  const baseTime = actionProperties[action].time;
  // Add some slight randomness (0.5 seconds either way)
  return Math.round(baseTime + (Math.random() - 0.5));
}

/**
 * Check if a fighter is knocked out (any body part has reached 0 health)
 * @param {Object} fighter - The fighter object to check
 * @returns {boolean} True if the fighter is knocked out, false otherwise
 */
const isKnockedOut = (fighter) => {
  return Object.values(fighter.health).some(health => health <= 0);
};


export { formatTime, simulateTimePassing, actionProperties, isKnockedOut, calculateStaminaChange, recoverStaminaEndRound };
