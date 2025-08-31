"use client";
import React, { useState } from 'react';
import { Box } from "@mui/material";
import MainNav from "@/components/MainNav";
import TransferDetail from "@/components/TransferDetail";
import { useNotifications } from '@/contexts/NotificationContext';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

interface TransferDetailPageProps {
  params: {
    id: string;
  };
}

export default function TransferDetailPage({ params }: TransferDetailPageProps) {
  
  const transferId = parseInt(params.id);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { fetchNotifications } = useNotifications();

  React.useEffect(() => {
    if (feedbackOpen) {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      fetch(`${API_BASE_URL}/users?role=admin&role=manager&permission=transfers`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => setRecipients(data))
        .catch(() => setRecipients([]));
    }
  }, [feedbackOpen]);

  const handleSendFeedback = async () => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ user_id: recipientId, message: feedbackMsg })
    });
    setFeedbackOpen(false);
    setFeedbackMsg('');
    setRecipientId('');
    setSnackbarOpen(true);
    fetchNotifications();
  };

  return (
    <>
      <MainNav />
      <Box p={3}>
        <TransferDetail transferId={transferId} />
        <Button onClick={() => setFeedbackOpen(true)}>Send Feedback</Button>
        <Dialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)}>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogContent>
            <Select
              value={recipientId}
              onChange={e => setRecipientId(e.target.value)}
              displayEmpty
              fullWidth
              sx={{ mb: 2 }}
            >
              <MenuItem value="" disabled>Select recipient</MenuItem>
              {recipients.map((user) => (
                <MenuItem key={user.id} value={user.id}>{user.first_name} {user.last_name} ({user.role})</MenuItem>
              ))}
            </Select>
            <TextField
              autoFocus
              margin="dense"
              label="Feedback Message"
              type="text"
              fullWidth
              value={feedbackMsg}
              onChange={e => setFeedbackMsg(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFeedbackOpen(false)}>Cancel</Button>
            <Button onClick={handleSendFeedback} disabled={!feedbackMsg.trim() || !recipientId}>Send</Button>
          </DialogActions>
        </Dialog>
        <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
          <MuiAlert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
            Feedback sent successfully!
          </MuiAlert>
        </Snackbar>
      </Box>
    </>
  );
} 