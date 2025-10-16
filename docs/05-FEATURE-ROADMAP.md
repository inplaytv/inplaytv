# Feature Roadmap

Planned features and implementation order for the Fantasy Golf platform.

## Phase 1: Foundation ✅ COMPLETE
- [x] Monorepo setup
- [x] Next.js web app
- [x] Supabase integration
- [x] Magic link authentication
- [x] Basic routing

## Phase 2: Core Web App 🚧 CURRENT
**Goal:** Public-facing website with user accounts

### User Management
- [ ] User profile page (edit username)
- [ ] Profile pictures (Supabase Storage)
- [ ] User settings page
- [ ] Password reset flow

### Content Pages
- [ ] About page
- [ ] How to play page
- [ ] Pricing page
- [ ] FAQ page
- [ ] Terms of service
- [ ] Privacy policy

### Navigation
- [ ] Header component with logo
- [ ] Navigation menu
- [ ] Footer component
- [ ] Mobile responsive menu

## Phase 3: Database Schema
**Goal:** Complete data model for tournaments and gameplay

### Tables to Create
- [ ] `tournaments` - Golf tournament data
- [ ] `golfers` - Professional golfer roster
- [ ] `entries` - User tournament entries
- [ ] `picks` - User golfer selections
- [ ] `scores_live` - Real-time score data
- [ ] `leaderboards` - Calculated standings
- [ ] `transactions` - Payment records

See `06-DATABASE-SCHEMA.md` for SQL

## Phase 4: Game App (apps/app)
**Goal:** Main gameplay application

### Tournament Features
- [ ] Browse available tournaments
- [ ] View tournament details
- [ ] Entry fee and prize pool display
- [ ] Tournament status (upcoming/live/completed)

### Player Selection
- [ ] Browse golfer roster
- [ ] View golfer stats
- [ ] Search and filter golfers
- [ ] Salary system integration
- [ ] Build lineup (6-8 golfers)
- [ ] Lineup validation

### Entry Management
- [ ] Submit entry
- [ ] View my entries
- [ ] Edit entries (before tournament starts)
- [ ] Cancel entry and refund

### Live Scoring
- [ ] Real-time leaderboard
- [ ] My lineup live scores
- [ ] Hole-by-hole updates
- [ ] Push notifications for position changes

## Phase 5: Payments & Prizes
**Goal:** Monetization and payouts

### Stripe Integration
- [ ] Connect Stripe account
- [ ] Entry fee payment flow
- [ ] Saved payment methods
- [ ] Payment history

### Prize Distribution
- [ ] Automated winner calculation
- [ ] Prize pool distribution logic
- [ ] Payout processing
- [ ] Transaction history
- [ ] Tax documentation (1099s)

## Phase 6: Admin Dashboard (apps/dashboard)
**Goal:** Internal operations and management

### Tournament Management
- [ ] Create new tournaments
- [ ] Edit tournament details
- [ ] Set entry fees and prizes
- [ ] Open/close entries

### Golfer Management
- [ ] Add/edit golfer profiles
- [ ] Update salaries
- [ ] Import from PGA API
- [ ] Injury/withdrawal management

### Score Management
- [ ] Manual score entry
- [ ] Bulk import from data feed
- [ ] Score corrections
- [ ] Live score monitoring

### User Support
- [ ] User search
- [ ] View user details
- [ ] Refund processing
- [ ] Ban/suspend users
- [ ] Support ticket system

### Analytics
- [ ] Revenue dashboard
- [ ] User growth metrics
- [ ] Popular tournaments
- [ ] Payment success rates

## Phase 7: Advanced Features
**Goal:** Competitive advantages and engagement

### Social Features
- [ ] Private leagues
- [ ] Challenge friends
- [ ] Chat/comments
- [ ] Leaderboard sharing

### Game Modes
- [ ] Salary cap mode (current)
- [ ] Snake draft mode
- [ ] Season-long leagues
- [ ] Bracket challenges

### Engagement
- [ ] Email notifications
- [ ] Push notifications (PWA)
- [ ] In-app messages
- [ ] Achievement badges

### Personalization
- [ ] Favorite golfers
- [ ] Tournament recommendations
- [ ] Lineup suggestions
- [ ] Historical performance stats

## Phase 8: Scale & Optimize
**Goal:** Production-ready performance

### Performance
- [ ] Implement caching
- [ ] Optimize database queries
- [ ] CDN for static assets
- [ ] Image optimization

### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] User analytics
- [ ] Uptime monitoring

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Load testing

## Implementation Order

**Week 1-2:** Phase 2 (Web app content)
**Week 3-4:** Phase 3 (Database schema)
**Week 5-8:** Phase 4 (Game app core)
**Week 9-10:** Phase 5 (Payments)
**Week 11-12:** Phase 6 (Admin dashboard)

## Priority Matrix

### Must Have (MVP)
- User authentication ✅
- Tournament listing
- Player selection
- Entry submission
- Basic leaderboard

### Should Have (v1.0)
- Live scoring
- Payment processing
- Basic admin tools
- Mobile responsive

### Nice to Have (v2.0)
- Social features
- Advanced analytics
- Multiple game modes
- Push notifications

### Future (v3.0+)
- Native mobile apps
- TV/streaming integration
- Fantasy points marketplace
- AI-powered lineup suggestions
