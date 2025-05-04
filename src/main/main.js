const { app, BrowserWindow, ipcMain } = require('electron');
const { exec } = require('child_process');
const os = require('os');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 500,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      enableRemoteModule: false
    }
  });
  win.loadFile(path.join(__dirname, '../../public/index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// IPC: List network interfaces
ipcMain.handle('get-interfaces', async () => Object.keys(os.networkInterfaces()));

// IPC: Get current config for an interface
ipcMain.handle('get-current-config', async (event, iface) => {
  return new Promise(resolve => {
    const cmd = `netsh interface ip show config name="${iface}"`;
    exec(cmd, (err, stdout) => {
      if (err) return resolve({ error: err.message });
      const ipMatch = stdout.match(/IP Address\s*:\s*([0-9.]+)/);
      const maskMatch = stdout.match(/Subnet Prefix\s*:\s*([0-9.]+)\/\d+/i);
      resolve({
        ip: ipMatch ? ipMatch[1] : 'N/A',
        mask: maskMatch ? maskMatch[1] : 'N/A'
      });
    });
  });
});

// IPC: Apply static IP
ipcMain.handle('set-config', async (event, iface, ip, mask) => {
  return new Promise((resolve, reject) => {
    const cmd = `netsh interface ip set address name="${iface}" static ${ip} ${mask}`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error(`Error setting static IP: ${stderr}`);
        return resolve({ success: false, message: stderr.trim() });
      }
      console.log(`Successfully set static IP: ${stdout}`);
      resolve({ success: true, message: `Static IP set: ${ip} / ${mask}` });
    });
  });
});

// IPC: Reset to DHCP
ipcMain.handle('reset-config', async (event, iface) => {
  return new Promise((resolve, reject) => {
    const cmd = `netsh interface ip set address name="${iface}" dhcp`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error(`Error resetting to DHCP: ${stderr}`);
        return resolve({ success: false, message: stderr.trim() });
      }
      console.log(`Successfully reset to DHCP: ${stdout}`);
      resolve({ success: true, message: `Reset ${iface} to DHCP` });
    });
  });
});
