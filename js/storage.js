/* Salvataggio e caricamento localStorage */
'use strict';

function setSyncStatus(s,msg){
  const b=document.getElementById('syncBadge'),d=document.getElementById('syncDot'),t=document.getElementById('syncTxt');
  if(!b)return;
  b.className='sync-badge '+(s==='ok'?'sync-ok':s==='err'?'sync-err':'sync-wait');
  if(d)d.className='dot '+(s==='ok'?'dot-ok':s==='err'?'dot-err':'dot-wait');
  if(t)t.textContent=msg||'Locale';
}

function sv(){
  if(saveTimer)clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{
    const ok=lsv();
    if(ok){setSyncStatus('ok','💾 Salvato');}
    else{setSyncStatus('err','⚠️ Spazio pieno');}
  },300);
}

function lsv(){
  try{
    const json=JSON.stringify(DB);
    // Controlla dimensione (~5MB limite localStorage)
    if(json.length>4*1024*1024){
      console.warn('Dati troppo grandi per localStorage:',Math.round(json.length/1024),'KB');
      // Prova comunque
    }
    localStorage.setItem('torneo_local',json);
    try{new BroadcastChannel('torneo_update').postMessage('update');}catch(e){}
    return true;
  }catch(e){
    console.error('Errore salvataggio localStorage:',e);
    // localStorage pieno: prova a rimuovere le immagini base64 degli sponsor dal salvataggio
    // e mostra avviso
    setSyncStatus('err','⚠️ Spazio esaurito — immagini troppo grandi');
    return false;
  }
}

function lload(){
  try{
    const d=localStorage.getItem('torneo_local');
    if(d){const p=JSON.parse(d);if(p&&p.tornei)DB=p;}
  }catch(e){console.error('Errore caricamento:',e);}
}

function azzeraDB(){
  if(!confirm('Cancellare TUTTI i tornei? Questa operazione non è reversibile.'))return;
  DB={tornei:{}};
  localStorage.removeItem('torneo_local');
  sv();
  goHome();
  alert('Database azzerato.');
}

lload();
