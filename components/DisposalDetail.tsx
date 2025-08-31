"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
  Alert,
  Avatar,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Recycling,
  Edit,
  ArrowBack,
  CheckCircle,
  Pending,
  ErrorOutline,
  AttachMoney,
  Warning,
  LocationOn,
  Person
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface DisposalRecord {
  id: number;
  asset_id: number;
  asset_name: string;
  asset_category: string;
  asset_location: string;
  disposal_method_name: string;
  disposal_date: string;
  disposal_reason: string;
  estimated_proceeds?: number;
  actual_proceeds?: number;
  disposal_cost?: number;
  net_proceeds?: number;
  status: string;
  buyer_info?: string;
  disposal_notes?: string;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  method: string;
  proceeds?: number;
}

interface DisposalDetailProps {
  disposalId: number;
}

export default function DisposalDetail({ disposalId }: DisposalDetailProps) {
  const router = useRouter();
  const [record, setRecord] = useState<DisposalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDisposalRecord = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        const response = await fetch(`${API_BASE_URL}/disposals/${disposalId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch disposal record: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Fetched disposal record:', data);
        setRecord(data);
      } catch (err) {
        console.error('Error fetching disposal record:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching the disposal record');
      } finally {
        setLoading(false);
      }
    };

    if (disposalId) {
      fetchDisposalRecord();
    }
  }, [disposalId]);

  const formatCurrency = (value: number) => {
    return `₦${value.toLocaleString('en-NG')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'approved': return 'primary';
      case 'in_progress': return 'info';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sale': return 'success';
      case 'donation': return 'primary';
      case 'destruction': return 'error';
      case 'recycling': return 'info';
      case 'trade_in': return 'secondary';
      case 'scrap': return 'warning';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sale': return <AttachMoney />;
      case 'donation': return <CheckCircle />;
      case 'destruction': return <Warning />;
      case 'recycling': return <Recycling />;
      case 'trade_in': return <AttachMoney />;
      case 'scrap': return <Recycling />;
      default: return <Recycling />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'approved': return <CheckCircle />;
      case 'in_progress': return <Pending />;
      case 'pending': return <Pending />;
      case 'cancelled': return <ErrorOutline />;
      case 'rejected': return <ErrorOutline />;
      default: return <Pending />;
    }
  };



  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  // Show not found state
  if (!record) {
    return (
      <Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Alert severity="warning">
          Disposal record not found
        </Alert>
      </Box>
    );
  }

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
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getTypeIcon(record.disposal_method_name)}
          Disposal #{record.id}
        </Typography>
        <Box sx={{ ml: 'auto' }}>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => router.push(`/disposals/${record.id}/edit`)}
          >
            Edit
          </Button>
        </Box>
      </Box>

      {/* Status Alert */}
      {record.status === 'completed' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Disposal completed successfully! Net proceeds: {formatCurrency(record.net_proceeds || 0)}
        </Alert>
      )}

      {record.status === 'pending' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This disposal is pending approval.
        </Alert>
      )}

      {record.status === 'cancelled' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          This disposal has been cancelled.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Information */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Disposal Details
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Asset
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {record.asset_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {record.asset_category}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Disposal Method
                  </Typography>
                  <Chip
                    icon={getTypeIcon(record.disposal_method_name)}
                    label={record.disposal_method_name}
                    color={getTypeColor(record.disposal_method_name) as any}
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    icon={getStatusIcon(record.status)}
                    label={record.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(record.status) as any}
                    sx={{ mt: 0.5 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Asset Location
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" sx={{ mt: 0.5 }}>
                    {record.asset_location || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Disposal Reason
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {record.disposal_reason}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Disposal Method
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" sx={{ mt: 0.5 }}>
                    {record.disposal_method_name}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Financial Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Estimated Proceeds
                  </Typography>
                  <Typography variant="h5" color="primary.main" fontWeight="bold">
                    {formatCurrency(record.estimated_proceeds || 0)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Disposal Cost
                  </Typography>
                  <Typography variant="h5" color="error.main" fontWeight="bold">
                    {formatCurrency(record.disposal_cost || 0)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Net Proceeds
                  </Typography>
                  <Typography 
                    variant="h5" 
                    color={(record.net_proceeds || 0) >= 0 ? 'success.main' : 'error.main'} 
                    fontWeight="bold"
                  >
                    {formatCurrency(record.net_proceeds || 0)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Notes */}
          {record.disposal_notes && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Additional Notes
                </Typography>
                <Typography variant="body2">
                  {record.disposal_notes}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar Information */}
        <Grid item xs={12} md={4}>
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2}>
            {/* Disposal Information */}
            <Card sx={{ flex: 1, minWidth: 250 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Disposal Information
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Disposal Date
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(record.disposal_date)}
                  </Typography>
                </Box>
                {record.buyer_info && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Buyer/Recipient
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {record.buyer_info}
                    </Typography>
                  </Box>
                )}
                {record.approved_by_name && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Approved By
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {record.approved_by_name}
                    </Typography>
                  </Box>
                )}
                {record.created_by_name && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Created By
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {record.created_by_name}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(record.created_at)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
            {/* Asset Information */}
            <Card sx={{ flex: 1, minWidth: 250 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Asset Information
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Asset ID
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    #{record.asset_id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Asset Category
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {record.asset_category}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
            {/* Quick Actions */}
            <Card sx={{ flex: 1, minWidth: 250 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => router.push(`/disposals/${record.id}/edit`)}
                    fullWidth
                  >
                    Edit Disposal
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Person />}
                    onClick={() => router.push(`/assets/${record.asset_id}`)}
                    fullWidth
                  >
                    View Asset
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
} 