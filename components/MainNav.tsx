"use client";
import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Badge,
  Divider
} from "@mui/material";
import SSRSafeDialog from './SSRSafeDialog';
import {
  Home as HomeIcon,
  Inventory as InventoryIcon,
  Group as GroupIcon,
  Build as BuildIcon,
  SwapHoriz as SwapHorizIcon,
  Gavel as GavelIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  History as HistoryIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  AccountCircle,
  KeyboardArrowDown,
  Settings,
  Logout
} from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from '../contexts/NotificationContext';

// SSR-safe Menu component
const SSRSafeMenu = ({ children, anchorEl, open, onClose, ...props }: any) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Add click outside handler
  useEffect(() => {
    if (!open) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click target is outside both the anchor element and the menu
      const target = event.target as Node;
      const menuElement = document.querySelector('[data-menu="true"]');
      
      if (anchorEl && !anchorEl.contains(target) && 
          menuElement && !menuElement.contains(target)) {
        onClose();
      }
    };
    
    // Add event listener with a small delay to avoid immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, anchorEl, onClose]);
  
  if (!mounted || !open) {
    return null;
  }
  
  return (
    <div
      data-menu="true"
      style={{
        position: 'fixed',
        top: anchorEl ? (() => {
          const rect = anchorEl.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const menuHeight = 400; // maxHeight
          // If menu would overflow bottom, show above the anchor
          if (rect.bottom + menuHeight > windowHeight - 20) {
            return Math.max(20, rect.top - menuHeight - 8);
          }
          return rect.bottom + 8;
        })() : 0,
        left: anchorEl ? (() => {
          const rect = anchorEl.getBoundingClientRect();
          const windowWidth = window.innerWidth;
          const menuWidth = 200; // minWidth
          // If menu would overflow right edge, align to right edge of anchor
          if (rect.left + menuWidth > windowWidth - 20) {
            return Math.max(20, rect.right - menuWidth);
          }
          return rect.left;
        })() : 0,
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1400,
        minWidth: '200px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
};

// SSR-safe MenuItem component
const SSRSafeMenuItem = ({ children, onClick, ...props }: any) => {
  return (
    <div
      style={{
        padding: '12px 16px',
        cursor: 'pointer',
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: '#fff',
        fontSize: '14px',
        color: '#333',
        position: 'relative',
        zIndex: 1500
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(e);
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f5f5f5';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#fff';
      }}
    >
      {children}
    </div>
  );
};

const navItems = [
  { text: "Dashboard", icon: <HomeIcon />, href: "/dashboard" },
  { text: "Assets", icon: <InventoryIcon />, href: "/assets" },
  { text: "Users", icon: <GroupIcon />, href: "/users" },
  { text: "Maintenance", icon: <BuildIcon />, href: "/maintenance" },
  { text: "Transfers", icon: <SwapHorizIcon />, href: "/transfers" },
  { text: "Auctions", icon: <GavelIcon />, href: "/auctions" },
  { text: "Disposals", icon: <DeleteIcon />, href: "/disposals" },
  { text: "Reports", icon: <AssessmentIcon />, href: "/reports" },
  { text: "Audit Trail", icon: <HistoryIcon />, href: "/audit" },
  { text: "Notifications", icon: <NotificationsIcon />, href: "/notifications" },
];

// Group navigation items for dropdown menus
const navGroups = [
  {
    name: "Asset Management",
    items: [
      { text: "Assets", icon: <InventoryIcon />, href: "/assets" },
      { text: "Maintenance", icon: <BuildIcon />, href: "/maintenance" },
      { text: "Transfers", icon: <SwapHorizIcon />, href: "/transfers" },
    ]
  },
  {
    name: "Operations",
    items: [
      { text: "Auctions", icon: <GavelIcon />, href: "/auctions" },
      { text: "Disposals", icon: <DeleteIcon />, href: "/disposals" },
    ]
  },
  {
    name: "Reports & Audit",
    items: [
      { text: "Reports", icon: <AssessmentIcon />, href: "/reports" },
      { text: "Audit Trail", icon: <HistoryIcon />, href: "/audit" },
    ]
  }
];

export default function MainNav() {
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const [dropdownAnchors, setDropdownAnchors] = useState<{ [key: string]: null | HTMLElement }>({});
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout, hasPermission } = useAuth();
  const { notifications, unreadCount: contextUnreadCount, markAllAsRead } = useNotifications();

  const fetchUnreadCount = async (userId: number) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${API_BASE_URL}/notifications?user_id=${userId}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Count unread notifications
        const unreadCount = data.filter((notification: any) => !notification.is_read).length;
        setUnreadCount(unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
    }
  };

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (user && user.id && isClient) {
      fetchUnreadCount(user.id);
    }
  }, [user, isClient]);

  // Don't render anything during server-side rendering
  if (!isClient) {
    return null;
  }

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleDropdownOpen = (groupName: string, event: React.MouseEvent<HTMLElement>) => {
    setDropdownAnchors(prev => ({ ...prev, [groupName]: event.currentTarget }));
  };

  const handleDropdownClose = (groupName: string) => {
    setDropdownAnchors(prev => ({ ...prev, [groupName]: null }));
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    handleMobileMenuClose();
    Object.keys(dropdownAnchors).forEach(key => handleDropdownClose(key));
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };
  
  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };
  
  const handleProfileSettings = () => {
    handleProfileMenuClose();
    router.push('/profile');
  };
  
  const handleLogout = () => {
    handleProfileMenuClose();
    setLogoutDialogOpen(true);
  };
  const confirmLogout = () => {
    setLogoutDialogOpen(false);
    logout();
  };
  const cancelLogout = () => {
    setLogoutDialogOpen(false);
  };

  const isActive = (href: string) => pathname === href;

  return (
    <nav>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          backgroundColor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'grey.200'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1 }}>
            {/* Logo and Brand - Left side */}
            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  cursor: 'pointer',
                  letterSpacing: '-0.025em'
                }}
                onClick={() => router.push('/dashboard')}
              >
                GUSAU LGA
              </Typography>
            <Box sx={{ ml: 1 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 500,
                  color: 'text.secondary',
                  fontSize: '0.75rem'
                }} 
              >
                Asset Management System
              </Typography>
            </Box>
            </Box>

            {/* Desktop Navigation - Center */}
            {!isMobile && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                flex: 1, 
                justifyContent: 'center',
                mx: 4
              }}>
                {/* Dashboard - Only visible to admin */}
                {user && user.role === 'admin' && (
                  <Button
                    color={isActive('/dashboard') ? 'primary' : 'inherit'}
                  startIcon={<HomeIcon />}
                    onClick={() => handleNavigation('/dashboard')}
                    sx={{
                      textTransform: 'none',
                      fontWeight: isActive('/dashboard') ? 600 : 500,
                      backgroundColor: isActive('/dashboard') ? 'primary.50' : 'transparent',
                      color: isActive('/dashboard') ? 'primary.main' : 'text.primary',
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      '&:hover': {
                        backgroundColor: isActive('/dashboard') ? 'primary.100' : 'grey.50'
                      }
                    }}
                  >
                    Dashboard
                  </Button>
                )}

                {/* Asset Management Dropdown - show if user has any asset-related permission */}
                {(hasPermission('assets') || hasPermission('maintenance') || hasPermission('transfers')) && (
                  <>
                    <Button
                      color="inherit"
                      endIcon={<KeyboardArrowDown />}
                      onClick={(e) => handleDropdownOpen('Asset Management', e)}
                      sx={{ 
                        textTransform: 'none',
                        fontWeight: 500,
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        '&:hover': {
                          backgroundColor: 'grey.50'
                        }
                      }}
                    >
                      Asset Management
                    </Button>
                    {isClient && (
                        <SSRSafeMenu
                          anchorEl={dropdownAnchors['Asset Management']}
                          open={Boolean(dropdownAnchors['Asset Management'])}
                          onClose={() => handleDropdownClose('Asset Management')}
                        >
                      {navGroups[0].items.map((item) => {
                        if (
                          (item.text === 'Assets' && !hasPermission('assets')) ||
                          (item.text === 'Maintenance' && !hasPermission('maintenance')) ||
                          (item.text === 'Transfers' && !hasPermission('transfers'))
                        ) return null;
                        return (
                          <SSRSafeMenuItem 
                            key={item.text}
                            onClick={() => handleNavigation(item.href)}
                          >
                            <Box sx={{ color: 'inherit' }}>{item.icon}</Box>
                            {item.text}
                          </SSRSafeMenuItem>
                        );
                      })}
                        </SSRSafeMenu>
                    )}
                  </>
                )}

                {/* Operations Dropdown - show if user has auctions or disposals permission */}
                {(hasPermission('auctions') || hasPermission('disposals')) && (
                  <>
                    <Button
                      color="inherit"
                      endIcon={<KeyboardArrowDown />}
                      onClick={(e) => handleDropdownOpen('Operations', e)}
                      sx={{ 
                        textTransform: 'none',
                        fontWeight: 500,
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        '&:hover': {
                          backgroundColor: 'grey.50'
                        }
                      }}
                    >
                      Operations
                    </Button>
                    {isClient && (
                        <SSRSafeMenu
                          anchorEl={dropdownAnchors['Operations']}
                          open={Boolean(dropdownAnchors['Operations'])}
                          onClose={() => handleDropdownClose('Operations')}
                        >
                      {navGroups[1].items.map((item) => {
                        if (
                          (item.text === 'Auctions' && !hasPermission('auctions')) ||
                          (item.text === 'Disposals' && !hasPermission('disposals'))
                        ) return null;
                        return (
                          <SSRSafeMenuItem 
                            key={item.text}
                            onClick={() => handleNavigation(item.href)}
                            selected={isActive(item.href)}
                            sx={{ 
                              gap: 2,
                              py: 1.5,
                              px: 2,
                              mx: 1,
                              borderRadius: 2,
                              '&.Mui-selected': {
                                backgroundColor: 'primary.50',
                                color: 'primary.main',
                                '&:hover': {
                                  backgroundColor: 'primary.100'
                                }
                              }
                            }}
                          >
                            <Box sx={{ color: 'inherit' }}>{item.icon}</Box>
                            {item.text}
                          </SSRSafeMenuItem>
                        );
                      })}
                        </SSRSafeMenu>
                    )}
                  </>
                )}

                {/* Reports & Audit Dropdown - show if user has reports or audit permission */}
                {(hasPermission('reports') || hasPermission('audit')) && (
                  <>
                    <Button
                      color="inherit"
                      endIcon={<KeyboardArrowDown />}
                      onClick={(e) => handleDropdownOpen('Reports & Audit', e)}
                      sx={{ 
                        textTransform: 'none',
                        fontWeight: 500,
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        '&:hover': {
                          backgroundColor: 'grey.50'
                        }
                      }}
                    >
                      Reports & Audit
                    </Button>
                    {isClient && (
                        <SSRSafeMenu
                          anchorEl={dropdownAnchors['Reports & Audit']}
                          open={Boolean(dropdownAnchors['Reports & Audit'])}
                          onClose={() => handleDropdownClose('Reports & Audit')}
                        >
                      {navGroups[2].items.map((item) => {
                        if (
                          (item.text === 'Reports' && !hasPermission('reports')) ||
                          (item.text === 'Audit Trail' && !hasPermission('audit'))
                        ) return null;
                        return (
                          <SSRSafeMenuItem 
                            key={item.text}
                            onClick={() => handleNavigation(item.href)}
                            selected={isActive(item.href)}
                            sx={{ 
                              gap: 2,
                              py: 1.5,
                              px: 2,
                              mx: 1,
                              borderRadius: 2,
                              '&.Mui-selected': {
                                backgroundColor: 'primary.50',
                                color: 'primary.main',
                                '&:hover': {
                                  backgroundColor: 'primary.100'
                                }
                              }
                            }}
                          >
                            <Box sx={{ color: 'inherit' }}>{item.icon}</Box>
                            {item.text}
                          </SSRSafeMenuItem>
                        );
                      })}
                        </SSRSafeMenu>
                    )}
                  </>
                )}

                {/* Reports page for non-admin users */}
                {user && user.role !== 'admin' && (
                  <Button
                    color={isActive('/reports') ? 'primary' : 'inherit'}
                    startIcon={<AssessmentIcon />}
                    onClick={() => handleNavigation('/reports')}
                    sx={{
                      textTransform: 'none',
                      fontWeight: isActive('/reports') ? 600 : 500,
                      backgroundColor: isActive('/reports') ? 'primary.50' : 'transparent',
                      color: isActive('/reports') ? 'primary.main' : 'text.primary',
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      '&:hover': {
                        backgroundColor: isActive('/reports') ? 'primary.100' : 'grey.50'
                      }
                    }}
                  >
                    Reports
                  </Button>
                )}

                {/* Users - show if user has users permission */}
                {hasPermission('users') && (
                  <Button
                    color={isActive('/users') ? 'primary' : 'inherit'}
                  startIcon={<GroupIcon />}
                    onClick={() => handleNavigation('/users')}
                    sx={{
                      textTransform: 'none',
                      fontWeight: isActive('/users') ? 600 : 500,
                      backgroundColor: isActive('/users') ? 'primary.50' : 'transparent',
                      color: isActive('/users') ? 'primary.main' : 'text.primary',
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      '&:hover': {
                        backgroundColor: isActive('/users') ? 'primary.100' : 'grey.50'
                      }
                    }}
                  >
                    Users
                  </Button>
                )}
              </Box>
            )}

            {/* Right side - Notifications and User */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
              {/* Notifications */}
              <IconButton 
                color="inherit"
                onClick={() => handleNavigation('/notifications')}
                sx={{ 
                  position: 'relative',
                  borderRadius: 2,
                  p: 1,
                  '&:hover': {
                    backgroundColor: 'grey.50'
                  }
                }}
              >
                <Badge 
                  badgeContent={unreadCount} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      minWidth: 20,
                      height: 20
                    }
                  }}
                >
                  <NotificationsIcon />
                </Badge>
              </IconButton>

              {/* Mobile Menu Button */}
              {isMobile && (
                <IconButton
                  color="inherit"
                  onClick={handleMobileMenuOpen}
                  sx={{
                    borderRadius: 2,
                    p: 1,
                    '&:hover': {
                      backgroundColor: 'grey.50'
                    }
                  }}
                >
                  <MenuIcon />
                </IconButton>
              )}

              {/* User Avatar */}
              <IconButton 
                color="inherit" 
                onClick={handleProfileMenuOpen}
                sx={{
                  borderRadius: 2,
                  p: 0.5,
                  '&:hover': {
                    backgroundColor: 'grey.50'
                  }
                }}
              >
              <AccountCircle />
              </IconButton>
              
              {isClient && (
                <>
                  {/* Backdrop overlay for profile menu */}
                  {Boolean(profileMenuAnchor) && (
                    <div
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        zIndex: 1300,
                      }}
                      onClick={handleProfileMenuClose}
                    />
                  )}
                  <SSRSafeMenu
                    anchorEl={profileMenuAnchor}
                    open={Boolean(profileMenuAnchor)}
                    onClose={handleProfileMenuClose}
                  >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {user?.first_name} {user?.last_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {user?.role || 'User'}
                  </Typography>
                </Box>
                <Divider />
                <SSRSafeMenuItem 
                  onClick={handleProfileSettings}
                >
                  <Settings sx={{ fontSize: 20 }} />
                  Profile Settings
                </SSRSafeMenuItem>
                <SSRSafeMenuItem 
                  onClick={handleLogout}
                >
                  <Logout sx={{ fontSize: 20 }} />
                  Log Out
                </SSRSafeMenuItem>
                  </SSRSafeMenu>
                </>
              )}
            </Box>
        </Box>
      </AppBar>

      {/* Mobile Menu */}
      {isClient && (
        <>
          {/* Backdrop overlay for mobile menu */}
          {Boolean(mobileMenuAnchor) && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1300,
              }}
              onClick={handleMobileMenuClose}
            />
          )}
                    <SSRSafeMenu
            anchorEl={mobileMenuAnchor}
            open={Boolean(mobileMenuAnchor)}
            onClose={handleMobileMenuClose}
          >
            {/* Mobile menu header with close button */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              p: 2, 
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Menu
              </Typography>
              <IconButton 
                onClick={handleMobileMenuClose}
                size="small"
                sx={{ p: 0.5 }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            {navItems.map((item) => {
          if (item.text === 'Dashboard') return (
            <SSRSafeMenuItem 
              key={item.text}
              onClick={() => handleNavigation(item.href)}
            >
              <Box sx={{ color: 'inherit' }}>{item.icon}</Box>
              {item.text}
            </SSRSafeMenuItem>
          );
          if (item.text === 'Assets' && !hasPermission('assets')) return null;
          if (item.text === 'Users' && !hasPermission('users')) return null;
          if (item.text === 'Maintenance' && !hasPermission('maintenance')) return null;
          if (item.text === 'Transfers' && !hasPermission('transfers')) return null;
          if (item.text === 'Auctions' && !hasPermission('auctions')) return null;
          if (item.text === 'Disposals' && !hasPermission('disposals')) return null;
          if (item.text === 'Reports' && !hasPermission('reports')) return null;
          if (item.text === 'Audit Trail' && !hasPermission('audit')) return null;
          if (item.text === 'Notifications' && !hasPermission('notifications')) return null;
          return (
            <SSRSafeMenuItem 
              key={item.text}
              onClick={() => handleNavigation(item.href)}
            >
              <Box sx={{ color: 'inherit' }}>{item.icon}</Box>
              {item.text}
            </SSRSafeMenuItem>
          );
        })}
          </SSRSafeMenu>
        </>
      )}

      {/* Logout Confirmation Dialog */}
      <SSRSafeDialog 
        open={logoutDialogOpen} 
        onClose={cancelLogout}
        title="Confirm Logout"
      >
        <div style={{ padding: '24px' }}>
          <Typography variant="h6" sx={{ mt: 1, mb: 2 }}>
            Are you sure you want to log out?
          </Typography>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Button onClick={cancelLogout} color="secondary" variant="outlined">Cancel</Button>
            <Button onClick={confirmLogout} color="primary" variant="contained">Logout</Button>
          </div>
        </div>
      </SSRSafeDialog>
    </nav>
  );
} 