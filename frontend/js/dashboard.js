/**
 * DASHBOARD MODULE
 * Handles dashboard rendering and analytics
 */

const Dashboard = {
    /**
     * Render dashboard page
     */
    render: () => {
        const stats = Store.getStats();
        const meetings = Store.getMeetings();
        const events = Store.getEvents();
        const policies = Store.getPolicies();
        const announcements = Store.getAnnouncements();

        // Get current logged-in user
        const currentUser = Auth.getCurrentUser();
        const userName = currentUser ? currentUser.name : 'User';

        // Get recent activity
        const recentActivity = Dashboard.getRecentActivity();

        return `
            <div class="welcome-section">
                <h2 class="welcome-title">Welcome ${Utils.sanitizeHTML(userName)}</h2>
            </div>

            <!-- Stats Grid -->
            <div class="stats-grid">
                <div class="stat-card meetings">
                    <div class="stat-header">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                    </div>
                    <div class="stat-value">${stats.meetings.total}</div>
                    <div class="stat-label">Meetings</div>
                    <div class="stat-change">${stats.meetings.scheduled} scheduled</div>
                </div>

                <div class="stat-card events">
                    <div class="stat-header">
                        <div class="stat-icon">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                    </div>
                    <div class="stat-value">${stats.events.total}</div>
                    <div class="stat-label">Events</div>
                    <div class="stat-change">${stats.events.upcoming} upcoming</div>
                </div>

                <div class="stat-card policies">
                    <div class="stat-header">
                        <div class="stat-icon">
                            <i class="fas fa-file-contract"></i>
                        </div>
                    </div>
                    <div class="stat-value">${stats.policies.total}</div>
                    <div class="stat-label">Policies</div>
                    <div class="stat-change">${stats.policies.active} active</div>
                </div>

                <div class="stat-card announcements">
                    <div class="stat-header">
                        <div class="stat-icon">
                            <i class="fas fa-bullhorn"></i>
                        </div>
                    </div>
                    <div class="stat-value">${stats.announcements.total}</div>
                    <div class="stat-label">Announcements</div>
                    <div class="stat-change">${stats.announcements.high} high priority</div>
                </div>
            </div>

            <!-- Advanced Analytics (Admin/Manager only) -->
            ${Permissions.can('viewAnalytics') ? `
            <div class="analytics-section">
                <h3 class="section-title">Advanced Analytics</h3>
                <div class="analytics-grid">
                    <!-- Meeting Analytics -->
                    <div class="analytics-card">
                        <div class="analytics-card-header">
                            <h4 class="analytics-card-title">Meeting Analytics</h4>
                        </div>
                        <div class="analytics-metrics">
                            <div class="metric-item">
                                <div class="metric-value">${stats.meetings.scheduled}</div>
                                <div class="metric-label">Scheduled</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">${stats.meetings.completed}</div>
                                <div class="metric-label">Completed</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">${stats.meetings.pending}</div>
                                <div class="metric-label">Pending</div>
                            </div>
                        </div>
                        <div class="analytics-metrics" style="margin-top: 1rem;">
                            <div class="metric-item">
                                <div class="metric-value">${Dashboard.calculateAvgAttendees()}</div>
                                <div class="metric-label">Avg Attendees</div>
                            </div>
                        </div>
                    </div>

                    <!-- Content Overview -->
                    <div class="analytics-card">
                        <div class="analytics-card-header">
                            <h4 class="analytics-card-title">Content Overview</h4>
                        </div>
                        <div class="analytics-metrics">
                            <div class="metric-item">
                                <div class="metric-value">${stats.policies.active}</div>
                                <div class="metric-label">Active Policies</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">${stats.events.archived}</div>
                                <div class="metric-label">Archived Events</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">${stats.announcements.high}</div>
                                <div class="metric-label">High Priority</div>
                            </div>
                        </div>
                        <div class="analytics-metrics" style="margin-top: 1rem;">
                            <div class="metric-item">
                                <div class="metric-value">${stats.policies.draft}</div>
                                <div class="metric-label">Drafts</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Quick Actions & Recent Activity -->
            <div class="bottom-grid">
                <!-- Quick Actions -->
                <div class="section-card">
                    <div class="section-card-header">
                        <h3 class="section-card-title">Quick Actions</h3>
                    </div>
                    <div class="quick-actions-grid">
                        ${Permissions.can('createMeeting') ? `
                        <a href="#" class="quick-action-btn" data-action="new-meeting">
                            <div class="quick-action-icon">
                                <i class="fas fa-plus"></i>
                            </div>
                            <div class="quick-action-text">
                                <div class="quick-action-title">New Meeting</div>
                                <div class="quick-action-desc">Schedule a meeting</div>
                            </div>
                        </a>
                        ` : `
                        <a href="#" class="quick-action-btn" data-action="meetings">
                            <div class="quick-action-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="quick-action-text">
                                <div class="quick-action-title">View Meetings</div>
                                <div class="quick-action-desc">Browse all meetings</div>
                            </div>
                        </a>
                        `}
                        ${Permissions.can('createEvent') ? `
                        <a href="#" class="quick-action-btn" data-action="new-event">
                            <div class="quick-action-icon">
                                <i class="fas fa-calendar-plus"></i>
                            </div>
                            <div class="quick-action-text">
                                <div class="quick-action-title">New Event</div>
                                <div class="quick-action-desc">Create an event</div>
                            </div>
                        </a>
                        ` : `
                        <a href="#" class="quick-action-btn" data-action="events">
                            <div class="quick-action-icon">
                                <i class="fas fa-calendar-alt"></i>
                            </div>
                            <div class="quick-action-text">
                                <div class="quick-action-title">View Events</div>
                                <div class="quick-action-desc">Browse all events</div>
                            </div>
                        </a>
                        `}
                        ${Permissions.can('createPolicy') ? `
                        <a href="#" class="quick-action-btn" data-action="new-policy">
                            <div class="quick-action-icon">
                                <i class="fas fa-file-alt"></i>
                            </div>
                            <div class="quick-action-text">
                                <div class="quick-action-title">New Policy</div>
                                <div class="quick-action-desc">Draft a policy</div>
                            </div>
                        </a>
                        ` : `
                        <a href="#" class="quick-action-btn" data-action="policies">
                            <div class="quick-action-icon">
                                <i class="fas fa-file-contract"></i>
                            </div>
                            <div class="quick-action-text">
                                <div class="quick-action-title">View Policies</div>
                                <div class="quick-action-desc">Browse all policies</div>
                            </div>
                        </a>
                        `}
                        ${Permissions.can('createAnnouncement') ? `
                        <a href="#" class="quick-action-btn" data-action="new-announcement">
                            <div class="quick-action-icon">
                                <i class="fas fa-megaphone"></i>
                            </div>
                            <div class="quick-action-text">
                                <div class="quick-action-title">Announce</div>
                                <div class="quick-action-desc">Make announcement</div>
                            </div>
                        </a>
                        ` : `
                        <a href="#" class="quick-action-btn" data-action="announcements">
                            <div class="quick-action-icon">
                                <i class="fas fa-bullhorn"></i>
                            </div>
                            <div class="quick-action-text">
                                <div class="quick-action-title">Announcements</div>
                                <div class="quick-action-desc">Read latest updates</div>
                            </div>
                        </a>
                        `}
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="section-card">
                    <div class="section-card-header">
                        <h3 class="section-card-title">Recent Activity</h3>
                    </div>
                    <div class="activity-list">
                        ${recentActivity.length ? recentActivity.map(activity => `
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
                        `).join('') : '<div class="empty-state"><p>No recent activity</p></div>'}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Get recent activity from all modules
     */
    getRecentActivity: () => {
        const activities = [];

        // Get recent meetings
        const meetings = Store.getMeetings().slice(-5);
        meetings.forEach(meeting => {
            activities.push({
                type: 'meeting',
                icon: 'fa-users',
                title: meeting.title,
                meta: `Meeting • ${meeting.location}`,
                date: meeting.createdAt
            });
        });

        // Get recent events
        const events = Store.getEvents().slice(-3);
        events.forEach(event => {
            activities.push({
                type: 'event',
                icon: 'fa-calendar-alt',
                title: event.title,
                meta: `Event • ${Utils.formatDate(event.date)}`,
                date: event.createdAt
            });
        });

        // Get recent policies
        const policies = Store.getPolicies().slice(-3);
        policies.forEach(policy => {
            activities.push({
                type: 'policy',
                icon: 'fa-file-contract',
                title: policy.title,
                meta: `Policy v${policy.version} • ${policy.category}`,
                date: policy.lastModified
            });
        });

        // Get recent announcements
        const announcements = Store.getAnnouncements().slice(-3);
        announcements.forEach(announcement => {
            activities.push({
                type: 'announcement',
                icon: 'fa-bullhorn',
                title: announcement.title,
                meta: `Announcement • ${announcement.priority} priority`,
                date: announcement.createdAt
            });
        });

        // Sort by date and return top 8
        return activities
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 8);
    },

    /**
     * Calculate average attendees
     */
    calculateAvgAttendees: () => {
        const meetings = Store.getMeetings();
        if (!meetings.length) return 0;

        const total = meetings.reduce((sum, m) => {
            return sum + (Array.isArray(m.attendees) ? m.attendees.length : 0);
        }, 0);

        return Math.round(total / meetings.length);
    },

    /**
     * Initialize dashboard interactions
     */
    init: () => {
        // Handle quick action clicks
        document.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;

            e.preventDefault();
            const action = actionBtn.dataset.action;

            switch (action) {
                case 'new-meeting':
                    Meetings.showCreateModal();
                    break;
                case 'new-event':
                    Events.showCreateModal();
                    break;
                case 'new-policy':
                    Policies.showCreateModal();
                    break;
                case 'new-announcement':
                    Announcements.showCreateModal();
                    break;
            }
        });
    }
};

// Export for use in other modules
window.Dashboard = Dashboard;
