"use client";
import React, { useState } from "react";
import { Box, Typography, Paper, Card, CardContent, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { LocationOn, History, Map } from "@mui/icons-material";

interface LocationInfo {
  id: number;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  currentAssets: number;
  capacity: number;
}

interface AssetLocationTrackerProps {
  assetId: number;
  currentLocation: string;
}

export default function AssetLocationTracker({ assetId, currentLocation }: AssetLocationTrackerProps) {
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  // Mock location data - replace with API call
  const locations: LocationInfo[] = [
    {
      id: 1,
      name: "Headquarters",
      address: "123 Main St, Downtown, City",
      coordinates: { lat: 40.7128, lng: -74.0060 },
      currentAssets: 45,
      capacity: 100
    },
    {
      id: 2,
      name: "Branch Office",
      address: "456 Oak Ave, Suburb, City",
      coordinates: { lat: 40.7589, lng: -73.9851 },
      currentAssets: 23,
      capacity: 50
    },
    {
      id: 3,
      name: "Warehouse",
      address: "789 Industrial Blvd, Industrial Zone",
      coordinates: { lat: 40.7505, lng: -73.9934 },
      currentAssets: 67,
      capacity: 200
    }
  ];

  const currentLocationInfo = locations.find(loc => loc.name === currentLocation);

  const locationHistory = [
    { date: "2024-01-15", location: "Headquarters", reason: "Initial assignment" },
    { date: "2024-02-01", location: "Branch Office", reason: "Department transfer" },
    { date: "2024-03-01", location: "Warehouse", reason: "Maintenance" },
    { date: "2024-03-15", location: "Headquarters", reason: "Return from maintenance" }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Location Tracking
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
        {/* Current Location */}
        <Box>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <LocationOn color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Current Location</Typography>
            </Box>
            
            {currentLocationInfo ? (
              <Box>
                <Typography variant="h5" gutterBottom>
                  {currentLocationInfo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {currentLocationInfo.address}
                </Typography>
                <Box display="flex" gap={1} mb={2}>
                  <Chip 
                    label={`${currentLocationInfo.currentAssets}/${currentLocationInfo.capacity} assets`}
                    color="primary"
                    size="small"
                  />
                  <Chip 
                    label={`${Math.round((currentLocationInfo.currentAssets / currentLocationInfo.capacity) * 100)}% capacity`}
                    color="secondary"
                    size="small"
                  />
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<Map />}
                  onClick={() => setShowLocationDialog(true)}
                >
                  View on Map
                </Button>
              </Box>
            ) : (
              <Typography color="text.secondary">Location not found</Typography>
            )}
          </Paper>
        </Box>

        {/* Location History */}
        <Box>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <History color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Location History</Typography>
            </Box>
            
            <Box>
              {locationHistory.map((entry, index) => (
                <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < locationHistory.length - 1 ? '1px solid #eee' : 'none' }}>
                  <Typography variant="body2" fontWeight="bold">
                    {entry.location}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(entry.date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {entry.reason}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* All Locations Overview */}
        <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              All Locations
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              {locations.map((location) => (
                <Box key={location.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {location.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {location.address}
                      </Typography>
                      <Box display="flex" gap={1} mb={1}>
                        <Chip 
                          label={`${location.currentAssets} assets`}
                          size="small"
                          color={location.currentAssets > location.capacity * 0.8 ? "warning" : "default"}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Capacity: {location.currentAssets}/{location.capacity}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Location Map Dialog */}
      <Dialog open={showLocationDialog} onClose={() => setShowLocationDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Asset Location Map</DialogTitle>
        <DialogContent>
          <Box sx={{ height: 400, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Interactive Map View
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              (Would integrate with Google Maps or similar service)
            </Typography>
          </Box>
          {currentLocationInfo && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {currentLocationInfo.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Coordinates: {currentLocationInfo.coordinates.lat}, {currentLocationInfo.coordinates.lng}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLocationDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 