import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string; filename: string } }
) {
  try {
    const { category, filename } = params;
    
    // Construct the file path
    const imagePath = path.join(process.cwd(), 'public', 'main_images', category, filename);
    
    // Check if file exists
    try {
      await fs.access(imagePath);
    } catch (error) {
      console.error(`Image not found: ${imagePath}`);
      return new NextResponse('Image not found', { status: 404 });
    }

    // Read the file
    const fileBuffer = await fs.readFile(imagePath);
    
    // Get the file extension to determine content type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/jpeg'; // default
    
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.svg') contentType = 'image/svg+xml';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });

  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}