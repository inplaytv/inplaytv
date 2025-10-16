/**
 * Common Dark Mode functionality for Golf Website
 * Provides consistent dark mode toggle and persistence across all pages
 */

// Dark Mode Toggle Functions
function toggleDarkMode() {
    const body = document.body;
    const isDarkMode = body.classList.toggle('dark-mode');
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
    
    // Update toggle state if exists
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.checked = isDarkMode;
    }
    
    console.log(`Dark mode toggled: ${isDarkMode} on ${window.location.pathname}`);
}

function initializeDarkMode() {
    // Check for saved dark mode preference or default to light mode
    const darkMode = localStorage.getItem('darkMode');
    const body = document.body;
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    console.log(`${window.location.pathname}: initializeDarkMode called, darkMode = ${darkMode}`);
    
    if (darkMode === 'enabled') {
        body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
        console.log(`${window.location.pathname}: Applied dark mode class`);
    } else {
        body.classList.remove('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = false;
        console.log(`${window.location.pathname}: Applied light mode (removed dark-mode class)`);
    }
    
    console.log(`${window.location.pathname}: Dark mode initialized: ${darkMode}`);
}

function handleRowClick(event) {
    console.log(`${window.location.pathname}: handleRowClick called`);
    // Don't toggle if the click came from the checkbox itself to avoid double-triggering
    if (event && event.target && event.target.type === 'checkbox') {
        console.log(`${window.location.pathname}: Click came from checkbox, letting change event handle it`);
        return;
    }
    console.log(`${window.location.pathname}: Click came from row, toggling manually`);
    
    // Manually check/uncheck the checkbox and trigger its change event
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.checked = !darkModeToggle.checked;
        darkModeToggle.dispatchEvent(new Event('change'));
    }
}

// Common dropdown functionality
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    const arrow = document.querySelector('.user-dropdown-arrow');
    
    if (dropdown) {
        dropdown.classList.toggle('show');
        if (arrow) {
            arrow.classList.toggle('rotated');
        }
    }
}

function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const hamburger = document.querySelector('.hamburger-menu');
    
    if (mobileNav) {
        mobileNav.classList.toggle('show');
    }
    
    if (hamburger) {
        hamburger.classList.toggle('active');
    }
}

// Initialize dark mode on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log(`${window.location.pathname}: DOMContentLoaded fired`);
    initializeDarkMode();
    
    // Add event listener to dark mode toggle if it exists
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            console.log(`${window.location.pathname}: Change event fired`);
            toggleDarkMode();
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const userDropdown = document.getElementById('userDropdown');
        const userSection = document.querySelector('.nav-user');
        
        if (userDropdown && !userSection.contains(event.target)) {
            userDropdown.classList.remove('show');
            const arrow = document.querySelector('.user-dropdown-arrow');
            if (arrow) {
                arrow.classList.remove('rotated');
            }
        }
        
        const mobileNav = document.getElementById('mobileNav');
        const hamburger = document.querySelector('.hamburger-menu');
        
        if (mobileNav && !mobileNav.contains(event.target) && !hamburger.contains(event.target)) {
            mobileNav.classList.remove('show');
            hamburger.classList.remove('active');
        }
    });
});