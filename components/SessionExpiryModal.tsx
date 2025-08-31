import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, CircularProgress } from '@mui/material';

interface SessionExpiryModalProps {
  open: boolean;
  countdown: number;
  onLogout: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const SessionExpiryModal: React.FC<SessionExpiryModalProps> = ({ open, countdown, onLogout, onRefresh, refreshing }) => {
  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogTitle>Session Expiring Soon</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Your session will expire in <b>{countdown}</b> seconds.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please save your work. You will be logged out automatically when the timer reaches zero.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onLogout} color="error" variant="contained" disabled={refreshing}>
          Log Out Now
        </Button>
        <Button onClick={onRefresh} color="primary" variant="contained" disabled={refreshing}>
          {refreshing ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
          Refresh Session
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionExpiryModal; 