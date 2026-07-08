/**
 * DATA STORE MODULE
 * Manages all application data with localStorage persistence
 */

const Store = {
    // Storage keys
    KEYS: {
        MEETINGS: 'nexus_meetings',
        EVENTS: 'nexus_events',
        POLICIES: 'nexus_policies',
        ANNOUNCEMENTS: 'nexus_announcements',
        SETTINGS: 'nexus_settings'
    },

    /**
     * Initialize store with sample data if empty
     */
    init: () => {
        if (!Store.getMeetings().length) {
            Store.initSampleData();
        }
    },

    /**
     * Initialize with sample data
     */
    initSampleData: () => {
        // Sample meetings
        const sampleMeetings = [
            {
                id: Utils.generateId(),
                title: 'Board Meeting - Q4 Review',
                date: '2025-12-25T10:00:00',
                location: 'Conference Room A',
                attendees: ['John Doe', 'Jane Smith', 'Mike Johnson'],
                status: 'scheduled',
                agenda: 'Review Q4 performance, discuss budget allocation',
                minutes: '',
                createdAt: new Date().toISOString()
            },
            {
                id: Utils.generateId(),
                title: 'Department Sync - IT',
                date: '2025-12-22T14:00:00',
                location: 'Virtual - Zoom',
                attendees: ['Tech Team'],
                status: 'completed',
                agenda: 'Project updates and sprint planning',
                minutes: 'Discussed current sprint progress. Assigned tasks for next iteration.',
                createdAt: new Date(Date.now() - 86400000).toISOString()
            }
        ];

        // Sample events
        const sampleEvents = [
            {
                id: Utils.generateId(),
                title: 'Annual Conference 2026',
                date: '2026-01-15T09:00:00',
                location: 'Grand Hall',
                description: 'Annual institutional conference featuring keynote speakers',
                speakers: ['Dr. Sarah Williams', 'Prof. Robert Chen'],
                attendees: 150,
                status: 'upcoming',
                speeches: [],
                presentations: [],
                createdAt: new Date().toISOString()
            }
        ];

        // Sample policies
        const samplePolicies = [
            {
                id: Utils.generateId(),
                title: 'Remote Work Policy',
                category: 'HR',
                version: '2.0',
                effectiveDate: '2025-01-01',
                status: 'active',
                content: 'Guidelines for remote work arrangements, equipment, and expectations.',
                approvedBy: 'Board of Directors',
                lastModified: new Date().toISOString(),
                createdAt: new Date(Date.now() - 2592000000).toISOString()
            },
            {
                id: Utils.generateId(),
                title: 'Data Privacy Policy',
                category: 'IT',
                version: '1.5',
                effectiveDate: '2024-06-01',
                status: 'active',
                content: 'Comprehensive data protection and privacy guidelines.',
                approvedBy: 'Executive Committee',
                lastModified: new Date(Date.now() - 15552000000).toISOString(),
                createdAt: new Date(Date.now() - 31536000000).toISOString()
            }
        ];

        // Sample announcements
        const sampleAnnouncements = [
            {
                id: Utils.generateId(),
                title: 'Holiday Schedule 2025',
                content: 'Official holiday schedule for the upcoming year has been published.',
                priority: 'high',
                publishDate: new Date().toISOString(),
                expiryDate: '2025-12-31',
                status: 'active',
                createdBy: 'Administrator',
                createdAt: new Date().toISOString()
            }
        ];

        Store.saveMeetings(sampleMeetings);
        Store.saveEvents(sampleEvents);
        Store.savePolicies(samplePolicies);
        Store.saveAnnouncements(sampleAnnouncements);
    },

    // ==================== MEETINGS ====================
    getMeetings: () => {
        const data = localStorage.getItem(Store.KEYS.MEETINGS);
        return data ? JSON.parse(data) : [];
    },

    saveMeetings: (meetings) => {
        localStorage.setItem(Store.KEYS.MEETINGS, JSON.stringify(meetings));
    },

    addMeeting: (meeting) => {
        const meetings = Store.getMeetings();
        meeting.id = meeting.id || Utils.generateId();
        meeting.createdAt = new Date().toISOString();
        meetings.push(meeting);
        Store.saveMeetings(meetings);
        return meeting;
    },

    updateMeeting: (id, updates) => {
        const meetings = Store.getMeetings();
        const index = meetings.findIndex(m => m.id === id);
        if (index !== -1) {
            meetings[index] = { ...meetings[index], ...updates };
            Store.saveMeetings(meetings);
            return meetings[index];
        }
        return null;
    },

    deleteMeeting: (id) => {
        const meetings = Store.getMeetings().filter(m => m.id !== id);
        Store.saveMeetings(meetings);
    },

    getMeetingById: (id) => {
        return Store.getMeetings().find(m => m.id === id);
    },

    // ==================== EVENTS ====================
    getEvents: () => {
        const data = localStorage.getItem(Store.KEYS.EVENTS);
        return data ? JSON.parse(data) : [];
    },

    saveEvents: (events) => {
        localStorage.setItem(Store.KEYS.EVENTS, JSON.stringify(events));
    },

    addEvent: (event) => {
        const events = Store.getEvents();
        event.id = event.id || Utils.generateId();
        event.createdAt = new Date().toISOString();
        events.push(event);
        Store.saveEvents(events);
        return event;
    },

    updateEvent: (id, updates) => {
        const events = Store.getEvents();
        const index = events.findIndex(e => e.id === id);
        if (index !== -1) {
            events[index] = { ...events[index], ...updates };
            Store.saveEvents(events);
            return events[index];
        }
        return null;
    },

    deleteEvent: (id) => {
        const events = Store.getEvents().filter(e => e.id !== id);
        Store.saveEvents(events);
    },

    getEventById: (id) => {
        return Store.getEvents().find(e => e.id === id);
    },

    // ==================== POLICIES ====================
    getPolicies: () => {
        const data = localStorage.getItem(Store.KEYS.POLICIES);
        return data ? JSON.parse(data) : [];
    },

    savePolicies: (policies) => {
        localStorage.setItem(Store.KEYS.POLICIES, JSON.stringify(policies));
    },

    addPolicy: (policy) => {
        const policies = Store.getPolicies();
        policy.id = policy.id || Utils.generateId();
        policy.createdAt = new Date().toISOString();
        policy.lastModified = new Date().toISOString();
        policies.push(policy);
        Store.savePolicies(policies);
        return policy;
    },

    updatePolicy: (id, updates) => {
        const policies = Store.getPolicies();
        const index = policies.findIndex(p => p.id === id);
        if (index !== -1) {
            policies[index] = { ...policies[index], ...updates, lastModified: new Date().toISOString() };
            Store.savePolicies(policies);
            return policies[index];
        }
        return null;
    },

    deletePolicy: (id) => {
        const policies = Store.getPolicies().filter(p => p.id !== id);
        Store.savePolicies(policies);
    },

    getPolicyById: (id) => {
        return Store.getPolicies().find(p => p.id === id);
    },

    // ==================== ANNOUNCEMENTS ====================
    getAnnouncements: () => {
        const data = localStorage.getItem(Store.KEYS.ANNOUNCEMENTS);
        return data ? JSON.parse(data) : [];
    },

    saveAnnouncements: (announcements) => {
        localStorage.setItem(Store.KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
    },

    addAnnouncement: (announcement) => {
        const announcements = Store.getAnnouncements();
        announcement.id = announcement.id || Utils.generateId();
        announcement.createdAt = new Date().toISOString();
        announcements.push(announcement);
        Store.saveAnnouncements(announcements);
        return announcement;
    },

    updateAnnouncement: (id, updates) => {
        const announcements = Store.getAnnouncements();
        const index = announcements.findIndex(a => a.id === id);
        if (index !== -1) {
            announcements[index] = { ...announcements[index], ...updates };
            Store.saveAnnouncements(announcements);
            return announcements[index];
        }
        return null;
    },

    deleteAnnouncement: (id) => {
        const announcements = Store.getAnnouncements().filter(a => a.id !== id);
        Store.saveAnnouncements(announcements);
    },

    getAnnouncementById: (id) => {
        return Store.getAnnouncements().find(a => a.id === id);
    },

    // ==================== STATISTICS ====================
    getStats: () => {
        const meetings = Store.getMeetings();
        const events = Store.getEvents();
        const policies = Store.getPolicies();
        const announcements = Store.getAnnouncements();

        return {
            meetings: {
                total: meetings.length,
                scheduled: meetings.filter(m => m.status === 'scheduled').length,
                completed: meetings.filter(m => m.status === 'completed').length,
                pending: meetings.filter(m => m.status === 'pending').length
            },
            events: {
                total: events.length,
                upcoming: events.filter(e => new Date(e.date) > new Date()).length,
                archived: events.filter(e => e.status === 'archived').length
            },
            policies: {
                total: policies.length,
                active: policies.filter(p => p.status === 'active').length,
                draft: policies.filter(p => p.status === 'draft').length
            },
            announcements: {
                total: announcements.length,
                active: announcements.filter(a => a.status === 'active').length,
                high: announcements.filter(a => a.priority === 'high').length
            }
        };
    }
};

// Initialize store
Store.init();

// Export for use in other modules
window.Store = Store;
