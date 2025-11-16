# Tournament Images Guide

## 📁 Folder Structure
All tournament background images are stored in:
```
apps/golf/public/images/tournaments/
```

## 🖼️ Image Files

### Background Images (for Promotional Cards)
- `golf-bg-01.jpg` - Background option 1
- `golf-bg-02.jpg` - Background option 2
- `golf-bg-03.jpg` - Background option 3
- `golf-bg-04.jpg` - Background option 4
- `golf-bg-05.png` - Background option 5

### Default Fallback
- `default.jpg` - Used when no specific background is set
- `default.png` - PNG fallback option

## 🎨 Image Specifications

### Recommended Dimensions
- **Width**: 1200px minimum
- **Height**: 600-800px
- **Aspect Ratio**: 16:9 or 3:2
- **File Size**: < 500KB (optimize for web)

### Supported Formats
- ✅ `.jpg` / `.jpeg` (preferred)
- ✅ `.png` (with transparency support)

The system automatically tries `.jpg` first, then falls back to `.png` if not found.

## 🔧 How to Add New Images

### Option 1: Simple Numbered Backgrounds
1. Save your image as `golf-bg-XX.jpg` (where XX = 01, 02, 03, etc.)
2. Place in `apps/golf/public/images/tournaments/`
3. Reference in admin panel as `golf-bg-XX.jpg`

**Example**: `golf-bg-06.jpg`, `golf-bg-07.jpg`

### Option 2: Specific Tournament Images
1. Save with descriptive name: `masters-2025.jpg`
2. Place in same folder
3. Reference in admin panel promotional card

### Option 3: Update Default
1. Replace `default.jpg` with your image
2. Keep the filename as `default.jpg`
3. This becomes the fallback for all cards without specific images

## 🎯 Using in Admin Panel

When creating/editing promotional cards:

1. Go to **Admin Panel** → **Promotional Cards**
2. In the "Background Image" field, enter **just the filename**:
   - ✅ `golf-bg-01.jpg`
   - ✅ `masters-2025.png`
   - ✅ `default.jpg`
   - ❌ `/images/tournaments/golf-bg-01.jpg` (don't include path)

The system automatically looks in the `/images/tournaments/` folder.

## 🔄 Image Loading Fallback Chain

If an image fails to load, the system tries:

1. Specified background image (e.g., `golf-bg-01.jpg`)
2. Same filename with `.png` extension
3. `default.jpg`
4. `default.png`
5. Unsplash placeholder

This ensures images **always display** even if files are missing.

## 📝 Naming Conventions

### ✅ Good Names (Recommended)
- `golf-bg-01.jpg` through `golf-bg-99.jpg`
- `default.jpg`
- `masters-2025.jpg`
- `us-open-2025.jpg`
- `pga-championship.jpg`

### ⚠️ Avoid
- Spaces: `golf bg 01.jpg` ❌
- Special characters: `golf-bg#01.jpg` ❌
- Long names: `masters-tournament-augusta-national-2025-championship.jpg` ❌

## 🎨 Image Optimization Tips

1. **Compress images** before uploading (use TinyPNG, ImageOptim, etc.)
2. **Use JPG** for photographs (smaller file size)
3. **Use PNG** only if you need transparency
4. **Target 300-500KB** per image
5. **Dimensions**: 1200x800px is ideal balance

## 🚀 Quick Start

**To add a new tournament background:**

1. Optimize your image (1200x800px, <500KB)
2. Name it `golf-bg-06.jpg` (next number in sequence)
3. Copy to `c:\inplaytv\apps\golf\public\images\tournaments\`
4. In admin panel, set background image to `golf-bg-06.jpg`
5. Done! ✅

## 🔍 Troubleshooting

### Image not showing?
1. Check filename is exactly correct (case-sensitive on some systems)
2. Verify file is in correct folder: `apps/golf/public/images/tournaments/`
3. Try clearing browser cache (Ctrl+F5)
4. Check browser console for errors (F12)

### Image looks pixelated?
- Use higher resolution source image (minimum 1200px width)
- Save at higher quality (85-90% JPG quality)

### File size too large?
- Compress with TinyPNG.com or similar
- Reduce dimensions if larger than 1920px width
- Lower JPG quality to 80-85%

## 📊 Current Images Status

| Filename | Format | Purpose | Status |
|----------|--------|---------|--------|
| `default.jpg` | JPG | Fallback image | ✅ Active |
| `golf-bg-01.jpg` | JPG | Background option 1 | ✅ Active |
| `golf-bg-02.jpg` | JPG | Background option 2 | ✅ Active |
| `golf-bg-03.jpg` | JPG | Background option 3 | ✅ Active |
| `golf-bg-04.jpg` | JPG | Background option 4 | ✅ Active |
| `golf-bg-05.png` | PNG | Background option 5 | ✅ Active |

---

**Last Updated**: January 2025  
**Maintained By**: Development Team
