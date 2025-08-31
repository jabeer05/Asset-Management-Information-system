"use client";
import React, { useEffect, useState } from 'react';
import MainNav from '@/components/MainNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert } from '@mui/material';
import { Build } from '@mui/icons-material';

interface MaintenanceRecord {
  id: number;
  asset_id: number;
  asset_name: string;
  description?: string;
  maintenance_type: string;
  status: string;
  scheduled_date: string;
  completion_date?: string;
  cost?: number;
  vendor?: string;
  created_by: number;
  created_at: string;
}

export default function MaintenanceReportPage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('http://localhost:8000/maintenance/', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (!response.ok) throw new Error('Failed to fetch maintenance records');
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
  const overdue = records.filter(r => r.status === 'pending' && new Date(r.scheduled_date) < new Date()).length;
  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);

  return (
    <ProtectedRoute>
      <MainNav />
      <Box p={3}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Build color="primary" /> Maintenance Reports
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px"><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            {/* Stats Cards */}
            <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
              <Card><CardContent><Typography color="textSecondary" gutterBottom>Total Records</Typography><Typography variant="h4">{total}</Typography></CardContent></Card>
              <Card><CardContent><Typography color="textSecondary" gutterBottom>Completed</Typography><Typography variant="h4" color="success.main">{completed}</Typography></CardContent></Card>
              <Card><CardContent><Typography color="textSecondary" gutterBottom>Pending</Typography><Typography variant="h4" color="warning.main">{pending}</Typography></CardContent></Card>
              <Card><CardContent><Typography color="textSecondary" gutterBottom>Overdue</Typography><Typography variant="h4" color="error.main">{overdue}</Typography></CardContent></Card>
              <Card><CardContent><Typography color="textSecondary" gutterBottom>Total Cost</Typography><Typography variant="h4" color="primary">₦{totalCost.toLocaleString('en-NG')}</Typography></CardContent></Card>
            </Box>
            {/* Table */}
            <Typography variant="h6" sx={{ mb: 2 }}>Maintenance Summary Table</Typography>
            <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Asset</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Scheduled</TableCell>
                    <TableCell>Completed</TableCell>
                    <TableCell>Cost</TableCell>
                    <TableCell>Vendor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{r.id}</TableCell>
                      <TableCell>{r.asset_name}</TableCell>
                      <TableCell>{r.maintenance_type}</TableCell>
                      <TableCell>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</TableCell>
                      <TableCell>{new Date(r.scheduled_date).toLocaleDateString()}</TableCell>
                      <TableCell>{r.completion_date ? new Date(r.completion_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{r.cost ? `₦${r.cost.toLocaleString('en-NG')}` : '-'}</TableCell>
                      <TableCell>{r.vendor || '-'}</TableCell>
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