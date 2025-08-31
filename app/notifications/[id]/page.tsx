"use client";
import React from "react";
import { Box } from "@mui/material";
import MainNav from "@/components/MainNav";
import NotificationDetail from "@/components/NotificationDetail";
import ProtectedRoute from '@/components/ProtectedRoute';
import { use } from 'react';

interface NotificationDetailPageProps {
  params: {
    id: string;
  };
}

export default function NotificationDetailPage({ params }: NotificationDetailPageProps) {
  const { id } = params;
  return (
    <ProtectedRoute>
      <MainNav />
      <Box p={3}>
        <NotificationDetail notificationId={id} />
      </Box>
    </ProtectedRoute>
  );
} 