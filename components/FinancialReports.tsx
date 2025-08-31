"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  Download,
  BarChart,
  PieChart,
  AttachMoney,
  Inventory
} from '@mui/icons-material';
import ExportDialog from './ExportDialog';

interface FinancialData {
  period: string;
  totalAssets: number;
  totalValue: number;
  totalVAT: number;
  totalTax: number;
  netValue: number;
  depreciation: number;
  categoryBreakdown: {
    category: string;
    count: number;
    value: number;
    vat: number;
    percentage: number;
  }[];
  monthlyData: {
    month: string;
    purchases: number;
    sales: number;
    vat: number;
    netProfit: number;
  }[];
  additionalMetrics?: {
    totalDisposals: number;
    totalAuctionProceeds: number;
    totalMaintenanceCost: number;
    totalCostWithVAT: number;
  };
}

const mockFinancialData: FinancialData = {
  period: "All Years",
  totalAssets: 150,
  totalValue: 45000000,
  totalVAT: 3375000,
  totalTax: 2250000,
  netValue: 39375000,
  depreciation: 4500000,
  categoryBreakdown: [
    { category: "Electronics", count: 45, value: 25000000, vat: 1875000, percentage: 55.6 },
    { category: "Furniture", count: 35, value: 12000000, vat: 900000, percentage: 26.7 },
    { category: "Vehicle", count: 8, value: 5000000, vat: 375000, percentage: 11.1 },
    { category: "Equipment", count: 25, value: 2000000, vat: 150000, percentage: 4.4 },
    { category: "Other", count: 37, value: 1000000, vat: 75000, percentage: 2.2 }
  ],
  monthlyData: [
    { month: "Jan", purchases: 8500000, sales: 0, vat: 637500, netProfit: -8500000 },
    { month: "Feb", purchases: 12000000, sales: 0, vat: 900000, netProfit: -12000000 },
    { month: "Mar", purchases: 7500000, sales: 0, vat: 562500, netProfit: -7500000 },
    { month: "Apr", purchases: 6000000, sales: 0, vat: 450000, netProfit: -6000000 },
    { month: "May", purchases: 4500000, sales: 0, vat: 337500, netProfit: -4500000 },
    { month: "Jun", purchases: 6500000, sales: 0, vat: 487500, netProfit: -6500000 }
  ]
};

export default function FinancialReports() {
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedReport, setSelectedReport] = useState('summary');
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetchFinancialData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const response = await fetch(`${API_BASE_URL}/reports/financial?year=${selectedPeriod}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch financial report: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Successfully loaded financial data from backend:', data);
        console.log('Period:', data.period);
        console.log('Total assets:', data.totalAssets);
        console.log('Total value:', data.totalValue);
        setFinancialData(data);
      } catch (err) {
        console.error('Error fetching financial data:', err);
        setError(err instanceof Error ? err.message : 'Error fetching data');
        // Fallback to mock data if API fails
        console.log('Falling back to mock data due to API error');
        setFinancialData(mockFinancialData);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFinancialData();
  }, [selectedPeriod]);

  const formatCurrency = (value: number) => {
    return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const handleExport = (options: any) => {
    setLoading(true);
    // Simulate export process with filtering
    setTimeout(() => {
      const filteredData = { ...financialData };
      
      // Apply time filter
      if (options.timeFilter !== 'all') {
        // In a real app, this would filter based on actual dates
        console.log('Filtering by time:', options.timeFilter);
      }
      
      // Apply category filter
      if (options.categories.length > 0) {
        filteredData.categoryBreakdown = financialData?.categoryBreakdown.filter(
          cat => options.categories.includes(cat.category)
        );
      }
      
      // Apply asset name filter
      if (options.assetNames.length > 0) {
        console.log('Filtering by asset names:', options.assetNames);
      }
      
      // Generate CSV content
      let csvContent = '';
      
      if (options.format === 'csv') {
        // Generate CSV headers
        const headers = options.columns.join(',');
        csvContent = `Period,${headers}\n`;
        
        // Add data rows
        csvContent += `${selectedPeriod},${financialData?.totalAssets},${financialData?.totalValue},${financialData?.totalVAT},${financialData?.totalTax},${financialData?.netValue},${financialData?.depreciation}\n`;
        
        // Add category breakdown
        csvContent += '\nCategory Breakdown\n';
        csvContent += 'Category,Count,Value,VAT,Percentage\n';
        filteredData.categoryBreakdown?.forEach(cat => {
          csvContent += `${cat.category},${cat.count},${cat.value},${cat.vat},${cat.percentage}%\n`;
        });
      }
      
      const dataBlob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financial-report-${selectedPeriod}-${options.timeFilter}.${options.format}`;
      link.click();
      setLoading(false);
      setExportDialogOpen(false);
    }, 2000);
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Assessment color="primary" />
        Financial Reports
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Comprehensive financial analysis including VAT calculations, tax implications, and asset valuation reports


      </Alert>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Report Period</InputLabel>
                <Select
                  value={selectedPeriod}
                  label="Report Period"
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  <MenuItem value="all">All Years</MenuItem>
                  <MenuItem value="2025">2025</MenuItem>
                  <MenuItem value="2024">2024</MenuItem>
                  <MenuItem value="2023">2023</MenuItem>
                  <MenuItem value="2022">2022</MenuItem>
                  <MenuItem value="2021">2021</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={selectedReport}
                  label="Report Type"
                  onChange={(e) => setSelectedReport(e.target.value)}
                >
                  <MenuItem value="summary">Summary Report</MenuItem>
                  <MenuItem value="detailed">Detailed Breakdown</MenuItem>
                  <MenuItem value="monthly">Monthly Analysis</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => setExportDialogOpen(true)}
                disabled={loading}
                fullWidth
              >
                Export Data
              </Button>
            </Grid>
          </Grid>
          {loading && <LinearProgress sx={{ mt: 2 }} />}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {financialData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoney color="primary" />
                  Total Asset Value
                </Typography>
                <Typography variant="h4" color="primary">
                  {formatCurrency(financialData.totalValue)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {financialData.totalAssets} assets
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp color="success" />
                  VAT Amount
                </Typography>
                <Typography variant="h4" color="success.main">
                  {formatCurrency(financialData.totalVAT)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {formatPercentage((financialData.totalVAT && financialData.totalValue) ? (financialData.totalVAT / financialData.totalValue) * 100 : 0)} of total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingDown color="warning" />
                  Depreciation
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {formatCurrency(financialData.depreciation)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {formatPercentage((financialData.depreciation && financialData.totalValue) ? (financialData.depreciation / financialData.totalValue) * 100 : 0)} of total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Inventory color="info" />
                  Net Value
                </Typography>
                <Typography variant="h4" color="info.main">
                  {formatCurrency(financialData.netValue)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  After VAT & Depreciation
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Additional Metrics */}
      {financialData && financialData.additionalMetrics && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment color="primary" />
              Additional Financial Metrics
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h6" color="success.main">
                    {formatCurrency(financialData.additionalMetrics.totalDisposals)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Disposals
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h6" color="info.main">
                    {formatCurrency(financialData.additionalMetrics.totalAuctionProceeds)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Auction Proceeds
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h6" color="warning.main">
                    {formatCurrency(financialData.additionalMetrics.totalMaintenanceCost)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Maintenance Costs
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h6" color="primary.main">
                    {formatCurrency(financialData.additionalMetrics.totalCostWithVAT)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Cost with VAT
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      {financialData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PieChart color="primary" />
              Category Breakdown
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell align="right">VAT</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                    <TableCell align="center">Distribution</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {financialData.categoryBreakdown?.map((category: FinancialData['categoryBreakdown'][0]) => (
                    <TableRow key={category.category}>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {category.category}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={category.count} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="medium">
                          {formatCurrency(category.value)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main">
                          {formatCurrency(category.vat)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatPercentage(category.percentage)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
                          <Box
                            sx={{
                              width: `${category.percentage}%`,
                              height: 8,
                              bgcolor: 'primary.main'
                            }}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Monthly Analysis */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChart color="primary" />
            Monthly Financial Analysis
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Month</TableCell>
                  <TableCell align="right">Purchases</TableCell>
                  <TableCell align="right">Sales</TableCell>
                  <TableCell align="right">VAT</TableCell>
                  <TableCell align="right">Net Profit</TableCell>
                  <TableCell align="center">Trend</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {financialData?.monthlyData.map((month, index) => (
                  <TableRow key={month.month}>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {month.month}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="error.main">
                        {formatCurrency(month.purchases)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="success.main">
                        {formatCurrency(month.sales)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="info.main">
                        {formatCurrency(month.vat)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatCurrency(month.netProfit)}
                        color={month.netProfit >= 0 ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {index > 0 && (
                        <Chip
                          label={`${calculateGrowth(month.purchases, financialData.monthlyData[index - 1].purchases).toFixed(1)}%`}
                          color={calculateGrowth(month.purchases, financialData.monthlyData[index - 1].purchases) >= 0 ? 'success' : 'error'}
                          size="small"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
        loading={loading}
      />
    </Box>
  );
} 