"use client";
import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { Box, Button, MenuItem, TextField, Typography, Stack, Divider, Alert, FormControl, InputLabel, Select } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import { useEffect, useState } from "react";
import AssetImageUpload from "./AssetImageUpload";

// Utility function to construct proper image URL
const getImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `http://localhost:8000${imageUrl}`;
};

// Comprehensive categories for Gusau LGA
const defaultCategories = [
  { id: 1, name: "Office Equipment" },
  { id: 2, name: "Computer & IT Equipment" },
  { id: 3, name: "Furniture & Fixtures" },
  { id: 4, name: "Vehicles & Transportation" },
  { id: 5, name: "Building & Infrastructure" },
  { id: 6, name: "Medical Equipment" },
  { id: 7, name: "Educational Equipment" },
  { id: 8, name: "Agricultural Equipment" },
  { id: 9, name: "Security Equipment" },
  { id: 10, name: "Communication Equipment" },
  { id: 11, name: "Electrical Equipment" },
  { id: 12, name: "Plumbing Equipment" },
  { id: 13, name: "HVAC Equipment" },
  { id: 14, name: "Kitchen Equipment" },
  { id: 15, name: "Cleaning Equipment" },
  { id: 16, name: "Sports Equipment" },
  { id: 17, name: "Audio/Visual Equipment" },
  { id: 18, name: "Printing Equipment" },
  { id: 19, name: "Tools & Machinery" },
  { id: 20, name: "Generators & Power Equipment" }
];

// Comprehensive locations for Gusau LGA
const defaultLocations = [
  { id: 1, name: "Gusau Secretariat - Main Building" },
  { id: 2, name: "Gusau Secretariat - Annex Building" },
  { id: 3, name: "Gusau Municipal Council" },
  { id: 4, name: "Gusau Rural Development Authority" },
  { id: 5, name: "Gusau North District Office" },
  { id: 6, name: "Gusau South District Office" },
  { id: 7, name: "Gusau East District Office" },
  { id: 8, name: "Gusau West District Office" },
  { id: 9, name: "Gusau Central Market" },
  { id: 10, name: "Gusau General Hospital" },
  { id: 11, name: "Gusau Primary Healthcare Centers" },
  { id: 12, name: "Gusau Schools & Educational Institutions" },
  { id: 13, name: "Gusau Police Station" },
  { id: 14, name: "Gusau Fire Service Station" },
  { id: 15, name: "Gusau Water Works" },
  { id: 16, name: "Gusau Waste Management Facility" },
  { id: 17, name: "Gusau Agricultural Extension Office" },
  { id: 18, name: "Gusau Youth Development Center" },
  { id: 19, name: "Gusau Women Development Center" },
  { id: 20, name: "Gusau Community Development Centers" },
  { id: 21, name: "Gusau Sports Complex" },
  { id: 22, name: "Gusau Library" },
  { id: 23, name: "Gusau Post Office" },
  { id: 24, name: "Gusau Banks & Financial Institutions" },
  { id: 25, name: "Gusau Transport Terminal" },
  { id: 26, name: "Gusau Storage Facilities" },
  { id: 27, name: "Gusau Workshop & Maintenance Centers" },
  { id: 28, name: "Gusau Field Offices" },
  { id: 29, name: "Gusau Outstation Offices" },
  { id: 30, name: "Gusau Temporary Locations" }
];

const statuses = ["Active", "Inactive", "Disposed", "Under Maintenance", "Lost", "Stolen", "Damaged"];

export interface AssetFormInputs {
  name: string;
  description: string;
  category: string;
  location: string;
  custodian_name: string;
  purchase_date: string;
  purchase_cost: number;
  quantity: number;
  cost_per_unit: number;
  supplier: string;
  invoice_number: string;
  current_value: number;
  status: string;
  condition: string;
  serial_number: string;
  model: string;
  manufacturer: string;
  warranty_expiry: string;
  vat_amount: number;
  total_cost_with_vat: number;
  currency: string;
  qr_code: string;
  barcode: string;
  tags: string;
  notes: string;
  image_file?: File | null;
  image_url?: string | null;
}

const defaultFormValues: AssetFormInputs = {
  name: "",
  description: "",
  category: "",
  location: "",
  custodian_name: "",
  purchase_date: "",
  purchase_cost: 0,
  quantity: 1,
  cost_per_unit: 0,
  supplier: "",
  invoice_number: "",
  current_value: 0,
  status: "Active",
  condition: "Good",
  serial_number: "",
  model: "",
  manufacturer: "",
  warranty_expiry: "",
  vat_amount: 0,
  total_cost_with_vat: 0,
  currency: "NGN",
  qr_code: "",
  barcode: "",
  tags: "",
  notes: "",
  image_file: null,
  image_url: null,
};

function formatNumber(value: number | string | undefined | null): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") {
    const num = parseFloat(value.replace(/,/g, ""));
    if (isNaN(num)) return "";
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (typeof value === "number") {
    return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return "";
}

interface AssetFormProps {
  onSubmit: (data: AssetFormInputs) => void;
  defaultValues?: Partial<AssetFormInputs>;
  title?: string;
  mode?: 'create' | 'edit';
}

export default function AssetForm({ onSubmit, defaultValues = defaultFormValues, title = "Gusau LGA Asset Registration", mode = 'create' }: AssetFormProps) {
  const { handleSubmit, control, register, setValue, watch } = useForm<AssetFormInputs>({ defaultValues: { ...defaultFormValues, ...defaultValues } });
  const [formError, setFormError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState(defaultCategories);
  const [locations, setLocations] = useState(defaultLocations);
  const [custodians, setCustodians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customCustodian, setCustomCustodian] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(defaultValues?.image_url || null);
  const { token } = typeof window !== 'undefined' ? { token: localStorage.getItem('token') } : { token: null };

  // Fetch categories, locations, and custodians from database
  useEffect(() => {
    const fetchCategoriesLocationsCustodians = async () => {
      setLoading(true);
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        // Fetch categories
        const categoriesResponse = await fetch(`${API_BASE_URL}/api/categories`);
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          if (categoriesData && categoriesData.length > 0) {
            setCategories(categoriesData);
          }
        }
        // Fetch locations
        const locationsResponse = await fetch(`${API_BASE_URL}/api/locations`);
        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json();
          if (locationsData && locationsData.length > 0) {
            setLocations(locationsData);
          }
        }
        // Fetch all users with manager roles for custodian field
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const custodiansResponse = await fetch(`${API_BASE_URL}/users?role=manager`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (custodiansResponse.ok) {
          const custodiansData = await custodiansResponse.json();
          if (custodiansData && custodiansData.length > 0) {
            setCustodians(custodiansData);
          }
        }
      } catch (error) {
        console.error('Error fetching categories, locations, or custodians:', error);
        // Keep using default values if API fails
      } finally {
        setLoading(false);
      }
    };
    fetchCategoriesLocationsCustodians();
  }, []);

  // Watch quantity and cost per unit to calculate total cost
  const quantity = watch("quantity") || 0;
  const costPerUnitRaw = watch("cost_per_unit") || 0;
  const costPerUnit = typeof costPerUnitRaw === "string" ? parseFloat((costPerUnitRaw as string).replace(/,/g, "")) : (typeof costPerUnitRaw === "number" ? costPerUnitRaw : 0);
  const totalCost = quantity * (isNaN(costPerUnit) ? 0 : costPerUnit);
  const vatAmount = totalCost * 0.075;
  const totalWithVAT = totalCost + vatAmount;

  // Watch location to auto-populate custodian
  const selectedLocation = watch("location");

  // Update calculated fields in form state
  React.useEffect(() => {
    setValue("purchase_cost", totalCost);
    setValue("vat_amount", vatAmount);
    setValue("total_cost_with_vat", totalWithVAT);
  }, [quantity, costPerUnit, setValue]);

  // Auto-populate custodian when location changes
  React.useEffect(() => {
    const fetchManagerForLocation = async () => {
      if (selectedLocation) {
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          
          // Fetch managers for the selected location
          const response = await fetch(`${API_BASE_URL}/users?role=manager&location=${encodeURIComponent(selectedLocation)}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          
          if (response.ok) {
            const managers = await response.json();
            if (managers && managers.length > 0) {
              // Set the first manager as custodian
              const manager = managers[0];
              setValue("custodian_name", `${manager.first_name} ${manager.last_name}`);
            }
          }
        } catch (error) {
          console.error('Error fetching manager for location:', error);
        }
      }
    };

    fetchManagerForLocation();
  }, [selectedLocation, setValue]);

  // Handle image upload and set imageUrl
  const handleImageChange = async (file: File | null) => {
    setImageFile(file);
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://localhost:8000/assets/upload-image/', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.url);
      } else {
        setImageUrl(null);
      }
    } else {
      setImageUrl(null);
    }
  };

  const handleFormSubmit = (data: AssetFormInputs) => {
    setFormError(null);
    if (!data.category.trim() || !data.location.trim()) {
      setFormError("Please select a valid category and location.");
      return;
    }
    let custodianToSubmit = data.custodian_name;
    if (data.custodian_name === 'custom') {
      if (!customCustodian.trim()) {
        setFormError('Please enter a custom custodian name.');
        return;
      }
      custodianToSubmit = customCustodian.trim();
    }
    // Remove formatting from cost fields before submit
    const safeString = (v: any) => typeof v === 'string' ? v : (typeof v === 'number' ? String(v) : '');
    
    // Helper function to convert date string to date object
    const parseDate = (dateStr: string | null | undefined) => {
      if (!dateStr || dateStr === '') return null;
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return null;
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
      } catch {
        return null;
      }
    };
    
    const cleanData = {
      ...data,
      custodian_name: custodianToSubmit,
      cost_per_unit: parseFloat(safeString(data.cost_per_unit).replace(/,/g, '')) || 0,
      purchase_cost: parseFloat(safeString(data.purchase_cost).replace(/,/g, '')) || 0,
      total_cost_with_vat: parseFloat(safeString(data.total_cost_with_vat).replace(/,/g, '')) || 0,
      vat_amount: parseFloat(safeString(data.vat_amount).replace(/,/g, '')) || 0,
      current_value: (() => {
        const raw = safeString((data as any).current_value);
        const cleaned = raw.replace(/,/g, '').trim();
        if (!cleaned) return null;
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
      })(),
      image_url: imageUrl, // Set the image_url for backend
      qrcode: data.qr_code || null, // Map qr_code to qrcode for backend, send null if empty
      asset_condition: data.condition, // Map condition to asset_condition for backend
      barcode: data.barcode && data.barcode.trim() !== '' ? data.barcode.trim() : null,
      warranty_expiry: parseDate(data.warranty_expiry),
      purchase_date: parseDate(data.purchase_date),
      // Ensure all required fields are present
      status: (data.status || 'Active').toLowerCase(),
      quantity: data.quantity || 1,
      currency: data.currency || 'NGN',
      // Remove image_file as it's not expected by the backend
    };
    // Remove fields not expected by backend
    const { image_file, qr_code, condition, ...dataToSend } = cleanData;
    
    onSubmit(dataToSend);
  };

  return (
    <Box p={0}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InventoryIcon color="primary" />
        {title}
      </Typography>

      {mode === 'create' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Register a new asset for Gusau LGA. Fill in the details below to create an asset record.
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>
        )}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          {/* Basic Information */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
              Basic Information
            </Typography>
            <Stack spacing={2}>
              <Controller name="name" control={control} rules={{ required: "Name is required" }} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Asset Name" fullWidth required size="small" />} />
              <Controller name="serial_number" control={control} rules={{ required: "Serial number is required" }} render={({ field, fieldState: { error } }) => <TextField {...field} value={field.value ?? ''} label="Serial Number" fullWidth error={!!error} helperText={error?.message} required size="small" />} />
              <Controller name="description" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Description" fullWidth multiline rows={2} size="small" placeholder="Describe the asset in detail..." />} />
              
              <Controller 
                name="category" 
                control={control} 
                rules={{ required: "Category is required" }} 
                render={({ field, fieldState: { error } }) => (
                  <FormControl fullWidth error={!!error} size="small">
                    <InputLabel>Category</InputLabel>
                    <Select {...field} value={field.value ?? ''} label="Category" disabled={loading}>
                      {loading ? (
                        <MenuItem disabled>Loading categories...</MenuItem>
                      ) : (
                        categories.map((category) => (
                          <MenuItem key={category.id} value={category.name}>
                            {category.name}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    {error && (
                      <Typography variant="caption" color="error">
                        {error.message}
                      </Typography>
                    )}
                  </FormControl>
                )} 
              />
              
              <Controller 
                name="location" 
                control={control} 
                rules={{ required: "Location is required" }} 
                render={({ field, fieldState: { error } }) => (
                  <FormControl fullWidth error={!!error} size="small">
                    <InputLabel>Location</InputLabel>
                    <Select {...field} value={field.value ?? ''} label="Location" disabled={loading}>
                      {loading ? (
                        <MenuItem disabled>Loading locations...</MenuItem>
                      ) : (
                        locations.map((location) => (
                          <MenuItem key={location.id} value={location.name}>
                            {location.name}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    {error && (
                      <Typography variant="caption" color="error">
                        {error.message}
                      </Typography>
                    )}
                  </FormControl>
                )} 
              />
              
              <Controller 
                name="status" 
                control={control} 
                rules={{ required: "Status is required" }} 
                render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select {...field} value={field.value ?? ''} label="Status">
                      {statuses.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )} 
              />
              
              <Controller
                name="custodian_name"
                control={control}
                rules={{ required: "Custodian is required" }}
                render={({ field, fieldState: { error } }) => {
                  const validCustodian = custodians.some(c => `${c.first_name} ${c.last_name}` === field.value) || field.value === 'custom';
                  return (
                    <>
                      <FormControl fullWidth error={!!error} size="small">
                        <InputLabel>Custodian</InputLabel>
                        <Select
                          {...field}
                          value={field.value || ''}
                          label="Custodian"
                          disabled={loading}
                          onChange={e => {
                            field.onChange(e.target.value);
                            if (e.target.value !== 'custom') setCustomCustodian('');
                          }}
                        >
                          {loading ? (
                            <MenuItem disabled>Loading maintenance managers...</MenuItem>
                          ) : custodians.length > 0 ? (
                            custodians.map((custodian) => (
                              <MenuItem key={custodian.id} value={`${custodian.first_name} ${custodian.last_name}`}>
                                {custodian.first_name} {custodian.last_name} {custodian.position ? `(${custodian.position})` : ''}
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem disabled>No maintenance managers found</MenuItem>
                          )}
                          <MenuItem value="custom">+ Add Custom Custodian</MenuItem>
                        </Select>
                        {error && (
                          <Typography variant="caption" color="error">
                            {error.message}
                          </Typography>
                        )}
                      </FormControl>
                      {field.value === 'custom' && (
                        <TextField
                          label="Custom Custodian Name"
                          value={customCustodian}
                          onChange={e => setCustomCustodian(e.target.value)}
                          fullWidth
                          size="small"
                          sx={{ mt: 2 }}
                          required
                        />
                      )}
                    </>
                  );
                }}
              />
              
              <Controller name="barcode" control={control} render={({ field, fieldState: { error } }) => <TextField {...field} value={field.value ?? ''} label="Barcode (optional)" fullWidth error={!!error} helperText={error?.message} size="small" placeholder="Scan or enter barcode" />} />
            </Stack>
          </Box>

          {/* Financial Details */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
              Financial Details
            </Typography>
            <Stack spacing={2}>
              <Controller 
                name="cost_per_unit" 
                control={control} 
                rules={{ 
                  required: "Cost per unit is required", 
                  min: { value: 0, message: "Cost must be positive" },
                  validate: (value) => {
                    const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.]/g, '')) : value;
                    return !isNaN(num) || "Please enter a valid number";
                  }
                }} 
                render={({ field, fieldState: { error } }) => (
                  <TextField 
                    {...field} 
                    value={field.value ?? ''} 
                    label="Cost Per Unit (₦)" 
                    type="text" 
                    fullWidth 
                    error={!!error} 
                    helperText={error?.message || "Enter amount (e.g., 15,000 or 15,000.50)"} 
                    onChange={(e) => {
                      // Allow only numbers, decimal point, and backspace
                      const value = e.target.value;
                      const cleanValue = value.replace(/[^\d.]/g, '');
                      
                      // Ensure only one decimal point
                      const parts = cleanValue.split('.');
                      if (parts.length > 2) return;
                      
                      // Limit decimal places to 2
                      if (parts[1] && parts[1].length > 2) return;
                      
                      field.onChange(cleanValue);
                    }}
                    onBlur={(e) => {
                      // Format the number on blur for better display with commas
                      const value = e.target.value;
                      if (value) {
                        const num = parseFloat(value);
                        if (!isNaN(num)) {
                          // Format with commas and 2 decimal places
                          const formatted = num.toLocaleString('en-NG', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          });
                          field.onChange(formatted);
                        }
                      }
                    }}
                    onFocus={(e) => {
                      // Remove commas when user starts editing
                      const value = e.target.value;
                      if (value) {
                        const num = parseFloat(value.replace(/,/g, ''));
                        if (!isNaN(num)) {
                          field.onChange(num.toString());
                        }
                      }
                    }}
                    inputProps={{ 
                      inputMode: "decimal",
                      placeholder: "0.00"
                    }} 
                    size="small" 
                  />
                )} 
              />
              <Controller name="quantity" control={control} rules={{ required: "Quantity is required", min: { value: 1, message: "Quantity must be at least 1" } }} render={({ field, fieldState: { error } }) => <TextField {...field} value={field.value ?? ''} label="Quantity" type="number" fullWidth error={!!error} helperText={error?.message} size="small" />} />
              <Controller 
                name="purchase_cost" 
                control={control} 
                rules={{ required: "Total cost is required", min: { value: 0, message: "Cost must be positive" } }} 
                render={({ field, fieldState: { error } }) => (
                  <TextField 
                    {...field} 
                    value={field.value ? Number(field.value).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} 
                    label="Total Cost (₦)" 
                    type="text" 
                    fullWidth 
                    error={!!error} 
                    helperText={error?.message || "Calculated automatically"} 
                    InputProps={{ 
                      readOnly: true, 
                      startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₦</Typography> 
                    }} 
                    size="small" 
                  />
                )} 
              />
              <Controller 
                name="vat_amount" 
                control={control} 
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    value={field.value ? Number(field.value).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} 
                    label="VAT Amount (₦)" 
                    type="text" 
                    fullWidth 
                    InputProps={{ 
                      readOnly: true, 
                      startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₦</Typography> 
                    }} 
                    size="small" 
                  />
                )} 
              />
              <Controller 
                name="total_cost_with_vat" 
                control={control} 
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ? Number(field.value).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    label="Total with VAT (₦)"
                    type="text"
                    fullWidth
                    InputProps={{ 
                      readOnly: true, 
                      startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₦</Typography> 
                    }}
                    size="small"
                  />
                )} 
              />
              <Controller name="supplier" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Supplier/Vendor" fullWidth size="small" placeholder="Name of supplier or vendor" />} />
              <Controller name="invoice_number" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Invoice Number" fullWidth size="small" placeholder="Purchase invoice number" />} />
              <Controller name="purchase_date" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Purchase Date" type="date" fullWidth InputLabelProps={{ shrink: true }} size="small" />} />
              <Controller 
                name="current_value" 
                control={control} 
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    value={field.value ?? ''} 
                    label="Current Value (₦)" 
                    type="text" 
                    fullWidth 
                    size="small" 
                    placeholder="0.00"
                    helperText="Enter current market value"
                    onChange={(e) => {
                      // Allow only numbers, decimal point, and backspace
                      const value = e.target.value;
                      const cleanValue = value.replace(/[^\d.]/g, '');
                      
                      // Ensure only one decimal point
                      const parts = cleanValue.split('.');
                      if (parts.length > 2) return;
                      
                      // Limit decimal places to 2
                      if (parts[1] && parts[1].length > 2) return;
                      
                      field.onChange(cleanValue);
                    }}
                    onBlur={(e) => {
                      // Format the number on blur for better display with commas
                      const value = e.target.value;
                      if (value) {
                        const num = parseFloat(value);
                        if (!isNaN(num)) {
                          // Format with commas and 2 decimal places
                          const formatted = num.toLocaleString('en-NG', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          });
                          field.onChange(formatted);
                        }
                      }
                    }}
                    onFocus={(e) => {
                      // Remove commas when user starts editing
                      const value = e.target.value;
                      if (value) {
                        const num = parseFloat(value.replace(/,/g, ''));
                        if (!isNaN(num)) {
                          field.onChange(num.toString());
                        }
                      }
                    }}
                    inputProps={{ 
                      inputMode: "decimal"
                    }}
                  />
                )} 
              />
              <Controller name="currency" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Currency" fullWidth size="small" />} />
            </Stack>
          </Box>
        </Box>

        {/* Asset Details - Full Width */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
            Asset Details
          </Typography>
          <Stack spacing={2}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              <Controller name="model" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Model" fullWidth size="small" placeholder="Asset model number" />} />
              <Controller name="manufacturer" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Manufacturer" fullWidth size="small" placeholder="Manufacturer name" />} />
              <Controller name="warranty_expiry" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Warranty Expiry" type="date" fullWidth InputLabelProps={{ shrink: true }} size="small" />} />
            </Box>
            <Controller name="tags" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Tags" fullWidth placeholder="Comma-separated tags for easy search" size="small" />} />
            <Controller name="notes" control={control} render={({ field }) => <TextField {...field} value={field.value ?? ''} label="Notes" fullWidth multiline rows={2} size="small" placeholder="Additional notes or special instructions" />} />
          </Stack>
        </Box>

        {/* Image Upload - Full Width */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
            Image Upload
          </Typography>
          <AssetImageUpload onImageChange={handleImageChange} currentImage={imageUrl || undefined} />
        </Box>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => window.history.back()}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Register Asset
          </Button>
        </Box>
      </Box>
    </Box>
  );
} 