"use client";
import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Tabs, Tab } from '@mui/material';
import MainNav from "@/components/MainNav";
import FinancialReports from '@/components/FinancialReports';
import VATCalculator from '@/components/VATCalculator';
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [mounted, setMounted] = useState(false);
  const redirectedRef = useRef(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && user && user.role !== 'admin' && !redirectedRef.current) {
      // Priority order for permissions
      const permissionToRoute: { [key: string]: string } = {
        maintenance: '/maintenance/report',
        auctions: '/auctions/report',
        assets: '/assets/report',
        disposals: '/disposals/report',
        transfers: '/transfers/report',
      };
      let sectionRoute = null;
      if (user.permissions && Array.isArray(user.permissions)) {
        for (const perm of ['maintenance', 'auctions', 'assets', 'disposals', 'transfers']) {
          if (user.permissions.includes(perm)) {
            sectionRoute = permissionToRoute[perm];
            break;
          }
        }
      }
      // Fallback to role if no matching permission
      if (!sectionRoute) {
        switch (user.role) {
          case 'auction':
          case 'manager':
            sectionRoute = '/auctions/report'; break;
          case 'asset':
            sectionRoute = '/assets/report'; break;
          case 'maintenance':
            sectionRoute = '/maintenance/report'; break;
          case 'disposal':
            sectionRoute = '/disposals/report'; break;
          case 'transfer':
            sectionRoute = '/transfers/report'; break;
          default:
            sectionRoute = null;
        }
      }
      if (sectionRoute) {
        redirectedRef.current = true;
        router.push(sectionRoute);
        setTimeout(() => {
          if (window.location.pathname !== sectionRoute) {
            window.location.href = sectionRoute;
          }
        }, 1000);
      }
    }
  }, [mounted, user, router]);
  if (!mounted) return null;
  if (user && user.role !== 'admin') {
    let knownRoles = ['auction', 'manager', 'asset', 'maintenance', 'disposal', 'transfer'];
    if (!knownRoles.includes(user.role)) {
      return (
        <>
          <MainNav />
          <Box p={3} display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
            <Typography variant="h4" color="error" gutterBottom>No report page is available for your role:</Typography>
            <Typography variant="h5" fontWeight={600} color="primary.main">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>Please contact your administrator if you believe you should have access to a report page.</Typography>
          </Box>
        </>
      );
    }
    return <Box p={3}><Typography variant="h5">Redirecting to your section report...</Typography></Box>;
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <ProtectedRoute requiredPermissions="reports">
      <MainNav />
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Reports & Analytics
        </Typography>
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="reports tabs">
              <Tab label="Financial Reports" />
              <Tab label="Assets Report" />
              <Tab label="Maintenance Report" />
              <Tab label="Auctions Report" />
              <Tab label="Disposals Report" />
              <Tab label="VAT Calculator" />
            </Tabs>
          </CardContent>
        </Card>

        <TabPanel value={tabValue} index={0}>
          <FinancialReports />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <AssetsReport />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <MaintenanceReport />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <AuctionsReport />
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <DisposalsReport />
        </TabPanel>
        
        <TabPanel value={tabValue} index={5}>
          <VATCalculator />
        </TabPanel>
      </Box>
    </ProtectedRoute>
  );
}

// Assets Report Component
function AssetsReport() {
  const [assetsData, setAssetsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssetsData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await fetch('http://localhost:8000/reports/assets', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        setAssetsData(data);
      } catch (err) {
        console.error('Error fetching assets data:', err);
        setError(err instanceof Error ? err.message : 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssetsData();
  }, []);

  if (loading) return <Box p={3}><Typography>Loading assets report...</Typography></Box>;
  if (error) return <Box p={3}><Typography color="error">Error: {error}</Typography></Box>;
  if (!assetsData) return <Box p={3}><Typography>No data available</Typography></Box>;

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>Assets Report</Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Total Assets: {assetsData.totalAssets} | Total Value: ₦{assetsData.totalValue?.toLocaleString('en-NG')} | Average Value: ₦{assetsData.averageValue?.toLocaleString('en-NG')}
      </Typography>
      {/* Add more detailed assets report content here */}
    </Box>
  );
}

// Maintenance Report Component
function MaintenanceReport() {
  const [maintenanceData, setMaintenanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaintenanceData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await fetch('http://localhost:8000/reports/maintenance', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        setMaintenanceData(data);
      } catch (err) {
        console.error('Error fetching maintenance data:', err);
        setError(err instanceof Error ? err.message : 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMaintenanceData();
  }, []);

  if (loading) return <Box p={3}><Typography>Loading maintenance report...</Typography></Box>;
  if (error) return <Box p={3}><Typography color="error">Error: {error}</Typography></Box>;
  if (!maintenanceData) return <Box p={3}><Typography>No data available</Typography></Box>;

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>Maintenance Report</Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Total Records: {maintenanceData.totalRecords} | Total Cost: ₦{maintenanceData.totalCost?.toLocaleString('en-NG')} | Overdue: {maintenanceData.overdueCount}
      </Typography>
      {/* Add more detailed maintenance report content here */}
    </Box>
  );
}

// Auctions Report Component
function AuctionsReport() {
  const [auctionsData, setAuctionsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuctionsData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await fetch('http://localhost:8000/reports/auctions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        setAuctionsData(data);
      } catch (err) {
        console.error('Error fetching auctions data:', err);
        setError(err instanceof Error ? err.message : 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuctionsData();
  }, []);

  if (loading) return <Box p={3}><Typography>Loading auctions report...</Typography></Box>;
  if (error) return <Box p={3}><Typography color="error">Error: {error}</Typography></Box>;
  if (!auctionsData) return <Box p={3}><Typography>No data available</Typography></Box>;

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>Auctions Report</Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Total Auctions: {auctionsData.totalAuctions} | Active: {auctionsData.activeCount} | Total Starting Bid: ₦{auctionsData.totalStartingBid?.toLocaleString('en-NG')}
      </Typography>
      {/* Add more detailed auctions report content here */}
    </Box>
  );
}

// Disposals Report Component
function DisposalsReport() {
  const [disposalsData, setDisposalsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDisposalsData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await fetch('http://localhost:8000/reports/disposals', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        setDisposalsData(data);
      } catch (err) {
        console.error('Error fetching disposals data:', err);
        setError(err instanceof Error ? err.message : 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDisposalsData();
  }, []);

  if (loading) return <Box p={3}><Typography>Loading disposals report...</Typography></Box>;
  if (error) return <Box p={3}><Typography color="error">Error: {error}</Typography></Box>;
  if (!disposalsData) return <Box p={3}><Typography>No data available</Typography></Box>;

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>Disposals Report</Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Total Disposals: {disposalsData.totalDisposals} | Total Proceeds: ₦{disposalsData.totalProceeds?.toLocaleString('en-NG')} | Average Proceeds: ₦{disposalsData.averageProceeds?.toLocaleString('en-NG')}
      </Typography>
      {/* Add more detailed disposals report content here */}
    </Box>
  );
} 