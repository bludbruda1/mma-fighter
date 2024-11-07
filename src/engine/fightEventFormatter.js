/**
 * Utility functions for formatting fight events into readable text
 */

/**
 * Format a single fight event into readable text
 * @param {Object} event - The event to format
 * @returns {string} Formatted text description of the event
 */
const formatFightEvent = (event) => {
    switch (event.type) {
      case "introduction":
        return `${event.text}`; // Format introduction events with PRE-FIGHT tag

      case "fightStart":
        return null; // Return null to skip displaying the initial fight start message
      
      case "roundStart":
        return `Round ${event.round} begins!`;
        
      case "roundEnd":
        return `End of Round ${event.round}`;
  
      case "strike": {
        let strikeDesc = '';
        switch (event.outcome) {
          case "landed":
            strikeDesc = `${event.attackerName} lands a ${event.strikeType} on ${event.defenderName}`;
            if (event.damage) {
              strikeDesc += ` dealing ${event.damage} damage to the ${event.target}`;
            }
            break;
          case "blocked":
            strikeDesc = `${event.defenderName} blocks ${event.attackerName}'s ${event.strikeType}`;
            break;
          case "evaded":
            strikeDesc = `${event.defenderName} evades ${event.attackerName}'s ${event.strikeType}`;
            break;
          case "missed":
            strikeDesc = `${event.attackerName}'s ${event.strikeType} misses`;
            break;
          default:
            strikeDesc = `${event.attackerName} attempts a ${event.strikeType}`;
        }
        return strikeDesc;
      }
  
      case "takedown": {
        const takedownDesc = event.outcome === "successful"
          ? `${event.attackerName} successfully lands a ${event.takedownType}`
          : `${event.defenderName} defends against ${event.attackerName}'s ${event.takedownType}`;
        return takedownDesc;
      }
  
      case "clinch": {
        if (event.outcome === "successful") {
          return `${event.attackerName} clinches up with ${event.defenderName}`;
        } else {
          return `${event.defenderName} defends ${event.attackerName}'s clinch attempt`;
        }
      }
  
      case "position": {
        if (event.outcome === "successful") {
          return `${event.attackerName} moves to ${event.attackerPosition}`;
        } else {
          return `${event.attackerName} fails to change position`;
        }
      }            
  
      case "submission": {
        const submissionDesc = formatSubmissionEvent(event);
        return submissionDesc;
      }
  
      case "recovery":
        return `${event.name} recovers between rounds`;
  
      case "fighterState": {
        // Only show significant state changes
        if (event.position !== "standing") {
          return `${event.name} is in ${event.position}`;
        }
        return null; // Return null for events we don't want to display
      }
  
      case "fightEnd":
        return `${event.winnerName} defeats ${event.loserName} by ${event.method}${
          event.submissionType ? ` (${event.submissionType})` : ''
        } in Round ${event.round}`;
  
      default:
        return null; // Return null for events we don't want to display
    }
  };

/**
 * Format fight introduction in authentic Bruce Buffer style
 * @param {Object} fighter1 - First fighter data (red corner)
 * @param {Object} fighter2 - Second fighter data (blue corner)
 * @returns {Object[]} Array of formatted introduction lines
 */
const formatFightIntroduction = (fighter1, fighter2) => {
    const ROUNDS = 3; // Can make this dynamic if needed
    const ANNOUNCER = "Bruce Buffer"; // set announcer for now
    const REFEREE = "Herb Dean"; // set referee for now
    
    // Helper to format fighting style from enum to display text
    const formatStyle = (style) => {
      if (!style) return 'mixed martial artist';
      return style.replace('FIGHTING_STYLES.', '').toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
  
    return [
      {
        type: "introduction",
        text: `${ANNOUNCER}: Ladies and gentlemen, we... are... LIVE!`
      },
      {
        type: "introduction", 
        text: `${ANNOUNCER}: And now... IIIIIIIIT'S TIME!`
      },
      {
        type: "introduction",
        text: `${ANNOUNCER}: For ${ROUNDS} rounds in the UFC ${fighter1.weightClass} division!`
      },
      {
        type: "introduction",
        text: `${ANNOUNCER}: Introducing first, FIGHTING out of the BLUE corner...`
      },
      {
        type: "introduction",
        text: `${ANNOUNCER}: This man is a ${formatStyle(fighter2.fightingStyle)}...`
      },
      {
        type: "introduction",
        text: `${ANNOUNCER}: With a professional record of ${fighter2.wins} wins, ${fighter2.losses} losses...`,
      },
      {
        type: "introduction",
        text: `${ANNOUNCER}: Fighting out of ${fighter2.hometown}...`,
      },
      {
        type: "introduction",
        text: `${ANNOUNCER}: Presenting... ${fighter2.firstname.toUpperCase()}... ${fighter2.lastname.toUpperCase()}!`,
      },
      {
        type: "introduction", 
        text: `${ANNOUNCER}: AND NOW introducing the fighter FIGHTING out of the RED corner...`
      },
      {
        type: "introduction",
        text: `${ANNOUNCER}: This man is a ${formatStyle(fighter1.fightingStyle)}...`
      },
      {
        type: "introduction",
        text: `${ANNOUNCER}: With a professional record of ${fighter1.wins} wins, ${fighter1.losses} losses...`,
      },
      {
        type: "introduction",
        text: `${ANNOUNCER}: Fighting out of ${fighter1.hometown}...`,
      },
      {
        type: "introduction",
        text: `${ANNOUNCER}: Presenting... ${fighter1.firstname.toUpperCase()}... ${fighter1.lastname.toUpperCase()}!`,
      },
      {
        type: "introduction",
        text: `${ANNOUNCER}: Our referee in charge, ${REFEREE}.`
      },
      {
        type: "introduction",
        text: `${REFEREE}: We've gone over the rules in the dressing room, I want you to protect yourself at all times, follow my instructions - we'll have a clean fight. Touch gloves now if you want, good luck.`
      }
    ];
  };  
  
  /**
   * Format a submission event into readable text
   * @param {Object} event - The submission event to format
   * @returns {string} Formatted text description
   */
  const formatSubmissionEvent = (event) => {
    switch (event.stage) {
      case "attempt":
        return `${event.attackerName} attempts a ${event.submissionType}`;
      case "progress":
        return `${event.attackerName} working on the ${event.submissionType}`;
      case "success":
        return `${event.attackerName} submits ${event.defenderName} with a ${event.submissionType}!`;
      case "escape":
        return `${event.defenderName} escapes the ${event.submissionType}`;
      default:
        return `${event.attackerName} looking for a ${event.submissionType}`;
    }
  };
  
  
/**
 * Format fight time
 * @param {number} round - Round number
 * @param {string} time - Time in MM:SS format
 * @returns {string} Formatted time with "Round X - MM:SS"
 */
const formatFightTime = (round, time) => {
    // Skip time formatting for introduction events
    if (round === 'introduction') {
        return 'PRE-FIGHT';
    }
    return `R${round} ${time}`;
};
  
  export {
    formatFightEvent,
    formatFightTime,
    formatSubmissionEvent,
    formatFightIntroduction
  };