const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export interface Location {
  id: number;
  name: string;
  address?: string;
  contact_person?: string;
  contact_phone?: string;
  description?: string;
  created_at?: string;
}

export async function getLocations(): Promise<Location[]> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/locations/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch locations: ${response.statusText}`);
    }

    const locations = await response.json();
    return locations;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
}