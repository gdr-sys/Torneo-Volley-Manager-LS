/* Salvataggio e caricamento localStorage */
'use strict';

function setSyncStatus(s,msg){
  const b=document.getElementById('syncBadge'),d=document.getElementById('syncDot'),t=document.getElementById('syncTxt');
  if(!b)return;
  b.className='sync-badge '+(s==='ok'?'sync-ok':s==='err'?'sync-err':'sync-wait');
  if(d)d.className='dot '+(s==='ok'?'dot-ok':s==='err'?'dot-err':'dot-wait');
  if(t)t.textContent=msg||'Locale';
}

// Monitora connessione
window.addEventListener('online',()=>setSyncStatus('ok','🌐 Online'));
window.addEventListener('offline',()=>setSyncStatus('err','📵 Offline — dati salvati localmente'));

function sv(){
  if(saveTimer)clearTimeout(saveTimer);
  // Mostra "Salvataggio..." durante il debounce
  setSyncStatus('wait','💾 Salvataggio...');
  saveTimer=setTimeout(()=>{
    const ok=lsv();
    if(ok){
      setSyncStatus('ok','💾 Salvato');
      // Mostra dimensione dati
      try{
        const kb=Math.round(localStorage.getItem('torneo_local')?.length/1024)||0;
        const pct=Math.round(kb/5000*100);
        if(pct>70){setSyncStatus('wait',`⚠️ Spazio: ${pct}% usato (${kb}KB)`);}
      }catch(e){}
    }else{
      setSyncStatus('err','⚠️ Errore salvataggio');
      showStorageError();
    }
  },300);
}

function showStorageError(){
  // Mostra banner di errore nella pagina
  let banner=document.getElementById('_storageBanner');
  if(!banner){
    banner=document.createElement('div');
    banner.id='_storageBanner';
    banner.style.cssText='position:fixed;top:0;left:0;right:0;background:#dc2626;color:#fff;padding:10px 16px;font-size:13px;font-weight:600;z-index:9999;display:flex;justify-content:space-between;align-items:center;';
    document.body.appendChild(banner);
  }
  const kb=Math.round(JSON.stringify(DB).length/1024);
  banner.innerHTML=`⚠️ Errore salvataggio — Spazio esaurito (${kb}KB). Esporta il torneo e rimuovi le immagini più grandi.
    <button onclick="document.getElementById('_storageBanner').remove()" style="background:rgba(255,255,255,.2);border:none;color:#fff;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px">✕</button>`;
  setTimeout(()=>{banner?.remove();},10000);
}

function lsv(){
  try{
    const json=JSON.stringify(DB);
    const kb=Math.round(json.length/1024);
    if(json.length>4.5*1024*1024){
      // Troppo grande — prova a salvare senza immagini base64
      console.warn('Dati grandi:',kb,'KB — tentativo salvataggio senza immagini temporanee');
    }
    localStorage.setItem('torneo_local',json);
    try{new BroadcastChannel('torneo_update').postMessage('update');}catch(e){}
    return true;
  }catch(e){
    console.error('Errore salvataggio localStorage:',e);
    setSyncStatus('err','⚠️ Spazio esaurito');
    return false;
  }
}

function lload(){
  try{
    const d=localStorage.getItem('torneo_local');
    if(d){const p=JSON.parse(d);if(p&&p.tornei)DB=p;}
  }catch(e){console.error('Errore caricamento:',e);}
}

function esportaTuttiTornei(){
  const json=JSON.stringify(DB,null,2);
  const a=document.createElement('a');
  const data=new Date().toLocaleDateString('it-IT').replace(/[/]/g,'-');
  a.href='data:application/json;charset=utf-8,'+encodeURIComponent(json);
  a.download='backup_tutti_tornei_'+data+'.json';
  a.click();
}
function esportaSingoloTorneo(id){
  const t=DB.tornei[id];if(!t)return;
  const json=JSON.stringify({tornei:{[id]:t}},null,2);
  const a=document.createElement('a');
  const data=new Date().toLocaleDateString('it-IT').replace(/[/]/g,'-');
  const nome=(t.nome||'torneo').replace(/[^a-zA-Z0-9]/g,'_');
  a.href='data:application/json;charset=utf-8,'+encodeURIComponent(json);
  a.download=nome+'_'+data+'.json';
  a.click();
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
