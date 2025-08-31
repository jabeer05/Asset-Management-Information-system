"use client";
import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Button,
  Divider,
  Alert
} from '@mui/material';
import {
  Build,
  Schedule,
  Assignment,
  Warning,
  Edit,
  ArrowBack,
  CheckCircle,
  Pending,
  ErrorOutline
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface MaintenanceRecord {
  id: number;
  asset_id: number;
  asset_name: string;
  asset_category?: string;
  maintenance_type: 'preventive' | 'corrective' | 'emergency' | 'inspection';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  performed_by: string;
  maintenance_date: string;
  start_date?: string;
  completion_date?: string;
  cost: number;
  vendor?: string;
  notes?: string;
  next_maintenance_date?: string;
}

interface MaintenanceDetailProps {
  maintenanceId: number;
}

export default function MaintenanceDetail({ maintenanceId }: MaintenanceDetailProps) {
  const router = useRouter();
  const [record, setRecord] = useState<MaintenanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${API_BASE_URL}/maintenance/${maintenanceId}/`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) throw new Error("Failed to fetch maintenance record");
        const data = await res.json();
        setRecord(data);
      } catch (e: any) {
        setError(e.message || "Failed to fetch maintenance record");
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [maintenanceId]);

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Alert severity="error">{typeof error === 'string' ? error : String(error)}</Alert>;
  if (!record || typeof record !== 'object') return <Alert severity="warning">No record found.</Alert>;

  const formatCurrency = (value: number | undefined | null) => {
    if (typeof value !== 'number' || isNaN(value)) return '₦0.00';
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
      case 'in_progress': return 'info';
      case 'scheduled': return 'primary';
      case 'overdue': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    if (!type) return <Build />;
    switch (type) {
      case 'preventive': return <Schedule />;
      case 'corrective': return <Build />;
      case 'emergency': return <Warning />;
      case 'inspection': return <Assignment />;
      default: return <Build />;
    }
  };

  const getStatusIcon = (status: string) => {
    if (!status) return <Pending />;
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'in_progress': return <Pending />;
      case 'scheduled': return <Schedule />;
      case 'overdue': return <ErrorOutline />;
      case 'cancelled': return <ErrorOutline />;
      default: return <Pending />;
    }
  };

  const getTimelineEvents = () => {
    const events = [
      {
        date: record.maintenance_date,
        title: 'Maintenance Scheduled',
        description: `Maintenance scheduled for ${formatDate(record.maintenance_date)}`,
        icon: <Schedule />,
        color: 'primary'
      }
    ];

    if (record.start_date) {
      events.push({
        date: record.start_date,
        title: 'Work Started',
        description: `Maintenance work began on ${formatDate(record.start_date)}`,
        icon: <Build />,
        color: 'info'
      });
    }

    if (record.completion_date) {
      events.push({
        date: record.completion_date,
        title: 'Work Completed',
        description: `Maintenance completed on ${formatDate(record.completion_date)}`,
        icon: <CheckCircle />,
        color: 'success'
      });
    }

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  return (
    <Box>
      {/* Header: Key Info */}
      <Card sx={{ mb: 3, p: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mb: { xs: 2, md: 0 } }}
        >
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getTypeIcon(record.maintenance_type)}
            Maintenance #{record.id}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            <Chip label={record.maintenance_type ? record.maintenance_type.charAt(0).toUpperCase() + record.maintenance_type.slice(1) : ''} icon={getTypeIcon(record.maintenance_type)} color="primary" size="small" />
            <Chip label={record.status ? record.status.replace('_', ' ').toUpperCase() : ''} icon={getStatusIcon(record.status)} color={getStatusColor(record.status) as any} size="small" />
            <Chip label={record.priority ? record.priority.toUpperCase() : ''} color={getPriorityColor(record.priority) as any} size="small" />
            <Chip label={`Assigned: ${record.performed_by || 'N/A'}`} color="info" size="small" />
            <Chip label={`Scheduled: ${formatDate(record.maintenance_date)}`} color="default" size="small" />
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={() => router.push(`/maintenance/${record.id}/edit`)}
        >
          Edit
        </Button>
      </Card>

      {/* Main Content Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        {/* Left: Details */}
        <Box>
          {/* Asset Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6">Asset Information</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => router.push(`/assets/${record.asset_id}`)}
                >
                  View Asset
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">Asset</Typography>
              <Typography variant="body1" fontWeight="medium">{record.asset_name}</Typography>
              <Typography variant="caption" color="text.secondary">{record.asset_category}</Typography>
            </CardContent>
          </Card>

          {/* Maintenance Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Maintenance Details</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">Description</Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>{record.description}</Typography>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Maintenance Timeline</Typography>
              <Divider sx={{ mb: 2 }} />
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
                      <Typography variant="body2" color="text.secondary">{formatDate(event.date)}</Typography>
                      <Typography variant="h6" component="span">{event.title}</Typography>
                      <Typography variant="body2">{event.description}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Right: Sidebar */}
        <Box>
          {/* Assignment & Schedule */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Assignment & Schedule</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">Assigned To</Typography>
              <Typography variant="body1" fontWeight="medium">{record.performed_by}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Scheduled Date</Typography>
              <Typography variant="body1" fontWeight="medium">{formatDate(record.maintenance_date)}</Typography>
              {record.start_date && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Start Date</Typography>
                  <Typography variant="body1" fontWeight="medium">{formatDate(record.start_date)}</Typography>
                </>
              )}
              {record.completion_date && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Completion Date</Typography>
                  <Typography variant="body1" fontWeight="medium">{formatDate(record.completion_date)}</Typography>
                </>
              )}
              {record.next_maintenance_date && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Next Maintenance</Typography>
                  <Typography variant="body1" fontWeight="medium">{formatDate(record.next_maintenance_date)}</Typography>
                </>
              )}
            </CardContent>
          </Card>

          {/* Cost & Vendor */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Cost & Vendor</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">Estimated Cost</Typography>
              <Typography variant="h5" color="primary.main" fontWeight="bold">{formatCurrency(record.cost)}</Typography>
              {record.vendor && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Vendor/Service Provider</Typography>
                  <Typography variant="body1" fontWeight="medium">{record.vendor}</Typography>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {record.notes && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Additional Notes</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2">{record.notes}</Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
} 