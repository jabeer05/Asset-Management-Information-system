"use client";
import React from 'react';
import { Box } from '@mui/material';
import MainNav from '@/components/MainNav';
import AssetTable from '@/components/AssetTable';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AssetsReportPage() {
  return (
    <ProtectedRoute requiredPermissions="assets">
      <MainNav />
      <Box p={3}>
        <AssetTable />
      </Box>
    </ProtectedRoute>
  );
}
