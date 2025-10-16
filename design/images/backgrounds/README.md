# Golf Course Background Images

## How to Add Your Own Golf Course Backgrounds

### Quick Setup:
1. **Add your images** to the `images/backgrounds/` folder
2. **Name your images** with these exact names for automatic switching:
   - `golf-course-teal.jpg` - For the teal theme
   - `golf-course-green.jpg` - For the green theme  
   - `golf-course-blue.jpg` - For the blue theme

### Image Requirements:
- **Format**: JPG, PNG, or WebP
- **Resolution**: Minimum 1920x1080 (Full HD)
- **Aspect Ratio**: 16:9 or wider works best
- **File Size**: Keep under 2MB for fast loading

### Recommended Golf Course Images:
- **Teal Theme**: Ocean-side golf courses, coastal views
- **Green Theme**: Traditional parkland courses, lush fairways
- **Blue Theme**: Mountain courses, sky-focused shots

### Alternative Method:
If you want to use different filenames, edit the CSS file:
1. Open `styles.css`
2. Find the section `/* ===== BACKGROUND IMAGES =====`
3. Change the `background-image` URLs to match your filenames

### Default Behavior:
- If no images are found, the site will show the gradient background
- Images are automatically optimized for different screen sizes
- All themes share the same image if only one is provided

### Tips for Best Results:
- Use high-quality images with good contrast
- Avoid images that are too busy (they'll be blurred anyway)
- Golf course images work best, but any landscape is fine
- Test on different screen sizes to ensure it looks good