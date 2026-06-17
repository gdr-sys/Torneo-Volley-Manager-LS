/* Entry point — avvio applicazione con Firebase */
'use strict';

function render() {
  try {
    const root = document.getElementById('root');
    if (!root) return;
    const scrollY = window.scrollY; // salva posizione scroll
    if (view === 'home')              root.innerHTML = renderHome();
    else if (view === 'torneo-setup') root.innerHTML = renderTorneoSetup();
    else if (view === 'torneo')       root.innerHTML = renderTorneo();
    window.scrollTo(0, scrollY); // ripristina posizione scroll
  } catch(e) {
    console.error('Render error:', e);
    const root = document.getElementById('root');
    if (root) root.innerHTML = `<div class="card" style="color:#dc2626;padding:1rem">
      <p><strong>Errore:</strong> ${e.message}</p>
      <button class="bp bsm" onclick="location.reload()" style="margin-top:8px">Ricarica</button>
    </div>`;
  }
}

// lload è gestita da Firebase in index.html — qui non fare nulla
function lload() {}

// initTheme viene chiamata da index.html dopo il login
function initTheme(){
  try{
    const t=localStorage.getItem('torneo_theme');
    if(t==='dark'){
      isDark=true;
      document.documentElement.setAttribute('data-theme','dark');
      const btn=document.getElementById('themeBtn');
      if(btn)btn.textContent='☀️';
    }
  }catch(e){}
}
