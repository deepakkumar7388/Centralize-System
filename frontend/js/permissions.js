/**
 * ROLE-BASED PERMISSIONS MODULE
 * Defines what each role can and cannot do
 */

const Permissions = {
    /**
     * Role definitions with permissions
     */
    roles: {
        admin: {
            name: 'Administrator',
            level: 3,
            permissions: {
                // Meetings
                createMeeting: true,
                editMeeting: true,
                deleteMeeting: true,
                viewMeetings: true,
                attendMeeting: true,

                // Events
                createEvent: true,
                editEvent: true,
                deleteEvent: true,
                viewEvents: true,

                // Policies
                createPolicy: true,
                editPolicy: true,
                deletePolicy: true,
                viewPolicies: true,

                // Announcements
                createAnnouncement: true,
                editAnnouncement: true,
                deleteAnnouncement: true,
                viewAnnouncements: true,

                // System
                exportData: true,
                generateReports: true,
                manageUsers: true,
                viewAnalytics: true
            }
        },

        manager: {
            name: 'Manager',
            level: 2,
            permissions: {
                // Meetings - Can schedule/manage
                createMeeting: true,
                editMeeting: true,
                deleteMeeting: true,
                viewMeetings: true,
                attendMeeting: true,

                // Events - Can schedule/manage
                createEvent: true,
                editEvent: true,
                deleteEvent: true,
                viewEvents: true,

                // Policies - View only
                createPolicy: false,
                editPolicy: false,
                deletePolicy: false,
                viewPolicies: true,

                // Announcements - View only
                createAnnouncement: false,
                editAnnouncement: false,
                deleteAnnouncement: false,
                viewAnnouncements: true,

                // System
                exportData: true,
                generateReports: true,
                manageUsers: false,
                viewAnalytics: true
            }
        },

        user: {
            name: 'User',
            level: 1,
            permissions: {
                // Meetings - Can only attend (view)
                createMeeting: false,
                editMeeting: false,
                deleteMeeting: false,
                viewMeetings: true,
                attendMeeting: true,

                // Events - View only
                createEvent: false,
                editEvent: false,
                deleteEvent: false,
                viewEvents: true,

                // Policies - View only
                createPolicy: false,
                editPolicy: false,
                deletePolicy: false,
                viewPolicies: true,

                // Announcements - View only
                createAnnouncement: false,
                editAnnouncement: false,
                deleteAnnouncement: false,
                viewAnnouncements: true,

                // System
                exportData: false,
                generateReports: false,
                manageUsers: false,
                viewAnalytics: false
            }
        }
    },

    /**
     * Check if current user has permission
     */
    can: (permission) => {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser || !currentUser.role) return false;

        const role = Permissions.roles[currentUser.role];
        if (!role) return false;

        return role.permissions[permission] === true;
    },

    /**
     * Check if user has specific role
     */
    hasRole: (roleName) => {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return false;
        return currentUser.role === roleName;
    },

    /**
     * Check if user has role level or higher
     */
    hasRoleLevel: (requiredLevel) => {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser || !currentUser.role) return false;

        const role = Permissions.roles[currentUser.role];
        if (!role) return false;

        return role.level >= requiredLevel;
    },

    /**
     * Get current user's role info
     */
    getCurrentRole: () => {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser || !currentUser.role) return null;

        return Permissions.roles[currentUser.role];
    },

    /**
     * Require permission or show error
     */
    require: (permission, errorMessage) => {
        if (!Permissions.can(permission)) {
            Utils.showToast(
                errorMessage || 'You do not have permission to perform this action',
                'error'
            );
            return false;
        }
        return true;
    },

    /**
     * Hide elements based on permissions
     */
    applyUIRestrictions: () => {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return;

        // Hide create buttons based on permissions
        const restrictions = [
            { selector: '[data-requires="createMeeting"]', permission: 'createMeeting' },
            { selector: '[data-requires="editMeeting"]', permission: 'editMeeting' },
            { selector: '[data-requires="deleteMeeting"]', permission: 'deleteMeeting' },
            { selector: '[data-requires="createEvent"]', permission: 'createEvent' },
            { selector: '[data-requires="editEvent"]', permission: 'editEvent' },
            { selector: '[data-requires="deleteEvent"]', permission: 'deleteEvent' },
            { selector: '[data-requires="createPolicy"]', permission: 'createPolicy' },
            { selector: '[data-requires="editPolicy"]', permission: 'editPolicy' },
            { selector: '[data-requires="deletePolicy"]', permission: 'deletePolicy' },
            { selector: '[data-requires="createAnnouncement"]', permission: 'createAnnouncement' },
            { selector: '[data-requires="editAnnouncement"]', permission: 'editAnnouncement' },
            { selector: '[data-requires="deleteAnnouncement"]', permission: 'deleteAnnouncement' }
        ];

        restrictions.forEach(({ selector, permission }) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (!Permissions.can(permission)) {
                    element.style.display = 'none';
                } else {
                    element.style.display = '';
                }
            });
        });
    },

    /**
     * Get permission summary for current user
     */
    getSummary: () => {
        const role = Permissions.getCurrentRole();
        if (!role) return null;

        return {
            role: role.name,
            level: role.level,
            canScheduleMeetings: role.permissions.createMeeting,
            canScheduleEvents: role.permissions.createEvent,
            canEditPolicies: role.permissions.editPolicy,
            canManageAnnouncements: role.permissions.createAnnouncement,
            isAdmin: role.level === 3,
            isManager: role.level >= 2,
            isUser: role.level >= 1
        };
    }
};

// Export for global use
window.Permissions = Permissions;
