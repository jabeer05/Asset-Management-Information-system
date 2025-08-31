"use client";
import React from "react";
import { Box } from "@mui/material";
import MainNav from "@/components/MainNav";
import AuctionForm from "@/components/AuctionForm";
import ProtectedRoute from '@/components/ProtectedRoute';

interface EditAuctionPageProps {
  params: {
    id: string;
  };
}

export default function EditAuctionPage({ params }: EditAuctionPageProps) {
  const auctionId = parseInt(params.id);

  // Mock data for editing - in real app, fetch auction data by ID
  const defaultValues = {
    asset_id: 1,
    asset_name: "Laptop",
    auction_type: "online" as const,
    start_date: "2024-01-15",
    end_date: "2024-01-20",
    reserve_price: 150000,
    starting_bid: 100000,
    description: "High-performance laptop for business use",
    location: "Online Auction",
    auctioneer: "Tech Auctions Ltd",
    notes: "Laptop sold successfully above reserve price"
  };

  const handleSubmit = (data: any) => {
    console.log('Updating auction:', data);
    // In real app, send data to API
    alert('Auction updated successfully!');
  };

  return (
    <ProtectedRoute>
      <MainNav />
      <Box p={3}>
        <AuctionForm 
          onSubmit={handleSubmit}
          defaultValues={defaultValues}
          title={`Edit Auction #${auctionId}`}
          mode="edit"
        />
      </Box>
    </ProtectedRoute>
  );
} 