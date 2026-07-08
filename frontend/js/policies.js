/**
 * POLICIES MODULE
 * Handles policy and rules management with version control
 */

const Policies = {
    /**
     * Render policies page
     */
    render: () => {
        setTimeout(() => {
            Policies.loadPoliciesData();
        }, 50);

        const canCreate = Permissions.can('createPolicy');

        return `
            <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2 class="section-title" style="margin: 0;">Policies & Rules</h2>
                <div style="display:flex;gap:0.75rem;">
                    ${Permissions.can('generateReports') ? `
                    <button class="btn btn-secondary" onclick="Policies.generateReport()">
                        <i class="fas fa-file-pdf"></i> Export Report
                    </button>
                    ` : ''}
                    ${canCreate ? `
                    <button class="btn btn-primary" onclick="Policies.showCreateModal()" data-requires="createPolicy">
                        <i class="fas fa-plus"></i>
                        Create Policy
                    </button>
                    ` : ''}
                </div>
            </div>

            <!-- Tabs -->
            <div class="tabs-container">
                <div class="tabs-nav">
                    <button class="tab-btn active" data-tab="all-policies" onclick="Policies.switchTab('all-policies')">All Policies</button>
                    <button class="tab-btn" data-tab="active-policies" onclick="Policies.switchTab('active-policies')">Active</button>
                    <button class="tab-btn" data-tab="draft-policies" onclick="Policies.switchTab('draft-policies')">Drafts</button>
                </div>
            </div>

            <!-- Tab Content -->
            <div id="tab-all-policies" class="tab-content active">
                <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading policies...</div>
            </div>
            <div id="tab-active-policies" class="tab-content">
                <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading policies...</div>
            </div>
            <div id="tab-draft-policies" class="tab-content">
                <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading policies...</div>
            </div>

            <!-- Create/Edit Modal -->
            <div class="modal" id="policyModal">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h3 id="policyModalTitle">Create Policy</h3>
                        <button class="btn-close" onclick="Policies.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="policyForm">
                            <input type="hidden" id="policyId">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label">Policy Title *</label>
                                    <input type="text" class="form-input" id="policyTitle" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Category *</label>
                                    <select class="form-select" id="policyCategory" required>
                                        <option value="">Select Category</option>
                                        <option value="HR">Human Resources</option>
                                        <option value="IT">Information Technology</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Operations">Operations</option>
                                        <option value="Legal">Legal</option>
                                        <option value="Compliance">Compliance</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label">Version *</label>
                                    <input type="text" class="form-input" id="policyVersion" 
                                        placeholder="e.g., 1.0" required>
                                    <span id="policyVersionHistoryBadge" 
                                        style="display:none;font-size:0.78rem;color:#6366f1;cursor:pointer;text-decoration:underline;margin-top:4px;"></span>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Effective Date</label>
                                    <input type="date" class="form-input" id="policyEffectiveDate">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Status</label>
                                    <select class="form-select" id="policyStatus">
                                        <option value="draft">Draft</option>
                                        <option value="active">Active</option>
                                        <option value="archived">Archived</option>
                                        <option value="deprecated">Deprecated</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Approved By</label>
                                <input type="text" class="form-input" id="policyApprovedBy" 
                                    placeholder="e.g., Board of Directors">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Policy Content *</label>
                                <textarea class="form-textarea" id="policyContent" 
                                    style="min-height: 200px;" required
                                    placeholder="Enter the complete policy document, guidelines, and rules..."></textarea>
                                <div class="form-help">Document all policy details, guidelines, and regulations</div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="Policies.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="Policies.savePolicy()">
                            <i class="fas fa-save"></i>
                            Save Policy
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render policies list
     */
    renderPoliciesList: (policies) => {
        if (!policies.length) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-file-contract"></i>
                    </div>
                    <h3 class="empty-state-title">No policies found</h3>
                    <p class="empty-state-desc">Click "Create Policy" to add a new policy</p>
                </div>
            `;
        }

        return `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Policy Title</th>
                            <th>Category</th>
                            <th>Version</th>
                            <th>Effective Date</th>
                            <th>Status</th>
                            <th>Last Modified</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${policies.map(policy => `
                            <tr>
                                <td>
                                    <strong>${Utils.sanitizeHTML(policy.title)}</strong>
                                    ${policy.approvedBy ? `<br><small style="color: var(--text-tertiary);">Approved by: ${Utils.sanitizeHTML(policy.approvedBy)}</small>` : ''}
                                </td>
                                <td>
                                    <span class="badge badge-info">${policy.category}</span>
                                </td>
                                <td>v${policy.version}</td>
                                <td>${Utils.formatDate(policy.effectiveDate)}</td>
                                <td>
                                    <span class="badge ${Policies.getStatusBadge(policy.status)}">
                                        ${policy.status}
                                    </span>
                                </td>
                                <td>${Utils.timeAgo(policy.lastModified)}</td>
                                <td>
                                    <button class="btn-icon" onclick="Policies.viewPolicy('${policy.id}')" 
                                        data-tooltip="View Document">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    ${Permissions.can('editPolicy') ? `
                                    <button class="btn-icon" onclick="Policies.editPolicy('${policy.id}')" 
                                        data-tooltip="Edit" data-requires="editPolicy">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    ` : ''}
                                    ${Permissions.can('exportData') ? `
                                    <button class="btn-icon" onclick="Policies.exportPolicy('${policy.id}')" 
                                        data-tooltip="Export JSON">
                                        <i class="fas fa-download"></i>
                                    </button>
                                    ` : ''}
                                    ${Permissions.can('deletePolicy') ? `
                                    <button class="btn-icon" onclick="Policies.deletePolicy('${policy.id}')" 
                                        data-tooltip="Delete" data-requires="deletePolicy">
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
            'active': 'badge-success',
            'draft': 'badge-warning',
            'archived': 'badge-info',
            'deprecated': 'badge-danger'
        };
        return badges[status] || 'badge-info';
    },

    /**
    // Cached policies storage from Flask API
    cachedPolicies: [],

    /**
     * Load policies dynamically
     */
    loadPoliciesData: async () => {
        try {
            const data = await ApiService.policies.getAll();
            Policies.cachedPolicies = Array.isArray(data) ? data : [];
            Store.savePolicies(Policies.cachedPolicies);
            Policies.renderAllTabs();
        } catch (error) {
            console.error("Error loading policies:", error);
            Utils.showToast("Failed to fetch policies from server. Using local cache.", "warning");
            Policies.cachedPolicies = Store.getPolicies();
            Policies.renderAllTabs();
        }
    },

    /**
     * Render all tabs for policies
     */
    renderAllTabs: () => {
        const policies = Policies.cachedPolicies;
        const activePolicies = policies.filter(p => p.status === 'active');
        const draftPolicies = policies.filter(p => p.status === 'draft');

        const allEl = document.getElementById('tab-all-policies');
        const activeEl = document.getElementById('tab-active-policies');
        const draftEl = document.getElementById('tab-draft-policies');

        if (allEl) allEl.innerHTML = Policies.renderPoliciesList(policies);
        if (activeEl) activeEl.innerHTML = Policies.renderPoliciesList(activePolicies);
        if (draftEl) draftEl.innerHTML = Policies.renderPoliciesList(draftPolicies);
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
     * Show create modal
     */
    showCreateModal: () => {
        // Check permission
        if (!Permissions.require('createPolicy', 'You do not have permission to create policies')) {
            return;
        }

        document.getElementById('policyModalTitle').textContent = 'Create Policy';
        document.getElementById('policyForm').reset();
        document.getElementById('policyId').value = '';
        document.getElementById('policyVersion').value = '1.0';
        document.getElementById('policyModal').classList.add('active');
    },

    /**
     * Edit policy
     */
    editPolicy: (id) => {
        // Check permission
        if (!Permissions.require('editPolicy', 'You do not have permission to edit policies')) {
            return;
        }

        const policy = Policies.cachedPolicies.find(p => p.id === id) || Store.getPolicyById(id);
        if (!policy) return;

        document.getElementById('policyModalTitle').textContent = 'Edit Policy';
        document.getElementById('policyId').value = policy.id;
        document.getElementById('policyTitle').value = policy.title;
        document.getElementById('policyCategory').value = policy.category;
        document.getElementById('policyVersion').value = policy.version;
        document.getElementById('policyEffectiveDate').value = policy.effectiveDate;
        document.getElementById('policyStatus').value = policy.status;
        document.getElementById('policyApprovedBy').value = policy.approvedBy || '';
        document.getElementById('policyContent').value = policy.content;

        // Show version history badge
        const vHistory = policy.versionHistory || [];
        const vBadge = document.getElementById('policyVersionHistoryBadge');
        if (vBadge) {
            vBadge.style.display = vHistory.length ? 'inline-flex' : 'none';
            vBadge.textContent = `${vHistory.length} past version(s) — click to view`;
            vBadge.onclick = () => Policies.viewVersionHistory(policy);
        }

        document.getElementById('policyModal').classList.add('active');
    },

    /**
     * Save policy
     */
    savePolicy: async () => {
        const id = document.getElementById('policyId').value;

        // Check permission - either create or edit
        if (id) {
            if (!Permissions.require('editPolicy', 'You do not have permission to edit policies')) {
                return;
            }
        } else {
            if (!Permissions.require('createPolicy', 'You do not have permission to create policies')) {
                return;
            }
        }

        const policyData = {
            title: document.getElementById('policyTitle').value.trim(),
            category: document.getElementById('policyCategory').value,
            version: document.getElementById('policyVersion').value.trim(),
            effectiveDate: document.getElementById('policyEffectiveDate').value,
            status: document.getElementById('policyStatus').value,
            approvedBy: document.getElementById('policyApprovedBy').value.trim(),
            content: document.getElementById('policyContent').value.trim()
        };

        if (!policyData.title || !policyData.category || !policyData.content) {
            Utils.showToast('Please fill in all required fields (*)', 'error');
            return;
        }

        // Version control: on edit, push current to history and auto-increment
        if (id) {
            const existing = Policies.cachedPolicies.find(p => p.id === id);
            if (existing) {
                // Build versionHistory entry from current state
                const historyEntry = {
                    version: existing.version,
                    content: existing.content,
                    modifiedAt: existing.lastModified || new Date().toISOString(),
                    approvedBy: existing.approvedBy || ''
                };
                policyData.versionHistory = [...(existing.versionHistory || []), historyEntry];

                // Auto-increment version if user didn't change it
                if (policyData.version === existing.version) {
                    const parts = existing.version.split('.');
                    const minor = parseInt(parts[1] || '0') + 1;
                    policyData.version = `${parts[0]}.${minor}`;
                    document.getElementById('policyVersion').value = policyData.version;
                }
            }
        }

        try {
            if (id) {
                await ApiService.policies.update(id, policyData);
                Utils.showToast(`Policy updated to v${policyData.version}`, 'success');
            } else {
                await ApiService.policies.create(policyData);
                Utils.showToast('Policy created successfully', 'success');
            }

            Policies.closeModal();
            await Policies.loadPoliciesData();
            App.loadPage('policies');
        } catch (error) {
            console.error('Error saving policy:', error);
            Utils.showToast(error.message || 'Failed to save policy', 'error');
        }
    },

    /**
     * View policy document
     */
    viewPolicy: (id) => {
        const policy = Policies.cachedPolicies.find(p => p.id === id) || Store.getPolicyById(id);
        if (!policy) return;

        const vHistoryHTML = (policy.versionHistory || []).length > 0 ? `
            <div class="section-title">Version History</div>
            <table>
                <thead><tr><th>Version</th><th>Modified</th><th>Approved By</th></tr></thead>
                <tbody>${(policy.versionHistory || []).reverse().map(v => `
                    <tr><td><strong>v${v.version}</strong></td>
                    <td>${v.modifiedAt ? Utils.formatDateTime(v.modifiedAt) : '—'}</td>
                    <td>${v.approvedBy || '—'}</td></tr>`).join('')}
                </tbody>
            </table>` : '';

        Utils.printReport(`Policy Document — ${policy.title} v${policy.version}`, `
            <table>
                <tr><td width="30%"><strong>Title</strong></td><td>${Utils.sanitizeHTML(policy.title)}</td></tr>
                <tr><td><strong>Category</strong></td><td>${policy.category}</td></tr>
                <tr><td><strong>Version</strong></td><td><strong>v${policy.version}</strong></td></tr>
                <tr><td><strong>Effective Date</strong></td><td>${policy.effectiveDate ? Utils.formatDate(policy.effectiveDate) : '—'}</td></tr>
                <tr><td><strong>Status</strong></td><td>${policy.status}</td></tr>
                ${policy.approvedBy ? `<tr><td><strong>Approved By</strong></td><td>${Utils.sanitizeHTML(policy.approvedBy)}</td></tr>` : ''}
                <tr><td><strong>Last Modified</strong></td><td>${Utils.formatDateTime(policy.lastModified)}</td></tr>
            </table>
            <div class="section-title">Policy Content</div>
            <p style="white-space:pre-wrap;line-height:1.8;">${Utils.sanitizeHTML(policy.content)}</p>
            ${vHistoryHTML}`);
    },

    viewVersionHistory: (policy) => {
        const history = policy.versionHistory || [];
        if (!history.length) { Utils.showToast('No version history available', 'info'); return; }
        const rows = [...history].reverse().map(v => `
            <tr>
                <td><strong>v${v.version}</strong></td>
                <td>${v.modifiedAt ? Utils.formatDateTime(v.modifiedAt) : '—'}</td>
                <td>${v.approvedBy || '—'}</td>
                <td style="max-width:300px;font-size:0.85em;">${(v.content || '').substring(0, 120)}...</td>
            </tr>`).join('');
        Utils.printReport(`Version History — ${policy.title}`, `
            <p style="margin-bottom:12px;">Current version: <strong>v${policy.version}</strong> | Total versions: <strong>${history.length + 1}</strong></p>
            <table>
                <thead><tr><th>Version</th><th>Date Modified</th><th>Approved By</th><th>Content Preview</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>`);
    },

    generateReport: () => {
        const policies = Policies.cachedPolicies;
        const rows = policies.map(p => {
            const sc = { active: 'badge-green', draft: 'badge-yellow', archived: 'badge-blue', deprecated: 'badge-red' }[p.status] || 'badge-blue';
            const vCount = (p.versionHistory || []).length;
            return `<tr>
                <td>${Utils.sanitizeHTML(p.title)}</td>
                <td>${p.category}</td>
                <td><strong>v${p.version}</strong>${vCount ? ` <span style="font-size:0.8em;color:#64748b">(${vCount} prior)</span>` : ''}</td>
                <td>${p.effectiveDate ? Utils.formatDate(p.effectiveDate) : '—'}</td>
                <td><span class="badge ${sc}">${p.status}</span></td>
                <td>${p.approvedBy || '—'}</td>
                <td>${Utils.formatDateTime(p.lastModified)}</td>
            </tr>`;
        }).join('');
        Utils.printReport('Policies & Rules Report', `
            <p style="margin-bottom:16px;color:#64748b;">Total Records: <strong>${policies.length}</strong></p>
            <table>
                <thead><tr><th>Title</th><th>Category</th><th>Version</th><th>Effective Date</th><th>Status</th><th>Approved By</th><th>Last Modified</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:#94a3b8;">No policies recorded</td></tr>'}</tbody>
            </table>`);
    },

    /**
     * Export policy to JSON
     */
    exportPolicy: (id) => {
        const policy = Policies.cachedPolicies.find(p => p.id === id) || Store.getPolicyById(id);
        if (!policy) return;

        Utils.exportToJSON(policy, `policy_${policy.title.toLowerCase().replace(/\s+/g, '_')}`);
    },

    /**
     * Delete policy
     */
    deletePolicy: async (id) => {
        // Check permission
        if (!Permissions.require('deletePolicy', 'You do not have permission to delete policies')) {
            return;
        }

        if (confirm('Are you sure you want to delete this policy? This action cannot be undone.')) {
            try {
                await ApiService.policies.delete(id);
                Utils.showToast('Policy deleted successfully', 'success');
                await Policies.loadPoliciesData();
                App.loadPage('policies');
            } catch (error) {
                console.error("Error deleting policy:", error);
                Utils.showToast("Failed to delete policy from server.", "error");
            }
        }
    },

    /**
     * Close modal
     */
    closeModal: () => {
        document.getElementById('policyModal').classList.remove('active');
    },

    /**
     * Initialize policies module
     */
    init: () => {
        console.log('Policies module initialized');
    }
};

// Export for use in other modules
window.Policies = Policies;
