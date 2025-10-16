# 🗺️ **Golf Website Reference Map**
### Complete Section & Container Guide for All Pages

---

## 🏠 **INDEX.HTML - Main Dashboard**

### **📱 Navigation Bar** `.navbar`
- **Color Theme Toggles** `.color-toggles`
  - Teal, Green, Blue circular buttons (top-left)
- **Brand Logo** `.nav-brand`
  - Golf ball icon + "GolfPro Fantasy" text
- **Navigation Links** `.nav-links`
  - Dashboard, Tournaments, Leaderboard, Profile
- **User Section** `.nav-user`
  - Balance display: "$2,450"
  - User avatar image

---

### **🎯 Main Container** `.main-container`
**Split into two main panels:**

#### **⬅️ LEFT PANEL** `.left-panel`

1. **Tournament Header Card** `.tournament-header.glass-card`
   - **Live Badge** `.live-badge` - Red pulsing "LIVE" indicator
   - **Tournament Info** `.tournament-info`
     - Title: "Masters Tournament 2025"
     - Subtitle: "Round 3 • Augusta National"
   - **Countdown Timer** `.tournament-timer`
     - Hours, Minutes, Seconds blocks

2. **Tournament Stats Card** `.tournament-stats.glass-card`
   - **Four stat boxes:**
     - Total Entries: "12,847"
     - Prize Pool: "$2.5M"
     - First Place: "$500K"
     - Players: "156"

3. **Live Leaderboard Section** `.leaderboard-section`
   - **Section Header** - "Live Leaderboard" + "View All" button
   - **Leaderboard Card** `.leaderboard.glass-card`
     - **6 player rows**, each containing:
       - Rank badge (1st=Gold, 2nd=Silver, 3rd=Bronze)
       - Player avatar image
       - Player name + country
       - Score + change indicator (arrows)

#### **➡️ RIGHT PANEL** `.right-panel`

1. **Scorecard Header** `.scorecard-header`
   - "My Team" title
   - **Team Control Buttons** `.team-controls`
     - Team 1, Team 2, Team 3 buttons

2. **Team Summary Card** `.team-summary.glass-card`
   - **Team Stats** `.team-stats` (3 columns):
     - Current Rank: "#247"
     - Total Score: "-34"
     - Projected Payout: "$1,250"
   - **Team Trend** `.team-trend`
     - Trending up arrow + "+15 positions"

3. **Scorecard Container** `.scorecard-container`
   - **Scrollable Player Cards** `.scorecard-scroll`
     - **6 player cards**, each containing:
       - Player avatar (60x60px)
       - Player name + price
       - Score badge (color-coded: excellent/good/average/poor)
       - **Stats row**: Round 3 score, Position, Points

4. **Action Buttons** `.action-buttons`
   - "Edit Lineup" button (secondary)
   - "New Entry" button (primary)

---

## 🏆 **TOURNAMENTS.HTML - Tournament Selection**

### **📱 Navigation Bar** (Same as index.html)

### **🎯 Main Container** `.tournaments-container`

1. **Page Header Section** `.page-header`
   - **Header Content** `.header-content`
     - Title: "Tournament Selection"
     - Subtitle: "Choose your fantasy golf competition"
   - **Header Stats Card** `.header-stats.glass-card`
     - Active Tournaments: "8"
     - Total Prize Pool: "$12.5M"
     - My Entries: "3"

2. **Tournament Filters** `.tournament-filters`
   - **Filter Buttons** `.filter-buttons`
     - All Tournaments, Major Championships, PGA Tour, European Tour, My Entries
   - **Sort Options** `.sort-options`
     - Dropdown: Sort by Prize Pool/Entry Fee/Start Time/Entries

3. **Tournaments Grid** `.tournaments-grid`
   - **Featured Tournament Card** `.tournament-card.featured`
     - "FEATURED" crown badge
     - Tournament image
     - Tournament details
   - **Regular Tournament Cards** `.tournament-card`
     - Multiple tournament options with:
       - Entry fees
       - Prize pools
       - Entry counts
       - Start times

---

## 📊 **LEADERBOARD.HTML - Live Leaderboard**

### **📱 Navigation Bar** (Same as index.html)

### **🎯 Main Container** `.leaderboard-container`

1. **Leaderboard Header Card** `.leaderboard-header.glass-card`
   - **Tournament Info Section** `.tournament-info-section`
     - Tournament name: "Masters Tournament 2025"
     - Tournament details: Round 3, Augusta National
     - Live indicator (pulsing)
   - **Leaderboard Stats** `.leaderboard-stats`
     - Leader Score: "-12"
     - Players: "156"
     - Made Cut: "68"
     - Time Left: "3:24"

2. **Leaderboard Controls** `.leaderboard-controls`
   - **View Toggles** `.view-toggles`
     - "Tournament Leaderboard" vs "Fantasy Leaderboard"
   - **Filters** `.leaderboard-filters`
     - Player filter dropdown
     - Refresh button

3. **Main Leaderboard Table** `.leaderboard-table`
   - **Extended player list** with detailed stats
   - **Columns**: Position, Player, Score, Round scores, etc.

---

## 🎨 **GLOBAL ELEMENTS (All Pages)**

### **🖼️ Background System** `.background-container`
- **Theme-based golf course images**
- **Overlay effects**: blur, brightness, opacity
- **Location**: `images/backgrounds/`

### **🎭 Glassmorphism Cards** `.glass-card`
- **Semi-transparent background**
- **Blur effects** (backdrop-filter)
- **Subtle borders and shadows**

### **🎨 Color Theme System**
- **CSS Custom Properties** for theming
- **Three themes**: Teal, Green, Blue
- **Affects**: Gradients, accents, highlights

---

## 📝 **REFERENCE CODES FOR EASY COMMUNICATION**

### **Page Codes:**
- **IDX** = index.html (Dashboard)
- **TRN** = tournaments.html
- **LDB** = leaderboard.html

### **Section Codes:**
- **NAV** = Navigation bar
- **LFT** = Left panel (index only)
- **RGT** = Right panel (index only)
- **HDR** = Page header
- **FLT** = Filters section
- **GRD** = Grid/table content

### **Component Codes:**
- **CRD** = Glass cards
- **BTN** = Buttons
- **STT** = Stats/numbers
- **PLR** = Player elements
- **TMR** = Timer/countdown

---

## 🎯 **EXAMPLE USAGE:**

Instead of saying: *"Can you change the color of the scorecard section?"*

Say: **"Can you change the color in IDX-RGT-CRD (Right panel scorecard cards)?"**

Instead of saying: *"The leaderboard looks wrong"*

Say: **"Fix the styling in IDX-LFT-leaderboard section (Left panel Live Leaderboard)?"**

---

## 📁 **FILE STRUCTURE REFERENCE:**

```
c:\golfwebsite\
├── index.html              # IDX - Main Dashboard
├── tournaments.html        # TRN - Tournament Selection  
├── leaderboard.html        # LDB - Live Leaderboard
├── styles.css              # All styling (1700+ lines)
├── script.js               # All JavaScript functionality
└── images/backgrounds/     # Golf course background images
```

This reference map will help you specify exactly which section, card, button, or element you want to modify! 🏌️‍♂️✨