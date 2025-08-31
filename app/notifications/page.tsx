"use client";
import React from "react";
import { Box } from "@mui/material";
import MainNav from "../../components/MainNav";
import NotificationTable from "../../components/NotificationTable";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <MainNav />
      <Box p={3}>
        <NotificationTable />
      </Box>
    </ProtectedRoute>
  );
} 