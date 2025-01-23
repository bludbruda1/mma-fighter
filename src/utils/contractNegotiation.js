// Minimum contract values based on UFC's real minimums as of 2024 
const CONTRACT_MINIMUMS = {
    BASE_PURSE: 12000,
    WIN_BONUS: 12000,
    RANKED_BASE: 45000,    // Minimum for ranked fighters
    CHAMP_BASE: 500000,    // Minimum for champions
    EX_CHAMP_BASE: 150000  // Minimum for former champions
  };
  
/**
 * Calculate a fighter's negotiation power on a scale of 0-100
 * Uses existing fighter attributes to determine their leverage
 * @param {Object} fighter - Fighter object
 * @param {Array} championships - Array of championship objects
 * @returns {number} Negotiation power (0-100)
 */
export const calculateNegotiationPower = (fighter, championships) => {
    let power = 0;
  
    // Base power from ranking (0-30 points)
    if (fighter.ranking) {
      power += Math.max(0, 30 - ((fighter.ranking - 1) * 2));
    } else {
      power += 5; // Unranked baseline
    }
  
    // Championship status (0-35 points)
    const isCurrentChamp = championships.some(c => c.currentChampionId === fighter.personid);
    const isFormerChamp = championships.some(c => 
      c.reigns?.some(reign => reign.championId === fighter.personid && reign.endDate)
    );
  
    if (isCurrentChamp) {
      power += 35;
    } else if (isFormerChamp) {
      power += 25;
    }
  
    // Win record impact (0-20 points)
    const totalFights = fighter.wins + fighter.losses;
    const winRate = totalFights > 0 ? (fighter.wins / totalFights) * 100 : 0;
    power += Math.min(20, winRate / 5);
  
    // Fighting skill impact (0-15 points)
    const avgRating = (
      fighter.Rating.output +
      fighter.Rating.strength +
      fighter.Rating.speed +
      fighter.Rating.striking +
      fighter.Rating.takedownOffence
    ) / 5;
    power += Math.min(15, avgRating / 10);
  
    // Clamp between 0-100
    return Math.min(100, Math.max(0, power));
  };
  
  /**
 * Generate a counter offer based on the fighter's negotiation power
 * @param {Object} originalOffer - Initial contract offer
 * @param {number} negotiationPower - Fighter's calculated negotiation power
 * @returns {Object} Counter offer contract
 */
export const generateCounterOffer = (originalOffer, negotiationPower) => {
    // Calculate increase percentage based on negotiation power
    const increasePercentage = (negotiationPower / 100) * 50; // Up to 50% increase
    
    // Ensure minimum base amount
    const baseAmount = Math.max(CONTRACT_MINIMUMS.BASE_PURSE, originalOffer.amount);
    const counterAmount = Math.round(baseAmount * (1 + (increasePercentage / 100)));
  
    // Generate counter offer
    return validateContractValues({
      ...originalOffer,
      amount: counterAmount,
      signingBonus: negotiationPower > 70 ? Math.round(counterAmount * 0.2) : 0,
      fightsRequested: negotiationPower > 80 ? 2 : 
                       negotiationPower > 60 ? 3 : 
                       Math.min(4, originalOffer.fightsOffered),
      bonuses: {
        winBonus: Math.max(CONTRACT_MINIMUMS.WIN_BONUS, Math.round(counterAmount * 0.8)),
        finishBonus: Math.round(counterAmount * 0.25),
        performanceBonus: Math.round(counterAmount * 0.2)
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
 * Determines whether a fighter will accept an offer based on their negotiation power
 * @param {Object} offer - Proposed contract
 * @param {Object} counterOffer - Fighter's counter offer
 * @param {number} negotiationPower - Fighter's negotiation power
 * @returns {boolean} Whether the fighter accepts the offer
 */
export const willFighterAcceptOffer = (offer, counterOffer, negotiationPower) => {
    // Calculate total potential earnings per fight
    const offerTotal = offer.amount + 
      (offer.bonuses?.winBonus || 0) + 
      (offer.bonuses?.finishBonus || 0) + 
      (offer.bonuses?.performanceBonus || 0);
      
    const counterTotal = counterOffer.amount + 
      (counterOffer.bonuses?.winBonus || 0) + 
      (counterOffer.bonuses?.finishBonus || 0) + 
      (counterOffer.bonuses?.performanceBonus || 0);
  
    // Higher negotiation power means fighter is pickier
    const acceptanceThreshold = 90 - (negotiationPower / 2);
    
    // Calculate how close the offer is to the counter offer as a percentage
    const offerQuality = (offerTotal / counterTotal) * 100;
  
    return offerQuality >= acceptanceThreshold;
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