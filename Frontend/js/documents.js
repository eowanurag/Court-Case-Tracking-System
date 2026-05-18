// documents.js - Logic for Document Management Page

async function pageInit() {
  await populateFIRSelect();
  await renderDocuments();
}

async function populateFIRSelect() {
  try {
    const response = await App.apiCall('/fir');
    const firs = response.data.firs || [];
    const select = document.getElementById('firSelect');
    select.innerHTML = '<option value="">Select FIR Case</option>';
    
    const urlParams = new URLSearchParams(window.location.search);
    const preselectedFirId = urlParams.get('fir_id');

    firs.forEach(f => {
      const selected = (f.id == preselectedFirId) ? 'selected' : '';
      select.innerHTML += `<option value="${f.id}" ${selected}>${f.full_fir_no} (${f.court_name})</option>`;
    });
  } catch (err) {
    console.error('Failed to load FIRs', err);
  }
}

async function renderDocuments() {
  const grid = document.getElementById('documents-grid');
  
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const firId = urlParams.get('fir_id');
    
    let endpoint = '/documents';
    if(firId) endpoint += `?fir_id=${firId}`;

    const response = await App.apiCall(endpoint);
    const docs = response.data.documents || [];
    
    grid.innerHTML = '';
    
    if(docs.length === 0) {
      grid.innerHTML = '<div class="col-12 text-center py-5 text-muted"><i class="bi bi-folder2-open fs-1 mb-2"></i><p>No documents found</p></div>';
      return;
    }

    docs.forEach(d => {
      const isPdf = d.file_url.toLowerCase().endsWith('.pdf');
      const iconClass = isPdf ? 'bi-file-earmark-pdf text-danger' : 'bi-file-earmark-image text-primary';
      const backendOrigin = BACKEND_BASE_URL.replace(/\/api$/, '');
      const fileUrl = `${backendOrigin}${d.file_url}`;

      grid.innerHTML += `
        <div class="col-xl-3 col-lg-4 col-md-6">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center mb-3">
                <i class="bi ${iconClass} fs-2 me-3"></i>
                <div class="overflow-hidden">
                  <h6 class="text-truncate mb-0" title="${d.file_name}">${d.file_name}</h6>
                  <small class="text-muted">${d.document_type}</small>
                </div>
              </div>
              <p class="small text-muted mb-3">
                Uploaded by: ${d.uploaded_by_name || 'System'}<br>
                Date: ${new Date(d.uploaded_at).toLocaleDateString()}
              </p>
              <div class="d-flex gap-2">
                <a href="${fileUrl}" target="_blank" class="btn btn-sm btn-primary flex-grow-1">
                  <i class="bi bi-eye me-1"></i> View
                </a>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteDocument(${d.id})">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error('Failed to load documents', err);
    grid.innerHTML = '<div class="col-12 text-center py-5 text-danger">Error loading documents</div>';
  }
}

async function uploadDocument() {
  const fir_id = document.getElementById('firSelect').value;
  const document_type = document.getElementById('docType').value;
  const title = document.getElementById('docTitle').value;
  const fileInput = document.getElementById('docFile');
  
  if(!fir_id || !document_type || !title || !fileInput.files[0]) {
    App.showToast('Please fill all fields and select a file', 'danger');
    return;
  }

  const btn = document.getElementById('uploadBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Uploading...';

  const formData = new FormData();
  formData.append('fir_id', fir_id);
  formData.append('document_type', document_type);
  formData.append('title', title);
  formData.append('documentFile', fileInput.files[0]);

  try {
    const response = await App.apiCall('/documents/upload', 'POST', formData);
    
    if(response.success) {
      App.showToast('Document uploaded successfully!');
      
      // Reset form and close modal
      document.getElementById('uploadDocForm').reset();
      const modal = bootstrap.Modal.getInstance(document.getElementById('uploadDocModal'));
      modal.hide();
      
      await renderDocuments();
    }
  } catch (err) {
    App.showToast(err.message || 'Error uploading document', 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-cloud-upload me-1"></i> Upload Now';
  }
}

async function deleteDocument(id) {
  if(!confirm('Are you sure you want to delete this document?')) return;
  
  try {
    await App.apiCall(`/documents/${id}`, 'DELETE');
    App.showToast('Document deleted successfully!');
    await renderDocuments();
  } catch (err) {
    App.showToast(err.message || 'Error deleting document', 'danger');
  }
}
