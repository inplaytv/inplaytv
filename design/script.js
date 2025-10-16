// ===== TOURNAMENT TIMER ===== 
class TournamentTimer {
    constructor() {
        this.targetTime = new Date();
        this.targetTime.setHours(this.targetTime.getHours() + 2);
        this.targetTime.setMinutes(this.targetTime.getMinutes() + 34);
        this.targetTime.setSeconds(this.targetTime.getSeconds() + 15);
        
        this.hoursElement = document.getElementById('hours');
        this.minutesElement = document.getElementById('minutes');
        this.secondsElement = document.getElementById('seconds');
        
        this.start();
    }
    
    start() {
        this.updateTimer();
        setInterval(() => this.updateTimer(), 1000);
    }
    
    updateTimer() {
        const now = new Date();
        const timeDiff = this.targetTime - now;
        
        if (timeDiff <= 0) {
            this.hoursElement.textContent = '00';
            this.minutesElement.textContent = '00';
            this.secondsElement.textContent = '00';
            return;
        }
        
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        this.hoursElement.textContent = hours.toString().padStart(2, '0');
        this.minutesElement.textContent = minutes.toString().padStart(2, '0');
        this.secondsElement.textContent = seconds.toString().padStart(2, '0');
    }
}

// ===== TEAM SWITCHING ===== 
class TeamSwitcher {
    constructor() {
        this.currentTeam = 1;
        this.teamButtons = document.querySelectorAll('.team-btn');
        this.initializeTeamData();
        this.bindEvents();
    }
    
    initializeTeamData() {
        this.teamData = {
            1: {
                rank: '#247',
                score: '-34',
                payout: '$1,250',
                trend: '+15 positions',
                players: [
                    { name: 'Scottie Scheffler', price: '$12,500', score: '-12', round: '-4', position: '1st', points: '85', badge: 'excellent' },
                    { name: 'Rory McIlroy', price: '$11,800', score: '-10', round: '-3', position: '2nd', points: '72', badge: 'good' },
                    { name: 'Viktor Hovland', price: '$9,200', score: '-8', round: '-2', position: '4th', points: '58', badge: 'good' },
                    { name: 'Xander Schauffele', price: '$10,400', score: '-7', round: '-1', position: '5th', points: '52', badge: 'good' },
                    { name: 'Justin Thomas', price: '$8,900', score: '-4', round: 'E', position: 'T12', points: '28', badge: 'average' },
                    { name: 'Hideki Matsuyama', price: '$7,600', score: '+1', round: '+2', position: 'T45', points: '8', badge: 'poor' }
                ]
            },
            2: {
                rank: '#89',
                score: '-28',
                payout: '$3,200',
                trend: '+5 positions',
                players: [
                    { name: 'Jon Rahm', price: '$11,200', score: '-9', round: '-3', position: '3rd', points: '68', badge: 'good' },
                    { name: 'Patrick Cantlay', price: '$10,800', score: '-6', round: '-2', position: '7th', points: '45', badge: 'good' },
                    { name: 'Collin Morikawa', price: '$9,800', score: '-5', round: '-1', position: '9th', points: '38', badge: 'average' },
                    { name: 'Max Homa', price: '$8,400', score: '-4', round: 'E', position: 'T12', points: '28', badge: 'average' },
                    { name: 'Tony Finau', price: '$7,800', score: '-3', round: '+1', position: 'T18', points: '22', badge: 'average' },
                    { name: 'Russell Henley', price: '$6,200', score: '-1', round: '+1', position: 'T32', points: '12', badge: 'poor' }
                ]
            },
            3: {
                rank: '#1,234',
                score: '-18',
                payout: '$45',
                trend: '-23 positions',
                players: [
                    { name: 'Tiger Woods', price: '$9,000', score: '-3', round: '-1', position: 'T18', points: '22', badge: 'average' },
                    { name: 'Jordan Spieth', price: '$8,600', score: '-2', round: 'E', position: 'T25', points: '18', badge: 'average' },
                    { name: 'Rickie Fowler', price: '$7,400', score: '-1', round: '+1', position: 'T32', points: '12', badge: 'poor' },
                    { name: 'Jason Day', price: '$6,800', score: 'E', round: '+2', position: 'T38', points: '8', badge: 'poor' },
                    { name: 'Adam Scott', price: '$6,400', score: '+2', round: '+3', position: 'T52', points: '4', badge: 'poor' },
                    { name: 'Phil Mickelson', price: '$5,800', score: '+4', round: '+2', position: 'T68', points: '2', badge: 'poor' }
                ]
            }
        };
    }
    
    bindEvents() {
        this.teamButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const teamNumber = parseInt(e.target.dataset.team);
                this.switchTeam(teamNumber);
            });
        });
    }
    
    switchTeam(teamNumber) {
        if (teamNumber === this.currentTeam) return;
        
        // Update button states
        this.teamButtons.forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`[data-team="${teamNumber}"]`).classList.add('active');
        
        // Update team data
        this.currentTeam = teamNumber;
        this.updateTeamSummary();
        this.updatePlayerCards();
    }
    
    updateTeamSummary() {
        const teamData = this.teamData[this.currentTeam];
        
        // Update stats
        document.querySelector('.rank-good').textContent = teamData.rank;
        document.querySelector('.score-good').textContent = teamData.score;
        document.querySelector('.team-stat:nth-child(3) .stat-value').textContent = teamData.payout;
        document.querySelector('.team-trend span').textContent = teamData.trend;
        
        // Update trend direction
        const trendElement = document.querySelector('.team-trend');
        const trendIcon = trendElement.querySelector('i');
        
        if (teamData.trend.includes('+')) {
            trendIcon.className = 'fas fa-trending-up trend-up';
            trendElement.style.background = 'rgba(34, 197, 94, 0.1)';
            trendElement.style.color = '#22c55e';
        } else {
            trendIcon.className = 'fas fa-trending-down trend-down';
            trendElement.style.background = 'rgba(239, 68, 68, 0.1)';
            trendElement.style.color = '#ef4444';
        }
    }
    
    updatePlayerCards() {
        const teamData = this.teamData[this.currentTeam];
        const playerCards = document.querySelectorAll('.player-card');
        
        playerCards.forEach((card, index) => {
            const player = teamData.players[index];
            if (!player) return;
            
            // Update player info
            card.querySelector('.card-player-name').textContent = player.name;
            card.querySelector('.card-player-price').textContent = player.price;
            
            // Update score badge
            const scoreBadge = card.querySelector('.card-score-badge');
            scoreBadge.textContent = player.score;
            scoreBadge.className = `card-score-badge ${player.badge}`;
            
            // Update stats
            const stats = card.querySelectorAll('.card-stat-value');
            stats[0].textContent = player.round;
            stats[1].textContent = player.position;
            stats[2].textContent = player.points;
        });
    }
}

// ===== LEADERBOARD ANIMATIONS ===== 
class LeaderboardAnimator {
    constructor() {
        this.leaderboardItems = document.querySelectorAll('.leaderboard-item');
        this.animateScoreChanges();
        this.setupHoverEffects();
    }
    
    animateScoreChanges() {
        // Simulate score updates every 30 seconds
        setInterval(() => {
            this.updateRandomScore();
        }, 30000);
    }
    
    updateRandomScore() {
        const randomItem = this.leaderboardItems[Math.floor(Math.random() * this.leaderboardItems.length)];
        const scoreElement = randomItem.querySelector('.score');
        const changeElement = randomItem.querySelector('.score-change');
        
        // Add flash animation
        scoreElement.style.animation = 'scoreFlash 0.5s ease-in-out';
        
        setTimeout(() => {
            scoreElement.style.animation = '';
        }, 500);
        
        // Randomly update position change
        const changes = ['+1', '+2', '-1', '-2', 'E'];
        const randomChange = changes[Math.floor(Math.random() * changes.length)];
        
        if (randomChange.includes('+')) {
            changeElement.className = 'score-change up';
            changeElement.innerHTML = `<i class="fas fa-arrow-up"></i>${randomChange.slice(1)}`;
        } else if (randomChange.includes('-')) {
            changeElement.className = 'score-change down';
            changeElement.innerHTML = `<i class="fas fa-arrow-down"></i>${randomChange.slice(1)}`;
        } else {
            changeElement.className = 'score-change';
            changeElement.textContent = 'E';
        }
    }
    
    setupHoverEffects() {
        this.leaderboardItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'translateX(10px) scale(1.02)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.transform = 'translateX(0) scale(1)';
            });
        });
    }
}

// ===== SCROLL ANIMATIONS ===== 
class ScrollAnimator {
    constructor() {
        this.observeElements();
    }
    
    observeElements() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        // Observe all cards and major elements
        const elementsToObserve = document.querySelectorAll('.glass-card, .player-card, .leaderboard-item');
        elementsToObserve.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
}

// ===== PARTICLE EFFECTS REMOVED ===== 
// Particle system removed for cleaner background

// ===== INITIALIZATION ===== 
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    new TournamentTimer();
    new TeamSwitcher();
    new LeaderboardAnimator();
    new ScrollAnimator();
    // ParticleSystem removed for cleaner background
    
    // Add loading animation
    const mainContainer = document.querySelector('.main-container');
    mainContainer.style.opacity = '0';
    mainContainer.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        mainContainer.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        mainContainer.style.opacity = '1';
        mainContainer.style.transform = 'translateY(0)';
    }, 100);
    
    // Add custom CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes scoreFlash {
            0% { transform: scale(1); color: #14b8a6; }
            50% { transform: scale(1.1); color: #ffd700; }
            100% { transform: scale(1); color: #14b8a6; }
        }
        
        .trend-down {
            color: #ef4444 !important;
        }
        
        @keyframes glowPulse {
            0%, 100% { box-shadow: 0 0 20px rgba(20, 184, 166, 0.3); }
            50% { box-shadow: 0 0 30px rgba(20, 184, 166, 0.6); }
        }
        
        .live-badge {
            animation: glowPulse 2s ease-in-out infinite;
        }
    `;
    document.head.appendChild(style);
});

// ===== UTILITY FUNCTIONS ===== 
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatScore(score) {
    if (score === 0) return 'E';
    return score > 0 ? `+${score}` : `${score}`;
}

// ===== BACKGROUND IMAGE MANAGER =====
class BackgroundManager {
    constructor() {
        this.imageCache = new Map();
        this.defaultImages = {
            teal: 'images/backgrounds/golf-course-teal.jpg',
            green: 'images/backgrounds/golf-course-green.jpg', 
            blue: 'images/backgrounds/golf-course-blue.jpg'
        };
        this.preloadImages();
    }
    
    preloadImages() {
        // Preload all background images for smooth transitions
        Object.values(this.defaultImages).forEach(imagePath => {
            this.loadImage(imagePath);
        });
    }
    
    loadImage(src) {
        return new Promise((resolve, reject) => {
            if (this.imageCache.has(src)) {
                resolve(this.imageCache.get(src));
                return;
            }
            
            const img = new Image();
            img.onload = () => {
                this.imageCache.set(src, true);
                resolve(true);
            };
            img.onerror = () => {
                this.imageCache.set(src, false);
                resolve(false);
            };
            img.src = src;
        });
    }
    
    async checkImageExists(theme) {
        const imagePath = this.defaultImages[theme];
        return await this.loadImage(imagePath);
    }
}

// ===== COLOR THEME SYSTEM =====
class ThemeManager {
    constructor() {
        this.currentTheme = 'teal';
        this.themes = ['teal', 'green', 'blue'];
        this.backgroundManager = new BackgroundManager();
        this.init();
    }
    
    init() {
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem('golfTheme');
        if (savedTheme && this.themes.includes(savedTheme)) {
            this.setTheme(savedTheme);
        }
        
        // Bind theme toggle events
        this.bindThemeToggles();
        
        // Check for available background images
        this.checkBackgroundImages();
    }
    
    async checkBackgroundImages() {
        // Check which background images are available
        const imageStatus = {};
        let foundImages = 0;
        
        for (const theme of this.themes) {
            imageStatus[theme] = await this.backgroundManager.checkImageExists(theme);
            if (imageStatus[theme]) foundImages++;
        }
        
        // Log status for debugging
        console.log('Background images status:', imageStatus);
        
        // Show user-friendly status notification
        if (foundImages === 0) {
            this.showStatusNotification(
                '🖼️ No background images found. Add golf course images to get started!',
                'warning',
                5000
            );
            console.log('💡 Tip: Add golf course images to images/backgrounds/ folder for custom backgrounds!');
        } else if (foundImages < 3) {
            this.showStatusNotification(
                `🖼️ ${foundImages}/3 background images loaded. Add more for all themes!`,
                'warning',
                3000
            );
        } else {
            this.showStatusNotification(
                '✅ All background images loaded successfully!',
                'success',
                2000
            );
        }
    }
    
    showStatusNotification(message, type = 'info', duration = 3000) {
        // Remove existing notification
        const existing = document.querySelector('.background-status');
        if (existing) existing.remove();
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `background-status ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Show with animation
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Hide after duration
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    
    bindThemeToggles() {
        const toggles = document.querySelectorAll('.color-toggle');
        
        toggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const theme = toggle.dataset.theme;
                this.setTheme(theme);
            });
        });
    }
    
    async setTheme(theme) {
        if (!this.themes.includes(theme)) return;
        
        // Preload background image before switching theme
        const imageExists = await this.backgroundManager.checkImageExists(theme);
        
        // Update the data attribute on body
        document.body.setAttribute('data-theme', theme);
        
        // Update active state on toggles
        const toggles = document.querySelectorAll('.color-toggle');
        toggles.forEach(toggle => {
            toggle.classList.remove('active');
            if (toggle.dataset.theme === theme) {
                toggle.classList.add('active');
                if (!imageExists) {
                    console.log(`🖼️ Background image not found for ${theme} theme. Using gradient fallback.`);
                }
            }
        });
        
        // Save to localStorage
        localStorage.setItem('golfTheme', theme);
        this.currentTheme = theme;
        
        // Trigger enhanced theme change animation
        this.animateThemeChange();
    }
    
    animateThemeChange() {
        // Add a subtle flash animation to indicate theme change
        const body = document.body;
        body.style.transition = 'all 0.5s ease';
        
        // Create a temporary overlay for smooth transition
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.1);
            z-index: 9999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(overlay);
        
        // Animate overlay
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
        
        setTimeout(() => {
            overlay.style.opacity = '0';
        }, 200);
        
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 500);
    }
}

// ===== NAVIGATION EFFECTS ===== 
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme manager
    const themeManager = new ThemeManager();
    
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('href').startsWith('#')) {
                e.preventDefault();
            }
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
    
    // Add scroll effect to navbar
    let lastScrollY = window.scrollY;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        lastScrollY = window.scrollY;
    });
});