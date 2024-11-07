// Helper function to properly capitalize fighting style
export const formatFightingStyle = (style) => {
    return style
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };