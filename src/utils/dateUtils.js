import { getGameDate } from "./indexedDB";

/**
 * Calculate age based on game date
 * @param {string|Date} dob - Date of birth
 * @param {string|Date} [currentDate] - Optional current date (defaults to game date)
 * @returns {Promise<number|string>} Age in years or "N/A" if no date provided
 */
export const calculateAge = async (dob, currentDate = null) => {
  if (!dob) return "N/A";
  
  try {
    // Use provided currentDate or fetch game date
    const today = currentDate ? new Date(currentDate) : new Date(await getGameDate());
    const birthDate = new Date(dob);
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.error('Error calculating age:', error);
    return "N/A";
  }
};

/**
 * Format a date as a string with age
 * @param {string|Date} dob - Date of birth
 * @param {string|Date} [currentDate] - Optional current date (defaults to game date)
 * @returns {Promise<string>} Formatted date with age
 */
export const formatDateWithAge = async (dob, currentDate = null) => {
  if (!dob) return "N/A";
  
  try {
    const age = await calculateAge(dob, currentDate);
    const date = new Date(dob).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `${date} (${age} years old)`;
  } catch (error) {
    console.error('Error formatting date with age:', error);
    return "N/A";
  }
};

/**
 * Format a date string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return "N/A";
  
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};