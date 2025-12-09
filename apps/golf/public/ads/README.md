# Advertisement Images

This folder contains advertisement images displayed throughout the golf application.

## Image Specifications

### Scorecard Confirmation Page Ads
**Location:** `/build-team/[competitionId]/confirm`

**Recommended Dimensions:**
- **Width:** 600px
- **Height:** 250px
- **Aspect Ratio:** 2.4:1 (Landscape)
- **File Format:** JPG, PNG, or WebP
- **Max File Size:** 500KB (for optimal loading)

### Current Ad Slots

1. **ad-slot-1.jpg** - Top advertisement slot
2. **ad-slot-2.jpg** - Middle advertisement slot
3. **ad-slot-3.jpg** - Bottom advertisement slot

## Design Guidelines

- **Background:** Should work well on dark backgrounds
- **Text:** High contrast, readable at various screen sizes
- **Branding:** Clear brand logo and call-to-action
- **Resolution:** 2x resolution (1200x500px) for retina displays, scaled down to 600x250px

## How to Replace Ads

1. Prepare your advertisement image with the recommended dimensions (600x250px)
2. Name your file: `ad-slot-1.jpg`, `ad-slot-2.jpg`, or `ad-slot-3.jpg`
3. Place the file in this directory (`/apps/golf/public/ads/`)
4. The image will be automatically displayed (may need browser refresh)

## Supported Formats

- **JPEG** (.jpg, .jpeg) - Best for photographs
- **PNG** (.png) - Best for images with transparency or text
- **WebP** (.webp) - Modern format with better compression

## Link Configuration

To add clickable links to advertisements:
1. Edit the component file: `/apps/golf/src/app/build-team/[competitionId]/confirm/page.tsx`
2. Update the `onClick` or wrap the image in an anchor tag
3. Add target URL and tracking parameters as needed

## Ad Performance Tips

- Use high-quality, professionally designed images
- Ensure clear call-to-action (CTA) buttons
- Test ads on both desktop and mobile viewports
- Optimize images for web (compress without losing quality)
- Consider A/B testing different ad creatives

## Example Ad Themes

- Premium golf equipment (clubs, bags, apparel)
- Golf course bookings and travel packages
- Golf training and coaching services
- Golf technology (simulators, GPS watches, launch monitors)
- Luxury lifestyle brands (watches, cars, fashion)
- Sports betting and fantasy golf platforms
