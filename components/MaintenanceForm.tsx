"use client";
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Button,
  TextField,
  Typography,
  Chip,
  Alert,
  Divider,
  Paper
} from '@mui/material';

import {
  Build,
  Schedule,
  Assignment,
  Warning,
  Save,
  Cancel
} from '@mui/icons-material';

// Custom Select component to avoid Material-UI SSR issues
const CustomSelect = ({ value, onChange, children, label, error, ...props }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div style={{ 
        width: '100%', 
        height: '56px', 
        border: '1px solid #e0e0e0', 
        borderRadius: '4px', 
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        cursor: 'pointer'
      }}>
        <span style={{ color: '#666' }}>{label}</span>
      </div>
    );
  }
  
  const selectedChild = React.Children.toArray(children).find(
    (child: any) => child.props.value === value
  );
  
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          width: '100%',
          height: '56px',
          border: `1px solid ${error ? '#d32f2f' : '#e0e0e0'}`,
          borderRadius: '4px',
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          cursor: 'pointer',
          justifyContent: 'space-between'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ color: value ? '#000' : '#666' }}>
          {selectedChild && typeof selectedChild === 'object' && 'props' in selectedChild ? selectedChild.props.children : label}
        </span>
        <span style={{ fontSize: '12px' }}>▼</span>
      </div>
      
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          {React.Children.map(children, (child: any) => (
            <div
              key={child.props.value}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: child.props.value === value ? '#f5f5f5' : 'transparent'
              }}
              onClick={() => {
                if (!child.props.disabled) {
                  onChange({ target: { value: child.props.value } });
                  setIsOpen(false);
                }
              }}
            >
              {child.props.children}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Custom MenuItem component
const CustomMenuItem = ({ children, value, disabled, ...props }: any) => {
  return (
    <div style={{ 
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer'
    }}>
      {children}
    </div>
  );
};

interface MaintenanceFormInputs {
  asset_id: number | string;
  asset_name: string;
  custom_asset_name?: string;
  maintenance_type: 'preventive' | 'corrective' | 'emergency' | 'inspection' | '';
  priority: 'low' | 'medium' | 'high' | 'critical' | '';
  description: string;
  performed_by: string; // Changed from assigned_to
  custom_assigned_name?: string;
  maintenance_date: string; // Changed from scheduled_date
  start_date?: string;
  completion_date?: string;
  cost: number;
  vendor?: string;
  notes?: string;
  next_maintenance_date?: string;
  status?: string;
}

interface MaintenanceFormProps {
  onSubmit: (data: any) => void; // Accept any payload for backend compatibility
  defaultValues?: Partial<MaintenanceFormInputs>;
  title?: string;
  mode?: 'create' | 'edit';
}

const maintenanceTypes = [
  { value: 'preventive', label: 'Preventive Maintenance', icon: <Schedule /> },
  { value: 'corrective', label: 'Corrective Maintenance', icon: <Build /> },
  { value: 'emergency', label: 'Emergency Maintenance', icon: <Warning /> },
  { value: 'inspection', label: 'Inspection', icon: <Assignment /> }
];

const priorities = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'info' },
  { value: 'high', label: 'High', color: 'warning' },
  { value: 'critical', label: 'Critical', color: 'error' }
];

interface Asset {
  id: number;
  name: string;
  category: string;
  location: string;
  description?: string;
}

interface MaintenanceUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  position: string;
}

const defaultFormValues: MaintenanceFormInputs = {
  asset_id: '',
  asset_name: '',
  custom_asset_name: '',
  maintenance_type: '',
  priority: '',
  description: '',
  performed_by: '',
  custom_assigned_name: '',
  maintenance_date: '',
  start_date: '',
  completion_date: '',
  cost: 0,
  vendor: '',
  notes: '',
  next_maintenance_date: ''
};

export default function MaintenanceForm({ 
  onSubmit, 
  defaultValues, 
  title = "Schedule Maintenance",
  mode = 'create'
}: MaintenanceFormProps) {
  const { handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<MaintenanceFormInputs>({ 
    defaultValues: {
      ...defaultFormValues,
      ...defaultValues
    }
  });
  
  const { user } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<number | string | null>(defaultValues?.asset_id || null);
  const [maintenanceUsers, setMaintenanceUsers] = useState<MaintenanceUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [selectedAssetLocation, setSelectedAssetLocation] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  
  // Get user info for location-based filtering
  const [userInfo, setUserInfo] = useState<any>(null);
  
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserInfo(payload);
        console.log('DEBUG: userInfo from JWT payload:', payload);
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }
  }, []);
  
  // Filter assets based on user's location access
  const getFilteredAssets = () => {
    if (!userInfo) return assets;
    
    // If user is admin, show all assets
    if (userInfo.role === 'admin') return assets;
    
    // If user is maintenance manager, filter by their assigned locations
    if (userInfo.role === 'maintenance_manager' || (userInfo.permissions && userInfo.permissions.includes('maintenance'))) {
      if (userInfo.asset_access) {
        let userLocations: string[] = [];
        
        // Parse asset_access if it's a JSON string
        if (typeof userInfo.asset_access === 'string') {
          try {
            userLocations = JSON.parse(userInfo.asset_access);
          } catch {
            userLocations = [userInfo.asset_access];
          }
        } else {
          userLocations = userInfo.asset_access;
        }
        
        console.log('User locations:', userLocations);
        console.log('All assets:', assets);
        
        const filteredAssets = assets.filter(asset => userLocations.includes(asset.location));
        console.log('Filtered assets for maintenance manager:', filteredAssets);
        
        return filteredAssets;
      }
    }
    
    // For other users, filter by their asset access
    if (userInfo.asset_access) {
      let userLocations: string[] = [];
      
      if (typeof userInfo.asset_access === 'string') {
        try {
          userLocations = JSON.parse(userInfo.asset_access);
        } catch {
          userLocations = [userInfo.asset_access];
        }
      } else {
        userLocations = userInfo.asset_access;
      }
      
      const filteredAssets = assets.filter(asset => userLocations.includes(asset.location));
      console.log('Filtered assets for other users:', filteredAssets);
      
      return filteredAssets;
    }
    
    return [];
  };

  // Fetch users with maintenance permissions
  const fetchMaintenanceUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${API_BASE_URL}/users?permissions=maintenance`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch maintenance users');
      }
      
      const users = await response.json();
      setMaintenanceUsers(users);
    } catch (err) {
      console.error('Error fetching maintenance users:', err);
      setMaintenanceUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch maintenance managers for a specific location
  const fetchMaintenanceManagersForLocation = async (location: string) => {
    try {
      setLoadingUsers(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      // Fetch users with maintenance permissions and filter by location
      const response = await fetch(`${API_BASE_URL}/users?permissions=maintenance`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch maintenance users');
      }
      
      const allUsers = await response.json();
      
      // Filter users by location - look for users who have access to this location
      const locationUsers = allUsers.filter((user: any) => {
        // Check if user has asset_access that includes this location
        if (user.asset_access) {
          let userLocations: string[] = [];
          
          // Parse asset_access if it's a JSON string
          if (typeof user.asset_access === 'string') {
            try {
              userLocations = JSON.parse(user.asset_access);
            } catch {
              userLocations = [user.asset_access];
            }
          } else {
            userLocations = user.asset_access;
          }
          
          return userLocations.includes(location);
        }
        return false;
      });
      
      console.log(`Found ${locationUsers.length} maintenance managers for location: ${location}`);
      setMaintenanceUsers(locationUsers);
    } catch (err) {
      console.error('Error fetching maintenance managers for location:', err);
      // Fallback to all maintenance users
      await fetchMaintenanceUsers();
    } finally {
      setLoadingUsers(false);
    }
  };

  // Initial fetch of maintenance users
  useEffect(() => {
    fetchMaintenanceUsers();
  }, []);

  // Fetch assets from backend
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoadingAssets(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const response = await fetch(`${API_BASE_URL}/assets`, {
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch assets');
        }
        
        const assetsData = await response.json();
        setAssets(assetsData);
        console.log('DEBUG: assets fetched from backend:', assetsData);
      } catch (err) {
        console.error('Error fetching assets:', err);
        setAssets([]);
      } finally {
        setLoadingAssets(false);
      }
    };

    fetchAssets();
  }, []);

  const maintenanceType = watch("maintenance_type");

  const getTypeIcon = (type: string) => {
    const typeInfo = maintenanceTypes.find(t => t.value === type);
    return typeInfo?.icon || <Build />;
  };

  const handleAssetChange = async (assetId: number | string) => {
    if (typeof assetId === 'number') {
      setSelectedAsset(assetId);
      const asset = assets.find(a => a.id === assetId);
      if (asset) {
        setValue("asset_name", asset.name);
        setSelectedAssetLocation(asset.location);
        
        // Clear the assigned field when asset changes to prevent wrong assignments
        setValue("performed_by", "");
        setValue("custom_assigned_name", "");
        
        // Fetch maintenance managers for this asset's location
        await fetchMaintenanceManagersForLocation(asset.location);
      }
    } else {
      setSelectedAsset(null);
      setValue("asset_name", "");
      setSelectedAssetLocation(null);
      
      // Clear the assigned field when no asset is selected
      setValue("performed_by", "");
      setValue("custom_assigned_name", "");
      
      // Reset to all maintenance users when no asset is selected
      await fetchMaintenanceUsers();
    }
  };

  const handleFormSubmit = (data: MaintenanceFormInputs) => {
    setFormError(null);
    data.cost = Number(data.cost) || 0;
    
    // Prepare payload for backend
    const payload = { ...data };
    
    // Map frontend fields to backend fields
    payload.maintenance_date = payload.maintenance_date;
    
    // Handle assigned_to to performed_by mapping
    if (payload.performed_by === "custom") {
      payload.performed_by = payload.custom_assigned_name;
    } else {
      payload.performed_by = payload.performed_by;
    }
    
    // Handle asset mapping
    if (payload.asset_id === "custom") {
      payload.asset_name = payload.custom_asset_name;
      payload.asset_id = null; // Set to null for custom assets
    } else {
      // For existing assets, ensure asset_name is set
      if (payload.asset_id && !payload.asset_name) {
        const selectedAsset = assets.find(a => a.id === payload.asset_id);
        if (selectedAsset) {
          payload.asset_name = selectedAsset.name;
        }
      }
    }
    
    // Set default status for new maintenance
    payload.status = "scheduled";
    
    // Clean up frontend-specific fields
    delete payload.custom_assigned_name;
    delete payload.custom_asset_name;
    
    // Remove any fields that don't exist in the Maintenance model
    delete payload.asset_category;
    delete payload.asset_location;
    delete payload.asset_description;
    
    // Convert empty string dates to null
    ['maintenance_date', 'start_date', 'completion_date', 'next_maintenance_date'].forEach(field => {
      if (payload[field] === "") {
        payload[field] = null;
      }
    });

    console.log('Submitting maintenance form (filtered):', payload);
    try {
      onSubmit(payload);
    } catch (err) {
      setFormError('Failed to submit maintenance form.');
    }
  };

  return (
    <Box p={0}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {getTypeIcon(maintenanceType)}
        {title}
      </Typography>

      {mode === 'create' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Schedule a new maintenance task for Gusau LGA assets. Fill in the details below to create a maintenance record.
        </Alert>
      )}

      {/* Location-based access information */}
      {userInfo && userInfo.role === 'admin' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Administrator Access:</strong> As an administrator, you can schedule maintenance for any asset in the system.
          </Typography>
        </Alert>
      )}
      {userInfo && userInfo.role !== 'admin' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Manager Access:</strong> As a manager, you can only schedule maintenance for assets in your assigned locations.
            {userInfo.asset_access && (
              <span> Your assigned locations: {Array.isArray(userInfo.asset_access) ? userInfo.asset_access.join(', ') : userInfo.asset_access}</span>
            )}
          </Typography>
        </Alert>
      )}

      {/* Maintenance Manager Access information */}
      {userInfo && (userInfo.role === 'maintenance_manager' || (userInfo.permissions && userInfo.permissions.includes('maintenance'))) && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Maintenance Manager Access:</strong> You have permission to schedule maintenance for assets in your assigned locations.
          </Typography>
        </Alert>
      )}

      {/* Location-based assignment information */}
      {selectedAssetLocation && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Location-based Assignment:</strong> Showing maintenance managers assigned to <strong>{selectedAssetLocation}</strong>. 
            Only users with access to this location are displayed in the assignment dropdown.
          </Typography>
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>
        )}
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          {/* Asset Selection */}
          <Box>
            <Controller
              name="asset_id"
              control={control}
              rules={{ required: "Asset selection is required" }}
              render={({ field, fieldState: { error } }) => (
                <CustomSelect
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e);
                    handleAssetChange(e.target.value);
                  }}
                  label="Select Asset"
                  error={!!error}
                >
                  <CustomMenuItem value="custom">+ Add Custom Asset</CustomMenuItem>
                  {loadingAssets ? (
                    <CustomMenuItem disabled>Loading assets...</CustomMenuItem>
                  ) : getFilteredAssets().length > 0 ? (
                    getFilteredAssets().map((asset) => (
                      <CustomMenuItem key={asset.id} value={asset.id}>
                        <Box>
                          <Typography variant="body2">{asset.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {asset.category} • {asset.location}
                          </Typography>
                        </Box>
                      </CustomMenuItem>
                    ))
                  ) : (
                    <CustomMenuItem disabled>No assets found for your location</CustomMenuItem>
                  )}
                </CustomSelect>
              )}
            />
            
            {watch("asset_id") === "custom" && (
              <Controller
                name="custom_asset_name"
                control={control}
                rules={{ required: "Custom asset name is required" }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Custom Asset Name"
                    fullWidth
                    error={!!error}
                    helperText={error?.message}
                    placeholder="Enter custom asset name"
                    sx={{ mt: 2 }}
                  />
                )}
              />
            )}
          </Box>

          {/* Maintenance Type */}
          <Box>
            <Controller
              name="maintenance_type"
              control={control}
              rules={{ required: "Maintenance type is required" }}
              render={({ field, fieldState: { error } }) => (
                <CustomSelect
                  value={field.value}
                  onChange={field.onChange}
                  label="Maintenance Type"
                  error={!!error}
                >
                  {maintenanceTypes.map((type) => (
                    <CustomMenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {type.icon}
                        {type.label}
                      </Box>
                    </CustomMenuItem>
                  ))}
                </CustomSelect>
              )}
            />
          </Box>

          {/* Priority */}
          <Box>
            <Controller
              name="priority"
              control={control}
              rules={{ required: "Priority is required" }}
              render={({ field, fieldState: { error } }) => (
                <CustomSelect
                  value={field.value}
                  onChange={field.onChange}
                  label="Priority"
                  error={!!error}
                >
                  {priorities.map((priority) => (
                    <CustomMenuItem key={priority.value} value={priority.value}>
                      <Chip
                        label={priority.label}
                        size="small"
                        color={priority.color as any}
                      />
                    </CustomMenuItem>
                  ))}
                </CustomSelect>
              )}
            />
          </Box>

          {/* Assigned To */}
          <Box>
            <Controller
              name="performed_by"
              control={control}
              rules={{ required: "Assigned personnel is required" }}
              render={({ field, fieldState: { error } }) => (
                <CustomSelect
                  value={field.value}
                  onChange={field.onChange}
                  label="Assigned To"
                  error={!!error}
                >
                  <CustomMenuItem value="custom">+ Add Custom Personnel</CustomMenuItem>
                  {loadingUsers ? (
                    <CustomMenuItem disabled>Loading maintenance managers...</CustomMenuItem>
                  ) : maintenanceUsers.length > 0 ? (
                    maintenanceUsers.map((user) => (
                      <CustomMenuItem key={user.id} value={`${user.first_name} ${user.last_name}`}>
                        <Box>
                          <Typography variant="body2">
                            {user.first_name} {user.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.position} • {user.department}
                            {selectedAssetLocation && (
                              <span> • Location: {selectedAssetLocation}</span>
                            )}
                          </Typography>
                        </Box>
                      </CustomMenuItem>
                    ))
                  ) : (
                    <CustomMenuItem disabled>
                      {selectedAssetLocation 
                        ? `No maintenance managers found for ${selectedAssetLocation}` 
                        : 'No users with maintenance permissions found'
                      }
                    </CustomMenuItem>
                  )}
                </CustomSelect>
              )}
            />
            
            {watch("performed_by") === "custom" && (
              <Controller
                name="custom_assigned_name"
                control={control}
                rules={{ required: "Custom personnel name is required" }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Custom Personnel Name"
                    fullWidth
                    error={!!error}
                    helperText={error?.message}
                    placeholder="Enter custom personnel name"
                    sx={{ mt: 2 }}
                  />
                )}
              />
            )}
          </Box>
        </Box>

        {/* Description */}
        <Box sx={{ mt: 3 }}>
          <Controller
            name="description"
            control={control}
            rules={{ required: "Description is required" }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Description"
                multiline
                rows={3}
                fullWidth
                error={!!error}
                helperText={error?.message}
                placeholder="Describe the maintenance task..."
              />
            )}
          />
        </Box>

        {/* Dates */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 3 }}>
          <Controller
            name="maintenance_date"
            control={control}
            rules={{ required: "Scheduled date is required" }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Scheduled Date"
                type="date"
                fullWidth
                error={!!error}
                helperText={error?.message}
                InputLabelProps={{ shrink: true }}
              />
            )}
          />

          <Controller
            name="start_date"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Start Date (Optional)"
                type="date"
                fullWidth
                error={!!error}
                helperText={error?.message}
                InputLabelProps={{ shrink: true }}
              />
            )}
          />
        </Box>

        {/* Completion and Next Maintenance Dates */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 3 }}>
          <Controller
            name="completion_date"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Completion Date (Optional)"
                type="date"
                fullWidth
                error={!!error}
                helperText={error?.message}
                InputLabelProps={{ shrink: true }}
              />
            )}
          />

          <Controller
            name="next_maintenance_date"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Next Maintenance Date (Optional)"
                type="date"
                fullWidth
                error={!!error}
                helperText={error?.message}
                InputLabelProps={{ shrink: true }}
              />
            )}
          />
        </Box>

        <Divider sx={{ width: '100%', my: 3 }} />

        {/* Cost and Vendor Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Cost & Vendor Information
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <Controller
            name="cost"
            control={control}
            rules={{ 
              required: "Cost is required",
              min: { value: 0, message: "Cost must be positive" }
            }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Estimated Cost (₦)"
                type="number"
                fullWidth
                error={!!error}
                helperText={error?.message}
                InputProps={{
                  startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₦</Typography>
                }}
                value={field.value === null || field.value === undefined ? '' : field.value}
              />
            )}
          />

          <Controller
            name="vendor"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Vendor/Service Provider (Optional)"
                fullWidth
                error={!!error}
                helperText={error?.message}
                placeholder="e.g., Tech Solutions Ltd"
              />
            )}
          />
        </Box>

        {/* Notes */}
        <Box sx={{ mt: 3 }}>
          <Controller
            name="notes"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Additional Notes (Optional)"
                multiline
                rows={3}
                fullWidth
                error={!!error}
                helperText={error?.message}
                placeholder="Any additional notes or special instructions..."
              />
            )}
          />
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={() => window.history.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<Save />}
            disabled={isSubmitting}
          >
            {mode === 'create' ? 'Schedule Maintenance' : 'Update Maintenance'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
} 