"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import { ArrowBack, CheckCircle } from '@mui/icons-material';
import TransferForm from '@/components/TransferForm';

interface TransferRecord {
  id: number;
  asset_id: number;
  asset_name: string;
  asset_category: string;
  transfer_type: 'internal' | 'external' | 'temporary' | 'permanent';
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  from_location: string;
  to_location: string;
  from_department: string;
  to_department: string;
  from_custodian: string;
  to_custodian: string;
  request_date: string;
  approved_date?: string;
  transfer_date?: string;
  completion_date?: string;
  reason: string;
  notes?: string;
  estimated_cost?: number;
  actual_cost?: number;
  approval_by?: string;
}

interface EditTransferPageProps {
  params: {
    id: string;
  };
}

export default function TransferEditPage({ params }: EditTransferPageProps) {
  const router = useRouter();
  
  const transferId = params.id;
  
  const [transfer, setTransfer] = useState<TransferRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (transferId) {
      fetchTransferRecord();
    }
  }, [transferId]);

  const fetchTransferRecord = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      
      if (!token) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/transfer_requests/${transferId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch transfer record: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      setTransfer(data);
    } catch (err: any) {
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? String(err.message) 
        : 'Failed to fetch transfer record';
      setError(errorMessage);
      console.error('Transfer fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setUpdating(true);
      setError(null);

      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      
      if (!token) {
        setError('Authentication required. Please log in.');
        setUpdating(false);
        return;
      }

      console.log('Updating transfer:', data);

      const response = await fetch(`/api/transfer_requests/${transferId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          asset_id: parseInt(data.asset_id),
          from_location: data.from_location,
          to_location: data.to_location,
          reason: data.reason,
          notes: data.notes || '',
          transfer_type: data.transfer_type
        })
      });

      if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        setUpdating(false);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update transfer: ${response.status} ${errorText}`);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/transfers/${transferId}`);
      }, 2000);
    } catch (err: any) {
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? String(err.message) 
        : 'Failed to update transfer';
      setError(errorMessage);
      console.error('Transfer update error:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ mb: 3 }}
        action={
          <Button color="inherit" size="small" onClick={fetchTransferRecord}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!transfer) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        Transfer record not found.
      </Alert>
    );
  }

  if (success) {
    return (
      <Alert severity="success" sx={{ mb: 3 }}>
        Transfer updated successfully! Redirecting...
      </Alert>
    );
  }

  // Map transfer data to form default values
  const defaultValues = {
    asset_id: transfer.asset_id,
    asset_name: transfer.asset_name,
    transfer_type: transfer.transfer_type,
    from_location: transfer.from_location,
    to_location: transfer.to_location,
    reason: transfer.reason,
    notes: transfer.notes || ''
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
        >
          Back
        </Button>
        <Box>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Edit Transfer Record #{transfer.id}
          </Typography>

        </Box>
      </Box>

      {/* Form */}
      <TransferForm
        onSubmit={handleSubmit}
        defaultValues={defaultValues}
        title="Edit Transfer Request"
        mode="edit"
      />
    </Box>
  );
} 