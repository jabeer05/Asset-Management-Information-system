"use client";
import React, { useState } from "react";
import { Box, Alert } from "@mui/material";
import MainNav from '@/components/MainNav';
import AssetForm, { AssetFormInputs } from '@/components/AssetForm';
import { useRouter } from "next/navigation";
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function AssetNewPage() {
  const router = useRouter();
  const { canManageAssets } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if user can manage assets
  if (!canManageAssets()) {
    return (
      <ProtectedRoute>
        <MainNav />
        <Box p={3}>
          <Alert severity="error">
            You don't have permission to create assets. Auction and disposal managers can only view assets.
          </Alert>
        </Box>
      </ProtectedRoute>
    );
  }

  const handleSubmit = async (data: AssetFormInputs) => {
    setLoading(true);
    setError(null);
    try {
      // Prepare the data for the backend
      const payload = { ...data };
      
      // Clean up the data before sending
      payload.purchase_cost = typeof data.purchase_cost === 'string' || typeof data.purchase_cost === 'number' 
        ? parseFloat(String(data.purchase_cost ?? '').replace(/,/g, '')) : 0;
      payload.cost_per_unit = typeof data.cost_per_unit === 'string' || typeof data.cost_per_unit === 'number' 
        ? parseFloat(String(data.cost_per_unit ?? '').replace(/,/g, '')) : 0;
      payload.total_cost_with_vat = typeof data.total_cost_with_vat === 'string' || typeof data.total_cost_with_vat === 'number' 
        ? parseFloat(String(data.total_cost_with_vat ?? '').replace(/,/g, '')) : 0;
      payload.vat_amount = typeof data.vat_amount === 'string' || typeof data.vat_amount === 'number' 
        ? parseFloat(String(data.vat_amount ?? '').replace(/,/g, '')) : 0;
      
      // Handle barcode - set to null if empty
      if (payload.barcode && payload.barcode.trim() === '') {
        payload.barcode = null;
      }

      console.log("Sending asset data:", payload);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch("http://localhost:8000/assets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = "Failed to create asset";
        try {
          const text = await response.text();
          console.error("Create asset error:", text);
          const err = JSON.parse(text);
          if (err && err.detail) {
            if (Array.isArray(err.detail)) {
              message = err.detail.map((d: any) => d.msg || JSON.stringify(d)).join("; ");
            } else if (typeof err.detail === "string") {
              message = err.detail;
            } else {
              message = JSON.stringify(err.detail);
            }
          } else if (err && err.error) {
            message = err.error;
          }
        } catch {}
        throw new Error(message);
      }

      // Success
      router.push("/assets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create asset");
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
        <AssetForm 
          onSubmit={handleSubmit}
          title="Register New Asset"
          mode="create"
        />
      </Box>
    </ProtectedRoute>
  );
} 