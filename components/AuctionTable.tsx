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
  Gavel,
  Timer,
  CheckCircle,
  Cancel,
  AttachMoney,
  People,
  Refresh,
  CheckCircleOutline,
  Schedule,
  Delete
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import MessageModal from './MessageModal';

interface AuctionRecord {
  id: number;
  auction_id: string;
  asset_id: number;
  asset_name: string;
  asset_category: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  starting_bid: number;
  reserve_price?: number;
  current_highest_bid?: number;
  status: string;
  winning_bid_id?: number;
  final_price?: number;
  winner_id?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  total_bids: number;
  total_bidders: number;
}

const statuses = ["All", "draft", "published", "bidding_open", "bidding_closed", "completed", "cancelled"];

export default function AuctionTable() {
  const router = useRouter();
  const [auctions, setAuctions] = useState<AuctionRecord[]>([]);
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

  // Auth context for role-based access control
  const { user, isAuctionManager, getUserLocations } = useAuth();

  // Check if user is admin or auction manager
  const isAdminOrAuctionManager = user?.role === 'admin' || isAuctionManager();

  // Get user's assigned locations for display
  const userLocations = getUserLocations();
  const isLocationRestricted = isAuctionManager() && userLocations.length > 0;

  useEffect(() => {
    fetchAuctions();
  }, []);

  // Refresh auctions when component mounts or when returning from auction creation
  useEffect(() => {
    const handleFocus = () => {
      fetchAuctions();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Add refresh function
  const refreshAuctions = () => {
    console.log('Refreshing auctions...');
    fetchAuctions(true);
  };

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      const response = await fetch('/api/auctions', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Failed to fetch auctions');
      }
      
      const data = await response.json();
      setAuctions(data);
    } catch (err) {
      console.log('Auction fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateAuctionStatus = async (auctionId: number, newStatus: string) => {
    setUpdating(prev => ({ ...prev, [auctionId]: true }));
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in.');
        return;
      }

      const res = await fetch(`/api/auctions/${auctionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setAuctions(prev => prev.map(auction => 
          auction.id === auctionId ? { ...auction, status: newStatus as any } : auction
        ));
        
        // Show success message for completed auctions
        if (newStatus === 'completed') {
          const auction = auctions.find(a => a.id === auctionId);
          if (auction) {
            setMessageModal({
              open: true,
              type: 'success',
              title: 'Auction Completed Successfully!',
              message: `Auction "${auction.title}" has been completed and the asset has been removed from inventory.`,
              details: `Asset "${auction.asset_name}" has been sold via auction and deleted from the database.`
            });
          }
        } else {
          // Show success for other status updates
          setMessageModal({
            open: true,
            type: 'success',
            title: 'Status Updated Successfully!',
            message: `Auction status has been updated to "${newStatus}".`,
            details: 'The auction has been updated in the system.'
          });
        }
      } else {
        const errorText = await res.text();
        setMessageModal({
          open: true,
          type: 'error',
          title: 'Failed to Update Auction',
          message: 'Unable to update auction status.',
          details: errorText
        });
      }
    } catch (e: any) {
      setMessageModal({
        open: true,
        type: 'error',
        title: 'Update Failed',
        message: 'An error occurred while updating the auction status.',
        details: e.message
      });
    } finally {
      setUpdating(prev => ({ ...prev, [auctionId]: false }));
    }
  };

  const deleteAuctionAsset = async (auctionId: number) => {
    setUpdating(prev => ({ ...prev, [auctionId]: true }));
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in.');
        return;
      }

      const res = await fetch(`/api/auctions/${auctionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (res.ok) {
        const result = await res.json();
        // Remove the auction from the list since the asset is deleted
        setAuctions(prev => prev.filter(auction => auction.id !== auctionId));
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
      setUpdating(prev => ({ ...prev, [auctionId]: false }));
    }
  };

  const formatCurrency = (value: number) => {
    return `₦${value.toLocaleString('en-NG')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'bidding_open': return 'info';
      case 'published': return 'primary';
      case 'bidding_closed': return 'warning';
      case 'draft': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const isAuctionActive = (auction: AuctionRecord) => {
    const now = new Date();
    const startDate = new Date(auction.start_date);
    const endDate = new Date(auction.end_date);
    return now >= startDate && now <= endDate && auction.status === 'bidding_open';
  };

  const isAuctionEnded = (auction: AuctionRecord) => {
    const now = new Date();
    const endDate = new Date(auction.end_date);
    return now > endDate;
  };

  // Filter records
  const filteredRecords = auctions.filter(record => {
    const matchesSearch = (record.asset_name && record.asset_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (record.title && record.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (record.description && record.description.toLowerCase().includes(searchTerm.toLowerCase()));
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
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.asset_category}
          </Typography>
        </Box>
      )
    },
    { 
      field: "title", 
      headerName: "Auction Title", 
      width: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.description}
          </Typography>
        </Box>
      )
    },
    { 
      field: "status", 
      headerName: "Status", 
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value.charAt(0).toUpperCase() + params.value.slice(1).replace('_', ' ')}
          size="small"
          color={getStatusColor(params.value) as any}
          variant="outlined"
        />
      )
    },
    { 
      field: "starting_bid", 
      headerName: "Starting Bid", 
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">
          {formatCurrency(params.value)}
        </Typography>
      )
    },
    { 
      field: "current_highest_bid", 
      headerName: "Current Bid", 
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium" color="primary">
          {params.value ? formatCurrency(params.value) : 'No bids'}
        </Typography>
      )
    },
    { 
      field: "final_bid", 
      headerName: "Final Bid", 
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium" color="success.main">
          {params.value ? formatCurrency(params.value) : '-'}
        </Typography>
      )
    },
    { 
      field: "winner", 
      headerName: "Winner", 
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">
          {params.value || '-'}
        </Typography>
      )
    },
    { 
      field: "total_bids", 
      headerName: "Bids", 
      width: 100,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <People fontSize="small" />
          <Typography variant="body2">
            {params.value} ({params.row.total_bidders} bidders)
          </Typography>
        </Box>
      )
    },
    { 
      field: "start_date", 
      headerName: "Start Date", 
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          {new Date(params.value).toLocaleDateString()}
        </Typography>
      )
    },
    { 
      field: "end_date", 
      headerName: "End Date", 
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          {new Date(params.value).toLocaleDateString()}
        </Typography>
      )
    },
    { 
      field: "location", 
      headerName: "Location", 
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">
          {params.value || '-'}
        </Typography>
      )
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 550,
      renderCell: (params) => {
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Regular actions */}
            <Button
              size="small"
              variant="outlined"
              onClick={() => router.push(`/auctions/${params.row.id}`)}
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
              onClick={() => router.push(`/auctions/${params.row.id}/edit`)}
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
                onClick={() => updateAuctionStatus(params.row.id, 'published')}
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
                onClick={() => updateAuctionStatus(params.row.id, 'cancelled')}
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
          {(user?.role === 'admin' || user?.role === 'auction_manager') && (
            <>
              {/* For published auctions - Open bidding/Complete */}
              {params.row.status === 'published' && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => updateAuctionStatus(params.row.id, 'bidding_open')}
                    disabled={updating[params.row.id]}
                    startIcon={updating[params.row.id] ? <CircularProgress size={16} /> : <CheckCircle />}
                    sx={{ 
                      fontWeight: 'bold',
                      minWidth: 60,
                      bgcolor: '#2196f3', // Blue for Open Bidding
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
                    {updating[params.row.id] ? 'Opening...' : 'Open Bidding'}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => updateAuctionStatus(params.row.id, 'cancelled')}
                    disabled={updating[params.row.id]}
                    startIcon={updating[params.row.id] ? <CircularProgress size={16} /> : <Cancel />}
                    sx={{ 
                      fontWeight: 'bold',
                      minWidth: 60,
                      bgcolor: '#ff9800', // Orange for Cancel
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
                    {updating[params.row.id] ? 'Cancelling...' : 'Cancel'}
                  </Button>
                </>
              )}
              
              {/* For bidding_open auctions - Close bidding/Complete */}
              {params.row.status === 'bidding_open' && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => updateAuctionStatus(params.row.id, 'bidding_closed')}
                    disabled={updating[params.row.id]}
                    startIcon={updating[params.row.id] ? <CircularProgress size={16} /> : <CheckCircle />}
                    sx={{ 
                      fontWeight: 'bold',
                      minWidth: 60,
                      bgcolor: '#9c27b0', // Purple for Close Bidding
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
                    {updating[params.row.id] ? 'Closing...' : 'Close Bidding'}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => updateAuctionStatus(params.row.id, 'completed')}
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
                </>
              )}
              
              {/* For bidding_closed auctions - Complete/Reopen */}
              {params.row.status === 'bidding_closed' && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => updateAuctionStatus(params.row.id, 'completed')}
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
                    onClick={() => updateAuctionStatus(params.row.id, 'bidding_open')}
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
                </>
              )}
              
              {/* For cancelled auctions - Approve */}
              {params.row.status === 'cancelled' && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => updateAuctionStatus(params.row.id, 'published')}
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
              
              {/* For completed auctions - Reopen and Delete Asset */}
              {params.row.status === 'completed' && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => updateAuctionStatus(params.row.id, 'bidding_closed')}
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
                        deleteAuctionAsset(params.row.id);
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
        );
      }
    }
  ];

  const getStats = () => {
    const total = filteredRecords.length;
    const active = filteredRecords.filter(auction => isAuctionActive(auction)).length;
    const completed = filteredRecords.filter(auction => auction.status === 'completed').length;
    const totalValue = filteredRecords.reduce((sum, auction) => sum + (auction.current_highest_bid || auction.starting_bid), 0);

    return { total, active, completed, totalValue };
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
          <Gavel color="primary" />
          Auction Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={refreshAuctions}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push('/auctions/new')}
          >
            New Auction
          </Button>
        </Box>
      </Box>

      {/* Location-based access alert */}
      {isLocationRestricted && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Location-Based Access:</strong> You can only view and manage auctions for assets in your assigned locations: 
            <strong> {userLocations.join(', ')}</strong>
          </Typography>
        </Alert>
      )}

      {/* Stats Cards */}
      <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Auctions
            </Typography>
            <Typography variant="h4" component="div">
              {stats.total}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Auctions
            </Typography>
            <Typography variant="h4" component="div" color="primary">
              {stats.active}
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
              placeholder="Search auctions, assets, or descriptions..."
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
            Showing {filteredRecords.length} of {auctions.length} auction records
          </Typography>
          {isLocationRestricted && auctions.length === 0 && !loading && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No auctions found in your assigned locations. Contact an administrator if you need access to additional locations.
            </Typography>
          )}
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