/**
 * Calculate a fighter's negotiation power on a scale of 0-100
 * Based on ranking, championship status, and win rate
 */
export const calculateNegotiationPower = (fighter, championships) => {
    // Base power from ranking
    let power = fighter.ranking ? (100 - fighter.ranking) : 30;
    
    // Bonus for champions
    if (championships.some(c => c.currentChampionId === fighter.personid)) {
      power += 30;
    }
    
    // Bonus for win streak and record
    const winPercentage = (fighter.wins / (fighter.wins + fighter.losses)) * 100;
    power += (winPercentage / 5); // Up to 20 points for 100% win rate
    
    // Clamp between 0-100
    return Math.min(100, Math.max(0, power));
  };
  
  /**
   * Generate a counter offer based on the fighter's negotiation power
   */
  export const generateCounterOffer = (originalOffer, negotiationPower) => {
    const increasePercentage = (negotiationPower / 100) * 50; // Up to 50% increase
    const baseAmount = Math.max(12000, originalOffer.amount);
    const counterAmount = Math.round(baseAmount * (1 + (increasePercentage / 100)));
    
    return validateContractValues({
      ...originalOffer,
      amount: counterAmount,
      signingBonus: negotiationPower > 70 ? Math.round(counterAmount * 0.1) : 0,
      bonuses: {
        winBonus: counterAmount >= 25000 ? Math.round(counterAmount * 0.2) : 12000,
        finishBonus: Math.round(counterAmount * 0.3),
        performanceBonus: Math.round(counterAmount * 0.25)
      },
      fightsRequested: negotiationPower > 50 ? 
        Math.max(1, Math.min(3, originalOffer.fightsOffered)) : 
        Math.max(1, Math.min(4, originalOffer.fightsOffered))
    });
  };
  
  /**
   * Validate and normalize contract values to ensure they meet minimum requirements
   */
  export const validateContractValues = (contract) => {
    return {
      ...contract,
      company: 'UFC', // Force UFC as company for now
      amount: Math.max(0, contract.amount),
      fightsOffered: Math.max(1, contract.fightsOffered), // Minimum 1 fight
      fightsRem: Math.max(1, contract.fightsOffered), // Set remaining fights equal to offered fights
      signingBonus: Math.max(0, contract.signingBonus),
      bonuses: {
        winBonus: contract.amount >= 25000 ? 
          Math.max(0, contract.bonuses.winBonus) : 
          Math.max(12000, contract.bonuses.winBonus),
        finishBonus: Math.max(0, contract.bonuses.finishBonus),
        performanceBonus: Math.max(0, contract.bonuses.performanceBonus)
      }
    };
  };
  
  /**
   * Determines whether a fighter will accept an offer based on their negotiation power
   */
  export const willFighterAcceptOffer = (offer, counterOffer, negotiationPower) => {
    const offerQuality = (offer.amount / counterOffer.amount) * 100;
    const acceptanceThreshold = 90 - (negotiationPower / 2); // Higher power fighters are harder to please
    return offerQuality >= acceptanceThreshold;
  };
  
  /**
   * Creates an initial contract offer based on fighter's current contract or minimum values
   */
  export const createInitialOffer = (fighter) => {
    return validateContractValues({
      company: 'UFC',
      amount: fighter.contract?.amount || 12000,
      fightsOffered: 4,
      type: fighter.contract?.type || 'exclusive',
      signingBonus: 0,
      bonuses: {
        winBonus: fighter.contract?.amount >= 25000 ? 
          (fighter.contract?.bonuses?.winBonus || 0) : 12000,
        finishBonus: fighter.contract?.bonuses?.finishBonus || 0,
        performanceBonus: fighter.contract?.bonuses?.performanceBonus || 0
      }
    });
  };