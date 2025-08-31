const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function getAssets() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  if (!token) {
    throw new Error("Authentication required");
  }
  
  const res = await fetch(`${API_BASE_URL}/assets`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Authentication failed - please login again");
    } else if (res.status === 403) {
      throw new Error("Access denied - insufficient permissions");
    } else {
      throw new Error(`Failed to fetch assets: ${res.status} ${res.statusText}`);
    }
  }
  
  return res.json();
}

export async function getAsset(id: string | number) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${API_BASE_URL}/assets/${id}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) throw new Error("Failed to fetch asset");
  return res.json();
}

export async function createAsset(asset: any) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const formData = new FormData();
  // Map frontend fields to backend fields
  const assetToSend = {
    ...asset,
    category: asset.category_name,
    location: asset.location_name,
  };
  Object.entries(assetToSend).forEach(([key, value]) => {
    if (key === 'image_file' && value) {
      formData.append('image', value as File);
    } else if (value !== undefined && value !== null) {
      formData.append(key, value as any);
    }
  });
  const res = await fetch(`${API_BASE_URL}/assets`, {
    method: "POST",
    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: formData,
  });
  if (!res.ok) {
    let errorMsg = "Failed to create asset";
    try {
      const errorData = await res.json();
      if (errorData && errorData.error) {
        errorMsg = errorData.error;
      }
    } catch {}
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function updateAsset(id: string, asset: any) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  let imageUrl = asset.image_url;
  if (asset.image_file) {
  const formData = new FormData();
    formData.append('file', asset.image_file);
    const res = await fetch(`${API_BASE_URL}/assets/upload-image/`, {
      method: 'POST',
    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      imageUrl = data.url;
    }
  }
  const assetToSend = { ...asset, image_url: imageUrl };
  delete assetToSend.image_file;
  const res = await fetch(`${API_BASE_URL}/assets/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(assetToSend),
  });
  if (!res.ok) throw new Error("Failed to update asset");
  return res.json();
}

export async function deleteAsset(id: string | number) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${API_BASE_URL}/assets/${id}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) throw new Error("Failed to delete asset");
  return res.json();
} 