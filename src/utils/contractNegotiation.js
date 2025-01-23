const CONTRACT_MINIMUMS = {
    BASE_PURSE: 12000,
    WIN_BONUS: 12000,
    RANKED_BASE: 45000,    // Minimum for ranked fighters
    CHAMP_BASE: 500000,    // Minimum for champions
    EX_CHAMP_BASE: 150000  // Minimum for former champions
  };

/**
 * Calculate a fighter's minimum acceptable contract value
 * @param {Object} fighter - Fighter object
 * @param {Array} championships - Array of championship objects
 * @param {Array} fights - Array of all fights (for checking recent performance)
 * @returns {Object} Minimum contract values and multipliers
 */
export const calculateMinimumContract = (fighter, championships, fights) => {
    // Base minimum contract values
    const BASE_MINIMUMS = {
      champion: { base: 250000, win: 250000 },
      topFive: { base: 100000, win: 100000 },
      topTen: { base: 50000, win: 50000 },
      ranked: { base: 25000, win: 25000 },
      unranked: { base: 12000, win: 12000 }
    };
  
    // Determine fighter's status
    const isChampion = championships.some(c => c.currentChampionId === fighter.personid);
    const ranking = fighter.ranking || 999;
  
    // Get base minimum contract based on status
    let minContract;
    if (isChampion) {
      minContract = BASE_MINIMUMS.champion;
    } else if (ranking <= 5) {
      minContract = BASE_MINIMUMS.topFive;
    } else if (ranking <= 10) {
      minContract = BASE_MINIMUMS.topTen;
    } else if (ranking <= 15) {
      minContract = BASE_MINIMUMS.ranked;
    } else {
      minContract = BASE_MINIMUMS.unranked;
    }
  
    // Calculate performance multiplier based on recent fights
    const recentFights = fights
      .filter(f => 
        (f.fighter1.personid === fighter.personid || f.fighter2.personid === fighter.personid) &&
        f.result // Only include completed fights
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3); // Get last 3 fights
  
    let performanceMultiplier = 1;
    
    if (recentFights.length > 0) {
      // Calculate win and finish rates
      let wins = 0;
      let finishes = 0;
  
      recentFights.forEach(fight => {
        const isFighter1 = fight.fighter1.personid === fighter.personid;
        const isWinner = fight.result.winner === (isFighter1 ? 0 : 1);
        
        if (isWinner) {
          wins++;
          if (fight.result.method === 'Knockout' || fight.result.method === 'Submission') {
            finishes++;
          }
        }
      });
  
      // Increase multiplier based on performance
      if (wins === 3) performanceMultiplier += 0.5; // Win streak bonus
      if (finishes >= 2) performanceMultiplier += 0.3; // Finishing bonus
      else if (finishes === 1) performanceMultiplier += 0.15;
    }
  
    return {
      minBase: minContract.base * performanceMultiplier,
      minWin: minContract.win * performanceMultiplier,
    };
  };
  
 /**
 * Generate a counter offer based on fighter's status and performance
 * @param {Object} originalOffer - Original contract offer
 * @param {Object} fighter - Fighter object
 * @param {Array} championships - Array of championship objects
 * @param {Array} fights - Array of fights
 * @returns {Object} Counter offer contract
 */
export const generateCounterOffer = (originalOffer, fighter, championships, fights) => {
    const { minBase, minWin } = calculateMinimumContract(fighter, championships, fights);
  
    // Add 20% to minimum values for counter offer
    const counterBase = Math.round(minBase * 1.2);
    const counterWin = Math.round(minWin * 1.2);
  
    // Generate finish and performance bonuses based on status
    const finishBonus = fighter.ranking ? Math.round(counterBase * 0.5) : 0;
    const performanceBonus = fighter.ranking ? Math.round(counterBase * 0.25) : 0;
  
    return validateContractValues({
      ...originalOffer,
      amount: counterBase,
      fightsRequested: Math.min(4, originalOffer.fightsOffered), // Champions and top fighters prefer shorter contracts
      signingBonus: fighter.ranking <= 5 ? Math.round(counterBase * 0.2) : 0,
      bonuses: {
        winBonus: counterWin,
        finishBonus: finishBonus,
        performanceBonus: performanceBonus
      }
    });
  };
  
  /**
 * Validate and normalize contract values to ensure they meet minimum requirements
 * @param {Object} contract - Contract to validate
 * @returns {Object} Validated contract
 */
export const validateContractValues = (contract) => {
    // Ensure win bonus meets minimum for lower-paid fighters
    const winBonus = contract.amount >= 25000 ? 
      (contract.bonuses?.winBonus || 0) : 
      Math.max(CONTRACT_MINIMUMS.WIN_BONUS, contract.bonuses?.winBonus || 0);
  
    return {
      ...contract,
      amount: Math.max(CONTRACT_MINIMUMS.BASE_PURSE, contract.amount),
      fightsOffered: Math.max(1, Math.min(8, contract.fightsOffered)),
      fightsRem: Math.max(1, contract.fightsOffered),
      signingBonus: Math.max(0, contract.signingBonus || 0),
      bonuses: {
        winBonus,
        finishBonus: Math.max(0, contract.bonuses?.finishBonus || 0),
        performanceBonus: Math.max(0, contract.bonuses?.performanceBonus || 0)
      }
    };
  };
  
  
 /**
 * Determines whether a fighter will accept an offer
 * @param {Object} offer - Contract offer
 * @param {Object} fighter - Fighter object
 * @param {Array} championships - Array of championship objects
 * @param {Array} fights - Array of fights
 * @returns {boolean} Whether the offer is acceptable
 */
export const willFighterAcceptOffer = (offer, fighter, championships, fights) => {
    const { minBase, minWin } = calculateMinimumContract(fighter, championships, fights);
  
    // Allow either pure base pay or base+win bonus structure
    if (offer.amount >= (minBase + minWin)) {
      return true; // Accept if total base pay meets minimum total
    }
  
    if (offer.amount >= minBase && offer.bonuses.winBonus >= minWin) {
      return true; // Accept if base and win bonus each meet minimums
    }
  
    return false;
  };
  
  
  
  /**
 * Creates an initial contract offer based on fighter's current contract or minimum values
 * @param {Object} fighter - Fighter object
 * @returns {Object} Initial contract offer
 */
export const createInitialOffer = (fighter) => {
  // Determine base amount considering ranking and championship status
  let baseAmount = fighter.contract?.amount || CONTRACT_MINIMUMS.BASE_PURSE;
  
  if (fighter.ranking) {
    baseAmount = Math.max(CONTRACT_MINIMUMS.RANKED_BASE, baseAmount);
  }

  return validateContractValues({
    amount: baseAmount,
    fightsOffered: 4,
    type: 'exclusive',
    signingBonus: 0,
    bonuses: {
      winBonus: fighter.contract?.amount >= 25000 ? 
        (fighter.contract?.bonuses?.winBonus || baseAmount) : 
        CONTRACT_MINIMUMS.WIN_BONUS,
      finishBonus: fighter.contract?.bonuses?.finishBonus || Math.round(baseAmount * 0.2),
      performanceBonus: fighter.contract?.bonuses?.performanceBonus || Math.round(baseAmount * 0.15)
    }
  });
};