// auth.js - Handles login logic

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const loginBtn = document.getElementById('loginBtn');
      
      // Basic validation
      if (!email || !password) {
        App.showToast('Please fill all fields', 'danger');
        return;
      }
      
      const originalText = loginBtn.innerHTML;
      loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Authenticating...';
      loginBtn.disabled = true;
      
      try {
        const response = await App.apiCall('/auth/login', 'POST', { email, password });
        
        if (response.success && response.data) {
          localStorage.setItem('eow_token', response.data.token);
          localStorage.setItem('eow_user', JSON.stringify(response.data.user));
          window.location.href = 'dashboard.html';
        }
      } catch (error) {
        App.showToast(error.message || 'Login failed. Please check credentials.', 'danger');
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
      }
    });
  }
});
