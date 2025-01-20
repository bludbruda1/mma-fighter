import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
} from '@mui/material';
import { getAllFighters, updateFighter, getAllChampionships } from "../utils/indexedDB";
import {
    calculateNegotiationPower,
    generateCounterOffer,
    validateContractValues,
    willFighterAcceptOffer,
    createInitialOffer
  } from '../utils/contractNegotiation';

// Styles object for consistent theming
const styles = {
  container: {
    py: 6,
    minHeight: '100vh',
    background: 'linear-gradient(135deg, rgba(240,240,240,0.6) 0%, rgba(255,255,255,0.6) 100%)',
  },
  headerCard: {
    mb: 4,
    p: 3,
    background: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    borderRadius: 2,
  },
  sectionTitle: {
    color: 'text.primary',
    fontWeight: 'bold',
    mb: 3,
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: -8,
      left: 0,
      width: 60,
      height: 3,
      backgroundColor: 'primary.main',
      borderRadius: 1,
    }
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    borderRadius: 2,
    height: '100%',
  },
};

const Finances = () => {
  // State management
  const [fighters, setFighters] = useState([]);
  const [championships, setChampionships] = useState([]);
  const [negotiationOpen, setNegotiationOpen] = useState(false);
  const [selectedFighter, setSelectedFighter] = useState(null);
  const [newContract, setNewContract] = useState({
    company: 'UFC',
    amount: 12000,
    fightsOffered: 1,
    type: 'exclusive',
    signingBonus: 0,
    bonuses: {
      winBonus: 12000,
      finishBonus: 0,
      performanceBonus: 0
    }
  });

  // Add states for negotiation
  const [counterOffer, setCounterOffer] = useState(null);
  const [negotiationRound, setNegotiationRound] = useState(0);
  const [negotiationPower, setNegotiationPower] = useState(0);

  // Load fighters data
  useEffect(() => {
    const loadFighters = async () => {
      try {
        // Fetch both fighters and championships data
        const [fetchedFighters, fetchedChampionships] = await Promise.all([
          getAllFighters(),
          getAllChampionships()
        ]);
        setFighters(fetchedFighters);
        setChampionships(fetchedChampionships);
      } catch (error) {
        console.error('Error loading fighters:', error);
      }
    };
    loadFighters();
  }, []);

  // Handler for starting contract negotiation
  const handleContractUpdate = (field, value) => {
    let updatedContract = { ...newContract };
  
    if (field.startsWith('bonus.')) {
      const bonusField = field.split('.')[1];
      updatedContract.bonuses = {
        ...updatedContract.bonuses,
        [bonusField]: value
      };
    } else {
      updatedContract[field] = value;
    }
  
    setNewContract(validateContractValues(updatedContract));
  };

  const handleNegotiateContract = (fighter) => {
    const power = calculateNegotiationPower(fighter, championships);
    setNegotiationPower(power);
    setSelectedFighter(fighter);
    
    const initialOffer = createInitialOffer(fighter);
    setNewContract(initialOffer);
    setNegotiationRound(1);
    setCounterOffer(null);
    setNegotiationOpen(true);
  };

  // Handler for sending offer
  const handleSendOffer = () => {
    const power = negotiationPower;
    const counter = generateCounterOffer(newContract, power);
    
    if (willFighterAcceptOffer(newContract, counter, power)) {
      handleSaveContract();
    } else {
      setCounterOffer(counter);
      setNegotiationRound(prev => prev + 1);
    }
  };

  // Handler for saving new contract
  const handleSaveContract = async () => {
    try {
      if (!selectedFighter) return;
  
      // Create contract object with fightsRem set to fightsOffered
      const contract = {
        ...newContract,
        fightsRem: newContract.fightsOffered // Add this line to set initial fights remaining
      };
  
      const updatedFighter = {
        ...selectedFighter,
        contract: contract  // Use the new contract object with fightsRem
      };
  
      await updateFighter(updatedFighter);
      
      // Update local state
      setFighters(prevFighters => 
        prevFighters.map(f => 
          f.personid === updatedFighter.personid ? updatedFighter : f
        )
      );
      
      setNegotiationOpen(false);
      setSelectedFighter(null);
    } catch (error) {
      console.error("Error updating contract:", error);
    }
  };

  // Helper function to determine contract status
  const getContractStatus = (fighter) => {
    if (!fighter.contract) return 'No Contract';
    if (fighter.contract.fightsRem === 0) return 'Expired';
    if (fighter.contract.fightsRem <= 2) return 'Near Expiration';
    return 'Active';
  };

  // Helper function to get status chip color
  const getStatusChipColor = (status) => {
    switch (status) {
      case 'No Contract': return 'error';
      case 'Expired': return 'error';
      case 'Near Expiration': return 'warning';
      case 'Active': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={styles.container}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Paper sx={styles.headerCard}>
          <Typography 
            variant="h3" 
            align="center" 
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Financial Management
          </Typography>
          <Typography 
            variant="subtitle1" 
            align="center" 
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Manage contracts and financial aspects of your organization
          </Typography>
        </Paper>

        {/* Contracts Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" sx={styles.sectionTitle}>
              Fighter Contracts
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fighter</TableCell>
                    <TableCell>Weight Class</TableCell>
                    <TableCell>Organisation</TableCell>
                    <TableCell>Contract Value</TableCell>
                    <TableCell>Fights Remaining</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fighters.map((fighter) => {
                    const status = getContractStatus(fighter);
                    return (
                      <TableRow key={fighter.personid}>
                        <TableCell>
                          {`${fighter.firstname} ${fighter.lastname}`}
                        </TableCell>
                        <TableCell>{fighter.weightClass}</TableCell>
                        <TableCell>
                          {fighter.contract?.company || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {fighter.contract?.amount ? 
                            `$${fighter.contract.amount.toLocaleString()}` : 
                            'N/A'}
                        </TableCell>
                        <TableCell>
                          {fighter.contract?.fightsRem ?? 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={status}
                            color={getStatusChipColor(status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {(status === 'No Contract' || 
                           status === 'Expired' || 
                           status === 'Near Expiration') && (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleNegotiateContract(fighter)}
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Contract Negotiation Dialog */}
        <Dialog 
        open={negotiationOpen} 
        onClose={() => setNegotiationOpen(false)}
        >
        <DialogTitle>
            {selectedFighter ? 
            `Negotiate Contract: ${selectedFighter.firstname} ${selectedFighter.lastname}` :
            'Negotiate Contract'
            }
        </DialogTitle>
        <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
                <InputLabel>Organisation</InputLabel>
                <Select
                value="UFC"
                label="Organisation"
                >
                <MenuItem value="UFC">UFC</MenuItem>
                </Select>
            </FormControl>

            <FormControl fullWidth>
                <InputLabel>Contract Type</InputLabel>
                <Select
                value={newContract.type}
                label="Contract Type"
                onChange={(e) => setNewContract({...newContract, type: e.target.value})}
                >
                <MenuItem value="exclusive">Exclusive</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
                </Select>
            </FormControl>

            {/* Fight purse and contract length */}
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Fight Purse"
                    type="number"
                    value={newContract.amount}
                    onChange={(e) => handleContractUpdate('amount', parseInt(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <Typography>$</Typography>,
                      inputProps: {  // Nest inputProps inside InputProps
                        step: 1000,
                        min: 12000 // Minimum fight purse
                      }
                    }}
                />
                </Grid>
                <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Number of Fights"
                    type="number"
                    value={newContract.fightsOffered}
                    onChange={(e) => handleContractUpdate('fightsOffered', parseInt(e.target.value) || 1)}
                    inputProps={{
                        step: 1,
                        min: 1,
                        max: 8
                    }}
                />
                </Grid>
            </Grid>

            {/* Bonuses section */}
            <Typography variant="h6">Bonuses & Incentives</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Signing Bonus"
                    type="number"
                    value={newContract.signingBonus}
                    onChange={(e) => setNewContract({
                      ...newContract,
                      signingBonus: parseInt(e.target.value)
                    })}
                    InputProps={{
                      startAdornment: <Typography>$</Typography>,
                      inputProps: {
                        step: 1000
                      }
                    }}
                />
                </Grid>
                <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Win Bonus"
                    type="number"
                    value={newContract.bonuses.winBonus}
                    onChange={(e) => handleContractUpdate('bonus.winBonus', parseInt(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <Typography>$</Typography>,
                      inputProps: {
                        step: 1000,
                        min: newContract.amount >= 25000 ? 0 : 12000
                      }
                    }}
                />
                </Grid>
                <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Finish Bonus"
                    type="number"
                    value={newContract.bonuses.finishBonus}
                    onChange={(e) => handleContractUpdate('bonus.finishBonus', parseInt(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <Typography>$</Typography>,
                      inputProps: {
                        step: 1000,
                        min: 0
                      }
                    }}              
                />
                </Grid>
                <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Performance Bonus"
                    type="number"
                    value={newContract.bonuses.performanceBonus}
                    onChange={(e) => handleContractUpdate('bonus.performanceBonus', parseInt(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <Typography>$</Typography>,
                      inputProps: {
                        step: 1000,
                        min: 0
                      }
                    }}
                />
                </Grid>
            </Grid>

            {/* Counter offer display */}
            {counterOffer && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                    Fighter Counter-Offer
                </Typography>
                <Typography>Fight Purse: ${counterOffer.amount.toLocaleString()}</Typography>
                <Typography>Fights Requested: {counterOffer.fightsRequested}</Typography>
                <Typography>Signing Bonus: ${counterOffer.signingBonus.toLocaleString()}</Typography>
                <Typography>Win Bonus: ${counterOffer.bonuses.winBonus.toLocaleString()}</Typography>
                <Typography>Finish Bonus: ${counterOffer.bonuses.finishBonus.toLocaleString()}</Typography>
                <Typography>Performance Bonus: ${counterOffer.bonuses.performanceBonus.toLocaleString()}</Typography>
                </Box>
            )}

            {/* Negotiation status */}
            <Typography variant="body2" color="text.secondary">
                Negotiation Round: {negotiationRound}
            </Typography>
            </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setNegotiationOpen(false)}>Cancel</Button>
            {counterOffer ? (
            <Button 
                onClick={() => setNewContract(counterOffer)}
                color="primary"
            >
                Accept Counter
            </Button>
            ) : null}
            <Button 
            onClick={handleSendOffer}
            variant="contained"
            sx={{
                backgroundColor: "rgba(33, 33, 33, 0.9)",
                color: "#fff",
                "&:hover": {
                backgroundColor: "rgba(33, 33, 33, 0.7)",
                },
            }}
            >
            {counterOffer ? 'Make New Offer' : 'Send Offer'}
            </Button>
        </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Finances;