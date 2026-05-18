// fir.js - Logic for FIR Cases Page

async function pageInit() {
  setupEventListeners();
  await Promise.all([populateFileSelect(), loadPairokarUsers()]);
  await renderFIRs();
}

function setupEventListeners() {
  const updateFullNo = () => {
    const no = document.getElementById('firNo').value;
    const yr = document.getElementById('firYear').value;
    const dist = document.getElementById('district').value;
    if(no && yr && dist) {
      document.getElementById('fullFIRNumber').value = `${no}/${yr} - ${dist}`;
    } else {
      document.getElementById('fullFIRNumber').value = '';
    }
  };
  
  document.getElementById('firNo').addEventListener('input', updateFullNo);
  document.getElementById('firYear').addEventListener('input', updateFullNo);
  document.getElementById('district').addEventListener('change', updateFullNo);
  
  // Filters
  document.getElementById('searchFIR').addEventListener('input', renderFIRs);
  document.getElementById('filterDistrict').addEventListener('change', renderFIRs);
  document.getElementById('filterStatus').addEventListener('change', renderFIRs);
  document.getElementById('showAllToggle').addEventListener('change', renderFIRs);
  document.getElementById('resetFilters').addEventListener('click', () => {
    document.getElementById('searchFIR').value = '';
    document.getElementById('filterDistrict').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('showAllToggle').checked = false;
    renderFIRs();
  });
}

async function populateFileSelect() {
  try {
    const response = await App.apiCall('/files');
    const files = response.data.files || [];
    const select = document.getElementById('fileSelect');
    select.innerHTML = '<option value="">Select Investigation File</option>';
    
    // Check if we came from files page with a pre-selected file
    const urlParams = new URLSearchParams(window.location.search);
    const preselectedFileId = urlParams.get('file_id');

    files.forEach(f => {
      const selected = (f.id == preselectedFileId) ? 'selected' : '';
      select.innerHTML += `<option value="${f.id}" ${selected}>${f.full_file_no} - ${f.sector_name} (${f.io_name || 'No IO'})</option>`;
    });
  } catch (err) {
    console.error('Failed to load files', err);
  }
}

async function loadPairokarUsers() {
  try {
    const response = await App.apiCall('/users');
    const allUsers = response.data.users || [];
    const pairoka = allUsers.filter(u => u.role === 'Pairokar');
    
    const addSelect = document.getElementById('pairokarsSelect');
    const editSelect = document.getElementById('editPairokarSelect');
    
    [addSelect, editSelect].forEach(sel => {
      if (!sel) return;
      const currentVal = sel.value;
      sel.innerHTML = '<option value="">-- None --</option>';
      pairoka.forEach(p => {
        sel.innerHTML += `<option value="${p.id}">${p.name} (${p.sector || 'N/A'})</option>`;
      });
      sel.value = currentVal;
    });
  } catch (err) {
    console.error('Failed to load Pairoka', err);
  }
}

async function renderFIRs() {
  const tbody = document.getElementById('fir-tbody');
  tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4"><div class="spinner-border spinner-border-sm"></div></td></tr>';
  
  try {
    const search = document.getElementById('searchFIR').value;
    const district = document.getElementById('filterDistrict').value;
    const status = document.getElementById('filterStatus').value;
    const showAll = document.getElementById('showAllToggle').checked;
    
    const params = new URLSearchParams();
    if(search) params.append('search', search);
    if(district) params.append('district', district);
    if(status) params.append('current_status', status);
    if(showAll) params.append('show_all', 'true');
    
    // Check for file_id in URL
    const urlParams = new URLSearchParams(window.location.search);
    const fileId = urlParams.get('file_id');
    if(fileId) params.append('file_id', fileId);
    
    // We fetch FIRs and Hearings to show the next hearing date
    const [firsRes, hearingsRes] = await Promise.all([
      App.apiCall(`/fir?${params.toString()}`),
      App.apiCall(`/hearings`)
    ]);
    
    const filteredFIRs = firsRes.data.firs || [];
    window.currentFIRs = filteredFIRs;
    const hearings = hearingsRes.data.hearings || [];
    
    tbody.innerHTML = '';
    
    filteredFIRs.forEach(f => {
      const fileBadge = f.full_file_no ? `<a href="files.html" class="badge bg-light text-dark border text-decoration-none">${f.full_file_no}</a>` : '<span class="text-muted">None</span>';
      const pairokarBadge = f.pairokar_name ? `<span class="badge bg-info text-dark">${f.pairokar_name}</span>` : '<span class="text-muted small">Unassigned</span>';
      
      // Find next hearing
      const firHearings = hearings.filter(h => h.fir_id === f.id);
      let nextDate = '<span class="text-muted">Not Scheduled</span>';
      if(firHearings.length > 0) {
        // sort by date descending
        firHearings.sort((a,b) => new Date(b.hearing_date) - new Date(a.hearing_date));
        if(firHearings[0].next_hearing_date) {
          nextDate = `<span class="text-danger fw-medium"><i class="bi bi-calendar me-1"></i>${new Date(firHearings[0].next_hearing_date).toLocaleDateString()}</span>`;
        }
      }

      let badgeClass = 'bg-secondary';
      if(f.current_status === 'Investigation') badgeClass = 'bg-warning text-dark';
      if(f.current_status === 'Under Trial') badgeClass = 'bg-primary-gov';
      
      tbody.innerHTML += `
        <tr>
          <td>
            <div class="fw-bold text-primary">${f.full_fir_no}</div>
            <div class="small text-muted">Year: ${f.fir_year}</div>
          </td>
          <td>${f.police_station}</td>
          <td>
            <div>${f.court_name}</div>
            <div class="small text-muted">${f.court_case_type || ''}</div>
          </td>
          <td>${fileBadge}</td>
          <td>${f.accused_names || '<span class="text-muted small">Not specified</span>'}</td>
          <td>${nextDate}</td>
          <td><span class="badge ${badgeClass}">${f.current_status}</span></td>
          <td>${pairokarBadge}</td>
          <td class="text-end">
            <a href="hearings.html?fir_id=${f.id}" class="btn btn-sm btn-outline-primary" title="Hearings"><i class="bi bi-calendar2-check"></i></a>
            <a href="documents.html?fir_id=${f.id}" class="btn btn-sm btn-outline-info" title="Documents"><i class="bi bi-file-earmark-pdf"></i></a>
            <button class="btn btn-sm btn-outline-secondary" title="Edit" onclick="openEditFIR(${f.id})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-danger" title="Delete" onclick="deleteFIR(${f.id}, '${f.full_fir_no}')"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `;
    });
    
    if(filteredFIRs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">No FIR cases found</td></tr>';
    }
  } catch (err) {
    console.error('Failed to load FIRs', err);
    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-danger">Error loading data</td></tr>';
  }
}

async function saveFIR() {
  const file_id = document.getElementById('fileSelect').value;
  const pairokar_id = document.getElementById('pairokarsSelect').value;
  const fir_no = document.getElementById('firNo').value;
  const fir_year = document.getElementById('firYear').value;
  const district = document.getElementById('district').value;
  const police_station = document.getElementById('ps').value;
  const court_name = document.getElementById('court').value;
  const current_status = document.getElementById('status').value;
  const accused_names = document.getElementById('accusedNames').value;
  const court_case_type = document.getElementById('courtCaseType').value;
  const case_initial_date = document.getElementById('caseInitialDate').value;
  const last_hearing_date = document.getElementById('lastHearingDate').value;
  const order_sent_date = document.getElementById('orderSentDate').value;
  const due_date = document.getElementById('dueDate').value;
  
  if(!file_id || !fir_no || !fir_year || !district || !police_station || !court_name) {
    App.showToast('Please fill all required fields', 'danger');
    return;
  }
  
  const btn = document.getElementById('saveFIRBtn');
  btn.disabled = true;
  btn.innerHTML = 'Saving...';
  
  try {
    await App.apiCall('/fir', 'POST', {
      file_id: parseInt(file_id),
      fir_no,
      fir_year: parseInt(fir_year),
      district,
      police_station,
      court_name,
      pairokar_id: pairokar_id ? parseInt(pairokar_id) : null,
      accused_names,
      court_case_type,
      case_initial_date: case_initial_date || null,
      last_hearing_date: last_hearing_date || null,
      order_sent_date: order_sent_date || null,
      due_date: due_date || null,
      current_status
    });
    
    // Close modal
    const modalEl = document.getElementById('addFIRModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
    
    document.getElementById('addFIRForm').reset();
    document.getElementById('fullFIRNumber').value = '';
    
    App.showToast('FIR Case created successfully!');
    await renderFIRs();
  } catch (err) {
    App.showToast(err.message || 'Error saving FIR', 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Save FIR';
  }
}

function openEditFIR(id) {
  const fir = window.currentFIRs.find(f => f.id === id);
  if(!fir) return;

  document.getElementById('editFIRId').value = fir.id;
  document.getElementById('editPs').value = fir.police_station || '';
  document.getElementById('editCourt').value = fir.court_name || '';
  document.getElementById('editStatus').value = fir.current_status || 'Investigation';
  document.getElementById('editRemarks').value = fir.remarks || '';
  
  document.getElementById('editAccusedNames').value = fir.accused_names || '';
  document.getElementById('editCourtCaseType').value = fir.court_case_type || '';
  
  document.getElementById('editCaseInitialDate').value = fir.case_initial_date ? fir.case_initial_date.split('T')[0] : '';
  document.getElementById('editLastHearingDate').value = fir.last_hearing_date ? fir.last_hearing_date.split('T')[0] : '';
  document.getElementById('editOrderSentDate').value = fir.order_sent_date ? fir.order_sent_date.split('T')[0] : '';
  document.getElementById('editDueDate').value = fir.due_date ? fir.due_date.split('T')[0] : '';

  if (fir.pairokar_id) {
    document.getElementById('editPairokarSelect').value = fir.pairokar_id;
  } else {
    document.getElementById('editPairokarSelect').value = '';
  }
  new bootstrap.Modal(document.getElementById('editFIRModal')).show();
}

async function updateFIR() {
  const id = document.getElementById('editFIRId').value;
  const police_station = document.getElementById('editPs').value;
  const court_name = document.getElementById('editCourt').value;
  const current_status = document.getElementById('editStatus').value;
  const pairokar_id = document.getElementById('editPairokarSelect').value;
  const remarks = document.getElementById('editRemarks').value;
  
  const accused_names = document.getElementById('editAccusedNames').value;
  const court_case_type = document.getElementById('editCourtCaseType').value;
  const case_initial_date = document.getElementById('editCaseInitialDate').value;
  const last_hearing_date = document.getElementById('editLastHearingDate').value;
  const order_sent_date = document.getElementById('editOrderSentDate').value;
  const due_date = document.getElementById('editDueDate').value;

  if(!police_station || !court_name) {
    App.showToast('Please fill all required fields', 'danger');
    return;
  }

  const btn = document.getElementById('updateFIRBtn');
  btn.disabled = true;
  btn.innerHTML = 'Updating...';

  try {
    await App.apiCall(`/fir/${id}`, 'PUT', { 
      police_station, 
      court_name, 
      current_status, 
      pairokar_id: pairokar_id ? parseInt(pairokar_id) : null, 
      accused_names,
      court_case_type,
      case_initial_date: case_initial_date || null,
      last_hearing_date: last_hearing_date || null,
      order_sent_date: order_sent_date || null,
      due_date: due_date || null,
      remarks 
    });
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('editFIRModal'));
    modal.hide();
    
    App.showToast('FIR updated successfully!');
    await renderFIRs();
  } catch (err) {
    App.showToast(err.message || 'Error updating FIR', 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Update FIR';
  }
}

async function deleteFIR(id, firNo) {
  if (!confirm(`Are you sure you want to delete FIR "${firNo}"?\nThis will also delete all linked Hearings, Alerts and Documents.`)) return;

  try {
    await App.apiCall(`/fir/${id}`, 'DELETE');
    App.showToast(`FIR ${firNo} deleted successfully!`);
    await renderFIRs();
  } catch (err) {
    App.showToast(err.message || 'Error deleting FIR', 'danger');
  }
}
