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
} from '@mui/material';
import { getAllFighters, updateFighter } from "../utils/indexedDB";

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
  const [negotiationOpen, setNegotiationOpen] = useState(false);
  const [selectedFighter, setSelectedFighter] = useState(null);
  const [newContract, setNewContract] = useState({
    company: 'UFC',
    amount: 100000,
    fightsRem: 4,
    type: 'exclusive'
  });

  // Load fighters data
  useEffect(() => {
    const loadFighters = async () => {
      try {
        const fetchedFighters = await getAllFighters();
        setFighters(fetchedFighters);
      } catch (error) {
        console.error('Error loading fighters:', error);
      }
    };
    loadFighters();
  }, []);

  // Handler for starting contract negotiation
  const handleNegotiateContract = (fighter) => {
    setSelectedFighter(fighter);
    setNewContract({
      company: fighter.contract?.company || 'UFC',
      amount: fighter.contract?.amount || 100000,
      fightsRem: 4, // Always offer 4 fight contracts
      type: fighter.contract?.type || 'exclusive'
    });
    setNegotiationOpen(true);
  };

  // Handler for saving new contract
  const handleSaveContract = async () => {
    try {
      if (!selectedFighter) return;

      const updatedFighter = {
        ...selectedFighter,
        contract: newContract
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
                  value={newContract.company}
                  label="Organisation"
                  onChange={(e) => setNewContract({...newContract, company: e.target.value})}
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
                  <MenuItem value="non-exclusive">Non-Exclusive</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Fight Purse"
                type="number"
                value={newContract.amount}
                onChange={(e) => setNewContract({
                  ...newContract, 
                  amount: parseInt(e.target.value)
                })}
                InputProps={{
                  startAdornment: <Typography>$</Typography>
                }}
              />

              <Typography variant="body2" color="text.secondary">
                Contract Length: 4 Fights
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNegotiationOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveContract}
              variant="contained"
              sx={{
                backgroundColor: "rgba(33, 33, 33, 0.9)",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "rgba(33, 33, 33, 0.7)",
                },
              }}
            >
              Offer Contract
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Finances;