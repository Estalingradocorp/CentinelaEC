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
  getSites: () => ipcRenderer.invoke('get-sites'),
  windowControls: {
    minimize: () => ipcRenderer.send('win-minimize'),
    toggleMaximize: () => ipcRenderer.send('win-maximize-toggle'),
    close: () => ipcRenderer.send('win-close')
  },
  menu: {
    goHome: () => ipcRenderer.send('navigate', -1),
    selectSite: (i) => ipcRenderer.send('navigate', i),
    reload: () => ipcRenderer.send('win-reload'),
    devtools: () => ipcRenderer.send('win-devtools'),
    fullscreen: () => ipcRenderer.send('win-fullscreen'),
    about: () => ipcRenderer.send('win-about'),
    quit: () => ipcRenderer.send('app-quit')
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
    #${TB_ID} .tb-menu-wrap { position: relative; -webkit-app-region: no-drag; margin-left: 10px; }
    #${TB_ID} .tb-menu-btn {
      color: #cfe8ff; background: rgba(46,166,255,.10); border: 1px solid rgba(46,166,255,.25);
      border-radius: 7px; padding: 4px 10px; font-size: 12px; cursor: pointer;
      font-family: "Segoe UI", system-ui, sans-serif; letter-spacing: 1px;
      transition: background .15s ease, border-color .15s ease;
    }
    #${TB_ID} .tb-menu-btn:hover { background: rgba(46,166,255,.22); border-color: rgba(46,166,255,.5); }
    #${TB_ID} .tb-dropdown {
      display: none; position: absolute; top: calc(100% + 8px); left: 0; min-width: 250px;
      background: rgba(8,13,24,0.97); border: 1px solid rgba(46,166,255,.3); border-radius: 10px;
      box-shadow: 0 18px 50px rgba(0,0,0,.6); padding: 6px; z-index: 2147483647;
      font-family: "Segoe UI", system-ui, sans-serif;
    }
    #${TB_ID} .tb-dropdown.open { display: block; animation: tbdrop .14s ease; }
    @keyframes tbdrop { from { opacity: 0; transform: translateY(-6px);} to { opacity:1; transform: translateY(0);} }
    #${TB_ID} .tb-item {
      padding: 8px 12px; border-radius: 7px; color: #cfe8ff; font-size: 12.5px;
      cursor: pointer; display: flex; align-items: center; gap: 8px;
      transition: background .12s ease;
    }
    #${TB_ID} .tb-item:hover { background: rgba(46,166,255,.18); }
    #${TB_ID} .tb-item .kbd {
      margin-left: auto; font-size: 10.5px; color: #7f9abf; font-family: Consolas, monospace;
    }
    #${TB_ID} .tb-item.quit { color: #ff8080; }
    #${TB_ID} .tb-item.quit:hover { background: rgba(255,93,93,.16); }
    #${TB_ID} .tb-sep { height: 1px; margin: 5px 8px; background: rgba(46,166,255,.2); }
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

  // ---- Menú (recupera las opciones del menú nativo) ----
  const menuWrap = document.createElement('div');
  menuWrap.className = 'tb-menu-wrap';
  const menuBtn = document.createElement('div');
  menuBtn.className = 'tb-menu-btn';
  menuBtn.textContent = '☰ Menú';
  const dropdown = document.createElement('div');
  dropdown.className = 'tb-dropdown';
  menuWrap.appendChild(menuBtn);
  menuWrap.appendChild(dropdown);

  const addMenuGroup = (label, items) => {
    if (label) {
      const h = document.createElement('div');
      h.textContent = label;
      h.style.cssText = 'padding:6px 12px 2px;font-size:10px;letter-spacing:2px;color:#7f9abf;text-transform:uppercase;';
      dropdown.appendChild(h);
    }
    items.forEach(it => {
      if (it === 'sep') { dropdown.appendChild(document.createElement('div')).className = 'tb-sep'; return; }
      const el = document.createElement('div');
      el.className = 'tb-item' + (it.quit ? ' quit' : '');
      el.textContent = it.label;
      if (it.kbd) {
        const k = document.createElement('span');
        k.className = 'kbd';
        k.textContent = it.kbd;
        el.appendChild(k);
      }
      el.addEventListener('click', () => { dropdown.classList.remove('open'); it.action(); });
      dropdown.appendChild(el);
    });
  };

  addMenuGroup('Centinela', [
    { label: 'Inicio', kbd: 'Ctrl+H', action: () => ipcRenderer.send('navigate', -1) },
    { label: 'Salir', kbd: 'Ctrl+Q', quit: true, action: () => ipcRenderer.send('app-quit') }
  ]);

  // Sitios bajo el grupo Centinela (se cargan de forma asíncrona)
  const sitesHeader = document.createElement('div');
  sitesHeader.textContent = 'Plataformas';
  sitesHeader.style.cssText = 'padding:6px 12px 2px;font-size:10px;letter-spacing:2px;color:#7f9abf;text-transform:uppercase;';
  dropdown.appendChild(sitesHeader);
  ipcRenderer.invoke('get-sites').then(sites => {
    sites.forEach(s => {
      const el = document.createElement('div');
      el.className = 'tb-item';
      el.textContent = s.name;
      const k = document.createElement('span');
      k.className = 'kbd';
      k.textContent = 'Ctrl+' + (s.index + 1);
      el.appendChild(k);
      el.addEventListener('click', () => { dropdown.classList.remove('open'); ipcRenderer.send('navigate', s.index); });
      dropdown.appendChild(el);
    });
  });

  addMenuGroup('Ver', [
    { label: 'Recargar', kbd: 'Ctrl+R', action: () => ipcRenderer.send('win-reload') },
    { label: 'DevTools', kbd: 'F12', action: () => ipcRenderer.send('win-devtools') },
    'sep',
    { label: 'Pantalla completa', kbd: 'F11', action: () => ipcRenderer.send('win-fullscreen') }
  ]);

  addMenuGroup('Ayuda', [
    { label: 'Sobre el programa', kbd: 'F1', action: () => ipcRenderer.send('win-about') }
  ]);

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== menuBtn) dropdown.classList.remove('open');
  });

  const grip = document.createElement('div');
  grip.className = 'tb-grip';

  bar.appendChild(style);
  bar.appendChild(lights);
  bar.appendChild(menuWrap);
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