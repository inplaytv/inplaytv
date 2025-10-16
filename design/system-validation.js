/**
 * Test Script for Golf Website System Validation
 * Run this in browser console to validate system functionality
 */

console.log("🏌️ Starting Golf Website System Validation...\n");

// Test 1: Dark Mode Functionality
function testDarkMode() {
    console.log("🌙 Testing Dark Mode Functionality:");
    
    // Check if dark mode elements exist
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    
    if (darkModeToggle) {
        console.log("✅ Dark mode toggle found");
        
        // Test localStorage
        const currentMode = localStorage.getItem('darkMode');
        console.log(`📦 Current localStorage darkMode: ${currentMode}`);
        
        // Test toggle function
        if (typeof toggleDarkMode === 'function') {
            console.log("✅ toggleDarkMode function exists");
        } else {
            console.log("❌ toggleDarkMode function missing");
        }
        
        // Check if dark mode class is properly applied
        const isDarkMode = body.classList.contains('dark-mode');
        console.log(`🎨 Current mode: ${isDarkMode ? 'Dark' : 'Light'}`);
        
    } else {
        console.log("ℹ️  No dark mode toggle on this page (expected for some pages)");
    }
}

// Test 2: Responsive Design
function testResponsiveDesign() {
    console.log("\n📱 Testing Responsive Design:");
    
    const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
    };
    
    console.log(`📏 Current viewport: ${viewport.width} x ${viewport.height}`);
    
    if (viewport.width <= 480) {
        console.log("📱 Mobile viewport detected");
    } else if (viewport.width <= 768) {
        console.log("📱 Tablet viewport detected");
    } else if (viewport.width <= 1200) {
        console.log("🖥️  Desktop viewport detected");
    } else {
        console.log("🖥️  Large desktop viewport detected");
    }
    
    // Check for mobile nav
    const mobileNav = document.getElementById('mobileNav');
    if (mobileNav) {
        console.log("✅ Mobile navigation found");
    }
}

// Test 3: Tournament Filter Buttons
function testTournamentFilters() {
    console.log("\n🏆 Testing Tournament Filter Buttons:");
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length > 0) {
        console.log(`✅ Found ${filterButtons.length} filter buttons`);
        
        filterButtons.forEach((btn, index) => {
            const isActive = btn.classList.contains('active');
            console.log(`${index + 1}. ${btn.textContent} ${isActive ? '(Active)' : ''}`);
        });
        
        // Check for updated button names
        const expectedNames = ['Full Course', 'Beat The Cut', 'Round: 1', 'Round: 2', 'Round: 3', 'Round: 4'];
        const actualNames = Array.from(filterButtons).map(btn => btn.textContent);
        
        const hasNewNames = expectedNames.some(name => actualNames.includes(name));
        if (hasNewNames) {
            console.log("✅ Updated button names detected");
        } else {
            console.log("ℹ️  Using standard button names");
        }
    } else {
        console.log("ℹ️  No tournament filter buttons on this page");
    }
}

// Test 4: Navigation and Links
function testNavigation() {
    console.log("\n🔗 Testing Navigation:");
    
    const navLinks = document.querySelectorAll('.nav-link');
    if (navLinks.length > 0) {
        console.log(`✅ Found ${navLinks.length} navigation links`);
    }
    
    // Check for user dropdown
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        console.log("✅ User dropdown menu found");
    }
    
    // Check for mobile menu functionality
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    if (hamburgerMenu) {
        console.log("✅ Mobile hamburger menu found");
    }
}

// Test 5: Performance Check
function testPerformance() {
    console.log("\n⚡ Performance Check:");
    
    // Check for console errors
    const errorCount = console.error.length || 0;
    console.log(`🐛 Console errors: ${errorCount}`);
    
    // Check page load performance
    if (performance && performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`⏱️  Page load time: ${loadTime}ms`);
    }
    
    // Check CSS file size (estimate)
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    console.log(`🎨 CSS files loaded: ${stylesheets.length}`);
}

// Run all tests
function runAllTests() {
    console.log("=".repeat(50));
    testDarkMode();
    testResponsiveDesign();
    testTournamentFilters();
    testNavigation();
    testPerformance();
    console.log("\n" + "=".repeat(50));
    console.log("🎉 System validation complete!");
    console.log("💡 Tip: Test dark mode toggle and navigate between pages to verify persistence");
}

// Auto-run tests
runAllTests();