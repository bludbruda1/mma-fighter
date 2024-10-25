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
      case "fightStart":
        return `${event.fighter1.name} (${event.fighter1.record}) vs ${event.fighter2.name} (${event.fighter2.record})`;
      
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
  
      case "position":
        return `${event.attackerName} moves to ${formatPosition(event.newPosition)}`;
  
      case "submission": {
        const submissionDesc = formatSubmissionEvent(event);
        return submissionDesc;
      }
  
      case "recovery":
        return `${event.name} recovers between rounds`;
  
      case "fighterState": {
        // Only show significant state changes
        if (event.position !== "standing") {
          return `${event.name} is in ${formatPosition(event.position)}`;
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
   * Format a position into readable text
   * @param {string} position - The position to format
   * @returns {string} Formatted position description
   */
  const formatPosition = (position) => {
    // Convert positions like GROUND_FULL_GUARD_TOP to "Full Guard (Top)"
    return position
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace('Ground ', '')
      .replace('Position', '');
  };
  
  /**
   * Format fight time
   * @param {string} time - Time in MM:SS format
   * @returns {string} Formatted time with "Round X - MM:SS"
   */
  const formatFightTime = (round, time) => {
    return `R${round} ${time}`;
  };
  
  export {
    formatFightEvent,
    formatFightTime,
    formatPosition,
    formatSubmissionEvent
  };