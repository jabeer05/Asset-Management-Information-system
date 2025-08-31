"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Stack,
  Grid,
  Alert,
  LinearProgress,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Business,
  Work,
  AdminPanelSettings,
  Security,
  CheckCircle,
  Block,
  ArrowBack,
  Edit
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import MainNav from '@/components/MainNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useNotifications } from '@/contexts/NotificationContext';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

interface UserDetail {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'user' | 'auditor' | 'viewer';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  department: string;
  position: string;
  phone: string;
  location: string;
  permissions: string[];
  asset_access: string[];
  notes: string;
  created_at: string;
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  const userId = params.id;
  
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { fetchNotifications } = useNotifications();

  React.useEffect(() => {
    if (feedbackOpen) {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem('token');
      
      if (!token) {
        setRecipients([]);
        return;
      }
      
      fetch(`${API_BASE_URL}/users?role=admin&role=manager`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch recipients');
          }
          return res.json();
        })
        .then(data => setRecipients(data))
        .catch(() => setRecipients([]));
    }
  }, [feedbackOpen]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch user details: ${response.status} ${errorText}`);
        }
        
        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

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

  const handleSendFeedback = async () => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ user_id: recipientId, message: feedbackMsg })
    });
    setFeedbackOpen(false);
    setFeedbackMsg('');
    setRecipientId('');
    setSnackbarOpen(true);
    fetchNotifications();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <MainNav />
        <Box sx={{ p: 3 }}>
          <LinearProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>Loading user details...</Typography>
        </Box>
      </ProtectedRoute>
    );
  }

  if (error || !user) {
    return (
      <ProtectedRoute>
        <MainNav />
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            {error || 'Failed to load user details'}
          </Alert>
        </Box>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainNav />
      <Box p={3}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => router.push('/users')}
            >
              Back to Users
            </Button>
            <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="primary" />
              User Details
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => router.push(`/users/${userId}/edit`)}
          >
            Edit User
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* User Profile Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    bgcolor: 'primary.main',
                    fontSize: '3rem'
                  }}
                >
                  {(user.first_name?.charAt(0) || '')}{(user.last_name?.charAt(0) || '')}
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  {user.first_name} {user.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  @{user.username}
                </Typography>
                
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                  <Chip
                    icon={getRoleIcon(user.role)}
                    label={(user.role?.charAt(0)?.toUpperCase() || '') + (user.role?.slice(1) || '')}
                    color={getRoleColor(user.role) as any}
                    variant="outlined"
                  />
                  <Chip
                    icon={getStatusIcon(user.status)}
                    label={(user.status?.charAt(0)?.toUpperCase() || '') + (user.status?.slice(1) || '')}
                    color={getStatusColor(user.status) as any}
                  />
                </Stack>

                <Divider sx={{ my: 2 }} />

                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Email fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Email" secondary={user.email} />
                  </ListItem>
                  {user.phone && (
                    <ListItem>
                      <ListItemIcon>
                        <Phone fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Phone" secondary={user.phone} />
                    </ListItem>
                  )}
                  {user.location && (
                    <ListItem>
                      <ListItemIcon>
                        <LocationOn fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Location" secondary={user.location} />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* User Details */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              {/* Basic Information */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Department</Typography>
                      <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Business fontSize="small" />
                        {user.department || 'Not specified'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Position</Typography>
                      <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Work fontSize="small" />
                        {user.position || 'Not specified'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Created</Typography>
                      <Typography variant="body1">
                        {new Date(user.created_at).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Permissions */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Permissions
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      System Permissions
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0 ? (
                        user.permissions.map((permission, index) => (
                          <Chip
                            key={index}
                            label={permission}
                            size="small"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No specific permissions assigned
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Asset Access
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {user.asset_access && Array.isArray(user.asset_access) && user.asset_access.length > 0 ? (
                        user.asset_access.map((access, index) => (
                          <Chip
                            key={index}
                            label={access}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No specific asset access assigned
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </CardContent>
              </Card>

              {/* Notes */}
              {user.notes && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Notes
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">
                        {user.notes}
                      </Typography>
                    </Paper>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>
        </Grid>
        <Button onClick={() => setFeedbackOpen(true)}>Send Feedback</Button>
        <Dialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)}>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogContent>
            <Select
              value={recipientId}
              onChange={e => setRecipientId(e.target.value)}
              displayEmpty
              fullWidth
              sx={{ mb: 2 }}
            >
              <MenuItem value="" disabled>Select recipient</MenuItem>
              {recipients.map((user) => (
                <MenuItem key={user.id} value={user.id}>{user.first_name} {user.last_name} ({user.role})</MenuItem>
              ))}
            </Select>
            <TextField
              autoFocus
              margin="dense"
              label="Feedback Message"
              type="text"
              fullWidth
              value={feedbackMsg}
              onChange={e => setFeedbackMsg(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFeedbackOpen(false)}>Cancel</Button>
            <Button onClick={handleSendFeedback} disabled={!feedbackMsg.trim() || !recipientId}>Send</Button>
          </DialogActions>
        </Dialog>
        <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
          <MuiAlert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
            Feedback sent successfully!
          </MuiAlert>
        </Snackbar>
      </Box>
    </ProtectedRoute>
  );
} 