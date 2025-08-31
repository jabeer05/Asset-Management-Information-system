"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Button,
  Stack,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material';
import {
  Inventory,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Schedule,
  Person,
  LocationOn,
  Category,
  Assessment,
  Notifications,
  Visibility,
  Edit,
  Delete,
  Add,
  ArrowForward,
  ArrowUpward,
  ArrowDownward,
  Build,
  TransferWithinAStation,
  Gavel,
  RemoveCircle,
  Security,
  Settings,
  Timeline,
  PieChart,
  BarChart,
  ShowChart,
  CalendarToday,
  AccessTime,
  PriorityHigh,
  Info,
  ErrorOutline,
  Refresh
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalAssets: number;
  totalValue: number;
  activeAssets: number;
  maintenanceDue: number;
  criticalIssues: number;
  pendingTransfers: number;
  activeAuctions: number;
  pendingDisposals: number;
  totalUsers: number;
  unreadNotifications: number;
  monthlyDepreciation: number;
  yearlyDepreciation: number;
}

interface RecentActivity {
  id: number;
  type: 'asset' | 'maintenance' | 'transfer' | 'auction' | 'disposal' | 'user' | 'audit';
  action: string;
  description: string;
  user: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed' | 'in_progress';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

interface AssetCategory {
  category: string;
  count: number;
  value: number;
  percentage: number;
}

interface MaintenanceSchedule {
  id: number;
  assetName: string;
  assetId: string;
  type: string;
  dueDate: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  
  // State for real data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<MaintenanceSchedule[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard data function
  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      };
      
      // Fetch all dashboard data in parallel
      const [statsRes, categoriesRes, activitiesRes, maintenanceRes] = await Promise.all([
        fetch(`${API_BASE_URL}/dashboard/stats`, { headers }),
        fetch(`${API_BASE_URL}/dashboard/asset-categories`, { headers }),
        fetch(`${API_BASE_URL}/dashboard/recent-activities`, { headers }),
        fetch(`${API_BASE_URL}/dashboard/maintenance-schedule`, { headers })
      ]);

      // Check for authentication errors
      if (statsRes.status === 401 || categoriesRes.status === 401 || 
          activitiesRes.status === 401 || maintenanceRes.status === 401) {
        setError('Authentication failed. Please log in again.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Check for other errors
      if (!statsRes.ok || !categoriesRes.ok || !activitiesRes.ok || !maintenanceRes.ok) {
        const errorText = await statsRes.text();
        throw new Error(`Failed to fetch dashboard data: ${statsRes.status} ${errorText}`);
      }

      const [statsData, categoriesData, activitiesData, maintenanceData] = await Promise.all([
        statsRes.json(),
        categoriesRes.json(),
        activitiesRes.json(),
        maintenanceRes.json()
      ]);

      setStats(statsData);
      setAssetCategories(categoriesData || []);
      setRecentActivities(activitiesData || []);
      setMaintenanceSchedule(maintenanceData || []);
      setLoading(false);
      setRefreshing(false);
    } catch (err: any) {
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? String(err.message) 
        : 'Error fetching dashboard data';
      setError(errorMessage);
      console.error('Dashboard fetch error:', err);
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    // Only fetch dashboard data if user is authenticated and not loading
    if (typeof window !== 'undefined' && !isLoading && isAuthenticated) {
      fetchDashboardData();
    }
  }, [isLoading, isAuthenticated]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-NG').format(num);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'asset': return <Inventory />;
      case 'maintenance': return <Build />;
      case 'transfer': return <TransferWithinAStation />;
      case 'auction': return <Gavel />;
      case 'disposal': return <RemoveCircle />;
      case 'user': return <Person />;
      case 'audit': return <Security />;
      default: return <Info />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'asset': return 'primary';
      case 'maintenance': return 'warning';
      case 'transfer': return 'info';
      case 'auction': return 'secondary';
      case 'disposal': return 'error';
      case 'user': return 'success';
      case 'audit': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'in_progress': return 'info';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getMaintenanceStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'scheduled': return 'primary';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
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
          <Button color="inherit" size="small" onClick={() => fetchDashboardData(true)}>
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
            <Assessment color="primary" />
            Gusau LGA Dashboard Overview
          </Typography>

        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => router.push('/assets/new')}
          >
            Add Asset
          </Button>
          <Button
            variant="outlined"
            startIcon={<Build />}
            onClick={() => router.push('/maintenance/new')}
          >
            Schedule Maintenance
          </Button>
        </Stack>
      </Box>

      {/* Stats Cards - Minimal like transfers */}
      {stats && (
        <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Assets</Typography>
              <Typography variant="h4">{formatNumber(stats.totalAssets)}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Value</Typography>
              <Typography variant="h4">{formatCurrency(stats.totalValue)}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Active Assets</Typography>
              <Typography variant="h4" color="success.main">{formatNumber(stats.activeAssets)}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Maintenance Due</Typography>
              <Typography variant="h4" color="warning.main">{formatNumber(stats.maintenanceDue)}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Pending Transfers</Typography>
              <Typography variant="h4" color="info.main">{formatNumber(stats.pendingTransfers)}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Users</Typography>
              <Typography variant="h4" color="primary.main">{formatNumber(stats.totalUsers)}</Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Alerts */}
      {stats && stats.maintenanceDue > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {stats.maintenanceDue} asset(s) require maintenance attention.
        </Alert>
      )}

      {stats && stats.pendingTransfers > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {stats.pendingTransfers} transfer request(s) are pending approval.
        </Alert>
      )}

      {/* Main Content Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
        {/* Left Column */}
        <Box>
          {/* Asset Categories */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }} component="div">
              <Category color="primary" />
              Asset Categories
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Count</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell align="right">Percentage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assetCategories.map((category, idx) => (
                  <TableRow key={category.category + '-' + idx}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" component="span">
                        {category.category}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" component="span">
                        {formatNumber(category.count)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium" component="span">
                        {formatCurrency(category.value)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${category.percentage}%`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {/* Recent Activities */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }} component="div">
              <Timeline color="primary" />
              Recent Activities
            </Typography>
            <List>
              {recentActivities.map((activity) => (
                <ListItem key={activity.id + '-' + activity.timestamp} divider>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: `${getActivityColor(activity.type)}.main` }}>
                      {getActivityIcon(activity.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="medium" component="span">
                          {activity.action}
                        </Typography>
                        <Chip
                          label={activity.status}
                          size="small"
                          color={getStatusColor(activity.status) as any}
                        />
                        {activity.priority && (
                          <Chip
                            label={activity.priority}
                            size="small"
                            color={getPriorityColor(activity.priority) as any}
                            variant="outlined"
                          />
                        )}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary" component="span" display="block">
                          {activity.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" component="span" display="block">
                          by {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>

        {/* Right Column */}
        <Box>
          {/* Maintenance Schedule */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }} component="div">
              <Schedule color="primary" />
              Maintenance Schedule
            </Typography>
            <List>
              {maintenanceSchedule.map((maintenance, idx) => (
                <ListItem key={maintenance.id + '-' + maintenance.assetName + '-' + idx} divider>
                  <ListItemText
                    primary={
                      <Typography component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="medium" component="span">
                          {maintenance.assetName}
                        </Typography>
                        <Chip
                          label={maintenance.status}
                          size="small"
                        />
                        <Chip
                          label={maintenance.priority}
                          size="small"
                          color={getPriorityColor(maintenance.priority) as any}
                          variant="outlined"
                        />
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary" component="span" display="block">
                          {maintenance.type} • Due: {maintenance.dueDate}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" component="span" display="block">
                          Assigned to: {maintenance.assignedTo}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 