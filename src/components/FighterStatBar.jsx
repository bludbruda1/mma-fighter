import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * FighterStatBar Component
 * Displays a single fighter's statistic with a visual progress bar
 * 
 * @param {Object} props
 * @param {number} props.value - Current stat value
 * @param {string} props.label - Label for the stat (e.g., "Strikes Landed")
 */
const FighterStatBar = ({ value = 0, label }) => {
  // Ensure value is a number
  const numericValue = Number(value) || 0;
  
  // Calculate width percentage for bar (max 100)
  const barWidth = Math.min(100, numericValue * 5); // Multiply by 5 to make small numbers more visible
  
  return (
    <Box sx={{ mb: 2, width: '100%' }}>
      {/* Label and Value Display */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        mb: 0.5,
        px: 1
      }}>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.primary',
            fontWeight: 500
          }}
        >
          {label}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.primary',
            fontWeight: 'bold'
          }}
        >
          {numericValue}
        </Typography>
      </Box>

      {/* Progress Bar */}
      <Box sx={{ 
        width: '100%',
        height: 10,
        bgcolor: 'grey.200',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'grey.300',
        overflow: 'hidden'
      }}>
        <Box
          sx={{
            width: `${barWidth}%`,
            height: '100%',
            bgcolor: 'primary.main',
            transition: 'width 0.3s ease'
          }}
        />
      </Box>
    </Box>
  );
};

export default FighterStatBar;