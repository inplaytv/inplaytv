# Background Images Setup Guide

## 📁 Folder Purpose
This folder contains background images for the InPlayTV website.

## 🎨 Recommended Images to Add

### 1. **hero-bg.jpg** or **hero-bg.png**
- **Usage:** Hero section background
- **Recommended Size:** 1920x1080px (Full HD) or larger
- **Format:** JPG (optimized) or PNG
- **Subject:** Golf course, tournament scene, or abstract golf-themed image
- **Notes:** Should work well with overlay gradient (dark theme)

### 2. **section-bg.jpg** or **section-bg.png**
- **Usage:** How It Works and other sections
- **Recommended Size:** 1920x1080px
- **Format:** JPG (optimized) or PNG
- **Subject:** Subtle golf texture, green fairway, or abstract pattern
- **Notes:** Keep it subtle so text remains readable

### 3. **noise.png** (Optional)
- **Usage:** Subtle texture overlay across entire site
- **Recommended Size:** 200x200px (small tileable pattern)
- **Format:** PNG with transparency
- **Subject:** Film grain or noise pattern
- **Notes:** Keep opacity very low (3-5%)

## 📏 Image Specifications

| Image | Resolution | File Size | Format | Purpose |
|-------|-----------|-----------|--------|---------|
| hero-bg | 1920x1080+ | < 500KB | JPG/PNG | Hero section |
| section-bg | 1920x1080+ | < 500KB | JPG/PNG | Content sections |
| noise | 200x200 | < 50KB | PNG | Texture overlay |

## 🎯 Image URLs in Code

Once you add images to this folder, they will be accessible at:

```
/backgrounds/hero-bg.jpg
/backgrounds/section-bg.jpg
/backgrounds/noise.png
```

## ✅ After Adding Images

1. Place your images in this folder (`apps/web/public/backgrounds/`)
2. Update `apps/web/src/app/globals.css` with the image URLs
3. Optimize images before uploading (compress JPGs, minimize PNGs)
4. Restart dev server if images don't appear immediately

## 🖼️ Example Image Sources

- **Stock Photos:** Unsplash, Pexels (search "golf course aerial", "golf tournament")
- **Textures:** Subtle Patterns, Transparent Textures
- **Custom:** Commission or create golf-themed backgrounds

---

**Current Status:** Folder ready for images. CSS will reference images once added.
