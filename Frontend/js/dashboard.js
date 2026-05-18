// dashboard.js - Handles dashboard charts and stats

let statusChartInstance = null;
let sectorChartInstance = null;

async function pageInit() {
  // Set default dates for current year
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
  const endOfYear = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
  
  document.getElementById('stats-start-date').value = startOfYear;
  document.getElementById('stats-end-date').value = endOfYear;

  await refreshDashboard();
}

async function refreshDashboard() {
  const startDate = document.getElementById('stats-start-date').value;
  const endDate = document.getElementById('stats-end-date').value;
  const dateType = document.getElementById('stats-date-type').value;

  await loadStats(startDate, endDate, dateType);
  await initCharts(startDate, endDate, dateType);
  await loadUpcomingHearings();
  await loadRecentAlerts();
}

async function loadStats(startDate, endDate, dateType) {
  try {
    const filesRes = await App.apiCall('/files');
    const firsRes = await App.apiCall(`/fir?startDate=${startDate}&endDate=${endDate}&dateType=${dateType}`);
    const alertsRes = await App.apiCall('/alerts?status=Pending');
    const dailyHearingsRes = await App.apiCall('/reports/daily-hearings');

    document.getElementById('count-files').innerText = filesRes.data.files ? filesRes.data.files.length : 0;
    document.getElementById('count-firs').innerText = firsRes.data.firs ? firsRes.data.firs.length : 0;
    document.getElementById('count-alerts').innerText = alertsRes.data.alerts ? alertsRes.data.alerts.length : 0;
    document.getElementById('count-hearings-today').innerText = dailyHearingsRes.data.count || 0;
  } catch (err) {
    console.error('Failed to load stats', err);
  }
}

async function initCharts(startDate, endDate, dateType) {
  const primary = getComputedStyle(document.documentElement).getPropertyValue('--gov-primary').trim();
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--gov-accent').trim();
  const success = getComputedStyle(document.documentElement).getPropertyValue('--gov-success').trim();
  const warning = getComputedStyle(document.documentElement).getPropertyValue('--gov-warning').trim();
  const textMain = getComputedStyle(document.documentElement).getPropertyValue('--gov-text-main').trim();

  Chart.defaults.color = textMain;
  Chart.defaults.font.family = "'Inter', sans-serif";

  try {
    // Status Chart
    const firsRes = await App.apiCall(`/fir?startDate=${startDate}&endDate=${endDate}&dateType=${dateType}`);
    const firs = firsRes.data.firs || [];
    
    let statusCounts = { 'Investigation': 0, 'Under Trial': 0, 'Closed': 0 };
    firs.forEach(f => {
      if (statusCounts[f.current_status] !== undefined) {
        statusCounts[f.current_status]++;
      } else {
        statusCounts[f.current_status] = (statusCounts[f.current_status] || 0) + 1;
      }
    });

    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    if (statusChartInstance) {
      statusChartInstance.destroy();
    }
    statusChartInstance = new Chart(ctxStatus, {
      type: 'bar',
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{
          label: 'Number of Cases',
          data: Object.values(statusCounts),
          backgroundColor: primary,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: { 
          legend: { display: false },
          title: {
            display: true,
            text: `Case Status (${startDate} to ${endDate})`
          }
        },
        scales: { y: { beginAtZero: true } }
      }
    });

    // Sector Chart using actual API
    const sectorRes = await App.apiCall('/reports/sector-summary');
    const summaries = sectorRes.data.summary || [];
    const labels = summaries.map(s => s.sector_name);
    const data = summaries.map(s => s.total_files);
    
    // Fallback if no data
    const finalLabels = labels.length > 0 ? labels : ['SSIT', 'Special Cell', 'Lucknow', 'Kanpur', 'Meerut', 'Varanasi', 'Headquater'];
    const finalData = data.length > 0 ? data : [0,0,0,0,0,0,0];

    const ctxSector = document.getElementById('sectorChart').getContext('2d');
    if (sectorChartInstance) {
      sectorChartInstance.destroy();
    }
    sectorChartInstance = new Chart(ctxSector, {
      type: 'doughnut',
      data: {
        labels: finalLabels,
        datasets: [{
          data: finalData,
          backgroundColor: [primary, accent, success, warning, '#6c757d', '#17a2b8', '#6610f2'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        cutout: '70%',
        plugins: { 
          legend: { position: 'bottom' },
          title: {
            display: true,
            text: 'Overall Sector Distribution'
          }
        }
      }
    });
  } catch (err) {
    console.error('Failed to load charts', err);
  }
}

async function loadUpcomingHearings() {
  const tbody = document.getElementById('upcoming-hearings-tbody');
  tbody.innerHTML = '<tr><td colspan="3" class="text-center"><div class="spinner-border spinner-border-sm"></div></td></tr>';
  
  try {
    const response = await App.apiCall('/reports/upcoming-hearings');
    const hearings = response.data.hearings || [];
    
    tbody.innerHTML = '';
    
    hearings.slice(0, 5).forEach(h => {
      let badgeClass = 'bg-secondary';
      if(h.court_status && h.court_status.includes('Required')) badgeClass = 'bg-warning text-dark';
      else if(h.court_status && h.court_status.includes('Evidence')) badgeClass = 'bg-info';
      
      tbody.innerHTML += `
        <tr>
          <td class="fw-medium">${h.full_fir_no}</td>
          <td>${new Date(h.next_hearing_date).toLocaleDateString()}</td>
          <td><span class="badge ${badgeClass}">${h.court_status}</span></td>
        </tr>
      `;
    });

    if(hearings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No upcoming hearings</td></tr>';
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Failed to load</td></tr>';
  }
}

async function loadRecentAlerts() {
  const tbody = document.getElementById('recent-alerts-tbody');
  tbody.innerHTML = '<tr><td colspan="3" class="text-center"><div class="spinner-border spinner-border-sm"></div></td></tr>';
  
  try {
    const response = await App.apiCall('/reports/pending-compliance');
    const alerts = response.data.alerts || [];
    
    tbody.innerHTML = '';
    
    alerts.slice(0, 5).forEach(a => {
      let pClass = 'bg-secondary';
      if(a.priority === 'High' || a.priority === 'Urgent') pClass = 'bg-danger';
      else if(a.priority === 'Medium') pClass = 'bg-warning text-dark';

      tbody.innerHTML += `
        <tr>
          <td class="fw-medium text-primary">${a.full_fir_no}</td>
          <td>${a.alert_type}</td>
          <td><span class="badge ${pClass}">${a.priority}</span></td>
        </tr>
      `;
    });

    if(alerts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No active alerts</td></tr>';
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Failed to load</td></tr>';
  }
}
