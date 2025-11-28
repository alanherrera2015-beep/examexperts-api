// ExamExperts Frontend Application
(function() {
  'use strict';

  // API Configuration
  const API_BASE = window.location.origin;

  // Helper function to make API requests
  async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}/api${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Display message in the auth form container
  function showMessage(message, type = 'info') {
    const container = document.getElementById('auth-form-container');
    if (!container) return;

    // Remove any existing messages
    const existingMessages = container.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.textContent = message;
    container.insertBefore(msgDiv, container.firstChild);
  }

  // Handle login form submission
  async function handleLogin(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const email = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;

    if (!email || !password) {
      showMessage('Please enter both email and password', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      const result = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (result.success) {
        // Store token and user info
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));

        showMessage(`Welcome back, ${result.user.name}!`, 'success');

        // Redirect to dashboard (placeholder)
        setTimeout(() => {
          showMessage('Login successful! Dashboard would load here.', 'success');
        }, 1500);
      }
    } catch (error) {
      console.warn('Login error:', error);
      showMessage(error.message || 'Login failed', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  }

  // Check API health on load
  async function checkApiHealth() {
    try {
      const health = await apiRequest('/health');
      console.log('API Health:', health);
      return true;
    } catch (error) {
      console.warn('API health check failed:', error);
      return false;
    }
  }

  // Initialize application
  async function init() {
    // Check if already logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const userData = JSON.parse(user);
        showMessage(`Already logged in as ${userData.name}`, 'success');
      } catch (e) {
        // Invalid user data, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    // Attach login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }

    // Check API health
    const apiHealthy = await checkApiHealth();
    if (!apiHealthy) {
      showMessage('Warning: API may be unavailable', 'error');
    }
  }

  // Initialize when DOM is ready
  window.addEventListener('DOMContentLoaded', function() {
    try {
      init();
    } catch (error) {
      const msg = typeof error === 'string' ? error : (error && error.message ? error.message : String(error));
      console.warn('Initialization error:', msg);

      // Use logInitializationError if available, otherwise fallback to manual insertion
      if (typeof logInitializationError === 'function') {
        logInitializationError(msg);
      } else {
        // Fallback: insert error node into auth form container
        const authContainer = document.getElementById('auth-form-container');
        if (authContainer) {
          const errNode = document.createElement('div');
          errNode.style.marginTop = '12px';
          errNode.style.padding = '12px';
          errNode.style.borderRadius = '8px';
          errNode.style.background = 'rgba(192,21,47,0.06)';
          errNode.style.color = '#c0152f';
          errNode.style.fontSize = '13px';
          errNode.textContent = 'Initialization error: ' + msg;
          authContainer.insertBefore(errNode, authContainer.firstChild);
        }
      }
    }
  });
})();
