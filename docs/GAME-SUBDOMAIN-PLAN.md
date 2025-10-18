# Future: Game Subdomain Setup

## 🎯 **Current vs Future Setup**

### **Current (Marketing Site):**
- **Domain:** inplaytv-web.vercel.app (or inplay.tv)
- **Purpose:** Marketing, signup, login, account management
- **Pages:**
  - Homepage (landing page)
  - Signup/Login
  - Account page

### **Future (Game App):**
- **Domain:** game.inplay.tv (or golf.inplay.tv)
- **Purpose:** Actual game/tournament interface
- **Pages:**
  - Tournament dashboard
  - Team builder
  - Leaderboards
  - Live scores
  - Scorecards

---

## 🔄 **User Flow**

### **Step 1: User Signs Up (Marketing Site)**
```
inplay.tv/signup → Create account → Verify email → Login
```

### **Step 2: User Logged In (Account Page)**
```
inplay.tv/account → View profile → "Go to Game" button
```

### **Step 3: Redirect to Game (Subdomain)**
```
game.inplay.tv → Authenticated user → Game dashboard
```

---

## 🔧 **Implementation Plan**

### **Phase 1: Current (Complete ✅)**
- ✅ Marketing site at inplay.tv
- ✅ Signup/login with password
- ✅ Email verification
- ✅ User profiles in database
- ✅ Account page

### **Phase 2: Game Subdomain (Next)**
1. Create new Next.js app for game
2. Deploy to game.inplay.tv
3. Share authentication with Supabase
4. Add "Go to Game" button on account page

### **Phase 3: Seamless Auth (Final)**
- Single sign-on between domains
- Share Supabase session
- Auto-redirect if already logged in

---

## 🚀 **How to Set Up Game Subdomain**

### **Option A: Separate Vercel Project (Recommended)**

**Benefits:**
- Independent deployments
- Separate codebase
- Better performance
- Easier to scale

**Setup:**
1. Create new Next.js app in monorepo:
   ```bash
   mkdir apps/game
   cd apps/game
   npx create-next-app@latest . --typescript --tailwind --app
   ```

2. Deploy to Vercel:
   - New project: "inplaytv-game"
   - Root directory: `apps/game`
   - Domain: game.inplay.tv

3. Share Supabase credentials:
   - Same `.env.local` with Supabase URL/key
   - Authentication works across both domains

4. Update account page with redirect:
   ```tsx
   <button onClick={() => window.location.href = 'https://game.inplay.tv'}>
     Go to Game →
   </button>
   ```

---

### **Option B: Single Project with Subdomains**

**Benefits:**
- Shared code
- Simpler setup
- Single deployment

**Setup:**
1. Configure Vercel domains:
   - inplay.tv → Marketing pages
   - game.inplay.tv → Game pages

2. Use middleware to route by subdomain:
   ```typescript
   // middleware.ts
   if (req.headers.get('host')?.includes('game.')) {
     return NextResponse.rewrite('/game/...');
   }
   ```

3. All pages in one project, routed by domain

---

## 🔐 **Authentication Across Subdomains**

### **Supabase Configuration:**

1. **Set Cookie Domain:**
   ```typescript
   const supabase = createBrowserClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
     {
       cookies: {
         domain: '.inplay.tv', // Note the leading dot!
       },
     }
   );
   ```

2. **Update Redirect URLs:**
   - Add: https://game.inplay.tv/auth/callback
   - Add: https://game.inplay.tv
   - Keep: https://inplay.tv/auth/callback

3. **Test Flow:**
   ```
   1. Login at inplay.tv
   2. Navigate to game.inplay.tv
   3. User already authenticated ✅
   ```

---

## 📊 **Recommended Domain Structure**

```
inplay.tv (or inplaytv.com)
├── / (homepage/marketing)
├── /signup (create account)
├── /login (authenticate)
├── /account (profile management)
└── /verify-email (email confirmation)

game.inplay.tv (or golf.inplay.tv)
├── / (game dashboard)
├── /tournaments (browse tournaments)
├── /team-builder (create team)
├── /leaderboard (rankings)
└── /live (live scores)

api.inplay.tv (future - optional)
└── API endpoints for game data
```

---

## 🎮 **Account Page Updates**

### **Current Account Page:**
Shows user email, name, sign out button

### **Future Account Page:**
```tsx
<div style={styles.card}>
  <h1>Welcome back, {name}!</h1>
  
  <div style={styles.quickLinks}>
    <a href="https://game.inplay.tv" style={styles.primaryButton}>
      🎮 Go to Game Dashboard
    </a>
    
    <a href="https://game.inplay.tv/tournaments" style={styles.secondaryButton}>
      🏆 Browse Tournaments
    </a>
  </div>
  
  <div style={styles.userInfo}>
    <p>Email: {email}</p>
    <p>Member since: {joinDate}</p>
  </div>
  
  <button onClick={handleSignOut}>Sign out</button>
</div>
```

---

## 🧪 **Testing Locally**

### **Simulate Subdomains Locally:**

1. **Edit hosts file:**
   ```
   Windows: C:\Windows\System32\drivers\etc\hosts
   Add:
   127.0.0.1 local.inplay.tv
   127.0.0.1 game.local.inplay.tv
   ```

2. **Run dev servers:**
   ```bash
   # Marketing site (port 3000)
   pnpm dev:web
   
   # Game site (port 3001)
   cd apps/game && pnpm dev
   ```

3. **Access locally:**
   - Marketing: http://local.inplay.tv:3000
   - Game: http://game.local.inplay.tv:3001

---

## ✅ **Next Steps**

1. **Buy domain:** inplay.tv (if not already owned)
2. **Configure DNS:**
   - inplay.tv → Vercel (marketing)
   - game.inplay.tv → Vercel (game app)
3. **Create game app** in `apps/game/`
4. **Deploy both** to Vercel
5. **Test authentication** across domains
6. **Add game link** to account page

---

## 📝 **Summary**

**Current Status:**
- ✅ Marketing site with auth complete
- ✅ Users can signup/login
- ✅ Profile stored in database
- ✅ Ready for game subdomain

**Next Phase:**
- Create game app
- Deploy to game.inplay.tv
- Share authentication
- Build tournament features

**User Experience:**
```
Signup → Login → Account Page → Click "Go to Game" → Game Dashboard
                    ↓
              (Same user, authenticated across domains)
```

The subdomain will feel like a seamless part of the same app! 🎯
