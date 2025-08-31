"use client";
import React, { useState, useEffect } from "react";
import { Box, LinearProgress } from "@mui/material";
import MainNav from "../../../../components/MainNav";
import UserForm from "../../../../components/UserForm";
import MessageModal from "../../../../components/MessageModal";
import { useRouter } from "next/navigation";
import ProtectedRoute from '@/components/ProtectedRoute';

interface UserData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'user' | 'auditor' | 'viewer';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  department: string;
  position: string;
  phone: string;
  location: string;
  permissions: string[];
  asset_access: string[];
  notes: string;
}

export default function EditUserPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  const userId = params.id;
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageModal, setMessageModal] = useState<{
    open: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    details?: string;
    showRefresh?: boolean;
    showContinue?: boolean;
  }>({
    open: false,
    type: 'info',
    title: '',
    message: '',
    details: '',
    showRefresh: false,
    showContinue: false
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const response = await fetch(`${apiBaseUrl}/users/${userId}`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }
        
        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        setMessageModal({
          open: true,
          type: 'error',
          title: 'Failed to Load User',
          message: 'Unable to load user details. Please try again.',
          details: err instanceof Error ? err.message : 'An unexpected error occurred.',
          showRefresh: true
        });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const handleSubmit = async (data: any) => {
    try {
      
      // Remove confirmPassword from the data before sending to API
      const { confirmPassword, ...userData } = data;
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${apiBaseUrl}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle different error response formats
        if (errorData.detail) {
          // FastAPI validation error format
          if (Array.isArray(errorData.detail)) {
            // Multiple validation errors
            const errorMessages = errorData.detail.map((err: any) => err.msg).join(', ');
            throw new Error(errorMessages);
          } else {
            // Single error message
            throw new Error(errorData.detail);
          }
        } else if (errorData.error) {
          // Custom error format
          throw new Error(errorData.error);
        } else {
          // Fallback
          throw new Error('Failed to update user');
        }
      }

      const result = await response.json();
      
      // Show success message in modal
      setMessageModal({
        open: true,
        type: 'success',
        title: 'User Updated Successfully!',
        message: `User "${result.first_name} ${result.last_name}" has been updated successfully.`,
        details: 'The changes have been saved to the system.',
        showContinue: true
      });
    } catch (err) {
      console.error('Error updating user:', err);
      setMessageModal({
        open: true,
        type: 'error',
        title: 'Failed to Update User',
        message: 'Unable to update the user. Please check the information and try again.',
        details: err instanceof Error ? err.message : 'An unexpected error occurred.',
        showRefresh: true
      });
    }
  };

  if (loading) {
    return (
      <>
        <MainNav />
        <Box p={3}>
          <LinearProgress />
        </Box>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <MainNav />
        <Box p={3}>
          <LinearProgress />
        </Box>
      </>
    );
  }

  const handleModalClose = () => {
    setMessageModal(prev => ({ ...prev, open: false }));
  };

  const handleModalContinue = () => {
    setMessageModal(prev => ({ ...prev, open: false }));
    router.push(`/users/${userId}`);
  };

  const handleModalRefresh = () => {
    setMessageModal(prev => ({ ...prev, open: false }));
    window.location.reload();
  };

  return (
    <ProtectedRoute>
      <MainNav />
      <Box p={3}>
        <UserForm 
          onSubmit={handleSubmit}
          title="Edit User"
          mode="edit"
          initialData={user}
        />
      </Box>
      
      {/* Message Modal */}
      <MessageModal
        open={messageModal.open}
        type={messageModal.type}
        title={messageModal.title}
        message={messageModal.message}
        details={messageModal.details}
        showRefresh={messageModal.showRefresh}
        showContinue={messageModal.showContinue}
        onClose={handleModalClose}
        onContinue={handleModalContinue}
        onRefresh={handleModalRefresh}
      />
    </ProtectedRoute>
  );
} 