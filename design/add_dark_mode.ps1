# Quick script to add dark mode to all tournament pages
$pages = @(
    'tournaments-executive.html',
    'tournaments-platinum.html', 
    'tournaments-gold.html'
)

$darkModeJS = @'

        // Dark Mode Toggle Functions
        function toggleDarkMode() {
            const body = document.body;
            const isDarkMode = body.classList.toggle('dark-mode');
            
            // Save preference to localStorage
            localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
            
            // Update toggle state
            const darkModeToggle = document.getElementById('darkModeToggle');
            if (darkModeToggle) {
                darkModeToggle.checked = isDarkMode;
            }
            
            console.log('Dark mode toggled:', isDarkMode);
        }

        function initializeDarkMode() {
            // Check for saved dark mode preference or default to light mode
            const darkMode = localStorage.getItem('darkMode');
            const body = document.body;
            const darkModeToggle = document.getElementById('darkModeToggle');
            
            if (darkMode === 'enabled') {
                body.classList.add('dark-mode');
                if (darkModeToggle) darkModeToggle.checked = true;
            } else {
                body.classList.remove('dark-mode');
                if (darkModeToggle) darkModeToggle.checked = false;
            }
            
            console.log('Dark mode initialized:', darkMode);
        }

        function handleRowClick(event) {
            // Don't toggle if the click came from the checkbox itself to avoid double-triggering
            if (event && event.target && event.target.type === 'checkbox') {
                return;
            }
            
            // Manually check/uncheck the checkbox and trigger its change event
            const darkModeToggle = document.getElementById('darkModeToggle');
            if (darkModeToggle) {
                darkModeToggle.checked = !darkModeToggle.checked;
                darkModeToggle.dispatchEvent(new Event('change'));
            }
        }

        // Initialize dark mode when page loads
        document.addEventListener('DOMContentLoaded', function() {
            initializeDarkMode();
            
            // Add event listener to toggle
            const darkModeToggle = document.getElementById('darkModeToggle');
            if (darkModeToggle) {
                darkModeToggle.addEventListener('change', function() {
                    toggleDarkMode();
                });
            }
        });
'@

Write-Host "Dark mode JS template ready for manual insertion"