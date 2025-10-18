// Lobby-specific JavaScript functionality
class LobbyManager {
    constructor() {
        this.currentRankingFilter = 'global';
        this.currentPerformancePeriod = 'today';
        this.currentStatsPeriod = 'month';
        this.refreshInterval = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeCharts();
        this.startAutoRefresh();
        this.loadInitialData();
    }

    setupEventListeners() {
        // Filter buttons for rankings
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentRankingFilter = e.target.dataset.filter;
                this.filterRankings(this.currentRankingFilter);
            });
        });

        // Performance period buttons
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentPerformancePeriod = e.target.dataset.period;
                this.updatePerformanceView(this.currentPerformancePeriod);
            });
        });

        // Stats period dropdown
        const statsPeriodSelect = document.getElementById('statsPeriod');
        if (statsPeriodSelect) {
            statsPeriodSelect.addEventListener('change', (e) => {
                this.currentStatsPeriod = e.target.value;
                this.updateStatsView(this.currentStatsPeriod);
            });
        }

        // Click handlers for interactive elements
        document.addEventListener('click', (e) => {
            if (e.target.closest('.ranking-item:not(.current-user)')) {
                this.viewPlayerProfile(e.target.closest('.ranking-item'));
            }
            
            if (e.target.closest('.team-item')) {
                this.viewTeamDetails(e.target.closest('.team-item'));
            }
            
            if (e.target.closest('.activity-item')) {
                this.viewActivityDetails(e.target.closest('.activity-item'));
            }
        });
    }

    initializeCharts() {
        // Performance Chart
        const canvas = document.getElementById('performanceChart');
        if (canvas && typeof Chart !== 'undefined') {
            const ctx = canvas.getContext('2d');
            
            this.performanceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [{
                        label: 'Performance',
                        data: [2100, 2350, 2200, 2847],
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim(),
                        backgroundColor: 'rgba(20, 184, 166, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim(),
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                                color: '#64748b'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                                color: '#64748b'
                            }
                        }
                    }
                }
            });
        } else if (canvas) {
            // Fallback for when Chart.js is not available
            this.createFallbackChart(canvas);
        }
    }

    createFallbackChart(canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Sample data
        const data = [2100, 2350, 2200, 2847];
        const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        
        // Chart dimensions
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        
        // Data scaling
        const maxValue = Math.max(...data);
        const minValue = Math.min(...data);
        const valueRange = maxValue - minValue;
        
        // Draw grid lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        
        // Vertical grid lines
        for (let i = 0; i <= data.length - 1; i++) {
            const x = padding + (i * chartWidth) / (data.length - 1);
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }
        
        // Horizontal grid lines
        for (let i = 0; i <= 4; i++) {
            const y = padding + (i * chartHeight) / 4;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        
        // Draw data line
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#14b8a6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        data.forEach((value, index) => {
            const x = padding + (index * chartWidth) / (data.length - 1);
            const y = height - padding - ((value - minValue) / valueRange) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw data points
        ctx.fillStyle = ctx.strokeStyle;
        data.forEach((value, index) => {
            const x = padding + (index * chartWidth) / (data.length - 1);
            const y = height - padding - ((value - minValue) / valueRange) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Add labels
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        
        labels.forEach((label, index) => {
            const x = padding + (index * chartWidth) / (data.length - 1);
            ctx.fillText(label, x, height - 10);
        });
    }

    startAutoRefresh() {
        // Refresh data every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.refreshLobbyData();
        }, 30000);
    }

    loadInitialData() {
        // Simulate loading initial data
        this.showLoadingState();
        
        setTimeout(() => {
            this.hideLoadingState();
            this.updateLastRefreshTime();
        }, 1000);
    }

    filterRankings(filter) {
        console.log(`Filtering rankings by: ${filter}`);
        
        // Simulate filtering animation
        const rankingsList = document.querySelector('.rankings-list');
        if (rankingsList) {
            rankingsList.style.opacity = '0.5';
            
            setTimeout(() => {
                // Here you would typically fetch filtered data from an API
                this.updateRankingsData(filter);
                rankingsList.style.opacity = '1';
            }, 300);
        }
    }

    updatePerformanceView(period) {
        console.log(`Updating performance view for: ${period}`);
        
        // Simulate data update
        const performanceContent = document.querySelector('.performance-content');
        if (performanceContent) {
            performanceContent.style.opacity = '0.5';
            
            setTimeout(() => {
                this.updatePerformanceData(period);
                performanceContent.style.opacity = '1';
            }, 300);
        }
    }

    updateStatsView(period) {
        console.log(`Updating stats view for: ${period}`);
        
        // Simulate stats update
        const statsContent = document.querySelector('.stats-content');
        if (statsContent) {
            statsContent.style.opacity = '0.5';
            
            setTimeout(() => {
                this.updateStatsData(period);
                if (this.performanceChart) {
                    this.updateChartData(period);
                }
                statsContent.style.opacity = '1';
            }, 300);
        }
    }

    updateRankingsData(filter) {
        // Simulate different ranking data based on filter
        const sampleData = {
            global: {
                currentUserRank: 247,
                currentUserChange: '+15'
            },
            friends: {
                currentUserRank: 12,
                currentUserChange: '+3'
            },
            weekly: {
                currentUserRank: 89,
                currentUserChange: '+27'
            }
        };
        
        const data = sampleData[filter] || sampleData.global;
        
        // Update current user rank
        const rankNumber = document.querySelector('.ranking-item.current-user .rank-number');
        const rankChange = document.querySelector('.ranking-item.current-user .rank-change');
        
        if (rankNumber) rankNumber.textContent = data.currentUserRank;
        if (rankChange) rankChange.textContent = data.currentUserChange;
    }

    updatePerformanceData(period) {
        // Simulate different performance data based on period
        const sampleData = {
            today: {
                profit: '£287',
                change: '23%',
                activeTeams: '4/6'
            },
            week: {
                profit: '£1,245',
                change: '18%',
                activeTeams: '6/8'
            },
            month: {
                profit: '£4,892',
                change: '31%',
                activeTeams: '12/15'
            }
        };
        
        const data = sampleData[period] || sampleData.today;
        
        // Update summary values
        const profitValue = document.querySelector('.summary-item .summary-value');
        const changeValue = document.querySelector('.summary-change');
        const teamsValue = document.querySelectorAll('.summary-item .summary-value')[1];
        
        if (profitValue) profitValue.textContent = data.profit;
        if (changeValue) changeValue.textContent = data.change;
        if (teamsValue) teamsValue.textContent = data.activeTeams;
    }

    updateStatsData(period) {
        // Simulate different stats data based on period
        const sampleData = {
            week: {
                successRate: '78.5%',
                avgWin: '£98',
                bestFinish: '3rd',
                eventsPlayed: '7'
            },
            month: {
                successRate: '73.2%',
                avgWin: '£124',
                bestFinish: '12th',
                eventsPlayed: '18'
            },
            season: {
                successRate: '71.8%',
                avgWin: '£142',
                bestFinish: '2nd',
                eventsPlayed: '47'
            },
            all: {
                successRate: '69.4%',
                avgWin: '£156',
                bestFinish: '1st',
                eventsPlayed: '234'
            }
        };
        
        const data = sampleData[period] || sampleData.month;
        
        // Update metric values
        const metricValues = document.querySelectorAll('.metric-value');
        if (metricValues[0]) metricValues[0].textContent = data.successRate;
        if (metricValues[1]) metricValues[1].textContent = data.avgWin;
        if (metricValues[2]) metricValues[2].textContent = data.bestFinish;
        if (metricValues[3]) metricValues[3].textContent = data.eventsPlayed;
    }

    updateChartData(period) {
        if (!this.performanceChart) return;
        
        // Simulate different chart data based on period
        const chartData = {
            week: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                data: [2650, 2720, 2580, 2790, 2650, 2800, 2847]
            },
            month: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                data: [2100, 2350, 2200, 2847]
            },
            season: {
                labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                data: [1800, 2200, 2500, 2847]
            },
            all: {
                labels: ['Year 1', 'Year 2', 'Year 3', 'Current'],
                data: [1200, 1800, 2300, 2847]
            }
        };
        
        const newData = chartData[period] || chartData.month;
        
        this.performanceChart.data.labels = newData.labels;
        this.performanceChart.data.datasets[0].data = newData.data;
        this.performanceChart.update();
    }

    refreshLobbyData() {
        console.log('Refreshing lobby data...');
        
        // Show refresh animation
        const refreshBtn = document.querySelector('.action-btn.primary i');
        if (refreshBtn) {
            refreshBtn.classList.add('fa-spin');
        }
        
        // Simulate API call
        setTimeout(() => {
            // Update timestamp
            this.updateLastRefreshTime();
            
            // Stop refresh animation
            if (refreshBtn) {
                refreshBtn.classList.remove('fa-spin');
            }
            
            // Show success notification
            this.showNotification('Data refreshed successfully', 'success');
        }, 1500);
    }

    showLobbySettings() {
        console.log('Opening lobby settings page...');
        
        // Redirect to the comprehensive settings page
        window.location.href = 'lobby-settings.html';
    }

    createSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'lobby-settings-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content glass-card">
                <div class="modal-header">
                    <h3><i class="fas fa-cog"></i> Lobby Settings</h3>
                    <button class="modal-close" onclick="this.closest('.lobby-settings-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="setting-group">
                        <label>Auto-refresh interval</label>
                        <select id="refreshInterval">
                            <option value="30">30 seconds</option>
                            <option value="60">1 minute</option>
                            <option value="300">5 minutes</option>
                        </select>
                    </div>
                    <div class="setting-group">
                        <label>Default ranking view</label>
                        <select id="defaultRanking">
                            <option value="global">Global</option>
                            <option value="friends">Friends</option>
                            <option value="weekly">Weekly</option>
                        </select>
                    </div>
                    <div class="setting-group">
                        <label>Show notifications</label>
                        <label class="toggle-switch">
                            <input type="checkbox" id="showNotifications" checked>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn secondary" onclick="this.closest('.lobby-settings-modal').remove()">
                        Cancel
                    </button>
                    <button class="btn primary" onclick="lobbyManager.saveSettings(); this.closest('.lobby-settings-modal').remove();">
                        Save Settings
                    </button>
                </div>
            </div>
        `;
        
        return modal;
    }

    saveSettings() {
        // Save settings to localStorage
        const settings = {
            refreshInterval: document.getElementById('refreshInterval')?.value || 30,
            defaultRanking: document.getElementById('defaultRanking')?.value || 'global',
            showNotifications: document.getElementById('showNotifications')?.checked ?? true
        };
        
        localStorage.setItem('lobbySettings', JSON.stringify(settings));
        this.showNotification('Settings saved successfully', 'success');
        
        // Apply new settings
        this.applySettings(settings);
    }

    applySettings(settings) {
        // Update refresh interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.refreshInterval = setInterval(() => {
            this.refreshLobbyData();
        }, settings.refreshInterval * 1000);
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('lobbySettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            this.applySettings(settings);
        }
    }

    viewPlayerProfile(rankingItem) {
        const playerName = rankingItem.querySelector('.player-name')?.textContent;
        console.log(`Viewing profile for: ${playerName}`);
        this.showNotification(`Opening ${playerName}'s profile...`, 'info');
    }

    viewTeamDetails(teamItem) {
        const teamName = teamItem.querySelector('.team-name')?.textContent;
        console.log(`Viewing team details for: ${teamName}`);
        this.showNotification(`Opening ${teamName} details...`, 'info');
    }

    viewActivityDetails(activityItem) {
        const activityText = activityItem.querySelector('.activity-text')?.textContent;
        console.log(`Viewing activity details: ${activityText}`);
    }

    showFullRankings() {
        console.log('Showing full rankings...');
        this.showNotification('Loading full rankings...', 'info');
        // This would typically open a modal or navigate to a full rankings page
    }

    toggleActivityFilter() {
        console.log('Toggling activity filter...');
        // This would show filter options for the activity feed
    }

    loadMoreActivity() {
        console.log('Loading more activity...');
        
        const activityFeed = document.querySelector('.activity-feed');
        if (activityFeed) {
            // Simulate loading more activities
            const loadMoreBtn = document.querySelector('.load-more-btn');
            if (loadMoreBtn) {
                loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                
                setTimeout(() => {
                    // Add more activity items (this would typically come from an API)
                    const newActivities = this.generateAdditionalActivities();
                    activityFeed.innerHTML += newActivities;
                    
                    loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Load More Activity';
                }, 1000);
            }
        }
    }

    generateAdditionalActivities() {
        return `
            <div class="activity-item">
                <div class="activity-icon win">
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">
                        <strong>Tournament Win!</strong> Your team "Pro Putters" finished 5th in the Masters Tournament
                    </div>
                    <div class="activity-reward">+£98</div>
                </div>
                <div class="activity-time">6 hours ago</div>
            </div>
            <div class="activity-item">
                <div class="activity-icon trade">
                    <i class="fas fa-exchange-alt"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">
                        Traded <strong>Dustin Johnson</strong> for <strong>Brooks Koepka</strong> in Eagle Squadron team
                    </div>
                    <div class="activity-cost">-£15</div>
                </div>
                <div class="activity-time">8 hours ago</div>
            </div>
        `;
    }

    showLoadingState() {
        // Add loading indicators
        document.querySelectorAll('.glass-card').forEach(card => {
            card.style.opacity = '0.7';
        });
    }

    hideLoadingState() {
        // Remove loading indicators
        document.querySelectorAll('.glass-card').forEach(card => {
            card.style.opacity = '1';
        });
    }

    updateLastRefreshTime() {
        // Update any "last updated" timestamp displays
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        
        // Add or update refresh timestamp
        let refreshTime = document.querySelector('.last-refresh-time');
        if (!refreshTime) {
            refreshTime = document.createElement('div');
            refreshTime.className = 'last-refresh-time';
            refreshTime.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(255, 255, 255, 0.9);
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 0.8rem;
                color: #64748b;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(refreshTime);
        }
        
        refreshTime.textContent = `Last updated: ${timeString}`;
        refreshTime.style.opacity = '1';
        
        setTimeout(() => {
            refreshTime.style.opacity = '0';
        }, 3000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `lobby-notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 0.9rem;
            z-index: 1000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            max-width: 300px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        if (this.performanceChart) {
            this.performanceChart.destroy();
        }
    }
}

// Initialize lobby manager when DOM is loaded
let lobbyManager;

document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.lobby-container')) {
        lobbyManager = new LobbyManager();
        // Make it available globally
        window.lobbyManager = lobbyManager;
        console.log('Lobby manager initialized and exposed globally');
    }
});

// Global functions for lobby functionality
function refreshLobbyData() {
    console.log('Global refreshLobbyData called');
    if (window.lobbyManager) {
        window.lobbyManager.refreshLobbyData();
    } else {
        console.error('Lobby manager not initialized');
    }
}

function showLobbySettings() {
    console.log('Global showLobbySettings called');
    if (window.lobbyManager) {
        window.lobbyManager.showLobbySettings();
    } else {
        // Fallback - direct redirect
        console.log('Fallback: redirecting to lobby-settings.html');
        window.location.href = 'lobby-settings.html';
    }
}

function showFullRankings() {
    console.log('Global showFullRankings called');
    if (window.lobbyManager) {
        window.lobbyManager.showFullRankings();
    } else {
        console.error('Lobby manager not initialized');
    }
}

function updateStatsView() {
    console.log('Global updateStatsView called');
    const period = document.getElementById('statsPeriod')?.value;
    if (window.lobbyManager && period) {
        window.lobbyManager.updateStatsView(period);
    } else {
        console.error('Lobby manager not initialized or period not found');
    }
}

function toggleActivityFilter() {
    console.log('Global toggleActivityFilter called');
    if (window.lobbyManager) {
        window.lobbyManager.toggleActivityFilter();
    } else {
        console.error('Lobby manager not initialized');
    }
}

function loadMoreActivity() {
    console.log('Global loadMoreActivity called');
    if (window.lobbyManager) {
        window.lobbyManager.loadMoreActivity();
    } else {
        console.error('Lobby manager not initialized');
    }
}

// Add CSS for modal and notifications
const lobbyStyles = document.createElement('style');
lobbyStyles.textContent = `
    .lobby-settings-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }
    
    .lobby-settings-modal.show {
        opacity: 1;
        visibility: visible;
    }
    
    .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
    }
    
    .modal-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 500px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 16px;
        overflow: hidden;
    }
    
    .modal-header {
        padding: 20px 25px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .modal-header h3 {
        margin: 0;
        font-size: 1.2rem;
        color: #1f2937;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 1.2rem;
        color: #64748b;
        cursor: pointer;
        padding: 5px;
        border-radius: 4px;
        transition: all 0.3s ease;
    }
    
    .modal-close:hover {
        background: rgba(0, 0, 0, 0.1);
        color: #1f2937;
    }
    
    .modal-body {
        padding: 25px;
    }
    
    .setting-group {
        margin-bottom: 20px;
    }
    
    .setting-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #374151;
    }
    
    .setting-group select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        background: white;
        color: #1f2937;
        font-size: 0.9rem;
    }
    
    .toggle-switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 26px;
        margin-bottom: 0;
    }
    
    .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }
    
    .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #d1d5db;
        transition: 0.3s;
        border-radius: 26px;
    }
    
    .toggle-slider:before {
        position: absolute;
        content: "";
        height: 20px;
        width: 20px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.3s;
        border-radius: 50%;
    }
    
    input:checked + .toggle-slider {
        background-color: var(--primary-color);
    }
    
    input:checked + .toggle-slider:before {
        transform: translateX(24px);
    }
    
    .modal-footer {
        padding: 20px 25px;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: flex-end;
        gap: 12px;
    }
    
    .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
    }
    
    .btn.primary {
        background: var(--primary-color);
        color: white;
    }
    
    .btn.primary:hover {
        background: var(--primary-dark);
    }
    
    .btn.secondary {
        background: #f3f4f6;
        color: #374151;
    }
    
    .btn.secondary:hover {
        background: #e5e7eb;
    }
`;

document.head.appendChild(lobbyStyles);