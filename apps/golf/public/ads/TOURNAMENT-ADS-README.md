# Tournament Slider Advertisement System

## Quick Start

### Adding Advertisements

1. **Prepare your image**:
   - **Size**: 1200 x 370 pixels (2:1 aspect ratio)
   - **Formats**: PNG, JPG, JPEG, SVG, or WebP
   - **File size**: Under 200KB recommended for fast loading
   - **Background**: Design works best with dark or vibrant backgrounds

2. **Place image file**:
   ```
   /apps/golf/public/ads/your-ad-name.png
   ```

3. **Update configuration** in `/apps/golf/src/app/tournaments/page.tsx` (line 354):
   ```typescript
   const advertisements = [
     {
       id: 'ad-1',
       imageUrl: '/ads/your-ad-name.png',
       clickUrl: 'https://your-destination-url.com',
       title: 'Your Ad Title',
       description: 'Your compelling description'
     },
     {
       id: 'ad-2',
       imageUrl: '/ads/another-ad.jpg',
       clickUrl: 'https://another-url.com',
       title: 'Second Ad Title',
       description: 'Another description'
     }
   ];
   ```

## Ad Display Behavior

- Ads appear **after every tournament** in the slider
- Multiple ads rotate automatically
- Slider auto-advances every 8 seconds
- Users can manually navigate with arrow buttons

## Design Features

### "SPONSORED" Badge
- Top-left corner with gold gradient
- Pulsing bullhorn icon
- Always visible on top of ad image (z-index: 10)

### Image Display
- Full-width, full-height coverage
- Maintains aspect ratio with `object-fit: cover`
- 16px border radius for consistency

### Text Overlay
- Bottom gradient overlay (black fade from bottom to transparent)
- Large title (2.5rem, bold)
- Description text (1.125rem)
- "Learn More" CTA button with purple gradient

### Hover Effects
- Slight scale animation (1.02x)
- Overlay extends slightly on hover
- CTA button shifts right with arrow icon

## Image Specifications

### Recommended Dimensions
- **Width**: 1200px
- **Height**: 370px
- **Aspect Ratio**: 2:1 (landscape)
- **Resolution**: 2x for retina displays (scale down to 600x300 in browser)

### Supported Formats
| Format | Use Case | Max Size |
|--------|----------|----------|
| **PNG** | Images with transparency, text | 200KB |
| **JPG** | Photographs, complex graphics | 150KB |
| **SVG** | Vector graphics, logos | 50KB |
| **WebP** | Modern format, best compression | 100KB |

### Design Guidelines

**Safe Zones:**
- **Top-left (200x100px)**: Reserved for "SPONSORED" badge
- **Bottom (full width x 250px)**: Covered by gradient overlay with text
- **Center (800x200px)**: Best area for main visual content

**Text Contrast:**
- The overlay uses your configured title and description
- Text is white with text-shadow for readability
- Ensure main image doesn't conflict with bottom text area

## Example Configurations

### Single Ad
```typescript
const advertisements = [
  {
    id: 'promo-1',
    imageUrl: '/ads/special-offer.png',
    clickUrl: 'https://inplaytv.com/promotions',
    title: 'Special Holiday Offer',
    description: 'Sign up now and get 50% bonus credits'
  }
];
```

### Multiple Rotating Ads
```typescript
const advertisements = [
  {
    id: 'partner-1',
    imageUrl: '/ads/golf-equipment.jpg',
    clickUrl: 'https://partner1.com',
    title: 'Premium Golf Equipment',
    description: 'Shop the latest clubs and gear'
  },
  {
    id: 'partner-2',
    imageUrl: '/ads/golf-travel.jpg',
    clickUrl: 'https://partner2.com',
    title: 'Luxury Golf Getaways',
    description: 'Book your dream golf vacation today'
  },
  {
    id: 'internal-promo',
    imageUrl: '/ads/tournament-promo.svg',
    clickUrl: 'https://inplaytv.com',
    title: 'Join InPlayTV Fantasy Golf',
    description: 'Compete in real-time tournaments'
  }
];
```

### No Ads (Empty Array)
```typescript
const advertisements = [];
// No ads will display, only tournament slides
```

## Frequency Control

Current setting: **1 ad after every tournament**

To change frequency, edit line ~792 in `page.tsx`:

```typescript
// Show ad after every tournament (current)
if (advertisements.length > 0) {
  slides.push({ type: 'ad', data: advertisements[adIndex] });
}

// Show ad after every 2 tournaments
if ((idx + 1) % 2 === 0 && advertisements.length > 0) {
  slides.push({ type: 'ad', data: advertisements[adIndex] });
}

// Show ad after every 3 tournaments
if ((idx + 1) % 3 === 0 && advertisements.length > 0) {
  slides.push({ type: 'ad', data: advertisements[adIndex] });
}
```

## Click Tracking

All ad links:
- Open in new tab (`target="_blank"`)
- Include security attributes (`rel="noopener noreferrer"`)
- Preserve referrer for analytics

To add click tracking:
```typescript
<a 
  href={ad.clickUrl}
  onClick={(e) => {
    // Your tracking code here
    console.log('Ad clicked:', ad.id);
    // Or send to analytics service
  }}
>
```

## Testing Your Ads

1. Save your image to `/apps/golf/public/ads/`
2. Update configuration in `page.tsx`
3. Refresh browser (hard refresh: Ctrl+F5)
4. Navigate to tournaments page
5. Watch slider auto-advance or use arrow buttons

## Troubleshooting

**Ad not showing?**
- Check image path starts with `/ads/` (not `./ads/` or `../ads/`)
- Verify file exists in `/apps/golf/public/ads/`
- Check browser console for 404 errors
- Ensure at least 1 tournament is visible (ads only show between tournaments)

**Badge overlapping text?**
- Badge has z-index: 10 (highest layer)
- Avoid placing important content in top-left 200x100px area
- Consider adjusting badge position in CSS if needed

**Image not fitting correctly?**
- Use 1200x600px (2:1 ratio) for best results
- CSS uses `object-fit: cover` to fill space
- Extreme aspect ratios may crop content

**Need help?**
Check the CSS in `/apps/golf/src/app/tournaments/tournaments.module.css` lines 445-540
