"use client";
import React from "react";
import { Box } from "@mui/material";
import MainNav from "@/components/MainNav";
import DisposalTable from "@/components/DisposalTable";
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DisposalsPage() {
  return (
    <ProtectedRoute requiredPermissions="disposals">
      <MainNav />
      <Box p={3}>
        <DisposalTable />
      </Box>
    </ProtectedRoute>
  );
} 