"use client";
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Gavel,
  Timer,
  Edit,
  ArrowBack,
  CheckCircle,
  Pending,
  Error,
  AttachMoney,
  People
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface Bid {
  id: number;
  bidder_name: string;
  bid_amount: number;
  bid_date: string;
  bidder_email?: string;
}

interface AuctionRecord {
  id: number;
  asset_id: number;
  asset_name: string;
  asset_category: string;
  auction_type: 'public' | 'private' | 'online' | 'live';
  status: 'draft' | 'published' | 'bidding_open' | 'bidding_closed' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
  reserve_price: number;
  starting_bid: number;
  current_bid?: number;
  winning_bid?: number;
  winning_bidder?: string;
  total_bids: number;
  total_bidders: number;
  description: string;
  location?: string;
  auctioneer?: string;
  notes?: string;
  images?: string[];
}

interface AuctionDetailProps {
  auctionId: number;
}

const mockBids: Bid[] = [
  {
    id: 1,
    bidder_name: "John Smith",
    bid_amount: 180000,
    bid_date: "2024-01-20T14:30:00",
    bidder_email: "john.smith@email.com"
  },
  {
    id: 2,
    bidder_name: "Sarah Johnson",
    bid_amount: 175000,
    bid_date: "2024-01-20T14:25:00",
    bidder_email: "sarah.j@email.com"
  },
  {
    id: 3,
    bidder_name: "Mike Wilson",
    bid_amount: 170000,
    bid_date: "2024-01-20T14:20:00",
    bidder_email: "mike.w@email.com"
  },
  {
    id: 4,
    bidder_name: "Lisa Brown",
    bid_amount: 165000,
    bid_date: "2024-01-20T14:15:00",
    bidder_email: "lisa.b@email.com"
  },
  {
    id: 5,
    bidder_name: "David Clark",
    bid_amount: 160000,
    bid_date: "2024-01-20T14:10:00",
    bidder_email: "david.c@email.com"
  }
];

const mockAuctionRecord: AuctionRecord = {
  id: 1,
  asset_id: 1,
  asset_name: "Laptop",
  asset_category: "Electronics",
  auction_type: "online",
  status: "completed",
  start_date: "2024-01-15",
  end_date: "2024-01-20",
  reserve_price: 150000,
  starting_bid: 100000,
  current_bid: 180000,
  winning_bid: 180000,
  winning_bidder: "John Smith",
  total_bids: 12,
  total_bidders: 8,
  description: "High-performance laptop for business use. This laptop features the latest processor, 16GB RAM, 512GB SSD, and comes with all original accessories. Perfect for business professionals and power users.",
  location: "Online Auction",
  auctioneer: "Tech Auctions Ltd",
  notes: "Laptop sold successfully above reserve price. All accessories included in the sale."
};

export default function AuctionDetail({ auctionId }: AuctionDetailProps) {
  const router = useRouter();
  const record = mockAuctionRecord; // In real app, fetch by ID

  const formatCurrency = (value: number) => {
    return `₦${value.toLocaleString('en-NG')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'bidding_open': return 'info';
      case 'published': return 'primary';
      case 'bidding_closed': return 'warning';
      case 'draft': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'public': return 'primary';
      case 'private': return 'secondary';
      case 'online': return 'info';
      case 'live': return 'success';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'public': return <Gavel />;
      case 'private': return <Gavel />;
      case 'online': return <Gavel />;
      case 'live': return <Gavel />;
      default: return <Gavel />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'bidding_open': return <Timer />;
      case 'published': return <CheckCircle />;
      case 'bidding_closed': return <Pending />;
      case 'draft': return <Pending />;
      case 'cancelled': return <Error />;
      default: return <Pending />;
    }
  };

  const isAuctionActive = () => {
    const now = new Date();
    const startDate = new Date(record.start_date);
    const endDate = new Date(record.end_date);
    return now >= startDate && now <= endDate && record.status === 'bidding_open';
  };

  const isAuctionEnded = () => {
    const now = new Date();
    const endDate = new Date(record.end_date);
    return now > endDate;
  };

  const getTimeRemaining = () => {
    if (isAuctionEnded()) return "Auction ended";
    
    const now = new Date();
    const endDate = new Date(record.end_date);
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return "Auction ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getTypeIcon(record.auction_type)}
          Auction #{record.id}
        </Typography>
        <Box sx={{ ml: 'auto' }}>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => router.push(`/auctions/${record.id}/edit`)}
          >
            Edit
          </Button>
        </Box>
      </Box>

      {/* Status Alert */}
      {isAuctionActive() && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Timer />
            <Typography variant="body2">
              {getTimeRemaining()}
            </Typography>
          </Box>
        </Alert>
      )}

      {record.status === 'completed' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Auction completed successfully! Winning bid: {formatCurrency(record.winning_bid || 0)} by {record.winning_bidder}
        </Alert>
      )}

      {record.status === 'cancelled' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          This auction has been cancelled.
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        {/* Main Information */}
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Auction Details
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Asset
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {record.asset_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {record.asset_category}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Auction Type
                  </Typography>
                  <Chip
                    icon={getTypeIcon(record.auction_type)}
                    label={record.auction_type.charAt(0).toUpperCase() + record.auction_type.slice(1)}
                    color={getTypeColor(record.auction_type) as any}
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    icon={getStatusIcon(record.status)}
                    label={record.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(record.status) as any}
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Current Bid
                  </Typography>
                  <Typography variant="h5" color="primary.main" fontWeight="bold">
                    {record.current_bid ? formatCurrency(record.current_bid) : 'No bids yet'}
                  </Typography>
                </Box>

                <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                  <Typography variant="body2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {record.description}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Bidding History */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bidding History
              </Typography>
              
              {mockBids.length > 0 ? (
                <List>
                  {mockBids.map((bid, index) => (
                    <ListItem key={bid.id} divider={index < mockBids.length - 1}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: index === 0 ? 'success.main' : 'grey.300' }}>
                          {bid.bidder_name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight="medium">
                              {bid.bidder_name}
                            </Typography>
                            {index === 0 && (
                              <Chip label="Winning" size="small" color="success" />
                            )}
                          </Typography>
                        }
                        secondary={formatDateTime(bid.bid_date)}
                      />
                      <ListItemSecondaryAction>
                        <Typography variant="h6" color="primary.main" fontWeight="bold">
                          {formatCurrency(bid.bid_amount)}
                        </Typography>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No bids yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Sidebar Information */}
        <Box>
          {/* Auction Schedule */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Auction Schedule
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Start Date
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDate(record.start_date)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  End Date
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDate(record.end_date)}
                </Typography>
              </Box>

              {isAuctionActive() && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Time Remaining
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" color="info.main">
                    {getTimeRemaining()}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Pricing Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pricing Information
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Reserve Price
                </Typography>
                <Typography variant="h5" color="primary.main" fontWeight="bold">
                  {formatCurrency(record.reserve_price)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Starting Bid
                </Typography>
                <Typography variant="h5" color="secondary.main" fontWeight="bold">
                  {formatCurrency(record.starting_bid)}
                </Typography>
              </Box>

              {record.winning_bid && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Winning Bid
                  </Typography>
                  <Typography variant="h5" color="success.main" fontWeight="bold">
                    {formatCurrency(record.winning_bid)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Auction Statistics */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Auction Statistics
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Bids
                </Typography>
                <Typography variant="h5" color="primary.main" fontWeight="bold">
                  {record.total_bids}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Bidders
                </Typography>
                <Typography variant="h5" color="secondary.main" fontWeight="bold">
                  {record.total_bidders}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Auction Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Auction Information
              </Typography>
              
              {record.location && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {record.location}
                  </Typography>
                </Box>
              )}

              {record.auctioneer && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Auctioneer
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {record.auctioneer}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {record.notes && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Additional Notes
                </Typography>
                <Typography variant="body2">
                  {record.notes}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
} 