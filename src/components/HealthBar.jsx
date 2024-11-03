import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * HealthBar Component
 * Displays a fighter's health status for different body parts
 * 
 * @param {Object} props
 * @param {number} props.value - Current health value (0-100)
 * @param {number} props.maxValue - Maximum health value
 * @param {string} props.label - Label for the health bar (e.g., "Head", "Body")
 * @param {string} [props.color="primary"] - Color theme for the health bar
 */
const HealthBar = ({ value = 100, maxValue = 100, label, color = "primary" }) => {
  // Calculate percentage for the health bar
  const percentage = (value / maxValue) * 100;
  
  // Determine color based on health percentage
  const getBarColor = () => {
    if (percentage > 66) return '#4caf50'; // Green
    if (percentage > 33) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  return (
    <Box sx={{ mb: 1, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="textSecondary">
          {label}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {Math.round(value)}/{maxValue}
        </Typography>
      </Box>
      <Box
        sx={{
          width: '100%',
          height: 8,
          bgcolor: 'grey.300',
          borderRadius: 1,
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            width: `${percentage}%`,
            height: '100%',
            bgcolor: getBarColor(),
            transition: 'width 0.3s ease, background-color 0.3s ease'
          }}
        />
      </Box>
    </Box>
  );
};

export default HealthBar;