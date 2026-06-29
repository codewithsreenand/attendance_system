// Attendance System Logic - JB Developers

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let selectedStaff = null;
  let webAppUrl = localStorage.getItem('jb_attendance_webapp_url');
  
  // Auto-migrate old restricted URL to the updated deployment URL
  const oldUrl = 'https://script.google.com/macros/s/AKfycbz15XfRvL0N0rvDckCWx8PS8MQaJ2HLUWwuMGHSY-RwnuwCF_fJZnmEo3W5czYTHHQmzQ/exec';
  const newUrl = 'https://script.google.com/macros/s/AKfycbwzcPd9GA8m-Ib2uki_rNQFvdxmYPWlbBz-OUb1_KPXEjpM-4e-WzKWYWUAi1r3XdiM6Q/exec';
  
  if (webAppUrl === oldUrl || !webAppUrl || webAppUrl.trim() === '') {
    localStorage.setItem('jb_attendance_webapp_url', newUrl);
    webAppUrl = newUrl;
  }

  // --- UI ELEMENTS ---
  const views = {
    home: document.getElementById('view-home'),
    confirm: document.getElementById('view-confirm')
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
