/**
 * Name formatting utilities for consistent fighter name display across the application
 */

/**
 * Format fighter's basic name
 * @param {Object} fighter - Fighter object
 * @returns {string} Formatted basic name
 */
export const formatBasicName = (fighter) => {
    if (!fighter?.firstname || !fighter?.lastname) return "Unknown Fighter";
    return `${fighter.firstname} ${fighter.lastname}`;
  };
  
  /**
   * Format fighter's name with nickname if present
   * @param {Object} fighter - Fighter object
   * @returns {string} Formatted name with nickname
   */
  export const formatNameWithNickname = (fighter) => {
    if (!fighter?.firstname || !fighter?.lastname) return "Unknown Fighter";
    if (!fighter.nickname) return formatBasicName(fighter);
  
    switch (fighter.nicknamePlacement) {
      case 'pre':
        return `"${fighter.nickname}" ${fighter.firstname} ${fighter.lastname}`;
      case 'mid':
        return `${fighter.firstname} "${fighter.nickname}" ${fighter.lastname}`;
      case 'post':
        return `${fighter.firstname} ${fighter.lastname} "${fighter.nickname}"`;
      default:
        return formatBasicName(fighter);
    }
  };
  
  /**
   * Format fighter's name for announcer style introduction
   * @param {Object} fighter - Fighter object
   * @returns {string} Formatted name for announcer
   */
  export const formatAnnouncerName = (fighter) => {
    if (!fighter?.firstname || !fighter?.lastname) return "UNKNOWN FIGHTER";
    if (!fighter.nickname) {
      return `${fighter.firstname.toUpperCase()}... ${fighter.lastname.toUpperCase()}`;
    }
  
    switch (fighter.nicknamePlacement) {
      case 'pre':
        return `"${fighter.nickname.toUpperCase()}"... ${fighter.firstname.toUpperCase()}... ${fighter.lastname.toUpperCase()}`;
      case 'mid':
        return `${fighter.firstname.toUpperCase()}... "${fighter.nickname.toUpperCase()}"... ${fighter.lastname.toUpperCase()}`;
      case 'post':
        return `${fighter.firstname.toUpperCase()}... ${fighter.lastname.toUpperCase()}... "${fighter.nickname.toUpperCase()}"`;
      default:
        return `${fighter.firstname.toUpperCase()}... ${fighter.lastname.toUpperCase()}`;
    }
  };