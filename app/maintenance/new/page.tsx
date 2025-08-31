"use client";
import React, { useState, useEffect } from "react";
import { Box, Alert, Paper, Container } from "@mui/material";
import MainNav from '@/components/MainNav';
import MaintenanceForm from '@/components/MaintenanceForm';
import { useRouter } from "next/navigation";
import ProtectedRoute from '@/components/ProtectedRoute';

interface Asset {
  id: number;
  name: string;
  category: string;
  location: string;
  description?: string;
}

export default function NewMaintenancePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);

  // Fetch assets for asset name mapping
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${API_BASE_URL}/assets/`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (res.ok) {
          const data = await res.json();
          setAssets(data);
        }
      } catch (error) {
        console.error('Error fetching assets:', error);
      }
    };
    fetchAssets();
  }, []);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      // Prepare the data for the backend
      const payload = { ...data };
      
      // Map frontend fields to backend fields
      payload.maintenance_date = payload.maintenance_date;
      
      // Handle performed_by mapping
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
      
      // Convert empty string dates to null
      ['maintenance_date', 'start_date', 'completion_date', 'next_maintenance_date'].forEach(field => {
        if (payload[field] === "") {
          payload[field] = null;
        }
      });

      console.log("Sending maintenance data:", payload);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch("http://localhost:8000/maintenance/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create maintenance record");
      }

      // Success
      router.push("/maintenance");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create maintenance record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <MainNav />
      <Box p={3}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        <MaintenanceForm 
          onSubmit={handleSubmit}
          title="Schedule New Maintenance"
          mode="create"
        />
      </Box>
    </ProtectedRoute>
  );
} 