"use client";
import React from "react";
import { Box } from "@mui/material";
import MainNav from "@/components/MainNav";
import TransferTable from "@/components/TransferTable";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function TransfersPage() {
  return (
    <ProtectedRoute requiredPermissions="transfers">
      <MainNav />
      <Box p={3}>
        <TransferTable />
      </Box>
    </ProtectedRoute>
  );
} 