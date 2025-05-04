window.addEventListener('DOMContentLoaded', () => {
  const ifaceSelect = document.getElementById('iface');
  const curIp = document.getElementById('cur-ip');
  const curMask = document.getElementById('cur-mask');
  const lastOctet = document.getElementById('last-octet');
  const maskInput = document.getElementById('mask');
  const applyBtn = document.getElementById('apply');
  const resetBtn = document.getElementById('reset');
  const message = document.getElementById('message');

  // Shortcut Creation Panel
  const exePathInput = document.getElementById('exe-path');
  const shortcutNameInput = document.getElementById('shortcut-name');
  const screenSelect = document.getElementById('screen');
  const remoteLocalSelect = document.getElementById('remote-local');
  const instructorStationCheckbox = document.getElementById('instructor-station');
  const createShortcutBtn = document.getElementById('create-shortcut');

  function showMessage(text, isError = false) {
    message.textContent = text;
    message.className = `mt-3 p-2 text-sm text-center rounded-md ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
    message.classList.remove('hidden');
  }

  function loadCurrent(iface) {
    window.api.getCurrent(iface).then(data => {
      if (data.error) {
        showMessage(data.error, true);
      } else {
        curIp.textContent = data.ip;
        curMask.textContent = data.mask;
        message.classList.add('hidden');
      }
    });
  }

  // Populate interfaces
  window.api.getInterfaces().then(ifaces => {
    ifaces.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      ifaceSelect.appendChild(opt);
    });
    if (ifaces.length) loadCurrent(ifaces[0]);
  });

  ifaceSelect.addEventListener('change', () => loadCurrent(ifaceSelect.value));
  
  applyBtn.addEventListener('click', () => {
    if (!ifaceSelect.value) {
      showMessage('Please select a network interface', true);
      return;
    }
    showMessage('Applying configuration...');
    window.api.setConfig(ifaceSelect.value, lastOctet.value, maskInput.value)
      .then(res => showMessage(res.message, !res.success));
  });
  
  resetBtn.addEventListener('click', () => {
    if (!ifaceSelect.value) {
      showMessage('Please select a network interface', true);
      return;
    }
    showMessage('Resetting to DHCP...');
    window.api.reset(ifaceSelect.value)
      .then(res => showMessage(res.message, !res.success));
  });

  createShortcutBtn.addEventListener('click', () => {
    const exePath = exePathInput.value;
    const shortcutName = shortcutNameInput.value;
    const screen = screenSelect.value;
    const remoteLocal = remoteLocalSelect.value;
    const instructorStation = instructorStationCheckbox.checked;

    if (!exePath || !shortcutName) {
      showMessage('Please provide executable path and shortcut name', true);
      return;
    }

    showMessage('Creating shortcut...');
    window.api.createShortcut(exePath, shortcutName, screen, remoteLocal, instructorStation)
      .then(res => showMessage(res.message, !res.success));
  });
});
