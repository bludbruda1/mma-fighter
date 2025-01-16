import React from 'react';
import {
  Box,
  Card,
  Collapse,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  Button,
  FormHelperText,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const FilterPanel = ({
  filters,
  setFilters,
  filterOptions,
  totalFighters,
  filteredCount,
  weightClassLocked,
}) => {
  // State for panel expansion
  const [expanded, setExpanded] = React.useState(true);

  // Handler for filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      weightClass: 'all',
      fightingStyle: 'all',
      nationality: 'all',
      championStatus: 'all',
      rankingStatus: 'all',
      gender: 'all',
    });
  };

  // Get active filter count
  const activeFilterCount = Object.values(filters).filter(value => value !== 'all').length;

  return (
    <Card sx={{ mb: 3, p: 2 }}>
      {/* Header with expand/collapse */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">Filters</Typography>
          {activeFilterCount > 0 && (
            <Chip 
              label={`${activeFilterCount} active`}
              size="small"
              color="primary"
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Results count */}
          <Typography variant="body2" color="text.secondary">
            Showing {filteredCount} of {totalFighters} fighters
          </Typography>
          <IconButton 
            onClick={() => setExpanded(!expanded)}
            size="small"
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Collapsible filter controls */}
      <Collapse in={expanded}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: '1fr 1fr 1fr'
          },
          gap: 2 
        }}>
          {/* Weight Class Filter */}
          {/* Weight Class Filter */}
          <FormControl size="small">
            <InputLabel>Weight Class</InputLabel>
            <Select
              value={filters.weightClass}
              label="Weight Class"
              onChange={(e) => handleFilterChange('weightClass', e.target.value)}
              disabled={weightClassLocked} // Disable when locked
              sx={{
                // Add visual indication that it's locked
                backgroundColor: weightClassLocked ? 'action.selected' : 'inherit',
              }}
            >
              <MenuItem value="all">All Weight Classes</MenuItem>
              {filterOptions.weightClasses.map((wc) => (
                <MenuItem key={wc} value={wc}>{wc}</MenuItem>
              ))}
            </Select>
            {weightClassLocked && (
              <FormHelperText>Weight class locked for this fight</FormHelperText>
            )}
          </FormControl>

          {/* Fighting Style Filter */}
          <FormControl size="small">
            <InputLabel>Fighting Style</InputLabel>
            <Select
              value={filters.fightingStyle}
              label="Fighting Style"
              onChange={(e) => handleFilterChange('fightingStyle', e.target.value)}
            >
              <MenuItem value="all">All Styles</MenuItem>
              {filterOptions.fightingStyles.map((style) => (
                <MenuItem key={style} value={style}>{style}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Nationality Filter */}
          <FormControl size="small">
            <InputLabel>Nationality</InputLabel>
            <Select
              value={filters.nationality}
              label="Nationality"
              onChange={(e) => handleFilterChange('nationality', e.target.value)}
            >
              <MenuItem value="all">All Nationalities</MenuItem>
              {filterOptions.nationalities.map((nat) => (
                <MenuItem key={nat} value={nat}>{nat}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Champion Status Filter */}
          <FormControl size="small">
            <InputLabel>Champion Status</InputLabel>
            <Select
              value={filters.championStatus}
              label="Champion Status"
              onChange={(e) => handleFilterChange('championStatus', e.target.value)}
            >
              <MenuItem value="all">All Fighters</MenuItem>
              <MenuItem value="champion">Champions Only</MenuItem>
              <MenuItem value="non-champion">Non-Champions Only</MenuItem>
            </Select>
          </FormControl>

          {/* Ranking Status Filter */}
          <FormControl size="small">
            <InputLabel>Ranking Status</InputLabel>
            <Select
              value={filters.rankingStatus}
              label="Ranking Status"
              onChange={(e) => handleFilterChange('rankingStatus', e.target.value)}
            >
              <MenuItem value="all">All Fighters</MenuItem>
              <MenuItem value="ranked">Ranked Only</MenuItem>
              <MenuItem value="unranked">Unranked Only</MenuItem>
            </Select>
          </FormControl>

          {/* Gender Filter */}
          <FormControl size="small">
            <InputLabel>Gender</InputLabel>
            <Select
              value={filters.gender}
              label="Gender"
              onChange={(e) => handleFilterChange('gender', e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Clear Filters Button */}
        {activeFilterCount > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              size="small"
              onClick={handleClearFilters}
              sx={{ 
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              Clear All Filters
            </Button>
          </Box>
        )}
      </Collapse>
    </Card>
  );
};

export default FilterPanel;