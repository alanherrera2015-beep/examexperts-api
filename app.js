// ExamExperts Frontend Application (login + redirect to dashboard)
(function() {
  'use strict';

  // API Configuration - uses hosted API origin
  const API_BASE = 'https://examexperts-api.onrender.com';

  async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}/api${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {})
    };

    console.log('API Request:', url, config);

    const response = await fetch(url, config);
    let data = {};
    try { data = await response.json(); } catch (e) { /* non-JSON response */ }

    if (!response.ok) {
      const err = new Error(data.error || 'Request failed');
      err.status = response.status;
      err.raw = data;
      throw err;
    }
    return data;
  }

  function showMessage(message, type = 'info') {
    const container = document.getElementById('auth-form-container');
    if (!container) return;
    const existing = container.querySelectorAll('.message');
    existing.forEach(e => e.remove());
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.textContent = message;
    container.insertBefore(div, container.firstChild);
  }

  async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const email = (form.querySelector('#email') || {}).value || '';
    const password = (form.querySelector('#password') || {}).value || '';
    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('button');

    if (!email || !password) {
      showMessage('Please enter both email and password', 'error');
      return;
    }

    try {
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Signing in...'; }

      const result = await apiRequest('/login', {
        method: 'POST',
        body: { email, password }
      });

      if (result.success) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        showMessage(`Welcome back, ${result.user.name}!`, 'success');

        // redirect to the platform page
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 600);
      }
    } catch (err) {
      console.warn('Login error:', err);
      showMessage(err.message || 'Login failed', 'error');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Sign In'; }
    }
  }

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

  function init() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      try {
        const u = JSON.parse(user);
        showMessage(`Already logged in as ${u.name}`, 'success');
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    checkApiHealth().then(ok => {
      if (!ok) showMessage('Warning: API may be unavailable', 'error');
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    try { init(); } catch (e) {
      const container = document.getElementById('auth-form-container');
      if (container) {
        const errNode = document.createElement('div');
        errNode.textContent = `Initialization error: ${e && e.message ? e.message : String(e)}`;
        container.insertBefore(errNode, container.firstChild);
      }
      console.warn(e);
    }
  });
})();
