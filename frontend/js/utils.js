/**
 * UTILITY FUNCTIONS
 * Reusable helper functions for the application
 */

const Utils = {
    /**
     * Format date to readable string
     */
    formatDate: (dateString) => {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    },

    /**
     * Format date and time
     */
    formatDateTime: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Calculate relative time (e.g., "2 hours ago")
     */
    timeAgo: (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
            }
        }

        return 'Just now';
    },

    /**
     * Generate unique ID
     */
    generateId: () => {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Sanitize HTML to prevent XSS
     */
    sanitizeHTML: (str) => {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },

    /**
     * Debounce function
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Show toast notification
     */
    showToast: (message, type = 'info', duration = 3000) => {
        // Remove existing toasts
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${Utils.sanitizeHTML(message)}</span>
        `;

        // Add toast styles dynamically if not exists
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .toast {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    background: white;
                    padding: 1rem 1.5rem;
                    border-radius: 0.75rem;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    z-index: 10000;
                    animation: slideInRight 0.3s ease;
                    border-left: 4px solid #6366f1;
                }
                .toast-success { border-left-color: #10b981; }
                .toast-error { border-left-color: #ef4444; }
                .toast-warning { border-left-color: #f59e0b; }
                .toast-info { border-left-color: #3b82f6; }
                .toast i { font-size: 1.25rem; }
                .toast-success i { color: #10b981; }
                .toast-error i { color: #ef4444; }
                .toast-warning i { color: #f59e0b; }
                .toast-info i { color: #3b82f6; }
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Export data to JSON file
     */
    exportToJSON: (data, filename) => {
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        Utils.showToast('Data exported successfully', 'success');
    },

    /**
     * Print content
     */
    printContent: (title, content) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body {
                        font-family: 'Inter', sans-serif;
                        padding: 2rem;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    h1 { color: #1e293b; margin-bottom: 1rem; }
                    .print-date { color: #64748b; margin-bottom: 2rem; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <div class="print-date">Generated on: ${new Date().toLocaleString()}</div>
                ${content}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    },

    /**
     * Search/filter array of objects
     */
    searchObjects: (objects, searchTerm, searchFields) => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return objects;

        return objects.filter(obj => {
            return searchFields.some(field => {
                const value = obj[field];
                if (typeof value === 'string') {
                    return value.toLowerCase().includes(term);
                }
                return false;
            });
        });
    },

    /**
     * Sort array of objects
     */
    sortObjects: (objects, field, ascending = true) => {
        return [...objects].sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];

            if (typeof aVal === 'string') {
                return ascending 
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            return ascending ? aVal - bVal : bVal - aVal;
        });
    },

    /**
     * Generate and print a formatted report
     */
    printReport: (title, bodyHTML) => {
        const user = Auth.getCurrentUser();
        const generatedBy = user ? user.name : 'System';
        const now = new Date().toLocaleString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const win = window.open('', '_blank');
        win.document.write(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title} — Nexus Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; font-size: 13px; padding: 30px 40px; }
        .report-header { border-bottom: 3px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
        .report-title { font-size: 22px; font-weight: 700; color: #6366f1; }
        .report-subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
        .report-meta { text-align: right; font-size: 11px; color: #64748b; line-height: 1.6; }
        .report-logo { font-size: 18px; font-weight: 800; color: #4f46e5; margin-bottom: 2px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
        th { background: #6366f1; color: white; padding: 8px 12px; text-align: left; font-weight: 600; }
        td { padding: 7px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        tr:nth-child(even) td { background: #f8fafc; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-blue { background: #dbeafe; color: #1e40af; }
        .badge-yellow { background: #fef9c3; color: #854d0e; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .section-title { font-size: 14px; font-weight: 700; color: #1e293b; margin: 20px 0 10px 0; padding-bottom: 5px; border-bottom: 1px solid #e2e8f0; }
        .report-footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
        @media print {
            body { padding: 0; }
            button { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="report-header">
        <div>
            <div class="report-logo">⬡ Nexus System</div>
            <div class="report-title">${title}</div>
            <div class="report-subtitle">Institutional Record Keeping System</div>
        </div>
        <div class="report-meta">
            <strong>Generated:</strong> ${now}<br>
            <strong>By:</strong> ${generatedBy}
        </div>
    </div>
    ${bodyHTML}
    <div class="report-footer">
        This report was automatically generated by Nexus Centralized Institutional System. Confidential — For internal use only.
    </div>
    <script>setTimeout(() => window.print(), 400);<\/script>
</body>
</html>`);
        win.document.close();
    },

    /**
     * Upload a file to Flask backend
     * Returns { success, filename, originalName }
     */
    uploadFile: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const token = Auth.getCurrentUser()?.token;

        const response = await fetch('http://127.0.0.1:5000/api/upload', {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        });
        return await response.json();
    },

    /**
     * Build file attachment link HTML
     */
    buildAttachmentLinks: (attachments) => {
        if (!attachments || attachments.length === 0) return '';
        return attachments.map(a => `
            <a href="http://127.0.0.1:5000/api/uploads/${a.filename}" 
               target="_blank" 
               style="display:inline-flex;align-items:center;gap:4px;font-size:0.8rem;
                      color:#6366f1;text-decoration:none;border:1px solid #c7d2fe;
                      border-radius:6px;padding:3px 8px;margin:2px;">
                <i class="fas fa-paperclip"></i> ${a.originalName || a.filename}
            </a>`).join('');
    }
};

// Export for use in other modules
window.Utils = Utils;

