// Helper function to properly capitalize fighting style
export const formatFightingStyle = (style) => {
  return style
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Helper function to calculate age and format birthday with age
export const formatBirthdayWithAge = (dob) => {
if (!dob) return "N/A";

const birthDate = new Date(dob);
const today = new Date();

// Calculate age
let age = today.getFullYear() - birthDate.getFullYear();
const monthDiff = today.getMonth() - birthDate.getMonth();

// Adjust age if birthday hasn't occurred this year
if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
  age--;
}

// Format date as DD/MM/YYYY
const formattedDate = birthDate.toLocaleDateString('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

return `${formattedDate} (${age} years old)`;
};

// Helper function to calculate age and format birthday
export const formatBirthday = (dob) => {
if (!dob) return "N/A";
return new Date(dob).toLocaleDateString('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});
};