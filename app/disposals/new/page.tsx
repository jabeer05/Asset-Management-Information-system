"use client";
import React, { useState } from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import { useRouter } from "next/navigation";
import MainNav from '@/components/MainNav';
import DisposalForm from '@/components/DisposalForm';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function NewDisposalPage() {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      // Map frontend fields to backend DisposalCreate schema
      const payload = {
        asset_id: data.asset_id,
        disposal_date: data.disposal_date,
        method: data.disposal_method,
        reason: data.disposal_reason,
        proceeds: data.disposal_value || 0,
        status: data.status || "pending"
      };
      const response = await fetch('http://localhost:8000/disposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error('Failed to create disposal');
      }
      setSuccess('Disposal created successfully!');
      setError('');
      // Navigate back to disposals page after successful creation
      setTimeout(() => {
        router.push('/disposals');
      }, 1500); // Wait 1.5 seconds to show success message
    } catch (error) {
      setError('Error creating disposal: ' + (error as Error).message);
      setSuccess('');
    }
  };

  return (
    <ProtectedRoute>
      <MainNav />
      <Box p={3}>
        <DisposalForm 
          onSubmit={handleSubmit}
          title="Create New Disposal"
          mode="create"
        />
        <Snackbar
          open={!!success}
          autoHideDuration={4000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
        <Snackbar
          open={!!error}
          autoHideDuration={4000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </ProtectedRoute>
  );
} 