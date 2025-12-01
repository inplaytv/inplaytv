import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.DATAGOLF_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DataGolf API key not configured' },
        { status: 500 }
      );
    }

    // Fetch skill ratings from DataGolf API
    const response = await fetch(
      `https://feeds.datagolf.com/preds/skill-ratings?display=value&file_format=json&key=${apiKey}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DataGolf API error:', response.status, errorText);
      return NextResponse.json(
        { error: `DataGolf API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill ratings' },
      { status: 500 }
    );
  }
}
