window.addEventListener('DOMContentLoaded', () => {
  const ifaceSelect = document.getElementById('iface');
  const curIp = document.getElementById('cur-ip');
  const curMask = document.getElementById('cur-mask');
  const lastOctet = document.getElementById('last-octet');
  const maskInput = document.getElementById('mask');
  const applyBtn = document.getElementById('apply');
  const resetBtn = document.getElementById('reset');
  const message = document.getElementById('message');
  const ipPrefix = document.getElementById('ip-prefix');

  function showMessage(text, isError = false) {
    message.textContent = text;
    message.className = `mt-3 p-2 text-sm text-center rounded-md ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
    message.classList.remove('hidden');
  }

  function validateMask(mask) {
    if (mask.startsWith('/')) {
      const cidr = parseInt(mask.substring(1));
      return !isNaN(cidr) && cidr >= 0 && cidr <= 32;
    }
    
    const octets = mask.split('.');
    if (octets.length !== 4) return false;
    
    for (const octet of octets) {
      const num = parseInt(octet);
      if (isNaN(num) || num < 0 || num > 255) return false;
    }
    
    return true;
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

    if (!validateMask(maskInput.value)) {
      showMessage('Invalid subnet mask. Use format: 255.255.255.0 or /24', true);
      return;
    }

    if (!lastOctet.value || lastOctet.value < 1 || lastOctet.value > 254) {
      showMessage('Last octet must be between 1 and 254', true);
      return;
    }

    showMessage('Applying configuration...');
    const fullIp = `192.168.100.${lastOctet.value}`;
    window.api.setConfig(ifaceSelect.value, fullIp, maskInput.value)
      .then(res => {
        showMessage(res.message, !res.success);
        if (res.success) {
          loadCurrent(ifaceSelect.value);
        }
      })
      .catch(err => showMessage(`Error: ${err.message}`, true));
  });
  
  resetBtn.addEventListener('click', () => {
    if (!ifaceSelect.value) {
      showMessage('Please select a network interface', true);
      return;
    }
    showMessage('Resetting to DHCP...');
    window.api.reset(ifaceSelect.value)
      .then(res => {
        showMessage(res.message, !res.success);
        if (res.success) {
          loadCurrent(ifaceSelect.value);
        }
      })
      .catch(err => showMessage(`Error: ${err.message}`, true));
  });

  maskInput.addEventListener('input', () => {
    if (maskInput.value && !validateMask(maskInput.value)) {
      maskInput.classList.add('border-red-500');
    } else {
      maskInput.classList.remove('border-red-500');
    }
  });

  lastOctet.addEventListener('input', () => {
    if (lastOctet.value && (lastOctet.value < 1 || lastOctet.value > 254)) {
      lastOctet.classList.add('border-red-500');
    } else {
      lastOctet.classList.remove('border-red-500');
    }
  });
});
