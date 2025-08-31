"use client";
import React, { useState } from "react";
import { Box } from "@mui/material";
import MainNav from "../../../components/MainNav";
import UserForm from "../../../components/UserForm";
import MessageModal from "../../../components/MessageModal";
import { useRouter } from "next/navigation";
import ProtectedRoute from '@/components/ProtectedRoute';

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (data: any) => {
    setLoading(true);
    
    try {
      // Remove confirmPassword from the data before sending to API
      const { confirmPassword, ...userData } = data;
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${apiBaseUrl}/users`, {
        method: 'POST',
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
          throw new Error('Failed to create user');
        }
      }

      const result = await response.json();
      console.log('User created successfully:', result);
      
      // Show success message in modal
      setMessageModal({
        open: true,
        type: 'success',
        title: 'User Created Successfully!',
        message: `User "${result.first_name} ${result.last_name}" has been created successfully.`,
        details: `The user can now log in with username: ${result.username}`,
        showContinue: true
      });
    } catch (err) {
      console.error('Error creating user:', err);
      setMessageModal({
        open: true,
        type: 'error',
        title: 'Failed to Create User',
        message: 'Unable to create the user. Please check the information and try again.',
        details: err instanceof Error ? err.message : 'An unexpected error occurred.',
        showRefresh: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setMessageModal(prev => ({ ...prev, open: false }));
  };

  const handleModalContinue = () => {
    setMessageModal(prev => ({ ...prev, open: false }));
    router.push('/users');
  };

  const handleModalRefresh = () => {
    setMessageModal(prev => ({ ...prev, open: false }));
    // Optionally refresh the form or page
    window.location.reload();
  };

  return (
    <ProtectedRoute>
      <MainNav />
      <Box p={3}>
        <UserForm 
          onSubmit={handleSubmit}
          title="Create New User"
          mode="create"
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