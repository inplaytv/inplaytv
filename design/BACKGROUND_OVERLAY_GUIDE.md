# 🎨 Background Image Overlay Customization Guide

## 📍 **Where to Find the Settings**

**File:** `styles.css`  
**Location:** Lines 58-90 (approximately)  
**Section:** `/* Default background image */` and `/* Theme-specific background images */`

---

## 🔧 **Current Settings (Reduced for Better Visibility)**

```css
filter: blur(1px) brightness(0.6) contrast(1.1);
opacity: 0.8;
```

**Previous (darker) settings were:**
```css
filter: blur(3px) brightness(0.3) contrast(1.2);
opacity: 0.6;
```

---

## ⚙️ **How to Customize Each Setting**

### **1. Blur Amount** `blur(1px)`
- **Purpose:** Softens image details so text remains readable
- **Values:** 
  - `blur(0px)` = Sharp/crisp image
  - `blur(1px)` = Slight softening (current)
  - `blur(3px)` = Moderate blur (previous)
  - `blur(5px)` = Heavy blur
- **Recommendation:** Keep between 0-2px for best visibility

### **2. Brightness** `brightness(0.6)`
- **Purpose:** Controls how light/dark the background appears
- **Values:**
  - `brightness(0.3)` = Very dark (previous)
  - `brightness(0.6)` = Medium dark (current)
  - `brightness(0.8)` = Lighter
  - `brightness(1.0)` = Original brightness
- **Recommendation:** 0.5-0.8 for good text readability

### **3. Contrast** `contrast(1.1)`
- **Purpose:** Enhances or reduces color differences
- **Values:**
  - `contrast(1.0)` = Normal contrast
  - `contrast(1.1)` = Slightly enhanced (current)
  - `contrast(1.2)` = More enhanced (previous)
  - `contrast(1.5)` = High contrast
- **Recommendation:** 1.0-1.3 for natural look

### **4. Opacity** `opacity: 0.8`
- **Purpose:** Overall transparency of the entire background layer
- **Values:**
  - `opacity: 0.6` = More transparent (previous)
  - `opacity: 0.8` = Less transparent (current)
  - `opacity: 1.0` = Fully visible
- **Recommendation:** 0.7-0.9 for good balance

---

## 🎯 **Common Customization Examples**

### **For Maximum Background Visibility:**
```css
filter: blur(0px) brightness(0.8) contrast(1.0);
opacity: 0.9;
```

### **For Better Text Readability:**
```css
filter: blur(2px) brightness(0.4) contrast(1.2);
opacity: 0.7;
```

### **For Balanced Look (Current):**
```css
filter: blur(1px) brightness(0.6) contrast(1.1);
opacity: 0.8;
```

### **For Subtle Background:**
```css
filter: blur(0.5px) brightness(0.9) contrast(1.0);
opacity: 0.9;
```

---

## 📱 **Mobile Settings**

**Location:** Lines 888-900 (approximately)

**Current mobile settings:**
- **Tablets:** `filter: blur(1px) brightness(0.6) contrast(1.1);`
- **Phones:** `filter: blur(0.5px) brightness(0.7) contrast(1.0);`

**Why different?** Mobile devices need lighter effects for performance and readability.

---

## 🎨 **Theme-Specific Adjustments**

Each color theme has its own settings:

- **Teal Theme:** `hue-rotate(0deg)` - Original colors
- **Green Theme:** `hue-rotate(15deg)` - Slightly more green
- **Blue Theme:** `hue-rotate(-20deg)` - Slightly more blue

**To adjust theme colors:**
- Increase hue-rotate values for more color shift
- Use `saturate(1.2)` to make colors more vibrant
- Use `saturate(0.8)` to make colors more muted

---

## 🔄 **How to Apply Changes**

1. **Open `styles.css`**
2. **Find line ~58:** `.background-container::before {`
3. **Modify the filter values** as desired
4. **Save the file**
5. **Hard refresh** your browser (`Ctrl + F5`)

**Tip:** Make small changes and test frequently to find your perfect balance!

---

## ⚡ **Quick Copy-Paste Options**

### Bright & Clear:
```css
filter: blur(0px) brightness(0.8) contrast(1.0);
opacity: 0.9;
```

### Medium Visibility (Current):
```css
filter: blur(1px) brightness(0.6) contrast(1.1);
opacity: 0.8;
```

### Dark & Atmospheric:
```css
filter: blur(2px) brightness(0.4) contrast(1.2);
opacity: 0.7;
```

Choose the style that best fits your golf course images and personal preference! 🏌️‍♂️