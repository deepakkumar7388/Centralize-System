/**
 * MEETINGS MODULE
 * Handles meeting management, minutes generation, and display
 */

const Meetings = {
    /**
     * Render meetings page
     */
    render: () => {
        // We will fetch meetings dynamically via App initialization and store caching.
        // For render, we return structure, and load content asynchronously to avoid blocking.
        setTimeout(() => {
            Meetings.loadMeetingsData();
        }, 50);

        const canCreate = Permissions.can('createMeeting');

        return `
            <div class="section-header">
                <h2 class="section-title">Meetings Management</h2>
                <div style="display:flex;gap:0.75rem;">
                    ${Permissions.can('generateReports') ? `
                    <button class="btn btn-secondary" onclick="Meetings.generateReport()">
                        <i class="fas fa-file-pdf"></i> Export Report
                    </button>
                    ` : ''}
                    ${canCreate ? `
                    <button class="btn btn-primary" onclick="Meetings.showCreateModal()" data-requires="createMeeting">
                        <i class="fas fa-plus"></i>
                        Schedule Meeting
                    </button>
                    ` : ''}
                </div>
            </div>

            <!-- Tabs -->
            <div class="tabs-container">
                <div class="tabs-nav">
                    <button class="tab-btn active" data-tab="all" onclick="Meetings.switchTab('all')">All Meetings</button>
                    <button class="tab-btn" data-tab="upcoming" onclick="Meetings.switchTab('upcoming')">Upcoming</button>
                    <button class="tab-btn" data-tab="completed" onclick="Meetings.switchTab('completed')">Completed</button>
                </div>
            </div>

            <!-- Tab Content Containers -->
            <div id="tab-all" class="tab-content active">
                <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading meetings...</div>
            </div>
            <div id="tab-upcoming" class="tab-content">
                <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading meetings...</div>
            </div>
            <div id="tab-completed" class="tab-content">
                <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading meetings...</div>
            </div>

            <!-- Create/Edit Modal -->
            <div class="modal" id="meetingModal">
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <h3 id="meetingModalTitle">Schedule Meeting</h3>
                        <button class="btn-close" onclick="Meetings.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="meetingForm">
                            <input type="hidden" id="meetingId">
                            <div class="form-group">
                                <label class="form-label">Meeting Title *</label>
                                <input type="text" class="form-input" id="meetingTitle" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Date & Time *</label>
                                <input type="datetime-local" class="form-input" id="meetingDate" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Location *</label>
                                <input type="text" class="form-input" id="meetingLocation" 
                                    placeholder="e.g., Conference Room A, Zoom Link" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Attendees</label>
                                <input type="text" class="form-input" id="meetingAttendees" 
                                    placeholder="Comma-separated names">
                                <div class="form-help">Enter attendee names separated by commas</div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <select class="form-select" id="meetingStatus">
                                    <option value="scheduled">Scheduled</option>
                                    <option value="pending">Pending</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Agenda</label>
                                <textarea class="form-textarea" id="meetingAgenda" 
                                    placeholder="Meeting agenda and topics"></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Minutes of Meeting</label>
                                <textarea class="form-textarea" id="meetingMinutes" 
                                    placeholder="Meeting minutes and notes"></textarea>
                                <div class="form-help">Document discussions, decisions, and action items</div>
                            </div>

                            <!-- ACTION ITEMS -->
                            <div class="form-group">
                                <label class="form-label" style="display:flex;justify-content:space-between;align-items:center;">
                                    <span><i class="fas fa-tasks" style="color:#6366f1"></i> Action Items</span>
                                    <button type="button" class="btn btn-secondary" style="font-size:0.8rem;padding:4px 12px;" onclick="Meetings.addActionItemRow()">
                                        <i class="fas fa-plus"></i> Add Item
                                    </button>
                                </label>
                                <div id="actionItemsContainer" style="border:1px solid #e2e8f0;border-radius:0.5rem;overflow:hidden;">
                                    <div style="display:grid;grid-template-columns:2fr 1fr 1fr auto;background:#f8fafc;padding:6px 10px;font-size:0.75rem;font-weight:600;color:#64748b;">
                                        <span>Task</span><span>Assignee</span><span>Due Date</span><span></span>
                                    </div>
                                    <div id="actionItemsList"></div>
                                </div>
                                <div class="form-help">Track decisions and responsibilities from this meeting</div>
                            </div>

                            <!-- FILE ATTACHMENTS -->
                            <div class="form-group">
                                <label class="form-label"><i class="fas fa-paperclip" style="color:#6366f1"></i> Attachments</label>
                                <input type="file" class="form-input" id="meetingFiles" multiple 
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.png">
                                <div class="form-help">Upload minutes, presentations, or supporting documents (PDF, DOC, PPT, etc.)</div>
                                <div id="existingAttachments" style="margin-top:8px;"></div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="Meetings.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="Meetings.saveMeeting()">
                            <i class="fas fa-save"></i>
                            Save Meeting
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Cache holding variable for meetings list fetched from Flask
    cachedMeetings: [],

    /**
     * Load meetings from API
     */
    loadMeetingsData: async () => {
        try {
            const data = await ApiService.meetings.getAll();
            Meetings.cachedMeetings = Array.isArray(data) ? data : [];
            // Cache locally also for dashboard stats module compatibility
            Store.saveMeetings(Meetings.cachedMeetings);
            Meetings.renderAllTabs();
        } catch (error) {
            console.error("Error loading meetings:", error);
            Utils.showToast("Failed to fetch meetings from server. Using local cache.", "warning");
            Meetings.cachedMeetings = Store.getMeetings();
            Meetings.renderAllTabs();
        }
    },

    /**
     * Render all tabs view
     */
    renderAllTabs: () => {
        const meetings = Meetings.cachedMeetings;
        const upcomingMeetings = meetings.filter(m => m.status === 'scheduled');
        const completedMeetings = meetings.filter(m => m.status === 'completed');

        const allEl = document.getElementById('tab-all');
        const upcomingEl = document.getElementById('tab-upcoming');
        const completedEl = document.getElementById('tab-completed');

        if (allEl) allEl.innerHTML = Meetings.renderMeetingsList(meetings, 'all');
        if (upcomingEl) upcomingEl.innerHTML = Meetings.renderMeetingsList(upcomingMeetings, 'upcoming');
        if (completedEl) completedEl.innerHTML = Meetings.renderMeetingsList(completedMeetings, 'completed');
    },

    /**
     * Switch current Tab view
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
     * Render meetings list
     */
    renderMeetingsList: (meetings, type) => {
        if (!meetings.length) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-calendar-times"></i>
                    </div>
                    <h3 class="empty-state-title">No ${type} meetings</h3>
                    <p class="empty-state-desc">Click "Schedule Meeting" to create a new meeting</p>
                </div>
            `;
        }

        return `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Meeting Title</th>
                            <th>Date & Time</th>
                            <th>Location</th>
                            <th>Attendees</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${meetings.map(meeting => `
                            <tr>
                                <td>
                                    <strong>${Utils.sanitizeHTML(meeting.title || '')}</strong>
                                    ${meeting.agenda ? `<br><small style="color: var(--text-tertiary);">${Utils.sanitizeHTML(meeting.agenda.substring(0, 50))}...</small>` : ''}
                                </td>
                                <td>${Utils.formatDateTime(meeting.date)}</td>
                                <td>${Utils.sanitizeHTML(meeting.location || '')}</td>
                                <td>${Array.isArray(meeting.attendees) ? meeting.attendees.length : 0}</td>
                                <td>
                                    <span class="badge ${Meetings.getStatusBadge(meeting.status)}">
                                        ${meeting.status}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn-icon" onclick="Meetings.viewMeeting('${meeting.id}')" 
                                        data-tooltip="View Details">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    ${Permissions.can('editMeeting') ? `
                                    <button class="btn-icon" onclick="Meetings.editMeeting('${meeting.id}')" 
                                        data-tooltip="Edit" data-requires="editMeeting">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    ` : ''}
                                    ${Permissions.can('generateReports') ? `
                                    <button class="btn-icon" onclick="Meetings.generateMinutes('${meeting.id}')" 
                                        data-tooltip="Generate Minutes">
                                        <i class="fas fa-file-alt"></i>
                                    </button>
                                    ` : ''}
                                    ${Permissions.can('deleteMeeting') ? `
                                    <button class="btn-icon" onclick="Meetings.deleteMeeting('${meeting.id}')" 
                                        data-tooltip="Delete" data-requires="deleteMeeting">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                    ` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * Get status badge class
     */
    getStatusBadge: (status) => {
        const badges = {
            'scheduled': 'badge-primary',
            'completed': 'badge-success',
            'pending': 'badge-warning',
            'cancelled': 'badge-danger'
        };
        return badges[status] || 'badge-info';
    },

    /**
     * Show create modal
     */
    showCreateModal: () => {
        // Check permission
        if (!Permissions.require('createMeeting', 'You do not have permission to schedule meetings')) {
            return;
        }

        document.getElementById('meetingModalTitle').textContent = 'Schedule Meeting';
        document.getElementById('meetingForm').reset();
        document.getElementById('meetingId').value = '';
        document.getElementById('meetingModal').classList.add('active');
    },

    /**
     * Edit meeting
     */
    editMeeting: (id) => {
        // Check permission
        if (!Permissions.require('editMeeting', 'You do not have permission to edit meetings')) {
            return;
        }

        const meeting = Meetings.cachedMeetings.find(m => m.id === id) || Store.getMeetingById(id);
        if (!meeting) return;

        document.getElementById('meetingModalTitle').textContent = 'Edit Meeting';
        document.getElementById('meetingId').value = meeting.id;
        document.getElementById('meetingTitle').value = meeting.title;
        document.getElementById('meetingDate').value = new Date(meeting.date).toISOString().slice(0, 16);
        document.getElementById('meetingLocation').value = meeting.location;
        document.getElementById('meetingAttendees').value = Array.isArray(meeting.attendees) ? meeting.attendees.join(', ') : '';
        document.getElementById('meetingStatus').value = meeting.status;
        document.getElementById('meetingAgenda').value = meeting.agenda || '';
        document.getElementById('meetingMinutes').value = meeting.minutes || '';

        // Load action items
        document.getElementById('actionItemsList').innerHTML = '';
        (meeting.actionItems || []).forEach(item => Meetings.addActionItemRow(item));

        // Show existing attachments
        const existingEl = document.getElementById('existingAttachments');
        existingEl.innerHTML = Utils.buildAttachmentLinks(meeting.attachments || []);

        document.getElementById('meetingModal').classList.add('active');
    },

    /**
     * Save meeting
     */
    saveMeeting: async () => {
        const id = document.getElementById('meetingId').value;

        // Check permission - either create or edit
        if (id) {
            if (!Permissions.require('editMeeting', 'You do not have permission to edit meetings')) {
                return;
            }
        } else {
            if (!Permissions.require('createMeeting', 'You do not have permission to schedule meetings')) {
                return;
            }
        }

        // Gather action items
        const actionItems = [];
        document.querySelectorAll('.action-item-row').forEach(row => {
            const task = row.querySelector('.ai-task').value.trim();
            const assignee = row.querySelector('.ai-assignee').value.trim();
            const dueDate = row.querySelector('.ai-due').value;
            const status = row.querySelector('.ai-status').value;
            if (task) actionItems.push({ task, assignee, dueDate, status });
        });

        const meetingData = {
            title: document.getElementById('meetingTitle').value.trim(),
            date: new Date(document.getElementById('meetingDate').value).toISOString(),
            location: document.getElementById('meetingLocation').value.trim(),
            attendees: document.getElementById('meetingAttendees').value
                .split(',')
                .map(a => a.trim())
                .filter(a => a),
            status: document.getElementById('meetingStatus').value,
            agenda: document.getElementById('meetingAgenda').value.trim(),
            minutes: document.getElementById('meetingMinutes').value.trim(),
            actionItems: actionItems
        };

        if (!meetingData.title || !meetingData.date || !meetingData.location) {
            Utils.showToast('Please fill in all required fields (*)', 'error');
            return;
        }

        // Handle file uploads
        const filesInput = document.getElementById('meetingFiles');
        let newAttachments = [];
        if (filesInput.files.length > 0) {
            Utils.showToast('Uploading files...', 'info');
            for (const file of filesInput.files) {
                try {
                    const result = await Utils.uploadFile(file);
                    if (result.success) newAttachments.push({ filename: result.filename, originalName: result.originalName });
                } catch (e) { console.warn('File upload failed:', e); }
            }
        }

        // Merge with existing attachments if editing
        if (id) {
            const existing = Meetings.cachedMeetings.find(m => m.id === id);
            meetingData.attachments = [...(existing?.attachments || []), ...newAttachments];
        } else {
            meetingData.attachments = newAttachments;
        }

        try {
            if (id) {
                await ApiService.meetings.update(id, meetingData);
                Utils.showToast('Meeting updated successfully', 'success');
            } else {
                await ApiService.meetings.create(meetingData);
                Utils.showToast('Meeting scheduled successfully', 'success');
            }
            Meetings.closeModal();
            await Meetings.loadMeetingsData();
            App.loadPage('meetings');
        } catch (error) {
            console.error('Error saving meeting:', error);
            Utils.showToast(error.message || 'Failed to save meeting data', 'error');
        }
    },

    /**
     * View meeting details
     */
    viewMeeting: (id) => {
        const meeting = Store.getMeetingById(id);
        if (!meeting) return;

        const content = `
            <h2>${Utils.sanitizeHTML(meeting.title)}</h2>
            <p><strong>Date:</strong> ${Utils.formatDateTime(meeting.date)}</p>
            <p><strong>Location:</strong> ${Utils.sanitizeHTML(meeting.location)}</p>
            <p><strong>Status:</strong> ${meeting.status}</p>
            <p><strong>Attendees:</strong> ${Array.isArray(meeting.attendees) ? meeting.attendees.join(', ') : 'None'}</p>
            <h3>Agenda</h3>
            <p>${Utils.sanitizeHTML(meeting.agenda || 'No agenda provided')}</p>
            <h3>Minutes of Meeting</h3>
            <p>${Utils.sanitizeHTML(meeting.minutes || 'No minutes recorded yet')}</p>
        `;

        Utils.printContent(`Meeting: ${meeting.title}`, content);
    },

    /**
     * Generate minutes document
     */
    generateReport: () => {
        const meetings = Meetings.cachedMeetings;
        const rows = meetings.map(m => {
            const statusBadgeClass = { scheduled: 'badge-blue', completed: 'badge-green', pending: 'badge-yellow', cancelled: 'badge-red' }[m.status] || 'badge-blue';
            const actionCount = (m.actionItems || []).length;
            const attachCount = (m.attachments || []).length;
            return `<tr>
                <td>${Utils.sanitizeHTML(m.title)}</td>
                <td>${Utils.formatDateTime(m.date)}</td>
                <td>${Utils.sanitizeHTML(m.location)}</td>
                <td>${Array.isArray(m.attendees) ? m.attendees.length : 0}</td>
                <td><span class="badge ${statusBadgeClass}">${m.status}</span></td>
                <td>${actionCount} items</td>
                <td>${attachCount} file(s)</td>
            </tr>`;
        }).join('');

        const bodyHTML = `
            <p style="margin-bottom:16px;color:#64748b;">Total Records: <strong>${meetings.length}</strong></p>
            <table>
                <thead><tr>
                    <th>Title</th><th>Date & Time</th><th>Location</th><th>Attendees</th><th>Status</th><th>Action Items</th><th>Attachments</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:#94a3b8;">No meetings recorded</td></tr>'}</tbody>
            </table>`;

        Utils.printReport('Meetings Report', bodyHTML);
    },

    generateMinutes: (id) => {
        const meeting = Meetings.cachedMeetings.find(m => m.id === id) || Store.getMeetingById(id);
        if (!meeting) return;

        const actionItemsHTML = (meeting.actionItems || []).length > 0 ? `
            <div class="section-title">Action Items</div>
            <table>
                <thead><tr><th>Task</th><th>Assignee</th><th>Due Date</th><th>Status</th></tr></thead>
                <tbody>${(meeting.actionItems || []).map(a => `
                    <tr><td>${a.task}</td><td>${a.assignee || '—'}</td>
                    <td>${a.dueDate ? Utils.formatDate(a.dueDate) : '—'}</td>
                    <td><span class="badge ${a.status === 'done' ? 'badge-green' : 'badge-yellow'}">${a.status || 'pending'}</span></td></tr>`
                ).join('')}</tbody>
            </table>` : '';

        const attachHTML = (meeting.attachments || []).length > 0 ? `
            <div class="section-title">Attached Documents</div>
            <ul>${(meeting.attachments || []).map(a => `<li>${a.originalName || a.filename}</li>`).join('')}</ul>` : '';

        const bodyHTML = `
            <table>
                <tr><td width="30%"><strong>Meeting Title</strong></td><td>${Utils.sanitizeHTML(meeting.title)}</td></tr>
                <tr><td><strong>Date & Time</strong></td><td>${Utils.formatDateTime(meeting.date)}</td></tr>
                <tr><td><strong>Location</strong></td><td>${Utils.sanitizeHTML(meeting.location)}</td></tr>
                <tr><td><strong>Status</strong></td><td>${meeting.status}</td></tr>
                <tr><td><strong>Attendees</strong></td><td>${Array.isArray(meeting.attendees) ? meeting.attendees.join(', ') : 'None'}</td></tr>
            </table>
            <div class="section-title">Agenda</div>
            <p style="white-space:pre-wrap;">${Utils.sanitizeHTML(meeting.agenda || 'No agenda provided')}</p>
            <div class="section-title">Minutes of Discussion</div>
            <p style="white-space:pre-wrap;">${Utils.sanitizeHTML(meeting.minutes || 'No minutes recorded yet')}</p>
            ${actionItemsHTML}
            ${attachHTML}`;

        Utils.printReport(`Minutes of Meeting — ${meeting.title}`, bodyHTML);
    },

    addActionItemRow: (item = {}) => {
        const list = document.getElementById('actionItemsList');
        if (!list) return;
        const div = document.createElement('div');
        div.className = 'action-item-row';
        div.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:4px;padding:6px 10px;border-top:1px solid #e2e8f0;align-items:center;';
        div.innerHTML = `
            <input class="form-input ai-task" value="${item.task || ''}" placeholder="Action task..." style="padding:6px 10px;font-size:0.85rem;">
            <input class="form-input ai-assignee" value="${item.assignee || ''}" placeholder="Assignee" style="padding:6px 10px;font-size:0.85rem;">
            <input class="form-input ai-due" type="date" value="${item.dueDate || ''}" style="padding:6px 10px;font-size:0.85rem;">
            <div style="display:flex;gap:4px;align-items:center;">
                <select class="form-select ai-status" style="padding:6px;font-size:0.8rem;">
                    <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="in-progress" ${item.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                    <option value="done" ${item.status === 'done' ? 'selected' : ''}>Done</option>
                </select>
                <button type="button" onclick="this.closest('.action-item-row').remove()" 
                    style="background:#fee2e2;border:none;border-radius:4px;color:#ef4444;width:28px;height:28px;cursor:pointer;font-size:0.9rem;">✕</button>
            </div>`;
        list.appendChild(div);
    },

    /**
     * Delete meeting
     */
    deleteMeeting: async (id) => {
        // Check permission
        if (!Permissions.require('deleteMeeting', 'You do not have permission to delete meetings')) {
            return;
        }

        if (confirm('Are you sure you want to delete this meeting?')) {
            try {
                await ApiService.meetings.delete(id);
                Utils.showToast('Meeting deleted successfully', 'success');
                await Meetings.loadMeetingsData();
                App.loadPage('meetings');
            } catch (error) {
                console.error("Error deleting meeting:", error);
                Utils.showToast("Failed to delete meeting from server.", "error");
            }
        }
    },

    /**
     * Close modal
     */
    closeModal: () => {
        document.getElementById('meetingModal').classList.remove('active');
    },

    /**
     * Initialize meetings module
     */
    init: () => {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                const tab = e.target.dataset.tab;

                // Update active tab button
                document.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');

                // Update active tab content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`tab-${tab}`).classList.add('active');
            }
        });
    }
};

// Export for use in other modules
window.Meetings = Meetings;
