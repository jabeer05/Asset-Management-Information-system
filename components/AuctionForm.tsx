"use client";
import React, { useState, useEffect, useRef } from 'react';
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
import {
  Gavel,
  Timer,
  AttachMoney,
  Save,
  Cancel
} from '@mui/icons-material';
import { getAssets } from '../app/api/assets';
import { useAuth } from '../contexts/AuthContext';

interface AuctionFormInputs {
  asset_id: number | string;
  asset_name: string;
  custom_asset_name: string;
  auction_type: 'public' | 'private' | 'online' | 'live';
  start_date: string;
  end_date: string;
  reserve_price: number;
  starting_bid: number;
  final_bid: string | number;
  winner: string;
  description: string;
  location: string;
  custom_location: string;
  auctioneer: string;
  custom_auctioneer: string;
  notes: string;
}

interface AuctionFormProps {
  onSubmit: (data: AuctionFormInputs) => void;
  defaultValues?: Partial<AuctionFormInputs>;
  title?: string;
  mode?: 'create' | 'edit';
}

const auctionTypes = [
  { value: 'public', label: 'Public Auction', icon: <Gavel /> },
  { value: 'private', label: 'Private Auction', icon: <Gavel /> },
  { value: 'online', label: 'Online Auction', icon: <Gavel /> },
  { value: 'live', label: 'Live Auction', icon: <Gavel /> }
];

const mockLocations = [
  "Online Auction",
  "Auction House, Lagos",
  "Public Auction Center",
  "Private Collection",
  "Corporate Office",
  "Warehouse Facility",
  "Exhibition Center",
  "Gusau Secretariat - Main Building"
];

const mockAuctioneers = [
  "Tech Auctions Ltd",
  "Auto Auctions Nigeria",
  "Office Equipment Auctions",
  "Furniture Auctions",
  "Asset Disposal Services",
  "Professional Auctioneers"
];

export default function AuctionForm({ 
  onSubmit, 
  defaultValues, 
  title = "Create Auction",
  mode = 'create'
}: AuctionFormProps) {
  const { handleSubmit, control, watch, setValue, formState: { errors } } = useForm<AuctionFormInputs>({ 
    defaultValues: {
      asset_id: '', // Ensure controlled from the start
      asset_name: '', // Add default asset name
      custom_asset_name: '', // Add default custom asset name
      auction_type: 'public', // Add default auction type
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reserve_price: 0,
      starting_bid: 0,
      final_bid: '', // Change from undefined to empty string
      winner: '', // Add default winner
      location: '', // Add default location
      custom_location: '', // Add default custom location
      auctioneer: '', // Add default auctioneer
      custom_auctioneer: '', // Add default custom auctioneer
      description: '', // Add default description
      notes: '', // Add default notes
      ...defaultValues
    }
  });

  const [assets, setAssets] = React.useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = React.useState(true);



  // Auth context for role-based access control
  const { user, token, isAuctionManager, getUserLocations } = useAuth();

  // Check if user is admin or auction manager
  const isAdminOrAuctionManager = user?.role === 'admin' || isAuctionManager();

  // Get user's assigned locations for display
  const userLocations = getUserLocations();
  const isLocationRestricted = isAuctionManager() && userLocations.length > 0;

  const assetId = watch("asset_id");
  const selectedAsset = assets.find(a => a.id === assetId);

  React.useEffect(() => {
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
        // Only include assets with id, name, and category
        const filtered = (data || []).filter((a: any) => a.id && a.name && a.category);
          console.log('Fetched assets for auction:', filtered.map((a: any) => ({ id: a.id, name: a.name, location: a.location })));
        setAssets(filtered);
        } else {
          console.error('Failed to fetch assets for auction');
          setAssets([]);
        }
      } catch (e) {
        console.error('Error fetching assets for auction:', e);
        setAssets([]);
      }
      setLoadingAssets(false);
    }
    fetchAssets();
  }, [token]);





  const auctionType = watch("auction_type");
  const auctioneer = watch("auctioneer");
  const location = watch("location");

  const getTypeIcon = (type: string) => {
    const typeInfo = auctionTypes.find(t => t.value === type);
    return typeInfo?.icon || <Gavel />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'public': return 'primary';
      case 'private': return 'secondary';
      case 'online': return 'info';
      case 'live': return 'success';
      default: return 'default';
    }
  };

  const handleAssetChange = (assetId: number | string) => {
    if (typeof assetId === 'number') {
      const asset = assets.find(a => a.id === assetId);
      if (asset) {
        setValue("asset_name", asset.name);
        // Set location if available
        if (asset.location) {
          setValue("location", asset.location);
        }
      }
    } else {
      setValue("asset_name", "");
      setValue("auctioneer", "");
    }
  };



  const formatCurrency = (value: number) => {
    return `₦${value.toLocaleString('en-NG')}`;
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {getTypeIcon(auctionType)}
        {title}
      </Typography>

      {mode === 'create' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Create a new auction for asset disposal. Fill in the details below to set up the auction.
        </Alert>
      )}

      {/* Location-based access alert */}
      {isLocationRestricted && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Location-Based Access:</strong> You can only view and create auctions for assets in your assigned locations: 
            <strong> {userLocations.join(', ')}</strong>
          </Typography>
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit((data) => {
        console.log('Form submitted with data:', data);
        onSubmit(data);
      })}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  {/* Asset Selection */}
                  <Box>
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
                                  <Typography variant="body2" fontWeight={600}>{asset.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Category: {asset.category} | Serial: {asset.serial_number || 'N/A'} | Location: {asset.location || 'N/A'} | Status: {asset.status || 'N/A'}
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
                    {assetId === "custom" && (
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

                    {/* Asset Summary Card */}
                    {assetId !== "custom" && selectedAsset && (
                      <Card sx={{ mt: 2, background: '#f9f9f9', borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Asset Details</Typography>
                          <Typography variant="body2"><b>Name:</b> {selectedAsset.name}</Typography>
                          <Typography variant="body2"><b>Category:</b> {selectedAsset.category}</Typography>
                          <Typography variant="body2"><b>Serial Number:</b> {selectedAsset.serial_number || 'N/A'}</Typography>
                          <Typography variant="body2"><b>Location:</b> {selectedAsset.location || 'N/A'}</Typography>
                          <Typography variant="body2"><b>Status:</b> {selectedAsset.status || 'N/A'}</Typography>
                          <Typography variant="body2"><b>Description:</b> {selectedAsset.description || 'N/A'}</Typography>
                        </CardContent>
                      </Card>
                    )}
                  </Box>

                  {/* Auction Type */}
                  <Box>
                    <Controller
                      name="auction_type"
                      control={control}
                      rules={{ required: "Auction type is required" }}
                      render={({ field, fieldState: { error } }) => (
                        <FormControl fullWidth error={!!error}>
                          <InputLabel>Auction Type</InputLabel>
                          <Select {...field} label="Auction Type" value={field.value || 'public'}>
                            {auctionTypes.map((type) => (
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
                  </Box>
                </Box>

                <Divider sx={{ width: '100%', my: 3 }} />

                {/* Auction Schedule */}
                <Typography variant="h6" gutterBottom>
                  Auction Schedule
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                  <Controller
                    name="start_date"
                    control={control}
                    rules={{ required: "Start date is required" }}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        label="Start Date"
                        type="date"
                        fullWidth
                        error={!!error}
                        helperText={error?.message}
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />

                  <Controller
                    name="end_date"
                    control={control}
                    rules={{ required: "End date is required" }}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        label="End Date"
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

                {/* Pricing Information */}
                <Typography variant="h6" gutterBottom>
                  Pricing Information
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                  <Controller
                    name="reserve_price"
                    control={control}
                    rules={{ 
                      required: "Reserve price is required",
                      min: { value: 0, message: "Reserve price must be positive" }
                    }}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        label="Reserve Price (₦)"
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

                  <Controller
                    name="starting_bid"
                    control={control}
                    rules={{ 
                      required: "Starting bid is required",
                      min: { value: 0, message: "Starting bid must be positive" }
                    }}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        label="Starting Bid (₦)"
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

                  <Controller
                    name="final_bid"
                    control={control}
                    rules={{ 
                      validate: (value) => {
                        if (value === '' || value === 0) return true; // Allow empty
                        const numValue = Number(value);
                        return numValue >= 0 || "Final bid must be positive";
                      }
                    }}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        label="Final Bid (₦) - Optional"
                        type="number"
                        fullWidth
                        error={!!error}
                        helperText={error?.message || "Leave empty if auction hasn't ended"}
                        InputProps={{
                          startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₦</Typography>
                        }}
                        value={field.value || ''}
                      />
                    )}
                  />

                  <Controller
                    name="winner"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        label="Winner - Optional"
                        fullWidth
                        error={!!error}
                        helperText={error?.message || "Enter winner name if auction has ended"}
                        placeholder="Enter winner name"
                      />
                    )}
                  />
                </Box>

                <Divider sx={{ width: '100%', my: 3 }} />

                {/* Auction Details */}
                <Typography variant="h6" gutterBottom>
                  Auction Details
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                  <Controller
                    name="location"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <FormControl fullWidth error={!!error}>
                        <InputLabel>Auction Location</InputLabel>
                        <Select {...field} label="Auction Location" value={field.value || ''}>
                          <MenuItem value="custom">+ Add Custom Location</MenuItem>
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
                  {location === "custom" && (
                    <Controller
                      name="custom_location"
                      control={control}
                      rules={{ required: "Custom location is required" }}
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          {...field}
                          label="Custom Location"
                          fullWidth
                          error={!!error}
                          helperText={error?.message}
                          placeholder="Enter custom auction location"
                          sx={{ mb: 3 }}
                          onChange={e => {
                            field.onChange(e);
                            setValue("location", e.target.value); // Set location to custom value
                          }}
                        />
                      )}
                    />
                  )}

                  <Controller
                    name="auctioneer"
                    control={control}
                    rules={{ required: "Auctioneer is required" }}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        label="Auctioneer"
                        fullWidth
                        error={!!error}
                        helperText={error?.message || "Enter the name of the auctioneer or auction manager"}
                        placeholder="Enter auctioneer name"
                        sx={{ mb: 3 }}
                      />
                    )}
                  />
                </Box>



                {/* Description */}
                <Box sx={{ mb: 3 }}>
                  <Controller
                    name="description"
                    control={control}
                    rules={{ required: "Description is required" }}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        label="Auction Description"
                        multiline
                        rows={3}
                        fullWidth
                        error={!!error}
                        helperText={error?.message}
                        placeholder="Describe the asset being auctioned..."
                      />
                    )}
                  />
                </Box>

                {/* Notes */}
                <Box sx={{ mb: 3 }}>
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
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
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
                    {mode === 'create' ? 'Create Auction' : 'Update Auction'}
                  </Button>
                </Box>
              </Box>
    </Box>
  );
} 