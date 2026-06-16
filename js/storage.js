/* Salvataggio su Firebase Firestore (compat SDK) */
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
      await window._fbDb
        .collection('utenti').doc(uid)
        .collection('dati').doc('tornei')
        .set(DB);
      setSyncStatus('ok', '● Salvato');
      try { new BroadcastChannel('torneo_update').postMessage('update'); } catch(e) {}
    } catch(e) {
      console.error('Errore salvataggio Firebase:', e);
      setSyncStatus('err', '⚠️ Errore salvataggio');
    }
  }, 800);
}

function lload() {
  // Caricamento gestito da Firebase in index.html
}

window.addEventListener('online',  () => setSyncStatus('ok',  '● Connesso'));
window.addEventListener('offline', () => setSyncStatus('err', '📵 Offline'));

function azzeraDB() {
  if (!confirm('Cancellare TUTTI i tornei? Questa operazione non è reversibile.')) return;
  DB = { tornei: {} };
  sv();
  goHome();
  alert('Database azzerato.');
}

function esportaTuttiTornei() {
  const json = JSON.stringify(DB, null, 2);
  const a = document.createElement('a');
  const data = new Date().toLocaleDateString('it-IT').replace(/[/]/g, '-');
  a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
  a.download = 'backup_tutti_tornei_' + data + '.json';
  a.click();
}

function esportaSingoloTorneo(id) {
  const t = DB.tornei[id]; if (!t) return;
  const json = JSON.stringify({ tornei: { [id]: t } }, null, 2);
  const a = document.createElement('a');
  const data = new Date().toLocaleDateString('it-IT').replace(/[/]/g, '-');
  const nome = (t.nome || 'torneo').replace(/[^a-zA-Z0-9]/g, '_');
  a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
  a.download = nome + '_' + data + '.json';
  a.click();
}
