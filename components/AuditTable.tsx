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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  Download,
  FilterList,
  Security,
  Edit,
  Add,
  Delete,
  Login,
  Logout,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Info,
  Person,
  AccessTime,
  LocationOn
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface AuditRecord {
  id: number;
  user_id: number;
  username?: string;
  user_email?: string;
  full_name?: string;
  action: string;
  table_name?: string;
  record_id?: number;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export default function AuditTable() {
  const router = useRouter();
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tableFilter, setTableFilter] = useState("All");
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      setIsClient(true);
      fetchAuditRecords();
    }
  }, []);

  const fetchAuditRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      
      if (!token) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/audit`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch audit records: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      setAuditRecords(data.records || data); // Handle both new and old response formats
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? String(err.message) 
        : 'An error occurred while fetching audit records';
      setError(errorMessage);
      console.error('Audit fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('login')) return <Login />;
    if (actionLower.includes('logout')) return <Logout />;
    if (actionLower.includes('create')) return <Add />;
    if (actionLower.includes('update')) return <Edit />;
    if (actionLower.includes('delete')) return <Delete />;
    if (actionLower.includes('export')) return <Download />;
    if (actionLower.includes('import')) return <Download />;
    if (actionLower.includes('view')) return <Visibility />;
    if (actionLower.includes('approve')) return <CheckCircle />;
    if (actionLower.includes('reject')) return <ErrorIcon />;
    return <Security />;
  };

  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('login') || actionLower.includes('create') || actionLower.includes('approve')) return 'success';
    if (actionLower.includes('update') || actionLower.includes('export') || actionLower.includes('import')) return 'info';
    if (actionLower.includes('view')) return 'primary';
    if (actionLower.includes('logout')) return 'default';
    if (actionLower.includes('delete') || actionLower.includes('reject')) return 'error';
    return 'warning';
  };

  const getTableColor = (tableName: string) => {
    switch (tableName?.toLowerCase()) {
      case 'assets': return 'primary';
      case 'users': return 'secondary';
      case 'maintenance': return 'info';
      case 'transfers': return 'warning';
      case 'auctions': return 'success';
      case 'disposals': return 'error';
      default: return 'default';
    }
  };

  // Filter records
  const filteredRecords = auditRecords.filter(record => {
    const matchesSearch = record.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (record.username && record.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (record.full_name && record.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (record.table_name && record.table_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTable = tableFilter === "All" || record.table_name === tableFilter;
    
    return matchesSearch && matchesTable;
  });

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    { 
      field: "timestamp", 
      headerName: "Timestamp", 
      width: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {new Date(params.value).toLocaleDateString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(params.value).toLocaleTimeString()}
          </Typography>
        </Box>
      )
    },
    { 
      field: "full_name", 
      headerName: "User", 
      width: 150,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
            {params.value ? params.value.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {params.value || params.row.username || 'Unknown'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.user_email}
            </Typography>
          </Box>
        </Box>
      )
    },
    { 
      field: "action", 
      headerName: "Action", 
      width: 200,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            icon={getActionIcon(params.value)}
            label={params.value}
            size="small"
            color={getActionColor(params.value) as any}
            variant="outlined"
          />
        </Box>
      )
    },
    { 
      field: "table_name", 
      headerName: "Table", 
      width: 120,
      renderCell: (params) => (
        params.value ? (
          <Chip
            label={params.value}
            size="small"
            color={getTableColor(params.value) as any}
            variant="outlined"
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            System
          </Typography>
        )
      )
    },
    { 
      field: "record_id", 
      headerName: "Record ID", 
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value || 'N/A'}
        </Typography>
      )
    },
    { 
      field: "ip_address", 
      headerName: "IP Address", 
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontFamily="monospace">
          {params.value || 'N/A'}
        </Typography>
      )
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => {
            setSelectedRecord(params.row);
            setDetailDialogOpen(true);
          }}
        >
          <Visibility />
        </IconButton>
      )
    }
  ];

  const getStats = () => {
    const total = filteredRecords.length;
    const today = filteredRecords.filter(record => {
      const recordDate = new Date(record.timestamp).toDateString();
      const todayDate = new Date().toDateString();
      return recordDate === todayDate;
    }).length;
    const uniqueUsers = new Set(filteredRecords.map(record => record.user_id)).size;
    const uniqueTables = new Set(filteredRecords.filter(record => record.table_name).map(record => record.table_name)).size;

    return { total, today, uniqueUsers, uniqueTables };
  };

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Timestamp', 'User', 'Action', 'Table', 'Record ID', 'IP Address'],
      ...filteredRecords.map(record => [
        record.id,
        record.timestamp,
        record.full_name || record.username || 'Unknown',
        record.action,
        record.table_name || 'System',
        record.record_id || 'N/A',
        record.ip_address || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isClient || loading) {
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
  const uniqueTables = Array.from(new Set(auditRecords.filter(record => record.table_name).map(record => record.table_name)));

  return (
    <Box>
      {/* Stats Cards */}
      <Stack direction="row" spacing={2} mb={3}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Records
            </Typography>
            <Typography variant="h4" component="div">
              {stats.total}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Today's Activity
            </Typography>
            <Typography variant="h4" component="div" color="primary">
              {stats.today}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Active Users
            </Typography>
            <Typography variant="h4" component="div" color="success.main">
              {stats.uniqueUsers}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Tables Affected
            </Typography>
            <Typography variant="h4" component="div" color="info.main">
              {stats.uniqueTables}
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Filters */}
      <Stack direction="row" spacing={2} mb={3} alignItems="center">
        <TextField
          label="Search audit records..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 300 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Table</InputLabel>
          <Select
            value={tableFilter}
            label="Table"
            onChange={(e) => setTableFilter(e.target.value)}
          >
            <MenuItem value="All">All Tables</MenuItem>
            {uniqueTables.map((table) => (
              <MenuItem key={table} value={table}>
                {table}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleExport}
        >
          Export CSV
        </Button>
      </Stack>

      {/* Data Grid */}
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredRecords}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          getRowId={(row) => row.id}
          sx={{
            '& .MuiDataGrid-cell:hover': {
              color: 'primary.main',
            },
          }}
        />
      </Box>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Audit Record Details
        </DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Action</Typography>
                <Typography variant="body1">{selectedRecord.action}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">User</Typography>
                <Typography variant="body1">
                  {selectedRecord.full_name || selectedRecord.username || 'Unknown'} 
                  ({selectedRecord.user_email})
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Timestamp</Typography>
                <Typography variant="body1">
                  {new Date(selectedRecord.timestamp).toLocaleString()}
                </Typography>
              </Box>
              {selectedRecord.table_name && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Table</Typography>
                  <Typography variant="body1">{selectedRecord.table_name}</Typography>
                </Box>
              )}
              {selectedRecord.record_id && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Record ID</Typography>
                  <Typography variant="body1">{selectedRecord.record_id}</Typography>
                </Box>
              )}
              {selectedRecord.ip_address && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">IP Address</Typography>
                  <Typography variant="body1" fontFamily="monospace">{selectedRecord.ip_address}</Typography>
                </Box>
              )}
              {selectedRecord.old_values && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Previous Values</Typography>
                  <Typography variant="body2" component="pre" sx={{ 
                    backgroundColor: 'grey.100', 
                    p: 1, 
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(selectedRecord.old_values, null, 2)}
                  </Typography>
                </Box>
              )}
              {selectedRecord.new_values && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">New Values</Typography>
                  <Typography variant="body2" component="pre" sx={{ 
                    backgroundColor: 'grey.100', 
                    p: 1, 
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(selectedRecord.new_values, null, 2)}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 