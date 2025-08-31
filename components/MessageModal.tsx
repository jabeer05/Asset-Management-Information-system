"use client";
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Info,
  Warning,
  Close,
  Refresh,
  ArrowForward
} from '@mui/icons-material';

export interface MessageModalProps {
  open: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  details?: string;
  showRefresh?: boolean;
  showContinue?: boolean;
  continueText?: string;
  onContinue?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function MessageModal({
  open,
  onClose,
  type,
  title,
  message,
  details,
  showRefresh = false,
  showContinue = false,
  continueText = 'Continue',
  onContinue,
  autoClose = false,
  autoCloseDelay = 3000
}: MessageModalProps) {
  React.useEffect(() => {
    if (autoClose && open) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, open, autoCloseDelay, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle sx={{ color: 'success.main', fontSize: 48 }} />;
      case 'error':
        return <Error sx={{ color: 'error.main', fontSize: 48 }} />;
      case 'warning':
        return <Warning sx={{ color: 'warning.main', fontSize: 48 }} />;
      case 'info':
        return <Info sx={{ color: 'info.main', fontSize: 48 }} />;
      default:
        return <Info sx={{ color: 'info.main', fontSize: 48 }} />;
    }
  };

  const getSeverity = () => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getIcon()}
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <Alert severity={getSeverity()} sx={{ mb: 2 }}>
          <AlertTitle>{title}</AlertTitle>
          {message}
        </Alert>
        
        {details && (
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            bgcolor: 'grey.50', 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            <Typography variant="body2" color="text.secondary">
              {details}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        {showRefresh && (
          <Button
            onClick={() => window.location.reload()}
            startIcon={<Refresh />}
            variant="outlined"
          >
            Refresh Page
          </Button>
        )}
        
        {showContinue && (
          <Button
            onClick={handleContinue}
            variant="contained"
            startIcon={<ArrowForward />}
            sx={{ minWidth: 120 }}
          >
            {continueText}
          </Button>
        )}
        
        <Button
          onClick={onClose}
          variant={showContinue ? "outlined" : "contained"}
          sx={{ minWidth: 100 }}
        >
          {showContinue ? 'Close' : 'OK'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
