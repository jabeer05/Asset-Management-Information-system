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
  CircularProgress
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import {
  SwapHoriz,
  Schedule,
  CheckCircle,
  Edit,
  ArrowBack,
  Pending,
  ErrorOutline,
  Refresh
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

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

interface TransferDetailProps {
  transferId: number;
}



export default function TransferDetail({ transferId }: TransferDetailProps) {
  const router = useRouter();
  const [record, setRecord] = useState<TransferRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTransferRecord();
  }, [transferId]);

  const fetchTransferRecord = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      
      if (!token) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        setRefreshing(false);
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
        setRefreshing(false);
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch transfer record: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      setRecord(data);
    } catch (err: any) {
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? String(err.message) 
        : 'Failed to fetch transfer record';
      setError(errorMessage);
      console.error('Transfer detail fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `₦${value.toLocaleString('en-NG')}`;
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
          <Button color="inherit" size="small" onClick={() => fetchTransferRecord(true)}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!record) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        Transfer record not found.
      </Alert>
    );
  }

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
      case 'in_progress': return 'info';
      case 'approved': return 'primary';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'internal': return 'primary';
      case 'external': return 'secondary';
      case 'temporary': return 'info';
      case 'permanent': return 'success';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'internal': return <SwapHoriz />;
      case 'external': return <SwapHoriz />;
      case 'temporary': return <Schedule />;
      case 'permanent': return <CheckCircle />;
      default: return <SwapHoriz />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'in_progress': return <Pending />;
      case 'approved': return <CheckCircle />;
      case 'pending': return <Schedule />;
      case 'cancelled': return <ErrorOutline />;
      case 'rejected': return <ErrorOutline />;
      default: return <Pending />;
    }
  };

  const getTimelineEvents = () => {
    const events = [
      {
        date: record.request_date,
        title: 'Transfer Requested',
        description: `Transfer request submitted on ${formatDate(record.request_date)}`,
        icon: <Schedule />,
        color: 'primary'
      }
    ];

    if (record.approved_date) {
      events.push({
        date: record.approved_date,
        title: 'Transfer Approved',
        description: `Transfer approved by ${record.approval_by} on ${formatDate(record.approved_date)}`,
        icon: <CheckCircle />,
        color: 'success'
      });
    }

    if (record.transfer_date) {
      events.push({
        date: record.transfer_date,
        title: 'Transfer Started',
        description: `Transfer process began on ${formatDate(record.transfer_date)}`,
        icon: <SwapHoriz />,
        color: 'info'
      });
    }

    if (record.completion_date) {
      events.push({
        date: record.completion_date,
        title: 'Transfer Completed',
        description: `Transfer completed on ${formatDate(record.completion_date)}`,
        icon: <CheckCircle />,
        color: 'success'
      });
    }

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
            {getTypeIcon(record.transfer_type)}
            Transfer Record #{record.id}
          </Typography>

        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => fetchTransferRecord(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => router.push(`/transfers/${record.id}/edit`)}
          >
            Edit
          </Button>
        </Box>
      </Box>

      {/* Status Alert */}
      {record.status === 'pending' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This transfer request is pending approval.
        </Alert>
      )}

      {record.status === 'in_progress' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          This transfer is currently in progress.
        </Alert>
      )}

      {record.status === 'cancelled' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          This transfer has been cancelled.
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        {/* Main Information */}
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transfer Details
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Asset
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {record.asset_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {record.asset_category}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Transfer Type
                  </Typography>
                  <Chip
                    icon={getTypeIcon(record.transfer_type)}
                    label={record.transfer_type.charAt(0).toUpperCase() + record.transfer_type.slice(1)}
                    color={getTypeColor(record.transfer_type) as any}
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    icon={getStatusIcon(record.status)}
                    label={record.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(record.status) as any}
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Request Date
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(record.request_date)}
                  </Typography>
                </Box>

                <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                  <Typography variant="body2" color="text.secondary">
                    Reason
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {record.reason}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transfer Timeline
              </Typography>
              
              <Box>
                {getTimelineEvents().map((event, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: `${event.color}.main`,
                      color: 'white',
                      mr: 2,
                      flexShrink: 0
                    }}>
                      {event.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(event.date)}
                      </Typography>
                      <Typography variant="h6" component="span">
                        {event.title}
                      </Typography>
                      <Typography variant="body2">{event.description}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Sidebar Information */}
        <Box>
          {/* From Location */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                From Location
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {record.from_location}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Department
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {record.from_department}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Custodian
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {record.from_custodian}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* To Location */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                To Location
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {record.to_location}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Department
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {record.to_department}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Custodian
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {record.to_custodian}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Cost Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cost Information
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Estimated Cost
                </Typography>
                <Typography variant="h5" color="primary.main" fontWeight="bold">
                  {record.estimated_cost ? formatCurrency(record.estimated_cost) : '₦0'}
                </Typography>
              </Box>

              {record.actual_cost && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Actual Cost
                  </Typography>
                  <Typography variant="h5" color="success.main" fontWeight="bold">
                    {formatCurrency(record.actual_cost)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {record.notes && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Additional Notes
                </Typography>
                <Typography variant="body2">
                  {record.notes}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
} 