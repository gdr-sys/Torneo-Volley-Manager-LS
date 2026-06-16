/* Salvataggio su Firebase Firestore */
'use strict';

let saveTimer = null;

function setSyncStatus(s, msg) {
  const b = document.getElementById('syncBadge');
  const d = document.getElementById('syncDot');
  const t = document.getElementById('syncTxt');
  if (!b) return;
  b.className = 'sync-badge ' + (s === 'ok' ? 'sync-ok' : s === 'err' ? 'sync-err' : 'sync-wait');
  if (d) d.className = 'dot ' + (s === 'ok' ? 'dot-ok' : s === 'err' ? 'dot-err' : 'dot-wait');
  if (t) t.textContent = msg || 'Connesso';
}

function sv() {
  if (saveTimer) clearTimeout(saveTimer);
  setSyncStatus('wait', '💾 Salvataggio...');
  saveTimer = setTimeout(async () => {
    try {
      const uid = window._currentUid;
      if (!uid) { setSyncStatus('err', '⚠️ Non connesso'); return; }
      const db = window._fbDb;
      const docRef = window._fbDoc(db, 'utenti', uid, 'dati', 'tornei');
      await window._fbSetDoc(docRef, DB);
      setSyncStatus('ok', '● Salvato');
      // Notifica live
      try { new BroadcastChannel('torneo_update').postMessage('update'); } catch(e) {}
    } catch(e) {
      console.error('Errore salvataggio Firebase:', e);
      setSyncStatus('err', '⚠️ Errore salvataggio');
    }
  }, 800);
}

// lload non serve più — i dati vengono caricati in index.html
function lload() {
  // Caricamento gestito da Firebase in index.html
}

// Monitoraggio offline
window.addEventListener('online', () => setSyncStatus('ok', '● Connesso'));
window.addEventListener('offline', () => setSyncStatus('err', '📵 Offline'));

function azzeraDB() {
  if (!confirm('Cancellare TUTTI i tornei? Questa operazione non è reversibile.')) return;
  DB = { tornei: {} };
  sv();
  goHome();
  alert('Database azzerato.');
}
