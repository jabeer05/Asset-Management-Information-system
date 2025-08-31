"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Alert,
  Divider,
  Paper,
  Container
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Recycling,
  Save,
  Cancel,
  AttachMoney,
  Warning
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface DisposalFormInputs {
  asset_id: number | string;
  asset_name: string;
  custom_asset_name: string;
  disposal_type: 'sale' | 'donation' | 'destruction' | 'recycling' | 'trade_in' | 'scrap';
  disposal_date: string;
  disposal_value: number;
  disposal_cost: number;
  disposal_reason: string;
  disposal_method: string;
  buyer_recipient: string;
  disposal_location: string;
  authorized_by: string;
  custom_authorized_by: string;
  notes: string;
  environmental_impact: string;
  compliance_status: 'compliant' | 'non_compliant' | 'pending_review';
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
}

interface DisposalFormProps {
  onSubmit: (data: DisposalFormInputs) => void;
  defaultValues?: Partial<DisposalFormInputs>;
  title?: string;
  mode?: 'create' | 'edit';
}

const disposalTypes = [
  { value: 'sale', label: 'Sale', icon: <AttachMoney /> },
  { value: 'donation', label: 'Donation', icon: <Recycling /> },
  { value: 'destruction', label: 'Destruction', icon: <Warning /> },
  { value: 'recycling', label: 'Recycling', icon: <Recycling /> },
  { value: 'trade_in', label: 'Trade-in', icon: <AttachMoney /> },
  { value: 'scrap', label: 'Scrap', icon: <Recycling /> }
];

const disposalStatuses = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'approved', label: 'Approved', color: 'success' },
  { value: 'rejected', label: 'Rejected', color: 'error' },
  { value: 'completed', label: 'Completed', color: 'info' },
  { value: 'cancelled', label: 'Cancelled', color: 'default' }
];

export default function DisposalForm({ 
  onSubmit, 
  defaultValues, 
  title = "Create Disposal",
  mode = 'create'
}: DisposalFormProps) {
  const [assets, setAssets] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [disposalManagers, setDisposalManagers] = useState<any[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [isFetchingManagers, setIsFetchingManagers] = useState(false);

  // Refs to track previous values and prevent infinite loops
  const prevAssetIdRef = useRef("");
  const prevAssetLocationRef = useRef("");
  const prevManagersRef = useRef([]);

  // Auth context for role-based access control
  const { user, token, getUserLocations } = useAuth();

  // Check if user is admin or disposal manager
  const isDisposalManager = user?.role === 'disposal_manager' || (user?.permissions && (Array.isArray(user.permissions) ? user.permissions.includes('disposal') : false));
  const isAdminOrDisposalManager = user?.role === 'admin' || isDisposalManager;

  // Get user's assigned locations for display
  const userLocations = getUserLocations();
  const isLocationRestricted = isDisposalManager && userLocations.length > 0;

  // Memoize default values to prevent unnecessary re-renders
  const defaultFormValues = React.useMemo(() => {
    // Create safe default values that handle null/undefined
    const safeDefaultValues = defaultValues ? {
      asset_id: defaultValues.asset_id || '',
      asset_name: defaultValues.asset_name || '',
      custom_asset_name: defaultValues.custom_asset_name || '',
      disposal_type: defaultValues.disposal_type || 'sale' as const,
      disposal_date: defaultValues.disposal_date || new Date().toISOString().split('T')[0],
      disposal_value: defaultValues.disposal_value || 0,
      disposal_cost: defaultValues.disposal_cost || 0,
      disposal_reason: defaultValues.disposal_reason || '',
      disposal_method: defaultValues.disposal_method || '',
      buyer_recipient: defaultValues.buyer_recipient || '',
      disposal_location: defaultValues.disposal_location || '',
      authorized_by: defaultValues.authorized_by || '',
      custom_authorized_by: defaultValues.custom_authorized_by || '',
      notes: defaultValues.notes || '',
      environmental_impact: defaultValues.environmental_impact || '',
      compliance_status: defaultValues.compliance_status || 'pending_review' as const,
      status: defaultValues.status || 'pending' as const,
    } : {};

    return {
      asset_id: '',
      asset_name: '',
      custom_asset_name: '',
      disposal_type: 'sale' as const,
      disposal_date: new Date().toISOString().split('T')[0],
      disposal_value: 0,
      disposal_cost: 0,
      disposal_reason: '',
      disposal_method: '',
      buyer_recipient: '',
      disposal_location: '',
      authorized_by: '',
      custom_authorized_by: '',
      notes: '',
      environmental_impact: '',
      compliance_status: 'pending_review' as const,
      status: 'pending' as const,
      ...safeDefaultValues
    };
  }, [defaultValues]);

  // Only initialize form when we have proper default values
  const formInitialized = React.useMemo(() => {
    return Object.values(defaultFormValues).every(value => 
      value !== undefined && value !== null
    );
  }, [defaultFormValues]);

  const { handleSubmit, control, watch, setValue, formState: { errors } } = useForm<DisposalFormInputs>({ 
    defaultValues: defaultFormValues,
    mode: 'onChange'
  });

  // Watch form values - must be called before any useEffect hooks
  const disposalType = watch("disposal_type");
  const assetId = watch("asset_id");
  const authorizedBy = watch("authorized_by");
  const disposalValue = watch("disposal_value") || 0;
  const disposalCost = watch("disposal_cost") || 0;
  const netProceeds = disposalValue - disposalCost;

  useEffect(() => {
    async function fetchAssets() {
      setLoadingAssets(true);
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        // Fetch assets with proper authentication (FastAPI will handle location filtering)
        const assetsRes = await fetch(`${API_BASE_URL}/assets`, {
          headers: headers
        });
        
        if (assetsRes.ok) {
          const data = await assetsRes.json();
          console.log('Fetched assets for disposal:', data.map((a: any) => ({ id: a.id, name: a.name, location: a.location })));
        setAssets(data);
        } else {
          console.error('Failed to fetch assets for disposal');
          setAssets([]);
        }
      } catch (e) {
        console.error('Error fetching assets for disposal:', e);
        setAssets([]);
      }
      setLoadingAssets(false);
    }
    fetchAssets();
  }, [token]);

  // Function to fetch disposal managers for a specific location
  const fetchDisposalManagersForLocation = useCallback(async (location: string) => {
    console.log('🚀 Starting fetchDisposalManagersForLocation for:', location);
    setIsFetchingManagers(true);
    setLoadingManagers(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      // Build URL for fetching disposal managers
      let managersUrl = `${API_BASE_URL}/users?role=manager`;
      if (isDisposalManager) {
        if (userLocations.length > 0) {
          // For disposal managers, only fetch managers from their assigned locations
          const primaryLocation = userLocations[0];
          managersUrl += `&location=${encodeURIComponent(primaryLocation)}`;
        }
      } else {
        // For admins, fetch managers for the specific asset location
        managersUrl += `&location=${encodeURIComponent(location)}`;
      }

      console.log('🌐 Fetching disposal managers from URL:', managersUrl);

      const managersRes = await fetch(managersUrl, {
        headers: headers
      });
      
      console.log('📡 Response status:', managersRes.status);
      
      if (managersRes.ok) {
        const locationManagers = await managersRes.json();
        console.log('📦 Fetched managers for location:', locationManagers);
        
        // Filter to only include users with disposal permission
        const disposalManagers = locationManagers.filter((user: any) => {
          if (user.permissions) {
            let permissions = user.permissions || [];
            return permissions.includes('disposal') || permissions.includes('all');
          }
          return false;
        });
        
        console.log('🔨 Filtered disposal managers:', disposalManagers);
        setDisposalManagers(disposalManagers);
        
        // Auto-select the first disposal manager if available
        if (disposalManagers.length > 0) {
          console.log('🎯 Auto-selecting first disposal manager:', disposalManagers[0].first_name, disposalManagers[0].last_name);
          setValue("authorized_by", `${disposalManagers[0].first_name} ${disposalManagers[0].last_name}`);
        }
      } else {
        console.error('❌ Failed to fetch disposal managers:', managersRes.status, managersRes.statusText);
        setDisposalManagers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching disposal managers:', error);
      setDisposalManagers([]);
    } finally {
      setLoadingManagers(false);
      setIsFetchingManagers(false);
    }
  }, [token, isDisposalManager, userLocations, setValue]);

  const getTypeIcon = (type: string) => {
    const typeInfo = disposalTypes.find(t => t.value === type);
    return typeInfo?.icon || <Recycling />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sale': return 'success';
      case 'donation': return 'primary';
      case 'destruction': return 'error';
      case 'recycling': return 'info';
      case 'trade_in': return 'secondary';
      case 'scrap': return 'warning';
      default: return 'default';
    }
  };

  const handleAssetChange = (assetId: number | string) => {
    if (typeof assetId === 'number') {
      const asset = assets.find(a => a.id === assetId);
      if (asset) {
        setValue("asset_name", asset.name);
        // Auto-select disposal manager based on asset location
        if (asset.location) {
          console.log('📍 Asset location changed to:', asset.location);
          fetchDisposalManagersForLocation(asset.location);
        }
      }
    } else {
      setValue("asset_name", "");
      setValue("authorized_by", "");
    }
  };

  // Watch for asset changes and auto-select disposal manager
  useEffect(() => {
    if (assetId && assetId !== prevAssetIdRef.current && assets.length > 0) {
      prevAssetIdRef.current = String(assetId);
      const asset = assets.find(a => a.id === assetId);
      if (asset && asset.location && asset.location !== prevAssetLocationRef.current) {
        prevAssetLocationRef.current = asset.location;
        console.log('🔄 Asset location changed, fetching disposal managers for:', asset.location);
        fetchDisposalManagersForLocation(asset.location);
      }
    }
  }, [assetId, assets, fetchDisposalManagersForLocation]);

  const formatCurrency = (value: number) => {
    return `₦${value.toLocaleString('en-NG')}`;
  };

  const mockDisposalMethods = [
    "Private sale",
    "Public auction",
    "Trade-in with dealer",
    "Electronic waste recycling",
    "Secure destruction",
    "Charitable donation",
    "Metal scrap",
    "Landfill disposal",
    "Professional disposal service"
  ];

  const mockLocations = [
    "Company premises",
    "Buyer's location",
    "Recycling center",
    "Secure facility",
    "Landfill site",
    "Donation center",
    "Scrap yard",
    "Auction house"
  ];

  const mockAuthorizedBy = [
    "John Manager",
    "Sarah Director",
    "Mike Supervisor",
    "Lisa HR",
    "David Tech",
    "Finance Department",
    "Asset Manager"
  ];

  const mockEnvironmentalImpacts = [
    "Positive - Properly recycled",
    "Positive - Extends useful life",
    "Neutral - Standard disposal",
    "Negative - Metal waste",
    "Controlled - Secure disposal",
    "Minimal - Landfill",
    "Positive - Donation to community"
  ];

  // Conditional return after all hooks have been called
  if (loadingAssets) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading assets...</Typography>
      </Box>
    );
  }

  // Ensure form is properly initialized before rendering
  if (!formInitialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Initializing form...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {getTypeIcon(disposalType)}
        {title}
      </Typography>

      {mode === 'create' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Create a new disposal record for asset retirement. Fill in the details below to document the disposal process.
        </Alert>
      )}

      {/* Location-based access alert */}
      {isLocationRestricted && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Location-Based Access:</strong> You can only view and create disposals for assets in your assigned locations: 
            <strong> {userLocations.join(', ')}</strong>
          </Typography>
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
              {/* Asset Selection */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="asset_id"
                  control={control}
                  rules={{ required: "Asset selection is required" }}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl fullWidth error={!!error}>
                      <InputLabel>Select Asset</InputLabel>
                      <Select
                        {...field}
                        value={field.value || ''}
                        label="Select Asset"
                        onChange={(e) => {
                          field.onChange(e);
                          handleAssetChange(e.target.value as number | string);
                        }}
                        disabled={loadingAssets}
                      >
                        <MenuItem value="custom">+ Add Custom Asset</MenuItem>
                        {assets.map((asset) => (
                          <MenuItem key={asset.id} value={asset.id}>
                            <Box>
                              <Typography variant="body2">{asset.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {asset.category}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {error && (
                        <Typography variant="caption" color="error">
                          {error.message}
                        </Typography>
                      )}
                      {isLocationRestricted && assets.length === 0 && !loadingAssets && (
                        <Typography variant="caption" color="text.secondary">
                          No assets found in your assigned locations. Contact an administrator if you need access to additional locations.
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
                
                {/* Custom Asset Name */}
                <Controller
                  name="custom_asset_name"
                  control={control}
                  rules={{ required: assetId === "custom" ? "Custom asset name is required" : false }}
                  render={({ field, fieldState: { error } }) => (
                    assetId === "custom" ? (
                      <TextField
                        {...field}
                        label="Custom Asset Name"
                        fullWidth
                        error={!!error}
                        helperText={error?.message}
                        placeholder="Enter custom asset name"
                        sx={{ mt: 2 }}
                      />
                    ) : null
                  )}
                />
              </Grid>

              {/* Disposal Type */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="disposal_type"
                  control={control}
                  rules={{ required: "Disposal type is required" }}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl fullWidth error={!!error}>
                      <InputLabel>Disposal Type</InputLabel>
                      <Select {...field} value={field.value || ''} label="Disposal Type">
                        {disposalTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {type.icon}
                              {type.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {error && (
                        <Typography variant="caption" color="error">
                          {error.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ width: '100%', my: 3 }} />

            {/* Disposal Details */}
            <Typography variant="h6" gutterBottom>
              Disposal Details
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="disposal_date"
                  control={control}
                  rules={{ required: "Disposal date is required" }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="Disposal Date"
                      type="date"
                      fullWidth
                      error={!!error}
                      helperText={error?.message}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="disposal_method"
                  control={control}
                  rules={{ required: "Disposal method is required" }}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl fullWidth error={!!error}>
                      <InputLabel>Disposal Method</InputLabel>
                      <Select {...field} value={field.value || ''} label="Disposal Method">
                        {mockDisposalMethods.map((method) => (
                          <MenuItem key={method} value={method}>
                            {method}
                          </MenuItem>
                        ))}
                      </Select>
                      {error && (
                        <Typography variant="caption" color="error">
                          {error.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="status"
                  control={control}
                  rules={{ required: "Status is required" }}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl fullWidth error={!!error}>
                      <InputLabel>Status</InputLabel>
                      <Select {...field} value={field.value || ''} label="Status">
                        {disposalStatuses.map((status) => (
                          <MenuItem key={status.value} value={status.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: `${status.color}.main`,
                                  flexShrink: 0
                                }}
                              />
                              {status.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {error && (
                        <Typography variant="caption" color="error">
                          {error.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="disposal_reason"
                  control={control}
                  rules={{ required: "Disposal reason is required" }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="Disposal Reason"
                      multiline
                      rows={3}
                      fullWidth
                      error={!!error}
                      helperText={error?.message}
                      placeholder="Explain why this asset is being disposed..."
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ width: '100%', my: 3 }} />

            {/* Financial Information */}
            <Typography variant="h6" gutterBottom>
              Financial Information
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Controller
                  name="disposal_value"
                  control={control}
                  rules={{ 
                    required: "Disposal value is required",
                    min: { value: 0, message: "Value must be positive" }
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="Disposal Value (₦)"
                      type="number"
                      fullWidth
                      error={!!error}
                      helperText={error?.message}
                      InputProps={{
                        startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₦</Typography>
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="disposal_cost"
                  control={control}
                  rules={{ 
                    required: "Disposal cost is required",
                    min: { value: 0, message: "Cost must be positive" }
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="Disposal Cost (₦)"
                      type="number"
                      fullWidth
                      error={!!error}
                      helperText={error?.message}
                      InputProps={{
                        startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₦</Typography>
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Net Proceeds (₦)"
                  value={formatCurrency(netProceeds)}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₦</Typography>
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      color: netProceeds >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 'bold'
                    }
                  }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ width: '100%', my: 3 }} />

            {/* Additional Information */}
            <Typography variant="h6" gutterBottom>
              Additional Information
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="buyer_recipient"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="Buyer/Recipient"
                      fullWidth
                      error={!!error}
                      helperText={error?.message}
                      placeholder="Name of buyer, recipient, or disposal service"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="disposal_location"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl fullWidth error={!!error}>
                      <InputLabel>Disposal Location</InputLabel>
                      <Select {...field} value={field.value || ''} label="Disposal Location">
                        {mockLocations.map((location) => (
                          <MenuItem key={location} value={location}>
                            {location}
                          </MenuItem>
                        ))}
                      </Select>
                      {error && (
                        <Typography variant="caption" color="error">
                          {error.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="authorized_by"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl fullWidth error={!!error}>
                      <InputLabel>Authorized By (Disposal Manager)</InputLabel>
                      <Select {...field} label="Authorized By (Disposal Manager)" disabled={loadingManagers}>
                        <MenuItem value="custom">+ Add Custom Authorizer</MenuItem>
                        {disposalManagers.map((manager) => (
                          <MenuItem key={manager.id} value={`${manager.first_name} ${manager.last_name}`}>
                            {manager.first_name} {manager.last_name} ({manager.username}) - {manager.location || 'No location assigned'}
                          </MenuItem>
                        ))}
                      </Select>
                      {error && (
                        <Typography variant="caption" color="error">
                          {error.message}
                        </Typography>
                      )}
                      {field.value && (
                        <Typography variant="caption" color="text.secondary">
                          Automatically selected based on asset location
                        </Typography>
                      )}
                      {loadingManagers && (
                        <Typography variant="caption" color="text.secondary">
                          Finding disposal manager for selected asset location...
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Custom Authorizer */}
              {authorizedBy === "custom" && (
                <Grid item xs={12} md={6}>
                  <Controller
                    name="custom_authorized_by"
                    control={control}
                    rules={{ required: "Custom authorizer name is required" }}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        label="Custom Authorizer Name"
                        fullWidth
                        error={!!error}
                        helperText={error?.message}
                        placeholder="Enter custom authorizer name"
                      />
                    )}
                  />
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <Controller
                  name="environmental_impact"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl fullWidth error={!!error}>
                      <InputLabel>Environmental Impact</InputLabel>
                      <Select {...field} label="Environmental Impact">
                        {mockEnvironmentalImpacts.map((impact) => (
                          <MenuItem key={impact} value={impact}>
                            {impact}
                          </MenuItem>
                        ))}
                      </Select>
                      {error && (
                        <Typography variant="caption" color="error">
                          {error.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="compliance_status"
                  control={control}
                  rules={{ required: "Compliance status is required" }}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl fullWidth error={!!error}>
                      <InputLabel>Compliance Status</InputLabel>
                      <Select {...field} label="Compliance Status">
                        <MenuItem value="compliant">Compliant</MenuItem>
                        <MenuItem value="non_compliant">Non-Compliant</MenuItem>
                        <MenuItem value="pending_review">Pending Review</MenuItem>
                      </Select>
                      {error && (
                        <Typography variant="caption" color="error">
                          {error.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
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
                      placeholder="Any additional notes or special conditions..."
                    />
                  )}
                />
              </Grid>
            </Grid>

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
              >
                {mode === 'create' ? 'Create Disposal' : 'Update Disposal'}
              </Button>
            </Box>
          </Box>
    </Box>
  );
} 