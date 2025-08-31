"use client";
import React, { useState } from "react";
import { Box } from "@mui/material";
import MainNav from "../../../components/MainNav";
import TransferForm from "../../../components/TransferForm";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../components/ProtectedRoute";
import ErrorBoundary from "../../../components/ErrorBoundary";
import MessageModal from "../../../components/MessageModal";

export default function NewTransferPage() {
  const router = useRouter();
  
  const [messageModal, setMessageModal] = useState<{
    open: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    details?: string;
  }>({
    open: false,
    type: 'info',
    title: '',
    message: '',
    details: ''
  });

  const handleSubmit = async (data: any) => {
    try {
      // Generate a unique transfer_id (could use uuid or timestamp)
      const transfer_id = `TRF-${Date.now()}`;
      const payload = { ...data, transfer_id };
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch("/api/transfer_requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to create transfer");
      }
      
      setMessageModal({
        open: true,
        type: 'success',
        title: 'Transfer Request Created Successfully!',
        message: 'Your transfer request has been submitted and is now pending approval.',
        details: `Transfer ID: ${transfer_id}. You will be notified once the request is reviewed.`
      });
      
      // Navigate to transfers page after showing success message
      setTimeout(() => {
        router.push("/transfers");
      }, 2000);
    } catch (e: any) {
      setMessageModal({
        open: true,
        type: 'error',
        title: 'Failed to Create Transfer Request',
        message: 'Unable to create transfer request at this time.',
        details: e.message || "Failed to create transfer"
      });
    }
  };

  return (
    <ProtectedRoute>
      <MainNav />
      <Box p={3}>
        <ErrorBoundary>
          <TransferForm 
            onSubmit={handleSubmit}
            title="Request New Transfer"
            mode="create"
          />
        </ErrorBoundary>
        
        {/* Message Modal */}
        <MessageModal
          open={messageModal.open}
          onClose={() => setMessageModal(prev => ({ ...prev, open: false }))}
          type={messageModal.type}
          title={messageModal.title}
          message={messageModal.message}
          details={messageModal.details}
          showRefresh={messageModal.type === 'error'}
          autoClose={messageModal.type === 'success'}
          autoCloseDelay={4000}
        />
      </Box>
    </ProtectedRoute>
  );
} 