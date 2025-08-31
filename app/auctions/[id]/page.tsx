"use client";
import React, { useState } from "react";
import { Box } from "@mui/material";
import MainNav from "@/components/MainNav";
import AuctionDetail from "@/components/AuctionDetail";
import ProtectedRoute from '@/components/ProtectedRoute';
import { useNotifications } from '@/contexts/NotificationContext';
import SSRSafeDialog from '@/components/SSRSafeDialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

interface AuctionDetailPageProps {
  params: {
    id: string;
  };
}

export default function AuctionDetailPage({ params }: AuctionDetailPageProps) {
  const id = params.id;
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { fetchNotifications } = useNotifications();

  const auctionId = parseInt(id, 10);

  // Check if it's a valid auction ID
  if (!auctionId || isNaN(auctionId)) {
    return (
      <ProtectedRoute>
        <MainNav />
        <Box p={3}>
          <Box sx={{ maxWidth: 600, margin: '0 auto' }}>
            <Box sx={{ p: 4, borderRadius: 4, boxShadow: 6, bgcolor: 'background.paper' }}>
              <h2>Invalid auction ID.</h2>
            </Box>
          </Box>
        </Box>
      </ProtectedRoute>
    );
  }

  React.useEffect(() => {
    if (feedbackOpen) {
      fetch('http://localhost:8000/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => setRecipients(data))
        .catch(() => setRecipients([]));
    }
  }, [feedbackOpen]);

  const handleSendFeedback = async () => {
    await fetch('http://localhost:8000/notifications', {
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
    <ProtectedRoute>
      <MainNav />
      <Box p={3}>
        <AuctionDetail auctionId={auctionId} />
        <Button onClick={() => setFeedbackOpen(true)}>Send Feedback</Button>
        <SSRSafeDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} title="Send Feedback">
          <div style={{ padding: '24px' }}>
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
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <Button onClick={() => setFeedbackOpen(false)}>Cancel</Button>
              <Button onClick={handleSendFeedback} disabled={!feedbackMsg.trim() || !recipientId}>Send</Button>
            </div>
          </div>
        </SSRSafeDialog>
        <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
          <MuiAlert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
            Feedback sent successfully!
          </MuiAlert>
        </Snackbar>
      </Box>
    </ProtectedRoute>
  );
} 