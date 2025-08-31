"use client";
import React, { useState } from "react";
import { Box, Typography, Button, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import QRCode from "react-qr-code";
import DownloadIcon from "@mui/icons-material/Download";
import QrCodeIcon from "@mui/icons-material/QrCode";

interface AssetQRCodeProps {
  assetId: number;
  assetName: string;
  serialNumber?: string;
}

export default function AssetQRCode({ assetId, assetName, serialNumber }: AssetQRCodeProps) {
  const [showQRDialog, setShowQRDialog] = useState(false);

  // Generate QR code data
  const qrData = JSON.stringify({
    assetId,
    assetName,
    serialNumber,
    timestamp: new Date().toISOString(),
    system: "FAMIS"
  });

  const handleDownloadQR = () => {
    const svg = document.getElementById("asset-qr-code");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `asset-${assetId}-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Asset QR Code
      </Typography>
      
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Box sx={{ mb: 2 }}>
          <QRCode
            id="asset-qr-code"
            value={qrData}
            size={128}
            level="M"
            style={{ margin: '0 auto' }}
          />
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
            onClick={() => setShowQRDialog(true)}
          >
            View Details
          </Button>
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            variant="outlined"
            onClick={handleDownloadQR}
          >
            Download
          </Button>
        </Box>
      </Paper>

      {/* QR Code Details Dialog */}
      <Dialog open={showQRDialog} onClose={() => setShowQRDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Asset QR Code Details</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <QRCode
              value={qrData}
              size={200}
              level="M"
              style={{ margin: '0 auto' }}
            />
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>Asset Information</Typography>
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
              <strong>Generated:</strong> {new Date().toLocaleString()}
            </Typography>
          </Box>
          
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>QR Code Data:</strong>
            </Typography>
            <Typography variant="caption" display="block" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
              {qrData}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQRDialog(false)}>Close</Button>
          <Button onClick={handleDownloadQR} startIcon={<DownloadIcon />}>
            Download QR Code
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 