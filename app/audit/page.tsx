"use client";
import React from "react";
import { Box, Paper, Container } from "@mui/material";
import MainNav from "@/components/MainNav";
import AuditTable from "@/components/AuditTable";
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AuditPage() {
  return (
    <ProtectedRoute requiredPermissions="audit">
      <MainNav />
      <Box p={3}>
        <AuditTable />
      </Box>
    </ProtectedRoute>
  );
} 