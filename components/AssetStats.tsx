import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';

// Mock data - replace with API call
const mockStats = {
  totalAssets: 150,
  totalValue: 45000000,
  totalQuantity: 500,
  activeAssets: 120,
  maintenanceAssets: 20,
  inactiveAssets: 10,
  categories: [
    { name: "Electronics", count: 45, quantity: 180, value: 25000000 },
    { name: "Furniture", count: 35, quantity: 200, value: 12000000 },
    { name: "Vehicle", count: 8, quantity: 12, value: 5000000 },
    { name: "Equipment", count: 25, quantity: 80, value: 2000000 },
    { name: "Other", count: 37, quantity: 28, value: 1000000 }
  ],
  locations: [
    { name: "HQ", count: 80, quantity: 250, value: 30000000 },
    { name: "Branch Office", count: 45, quantity: 150, value: 12000000 },
    { name: "Warehouse", count: 25, quantity: 100, value: 3000000 }
  ]
};

const AssetStats: React.FC = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Assets
            </Typography>
            <Typography variant="h4">
              {mockStats.totalAssets}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {mockStats.totalQuantity} total units
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Value
            </Typography>
                                        <Typography variant="h4">
              ₦{mockStats.totalValue?.toLocaleString() || '0'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Avg: ₦{mockStats.totalQuantity ? Math.round(mockStats.totalValue / mockStats.totalQuantity).toLocaleString() : '0'}/unit
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Assets
            </Typography>
            <Typography variant="h4">
              {mockStats.activeAssets}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {Math.round((mockStats.activeAssets / mockStats.totalAssets) * 100)}% of total
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              In Maintenance
            </Typography>
            <Typography variant="h4">
              {mockStats.maintenanceAssets}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {Math.round((mockStats.maintenanceAssets / mockStats.totalAssets) * 100)}% of total
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default AssetStats; 