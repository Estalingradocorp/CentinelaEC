const { app, session } = require('electron');
const fs = require('fs');
const path = require('path');
const { ElectronBlocker } = require('@cliqz/adblocker-electron');

const LISTS = [
  'https://easylist.to/easylist/easylist.txt',
  'https://easylist.to/easylist/easyprivacy.txt'
];

const CACHE_FILE = 'adblock-lists.bin';

function cachePath() {
  return path.join(app.getPath('userData'), CACHE_FILE);
}

async function loadFromCache() {
  try {
    const raw = fs.readFileSync(cachePath());
    const blocker = await ElectronBlocker.deserialize(raw);
    return blocker;
  } catch (e) {
    return null;
  }
}

async function fetchFresh() {
  const blocker = await ElectronBlocker.fromLists(fetch, LISTS, {
    enableCompression: true
  });
  try {
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
    fs.writeFileSync(cachePath(), blocker.serialize());
  } catch (e) {
    console.error('No se pudo guardar la caché de bloqueo:', e.message);
  }
  return blocker;
}

async function initAdblock() {
  try {
    const cached = await loadFromCache();
    if (cached) {
      cached.enableBlockingInSession(session.defaultSession);
      return;
    }
    const fresh = await fetchFresh();
    fresh.enableBlockingInSession(session.defaultSession);
  } catch (e) {
    console.error('Error al iniciar el bloqueo de anuncios:', e.message);
  }
}

module.exports = { initAdblock };