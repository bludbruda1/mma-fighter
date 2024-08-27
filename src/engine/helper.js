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
 * Object containing the base time (in seconds) for each action
 * @type {Object.<string, number>}
 */
const actionTimes = {
  // Punches
  jab: 1,
  cross: 1,
  hook: 2,
  uppercut: 2,
  overhand: 2,
  spinningBackfist: 3,
  supermanPunch: 3,
  bodyPunch: 2,

  // Kicks
  headKick: 3,
  bodyKick: 3,
  legKick: 2,

  // Grappling and clinch
  takedownAttempt: 5,
  getUpAttempt: 4,
  clinchAttempt: 3,
  clinchStrike: 2,
  clinchTakedown: 4,
  clinchExit: 2,

  // Ground actions
  groundPunch: 1,
  submission: 8,

  // Combo actions
  comboPunch: 1 // Additional time for each punch in a combo after the first
};

/**
 * Simulate the passage of time for a given action
 * @param {string} action - The type of action being performed
 * @returns {number} The amount of time that passes, in seconds
 */
function simulateTimePassing(action) {
  const baseTime = actionTimes[action];
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


export { formatTime, simulateTimePassing, actionTimes, isKnockedOut };
