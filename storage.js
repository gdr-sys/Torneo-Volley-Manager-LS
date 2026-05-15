/* Salvataggio e caricamento localStorage */
'use strict';

// ============================================================
// FIREBASE
// ============================================================
function setSyncStatus(s,msg){
  const b=document.getElementById('syncBadge'),d=document.getElementById('syncDot'),t=document.getElementById('syncTxt');
  if(!b)return;b.className='sync-badge sync-ok';d.className='dot dot-ok';t.textContent=msg||'Locale';
}
function sv(){
  if(saveTimer)clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{lsv();setSyncStatus('ok','💾 Salvato');},300);
}
function lsv(){try{localStorage.setItem('torneo_local',JSON.stringify(DB));try{new BroadcastChannel('torneo_update').postMessage('update');}catch(e){}}catch(e){}}
function lload(){try{const d=localStorage.getItem('torneo_local');if(d){const p=JSON.parse(d);if(p&&p.tornei)DB=p;}}catch(e){}}
function azzeraDB(){
  if(!confirm('Cancellare TUTTI i tornei e i dati da Firebase? Questa operazione non è reversibile.'))return;
  DB={tornei:{}};
  localStorage.removeItem('torneo_local');
  sv();
  goHome();
  alert('Database azzerato.');
}
lload();
