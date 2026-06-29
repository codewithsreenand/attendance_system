// Attendance System Logic - JB Developers

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let selectedStaff = null;
  let webAppUrl = localStorage.getItem('jb_attendance_webapp_url');
  if (!webAppUrl || webAppUrl.trim() === '') {
    webAppUrl = 'https://script.google.com/macros/s/AKfycbw9gDyZb48cxL-EVJVJgRnMPFBDHOsLzwbLak0V1pJJpCHRwO9jp4kovXfyYvXRBi4fUg/exec';
  }

  // --- UI ELEMENTS ---
  const views = {
    home: document.getElementById('view-home'),
    confirm: document.getElementById('view-confirm'),
    history: document.getElementById('view-history')
  };
  
  const staffCards = document.querySelectorAll('.staff-card');
  const btnBack = document.getElementById('btn-back');
  const btnSettings = document.getElementById('btn-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const modalSettings = document.getElementById('modal-settings');
  
  const confirmAvatar = document.getElementById('confirm-avatar');
  const confirmName = document.getElementById('confirm-name');
  const confirmRole = document.getElementById('confirm-role');
  
  const liveTime = document.getElementById('live-time');
  const liveDate = document.getElementById('live-date');
  
  const btnSubmit = document.getElementById('btn-submit-attendance');
  const btnSubmitText = btnSubmit.querySelector('.btn-text');
  const btnSubmitSpinner = btnSubmit.querySelector('.btn-spinner');
  
  const inputNote = document.getElementById('input-note');
  const inputWebAppUrl = document.getElementById('input-web-app-url');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const settingsStatus = document.getElementById('settings-status');
  
  const btnCopyCode = document.getElementById('btn-copy-code');
  const codeBlock = document.getElementById('apps-script-code');
  const toastContainer = document.getElementById('toast-container');

  // History Elements
  const btnHistory = document.getElementById('btn-history');
  const btnBackHistory = document.getElementById('btn-back-history');
  const btnPrint = document.getElementById('btn-print');
  const inputSearch = document.getElementById('input-search');
  const recordCount = document.getElementById('record-count');
  const tableBodyHistory = document.getElementById('table-body-history');
  const historyLoading = document.getElementById('history-loading');
  const historyEmpty = document.getElementById('history-empty');

  let attendanceRecords = [];

  // Prepopulate Web App URL input
  if (webAppUrl) {
    inputWebAppUrl.value = webAppUrl;
  }

  // --- TIME AND CLOCK FUNCTION ---
  function updateClock() {
    const now = new Date();
    
    // Format Time: HH:MM:SS
    let hours = String(now.getHours()).padStart(2, '0');
    let minutes = String(now.getMinutes()).padStart(2, '0');
    let seconds = String(now.getSeconds()).padStart(2, '0');
    
    liveTime.textContent = `${hours}:${minutes}:${seconds}`;
    
    // Format Date: Monday, June 29, 2026
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    liveDate.textContent = now.toLocaleDateString('en-US', options);
  }
  
  setInterval(updateClock, 1000);
  updateClock(); // Initial run

  // --- VIEW TRANSITIONS ---
  function switchView(viewName) {
    // Fade out active view first
    const activeView = document.querySelector('.view.active');
    if (activeView) {
      activeView.classList.remove('active');
    }
    
    // Wait a brief moment to toggle displays and fade in
    setTimeout(() => {
      Object.keys(views).forEach(key => {
        if (key === viewName) {
          views[key].style.display = 'block';
          // Trigger reflow for transition
          void views[key].offsetWidth;
          views[key].classList.add('active');
        } else {
          views[key].style.display = 'none';
        }
      });
    }, 200);
  }

  // Click on a staff card
  staffCards.forEach(card => {
    card.addEventListener('click', () => {
      const name = card.getAttribute('data-staff');
      const imageSrc = card.getAttribute('data-image');
      const role = card.querySelector('.role-badge').textContent;
      
      selectedStaff = name;
      confirmName.textContent = name;
      confirmAvatar.src = imageSrc;
      confirmRole.textContent = role;
      
      // Clear notes field
      inputNote.value = '';
      
      switchView('confirm');
    });
  });

  // Back to profiles
  btnBack.addEventListener('click', () => {
    switchView('home');
    selectedStaff = null;
  });

  // --- MODAL CONTROLS ---
  btnSettings.addEventListener('click', () => {
    modalSettings.classList.add('active');
  });

  btnCloseSettings.addEventListener('click', () => {
    modalSettings.classList.remove('active');
    // Clear status
    settingsStatus.textContent = '';
    settingsStatus.className = 'status-indicator';
  });

  // Close modal when clicking outside content card
  modalSettings.addEventListener('click', (e) => {
    if (e.target === modalSettings) {
      modalSettings.classList.remove('active');
      settingsStatus.textContent = '';
      settingsStatus.className = 'status-indicator';
    }
  });

  // Modal Tabs switching
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      button.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });

  // Copy Code Action
  btnCopyCode.addEventListener('click', () => {
    const textToCopy = codeBlock.textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('Apps Script code copied to clipboard!', 'success');
      btnCopyCode.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        Copied!
      `;
      setTimeout(() => {
        btnCopyCode.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Copy Code
        `;
      }, 2000);
    }).catch(err => {
      showToast('Failed to copy code: ' + err, 'error');
    });
  });

  // Save Settings Action
  btnSaveSettings.addEventListener('click', () => {
    const rawUrl = inputWebAppUrl.value.trim();
    
    if (rawUrl === '') {
      localStorage.removeItem('jb_attendance_webapp_url');
      webAppUrl = '';
      settingsStatus.textContent = 'Configuration cleared.';
      settingsStatus.className = 'status-indicator warning';
      showToast('Google Sheets URL cleared.', 'warning');
      return;
    }
    
    try {
      new URL(rawUrl); // Basic URL format check
      localStorage.setItem('jb_attendance_webapp_url', rawUrl);
      webAppUrl = rawUrl;
      
      settingsStatus.textContent = 'Settings saved successfully!';
      settingsStatus.className = 'status-indicator success';
      showToast('Google Sheets URL saved!', 'success');
      
      // Auto close after 1s
      setTimeout(() => {
        modalSettings.classList.remove('active');
        settingsStatus.textContent = '';
        settingsStatus.className = 'status-indicator';
      }, 1000);
    } catch (e) {
      settingsStatus.textContent = 'Please enter a valid URL.';
      settingsStatus.className = 'status-indicator error';
      showToast('Invalid URL format', 'error');
    }
  });

  // --- ATTENDANCE FORM SUBMISSION ---
  btnSubmit.addEventListener('click', async () => {
    if (!selectedStaff) {
      showToast('No profile selected.', 'error');
      return;
    }

    if (!webAppUrl) {
      showToast('Google Sheets Web App is not configured. Please open settings (top right).', 'warning');
      modalSettings.classList.add('active');
      return;
    }

    const actionType = document.querySelector('input[name="action-type"]:checked').value;
    const notes = inputNote.value.trim();
    const now = new Date();
    
    const attendanceData = {
      name: selectedStaff,
      action: actionType,
      timeString: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      notes: notes
    };

    // UI Loading State
    btnSubmit.disabled = true;
    btnSubmitText.textContent = 'Recording...';
    btnSubmitSpinner.classList.remove('hidden');

    try {
      // Use mode: 'no-cors' for Google Apps Script redirects.
      // This guarantees the POST triggers successfully even if CORS preflight checks fail.
      await fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(attendanceData)
      });

      // Show Success
      showToast(`Success: Recorded ${actionType} for ${selectedStaff}`, 'success');
      
      // Reset State & Redirect to Home
      setTimeout(() => {
        btnSubmit.disabled = false;
        btnSubmitText.textContent = 'Confirm Attendance';
        btnSubmitSpinner.classList.add('hidden');
        switchView('home');
        selectedStaff = null;
      }, 1500);

    } catch (error) {
      console.error('Error recording attendance:', error);
      showToast('Network error, please verify Google Sheet URL configuration.', 'error');
      btnSubmit.disabled = false;
      btnSubmitText.textContent = 'Confirm Attendance';
      btnSubmitSpinner.classList.add('hidden');
    }
  });

  // --- HISTORY VIEW LOGIC ---
  btnHistory.addEventListener('click', () => {
    switchView('history');
    fetchHistory();
  });

  btnBackHistory.addEventListener('click', () => {
    switchView('home');
  });

  btnPrint.addEventListener('click', () => {
    window.print();
  });

  inputSearch.addEventListener('input', () => {
    renderHistoryTable(attendanceRecords);
  });

  async function fetchHistory() {
    if (!webAppUrl) {
      showToast('Google Sheets Web App is not configured. Open settings to link it.', 'warning');
      historyLoading.classList.add('hidden');
      historyEmpty.classList.remove('hidden');
      return;
    }

    // Set UI to loading state
    historyLoading.classList.remove('hidden');
    historyEmpty.classList.add('hidden');
    tableBodyHistory.innerHTML = '';
    recordCount.textContent = '0 Records';

    try {
      const response = await fetch(webAppUrl);
      const result = await response.json();

      historyLoading.classList.add('hidden');

      if (result.status === 'success' && Array.isArray(result.data)) {
        attendanceRecords = result.data;
        renderHistoryTable(attendanceRecords);
      } else {
        console.error('API Error:', result.message);
        showToast('Failed to fetch logs from Google Sheets.', 'error');
        historyEmpty.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      showToast('Network error while retrieving logs.', 'error');
      historyLoading.classList.add('hidden');
      historyEmpty.classList.remove('hidden');
    }
  }

  function renderHistoryTable(records) {
    tableBodyHistory.innerHTML = '';
    
    if (!records || records.length === 0) {
      historyEmpty.classList.remove('hidden');
      recordCount.textContent = '0 Records';
      return;
    }

    let startIndex = 0;
    // Skip header row if it exists
    if (records.length > 0 && (records[0][0].toString().toLowerCase().includes('date') || records[0][1].toString().toLowerCase().includes('name'))) {
      startIndex = 1;
    }

    const searchQuery = inputSearch.value.toLowerCase().trim();
    let matchCount = 0;

    for (let i = startIndex; i < records.length; i++) {
      const row = records[i];
      if (!row || row.length < 3) continue;

      const dateVal = row[0];
      const nameVal = row[1] ? row[1].toString() : '';
      const actionVal = row[2] ? row[2].toString() : '';
      const timeVal = row[3] ? row[3].toString() : '';
      const notesVal = row[4] ? row[4].toString() : '';

      // Check filters
      if (searchQuery !== '') {
        const matchesName = nameVal.toLowerCase().includes(searchQuery);
        const matchesNotes = notesVal.toLowerCase().includes(searchQuery);
        const matchesAction = actionVal.toLowerCase().includes(searchQuery);
        if (!matchesName && !matchesNotes && !matchesAction) {
          continue;
        }
      }

      matchCount++;

      // Date conversion & formatting
      const dateObj = new Date(dateVal);
      let dateString = dateVal;
      if (!isNaN(dateObj.getTime())) {
        const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        dateString = `${dateObj.toLocaleDateString('en-US', dateOptions)} ${dateObj.toLocaleTimeString('en-US', timeOptions)}`;
      }

      // Action Pill class
      const actionClass = actionVal.toLowerCase() === 'check out' ? 'check-out' : 'check-in';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${dateString}</td>
        <td style="font-weight: 600;">${nameVal}</td>
        <td><span class="status-pill ${actionClass}">${actionVal}</span></td>
        <td style="font-family: var(--font-mono); color: #a5b4fc;">${timeVal}</td>
        <td style="color: var(--text-muted); font-size: 0.9rem;">${notesVal}</td>
      `;
      tableBodyHistory.appendChild(tr);
    }

    recordCount.textContent = `${matchCount} Record${matchCount === 1 ? '' : 's'}`;

    if (matchCount === 0) {
      historyEmpty.classList.remove('hidden');
    } else {
      historyEmpty.classList.add('hidden');
    }
  }

  // --- TOAST SYSTEM ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Set matching icons
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else { // warning / info
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-message">${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto dismiss
    setTimeout(() => {
      toast.style.animation = 'slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) reverse forwards';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 4000);
  }
});
