"use client";
import React, { useEffect, useState } from 'react';
import MainNav from '@/components/MainNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert } from '@mui/material';
import { Delete } from '@mui/icons-material';

interface DisposalRecord {
  id: number;
  asset_id: number;
  asset_name: string;
  disposal_date: string;
  method: string;
  reason: string;
  proceeds: number;
  status: string;
  created_at: string;
}

export default function DisposalReportPage() {
  const [records, setRecords] = useState<DisposalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('http://localhost:8000/disposals', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (!response.ok) throw new Error('Failed to fetch disposal records');
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
  const completed = records.filter(r => r.status === 'completed').length;
  const pending = records.filter(r => r.status === 'pending').length;
  const totalProceeds = records.reduce((sum, r) => sum + (r.proceeds || 0), 0);

  return (
    <ProtectedRoute>
      <MainNav />
      <Box p={3}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Delete color="primary" /> Disposal Reports
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px"><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            {/* Stats Cards */}
            <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
              <Card><CardContent><Typography color="textSecondary" gutterBottom>Total Disposals</Typography><Typography variant="h4">{total}</Typography></CardContent></Card>
              <Card><CardContent><Typography color="textSecondary" gutterBottom>Completed</Typography><Typography variant="h4" color="success.main">{completed}</Typography></CardContent></Card>
              <Card><CardContent><Typography color="textSecondary" gutterBottom>Pending</Typography><Typography variant="h4" color="warning.main">{pending}</Typography></CardContent></Card>
              <Card><CardContent><Typography color="textSecondary" gutterBottom>Total Proceeds</Typography><Typography variant="h4" color="primary">₦{totalProceeds.toLocaleString('en-NG')}</Typography></CardContent></Card>
            </Box>
            {/* Table */}
            <Typography variant="h6" sx={{ mb: 2 }}>Disposal Summary Table</Typography>
            <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Asset</TableCell>
                    <TableCell>Disposal Date</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Proceeds</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{r.id}</TableCell>
                      <TableCell>{r.asset_name}</TableCell>
                      <TableCell>{new Date(r.disposal_date).toLocaleDateString()}</TableCell>
                      <TableCell>{r.method}</TableCell>
                      <TableCell>{r.reason}</TableCell>
                      <TableCell>₦{r.proceeds.toLocaleString('en-NG')}</TableCell>
                      <TableCell>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</TableCell>
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