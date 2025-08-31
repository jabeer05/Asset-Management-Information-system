"use client";
import React, { useEffect, useState } from "react";
import { Box, Alert, Paper, Container, Typography } from "@mui/material";
import MainNav from "../../../../components/MainNav";
import MaintenanceForm from "../../../../components/MaintenanceForm";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../../components/ProtectedRoute";

interface MaintenanceEditPageProps {
  params: any;
}

export default function MaintenanceEditPage({ params }: MaintenanceEditPageProps) {
  const router = useRouter();
  
  const maintenanceId = parseInt(params.id);
  
  const [defaultValues, setDefaultValues] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!maintenanceId || isNaN(maintenanceId)) {
      return;
    }
    
    const fetchRecord = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${API_BASE_URL}/maintenance/${maintenanceId}/`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) throw new Error("Failed to fetch maintenance record");
        const data = await res.json();
        // Map backend fields to frontend form fields
        setDefaultValues({
          ...data,
          scheduled_date: data.scheduled_date,
          assigned_to: data.assigned_to,
          description: data.description,
          cost: data.cost,
        });
      } catch (e: any) {
        setError(e.message || "Failed to fetch maintenance record");
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [maintenanceId]);

  if (!maintenanceId || isNaN(maintenanceId)) {
    return (
      <ProtectedRoute>
        <MainNav />
        <Box p={3}>
          <Container maxWidth="sm">
            <Paper elevation={6} sx={{ p: 4, borderRadius: 4, boxShadow: 6 }}>
              <Alert severity="error">Invalid maintenance ID.</Alert>
            </Paper>
          </Container>
        </Box>
      </ProtectedRoute>
    );
  }

  const handleSubmit = async (formData: any) => {
    setSubmitError(null);
    try {
      // Map frontend fields to backend fields
      const payload = { ...formData };
      payload.maintenance_date = payload.scheduled_date;
      if (payload.assigned_to === "custom") {
        payload.performed_by = payload.custom_assigned_name;
      } else {
        payload.performed_by = payload.assigned_to;
      }
      payload.description = payload.description;
      delete payload.scheduled_date;
      delete payload.assigned_to;
      delete payload.custom_assigned_name;
      if (payload.asset_id !== "custom") {
        delete payload.custom_asset_name;
      } else {
        payload.asset_name = payload.custom_asset_name;
      }
      if (payload.asset_id === "custom") {
        payload.asset_id = null;
      }
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${API_BASE_URL}/maintenance/${maintenanceId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update maintenance record");
      }
      router.push("/maintenance");
    } catch (err: any) {
      setSubmitError(err.message || "Failed to update maintenance record");
    }
  };

  return (
    <ProtectedRoute>
      <MainNav />
      <Box p={3}>
        <Container maxWidth="sm">
          <Paper elevation={6} sx={{ p: 4, borderRadius: 4, boxShadow: 6 }}>
            <Typography variant="h5" gutterBottom>Edit Maintenance Record</Typography>
            {loading && <Typography>Loading...</Typography>}
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {submitError && <Alert severity="error" sx={{ mb: 3 }}>{submitError}</Alert>}
            {defaultValues && !loading && !error && (
              <MaintenanceForm
                onSubmit={handleSubmit}
                defaultValues={defaultValues}
                mode="edit"
                title="Edit Maintenance Record"
              />
            )}
          </Paper>
        </Container>
      </Box>
    </ProtectedRoute>
  );
} 