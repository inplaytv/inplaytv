# InPlay.TV Coming Soon Page

## Overview
Premium, cinematic "Coming Soon" teaser page with email waitlist capture.

## Design Features
- **Dark, premium aesthetic** - Deep navy/black with soft teal/blue gradient atmospherics
- **Glass morphism panel** - Frosted glass effect for email capture
- **Subtle animations** - Slow gradient drift, fade-in effects
- **Fully responsive** - Mobile-optimized layout
- **Clean & minimal** - No clutter, centered layout, generous spacing

## Technical Stack
- Next.js 14+ page component
- CSS Modules for scoped styling
- Supabase for email storage
- TypeScript for type safety

## Setup Instructions

### 1. Create Database Table
Run the SQL migration to create the waitlist table:

```bash
# Connect to Supabase and run:
CREATE-WAITLIST-TABLE.sql
```

Or via Supabase CLI:
```bash
supabase db execute -f CREATE-WAITLIST-TABLE.sql
```

### 2. Environment Variables
Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Access the Page
Navigate to: `http://localhost:3000/coming-soon`

## File Structure

```
apps/web/src/app/
├── coming-soon/
│   ├── page.tsx          # Main component
│   └── page.module.css   # Scoped styles
└── api/
    └── waitlist/
        └── route.ts      # Email capture endpoint
```

## Features

### Email Capture
- Client-side validation
- Duplicate detection
- Success/error messaging
- Auto-dismiss notifications

### Database Schema
```sql
waitlist {
  id: UUID (primary key)
  email: TEXT (unique)
  source: TEXT (default: 'coming-soon-page')
  created_at: TIMESTAMPTZ
  notified: BOOLEAN (for launch notification tracking)
  notified_at: TIMESTAMPTZ
}
```

### Security
- Row Level Security (RLS) enabled
- Public can insert (join waitlist)
- Only admins can view/manage list
- Service role key for API operations

## Customization

### Colors
Edit `page.module.css` gradients:
```css
.background {
  background: 
    radial-gradient(...),  /* Adjust colors here */
    linear-gradient(...);
}
```

### Text Content
Edit `page.tsx`:
- `<div className={styles.logo}>` - Brand name
- `<div className={styles.tagline}>` - Subtitle
- `<p className={styles.description}>` - Main copy

### Animation Speed
Adjust in `page.module.css`:
```css
@keyframes gradientShift {
  /* Change duration in .background animation */
  animation: gradientShift 20s ease infinite;
}
```

## Admin Management

### View Waitlist
Query the database:
```sql
SELECT email, created_at, source
FROM waitlist
ORDER BY created_at DESC;
```

### Export to CSV
```sql
COPY (
  SELECT email, created_at, source
  FROM waitlist
  ORDER BY created_at DESC
) TO '/tmp/waitlist.csv' WITH CSV HEADER;
```

### Mark as Notified
When you launch:
```sql
UPDATE waitlist
SET notified = true, notified_at = NOW()
WHERE notified = false;
```

## Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile: iOS 14+, Android 5+

## Performance
- No external dependencies for UI
- Inline SVG for noise texture
- CSS animations (GPU accelerated)
- Optimized for Core Web Vitals

## Accessibility
- Semantic HTML
- Keyboard navigation
- Focus states
- ARIA labels (can be enhanced)
- High contrast ratios

## Notes
- Design inspired by Stripe's marketing aesthetic
- Intentionally vague - no product details
- Builds anticipation through restraint
- Professional, confident tone
