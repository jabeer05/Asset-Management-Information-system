"use client";
import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent } from "@mui/lab";
import { SwapHoriz, Build, Warning, CheckCircle } from "@mui/icons-material";

interface HistoryEvent {
  id: number;
  type: 'transfer' | 'maintenance' | 'status_change' | 'registration';
  title: string;
  description: string;
  date: string;
  user: string;
}

interface AssetHistoryProps {
  assetId: number;
}

export default function AssetHistory({ assetId }: AssetHistoryProps) {
  // Mock history data - replace with API call
  const historyEvents: HistoryEvent[] = [
    {
      id: 1,
      type: 'registration',
      title: 'Asset Registered',
      description: 'Asset was registered in the system',
      date: '2024-01-15',
      user: 'John Doe'
    },
    {
      id: 2,
      type: 'transfer',
      title: 'Asset Transferred',
      description: 'Transferred from HQ to Branch Office',
      date: '2024-02-01',
      user: 'Jane Smith'
    },
    {
      id: 3,
      type: 'maintenance',
      title: 'Scheduled Maintenance',
      description: 'Regular maintenance performed - all systems operational',
      date: '2024-02-15',
      user: 'Mike Johnson'
    },
    {
      id: 4,
      type: 'status_change',
      title: 'Status Updated',
      description: 'Status changed from Active to Maintenance',
      date: '2024-03-01',
      user: 'Admin User'
    },
    {
      id: 5,
      type: 'maintenance',
      title: 'Maintenance Completed',
      description: 'Hardware upgrade completed successfully',
      date: '2024-03-05',
      user: 'Mike Johnson'
    },
    {
      id: 6,
      type: 'status_change',
      title: 'Status Updated',
      description: 'Status changed from Maintenance to Active',
      date: '2024-03-05',
      user: 'Admin User'
    }
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'transfer':
        return <SwapHoriz />;
      case 'maintenance':
        return <Build />;
      case 'status_change':
        return <Warning />;
      case 'registration':
        return <CheckCircle />;
      default:
        return <CheckCircle />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'transfer':
        return 'primary';
      case 'maintenance':
        return 'warning';
      case 'status_change':
        return 'info';
      case 'registration':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Asset History
      </Typography>
      
      <Paper sx={{ p: 2 }}>
        <Timeline position="alternate">
          {historyEvents.map((event, index) => (
            <TimelineItem key={event.id}>
              <TimelineOppositeContent sx={{ m: 'auto 0' }} variant="body2" color="text.secondary">
                {new Date(event.date).toLocaleDateString()}
              </TimelineOppositeContent>
              
              <TimelineSeparator>
                <TimelineDot color={getEventColor(event.type) as any}>
                  {getEventIcon(event.type)}
                </TimelineDot>
                {index < historyEvents.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              
              <TimelineContent sx={{ py: '12px', px: 2 }}>
                <Typography variant="h6" component="span">
                  {event.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {event.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  By: {event.user}
                </Typography>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </Paper>
    </Box>
  );
} 