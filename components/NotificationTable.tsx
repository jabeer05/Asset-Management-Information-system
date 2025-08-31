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
  Alert,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  NotificationsOff,
  MarkEmailRead,
  MarkEmailUnread,
  Delete,
  FilterList,
  Settings,
  Warning,
  ErrorOutline,
  Info,
  CheckCircle,
  Schedule,
  Person,
  AccessTime,
  PriorityHigh,
  Add,
  Visibility,
  Reply,
  Refresh,
  ReportProblem
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Snackbar from '@mui/material/Snackbar';

interface NotificationRecord {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'maintenance' | 'security' | 'system' | 'asset' | 'user' | 'audit' | 'maintenance_complaint' | 'complaint_submitted' | 'complaint_reply';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'unread' | 'read' | 'archived';
  user_id: number;
  recipient_email: string;
  sender_id?: number;
  sender_name?: string;
  created_at: string;
  read_at?: string;
  expires_at?: string;
  action_url?: string;
  action_text?: string;
  metadata?: {
    entity_type?: string;
    entity_id?: number;
    entity_name?: string;
    module?: string;
  };
  parent_id?: number; // Added for threaded replies
  sender_first_name?: string;
  sender_last_name?: string;
  sender_username?: string;
  sender_email?: string;
}

const notificationTypes = ["All", "info", "warning", "error", "success", "maintenance", "security", "system", "asset", "user", "audit", "maintenance_complaint", "complaint_submitted", "complaint_reply"];
const priorities = ["All", "low", "medium", "high", "critical"];
const statuses = ["All", "unread", "read", "archived"];

export default function NotificationTable() {
  const router = useRouter();
  const { user } = useAuth();
  // All useState hooks at the top
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showArchived, setShowArchived] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [replies, setReplies] = useState<{ [parentId: number]: NotificationRecord[] }>({});
  const [conversationOpen, setConversationOpen] = useState(false);
  const [conversationThread, setConversationThread] = useState<NotificationRecord[]>([]);
  const [conversationParent, setConversationParent] = useState<NotificationRecord | null>(null);
  const [conversationReply, setConversationReply] = useState('');

  // All useEffect hooks at the top
  useEffect(() => {
    setMounted(true);
    // Fetch all users for sender info
    const fetchUsers = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${API_BASE_URL}/users`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) {
          console.error('Failed to fetch users:', res.status, res.statusText);
          throw new Error(`Failed to fetch users: ${res.status}`);
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          console.error('Users API returned non-array data:', data);
          setUsers([]);
        }
      } catch (e) {
        console.error('Error fetching users:', e);
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (mounted && user) fetchNotifications();
    // No polling interval
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, user, tab]);

  useEffect(() => {
    if (notifications.length > 0) {
      notifications.forEach(n => {
        if (n.id) fetchReplies(n.id);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  // Helper to get user info by ID (fix type mismatch)
  const getUserInfo = (id: number | string) => users.find(u => u.id == id);

  // Helper to get sender display name from user ID (for backward compatibility)
  const getSenderDisplay = (id: number | undefined | null) => {
    if (!id) return 'Unknown User';
    const user = getUserInfo(id);
    if (!user) return `User ID ${id}`;
    if (user.first_name || user.last_name) return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    if (user.username) return user.username;
    if (user.email) return user.email;
    return `User ID ${id}`;
  };

  // Helper to get sender display name from notification object (preferred method)
  const getSenderDisplayFromNotification = (notification: NotificationRecord) => {
    // First try to use the sender information from the notification
    if (notification.sender_first_name || notification.sender_last_name) {
      const name = `${notification.sender_first_name || ''} ${notification.sender_last_name || ''}`.trim();
      return name;
    }
    if (notification.sender_username) {
      return notification.sender_username;
    }
    if (notification.sender_email) {
      return notification.sender_email;
    }
    // Fallback to using sender_id with user lookup
    if (notification.sender_id) {
      return getSenderDisplay(notification.sender_id);
    }
    return 'Unknown User';
  };

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      let url = user && user.id
        ? `${API_BASE_URL}/notifications?user_id=${user.id}`
        : `${API_BASE_URL}/notifications`;
      if (tab === 'sent') {
        url += `&direction=sent`;
      } else {
        url += `&direction=received`;
      }
      const res = await fetch(url, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (data.error) {
        setError(data.error);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      setError((err && typeof err === 'object' && 'message' in err) ? (err as Error).message : 'Error fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  // Fetch replies for a given notification
  const fetchReplies = async (parentId: number) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    let url = `${API_BASE_URL}/notifications?parent_id=${parentId}`;
    if (tab === 'sent') url += `&direction=sent`;
    else url += `&direction=received`;
    const res = await fetch(url, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    setReplies(prev => ({ ...prev, [parentId]: data }));
    return data;
  };

  // Fetch replies for all top-level notifications after fetching notifications
  useEffect(() => {
    if (notifications.length > 0) {
      notifications.forEach(n => {
        if (n.id) fetchReplies(n.id);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  // Only show top-level notifications (parent_id null)
  const topLevelNotifications = notifications.filter(n => !n.parent_id);

  if (!mounted) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'success': return 'success';
      case 'maintenance': return 'primary';
      case 'security': return 'error';
      case 'system': return 'default';
      case 'asset': return 'secondary';
      case 'user': return 'info';
      case 'audit': return 'warning';
      case 'maintenance_complaint': return 'error';
      case 'complaint_submitted': return 'success';
      case 'complaint_reply': return 'info';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info />;
      case 'warning': return <Warning />;
      case 'error': return <ErrorOutline />;
      case 'success': return <CheckCircle />;
      case 'maintenance': return <Schedule />;
      case 'security': return <PriorityHigh />;
      case 'system': return <Settings />;
      case 'asset': return <Info />;
      case 'user': return <Person />;
      case 'audit': return <PriorityHigh />;
      case 'maintenance_complaint': return <ReportProblem />;
      case 'complaint_submitted': return <CheckCircle />;
      case 'complaint_reply': return <Reply />;
      default: return <Info />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'info';
      case 'high': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low': return <Info />;
      case 'medium': return <Warning />;
      case 'high': return <PriorityHigh />;
      case 'critical': return <PriorityHigh />;
      default: return <Warning />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'primary';
      case 'read': return 'default';
      case 'archived': return 'default';
      default: return 'default';
    }
  };

  // Filter records
  const filteredRecords = notifications.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "All" || record.type === typeFilter;
    const matchesPriority = priorityFilter === "All" || record.priority === priorityFilter;
    const matchesStatus = statusFilter === "All" || record.status === statusFilter;
    const matchesArchived = showArchived ? true : record.status !== 'archived';
    
    return matchesSearch && matchesType && matchesPriority && matchesStatus && matchesArchived;
  });

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    { 
      field: "title", 
      headerName: "Title", 
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={params.row.status === 'unread' ? 'bold' : 'normal'}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: "sender_id", 
      headerName: "Sender", 
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {getSenderDisplayFromNotification(params.row)}
        </Typography>
      )
    },
    { 
      field: "type", 
      headerName: "Type", 
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? params.value.charAt(0).toUpperCase() + params.value.slice(1) : ''}
          size="small"
          color={getTypeColor(params.value) as any}
          variant="outlined"
        />
      )
    },
    { 
      field: "priority", 
      headerName: "Priority", 
      width: 100,
      renderCell: (params) => (
        <Chip
          icon={getPriorityIcon(params.value)}
          label={params.value ? params.value.charAt(0).toUpperCase() + params.value.slice(1) : ''}
          size="small"
          color={getPriorityColor(params.value) as any}
        />
      )
    },
    { 
      field: "message", 
      headerName: "Message", 
      width: 250,
      renderCell: (params) => (
        <Box>
          {/* Show asset name prominently for maintenance complaints */}
          {params.row.type === 'maintenance_complaint' && params.row.notification_metadata?.asset_details && (
            <Typography variant="body2" fontWeight="bold" color="primary" gutterBottom>
              📦 {params.row.notification_metadata.asset_details.name}
            </Typography>
          )}
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {params.value.length > 60 ? params.value.substring(0, 60) + '...' : params.value}
          </Typography>
        </Box>
      )
    },
    { 
      field: "action_url", 
      headerName: "Action", 
      width: 120,
      renderCell: (params) => (
        params.value ? <Button size="small" variant="outlined" href={params.value} target="_blank">{params.row.action_text || 'View'}</Button> : null
      )
    },
    { 
      field: "created_at", 
      headerName: "Created", 
      width: 120,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">{new Date(params.value).toLocaleDateString()}</Typography>
          <Typography variant="caption" color="text.secondary">{new Date(params.value).toLocaleTimeString()}</Typography>
        </Box>
      )
    },
    { 
      field: "status", 
      headerName: "Status", 
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? params.value.charAt(0).toUpperCase() + params.value.slice(1) : ''}
          size="small"
          color={getStatusColor(params.value) as any}
        />
      )
    },
    {
      field: "notification_metadata",
      headerName: "Metadata",
      width: 120,
      renderCell: (params) => (
        params.value ? <Tooltip title={JSON.stringify(params.value)}><Info /></Tooltip> : null
      )
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          {/* View Icon */}
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => router.push(`/notifications/${params.row.id}`)}
            >
              <Visibility />
            </IconButton>
          </Tooltip>
          {/* Reply Icon */}
          {params.row.sender_id && (
            <Tooltip title="Reply">
              <IconButton
                size="small"
                onClick={() => {
                  // Open conversation modal with the parent notification
                  const parentId = params.row.parent_id || params.row.id;
                  fetchThread(parentId);
                  setConversationOpen(true);
                }}
              >
                <Reply />
              </IconButton>
            </Tooltip>
          )}
          {/* Existing actions (mark as read/unread, delete, etc.) */}
          {params.row.status === 'unread' && (
            <Tooltip title="Mark as Read">
              <IconButton
                size="small"
                onClick={() => {
                  console.log('Mark as read:', params.row.id);
                }}
              >
                <MarkEmailRead />
              </IconButton>
            </Tooltip>
          )}
          {params.row.status === 'read' && (
            <Tooltip title="Mark as Unread">
              <IconButton
                size="small"
                onClick={() => {
                  console.log('Mark as unread:', params.row.id);
                }}
              >
                <MarkEmailUnread />
              </IconButton>
            </Tooltip>
          )}
          {params.row.action_url && (
            <Tooltip title={params.row.action_text || "View Details"}>
              <IconButton
                size="small"
                onClick={() => router.push(params.row.action_url!)}
              >
                <Info />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                if (confirm('Are you sure you want to delete this notification?')) {
                  console.log('Delete notification:', params.row.id);
                }
              }}
            >
              <Delete />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  const getStats = () => {
    const total = notifications.length;
    const unread = notifications.filter(r => r.status === 'unread').length;
    const critical = notifications.filter(r => r.priority === 'critical').length;
    const high = notifications.filter(r => r.priority === 'high').length;
    const today = notifications.filter(r => {
      const today = new Date().toDateString();
      return new Date(r.created_at).toDateString() === today;
    }).length;
    const security = notifications.filter(r => r.type === 'security').length;
    const maintenance = notifications.filter(r => r.type === 'maintenance').length;

    return { total, unread, critical, high, today, security, maintenance };
  };

  const stats = getStats();

  const handleMarkAllAsRead = () => {
    console.log('Mark all as read');
    alert('All notifications marked as read!');
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      console.log('Clear all notifications');
      alert('All notifications cleared!');
    }
  };

  // Fetch thread for a notification
  const fetchThread = async (parentId: number) => {
    if (!parentId) {
      console.error('fetchThread called with invalid parentId:', parentId);
      setConversationParent(null);
      setConversationThread([]);
      return;
    }
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      // Fetch parent
      const parentRes = await fetch(`${API_BASE_URL}/notifications?id=${parentId}`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      
      if (!parentRes.ok) {
        throw new Error(`Failed to fetch parent notification: ${parentRes.status}`);
      }
      
      const parentData = await parentRes.json();
      const parent = Array.isArray(parentData) ? parentData[0] : parentData;
      
      if (!parent) {
        throw new Error('Parent notification not found');
      }
      
      // Fetch replies - filter by direction to avoid duplicates
      let repliesUrl = `${API_BASE_URL}/notifications?parent_id=${parentId}`;
      if (tab === 'sent') {
        repliesUrl += `&direction=sent`;
      } else {
        repliesUrl += `&direction=received`;
      }
      
      const repliesRes = await fetch(repliesUrl, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      
      if (!repliesRes.ok) {
        throw new Error(`Failed to fetch replies: ${repliesRes.status}`);
      }
      
      const repliesData = await repliesRes.json();
      const replies = Array.isArray(repliesData) ? repliesData : [];
      
      setConversationParent(parent);
      setConversationThread([parent, ...replies]);
    } catch (error) {
      console.error('Error fetching thread:', error);
      setConversationParent(null);
      setConversationThread([]);
    }
  };

  // On row click, open conversation modal
  const handleRowClick = (params: any) => {
    const parentId = params.row.parent_id || params.row.id;
    if (parentId) {
      fetchThread(parentId);
      setConversationOpen(true);
    } else {
      console.error('No valid ID found for row:', params.row);
    }
  };

  // Send reply in conversation modal
  const handleSendConversationReply = async () => {
    if (!conversationParent || !user) {
      console.error('Missing conversationParent or user:', { conversationParent, user });
      return;
    }
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // Determine the correct recipient for the reply
    // If we're in the "sent" tab, we're replying to a message we sent, so send to the original recipient
    // If we're in the "received" tab, we're replying to a message we received, so send to the original sender
    const recipientId = tab === 'sent' ? conversationParent.user_id : conversationParent.sender_id;
    
    console.log('Reply details:', {
      currentUser: user.id,
      currentTab: tab,
      conversationParent: {
        id: conversationParent.id,
        user_id: conversationParent.user_id,
        sender_id: conversationParent.sender_id,
        title: conversationParent.title
      },
      recipientId: recipientId
    });
    
    const payload = {
      user_id: recipientId,
      title: `Reply: ${conversationParent.title}`,
      message: conversationReply,
      type: conversationParent.type || 'info',
      priority: conversationParent.priority || 'medium',
              metadata: conversationParent.notification_metadata ? JSON.stringify(conversationParent.notification_metadata) : undefined,
      parent_id: conversationParent.id,
    };
    
    console.log('Sending reply with payload:', payload);
    console.log('Current tab:', tab, 'Recipient ID:', recipientId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to send reply: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Reply sent successfully:', result);
      
      setConversationReply('');
      setSnackbarOpen(true); // Show success message
      
      // Refresh the thread if we have a valid parent ID
      if (conversationParent.id) {
        fetchThread(conversationParent.id);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      setSnackbarOpen(true); // Show error message
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><Typography>Loading notifications...</Typography></Box>;
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // Flatten notifications and replies for DataGrid
  function flattenNotificationsWithReplies(notifications: NotificationRecord[], replies: { [parentId: number]: NotificationRecord[] }) {
    const result: (NotificationRecord & { isReply?: boolean; replyDepth?: number })[] = [];
    const addWithReplies = (notif: NotificationRecord, depth = 0) => {
      result.push({ ...notif, isReply: depth > 0, replyDepth: depth });
      (replies[notif.id] || []).forEach(reply => addWithReplies(reply, depth + 1));
    };
    notifications.filter(n => !n.parent_id).forEach(n => addWithReplies(n));
    return result;
  }

  const flatRows = flattenNotificationsWithReplies(notifications, replies);

  return (
    <Box p={0}>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Reply sent!"
      />
      {/* Tabs for Received/Sent */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="received" label="Received" />
        <Tab value="sent" label="Sent" />
      </Tabs>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Notifications color="primary" />
          Notifications
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton onClick={fetchNotifications} color="primary" title="Refresh Notifications">
            <Refresh />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push('/notifications/new')}
          >
            New Notification
          </Button>
          <Button
            variant="outlined"
            startIcon={<MarkEmailRead />}
            onClick={handleMarkAllAsRead}
          >
            Mark All Read
          </Button>
          <Button
            variant="outlined"
            startIcon={<Delete />}
            onClick={handleClearAll}
            color="error"
          >
            Clear All
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
          <Typography color="textSecondary" gutterBottom>Total Notifications</Typography>
          <Typography variant="h4">{stats.total}</Typography>
        </Box>
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
          <Typography color="textSecondary" gutterBottom>Unread</Typography>
          <Typography variant="h4" color="primary.main">{stats.unread}</Typography>
        </Box>
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
          <Typography color="textSecondary" gutterBottom>Critical</Typography>
          <Typography variant="h4" color="error.main">{stats.critical}</Typography>
        </Box>
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
          <Typography color="textSecondary" gutterBottom>High Priority</Typography>
          <Typography variant="h4" color="warning.main">{stats.high}</Typography>
        </Box>
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
          <Typography color="textSecondary" gutterBottom>Today</Typography>
          <Typography variant="h4" color="info.main">{stats.today}</Typography>
        </Box>
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
          <Typography color="textSecondary" gutterBottom>Security Alerts</Typography>
          <Typography variant="h4" color="error.main">{stats.security}</Typography>
        </Box>
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
          <Typography color="textSecondary" gutterBottom>Maintenance</Typography>
          <Typography variant="h4" color="primary.main">{stats.maintenance}</Typography>
        </Box>
      </Box>

      {/* Alerts */}
      {stats.critical > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {stats.critical} critical notification(s) require immediate attention.
        </Alert>
      )}

      {stats.unread > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {stats.unread} unread notification(s). Click "Mark All Read" to clear them.
        </Alert>
      )}

      {/* Search and Filters */}
      <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Search & Filter
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            placeholder="Search notifications..."
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
              {notificationTypes.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priorityFilter}
              label="Priority"
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              {priorities.map((priority) => (
                <MenuItem key={priority} value={priority}>{priority}</MenuItem>
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

          <FormControlLabel
            control={
              <Switch
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
            }
            label="Show Archived"
          />
        </Stack>
        
        <Typography variant="body2" color="text.secondary">
          Showing {topLevelNotifications.length} of {notifications.length} notifications
        </Typography>
      </Box>

      {/* DataGrid */}
      <Box sx={{ height: 500, width: "100%" }}>
        <DataGrid 
          rows={flatRows} 
          columns={columns.map((col, index) => {
            if (col.field === 'title') {
              return {
                ...col,
                key: `col-${index}`,
                renderCell: (params) => (
                  <Box sx={{ pl: params.row.replyDepth ? params.row.replyDepth * 3 : 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {params.row.isReply && <Reply fontSize="small" color="primary" />}
                    <Typography variant="body2" fontWeight={params.row.status === 'unread' ? 'bold' : 'normal'}>
                      {params.value}
                    </Typography>
                  </Box>
                )
              };
            }
            return { ...col, key: `col-${index}` };
          })}
          onRowClick={handleRowClick}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
        />
      </Box>

      {/* Conversation Modal */}
      <Dialog open={conversationOpen} onClose={() => setConversationOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Conversation Thread</DialogTitle>
        <DialogContent>
          {conversationThread.map((msg, idx) => (
            <Box key={msg.id} sx={{ mb: 2, pl: msg.parent_id ? 4 : 0 }}>
              <Typography variant="subtitle2" color={msg.parent_id ? 'primary' : 'secondary'}>
                {msg.parent_id ? 'Reply' : 'Message'} from {getSenderDisplayFromNotification(msg)}:
              </Typography>
              <Typography variant="body2">{msg.message}</Typography>
              <Typography variant="caption" color="text.secondary">
                {msg.created_at ? new Date(msg.created_at).toLocaleString() : 'Unknown Date'}
              </Typography>
            </Box>
          ))}
          <TextField
            label="Reply"
            value={conversationReply}
            onChange={e => setConversationReply(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConversationOpen(false)} color="secondary">Close</Button>
          <Button onClick={handleSendConversationReply} color="primary" variant="contained" disabled={!conversationReply.trim()}>Send Reply</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 