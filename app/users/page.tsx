"use client";
import React from "react";
import { Box } from "@mui/material";
import MainNav from "@/components/MainNav";
import UserTable from "@/components/UserTable";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function UsersPage() {
  return (
    <ProtectedRoute requiredPermissions="users">
      <MainNav />
      <Box p={3}>
        <UserTable />
      </Box>
    </ProtectedRoute>
  );
} 