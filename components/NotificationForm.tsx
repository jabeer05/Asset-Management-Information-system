"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Alert,
  FormHelperText,
  Autocomplete,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Tooltip,
  Paper,
  Container,
} from '@mui/material';
import SSRSafeDialog from './SSRSafeDialog';
import {
  Notifications,
  Save,
  Cancel,
  Add,
  Remove,
  Schedule,
  Person,
  Email,
  PriorityHigh,
  Warning,
  Info,
  CheckCircle,
  ErrorOutline,
  Security,
  Settings,
  Build,
  Assessment,
  SwapHoriz,
  Gavel
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { getAssets } from '../app/api/assets';

interface NotificationFormData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'maintenance' | 'security' | 'system' | 'asset' | 'user' | 'audit' | 'disposal' | 'transfer' | 'auction' | 'report';
  priority: 'low' | 'medium' | 'high' | 'critical';
  recipient_id: number;
  recipient_name: string;
  recipient_email: string;
  sender_id?: number;
  sender_name?: string;
  expires_at?: string;
  action_url?: string;
  action_text?: string;
  metadata?: {
    entity_type?: string;
    entity_id?: number;
    entity_name?: string;
    module?: string;
    department?: string;
    cost?: number;
    quantity?: number;
  };
  asset_id?: number;
  parent_id?: number;
}

const notificationTypes = [
  { value: 'info', label: 'Information', icon: <Info /> },
  { value: 'warning', label: 'Warning', icon: <Warning /> },
  { value: 'error', label: 'Error', icon: <ErrorOutline /> },
  { value: 'success', label: 'Success', icon: <CheckCircle /> },
  { value: 'maintenance', label: 'Maintenance', icon: <Schedule /> },
  { value: 'security', label: 'Security', icon: <Security /> },
  { value: 'system', label: 'System', icon: <Settings /> },
  { value: 'asset', label: 'Asset', icon: <Info /> },
  { value: 'user', label: 'User', icon: <Person /> },
  { value: 'audit', label: 'Audit', icon: <Assessment /> },
  { value: 'disposal', label: 'Disposal', icon: <Remove /> },
  { value: 'transfer', label: 'Transfer', icon: <SwapHoriz /> },
  { value: 'auction', label: 'Auction', icon: <Gavel /> },
  { value: 'report', label: 'Report', icon: <Assessment /> },
];

const priorities = [
  { value: 'low', label: 'Low', icon: <Info /> },
  { value: 'medium', label: 'Medium', icon: <Warning /> },
  { value: 'high', label: 'High', icon: <PriorityHigh /> },
  { value: 'critical', label: 'Critical', icon: <ErrorOutline /> }
];

const entityTypes = [
  'asset', 'user', 'maintenance', 'transfer', 'auction', 'disposal', 'audit', 'report', 'system'
];

const modules = [
  'assets', 'users', 'maintenance', 'transfers', 'auctions', 'disposals', 'audit', 'reports', 'notifications'
];

const departments = [
  'IT Department', 'HR Department', 'Finance Department', 'Operations Department', 'Marketing Department'
];

interface NotificationFormProps {
  notificationId?: string;
  isEdit?: boolean;
  parentId?: number; // For replies
}

export default function NotificationForm({ notificationId, isEdit = false, parentId }: NotificationFormProps) {
  const router = useRouter();
  // When initializing formData, if parentId is provided, set it
  const [formData, setFormData] = useState<NotificationFormData>({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    recipient_id: 0,
    recipient_name: '',
    recipient_email: '',
    sender_name: '',
    expires_at: '',
    action_url: '',
    action_text: '',
    metadata: {
      entity_type: '',
      entity_id: undefined,
      entity_name: '',
      module: '',
      department: '',
      cost: undefined,
      quantity: undefined
    },
    parent_id: parentId,
  });

  const [errors, setErrors] = useState<Partial<NotificationFormData>>({});
  const [showMetadata, setShowMetadata] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [assets, setAssets] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${API_BASE_URL}/users`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data);
      } catch (e) {
        setUsers([]);
      }
      setLoadingUsers(false);
    }
    async function fetchAssets() {
      setLoadingAssets(true);
      try {
        const data = await getAssets();
        setAssets(data);
      } catch (e) {
        setAssets([]);
      }
      setLoadingAssets(false);
    }
    fetchUsers();
    fetchAssets();
  }, []);

  const handleInputChange = (field: keyof NotificationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleMetadataChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.notification_metadata,
        [field]: value
      }
    }));
  };

  const handleRecipientChange = (user: any) => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        recipient_id: user.id,
        recipient_name: user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name}`
          : (user.username || user.email),
        recipient_email: user.email
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        recipient_id: 0,
        recipient_name: '',
        recipient_email: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<NotificationFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    if (!formData.recipient_name.trim()) {
      newErrors.recipient_name = 'Recipient is required';
    }

    if (formData.action_url && !formData.action_text) {
      newErrors.action_text = 'Action text is required when action URL is provided';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const payload = {
        ...formData,
        user_id: Number(formData.recipient_id), // Ensure it's a number for backend
        metadata: formData.notification_metadata ? JSON.stringify(formData.notification_metadata) : undefined,
        ...(formData.parent_id ? { parent_id: formData.parent_id } : {}),
      };
      delete payload.recipient_id; // Remove recipient_id from payload
      console.log('Notification payload:', payload); // DEBUG LOG
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to send notification');
      setSuccessModalOpen(true);
      setTimeout(() => {
        setSuccessModalOpen(false);
        router.push('/notifications');
      }, 2000);
    } catch (err) {
      setErrors({ message: (err as Error).message });
    }
  };

  const handleCancel = () => {
    router.push('/notifications');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const selectedAsset = assets.find(a => a.id === formData.asset_id);

  // Add a synthetic 'All Users' option
  const allUsersOption = { id: -1, first_name: 'All', last_name: 'Users', email: 'all@system', role: 'all', permissions: [], username: 'all' };
  const usersWithAll = [allUsersOption, ...users];

  return (
    <Box p={0}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Notifications color="primary" />
        {isEdit ? 'Edit Notification' : 'Create New Notification'}
      </Typography>

      {!isEdit && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Send a new notification to a user or group. Fill in the details below to create a notification.
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        {Object.values(errors).length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {Object.values(errors).filter(Boolean).join(' | ')}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Notification Title */}
          <TextField
            label="Notification Title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
            fullWidth
            required
          />

          {/* Type and Priority */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) => handleInputChange('type', e.target.value)}
              >
                {notificationTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {type.icon}
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={(e) => handleInputChange('priority', e.target.value)}
              >
                {priorities.map((priority) => (
                  <MenuItem key={priority.value} value={priority.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {priority.icon}
                      {priority.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Asset Selection */}
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Select Asset (optional)</InputLabel>
            <Select
              value={formData.asset_id ?? ''}
              label="Select Asset (optional)"
              onChange={e => handleInputChange('asset_id', e.target.value === '' ? undefined : Number(e.target.value))}
              disabled={loadingAssets}
            >
              <MenuItem value="">None</MenuItem>
              {assets.map(asset => (
                <MenuItem key={asset.id} value={asset.id}>
                  {asset.name} ({asset.category})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Asset Card - always show if asset_id is set and valid */}
          {typeof formData.asset_id === 'number' && selectedAsset && (
            <Card sx={{ mt: 2, background: '#f9f9f9', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Asset Details</Typography>
                <Typography variant="body2"><b>Name:</b> {selectedAsset.name}</Typography>
                <Typography variant="body2"><b>Category:</b> {selectedAsset.category}</Typography>
                <Typography variant="body2"><b>Serial Number:</b> {selectedAsset.serial_number || 'N/A'}</Typography>
                <Typography variant="body2"><b>Location:</b> {selectedAsset.location || 'N/A'}</Typography>
                <Typography variant="body2"><b>Status:</b> {selectedAsset.status || 'N/A'}</Typography>
                <Typography variant="body2"><b>Description:</b> {selectedAsset.description || 'N/A'}</Typography>
                {selectedAsset.image_url && (
                  <Box mt={2}>
                    <img 
                      src={selectedAsset.image_url.startsWith('http') ? selectedAsset.image_url : `http://localhost:8000${selectedAsset.image_url}`}
                      alt={selectedAsset.name} 
                      style={{ maxWidth: 120, borderRadius: 8 }}
                      onError={(e) => {
                        console.error('Failed to load asset image:', selectedAsset.image_url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recipient Selection */}
          <Autocomplete
            options={usersWithAll}
            getOptionLabel={(option) => {
              const fullName = (option.first_name && option.last_name)
                ? `${option.first_name} ${option.last_name}`
                : (option.username || option.email);
              return `${fullName} (${option.email}) [${option.role}]`;
            }}
            loading={loadingUsers}
            value={usersWithAll.find(u => u.id === formData.recipient_id) || null}
            onChange={(_, value) => handleRecipientChange(value)}
            renderInput={(params) => (
              <TextField {...params} label="Recipient" required error={!!errors.recipient_name} helperText={errors.recipient_name} />
            )}
          />
          {/* Selected User Card */}
          {formData.recipient_id !== undefined && formData.recipient_id !== 0 && usersWithAll.length > 0 && (() => {
            const selectedUser = usersWithAll.find(u => u.id === formData.recipient_id);
            if (!selectedUser) return null;
            const fullName = (selectedUser.first_name && selectedUser.last_name)
              ? `${selectedUser.first_name} ${selectedUser.last_name}`
              : (selectedUser.name || selectedUser.username || '');
            let permissions = selectedUser.permissions || [];
            return (
              <Card sx={{ mt: 2, background: '#f9f9f9', borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>User Details</Typography>
                  <Typography variant="body2"><b>Name:</b> {fullName}</Typography>
                  <Typography variant="body2"><b>Email:</b> {selectedUser.email}</Typography>
                  <Typography variant="body2"><b>Role:</b> {selectedUser.role}</Typography>
                  <Typography variant="body2"><b>Permissions:</b> {permissions.length > 0 ? permissions.join(', ') : 'None'}</Typography>
                </CardContent>
              </Card>
            );
          })()}

          {/* Message */}
          <TextField
            label="Message"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            error={!!errors.message}
            helperText={errors.message}
            fullWidth
            multiline
            rows={4}
            required
          />

          {/* Expires At */}
          <TextField
            label="Expires At (Optional)"
            type="datetime-local"
            value={formData.expires_at}
            onChange={(e) => handleInputChange('expires_at', e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          {/* Action (Optional) */}
          <Divider />
          <Typography variant="h6" gutterBottom>
            Action (Optional)
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Action URL"
              value={formData.action_url}
              onChange={(e) => handleInputChange('action_url', e.target.value)}
              fullWidth
              placeholder="/assets/123"
            />
            <TextField
              label="Action Text"
              value={formData.action_text}
              onChange={(e) => handleInputChange('action_text', e.target.value)}
              error={!!errors.action_text}
              helperText={errors.action_text}
              fullWidth
              placeholder="View Asset"
            />
          </Box>

          {/* Submit/Cancel Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<Save />}
              disabled={false}
            >
              {isEdit ? 'Update Notification' : 'Create Notification'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<Cancel />}
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Box>
      {/* Success Modal */}
      <SSRSafeDialog 
        open={successModalOpen} 
        onClose={() => setSuccessModalOpen(false)}
        title={`🎉 Notification ${isEdit ? 'Updated' : 'Created'} Successfully!`}
      >
        <div style={{ padding: '24px' }}>
          <Typography variant="h6" sx={{ mt: 1, mb: 2 }}>
            Your notification has been {isEdit ? 'updated' : 'created'} and sent {formData.recipient_id === -1 ? 'to all users' : 'to the selected user'}.
          </Typography>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Button onClick={() => { setSuccessModalOpen(false); router.push('/notifications'); }} color="primary" variant="contained">Go to Notifications</Button>
          </div>
        </div>
      </SSRSafeDialog>
    </Box>
  );
} 