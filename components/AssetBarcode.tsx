"use client";
import React, { useState } from "react";
import { Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import QrCodeIcon from "@mui/icons-material/QrCode";

interface AssetBarcodeProps {
  assetId: number;
  assetName: string;
  serialNumber?: string;
}

export default function AssetBarcode({ assetId, assetName, serialNumber }: AssetBarcodeProps) {
  const [showBarcodeDialog, setShowBarcodeDialog] = useState(false);
  const [barcodeFormat, setBarcodeFormat] = useState('CODE128');

  // Generate barcode data
  const barcodeData = `${assetId}-${serialNumber || 'N/A'}`;

  const handleDownloadBarcode = () => {
    // This would integrate with a barcode generation library
    // For now, we'll create a simple text representation
    const barcodeText = `Barcode: ${barcodeData}\nFormat: ${barcodeFormat}\nAsset: ${assetName}`;
    const blob = new Blob([barcodeText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.download = `asset-${assetId}-barcode.txt`;
    downloadLink.href = url;
    downloadLink.click();
    URL.revokeObjectURL(url);
  };

  const generateBarcodeSVG = () => {
    // Simple barcode representation using SVG
    const bars = barcodeData.split('').map((char, index) => {
      const code = char.charCodeAt(0);
      const height = 20 + (code % 20);
      return (
        <rect
          key={index}
          x={index * 3}
          y={20 - height}
          width="2"
          height={height}
          fill="black"
        />
      );
    });

    return (
      <svg width="300" height="60" viewBox="0 0 300 60">
        <text x="150" y="15" textAnchor="middle" fontSize="12" fill="black">
          {barcodeData}
        </text>
        <g transform="translate(10, 20)">
          {bars}
        </g>
        <text x="150" y="55" textAnchor="middle" fontSize="10" fill="black">
          {assetName}
        </text>
      </svg>
    );
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Asset Barcode
      </Typography>
      
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Box sx={{ mb: 2 }}>
          {generateBarcodeSVG()}
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Asset ID: {assetId}
          </Typography>
          {serialNumber && (
            <Typography variant="body2" color="text.secondary">
              Serial: {serialNumber}
            </Typography>
          )}
        </Box>
        
        <Box display="flex" gap={1} justifyContent="center">
          <Button
            size="small"
            startIcon={<QrCodeIcon />}
            onClick={() => setShowBarcodeDialog(true)}
          >
            View Details
          </Button>
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            variant="outlined"
            onClick={handleDownloadBarcode}
          >
            Download
          </Button>
        </Box>
      </Paper>

      {/* Barcode Details Dialog */}
      <Dialog open={showBarcodeDialog} onClose={() => setShowBarcodeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Asset Barcode Details</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            {generateBarcodeSVG()}
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>Barcode Information</Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Asset ID:</strong> {assetId}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Asset Name:</strong> {assetName}
            </Typography>
            {serialNumber && (
              <Typography variant="body2" color="text.secondary">
                <strong>Serial Number:</strong> {serialNumber}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              <strong>Barcode Data:</strong> {barcodeData}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Generated:</strong> {new Date().toLocaleString()}
            </Typography>
          </Box>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Barcode Format</InputLabel>
            <Select
              value={barcodeFormat}
              label="Barcode Format"
              onChange={(e) => setBarcodeFormat(e.target.value)}
            >
              <MenuItem value="CODE128">Code 128</MenuItem>
              <MenuItem value="CODE39">Code 39</MenuItem>
              <MenuItem value="EAN13">EAN-13</MenuItem>
              <MenuItem value="UPC">UPC</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Barcode Data:</strong>
            </Typography>
            <Typography variant="caption" display="block" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
              {barcodeData}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBarcodeDialog(false)}>Close</Button>
          <Button onClick={handleDownloadBarcode} startIcon={<DownloadIcon />}>
            Download Barcode
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 