"use client";
import React from "react";
import { Box } from "@mui/material";
import MainNav from "../../../components/MainNav";
import MaintenanceDetail from "../../../components/MaintenanceDetail";
import { useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import SSRSafeDialog from '@/components/SSRSafeDialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

interface MaintenanceDetailPageProps {
  params: any;
}

export default function MaintenanceDetailPage({ params }: MaintenanceDetailPageProps) {
  
  const id = params.id;
  
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const { fetchNotifications } = useNotifications();

  const maintenanceId = parseInt(id, 10);

  if (!maintenanceId || isNaN(maintenanceId)) {
    return (
      <>
        <MainNav />
        <Box p={3}>
          <Box sx={{ maxWidth: 600, margin: '0 auto' }}>
            <Box sx={{ p: 4, borderRadius: 4, boxShadow: 6, bgcolor: 'background.paper' }}>
              <h2>Invalid maintenance ID.</h2>
            </Box>
          </Box>
        </Box>
      </>
    );
  }

  const handleSendFeedback = async () => {
    // TODO: Replace with logic to get asset manager/admin user_id
    const recipientId = 1; // TEMP: hardcoded recipient
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    await fetch('http://localhost:8000/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: JSON.stringify({ user_id: recipientId, message: feedbackMsg })
    });
    setFeedbackOpen(false);
    setFeedbackMsg('');
    fetchNotifications();
  };

  return (
    <>
      <MainNav />
      <Box p={3}>
        <MaintenanceDetail maintenanceId={maintenanceId} />
        <Button onClick={() => setFeedbackOpen(true)}>Send Feedback</Button>
        <SSRSafeDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} title="Send Feedback">
          <div style={{ padding: '24px' }}>
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
              <Button onClick={handleSendFeedback} disabled={!feedbackMsg.trim()}>Send</Button>
            </div>
          </div>
        </SSRSafeDialog>
      </Box>
    </>
  );
} 