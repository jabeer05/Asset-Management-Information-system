"use client";
import React, { useEffect, useState } from 'react';
import MainNav from '@/components/MainNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert } from '@mui/material';
import { SwapHoriz } from '@mui/icons-material';

interface TransferRecord {
  id: number;
  asset_id: number;
  asset_name: string;
  transfer_type: string;
  from_location: string;
  to_location: string;
  request_date: string;
  transfer_date?: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function TransferReportPage() {
  const [records, setRecords] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('/api/transfer_requests', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (!response.ok) throw new Error('Failed to fetch transfer records');
      const data = await response.json();
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const total = records.length;
  const pending = records.filter(r => r.status === 'pending').length;
  const approved = records.filter(r => r.status === 'approved').length;
  const completed = records.filter(r => r.status === 'completed').length;
  const rejected = records.filter(r => r.status === 'rejected').length;

  return (
    <ProtectedRoute>
      <MainNav />
      <Box p={3}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SwapHoriz color="primary" /> Transfer Reports
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px"><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            {/* Stats Cards */}
            <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
              <Card><CardContent><Typography color="textSecondary" gutterBottom>Total Transfers</Typography><Typography variant="h4">{total}</Typography></CardContent></Card>
              <Card><CardContent><Typography color="textSecondary" gutterBottom>Pending</Typography><Typography variant="h4" color="warning.main">{pending}</Typography></CardContent></Card>
              <Card><CardContent><Typography color="textSecondary" gutterBottom>Approved</Typography><Typography variant="h4" color="info.main">{approved}</Typography></CardContent></Card>
              <Card><CardContent><Typography color="textSecondary" gutterBottom>Completed</Typography><Typography variant="h4" color="success.main">{completed}</Typography></CardContent></Card>
              <Card><CardContent><Typography color="textSecondary" gutterBottom>Rejected</Typography><Typography variant="h4" color="error.main">{rejected}</Typography></CardContent></Card>
            </Box>
            {/* Table */}
            <Typography variant="h6" sx={{ mb: 2 }}>Transfer Summary Table</Typography>
            <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Asset</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>From Location</TableCell>
                    <TableCell>To Location</TableCell>
                    <TableCell>Request Date</TableCell>
                    <TableCell>Transfer Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{r.id}</TableCell>
                      <TableCell>{r.asset_name}</TableCell>
                      <TableCell>{r.transfer_type.charAt(0).toUpperCase() + r.transfer_type.slice(1)}</TableCell>
                      <TableCell>{r.from_location}</TableCell>
                      <TableCell>{r.to_location}</TableCell>
                      <TableCell>{new Date(r.request_date).toLocaleDateString()}</TableCell>
                      <TableCell>{r.transfer_date ? new Date(r.transfer_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</TableCell>
                      <TableCell>{r.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>
    </ProtectedRoute>
  );
} 