/**
 * AUTHENTICATION MODULE
 * Handles user login, signup, and role-based access control
 */

const Auth = {
    STORAGE_KEY: 'nexus_users',
    CURRENT_USER_KEY: 'nexus_current_user',

    /**
     * Initialize authentication
     */
    init: () => {
        // Create default demo users if none exist
        if (!Auth.getUsers().length) {
            Auth.createDemoUsers();
        }

        // Setup event listeners
        Auth.setupEventListeners();
    },

    /**
     * Create demo users for testing
     */
    createDemoUsers: () => {
        const demoUsers = [
            {
                id: 'demo_admin',
                username: 'admin',
                password: 'admin123', // In production, this should be hashed
                name: 'Administrator',
                role: 'admin',
                createdAt: new Date().toISOString()
            },
            {
                id: 'demo_manager',
                username: 'manager',
                password: 'manager123',
                name: 'Manager User',
                role: 'manager',
                createdAt: new Date().toISOString()
            },
            {
                id: 'demo_user',
                username: 'user',
                password: 'user123',
                name: 'Regular User',
                role: 'user',
                createdAt: new Date().toISOString()
            }
        ];

        localStorage.setItem(Auth.STORAGE_KEY, JSON.stringify(demoUsers));
    },

    /**
     * Get all users
     */
    getUsers: () => {
        const users = localStorage.getItem(Auth.STORAGE_KEY);
        return users ? JSON.parse(users) : [];
    },

    /**
     * Save users
     */
    saveUsers: (users) => {
        localStorage.setItem(Auth.STORAGE_KEY, JSON.stringify(users));
    },

    /**
     * Setup event listeners
     */
    setupEventListeners: () => {
        // Tab switching handled by inline script in index.html

        // Login form submission
        document.getElementById('loginFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            Auth.handleLogin();
        });

        // Signup form submission
        document.getElementById('signupFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            Auth.handleSignup();
        });
    },

    /**
     * Handle login
     */
    handleLogin: async () => {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            Auth.showError('Please enter both username and password');
            return;
        }

        // Disable submit button
        const submitBtn = document.querySelector('#loginFormElement button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

        try {
            // Call backend API
            const response = await fetch('https://centralize-system.onrender.com/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success && data.user) {
                // Store current user
                const currentUser = {
                    id: data.user.id,
                    username: data.user.username,
                    name: data.user.name,
                    role: data.user.role,
                    token: data.token,
                    loginTime: new Date().toISOString()
                };
                localStorage.setItem(Auth.CURRENT_USER_KEY, JSON.stringify(currentUser));

                // Show success message
                Auth.showSuccess(`Welcome back, ${data.user.name}!`);

                // Show dashboard screen (no page reload — SPA)
                setTimeout(() => {
                    if (typeof showAppScreen === 'function') showAppScreen();
                    if (typeof App !== 'undefined' && App.init) App.init();
                }, 800);
            } else {
                Auth.showError(data.message || 'Invalid username or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            Auth.showError('Failed to connect to server. Please check your connection.');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    },

    /**
     * Handle signup
     */
    handleSignup: async () => {
        const name = document.getElementById('signupName').value.trim();
        const username = document.getElementById('signupUsername').value.trim();
        const password = document.getElementById('signupPassword').value;
        // Role field is commented out in HTML, so always default to 'user'
        const role = 'user';

        // Validation
        if (!name || !username || !password) {
            Auth.showError('Please fill in all required fields');
            return;
        }

        if (password.length < 6) {
            Auth.showError('Password must be at least 6 characters');
            return;
        }

        if (username.length < 3) {
            Auth.showError('Username must be at least 3 characters');
            return;
        }

        // Disable submit button
        const submitBtn = document.querySelector('#signupFormElement button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

        try {
            // Call backend API
            const response = await fetch('https://centralize-system.onrender.com/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    name: name,
                    role: role,
                    email: '' // Optional field
                })
            });

            const data = await response.json();

            if (data.success) {
                // Show success message
                Auth.showSuccess('Account created successfully! You can now login.');

                // Clear form
                document.getElementById('signupFormElement').reset();

                // Switch to login tab after 2 seconds
                setTimeout(() => {
                    const loginTab = document.querySelector('[data-auth-tab="login"]');
                    if (loginTab) loginTab.click();
                }, 2000);
            } else {
                Auth.showError(data.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            Auth.showError('Failed to connect to server. Please check your connection.');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated: () => {
        const currentUser = localStorage.getItem(Auth.CURRENT_USER_KEY);
        return currentUser !== null;
    },

    /**
     * Get current user
     */
    getCurrentUser: () => {
        const userData = localStorage.getItem(Auth.CURRENT_USER_KEY);
        return userData ? JSON.parse(userData) : null;
    },

    /**
     * Logout user
     */
    logout: () => {
        localStorage.removeItem(Auth.CURRENT_USER_KEY);
        // Show auth screen without page reload
        if (typeof showAuthScreen === 'function') showAuthScreen();
    },

    /**
     * Check user role
     */
    hasRole: (requiredRole) => {
        const user = Auth.getCurrentUser();
        if (!user) return false;

        const roleHierarchy = { 'admin': 3, 'manager': 2, 'user': 1 };
        return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
    },

    /**
     * Show success message
     */
    showSuccess: (message) => {
        Auth.hideAlerts();
        const alert = document.getElementById('successAlert');
        document.getElementById('successMessage').textContent = message;
        alert.classList.add('active');
    },

    /**
     * Show error message
     */
    showError: (message) => {
        Auth.hideAlerts();
        const alert = document.getElementById('errorAlert');
        document.getElementById('errorMessage').textContent = message;
        alert.classList.add('active');
    },

    /**
     * Hide all alerts
     */
    hideAlerts: () => {
        document.getElementById('successAlert').classList.remove('active');
        document.getElementById('errorAlert').classList.remove('active');
    }
};

/**
 * Toggle password visibility
 */
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Initialize authentication when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', Auth.init);
} else {
    Auth.init();
}

// Export for use in other modules
window.Auth = Auth;
