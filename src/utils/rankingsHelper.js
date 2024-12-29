// src/utils/rankingsHelper.js

/**
 * Handles updating fighter rankings after a fight
 * @param {Object} winner - Winner fighter object
 * @param {Object} loser - Loser fighter object
 * @param {Array} allFighters - Array of all fighters
 * @param {Array} championships - Array of all championships
 * @returns {Array} Array of fighters that need their rankings updated
 */
export const updateRankingsAfterFight = (winner, loser, allFighters, championships) => {
  // Don't update rankings if either fighter is a champion
  const isChampion = (fighter) => championships.some(c => c.currentChampionId === fighter.personid);
  if (isChampion(winner) || isChampion(loser)) {
    return [];
  }

  // Get current rankings or default to unranked (999)
  const winnerRank = winner.ranking || 999;
  const loserRank = loser.ranking || 999;

  // If both fighters are unranked, no ranking changes needed
  if (winnerRank === 999 && loserRank === 999) {
    return [];
  }

  // Get all fighters in the same weight class, sorted by rank
  let weightClassFighters = allFighters
    .filter(f => f.weightClass === winner.weightClass && !isChampion(f))
    .map(f => ({
      ...f,
      originalRanking: f.ranking // Keep track of original ranking
    }))
    .sort((a, b) => (a.ranking || 999) - (b.ranking || 999));

  // Initialize array for updated rankings
  let updatedFighters = [];

  // Handle case where winner moves up in rankings
  if (winnerRank > loserRank || winnerRank === 999) {
    let currentRank = 1;

    // Process each ranking position
    while (currentRank <= 10) {
      if (currentRank === loserRank) {
        // Place winner at loser's rank
        updatedFighters.push({
          ...winner,
          ranking: currentRank
        });

        // Move loser and everyone else down
        weightClassFighters
          .filter(f => 
            (f.ranking && f.ranking >= loserRank && f.personid !== winner.personid) || 
            f.personid === loser.personid
          )
          .forEach(fighter => {
            if (currentRank < 10) {
              updatedFighters.push({
                ...fighter,
                ranking: currentRank + 1
              });
            } else {
              // If we're at rank 10, any remaining fighters become unranked
              updatedFighters.push({
                ...fighter,
                ranking: null
              });
            }
            currentRank++;
          });

        break;
      } else {
        // Keep existing fighter at their rank
        const existingFighter = weightClassFighters.find(f => f.ranking === currentRank);
        if (existingFighter && existingFighter.personid !== winner.personid) {
          updatedFighters.push({
            ...existingFighter,
            ranking: currentRank
          });
        }
      }
      currentRank++;
    }
  }

  // Filter out unchanged rankings and ensure no duplicates
  const changedFighters = updatedFighters.filter(newFighter => {
    const originalFighter = allFighters.find(f => f.personid === newFighter.personid);
    return originalFighter.ranking !== newFighter.ranking;
  });

  // Log the changes for debugging
  console.log('Ranking Changes:', {
    winner: {
      name: `${winner.firstname} ${winner.lastname}`,
      oldRank: winnerRank,
      newRank: changedFighters.find(f => f.personid === winner.personid)?.ranking
    },
    loser: {
      name: `${loser.firstname} ${loser.lastname}`,
      oldRank: loserRank,
      newRank: changedFighters.find(f => f.personid === loser.personid)?.ranking
    },
    changedFighters: changedFighters.map(f => ({
      name: `${f.firstname} ${f.lastname}`,
      oldRank: allFighters.find(of => of.personid === f.personid)?.ranking,
      newRank: f.ranking
    }))
  });

  return changedFighters;
};

/**
 * Get display text for a fighter's ranking
 * @param {Object} fighter - Fighter object
 * @param {Array} championships - Array of all championships
 * @returns {string} Formatted ranking display text
 */
export const getRankingDisplay = (fighter, championships) => {
  if (!fighter) return '';
  
  // Check if fighter is a champion
  const isChampion = championships.some(c => c.currentChampionId === fighter.personid);
  if (isChampion) return 'C';
  
  // Return ranking if it exists and is within valid range
  if (fighter.ranking && fighter.ranking > 0 && fighter.ranking <= 10) {
    return `#${fighter.ranking}`;
  }
  
  return 'NR'; // Not Ranked
};