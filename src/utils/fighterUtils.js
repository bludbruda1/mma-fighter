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