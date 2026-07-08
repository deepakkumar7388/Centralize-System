/**
 * API Service Module for Flask Backend Integration with MongoDB Atlas
 */
const ApiService = {
    baseURL: 'http://127.0.0.1:5000/api/',
    
    getToken: () => {
        const user = localStorage.getItem('nexus_current_user');
        if (user) {
            try {
                return JSON.parse(user).token;
            } catch (e) {
                console.error("Failed to parse local user session token:", e);
            }
        }
        return localStorage.getItem('nexus_token');
    },

    setToken: (token) => {
        localStorage.setItem('nexus_token', token);
    },
    
    clearToken: () => {
        localStorage.removeItem('nexus_token');
    },
    
    /**
     * Make API request
     */
    request: async (endpoint, method = 'GET', data = null) => {
        const url = ApiService.baseURL + endpoint;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        // Add authentication token if available
        const token = ApiService.getToken();
        if (token) {
            options.headers['Authorization'] = 'Bearer ' + token;
        }
        
        // Add request body for POST/PUT
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            
            if (response.status === 401) {
                // Clear invalid token session
                localStorage.removeItem('nexus_current_user');
                ApiService.clearToken();
                window.location.href = 'login.html';
                throw new Error('Unauthorized access redirecting to login...');
            }

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'API request failed');
            }
            return result;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    },
    
    /**
     * Authentication API
     */
    auth: {
        login: async (username, password) => {
            const data = {
                action: 'login',
                username: username,
                password: password
            };
            const result = await ApiService.request('auth/login', 'POST', data);
            if (result.success && result.token) {
                ApiService.setToken(result.token);
            }
            return result;
        },
        
        register: async (userData) => {
            const data = {
                action: 'register',
                ...userData
            };
            return await ApiService.request('auth/register', 'POST', data);
        },
        
        logout: () => {
            ApiService.clearToken();
            localStorage.removeItem('nexus_current_user');
            window.location.href = 'login.html';
        }
    },
    
    /**
     * Meetings API
     */
    meetings: {
        getAll: () => ApiService.request('meetings'),
        getById: (id) => ApiService.request(`meetings?id=${id}`),
        create: (meetingData) => ApiService.request('meetings', 'POST', meetingData),
        update: (id, meetingData) => ApiService.request(`meetings?id=${id}`, 'PUT', meetingData),
        delete: (id) => ApiService.request(`meetings?id=${id}`, 'DELETE')
    },
    
    /**
     * Events API
     */
    events: {
        getAll: () => ApiService.request('events'),
        getById: (id) => ApiService.request(`events?id=${id}`),
        create: (eventData) => ApiService.request('events', 'POST', eventData),
        update: (id, eventData) => ApiService.request(`events?id=${id}`, 'PUT', eventData),
        delete: (id) => ApiService.request(`events?id=${id}`, 'DELETE')
    },
    
    /**
     * Policies API
     */
    policies: {
        getAll: () => ApiService.request('policies'),
        getById: (id) => ApiService.request(`policies?id=${id}`),
        create: (policyData) => ApiService.request('policies', 'POST', policyData),
        update: (id, policyData) => ApiService.request(`policies?id=${id}`, 'PUT', policyData),
        delete: (id) => ApiService.request(`policies?id=${id}`, 'DELETE')
    },
    
    /**
     * Announcements API
     */
    announcements: {
        getAll: () => ApiService.request('announcements'),
        getById: (id) => ApiService.request(`announcements?id=${id}`),
        create: (announcementData) => ApiService.request('announcements', 'POST', announcementData),
        update: (id, announcementData) => ApiService.request(`announcements?id=${id}`, 'PUT', announcementData),
        delete: (id) => ApiService.request(`announcements?id=${id}`, 'DELETE')
    }
};

// Export for global use
window.ApiService = ApiService;