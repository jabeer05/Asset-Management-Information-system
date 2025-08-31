"use client";
import React from 'react';
import { Box, Container, Paper, Typography, Breadcrumbs, Link, Skeleton } from '@mui/material';
import { usePathname } from 'next/navigation';
import { Home, NavigateNext } from '@mui/icons-material';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  loading?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  padding?: number;
  showBreadcrumbs?: boolean;
}

export default function PageLayout({
  children,
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  loading = false,
  maxWidth = 'xl',
  padding = 3,
  showBreadcrumbs = true
}: PageLayoutProps) {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname if not provided
  const generateBreadcrumbs = () => {
    if (breadcrumbs.length > 0) return breadcrumbs;
    
    const paths = pathname.split('/').filter(Boolean);
    const generated = [
      { label: 'Home', href: '/dashboard' }
    ];
    
    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      generated.push({
        label,
        href: index === paths.length - 1 ? undefined : currentPath
      });
    });
    
    return generated;
  };

  const finalBreadcrumbs = generateBreadcrumbs();

  if (loading) {
    return (
      <Container maxWidth={maxWidth} sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width="60%" height={40} />
          <Skeleton variant="text" width="40%" height={24} sx={{ mt: 1 }} />
        </Box>
        <Paper sx={{ p: padding }}>
          <Skeleton variant="rectangular" height={400} />
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth={maxWidth} sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      {showBreadcrumbs && (
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs 
            separator={<NavigateNext fontSize="small" />}
            aria-label="breadcrumb"
            sx={{ 
              '& .MuiBreadcrumbs-separator': {
                color: 'text.secondary'
              }
            }}
          >
            {finalBreadcrumbs.map((crumb, index) => (
              <Link
                key={index}
                color={index === finalBreadcrumbs.length - 1 ? 'text.primary' : 'text.secondary'}
                href={crumb.href}
                underline="hover"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontWeight: index === finalBreadcrumbs.length - 1 ? 600 : 500,
                  '&:hover': {
                    color: 'primary.main'
                  }
                }}
              >
                {index === 0 && <Home sx={{ fontSize: 16 }} />}
                {crumb.label}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>
      )}

      {/* Header */}
      {(title || subtitle || actions) && (
        <Box sx={{ 
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2
        }}>
          <Box sx={{ flex: 1 }}>
            {title && (
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: subtitle ? 1 : 0,
                  letterSpacing: '-0.025em'
                }}
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'text.secondary',
                  lineHeight: 1.6
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {actions && (
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              flexWrap: 'wrap',
              justifyContent: 'flex-end'
            }}>
              {actions}
            </Box>
          )}
        </Box>
      )}

      {/* Content */}
      <Paper 
        elevation={0}
        sx={{ 
          p: padding,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'grey.200',
          backgroundColor: 'background.paper',
          minHeight: '60vh'
        }}
      >
        {children}
      </Paper>
    </Container>
  );
}

// Specialized layout components for common patterns
export function CardLayout({ children, ...props }: PageLayoutProps) {
  return (
    <PageLayout 
      {...props}
      padding={2}
    >
      {children}
    </PageLayout>
  );
}

export function FormLayout({ children, ...props }: PageLayoutProps) {
  return (
    <PageLayout 
      {...props}
      maxWidth="md"
      padding={4}
    >
      {children}
    </PageLayout>
  );
}

export function DashboardLayout({ children, ...props }: PageLayoutProps) {
  return (
    <PageLayout 
      {...props}
      showBreadcrumbs={false}
      padding={0}
    >
      {children}
    </PageLayout>
  );
} 