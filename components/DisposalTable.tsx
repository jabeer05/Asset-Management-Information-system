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
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Visibility,
  Edit,
  Delete,
  Recycling,
  CheckCircle,
  Cancel,
  AttachMoney,
  Warning,
  CheckCircleOutline,
  Schedule
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import MessageModal from './MessageModal';

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
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  disposal_notes?: string;
  buyer_info?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  method: string;  // Original method field from backend
  proceeds?: number;  // Original proceeds field from backend
}

const statuses = ["All", "draft", "pending", "approved", "in_progress", "completed", "cancelled"];

export default function DisposalTable() {
  const router = useRouter();
  const { user } = useAuth();
  const [disposals, setDisposals] = useState<DisposalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
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

  useEffect(() => {
    fetchDisposals();
  }, []);

  const fetchDisposals = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('/api/disposals', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch disposals');
      }
      const data = await response.json();
      setDisposals(data);
    } catch (err) {
      console.error('Error fetching disposals:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateDisposalStatus = async (disposalId: number, newStatus: string) => {
    setUpdating(prev => ({ ...prev, [disposalId]: true }));
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in.');
        return;
      }

      const res = await fetch(`/api/disposals/${disposalId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setDisposals(prev => prev.map(disposal => 
          disposal.id === disposalId ? { ...disposal, status: newStatus as any } : disposal
        ));
        
        // Show success message for completed disposals
        if (newStatus === 'completed') {
          const disposal = disposals.find(d => d.id === disposalId);
          if (disposal) {
            setMessageModal({
              open: true,
              type: 'success',
              title: 'Disposal Completed Successfully!',
              message: `Disposal for "${disposal.asset_name}" has been completed and the asset has been removed from inventory.`,
              details: `Asset "${disposal.asset_name}" has been disposed via ${disposal.method} and deleted from the database.`
            });
          }
        } else {
          // Show success for other status updates
          setMessageModal({
            open: true,
            type: 'success',
            title: 'Status Updated Successfully!',
            message: `Disposal status has been updated to "${newStatus}".`,
            details: 'The disposal has been updated in the system.'
          });
        }
      } else {
        const errorText = await res.text();
        setMessageModal({
          open: true,
          type: 'error',
          title: 'Failed to Update Disposal',
          message: 'Unable to update disposal status.',
          details: errorText
        });
      }
    } catch (e: any) {
      setMessageModal({
        open: true,
        type: 'error',
        title: 'Update Failed',
        message: 'An error occurred while updating the disposal status.',
        details: e.message
      });
    } finally {
      setUpdating(prev => ({ ...prev, [disposalId]: false }));
    }
  };

  const deleteDisposalAsset = async (disposalId: number) => {
    setUpdating(prev => ({ ...prev, [disposalId]: true }));
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in.');
        return;
      }

      const res = await fetch(`/api/disposals/${disposalId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (res.ok) {
        const result = await res.json();
        // Remove the disposal from the list since the asset is deleted
        setDisposals(prev => prev.filter(disposal => disposal.id !== disposalId));
        setMessageModal({
          open: true,
          type: 'success',
          title: 'Asset Deleted Successfully!',
          message: `Asset "${result.asset_name}" has been deleted from the database.`,
          details: 'The asset has been permanently removed from the system.'
        });
      } else {
        const errorText = await res.text();
        setMessageModal({
          open: true,
          type: 'error',
          title: 'Failed to Delete Asset',
          message: 'Unable to delete the asset.',
          details: errorText
        });
      }
    } catch (e: any) {
      setMessageModal({
        open: true,
        type: 'error',
        title: 'Delete Failed',
        message: 'An error occurred while deleting the asset.',
        details: e.message
      });
    } finally {
      setUpdating(prev => ({ ...prev, [disposalId]: false }));
    }
  };

  const formatCurrency = (value: number) => {
    return `₦${value.toLocaleString('en-NG')}`;
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'default';
    switch (status) {
      case 'completed': return 'success';
      case 'approved': return 'primary';
      case 'in_progress': return 'info';
      case 'pending': return 'warning';
      case 'draft': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getMethodColor = (method: string) => {
    if (!method) return 'default';
    switch (method.toLowerCase()) {
      case 'sale': return 'success';
      case 'donation': return 'primary';
      case 'destruction': return 'error';
      case 'recycling': return 'info';
      case 'trade_in': return 'secondary';
      case 'scrap': return 'warning';
      default: return 'default';
    }
  };

  const getMethodIcon = (method: string) => {
    if (!method) return <Recycling />;
    switch (method.toLowerCase()) {
      case 'sale': return <AttachMoney />;
      case 'donation': return <CheckCircle />;
      case 'destruction': return <Delete />;
      case 'recycling': return <Recycling />;
      case 'trade_in': return <AttachMoney />;
      case 'scrap': return <Warning />;
      default: return <Recycling />;
    }
  };

  // Filter records
  const filteredRecords = disposals.filter(record => {
    const matchesSearch = (record.asset_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                         (record.disposal_reason?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                         (record.buyer_info?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                         (record.disposal_method_name?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || record.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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
            {params.value || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.asset_category || 'N/A'}
          </Typography>
        </Box>
      )
    },
    { 
      field: "asset_location", 
      headerName: "Location", 
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {params.value || 'N/A'}
        </Typography>
      )
    },
    { 
      field: "disposal_method_name", 
      headerName: "Method", 
      width: 130,
      renderCell: (params) => (
        <Chip
          icon={getMethodIcon(params.value)}
          label={params.value || 'N/A'}
          size="small"
          color={getMethodColor(params.value) as any}
          variant="outlined"
        />
      )
    },
    { 
      field: "status", 
      headerName: "Status", 
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value ? params.value.charAt(0).toUpperCase() + params.value.slice(1).replace('_', ' ') : 'Unknown'}
          size="small"
          color={getStatusColor(params.value) as any}
          variant="outlined"
        />
      )
    },
    { 
      field: "disposal_date", 
      headerName: "Disposal Date", 
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value ? new Date(params.value).toLocaleDateString() : 'N/A'}
        </Typography>
      )
    },
    { 
      field: "estimated_proceeds", 
      headerName: "Estimated", 
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">
          {params.value ? formatCurrency(params.value) : 'N/A'}
        </Typography>
      )
    },
    { 
      field: "actual_proceeds", 
      headerName: "Actual", 
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium" color="primary">
          {params.value ? formatCurrency(params.value) : 'N/A'}
        </Typography>
      )
    },
    { 
      field: "net_proceeds", 
      headerName: "Net Proceeds", 
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium" color={params.value && params.value < 0 ? 'error' : 'success'}>
          {params.value ? formatCurrency(params.value) : 'N/A'}
        </Typography>
      )
    },
    { 
      field: "disposal_reason", 
      headerName: "Reason", 
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {params.value || 'N/A'}
        </Typography>
      )
    },
    { 
      field: "buyer_info", 
      headerName: "Buyer/Recipient", 
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {params.value || 'N/A'}
        </Typography>
      )
    },
    { 
      field: "created_by_name", 
      headerName: "Created By", 
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {params.value || 'N/A'}
        </Typography>
      )
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 550,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Regular actions */}
          <Button
            size="small"
            variant="outlined"
            onClick={() => router.push(`/disposals/${params.row.id}`)}
            startIcon={<Visibility />}
            sx={{ 
              minWidth: 60,
              fontSize: '0.75rem',
              padding: '4px 8px'
            }}
          >
            View
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => router.push(`/disposals/${params.row.id}/edit`)}
            startIcon={<Edit />}
            sx={{ 
              minWidth: 60,
              fontSize: '0.75rem',
              padding: '4px 8px'
            }}
          >
            Edit
          </Button>
          
          {/* Admin-only approval/rejection buttons */}
          {user?.role === 'admin' && params.row.status === 'draft' && (
            <>
              <Button
                size="small"
                variant="contained"
                onClick={() => updateDisposalStatus(params.row.id, 'approved')}
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
                onClick={() => updateDisposalStatus(params.row.id, 'cancelled')}
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
          {(user?.role === 'admin' || user?.role === 'disposal_manager') && (
            <>
              {/* For approved disposals - Start Progress/Revoke */}
              {params.row.status === 'approved' && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => updateDisposalStatus(params.row.id, 'in_progress')}
                    disabled={updating[params.row.id]}
                    startIcon={updating[params.row.id] ? <CircularProgress size={16} /> : <CheckCircle />}
                    sx={{ 
                      fontWeight: 'bold',
                      minWidth: 60,
                      bgcolor: '#2196f3', // Blue for Start Progress
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
                    {updating[params.row.id] ? 'Starting...' : 'Start'}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => updateDisposalStatus(params.row.id, 'draft')}
                    disabled={updating[params.row.id]}
                    startIcon={updating[params.row.id] ? <CircularProgress size={16} /> : <Cancel />}
                    sx={{ 
                      fontWeight: 'bold',
                      minWidth: 60,
                      bgcolor: '#ff9800', // Orange for Revoke
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
              
              {/* For in_progress disposals - Complete/Reopen */}
              {params.row.status === 'in_progress' && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => updateDisposalStatus(params.row.id, 'completed')}
                    disabled={updating[params.row.id]}
                    startIcon={updating[params.row.id] ? <CircularProgress size={16} /> : <CheckCircle />}
                    sx={{ 
                      fontWeight: 'bold',
                      minWidth: 60,
                      bgcolor: '#4caf50', // Green for Complete
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
                    {updating[params.row.id] ? 'Completing...' : 'Complete'}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => updateDisposalStatus(params.row.id, 'approved')}
                    disabled={updating[params.row.id]}
                    startIcon={updating[params.row.id] ? <CircularProgress size={16} /> : <Schedule />}
                    sx={{ 
                      fontWeight: 'bold',
                      minWidth: 60,
                      bgcolor: '#9c27b0', // Purple for Reopen
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
                    {updating[params.row.id] ? 'Reopening...' : 'Reopen'}
                  </Button>
                </>
              )}
              
              {/* For cancelled disposals - Approve */}
              {params.row.status === 'cancelled' && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => updateDisposalStatus(params.row.id, 'approved')}
                  disabled={updating[params.row.id]}
                  startIcon={updating[params.row.id] ? <CircularProgress size={16} /> : <CheckCircleOutline />}
                  sx={{ 
                    fontWeight: 'bold',
                    minWidth: 60,
                    bgcolor: '#4caf50', // Green for Approve
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
              
              {/* For completed disposals - Reopen and Delete Asset */}
              {params.row.status === 'completed' && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => updateDisposalStatus(params.row.id, 'in_progress')}
                    disabled={updating[params.row.id]}
                    startIcon={updating[params.row.id] ? <CircularProgress size={16} /> : <Schedule />}
                    sx={{ 
                      fontWeight: 'bold',
                      minWidth: 60,
                      bgcolor: '#2196f3', // Blue for Reopen
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
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete the asset "${params.row.asset_name}"? This action cannot be undone.`)) {
                        deleteDisposalAsset(params.row.id);
                      }
                    }}
                    disabled={updating[params.row.id]}
                    startIcon={updating[params.row.id] ? <CircularProgress size={16} /> : <Delete />}
                    sx={{ 
                      fontWeight: 'bold',
                      minWidth: 60,
                      bgcolor: '#d32f2f', // Red for Delete
                      color: 'white',
                      '&:hover': {
                        bgcolor: '#c62828',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 8px rgba(211, 47, 47, 0.3)'
                      },
                      '&:disabled': {
                        bgcolor: '#ef5350',
                        color: 'white'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    {updating[params.row.id] ? 'Deleting...' : 'Delete Asset'}
                  </Button>
                </>
              )}
            </>
          )}
        </Stack>
      )
    }
  ];

  const getStats = () => {
    const total = filteredRecords.length;
    const pending = filteredRecords.filter(disposal => disposal.status === 'pending').length;
    const completed = filteredRecords.filter(disposal => disposal.status === 'completed').length;
    const totalValue = filteredRecords.reduce((sum, disposal) => sum + (disposal.actual_proceeds || disposal.estimated_proceeds || disposal.proceeds || 0), 0);

    return { total, pending, completed, totalValue };
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
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const stats = getStats();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Recycling color="primary" />
          Disposal Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push('/disposals/new')}
        >
          New Disposal
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Disposals
            </Typography>
            <Typography variant="h4" component="div">
              {stats.total}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Pending Approval
            </Typography>
            <Typography variant="h4" component="div" color="warning.main">
              {stats.pending}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Completed
            </Typography>
            <Typography variant="h4" component="div" color="success.main">
              {stats.completed}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Value
            </Typography>
            <Typography variant="h4" component="div" color="primary">
              {formatCurrency(stats.totalValue)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Search & Filter
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              placeholder="Search disposals, assets, or reasons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 300 }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status === "All" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          
          <Typography variant="body2" color="text.secondary">
            Showing {filteredRecords.length} of {disposals.length} disposal records
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
          getRowId={(row) => row.id}
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