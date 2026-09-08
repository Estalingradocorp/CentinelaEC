const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron');
const path = require('path');
const { initAdblock } = require('./adblock');

const SITES = [
  { name: 'Palantir Gotham',   url: 'https://www.palantir.com/platforms/gotham/', shortcut: 'CmdOrCtrl+1' },
  { name: 'War Watch',         url: 'https://www.war-watch.com/',                  shortcut: 'CmdOrCtrl+2' },
  { name: 'Conflict Radar 360', url: 'https://www.conflictradar360.com/',        shortcut: 'CmdOrCtrl+3' },
  { name: 'World Monitor',      url: 'https://www.worldmonitor.app/dashboard?lat=20.0000&lon=0.0000&zoom=1.00&view=global&timeRange=7d&layers=conflicts%2Cbases%2Chotspots%2Cnuclear%2Csanctions%2Cweather%2CcanadaAlerts%2Ceconomic%2Cwaterways%2Coutages%2Cmilitary%2Cnatural', shortcut: 'CmdOrCtrl+4' },
  { name: 'EC NEWS',            url: 'https://nicotips27.github.io/ECnews/',                      shortcut: 'CmdOrCtrl+5' },
  { name: 'EC Terminal Data',  url: 'https://nicotips27.github.io/Estalingrado-corp-Terminal-data/', shortcut: 'CmdOrCtrl+6' },
  { name: 'Radio Garden',      url: 'https://radio.garden/',                                   shortcut: 'CmdOrCtrl+7' },
  { name: 'EC Send Pro',       url: 'https://estalingradocorp.github.io/ECsendpro/',            shortcut: 'CmdOrCtrl+8' },
  { name: 'Famelack',          url: 'https://famelack.com/',                                    shortcut: 'CmdOrCtrl+9' }
];

let currentSite = -1; // -1 = pantalla de inicio
const SPLASH_MIN_MS = 2600;
let mainWindow = null;
let splashWindow = null;

function allowedOrigin(url) {
  try {
    return SITES.some(s => new URL(url).origin === new URL(s.url).origin);
  } catch { return false; }
}

function buildMenu() {
  const siteMenuItems = SITES.map((s, i) => ({
    label: s.name,
    accelerator: s.shortcut,
    type: 'radio',
    checked: i === currentSite,
    click: () => navigateTo(i)
  }));

  const menu = Menu.buildFromTemplate([
    {
      label: 'Centinela',
      submenu: [
        { label: 'Inicio', accelerator: 'CmdOrCtrl+H', click: () => goHome() },
        { type: 'separator' },
        ...siteMenuItems,
        { type: 'separator' },
        { label: 'Salir', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { label: 'Recargar', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.webContents.reload() },
        { label: 'DevTools', accelerator: 'F12',         click: () => mainWindow?.webContents.toggleDevTools() },
        { type: 'separator' },
        { label: 'Pantalla completa', accelerator: 'F11', click: () => {
          if (!mainWindow) return;
          mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }}
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        { label: 'Sobre el programa', accelerator: 'F1', click: showAbout },
        { type: 'separator' },
        ...SITES.map(s => ({ label: s.name, click: () => shell.openExternal(s.url) }))
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);
}

function showAbout() {
  const { dialog, shell } = require('electron');
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Centinela BETA',
    message: 'Centinela BETA v1.0.0 · Servicio Estalingrado Corp',
    detail: 'Centro de inteligencia global. Monitoreá el mundo, analizá información y seguí acontecimientos en tiempo real desde una única plataforma.\n\nAtajos: Ctrl+1 (Palantir) | Ctrl+2 (War Watch) | Ctrl+3 (Conflict Radar) | Ctrl+4 (World Monitor) | Ctrl+5 (EC News) | Ctrl+6 (EC Terminal Data) | Ctrl+7 (Radio Garden) | Ctrl+8 (EC Send Pro) | Ctrl+9 (Famelack)\n\nWeb: estalingradocorp.qzz.io',
    buttons: ['Cerrar', 'Visitar Estalingrado Corp'],
    cancelId: 0,
    defaultId: 0
  }).then(({ response }) => {
    if (response === 1) shell.openExternal('https://estalingradocorp.qzz.io/');
  });
}

function reloadPage() { mainWindow?.webContents.reload(); }
function toggleDevTools() { mainWindow?.webContents.toggleDevTools(); }
function toggleFullScreen() {
  if (!mainWindow) return;
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
}

function goHome() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  currentSite = -1;
  buildMenu();
  mainWindow.setTitle('Centinela BETA — Inicio');
  mainWindow.loadFile(path.join(__dirname, 'home.html'));
}

function navigateTo(index) {
  if (!mainWindow || mainWindow.isDestroyed() || index < 0 || index >= SITES.length) return;
  currentSite = index;
  mainWindow.loadURL(SITES[index].url);
  buildMenu();
  mainWindow.setTitle(`Centinela BETA — ${SITES[index].name}`);
}

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 460,
    height: 520,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    hasShadow: false,
    skipTaskbar: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.setAlwaysOnTop(true, 'screen-saver');
  splashWindow.on('closed', () => { splashWindow = null; });
}

function createMain() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: false,
    icon: path.join(__dirname, 'icon.png'),
    title: 'Centinela BETA — Inicio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'home.html'));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (allowedOrigin(url)) {
      mainWindow.loadURL(url);
      return { action: 'deny' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!allowedOrigin(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  const reveal = () => {
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  };

  const started = Date.now();
  mainWindow.webContents.once('did-finish-load', () => {
    const wait = Math.max(0, SPLASH_MIN_MS - (Date.now() - started));
    setTimeout(reveal, wait);
  });

  setTimeout(reveal, SPLASH_MIN_MS + 12000);

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
  });
}

app.whenReady().then(async () => {
  await initAdblock();
  buildMenu();
  createSplash();
  createMain();

  ipcMain.on('navigate', (event, index) => {
    if (index === -1) goHome(); else navigateTo(index);
  });

  ipcMain.handle('get-current', () => currentSite);

  ipcMain.on('open-external', (event, url) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) shell.openExternal(url);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMain();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});