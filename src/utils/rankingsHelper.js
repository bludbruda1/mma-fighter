/**
 * Handles updating fighter rankings after a fight
 * @param {Object} winner - Winner fighter object
 * @param {Object} loser - Loser fighter object
 * @param {Array} allFighters - Array of all fighters
 * @param {Array} championships - Array of all championships to check for champions
 * @returns {Array} Array of fighters that need their rankings updated
 */
export const updateRankingsAfterFight = (winner, loser, allFighters, championships) => {
    // Don't update rankings if either fighter is a champion
    const isChampion = (fighter) => championships.some(c => c.currentChampionId === fighter.personid);
    if (isChampion(winner) || isChampion(loser)) {
      return [];
    }
  
    // Only update if winner is ranked lower (higher number) than loser or winner is unranked
    if (!winner.ranking || !loser.ranking || winner.ranking > loser.ranking) {
      const winnerOldRank = winner.ranking || 999;
      const loserOldRank = loser.ranking || 999;
      const loserNewRank = winnerOldRank;
      const winnerNewRank = loserOldRank;
  
      // Get all fighters that need rank updates
      const updatedFighters = allFighters
        .filter(f => {
          // Skip champions
          if (isChampion(f)) return false;
          
          // Include fighters whose ranks need to change
          if (f.personid === winner.personid) return true;
          if (f.personid === loser.personid) return true;
          
          return false;
        })
        .map(f => {
          if (f.personid === winner.personid) {
            return { ...f, ranking: winnerNewRank };
          }
          if (f.personid === loser.personid) {
            return { ...f, ranking: loserNewRank };
          }
          return f;
        });
  
      return updatedFighters;
    }
  
    return [];
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