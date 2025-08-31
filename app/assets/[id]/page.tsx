"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Typography, Paper, Button, Grid, Chip, Alert } from "@mui/material";
import MainNav from "@/components/MainNav";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssetQRCode from "@/components/AssetQRCode";
import AssetImage from "@/components/AssetImage";
import { getAsset, deleteAsset } from "@/app/api/assets";
import type { Asset } from "@/types/asset";
import ProtectedRoute from '@/components/ProtectedRoute';
import { useNotifications } from '@/contexts/NotificationContext';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
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
  purchase_cost: 850000,
  quantity: 5,
  current_value: 750000,
  serial_number: "LAP001",
  imageUrl: "https://via.placeholder.com/300x200?text=Laptop"
};

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = Number(params.id);
  const [asset, setAsset] = React.useState<Asset | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const { fetchNotifications } = useNotifications();
  const { token, canAccessAssetLocation, canManageAssets } = useAuth();

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
            You don't have permission to view assets from this location. You can only access assets from your assigned location(s).
          </Alert>
        </Box>
      </ProtectedRoute>
    );
  }

  const handleEdit = () => {
    router.push(`/assets/${assetId}/edit`);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this asset?")) {
      try {
        await deleteAsset(assetId);
        router.push("/assets");
      } catch (e) {
        alert("Failed to delete asset");
      }
    }
  };

  const handleSendFeedback = async () => {
    const recipientId = 1; // TODO: Replace with logic to get asset manager/admin user_id
    await fetch('http://localhost:8000/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: JSON.stringify({ user_id: recipientId, message: feedbackMsg })
    });
    setFeedbackOpen(false);
    setFeedbackMsg('');
    fetchNotifications();
  };

  if (!asset) return <div>Loading...</div>;

  return (
    <ProtectedRoute>
      <MainNav />
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center">
            <Button 
              startIcon={<ArrowBackIcon />} 
              onClick={() => router.push("/assets")}
              sx={{ mr: 2 }}
            >
              Back to Assets
            </Button>
            <Typography variant="h4">Asset Details</Typography>
          </Box>
          <Box>
            {canManageAssets() && (
              <>
            <Button variant="outlined" onClick={handleEdit} sx={{ mr: 1 }}>
              Edit
            </Button>
            <Button variant="contained" color="error" onClick={handleDelete}>
              Delete
            </Button>
              </>
            )}
            <Button onClick={() => setFeedbackOpen(true)}>Send Feedback</Button>
          </Box>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Asset Image and QR Code */}
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>Asset Image</Typography>
                <AssetImage 
                  imageUrl={asset.image_url}
                  alt={asset.name}
                  maxWidth={300}
                  maxHeight={200}
                  borderRadius={8}
                />
              </Box>
              
              <AssetQRCode 
                assetId={asset.id ?? 0}
                assetName={asset.name ?? ''}
                serialNumber={asset.serial_number ?? ''}
              />
            </Grid>

            {/* Asset Details */}
            <Grid item xs={12} md={8}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Basic Information</Typography>
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">{asset.name}</Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                    <Typography variant="body1">{asset.description}</Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">Serial Number</Typography>
                    <Typography variant="body1">{asset.serial_number}</Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip 
                      label={asset.status} 
                      color={asset.status === "Active" ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Asset Details</Typography>
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                    <Typography variant="body1">{asset.category}</Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                    <Typography variant="body1">{asset.location}</Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">Purchase Date</Typography>
                    <Typography variant="body1">{asset.purchase_date}</Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">Purchase Cost</Typography>
                    <Typography variant="body1">₦{asset.purchase_cost?.toLocaleString()}</Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">Quantity</Typography>
                    <Typography variant="body1">{asset.quantity} units</Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">Cost Per Unit</Typography>
                    <Typography variant="body1">₦{asset.purchase_cost && asset.quantity ? (asset.purchase_cost / asset.quantity).toFixed(2) : '0'}</Typography>
                  </Box>
                  {/* <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">Current Value</Typography>
                    <Typography variant="body1">₦N/A</Typography>
                  </Box> */}
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Box>
      <Dialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)}>
        <DialogTitle>Send Feedback</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Feedback Message"
            type="text"
            fullWidth
            value={feedbackMsg}
            onChange={e => setFeedbackMsg(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackOpen(false)}>Cancel</Button>
          <Button onClick={handleSendFeedback} disabled={!feedbackMsg.trim()}>Send</Button>
        </DialogActions>
      </Dialog>
    </ProtectedRoute>
  );
} 