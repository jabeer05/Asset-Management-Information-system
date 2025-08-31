"use client";
import React from 'react';
import { 
  Card as MuiCard, 
  CardProps as MuiCardProps,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Box,
  Divider,
  Chip,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import { MoreVert, Star, StarBorder } from '@mui/icons-material';

interface CardProps extends Omit<MuiCardProps, 'variant'> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  title?: string;
  subtitle?: string;
  avatar?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  tags?: string[];
  featured?: boolean;
  onFavorite?: () => void;
  isFavorite?: boolean;
  showMenu?: boolean;
  onMenuClick?: () => void;
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    variant = 'default',
    title,
    subtitle,
    avatar,
    actions,
    footer,
    tags = [],
    featured = false,
    onFavorite,
    isFavorite = false,
    showMenu = false,
    onMenuClick,
    children,
    sx,
    ...props 
  }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'elevated':
          return {
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
            border: 'none',
            '&:hover': {
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 12px rgba(0, 0, 0, 0.1)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s ease'
          };
        case 'outlined':
          return {
            boxShadow: 'none',
            border: '2px solid',
            borderColor: 'grey.200',
            '&:hover': {
              borderColor: 'primary.main',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.1)',
            },
            transition: 'all 0.3s ease'
          };
        case 'filled':
          return {
            boxShadow: 'none',
            backgroundColor: 'grey.50',
            border: '1px solid',
            borderColor: 'grey.200',
            '&:hover': {
              backgroundColor: 'grey.100',
            },
            transition: 'all 0.3s ease'
          };
        default:
          return {
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
            border: '1px solid',
            borderColor: 'grey.200',
            '&:hover': {
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
            },
            transition: 'all 0.3s ease'
          };
      }
    };

    return (
      <MuiCard
        ref={ref}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          ...getVariantStyles(),
          ...sx
        }}
        {...props}
      >
        {/* Featured badge */}
        {featured && (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 1,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              fontSize: '0.75rem',
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
            }}
          >
            Featured
          </Box>
        )}

        {/* Header */}
        {(title || subtitle || avatar || actions || showMenu || onFavorite) && (
          <CardHeader
            avatar={avatar}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {onFavorite && (
                  <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                    <IconButton
                      size="small"
                      onClick={onFavorite}
                      sx={{
                        color: isFavorite ? 'warning.main' : 'grey.400',
                        '&:hover': {
                          color: isFavorite ? 'warning.dark' : 'warning.main',
                          backgroundColor: 'warning.50'
                        }
                      }}
                    >
                      {isFavorite ? <Star /> : <StarBorder />}
                    </IconButton>
                  </Tooltip>
                )}
                {showMenu && (
                  <Tooltip title="More options">
                    <IconButton
                      size="small"
                      onClick={onMenuClick}
                      sx={{
                        color: 'grey.400',
                        '&:hover': {
                          color: 'text.primary',
                          backgroundColor: 'grey.50'
                        }
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </Tooltip>
                )}
                {actions}
              </Box>
            }
            title={
              title && (
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    lineHeight: 1.3,
                    letterSpacing: '-0.025em'
                  }}
                >
                  {title}
                </Typography>
              )
            }
            subheader={
              subtitle && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    mt: 0.5,
                    lineHeight: 1.5
                  }}
                >
                  {subtitle}
                </Typography>
              )
            }
            sx={{
              pb: tags.length > 0 ? 1 : 2,
              '& .MuiCardHeader-action': {
                margin: 0
              }
            }}
          />
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  sx={{
                    backgroundColor: 'primary.50',
                    color: 'primary.main',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    '&:hover': {
                      backgroundColor: 'primary.100'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Content */}
        <CardContent sx={{ pt: tags.length > 0 ? 0 : undefined }}>
          {children}
        </CardContent>

        {/* Footer */}
        {footer && (
          <>
            <Divider />
            <CardActions sx={{ p: 2, pt: 1.5 }}>
              {footer}
            </CardActions>
          </>
        )}
      </MuiCard>
    );
  }
);

Card.displayName = 'Card';

export default Card;

// Specialized card components
export const ElevatedCard = React.forwardRef<HTMLDivElement, Omit<CardProps, 'variant'>>(
  (props, ref) => <Card ref={ref} variant="elevated" {...props} />
);

export const OutlinedCard = React.forwardRef<HTMLDivElement, Omit<CardProps, 'variant'>>(
  (props, ref) => <Card ref={ref} variant="outlined" {...props} />
);

export const FilledCard = React.forwardRef<HTMLDivElement, Omit<CardProps, 'variant'>>(
  (props, ref) => <Card ref={ref} variant="filled" {...props} />
);

// Stat card for dashboard
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, subtitle, icon, trend, color = 'primary' }, ref) => {
    const getColorStyles = () => {
      switch (color) {
        case 'success':
          return {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            iconBg: 'success.50',
            iconColor: 'success.main'
          };
        case 'warning':
          return {
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            iconBg: 'warning.50',
            iconColor: 'warning.main'
          };
        case 'error':
          return {
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            iconBg: 'error.50',
            iconColor: 'error.main'
          };
        case 'info':
          return {
            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            iconBg: 'info.50',
            iconColor: 'info.main'
          };
        default:
          return {
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            iconBg: 'primary.50',
            iconColor: 'primary.main'
          };
      }
    };

    const colorStyles = getColorStyles();

    return (
      <Card
        ref={ref}
        variant="elevated"
        sx={{
          background: colorStyles.background,
          color: 'white',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.9,
                  fontWeight: 500,
                  mb: 1
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  lineHeight: 1.2,
                  letterSpacing: '-0.025em',
                  mb: subtitle ? 1 : 0
                }}
              >
                {value}
              </Typography>
              {subtitle && (
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.8,
                    fontWeight: 500
                  }}
                >
                  {subtitle}
                </Typography>
              )}
              {trend && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: trend.isPositive ? '#10b981' : '#ef4444'
                    }}
                  >
                    {trend.isPositive ? '+' : ''}{trend.value}%
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    from last month
                  </Typography>
                </Box>
              )}
            </Box>
            {icon && (
              <Box
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 2,
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {icon}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }
);

StatCard.displayName = 'StatCard'; 