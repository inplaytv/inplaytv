import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

// Simple in-memory storage for backgrounds (for now)
// In a real app, this would be in a database table
let tournamentBackgrounds = {
  backgroundImage: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2070',
  opacity: 0.15,
  overlay: 0.4
};

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: tournamentBackgrounds
    });
  } catch (error) {
    console.error('Error fetching tournament backgrounds:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch backgrounds' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { backgroundImage, opacity, overlay } = body;

    // Validate the inputs
    if (typeof backgroundImage !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Background image URL is required' },
        { status: 400 }
      );
    }

    if (opacity !== undefined && (typeof opacity !== 'number' || opacity < 0 || opacity > 1)) {
      return NextResponse.json(
        { success: false, error: 'Opacity must be a number between 0 and 1' },
        { status: 400 }
      );
    }

    if (overlay !== undefined && (typeof overlay !== 'number' || overlay < 0 || overlay > 1)) {
      return NextResponse.json(
        { success: false, error: 'Overlay must be a number between 0 and 1' },
        { status: 400 }
      );
    }

    // Update the background settings
    tournamentBackgrounds = {
      backgroundImage: backgroundImage,
      opacity: opacity !== undefined ? opacity : tournamentBackgrounds.opacity,
      overlay: overlay !== undefined ? overlay : tournamentBackgrounds.overlay
    };

    return NextResponse.json({
      success: true,
      data: tournamentBackgrounds,
      message: 'Tournament background updated successfully'
    });
  } catch (error) {
    console.error('Error updating tournament background:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update background' },
      { status: 500 }
    );
  }
}