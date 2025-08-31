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
  Card,
  CardContent,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Visibility,
  Edit,
  Build,
  CheckCircle,
  Warning,
  Schedule,
  Assignment,
  Inventory,
  CheckCircleOutline,
  Cancel,
  PlayArrow,
  Pause
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import MaintenanceForm from './MaintenanceForm';
import SendToDisposalAuctionForm from './SendToDisposalAuctionForm';
import Link from "next/link";
import ArrowForward from '@mui/icons-material/ArrowForward';
import { getAssets } from '../app/api/assets';
import { useAuth } from '../contexts/AuthContext';
import {
  SSRSafeFormControl,
  SSRSafeInputLabel,
  SSRSafeSelect,
  SSRSafeMenuItem,
  PortalModal,
  SimpleSnackbar
} from './SSRSafeComponents';

interface MaintenanceRecord {
  id: number;
  asset_id: number;
  asset_name: string;
  asset_category?: string;
  maintenance_type: 'preventive' | 'corrective' | 'emergency' | 'inspection';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  performed_by: string; // Changed from assigned_to
  maintenance_date: string; // Changed from scheduled_date
  start_date?: string;
  completion_date?: string;
  cost: number;
  vendor?: string;
  notes?: string;
  next_maintenance_date?: string;
}

const maintenanceTypes = ["All", "preventive", "corrective", "emergency", "inspection"];
const statuses = ["All", "scheduled", "in_progress", "completed", "cancelled", "overdue"];
const priorities = ["All", "low", "medium", "high", "critical"];

export default function MaintenanceTable() {
  const router = useRouter();
  const { user, isMaintenanceManager, getUserLocations } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<MaintenanceRecord | null>(null);
  // State for send to disposal/auction dialog
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [updating, setUpdating] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    async function fetchMaintenances() {
      setLoading(true);
      setError(null);
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${API_BASE_URL}/maintenance/`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) throw new Error("Failed to fetch maintenances");
        const data = await res.json();
        
        console.log('Maintenance data from backend:', data);
        setRecords(data);
      } catch (e: any) {
        setError(e.message || "Failed to fetch maintenances");
      } finally {
        setLoading(false);
      }
    }
    fetchMaintenances();
  }, []);



  const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return '₦0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
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
    switch (type) {
      case 'preventive': return <Schedule />;
      case 'corrective': return <Build />;
      case 'emergency': return <Warning />;
      case 'inspection': return <Assignment />;
      default: return <Build />;
    }
  };

  // Filter records
  const filteredRecords = records.filter(record => {
    const matchesSearch = (record.asset_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                         (record.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                         (record.performed_by?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "All" || record.maintenance_type === typeFilter;
    const matchesStatus = statusFilter === "All" || record.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || record.priority === priorityFilter;
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  const handleEditClick = (record: MaintenanceRecord) => {
    setEditRecord(record);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditRecord(null);
  };

  const handleEditSubmit = async (formData: any) => {
    try {
      // Map frontend fields to backend fields
      const payload = { ...formData };
      payload.maintenance_date = payload.maintenance_date;
      if (payload.performed_by === "custom") {
        payload.performed_by = payload.custom_assigned_name;
      } else {
        payload.performed_by = payload.performed_by;
      }
      payload.description = payload.description;
      delete payload.maintenance_date;
      delete payload.performed_by;
      delete payload.custom_assigned_name;
      if (payload.asset_id !== "custom") {
        delete payload.custom_asset_name;
      } else {
        payload.asset_name = payload.custom_asset_name;
      }
      if (payload.asset_id === "custom") {
        payload.asset_id = null;
      }
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${API_BASE_URL}/maintenance/${editRecord?.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update maintenance record");
      }
      // Refresh table
      setEditOpen(false);
      setEditRecord(null);
      // Re-fetch records
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/maintenance/`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      setRecords(data);
      setLoading(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update maintenance record");
    }
  };

  // Helper: format date for modal summary
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleOpenSendDialog = () => {
    setSendDialogOpen(true);
  };

  const handleCloseSendDialog = () => {
    setSendDialogOpen(false);
  };

  const updateMaintenanceStatus = async (maintenanceId: number, newStatus: string) => {
    setUpdating(prev => ({ ...prev, [maintenanceId]: true }));
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      
      const response = await fetch(`${API_BASE_URL}/maintenance/${maintenanceId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update maintenance status');
      }

      // Refresh the records
      const res = await fetch(`${API_BASE_URL}/maintenance/`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      setRecords(data);
      
    } catch (error) {
      console.error('Error updating maintenance status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update maintenance status');
    } finally {
      setUpdating(prev => ({ ...prev, [maintenanceId]: false }));
    }
  };

  const handleSend = async (formData: any) => {
    setSendLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      
      // Create a comprehensive message
      const message = `Asset: ${formData.asset_name || 'Unknown Asset'}
Reason: ${formData.reason}
Priority: ${formData.priority}
Estimated Value: ₦${formData.estimated_value?.toLocaleString() || '0'}
${formData.message ? `Additional Message: ${formData.message}` : ''}`;

      const res = await fetch(`${API_BASE_URL}/notifications/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          user_id: formData.manager_id,
          title: `Request: Send Asset to ${formData.type === 'disposal' ? 'Disposal' : 'Auction'}`,
          message: message,
          type: formData.type,
          priority: formData.priority,
          asset_id: formData.asset_id,
          notification_metadata: {
            request_type: formData.type,
            asset_id: formData.asset_id,
            asset_name: formData.asset_name,
            estimated_value: formData.estimated_value,
            reason: formData.reason,
            priority: formData.priority,
            manager_id: formData.manager_id
          }
        })
      });
      
      if (res.ok) {
        setSendSuccess(true);
        handleCloseSendDialog();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to send request');
      }
    } catch (error) {
      console.error('Error sending request:', error);
      alert(error instanceof Error ? error.message : 'Failed to send request');
    } finally {
      setSendLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    { 
      field: "asset_name", 
      headerName: "Asset", 
      width: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.asset_category}
          </Typography>
        </Box>
      )
    },
    { 
      field: "maintenance_type", 
      headerName: "Type", 
      width: 130,
      renderCell: (params) => (
        <Chip
          icon={getTypeIcon(params.value)}
          label={typeof params.value === 'string' && params.value.length > 0
            ? params.value.charAt(0).toUpperCase() + params.value.slice(1)
            : ''}
          size="small"
          color="primary"
          variant="outlined"
        />
      )
    },
    { 
      field: "status", 
      headerName: "Status", 
      width: 120,
      renderCell: (params) => (
        <Chip
          label={typeof params.value === 'string' ? params.value.replace('_', ' ').toUpperCase() : ''}
          size="small"
          color={getStatusColor(params.value) as any}
        />
      )
    },
    { 
      field: "priority", 
      headerName: "Priority", 
      width: 100,
      renderCell: (params) => (
        <Chip
          label={typeof params.value === 'string' ? params.value.toUpperCase() : ''}
          size="small"
          color={getPriorityColor(params.value) as any}
        />
      )
    },
    { 
      field: "description", 
      headerName: "Description", 
      width: 250,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          maxWidth: 240
        }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: "performed_by", 
      headerName: "Assigned To", 
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value || 'Not assigned'}
        </Typography>
      )
    },
    { 
      field: "maintenance_date", 
      headerName: "Scheduled", 
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value ? new Date(params.value).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'N/A'}
        </Typography>
      )
    },
    { 
      field: "cost", 
      headerName: "Cost", 
      width: 100,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">
          {formatCurrency(params.value)}
        </Typography>
      )
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 600,
      sortable: false,
      renderCell: (params) => {
        return (
          <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
            {/* Regular actions */}
            <Button
            size="small"
              variant="outlined"
            onClick={() => router.push(`/maintenance/${params.row.id}`)}
              startIcon={<Visibility />}
              sx={{ 
                minWidth: 50,
                fontSize: '0.7rem',
                padding: '2px 6px',
                height: 28
              }}
            >
              View
            </Button>
            <Button
            size="small"
              variant="outlined"
            onClick={() => router.push(`/assets/${params.row.asset_id}`)}
              startIcon={<Inventory />}
              sx={{ 
                minWidth: 50,
                fontSize: '0.7rem',
                padding: '2px 6px',
                height: 28
              }}
            >
              Asset
            </Button>
            <Button
            size="small"
              variant="outlined"
            onClick={() => handleEditClick(params.row as MaintenanceRecord)}
              startIcon={<Edit />}
              sx={{ 
                minWidth: 50,
                fontSize: '0.7rem',
                padding: '2px 6px',
                height: 28
              }}
            >
              Edit
            </Button>
            
            {/* Status action buttons */}
            {user?.role === 'admin' && params.row.status === 'scheduled' && (
              <>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => updateMaintenanceStatus(params.row.id, 'in_progress')}
                  disabled={updating[params.row.id]}
                  startIcon={updating[params.row.id] ? <CircularProgress size={14} /> : <PlayArrow />}
                  sx={{ 
                    fontWeight: 'bold',
                    minWidth: 50,
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    height: 28,
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
                    }
                  }}
                >
                  Start
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => updateMaintenanceStatus(params.row.id, 'cancelled')}
                  disabled={updating[params.row.id]}
                  startIcon={updating[params.row.id] ? <CircularProgress size={14} /> : <Cancel />}
                  sx={{ 
                    fontWeight: 'bold',
                    minWidth: 50,
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    height: 28,
                    bgcolor: '#f44336',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#d32f2f',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 8px rgba(244, 67, 54, 0.3)'
                    },
                    '&:disabled': {
                      bgcolor: '#ef5350',
                      color: 'white'
                    }
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
            
            {user?.role === 'admin' && params.row.status === 'in_progress' && (
              <>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => updateMaintenanceStatus(params.row.id, 'completed')}
                  disabled={updating[params.row.id]}
                  startIcon={updating[params.row.id] ? <CircularProgress size={14} /> : <CheckCircleOutline />}
                  sx={{ 
                    fontWeight: 'bold',
                    minWidth: 50,
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    height: 28,
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
                    }
                  }}
                >
                  Complete
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => updateMaintenanceStatus(params.row.id, 'cancelled')}
                  disabled={updating[params.row.id]}
                  startIcon={updating[params.row.id] ? <CircularProgress size={14} /> : <Cancel />}
                  sx={{ 
                    fontWeight: 'bold',
                    minWidth: 50,
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    height: 28,
                    bgcolor: '#f44336',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#d32f2f',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 8px rgba(244, 67, 54, 0.3)'
                    },
                    '&:disabled': {
                      bgcolor: '#ef5350',
                      color: 'white'
                    }
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
            
            {user?.role === 'admin' && params.row.status === 'overdue' && (
              <>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => updateMaintenanceStatus(params.row.id, 'in_progress')}
                  disabled={updating[params.row.id]}
                  startIcon={updating[params.row.id] ? <CircularProgress size={14} /> : <PlayArrow />}
                  sx={{ 
                    fontWeight: 'bold',
                    minWidth: 50,
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    height: 28,
                    bgcolor: '#ff9800',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#f57c00',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 8px rgba(255, 152, 0, 0.3)'
                    },
                    '&:disabled': {
                      bgcolor: '#ffcc02',
                      color: 'white'
                    }
                  }}
                >
                  Start
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => updateMaintenanceStatus(params.row.id, 'cancelled')}
                  disabled={updating[params.row.id]}
                  startIcon={updating[params.row.id] ? <CircularProgress size={14} /> : <Cancel />}
                  sx={{ 
                    fontWeight: 'bold',
                    minWidth: 50,
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    height: 28,
                    bgcolor: '#f44336',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#d32f2f',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 8px rgba(244, 67, 54, 0.3)'
                    },
                    '&:disabled': {
                      bgcolor: '#ef5350',
                      color: 'white'
                    }
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
        </Stack>
        );
      }
    }
  ];

  const getStats = () => {
    const total = records.length;
    const completed = records.filter(r => r.status === 'completed').length;
    const inProgress = records.filter(r => r.status === 'in_progress').length;
    const overdue = records.filter(r => r.status === 'overdue').length;
    const totalCost = records.reduce((sum, r) => {
      const cost = typeof r.cost === 'number' && isFinite(r.cost) ? r.cost : 0;
      return sum + cost;
    }, 0);
    return { total, completed, inProgress, overdue, totalCost };
  };

  const stats = getStats();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Build color="primary" />
          Maintenance Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push('/maintenance/new')}
          >
            Schedule Maintenance
          </Button>

          <Button
            variant="contained"
            color="warning"
            startIcon={<ArrowForward />}
            onClick={handleOpenSendDialog}
          >
            Send to Disposal/Auction
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Total Records</Typography>
            <Typography variant="h4">{stats.total}</Typography>
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
            <Typography color="textSecondary" gutterBottom>In Progress</Typography>
            <Typography variant="h4" color="info.main">{stats.inProgress}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Overdue</Typography>
            <Typography variant="h4" color="error.main">{stats.overdue}</Typography>
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
      {stats.overdue > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {stats.overdue} maintenance record(s) are overdue and require immediate attention.
        </Alert>
      )}

      {/* Access Alert */}
      {isMaintenanceManager() && user?.role === 'admin' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <strong>Admin Access:</strong> As an administrator, you have full access to view and manage all maintenance records across all locations.
        </Alert>
      )}
      {isMaintenanceManager() && user?.role !== 'admin' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          As a maintenance manager, you can only view and manage maintenance records for assets in your assigned locations: {getUserLocations().join(', ')}.
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
              placeholder="Search assets, descriptions, or assigned personnel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 300 }}
            />
            
            <SSRSafeFormControl>
              <SSRSafeInputLabel>Type</SSRSafeInputLabel>
              <SSRSafeSelect
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {maintenanceTypes.map((type) => (
                  <SSRSafeMenuItem key={type} value={type}>{type}</SSRSafeMenuItem>
                ))}
              </SSRSafeSelect>
            </SSRSafeFormControl>
            
            <SSRSafeFormControl>
              <SSRSafeInputLabel>Status</SSRSafeInputLabel>
              <SSRSafeSelect
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statuses.map((status) => (
                  <SSRSafeMenuItem key={status} value={status}>{status}</SSRSafeMenuItem>
                ))}
              </SSRSafeSelect>
            </SSRSafeFormControl>
            
            <SSRSafeFormControl>
              <SSRSafeInputLabel>Priority</SSRSafeInputLabel>
              <SSRSafeSelect
                value={priorityFilter}
                label="Priority"
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                {priorities.map((priority) => (
                  <SSRSafeMenuItem key={priority} value={priority}>{priority}</SSRSafeMenuItem>
                ))}
              </SSRSafeSelect>
            </SSRSafeFormControl>
          </Stack>
          
          <Typography variant="body2" color="text.secondary">
            Showing {filteredRecords.length} of {records.length} maintenance records
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

      {/* Edit Modal */}
      {editOpen && (
        <PortalModal open={editOpen} onClose={handleEditClose}>
          <Card sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: { xs: '98vw', sm: 900 }, maxHeight: '95vh', overflowY: 'auto', boxShadow: 24, borderRadius: 2, p: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
              {/* Left: Edit Form */}
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>Edit Maintenance Record</Typography>
                {editRecord && (
                  <MaintenanceForm
                    onSubmit={handleEditSubmit}
                    defaultValues={{ ...editRecord, maintenance_date: editRecord.maintenance_date, performed_by: editRecord.performed_by }}
                    mode="edit"
                    title="Edit Maintenance Record"
                  />
                )}
                <Box mt={2} display="flex" justifyContent="flex-end">
                  <Button onClick={handleEditClose} variant="outlined">Cancel</Button>
                </Box>
              </Box>
              {/* Right: Summary Sidebar */}
              {editRecord && (
                <Box>
                  {/* Assignment & Schedule */}
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Assignment & Schedule</Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">Assigned To</Typography>
                      <Typography variant="body1" fontWeight="medium">{editRecord.performed_by}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Scheduled Date</Typography>
                      <Typography variant="body1" fontWeight="medium">{formatDate(editRecord.maintenance_date)}</Typography>
                      {editRecord.start_date && (
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Start Date</Typography>
                          <Typography variant="body1" fontWeight="medium">{formatDate(editRecord.start_date)}</Typography>
                        </>
                      )}
                      {editRecord.completion_date && (
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Completion Date</Typography>
                          <Typography variant="body1" fontWeight="medium">{formatDate(editRecord.completion_date)}</Typography>
                        </>
                      )}
                      {editRecord.next_maintenance_date && (
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Next Maintenance</Typography>
                          <Typography variant="body1" fontWeight="medium">{formatDate(editRecord.next_maintenance_date)}</Typography>
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
                      <Typography variant="h5" color="primary.main" fontWeight="bold">{formatCurrency(editRecord.cost)}</Typography>
                      {editRecord.vendor && (
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Vendor/Service Provider</Typography>
                          <Typography variant="body1" fontWeight="medium">{editRecord.vendor}</Typography>
                        </>
                      )}
                    </CardContent>
                  </Card>
                  {/* Notes */}
                  {editRecord.notes && (
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Additional Notes</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="body2">{editRecord.notes}</Typography>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              )}
            </Box>
          </Card>
        </PortalModal>
      )}
      {/* Send to Disposal/Auction Dialog */}
      {sendDialogOpen && (
        <PortalModal open={sendDialogOpen} onClose={handleCloseSendDialog}>
          <Card sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            width: { xs: '98vw', sm: 900 }, 
            maxHeight: '95vh', 
            overflowY: 'auto', 
            boxShadow: 24, 
            borderRadius: 2, 
            p: 2 
          }}>
            <SendToDisposalAuctionForm
              onSubmit={handleSend}
              onCancel={handleCloseSendDialog}
              loading={sendLoading}
            />
          </Card>
        </PortalModal>
      )}
      <SimpleSnackbar
        open={sendSuccess}
        message="Request sent to admin and managers!"
        onClose={() => setSendSuccess(false)}
      />
    </Box>
  );
} 