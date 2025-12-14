import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;
    
    // Path to web app's backgrounds folder
    const backgroundsDir = 'C:\\inplaytv - New\\apps\\web\\public\\backgrounds';
    const filePath = path.join(backgroundsDir, filename);
    
    // Check if file exists and is within the backgrounds directory
    if (!fs.existsSync(filePath) || !filePath.startsWith(backgroundsDir)) {
      return new NextResponse('Image not found', { status: 404 });
    }
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypeMap: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.avif': 'image/avif'
    };
    
    const contentType = contentTypeMap[ext] || 'image/jpeg';
    
    // Return the image with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Length': fileBuffer.length.toString()
      }
    });
    
  } catch (error) {
    console.error('Error serving background image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}