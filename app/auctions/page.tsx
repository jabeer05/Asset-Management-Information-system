"use client";
import React from "react";
import { Box } from "@mui/material";
import MainNav from "@/components/MainNav";
import AuctionTable from "@/components/AuctionTable";
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AuctionsPage() {
  return (
    <ProtectedRoute requiredPermissions="auctions">
      <MainNav />
      <Box p={3}>
        <AuctionTable />
      </Box>
    </ProtectedRoute>
  );
} 