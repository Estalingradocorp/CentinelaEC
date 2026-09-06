const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('conflictRadar', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome
  }
});

contextBridge.exposeInMainWorld('centinela', {
  selectSite: (index) => ipcRenderer.send('navigate', index),
  getCurrent: () => ipcRenderer.invoke('get-current'),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  windowControls: {
    minimize: () => ipcRenderer.send('win-minimize'),
    toggleMaximize: () => ipcRenderer.send('win-maximize-toggle'),
    close: () => ipcRenderer.send('win-close')
  }
});

// ---- Barra de título estilo macOS ----
const TB_HEIGHT = 40;
const TB_ID = 'centinela-mac-titlebar';
let tbInjected = false;

function injectMacTitlebar() {
  if (tbInjected || !document.body) return;
  if (document.getElementById(TB_ID)) return;

  const bar = document.createElement('div');
  bar.id = TB_ID;

  const style = document.createElement('style');
  style.textContent = `
    #${TB_ID} {
      position: fixed; top: 0; left: 0; right: 0; height: ${TB_HEIGHT}px;
      z-index: 2147483647;
      display: flex; align-items: center;
      background: rgba(6, 10, 18, 0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(46, 166, 255, 0.25);
      box-shadow: 0 1px 10px rgba(0,0,0,0.35);
      font-family: "Segoe UI", system-ui, sans-serif;
      user-select: none;
      -webkit-app-region: drag;
      box-sizing: border-box; padding: 0 14px;
    }
    #${TB_ID} .tb-lights { display: flex; gap: 8px; -webkit-app-region: no-drag; }
    #${TB_ID} .tb-light {
      width: 13px; height: 13px; border-radius: 50%;
      border: 1px solid rgba(0,0,0,0.25);
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; line-height: 1; color: rgba(0,0,0,0.55);
      transition: transform 0.1s ease;
    }
    #${TB_ID} .tb-light:hover { transform: scale(1.12); }
    #${TB_ID} .tb-close { background: #ff5f57; }
    #${TB_ID} .tb-min { background: #febc2e; }
    #${TB_ID} .tb-max { background: #28c840; }
    #${TB_ID} .tb-title {
      flex: 1; text-align: center; color: #cfe8ff; font-size: 12px;
      letter-spacing: 1.5px; font-weight: 600; pointer-events: none;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    #${TB_ID} .tb-grip { width: 70px; -webkit-app-region: drag; }
  `;

  const lights = document.createElement('div');
  lights.className = 'tb-lights';

  const mk = (cls, label, fn) => {
    const b = document.createElement('div');
    b.className = 'tb-light ' + cls;
    b.textContent = label;
    b.addEventListener('click', fn);
    lights.appendChild(b);
    return b;
  };
  mk('tb-close', '', () => ipcRenderer.send('win-close'));
  mk('tb-min', '', () => ipcRenderer.send('win-minimize'));
  mk('tb-max', '', () => ipcRenderer.send('win-maximize-toggle'));

  const title = document.createElement('div');
  title.className = 'tb-title';
  title.textContent = 'Centinela BETA';

  const grip = document.createElement('div');
  grip.className = 'tb-grip';

  bar.appendChild(style);
  bar.appendChild(lights);
  bar.appendChild(title);
  bar.appendChild(grip);
  document.body.appendChild(bar);

  // Ajuste: push down el contenido de páginas locales (inicio/splash)
  const isLocal = location.protocol === 'file:';
  if (isLocal && document.body) {
    const orig = getComputedStyle(document.body).paddingTop;
    document.body.style.paddingTop = (parseFloat(orig || 0) + TB_HEIGHT) + 'px';
  }

  tbInjected = true;
}

function tryInject() {
  if (document.body) {
    injectMacTitlebar();
  } else {
    document.addEventListener('DOMContentLoaded', injectMacTitlebar, { once: true });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tryInject, { once: true });
} else {
  tryInject();
}

// Re-inyectar para SPAs que repintan el body
new MutationObserver(() => {
  if (!document.getElementById(TB_ID)) {
    tbInjected = false;
    injectMacTitlebar();
  }
}).observe(document.documentElement, { childList: true, subtree: true });