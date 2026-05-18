// users.js - Logic for User Management

async function pageInit() {
  // Check if Admin
  const user = JSON.parse(localStorage.getItem('eow_user') || '{}');
  if(user.role !== 'Admin') {
    App.showToast('Unauthorized access. Admins only.', 'danger');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
    return;
  }
  
  await renderUsers();
}

async function renderUsers() {
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="spinner-border text-primary"></div></td></tr>';
  
  try {
    const response = await App.apiCall('/users');
    const users = response.data.users || [];
    
    tbody.innerHTML = '';
    
    users.forEach(u => {
      const badgeClass = u.is_active ? 'bg-success' : 'bg-danger';
      const statusText = u.is_active ? 'Active' : 'Inactive';
      
      tbody.innerHTML += `
        <tr>
          <td class="fw-bold">${u.name}</td>
          <td>${u.email}</td>
          <td><span class="badge bg-secondary">${u.role}</span></td>
          <td>${u.sector || 'N/A'}</td>
          <td><span class="badge ${badgeClass}">${statusText}</span></td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-warning me-1" title="Reset Password" onclick="openResetPasswordModal(${u.id})"><i class="bi bi-key"></i></button>
            <button class="btn btn-sm btn-outline-primary" title="Edit" onclick="openUserModal('edit', ${u.id}, '${u.name}', '${u.email}', '${u.role}', '${u.sector || ''}', ${u.is_active})"><i class="bi bi-pencil"></i></button>
          </td>
        </tr>
      `;
    });
    
    if(users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No users found</td></tr>';
    }
  } catch (err) {
    console.error('Failed to load users', err);
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger">Error loading users</td></tr>';
  }
}

function openUserModal(mode, id = null, name = '', email = '', role = 'Investigation Officer', sector = '', is_active = true) {
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
  
  if(mode === 'edit' && id) {
    document.getElementById('userModalTitle').innerText = 'Edit User';
    document.getElementById('userId').value = id;
    document.getElementById('userName').value = name;
    document.getElementById('userEmail').value = email;
    document.getElementById('userRole').value = role;
    document.getElementById('userSector').value = sector;
    document.getElementById('userStatus').value = is_active ? 'Active' : 'Inactive';
    document.getElementById('passwordGroup').style.display = 'none'; // Don't allow password edit here for now
    document.getElementById('userPassword').removeAttribute('required');
  } else {
    document.getElementById('userModalTitle').innerText = 'Add User';
    document.getElementById('passwordGroup').style.display = 'block';
    document.getElementById('userPassword').setAttribute('required', 'required');
  }
  
  const modal = new bootstrap.Modal(document.getElementById('userModal'));
  modal.show();
}

async function saveUser() {
  const id = document.getElementById('userId').value;
  const name = document.getElementById('userName').value;
  const email = document.getElementById('userEmail').value;
  const role = document.getElementById('userRole').value;
  const sector = document.getElementById('userSector').value;
  const status = document.getElementById('userStatus').value;
  const password = document.getElementById('userPassword').value;
  
  if(!name || !email || !role || (!id && !password)) {
    App.showToast('Please fill required fields', 'danger');
    return;
  }
  
  const btn = document.getElementById('saveUserBtn');
  btn.disabled = true;
  btn.innerHTML = 'Saving...';
  
  try {
    const is_active = status === 'Active';
    
    if(id) {
      // Edit
      await App.apiCall(`/users/${id}`, 'PUT', {
        name, email, role, sector, is_active
      });
      App.showToast('User updated successfully');
    } else {
      // Add
      await App.apiCall('/users', 'POST', {
        name, email, password, role, sector
      });
      App.showToast('User created successfully');
    }
    
    const modalEl = document.getElementById('userModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
    
    await renderUsers();
  } catch (err) {
    App.showToast(err.message || 'Error saving user', 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Save User';
  }
}

function openResetPasswordModal(id) {
  document.getElementById('resetPassUserId').value = id;
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  
  const modal = new bootstrap.Modal(document.getElementById('resetPasswordModal'));
  modal.show();
}

async function confirmResetPassword() {
  const id = document.getElementById('resetPassUserId').value;
  const password = document.getElementById('newPassword').value;
  const confirm = document.getElementById('confirmPassword').value;
  
  if(!password || !confirm) {
    App.showToast('Please enter both password fields', 'danger');
    return;
  }
  
  if(password !== confirm) {
    App.showToast('Passwords do not match', 'danger');
    return;
  }
  
  try {
    await App.apiCall(`/users/${id}/reset-password`, 'PUT', { password });
    App.showToast('Password reset successfully!');
    
    const modalEl = document.getElementById('resetPasswordModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
  } catch (err) {
    App.showToast(err.message || 'Error resetting password', 'danger');
  }
}
