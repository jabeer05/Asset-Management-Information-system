"use client";
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Button,
  TextField,
  Typography,
  Chip,
  Alert,
  Divider,
  Paper,
  Card,
  CardContent,
  Grid,
  Stack
} from '@mui/material';
import {
  Delete,
  Gavel,
  Assignment,
  Warning,
  Save,
  Cancel,
  Info,
  LocationOn,
  Category
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import {
  SSRSafeFormControl,
  SSRSafeInputLabel,
  SSRSafeSelect,
  SSRSafeMenuItem
} from './SSRSafeComponents';

interface SendToDisposalAuctionFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface FormInputs {
  type: 'disposal' | 'auction';
  asset_id: string;
  manager_id: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_value?: number;
  reason: string;
}

interface Asset {
  id: number;
  name: string;
  category: string;
  location: string;
  status: string;
  asset_condition: string;
  purchase_cost: number;
}

interface Manager {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  email: string;
}

const priorities = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'info' },
  { value: 'high', label: 'High', color: 'warning' },
  { value: 'critical', label: 'Critical', color: 'error' }
];

export default function SendToDisposalAuctionForm({ onSubmit, onCancel, loading = false }: SendToDisposalAuctionFormProps) {
  const { user } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const { handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormInputs>({
    defaultValues: {
      type: 'disposal',
      asset_id: '',
      manager_id: '',
      message: '',
      priority: 'medium',
      estimated_value: 0,
      reason: ''
    }
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const watchType = watch("type");
  const watchAssetId = watch("asset_id");

  // Fetch assets
  useEffect(() => {
    const fetchAssets = async () => {
      setLoadingAssets(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const response = await fetch(`${API_BASE_URL}/assets`, {
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch assets');
        }
        
        const assetsData = await response.json();
        
        // Filter assets based on user role
        let filteredAssets = assetsData;
        if (user?.role !== 'admin') {
          // For non-admin users, filter by their assigned locations
          const userLocations = user?.asset_access || [];
          let userLocationsArray: string[] = [];
          
          if (typeof userLocations === 'string') {
            try {
              userLocationsArray = JSON.parse(userLocations);
            } catch {
              userLocationsArray = [userLocations];
            }
          } else {
            userLocationsArray = userLocations;
          }
          
          filteredAssets = assetsData.filter((asset: Asset) => 
            userLocationsArray.includes(asset.location)
          );
        }
        
        setAssets(filteredAssets);
      } catch (err) {
        console.error('Error fetching assets:', err);
        setFormError('Failed to fetch assets');
      } finally {
        setLoadingAssets(false);
      }
    };

    fetchAssets();
  }, [user]);

  // Fetch managers when asset changes
  useEffect(() => {
    if (!watchAssetId) {
      setManagers([]);
      setSelectedAsset(null);
      setValue("manager_id", "");
      return;
    }

    const fetchManagers = async () => {
      setLoadingManagers(true);
      try {
        const asset = assets.find(a => a.id.toString() === watchAssetId);
        if (!asset) return;

        setSelectedAsset(asset);

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        // Fetch all users with appropriate permissions
        const permission = watchType === 'disposal' ? 'disposal' : 'auctions';
        const apiUrl = `${API_BASE_URL}/users?permission=${permission}&location=${encodeURIComponent(asset.location)}`;
        console.log('Fetching managers with URL:', apiUrl);
        console.log('Asset location:', asset.location);
        console.log('Request type:', watchType);
        
        const response = await fetch(apiUrl, {
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
        });
        
        if (response.ok) {
          const managersData = await response.json();
          console.log(`Found ${managersData.length} managers for ${watchType} at location: ${asset.location}`);
          console.log('Managers returned from API:', managersData);
          setManagers(managersData);
          
          // Auto-select first manager if available
          if (managersData.length > 0) {
            setValue("manager_id", managersData[0].id.toString());
          }
        } else {
          console.error('Failed to fetch users:', response.status);
          const errorText = await response.text();
          console.error('Error details:', errorText);
          setManagers([]);
        }
      } catch (err) {
        console.error('Error fetching managers:', err);
        setManagers([]);
      } finally {
        setLoadingManagers(false);
      }
    };

    fetchManagers();
  }, [watchAssetId, watchType, assets, user]);

  const handleFormSubmit = (data: FormInputs) => {
    setFormError(null);
    
    const payload = {
      ...data,
      asset_id: parseInt(data.asset_id),
      manager_id: parseInt(data.manager_id),
      estimated_value: Number(data.estimated_value) || 0,
      asset_name: selectedAsset?.name || 'Unknown Asset'
    };

    onSubmit(payload);
  };

  const getTypeIcon = (type: string) => {
    return type === 'disposal' ? <Delete /> : <Gavel />;
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

  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
      return '₦0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Box p={0}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {getTypeIcon(watchType)}
        Send Asset to {watchType === 'disposal' ? 'Disposal' : 'Auction'}
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Request to send an asset for {watchType === 'disposal' ? 'disposal' : 'auction'}. 
          The system will automatically find appropriate managers based on the asset's location.
        </Typography>
      </Alert>

      {formError && (
        <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
        <Grid container spacing={3}>
          {/* Type Selection */}
          <Grid item xs={12} md={6}>
            <Controller
              name="type"
              control={control}
              rules={{ required: "Type is required" }}
              render={({ field, fieldState: { error } }) => (
                <SSRSafeFormControl fullWidth error={!!error}>
                  <SSRSafeInputLabel>Request Type</SSRSafeInputLabel>
                  <SSRSafeSelect
                    value={field.value}
                    onChange={field.onChange}
                    label="Request Type"
                  >
                    <SSRSafeMenuItem value="disposal">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Delete />
                        Disposal
                      </Box>
                    </SSRSafeMenuItem>
                    <SSRSafeMenuItem value="auction">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Gavel />
                        Auction
                      </Box>
                    </SSRSafeMenuItem>
                  </SSRSafeSelect>
                </SSRSafeFormControl>
              )}
            />
          </Grid>

          {/* Priority */}
          <Grid item xs={12} md={6}>
            <Controller
              name="priority"
              control={control}
              rules={{ required: "Priority is required" }}
              render={({ field, fieldState: { error } }) => (
                <SSRSafeFormControl fullWidth error={!!error}>
                  <SSRSafeInputLabel>Priority</SSRSafeInputLabel>
                  <SSRSafeSelect
                    value={field.value}
                    onChange={field.onChange}
                    label="Priority"
                  >
                    {priorities.map((priority) => (
                      <SSRSafeMenuItem key={priority.value} value={priority.value}>
                        <Chip
                          label={priority.label}
                          size="small"
                          color={priority.color as any}
                        />
                      </SSRSafeMenuItem>
                    ))}
                  </SSRSafeSelect>
                </SSRSafeFormControl>
              )}
            />
          </Grid>

          {/* Asset Selection */}
          <Grid item xs={12}>
            <Controller
              name="asset_id"
              control={control}
              rules={{ required: "Asset selection is required" }}
              render={({ field, fieldState: { error } }) => (
                <SSRSafeFormControl fullWidth error={!!error}>
                  <SSRSafeInputLabel>Select Asset</SSRSafeInputLabel>
                  <SSRSafeSelect
                    value={field.value}
                    onChange={field.onChange}
                    label="Select Asset"
                  >
                    {loadingAssets ? (
                      <SSRSafeMenuItem disabled>Loading assets...</SSRSafeMenuItem>
                    ) : assets.length > 0 ? (
                      assets.map((asset) => (
                        <SSRSafeMenuItem key={asset.id} value={asset.id.toString()}>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {asset.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {asset.category} • {asset.location} • {asset.status}
                            </Typography>
                          </Box>
                        </SSRSafeMenuItem>
                      ))
                    ) : (
                      <SSRSafeMenuItem disabled>No assets available</SSRSafeMenuItem>
                    )}
                  </SSRSafeSelect>
                </SSRSafeFormControl>
              )}
            />
          </Grid>

          {/* Asset Information */}
          {selectedAsset && (
            <Grid item xs={12}>
              <Card sx={{ p: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                <Typography variant="h6" gutterBottom>
                  Asset Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography variant="body1" fontWeight="medium">{selectedAsset.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Category</Typography>
                    <Typography variant="body1" fontWeight="medium">{selectedAsset.category}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Location</Typography>
                    <Typography variant="body1" fontWeight="medium">{selectedAsset.location}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Condition</Typography>
                    <Typography variant="body1" fontWeight="medium">{selectedAsset.asset_condition}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Purchase Cost</Typography>
                    <Typography variant="body1" fontWeight="medium">{formatCurrency(selectedAsset.purchase_cost)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Typography variant="body1" fontWeight="medium">{selectedAsset.status}</Typography>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          )}

          {/* Manager Selection */}
          <Grid item xs={12}>
            <Controller
              name="manager_id"
              control={control}
              rules={{ required: "Manager selection is required" }}
              render={({ field, fieldState: { error } }) => (
                <SSRSafeFormControl fullWidth error={!!error}>
                  <SSRSafeInputLabel>Assign to Manager</SSRSafeInputLabel>
                  <SSRSafeSelect
                    value={field.value}
                    onChange={field.onChange}
                    label="Assign to Manager"
                    disabled={loadingManagers}
                  >
                    {loadingManagers ? (
                      <SSRSafeMenuItem disabled>Loading managers...</SSRSafeMenuItem>
                    ) : managers.length > 0 ? (
                      managers.map((manager) => (
                        <SSRSafeMenuItem key={manager.id} value={manager.id.toString()}>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {manager.first_name} {manager.last_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {manager.role} • {manager.department}
                            </Typography>
                          </Box>
                        </SSRSafeMenuItem>
                      ))
                    ) : (
                      <SSRSafeMenuItem disabled>
                        No {watchType} managers found for this asset location
                      </SSRSafeMenuItem>
                    )}
                  </SSRSafeSelect>
                </SSRSafeFormControl>
              )}
            />
            {loadingManagers && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Finding {watchType} managers for asset location...
              </Typography>
            )}
          </Grid>

          {/* Estimated Value */}
          <Grid item xs={12} md={6}>
            <Controller
              name="estimated_value"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="Estimated Value"
                  type="number"
                  fullWidth
                  error={!!error}
                  helperText={error?.message}
                  placeholder="Enter estimated value"
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₦</Typography>
                  }}
                />
              )}
            />
          </Grid>

          {/* Reason */}
          <Grid item xs={12}>
            <Controller
              name="reason"
              control={control}
              rules={{ required: "Reason is required" }}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="Reason for Request"
                  multiline
                  rows={3}
                  fullWidth
                  error={!!error}
                  helperText={error?.message}
                  placeholder="Explain why this asset should be sent for disposal/auction..."
                />
              )}
            />
          </Grid>

          {/* Additional Message */}
          <Grid item xs={12}>
            <Controller
              name="message"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="Additional Message (Optional)"
                  multiline
                  rows={2}
                  fullWidth
                  error={!!error}
                  helperText={error?.message}
                  placeholder="Any additional information for the manager..."
                />
              )}
            />
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            onClick={onCancel}
            variant="outlined"
            startIcon={<Cancel />}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<Save />}
            disabled={loading}
          >
            {loading ? 'Sending Request...' : 'Send Request'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
