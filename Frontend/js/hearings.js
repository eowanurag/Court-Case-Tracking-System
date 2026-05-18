// hearings.js - Logic for Hearings Management Page

async function pageInit() {
  setupEventListeners();
  await populateFIRSelect();
  await renderHearings();
  
  // Set default hearing date to today in modal
  document.getElementById('hearingDate').value = new Date().toISOString().split('T')[0];
  
  // Check if fir_id is in URL and auto-open timeline
  const urlParams = new URLSearchParams(window.location.search);
  const fir_id = urlParams.get('fir_id');
  if (fir_id) {
    // We don't have the firNo handy, so we fetch it or pass it. 
    // Just view timeline directly
    viewTimeline(parseInt(fir_id), 'Selected FIR');
  }
}

function setupEventListeners() {
  document.getElementById('searchHearing').addEventListener('input', renderHearings);
  document.getElementById('filterDate').addEventListener('change', renderHearings);
  document.getElementById('filterCourtStatus').addEventListener('change', renderHearings);
  
  document.getElementById('resetFilters').addEventListener('click', () => {
    document.getElementById('searchHearing').value = '';
    document.getElementById('filterDate').value = '';
    document.getElementById('filterCourtStatus').value = '';
    renderHearings();
  });
}

async function populateFIRSelect() {
  try {
    const response = await App.apiCall('/fir');
    const firs = response.data.firs || [];
    const select = document.getElementById('firSelect');
    select.innerHTML = '<option value="">Search / Select FIR</option>';
    
    // Check if we came from fir page with a pre-selected fir
    const urlParams = new URLSearchParams(window.location.search);
    const preselectedFirId = urlParams.get('fir_id');

    firs.forEach(f => {
      const selected = (f.id == preselectedFirId) ? 'selected' : '';
      select.innerHTML += `<option value="${f.id}" ${selected}>${f.full_fir_no} - ${f.court_name}</option>`;
    });
  } catch(err) {
    console.error('Failed to load FIRs', err);
  }
}

function getBadgeClassForStatus(status) {
  if(!status) return 'bg-secondary';
  if(status.includes('Required')) return 'bg-warning text-dark';
  if(status.includes('Pending')) return 'bg-danger';
  if(status === 'Order Reserved') return 'bg-success';
  if(status === 'Adjourned') return 'bg-secondary';
  return 'bg-primary';
}

async function renderHearings() {
  const tbody = document.getElementById('hearings-tbody');
  tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><div class="spinner-border text-primary"></div></td></tr>';
  
  try {
    const search = document.getElementById('searchHearing').value;
    const date = document.getElementById('filterDate').value;
    const status = document.getElementById('filterCourtStatus').value;
    
    const urlParams = new URLSearchParams(window.location.search);
    const firIdFilter = urlParams.get('fir_id');
    
    const params = new URLSearchParams();
    if(status) params.append('court_status', status);
    if(date) params.append('hearing_date', date);
    if(firIdFilter) params.append('fir_id', firIdFilter);
    
    const response = await App.apiCall(`/hearings?${params.toString()}`);
    let hearings = response.data.hearings || [];
    
    // Client-side search for FIR No since our backend hearing API might not search by full_fir_no directly
    if(search) {
      hearings = hearings.filter(h => h.full_fir_no && h.full_fir_no.toLowerCase().includes(search.toLowerCase()));
    }
    
    tbody.innerHTML = '';
    
    hearings.forEach(h => {
      const badgeClass = getBadgeClassForStatus(h.court_status);
      const nextDateBadge = h.next_hearing_date ? `<span class="badge bg-light text-dark border"><i class="bi bi-calendar me-1"></i>${new Date(h.next_hearing_date).toLocaleDateString()}</span>` : '<span class="text-muted small">None</span>';
      
      const isPriority = h.court_status && h.court_status.includes('Required');
      const rowClass = isPriority ? 'bg-light' : '';
      
      tbody.innerHTML += `
        <tr class="${rowClass}">
          <td class="fw-bold text-primary">${h.full_fir_no || 'Unknown'}</td>
          <td class="small">${h.accused_names || '<span class="text-muted">N/A</span>'}</td>
          <td class="small">${h.court_name || 'N/A'}</td>
          <td>${new Date(h.hearing_date).toLocaleDateString()}</td>
          <td>${nextDateBadge}</td>
          <td><span class="badge ${badgeClass}">${h.court_status}</span></td>
          <td class="small text-muted">${h.updated_by_name || 'System'}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary" title="View Timeline" onclick="viewTimeline(${h.fir_id}, '${h.full_fir_no}')">
              <i class="bi bi-clock-history"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    if(hearings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No hearing records found</td></tr>';
    }
  } catch (err) {
    console.error('Failed to load hearings', err);
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger">Error loading data</td></tr>';
  }
}

async function viewTimeline(firId, firNo) {
  document.getElementById('timeline-title').innerText = `Timeline: ${firNo}`;
  document.getElementById('timeline-subtitle').innerText = `Loading...`;
  
  const ul = document.getElementById('hearing-timeline');
  ul.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
  
  try {
    const response = await App.apiCall(`/hearings?fir_id=${firId}`);
    const timelineHearings = response.data.hearings || [];
    
    document.getElementById('timeline-subtitle').innerText = `${timelineHearings.length} records found`;
    ul.innerHTML = '';
    
    if(timelineHearings.length === 0) {
      ul.innerHTML = '<div class="text-center text-muted py-5"><p>No history for this FIR</p></div>';
      return;
    }
    
    timelineHearings.forEach(h => {
      const badgeClass = getBadgeClassForStatus(h.court_status);
      const nextStr = h.next_hearing_date ? new Date(h.next_hearing_date).toLocaleDateString() : 'None';
      
      ul.innerHTML += `
        <li class="timeline-item">
          <div class="timeline-icon text-primary"><i class="bi bi-calendar-check text-accent"></i></div>
          <div class="timeline-content">
            <div class="d-flex justify-content-between mb-2">
              <strong class="text-primary-gov">${new Date(h.hearing_date).toLocaleDateString()}</strong>
              <span class="badge ${badgeClass}">${h.court_status}</span>
            </div>
            <p class="mb-2 text-sm">${h.remarks}</p>
            <div class="d-flex justify-content-between text-muted" style="font-size: 0.8rem;">
              <span>Next: ${nextStr}</span>
              <span>By: ${h.updated_by_name || 'System'}</span>
            </div>
          </div>
        </li>
      `;
    });
  } catch (err) {
    ul.innerHTML = '<div class="text-center text-danger py-5"><p>Failed to load timeline</p></div>';
  }
}

async function saveHearing() {
  const fir_id = document.getElementById('firSelect').value;
  const hearing_date = document.getElementById('hearingDate').value;
  const next_hearing_date = document.getElementById('nextDate').value;
  const court_status = document.getElementById('courtStatus').value;
  const remarks = document.getElementById('remarks').value;
  const generateAlert = document.getElementById('generateAlert').checked;
  
  if(!fir_id || !hearing_date || !court_status || !remarks) {
    App.showToast('Please fill all required fields', 'danger');
    return;
  }
  
  const btn = document.getElementById('saveHearingBtn');
  btn.disabled = true;
  btn.innerHTML = 'Saving...';
  
  try {
    await App.apiCall('/hearings', 'POST', {
      fir_id: parseInt(fir_id),
      hearing_date,
      next_hearing_date: next_hearing_date || null,
      court_status,
      remarks
    });
    
    // Auto-generate Alert if checked
    if(generateAlert) {
      await App.apiCall('/alerts', 'POST', {
        fir_id: parseInt(fir_id),
        alert_type: court_status,
        priority: "High",
        deadline: next_hearing_date || hearing_date,
        status: "Pending"
      });
    }
    
    // Close modal
    const modalEl = document.getElementById('addHearingModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
    
    document.getElementById('addHearingForm').reset();
    document.getElementById('hearingDate').value = new Date().toISOString().split('T')[0];
    
    App.showToast('Hearing update recorded successfully!');
    await renderHearings();
    viewTimeline(parseInt(fir_id), 'Selected FIR');
  } catch(err) {
    App.showToast(err.message || 'Error saving hearing', 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Save Update';
  }
}
