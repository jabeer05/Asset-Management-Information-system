"use client";
import React, { useEffect, useState } from 'react';
import MainNav from '@/components/MainNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert } from '@mui/material';
import { Gavel } from '@mui/icons-material';

interface AuctionRecord {
  id: number;
  asset_id: number;
  asset_name: string;
  auction_date: string;
  starting_bid: number;
  final_bid?: number;
  winner?: string;
  status: string;
  location?: string;
  created_at: string;
}

export default function AuctionReportPage() {
  const [records, setRecords] = useState<AuctionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('/api/auctions', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (!response.ok) throw new Error('Failed to fetch auction records');
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
  const scheduled = records.filter(r => r.status === 'scheduled').length;
  const cancelled = records.filter(r => r.status === 'cancelled').length;
  const totalRevenue = records.reduce((sum, r) => sum + (r.final_bid || 0), 0);

  return (
    <ProtectedRoute>
      <MainNav />
      <Box p={3}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Gavel color="primary" /> Auction Reports
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px"><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            {/* Stats Cards */}
            <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
              <Card><CardContent><Typography color="textSecondary" gutterBottom>Total Auctions</Typography><Typography variant="h4">{total}</Typography></CardContent></Card>
              <Card><CardContent><Typography color="textSecondary" gutterBottom>Completed</Typography><Typography variant="h4" color="success.main">{completed}</Typography></CardContent></Card>
              <Card><CardContent><Typography color="textSecondary" gutterBottom>Scheduled</Typography><Typography variant="h4" color="info.main">{scheduled}</Typography></CardContent></Card>
              <Card><CardContent><Typography color="textSecondary" gutterBottom>Cancelled</Typography><Typography variant="h4" color="error.main">{cancelled}</Typography></CardContent></Card>
              <Card><CardContent><Typography color="textSecondary" gutterBottom>Total Revenue</Typography><Typography variant="h4" color="primary">₦{totalRevenue.toLocaleString('en-NG')}</Typography></CardContent></Card>
            </Box>
            {/* Table */}
            <Typography variant="h6" sx={{ mb: 2 }}>Auction Summary Table</Typography>
            <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Asset</TableCell>
                    <TableCell>Auction Date</TableCell>
                    <TableCell>Starting Bid</TableCell>
                    <TableCell>Final Bid</TableCell>
                    <TableCell>Winner</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{r.id}</TableCell>
                      <TableCell>{r.asset_name}</TableCell>
                      <TableCell>{new Date(r.auction_date).toLocaleDateString()}</TableCell>
                      <TableCell>₦{r.starting_bid.toLocaleString('en-NG')}</TableCell>
                      <TableCell>{r.final_bid ? `₦${r.final_bid.toLocaleString('en-NG')}` : '-'}</TableCell>
                      <TableCell>{r.winner || '-'}</TableCell>
                      <TableCell>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</TableCell>
                      <TableCell>{r.location || '-'}</TableCell>
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