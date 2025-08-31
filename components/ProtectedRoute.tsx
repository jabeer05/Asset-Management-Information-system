"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string | string[];
}

function getDefaultLandingPage(user) {
  if (!user) return '/auth/login';
  if (user.role === 'admin' || (Array.isArray(user.permissions) && user.permissions.includes('all'))) return '/dashboard';
  if (user.role === 'auction_manager' || (Array.isArray(user.permissions) && user.permissions.includes('auctions'))) return '/auctions';
  if (user.role === 'maintenance_manager' || (Array.isArray(user.permissions) && user.permissions.includes('maintenance'))) return '/maintenance';
  if (user.role === 'disposal_manager' || (Array.isArray(user.permissions) && user.permissions.includes('disposals'))) return '/disposals';
  if (user.role === 'asset_manager' || (Array.isArray(user.permissions) && user.permissions.includes('assets'))) return '/assets';
  // Add more mappings as needed
  return '/dashboard'; // fallback
}

export default function ProtectedRoute({ children, requiredPermissions }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission, user } = useAuth();
  const router = useRouter();
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Mark as client-side after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return; // Don't run on server
    
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    } else if (
      !isLoading && isAuthenticated && requiredPermissions && !permissionDenied
    ) {
      const perms = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
      const hasAny = perms.some((perm) => hasPermission(perm));
      if (!hasAny) {
        setPermissionDenied(true);
        // Redirect to user's default landing page
        const landingPage = getDefaultLandingPage(user);
        router.push(landingPage);
      }
    }
  }, [isAuthenticated, isLoading, requiredPermissions, hasPermission, router, permissionDenied, user, isClient]);

  // Show loading spinner while checking authentication (both server and client)
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
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  if (permissionDenied) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" gap={2}>
        <Typography variant="h5" color="error">Permission Denied</Typography>
        <Typography variant="body1">You do not have permission to access this page.</Typography>
      </Box>
    );
  }

  // Only render children if authenticated and (if requiredPermissions) has permission
  if (isAuthenticated && (!requiredPermissions || !permissionDenied)) {
    return <>{children}</>;
  }

  // Return null for unauthenticated users (will be redirected by useEffect)
  return null;
} 