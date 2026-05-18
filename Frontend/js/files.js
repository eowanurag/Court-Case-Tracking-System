// files.js - Logic for Investigation Files Page

async function pageInit() {
  setupEventListeners();
  await loadIOUsers();
  await renderFiles();
}

function setupEventListeners() {
  // Auto-generate full file number
  const fileNoInput = document.getElementById('fileNo');
  const fileYearInput = document.getElementById('fileYear');
  
  const updateFullNo = () => {
    const no = fileNoInput.value;
    const yr = fileYearInput.value;
    if(no && yr) {
      document.getElementById('fullNumber').value = `${no}/${yr}`;
    } else {
      document.getElementById('fullNumber').value = '';
    }
  };
  
  fileNoInput.addEventListener('input', updateFullNo);
  fileYearInput.addEventListener('input', updateFullNo);
  
  // Filters
  document.getElementById('searchFile').addEventListener('input', renderFiles);
  document.getElementById('filterSector').addEventListener('change', renderFiles);
  document.getElementById('filterStatus').addEventListener('change', renderFiles);
  document.getElementById('resetFilters').addEventListener('click', () => {
    document.getElementById('searchFile').value = '';
    document.getElementById('filterSector').value = '';
    document.getElementById('filterStatus').value = '';
    renderFiles();
  });
}

async function loadIOUsers() {
  try {
    const response = await App.apiCall('/users');
    const users = response.data.users || [];
    const ioSelect = document.getElementById('io');
    
    ioSelect.innerHTML = '<option value="">Select IO</option>';
    users.filter(u => u.role === 'Investigation Officer' || u.role === 'Admin').forEach(u => {
      ioSelect.innerHTML += `<option value="${u.id}">${u.name} (${u.sector || 'N/A'})</option>`;
    });
  } catch (err) {
    console.error('Failed to load IOs', err);
  }
}

async function renderFiles() {
  const tbody = document.getElementById('files-tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary"></div></td></tr>';
  
  try {
    const search = document.getElementById('searchFile').value;
    const sector = document.getElementById('filterSector').value;
    const status = document.getElementById('filterStatus').value;
    
    // Build query params
    const params = new URLSearchParams();
    if(search) params.append('search', search);
    if(sector) params.append('sector_name', sector);
    if(status) params.append('investigation_status', status);
    
    const [filesRes, firsRes] = await Promise.all([
      App.apiCall(`/files?${params.toString()}`),
      App.apiCall(`/fir`) // Need all FIRs to calculate count per file, or we could update backend to return fir_count
    ]);
    
    const filteredFiles = filesRes.data.files || [];
    const allFirs = firsRes.data.firs || [];
    
    tbody.innerHTML = '';
    
    filteredFiles.forEach(f => {
      const fileFirs = allFirs.filter(fir => fir.file_id === f.id);
      const badgeClass = f.investigation_status === 'Active' ? 'bg-success' : 'bg-secondary';
      
      tbody.innerHTML += `
        <tr>
          <td class="fw-bold text-primary"><a href="fir.html?file_id=${f.id}" class="text-decoration-none">${f.full_file_no}</a></td>
          <td>${f.sector_name || 'N/A'}</td>
          <td>${f.io_name || 'Unassigned'}</td>
          <td><span class="badge bg-light text-dark border">${fileFirs.length}</span></td>
          <td>${new Date(f.created_at).toLocaleDateString()}</td>
          <td><span class="badge ${badgeClass}">${f.investigation_status}</span></td>
          <td class="text-end">
            <a href="fir.html?file_id=${f.id}" class="btn btn-sm btn-outline-primary" title="View FIRs"><i class="bi bi-eye"></i></a>
            <button class="btn btn-sm btn-outline-danger" title="Delete" onclick="deleteFile(${f.id}, '${f.full_file_no}')"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `;
    });
    
    if(filteredFiles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No files found matching criteria</td></tr>';
    }
    
    document.getElementById('showing-count').innerText = filteredFiles.length;
    // Total count might require a separate metadata from backend, just using length for now
    document.getElementById('total-count').innerText = filteredFiles.length;
    
  } catch (err) {
    console.error('Failed to load files', err);
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Error loading data</td></tr>';
  }
}

async function saveFile() {
  const file_no = document.getElementById('fileNo').value;
  const file_year = document.getElementById('fileYear').value;
  const sector_name = document.getElementById('sector').value;
  const io_id = document.getElementById('io').value;
  const investigation_status = document.getElementById('status').value;
  const remarks = document.getElementById('remarks').value;
  const file_title = document.getElementById('title').value;
  
  if(!file_no || !file_year || !sector_name) {
    App.showToast('Please fill all required fields', 'danger');
    return;
  }
  
  const btn = document.getElementById('saveFileBtn');
  btn.disabled = true;
  btn.innerHTML = 'Saving...';
  
  try {
    await App.apiCall('/files', 'POST', {
      file_no,
      file_year: parseInt(file_year),
      sector_name,
      io_id: io_id ? parseInt(io_id) : null,
      file_title,
      investigation_status,
      remarks
    });
    
    // Close modal
    const modalEl = document.getElementById('addFileModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
    
    // Reset form
    document.getElementById('addFileForm').reset();
    document.getElementById('fullNumber').value = '';
    
    App.showToast('Investigation File created successfully!');
    await renderFiles();
  } catch (err) {
    App.showToast(err.message || 'Error saving file', 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Save File';
  }
}

async function deleteFile(id, fileNo) {
  if (!confirm(`Are you sure you want to delete Investigation File "${fileNo}"?\nThis will also delete all linked FIRs, Hearings, Alerts and Documents.`)) return;

  try {
    await App.apiCall(`/files/${id}`, 'DELETE');
    App.showToast(`File ${fileNo} deleted successfully!`);
    await renderFiles();
  } catch (err) {
    App.showToast(err.message || 'Error deleting file', 'danger');
  }
}
