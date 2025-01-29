/**
 * Check if a fighter will be available for an event date
 * @param {Object} fighter - Fighter object
 * @param {Date} eventDate - Date of the event
 * @param {number} trainingCampDays - Required training camp duration in days (default 56 days/8 weeks)
 * @returns {Object} Availability status and reason if unavailable
 */
export const checkFighterAvailability = (fighter, eventDate, trainingCampDays = 56) => {
    if (!fighter.injuries?.length) return { isAvailable: true };
  
    const eventDateTime = new Date(eventDate).getTime();
    const now = new Date().getTime();
    
    // Check if event is too soon for training camp
    const minimumPreparationTime = now + (trainingCampDays * 24 * 60 * 60 * 1000);
    if (eventDateTime < minimumPreparationTime) {
      return { 
        isAvailable: false, 
        reason: 'Insufficient time for training camp' 
      };
    }
  
    // Check active injuries
    const activeInjury = fighter.injuries.find(injury => {
      if (injury.isHealed) return false;
      
      const injuryEnd = new Date(injury.dateIncurred);
      injuryEnd.setDate(injuryEnd.getDate() + injury.duration);
      
      // Add training camp time to injury end date
      const availableDate = new Date(injuryEnd);
      availableDate.setDate(availableDate.getDate() + trainingCampDays);
      
      return availableDate.getTime() > eventDateTime;
    });
  
    if (activeInjury) {
      return { 
        isAvailable: false, 
        reason: `Recovering from ${activeInjury.type}`,
        injury: activeInjury 
      };
    }
  
    return { isAvailable: true };
  };


/**
 * Determine a fighter's current status based on their injuries, bookings, and fight schedule
 * @param {Object} fighter - Fighter object
 * @param {Date} gameDate - Current game date
 * @param {Array} fights - Array of all fights
 * @returns {Object} Status object containing type and details
 */
export const getFighterStatus = (fighter, gameDate, fights) => {
  if (!fighter) return { type: 'UNKNOWN', color: 'default' };

  const currentDate = new Date(gameDate);

  // Check for injuries first
  if (fighter.injuries?.length) {
    const activeInjury = fighter.injuries.find(injury => {
      if (injury.isHealed) return false;
      const injuryEnd = new Date(injury.dateIncurred);
      injuryEnd.setDate(injuryEnd.getDate() + injury.duration);
      return injuryEnd > currentDate;
    });

    if (activeInjury) {
      return {
        type: 'INJURED',
        color: 'error',
        details: activeInjury
      };
    }
  }

  // Check for upcoming fights
  const upcomingFight = fights?.find(fight => {
    // Skip if no date or result exists
    if (!fight.date || fight.result) return false;

    // Check if this fighter is in the fight
    const isFighter = 
      (fight.fighter1?.personid === fighter.personid) || 
      (fight.fighter2?.personid === fighter.personid);
    
    if (!isFighter) return false;

    const fightDate = new Date(fight.date);
    // Debug log
    console.log(`Checking fight for ${fighter.firstname} ${fighter.lastname}:`, {
      fightDate,
      currentDate,
      isUpcoming: fightDate > currentDate
    });

    return fightDate > currentDate;
  });

  if (upcomingFight) {
    const fightDate = new Date(upcomingFight.date);
    const weeksDifference = Math.ceil((fightDate - currentDate) / (1000 * 60 * 60 * 24 * 7));

    // Debug log
    console.log(`Found upcoming fight for ${fighter.firstname} ${fighter.lastname}:`, {
      fightDate,
      weeksDifference,
      status: weeksDifference <= 6 ? 'IN_CAMP' : 'BOOKED'
    });

    if (weeksDifference <= 6) {
      return {
        type: 'IN_CAMP',
        color: 'warning',
        details: { fightDate: upcomingFight.date }
      };
    }

    return {
      type: 'BOOKED',
      color: 'info',
      details: { fightDate: upcomingFight.date }
    };
  }

  // If no other conditions met, fighter is active
  return {
    type: 'ACTIVE',
    color: 'success'
  };
};

/**
 * Get display text for a fighter status
 * @param {Object} status - Status object from getFighterStatus
 * @returns {string} Formatted status text
 */
export const getStatusDisplay = (status) => {
  switch (status.type) {
    case 'INJURED':
      return 'Injured';
    case 'IN_CAMP':
      return 'In Training Camp';
    case 'BOOKED':
      return 'Fight Booked';
    case 'ACTIVE':
      return 'Active';
    default:
      return 'Unknown';
  };
};