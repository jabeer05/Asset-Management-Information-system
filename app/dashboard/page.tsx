"use client";
import React from 'react';
import { Box } from '@mui/material';
import MainNav from '@/components/MainNav';
import Dashboard from '@/components/Dashboard';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredPermissions="admin">
      <MainNav />
      <Box p={3}>
        <Dashboard />
      </Box>
    </ProtectedRoute>
  );
} 