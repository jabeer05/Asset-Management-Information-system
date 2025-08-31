"use client";
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Alert,
  Paper,
  Chip,
  Box,
  FormControl,
  InputLabel,
  FormHelperText
} from '@mui/material';
import {
  LocationOn,
  Security, 
  Info,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { getAssets } from '../app/api/assets';
import { getLocations, type Location as LocationType } from '../app/api/locations';
import { useAuth } from '../contexts/AuthContext';
import type { Asset } from '../types/asset';

interface TransferFormInputs {
  asset_id: number | string;
  asset_name: string;
  transfer_type: 'internal' | 'external' | 'temporary' | 'permanent';
  from_location: string;
  to_location: string;
  reason: string;
}

interface TransferFormProps {
  onSubmit: (data: TransferFormInputs) => void;
  defaultValues?: Partial<TransferFormInputs>;
  title?: string;
  mode?: 'create' | 'edit';
}

export default function TransferForm({ 
  onSubmit, 
  defaultValues, 
  title = "Request Transfer",
  mode = 'create'
}: TransferFormProps) {
  const { user, isMaintenanceManager, getUserLocations, canAccessAssetLocation } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accessInfo, setAccessInfo] = useState<{
    userLocations: string[];
    accessibleAssets: number;
    totalAssets: number;
  } | null>(null);

  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<TransferFormInputs>({
    defaultValues: {
      transfer_type: 'internal',
      from_location: '', // Set user's location as default
      ...defaultValues
    }
  });

  const selectedAssetId = watch("asset_id");
  const selectedAsset = assets.find(asset => asset.id === selectedAssetId);

  // Update from_location when asset is selected
  useEffect(() => {
    if (selectedAsset?.location) {
      setValue("from_location", selectedAsset.location);
    }
  }, [selectedAsset, setValue]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch assets and locations in parallel
        const [assetsData, locationsData] = await Promise.all([
          getAssets(),
          getLocations()
        ]);
        
        setAssets(assetsData);
        setLocations(locationsData);
        
        // Calculate access information
        const userLocations = getUserLocations();
        const accessibleAssets = assetsData.filter(asset => 
          canAccessAssetLocation(asset.location || '')
        ).length;
        
        setAccessInfo({
          userLocations,
          accessibleAssets,
          totalAssets: assetsData.length
        });
        
        console.log('TransferForm - User locations:', userLocations);
        console.log('TransferForm - Accessible assets:', accessibleAssets, 'of', assetsData.length);
        console.log('TransferForm - Available locations:', locationsData.length);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [getUserLocations, canAccessAssetLocation]);

  // Filter assets based on user's location access
  const accessibleAssets = assets.filter(asset => 
    canAccessAssetLocation(asset.location || '')
  );

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert severity="error" icon={<Warning />}>
          <Typography variant="body1" fontWeight="medium">
            Error Loading Data
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>

      {/* Access Information Alert */}
      {accessInfo && (
        <Alert 
          severity="info" 
          icon={<Security />}
          style={{ marginBottom: '24px' }}
        >
          <Box>
            <Typography variant="body1" fontWeight="medium" gutterBottom>
              {user?.role === 'admin' ? 'Administrative Access' : 
               user?.role === 'manager' ? 'Manager Access' : 
               'Location-Based Access Control'}
            </Typography>
            {user?.role === 'admin' ? (
              <Typography variant="body2">
                As an administrator, you have access to all assets and locations in the system. 
                You can transfer assets between any locations.
              </Typography>
            ) : user?.role === 'manager' ? (
              <Typography variant="body2">
                As a manager, you have broad access to assets and can oversee transfers 
                within your assigned areas of responsibility.
              </Typography>
            ) : (
              <>
                <Typography variant="body2" gutterBottom component="div">
                  You have access to assets in {accessInfo.userLocations.length} location(s): 
                  {accessInfo.userLocations.map((location, index) => (
                    <Chip 
                      key={index}
                      label={location} 
                      size="small" 
                      icon={<LocationOn />}
                      style={{ margin: '0 4px 4px 0' }}
                    />
                  ))}
                </Typography>
                <Typography variant="body2">
                  Showing {accessInfo.accessibleAssets} of {accessInfo.totalAssets} total assets.
                </Typography>
              </>
            )}
          </Box>
        </Alert>
      )}

      {/* User Location Alert - Removed as location is not available in User type */}

      {/* Maintenance Manager Specific Alert */}
      {isMaintenanceManager() && (
        <Alert 
          severity="warning" 
          icon={<Info />}
          style={{ marginBottom: '24px' }}
        >
          <Typography variant="body1" fontWeight="medium" gutterBottom>
            Maintenance Manager Access
          </Typography>
          <Typography variant="body2">
            As a maintenance manager, you can only transfer assets from your assigned locations. 
            This ensures proper asset management and accountability.
          </Typography>
        </Alert>
      )}

      {mode === 'create' && (
        <Alert severity="info" icon={<Info />} style={{ marginBottom: '24px' }}>
          <Typography variant="body1" fontWeight="medium" gutterBottom>
            Request Asset Transfer
          </Typography>
          <Typography variant="body2">
            Fill in the details below to create a transfer request. Only assets from your assigned locations will be available for selection.
          </Typography>
        </Alert>
      )}

      {loading && (
        <Alert severity="info" icon={<Info />} style={{ marginBottom: '24px' }}>
          <Typography variant="body1" fontWeight="medium">
            Loading Data
          </Typography>
          <Typography variant="body2">
            Fetching available assets and locations...
          </Typography>
        </Alert>
      )}

      {/* No Access Alert */}
      {!loading && accessibleAssets.length === 0 && (
        <Alert severity="warning" icon={<Warning />} style={{ marginBottom: '24px' }}>
          <Typography variant="body1" fontWeight="medium" gutterBottom>
            No Assets Available
                                    </Typography>
          <Typography variant="body2">
            You don't have access to any assets in your assigned locations. Please contact your administrator to update your location permissions.
                                    </Typography>
        </Alert>
      )}

      {/* Selected Asset Information */}
                  {selectedAsset && (
        <Alert severity="success" icon={<CheckCircle />} style={{ marginBottom: '24px' }}>
          <Typography variant="body1" fontWeight="medium" gutterBottom>
                          Selected Asset Details
                        </Typography>
          <Box>
            <Typography variant="body2" gutterBottom>
              <strong>Name:</strong> {selectedAsset.name}
                              </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Location:</strong> {selectedAsset.location || 'Not specified'}
                                </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Category:</strong> {selectedAsset.category || 'Not specified'}
                                </Typography>
                        {selectedAsset.description && (
              <Typography variant="body2">
                              <strong>Description:</strong> {selectedAsset.description}
                            </Typography>
            )}
                          </Box>
        </Alert>
                  )}

      <Paper style={{ padding: '24px' }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Transfer Type */}
            <div>
              <Controller
                name="transfer_type"
                control={control}
                rules={{ required: "Transfer type is required" }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.transfer_type} style={{ marginBottom: '16px' }}>
                    <InputLabel 
                      style={{ 
                        backgroundColor: 'white', 
                        padding: '0 4px',
                        fontSize: '14px',
                        color: errors.transfer_type ? '#d32f2f' : '#666'
                      }}
                    >
                      Transfer Type
                    </InputLabel>
                    <select
                      {...field}
                      style={{
                        width: '100%',
                        padding: '16.5px 14px',
                        border: errors.transfer_type ? '1px solid #d32f2f' : '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '16px',
                        backgroundColor: 'white',
                        outline: 'none',
                        marginTop: '8px'
                      }}
                    >
                      <option value="">Select transfer type</option>
                      <option value="internal">Internal Transfer</option>
                      <option value="external">External Transfer</option>
                      <option value="temporary">Temporary Transfer</option>
                      <option value="permanent">Permanent Transfer</option>
                    </select>
                    {errors.transfer_type && (
                      <FormHelperText style={{ marginTop: '4px', fontSize: '12px' }}>
                        {errors.transfer_type.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </div>

            {/* Asset Selection */}
            <div>
              <Controller
                name="asset_id"
                control={control}
                rules={{ required: "Asset selection is required" }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.asset_id} style={{ marginBottom: '16px' }}>
                    <InputLabel 
                      style={{ 
                        backgroundColor: 'white', 
                        padding: '0 4px',
                        fontSize: '14px',
                        color: errors.asset_id ? '#d32f2f' : '#666'
                      }}
                    >
                      Select Asset
                    </InputLabel>
                    <select
                      {...field}
                      disabled={loading || accessibleAssets.length === 0}
                      style={{
                        width: '100%',
                        padding: '16.5px 14px',
                        border: errors.asset_id ? '1px solid #d32f2f' : '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '16px',
                        backgroundColor: loading || accessibleAssets.length === 0 ? '#f5f5f5' : 'white',
                        outline: 'none',
                        cursor: loading || accessibleAssets.length === 0 ? 'not-allowed' : 'pointer',
                        marginTop: '8px'
                      }}
                    >
                      <option value="">Select an asset from your locations</option>
                      {accessibleAssets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name} - {asset.location || 'No Location'}
                        </option>
                      ))}
                    </select>
                    <FormHelperText style={{ marginTop: '4px', fontSize: '12px' }}>
                      {errors.asset_id?.message || `${accessibleAssets.length} assets available in your locations`}
                    </FormHelperText>
                  </FormControl>
                )}
              />
            </div>

            {/* From Location */}
            <div>
              <Controller
                name="from_location"
                control={control}
                rules={{ required: "From location is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="From Location"
                    fullWidth
                    error={!!errors.from_location}
                    helperText={errors.from_location?.message || "Automatically set based on your location or selected asset"}
                    disabled={!!selectedAsset?.location}
                    InputProps={{
                      readOnly: !!selectedAsset?.location,
                    }}
                    style={{ marginBottom: '16px' }}
                  />
                )}
              />
            </div>

            {/* To Location */}
            <div>
              <Controller
                name="to_location"
                control={control}
                rules={{ required: "To location is required" }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.to_location} style={{ marginBottom: '16px' }}>
                    <InputLabel 
                      style={{ 
                        backgroundColor: 'white', 
                        padding: '0 4px',
                        fontSize: '14px',
                        color: errors.to_location ? '#d32f2f' : '#666'
                      }}
                    >
                      To Location
                    </InputLabel>
                    <select
                      {...field}
                      disabled={loading || locations.length === 0}
                      style={{
                        width: '100%',
                        padding: '16.5px 14px',
                        border: errors.to_location ? '1px solid #d32f2f' : '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '16px',
                        backgroundColor: loading || locations.length === 0 ? '#f5f5f5' : 'white',
                        outline: 'none',
                        cursor: loading || locations.length === 0 ? 'not-allowed' : 'pointer',
                        marginTop: '8px'
                      }}
                    >
                      <option value="">Select destination location</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.name}>
                          {location.name}
                          {location.address && ` - ${location.address}`}
                        </option>
                      ))}
                    </select>
                    <FormHelperText style={{ marginTop: '4px', fontSize: '12px' }}>
                      {errors.to_location?.message || `${locations.length} locations available in database`}
                    </FormHelperText>
                  </FormControl>
                )}
              />
            </div>

            {/* Reason */}
            <div style={{ gridColumn: '1 / -1' }}>
              <Controller
                name="reason"
                control={control}
                rules={{ required: "Reason is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Reason for Transfer"
                    multiline
                    rows={3}
                    fullWidth
                    error={!!errors.reason}
                    helperText={errors.reason?.message || "Explain why this transfer is needed"}
                    placeholder="Please provide a detailed reason for this asset transfer..."
                    style={{ marginBottom: '16px' }}
                  />
                )}
              />
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
              color="primary"
              disabled={loading || accessibleAssets.length === 0}
                  >
              Submit Transfer Request
                  </Button>
          </div>
        </form>
      </Paper>
    </div>
  );
} 