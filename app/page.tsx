"use client";
import Link from "next/link";
import { Box, Typography, Button, Paper, Container, Card, CardContent, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { 
  Security, 
  Analytics, 
  Timeline, 
  Assessment, 
  VerifiedUser, 
  TrendingUp,
  Inventory
} from "@mui/icons-material";
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// No MainNav or authenticated-only components imported!

function getDefaultLandingPage(user) {
  if (!user) return '/auth/login';
  if (user.role === 'admin' || user.permissions.includes('all')) return '/dashboard';
  if (user.role === 'auction_manager' || user.permissions.includes('auctions')) return '/auctions';
  if (user.role === 'maintenance_manager' || user.permissions.includes('maintenance')) return '/maintenance';
  if (user.role === 'disposal_manager' || user.permissions.includes('disposals')) return '/disposals';
  if (user.role === 'asset_manager' || user.permissions.includes('assets')) return '/assets';
  // Add more mappings as needed
  return '/dashboard'; // fallback
}

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Mark as client-side after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return; // Don't run on server
    
    if (!isLoading) {
      if (isAuthenticated && user) {
        const landingPage = getDefaultLandingPage(user);
        router.replace(landingPage);
      } else {
        router.replace('/auth/login');
      }
    }
  }, [isAuthenticated, isLoading, user, router, isClient]);

  // Show loading state on server and during client-side auth check
  if (!isClient || isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Asset Management System
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // This should never be reached due to redirects, but return null just in case
  return null;
}
