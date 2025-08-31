"use client";
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

// SSR-safe FormControl component
export const SSRSafeFormControl = ({ children, ...props }: any) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div style={{ width: '100%', height: '56px', backgroundColor: '#f5f5f5', borderRadius: '4px' }} />;
  }
  
  return (
    <div style={{ width: '100%', marginTop: '16px' }}>
      {children}
    </div>
  );
};

// SSR-safe InputLabel component
export const SSRSafeInputLabel = ({ children, ...props }: any) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>{children}</div>;
  }
  
  return (
    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', fontWeight: 500 }}>
      {children}
    </div>
  );
};

// SSR-safe Select component
export const SSRSafeSelect = ({ value, onChange, children, label, ...props }: any) => {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div style={{ 
        width: '100%', 
        height: '56px', 
        border: '1px solid #e0e0e0', 
        borderRadius: '4px', 
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        cursor: 'pointer'
      }}>
        <span style={{ color: '#666' }}>{label}</span>
      </div>
    );
  }
  
  const selectedChild = React.Children.toArray(children).find(
    (child: any) => child.props.value === value
  );
  
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          width: '100%',
          height: '56px',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          cursor: 'pointer',
          justifyContent: 'space-between'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ color: value ? '#000' : '#666' }}>
          {selectedChild && typeof selectedChild === 'object' && 'props' in selectedChild ? selectedChild.props.children : label}
        </span>
        <span style={{ fontSize: '12px' }}>▼</span>
      </div>
      
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          {React.Children.map(children, (child: any) => (
            <div
              key={child.props.value}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: child.props.value === value ? '#f5f5f5' : '#fff'
              }}
              onClick={() => {
                onChange({ target: { value: child.props.value } });
                setIsOpen(false);
              }}
            >
              {child.props.children}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// SSR-safe MenuItem component
export const SSRSafeMenuItem = ({ children, value, ...props }: any) => {
  return <div data-value={value}>{children}</div>;
};

// Portal-based Modal component that renders outside React tree
export const PortalModal = ({ children, open, onClose, ...props }: any) => {
  const [mounted, setMounted] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    // Create a container for the portal
    const container = document.createElement('div');
    container.id = 'modal-portal';
    document.body.appendChild(container);
    setPortalContainer(container);

    return () => {
      if (container && document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };
  }, []);

  if (!mounted || !portalContainer || !open) {
    return null;
  }

  // Use React Portal to render outside the component tree
  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300,
      }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    portalContainer
  );
};

// Simple Snackbar component without Material-UI
export const SimpleSnackbar = ({ open, message, onClose, autoHideDuration = 3000 }: any) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && autoHideDuration) {
      const timer = setTimeout(onClose, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [open, autoHideDuration, onClose]);

  if (!mounted || !open) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#4caf50',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '4px',
        zIndex: 1400,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      {message}
    </div>
  );
}; 