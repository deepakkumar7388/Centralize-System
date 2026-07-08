/**
 * File Upload Service
 */
const UploadService = {
    
    /**
     * Upload file to server
     */
    uploadFile: async (file, module) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('module', module);
        
        try {
            const response = await fetch('backend/api/uploads.php', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + ApiService.token
                },
                body: formData
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Upload failed');
            }
            
            return result;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    },
    
    /**
     * Delete file from server
     */
    deleteFile: async (filepath) => {
        return await ApiService.request('uploads.php', 'DELETE', { filepath });
    },
    
    /**
     * Preview file
     */
    previewFile: (filepath) => {
        return 'backend/' + filepath; // Adjust path as needed
    },
    
    /**
     * Download file
     */
    downloadFile: (filepath, filename = 'download') => {
        const link = document.createElement('a');
        link.href = 'backend/' + filepath;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },
    
    /**
     * Get file icon based on extension
     */
    getFileIcon: (filename) => {
        const extension = filename.split('.').pop().toLowerCase();
        const icons = {
            'pdf': 'fas fa-file-pdf',
            'doc': 'fas fa-file-word',
            'docx': 'fas fa-file-word',
            'xls': 'fas fa-file-excel',
            'xlsx': 'fas fa-file-excel',
            'ppt': 'fas fa-file-powerpoint',
            'pptx': 'fas fa-file-powerpoint',
            'jpg': 'fas fa-file-image',
            'jpeg': 'fas fa-file-image',
            'png': 'fas fa-file-image',
            'gif': 'fas fa-file-image',
            'txt': 'fas fa-file-alt',
            'zip': 'fas fa-file-archive',
            'rar': 'fas fa-file-archive'
        };
        
        return icons[extension] || 'fas fa-file';
    },
    
    /**
     * Format file size
     */
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    /**
     * Validate file before upload
     */
    validateFile: (file, maxSizeMB = 10) => {
        const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'application/zip',
            'application/x-rar-compressed'
        ];
        
        // Check file size
        if (file.size > maxSize) {
            return { valid: false, message: `File size exceeds ${maxSizeMB}MB limit` };
        }
        
        // Check file type
        if (!allowedTypes.includes(file.type)) {
            return { valid: false, message: 'File type not allowed' };
        }
        
        return { valid: true, message: 'File is valid' };
    }
};

// Export for global use
window.UploadService = UploadService;