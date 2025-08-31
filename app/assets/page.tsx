"use client";
import React from 'react';
import { Box } from '@mui/material';
import MainNav from '@/components/MainNav';
import AssetTable from '@/components/AssetTable';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function AssetsPage() {
  const { hasPermission, isMaintenanceManager } = useAuth();
  
  // Check if user has appropriate permissions
  const hasAssetAccess = hasPermission('assets') || isMaintenanceManager();
  
  return (
    <ProtectedRoute requiredPermissions={hasAssetAccess ? undefined : "assets"}>
      <MainNav />
      <Box p={3}>
        <AssetTable />
      </Box>
    </ProtectedRoute>
  );
} 