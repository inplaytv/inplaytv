import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || 'tournaments';
    
    // All page categories use images from the tournaments folder
    const backgroundsDir = `C:\\inplaytv - New\\apps\\web\\public\\main_images\\tournaments`;
    
    console.log('Looking for backgrounds at:', backgroundsDir);
    console.log('Category:', category);
    
    // Check if directory exists
    if (!fs.existsSync(backgroundsDir)) {
      console.log('Directory not found:', backgroundsDir);
      return NextResponse.json({ backgrounds: [] });
    }

    // Read directory contents
    const files = fs.readdirSync(backgroundsDir);
    console.log('All files found:', files);
    
    // Filter for image files
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext);
    });
    
    console.log('Image files:', imageFiles);

    // Create response with image details
    const backgrounds = imageFiles.map(file => {
      const stats = fs.statSync(path.join(backgroundsDir, file));
      return {
        filename: file,
        url: `/api/images/tournaments/${file}`, // Always serve from tournaments folder
        name: file.replace(/\.[^/.]+$/, "").replace(/-/g, ' ').replace(/_/g, ' '),
        size: stats.size
      };
    });

    console.log('Backgrounds response:', backgrounds.length, 'items');
    return NextResponse.json({ backgrounds });
  } catch (error) {
    console.error('Error fetching backgrounds:', error);
    return NextResponse.json({ error: 'Failed to fetch backgrounds' }, { status: 500 });
  }
}