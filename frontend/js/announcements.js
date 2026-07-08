/**
 * ANNOUNCEMENTS MODULE
 * Handles institutional announcements and notifications
 */

const Announcements = {
    /**
     * Render announcements page
     */
    render: () => {
        setTimeout(() => {
            Announcements.loadAnnouncementsData();
        }, 50);

        const canCreate = Permissions.can('createAnnouncement');

        return `
            <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2 class="section-title" style="margin: 0;">Announcements</h2>
                ${canCreate ? `
                <button class="btn btn-primary" onclick="Announcements.showCreateModal()" data-requires="createAnnouncement">
                    <i class="fas fa-plus"></i>
                    New Announcement
                </button>
                ` : ''}
            </div>

            <!-- Tabs -->
            <div class="tabs-container">
                <div class="tabs-nav">
                    <button class="tab-btn active" data-tab="all-announcements" onclick="Announcements.switchTab('all-announcements')">All</button>
                    <button class="tab-btn" data-tab="active-announcements" onclick="Announcements.switchTab('active-announcements')">Active</button>
                    <button class="tab-btn" data-tab="archived-announcements" onclick="Announcements.switchTab('archived-announcements')">Archived</button>
                </div>
            </div>

            <!-- Tab Content -->
            <div id="tab-all-announcements" class="tab-content active">
                <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading announcements...</div>
            </div>
            <div id="tab-active-announcements" class="tab-content">
                <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading announcements...</div>
            </div>
            <div id="tab-archived-announcements" class="tab-content">
                <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading announcements...</div>
            </div>

            <!-- Create/Edit Modal -->
            <div class="modal" id="announcementModal">
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <h3 id="announcementModalTitle">New Announcement</h3>
                        <button class="btn-close" onclick="Announcements.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="announcementForm">
                            <input type="hidden" id="announcementId">
                            <div class="form-group">
                                <label class="form-label">Announcement Title *</label>
                                <input type="text" class="form-input" id="announcementTitle" required>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label">Priority</label>
                                    <select class="form-select" id="announcementPriority">
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Status</label>
                                    <select class="form-select" id="announcementStatus">
                                        <option value="active">Active</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label">Publish Date</label>
                                    <input type="datetime-local" class="form-input" id="announcementPublishDate">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Expiry Date</label>
                                    <input type="date" class="form-input" id="announcementExpiryDate">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Created By</label>
                                <input type="text" class="form-input" id="announcementCreatedBy" 
                                    value="Administrator" readonly>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Content *</label>
                                <textarea class="form-textarea" id="announcementContent" 
                                    style="min-height: 150px;" required
                                    placeholder="Enter the announcement message..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="Announcements.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="Announcements.saveAnnouncement()">
                            <i class="fas fa-save"></i>
                            Publish
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render announcements list
     */
    renderAnnouncementsList: (announcements) => {
        if (!announcements.length) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-bullhorn"></i>
                    </div>
                    <h3 class="empty-state-title">No announcements found</h3>
                    <p class="empty-state-desc">Click "New Announcement" to create one</p>
                </div>
            `;
        }

        return `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                ${announcements.map(announcement => `
                    <div class="card" style="border-left: 4px solid ${Announcements.getPriorityColor(announcement.priority)};">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                                    <h3 style="margin: 0; font-size: 1.125rem; font-weight: 700;">
                                        ${Utils.sanitizeHTML(announcement.title)}
                                    </h3>
                                    <span class="badge ${Announcements.getPriorityBadge(announcement.priority)}">
                                        ${announcement.priority}
                                    </span>
                                    <span class="badge ${Announcements.getStatusBadge(announcement.status)}">
                                        ${announcement.status}
                                    </span>
                                </div>
                                <div style="color: var(--text-tertiary); font-size: 0.875rem;">
                                    <i class="fas fa-user"></i> ${Utils.sanitizeHTML(announcement.createdBy || 'Unknown')} • 
                                    <i class="fas fa-calendar"></i> ${Utils.formatDateTime(announcement.publishDate || announcement.createdAt)}
                                </div>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                ${Permissions.can('editAnnouncement') ? `
                                <button class="btn-icon" onclick="Announcements.editAnnouncement('${announcement.id}')" 
                                    data-tooltip="Edit" data-requires="editAnnouncement">
                                    <i class="fas fa-edit"></i>
                                </button>
                                ` : ''}
                                ${Permissions.can('deleteAnnouncement') ? `
                                <button class="btn-icon" onclick="Announcements.deleteAnnouncement('${announcement.id}')" 
                                    data-tooltip="Delete" data-requires="deleteAnnouncement">
                                    <i class="fas fa-trash"></i>
                                </button>
                                ` : ''}
                            </div>
                        </div>
                        
                        <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 0.75rem;">
                            ${Utils.sanitizeHTML(announcement.content)}
                        </p>
                        
                        ${announcement.expiryDate ? `
                            <div style="color: var(--text-tertiary); font-size: 0.875rem;">
                                <i class="fas fa-clock"></i> Expires: ${Utils.formatDate(announcement.expiryDate)}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Get priority color
     */
    getPriorityColor: (priority) => {
        const colors = {
            'low': '#3b82f6',
            'medium': '#f59e0b',
            'high': '#ef4444',
            'critical': '#dc2626'
        };
        return colors[priority] || colors.medium;
    },

    /**
     * Get priority badge class
     */
    getPriorityBadge: (priority) => {
        const badges = {
            'low': 'badge-info',
            'medium': 'badge-warning',
            'high': 'badge-danger',
            'critical': 'badge-danger'
        };
        return badges[priority] || 'badge-info';
    },

    /**
     * Get status badge class
     */
    getStatusBadge: (status) => {
        const badges = {
            'active': 'badge-success',
            'scheduled': 'badge-primary',
            'archived': 'badge-info'
        };
        return badges[status] || 'badge-info';
    },

    // Cached announcements array from Flask server
    cachedAnnouncements: [],

    /**
     * Load announcements dynamically
     */
    loadAnnouncementsData: async () => {
        try {
            const data = await ApiService.announcements.getAll();
            Announcements.cachedAnnouncements = Array.isArray(data) ? data : [];
            Store.saveAnnouncements(Announcements.cachedAnnouncements);
            Announcements.renderAllTabs();
        } catch (error) {
            console.error("Error loading announcements:", error);
            Utils.showToast("Failed to fetch announcements. Using local cache.", "warning");
            Announcements.cachedAnnouncements = Store.getAnnouncements();
            Announcements.renderAllTabs();
        }
    },

    /**
     * Render all tabs for announcements
     */
    renderAllTabs: () => {
        const announcements = Announcements.cachedAnnouncements;
        const activeAnnouncements = announcements.filter(a => a.status === 'active');
        const archivedAnnouncements = announcements.filter(a => a.status === 'archived');

        const allEl = document.getElementById('tab-all-announcements');
        const activeEl = document.getElementById('tab-active-announcements');
        const archivedEl = document.getElementById('tab-archived-announcements');

        if (allEl) allEl.innerHTML = Announcements.renderAnnouncementsList(announcements);
        if (activeEl) activeEl.innerHTML = Announcements.renderAnnouncementsList(activeAnnouncements);
        if (archivedEl) archivedEl.innerHTML = Announcements.renderAnnouncementsList(archivedAnnouncements);
    },

    /**
     * Tab switching
     */
    switchTab: (tabId) => {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabId) btn.classList.add('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const activeContent = document.getElementById(`tab-${tabId}`);
        if (activeContent) activeContent.classList.add('active');
    },

    /**
     * Get priority badge class
     */
    getPriorityBadge: (priority) => {
        const badges = {
            'low': 'badge-info',
            'medium': 'badge-warning',
            'high': 'badge-danger',
            'critical': 'badge-danger'
        };
        return badges[priority] || 'badge-info';
    },

    /**
     * Show create modal
     */
    showCreateModal: () => {
        // Check permission
        if (!Permissions.require('createAnnouncement', 'You do not have permission to create announcements')) {
            return;
        }

        document.getElementById('announcementModalTitle').textContent = 'New Announcement';
        document.getElementById('announcementForm').reset();
        document.getElementById('announcementId').value = '';
        
        // Auto fill createdBy from local logged-in session user name
        const currentUser = Auth.getCurrentUser();
        document.getElementById('announcementCreatedBy').value = currentUser ? currentUser.name : 'Administrator';

        // Set current date/time
        const now = new Date();
        document.getElementById('announcementPublishDate').value = now.toISOString().slice(0, 16);

        document.getElementById('announcementModal').classList.add('active');
    },

    /**
     * Edit announcement
     */
    editAnnouncement: (id) => {
        // Check permission
        if (!Permissions.require('editAnnouncement', 'You do not have permission to edit announcements')) {
            return;
        }

        const announcement = Announcements.cachedAnnouncements.find(a => a.id === id) || Store.getAnnouncementById(id);
        if (!announcement) return;

        document.getElementById('announcementModalTitle').textContent = 'Edit Announcement';
        document.getElementById('announcementId').value = announcement.id;
        document.getElementById('announcementTitle').value = announcement.title;
        document.getElementById('announcementPriority').value = announcement.priority;
        document.getElementById('announcementStatus').value = announcement.status;
        document.getElementById('announcementPublishDate').value =
            new Date(announcement.publishDate || announcement.createdAt).toISOString().slice(0, 16);
        document.getElementById('announcementExpiryDate').value = announcement.expiryDate || '';
        document.getElementById('announcementCreatedBy').value = announcement.createdBy || 'Administrator';
        document.getElementById('announcementContent').value = announcement.content;

        document.getElementById('announcementModal').classList.add('active');
    },

    /**
     * Save announcement
     */
    saveAnnouncement: async () => {
        const id = document.getElementById('announcementId').value;

        // Check permission - either create or edit
        if (id) {
            if (!Permissions.require('editAnnouncement', 'You do not have permission to edit announcements')) {
                return;
            }
        } else {
            if (!Permissions.require('createAnnouncement', 'You do not have permission to create announcements')) {
                return;
            }
        }

        const announcementData = {
            title: document.getElementById('announcementTitle').value.trim(),
            priority: document.getElementById('announcementPriority').value,
            status: document.getElementById('announcementStatus').value,
            publishDate: new Date(document.getElementById('announcementPublishDate').value).toISOString(),
            expiryDate: document.getElementById('announcementExpiryDate').value,
            createdBy: document.getElementById('announcementCreatedBy').value,
            content: document.getElementById('announcementContent').value.trim()
        };

        if (!announcementData.title || !announcementData.content) {
            Utils.showToast('Please fill in all required fields (*)', 'error');
            return;
        }

        try {
            if (id) {
                await ApiService.announcements.update(id, announcementData);
                Utils.showToast('Announcement updated successfully', 'success');
            } else {
                await ApiService.announcements.create(announcementData);
                Utils.showToast('Announcement published successfully', 'success');
            }

            Announcements.closeModal();
            await Announcements.loadAnnouncementsData();
            App.loadPage('announcements');
        } catch (error) {
            console.error('Error saving announcement:', error);
            Utils.showToast(error.message || 'Failed to save announcement', 'error');
        }
    },

    /**
     * Delete announcement
     */
    deleteAnnouncement: async (id) => {
        // Check permission
        if (!Permissions.require('deleteAnnouncement', 'You do not have permission to delete announcements')) {
            return;
        }

        if (confirm('Are you sure you want to delete this announcement?')) {
            try {
                await ApiService.announcements.delete(id);
                Utils.showToast('Announcement deleted successfully', 'success');
                await Announcements.loadAnnouncementsData();
                App.loadPage('announcements');
            } catch (error) {
                console.error("Error deleting announcement:", error);
                Utils.showToast("Failed to delete announcement from server.", "error");
            }
        }
    },

    /**
     * Close modal
     */
    closeModal: () => {
        document.getElementById('announcementModal').classList.remove('active');
    },

    /**
     * Initialize announcements module
     */
    init: () => {
        console.log('Announcements module initialized');
    }
};

// Export for use in other modules
window.Announcements = Announcements;
