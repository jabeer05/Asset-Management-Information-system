"use client";
import React, { useState } from "react";
import { Box } from "@mui/material";
import MainNav from "@/components/MainNav";
import AuditDetail from "@/components/AuditDetail";
import ProtectedRoute from '@/components/ProtectedRoute';
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

interface AuditDetailPageProps {
  params: {
    id: string;
  };
}

export default function AuditDetailPage({ params }: AuditDetailPageProps) {
  
  const auditId = parseInt(params.id);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { fetchNotifications } = useNotifications();

  React.useEffect(() => {
    if (feedbackOpen) {
      fetch('http://localhost:8000/users?role=admin|manager&permission=audit', {
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
        <AuditDetail auditId={auditId} />
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
    </ProtectedRoute>
  );
} 