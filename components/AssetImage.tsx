"use client";
import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface AssetImageProps {
  imageUrl?: string | null;
  alt: string;
  maxWidth?: number;
  maxHeight?: number;
  borderRadius?: number;
  showPlaceholder?: boolean;
}

// Utility function to construct proper image URL
const getImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `http://localhost:8000${imageUrl}`;
};

export default function AssetImage({ 
  imageUrl, 
  alt, 
  maxWidth = 300, 
  maxHeight = 200, 
  borderRadius = 8,
  showPlaceholder = true 
}: AssetImageProps) {
  const properImageUrl = getImageUrl(imageUrl);

  if (!properImageUrl) {
    if (!showPlaceholder) return null;
    return (
      <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.100' }}>
        <Typography color="text.secondary">No image available</Typography>
      </Paper>
    );
  }

  return (
    <img 
      src={properImageUrl}
      alt={alt}
      style={{ 
        width: '100%', 
        maxWidth: `${maxWidth}px`, 
        maxHeight: `${maxHeight}px`,
        height: 'auto',
        borderRadius: `${borderRadius}px`,
        objectFit: 'contain'
      }} 
      onError={(e) => {
        console.error('Failed to load image:', properImageUrl);
        if (showPlaceholder) {
          e.currentTarget.style.display = 'none';
          // Create placeholder element
          const placeholder = document.createElement('div');
          placeholder.innerHTML = '<div style="padding: 20px; text-align: center; background-color: #f5f5f5; border-radius: 8px; color: #666;">Image not available</div>';
          e.currentTarget.parentNode?.appendChild(placeholder.firstChild!);
        }
      }}
    />
  );
} 