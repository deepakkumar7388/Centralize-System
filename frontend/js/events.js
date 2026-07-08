/**
 * EVENTS MODULE
 * Handles event management, speeches, and presentations archival
 */

const Events = {
    /**
     * Render events page
     */
    render: () => {
        setTimeout(() => {
            Events.loadEventsData();
        }, 50);

        const canCreate = Permissions.can('createEvent');

        return `
            <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2 class="section-title" style="margin: 0;">Events Management</h2>
                <div style="display:flex;gap:0.75rem;">
                    ${Permissions.can('generateReports') ? `
                    <button class="btn btn-secondary" onclick="Events.generateReport()">
                        <i class="fas fa-file-pdf"></i> Export Report
                    </button>
                    ` : ''}
                    ${canCreate ? `
                    <button class="btn btn-primary" onclick="Events.showCreateModal()" data-requires="createEvent">
                        <i class="fas fa-plus"></i>
                        Create Event
                    </button>
                    ` : ''}
                </div>
            </div>

            <!-- Tabs -->
            <div class="tabs-container">
                <div class="tabs-nav">
                    <button class="tab-btn active" data-tab="all-events" onclick="Events.switchTab('all-events')">All Events</button>
                    <button class="tab-btn" data-tab="upcoming-events" onclick="Events.switchTab('upcoming-events')">Upcoming</button>
                    <button class="tab-btn" data-tab="past-events" onclick="Events.switchTab('past-events')">Past Events</button>
                </div>
            </div>

            <!-- Tab Content -->
            <div id="tab-all-events" class="tab-content active">
                <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading events...</div>
            </div>
            <div id="tab-upcoming-events" class="tab-content">
                <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading events...</div>
            </div>
            <div id="tab-past-events" class="tab-content">
                <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading events...</div>
            </div>

            <!-- Create/Edit Modal -->
            <div class="modal" id="eventModal">
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <h3 id="eventModalTitle">Create Event</h3>
                        <button class="btn-close" onclick="Events.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="eventForm">
                            <input type="hidden" id="eventId">
                            <div class="form-group">
                                <label class="form-label">Event Title *</label>
                                <input type="text" class="form-input" id="eventTitle" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Date & Time *</label>
                                <input type="datetime-local" class="form-input" id="eventDate" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Location *</label>
                                <input type="text" class="form-input" id="eventLocation" 
                                    placeholder="e.g., Grand Hall, Auditorium" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Description</label>
                                <textarea class="form-textarea" id="eventDescription" 
                                    placeholder="Event description and purpose"></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Speakers</label>
                                <input type="text" class="form-input" id="eventSpeakers" 
                                    placeholder="Comma-separated speaker names">
                                <div class="form-help">Enter speaker names separated by commas</div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Expected Attendees</label>
                                <input type="number" class="form-input" id="eventAttendees" 
                                    placeholder="0" min="0">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <select class="form-select" id="eventStatus">
                                    <option value="upcoming">Upcoming</option>
                                    <option value="ongoing">Ongoing</option>
                                    <option value="completed">Completed</option>
                                    <option value="archived">Archived</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <!-- FILE ATTACHMENTS -->
                            <div class="form-group">
                                <label class="form-label"><i class="fas fa-paperclip" style="color:#6366f1"></i> Attachments</label>
                                <input type="file" class="form-input" id="eventFiles" multiple
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.png,.mp4,.mov">
                                <div class="form-help">Upload speeches, presentations, photos or recordings (PDF, PPT, MP4, etc.)</div>
                                <div id="existingEventAttachments" style="margin-top:8px;"></div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="Events.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="Events.saveEvent()">
                            <i class="fas fa-save"></i>
                            Save Event
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render events list
     */
    renderEventsList: (events) => {
        if (!events.length) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-calendar-times"></i>
                    </div>
                    <h3 class="empty-state-title">No events found</h3>
                    <p class="empty-state-desc">Click "Create Event" to add a new event</p>
                </div>
            `;
        }

        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem;">
                ${events.map(event => `
                    <div class="card" style="transition: transform 0.2s;">
                        <div style="display: flex; align-items: start; justify-content: space-between; margin-bottom: 1rem;">
                            <div>
                                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.125rem; font-weight: 700;">
                                    ${Utils.sanitizeHTML(event.title)}
                                </h3>
                                <span class="badge ${Events.getStatusBadge(event.status)}">
                                    ${event.status}
                                </span>
                            </div>
                        </div>
                        
                        <div style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1rem;">
                            <div style="margin-bottom: 0.5rem;">
                                <i class="fas fa-calendar" style="width: 16px;"></i>
                                ${Utils.formatDateTime(event.date)}
                            </div>
                            <div style="margin-bottom: 0.5rem;">
                                <i class="fas fa-map-marker-alt" style="width: 16px;"></i>
                                ${Utils.sanitizeHTML(event.location)}
                            </div>
                            ${event.speakers && event.speakers.length ? `
                                <div style="margin-bottom: 0.5rem;">
                                    <i class="fas fa-microphone" style="width: 16px;"></i>
                                    ${event.speakers.length} speaker(s)
                                </div>
                            ` : ''}
                            <div>
                                <i class="fas fa-users" style="width: 16px;"></i>
                                ${event.attendees || 0} attendees
                            </div>
                        </div>
                        
                        ${event.description ? `
                            <p style="color: var(--text-tertiary); font-size: 0.875rem; margin-bottom: 1rem;">
                                ${Utils.sanitizeHTML(event.description.substring(0, 100))}${event.description.length > 100 ? '...' : ''}
                            </p>
                        ` : ''}
                        
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <button class="btn btn-secondary" onclick="Events.viewEvent('${event.id}')" style="flex: 1;">
                                <i class="fas fa-eye"></i>
                                View
                            </button>
                            ${Permissions.can('editEvent') ? `
                            <button class="btn-icon" onclick="Events.editEvent('${event.id}')" data-tooltip="Edit" data-requires="editEvent">
                                <i class="fas fa-edit"></i>
                            </button>
                            ` : ''}
                            ${Permissions.can('deleteEvent') ? `
                            <button class="btn-icon" onclick="Events.deleteEvent('${event.id}')" data-tooltip="Delete" data-requires="deleteEvent">
                                <i class="fas fa-trash"></i>
                            </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Cache variable for Flask API data sync
    cachedEvents: [],

    /**
     * Load events dynamically
     */
    loadEventsData: async () => {
        try {
            const data = await ApiService.events.getAll();
            Events.cachedEvents = Array.isArray(data) ? data : [];
            Store.saveEvents(Events.cachedEvents);
            Events.renderAllTabs();
        } catch (error) {
            console.error("Error loading events:", error);
            Utils.showToast("Failed to fetch events from server. Using local cache.", "warning");
            Events.cachedEvents = Store.getEvents();
            Events.renderAllTabs();
        }
    },

    /**
     * Render all tabs for events
     */
    renderAllTabs: () => {
        const events = Events.cachedEvents;
        const upcomingEvents = events.filter(e => new Date(e.date) > new Date());
        const pastEvents = events.filter(e => new Date(e.date) <= new Date());

        const allEl = document.getElementById('tab-all-events');
        const upcomingEl = document.getElementById('tab-upcoming-events');
        const pastEl = document.getElementById('tab-past-events');

        if (allEl) allEl.innerHTML = Events.renderEventsList(events);
        if (upcomingEl) upcomingEl.innerHTML = Events.renderEventsList(upcomingEvents);
        if (pastEl) pastEl.innerHTML = Events.renderEventsList(pastEvents);
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
     * Get status badge class
     */
    getStatusBadge: (status) => {
        const badges = {
            'upcoming': 'badge-primary',
            'ongoing': 'badge-info',
            'completed': 'badge-success',
            'archived': 'badge-warning',
            'cancelled': 'badge-danger'
        };
        return badges[status] || 'badge-info';
    },

    /**
     * Show create modal
     */
    showCreateModal: () => {
        // Check permission
        if (!Permissions.require('createEvent', 'You do not have permission to create events')) {
            return;
        }

        document.getElementById('eventModalTitle').textContent = 'Create Event';
        document.getElementById('eventForm').reset();
        document.getElementById('eventId').value = '';
        document.getElementById('eventModal').classList.add('active');
    },

    /**
     * Edit event
     */
    editEvent: (id) => {
        // Check permission
        if (!Permissions.require('editEvent', 'You do not have permission to edit events')) {
            return;
        }

        const event = Events.cachedEvents.find(e => e.id === id) || Store.getEventById(id);
        if (!event) return;

        document.getElementById('eventModalTitle').textContent = 'Edit Event';
        document.getElementById('eventId').value = event.id;
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = new Date(event.date).toISOString().slice(0, 16);
        document.getElementById('eventLocation').value = event.location;
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventSpeakers').value = Array.isArray(event.speakers) ? event.speakers.join(', ') : '';
        document.getElementById('eventAttendees').value = event.attendees || 0;
        document.getElementById('eventStatus').value = event.status;

        // Show existing attachments
        const existingEl = document.getElementById('existingEventAttachments');
        if (existingEl) existingEl.innerHTML = Utils.buildAttachmentLinks(event.attachments || []);

        document.getElementById('eventModal').classList.add('active');
    },

    /**
     * Save event
     */
    saveEvent: async () => {
        const id = document.getElementById('eventId').value;

        // Check permission - either create or edit
        if (id) {
            if (!Permissions.require('editEvent', 'You do not have permission to edit events')) {
                return;
            }
        } else {
            if (!Permissions.require('createEvent', 'You do not have permission to create events')) {
                return;
            }
        }

        const eventData = {
            title: document.getElementById('eventTitle').value.trim(),
            date: new Date(document.getElementById('eventDate').value).toISOString(),
            location: document.getElementById('eventLocation').value.trim(),
            description: document.getElementById('eventDescription').value.trim(),
            speakers: document.getElementById('eventSpeakers').value
                .split(',')
                .map(s => s.trim())
                .filter(s => s),
            attendees: parseInt(document.getElementById('eventAttendees').value) || 0,
            status: document.getElementById('eventStatus').value
        };

        if (!eventData.title || !eventData.date || !eventData.location) {
            Utils.showToast('Please fill in all required fields (*)', 'error');
            return;
        }

        // Handle file uploads
        const filesInput = document.getElementById('eventFiles');
        let newAttachments = [];
        if (filesInput && filesInput.files.length > 0) {
            Utils.showToast('Uploading files...', 'info');
            for (const file of filesInput.files) {
                try {
                    const result = await Utils.uploadFile(file);
                    if (result.success) newAttachments.push({ filename: result.filename, originalName: result.originalName });
                } catch (e) { console.warn('File upload failed:', e); }
            }
        }
        if (id) {
            const existing = Events.cachedEvents.find(ev => ev.id === id);
            eventData.attachments = [...(existing?.attachments || []), ...newAttachments];
        } else {
            eventData.attachments = newAttachments;
        }

        try {
            if (id) {
                await ApiService.events.update(id, eventData);
                Utils.showToast('Event updated successfully', 'success');
            } else {
                await ApiService.events.create(eventData);
                Utils.showToast('Event created successfully', 'success');
            }

            Events.closeModal();
            await Events.loadEventsData();
            App.loadPage('events');
        } catch (error) {
            console.error('Error saving event:', error);
            Utils.showToast(error.message || 'Failed to save event', 'error');
        }
    },

    /**
     * View event details
     */
    generateReport: () => {
        const events = Events.cachedEvents;
        const rows = events.map(ev => {
            const sc = { upcoming: 'badge-blue', completed: 'badge-green', ongoing: 'badge-yellow', cancelled: 'badge-red', archived: 'badge-blue' }[ev.status] || 'badge-blue';
            return `<tr>
                <td>${Utils.sanitizeHTML(ev.title)}</td>
                <td>${Utils.formatDateTime(ev.date)}</td>
                <td>${Utils.sanitizeHTML(ev.location)}</td>
                <td>${Array.isArray(ev.speakers) ? ev.speakers.join(', ') || '—' : '—'}</td>
                <td>${ev.attendees || 0}</td>
                <td><span class="badge ${sc}">${ev.status}</span></td>
                <td>${(ev.attachments || []).length} file(s)</td>
            </tr>`;
        }).join('');

        Utils.printReport('Events Report', `
            <p style="margin-bottom:16px;color:#64748b;">Total Records: <strong>${events.length}</strong></p>
            <table>
                <thead><tr>
                    <th>Title</th><th>Date & Time</th><th>Location</th><th>Speakers</th><th>Attendees</th><th>Status</th><th>Attachments</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:#94a3b8;">No events recorded</td></tr>'}</tbody>
            </table>`);
    },

    viewEvent: (id) => {
        const event = Events.cachedEvents.find(e => e.id === id) || Store.getEventById(id);
        if (!event) return;
        const attachHTML = (event.attachments || []).length ? `
            <div class="section-title">Attachments</div>
            <ul>${(event.attachments || []).map(a => `<li>${a.originalName || a.filename}</li>`).join('')}</ul>` : '';
        Utils.printReport(`Event Record — ${event.title}`, `
            <table>
                <tr><td width="30%"><strong>Title</strong></td><td>${Utils.sanitizeHTML(event.title)}</td></tr>
                <tr><td><strong>Date & Time</strong></td><td>${Utils.formatDateTime(event.date)}</td></tr>
                <tr><td><strong>Location</strong></td><td>${Utils.sanitizeHTML(event.location)}</td></tr>
                <tr><td><strong>Status</strong></td><td>${event.status}</td></tr>
                <tr><td><strong>Expected Attendees</strong></td><td>${event.attendees || 0}</td></tr>
                ${event.speakers && event.speakers.length ? `<tr><td><strong>Speakers</strong></td><td>${event.speakers.join(', ')}</td></tr>` : ''}
            </table>
            <div class="section-title">Description</div>
            <p style="white-space:pre-wrap;">${Utils.sanitizeHTML(event.description || 'No description provided')}</p>
            ${attachHTML}`);
    },

    /**
     * Delete event
     */
    deleteEvent: async (id) => {
        // Check permission
        if (!Permissions.require('deleteEvent', 'You do not have permission to delete events')) {
            return;
        }

        if (confirm('Are you sure you want to delete this event?')) {
            try {
                await ApiService.events.delete(id);
                Utils.showToast('Event deleted successfully', 'success');
                await Events.loadEventsData();
                App.loadPage('events');
            } catch (error) {
                console.error("Error deleting event:", error);
                Utils.showToast("Failed to delete event from server.", "error");
            }
        }
    },

    /**
     * Close modal
     */
    closeModal: () => {
        document.getElementById('eventModal').classList.remove('active');
    },

    /**
     * Initialize events module
     */
    init: () => {
        // Event-specific initializations
        console.log('Events module initialized');
    }
};

// Export for use in other modules
window.Events = Events;
