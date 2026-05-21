// Core application utilities
const LOCAL_BACKEND_URL = 'http://localhost:3000/api';
const PROD_BACKEND_URL = 'https://court-case-tracking-system-vl23.onrender.com/api';

const BACKEND_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? LOCAL_BACKEND_URL
  : PROD_BACKEND_URL;

const App = {
  init: async function() {
    this.checkAuth();
    await this.loadComponents();
    this.setupThemeToggle();
    this.setupSidebarToggle();
    this.updateUserUI();
    
    // Call page-specific init if exists
    if (typeof pageInit === 'function') {
      pageInit();
    }
  },

  apiCall: async function(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('eow_token');
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers
    };

    if (body) {
      // If body is FormData (for file uploads), don't set Content-Type, let browser set it with boundary
      if (body instanceof FormData) {
        delete headers['Content-Type'];
        options.body = body;
      } else {
        options.body = JSON.stringify(body);
      }
    }

    try {
      const response = await fetch(`${BACKEND_BASE_URL}${endpoint}`, options);
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401 && !window.location.pathname.endsWith('index.html')) {
          this.logout();
        }
        throw new Error(data.message || 'API request failed');
      }
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  },

  checkAuth: function() {
    const token = localStorage.getItem('eow_token');
    const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    
    if (!token && !isLoginPage) {
      window.location.href = 'index.html';
    } else if (token && isLoginPage) {
      window.location.href = 'dashboard.html';
    }
  },

  loadComponents: async function() {
    const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    if (isLoginPage) return; // Don't load sidebar/navbar on login page

    try {
      const [sidebarRes, navbarRes, footerRes] = await Promise.all([
        fetch('components/sidebar.html'),
        fetch('components/navbar.html'),
        fetch('components/footer.html')
      ]);

      if (sidebarRes.ok) document.getElementById('sidebar').innerHTML = await sidebarRes.text();
      if (navbarRes.ok) document.getElementById('top-navbar').innerHTML = await navbarRes.text();
      if (footerRes.ok) {
        const footerEl = document.getElementById('footer-container');
        if(footerEl) footerEl.innerHTML = await footerRes.text();
      }

      this.setActiveNav();
      
      // Re-attach listeners for dynamically loaded elements
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.logout();
        });
      }
    } catch (err) {
      console.error('Error loading components:', err);
    }
  },

  setActiveNav: function() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'dashboard.html';
    const navId = 'nav-' + page.replace('.html', '');
    const navLink = document.getElementById(navId);
    if (navLink) {
      navLink.classList.add('active');
    }
  },

  setupThemeToggle: function() {
    // We attach event listener to body and delegate, since button might be loaded dynamically
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('#theme-toggle');
      if (btn) {
        let currentTheme = document.body.getAttribute('data-theme');
        let newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('eow_theme', newTheme);
        
        const icon = btn.querySelector('i');
        if (newTheme === 'dark') {
          icon.classList.remove('bi-moon-fill');
          icon.classList.add('bi-sun-fill');
        } else {
          icon.classList.remove('bi-sun-fill');
          icon.classList.add('bi-moon-fill');
        }
      }
    });

    // Initial check
    const savedTheme = localStorage.getItem('eow_theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
  },

  setupSidebarToggle: function() {
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('#sidebar-toggle');
      if (btn) {
        const sidebar = document.getElementById('sidebar');
        if (window.innerWidth <= 768) {
          sidebar.classList.toggle('mobile-open');
          let overlay = document.querySelector('.sidebar-overlay');
          if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', () => {
              sidebar.classList.remove('mobile-open');
              overlay.classList.remove('show');
            });
          }
          overlay.classList.toggle('show');
        } else {
          sidebar.classList.toggle('collapsed');
        }
      }
    });
  },

  updateUserUI: function() {
    const userStr = localStorage.getItem('eow_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // We use setInterval or just wait because navbar might take a ms to load
        setTimeout(() => {
          const nameEl = document.getElementById('navbar-username');
          const roleEl = document.getElementById('navbar-role');
          if (nameEl) nameEl.textContent = user.name;
          if (roleEl) roleEl.textContent = user.role;
          
          if (user.role === 'Admin') {
            document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
          }
          if (user.role === 'Supervisor' || user.role === 'Admin') {
            document.querySelectorAll('.supervisor-only').forEach(el => el.style.display = 'block');
          }
          if (user.role === 'Pairokar' || user.role === 'Admin' || user.role === 'Supervisor') {
            document.querySelectorAll('.pairokar-only').forEach(el => el.style.display = 'block');
          }
          if (user.role === 'Investigation Officer') {
            document.querySelectorAll('.io-only').forEach(el => el.style.display = 'block');
          }
        }, 100);
      } catch(e) { console.error('Invalid user data', e); }
    }
  },

  logout: function() {
    localStorage.removeItem('eow_token');
    localStorage.removeItem('eow_user');
    window.location.href = 'index.html';
  },

  showToast: function(message, type = 'success') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      toastContainer.style.zIndex = '11000';
      document.body.appendChild(toastContainer);
    }
    
    const bgClass = type === 'success' ? 'bg-success' : (type === 'danger' ? 'bg-danger' : 'bg-primary');
    
    const toastHtml = `
      <div class="toast align-items-center text-white ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
    
    toastEl.addEventListener('hidden.bs.toast', () => {
      toastEl.remove();
    });
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
