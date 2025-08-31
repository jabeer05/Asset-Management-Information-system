"use client";
import React from "react";
import { Box } from "@mui/material";
import MainNav from "@/components/MainNav";
import NotificationForm from "@/components/NotificationForm";
import ProtectedRoute from '@/components/ProtectedRoute';

interface EditNotificationPageProps {
  params: {
    id: string;
  };
}

export default function EditNotificationPage({ params }: EditNotificationPageProps) {
  
  return (
    <ProtectedRoute>
      <MainNav />
      <Box p={3}>
        <NotificationForm notificationId={params.id} isEdit={true} />
      </Box>
    </ProtectedRoute>
  );
} 