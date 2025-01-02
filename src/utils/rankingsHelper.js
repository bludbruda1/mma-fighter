const DEFAULT_RANKING_SLOTS = 15;

/**
 * Handles updating fighter rankings after a fight
 * @param {Object} winner - Winner fighter object
 * @param {Object} loser - Loser fighter object
 * @param {Array} allFighters - Array of all fighters
 * @param {Array} championships - Array of all championships
 * @returns {Array} Array of fighters that need their rankings updated
 */
export const updateRankingsAfterFight = (winner, loser, allFighters, championships, maxRankings = DEFAULT_RANKING_SLOTS) => {
  // Ensure both fighters are in the same weight class
  if (winner.weightClass !== loser.weightClass) {
    console.warn('Fighters are in different weight classes');
    return [];
  }
  
  // Don't update rankings if either fighter is a champion in their weight class
  const isChampion = (fighter) => championships.some(c => 
    c.currentChampionId === fighter.personid && 
    c.weightClass === fighter.weightClass
  );

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
      originalRanking: f.ranking
    }))
    .sort((a, b) => (a.ranking || 999) - (b.ranking || 999));

  let updatedFighters = new Map();

  // Handle case where winner moves up in rankings
  if (winnerRank > loserRank || winnerRank === 999) {
    // Place winner at loser's rank
    if (loserRank <= maxRankings) {
      // Winner takes loser's spot
      updatedFighters.set(winner.personid, {
        ...winner,
        ranking: loserRank
      });

      // Loser moves to loserRank + 1
      updatedFighters.set(loser.personid, {
        ...loser,
        ranking: loserRank + 1
      });

      // Everyone else between loser and winner shifts down one
      weightClassFighters
        .filter(f => 
          f.ranking && 
          f.ranking > loserRank && 
          f.ranking <= winnerRank &&
          f.personid !== winner.personid &&
          f.personid !== loser.personid
        )
        .forEach(fighter => {
          updatedFighters.set(fighter.personid, {
            ...fighter,
            ranking: fighter.ranking + 1
          });
        });
    }
  }

  // Convert map to array and filter out unchanged rankings
  const changedFighters = Array.from(updatedFighters.values())
    .filter(newFighter => {
      const originalFighter = allFighters.find(f => f.personid === newFighter.personid);
      return originalFighter.ranking !== newFighter.ranking;
    })
    // Ensure no fighter has a ranking beyond maxRankings
    .map(fighter => ({
      ...fighter,
      ranking: fighter.ranking > maxRankings ? null : fighter.ranking
    }));

  // Log changes for debugging
  console.log('Ranking Changes:', {
    weightClass: winner.weightClass,
    maxRankings,
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
export const getRankingDisplay = (fighter, championships, maxRankings = DEFAULT_RANKING_SLOTS) => {
  if (!fighter) return '';

  // Check if fighter is champion in their weight class
  const isChampion = championships.some(c => 
    c.currentChampionId === fighter.personid && 
    c.weightClass === fighter.weightClass
  );
  
  if (isChampion) return 'C';
  
  if (fighter.ranking && fighter.ranking > 0 && fighter.ranking <= maxRankings) {
    return `#${fighter.ranking}`;
  }
  
  return 'NR';
};