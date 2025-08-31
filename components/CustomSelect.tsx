"use client";
import React, { useState, useRef, useEffect } from 'react';

interface CustomSelectProps {
  value: string | number;
  onChange: (event: { target: { value: string | number } }) => void;
  label?: string;
  disabled?: boolean;
  children: React.ReactNode;
  error?: boolean;
  fullWidth?: boolean;
}

interface CustomMenuItemProps {
  value: string | number;
  disabled?: boolean;
  children: React.ReactNode;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  children,
  error = false,
  fullWidth = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!mounted) {
    return (
      <div
        style={{
          width: fullWidth ? '100%' : 'auto',
          height: '56px',
          border: `1px solid ${error ? '#d32f2f' : '#e0e0e0'}`,
          borderRadius: '4px',
          backgroundColor: disabled ? '#f5f5f5' : '#fff',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1
        }}
      >
        <span style={{ color: '#666' }}>{label || 'Loading...'}</span>
      </div>
    );
  }

  const selectedChild = React.Children.toArray(children).find(
    (child: any) => child.props.value === value
  );

  return (
    <div
      ref={selectRef}
      style={{
        position: 'relative',
        width: fullWidth ? '100%' : 'auto'
      }}
    >
      <div
        style={{
          width: '100%',
          height: '56px',
          border: `1px solid ${error ? '#d32f2f' : '#e0e0e0'}`,
          borderRadius: '4px',
          backgroundColor: disabled ? '#f5f5f5' : '#fff',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          justifyContent: 'space-between',
          opacity: disabled ? 0.6 : 1
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={{ color: value ? '#000' : '#666' }}>
          {selectedChild && typeof selectedChild === 'object' && 'props' in selectedChild ? selectedChild.props.children : label || 'Select an option'}
        </span>
        <span style={{ fontSize: '12px', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          ▼
        </span>
      </div>
      
      {isOpen && !disabled && (
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
            overflowY: 'auto',
            marginTop: '4px'
          }}
        >
          {React.Children.map(children, (child: any) => (
            <div
              key={child.props.value}
              style={{
                padding: '12px 16px',
                cursor: child.props.disabled ? 'not-allowed' : 'pointer',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: child.props.value === value ? '#f5f5f5' : '#fff',
                opacity: child.props.disabled ? 0.6 : 1
              }}
              onClick={() => {
                if (!child.props.disabled) {
                  onChange({ target: { value: child.props.value } });
                  setIsOpen(false);
                }
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

export const CustomMenuItem: React.FC<CustomMenuItemProps> = ({ children, value, disabled = false }) => {
  return <div data-value={value} data-disabled={disabled}>{children}</div>;
};