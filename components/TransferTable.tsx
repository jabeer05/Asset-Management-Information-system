"use client";
import React, { useState, useEffect } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Box,
  Button,
  Chip,
  Typography,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Visibility,
  Edit,
  SwapHoriz,
  CheckCircle,
  CheckCircleOutline,
  Pending,
  Schedule,
  Cancel,
  Refresh
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import MessageModal from './MessageModal';

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

const transferTypes = ["All", "internal", "external", "temporary", "permanent"];
const statuses = ["All", "pending", "approved", "in_progress", "completed", "cancelled", "rejected"];

export default function TransferTable() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [records, setRecords] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<{ [key: number]: boolean }>({});
  
  // Modal states
  const [messageModal, setMessageModal] = useState<{
    open: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    details?: string;
  }>({
    open: false,
    type: 'info',
    title: '',
    message: '',
    details: ''
  });

  const fetchTransfers = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem('token');
      
      if (!token) {
        setMessageModal({
          open: true,
          type: 'error',
          title: 'Authentication Required',
          message: 'Please log in to access transfer requests.',
          details: 'Your session may have expired. Please refresh the page and log in again.'
        });
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      const res = await fetch(`/api/transfer_requests`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.status === 401) {
        setMessageModal({
          open: true,
          type: 'error',
          title: 'Authentication Failed',
          message: 'Please log in again to access transfer requests.',
          details: 'Your session has expired. Please refresh the page and log in again.'
        });
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch transfers: ${res.status} ${errorText}`);
      }
      
      const data = await res.json();
      setRecords(data || []);
    } catch (e: any) {
      const errorMessage = e && typeof e === 'object' && 'message' in e 
        ? String(e.message) 
        : 'Failed to fetch transfers';
      setMessageModal({
        open: true,
        type: 'error',
        title: 'Failed to Load Transfers',
        message: 'Unable to load transfer requests at this time.',
        details: errorMessage
      });
      console.error('Transfer fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateTransferStatus = async (transferId: number, newStatus: string) => {
    setUpdating(prev => ({ ...prev, [transferId]: true }));
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessageModal({
          open: true,
          type: 'error',
          title: 'Authentication Required',
          message: 'Please log in to update transfer status.',
          details: 'Your session may have expired. Please refresh the page and log in again.'
        });
        return;
      }

      const res = await fetch(`/api/transfer_requests/${transferId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Update the local state
        setRecords(prev => prev.map(transfer => 
          transfer.id === transferId ? { ...transfer, status: newStatus as any } : transfer
        ));
        
        // Show success message for completed transfers
        if (newStatus === 'completed') {
          const transfer = records.find(t => t.id === transferId);
          if (transfer) {
            setMessageModal({
              open: true,
              type: 'success',
              title: 'Transfer Completed Successfully!',
              message: `Asset "${transfer.asset_name || `ID: ${transfer.asset_id}`}" has been successfully transferred.`,
              details: `Asset moved from "${transfer.from_location}" to "${transfer.to_location}". The asset location has been updated in the database.`
            });
          }
        } else {
          // Show success for other status updates
          setMessageModal({
            open: true,
            type: 'success',
            title: 'Status Updated Successfully!',
            message: `Transfer request status has been updated to "${newStatus}".`,
            details: 'The transfer request has been updated in the system.'
          });
        }
      } else {
        const errorText = await res.text();
        setMessageModal({
          open: true,
          type: 'error',
          title: 'Failed to Update Transfer',
          message: 'Unable to update transfer request status.',
          details: errorText
        });
      }
    } catch (e: any) {
      setMessageModal({
        open: true,
        type: 'error',
        title: 'Update Failed',
        message: 'An error occurred while updating the transfer status.',
        details: e.message
      });
    } finally {
      setUpdating(prev => ({ ...prev, [transferId]: false }));
    }
  };

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      fetchTransfers();
    }
  }, []);

  const formatCurrency = (value: number) => {
    return `₦${value.toLocaleString('en-NG')}`;
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

  // Filter records
  const filteredRecords = records.filter(record => {
    const matchesSearch = (record.asset_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (record.from_location?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (record.to_location?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (record.reason?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "All" || record.transfer_type === typeFilter;
    const matchesStatus = statusFilter === "All" || record.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    { 
      field: "asset_name", 
      headerName: "Asset", 
      width: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value || 'Unknown Asset'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.asset_category || 'No Category'}
          </Typography>
        </Box>
      )
    },
    { 
      field: "transfer_type", 
      headerName: "Type", 
      width: 120,
      renderCell: (params) => {
        try {
          const value = params.value || '';
          const displayLabel = value.length > 0 
            ? value.charAt(0).toUpperCase() + value.slice(1) 
            : 'Unknown';
          
          return (
            <Chip
              icon={getTypeIcon(value || 'internal')}
              label={displayLabel}
              size="small"
              color={getTypeColor(value || 'internal') as any}
              variant="outlined"
            />
          );
        } catch (error) {
          console.error('Error rendering transfer_type:', error);
          return (
            <Chip
              icon={getTypeIcon('internal')}
              label="Unknown"
              size="small"
              color="default"
              variant="outlined"
            />
          );
        }
      }
    },
    { 
      field: "status", 
      headerName: "Status", 
      width: 120,
      renderCell: (params) => {
        try {
          const value = params.value || '';
          const displayLabel = value.length > 0 
            ? value.replace('_', ' ').toUpperCase() 
            : 'UNKNOWN';
          
          return (
            <Chip
              label={displayLabel}
              size="small"
              color={getStatusColor(value || 'pending') as any}
            />
          );
        } catch (error) {
          console.error('Error rendering status:', error);
          return (
            <Chip
              label="UNKNOWN"
              size="small"
              color="default"
            />
          );
        }
      }
    },
    { 
      field: "from_location", 
      headerName: "From", 
      width: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value || 'Unknown Location'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.from_department || 'No Department'}
          </Typography>
        </Box>
      )
    },
    { 
      field: "to_location", 
      headerName: "To", 
      width: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value || 'Unknown Location'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.to_department || 'No Department'}
          </Typography>
        </Box>
      )
    },
    { 
      field: "reason", 
      headerName: "Reason", 
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          maxWidth: 190
        }}>
          {params.value || 'No reason provided'}
        </Typography>
      )
    },
    { 
      field: "request_date", 
      headerName: "Request Date", 
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value ? new Date(params.value).toLocaleDateString() : 'N/A'}
        </Typography>
      )
    },
    { 
      field: "estimated_cost", 
      headerName: "Est. Cost", 
      width: 100,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">
          {params.value ? formatCurrency(params.value) : '₦0'}
        </Typography>
      )
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 450,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Regular actions */}
          <Button
            size="small"
            variant="outlined"
            onClick={() => router.push(`/transfers/${params.row.id}`)}
            startIcon={<Visibility />}
          >
            View
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => router.push(`/transfers/${params.row.id}/edit`)}
            startIcon={<Edit />}
          >
            Edit
          </Button>
          
          {/* Admin-only approval/rejection buttons */}
          {user?.role === 'admin' && params.row.status === 'pending' && (
            <>
              <Button
                size="small"
                variant="contained"
                onClick={() => updateTransferStatus(params.row.id, 'approved')}
                disabled={updating[params.row.id]}
                startIcon={updating[params.row.id] ? <CircularProgress size={16} /> : <CheckCircleOutline />}
                sx={{ 
                  fontWeight: 'bold',
                  minWidth: 60,
                  bgcolor: '#4caf50',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#45a049',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 8px rgba(76, 175, 80, 0.3)'
                  },
                  '&:disabled': {
                    bgcolor: '#a5d6a7',
                    color: 'white'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {updating[params.row.id] ? 'Approving...' : 'Approve'}
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={() => updateTransferStatus(params.row.id, 'rejected')}
                disabled={updating[params.row.id]}
                startIcon={updating[params.row.id] ? <CircularProgress size={16} /> : <Cancel />}
                sx={{ 
                  fontWeight: 'bold',
                  minWidth: 60,
                  bgcolor: '#f44336',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#d32f2f',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 8px rgba(244, 67, 54, 0.3)'
                  },
                  '&:disabled': {
                    bgcolor: '#ef9a9a',
                    color: 'white'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {updating[params.row.id] ? 'Rejecting...' : 'Reject'}
              </Button>
            </>
          )}
          
          {/* Admin/Manager action buttons for other statuses */}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <>
              {/* For approved transfers - Complete/Revoke */}
              {params.row.status === 'approved' && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => updateTransferStatus(params.row.id, 'completed')}
                    disabled={updating[params.row.id]}
                    startIcon={updating[params.row.id] ? <CircularProgress size={16} /> : <CheckCircle />}
                    sx={{ 
                      fontWeight: 'bold',
                      minWidth: 60,
                      bgcolor: '#9c27b0',
                      color: 'white',
                      '&:hover': {
                        bgcolor: '#7b1fa2',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 8px rgba(156, 39, 176, 0.3)'
                      },
                      '&:disabled': {
                        bgcolor: '#ce93d8',
                        color: 'white'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    {updating[params.row.id] ? 'Completing...' : 'Complete'}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => updateTransferStatus(params.row.id, 'pending')}
                    disabled={updating[params.row.id]}
                    startIcon={updating[params.row.id] ? <CircularProgress size={16} /> : <Cancel />}
                    sx={{ 
                      fontWeight: 'bold',
                      minWidth: 60,
                      bgcolor: '#ff9800',
                      color: 'white',
                      '&:hover': {
                        bgcolor: '#f57c00',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 8px rgba(255, 152, 0, 0.3)'
                      },
                      '&:disabled': {
                        bgcolor: '#ffcc80',
                        color: 'white'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    {updating[params.row.id] ? 'Revoking...' : 'Revoke'}
                  </Button>
                </>
              )}
              
              {/* For rejected transfers - Approve */}
              {params.row.status === 'rejected' && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => updateTransferStatus(params.row.id, 'approved')}
                  disabled={updating[params.row.id]}
                  startIcon={updating[params.row.id] ? <CircularProgress size={16} /> : <CheckCircleOutline />}
                  sx={{ 
                    fontWeight: 'bold',
                    minWidth: 60,
                    bgcolor: '#4caf50',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#45a049',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 8px rgba(76, 175, 80, 0.3)'
                    },
                    '&:disabled': {
                      bgcolor: '#a5d6a7',
                      color: 'white'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  {updating[params.row.id] ? 'Approving...' : 'Approve'}
                </Button>
              )}
              
              {/* For completed transfers - Reopen */}
              {params.row.status === 'completed' && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => updateTransferStatus(params.row.id, 'approved')}
                  disabled={updating[params.row.id]}
                  startIcon={updating[params.row.id] ? <CircularProgress size={16} /> : <Schedule />}
                  sx={{ 
                    fontWeight: 'bold',
                    minWidth: 60,
                    bgcolor: '#2196f3',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#1976d2',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 8px rgba(33, 150, 243, 0.3)'
                    },
                    '&:disabled': {
                      bgcolor: '#90caf9',
                      color: 'white'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  {updating[params.row.id] ? 'Reopening...' : 'Reopen'}
                </Button>
              )}
            </>
          )}
        </Stack>
      )
    }
  ];

  const getStats = () => {
    const total = records.length;
    const pending = records.filter(r => r.status === 'pending').length;
    const approved = records.filter(r => r.status === 'approved').length;
    const completed = records.filter(r => r.status === 'completed').length;
    const inProgress = records.filter(r => r.status === 'in_progress').length;
    const totalCost = records.reduce((sum, r) => sum + (r.actual_cost || 0), 0);

    return { total, pending, approved, completed, inProgress, totalCost };
  };

  const stats = getStats();

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
          <Button color="inherit" size="small" onClick={() => fetchTransfers(true)}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SwapHoriz color="primary" />
            Transfer Management
          </Typography>

        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => fetchTransfers(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push('/transfers/new')}
          >
            Request Transfer
          </Button>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Total Requests</Typography>
            <Typography variant="h4">{stats.total}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Pending</Typography>
            <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Approved</Typography>
            <Typography variant="h4" color="primary.main">{stats.approved}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>In Progress</Typography>
            <Typography variant="h4" color="info.main">{stats.inProgress}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Completed</Typography>
            <Typography variant="h4" color="success.main">{stats.completed}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Total Cost</Typography>
            <Typography variant="h4" color="primary.main">{formatCurrency(stats.totalCost)}</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Alerts */}
      {stats.pending > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {stats.pending} transfer request(s) are pending approval.
        </Alert>
      )}

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Search & Filter
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              placeholder="Search assets, locations, or reasons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 300 }}
            />
            
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {transferTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statuses.map((status) => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          
          <Typography variant="body2" color="text.secondary">
            Showing {filteredRecords.length} of {records.length} transfer records
          </Typography>
        </CardContent>
      </Card>

      {/* DataGrid */}
      <Box sx={{ height: 500, width: "100%" }}>
        <DataGrid 
          rows={filteredRecords} 
          columns={columns} 
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
        />
      </Box>

      {/* Message Modal */}
      <MessageModal
        open={messageModal.open}
        onClose={() => setMessageModal(prev => ({ ...prev, open: false }))}
        type={messageModal.type}
        title={messageModal.title}
        message={messageModal.message}
        details={messageModal.details}
        showRefresh={messageModal.type === 'error'}
        autoClose={messageModal.type === 'success'}
        autoCloseDelay={4000}
      />
    </Box>
  );
} 