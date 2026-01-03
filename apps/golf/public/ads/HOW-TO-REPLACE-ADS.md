# How to Replace Tournament Slider Ads

## Quick Steps to Replace an Ad

### Option 1: Replace the File Directly (Easiest)
1. Navigate to `apps/golf/public/ads/`
2. **Delete** or **rename** the old file (e.g., `ad-slot-1.svg`)
3. **Copy your new image** to this folder
4. **Rename your image** to match: `ad-slot-1.svg` (or `.png`, `.jpg`)
5. Restart dev server: `pnpm dev:golf`
6. **Hard refresh browser**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Option 2: Add New File and Update Config
1. Copy your image to `apps/golf/public/ads/` (e.g., `my-golf-ad.png`)
2. Open `apps/golf/src/app/tournaments/page.tsx`
3. Find the `advertisements` array around **line 364**
4. Update the imageUrl:

```typescript
const advertisements = [
  {
    id: 'ad-1',
    imageUrl: '/ads/my-golf-ad.png',  // ← Change this path
    clickUrl: 'https://inplaytv.com',
    title: '',
    description: ''
  },
  // ... more ads
];
```

5. Save file, browser will hot-reload

## Important Notes

### File Paths
- Code path: `/ads/ad-slot-1.png`
- Actual location: `apps/golf/public/ads/ad-slot-1.png`
- The `/public/` folder is the web root - don't include "public" in the path!

### Supported Formats
- PNG (`.png`) - Best for graphics with transparency
- JPG/JPEG (`.jpg`, `.jpeg`) - Best for photos
- SVG (`.svg`) - Best for vector graphics (scalable)
- WebP (`.webp`) - Modern format, smaller file sizes

### Recommended Image Size
- **Width**: 1200 pixels
- **Height**: 370 pixels
- **Aspect Ratio**: Roughly 3:1 (landscape)
- **File Size**: Under 200KB for fast loading

### Common Issues

**Problem**: Image doesn't show after replacing
- **Solution 1**: Hard refresh browser (Ctrl+Shift+R)
- **Solution 2**: Check browser console (F12) for 404 errors
- **Solution 3**: Verify filename matches EXACTLY (case-sensitive)
- **Solution 4**: Restart dev server: `pnpm kill:ports` then `pnpm dev:golf`

**Problem**: Image shows but looks stretched/squashed
- **Solution**: Resize image to recommended dimensions (1200 x 370)

**Problem**: Wrong ad is showing
- **Solution**: Check both `ad-slot-1` and `ad-slot-2` files - slider alternates between them

## Current Active Ads

Check `apps/golf/src/app/tournaments/page.tsx` line 364 to see which files are currently being used:

1. **Ad Slot 1**: `/ads/ad-slot-1.svg`
2. **Ad Slot 2**: `/ads/ad-slot-2.png`

## Testing Your Changes

1. Go to http://localhost:3003/tournaments
2. Look at the tournament slider
3. Ads appear **after each tournament card**
4. Watch the slider auto-advance (every 8 seconds)
5. Check that clicking the ad opens the correct URL

## Adding More Ads

You can have unlimited ads. Just add more objects to the array:

```typescript
const advertisements = [
  { id: 'ad-1', imageUrl: '/ads/ad-1.png', clickUrl: '...' },
  { id: 'ad-2', imageUrl: '/ads/ad-2.png', clickUrl: '...' },
  { id: 'ad-3', imageUrl: '/ads/ad-3.png', clickUrl: '...' },  // New!
];
```

The system will rotate through all ads automatically.
