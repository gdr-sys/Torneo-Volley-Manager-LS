/* Entry point — avvio applicazione */
'use strict';

// ============================================================
// RENDER PRINCIPALE
// ============================================================
function render() {
  try {
    const root = document.getElementById('root');
    if (!root) return;
    if (view === 'home')              root.innerHTML = renderHome();
    else if (view === 'torneo-setup') root.innerHTML = renderTorneoSetup();
    else if (view === 'torneo')       root.innerHTML = renderTorneo();
  } catch(e) {
    console.error('Render error:', e);
    const root = document.getElementById('root');
    if (root) root.innerHTML = `<div class="card" style="color:#dc2626">
      <p><strong>Errore:</strong> ${e.message}</p>
      <button class="bp bsm" onclick="location.reload()" style="margin-top:8px">Ricarica</button>
    </div>`;
  }
}

// ============================================================
// AVVIO
// ============================================================
lload();
try { render(); } catch(e) { console.error('Avvio fallito:', e); }
