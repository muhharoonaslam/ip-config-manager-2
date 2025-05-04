const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { exec } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 550,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// Validate last octet
function isValidLastOctet(o) {
  const n = Number(o);
  return Number.isInteger(n) && n >= 1 && n <= 254;
}

// IPC: List network interfaces
ipcMain.handle('get-interfaces', async () => Object.keys(os.networkInterfaces()));

// IPC: Get current config for an interface
ipcMain.handle('get-current-config', async (event, iface) => {
  return new Promise(resolve => {
    const cmd = `netsh interface ip show config name="${iface}"`;
    exec(cmd, (err, stdout) => {
      if (err) return resolve({ error: err.message });
      const ipMatch = stdout.match(/IP Address\s*:\s*([0-9.]+)/);
      const maskMatch = stdout.match(/mask\s*([0-9.]+)/i);
      resolve({
        ip: ipMatch ? ipMatch[1] : 'N/A',
        mask: maskMatch ? maskMatch[1] : 'N/A'
      });
    });
  });
});

// IPC: Apply static IP
ipcMain.handle('set-config', async (event, iface, lastOctet, mask) => {
  if (!isValidLastOctet(lastOctet)) return { success: false, message: 'Last octet must be 1-254.' };
  if (!/^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(mask)) return { success: false, message: 'Invalid mask format.' };
  const ip = `192.168.1.${lastOctet}`;
  try {
    const cmd = `netsh interface ip set address "${iface}" static ${ip} ${mask}`;
    await new Promise((res, rej) => exec(cmd, (e, so, se) => e ? rej(se) : res(so)));
    return { success: true, message: `Static IP set: ${ip} / ${mask}` };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
});

// IPC: Reset to DHCP
ipcMain.handle('reset-config', async (event, iface) => {
  try {
    const cmd = `netsh interface ip set address "${iface}" dhcp`;
    await new Promise((res, rej) => exec(cmd, (e, so, se) => e ? rej(se) : res(so)));
    return { success: true, message: `Reset ${iface} to DHCP` };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
});

// IPC: Create shortcut
ipcMain.handle('create-shortcut', async (event, exePath, shortcutName, screen, remoteLocal, instructorStation) => {
  const args = [];

  // Screen
  args.push(`/V${screen}`);

  // Remote Local
  args.push(`/REMOTE${remoteLocal}LOCAL`);

  // Instructor Station
  if (instructorStation) {
    args.push('/I');
  }

  const shortcutPath = path.join(os.homedir(), 'Desktop', `${shortcutName}.lnk`);
  const powershellScript = `
    $WScriptShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WScriptShell.CreateShortcut("${shortcutPath}")
    $Shortcut.TargetPath = "${exePath}"
    $Shortcut.Arguments = "${args.join(' ')}"
    $Shortcut.Save()
  `;

  try {
    const cmd = `powershell -Command "${powershellScript}"`;
    await new Promise((res, rej) => exec(cmd, (e, so, se) => e ? rej(se) : res(so)));
    return { success: true, message: `Shortcut created: ${shortcutName}` };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
});
