# 🗺️ **Visual Layout Diagrams**

## 📱 **INDEX.HTML - Dashboard Layout**

```
┌─────────────────────────────────────────────────────────────┐
│ NAVIGATION BAR (NAV)                                        │
│ [🎨Themes] GolfPro Fantasy    |Tournaments|Team Builder...[$2,450][👤] │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ MAIN CONTAINER - Split Layout                               │
│                                                             │
│ ┌─────────────────────────┐ ┌─────────────────────────────┐ │
│ │ LEFT PANEL (LFT)        │ │ RIGHT PANEL (RGT)           │ │
│ │                         │ │                             │ │
│ │ ┌─────────────────────┐ │ │ ┌─────────────────────────┐ │ │
│ │ │ Tournament Header   │ │ │ │ My Team Header          │ │ │
│ │ │ [🔴LIVE] Masters    │ │ │ │ Team 1|Team 2|Team 3    │ │ │
│ │ │ Timer: 02:34:15     │ │ │ └─────────────────────────┘ │ │
│ │ └─────────────────────┘ │ │                             │ │
│ │                         │ │ ┌─────────────────────────┐ │ │
│ │ ┌─────────────────────┐ │ │ │ Team Summary            │ │ │
│ │ │ Tournament Stats    │ │ │ │ Rank:#247 Score:-34     │ │ │
│ │ │ Entries│Pool│1st    │ │ │ │ Payout: $1,250          │ │ │
│ │ │ 12,847│$2.5M│$500K  │ │ │ └─────────────────────────┘ │ │
│ │ └─────────────────────┘ │ │                             │ │
│ │                         │ │ ┌─────────────────────────┐ │ │
│ │ ┌─────────────────────┐ │ │ │ Player Cards (Scroll)   │ │ │
│ │ │ Live Leaderboard    │ │ │ │ ┌─────────────────────┐ │ │ │
│ │ │ [1][👤]Scottie -12  │ │ │ │ │[👤]Scottie $12,500 │ │ │ │
│ │ │ [2][👤]Rory    -10  │ │ │ │ │-12 Rd3:-4 Pos:1st  │ │ │ │
│ │ │ [3][👤]Jon     -9   │ │ │ │ └─────────────────────┘ │ │ │
│ │ │ [4][👤]Viktor  -8   │ │ │ │ (5 more player cards)   │ │ │
│ │ │ [5][👤]Xander  -7   │ │ │ └─────────────────────────┘ │ │
│ │ │ [6][👤]Justin  -6   │ │ │                             │ │
│ │ └─────────────────────┘ │ │ ┌─────────────────────────┐ │ │
│ └─────────────────────────┘ │ │ [Edit Lineup][New Entry]│ │ │
│                             │ └─────────────────────────┘ │ │
│                             └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🏆 **TOURNAMENTS.HTML - Tournament Selection**

```
┌─────────────────────────────────────────────────────────────┐
│ NAVIGATION BAR (Same as above)                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                 │
│ Tournament Selection                    │ 8 Active │$12.5M │ │
│ Choose your competition                 │ Tourneys │ Pool  │ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FILTERS                                                     │
│ [All][Major][PGA][European][My Entries]    [Sort ▼]        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ TOURNAMENTS GRID                                            │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│ │[👑FEATURED] │ │ Tournament  │ │ Tournament  │           │
│ │ Masters     │ │ Card 2      │ │ Card 3      │           │
│ │ $500 Entry  │ │             │ │             │           │
│ │ $2.5M Prize │ │             │ │             │           │
│ └─────────────┘ └─────────────┘ └─────────────┘           │
│ (More tournament cards in grid layout...)                  │
└─────────────────────────────────────────────────────────────┘
```

## 📊 **LEADERBOARD.HTML - Live Leaderboard**

```
┌─────────────────────────────────────────────────────────────┐
│ NAVIGATION BAR (Same as above)                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ LEADERBOARD HEADER                                          │
│ Masters Tournament 2025  [🔴LIVE]    │-12│156│68│3:24│    │
│ Round 3 • Augusta National           │Ldr│Ply│Cut│Time│    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CONTROLS                                                    │
│ [Tournament Leaderboard][Fantasy Leaderboard]  [Filter▼][🔄]│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ LEADERBOARD TABLE                                           │
│ Pos │ Player Name    │ Score │ R1 │ R2 │ R3 │ R4 │ Total   │
│ ├─────────────────────────────────────────────────────────│ │
│ 1   │ Scottie S.     │  -12  │-4  │-5  │-3  │ - │   201   │
│ 2   │ Rory M.        │  -10  │-3  │-4  │-3  │ - │   203   │
│ 3   │ Jon R.         │  -9   │-2  │-4  │-3  │ - │   204   │
│ ... │ (Extended player list with detailed stats)           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 **COMPONENT LEGEND:**

- **🎨** = Color theme toggles
- **👤** = User avatar/profile
- **🔴** = Live indicator 
- **👑** = Featured badge
- **🔄** = Refresh/reload button
- **▼** = Dropdown menu
- **│** = Column separator
- **[Text]** = Button
- **┌─┐** = Card/container borders

---

## 📍 **QUICK LOCATION FINDER:**

### **Want to modify the countdown timer?**
→ **IDX-LFT-HDR** (Index → Left Panel → Tournament Header)

### **Want to change player card colors?**  
→ **IDX-RGT-CRD** (Index → Right Panel → Player Cards)

### **Want to adjust tournament filters?**
→ **TRN-FLT** (Tournaments → Filters section)

### **Want to modify the live leaderboard?**
→ **IDX-LFT-leaderboard** (Index → Left Panel → Leaderboard section)

This visual guide makes it super easy to identify exactly which section you want to modify! 🎯