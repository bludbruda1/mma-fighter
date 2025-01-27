import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Tooltip,
  Chip,
  Button,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FilterPanel from "../components/FilterPanel";
import SortableTable from "../components/SortableTable";
import NegotiationDialog from '../components/NegotiationDialog';
import { getAllFighters, getAllChampionships, getAllFights, updateFighter } from "../utils/indexedDB";
import { formatFightingStyle } from "../utils/uiHelpers";
import { getRankingDisplay } from "../utils/rankingsHelper";
import { 
  generateCounterOffer,
  validateContractValues,
  willFighterAcceptOffer,
  createInitialOffer
} from '../utils/contractNegotiation';

const Contracts = () => {
  const { gameId } = useParams();
  // Core state management
  const [fighters, setFighters] = useState([]);
  const [championships, setChampionships] = useState([]);
  const [fights, setFights] = useState([]);

  // Sorting state management
  const [orderBy, setOrderBy] = useState('firstname');
  const [order, setOrder] = useState('asc');

  // Filter state management
  const [filters, setFilters] = useState({
    weightClass: 'all',
    fightingStyle: 'all',
    nationality: 'all',
    championStatus: 'all',
    rankingStatus: 'all',
    gender: 'all',
  });

  // Filter options state
  const [filterOptions, setFilterOptions] = useState({
    weightClasses: [],
    fightingStyles: [],
    nationalities: [],
  });

  // Negotiation-related states
  const [negotiationOpen, setNegotiationOpen] = useState(false);
  const [selectedFighter, setSelectedFighter] = useState(null);
  const [negotiationRound, setNegotiationRound] = useState(0);
  const [counterOffer, setCounterOffer] = useState(null);
  const [newContract, setNewContract] = useState({
    amount: 0,
    fightsOffered: 1,
    type: 'exclusive',
    signingBonus: 0,
    bonuses: {
      winBonus: 0
    }
  });

  // Helper function for chip colors
  const getStatusChipColor = (status) => {
    switch (status) {
      case 'No Contract': return 'error';
      case 'Expired': return 'error';
      case 'Near Expiration': return 'warning';
      case 'Active': return 'success';
      default: return 'default';
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedFighters, fetchedChampionships, fetchedFights] = await Promise.all([
          getAllFighters(gameId),
          getAllChampionships(gameId),
          getAllFights(gameId)
        ]);
        
        setFighters(fetchedFighters);
        setChampionships(fetchedChampionships);
        setFights(fetchedFights);
  
        setFilterOptions({
          weightClasses: [...new Set(fetchedFighters.map(f => f.weightClass))].filter(Boolean).sort(),
          fightingStyles: [...new Set(fetchedFighters.map(f => formatFightingStyle(f.fightingStyle)))].filter(Boolean).sort(),
          nationalities: [...new Set(fetchedFighters.map(f => f.nationality))].filter(Boolean).sort(),
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Helper function to get championship info
  const getChampionshipInfo = useCallback((fighterId) => {
    return championships.filter(c => c.currentChampionId === fighterId);
  }, [championships]);

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Handler for opening contract negotiations
  const handleNegotiateContract = (fighter) => {
    const initialOffer = createInitialOffer();
    setSelectedFighter(fighter);
    setNewContract(initialOffer);
    setNegotiationRound(1);
    setCounterOffer(null);
    setNegotiationOpen(true);
  };

  // Handler for sending offers
  const handleSendOffer = () => {
    if (!selectedFighter) return;

    const validatedOffer = validateContractValues(newContract);
    
    if (willFighterAcceptOffer(validatedOffer, selectedFighter, championships, fights)) {
      handleSaveContract(validatedOffer);
    } else {
      const counter = generateCounterOffer(validatedOffer, selectedFighter, championships, fights);
      setCounterOffer(counter);
      setNegotiationRound(prev => prev + 1);
    }
  };

  // Handler for saving contracts
  const handleSaveContract = async (contract) => {
    try {
      if (!selectedFighter) return;

      const validatedContract = validateContractValues(contract);
      
      if (willFighterAcceptOffer(validatedContract, selectedFighter, championships, fights)) {
        const updatedFighter = {
          ...selectedFighter,
          contract: validatedContract
        };

        await updateFighter(updatedFighter, gameId);
        
        setFighters(prevFighters => 
          prevFighters.map(f => 
            f.personid === updatedFighter.personid ? updatedFighter : f
          )
        );
        
        setNegotiationOpen(false);
        setSelectedFighter(null);
      }
    } catch (error) {
      console.error("Error updating contract:", error);
    }
  };

  // Handler for contract updates
  const handleContractUpdate = (field, value) => {
    const updatedContract = { ...newContract };
    
    if (field === 'bonus.winBonus') {
      updatedContract.bonuses = {
        ...updatedContract.bonuses,
        winBonus: value
      };
    } else {
      updatedContract[field] = value;
    }
  
    setNewContract(validateContractValues(updatedContract));
  };

  // Helper function to determine contract status
  const getContractStatus = (fighter) => {
    if (!fighter.contract) return 'No Contract';
    if (fighter.contract.fightsRem === 0) return 'Expired';
    if (fighter.contract.fightsRem <= 2) return 'Near Expiration';
    return 'Active';
  };

  // Column definitions
  const columns = [
    { id: 'ranking', label: 'Ranking' },
    { id: 'fullname', label: 'Name' },
    { id: 'weightClass', label: 'Weight Class' },
    { id: 'contractStatus', label: 'Contract Status' },
    { id: 'fightsRemaining', label: 'Fights Remaining' },
    { id: 'basePay', label: 'Base Pay' },
    { id: 'winBonus', label: 'Win Bonus' },
    { id: 'totalPotential', label: 'Total Potential' },
  ];

  // Custom cell renderer
  const renderCell = (fighter, columnId) => {
    switch (columnId) {
      case 'ranking':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getChampionshipInfo(fighter.personid).map((championship, index) => (
              <Tooltip key={championship.id} title={championship.name} arrow>
                <EmojiEventsIcon 
                  sx={{ 
                    color: 'gold',
                    marginRight: index < getChampionshipInfo(fighter.personid).length - 1 ? 1 : 0 
                  }} 
                />
              </Tooltip>
            ))}
            {!getChampionshipInfo(fighter.personid).length && getRankingDisplay(fighter, championships)}
          </Box>
        );
      case 'fullname':
        return (
          <Link
            to={`/game/${gameId}/dashboard/${fighter.personid}`}
            style={{
              textDecoration: "none",
              color: "#1976d2",
            }}
          >
            {`${fighter.firstname} ${fighter.lastname}`}
          </Link>
        );
      case 'contractStatus':
        const status = getContractStatus(fighter);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={status}
              color={getStatusChipColor(status)}
              size="small"
            />
            {(status === 'No Contract' || 
              status === 'Expired' || 
              status === 'Near Expiration') && (
              <Button
                variant="contained"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNegotiateContract(fighter);
                }}
                sx={{
                  backgroundColor: "rgba(33, 33, 33, 0.9)",
                  color: "#fff",
                  "&:hover": {
                    backgroundColor: "rgba(33, 33, 33, 0.7)",
                  },
                }}
              >
                {status === 'No Contract' ? 'Offer Contract' : 'Negotiate Extension'}
              </Button>
            )}
          </Box>
        );
      case 'fightsRemaining':
        return fighter.contract?.fightsRem || 'N/A';
      case 'basePay':
        return formatCurrency(fighter.contract?.amount);
      case 'winBonus':
        return formatCurrency(fighter.contract?.bonuses?.winBonus);
      case 'totalPotential':
        if (!fighter.contract) return 'N/A';
        const total = (fighter.contract.amount || 0) +
                     (fighter.contract.bonuses?.winBonus || 0);
        return formatCurrency(total);
      default:
        return fighter[columnId];
    }
  };

  // Sort request handler
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Filter application logic
  const applyFilters = useCallback((fightersToFilter) => {
    return fightersToFilter.filter(fighter => {
      if (filters.weightClass !== 'all' && fighter.weightClass !== filters.weightClass) return false;
      if (filters.fightingStyle !== 'all' && formatFightingStyle(fighter.fightingStyle) !== filters.fightingStyle) return false;
      if (filters.nationality !== 'all' && fighter.nationality !== filters.nationality) return false;

      const isChampion = getChampionshipInfo(fighter.personid).length > 0;
      if (filters.championStatus === 'champion' && !isChampion) return false;
      if (filters.championStatus === 'non-champion' && isChampion) return false;

      const isRanked = fighter.ranking != null || isChampion;
      if (filters.rankingStatus === 'ranked' && !isRanked) return false;
      if (filters.rankingStatus === 'unranked' && isRanked) return false;

      if (filters.gender !== 'all' && fighter.gender !== filters.gender) return false;

      return true;
    });
  }, [filters, getChampionshipInfo]);

  // Memoized filtered and sorted fighters
  const filteredAndSortedFighters = useMemo(() => {
    const compareValues = (a, b, property) => {
      switch (property) {
        case 'ranking':
          const aIsChamp = getChampionshipInfo(a.personid).length > 0;
          const bIsChamp = getChampionshipInfo(b.personid).length > 0;
          if (aIsChamp !== bIsChamp) return aIsChamp ? -1 : 1;
          return (a.ranking || 999) - (b.ranking || 999);
        case 'contractStatus':
          return getContractStatus(a).localeCompare(getContractStatus(b));
        case 'fightsRemaining':
          return (a.contract?.fightsRem || 0) - (b.contract?.fightsRem || 0);
        case 'basePay':
          return (a.contract?.amount || 0) - (b.contract?.amount || 0);
        case 'winBonus':
          return (a.contract?.bonuses?.winBonus || 0) - (b.contract?.bonuses?.winBonus || 0);
        case 'totalPotential':
          const totalA = a.contract ? 
            (a.contract.amount || 0) + (a.contract.bonuses?.winBonus || 0) : 0;
          const totalB = b.contract ? 
            (b.contract.amount || 0) + (b.contract.bonuses?.winBonus || 0) : 0;
          return totalA - totalB;
        default:
          if (typeof a[property] === 'string') {
            return a[property].toLowerCase().localeCompare(b[property].toLowerCase());
          }
          return (a[property] || 0) - (b[property] || 0);
      }
    };

    return [...fighters]
      .sort((a, b) => {
        const result = compareValues(a, b, orderBy);
        return order === 'asc' ? result : -result;
      })
      .filter(fighter => applyFilters([fighter]).length > 0);
  }, [fighters, order, orderBy, applyFilters, getChampionshipInfo]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Fighter Contracts
      </Typography>

      <FilterPanel
        filters={filters}
        setFilters={setFilters}
        filterOptions={filterOptions}
        totalFighters={fighters.length}
        filteredCount={filteredAndSortedFighters.length}
      />

      <SortableTable
        columns={columns}
        data={filteredAndSortedFighters}
        orderBy={orderBy}
        order={order}
        onRequestSort={handleRequestSort}
        renderCell={renderCell}
        sx={{
          '& .MuiTableCell-root': {
            whiteSpace: 'nowrap',
            '&[data-column-id="contractStatus"]': {
              minWidth: 250,
            }
          }
        }}
      />

      <NegotiationDialog
        open={negotiationOpen}
        onClose={() => setNegotiationOpen(false)}
        selectedFighter={selectedFighter}
        newContract={newContract}
        onContractUpdate={handleContractUpdate}
        onSendOffer={handleSendOffer}
        onAcceptCounter={() => setNewContract(counterOffer)}
        counterOffer={counterOffer}
        negotiationRound={negotiationRound}
        formatCurrency={formatCurrency}
        championships={championships}
        fights={fights}
      />
    </Container>
  );
};

export default Contracts;