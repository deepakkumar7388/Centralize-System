/**
 * MAIN APPLICATION MODULE
 * Handles routing, navigation, and application initialization
 */

const App = {
    currentPage: 'dashboard',

    /**
     * Initialize application
     */
    init: () => {
        console.log('Nexus Application Initializing...');

        // Initialize current user display
        App.initializeUser();

        // Initialize modules
        Dashboard.init();
        Meetings.init();
        Events.init();
        Policies.init();
        Announcements.init();

        // Setup navigation
        App.setupNavigation();

        // Setup global search
        App.setupSearch();

        // Setup notifications
        App.setupNotifications();

        // Setup modal close on outside click
        App.setupModalHandlers();

        // Load initial page
        App.loadPage('dashboard');

        console.log('Nexus Application Ready!');
    },

    /**
     * Initialize user display
     */
    initializeUser: () => {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) {
            // Show auth screen without page redirect (SPA)
            if (typeof showAuthScreen === 'function') showAuthScreen();
            return;
        }

        // Update user display
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userRole').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
        document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
    },

    /**
     * Logout user
     */
    logout: () => {
        if (confirm('Are you sure you want to logout?')) {
            Auth.logout();
        }
    },

    /**
     * Setup navigation
     */
    setupNavigation: () => {
        // Sidebar navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;

                // Update active state
                document.querySelectorAll('.nav-item').forEach(nav => {
                    nav.classList.remove('active');
                });
                item.classList.add('active');

                // Load page
                App.loadPage(page);

                // Auto close sidebar on mobile navigation
                const sidebar = document.getElementById('sidebar');
                const overlay = document.getElementById('sidebarOverlay');
                if (sidebar && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('active');
                }
            });
        });
    },

    /**
     * Toggle Mobile Sidebar
     */
    toggleSidebar: () => {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar) {
            sidebar.classList.toggle('open');
            if (overlay) overlay.classList.toggle('active');
        }
    },

    /**
     * Load page content
     */
    loadPage: (page) => {
        App.currentPage = page;
        const pageContent = document.getElementById('pageContent');
        const pageTitle = document.getElementById('pageTitle');

        // Update page title
        const titles = {
            'dashboard': 'Dashboard',
            'meetings': 'Meetings',
            'events': 'Events',
            'policies': 'Policies',
            'announcements': 'Announcements'
        };
        pageTitle.textContent = titles[page] || 'Dashboard';

        // Render page content
        let content = '';
        switch (page) {
            case 'meetings':
                content = Meetings.render();
                break;
            case 'events':
                content = Events.render();
                break;
            case 'policies':
                content = Policies.render();
                break;
            case 'announcements':
                content = Announcements.render();
                break;
            case 'dashboard':
            default:
                content = Dashboard.render();
                break;
        }

        pageContent.innerHTML = content;
        pageContent.classList.add('fade-in');

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /**
     * Setup global search
     */
    setupSearch: () => {
        const searchInput = document.getElementById('globalSearch');

        const performSearch = Utils.debounce((query) => {
            if (!query.trim()) return;

            const results = {
                meetings: Utils.searchObjects(Store.getMeetings(), query, ['title', 'agenda', 'location']),
                events: Utils.searchObjects(Store.getEvents(), query, ['title', 'description', 'location']),
                policies: Utils.searchObjects(Store.getPolicies(), query, ['title', 'category', 'content']),
                announcements: Utils.searchObjects(Store.getAnnouncements(), query, ['title', 'content'])
            };

            console.log('Search results:', results);

            // Show results count
            const totalResults =
                results.meetings.length +
                results.events.length +
                results.policies.length +
                results.announcements.length;

            if (totalResults === 0) {
                Utils.showToast('No results found', 'info');
            } else {
                Utils.showToast(`Found ${totalResults} result(s)`, 'success');
            }
        }, 500);

        searchInput.addEventListener('input', (e) => {
            performSearch(e.target.value);
        });
    },

    /**
     * Setup notifications
     */
    setupNotifications: () => {
        const notificationBtn = document.getElementById('notificationBtn');
        const notificationModal = document.getElementById('notificationModal');
        const notificationList = document.getElementById('notificationList');

        notificationBtn.addEventListener('click', () => {
            // Generate notifications from recent activity
            const recentActivity = Dashboard.getRecentActivity().slice(0, 5);

            const notificationsHTML = recentActivity.length ? recentActivity.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon ${activity.type}">
                        <i class="fas ${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${Utils.sanitizeHTML(activity.title)}</div>
                        <div class="activity-meta">${Utils.sanitizeHTML(activity.meta)}</div>
                    </div>
                    <div class="activity-time">${Utils.timeAgo(activity.date)}</div>
                </div>
            `).join('') : '<div class="empty-state"><p>No notifications</p></div>';

            notificationList.innerHTML = notificationsHTML;
            notificationModal.classList.add('active');
        });

        // Close modal buttons
        document.querySelectorAll('[data-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.modal;
                document.getElementById(modalId).classList.remove('active');
            });
        });
    },

    /**
     * Setup modal handlers
     */
    setupModalHandlers: () => {
        // Close modal on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });
    },

    /**
     * Export all data
     */
    exportAllData: () => {
        const allData = {
            meetings: Store.getMeetings(),
            events: Store.getEvents(),
            policies: Store.getPolicies(),
            announcements: Store.getAnnouncements(),
            exportDate: new Date().toISOString()
        };

        Utils.exportToJSON(allData, 'nexus_complete_backup');
    },

    /**
     * Generate periodic report
     */
    generateReport: () => {
        const stats = Store.getStats();
        const recentActivity = Dashboard.getRecentActivity();

        const content = `
            <div style="max-width: 900px; margin: 0 auto; padding: 2rem;">
                <h1>Institutional Activity Report</h1>
                <p style="color: #64748b;">Generated on ${new Date().toLocaleString()}</p>
                <hr style="margin: 1.5rem 0;">
                
                <h2>Overview Statistics</h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem;">
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 0.75rem; text-align: left; border: 1px solid #e2e8f0;">Category</th>
                        <th style="padding: 0.75rem; text-align: center; border: 1px solid #e2e8f0;">Total</th>
                        <th style="padding: 0.75rem; text-align: left; border: 1px solid #e2e8f0;">Details</th>
                    </tr>
                    <tr>
                        <td style="padding: 0.75rem; border: 1px solid #e2e8f0;"><strong>Meetings</strong></td>
                        <td style="padding: 0.75rem; text-align: center; border: 1px solid #e2e8f0;">${stats.meetings.total}</td>
                        <td style="padding: 0.75rem; border: 1px solid #e2e8f0;">
                            ${stats.meetings.scheduled} scheduled, 
                            ${stats.meetings.completed} completed, 
                            ${stats.meetings.pending} pending
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0.75rem; border: 1px solid #e2e8f0;"><strong>Events</strong></td>
                        <td style="padding: 0.75rem; text-align: center; border: 1px solid #e2e8f0;">${stats.events.total}</td>
                        <td style="padding: 0.75rem; border: 1px solid #e2e8f0;">
                            ${stats.events.upcoming} upcoming, 
                            ${stats.events.archived} archived
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0.75rem; border: 1px solid #e2e8f0;"><strong>Policies</strong></td>
                        <td style="padding: 0.75rem; text-align: center; border: 1px solid #e2e8f0;">${stats.policies.total}</td>
                        <td style="padding: 0.75rem; border: 1px solid #e2e8f0;">
                            ${stats.policies.active} active, 
                            ${stats.policies.draft} in draft
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0.75rem; border: 1px solid #e2e8f0;"><strong>Announcements</strong></td>
                        <td style="padding: 0.75rem; text-align: center; border: 1px solid #e2e8f0;">${stats.announcements.total}</td>
                        <td style="padding: 0.75rem; border: 1px solid #e2e8f0;">
                            ${stats.announcements.active} active, 
                            ${stats.announcements.high} high priority
                        </td>
                    </tr>
                </table>
                
                <h2>Recent Activity</h2>
                <ul style="list-style: none; padding: 0;">
                    ${recentActivity.slice(0, 10).map(activity => `
                        <li style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">
                            <strong>${Utils.sanitizeHTML(activity.title)}</strong><br>
                            <small style="color: #64748b;">${activity.meta} • ${Utils.timeAgo(activity.date)}</small>
                        </li>
                    `).join('')}
                </ul>
                
                <hr style="margin: 2rem 0;">
                <p style="color: #64748b; font-size: 0.875rem; text-align: center;">
                    This report was automatically generated by Nexus Institutional Record Keeping System
                </p>
            </div>
        `;

        Utils.printContent('Institutional Activity Report', content);
    }
};

// Initialize app only if user is already logged in on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (localStorage.getItem('nexus_current_user')) App.init();
    });
} else {
    if (localStorage.getItem('nexus_current_user')) App.init();
}

// Export for global access
window.App = App;
