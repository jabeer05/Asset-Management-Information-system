"use client";
import React, { useState } from 'react';
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  Grid,
  Typography,
  Chip,
  Box,
  Divider,
  Alert,
  LinearProgress
} from '@mui/material';
import SSRSafeDialog from './SSRSafeDialog';
import { Download, FilterList, Close } from '@mui/icons-material';

interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel';
  timeFilter: 'all' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: string;
  endDate?: string;
  categories: string[];
  assetNames: string[];
  includeVAT: boolean;
  includeDepreciation: boolean;
  includeImages: boolean;
  columns: string[];
}

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  loading?: boolean;
}

const availableCategories = ["Electronics", "Furniture", "Vehicle", "Equipment", "Other"];
const availableColumns = [
  "ID", "Name", "Description", "Category", "Location", "Status", 
  "Quantity", "Cost Per Unit", "Total Cost", "VAT Amount", "Total with VAT",
  "Purchase Date", "Serial Number", "Depreciation", "Net Value"
];

export default function ExportDialog({ open, onClose, onExport, loading = false }: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    timeFilter: 'all',
    categories: [],
    assetNames: [],
    includeVAT: true,
    includeDepreciation: true,
    includeImages: false,
    columns: availableColumns
  });

  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const handleExport = () => {
    const exportOptions = {
      ...options,
      startDate: options.timeFilter === 'custom' ? customDateRange.startDate : undefined,
      endDate: options.timeFilter === 'custom' ? customDateRange.endDate : undefined
    };
    onExport(exportOptions);
  };

  const handleCategoryChange = (category: string) => {
    setOptions(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleColumnChange = (column: string) => {
    setOptions(prev => ({
      ...prev,
      columns: prev.columns.includes(column)
        ? prev.columns.filter(c => c !== column)
        : [...prev.columns, column]
    }));
  };

  const getTimeFilterLabel = (filter: string) => {
    switch (filter) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'quarter': return 'This Quarter';
      case 'year': return 'This Year';
      case 'custom': return 'Custom Range';
      default: return 'All Time';
    }
  };

  return (
    <SSRSafeDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Download color="primary" />
          <Typography variant="h6">Export Data</Typography>
          <Typography variant="body2" color="text.secondary" style={{ marginLeft: 'auto' }}>
            Customize your export
          </Typography>
        </div>
        <Alert severity="info" sx={{ mb: 3 }}>
          Select your export preferences to generate a customized report
        </Alert>

        <Grid container spacing={3}>
          {/* Export Format */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={options.format}
                label="Export Format"
                onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value as any }))}
              >
                <MenuItem value="csv">CSV (Excel compatible)</MenuItem>
                <MenuItem value="excel">Excel (.xlsx)</MenuItem>
                <MenuItem value="pdf">PDF Report</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Time Filter */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={options.timeFilter}
                label="Time Period"
                onChange={(e) => setOptions(prev => ({ ...prev, timeFilter: e.target.value as any }))}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="quarter">This Quarter</MenuItem>
                <MenuItem value="year">This Year</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Custom Date Range */}
          {options.timeFilter === 'custom' && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={customDateRange.startDate}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={customDateRange.endDate}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}

          {/* Categories Filter */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList color="primary" />
              Filter by Category
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availableCategories.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  onClick={() => handleCategoryChange(category)}
                  color={options.categories.includes(category) ? 'primary' : 'default'}
                  variant={options.categories.includes(category) ? 'filled' : 'outlined'}
                  clickable
                />
              ))}
            </Box>
            {options.categories.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                All categories will be included
              </Typography>
            )}
          </Grid>

          {/* Asset Names Filter */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Filter by Asset Name
            </Typography>
            <TextField
              fullWidth
              label="Asset names (comma-separated)"
              placeholder="e.g., Laptop, Chair, Car"
              value={options.assetNames.join(', ')}
              onChange={(e) => setOptions(prev => ({ 
                ...prev, 
                assetNames: e.target.value.split(',').map(s => s.trim()).filter(s => s)
              }))}
              helperText="Leave empty to include all assets"
            />
          </Grid>

          <Divider sx={{ width: '100%' }} />

          {/* Export Options */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Export Options
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.includeVAT}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeVAT: e.target.checked }))}
                    />
                  }
                  label="Include VAT calculations"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.includeDepreciation}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeDepreciation: e.target.checked }))}
                    />
                  }
                  label="Include depreciation data"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.includeImages}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeImages: e.target.checked }))}
                    />
                  }
                  label="Include asset images (PDF only)"
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Column Selection */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Select Columns to Export
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availableColumns.map((column) => (
                <Chip
                  key={column}
                  label={column}
                  onClick={() => handleColumnChange(column)}
                  color={options.columns.includes(column) ? 'primary' : 'default'}
                  variant={options.columns.includes(column) ? 'filled' : 'outlined'}
                  clickable
                  size="small"
                />
              ))}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {options.columns.length} of {availableColumns.length} columns selected
            </Typography>
          </Grid>
        </Grid>

        {loading && <LinearProgress sx={{ mt: 2 }} />}
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <Button onClick={onClose} startIcon={<Close />}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            variant="contained"
            startIcon={<Download />}
            disabled={loading || options.columns.length === 0}
          >
            {loading ? 'Exporting...' : `Export ${options.format.toUpperCase()}`}
          </Button>
        </div>
      </div>
    </SSRSafeDialog>
  );
} 