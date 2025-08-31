"use client";
import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps, CircularProgress } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Box } from '@mui/material';

interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    leftIcon, 
    rightIcon, 
    children, 
    disabled,
    sx,
    ...props 
  }, ref) => {
    const getVariantProps = () => {
      switch (variant) {
        case 'primary':
          return {
            variant: 'contained' as const,
            sx: {
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              },
              '&:disabled': {
                background: 'grey.300',
                color: 'grey.500',
              },
              ...sx
            }
          };
        case 'secondary':
          return {
            variant: 'contained' as const,
            sx: {
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
              },
              '&:disabled': {
                background: 'grey.300',
                color: 'grey.500',
              },
              ...sx
            }
          };
        case 'outline':
          return {
            variant: 'outlined' as const,
            sx: {
              borderColor: 'primary.main',
              color: 'primary.main',
              borderWidth: '1.5px',
              '&:hover': {
                borderColor: 'primary.dark',
                backgroundColor: 'primary.50',
                borderWidth: '1.5px',
              },
              '&:disabled': {
                borderColor: 'grey.300',
                color: 'grey.500',
              },
              ...sx
            }
          };
        case 'ghost':
          return {
            variant: 'text' as const,
            sx: {
              color: 'text.primary',
              '&:hover': {
                backgroundColor: 'grey.50',
              },
              '&:disabled': {
                color: 'grey.500',
              },
              ...sx
            }
          };
        case 'danger':
          return {
            variant: 'contained' as const,
            sx: {
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
              },
              '&:disabled': {
                background: 'grey.300',
                color: 'grey.500',
              },
              ...sx
            }
          };
        default:
          return { variant: 'contained' as const, sx };
      }
    };

    const getSizeProps = () => {
      switch (size) {
        case 'sm':
          return {
            sx: {
              px: 2,
              py: 0.75,
              fontSize: '0.875rem',
              minHeight: 32,
              ...getVariantProps().sx
            }
          };
        case 'lg':
          return {
            sx: {
              px: 4,
              py: 1.5,
              fontSize: '1.125rem',
              minHeight: 48,
              ...getVariantProps().sx
            }
          };
        default:
          return {
            sx: {
              px: 3,
              py: 1,
              fontSize: '1rem',
              minHeight: 40,
              ...getVariantProps().sx
            }
          };
      }
    };

    const sizeProps = getSizeProps();
    const variantProps = getVariantProps();

    const buttonContent = (
      <>
        {loading && (
          <CircularProgress 
            size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} 
            sx={{ 
              color: 'inherit', 
              mr: leftIcon || rightIcon ? 1 : 0 
            }} 
          />
        )}
        {!loading && leftIcon && (
          <Box component="span" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
            {leftIcon}
          </Box>
        )}
        {children}
        {!loading && rightIcon && (
          <Box component="span" sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
            {rightIcon}
          </Box>
        )}
      </>
    );

    if (loading) {
      return (
        <LoadingButton
          ref={ref}
          loading={loading}
          disabled={disabled}
          variant={variantProps.variant}
          size={size === 'sm' ? 'small' : size === 'lg' ? 'large' : 'medium'}
          sx={sizeProps.sx}
          {...props}
        >
          {buttonContent}
        </LoadingButton>
      );
    }

    return (
      <MuiButton
        ref={ref}
        disabled={disabled}
        variant={variantProps.variant}
        size={size === 'sm' ? 'small' : size === 'lg' ? 'large' : 'medium'}
        sx={sizeProps.sx}
        {...props}
      >
        {buttonContent}
      </MuiButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;

// Specialized button components
export const PrimaryButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="primary" {...props} />
);

export const SecondaryButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="secondary" {...props} />
);

export const OutlineButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="outline" {...props} />
);

export const GhostButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="ghost" {...props} />
);

export const DangerButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="danger" {...props} />
); 