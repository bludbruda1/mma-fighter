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
  punch: 2,
  kick: 5,
  legKick: 2,
  takedownAttempt: 6,
  getUpAttempt: 5,
  groundPunch: 1,
  submission: 8,
  jab: 1,
  cross: 1,
  hook: 2,
  uppercut: 2,
  comboPunch: 1, // every following punch in a combo
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

export { formatTime, simulateTimePassing, actionTimes };
