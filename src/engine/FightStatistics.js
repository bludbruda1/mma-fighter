const calculateFightStats = (fighter1, fighter2) => {
  return {
    totalStrikes: {
      red: fighter1.stats.totalStrikesLanded,
      blue: fighter2.stats.totalStrikesLanded,
    },
    takedowns: {
      red: fighter1.stats.takedownsSuccessful,
      blue: fighter2.stats.takedownsSuccessful,
    },
    submissionAttempts: {
      red: fighter1.stats.submissionsAttempted,
      blue: fighter2.stats.submissionsAttempted,
    },
    // Add more statistics here
  };
};

/**
 * Calculate statistics for a single round
 * @param {Object} fighter1 - First fighter's stats for the round
 * @param {Object} fighter2 - Second fighter's stats for the round
 * @param {Object} initialStats1 - First fighter's stats at the start of the round
 * @param {Object} initialStats2 - Second fighter's stats at the start of the round
 * @returns {Object} Round statistics
 */
const calculateRoundStats = (
  fighter1,
  fighter2,
  initialStats1,
  initialStats2
) => {
  return {
    punchsThrown: {
      red:
        (fighter1.stats.punchsThrown || 0) -
        (initialStats1.punchsThrown || 0),
      blue:
        (fighter2.stats.punchsThrown || 0) -
        (initialStats2.punchsThrown || 0),
    },
    totalStrikes: {
      red:
        (fighter1.stats.punchsLanded || 0) -
        (initialStats1.punchsLanded || 0) +
        (fighter1.stats.kicksLanded || 0) -
        (initialStats1.kicksLanded || 0),
      blue:
        (fighter2.stats.punchsLanded || 0) -
        (initialStats2.punchsLanded || 0) +
        (fighter2.stats.kicksLanded || 0) -
        (initialStats2.kicksLanded || 0),
    },
    takedowns: {
      red:
        (fighter1.stats.takedownsSuccessful || 0) -
        (initialStats1.takedownsSuccessful || 0),
      blue:
        (fighter2.stats.takedownsSuccessful || 0) -
        (initialStats2.takedownsSuccessful || 0),
    },
    submissionAttempts: {
      red:
        (fighter1.stats.submissionsAttempted || 0) -
        (initialStats1.submissionsAttempted || 0),
      blue:
        (fighter2.stats.submissionsAttempted || 0) -
        (initialStats2.submissionsAttempted || 0),
    },
    // Add more round statistics here as needed
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
    console.log(`  Total Punches Thrown: ${fighter.stats.punchsThrown || 0}`);
    console.log(`  Total Punches Landed: ${fighter.stats.punchsLanded || 0}`);
    console.log(
      `  Punch Accuracy: ${(
        ((fighter.stats.punchsLanded || 0) /
          (fighter.stats.punchsThrown || 1)) *
        100
      ).toFixed(2)}%`
    );
    console.log(`  Total Kicks Thrown: ${fighter.stats.kicksThrown || 0}`);
    console.log(`  Total Kicks Landed: ${fighter.stats.kicksLanded || 0}`);
    console.log(
      `  Kick Accuracy: ${(
        ((fighter.stats.kicksLanded || 0) / (fighter.stats.kicksThrown || 1)) *
        100
      ).toFixed(2)}%`
    );
    console.log("  Strikes by Type:");
    console.log(`    Jabs: ${fighter.stats.jabsLanded || 0}`);
    console.log(`    Crosses: ${fighter.stats.crosssLanded || 0}`);
    console.log(`    Hooks: ${fighter.stats.hooksLanded || 0}`);
    console.log(`    Uppercuts: ${fighter.stats.uppercutsLanded || 0}`);
    console.log(`    Overhands: ${fighter.stats.overhandsLanded || 0}`);
    console.log(
      `    Spinning Backfists: ${fighter.stats.spinningBackfistsLanded || 0}`
    );
    console.log(
      `    Superman Punches: ${fighter.stats.supermanPunchsLanded || 0}`
    );
    console.log(`    Body Punches: ${fighter.stats.bodyPunchsLanded || 0}`);
    console.log(`    Head Kicks: ${fighter.stats.headKicksLanded || 0}`);
    console.log(`    Body Kicks: ${fighter.stats.bodyKicksLanded || 0}`);
    console.log(`    Leg Kicks: ${fighter.stats.legKicksLanded || 0}`);

    // Grappling stats
    console.log("Grappling:");
    console.log(
      `  Takedowns Attempted: ${fighter.stats.takedownsAttempted || 0}`
    );
    console.log(`  Takedowns Landed: ${fighter.stats.takedownsSuccessful || 0}`);
    console.log(
      `  Takedown Accuracy: ${(
        ((fighter.stats.takedownsSuccessful || 0) /
          (fighter.stats.takedownsAttempted || 1)) *
        100
      ).toFixed(2)}%`
    );
    console.log(
      `  Takedowns Defended: ${fighter.stats.takedownsDefended || 0}`
    );
    console.log(`  Clinch Entered: ${fighter.stats.clinchEntered || 0}`);
    console.log(
      `  Clinch Strikes Thrown: ${fighter.stats.clinchStrikesThrown || 0}`
    );
    console.log(
      `  Clinch Strikes Landed: ${fighter.stats.clinchStrikesLanded || 0}`
    );
    console.log(
      `  Clinch Strikes Accuracy: ${(
        ((fighter.stats.clinchStrikesLanded || 0) /
          (fighter.stats.clinchStrikesThrown || 1)) *
        100
      ).toFixed(2)}%`
    );
    console.log(
      `  Clinch Takedowns Attempted: ${
        fighter.stats.clinchTakedownsAttempted || 0
      }`
    );
    console.log(
      `  Clinch Takedowns Landed: ${
        fighter.stats.clinchTakedownsSuccessful || 0
      }`
    );
    console.log(
      `  Clinch Takedown Accuracy: ${(
        ((fighter.stats.clinchTakedownsSuccessful || 0) /
          (fighter.stats.clinchTakedownsAttempted || 1)) *
        100
      ).toFixed(2)}%`
    );
    console.log(
      `  Clinch Takedowns Defended: ${
        fighter.stats.clinchTakedownsDefended || 0
      }`
    );

    // Ground stats
    console.log("Ground Game:");
    console.log(
      `  Ground Strikes Landed: ${fighter.stats.groundPunchsLanded || 0}`
    );
    console.log(
      `  Submissions Attempted: ${fighter.stats.submissionsAttempted || 0}`
    );
    console.log(
      `  Submissions Landed: ${fighter.stats.submissionsLanded || 0}`
    );

    // Defence stats
    console.log("Defence:");
    console.log(
      `  Strikes Blocked/Evaded: ${
        (fighter.stats.punchsBlocked || 0) +
        (fighter.stats.punchsEvaded || 0) +
        (fighter.stats.kicksBlocked || 0) +
        (fighter.stats.kicksEvaded || 0)
      }`
    );
    console.log(
      `  Clinch Strikes Blocked/Evaded: ${
        (fighter.stats.clinchStrikesBlocked || 0) +
        (fighter.stats.clinchStrikesEvaded || 0)
      }`
    );

    // Damage stats
    console.log("Damage:");
    console.log(
      `  Damage Dealt: ${
        fighter.maxHealth.head +
        fighter.maxHealth.body +
        fighter.maxHealth.legs -
        (fighters[1 - index].health.head +
          fighters[1 - index].health.body +
          fighters[1 - index].health.legs)
      }`
    );
    console.log(
      `  Damage Absorbed: ${
        fighter.maxHealth.head +
        fighter.maxHealth.body +
        fighter.maxHealth.legs -
        (fighter.health.head + fighter.health.body + fighter.health.legs)
      }`
    );

    // Final health
    console.log("Final Health:");
    console.log(`  Head: ${fighter.health.head}/${fighter.maxHealth.head}`);
    console.log(`  Body: ${fighter.health.body}/${fighter.maxHealth.body}`);
    console.log(`  Legs: ${fighter.health.legs}/${fighter.maxHealth.legs}`);
  });
};

export { calculateFightStats, calculateRoundStats, displayFightStats };
