// alerts.js - Logic for Alerts Page

async function pageInit() {
  setupEventListeners();
  await loadIOUsers();
  await renderAlerts();
}

function setupEventListeners() {
  document.getElementById('searchAlert').addEventListener('input', renderAlerts);
  document.getElementById('filterStatus').addEventListener('change', renderAlerts);
  document.getElementById('filterPriority').addEventListener('change', renderAlerts);
  
  document.getElementById('resetFilters').addEventListener('click', () => {
    document.getElementById('searchAlert').value = '';
    document.getElementById('filterStatus').value = 'Pending';
    document.getElementById('filterPriority').value = '';
    renderAlerts();
  });
}

async function loadIOUsers() {
  try {
    const response = await App.apiCall('/users');
    const users = response.data.users || [];
    const ioSelect = document.getElementById('assignedTo');
    
    ioSelect.innerHTML = '<option value="">Select IO</option>';
    users.filter(u => u.role === 'Investigation Officer' || u.role === 'Admin').forEach(u => {
      ioSelect.innerHTML += `<option value="${u.id}">${u.name} (${u.sector || 'N/A'})</option>`;
    });
  } catch (err) {
    console.error('Failed to load IOs', err);
  }
}

async function renderAlerts() {
  const container = document.getElementById('alerts-container');
  container.innerHTML = '<div class="col-12"><div class="text-center py-5"><div class="spinner-border text-primary"></div></div></div>';
  
  try {
    const search = document.getElementById('searchAlert').value;
    const status = document.getElementById('filterStatus').value;
    const priority = document.getElementById('filterPriority').value;
    
    const params = new URLSearchParams();
    if(status) params.append('status', status);
    if(priority) params.append('priority', priority);
    
    const response = await App.apiCall(`/alerts?${params.toString()}`);
    let alerts = response.data.alerts || [];
    
    if(search) {
      alerts = alerts.filter(a => 
        (a.full_fir_no && a.full_fir_no.toLowerCase().includes(search.toLowerCase())) || 
        (a.assigned_io_name && a.assigned_io_name.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    container.innerHTML = '';
    
    alerts.forEach(a => {
      let pClass = 'bg-secondary';
      if(a.priority === 'High' || a.priority === 'Urgent') pClass = 'bg-danger';
      if(a.priority === 'Medium') pClass = 'bg-warning text-dark';
      
      let sClass = 'text-danger';
      let iconClass = 'bi-exclamation-circle text-danger';
      if(a.status === 'Completed') {
          sClass = 'text-success';
          iconClass = 'bi-check-circle-fill text-success';
      } else if(a.status === 'In Progress') {
          sClass = 'text-primary';
          iconClass = 'bi-arrow-repeat text-primary';
      }

      let completionHtml = '';
      if (a.status === 'Completed' && a.completion_date) {
        completionHtml += `
          <div class="d-flex justify-content-between mb-1 mt-1 border-top pt-1 text-xs">
            <span class="text-muted">Completed On:</span>
            <span class="fw-semibold text-success">${new Date(a.completion_date).toLocaleDateString()}</span>
          </div>
        `;
      }
      if (a.remarks) {
        completionHtml += `
          <div class="mt-1 border-top pt-1 text-xs">
            <span class="text-muted d-block mb-1">Remarks / Progress:</span>
            <div class="p-2 bg-light border rounded text-dark text-xs" style="white-space: pre-wrap;">${a.remarks}</div>
          </div>
        `;
      }

      container.innerHTML += `
        <div class="col-md-6 col-lg-4">
          <div class="card bg-surface border-0 shadow-sm h-100 alert-card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <span class="badge ${pClass}">${a.priority} Priority</span>
                <i class="bi ${iconClass} fs-5"></i>
              </div>
              <h5 class="card-title text-primary-gov mb-1">${a.alert_type}</h5>
              <p class="card-text fw-bold mb-2">${a.full_fir_no || 'Unknown FIR'}</p>
              
              <div class="mb-3 small">
                <div class="d-flex justify-content-between mb-1">
                  <span class="text-muted">Due Date:</span>
                  <span class="fw-medium">${new Date(a.deadline).toLocaleDateString()}</span>
                </div>
                <div class="d-flex justify-content-between mb-1">
                  <span class="text-muted">Status:</span>
                  <span class="fw-medium ${sClass}">${a.status}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-muted">Assigned IO:</span>
                  <span class="fw-medium">${a.assigned_to_name || 'Unassigned'}</span>
                </div>
                ${completionHtml}
              </div>
              
              <div class="mt-auto pt-3 border-top">
                <button class="btn btn-sm btn-outline-primary w-100" onclick="openAssignModal(${a.id}, '${a.assigned_to || ''}', '${a.status}', '${(a.remarks || '').replace(/'/g, "\\'")}', '${a.completion_date || ''}')">
                  <i class="bi bi-pencil-square me-1"></i> Update / Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    if(alerts.length === 0) {
      container.innerHTML = '<div class="col-12"><div class="text-center py-5 text-muted">No alerts found matching criteria.</div></div>';
    }
  } catch (err) {
    console.error('Failed to load alerts', err);
    container.innerHTML = '<div class="col-12"><div class="text-center py-5 text-danger">Error loading alerts.</div></div>';
  }
}

function toggleCompletionFields() {
  const status = document.getElementById('alertStatus').value;
  const compGroup = document.getElementById('completionDateGroup');
  const compInput = document.getElementById('completionDate');
  
  if (status === 'Completed') {
    compGroup.style.display = 'block';
    compInput.setAttribute('required', 'required');
    if (!compInput.value) {
      compInput.value = new Date().toISOString().split('T')[0];
    }
  } else {
    compGroup.style.display = 'none';
    compInput.removeAttribute('required');
  }
}

function openAssignModal(id, currentAssignedTo, currentStatus, currentRemarks = '', currentCompletionDate = '') {
  document.getElementById('alertId').value = id;
  document.getElementById('alertStatus').value = currentStatus;
  document.getElementById('alertRemarks').value = currentRemarks;
  
  if (currentCompletionDate) {
    document.getElementById('completionDate').value = currentCompletionDate.split('T')[0];
  } else {
    document.getElementById('completionDate').value = '';
  }
  
  const user = JSON.parse(localStorage.getItem('eow_user') || '{}');
  const isIo = user.role && user.role.toLowerCase() === 'investigation officer';
  const selectEl = document.getElementById('assignedTo');
  
  if (isIo) {
    // Ensure the IO is selected and option is present
    if (!selectEl.querySelector(`option[value="${user.id}"]`)) {
      selectEl.innerHTML += `<option value="${user.id}">${user.name}</option>`;
    }
    selectEl.value = user.id;
    selectEl.disabled = true;
  } else {
    selectEl.value = currentAssignedTo || '';
    selectEl.disabled = false;
  }
  
  toggleCompletionFields();
  
  const modal = new bootstrap.Modal(document.getElementById('assignAlertModal'));
  modal.show();
}

async function saveAlertUpdate() {
  const id = document.getElementById('alertId').value;
  const user = JSON.parse(localStorage.getItem('eow_user') || '{}');
  const isIo = user.role && user.role.toLowerCase() === 'investigation officer';
  
  let assigned_to = document.getElementById('assignedTo').value;
  if (isIo) {
    assigned_to = user.id; // Force set to logged in IO's ID
  }
  
  const status = document.getElementById('alertStatus').value;
  const completion_date = document.getElementById('completionDate').value;
  const remarks = document.getElementById('alertRemarks').value;
  
  if(!assigned_to) {
    App.showToast('Please specify an Investigation Officer', 'danger');
    return;
  }

  if (status === 'Completed' && !completion_date) {
    App.showToast('Please enter the completion date', 'danger');
    return;
  }
  
  const btn = document.getElementById('saveAlertBtn');
  btn.disabled = true;
  btn.innerHTML = 'Updating...';
  
  try {
    await App.apiCall(`/alerts/${id}`, 'PUT', {
      status,
      assigned_to: parseInt(assigned_to),
      completion_date: status === 'Completed' ? completion_date : null,
      remarks: remarks || null
    });
    
    const modalEl = document.getElementById('assignAlertModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
    
    App.showToast('Alert updated successfully!');
    await renderAlerts();
  } catch (err) {
    App.showToast(err.message || 'Error updating alert', 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Update Alert';
  }
}
