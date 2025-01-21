// src/components/NegotiationDialog.jsx
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

/**
 * NegotiationDialog Component
 * Handles contract negotiations with fighters
 * 
 * @param {Object} props
 * @param {boolean} props.open - Controls dialog visibility
 * @param {Function} props.onClose - Handler for closing dialog
 * @param {Object} props.selectedFighter - Currently selected fighter
 * @param {Object} props.newContract - Current contract offer
 * @param {Function} props.onContractUpdate - Handler for contract updates
 * @param {Function} props.onSendOffer - Handler for sending offers
 * @param {Function} props.onAcceptCounter - Handler for accepting counter offers
 * @param {Object} props.counterOffer - Current counter offer if any
 * @param {number} props.negotiationRound - Current negotiation round
 * @param {Function} props.formatCurrency - Currency formatting helper
 */
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
  formatCurrency
}) => {
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
          {/* Fight Purse Field */}
          <FormControl fullWidth>
            <TextField
              label="Fight Purse"
              type="number"
              value={newContract.amount}
              onChange={(e) => onContractUpdate('amount', parseInt(e.target.value) || 0)}
              inputProps={{
                step: 1000,
                min: 12000
              }}
              InputProps={{
                startAdornment: <Typography>$</Typography>
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
          <Typography variant="h6">Bonuses & Incentives</Typography>
          <Grid container spacing={2}>
            {/* Signing Bonus */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Signing Bonus"
                type="number"
                value={newContract.signingBonus}
                onChange={(e) => onContractUpdate('signingBonus', parseInt(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <Typography>$</Typography>
                }}
              />
            </Grid>

            {/* Win Bonus */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Win Bonus"
                type="number"
                value={newContract.bonuses.winBonus}
                onChange={(e) => onContractUpdate('bonus.winBonus', parseInt(e.target.value) || 0)}
                inputProps={{
                  min: newContract.amount >= 25000 ? 0 : 12000
                }}
                InputProps={{
                  startAdornment: <Typography>$</Typography>
                }}
              />
            </Grid>

            {/* Finish Bonus */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Finish Bonus"
                type="number"
                value={newContract.bonuses.finishBonus}
                onChange={(e) => onContractUpdate('bonus.finishBonus', parseInt(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <Typography>$</Typography>
                }}
              />
            </Grid>

            {/* Performance Bonus */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Performance Bonus"
                type="number"
                value={newContract.bonuses.performanceBonus}
                onChange={(e) => onContractUpdate('bonus.performanceBonus', parseInt(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <Typography>$</Typography>
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
              <Typography>Fight Purse: {formatCurrency(counterOffer.amount)}</Typography>
              <Typography>Fights Requested: {counterOffer.fightsOffered}</Typography>
              <Typography>Signing Bonus: {formatCurrency(counterOffer.signingBonus)}</Typography>
              <Typography>Win Bonus: {formatCurrency(counterOffer.bonuses.winBonus)}</Typography>
              <Typography>Finish Bonus: {formatCurrency(counterOffer.bonuses.finishBonus)}</Typography>
              <Typography>Performance Bonus: {formatCurrency(counterOffer.bonuses.performanceBonus)}</Typography>
            </Box>
          )}

          {/* Negotiation Round Display */}
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Negotiation Round: {negotiationRound}
          </Typography>
        </Box>
      </DialogContent>

      {/* Dialog Actions */}
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