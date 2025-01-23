import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  Typography,
  Box,
  Grid,
} from '@mui/material';
import { calculateMinimumContract } from '../utils/contractNegotiation';

const NegotiationDialog = React.memo(({ 
  open,
  onClose,
  selectedFighter,
  newContract,
  onContractUpdate,
  onSendOffer,
  onAcceptCounter,
  counterOffer,
  negotiationRound,
  formatCurrency,
  championships,
  fights
}) => {
  // Keep the render function for minimum requirements
  const renderMinimumRequirements = () => {
    if (!selectedFighter) return null;

    const { minBase, minWin } = calculateMinimumContract(selectedFighter, championships, fights);

    return (
      <Box sx={{ 
        mt: 2, 
        p: 2, 
        bgcolor: 'info.light', 
        borderRadius: 1,
        color: 'info.contrastText'
      }}>
        <Typography variant="subtitle2" gutterBottom>
          Minimum Contract Requirements:
        </Typography>
        <Typography variant="body2">
          Base Pay: {formatCurrency(minBase)}
        </Typography>
        <Typography variant="body2">
          Win Bonus: {formatCurrency(minWin)}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Or total base pay of {formatCurrency(minBase + minWin)}
        </Typography>
      </Box>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {selectedFighter ? 
          `${selectedFighter.firstname} ${selectedFighter.lastname} - Contract Negotiation` :
          'Contract Negotiation'
        }
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {renderMinimumRequirements()}

          {/* Base Pay Field */}
          <FormControl fullWidth>
            <TextField
              label="Base Pay"
              type="number"
              value={newContract.amount}
              onChange={(e) => onContractUpdate('amount', parseInt(e.target.value) || 0)}
              InputProps={{
                startAdornment: <Typography>$</Typography>,
                inputProps: {
                  step: 1000,
                  min: 0
                }
              }}
            />
          </FormControl>

          {/* Number of Fights Field */}
          <FormControl fullWidth>
            <TextField
              label="Number of Fights"
              type="number"
              value={newContract.fightsOffered}
              onChange={(e) => onContractUpdate('fightsOffered', parseInt(e.target.value) || 1)}
              inputProps={{
                step: 1,
                min: 1,
                max: 8
              }}
            />
          </FormControl>

          {/* Bonuses Section */}
          <Typography variant="h6">Bonuses</Typography>
          <Grid container spacing={2}>
            {/* Win Bonus */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Win Bonus"
                type="number"
                value={newContract.bonuses.winBonus}
                onChange={(e) => onContractUpdate('bonus.winBonus', parseInt(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <Typography>$</Typography>,
                  inputProps: {
                    min: 0
                  }
                }}
              />
            </Grid>
          </Grid>

          {/* Counter Offer Display */}
          {counterOffer && (
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: 'grey.100', 
              borderRadius: 1,
              border: '1px solid rgba(0, 0, 0, 0.12)'
            }}>
              <Typography variant="h6" gutterBottom>
                Fighter Counter-Offer
              </Typography>
              <Typography>Base Pay: {formatCurrency(counterOffer.amount)}</Typography>
              <Typography>Fights Requested: {counterOffer.fightsOffered}</Typography>
              <Typography>Win Bonus: {formatCurrency(counterOffer.bonuses.winBonus)}</Typography>
            </Box>
          )}

          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Negotiation Round: {negotiationRound}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        {counterOffer && (
          <Button 
            onClick={onAcceptCounter}
            color="primary"
          >
            Accept Counter
          </Button>
        )}
        <Button 
          onClick={onSendOffer}
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
  );
});

// Add display name for debugging purposes
NegotiationDialog.displayName = 'NegotiationDialog';

export default NegotiationDialog;