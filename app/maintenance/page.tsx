"use client";
import React from "react";
import { Box } from "@mui/material";
import MainNav from "../../components/MainNav";
import MaintenanceTable from "../../components/MaintenanceTable";
import ProtectedRoute from "../../components/ProtectedRoute";
import Button from "@mui/material/Button";
import Link from "next/link";

export default function MaintenancePage() {
  return (
    <ProtectedRoute requiredPermissions="maintenance">
      <MainNav />
      <Box p={3}>
        <MaintenanceTable />
      </Box>
    </ProtectedRoute>
  );
} 