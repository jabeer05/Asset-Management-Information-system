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
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import {
  Security,
  Edit,
  ArrowBack,
  CheckCircle,
  Error,
  Warning,
  Info,
  Person,
  AccessTime,
  LocationOn,
  Computer,
  Lock,
  Visibility,
  Download,
  Timeline as TimelineIcon,
  ErrorOutline
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface AuditRecord {
  id: number;
  timestamp: string;
  user_id: number;
  username: string;
  user_email: string;
  action: string;
  action_type: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'export' | 'import' | 'approve' | 'reject';
  severity: 'low' | 'medium' | 'high' | 'critical';
  module: 'assets' | 'users' | 'maintenance' | 'transfers' | 'auctions' | 'disposals' | 'reports' | 'system' | 'audit';
  entity_type: string;
  entity_id?: number;
  entity_name?: string;
  ip_address: string;
  user_agent: string;
  location?: string;
  details: string;
  changes?: {
    field: string;
    old_value: string;
    new_value: string;
  }[];
  status: 'success' | 'failure' | 'warning' | 'info';
  session_id?: string;
}

interface AuditDetailProps {
  auditId: number;
}

const mockAuditRecord: AuditRecord = {
  id: 1,
  timestamp: "2024-02-15T10:30:00",
  user_id: 1,
  username: "admin",
  user_email: "admin@company.com",
  action: "Asset created",
  action_type: "create",
  severity: "medium",
  module: "assets",
  entity_type: "asset",
  entity_id: 123,
  entity_name: "Laptop Dell XPS 15",
  ip_address: "192.168.1.100",
  user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  location: "Lagos HQ",
  details: "New laptop asset added to inventory with specifications: Dell XPS 15, 16GB RAM, 512GB SSD, Intel i7 processor. Asset assigned to IT department for software development team use.",
  changes: [
    { field: "asset_name", old_value: "", new_value: "Laptop Dell XPS 15" },
    { field: "category", old_value: "", new_value: "Electronics" },
    { field: "purchase_cost", old_value: "", new_value: "₦450,000" },
    { field: "location", old_value: "", new_value: "IT Department" },
    { field: "status", old_value: "", new_value: "In Use" },
    { field: "assigned_to", old_value: "", new_value: "Software Development Team" }
  ],
  status: "success",
  session_id: "sess_123456789"
};

const mockRelatedAuditRecords = [
  {
    id: 2,
    timestamp: "2024-02-15T11:15:00",
    username: "manager1",
    action: "Asset updated",
    action_type: "update",
    severity: "medium",
    module: "assets",
    entity_name: "Laptop Dell XPS 15",
    status: "success"
  },
  {
    id: 3,
    timestamp: "2024-02-15T12:30:00",
    username: "user1",
    action: "Asset viewed",
    action_type: "view",
    severity: "low",
    module: "assets",
    entity_name: "Laptop Dell XPS 15",
    status: "success"
  },
  {
    id: 4,
    timestamp: "2024-02-15T14:00:00",
    username: "admin",
    action: "Maintenance scheduled",
    action_type: "create",
    severity: "low",
    module: "maintenance",
    entity_name: "Laptop Dell XPS 15",
    status: "success"
  }
];

export default function AuditDetail({ auditId }: AuditDetailProps) {
  const router = useRouter();
  const record = mockAuditRecord; // In real app, fetch by ID

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'success';
      case 'medium': return 'info';
      case 'high': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'create': return <CheckCircle />;
      case 'update': return <Edit />;
      case 'delete': return <ErrorOutline />;
      case 'login': return <Lock />;
      case 'logout': return <Lock />;
      case 'view': return <Visibility />;
      case 'export': return <Download />;
      case 'import': return <Download />;
      case 'approve': return <CheckCircle />;
      case 'reject': return <ErrorOutline />;
      default: return <Info />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'failure': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const getModuleColor = (module: string) => {
    switch (module) {
      case 'assets': return 'primary';
      case 'users': return 'secondary';
      case 'maintenance': return 'info';
      case 'transfers': return 'success';
      case 'auctions': return 'warning';
      case 'disposals': return 'error';
      case 'reports': return 'default';
      case 'system': return 'default';
      case 'audit': return 'default';
      default: return 'default';
    }
  };

  const getSecurityAnalysis = () => {
    const analysis = {
      riskLevel: record.severity === 'critical' || record.severity === 'high' ? 'High' : 'Low',
      suspiciousActivity: record.status === 'failure' || record.severity === 'critical',
      locationMismatch: false, // In real app, check against user's usual locations
      timeAnomaly: false, // In real app, check for unusual activity times
      recommendations: [] as string[]
    };

    if (record.severity === 'critical') {
      analysis.recommendations.push('Immediate security review required');
      analysis.recommendations.push('Consider suspending user account');
      analysis.recommendations.push('Investigate for potential breach');
    }

    if (record.status === 'failure') {
      analysis.recommendations.push('Review failed action for security implications');
      analysis.recommendations.push('Check for unauthorized access attempts');
    }

    if (record.action_type === 'login' && record.status === 'failure') {
      analysis.recommendations.push('Monitor for brute force attacks');
      analysis.recommendations.push('Consider implementing account lockout');
    }

    return analysis;
  };

  const securityAnalysis = getSecurityAnalysis();

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
          <Security color="primary" />
          Audit Record #{record.id}
        </Typography>
      </Box>

      {/* Security Alerts */}
      {securityAnalysis.suspiciousActivity && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Suspicious activity detected. Risk level: {securityAnalysis.riskLevel}
        </Alert>
      )}

      {record.severity === 'critical' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Critical security event detected. Immediate action required.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Information */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Event Details
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Action
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {record.action}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Action Type
                  </Typography>
                  <Chip
                    icon={getActionTypeIcon(record.action_type)}
                    label={record.action_type.charAt(0).toUpperCase() + record.action_type.slice(1)}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Severity
                  </Typography>
                  <Chip
                    label={record.severity.charAt(0).toUpperCase() + record.severity.slice(1)}
                    color={getSeverityColor(record.severity) as any}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    color={getStatusColor(record.status) as any}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Module
                  </Typography>
                  <Chip
                    label={record.module.charAt(0).toUpperCase() + record.module.slice(1)}
                    color={getModuleColor(record.module) as any}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Entity
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {record.entity_name || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Details
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {record.details}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Changes Made */}
          {record.changes && record.changes.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Changes Made
                </Typography>
                
                <Timeline>
                  {record.changes.map((change, index) => (
                    <TimelineItem key={index}>
                      <TimelineSeparator>
                        <TimelineDot color="primary" />
                        {index < record.changes!.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {change.field}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Old Value
                            </Typography>
                            <Typography variant="body2" color="error.main">
                              {change.old_value || 'N/A'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              New Value
                            </Typography>
                            <Typography variant="body2" color="success.main">
                              {change.new_value || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </CardContent>
            </Card>
          )}

          {/* Related Activity */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Related Activity
              </Typography>
              
              <List>
                {mockRelatedAuditRecords.map((relatedRecord, index) => (
                  <ListItem key={relatedRecord.id} divider={index < mockRelatedAuditRecords.length - 1}>
                    <ListItemIcon>
                      {getActionTypeIcon(relatedRecord.action_type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={relatedRecord.action}
                      secondary={`${relatedRecord.username} • ${formatDateTime(relatedRecord.timestamp)}`}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={relatedRecord.severity}
                        size="small"
                        color={getSeverityColor(relatedRecord.severity) as any}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar Information */}
        <Grid item xs={12} md={4}>
          {/* User Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Information
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {record.username.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {record.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {record.user_email}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  User ID
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  #{record.user_id}
                </Typography>
              </Box>

              {record.session_id && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Session ID
                  </Typography>
                  <Typography variant="body1" fontFamily="monospace" fontSize="0.8rem">
                    {record.session_id}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Technical Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Technical Information
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  IP Address
                </Typography>
                <Typography variant="body1" fontFamily="monospace" fontWeight="medium">
                  {record.ip_address}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {record.location || 'Unknown'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  User Agent
                </Typography>
                <Typography variant="body2" fontFamily="monospace" fontSize="0.7rem">
                  {record.user_agent}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Timestamp
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDateTime(record.timestamp)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Security Analysis */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security Analysis
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Risk Level
                </Typography>
                <Chip
                  label={securityAnalysis.riskLevel}
                  color={securityAnalysis.riskLevel === 'High' ? 'error' : 'success'}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Suspicious Activity
                </Typography>
                <Typography variant="body1" fontWeight="medium" color={securityAnalysis.suspiciousActivity ? 'error.main' : 'success.main'}>
                  {securityAnalysis.suspiciousActivity ? 'Yes' : 'No'}
                </Typography>
              </Box>

              {securityAnalysis.recommendations.length > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Recommendations
                  </Typography>
                  <List dense>
                    {securityAnalysis.recommendations.map((rec, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <Warning fontSize="small" color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={rec}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Person />}
                  onClick={() => router.push(`/users/${record.user_id}`)}
                  fullWidth
                >
                  View User Profile
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<TimelineIcon />}
                  fullWidth
                >
                  View User Activity
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  fullWidth
                >
                  Export Details
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 