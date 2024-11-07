// Helper function to properly capitalize fighting style
export const formatFightingStyle = (style) => {
    return style
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

// Helper function to properly show in fight position
export const formatPosition = (position) => {
  if (!position) return 'Standing';
  return position
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace('ground', '')
      .replace('Position', '');
};