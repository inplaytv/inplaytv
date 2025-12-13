# 🚀 InPlay.TV Coming Soon Page - Complete!

## ✅ What's Been Created

### 1. Premium Coming Soon Page
**Location:** `apps/web/src/app/coming-soon/`
- **page.tsx** - Main React component with email capture
- **page.module.css** - Cinematic dark theme styling

### 2. API Endpoint
**Location:** `apps/web/src/app/api/waitlist/route.ts`
- Handles email submissions
- Validates email format
- Prevents duplicates
- Stores in Supabase

### 3. Database Migration
**Location:** `CREATE-WAITLIST-TABLE.sql`
- Creates `waitlist` table
- Sets up security policies
- Configures indexes

## 🎯 Quick Start

### Step 1: Create Database Table

**Option A - Supabase Dashboard (Easiest):**
1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `CREATE-WAITLIST-TABLE.sql`
5. Click **Run** or press `Ctrl+Enter`
6. You should see "Success. No rows returned"

**Option B - Supabase CLI:**
```bash
supabase db execute -f CREATE-WAITLIST-TABLE.sql
```

### Step 2: Start Web Server

```powershell
# From the project root
pnpm dev:web
```

Or use the setup script:
```powershell
.\setup-coming-soon.ps1
```

### Step 3: View the Page

Open your browser to:
```
http://localhost:3000/coming-soon
```

## 🎨 Design Specifications

### Visual Design
✓ Deep navy to black background (#050a1f → #0a1628)
✓ Soft teal/blue gradient atmospherics
✓ Subtle noise texture overlay
✓ Radial gradient vignette effect
✓ Glass morphism email capture panel
✓ Frosted glass blur effect
✓ Ultra-minimal, centered layout

### Typography
✓ Single modern sans-serif font
✓ Large "COMING SOON" headline (3-5rem responsive)
✓ Muted secondary text (#94a3b8, #cbd5e1)
✓ Tight letter spacing (0.05em on headline)
✓ Clear hierarchy

### Interactions
✓ Subtle button hover effects
✓ Input focus states with glow
✓ 20-second gradient animation loop
✓ Fade-in page load animation
✓ Success/error message auto-dismiss

### Responsive
✓ Mobile-optimized (stacked form layout)
✓ Tablet-friendly
✓ Desktop centered with max-width
✓ Fluid typography scaling

## 📋 Content

Current page text:

**Branding:**
- Logo: "InPlayTV"
- Tagline: "A new way to follow what matters."

**Headline:**
- "COMING SOON"

**Description:**
- "Something new is taking shape. A platform built for those who demand more from their experience."

**Email Panel:**
- Title: "Be the first to know"
- Input placeholder: "Enter your email"
- Button: "Notify me"
- Disclaimer: "No spam. Only the launch."

### Customizing Content

Edit [`apps/web/src/app/coming-soon/page.tsx`](apps/web/src/app/coming-soon/page.tsx):

```tsx
// Lines 58-60 - Change branding
<div className={styles.logo}>InPlayTV</div>
<div className={styles.tagline}>A new way to follow what matters.</div>

// Lines 64-67 - Change headline and description
<h1 className={styles.headline}>COMING SOON</h1>
<p className={styles.description}>
  Your custom message here...
</p>

// Line 71 - Change panel title
<div className={styles.panelTitle}>Be the first to know</div>
```

## 🎨 Customizing Colors

Edit [`apps/web/src/app/coming-soon/page.module.css`](apps/web/src/app/coming-soon/page.module.css):

```css
/* Background gradients (line 33-37) */
.background {
  background: 
    radial-gradient(ellipse at 50% -20%, rgba(14, 165, 233, 0.15), transparent),
    radial-gradient(ellipse at 20% 80%, rgba(6, 182, 212, 0.1), transparent),
    /* Add more or adjust existing gradients */
}

/* Button color (line 221-222) */
.button {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.9) 0%, rgba(6, 182, 212, 0.9) 100%);
}

/* Text colors */
.logo { color: #f8fafc; }          /* White/off-white */
.tagline { color: #94a3b8; }       /* Muted grey */
.headline { color: #f1f5f9; }      /* Off-white */
.description { color: #cbd5e1; }   /* Light grey */
```

## 📊 Managing the Waitlist

### View All Emails
Run in Supabase SQL Editor:
```sql
SELECT email, created_at, source
FROM waitlist
ORDER BY created_at DESC;
```

### Count Total Signups
```sql
SELECT COUNT(*) as total_signups
FROM waitlist;
```

### Export to CSV
```sql
COPY (
  SELECT email, created_at, source
  FROM waitlist
  ORDER BY created_at DESC
) TO '/tmp/waitlist.csv' WITH CSV HEADER;
```

### Mark All as Notified (After Launch)
```sql
UPDATE waitlist
SET notified = true, notified_at = NOW()
WHERE notified = false;
```

### Delete Test Entries
```sql
DELETE FROM waitlist
WHERE email LIKE '%test%' OR email LIKE '%example.com';
```

## 🔒 Security Features

✓ Row Level Security (RLS) enabled
✓ Public can only INSERT (join waitlist)
✓ Only admins can SELECT/UPDATE
✓ Email uniqueness enforced
✓ Input validation on client and server
✓ Service role key for API operations

## 🧪 Testing Checklist

- [ ] Run SQL migration successfully
- [ ] Web server starts without errors
- [ ] Page loads at `/coming-soon`
- [ ] Background gradients animate smoothly
- [ ] Email input accepts valid emails
- [ ] Invalid emails show error message
- [ ] Valid emails show success message
- [ ] Duplicate emails show "already on list" message
- [ ] Form clears after successful submission
- [ ] Messages auto-dismiss after 5 seconds
- [ ] Responsive on mobile (< 640px)
- [ ] Hover effects work on button
- [ ] Focus states visible on input
- [ ] Check waitlist table in Supabase

## 📱 Mobile Preview

The page automatically adapts for mobile:
- Stacked form layout (vertical)
- Smaller headline (2.5-3.5rem)
- Reduced padding
- Full-width button
- Touch-friendly input sizes

Test at these breakpoints:
- Mobile: 375px, 414px
- Tablet: 768px
- Desktop: 1024px+

## 🚀 Going Live

### 1. Set Main Domain Route
To make this your main landing page, edit `apps/web/src/app/page.tsx`:

```tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/coming-soon');
}
```

### 2. Update SEO Metadata
Edit `apps/web/src/app/coming-soon/page.tsx`:

```tsx
export const metadata: Metadata = {
  title: "Coming Soon - InPlay.TV",
  description: "Something new is taking shape. Be the first to know when we launch.",
};
```

### 3. Production Deployment
```bash
# Build for production
pnpm build

# Deploy to Vercel/Netlify/etc
vercel deploy
```

## 🎯 Key Design Principles

1. **Restraint** - No product explanation, builds intrigue
2. **Premium** - High-end SaaS aesthetic like Stripe
3. **Atmosphere** - Soft gradients, subtle movement
4. **Confidence** - Clean, calm, professional
5. **Focus** - Single action (email capture)
6. **Quality** - Attention to detail in every element

## 📝 Notes

- **No navigation** - Intentionally standalone page
- **No footer** - Maintains focus on email capture
- **No imagery** - Pure atmosphere and typography
- **No icons** - Maximum simplicity
- **Vague messaging** - Creates curiosity
- **Fast loading** - No external dependencies
- **GPU optimized** - CSS animations only

## 🆘 Troubleshooting

**Page shows 404:**
- Ensure web server is running on port 3000
- Check file exists at `apps/web/src/app/coming-soon/page.tsx`

**Email submission fails:**
- Verify `CREATE-WAITLIST-TABLE.sql` ran successfully
- Check Supabase table exists: `select * from waitlist;`
- Verify environment variables in `.env.local`

**Gradients not animating:**
- Check browser supports CSS animations
- Hard refresh (Ctrl+Shift+R)
- Clear browser cache

**Styles not loading:**
- Verify `page.module.css` exists
- Check for CSS syntax errors
- Restart dev server

## 🎉 You're Done!

Your premium coming soon page is ready. Navigate to:
**http://localhost:3000/coming-soon**

The page features:
- ✓ Dark cinematic background with animated gradients
- ✓ Glass morphism email capture panel
- ✓ Professional, minimal design
- ✓ Fully functional waitlist
- ✓ Mobile responsive
- ✓ Success/error handling

Perfect for building anticipation before your launch! 🚀
