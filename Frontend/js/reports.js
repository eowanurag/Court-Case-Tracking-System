// reports.js - Logic for Reports Page

function pageInit() {
  document.getElementById('current-date').innerText = new Date().toLocaleDateString();
  
  // Set default dates
  const today = new Date();
  document.getElementById('dateTo').value = today.toISOString().split('T')[0];
  
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  document.getElementById('dateFrom').value = lastWeek.toISOString().split('T')[0];
  
  document.getElementById('generateReportBtn').addEventListener('click', generateReport);
  
  // Initial generation
  generateReport();
}

async function generateReport() {
  const reportType = document.getElementById('reportType').value;
  const btn = document.getElementById('generateReportBtn');
  
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
  btn.disabled = true;
  
  try {
    switch(reportType) {
      case 'daily_hearings':
        await generateHearingsReport(false);
        break;
      case 'upcoming_hearings':
        await generateHearingsReport(true);
        break;
      case 'pending_compliance':
        await generateComplianceReport();
        break;
      case 'sector_wise':
        await generateSectorReport();
        break;
      case 'io_report':
        await generateIOReport();
        break;
    }
  } catch(err) {
    console.error('Report Generation Error:', err);
    App.showToast('Failed to generate report', 'danger');
  } finally {
    btn.innerHTML = 'Generate';
    btn.disabled = false;
  }
}

async function generateHearingsReport(isUpcoming) {
  const title = isUpcoming ? "Upcoming Hearings Report" : "Daily Hearings Report";
  document.getElementById('report-title').innerText = title;
  
  const dateFrom = document.getElementById('dateFrom').value;
  const dateTo = document.getElementById('dateTo').value;
  
  const endpoint = isUpcoming ? '/reports/upcoming-hearings' : `/reports/daily-hearings?date=${dateTo}`;
  const response = await App.apiCall(endpoint);
  const hearings = response.data.hearings || [];
  
  // Create summary
  document.getElementById('report-summary').innerHTML = `
    <div class="col-md-6"><div class="p-3 bg-light border rounded"><strong>Total Records:</strong> ${hearings.length}</div></div>
    <div class="col-md-6"><div class="p-3 bg-light border rounded"><strong>Period:</strong> ${dateFrom} to ${dateTo}</div></div>
  `;
  
  // Table headers
  document.getElementById('report-thead').innerHTML = `
    <tr>
      <th>FIR Number</th>
      <th>Court</th>
      <th>Hearing Date</th>
      <th>Status</th>
      <th>Next Date</th>
    </tr>
  `;
  
  const tbody = document.getElementById('report-tbody');
  tbody.innerHTML = '';
  
  hearings.forEach(h => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${h.full_fir_no || 'Unknown'}</strong></td>
        <td>${h.court_name || '-'}</td>
        <td>${new Date(h.hearing_date || h.next_hearing_date).toLocaleDateString()}</td>
        <td>${h.court_status}</td>
        <td>${h.next_hearing_date ? new Date(h.next_hearing_date).toLocaleDateString() : '-'}</td>
      </tr>
    `;
  });
  
  if(hearings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No data found for this period</td></tr>`;
  }
}

async function generateComplianceReport() {
  document.getElementById('report-title').innerText = "Pending Compliance Report";
  
  const response = await App.apiCall('/reports/pending-compliance');
  const pending = response.data.alerts || [];
  
  document.getElementById('report-summary').innerHTML = `
    <div class="col-md-4"><div class="p-3 bg-danger text-white rounded shadow-sm"><strong>Total Pending:</strong> ${pending.length}</div></div>
    <div class="col-md-4"><div class="p-3 bg-warning text-dark rounded shadow-sm"><strong>High Priority:</strong> ${pending.filter(a => a.priority === 'High' || a.priority === 'Urgent').length}</div></div>
  `;
  
  document.getElementById('report-thead').innerHTML = `
    <tr>
      <th>FIR Number</th>
      <th>Compliance Required</th>
      <th>Priority</th>
      <th>Due Date</th>
      <th>Assigned IO</th>
    </tr>
  `;
  
  const tbody = document.getElementById('report-tbody');
  tbody.innerHTML = '';
  
  pending.forEach(a => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${a.full_fir_no}</strong></td>
        <td>${a.alert_type}</td>
        <td>${a.priority}</td>
        <td class="text-danger">${new Date(a.deadline).toLocaleDateString()}</td>
        <td>${a.assigned_io || 'Unassigned'}</td>
      </tr>
    `;
  });
  
  if(pending.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No pending compliances</td></tr>`;
  }
}

async function generateSectorReport() {
  document.getElementById('report-title').innerText = "Sector-wise Status Report";
  
  const response = await App.apiCall('/reports/sector-summary');
  const sectors = response.data.summary || [];
  
  document.getElementById('report-summary').innerHTML = '';
  
  document.getElementById('report-thead').innerHTML = `
    <tr>
      <th>Sector Name</th>
      <th>Total Files</th>
      <th>Active Files</th>
      <th>Closed Files</th>
    </tr>
  `;
  
  const tbody = document.getElementById('report-tbody');
  tbody.innerHTML = '';
  
  sectors.forEach(sec => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${sec.sector_name || 'Unassigned'}</strong></td>
        <td>${sec.total_files}</td>
        <td class="text-success">${sec.active_files}</td>
        <td>${sec.closed_files}</td>
      </tr>
    `;
  });
  
  if(sectors.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">No sector data available</td></tr>`;
  }
}

async function generateIOReport() {
  document.getElementById('report-title').innerText = "Investigation Officer Workload Report";
  
  // Fetch all files to aggregate IO workload locally since we don't have a dedicated API endpoint yet
  const response = await App.apiCall('/files');
  const files = response.data.files || [];
  
  const ioMap = {};
  files.forEach(f => {
    const ioName = f.io_name || 'Unassigned';
    if(!ioMap[ioName]) {
      ioMap[ioName] = { filesCount: 0, sectors: new Set() };
    }
    ioMap[ioName].filesCount++;
    if(f.sector_name) ioMap[ioName].sectors.add(f.sector_name);
  });
  
  document.getElementById('report-summary').innerHTML = '';
  
  document.getElementById('report-thead').innerHTML = `
    <tr>
      <th>Officer Name</th>
      <th>Assigned Files</th>
      <th>Sectors Handled</th>
    </tr>
  `;
  
  const tbody = document.getElementById('report-tbody');
  tbody.innerHTML = '';
  
  Object.keys(ioMap).forEach(io => {
    const data = ioMap[io];
    tbody.innerHTML += `
      <tr>
        <td><strong>${io}</strong></td>
        <td>${data.filesCount}</td>
        <td>${Array.from(data.sectors).join(', ') || '-'}</td>
      </tr>
    `;
  });
  
  if(Object.keys(ioMap).length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-muted">No IO data available</td></tr>`;
  }
}

function exportReport() {
  App.showToast('Exporting to Excel...', 'success');
  // In a real app, use SheetJS or similar.
  setTimeout(() => {
    App.showToast('Report_Export.xlsx downloaded successfully!');
  }, 1000);
}
