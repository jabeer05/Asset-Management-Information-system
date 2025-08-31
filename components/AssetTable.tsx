"use client";
import * as React from "react";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { 
  Box, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  DialogContentText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Typography,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Alert,
  Snackbar
} from "@mui/material";
import { useRouter } from "next/navigation";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ExportDialog from "./ExportDialog";
import { getAssets, deleteAsset } from "../app/api/assets";
import type { Asset } from "../types/asset";
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { useAuth } from "../contexts/AuthContext";

const categories = ["All", "Office Equipment", "Computer & IT Equipment", "Furniture & Fixtures", "Vehicles & Transportation", "Building & Infrastructure", "Medical Equipment", "Educational Equipment", "Agricultural Equipment", "Security Equipment", "Communication Equipment", "Electrical Equipment", "Plumbing Equipment", "HVAC Equipment", "Kitchen Equipment", "Cleaning Equipment", "Sports Equipment", "Audio/Visual Equipment", "Printing Equipment", "Tools & Machinery", "Generators & Power Equipment"];
const locations = ["All", "Gusau Secretariat - Main Building", "Gusau Secretariat - Annex Building", "Gusau Municipal Council", "Gusau Rural Development Authority", "Gusau North District Office", "Gusau South District Office", "Gusau East District Office", "Gusau West District Office", "Gusau Central Market", "Gusau General Hospital", "Gusau Primary Healthcare Centers", "Gusau Schools & Educational Institutions", "Gusau Police Station", "Gusau Fire Service Station", "Gusau Water Works", "Gusau Waste Management Facility", "Gusau Agricultural Extension Office", "Gusau Youth Development Center", "Gusau Women Development Center", "Gusau Community Development Centers", "Gusau Sports Complex", "Gusau Library", "Gusau Post Office", "Gusau Banks & Financial Institutions", "Gusau Transport Terminal", "Gusau Storage Facilities", "Gusau Workshop & Maintenance Centers", "Gusau Field Offices", "Gusau Outstation Offices", "Gusau Temporary Locations"];
const statuses = ["All", "active", "maintenance", "disposed", "auctioned"];

export default function AssetTable() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, canManageAssets, canAccessAssetLocation, getUserLocations, isMaintenanceManager } = useAuth();
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [assetToDelete, setAssetToDelete] = React.useState<number | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);
  const [selectedRows, setSelectedRows] = React.useState<number[]>([]);
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  const [exportLoading, setExportLoading] = React.useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("All");
  const [locationFilter, setLocationFilter] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("All");

  const [complaintDialogOpen, setComplaintDialogOpen] = React.useState(false);
  const [complaintAsset, setComplaintAsset] = React.useState<Asset | null>(null);
  const [complaintType, setComplaintType] = React.useState('');
  const [complaintDescription, setComplaintDescription] = React.useState('');
  const [complaintSubmitting, setComplaintSubmitting] = React.useState(false);
  const [complaintSuccess, setComplaintSuccess] = React.useState(false);
  
  // Different complaint types based on user role
  const complaintTypes = user?.role === 'user' ? [
    { value: 'maintenance_required', label: 'Maintenance Required' },
    { value: 'repair_needed', label: 'Repair Needed' },
    { value: 'replacement_requested', label: 'Replacement Requested' },
    { value: 'safety_concern', label: 'Safety Concern' },
    { value: 'performance_issue', label: 'Performance Issue' },
    { value: 'other_maintenance', label: 'Other Maintenance Issue' }
  ] : [
    { value: 'scrap', label: 'Scrap' },
    { value: 'out_of_date', label: 'Out of Date' },
    { value: 'request_new', label: 'Request New Asset' },
    { value: 'other', label: 'Other' },
  ];

  // Get user's asset access locations
  const getUserAssetAccess = () => {
    if (!user || user.role === 'admin') return null;
    
    if (user.asset_access) {
      if (typeof user.asset_access === 'string') {
        try {
          return JSON.parse(user.asset_access);
        } catch {
          return [user.asset_access];
        }
      }
      return user.asset_access;
    }
    return null;
  };

  const userAssetAccess = getUserAssetAccess();

  // Get accessible locations for the user
  const getAccessibleLocations = () => {
    const userLocations = getUserLocations();
    if (userLocations.length === 0) return locations; // Admin or all access
    return ["All", ...userLocations];
  };

  const accessibleLocations = getAccessibleLocations();

  React.useEffect(() => {
    // Only fetch assets if user is authenticated and not loading
    if (!isLoading && isAuthenticated && user) {
      async function fetchAssets() {
        setLoading(true);
        try {
          const data = await getAssets();
          console.log('Raw assets data from API:', data);
          console.log('Sample asset structure:', data[0]);
          setAssets(data);
        } catch (e) {
          console.error('Error fetching assets:', e);
          // If it's an authentication error, user needs to login
          if (e instanceof Error && e.message.includes('401')) {
            console.log('Authentication required - user needs to login');
          }
          setAssets([]);
        }
        setLoading(false);
      }
      fetchAssets();
    }
  }, [user, isAuthenticated, isLoading]); // Add authentication state as dependencies

  // Normalize assets to ensure correct field names for table
  const normalizedAssets: Asset[] = assets.map(asset => {
    console.log('Normalizing asset:', asset);
    console.log('Cost fields:', {
      purchase_cost: asset.purchase_cost,
      cost: asset.cost,
      total_cost_with_vat: asset.total_with_vat,
      current_value: asset.purchase_cost
    });
    
    // Handle cost conversion properly - PostgreSQL DECIMAL might come as string
    let costValue = 0;
    if (asset.purchase_cost !== null && asset.purchase_cost !== undefined) {
      costValue = typeof asset.purchase_cost === 'string' ? parseFloat(asset.purchase_cost) : Number(asset.purchase_cost);
    } else if (asset.cost !== null && asset.cost !== undefined) {
      costValue = typeof asset.cost === 'string' ? parseFloat(asset.cost) : Number(asset.cost);
    } else if (asset.total_with_vat !== null && asset.total_with_vat !== undefined) {
      costValue = typeof asset.total_with_vat === 'string' ? parseFloat(asset.total_with_vat) : Number(asset.total_with_vat);
    } else if (asset.purchase_cost !== null && asset.purchase_cost !== undefined) {
      costValue = typeof asset.purchase_cost === 'string' ? parseFloat(asset.purchase_cost) : Number(asset.purchase_cost);
    }
    
    const normalized = {
      ...asset,
      category: asset.category || asset.category_name || '',
      location: asset.location || asset.location_name || '',
      quantity: Number(asset.quantity ?? asset.qty ?? 1),
      purchase_cost: costValue,
    };
    console.log('Normalized asset cost:', normalized.purchase_cost);
    return normalized;
  });

  const handleDeleteClick = (assetId: number) => {
    setAssetToDelete(assetId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (assetToDelete) {
      try {
        await deleteAsset(assetToDelete.toString());
        setAssets((prev) => prev.filter((a) => a.id !== assetToDelete));
      } catch (e) {
        // handle error
      }
      router.refresh();
    }
    setDeleteDialogOpen(false);
    setAssetToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAssetToDelete(null);
  };

  const handleBulkDeleteClick = () => {
    if (selectedRows.length > 0) {
      setBulkDeleteDialogOpen(true);
    }
  };

  const handleBulkDeleteConfirm = () => {
    console.log("Deleting assets:", selectedRows);
    setSelectedRows([]);
    setBulkDeleteDialogOpen(false);
    router.refresh();
  };

  const handleBulkDeleteCancel = () => {
    setBulkDeleteDialogOpen(false);
  };

  const handleExport = (options: any) => {
    setExportLoading(true);
    
    setTimeout(() => {
      let assetsToExport = [...normalizedAssets];
      
      // Apply category filter
      if (options.categories.length > 0) {
        assetsToExport = assetsToExport.filter(asset => 
          options.categories.includes(asset.category)
        );
      }
      
      // Apply asset name filter
      if (options.assetNames.length > 0) {
        assetsToExport = assetsToExport.filter(asset =>
          options.assetNames.some((name: string) => 
            asset.name.toLowerCase().includes(name.toLowerCase())
          )
        );
      }
      
      // Apply time filter (simplified - in real app would use actual dates)
      if (options.timeFilter !== 'all') {
        console.log('Filtering by time:', options.timeFilter);
      }
      
      // Generate CSV content
      let csvContent = '';
      
      if (options.format === 'csv') {
        // Generate headers based on selected columns
        const headers = options.columns.join(',');
        csvContent = `${headers}\n`;
        
        // Add data rows
        assetsToExport.forEach(asset => {
          const row = options.columns.map((col: string) => {
            switch (col) {
              case 'ID': return asset.id;
              case 'Name': return asset.name;
              case 'Description': return asset.description;
              case 'Category': return asset.category;
              case 'Location': return asset.location;
              case 'Status': return asset.status;
              case 'Quantity': return asset.quantity || 0;
              case 'Cost Per Unit': return asset.cost_per_unit || 0;
              case 'Total Cost': return asset.purchase_cost || 0;
              case 'VAT Amount': return (asset.purchase_cost || 0) * 0.075;
              case 'Total with VAT': return (asset.purchase_cost || 0) * 1.075;
              case 'Purchase Date': return asset.purchase_date;
              case 'Serial Number': return asset.serial_number;
              default: return '';
            }
          });
          csvContent += row.join(',') + '\n';
        });
      }
      
      const dataBlob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `assets-export-${options.timeFilter}.${options.format}`;
      link.click();
      
      setExportLoading(false);
      setExportDialogOpen(false);
    }, 2000);
  };

  const handleOpenComplaintDialog = (asset: Asset) => {
    setComplaintAsset(asset);
    setComplaintType('');
    setComplaintDescription('');
    setComplaintDialogOpen(true);
  };
  const handleCloseComplaintDialog = () => {
    setComplaintDialogOpen(false);
    setComplaintAsset(null);
    setComplaintType('');
    setComplaintDescription('');
  };
  const handleSubmitComplaint = async () => {
    setComplaintSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (user?.role === 'user') {
        // For users with role 'user', create a maintenance complaint
        const res = await fetch(`http://localhost:8000/maintenance-complaints/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            asset_id: complaintAsset?.id,
            asset_name: complaintAsset?.name,
            complaint_type: complaintType,
            description: complaintDescription,
            user_location: user.department || 'Unknown',
            user_department: user.department,
            priority: complaintType === 'safety_concern' ? 'high' : 'medium'
          })
        });
        
        if (res.ok) {
          setComplaintSuccess(true);
        } else {
          setComplaintSuccess(false);
        }
      } else {
        // For admin/manager users, use the existing complaint system
        const res = await fetch(`http://localhost:8000/assets/${complaintAsset?.id}/complaints`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            complaint_type: complaintType,
            description: complaintDescription,
          })
        });
        
        if (res.ok) {
          setComplaintSuccess(true);
        } else {
          setComplaintSuccess(false);
        }
      }
    } catch {
      setComplaintSuccess(false);
    }
    setComplaintSubmitting(false);
    setComplaintDialogOpen(false);
  };

  // Filter and search logic
  const filteredAssets: Asset[] = normalizedAssets.filter((row: Asset) => {
    // First, check if user has access to this asset's location
    if (!canAccessAssetLocation(row.location)) {
      return false;
    }
    
    const matchesSearch = row.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         row.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         row.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "All" || row.category === categoryFilter;
    const matchesLocation = locationFilter === "All" || row.location === locationFilter;
    const matchesStatus = statusFilter === "All" || row.status === statusFilter;
    return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
  });

  const getStats = () => {
    const total = filteredAssets.length;
    const active = filteredAssets.filter(a => a.status === 'active').length;
    const maintenance = filteredAssets.filter(a => a.status === 'maintenance').length;
    const disposed = filteredAssets.filter(a => a.status === 'disposed').length;
    const auctioned = filteredAssets.filter(a => a.status === 'auctioned').length;
    const totalValue = filteredAssets.reduce((sum, a) => {
      const cost = Number(a.purchase_cost) || 0;
      console.log(`Asset ${a.id} cost: ${a.purchase_cost} -> ${cost}`);
      return sum + cost;
    }, 0);

    console.log('Stats calculation:', { total, active, maintenance, disposed, auctioned, totalValue });
    return { total, active, maintenance, disposed, auctioned, totalValue };
  };

  const stats = getStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 60 },
    { field: "name", headerName: "Name", width: 150 },
    { field: "description", headerName: "Description", width: 150 },
    { field: "category", headerName: "Category", width: 100 },
    { field: "location", headerName: "Location", width: 100 },
    { field: "status", headerName: "Status", width: 80 },
    { field: "purchase_date", headerName: "Purchase Date", width: 110 },
    { field: "quantity", headerName: "Qty", width: 60, type: 'number' },
    { field: "purchase_cost", headerName: "Cost", width: 80, type: 'number',
      valueFormatter: (params: any) => {
        const value = params.value;
        if (value !== null && value !== undefined && value !== '') {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            return numValue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
          }
        }
        return '0.00';
      }
    },
    { field: "image_url", headerName: "Image", width: 100, renderCell: (params) => (
      params.value ? (
        <img 
          src={params.value.startsWith('http') ? params.value : `http://localhost:8000${params.value}`}
          alt="Asset" 
          style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }}
          onError={(e) => {
            console.error('Failed to load image:', params.value);
            e.currentTarget.style.display = 'none';
            // Show placeholder instead
            const placeholder = document.createElement('div');
            placeholder.innerHTML = '<div style="width: 60px; height: 40px; background-color: #eee; display: flex; align-items: center; justify-content: center; border-radius: 4px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="#999"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg></div>';
            e.currentTarget.parentNode?.appendChild(placeholder.firstChild!);
          }}
        />
      ) : (
        <Box sx={{ width: 60, height: 40, bgcolor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
          <InventoryIcon color="disabled" />
        </Box>
      )
    ) },
    {
      field: "actions",
      headerName: "Actions",
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Asset">
            <IconButton
              size="small"
              color="primary"
              onClick={() => router.push(`/assets/${params.row.id.toString()}`)}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {canManageAssets() && (
            <Tooltip title="Edit Asset">
              <IconButton
                size="small"
                color="secondary"
                onClick={() => router.push(`/assets/${params.row.id.toString()}/edit`)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canManageAssets() && (
            <Tooltip title="Delete Asset">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDeleteClick(params.row.id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="File Complaint">
            <IconButton
              size="small"
              color="warning"
              onClick={() => handleOpenComplaintDialog(params.row)}
            >
              <ReportProblemIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon color="primary" />
          Gusau LGA Asset Management
        </Typography>
        {canManageAssets() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/assets/new')}
          >
            Add Asset
          </Button>
        )}
      </Box>

      {/* Location Access Indicator */}
      {userAssetAccess && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          icon={<LocationOnIcon />}
        >
          <Typography variant="body2" component="div">
            <strong>Location-based Access:</strong> You can only view and manage assets from your assigned location(s):{' '}
            {userAssetAccess.map((location: string, index: number) => (
              <Chip 
                key={location} 
                label={location} 
                size="small" 
                color="primary" 
                variant="outlined"
                sx={{ mr: 0.5 }}
              />
            ))}
          </Typography>
        </Alert>
      )}

      {/* Admin Access Notification */}
      {user?.role === 'admin' && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
        >
          <Typography variant="body2" component="div">
            <strong>Admin Access:</strong> As an administrator, you have full access to view, edit, and manage all assets across all locations.
          </Typography>
        </Alert>
      )}

      {/* Maintenance Manager Access Notification */}
      {isMaintenanceManager() && user?.role !== 'admin' && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
        >
          <Typography variant="body2" component="div">
            <strong>Maintenance Manager Access:</strong> As a maintenance manager, you can view, edit, and update assets from your assigned locations. 
            This allows you to manage maintenance-related asset information efficiently.
          </Typography>
        </Alert>
      )}

      {/* View-only Access Notification for Auction/Disposal Managers */}
      {user && (user.role === 'auction_manager' || user.role === 'disposal_manager') && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
        >
          <Typography variant="body2" component="div">
            <strong>View-Only Access:</strong> As a {user.role.replace('_', ' ')} manager, you can view assets but cannot add, edit, or delete them. 
            This ensures data integrity for auction and disposal processes.
          </Typography>
        </Alert>
      )}

      {/* Stats Cards - Minimal like transfers */}
      <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Total Assets</Typography>
            <Typography variant="h4">{stats.total}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Active</Typography>
            <Typography variant="h4" color="success.main">{stats.active}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Maintenance</Typography>
            <Typography variant="h4" color="warning.main">{stats.maintenance}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Disposed</Typography>
            <Typography variant="h4" color="error.main">{stats.disposed}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Auctioned</Typography>
            <Typography variant="h4" color="info.main">{stats.auctioned}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Total Value</Typography>
            <Typography variant="h4" color="primary.main">{formatCurrency(stats.totalValue)}</Typography>
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
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ minWidth: 200 }}
            />
            
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Location</InputLabel>
              <Select
                value={locationFilter}
                label="Location"
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                {accessibleLocations.map((loc) => (
                  <MenuItem key={loc} value={loc}>{loc}</MenuItem>
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
          
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Showing {filteredAssets.length} of {assets.length} assets
            </Typography>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => setExportDialogOpen(true)}
              disabled={exportLoading}
            >
              Export Assets
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* DataGrid */}
      <Box sx={{ height: 400, width: "100%" }}>
        <DataGrid 
          key={filteredAssets.length} // Force re-render when data changes
          rows={filteredAssets} 
          columns={columns} 
          loading={loading}
          checkboxSelection={canManageAssets()}
          onRowSelectionModelChange={(newSelectionModel) => {
            setSelectedRows(newSelectionModel as number[]);
          }}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 5 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
        />
      </Box>
      
      {/* Single Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Asset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this asset? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={handleBulkDeleteCancel}>
        <DialogTitle>Delete Multiple Assets</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedRows.length} selected assets? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBulkDeleteCancel}>Cancel</Button>
          <Button onClick={handleBulkDeleteConfirm} color="error" variant="contained">
            Delete All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
        loading={exportLoading}
      />

      {/* Complaint Dialog */}
      <Dialog open={complaintDialogOpen} onClose={handleCloseComplaintDialog}>
        <DialogTitle>
          {user?.role === 'user' ? 'Submit Maintenance Request' : 'File Complaint for Asset'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>Asset: {complaintAsset?.name}</Typography>
          {user?.role === 'user' && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Your maintenance request will be sent to the maintenance manager and administrators for review.
            </Typography>
          )}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>
              {user?.role === 'user' ? 'Maintenance Type' : 'Complaint Type'}
            </InputLabel>
            <Select
              value={complaintType}
              label={user?.role === 'user' ? 'Maintenance Type' : 'Complaint Type'}
              onChange={e => setComplaintType(e.target.value)}
            >
              {complaintTypes.map(type => (
                <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={user?.role === 'user' ? 'Maintenance Details' : 'Description'}
            fullWidth
            multiline
            rows={3}
            sx={{ mt: 2 }}
            value={complaintDescription}
            onChange={e => setComplaintDescription(e.target.value)}
            placeholder={
              user?.role === 'user' 
                ? "Describe the maintenance issue, repair needed, or replacement request in detail..."
                : "Describe the issue or request in detail..."
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseComplaintDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmitComplaint} 
            variant="contained" 
            color={user?.role === 'user' ? 'primary' : 'warning'} 
            disabled={complaintSubmitting || !complaintType || !complaintDescription}
          >
            {user?.role === 'user' ? 'Submit Maintenance Request' : 'Submit Complaint'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Complaint Success Snackbar */}
      <Snackbar
        open={complaintSuccess}
        autoHideDuration={3000}
        onClose={() => setComplaintSuccess(false)}
        message={
          user?.role === 'user' 
            ? "Maintenance request submitted successfully! Maintenance manager and administrators have been notified."
            : "Complaint submitted successfully!"
        }
      />
    </Box>
  );
} 