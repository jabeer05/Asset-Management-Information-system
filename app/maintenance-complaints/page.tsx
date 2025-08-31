"use client";
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Build,
  Warning,
  CheckCircle,
  Schedule,
  PriorityHigh,
  Visibility,
  Edit,
  Assignment,
  Reply
} from '@mui/icons-material';
import MainNav from '@/components/MainNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

interface MaintenanceComplaint {
  id: number;
  asset_id: number;
  asset_name: string;
  complaint_type: string;
  description: string;
  user_id: number;
  user_username: string;
  user_first_name: string;
  user_last_name: string;
  user_location: string;
  user_department: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  assigned_to: number | null;
  assigned_username: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function MaintenanceComplaintsPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<MaintenanceComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<MaintenanceComplaint | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatus, setReplyStatus] = useState('in_progress');
  const [replyPriority, setReplyPriority] = useState('medium');
  const [replySubmitting, setReplySubmitting] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      
      const response = await fetch(`${API_BASE_URL}/maintenance-complaints/`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch maintenance complaints');
      }

      const data = await response.json();
      setComplaints(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching complaints');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getComplaintTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'maintenance_required': 'Maintenance Required',
      'repair_needed': 'Repair Needed',
      'replacement_requested': 'Replacement Requested',
      'safety_concern': 'Safety Concern',
      'performance_issue': 'Performance Issue',
      'other_maintenance': 'Other Maintenance'
    };
    return typeMap[type] || type;
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesStatus = statusFilter === 'All' || complaint.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || complaint.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  const getStats = () => {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const inProgress = complaints.filter(c => c.status === 'in_progress').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const critical = complaints.filter(c => c.priority === 'critical').length;
    
    return { total, pending, inProgress, resolved, critical };
  };

  const stats = getStats();

  const handleViewDetails = (complaint: MaintenanceComplaint) => {
    setSelectedComplaint(complaint);
    setDetailDialogOpen(true);
  };

  const handleUpdateStatus = (complaint: MaintenanceComplaint) => {
    setSelectedComplaint(complaint);
    setUpdateDialogOpen(true);
  };

  const handleReplyToComplaint = (complaint: MaintenanceComplaint) => {
    setSelectedComplaint(complaint);
    setReplyMessage('');
    setReplyStatus('in_progress');
    setReplyPriority(complaint.priority);
    setReplyDialogOpen(true);
  };

  const handleSubmitReply = async () => {
    if (!selectedComplaint || !replyMessage.trim()) {
      return;
    }

    setReplySubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      
      const response = await fetch(`${API_BASE_URL}/maintenance-complaints/${selectedComplaint.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: replyMessage,
          status: replyStatus,
          priority: replyPriority
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send reply');
      }

      // Refresh complaints list
      await fetchComplaints();
      setReplyDialogOpen(false);
      setReplyMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sending reply');
    } finally {
      setReplySubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <MainNav />
        <Box p={3}>
          <Typography>Loading maintenance complaints...</Typography>
        </Box>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainNav />
      <Box p={3}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Build color="primary" />
          Maintenance Complaints Management
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Total Complaints</Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Pending</Typography>
                <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>In Progress</Typography>
                <Typography variant="h4" color="info.main">{stats.inProgress}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Resolved</Typography>
                <Typography variant="h4" color="success.main">{stats.resolved}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Critical</Typography>
                <Typography variant="h4" color="error.main">{stats.critical}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Filters</Typography>
            <Stack direction="row" spacing={2}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="All">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Priority"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="All">All Priority</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>

        {/* Complaints List */}
        <Grid container spacing={2}>
          {filteredComplaints.map((complaint) => (
            <Grid item xs={12} md={6} lg={4} key={complaint.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" noWrap sx={{ maxWidth: '70%' }}>
                      {complaint.asset_name}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip 
                        label={complaint.priority} 
                        size="small" 
                        color={getPriorityColor(complaint.priority)}
                        icon={<PriorityHigh />}
                      />
                      <Chip 
                        label={complaint.status} 
                        size="small" 
                        color={getStatusColor(complaint.status)}
                      />
                    </Stack>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Type:</strong> {getComplaintTypeLabel(complaint.complaint_type)}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>From:</strong> {complaint.user_first_name} {complaint.user_last_name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Location:</strong> {complaint.user_location}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Department:</strong> {complaint.user_department}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {complaint.description.length > 100 
                      ? `${complaint.description.substring(0, 100)}...` 
                      : complaint.description
                    }
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleViewDetails(complaint)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Update Status">
                      <IconButton 
                        size="small" 
                        color="secondary"
                        onClick={() => handleUpdateStatus(complaint)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reply to Complaint">
                      <IconButton 
                        size="small" 
                        color="info"
                        onClick={() => handleReplyToComplaint(complaint)}
                      >
                        <Reply />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Complaint Details</DialogTitle>
          <DialogContent>
            {selectedComplaint && (
              <Box>
                <Typography variant="h6" gutterBottom>{selectedComplaint.asset_name}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Type</Typography>
                    <Typography variant="body1">{getComplaintTypeLabel(selectedComplaint.complaint_type)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Priority</Typography>
                    <Chip label={selectedComplaint.priority} color={getPriorityColor(selectedComplaint.priority)} size="small" />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip label={selectedComplaint.status} color={getStatusColor(selectedComplaint.status)} size="small" />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Submitted By</Typography>
                    <Typography variant="body1">{selectedComplaint.user_first_name} {selectedComplaint.user_last_name}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Description</Typography>
                    <Typography variant="body1">{selectedComplaint.description}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Location</Typography>
                    <Typography variant="body1">{selectedComplaint.user_location}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Department</Typography>
                    <Typography variant="body1">{selectedComplaint.user_department}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Submitted</Typography>
                    <Typography variant="body1">{new Date(selectedComplaint.created_at).toLocaleDateString()}</Typography>
                  </Grid>
                  {selectedComplaint.resolution_notes && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Resolution Notes</Typography>
                      <Typography variant="body1">{selectedComplaint.resolution_notes}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
            {selectedComplaint && (
              <Button 
                variant="contained" 
                onClick={() => {
                  setDetailDialogOpen(false);
                  handleUpdateStatus(selectedComplaint);
                }}
              >
                Update Status
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Update Status Dialog */}
        <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)}>
          <DialogTitle>Update Complaint Status</DialogTitle>
          <DialogContent>
            {selectedComplaint && (
              <Box sx={{ pt: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Complaint: {selectedComplaint.asset_name}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Resolution Notes"
                  placeholder="Add notes about the resolution..."
                  sx={{ mt: 2 }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
            <Button variant="contained">Update Status</Button>
          </DialogActions>
        </Dialog>

        {/* Reply Dialog */}
        <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Reply to Complaint</DialogTitle>
          <DialogContent>
            {selectedComplaint && (
              <Box sx={{ pt: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Complaint: {selectedComplaint.asset_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  From: {selectedComplaint.user_first_name} {selectedComplaint.user_last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Description: {selectedComplaint.description}
                </Typography>
                
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Reply Message"
                  placeholder="Enter your reply to the user..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  sx={{ mt: 2 }}
                />
                
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={replyStatus}
                      label="Status"
                      onChange={(e) => setReplyStatus(e.target.value)}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="resolved">Resolved</MenuItem>
                      <MenuItem value="closed">Closed</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={replyPriority}
                      label="Priority"
                      onChange={(e) => setReplyPriority(e.target.value)}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="critical">Critical</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleSubmitReply}
              disabled={replySubmitting || !replyMessage.trim()}
            >
              {replySubmitting ? 'Sending...' : 'Send Reply'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ProtectedRoute>
  );
} 