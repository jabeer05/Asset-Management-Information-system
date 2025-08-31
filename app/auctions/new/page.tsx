"use client";
import React, { useState } from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import { useRouter } from "next/navigation";
import MainNav from '@/components/MainNav';
import AuctionForm from '@/components/AuctionForm';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function NewAuctionPage() {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      console.log('handleSubmit called with data:', data);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      console.log('Token:', token ? 'Present' : 'Missing');
      
      // Map frontend fields to backend AuctionCreate schema
      const payload = {
        asset_id: parseInt(data.asset_id),
        auction_date: data.start_date, // Use start_date as auction_date
        starting_bid: parseFloat(data.starting_bid) || 0,
        reserve_price: parseFloat(data.reserve_price) || 0,
        final_bid: data.final_bid ? parseFloat(data.final_bid) : null, // Convert to number
        winner: data.winner || null,    // Use form data
        status: "draft", // Default status - requires approval
        location: data.location || null, // Add location field
        description: data.description || null,
        notes: data.notes || null
      };
      
      console.log('Sending payload:', payload);
      
      const response = await fetch('/api/auctions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`Failed to create auction: ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('Success response:', responseData);
      
      setSuccess('Auction created successfully!');
      setError('');
      // Navigate back to auctions page after successful creation
      setTimeout(() => {
        router.push('/auctions');
      }, 1500); // Wait 1.5 seconds to show success message
    } catch (error) {
      console.log('Error in handleSubmit:', error);
      setError('Error creating auction: ' + (error as Error).message);
      setSuccess('');
    }
  };

  return (
    <ProtectedRoute>
      <MainNav />
      <Box p={3}>
        <AuctionForm 
          onSubmit={handleSubmit}
          title="Create New Auction"
          mode="create"
        />
        <Snackbar
          open={!!success}
          autoHideDuration={4000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
        <Snackbar
          open={!!error}
          autoHideDuration={4000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </ProtectedRoute>
  );
} 