import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Auction API route: GET request received');
    const token = request.headers.get('authorization');
    if (!token) {
      console.log('Auction API route: No authorization token found');
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    console.log('Auction API route: Forwarding request to backend');
    const response = await fetch(`http://localhost:8000/auctions`, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    });

    console.log('Auction API route: Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Auction API route: Backend error:', errorText);
      return NextResponse.json({ error: 'Failed to fetch auctions' }, { status: response.status });
    }

    const data = await response.json();
    console.log('Auction API route: Backend data received:', data);
    console.log('Auction API route: Number of auctions:', data.length);
    return NextResponse.json(data);
  } catch (error) {
    console.log('Auction API route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Auction POST request received');
    const token = request.headers.get('authorization');
    if (!token) {
      console.log('No authorization token found');
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);

    const response = await fetch(`http://localhost:8000/auctions`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Backend error:', errorText);
      return NextResponse.json({ error: `Failed to create auction: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    console.log('Backend response data:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.log('API route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
