# 🖼️ Background Images - Complete Setup Guide

## 📁 Folder Location
```
apps/web/public/backgrounds/
```

All images placed in this folder are publicly accessible at `/backgrounds/[filename]`

---

## 🎨 Required Images

### 1️⃣ **hero-bg.jpg** (Hero Section Background)
- **File Path:** `apps/web/public/backgrounds/hero-bg.jpg`
- **URL in Code:** `/backgrounds/hero-bg.jpg`
- **Size:** 1920x1080px minimum (Full HD or 4K recommended)
- **Format:** JPG (compressed) or PNG
- **File Size:** < 500KB (optimize for web)
- **Subject Suggestions:**
  - Aerial view of golf course
  - Golf tournament crowd scene
  - Premium golf club close-up
  - Abstract golf-themed gradient
- **Color Tone:** Works best with cool tones (greens, blues) that blend with the purple gradient

### 2️⃣ **section-bg.jpg** (Content Sections Background)
- **File Path:** `apps/web/public/backgrounds/section-bg.jpg`
- **URL in Code:** `/backgrounds/section-bg.jpg`
- **Size:** 1920x1080px minimum
- **Format:** JPG (compressed) or PNG
- **File Size:** < 500KB
- **Subject Suggestions:**
  - Subtle golf course texture
  - Green fairway (blurred)
  - Golf ball on tee (soft focus)
  - Abstract pattern or gradient
- **Color Tone:** Subtle and muted (will be used at low opacity)

### 3️⃣ **noise.png** (Texture Overlay - Optional)
- **File Path:** `apps/web/public/backgrounds/noise.png`
- **URL in Code:** `/backgrounds/noise.png`
- **Already Referenced:** ✅ In `globals.css`
- **Size:** 200x200px (small tileable pattern)
- **Format:** PNG with transparency
- **File Size:** < 50KB
- **Subject:** Film grain, subtle noise, or paper texture
- **Opacity:** Set to 3% in CSS (already configured)

---

## 📋 Step-by-Step Setup

### Step 1: Add Images to Folder
1. Navigate to: `apps/web/public/backgrounds/`
2. Add your images with these exact filenames:
   - `hero-bg.jpg` (or `.png`)
   - `section-bg.jpg` (or `.png`)
   - `noise.png` (optional)

### Step 2: Update CSS for Hero Background

**Option A: Update `globals.css` (Site-Wide)**

Open `apps/web/src/app/globals.css` and modify the `body` background:

```css
body {
  /* Add the hero image before the gradient */
  background: 
    url('/backgrounds/hero-bg.jpg') center/cover no-repeat fixed,
    radial-gradient(circle at 20% 20%, rgba(102, 126, 234, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.15) 0%, transparent 50%),
    linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 50%, #0f1729 100%);
  background-attachment: fixed;
}
```

**Option B: Hero-Only Background (Recommended)**

Add to `apps/web/src/app/home.module.css`:

```css
.hero {
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('/backgrounds/hero-bg.jpg') center/cover no-repeat;
  opacity: 0.3; /* Adjust to blend with glass effect */
  z-index: -1;
  border-radius: 16px;
}
```

### Step 3: Add Section Backgrounds (Optional)

Create a reusable class in `home.module.css`:

```css
.bgImage {
  position: relative;
}

.bgImage::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('/backgrounds/section-bg.jpg') center/cover no-repeat;
  opacity: 0.15;
  z-index: -1;
  border-radius: 16px;
}
```

Then apply to components:
```tsx
<div className={`${styles.glass} ${styles.bgImage}`}>
  {/* Content */}
</div>
```

### Step 4: Restart Dev Server
```bash
# Stop the current server (Ctrl+C)
pnpm dev --filter web
```

---

## 🎨 Image Optimization Tips

### Before Adding Images:
1. **Resize** to recommended dimensions (1920x1080 or larger)
2. **Compress** using tools like:
   - TinyPNG (https://tinypng.com/)
   - Squoosh (https://squoosh.app/)
   - ImageOptim (Mac)
3. **Convert** to WebP for better compression (optional)
4. **Target** < 500KB file size for fast loading

### Recommended Tools:
- **Photoshop:** Export for Web (JPEG quality 60-80)
- **GIMP:** Free alternative to Photoshop
- **Online:** Squoosh.app, TinyPNG.com

---

## 📐 CSS Properties Reference

### Background Properties You Can Adjust:

```css
background-image: url('/backgrounds/hero-bg.jpg');
background-size: cover;           /* or 'contain', '100% 100%' */
background-position: center;      /* or 'top', 'bottom', '50% 50%' */
background-repeat: no-repeat;     /* or 'repeat', 'repeat-x' */
background-attachment: fixed;     /* or 'scroll', 'local' */
opacity: 0.3;                     /* 0 (transparent) to 1 (opaque) */
```

### Blend Modes (Advanced):
```css
mix-blend-mode: overlay;          /* or 'multiply', 'screen', 'soft-light' */
filter: blur(2px) brightness(0.8);
```

---

## 🎯 Current Setup

### ✅ Already Configured:
- `noise.png` reference in `globals.css`
- Glassmorphism effects ready to overlay images
- Responsive design will scale images automatically

### 📝 To Do:
1. Add `hero-bg.jpg` to `/public/backgrounds/`
2. Add `section-bg.jpg` to `/public/backgrounds/`
3. Add `noise.png` to `/public/backgrounds/` (optional)
4. Update CSS with chosen implementation (Option A or B)
5. Test and adjust opacity values

---

## 🔗 Useful Resources

### Free Stock Photos:
- **Unsplash:** https://unsplash.com/s/photos/golf-course
- **Pexels:** https://pexels.com/search/golf/
- **Pixabay:** https://pixabay.com/images/search/golf/

### Texture Patterns:
- **Subtle Patterns:** https://www.toptal.com/designers/subtlepatterns/
- **Transparent Textures:** https://www.transparenttextures.com/

### Image Optimization:
- **Squoosh:** https://squoosh.app/
- **TinyPNG:** https://tinypng.com/
- **ImageOptim:** https://imageoptim.com/

---

## 📊 File Structure After Setup

```
apps/web/public/backgrounds/
├── README.md                        (This guide)
├── PLACEMENT-GUIDE.css              (CSS examples)
├── ADD-hero-bg-HERE.txt             (Placeholder reminder)
├── ADD-section-bg-HERE.txt          (Placeholder reminder)
├── ADD-noise-HERE.txt               (Placeholder reminder)
├── hero-bg.jpg                      (👈 ADD THIS)
├── section-bg.jpg                   (👈 ADD THIS)
└── noise.png                        (👈 ADD THIS - optional)
```

---

## 🚀 Quick Start

1. **Download** or create 3 images
2. **Rename** them to exact filenames above
3. **Place** in `apps/web/public/backgrounds/`
4. **Update** `globals.css` or `home.module.css` with CSS from examples
5. **Restart** dev server
6. **Visit** http://localhost:3002 to see results

---

**Questions?** Check the `PLACEMENT-GUIDE.css` file in this folder for copy-paste CSS examples.
