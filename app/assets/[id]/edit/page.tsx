"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Paper, Button, Typography, Alert } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MainNav from "@/components/MainNav";
import AssetForm, { AssetFormInputs } from "@/components/AssetForm";
import { getAsset, updateAsset } from "@/app/api/assets";
import type { Asset } from "@/types/asset";
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

// Mock data - replace with API call
const mockAsset = {
  id: 1,
  name: "Laptop",
  description: "High-performance laptop for development",
  category: "Electronics",
  location: "HQ",
  status: "Active",
  purchase_date: "2024-01-15",
  purchase_cost: 1200,
  serial_number: "LAP001",
};

export default function AssetEditPage() {
  const params = useParams();
  const router = useRouter();
  const { canManageAssets, canAccessAssetLocation, isMaintenanceManager } = useAuth();
  const assetId = Number(params.id);
  const [asset, setAsset] = React.useState<Asset | null>(null);

  // Check if user can manage assets
  if (!canManageAssets()) {
    return (
      <ProtectedRoute>
        <MainNav />
        <Box p={3}>
          <Alert severity="error">
            You don't have permission to edit assets. Only asset managers and maintenance managers with appropriate permissions can edit assets.
          </Alert>
        </Box>
      </ProtectedRoute>
    );
  }

  React.useEffect(() => {
    async function fetchAsset() {
      const data = await getAsset(assetId);
      setAsset(data);
    }
    if (assetId) fetchAsset();
  }, [assetId]);

  // Check if user has access to this asset's location
  if (asset && !canAccessAssetLocation(asset.location)) {
    return (
      <ProtectedRoute>
        <MainNav />
        <Box p={3}>
          <Alert severity="error">
            You don't have permission to edit assets from this location. You can only edit assets from your assigned location(s).
          </Alert>
        </Box>
      </ProtectedRoute>
    );
  }

  const handleSubmit = async (data: AssetFormInputs) => {
    try {
      await updateAsset(assetId.toString(), data);
      router.push(`/assets/${assetId}`);
    } catch (e) {
      alert("Failed to update asset");
    }
  };

  const handleCancel = () => {
    router.push(`/assets/${assetId}`);
  };

  const handleBack = () => {
    router.push("/assets");
  };

  if (!asset) return <div>Loading...</div>;
  return (
    <ProtectedRoute>
      <MainNav />
      <Box p={3} display="flex" justifyContent="center">
        <Paper sx={{ p: 3, minWidth: 400, width: "100%", maxWidth: 600 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center">
              <Button 
                startIcon={<ArrowBackIcon />} 
                onClick={handleBack}
                sx={{ mr: 2 }}
              >
                Back to Assets
              </Button>
              <Typography variant="h5">Edit Asset</Typography>
            </Box>
            <Button variant="outlined" onClick={handleCancel}>
              Cancel
            </Button>
          </Box>
          <AssetForm 
            onSubmit={handleSubmit} 
            title="Edit Asset"
            defaultValues={asset as any}
          />
        </Paper>
      </Box>
    </ProtectedRoute>
  );
} 