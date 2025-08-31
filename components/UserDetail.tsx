"use client";
import React from 'react';
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Person,
  Edit,
  ArrowBack,
  CheckCircle,
  Block,
  AdminPanelSettings,
  Security,
  Email,
  Phone,
  LocationOn,
  Work,
  CalendarToday,
  AccessTime,
  Lock,
  Visibility
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface UserRecord {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'user' | 'auditor' | 'viewer';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  department: string;
  position: string;
  phone?: string;
  location?: string;
  last_login?: string;
  created_date: string;
  permissions: string[];
  asset_access: string[];
  notes?: string;
}

interface UserDetailProps {
  userId: number;
}

const mockUserRecord: UserRecord = {
  id: 1,
  username: "admin",
  email: "admin@company.com",
  first_name: "John",
  last_name: "Admin",
  role: "admin",
  status: "active",
  department: "IT",
  position: "System Administrator",
  phone: "+234 801 234 5678",
  location: "Lagos HQ",
  last_login: "2024-02-15T10:30:00",
  created_date: "2023-01-15",
  permissions: ["all"],
  asset_access: ["all"],
  notes: "Primary system administrator with full access to all system features and user management capabilities."
};

const mockRecentActivity = [
  {
    id: 1,
    action: "Logged in",
    timestamp: "2024-02-15T10:30:00",
    details: "User logged in from Lagos HQ"
  },
  {
    id: 2,
    action: "Created Asset",
    timestamp: "2024-02-14T15:45:00",
    details: "Added new laptop asset (ID: 123)"
  },
  {
    id: 3,
    action: "Updated User",
    timestamp: "2024-02-14T14:20:00",
    details: "Modified user permissions for Sarah Johnson"
  },
  {
    id: 4,
    action: "Generated Report",
    timestamp: "2024-02-14T11:15:00",
    details: "Exported asset inventory report"
  },
  {
    id: 5,
    action: "Logged in",
    timestamp: "2024-02-13T09:30:00",
    details: "User logged in from Lagos HQ"
  }
];

export default function UserDetail({ userId }: UserDetailProps) {
  const router = useRouter();
  const record = mockUserRecord; // In real app, fetch by ID

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'manager': return 'primary';
      case 'user': return 'success';
      case 'auditor': return 'warning';
      case 'viewer': return 'default';
      default: return 'default';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <AdminPanelSettings />;
      case 'manager': return <Security />;
      case 'user': return <Person />;
      case 'auditor': return <Security />;
      case 'viewer': return <Person />;
      default: return <Person />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle />;
      case 'inactive': return <Block />;
      case 'suspended': return <Block />;
      case 'pending': return <CheckCircle />;
      default: return <CheckCircle />;
    }
  };

  const getPermissionLabel = (permission: string) => {
    const labels: { [key: string]: string } = {
      'all': 'All Permissions',
      'assets': 'Asset Management',
      'users': 'User Management',
      'reports': 'Reports & Analytics',
      'audit': 'Audit & Compliance',
      'maintenance': 'Maintenance',
      'transfers': 'Transfers',
      'auctions': 'Auctions',
      'disposals': 'Disposals',
      'settings': 'System Settings',
      'view': 'View Only'
    };
    return labels[permission] || permission;
  };

  const getAssetAccessLabel = (access: string) => {
    const labels: { [key: string]: string } = {
      'all': 'All Assets',
      'it': 'IT Assets',
      'finance': 'Finance Assets',
      'operations': 'Operations Assets',
      'hr': 'HR Assets',
      'office': 'Office Assets',
      'vehicles': 'Vehicles',
      'equipment': 'Equipment'
    };
    return labels[access] || access;
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
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getRoleIcon(record.role)}
          User Profile
        </Typography>
        <Box sx={{ ml: 'auto' }}>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => router.push(`/users/${record.id}/edit`)}
          >
            Edit User
          </Button>
        </Box>
      </Box>

      {/* Status Alert */}
      {record.status === 'suspended' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          This user account has been suspended.
        </Alert>
      )}

      {record.status === 'inactive' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This user account is currently inactive.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Information */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
                  {(record.first_name?.charAt(0) || '')}{(record.last_name?.charAt(0) || '')}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {record.first_name} {record.last_name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    @{record.username}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      icon={getRoleIcon(record.role)}
                      label={(record.role?.charAt(0)?.toUpperCase() || '') + (record.role?.slice(1) || '')}
                      color={getRoleColor(record.role) as any}
                      variant="outlined"
                    />
                    <Chip
                      icon={getStatusIcon(record.status)}
                      label={(record.status?.charAt(0)?.toUpperCase() || '') + (record.status?.slice(1) || '')}
                      color={getStatusColor(record.status) as any}
                    />
                  </Box>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Email color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="medium">
                    {record.email}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Phone color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Phone
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="medium">
                    {record.phone || 'Not provided'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Work color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Department
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="medium">
                    {record.department}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Person color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Position
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="medium">
                    {record.position}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LocationOn color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Location
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="medium">
                    {record.location || 'Not specified'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AccessTime color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Last Login
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="medium">
                    {record.last_login ? formatDateTime(record.last_login) : 'Never'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Permissions
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {record.permissions.map((permission) => (
                  <Chip
                    key={permission}
                    icon={<Lock />}
                    label={getPermissionLabel(permission)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Asset Access */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Asset Access
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {record.asset_access.map((access) => (
                  <Chip
                    key={access}
                    icon={<Visibility />}
                    label={getAssetAccessLabel(access)}
                    color="secondary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              
              <List>
                {mockRecentActivity.map((activity, index) => (
                  <ListItem key={activity.id} divider={index < mockRecentActivity.length - 1}>
                    <ListItemIcon>
                      <CalendarToday color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.action}
                      secondary={activity.details}
                    />
                    <ListItemSecondaryAction>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(activity.timestamp)}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar Information */}
        <Grid item xs={12} md={4}>
          {/* Account Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  User ID
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  #{record.id}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Username
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  @{record.username}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Created Date
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDate(record.created_date)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Account Status
                </Typography>
                <Chip
                  icon={getStatusIcon(record.status)}
                  label={(record.status?.charAt(0)?.toUpperCase() || '') + (record.status?.slice(1) || '')}
                  color={getStatusColor(record.status) as any}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => router.push(`/users/${record.id}/edit`)}
                  fullWidth
                >
                  Edit User
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Lock />}
                  fullWidth
                >
                  Reset Password
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Block />}
                  fullWidth
                  color="error"
                >
                  Suspend User
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Notes */}
          {record.notes && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Typography variant="body2">
                  {record.notes}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
} 