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
                  <span class="fw-medium">${a.assigned_io_name || 'Unassigned'}</span>
                </div>
              </div>
              
              <div class="mt-auto pt-3 border-top">
                <button class="btn btn-sm btn-outline-primary w-100" onclick="openAssignModal(${a.id}, '${a.assigned_to || ''}', '${a.status}')">
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

function openAssignModal(id, currentAssignedTo, currentStatus) {
  document.getElementById('alertId').value = id;
  document.getElementById('assignedTo').value = currentAssignedTo;
  document.getElementById('alertStatus').value = currentStatus;
  
  const modal = new bootstrap.Modal(document.getElementById('assignAlertModal'));
  modal.show();
}

async function saveAlertUpdate() {
  const id = document.getElementById('alertId').value;
  const assigned_to = document.getElementById('assignedTo').value;
  const status = document.getElementById('alertStatus').value;
  
  if(!assigned_to) {
    App.showToast('Please specify an Investigation Officer', 'danger');
    return;
  }
  
  const btn = document.getElementById('saveAlertBtn');
  btn.disabled = true;
  btn.innerHTML = 'Updating...';
  
  try {
    // Only sending assigned_to and status
    // Backend update requires full schema fields though? Let's check backend alert update.
    // If backend doesn't support partial update we might need to send everything. 
    // Backend alert update: const { alert_type, priority, deadline, status, assigned_to } = updateData;
    // Actually, backend update usually merges. Wait, Drizzle update sets what is passed.
    await App.apiCall(`/alerts/${id}`, 'PUT', {
      status,
      assigned_to: parseInt(assigned_to)
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
