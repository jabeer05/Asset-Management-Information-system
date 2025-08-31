"use client";
import React, { useState, useEffect } from "react";
import { Box, Alert, CircularProgress } from "@mui/material";
import MainNav from "@/components/MainNav";
import DisposalForm from "@/components/DisposalForm";
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';

interface EditDisposalPageProps {
  params: {
    id: string;
  };
}

export default function EditDisposalPage({ params }: EditDisposalPageProps) {
  const router = useRouter();
  
  const disposalId = parseInt(params.id);
  const [disposal, setDisposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch disposal record
  useEffect(() => {
    const fetchDisposal = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        const response = await fetch(`${API_BASE_URL}/disposals/${disposalId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch disposal: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Fetched disposal for editing:', data);
        setDisposal(data);
      } catch (err) {
        console.error('Error fetching disposal:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch disposal record');
      } finally {
        setLoading(false);
      }
    };

    if (disposalId) {
      fetchDisposal();
    }
  }, [disposalId]);

  const handleSubmit = async (data: any) => {
    try {
      setError(null);
      setSuccess(null);
      
      console.log('Form data received:', data);
      
      // Validate required fields
      if (!data.asset_id || !data.disposal_date || !data.disposal_method || !data.status) {
        throw new Error('Missing required fields: asset_id, disposal_date, disposal_method, or status');
      }
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      // Map form data to backend format - match DisposalCreate schema exactly
      const updateData = {
        asset_id: parseInt(data.asset_id) || data.asset_id,
        disposal_date: data.disposal_date, // Should be in YYYY-MM-DD format
        method: data.disposal_method || data.disposal_type, // Use disposal_method from form
        reason: data.disposal_reason || null,
        proceeds: parseFloat(data.disposal_value) || null, // Use disposal_value from form
        status: data.status || 'pending' // Use status from form
      };

      console.log('Mapped update data:', updateData);

      const response = await fetch(`${API_BASE_URL}/disposals/${disposalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updateData)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend error:', errorData);
        throw new Error(errorData.detail || `Failed to update disposal: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Update successful:', responseData);

      setSuccess('Disposal updated successfully!');
      
      // Redirect to disposal detail page after successful update
      setTimeout(() => {
        router.push(`/disposals/${disposalId}`);
      }, 1500);
    } catch (err) {
      console.error('Error updating disposal:', err);
      setError(err instanceof Error ? err.message : 'Failed to update disposal');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <ProtectedRoute>
        <MainNav />
        <Box p={3}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        </Box>
      </ProtectedRoute>
    );
  }

  // Show error state
  if (error) {
    return (
      <ProtectedRoute>
        <MainNav />
        <Box p={3}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </Box>
      </ProtectedRoute>
    );
  }

  // Show not found state
  if (!disposal) {
    return (
      <ProtectedRoute>
        <MainNav />
        <Box p={3}>
          <Alert severity="warning">
            Disposal record not found
          </Alert>
        </Box>
      </ProtectedRoute>
    );
  }

  // Map disposal data to form format with null safety
  const defaultValues = {
    asset_id: disposal.asset_id || '',
    asset_name: disposal.asset_name || '',
    disposal_type: disposal.method || 'recycling' as any, // Map method to disposal_type
    disposal_date: disposal.disposal_date || '',
    disposal_value: disposal.estimated_proceeds || disposal.proceeds || 0,
    disposal_cost: disposal.disposal_cost || 0,
    disposal_reason: disposal.disposal_reason || '',
    disposal_method: disposal.disposal_method_name || disposal.method || '',
    buyer_recipient: disposal.buyer_info || '',
    disposal_location: disposal.asset_location || '',
    authorized_by: disposal.approved_by_name || '',
    notes: disposal.disposal_notes || '',
    environmental_impact: "Positive - Properly recycled", // Default value
    compliance_status: "compliant" as const, // Default value
    status: disposal.status || 'pending' as const // Map status from backend
  };

  return (
    <ProtectedRoute>
      <MainNav />
      <Box p={3}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        <DisposalForm 
          onSubmit={handleSubmit}
          defaultValues={defaultValues}
          title={`Edit Disposal #${disposalId}`}
          mode="edit"
        />
      </Box>
    </ProtectedRoute>
  );
} 