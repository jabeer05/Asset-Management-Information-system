"use client";
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Stack,
  Divider,
  Avatar,
  Grid,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Notifications,
  Warning,
  Error as ErrorIcon,
  Info,
  CheckCircle,
  Schedule,
  Person,
  AccessTime,
  PriorityHigh,
  MarkEmailRead,
  MarkEmailUnread,
  Delete,
  ArrowBack,
  Launch,
  Security,
  Settings,
  Build,
  Assessment,
  AccountCircle,
  Email,
  CalendarToday,
  Timer,
  LocationOn,
  Category,
  Description,
  Link
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface NotificationRecord {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'maintenance' | 'security' | 'system' | 'asset' | 'user' | 'audit';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'unread' | 'read' | 'archived';
  recipient_id: number;
  recipient_name: string;
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
    ip_address?: string;
    location?: string;
    department?: string;
    cost?: number;
    quantity?: number;
  };
  notification_metadata?: any; // Backend field name
}

export default function NotificationDetail({ notificationId }: { notificationId: string }) {
  const router = useRouter();
  const [notification, setNotification] = useState<NotificationRecord | null>(null);
  const [assetDetails, setAssetDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assetLoading, setAssetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch asset details
  const fetchAssetDetails = async (assetId: number) => {
    setAssetLoading(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const assetData = await res.json();
        setAssetDetails(assetData);
      }
    } catch (e: any) {
      console.error('Failed to fetch asset details:', e);
    } finally {
      setAssetLoading(false);
    }
  };

  useEffect(() => {
    const fetchNotification = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) throw new Error('Failed to fetch notification');
        const data = await res.json();
        setNotification(data);
        
        // Fetch asset details if it's a maintenance complaint with asset_id
        if (data.type === 'maintenance_complaint' && data.notification_metadata?.asset_id) {
          await fetchAssetDetails(data.notification_metadata.asset_id);
        }
        // Also try to extract asset_id from the message if not in notification_metadata
        else if (data.type === 'maintenance_complaint' && !data.notification_metadata?.asset_id) {
          // Try to extract asset ID from the message or title
          const assetMatch = data.message.match(/Asset ID: (\d+)/) || 
                           data.title.match(/Asset ID: (\d+)/) ||
                           data.message.match(/Asset:.*?(\d+)/);
          if (assetMatch && assetMatch[1]) {
            await fetchAssetDetails(parseInt(assetMatch[1]));
          }
        }
      } catch (e: any) {
        setError(e.message || 'Failed to fetch notification');
      } finally {
        setLoading(false);
      }
    };
    fetchNotification();
  }, [notificationId]);

  if (loading) return <Typography>Loading...</Typography>;
  if (error || !notification) return <Box sx={{ my: 4 }}><Alert severity="error">{error || 'Notification not found'}</Alert></Box>;

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
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info />;
      case 'warning': return <Warning />;
      case 'error': return <ErrorIcon />;
      case 'success': return <CheckCircle />;
      case 'maintenance': return <Schedule />;
      case 'security': return <Security />;
      case 'system': return <Settings />;
      case 'asset': return <Info />;
      case 'user': return <Person />;
      case 'audit': return <Assessment />;
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleMarkAsRead = () => {
    console.log('Mark as read:', notification.id);
    alert('Notification marked as read!');
  };

  const handleMarkAsUnread = () => {
    console.log('Mark as unread:', notification.id);
    alert('Notification marked as unread!');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this notification?')) {
      console.log('Delete notification:', notification.id);
      alert('Notification deleted!');
      router.push('/notifications');
    }
  };

  const handleAction = () => {
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.push('/notifications')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Notifications color="primary" />
            Notification Details
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {notification.status === 'unread' && (
            <Button
              variant="outlined"
              startIcon={<MarkEmailRead />}
              onClick={handleMarkAsRead}
            >
              Mark as Read
            </Button>
          )}
          {notification.status === 'read' && (
            <Button
              variant="outlined"
              startIcon={<MarkEmailUnread />}
              onClick={handleMarkAsUnread}
            >
              Mark as Unread
            </Button>
          )}
          {notification.action_url && (
            <Button
              variant="contained"
              startIcon={<Launch />}
              onClick={handleAction}
            >
              {notification.action_text || "Take Action"}
            </Button>
          )}
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {/* Notification Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Badge
                  color={notification.status === 'unread' ? 'primary' : 'default'}
                  variant={notification.status === 'unread' ? 'dot' : 'standard'}
                >
                  {getTypeIcon(notification.type)}
                </Badge>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" fontWeight={notification.status === 'unread' ? 'bold' : 'normal'}>
                    {notification.title}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip
                      icon={getPriorityIcon(notification.priority)}
                      label={((notification.priority || '').charAt(0).toUpperCase() + (notification.priority || '').slice(1))}
                      size="small"
                      color={getPriorityColor(notification.priority) as any}
                    />
                    <Chip
                      label={((notification.type || '').charAt(0).toUpperCase() + (notification.type || '').slice(1))}
                      size="small"
                      color={getTypeColor(notification.type) as any}
                      variant="outlined"
                    />
                    <Chip
                      label={((notification.status || '').charAt(0).toUpperCase() + (notification.status || '').slice(1))}
                      size="small"
                      color={getStatusColor(notification.status) as any}
                    />
                  </Stack>
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Message */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Message
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {notification.message}
                  </Typography>
                </Paper>
              </Box>

              {/* Timestamps */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Timestamps
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <AccessTime />
                    </ListItemIcon>
                    <ListItemText
                      primary="Created"
                      secondary={new Date(notification.created_at).toLocaleString()}
                    />
                  </ListItem>
                  {notification.read_at && (
                    <ListItem>
                      <ListItemIcon>
                        <MarkEmailRead />
                      </ListItemIcon>
                      <ListItemText
                        primary="Read"
                        secondary={new Date(notification.read_at).toLocaleString()}
                      />
                    </ListItem>
                  )}
                  {notification.expires_at && (
                    <ListItem>
                      <ListItemIcon>
                        <Timer />
                      </ListItemIcon>
                      <ListItemText
                        primary="Expires"
                        secondary={new Date(notification.expires_at).toLocaleString()}
                      />
                    </ListItem>
                  )}
                </List>
              </Box>

                            {/* Complaint Details for Maintenance Complaints */}
              {notification.type === 'maintenance_complaint' && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      🚨 Complaint Details
                    </Typography>
                    {notification.notification_metadata?.asset_id && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Launch />}
                        onClick={() => router.push(`/assets/${notification.notification_metadata.asset_id}`)}
                      >
                        View Asset
                      </Button>
                    )}
                  </Box>
                  <Paper sx={{ p: 2, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200', mb: 3 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" gutterBottom>
                          <strong>Complaint Type:</strong> {notification.notification_metadata?.complaint_type || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Priority:</strong> {notification.priority}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Status:</strong> {notification.notification_metadata?.status || 'Pending'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" gutterBottom>
                          <strong>Location:</strong> {notification.notification_metadata?.user_location || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Department:</strong> {notification.notification_metadata?.user_department || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Complaint ID:</strong> {notification.notification_metadata?.complaint_id || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>
              )}

              {/* Asset Information for Maintenance Complaints */}
              {notification.type === 'maintenance_complaint' && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      📦 Asset Information
                    </Typography>
                    {assetDetails?.id && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Launch />}
                        onClick={() => router.push(`/assets/${assetDetails.id}`)}
                      >
                        View Full Asset Details
                      </Button>
                    )}
                  </Box>
                  {assetLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Loading complete asset details...
                      </Typography>
                    </Box>
                  )}
                  {(notification.notification_metadata?.asset_details || assetDetails) ? (
                                        <Paper sx={{ p: 3, bgcolor: 'primary.50', border: '2px solid', borderColor: 'primary.300', borderRadius: 2 }}>
                      {/* Asset Name Header */}
                      <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid', borderColor: 'primary.200' }}>
                        <Typography variant="h5" color="primary" fontWeight="bold">
                          {assetDetails?.name || notification.notification_metadata?.asset_details?.name || 'Asset Details'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Asset ID: {assetDetails?.id || notification.notification_metadata?.asset_details?.id || 'N/A'}
                        </Typography>
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Asset Details
                          </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Name:</strong> {assetDetails?.name || notification.notification_metadata?.asset_details?.name}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>ID:</strong> {assetDetails?.id || notification.notification_metadata?.asset_details?.id}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Category:</strong> {assetDetails?.category || notification.notification_metadata?.asset_details?.category || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Model:</strong> {assetDetails?.model || notification.notification_metadata?.asset_details?.model || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Manufacturer:</strong> {assetDetails?.manufacturer || notification.notification_metadata?.asset_details?.manufacturer || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Description:</strong> {assetDetails?.description || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Barcode:</strong> {assetDetails?.barcode || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>QR Code:</strong> {assetDetails?.qrcode || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          Current Status
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Location:</strong> {assetDetails?.location || notification.notification_metadata?.asset_details?.location || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Status:</strong> {assetDetails?.status || notification.notification_metadata?.asset_details?.status || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Condition:</strong> {assetDetails?.asset_condition || notification.notification_metadata?.asset_details?.condition || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Serial Number:</strong> {assetDetails?.serial_number || notification.notification_metadata?.asset_details?.serial_number || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Custodian:</strong> {assetDetails?.custodian_name || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Quantity:</strong> {assetDetails?.quantity || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Purchase Date:</strong> {assetDetails?.purchase_date ? new Date(assetDetails.purchase_date).toLocaleDateString() : 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Purchase Cost:</strong> {assetDetails?.purchase_cost ? `₦${Number(assetDetails.purchase_cost).toLocaleString()}` : 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    {/* Additional Asset Information */}
                    {assetDetails && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'primary.200' }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          Additional Information
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" gutterBottom>
                              <strong>Supplier:</strong> {assetDetails.supplier || 'N/A'}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Invoice Number:</strong> {assetDetails.invoice_number || 'N/A'}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Warranty Expiry:</strong> {assetDetails.warranty_expiry ? new Date(assetDetails.warranty_expiry).toLocaleDateString() : 'N/A'}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Current Value:</strong> {assetDetails.current_value ? `₦${Number(assetDetails.current_value).toLocaleString()}` : 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" gutterBottom>
                              <strong>VAT Amount:</strong> {assetDetails.vat_amount ? `₦${Number(assetDetails.vat_amount).toLocaleString()}` : 'N/A'}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Total with VAT:</strong> {assetDetails.total_cost_with_vat ? `₦${Number(assetDetails.total_cost_with_vat).toLocaleString()}` : 'N/A'}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Currency:</strong> {assetDetails.currency || 'N/A'}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Tags:</strong> {assetDetails.tags || 'N/A'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                                         )}
                   </Paper>
                   ) : (
                     <Alert severity="info">
                       <Typography variant="body2">
                         Asset details not available. The asset may have been deleted or the information is incomplete.
                       </Typography>
                     </Alert>
                   )}
                 </Box>
               )}

              {/* Action Information */}
              {notification.action_url && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Action Required
                  </Typography>
                  <Alert severity="info">
                    <Typography variant="body2">
                      This notification requires action. Click the button above to {notification.action_text?.toLowerCase()}.
                    </Typography>
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Recipient Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recipient
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                  {(notification.recipient_name || '').charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight="bold">
                    {notification.recipient_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {notification.recipient_email}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Sender Information */}
          {notification.sender_name && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sender
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: 'secondary.main' }}>
                    {(notification.sender_name || '').charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="body1">
                    {notification.sender_name}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {notification.notification_metadata && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Related Information
                </Typography>
                <List dense>
                  {notification.notification_metadata.entity_type && (
                    <ListItem>
                      <ListItemIcon>
                        <Category />
                      </ListItemIcon>
                      <ListItemText
                        primary="Entity Type"
                        secondary={(notification.notification_metadata.entity_type || '').charAt(0).toUpperCase() + (notification.notification_metadata.entity_type || '').slice(1)}
                      />
                    </ListItem>
                  )}
                  {notification.notification_metadata.entity_name && (
                    <ListItem>
                      <ListItemIcon>
                        <Description />
                      </ListItemIcon>
                      <ListItemText
                        primary="Entity Name"
                        secondary={notification.notification_metadata.entity_name}
                      />
                    </ListItem>
                  )}
                  {notification.notification_metadata.module && (
                    <ListItem>
                      <ListItemIcon>
                        <Link />
                      </ListItemIcon>
                      <ListItemText
                        primary="Module"
                        secondary={(notification.notification_metadata.module || '').charAt(0).toUpperCase() + (notification.notification_metadata.module || '').slice(1)}
                      />
                    </ListItem>
                  )}
                  {notification.notification_metadata.department && (
                    <ListItem>
                      <ListItemIcon>
                        <LocationOn />
                      </ListItemIcon>
                      <ListItemText
                        primary="Department"
                        secondary={notification.notification_metadata.department}
                      />
                    </ListItem>
                  )}
                  {notification.notification_metadata.cost && (
                    <ListItem>
                      <ListItemIcon>
                        <Description />
                      </ListItemIcon>
                      <ListItemText
                        primary="Cost"
                        secondary={formatCurrency(notification.notification_metadata.cost)}
                      />
                    </ListItem>
                  )}
                  {notification.notification_metadata.quantity && (
                    <ListItem>
                      <ListItemIcon>
                        <Description />
                      </ListItemIcon>
                      <ListItemText
                        primary="Quantity"
                        secondary={notification.notification_metadata.quantity}
                      />
                    </ListItem>
                  )}
                  {notification.notification_metadata.ip_address && (
                    <ListItem>
                      <ListItemIcon>
                        <Security />
                      </ListItemIcon>
                      <ListItemText
                        primary="IP Address"
                        secondary={notification.notification_metadata.ip_address}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
} 