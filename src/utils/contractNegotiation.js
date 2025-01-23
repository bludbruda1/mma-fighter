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
  
    return validateContractValues({
      ...originalOffer,
      amount: counterBase,
      fightsRequested: Math.min(4, originalOffer.fightsOffered), // Champions and top fighters prefer shorter contracts
      signingBonus: 0,  // Remove signing bonus for now
      bonuses: {
        winBonus: counterWin
      }
    });
  };
  
 /**
 * Validate and normalize contract values to ensure they meet minimum requirements
 * @param {Object} contract - Contract to validate
 * @param {boolean} isInitialising - Whether this is initial contract creation
 * @returns {Object} Validated contract
 */
export const validateContractValues = (contract, isInitialising = false) => {
    // If initializing, don't enforce minimum values
    if (isInitialising) {
      return {
        ...contract,
        company: 'UFC',
        amount: 0,
        fightsOffered: Math.max(1, contract.fightsOffered), // Only enforce minimum fights
        fightsRem: Math.max(1, contract.fightsOffered),
        signingBonus: 0,
        bonuses: {
          winBonus: 0,
        }
      };
    }
  
    // Normal validation for actual offers
    return {
      ...contract,
      company: 'UFC',
      amount: Math.max(0, contract.amount),
      fightsOffered: Math.max(1, contract.fightsOffered),
      fightsRem: Math.max(1, contract.fightsOffered),
      signingBonus: Math.max(0, contract.signingBonus),
      bonuses: {
        winBonus: contract.amount >= 25000 ? 
          Math.max(0, contract.bonuses.winBonus) : 
          Math.max(12000, contract.bonuses.winBonus),
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
  export const createInitialOffer = () => {
    return validateContractValues({
      company: 'UFC',
      amount: 0,
      fightsOffered: 1,
      type: 'exclusive',
      signingBonus: 0,
      bonuses: {
        winBonus: 0,
      }
    }, true); // Pass true to indicate initialization
  };