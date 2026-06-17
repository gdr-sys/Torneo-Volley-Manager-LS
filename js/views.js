// v=20260617-fix-societa
/* Render: Home, Wizard, Torneo, Società, Setup, Categoria, Builder */
'use strict';

// ============================================================
// HELPERS RENDER
// ============================================================
function escV(s){return(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function renderBadgeCat(catId,extra){
  const st=`font-size:11px;padding:3px 10px;border-radius:20px;font-weight:600;display:inline-block;${catBadgeStyle(catId)}${extra||''}`;
  const em=catEmoji(catId);
  return`<span style="${st}">${em?em+' ':''}${catLabel(catId)}</span>`;
}

// ============================================================
// VIEW: HOME
// ============================================================
function renderHome(){
  const ids=Object.keys(DB.tornei||{}).sort((a,b)=>{
    const ta=DB.tornei[a],tb=DB.tornei[b];
    // Prima attivi, poi archiviati; dentro ogni gruppo per data decrescente
    if(!!ta.archiviato!==!!tb.archiviato)return ta.archiviato?1:-1;
    return(tb.createdAt||0)-(ta.createdAt||0);
  });
  // Info spazio localStorage
  let storageInfo='';
  try{
    const used=Object.keys(localStorage).reduce((s,k)=>s+(localStorage.getItem(k)||'').length,0);
    const kb=Math.round(used/1024);
    const pct=Math.round(kb/5000*100);
    const col=pct>80?'#dc2626':pct>60?'#854d0e':'var(--txt2)';
    storageInfo=`<span style="font-size:11px;color:${col}">💾 ${kb}KB usati${pct>60?' ('+pct+'%)':''}</span>`;
  }catch(e){}

  let html=`<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:8px">
      <div class="card-title" style="margin-bottom:0">🏐 Gestione Tornei</div>
      ${storageInfo}
    </div>
    <div style="display:flex;gap:8px;margin-bottom:1rem;flex-wrap:wrap">
      <button class="bp" style="flex:1;padding:12px;font-size:15px;min-width:160px" onclick="startNuovoTorneo()">+ Nuovo torneo</button>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:1.5rem">
      <button style="flex:1;padding:9px;font-size:13px" onclick="importTorneo()">⬆ Importa</button>
      <button style="flex:1;padding:9px;font-size:13px" onclick="esportaTuttiTornei()">⬇ Esporta</button>
      <button style="flex:1;padding:9px;font-size:13px" class="bd" onclick="azzeraDB()">🗑 Azzera</button>
    </div>
    ${ids.length>3?`<div style="margin-bottom:10px">
      <input type="text" id="cercaTorneo" placeholder="🔍 Cerca torneo..." style="font-size:13px"
        oninput="renderPreserveScroll()" value="">
    </div>`:''}
    ${(()=>{
      const attivi=ids.filter(id=>!DB.tornei[id].archiviato);
      const archiviati=ids.filter(id=>DB.tornei[id].archiviato);
      return attivi.length+archiviati.length > 0 ? `<div class="sec">Tornei attivi (${attivi.length})</div>` : '';
    })()}
    ${ids.filter(id=>{
      const cerca=document.getElementById('cercaTorneo')?.value?.toLowerCase()||'';
      const t=DB.tornei[id];
      return !t.archiviato&&(!cerca||t.nome.toLowerCase().includes(cerca));
    }).map(id=>{
      const t=DB.tornei[id];const nSoc=t.societa?.length||0;
      const date=t.createdAt?new Date(t.createdAt).toLocaleDateString('it-IT'):'';
      const isLive=getLiveId()===id;
      const isArch=!!t.archiviato;
      const cats2=t.categorie||[];
      const totGir=cats2.reduce((s,cat)=>(cat.fasi||[]).reduce((s2,f)=>s2+(f.gironi||[]).length,s),0);
      const totPart=cats2.reduce((s,cat)=>(cat.fasi||[]).reduce((s2,f)=>(f.gironi||[]).reduce((s3,g)=>s3+g.partite.filter(p=>p.s1h!=='').length,s2),s),0);
      const meta=[nSoc+' soc.',cats2.length+' cat.',totGir?totGir+' gir.':'',totPart?totPart+' ris.':'',date].filter(Boolean).join(' · ');
      return`<div class="torneo-item${isLive?' active-t':''}" onclick="openTorneo('${id}')" style="${isArch?'opacity:.65':''}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px">
          <div style="min-width:0;flex:1">
            <div style="font-weight:700;font-size:15px;color:${isLive?'#166534':'var(--txt)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${isLive?'🔴 ':isArch?'📁 ':''}${t.nome}
            </div>
            <div style="font-size:11px;color:${isLive?'#166534':'var(--txt2)'};margin-top:3px">${meta}</div>
          </div>
          ${isLive
            ?`<span style="font-size:11px;background:#dcfce7;color:#166534;padding:4px 10px;border-radius:6px;font-weight:600;white-space:nowrap;flex-shrink:0">● Live</span>`
            :`<button class="bsm" style="background:#dcfce7;color:#166534;border-color:#86efac;font-size:11px;white-space:nowrap;flex-shrink:0" onclick="event.stopPropagation();setTorneoLive('${id}')">▶ Live</button>`}
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="bxsm" onclick="event.stopPropagation();esportaSingoloTorneo('${id}')">⬇ Esporta</button>
          <button class="bxsm" onclick="event.stopPropagation();rinominaTorneo('${id}')">✏️ Rinomina</button>
          <button class="bxsm" onclick="event.stopPropagation();archiviaToggle('${id}')">${t.archiviato?'📂 Riattiva':'📁 Archivia'}</button>
          <button class="bxsm" onclick="event.stopPropagation();duplicaTorneo('${id}')">📋 Duplica</button>
          <button class="bxsm bd" onclick="event.stopPropagation();eliminaTorneo('${id}')">✕ Elimina</button>
        </div>
      </div>`;
    }).join('')}
    ${!ids.length?`<p style="text-align:center;color:var(--txt2);font-size:13px;padding:1rem">Nessun torneo. Creane uno!</p>`:''}

    ${(()=>{
      const archiviati=ids.filter(id=>DB.tornei[id].archiviato);
      if(!archiviati.length)return'';
      const cerca=document.getElementById('cercaTorneo')?.value?.toLowerCase()||'';
      const filtrati=archiviati.filter(id=>!cerca||DB.tornei[id].nome.toLowerCase().includes(cerca));
      if(!filtrati.length)return'';
      return`<div style="margin-top:1rem">
        <div class="sec" style="display:flex;align-items:center;gap:8px;cursor:pointer" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
          📁 Tornei archiviati (${filtrati.length}) <span style="font-size:11px">▼</span>
        </div>
        <div style="display:none">
          ${filtrati.map(id=>{
            const t=DB.tornei[id];
            const date=t.createdAt?new Date(t.createdAt).toLocaleDateString('it-IT'):'';
            return`<div class="torneo-item" style="opacity:.6" onclick="openTorneo('${id}')">
              <div>
                <div class="torneo-nome" style="color:var(--txt)">${t.nome} <span style="font-size:11px;background:var(--info);color:var(--txt2);padding:1px 8px;border-radius:10px">📁 Archiviato</span></div>
                <div class="torneo-meta" style="color:var(--txt2)">${date}</div>
              </div>
              <div style="display:flex;gap:6px;align-items:center">
                <button class="bsm" onclick="event.stopPropagation();archiviaToggle('${id}')" title="Riattiva">📂 Riattiva</button>
                <button class="bsm" onclick="event.stopPropagation();duplicaTorneo('${id}')">📋</button>
                <button class="bsm bd" onclick="event.stopPropagation();eliminaTorneo('${id}')">✕</button>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    })()}
  </div>`;
  return html;
}

function openTorneo(id){
  currentTorneoId=id;view='torneo';localCat=null;builderState=null;socEditState=null;IC={};window._catView={};window._iscrizioniLoaded=false;window._iscrizioniAttesa=[];
  const t=DB.tornei[id];
  document.getElementById('torneoNomeHdr').textContent=t.nome;
  getCats(); // migrazione vecchio formato se necessario
  // Assicura fase1 per ogni categoria
  let needSave=false;
  for(const cat of getCats()){
    if(!Array.isArray(cat.fasi))cat.fasi=[];
    if(!cat.fasi.length){cat.fasi.push({id:uid(),label:'Fase 1',gironi:[]});needSave=true;}
  }
  // Ripristina ultima tab per questo torneo (sessionStorage = per sessione)
  try{
    const last=sessionStorage.getItem('lastTab_'+id);
    const cats=getCats();
    const valide=[...cats.map(cc=>cc.id),'admin','societa','paginaLive'];
    localCat=(last&&valide.includes(last))?last:cats[0]?.id||null;
  }catch(e){localCat=getCats()[0]?.id||null;}
  if(needSave)sv();
  render();
}
function eliminaTorneo(id){if(!confirm('Eliminare questo torneo?'))return;delete DB.tornei[id];sv();render();}
function setTorneoLive(id){
  if(DB.tornei[id]?.archiviato){alert('Riattiva il torneo prima di metterlo live.');return;}
  localStorage.setItem('torneo_live_id',id);
  if(window._currentUid){
    localStorage.setItem('torneo_live_uid',window._currentUid);
    // Scrive su Firestore il torneo live — leggibile da chiunque
    if(window._fbDb){
      window._fbDb.collection('live_pubblica').doc('stato').set({
        uid: window._currentUid,
        torneoId: id,
        aggiornatoAt: Date.now()
      }).catch(e=>console.error('Errore set live:',e));
    }
  }
  render();
}
function getLiveId(){return localStorage.getItem('torneo_live_id');}
function rinominaTorneo(id){
  const t=DB.tornei[id];if(!t)return;
  const nome=prompt('Nuovo nome per il torneo:',t.nome);
  if(!nome||!nome.trim())return;
  t.nome=nome.trim();
  if(currentTorneoId===id)document.getElementById('torneoNomeHdr').textContent=t.nome;
  sv();render();
}
function archiviaToggle(id){
  const t=DB.tornei[id];if(!t)return;
  t.archiviato=!t.archiviato;
  if(t.archiviato&&getLiveId()===id){localStorage.removeItem('torneo_live_id');}
  sv();render();
}
function duplicaTorneo(id){const t=DB.tornei[id];const newId=uid();DB.tornei[newId]=JSON.parse(JSON.stringify(t));DB.tornei[newId].nome=t.nome+' (copia)';DB.tornei[newId].createdAt=Date.now();sv();render();}

// ============================================================
// WIZARD NUOVO TORNEO
// ============================================================
let wizardState=null;

function startNuovoTorneo(){
  // Categorie di default clonate per il wizard
  wizardState={step:1,nome:'',societa:[],nuovaSocNome:'',
    categorie:CAT_DEFAULT.map(c=>({...c,id:c.id}))};
  view='torneo-setup';render();
}

function renderTorneoSetup(){
  const w=wizardState;
  const steps=[w.step>=1,w.step>=2,w.step>=3];
  let html=`<div class="step-indicator">${steps.map((d,i)=>`<div class="step${d?' done':''} ${w.step===i+1?' current':''}"></div>`).join('')}</div>`;

  if(w.step===1){
    html+=`<div class="card">
      <div class="card-title">Nuovo torneo — Nome</div>
      <label style="font-size:13px;color:var(--txt2);display:block;margin-bottom:6px">Nome del torneo</label>
      <input type="text" id="torneoNomeInput" value="${escV(w.nome)}" placeholder="Es: Torneo Primavera 2025" style="margin-bottom:1rem" oninput="wizardState.nome=this.value">
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button onclick="goHome()">Annulla</button>
        <button class="bp" onclick="wizardStep2()">Avanti →</button>
      </div>
    </div>`;

  } else if(w.step===2){
    // Step 2: categorie
    html+=`<div class="card">
      <div class="card-title">Nuovo torneo — Categorie</div>
      <p style="font-size:13px;color:var(--txt2);margin-bottom:1rem">
        Definisci le categorie di gioco. Puoi rinominarle, cambiare colore/emoji, riordinarle o aggiungerne di nuove.
      </p>
      ${w.categorie.map((cat,ci)=>`
      <div style="border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <div style="display:flex;gap:2px">
          ${ci>0?`<button class="bxsm" onclick="wizardSalvaNomi();wizardMoveCat(${ci},-1)">↑</button>`:'<span style="width:26px"></span>'}
          ${ci<w.categorie.length-1?`<button class="bxsm" onclick="wizardSalvaNomi();wizardMoveCat(${ci},1)">↓</button>`:'<span style="width:26px"></span>'}
        </div>
        <select style="width:60px;font-size:18px;padding:4px 2px;text-align:center" onchange="wizardState.categorie[${ci}].emoji=this.value">
          <option value="${cat.emoji?'':''}">— </option>
          ${['⬜','🟩','🟥','🟣','🟠','🔵','🟡','⚫','🟤','🔴','⚪'].map(e=>`<option value="${e}"${cat.emoji===e?' selected':''}>${e}</option>`).join('')}
        </select>
        <input type="text" value="${escV(cat.nome)}" placeholder="Nome categoria"
          data-cat-nome-idx="${ci}"
          style="flex:1;font-weight:600;min-width:100px" oninput="wizardState.categorie[${ci}].nome=this.value">
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          ${COLORI_DISPONIBILI.map(col=>`<button onclick="wizardSalvaNomi();wizardState.categorie[${ci}].colore='${col.hex}';render()"
            style="width:22px;height:22px;border-radius:50%;background:${col.hex};border:3px solid ${cat.colore===col.hex?'var(--txt)':'transparent'};cursor:pointer;padding:0"></button>`).join('')}
        </div>
        ${w.categorie.length>1?`<button class="bxsm bd" onclick="wizardSalvaNomi();wizardDelCat(${ci})">✕</button>`:''}
      </div>`).join('')}
      <button class="bsm" onclick="wizardAddCat()" style="margin-bottom:1.5rem">+ Aggiungi categoria</button>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button onclick="wizardState.step=1;render()">← Indietro</button>
        <button class="bp" onclick="wizardStep3()">Avanti →</button>
      </div>
    </div>`;

  } else if(w.step===3){
    // Step 3: società e squadre
    html+=`<div class="card">
      <div class="card-title">Nuovo torneo — Società e squadre</div>
      <p style="font-size:13px;color:var(--txt2);margin-bottom:1rem">Inserisci le società e il numero di squadre per ogni categoria. Lascia 0 se la società non partecipa in quella categoria.</p>
      <div style="background:var(--info);border-radius:8px;padding:8px 12px;margin-bottom:1rem;font-size:12px;color:var(--txt2)">
        📌 Categorie: ${w.categorie.map(c=>`<span style="font-size:11px;padding:2px 8px;border-radius:10px;margin:2px;display:inline-block;background:${c.colore}22;color:${c.colore};border:1px solid ${c.colore}44">${c.emoji?c.emoji+' ':''}${c.nome}</span>`).join('')}
        <button class="bxsm" style="margin-left:8px" onclick="wizardState.step=2;render()">✏️ Modifica</button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:1rem;flex-wrap:wrap">
        <input type="text" id="nuovaSocInput" placeholder="Nome società" style="flex:1" value="${escV(w.nuovaSocNome)}"
          oninput="wizardState.nuovaSocNome=this.value" onkeydown="if(event.key==='Enter')aggiungiSoc()">
        <button class="bp bsm" onclick="aggiungiSoc()">+ Aggiungi</button>
      </div>
      ${w.societa.length?`
      <div class="sec">Società inserite</div>
      ${w.societa.map((s,si)=>`
      <div style="border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:8px;background:var(--card)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:15px">${escV(s.nome)}</span>
          <button class="bd bxsm" onclick="rimuoviSoc(${si})">✕ Rimuovi</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(${w.categorie.length},1fr);gap:6px">
          ${w.categorie.map(cat=>`
          <div style="background:var(--info);border-radius:8px;padding:8px;text-align:center">
            <div style="font-size:10px;font-weight:700;margin-bottom:6px">${renderBadgeCat(cat.id)}</div>
            <div style="font-size:10px;color:var(--txt2);margin-bottom:3px">🏐 Squadre</div>
            <input type="number" min="0" max="20" value="${s.sqPerCat[cat.id]||0}"
              style="width:100%;text-align:center;padding:5px 2px;font-size:18px;font-weight:700"
              oninput="setSocCat(${si},'${cat.id}',parseInt(this.value)||0);renderPreserveScroll()">
            <div style="font-size:10px;color:var(--txt2);margin:6px 0 3px">🧒 Bambini</div>
            <input type="number" min="0" max="999" value="${s.bambini[cat.id]||0}"
              style="width:100%;text-align:center;padding:5px 2px;font-size:18px;font-weight:700"
              oninput="setSocBambini(${si},'${cat.id}',parseInt(this.value)||0);renderPreserveScroll()">
          </div>`).join('')}
        </div>
      </div>`).join('')}
      <div style="background:var(--info);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--txt2);margin-bottom:1rem">
        <strong>Riepilogo per categoria:</strong><br>
        ${w.categorie.map(cat=>{
          const tot=w.societa.reduce((s,x)=>s+(x.sqPerCat[cat.id]||0),0);
          const totB=w.societa.reduce((s,x)=>s+(x.bambini[cat.id]||0),0);
          return`${renderBadgeCat(cat.id,'margin:2px')} <span style="font-size:11px">${tot} sq · 🧒 ${totB}</span>`;
        }).join(' ')}
      </div>
      `:`<p style="color:var(--txt2);font-size:13px;text-align:center;padding:1rem">Nessuna società ancora. Aggiungine una.</p>`}
      <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">
        <button onclick="wizardState.step=2;render()">← Indietro</button>
        <button class="bp" onclick="creaTorneo()">✓ Crea torneo</button>
      </div>
    </div>`;
  }
  return html;
}

// Wizard helpers categorie
function wizardSalvaNomi(){
  // Legge i valori attuali degli input nome categoria prima di ogni re-render
  document.querySelectorAll('[data-cat-nome-idx]').forEach(el=>{
    const i=parseInt(el.getAttribute('data-cat-nome-idx'));
    if(wizardState&&wizardState.categorie[i]!==undefined)
      wizardState.categorie[i].nome=el.value;
  });
}
function wizardStep2(){if(!wizardState.nome.trim()){alert('Inserisci un nome per il torneo.');return;}wizardState.step=2;render();}
function wizardStep3(){wizardSalvaNomi();if(!wizardState.categorie.length){alert('Aggiungi almeno una categoria.');return;}wizardState.step=3;render();}
function wizardAddCat(){
  const cols=COLORI_DISPONIBILI;const emojis=EMOJI_DISPONIBILI;
  const ci=wizardState.categorie.length;
  wizardState.categorie.push({id:uid(),nome:'Nuova',colore:cols[ci%cols.length].hex,emoji:emojis[ci%emojis.length]});
  render();
}
function wizardDelCat(ci){wizardState.categorie.splice(ci,1);render();}
function wizardMoveCat(ci,dir){const to=ci+dir;if(to<0||to>=wizardState.categorie.length)return;[wizardState.categorie[ci],wizardState.categorie[to]]=[wizardState.categorie[to],wizardState.categorie[ci]];render();}

// Wizard helpers società
function aggiungiSoc(){
  const nome=(wizardState.nuovaSocNome||document.getElementById('nuovaSocInput')?.value||'').trim();
  if(!nome)return;
  if(wizardState.societa.find(s=>s.nome.toLowerCase()===nome.toLowerCase())){alert('Società già presente.');return;}
  const sqPerCat={},bambini={};
  for(const c of wizardState.categorie){sqPerCat[c.id]=0;bambini[c.id]=0;}
  wizardState.societa.push({nome,sqPerCat,bambini});
  wizardState.nuovaSocNome='';render();
}
function rimuoviSoc(i){wizardState.societa.splice(i,1);render();}
function setSocCat(i,catId,n){wizardState.societa[i].sqPerCat[catId]=n;}
function setSocBambini(i,catId,n){if(!wizardState.societa[i].bambini)wizardState.societa[i].bambini={};wizardState.societa[i].bambini[catId]=n;}

function creaTorneo(){
  if(!wizardState.nome.trim()){alert('Nome mancante.');return;}
  const totSq=wizardState.societa.reduce((s,soc)=>s+Object.values(soc.sqPerCat).reduce((a,b)=>a+b,0),0);
  if(wizardState.societa.length>0&&totSq===0){
    if(!confirm('Nessuna squadra inserita per nessuna categoria. Vuoi creare il torneo comunque?'))return;
  }
  const societa=wizardState.societa.map(s=>({nome:s.nome,sqPerCat:{...s.sqPerCat},bambini:{...s.bambini},squadre:[]}));
  const id=uid();
  DB.tornei[id]={
    nome:wizardState.nome.trim(),createdAt:Date.now(),societa,
    categorie:wizardState.categorie.map(c=>({...c,fasi:[{id:uid(),label:'Fase 1',gironi:[]}]}))
  };
  wizardState=null;sv();openTorneo(id);
}

// ============================================================
// VIEW: TORNEO
// ============================================================
function renderTorneo(){
  const t=currentTorneo();if(!t)return renderHome();
  const cats=getCats();
  const cat=localCat||cats[0]?.id||'admin';

  // Tab: una per ogni categoria + 3 fisse
  // Banner archiviato se il torneo è archiviato
  const isArch2=!!t.archiviato;
  let extraBanner=isArch2?`<div style="background:#fef9c3;color:#854d0e;border-radius:8px;padding:8px 14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;font-size:13px">
    <span>📁 Questo torneo è archiviato — sola lettura</span>
    <button class="bsm" onclick="archiviaToggle('${currentTorneoId}')">📂 Riattiva</button>
  </div>`:'';
  let tabsHtml=extraBanner+`<div class="tabs" style="flex-wrap:wrap">`;
  for(const c of cats){
    const col=c.colore;
    const isAct=cat===c.id;
    tabsHtml+=`<button class="tab${isAct?' active':''}" style="${isAct?`background:${col}22;color:${col};`:''}font-weight:600"
      onclick="setScat('${c.id}')">${c.emoji} ${c.nome}</button>`;
  }
  tabsHtml+=`<button class="tab${cat==='admin'?' active':''}" onclick="setScat('admin')">⚙️ Setup</button>`;
  tabsHtml+=`<button class="tab${cat==='societa'?' active':''}" onclick="setScat('societa')">🏢 Società</button>`;
  tabsHtml+=`<button class="tab${cat==='paginaLive'?' active':''}" onclick="setScat('paginaLive')">📄 Live</button>`;
  tabsHtml+=`</div>`;

  let html='';
  if(cat==='admin')      html=renderSetupGironi();
  else if(cat==='societa')    html=renderSocieta();
  else if(cat==='paginaLive') html=renderPaginaLive();
  else                        html=renderCategoria(cat);
  return tabsHtml+html;
}

// ============================================================
// SCHEDA SOCIETÀ
// ============================================================
function renderSocieta(){
  const t=currentTorneo();const cats=getCats();
  const soc=t.societa||(t.societa=[]);
  let html='';

  // Sezione iscrizioni in attesa
  const attesa=window._iscrizioniAttesa||[];
  if(!window._iscrizioniLoaded&&window._currentUid&&window._fbDb){
    window._iscrizioniLoaded=true;
    window._fbDb.collection('iscrizioni').doc(window._currentUid+'_'+currentTorneoId)
      .collection('richieste').where('stato','==','attesa').get()
      .then(snap=>{
        window._iscrizioniAttesa=snap.docs.map(d=>({id:d.id,...d.data()}));
        render();
      }).catch(()=>{});
  }
  if(attesa.length){
    let attHtml='<div class="card" style="margin-bottom:1rem;border:2px solid #2d5fc4">';
    attHtml+='<div style="font-weight:700;font-size:14px;color:#2d5fc4;margin-bottom:12px">Iscrizioni in attesa — '+attesa.length+'</div>';
    attesa.forEach(function(isc){
      attHtml+='<div style="background:var(--info);border-radius:8px;padding:10px 12px;margin-bottom:8px">';
      attHtml+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
      if(isc.logo)attHtml+='<img src="'+isc.logo+'" style="width:32px;height:32px;object-fit:contain;border-radius:4px;background:#fff;padding:2px">';
      attHtml+='<div style="font-weight:700;font-size:14px">'+escV(isc.nomeSoc)+'</div></div>';
      attHtml+='<div style="font-size:12px;color:var(--txt2);margin-bottom:4px">'+escV(isc.dirigente)+' · '+escV(isc.cellulare)+' · '+escV(isc.email)+'</div>';
      const sqInfo=Object.entries(isc.sqPerCat||{}).filter(function(e){return e[1]>0;}).map(function(e){return catLabel(e[0])+': '+e[1];}).join(' · ')||'—';
      attHtml+='<div style="font-size:12px;color:var(--txt2);margin-bottom:8px">Squadre: '+sqInfo+'</div>';
      attHtml+='<div style="display:flex;gap:6px;flex-wrap:wrap">';
      attHtml+='<button class="bxsm bp" onclick="approvaIscrizione(\'' +isc.id+ '\')">Approva</button>';
      attHtml+='<button class="bxsm bd" onclick="rifiutaIscrizione(\'' +isc.id+ '\')">Rifiuta</button>';
      attHtml+='</div></div>';
    });
    attHtml+='</div>';
    html+=attHtml;
  }

  const t_isc=currentTorneo();
  const iscCfg=t_isc?.iscrizioniConfig||{};
  const iscAperte=!!t_isc?.iscrizioniAperte;
  const iscLink=location.origin+location.pathname.replace('index.html','')+'iscrizione.html?u='+(window._currentUid||'')+'&t='+currentTorneoId;
  // Sezione iscrizioni come stringa separata
  let iscHtml='<div class="card" style="margin-bottom:1rem">';
  iscHtml+='<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px">';
  iscHtml+='<div style="font-weight:700;font-size:14px">📝 Modulo iscrizioni online</div>';
  iscHtml+='<div style="display:flex;align-items:center;gap:8px">';
  iscHtml+='<label class="toggle"><input type="checkbox" '+(iscAperte?'checked':'')+' onchange="toggleIscrizioni(this.checked)"><span class="slider"></span></label>';
  iscHtml+='<span style="font-size:13px;color:var(--txt2)">'+(iscAperte?'<span style="color:#166534;font-weight:600">● Aperto</span>':'Chiuso')+'</span>';
  iscHtml+='</div></div>';
  if(iscAperte){
    iscHtml+='<div style="background:var(--info);border-radius:8px;padding:10px 12px;margin-bottom:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">';
    iscHtml+='<span style="font-size:12px;color:var(--txt2);word-break:break-all;flex:1">'+iscLink+'</span>';
    iscHtml+='<button class="bxsm" onclick="copiaIscLink()">📋 Copia</button></div>';
    iscHtml+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">';
    iscHtml+='<div><label style="font-size:12px;font-weight:600;color:var(--txt2);display:block;margin-bottom:4px">📅 Data torneo</label>';
    iscHtml+='<input type="text" placeholder="Es. 17 Maggio 2026" value="'+escV(iscCfg.data||'')+'" onchange="saveIscCfg(&quot;data&quot;,this.value)" style="font-size:13px"></div>';
    iscHtml+='<div><label style="font-size:12px;font-weight:600;color:var(--txt2);display:block;margin-bottom:4px">⏰ Scadenza iscrizioni</label>';
    iscHtml+='<input type="text" placeholder="Es. 10 Maggio 2026 ore 12:00" value="'+escV(iscCfg.scadenza||'')+'" onchange="saveIscCfg(&quot;scadenza&quot;,this.value)" style="font-size:13px"></div></div>';
    iscHtml+='<div style="margin-bottom:10px"><label style="font-size:12px;font-weight:600;color:var(--txt2);display:block;margin-bottom:4px">🏢 Logo organizzatore (URL)</label>';
    iscHtml+='<input type="text" placeholder="https://..." value="'+escV(iscCfg.logoOrg||'')+'" onchange="saveIscCfg(&quot;logoOrg&quot;,this.value)" style="font-size:13px"></div>';
    iscHtml+='<div style="margin-bottom:10px"><label style="font-size:12px;font-weight:600;color:var(--txt2);display:block;margin-bottom:4px">📋 Info categorie (formato, anni, min. atleti)</label>';
    (currentTorneo()?.categorie||[]).forEach(function(cat){
      iscHtml+='<div style="background:var(--info);border-radius:8px;padding:8px 10px;margin-bottom:6px;border-left:3px solid '+(cat.colore||'#2d5fc4')+'">';
      iscHtml+='<div style="font-size:12px;font-weight:700;color:'+(cat.colore||'#2d5fc4')+';margin-bottom:6px">'+(cat.emoji||'')+' '+cat.nome+'</div>';
      iscHtml+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">';
      iscHtml+='<input type="text" placeholder="Formato (es. 3x3)" value="'+escV((iscCfg.catInfo||{})[cat.id]?.formato||'')+'" onchange="saveIscCatInfo(&quot;'+cat.id+'&quot;,&quot;formato&quot;,this.value)" style="font-size:12px">';
      iscHtml+='<input type="text" placeholder="Anni (es. 2016-2017)" value="'+escV((iscCfg.catInfo||{})[cat.id]?.anni||'')+'" onchange="saveIscCatInfo(&quot;'+cat.id+'&quot;,&quot;anni&quot;,this.value)" style="font-size:12px">';
      iscHtml+='<input type="number" placeholder="Min. atleti" min="1" value="'+((iscCfg.catInfo||{})[cat.id]?.minAtleti||'')+'" onchange="saveIscCatInfo(&quot;'+cat.id+'&quot;,&quot;minAtleti&quot;,parseInt(this.value)||0)" style="font-size:12px;text-align:center">';
      iscHtml+='</div></div>';
    });
    iscHtml+='</div>';
    const defaultComp='Le squadre dovranno essere composte da un minimo di 3 atleti nel White e 4 nel Green e Red.';
    iscHtml+='<div style="margin-bottom:10px"><label style="font-size:12px;font-weight:600;color:var(--txt2);display:block;margin-bottom:4px">📝 Testo composizione squadre</label>';
    iscHtml+='<textarea rows="5" onchange="saveIscCfg(&quot;testoComposizione&quot;,this.value)" style="font-size:12px;resize:vertical;width:100%">'+escV(iscCfg.testoComposizione||defaultComp)+'</textarea></div>';
    iscHtml+='<div style="margin-bottom:10px"><label style="font-size:12px;font-weight:600;color:var(--txt2);display:block;margin-bottom:4px">✅ Testo accettazione regolamento</label>';
    iscHtml+='<textarea rows="5" onchange="saveIscCfg(&quot;testoAccettazione&quot;,this.value)" style="font-size:12px;resize:vertical;width:100%">'+escV(iscCfg.testoAccettazione||'La societa sottoscrivendo il presente modulo dichiara di aver preso visione del regolamento e di accettarlo integralmente.')+'</textarea></div>';
    iscHtml+='<div><label style="font-size:12px;font-weight:600;color:var(--txt2);display:block;margin-bottom:4px">⚠️ Disclaimer</label>';
    iscHtml+='<textarea rows="7" onchange="saveIscCfg(&quot;disclaimer&quot;,this.value)" style="font-size:12px;resize:vertical;width:100%">'+escV(iscCfg.disclaimer||"L'organizzazione declina ogni responsabilita per eventuali incidenti o fatti che potranno accadere prima, durante e dopo il torneo, salvo quanto previsto dalla assicurativa dei cartellini struttura giovanile e CONI - SPORTASS (compresi eventuali furti o smarrimenti che accadessero durante la manifestazione).")+'</textarea></div>';
  }
  iscHtml+='</div>';
  html+=iscHtml;


  html+=`<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:8px">
      <div class="card-title" style="margin-bottom:0">🏢 Società partecipanti</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="bsm" onclick="importTorneo()">⬆ Importa torneo</button>
        <button class="bsm" onclick="exportTorneo()">⬇ Esporta torneo</button>
        <button class="bsm bp" onclick="socEditState={si:-1,nome:'',sqPerCat:{},bambini:{},logo:'',referenti:[{nome:'',email:'',tel:''}]};render()">+ Società</button>
      </div>
    </div>
    ${socEditState&&socEditState.si===-1?renderSocForm(-1):''}
    ${soc.length?renderSocTable(soc,cats):`<p style="color:var(--txt2);font-size:13px;text-align:center;padding:1rem">Nessuna società.</p>`}
  </div>`;
  return html;
}

function renderSocTable(soc,cats){
  // Layout responsive a card: niente grid orizzontale, funziona su mobile
  let rows=soc.map((s,si)=>{
    if(socEditState&&socEditState.si===si)return renderSocForm(si);
    const righe=cats.map(c=>{
      const sq=s.sqPerCat?.[c.id]||0;const bb=s.bambini?.[c.id]||0;
      if(!sq&&!bb)return'';
      const em=catEmoji(c.id)?catEmoji(c.id)+' ':'';
      return`<span style="font-size:11px;padding:2px 8px;border-radius:10px;margin:2px;display:inline-block;${catBadgeStyle(c.id)}">${em}${catLabel(c.id)}: ${sq} sq${bb?' · 🧒'+bb:''}</span>`;
    }).join('');
    return`<div style="border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:8px;display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap">
      ${s.logo?`<img src="${s.logo}" style="width:40px;height:40px;border-radius:6px;object-fit:contain;background:#fff;padding:2px;flex-shrink:0;align-self:center">`:'<div style="width:40px;height:40px;border-radius:6px;background:var(--info);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">🏢</div>'}
      <div style="flex:1;min-width:100px">
        <div style="font-weight:700;font-size:14px;margin-bottom:6px">${escV(s.nome)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:2px">${righe||'<span style="font-size:11px;color:var(--txt2)">Nessuna squadra</span>'}</div>
        ${(s.referenti||[]).filter(r=>r.nome||r.email||r.tel).map(r=>`
          <div style="margin-top:5px;font-size:11px;color:var(--txt2);display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            ${r.nome?`<span>👤 <b>${r.nome}</b></span>`:''}
            ${r.email?`<a href="mailto:${r.email}" style="color:var(--blu,#2d5fc4);font-size:11px">${r.email}</a>`:''}
            ${r.tel?`<a href="tel:${r.tel}" style="color:var(--blu,#2d5fc4);font-size:11px">${r.tel}</a>`:''}
          </div>`).join('')}
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0;margin-top:2px">
        <button class="bxsm" onclick="openSocEdit(${si})">✏️ Modifica</button>
        <button class="bxsm bd" onclick="rimuoviSocTorneo(${si})">✕</button>
      </div>
    </div>`;
  }).join('');
  const totali=`<div style="background:var(--info);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--txt2);margin-top:4px">
    <strong>Totale per categoria:</strong>
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
    ${cats.map(c=>{
      const tot=soc.reduce((s,x)=>s+(x.sqPerCat?.[c.id]||0),0);
      const totB=soc.reduce((s,x)=>s+(x.bambini?.[c.id]||0),0);
      return`${renderBadgeCat(c.id,'margin:2px')} <span style="font-size:11px">${tot} sq · 🧒 ${totB}</span>`;
    }).join('')}
    </div>
  </div>`;
  return`<div style="margin-bottom:1rem">${rows}</div>${totali}`;
}

function renderSocForm(si){
  const isNew=si===-1;const st=socEditState;const cats=getCats();
  return`<div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px">
    <div class="sec">${isNew?'Nuova società':'Modifica società'}</div>
    <input type="text" placeholder="Nome società" value="${escV(st.nome)}" style="margin-bottom:10px"
      oninput="socEditState.nome=this.value" onkeydown="if(event.key==='Enter')saveSoc()">
    <div style="font-size:12px;font-weight:600;color:var(--txt2);margin-bottom:6px">🏐 Squadre per categoria</div>
    <div style="display:grid;grid-template-columns:repeat(${Math.min(cats.length,3)},1fr);gap:10px;margin-bottom:12px">
      ${cats.map(c=>`<div>
        <label style="font-size:12px;display:block;margin-bottom:4px">${renderBadgeCat(c.id)}</label>
        <input type="number" min="0" max="30" value="${st.sqPerCat[c.id]||0}" style="text-align:center"
          oninput="socEditState.sqPerCat['${c.id}']=parseInt(this.value)||0">
      </div>`).join('')}
    </div>
    <div style="font-size:12px;font-weight:600;color:var(--txt2);margin-bottom:6px">🧒 Bambini iscritti per categoria</div>
    <div style="display:grid;grid-template-columns:repeat(${Math.min(cats.length,3)},1fr);gap:10px;margin-bottom:10px">
      ${cats.map(c=>`<div>
        <label style="font-size:12px;display:block;margin-bottom:4px">${renderBadgeCat(c.id)}</label>
        <input type="number" min="0" max="9999" value="${st.bambini[c.id]||0}" style="text-align:center"
          oninput="if(!socEditState.bambini)socEditState.bambini={};socEditState.bambini['${c.id}']=parseInt(this.value)||0">
      </div>`).join('')}
    </div>
    <div style="font-size:12px;font-weight:600;color:var(--txt2);margin-bottom:6px">🏢 Logo società</div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
      ${(st.logo||'')
        ?`<img src="${st.logo}" style="height:52px;width:52px;border-radius:8px;object-fit:contain;background:#fff;padding:3px;border:1px solid var(--border)">`
        :'<div style="height:52px;width:52px;border-radius:8px;background:var(--info);display:flex;align-items:center;justify-content:center;font-size:24px">🏢</div>'}
      <label style="cursor:pointer">
        <span class="bp bxsm" style="display:inline-block">📎 ${st.logo?'Cambia':'Carica'} logo</span>
        <input type="file" accept="image/*" style="display:none" onchange="uploadSocLogo(this)">
      </label>
      <input type="text" value="${(st.logo||'')&&!(st.logo||'').startsWith('data:')?escV(st.logo):''}"
        placeholder="...oppure URL immagine"
        style="flex:1;min-width:160px;font-size:12px"
        oninput="socEditState.logo=this.value">
      ${(st.logo||'')?`<button class="bxsm bd" onclick="socEditState.logo='';render()">✕ Rimuovi</button>`:''}
    </div>
    <div style="font-size:12px;font-weight:600;color:var(--txt2);margin-bottom:6px;margin-top:4px">👤 Referenti (opzionale)</div>
    ${(st.referenti||[{nome:'',email:'',tel:''}]).map((r,ri)=>`
      <div style="background:var(--info);border-radius:8px;padding:10px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:11px;font-weight:600;color:var(--txt2)">Referente ${ri+1}</span>
          ${ri>0?`<button class="bxsm bd" onclick="socEditState.referenti.splice(${ri},1);render()">✕</button>`:''}
        </div>
        <input type="text" placeholder="Nome referente" value="${escV(r.nome||'')}"
          style="margin-bottom:6px;font-size:13px"
          oninput="if(!socEditState.referenti)socEditState.referenti=[{}];socEditState.referenti[${ri}].nome=this.value">
        <input type="email" placeholder="Email" value="${escV(r.email||'')}"
          style="margin-bottom:6px;font-size:13px"
          oninput="if(!socEditState.referenti)socEditState.referenti=[{}];socEditState.referenti[${ri}].email=this.value">
        <input type="tel" placeholder="Telefono" value="${escV(r.tel||'')}"
          style="font-size:13px"
          oninput="if(!socEditState.referenti)socEditState.referenti=[{}];socEditState.referenti[${ri}].tel=this.value">
      </div>`).join('')}
    <button class="bxsm" style="margin-bottom:12px"
      onclick="if(!socEditState.referenti)socEditState.referenti=[{}];socEditState.referenti.push({nome:'',email:'',tel:''});render()">
      + Aggiungi referente
    </button>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button onclick="socEditState=null;render()">Annulla</button>
      <button class="bp bsm" onclick="saveSoc()">✓ Salva</button>
    </div>
  </div>`;
}

function saveSoc(){
  const t=currentTorneo();if(!t)return;if(!t.societa)t.societa=[];
  const st=socEditState;if(!st)return;
  const nome=st.nome.trim();if(!nome){alert('Inserisci il nome.');return;}
  const logo=st.logo||'';
  const referenti=(st.referenti||[]).filter(r=>r.nome||r.email||r.tel);
  if(st.si===-1){
    t.societa.push({nome,sqPerCat:{...st.sqPerCat},bambini:{...st.bambini},logo,referenti,squadre:[]});
  } else {
    const vecchioNome=t.societa[st.si].nome;
    t.societa[st.si].nome=nome;
    t.societa[st.si].sqPerCat={...st.sqPerCat};
    t.societa[st.si].bambini={...st.bambini};
    t.societa[st.si].logo=logo;
    t.societa[st.si].referenti=referenti;
    // Aggiorna il nome società in tutte le squadre dei gironi
    if(vecchioNome!==nome){
      for(const cat of getCats()){
        for(const fase of(cat.fasi||[])){
          for(const g of(fase.gironi||[])){
            for(const sq of g.squadre){
              if(sq.soc===vecchioNome)sq.soc=nome;
            }
          }
        }
      }
    }
  }
  socEditState=null;sv();render();
}
function rimuoviSocTorneo(si){
  const t=currentTorneo();if(!t||!t.societa)return;
  if(!confirm(`Rimuovere "${t.societa[si].nome}"?`))return;
  t.societa.splice(si,1);sv();render();
}
function openSocEdit(si){
  const t=currentTorneo();if(!t||!t.societa[si])return;
  const s=t.societa[si];const cats=getCats();
  const sqPerCat={},bambini={};
  cats.forEach(c=>{sqPerCat[c.id]=s.sqPerCat?.[c.id]||0;bambini[c.id]=s.bambini?.[c.id]||0;});
  socEditState={si,nome:s.nome,sqPerCat,bambini,logo:s.logo||'',referenti:s.referenti||[{nome:'',email:'',tel:''}]};
  render();
}
function uploadSocLogo(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const img=new Image();
    img.onload=function(){
      const MAX=300;
      let w=img.width,h=img.height;
      if(w>MAX||h>MAX){if(w>h){h=Math.round(h*MAX/w);w=MAX;}else{w=Math.round(w*MAX/h);h=MAX;}}
      const canvas=document.createElement('canvas');
      canvas.width=w;canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      if(!socEditState)return;
      if(!socEditState)return;
      socEditState.logo=canvas.toDataURL('image/png',0.85);
      render();
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}

// ============================================================
// EXPORT / IMPORT
// ============================================================
function exportTorneo(){
  const t=currentTorneo();if(!t)return;
  const a=document.createElement('a');
  a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify({torneo:JSON.parse(JSON.stringify(t))},null,2));
  a.download=`torneo_${(t.nome||'export').replace(/[^a-z0-9]/gi,'_')}.json`;
  document.body.appendChild(a);a.click();document.body.removeChild(a);
}
function importTorneo(){
  const input=document.createElement('input');input.type='file';input.accept='.json';
  input.onchange=e=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try{
        const data=JSON.parse(ev.target.result);const t=data.torneo||data;
        if(!t.nome)throw new Error('File non valido');
        const id=uid();DB.tornei[id]={...t,nome:t.nome+' (importato)',createdAt:Date.now()};
        sv();openTorneo(id);
      }catch(err){alert('File non valido: '+err.message);}
    };reader.readAsText(file);
  };input.click();
}

// ============================================================
// SETUP GIRONI
// ============================================================
function renderSetupGironi(){
  const t=currentTorneo();const cats=getCats();
  // Assicura fase1 per tutte le categorie (solo in memoria)
  for(const cat of cats){if(!cat.fasi?.length)cat.fasi=[{id:uid(),label:'Fase 1',gironi:[]}];}

  let html='';
  html+=`<div style="background:var(--info);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--txt2);margin-bottom:1rem;line-height:1.7">
    Imposta i campi disponibili per ogni categoria e crea i gironi. Puoi anche aggiungere nuove categorie personalizzate.
  </div>`;

  for(const cat of cats){
    const fasi=cat.fasi||[];
    const fase1=fasi[0];const gs=fase1?.gironi||[];
    const sz=getPref(cat.id,'sz',4);const sets=getPref(cat.id,'sets',2);const nCampi=getPref(cat.id,'campi',0);
    const totSq=(t.societa||[]).reduce((s,x)=>s+(x.sqPerCat?.[cat.id]||0),0);
    const sug=nCampi>0&&totSq>0?suggerisciGironi(totSq,nCampi):null;
    const sugLabel=sug?`${sug.length} giron${sug.length===1?'e':'i'} da ${sug.map(n=>n+' sq').join(' + ')}`:'Imposta i campi per il suggerimento';
    const col=cat.colore;

    html+=`<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          ${renderBadgeCat(cat.id)}
          <span style="font-size:13px;color:var(--txt2)">${gs.length} giron${gs.length===1?'e':'i'} · ${totSq} sq totali</span>
          ${(()=>{const tot=gs.reduce((s,g)=>s+g.partite.length,0);const play=gs.reduce((s,g)=>s+g.partite.filter(p=>p.s1h!==''||p.s1a!=='').length,0);return tot>0?`<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:${play===tot?'var(--saved-bg)':'var(--info)'};color:${play===tot?'var(--saved-txt)':'var(--txt2)'}">${play}/${tot} partite${play===tot?' ✓':''}</span>`:'';})()}
          <button class="bxsm" onclick="showEditCatModal('${cat.id}')" title="Modifica categoria">✏️</button>
          <button class="bxsm bd" onclick="delCategoria('${cat.id}')" title="Elimina categoria">✕</button>
        </div>
        <div style="display:flex;gap:4px">
          ${cats.indexOf(cat)>0?`<button class="bxsm" onclick="moveCategoria('${cat.id}',-1)">↑</button>`:''}
          ${cats.indexOf(cat)<cats.length-1?`<button class="bxsm" onclick="moveCategoria('${cat.id}',1)">↓</button>`:''}
        </div>
      </div>
      <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;margin-bottom:14px;padding:12px;background:var(--info);border-radius:8px">
        <div>
          <div style="font-size:11px;font-weight:600;color:var(--txt2);margin-bottom:4px">CAMPI DISPONIBILI</div>
          <input type="number" min="1" max="20" value="${nCampi||''}" placeholder="es. 3"
            style="width:80px;text-align:center;font-size:15px;font-weight:700"
            oninput="setPref('${cat.id}','campi',parseInt(this.value)||0);renderPreserveScroll()">
        </div>
        <div style="flex:1;min-width:160px">
          <div style="font-size:11px;font-weight:600;color:var(--txt2);margin-bottom:4px">SUGGERIMENTO</div>
          <div style="font-size:13px;color:${sug?'var(--txt)':'var(--txt2)'};font-weight:${sug?'600':'400'}">${sugLabel}</div>
          ${sug?`<div style="font-size:11px;color:var(--txt2);margin-top:2px">max ${nCampi} giron${nCampi===1?'e':'i'} · ${totSq} sq distribuite</div>`:''}
        </div>
        ${sug&&!gs.length?`<button class="bsm" style="background:${col};color:#fff;border-color:transparent" onclick="creaSuggeriti('${cat.id}')">✓ Crea suggeriti</button>`:''}
        ${sug&&gs.length?`<button class="bsm" onclick="if(confirm('Ricrea i gironi suggeriti?'))creaSuggeriti('${cat.id}')">↺ Ricrea suggeriti</button>`:''}
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
        <select style="width:auto;padding:5px 8px;font-size:13px" onchange="setPref('${cat.id}','sz',parseInt(this.value))">
          ${[3,4,5,6,7,8].map(n=>`<option value="${n}"${sz===n?' selected':''}>${n} sq/girone</option>`).join('')}
        </select>
        <select style="width:auto;padding:5px 8px;font-size:13px" onchange="setPref('${cat.id}','sets',parseInt(this.value))">
          <option value="1"${sets===1?' selected':''}>1 set</option>
          <option value="2"${sets===2?' selected':''}>2 set</option>
        </select>
        <button class="bp bsm" onclick="addGirone('${cat.id}')">+ Girone manuale</button>
      </div>`;

    if(fase1){
      for(const g of gs){
        html+=`<div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:6px">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span style="font-size:13px;padding:3px 10px;border-radius:20px;font-weight:600;${catBadgeStyle(cat.id)}">Girone ${g.label}</span>
              <span style="font-size:12px;color:var(--txt2)">${g.squadre.length} sq · ${g.sets||2} set</span>
              <div style="display:flex;align-items:center;gap:4px">
                <span style="font-size:11px;color:var(--txt2)">📍 Campo:</span>
                <input type="text" value="${g.campo||''}" placeholder="es. A" maxlength="20"
                  style="width:80px;font-size:12px;padding:3px 6px"
                  onchange="setCampoGirone('${cat.id}','${fase1.id}','${g.id}',this.value)">
              </div>
            </div>
            <div style="display:flex;gap:4px">
              <button class="bsm" onclick="azzeraRisultati('${cat.id}','${fase1.id}','${g.id}')" title="Azzera tutti i risultati">🔄 Azzera</button>
              <button class="bsm bd" onclick="delGirone('${cat.id}','${fase1.id}','${g.id}')">✕ Elimina</button>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
            ${g.squadre.map((s,i)=>`<div style="display:flex;gap:6px;align-items:center">
              <span style="font-size:12px;color:var(--txt2);min-width:18px;text-align:right">${i+1}.</span>
              <input type="text" value="${escV(s.nome)}" placeholder="Squadra" style="flex:1.5"
                onchange="updSq('${cat.id}','${fase1.id}','${g.id}',${i},'nome',this.value)">
              <input type="text" value="${escV(s.soc||'')}" placeholder="Società" style="flex:1"
                onchange="updSq('${cat.id}','${fase1.id}','${g.id}',${i},'soc',this.value)">
            </div>`).join('')}
          </div>
          <button class="bp bsm" onclick="saveSquadre('${cat.id}','${fase1.id}','${g.id}')">✓ Rigenera partite</button>
        </div>`;
      }
    }
    if(!gs.length)html+=`<div style="text-align:center;padding:1.5rem;color:var(--txt2);background:var(--info);border-radius:8px;font-size:13px">
      Nessun girone. Scegli il numero di squadre e clicca <strong>+ Girone</strong>.</div>`;
    html+=`</div>`;
  }

  if(!cats.length)html+=`<div class="card" style="text-align:center;padding:2rem;color:var(--txt2)">
    Nessuna categoria. <button class="bp bsm" onclick="showAddCatModal()">+ Aggiungi categoria</button></div>`;

  // Modal aggiunta/modifica categoria (hidden, mostrato via JS)
  html+=`<div id="catModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center">
    <div style="background:var(--card);border-radius:14px;padding:20px;width:min(380px,90vw);max-height:90vh;overflow-y:auto">
      <div style="font-size:16px;font-weight:700;margin-bottom:14px" id="catModalTitle">Nuova categoria</div>
      <div style="margin-bottom:10px">
        <label style="font-size:12px;color:var(--txt2);display:block;margin-bottom:4px">Nome</label>
        <input type="text" id="catModalNome" placeholder="Es: Under 12" style="width:100%">
      </div>
      <div style="margin-bottom:10px">
        <label style="font-size:12px;color:var(--txt2);display:block;margin-bottom:4px">Emoji</label>
        <select id="catModalEmoji" style="width:100%;font-size:18px">
          <option value="">— Nessuna emoji —</option>
          ${['⬜','🟩','🟥','🟣','🟠','🔵','🟡','⚫','🟤','🔴','⚪','🩵','🩶','💜','🧡'].map(e=>`<option>${e}</option>`).join('')}
        </select>
      </div>
      <div style="margin-bottom:16px">
        <label style="font-size:12px;color:var(--txt2);display:block;margin-bottom:6px">Colore</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px" id="catModalColori">
          ${COLORI_DISPONIBILI.map(col=>`<button id="colBtn_${col.hex.slice(1)}" onclick="selectModalColor('${col.hex}')"
            style="width:28px;height:28px;border-radius:50%;background:${col.hex};border:3px solid transparent;cursor:pointer;padding:0;transition:border .15s" title="${col.label}"></button>`).join('')}
        </div>
        <input type="text" id="catModalColoreHex" placeholder="#7c3aed" style="margin-top:8px;width:100%;font-size:12px">
      </div>
      <input type="hidden" id="catModalEditId">
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button onclick="closeModal()">Annulla</button>
        <button class="bp bsm" onclick="saveModalCat()">✓ Salva</button>
      </div>
    </div>
  </div>`;

  return html;
}

function showAddCatModal(){
  const m=document.getElementById('catModal');if(!m)return;
  document.getElementById('catModalTitle').textContent='Nuova categoria';
  document.getElementById('catModalNome').value='';
  document.getElementById('catModalEmoji').value='🟣';
  document.getElementById('catModalEditId').value='';
  selectModalColor(COLORI_DISPONIBILI[0].hex);
  m.style.display='flex';
}
function showEditCatModal(catId){
  const cat=getCat(catId);if(!cat)return;
  const m=document.getElementById('catModal');if(!m)return;
  document.getElementById('catModalTitle').textContent='Modifica categoria';
  document.getElementById('catModalNome').value=cat.nome;
  document.getElementById('catModalEmoji').value=cat.emoji||'🟣';
  document.getElementById('catModalEditId').value=catId;
  selectModalColor(cat.colore);
  m.style.display='flex';
}
function selectModalColor(hex){
  document.getElementById('catModalColoreHex').value=hex;
  document.querySelectorAll('[id^="colBtn_"]').forEach(b=>{b.style.border='3px solid transparent';});
  const btn=document.getElementById('colBtn_'+hex.slice(1));if(btn)btn.style.border='3px solid var(--txt)';
}
function closeModal(){const m=document.getElementById('catModal');if(m)m.style.display='none';}
function saveModalCat(){
  const nome=document.getElementById('catModalNome').value.trim();
  if(!nome){alert('Inserisci un nome.');return;}
  const emoji=document.getElementById('catModalEmoji').value;
  const colore=document.getElementById('catModalColoreHex').value||COLORI_DISPONIBILI[0].hex;
  const editId=document.getElementById('catModalEditId').value;
  if(editId){
    const cat=getCat(editId);if(cat){cat.nome=nome;cat.emoji=emoji;cat.colore=colore;}sv();
  } else {
    addCategoria(nome,colore,emoji);
  }
  closeModal();render();
}

// GIRONE CRUD
function addGirone(catId){
  const t=currentTorneo();if(!t)return;
  getCats();
  const cat=getCat(catId);if(!cat)return;
  if(!cat.fasi||!cat.fasi.length)cat.fasi=[{id:uid(),label:'Fase 1',gironi:[]}];
  const f1=cat.fasi[0];if(!f1.gironi)f1.gironi=[];
  const sz=getPref(catId,'sz',4);const sets=getPref(catId,'sets',2);
  const fasi=cat.fasi;
  const usedNomi=fasi.flatMap(f=>f.gironi?.flatMap(g=>g.squadre.map(s=>s.nome))||[]);
  const nomiDisp=getNomiCat(catId).filter(n=>!usedNomi.includes(n));
  const label=String.fromCharCode(65+f1.gironi.length);
  const socSquadre=[];
  for(const soc of(t.societa||[])){
    const nCat=soc.sqPerCat?.[catId]||0;if(!nCat)continue;
    const giaAss=fasi.flatMap(f=>f.gironi?.flatMap(g=>g.squadre.filter(s=>s.soc===soc.nome))||[]).length;
    const rim=nCat-giaAss;for(let i=0;i<rim;i++)socSquadre.push({soc:soc.nome});
  }
  let squadre=[];
  if(socSquadre.length>0){
    for(let i=socSquadre.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[socSquadre[i],socSquadre[j]]=[socSquadre[j],socSquadre[i]];}
    const socInGirone=new Set();const remaining=[...socSquadre];
    for(let slot=0;slot<sz&&remaining.length>0;slot++){
      const diverse=remaining.filter(s=>!socInGirone.has(s.soc));
      const pick=(diverse.length?diverse:remaining)[0];
      socInGirone.add(pick.soc);remaining.splice(remaining.indexOf(pick),1);
      squadre.push({nome:nomiDisp[squadre.length]||`Sq${squadre.length+1}`,soc:pick.soc});
    }
    while(squadre.length<sz)squadre.push({nome:nomiDisp[squadre.length]||`Sq${squadre.length+1}`,soc:''});
  } else {
    squadre=Array.from({length:sz},(_,i)=>({nome:nomiDisp[i]||`Sq${i+1}`,soc:''}));
  }
  f1.gironi.push({id:uid(),label,squadre,sets,ritorno:false,partite:genPartite(sz,false,sets)});
  sv();render();
}
function azzeraRisultati(catId,fid,gv){
  const g=getGirone(catId,fid,gv);if(!g)return;
  const giocate=g.partite.filter(p=>p.s1h!==''||p.s1a!=='').length;
  if(!giocate){alert('Nessun risultato da azzerare.');return;}
  if(!confirm(`Azzerare tutti i ${giocate} risultati del Girone ${g.label}? Questa operazione non è reversibile.`))return;
  g.partite.forEach(p=>{p.s1h='';p.s1a='';p.s2h='';p.s2a='';});
  // Pulisci anche la cache input
  Object.keys(IC).forEach(k=>{if(k.startsWith(`${catId}_${fid}_${gv}_`))delete IC[k];});
  sv();render();
}
function delGirone(catId,fid,gv){const f=getFase(catId,fid);if(f)f.gironi=f.gironi.filter(g=>g.id!==gv);sv();render();}
function updSq(catId,fid,gv,idx,field,val){const g=getGirone(catId,fid,gv);if(g){g.squadre[idx][field]=val;sv();}}
function saveSquadre(catId,fid,gv){
  const g=getGirone(catId,fid,gv);if(!g)return;
  const giocate=g.partite.filter(p=>p.s1h!==''||p.s1a!=='').length;
  if(giocate>0&&!confirm(`Attenzione: ci sono ${giocate} risultat${giocate===1?'o':'i'} già inserit${giocate===1?'o':'i'}. Rigenerare le partite li cancellerà. Continuare?`))return;
  g.partite=genPartite(g.squadre.length,g.ritorno||false,g.sets||2);sv();render();
}
function apriSegnapunti(catId,fid,gv,pid){
  const existing=document.getElementById('_sqModal');
  if(existing)existing.remove();
  const modal=document.createElement('div');
  modal.id='_sqModal';
  modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
  modal.innerHTML=`<div style="background:#fff;border-radius:16px;padding:24px;max-width:340px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,.2)">
    <div style="font-weight:700;font-size:16px;margin-bottom:6px">📲 Link segnapunti</div>
    <div style="font-size:13px;color:#6b7280;margin-bottom:18px">Scegli la modalità per il segnapunti</div>
    <button onclick="generaLinkSegnapunti('${catId}','${fid}','${gv}',${pid},'finale')"
      style="display:block;width:100%;padding:14px;margin-bottom:10px;background:#1e40af;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;text-align:left">
      📋 Risultato finale
      <div style="font-size:12px;font-weight:400;opacity:.85;margin-top:2px">Inserisce il punteggio a fine partita</div>
    </button>
    <button onclick="generaLinkSegnapunti('${catId}','${fid}','${gv}',${pid},'live')"
      style="display:block;width:100%;padding:14px;margin-bottom:16px;background:#166534;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;text-align:left">
      ⚡ Punto per punto
      <div style="font-size:12px;font-weight:400;opacity:.85;margin-top:2px">Segna i punti in tempo reale</div>
    </button>
    <button onclick="document.getElementById('_sqModal').remove()"
      style="display:block;width:100%;padding:10px;background:#f3f4f6;color:#374151;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer">
      Annulla
    </button>
  </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click',function(e){if(e.target===modal)modal.remove();});
}

function mandaWhatsApp(link){
  var msg='Ciao! Ecco il link per segnare la partita:\n'+link;
  window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
}
function generaLinkSegnapunti(catId,fid,gv,pid,mode){
  const base=location.origin+location.pathname.replace('index.html','')+'segnapunti.html';
  const g_sq=getGirone(catId,fid,gv);
  const timerParam=g_sq&&g_sq.timerAttivo?'&timer='+( g_sq.timerMinuti||12):'';
  const link=base+'?u='+(window._currentUid||'')+'&t='+currentTorneoId+'&c='+catId+'&f='+fid+'&g='+gv+'&p='+pid+'&m='+mode+timerParam;
  const modal=document.getElementById('_sqModal');
  if(modal){
    modal.innerHTML=`<div style="background:#fff;border-radius:16px;padding:24px;max-width:340px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,.2)">
      <div style="font-weight:700;font-size:16px;margin-bottom:4px">📲 ${mode==='live'?'⚡ Punto per punto':'📋 Risultato finale'}</div>
      <div style="font-size:12px;color:#6b7280;margin-bottom:16px">Fai scansionare il QR o copia il link</div>
      <div id="_sqQR" style="text-align:center;margin-bottom:16px"></div>
      <div style="background:#f3f4f6;border-radius:8px;padding:10px;font-size:11px;word-break:break-all;color:#374151;margin-bottom:14px">${link}</div>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <button class="bp bsm" style="flex:1" onclick="navigator.clipboard.writeText('${link}').then(()=>alert('Link copiato!'))">📋 Copia</button>
        <button onclick="mandaWhatsApp('${link}')"
          style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px;background:#25d366;color:#fff;border-radius:8px;font-size:13px;font-weight:700;border:none;cursor:pointer">
          💬 WhatsApp
        </button>
      </div>
      <button onclick="document.getElementById('_sqModal').remove()"
        style="width:100%;padding:10px;background:#f3f4f6;color:#374151;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">
        Chiudi
      </button>
    </div>`;
    const qrDiv=document.getElementById('_sqQR');
    if(qrDiv){
      const qrImg=document.createElement('img');
      qrImg.src='https://api.qrserver.com/v1/create-qr-code/?size=180x180&data='+encodeURIComponent(link);
      qrImg.style.cssText='width:180px;height:180px;border-radius:8px';
      qrDiv.appendChild(qrImg);
    }
  }
}
function toggleInCorso(catId,fid,gv,pid){
  const g=getGirone(catId,fid,gv);if(!g)return;
  const p=g.partite[pid];if(!p)return;
  // Se attivo, disattiva tutti gli altri "in corso" in tutti i gironi della stessa categoria
  if(!p.inCorso){
    const cat=getCat(catId);
    (cat?.fasi||[]).forEach(f=>(f.gironi||[]).forEach(gg=>gg.partite.forEach(pp=>{pp.inCorso=false;})));
  }
  p.inCorso=!p.inCorso;
  sv();render();
}
function cambiaSetGirone(catId,fid,gv,nuoviSet){
  const g=getGirone(catId,fid,gv);if(!g)return;
  if(g.sets===nuoviSet)return;
  const giocate=g.partite.filter(p=>p.s1h!==''||p.s1a!=='').length;
  if(giocate>0&&!confirm(`Cambiare da ${g.sets} a ${nuoviSet} set? I risultati del Set ${nuoviSet===1?'2 verranno ignorati':'2 saranno vuoti da compilare'}.`))return;
  g.sets=nuoviSet;
  // Aggiorna sets in ogni partita
  g.partite.forEach(p=>{p.sets=nuoviSet;if(nuoviSet===1){p.s2h='';p.s2a='';}});
  sv();render();
}
function approvaIscrizione(iscId){
  const isc=(window._iscrizioniAttesa||[]).find(i=>i.id===iscId);
  if(!isc)return;
  // Aggiungi società al torneo
  const t=currentTorneo();if(!t)return;
  if(!t.societa)t.societa=[];
  // Costruisci bambini da atleti
  const bambini={};
  for(const k in isc.atlPerCat||{})bambini[k]=isc.atlPerCat[k]||0;
  t.societa.push({
    nome:isc.nomeSoc,
    sqPerCat:{...isc.sqPerCat},
    bambini,
    logo:isc.logo||'',
    referenti:[{nome:isc.dirigente,email:isc.email,tel:isc.cellulare}],
    squadre:[]
  });
  sv();
  // Segna come approvata su Firestore
  if(window._fbDb&&window._currentUid){
    window._fbDb.collection('iscrizioni').doc(window._currentUid+'_'+currentTorneoId)
      .collection('richieste').doc(iscId).update({stato:'approvata'}).catch(()=>{});
  }
  window._iscrizioniAttesa=(window._iscrizioniAttesa||[]).filter(i=>i.id!==iscId);
  render();
}
function rifiutaIscrizione(iscId){
  if(!confirm('Rifiutare questa iscrizione?'))return;
  if(window._fbDb&&window._currentUid){
    window._fbDb.collection('iscrizioni').doc(window._currentUid+'_'+currentTorneoId)
      .collection('richieste').doc(iscId).update({stato:'rifiutata'}).catch(()=>{});
  }
  window._iscrizioniAttesa=(window._iscrizioniAttesa||[]).filter(i=>i.id!==iscId);
  render();
}
function copiaIscLink(){
  const link=location.origin+location.pathname.replace('index.html','')+'iscrizione.html?u='+(window._currentUid||'')+'&t='+currentTorneoId;
  navigator.clipboard.writeText(link).then(()=>alert('Link copiato!')).catch(()=>{prompt('Copia il link:',link);});
}
function toggleIscrizioni(val){
  const t=currentTorneo();if(!t)return;
  t.iscrizioniAperte=val;
  if(val&&!t.iscrizioniConfig)t.iscrizioniConfig={};
  sv();render();
}
function saveIscCfg(key,val){
  const t=currentTorneo();if(!t)return;
  if(!t.iscrizioniConfig)t.iscrizioniConfig={};
  t.iscrizioniConfig[key]=val;sv();
}
function saveIscCatInfo(catId,key,val){
  const t=currentTorneo();if(!t)return;
  if(!t.iscrizioniConfig)t.iscrizioniConfig={};
  if(!t.iscrizioniConfig.catInfo)t.iscrizioniConfig.catInfo={};
  if(!t.iscrizioniConfig.catInfo[catId])t.iscrizioniConfig.catInfo[catId]={};
  t.iscrizioniConfig.catInfo[catId][key]=val;sv();
}
function toggleTimerGirone(catId,fid,gv,val){
  const g=getGirone(catId,fid,gv);if(!g)return;
  g.timerAttivo=val;
  if(val&&!g.timerMinuti)g.timerMinuti=12;
  sv();render();
}
function setTimerMinuti(catId,fid,gv,val){
  const g=getGirone(catId,fid,gv);if(!g)return;
  g.timerMinuti=val;sv();
}
function toggleRitorno(catId,fid,gv){const g=getGirone(catId,fid,gv);if(!g)return;g.ritorno=!g.ritorno;const old={};g.partite.filter(p=>p.leg===1||!p.leg).forEach(p=>{old[`${p.h}_${p.a}`]=p});const np=genPartite(g.squadre.length,g.ritorno,g.sets||2);np.forEach(p=>{if(p.leg===1){const o=old[`${p.h}_${p.a}`];if(o){p.s1h=o.s1h;p.s1a=o.s1a;p.s2h=o.s2h;p.s2a=o.s2a;}}});g.partite=np;sv();render();}
function saveResult(catId,fid,gv,pid){
  const g=getGirone(catId,fid,gv);if(!g)return;
  const p=g.partite[pid];
  // Leggi valori dalla cache
  ['s1h','s1a','s2h','s2a'].forEach(f=>{const k=icKey(catId,fid,gv,pid,f);if(IC[k]!==undefined)p[f]=IC[k];});
  // Validazione: set 1 obbligatorio
  const s1h=parseInt(p.s1h),s1a=parseInt(p.s1a);
  if(p.s1h===''||p.s1a===''||isNaN(s1h)||isNaN(s1a)){
    alert('Inserisci il punteggio del Set 1 per entrambe le squadre.');return;
  }
  if(s1h<0||s1a<0){alert('I punteggi non possono essere negativi.');return;}
  if(s1h===s1a){alert('Il Set 1 non può finire in parità (stesso punteggio).');return;}
  // Salva timestamp inserimento
  if(!p.ts)p.ts=Date.now();
  sv();render();
}
function setCampoGirone(catId,fid,gv,val){
  const g=getGirone(catId,fid,gv);if(!g)return;
  g.campo=val.trim();sv();
}
function salvaCampoPartita(catId,fid,gv,pid,val){
  const g=getGirone(catId,fid,gv);if(!g)return;
  if(g.partite[pid])g.partite[pid].campo=val.trim();sv();
}
function salvaNotaPartita(catId,fid,gv,pid,val){
  const g=getGirone(catId,fid,gv);if(!g)return;
  if(g.partite[pid])g.partite[pid].nota=val;
  sv();
}
function clearResult(catId,fid,gv,pid){const g=getGirone(catId,fid,gv);if(!g)return;const p=g.partite[pid];p.s1h='';p.s1a='';p.s2h='';p.s2a='';['s1h','s1a','s2h','s2a'].forEach(f=>delete IC[icKey(catId,fid,gv,pid,f)]);sv();render();}
function renameFase(evt,catId,fid){
  evt.stopPropagation();
  const fase=getFase(catId,fid);if(!fase)return;
  const nome=prompt('Rinomina fase:',fase.label);
  if(!nome||!nome.trim())return;
  fase.label=nome.trim();sv();render();
}
function delFase(catId,fid){
  const fase=getFase(catId,fid);
  const hasDati=(fase?.gironi||[]).some(g=>g.partite.some(p=>p.s1h!==''||p.s1a!==''));
  const msg=hasDati
    ?`Eliminare "${fase?.label||'questa fase'}"? Contiene risultati già inseriti che andranno persi.`
    :`Eliminare "${fase?.label||'questa fase'}"?`;
  if(!confirm(msg))return;
  const cat=getCat(catId);if(cat)cat.fasi=cat.fasi.filter(f=>f.id!==fid);sv();render();
}
function saveElim(catId,fid,mk){const f=getFase(catId,fid);if(!f||!f.elim)return;const m=f.elim[mk];if(!m)return;['s1h','s1a','s2h','s2a'].forEach(field=>{const k=`elim_${fid}_${mk}_${field}`;if(IC[k]!==undefined)m[field]=IC[k];});propagateElim(f);sv();render();}
function onInputElim(fid,mk,field,val){IC[`elim_${fid}_${mk}_${field}`]=val;}
function getVElim(fid,mk,field,saved){const k=`elim_${fid}_${mk}_${field}`;return IC[k]!==undefined?IC[k]:saved;}

// ============================================================
// RENDER CATEGORIA
// ============================================================
function renderCategoria(catId){
  const cat=getCat(catId);if(!cat)return`<div style="text-align:center;padding:3rem;color:var(--txt2)">Categoria non trovata.</div>`;
  const fasi=cat.fasi||[];const col=cat.colore;
  if(builderState&&builderState.cat===catId)return renderBuilder(catId);
  if(!fasi.length||!fasi[0]?.gironi?.length)return`<div style="text-align:center;padding:3rem;color:var(--txt2)">
    <p>Nessun girone per ${cat.emoji} ${cat.nome}.<br>Vai in ⚙️ Setup e clicca + Girone.</p></div>`;
  let html='';
  // Sub-tab vista — usa variabile globale dedicata
  if(!window._catView)window._catView={};
  const catView=window._catView[catId]||'gironi';
  html+=`<div style="display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap">
    <button class="bsm${catView==='gironi'?' bp':''}" onclick="setCatView('${catId}','gironi')">🏐 Gironi</button>
    <button class="bsm${catView==='storico'?' bp':''}" onclick="setCatView('${catId}','storico')">📋 Storico</button>
    <button class="bsm${catView==='stats'?' bp':''}" onclick="setCatView('${catId}','stats')">📊 Statistiche</button>
    <button class="bsm" style="margin-left:auto" onclick="exportPDFCategoria('${catId}')">📄 PDF categoria</button>
  </div>`;
  if(catView==='storico'){html+=renderStorico(catId);html+=`<div class="card" style="text-align:center;padding:1.5rem"><button class="bp" onclick="openBuilder('${catId}')">+ Fase successiva</button></div>`;return html;}
  if(catView==='stats'){html+=renderStats(catId);html+=`<div class="card" style="text-align:center;padding:1.5rem"><button class="bp" onclick="openBuilder('${catId}')">+ Fase successiva</button></div>`;return html;}
  for(let fi=0;fi<fasi.length;fi++){
    const fase=fasi[fi];const isElim=fase.tipo==='elim';const isCollapsed=collapsed.has(fase.id);
    const giocate=fase.gironi?.reduce((s,g)=>s+g.partite.filter(p=>p.s1h!==''&&p.s1a!=='').length,0)||0;
    const totP=fase.gironi?.reduce((s,g)=>s+g.partite.length,0)||0;
    html+=`<div class="card"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:8px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;cursor:pointer" onclick="toggleCollapse('${fase.id}')">
        <span style="font-size:18px;color:var(--txt2)">${isCollapsed?'▶':'▼'}</span>
        <span style="font-size:16px;font-weight:600" 
          ondblclick="renameFase(event,'${catId}','${fase.id}')"
          title="Doppio click per rinominare">${fase.label}</span>
        <span style="font-size:11px;padding:3px 10px;border-radius:20px;background:#fef9c3;color:#854d0e;font-weight:500">${isElim?'⚡ Eliminazione':isCollapsed?`${giocate}/${totP} partite`:`${fase.gironi?.length||0} giron${(fase.gironi?.length||0)===1?'e':'i'}`}</span>
      </div>
      ${fi>0?`<button class="bsm bd" onclick="delFase('${catId}','${fase.id}')">✕ Elimina</button>`:''}
    </div>`;
    if(!isCollapsed){
      if(isElim)html+=renderElimBlock(catId,fase);
      else{
        for(const g of fase.gironi)html+=renderGironeContent(catId,fase,g);
        const sizes=[...new Set(fase.gironi.map(g=>g.squadre.length))];
        if(fase.gironi.length>1&&sizes.length>1){
          html+=`<div style="background:var(--info);border-radius:8px;padding:12px;margin-top:4px"><div class="sec">Classifica avulsa passaggio turno</div>
          ${[0,1].map(pos=>{
            const cands=fase.gironi.map(g=>{const cl=calcCl(g);const tt=cl[pos];return tt?{...tt,girone:g.label,qs:tt.sp>0?tt.sv/tt.sp:tt.sv,qp:tt.pp>0?tt.pv/tt.pp:tt.pv}:null}).filter(Boolean);
            cands.sort((a,b)=>Math.abs(b.qs-a.qs)>0.001?b.qs-a.qs:b.qp-a.qp);
            return cands.length?`<div style="margin-bottom:10px"><div style="font-size:12px;font-weight:500;margin-bottom:6px">${pos+1}° per girone</div>
            <table><thead><tr><th>#</th><th>Squadra</th><th>Soc</th><th>Girone</th><th>Q.Set</th><th>Q.Pt</th></tr></thead><tbody>
            ${cands.map((tt,i)=>`<tr><td style="font-weight:700">${i+1}</td><td style="font-weight:500">${tt.nome}</td><td style="font-size:11px;color:var(--txt2)">${tt.soc||''}</td><td>${tt.girone}</td><td>${tt.sp>0?(tt.sv/tt.sp).toFixed(2):tt.sv}</td><td>${tt.pp>0?(tt.pv/tt.pp).toFixed(2):tt.pv}</td></tr>`).join('')}
            </tbody></table></div>`:'';
          }).join('')}</div>`;
        }
      }
    }
    html+=`</div>`;
  }
  // Banner riepilogo: quante partite totali giocate
  const totAll=cat.fasi.flatMap(f=>f.gironi||[]).reduce((s,g)=>s+g.partite.length,0);
  const playAll=cat.fasi.flatMap(f=>f.gironi||[]).reduce((s,g)=>s+g.partite.filter(p=>p.s1h!==''&&p.s1a!=='').length,0);
  const hasElim=cat.fasi.some(f=>f.tipo==='elim');
  if(!hasElim){
    html+=`<div class="card" style="text-align:center;padding:1.5rem">
      ${playAll===totAll&&totAll>0
        ?`<div style="font-size:13px;color:var(--saved-txt);background:var(--saved-bg);border-radius:8px;padding:8px 14px;margin-bottom:12px">✅ Tutte le ${totAll} partite completate!</div>`
        :`<p style="font-size:13px;color:var(--txt2);margin-bottom:6px">${playAll}/${totAll} partite inserite</p>`}
      <p style="font-size:13px;color:var(--txt2);margin-bottom:12px">Creare una fase successiva?</p>
      <button class="bp" onclick="openBuilder('${catId}')">+ Fase successiva</button>
    </div>`;
  }
  return html;
}

function renderGironeContent(catId,fase,g){
  const cl=calcCl(g);const sets=g.sets||2;
  const andataP=g.partite.filter(p=>!p.leg||p.leg===1);const ritornoP=g.partite.filter(p=>p.leg===2);
  const giocate=g.partite.filter(p=>p.s1h!==''&&p.s1a!=='').length;
  const badgeSt=catBadgeStyle(catId);
  let clHtml=`<table><thead><tr><th>#</th><th>Squadra</th><th>Soc</th><th>Pt</th>${sets===2?'<th>Sv</th><th>Sp</th><th>DS</th>':''}<th>DP</th></tr></thead><tbody>`;
  cl.forEach((tt,i)=>{
    const logoSrc=getSocLogoAdmin(tt.soc);
    const logoTag=logoSrc?`<img src="${logoSrc}" style="width:22px;height:22px;object-fit:contain;border-radius:4px;background:#fff;padding:1px;margin-right:5px;vertical-align:middle" onerror="this.style.display='none'">`:'';
  clHtml+=`<tr><td class="${i===0?'pos1':i===1?'pos2':i===2?'pos3':''}" style="font-weight:700">${i+1}</td><td style="font-weight:500">${logoTag}${tt.nome}</td><td style="font-size:11px;color:var(--txt2)">${tt.soc||''}</td><td style="font-weight:700;font-size:15px">${tt.pt}</td>${sets===2?`<td>${tt.sv}</td><td>${tt.sp}</td><td class="${tt.ds>0?'dsp':tt.ds<0?'dsn':''}">${tt.ds>0?'+':''}${tt.ds}</td>`:''}<td class="${tt.dp>0?'dsp':tt.dp<0?'dsn':''}">${tt.dp>0?'+':''}${tt.dp}</td></tr>`;});
  clHtml+=`</tbody></table><p style="font-size:11px;color:var(--txt2);margin-top:6px">Pt=set vinti${sets===2?' · DS=diff set':''} · DP=diff punti</p>`;
  function rPL(pList){return pList.map(p=>{
    const pid=g.partite.indexOf(p);const hn=g.squadre[p.h].nome,an=g.squadre[p.a].nome;
    const hs=g.squadre[p.h].soc||'',as=g.squadre[p.a].soc||'';const played=p.s1h!==''&&p.s1a!=='';
    const V=(f,sv2)=>getV(catId,fase.id,g.id,pid,f,sv2);
    const campoEff=p.campo||g.campo||'';
    return`<div class="match-card">
      ${p.leg===2?`<div style="font-size:10px;background:#fef9c3;color:#854d0e;border-radius:4px;padding:2px 8px;display:inline-block;margin-bottom:4px;font-weight:600">RITORNO</div>`:''}
      ${campoEff?`<div style="font-size:10px;background:var(--info);color:var(--txt2);border-radius:4px;padding:2px 8px;display:inline-block;margin-bottom:4px;font-weight:600">📍 ${campoEff}</div>`:''}
      <div class="match-teams">
        <div style="display:flex;align-items:center;gap:5px">
          ${(()=>{const l=getSocLogoAdmin(hs);return l?`<img src="${l}" style="width:22px;height:22px;object-fit:contain;border-radius:4px;background:#fff;padding:1px" onerror="this.style.display='none'">`:''})()}
          <span>${hn}</span><span class="soc-tag"> (${hs||'—'})</span>
        </div>
        <span style="font-weight:400;color:var(--txt2);font-size:12px">vs</span>
        <div style="display:flex;align-items:center;gap:5px">
          ${(()=>{const l=getSocLogoAdmin(as);return l?`<img src="${l}" style="width:22px;height:22px;object-fit:contain;border-radius:4px;background:#fff;padding:1px" onerror="this.style.display='none'">`:''})()}
          <span>${an}</span><span class="soc-tag"> (${as||'—'})</span>
        </div>
      </div>
      <div class="set-row"><span class="set-lbl">Set 1</span><input type="number" class="score" inputmode="numeric" value="${V('s1h',p.s1h)}" placeholder="0" oninput="onInput('${catId}','${fase.id}','${g.id}',${pid},'s1h',this.value)"><span class="sep">–</span><input type="number" class="score" inputmode="numeric" value="${V('s1a',p.s1a)}" placeholder="0" oninput="onInput('${catId}','${fase.id}','${g.id}',${pid},'s1a',this.value)"></div>
      ${sets===2?`<div class="set-row"><span class="set-lbl">Set 2</span><input type="number" class="score" inputmode="numeric" value="${V('s2h',p.s2h)}" placeholder="0" oninput="onInput('${catId}','${fase.id}','${g.id}',${pid},'s2h',this.value)"><span class="sep">–</span><input type="number" class="score" inputmode="numeric" value="${V('s2a',p.s2a)}" placeholder="0" oninput="onInput('${catId}','${fase.id}','${g.id}',${pid},'s2a',this.value)"></div>`:''}
      <div class="save-row">
        <button class="${p.inCorso?'bg':'bsm'}" style="padding:8px;font-size:11px" onclick="toggleInCorso('${catId}','${fase.id}','${g.id}',${pid})" title="Segna come partita in corso nella live">${p.inCorso?'🔴 In corso':'▶ Live'}</button>
        <button class="bp" style="flex:1;padding:8px;font-size:13px;font-weight:600" onclick="saveResult('${catId}','${fase.id}','${g.id}',${pid})">✓ Salva</button>
        ${played?`<button style="padding:8px 14px;font-size:13px" class="bd" onclick="clearResult('${catId}','${fase.id}','${g.id}',${pid})">✕</button>`:''}
      </div>
      <div style="margin-top:4px">
        <button class="bsm" style="font-size:11px;width:100%;padding:6px" onclick="apriSegnapunti('${catId}','${fase.id}','${g.id}',${pid})">📲 Link segnapunti</button>
      </div>
      ${played?`<div class="saved">✓ Set1: ${p.s1h}–${p.s1a}${sets===2&&p.s2h!==''?' | Set2: '+p.s2h+'–'+p.s2a:''}</div>`:''}
      <div style="display:flex;gap:6px;align-items:center;margin-top:4px;flex-wrap:wrap">
        <input type="text" value="${p.campo||''}" placeholder="📍 Campo"
          title="Campo partita (sovrascrive quello del girone)"
          style="font-size:11px;padding:4px 8px;color:var(--txt2);background:transparent;border:1px dashed var(--border);width:90px"
          onblur="salvaCampoPartita('${catId}','${fase.id}','${g.id}',${pid},this.value)">
        <input type="text" value="${p.nota||''}" placeholder="📝 Nota"
          title="Nota partita (campo, orario, arbitro...)"
          style="font-size:11px;padding:4px 8px;color:var(--txt2);background:transparent;border:1px dashed var(--border);flex:1"
          onblur="salvaNotaPartita('${catId}','${fase.id}','${g.id}',${pid},this.value)">
      </div>
    </div>`;}).join('');}
  return`<div class="girone-box"><div class="girone-hdr">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <span style="font-size:13px;padding:3px 10px;border-radius:20px;font-weight:600;${badgeSt}">Girone ${g.label}${g.campo?' — 📍 '+g.campo:''}</span>
      <span style="font-size:12px;color:var(--txt2)">${giocate}/${g.partite.length} partite · ${sets} set</span>
    </div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:6px">
        <label class="toggle"><input type="checkbox" ${g.ritorno?'checked':''} onchange="toggleRitorno('${catId}','${fase.id}','${g.id}')"><span class="slider"></span></label>
        <span style="font-size:13px;color:var(--txt2)">A/R</span>
      </div>
      <select style="width:auto;padding:4px 8px;font-size:12px" onchange="cambiaSetGirone('${catId}','${fase.id}','${g.id}',parseInt(this.value))">
        <option value="1"${sets===1?' selected':''}>1 set</option>
        <option value="2"${sets===2?' selected':''}>2 set</option>
      </select>
      <div style="display:flex;align-items:center;gap:6px">
        <label class="toggle" title="Partita a tempo">
          <input type="checkbox" ${g.timerAttivo?'checked':''} onchange="toggleTimerGirone('${catId}','${fase.id}','${g.id}',this.checked)">
          <span class="slider"></span>
        </label>
        <span style="font-size:13px;color:var(--txt2)">⏱ Tempo</span>
        ${g.timerAttivo?`<input type="number" min="1" max="60" value="${g.timerMinuti||12}"
          style="width:52px;padding:4px 6px;font-size:12px;text-align:center"
          onchange="setTimerMinuti('${catId}','${fase.id}','${g.id}',parseInt(this.value)||12)"
          title="Minuti per partita"> min`:''}
      </div>
      <button class="bg bsm" onclick="exportPDF('${catId}','${fase.id}','${g.id}')">📄 PDF</button>
    </div></div>
    <div class="g2"><div><div class="sec">Classifica</div>${clHtml}</div><div><div class="sec">Partite${g.ritorno?' — Andata':''}</div>${rPL(andataP)}${ritornoP.length?`<div class="sec" style="margin-top:14px">Ritorno</div>${rPL(ritornoP)}`:''}</div></div>
  </div>`;
}

// ============================================================
// STORICO PARTITE
// ============================================================
function renderStorico(catId){
  const cat=getCat(catId);if(!cat)return'';
  const col=cat.colore;
  // Raccoglie tutte le partite giocate con info girone/fase
  const partiteGiocate=[];
  for(const fase of(cat.fasi||[])){
    if(fase.tipo==='elim')continue;
    for(const g of(fase.gironi||[])){
      for(let i=0;i<g.partite.length;i++){
        const p=g.partite[i];
        if(p.s1h===''||p.s1a==='')continue;
        partiteGiocate.push({p,g,fase,idx:i});
      }
    }
  }
  // Ordina per timestamp (più recente prima), poi per indice
  partiteGiocate.sort((a,b)=>(b.p.ts||0)-(a.p.ts||0)||(b.idx-a.idx));
  if(!partiteGiocate.length)return`<div class="card" style="text-align:center;padding:2rem;color:var(--txt2)">
    <p>Nessuna partita ancora giocata.</p></div>`;
  let html=`<div class="card"><div class="card-title" style="margin-bottom:1rem">📋 Storico partite — ${partiteGiocate.length} risultati</div>`;
  let lastDate='';
  for(const{p,g,fase,idx}of partiteGiocate){
    const hn=g.squadre[p.h].nome,an=g.squadre[p.a].nome;
    const hs=g.squadre[p.h].soc||'',as=g.squadre[p.a].soc||'';
    const sets=g.sets||2;
    const s1w=parseInt(p.s1h)>parseInt(p.s1a),s2w=sets===2&&p.s2h!==''?(parseInt(p.s2h)>parseInt(p.s2a)):null;
    const svH=(s1w?1:0)+(s2w===true?1:0),svA=(s1w?0:1)+(s2w===false?1:0);
    const hWin=svH>svA,aWin=svA>svH;
    const dateStr=p.ts?new Date(p.ts).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'—';
    const dayStr=p.ts?new Date(p.ts).toLocaleDateString('it-IT'):'';
    if(dayStr&&dayStr!==lastDate){
      html+=`<div style="font-size:11px;font-weight:700;color:var(--txt2);text-transform:uppercase;padding:8px 0 4px;border-top:1px solid var(--border);margin-top:4px">${dayStr}</div>`;
      lastDate=dayStr;
    }
    html+=`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="font-size:11px;padding:1px 6px;border-radius:8px;${catBadgeStyle(catId)}">${fase.label} · Girone ${g.label}</span>
          ${p.leg===2?'<span style="font-size:10px;background:#fef9c3;color:#854d0e;padding:1px 5px;border-radius:4px">RIT</span>':''}
        </div>
        <div style="margin-top:4px;font-size:13px">
          <span style="font-weight:${hWin?'700':'400'};color:${hWin?col:'var(--txt)'}">${hn}</span>
          <span style="color:var(--txt2);margin:0 4px;font-size:11px">${hs||''}</span>
          <span style="color:var(--txt2);font-size:11px">vs</span>
          <span style="font-weight:${aWin?'700':'400'};color:${aWin?col:'var(--txt)'}"> ${an}</span>
          <span style="color:var(--txt2);margin:0 4px;font-size:11px">${as||''}</span>
        </div>
        ${p.nota?`<div style="font-size:11px;color:var(--txt2);margin-top:2px">📝 ${p.nota}</div>`:''}
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:16px;font-weight:800;color:${col}">${p.s1h}–${p.s1a}${sets===2&&p.s2h!==''?' / '+p.s2h+'–'+p.s2a:''}</div>
        <div style="font-size:10px;color:var(--txt2)">${dateStr}</div>
      </div>
    </div>`;
  }
  html+=`</div>`;
  return html;
}

// ============================================================
// STATISTICHE CATEGORIA
// ============================================================
function renderStats(catId){
  const cat=getCat(catId);if(!cat)return'';
  const col=cat.colore;
  // Raccoglie statistiche per squadra su tutte le fasi gironi
  const squadreMap={};
  for(const fase of(cat.fasi||[])){
    if(fase.tipo==='elim')continue;
    for(const g of(fase.gironi||[])){
      for(const sq of g.squadre){
        if(!squadreMap[sq.nome])squadreMap[sq.nome]={nome:sq.nome,soc:sq.soc||'',pt:0,sv:0,sp:0,pv:0,pp:0,pg:0};
      }
      for(const p of g.partite){
        if(p.s1h===''||p.s1a==='')continue;
        const sets=g.sets||2;
        const s1h=parseInt(p.s1h)||0,s1a=parseInt(p.s1a)||0;
        const has2=sets===2&&p.s2h!=='';
        const s2h=has2?parseInt(p.s2h)||0:0,s2a=has2?parseInt(p.s2a)||0:0;
        const sh=(s1h>s1a?1:0)+(has2&&s2h>s2a?1:0);
        const sa=(s1a>s1h?1:0)+(has2&&s2a>s2h?1:0);
        const hn=g.squadre[p.h].nome,an=g.squadre[p.a].nome;
        if(squadreMap[hn]){squadreMap[hn].pt+=sh;squadreMap[hn].sv+=sh;squadreMap[hn].sp+=sa;squadreMap[hn].pv+=s1h+(has2?s2h:0);squadreMap[hn].pp+=s1a+(has2?s2a:0);squadreMap[hn].pg++;}
        if(squadreMap[an]){squadreMap[an].pt+=sa;squadreMap[an].sv+=sa;squadreMap[an].sp+=sh;squadreMap[an].pv+=s1a+(has2?s2a:0);squadreMap[an].pp+=s1h+(has2?s2h:0);squadreMap[an].pg++;}
      }
    }
  }
  const squadre=Object.values(squadreMap).filter(s=>s.pg>0);
  if(!squadre.length)return`<div class="card" style="text-align:center;padding:2rem;color:var(--txt2)"><p>Nessun risultato ancora inserito.</p></div>`;

  // Classifiche speciali
  const byPunti=[...squadre].sort((a,b)=>b.pt-a.pt||(b.sv-b.sp)-(a.sv-a.sp));
  const byAttacco=[...squadre].sort((a,b)=>b.pv-a.pv);
  const byDifesa=[...squadre].sort((a,b)=>a.pp-b.pp);
  const byMedia=[...squadre].filter(s=>s.pg>0).sort((a,b)=>(b.pt/b.pg)-(a.pt/a.pg));

  function topList(lista,label,valFn,icon){
    return`<div style="flex:1;min-width:200px">
      <div style="font-size:12px;font-weight:700;color:var(--txt2);text-transform:uppercase;margin-bottom:8px">${icon} ${label}</div>
      ${lista.slice(0,5).map((s,i)=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border)">
        <div>
          <span style="font-size:11px;font-weight:700;color:${i===0?col:'var(--txt2)'};margin-right:6px">${i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)+'.'}</span>
          <span style="font-size:13px;font-weight:${i===0?'700':'400'}">${s.nome}</span>
          <span style="font-size:10px;color:var(--txt2);margin-left:4px">${s.soc||''}</span>
        </div>
        <span style="font-size:14px;font-weight:700;color:${col}">${valFn(s)}</span>
      </div>`).join('')}
    </div>`;
  }

  return`<div class="card">
    <div class="card-title" style="margin-bottom:1rem">📊 Statistiche — ${squadre.length} squadre · ${squadre.reduce((s,x)=>s+x.pg,0)/2|0} partite</div>
    <div style="display:flex;flex-wrap:wrap;gap:20px">
      ${topList(byPunti,'Classifica punti',s=>s.pt+' pt','🏆')}
      ${topList(byAttacco,'Miglior attacco',s=>s.pv+' pt fatti','⚡')}
      ${topList(byDifesa,'Miglior difesa',s=>s.pp+' pt subiti','🛡️')}
      ${topList(byMedia,'Media punti/partita',s=>(s.pt/s.pg).toFixed(2),'📈')}
    </div>
    <div style="margin-top:16px">
      <div style="font-size:12px;font-weight:700;color:var(--txt2);text-transform:uppercase;margin-bottom:8px">📋 Riepilogo completo</div>
      <table style="font-size:12px"><thead><tr><th>#</th><th>Squadra</th><th>Soc</th><th>PG</th><th>Pt</th><th>SV</th><th>SP</th><th>PF</th><th>PS</th></tr></thead><tbody>
      ${byPunti.map((s,i)=>`<tr><td style="font-weight:700;color:${i===0?col:'var(--txt2)'}">${i+1}</td><td style="font-weight:600">${s.nome}</td><td style="font-size:10px;color:var(--txt2)">${s.soc}</td><td>${s.pg}</td><td style="font-weight:700;color:${col}">${s.pt}</td><td>${s.sv}</td><td>${s.sp}</td><td style="color:#166534">${s.pv}</td><td style="color:#991b1b">${s.pp}</td></tr>`).join('')}
      </tbody></table>
    </div>
  </div>`;
}

function renderElimMatch(catId,fid,mk,m,title,sets){
  if(!m)return'';const es=sets||1;const w=getWinner(m,es);const played=m.s1h!==''&&m.s1a!=='';
  return`<div class="elim-card"><div class="elim-lbl">${title}</div>
    <div class="elim-team${w===m.t1?' win':played?' lose':''}"><div><div>${m.t1||'—'}</div>${m.da1?`<div class="org">${m.da1}</div>`:''}</div>${w===m.t1?'🏆':''}</div>
    <div class="elim-team${w===m.t2?' win':played?' lose':''}"><div><div>${m.t2||'—'}</div>${m.da2?`<div class="org">${m.da2}</div>`:''}</div>${w===m.t2?'🏆':''}</div>
    <div class="set-row" style="margin-top:10px"><span class="set-lbl">Set 1</span>
      <input type="number" class="score" inputmode="numeric" value="${getVElim(fid,mk,'s1h',m.s1h||'')}" placeholder="0" oninput="onInputElim('${fid}','${mk}','s1h',this.value)">
      <span class="sep">–</span>
      <input type="number" class="score" inputmode="numeric" value="${getVElim(fid,mk,'s1a',m.s1a||'')}" placeholder="0" oninput="onInputElim('${fid}','${mk}','s1a',this.value)">
    </div>
    ${es===2?`<div class="set-row"><span class="set-lbl">Set 2</span>
      <input type="number" class="score" inputmode="numeric" value="${getVElim(fid,mk,'s2h',m.s2h||'')}" placeholder="0" oninput="onInputElim('${fid}','${mk}','s2h',this.value)">
      <span class="sep">–</span>
      <input type="number" class="score" inputmode="numeric" value="${getVElim(fid,mk,'s2a',m.s2a||'')}" placeholder="0" oninput="onInputElim('${fid}','${mk}','s2a',this.value)">
    </div>`:''}
    <button class="bp bsm" style="width:100%;margin-top:6px" onclick="saveElim('${catId}','${fid}','${mk}')">✓ Salva</button>
    ${played?`<div class="saved" style="margin-top:6px">✓ Vince ${w}</div>`:''}
  </div>`;
}

function renderElimBlock(catId,fase){
  const es=fase.elimSets||1;  // dichiarato per primo — evita TDZ
  const e=fase.elim||{};propagateElim(fase);const hasQ=e.q1||e.q2||e.q3||e.q4;
  const wF=getWinner(e.fin12,es),lF=getLoser(e.fin12,es),wF34=getWinner(e.fin34,es);
  let html=`<div style="display:flex;justify-content:flex-end;margin-bottom:8px">
    <button class="bg bsm" onclick="exportPDFElim('${catId}','${fase.id}')">📄 PDF tabellone</button>
  </div>`;
  if(wF){html+=`<div class="podium-grid"><div class="podium p2" style="margin-top:20px"><div style="font-size:28px">🥈</div><div class="podium-name">${lF||'—'}</div><div class="podium-lbl">2° posto</div></div><div class="podium p1"><div style="font-size:28px">🥇</div><div class="podium-name">${wF}</div><div class="podium-lbl">1° posto</div></div><div class="podium p3" style="margin-top:30px"><div style="font-size:28px">🥉</div><div class="podium-name">${wF34||'—'}</div><div class="podium-lbl">3° posto</div></div></div>`;}
  if(hasQ){html+=`<div class="bracket-round"><div class="bracket-title">⚡ Quarti di Finale</div><div class="bracket-grid">${['q1','q2','q3','q4'].filter(k=>e[k]).map((k,i)=>renderElimMatch(catId,fase.id,k,e[k],`Quarto ${i+1}: ${['1°vs8°','2°vs7°','3°vs6°','4°vs5°'][i]}`,es)).join('')}</div></div>`;}
  html+=`<div class="bracket-round"><div class="bracket-title">🏅 Semifinali</div><div class="bracket-grid">${renderElimMatch(catId,fase.id,'sf1',e.sf1,'Semifinale 1',es)}${renderElimMatch(catId,fase.id,'sf2',e.sf2,'Semifinale 2',es)}</div></div>`;
  html+=`<div class="bracket-round"><div class="bracket-title">🏆 Finali</div><div class="bracket-grid">${renderElimMatch(catId,fase.id,'fin12',e.fin12,'Finale 1° - 2° posto',es)}${renderElimMatch(catId,fase.id,'fin34',e.fin34,'Finale 3° - 4° posto',es)}</div></div>`;
  return html;
}

// ============================================================
// BUILDER FASE SUCCESSIVA
// ============================================================
function openBuilder(catId){
  const cat=getCat(catId);if(!cat)return;
  const fasi=cat.fasi||[];const last=fasi[fasi.length-1];
  if(!last||!last.gironi?.length){alert('Prima crea almeno un girone.');return;}
  const generale=classificaGenerale(last.gironi);
  const defaultElim=Math.min(8,generale.length);
  const topN=generale.slice(0,defaultElim);const dalN=generale.slice(defaultElim);
  builderState={cat:catId,gironi:last.gironi,generale,top8:topN,dal9:dalN,numElim:defaultElim,mode:'entrambi',gironiSets:getPref(catId,'sets',2),maxGironi:2,draft:buildDraftGironi(dalN,2)};render();
}
function buildDraftGironi(squadre,maxG){if(!squadre.length)return[];const nG=Math.min(maxG,Math.max(1,Math.floor(squadre.length/2)));const draft=Array.from({length:nG},(_,i)=>({label:String.fromCharCode(65+i),squadre:[]}));squadre.forEach((tt,i)=>draft[i%nG].squadre.push({nome:tt.nome,soc:tt.soc||'',posLabel:tt.posLabel}));return draft.filter(g=>g.squadre.length>=2);}
function setBuilderMode(m){
  if(!builderState)return;
  builderState.mode=m;
  if(m==='gironi')builderState.draft=buildDraftGironi(builderState.generale,builderState.maxGironi);
  else if(m==='quarti')builderState.draft=[];
  else builderState.draft=buildDraftGironi(builderState.dal9,builderState.maxGironi);
  render();
}
function setNumElim(n){if(!builderState)return;builderState.numElim=n;builderState.top8=builderState.generale.slice(0,n);builderState.dal9=builderState.generale.slice(n);builderState.draft=buildDraftGironi(builderState.dal9,builderState.maxGironi);render();}
function setMaxGironi(n){if(!builderState)return;builderState.maxGironi=n;builderState.draft=buildDraftGironi(builderState.mode==='gironi'?builderState.generale:builderState.dal9,n);render();}
function builderAddTeam(nome,soc,posLabel,gi){if(!builderState)return;builderState.draft.forEach(g=>{g.squadre=g.squadre.filter(s=>s.nome!==nome)});if(gi>=0&&gi<builderState.draft.length)builderState.draft[gi].squadre.push({nome,soc,posLabel});render();}
function builderAddGirone2(){if(!builderState)return;builderState.draft.push({label:String.fromCharCode(65+builderState.draft.length),squadre:[]});render();}
function builderRemoveGirone2(i){if(!builderState)return;builderState.draft.splice(i,1);render();}
function builderRemoveTeam2(gi,nome){if(!builderState)return;builderState.draft[gi].squadre=builderState.draft[gi].squadre.filter(s=>s.nome!==nome);render();}
function builderCancel(){builderState=null;render();}
function builderConfirm(){
  if(!builderState)return;
  const catId=builderState.cat;const cat=getCat(catId);if(!cat)return;
  const fasi=cat.fasi||[];
  const{mode,top8,dal9,draft,gironiSets,generale,maxGironi,numElim}=builderState;
  const prevFase=fasi[fasi.length-1];if(prevFase)collapsed.add(prevFase.id);
  const elimSets=builderState.elimSets||1;
  if(mode==='gironi'){const allDraft=buildDraftGironi(generale,maxGironi);const valid=allDraft.filter(g=>g.squadre.length>=2);if(!valid.length){alert('Nessun girone valido.');return;}fasi.push({id:uid(),label:`Fase ${fasi.length+1}`,tipo:'gironi',gironi:valid.map((d,i)=>({id:uid(),label:String.fromCharCode(65+i),squadre:d.squadre.map(s=>({nome:s.nome,soc:s.soc})),sets:gironiSets,ritorno:false,partite:genPartite(d.squadre.length,false,gironiSets)}))});}
  else if(mode==='quarti'){fasi.push({id:uid(),label:'Fase eliminazione',tipo:'elim',gironi:[],elimSets,elim:buildElimStruct(generale.slice(0,numElim))});}
  else{if(dal9.length>=2){const valid=draft.filter(g=>g.squadre.length>=2);if(valid.length)fasi.push({id:uid(),label:`Fase ${fasi.length+1} — Gironi (dal ${numElim+1}°)`,tipo:'gironi',gironi:valid.map((d,i)=>({id:uid(),label:String.fromCharCode(65+i),squadre:d.squadre.map(s=>({nome:s.nome,soc:s.soc})),sets:gironiSets,ritorno:false,partite:genPartite(d.squadre.length,false,gironiSets)}))});}fasi.push({id:uid(),label:`Fase eliminazione (Top ${numElim})`,tipo:'elim',gironi:[],elimSets,elim:buildElimStruct(top8)});}
  builderState=null;sv();render();
}

function renderNumElimSelector(numElim,totSq){
  const options=[{n:2,label:'2 — Finale diretta'},{n:4,label:'4 — Semifinali'},{n:8,label:'8 — Quarti di finale'},{n:16,label:'16 — Ottavi'},{n:32,label:'32 — Sedicesimi'}];
  const opts=options.filter(x=>x.n<=totSq).map(x=>`<option value="${x.n}"${numElim===x.n?' selected':''}>${x.label}</option>`).join('');
  const resto=totSq-numElim>0?'Le restanti '+(totSq-numElim)+' vanno ai gironi':'';
  return`<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap"><div class="sec" style="margin:0">Squadre alle eliminatorie:</div><select class="set-sel" onchange="setNumElim(parseInt(this.value))">${opts}</select>${resto?`<span style="font-size:12px;color:var(--txt2)">${resto}</span>`:''}</div>`;
}

function renderBuilder(catId){
  if(!builderState)return'';const cat=getCat(catId);
  const col=cat?.colore||'#166534';
  const{mode,top8,dal9,draft,gironiSets,maxGironi,numElim,generale}=builderState;const totSq=generale.length;const pool=mode==='gironi'?generale:dal9;
  let html=`<div class="card"><div class="card-title">Nuova fase — ${cat?.emoji||''} ${cat?.nome||''}</div>
    <p style="font-size:13px;color:var(--txt2);margin-bottom:1rem">Squadre totali: <strong>${totSq}</strong></p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:1.2rem">
      <div class="type-btn${mode==='gironi'?' sel':''}" onclick="setBuilderMode('gironi')"><h3>🏆 Solo gironi</h3><p>Tutte le ${totSq} squadre in gironi</p></div>
      <div class="type-btn${mode==='quarti'?' sel':''}" onclick="setBuilderMode('quarti')"><h3>⚡ Solo eliminazione</h3><p>Top ${numElim} → elim diretta</p></div>
      <div class="type-btn${mode==='entrambi'?' sel':''}" onclick="setBuilderMode('entrambi')"><h3>🔀 Entrambi</h3><p>Top ${numElim} → elim · Dal ${numElim+1}° → gironi</p></div>
    </div>
    ${mode!=='gironi'?renderNumElimSelector(numElim,totSq):''}
    <div style="background:var(--info);border-radius:8px;padding:12px;margin-bottom:12px">
      <div class="sec">Classifica generale</div>
      <table><thead><tr><th>#</th><th>Squadra</th><th>Soc</th><th>Da</th><th>Q.Set</th><th>Destino</th></tr></thead><tbody>
      ${generale.map((tt,i)=>`<tr style="${i<numElim?'background:rgba(254,249,195,0.3)':''}"><td style="font-weight:700;color:${i<numElim?'#854d0e':'#166534'}">${i+1}</td><td style="font-weight:600">${tt.nome}</td><td style="font-size:11px;color:var(--txt2)">${tt.soc||''}</td><td style="font-size:11px;color:var(--txt2)">${tt.posLabel}</td><td>${tt.sp>0?(tt.sv/tt.sp).toFixed(2):tt.sv}</td><td style="font-size:11px;font-weight:700;color:${i<numElim?'#854d0e':'#166534'}">${i<numElim?(mode==='gironi'?'🏆':'⚡ Elim'):(mode==='quarti'?'—':'🏆 Girone')}</td></tr>`).join('')}
      </tbody></table>
    </div>`;
  // Selector set per eliminazione (sempre visibile se non solo gironi)
  if(mode!=='gironi'){
    html+=`<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;flex-wrap:wrap">
      <div class="sec" style="margin:0">Set per eliminazione:</div>
      <select class="set-sel" onchange="builderState.elimSets=parseInt(this.value)">
        <option value="1"${(builderState.elimSets||1)===1?' selected':''}>1 set</option>
        <option value="2"${(builderState.elimSets||1)===2?' selected':''}>2 set</option>
      </select>
    </div>`;
  }
  if((mode==='entrambi'&&dal9.length>=2)||mode==='gironi'){
    const b=`font-size:13px;padding:3px 10px;border-radius:20px;font-weight:600;${catBadgeStyle(catId)}`;
    html+=`<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;flex-wrap:wrap">
      <div class="sec" style="margin:0">Gironi${mode==='entrambi'?' (dal '+numElim+'°)':''}:</div>
      <select class="set-sel" onchange="setMaxGironi(parseInt(this.value))">${[1,2,3,4,5,6].map(n=>`<option value="${n}"${maxGironi===n?' selected':''}>${n} giron${n===1?'e':'i'}</option>`).join('')}</select>
      <div class="sec" style="margin:0">Set:</div>
      <select class="set-sel" onchange="builderState.gironiSets=parseInt(this.value)"><option value="1"${gironiSets===1?' selected':''}>1 set</option><option value="2"${gironiSets===2?' selected':''}>2 set</option></select>
    </div>
    ${draft.map((g,gi)=>`<div class="fase2-box"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px">
      <span style="${b}">Girone ${g.label} — ${g.squadre.length} sq</span>
      <button class="bxsm bd" onclick="builderRemoveGirone2(${gi})">✕</button></div>
      <div style="min-height:28px;margin-bottom:8px;display:flex;flex-wrap:wrap;gap:4px">${g.squadre.length?g.squadre.map(s=>`<span class="team-chip">${s.nome}${s.soc?` <span style="opacity:.6;font-size:10px">(${s.soc})</span>`:''} <span style="font-size:10px;opacity:.5">${s.posLabel||''}</span><button onclick="builderRemoveTeam2(${gi},'${s.nome.replace(/'/g,"\\'")}')">×</button></span>`).join(''):'<span style="font-size:12px;color:var(--txt2)">Nessuna squadra</span>'}</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">${pool.filter(tt=>!g.squadre.find(s=>s.nome===tt.nome)).map(tt=>`<button class="bxsm" onclick="builderAddTeam('${tt.nome.replace(/'/g,"\\'")}','${(tt.soc||'').replace(/'/g,"\\'")}','${(tt.posLabel||'').replace(/'/g,"\\'")}',${gi})">${tt.nome}${tt.soc?` <span style="opacity:.5">(${tt.soc})</span>`:''}</button>`).join('')}</div>
    </div>`).join('')}
    <button class="bsm" style="margin-top:4px" onclick="builderAddGirone2()">+ Aggiungi girone</button>`;
  }
  html+=`<div style="display:flex;gap:10px;margin-top:1.5rem;justify-content:flex-end"><button onclick="builderCancel()">Annulla</button><button class="bp" onclick="builderConfirm()">✓ Crea fase</button></div></div>`;
  return html;
}

// ============================================================
// PAGINA LIVE — configurazione
// ============================================================
function renderPaginaLive(){
  const t=currentTorneo();if(!t)return'';
  const cfg=t.pageConfig||{};
  const sponsorEnabled=!!cfg.sponsorEnabled;
  const infoEnabled=!!cfg.infoEnabled;
  const menuEnabled=!!cfg.menuEnabled;
  const sponsorCats=cfg.sponsor?.cats||[];
  const infoBlocks=cfg.infoBlocks||[];
  const menuSezioni=cfg.menu?.sezioni||[];

  const toggleStyle='display:flex;align-items:center;gap:10px;margin-bottom:1.5rem';
  const toggleEl=(enabled,fn)=>`<label class="toggle"><input type="checkbox" ${enabled?'checked':''} onchange="${fn}()"><span class="slider"></span></label>`;

  // ── SPONSOR ──
  let sponsorHtml=`<div class="card" style="margin-bottom:1rem">
    <div style="${toggleStyle}">
      ${toggleEl(sponsorEnabled,'toggleSponsorEnabled')}
      <div><div style="font-size:15px;font-weight:600">🤝 Tab Sponsor</div>
      <div style="font-size:12px;color:var(--txt2)">Mostra sponsor nella pagina live pubblica</div></div>
    </div>`;
  if(sponsorEnabled){
    sponsorHtml+=`<div style="margin-top:.5rem">`;
    sponsorCats.forEach((cat,ci)=>{
      const nCats=sponsorCats.length;
      sponsorHtml+=`<div style="border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:12px">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
          <div style="display:flex;gap:2px">
            ${ci>0?`<button class="bxsm" onclick="moveSponsorCat(${ci},-1)">↑</button>`:'<span style="width:28px"></span>'}
            ${ci<nCats-1?`<button class="bxsm" onclick="moveSponsorCat(${ci},1)">↓</button>`:'<span style="width:28px"></span>'}
          </div>
          <input type="text" value="${escV(cat.nome)}" placeholder="Nome categoria" style="flex:1;font-weight:600;font-size:14px" oninput="updateSponsorCatNome(${ci},this.value)">
          <button class="bsm bd" onclick="delSponsorCat(${ci})">✕ Elimina</button>
        </div>`;
      const nItems=(cat.items||[]).length;
      (cat.items||[]).forEach((sp,ii)=>{
        const sizeOpts=['grande','medio','piccolo'].map(s=>`<option value="${s}"${sp.size===s?' selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('');
        sponsorHtml+=`<div style="background:var(--info);border-radius:8px;padding:12px;margin-bottom:8px">
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
            <div style="display:flex;gap:2px">
              ${ii>0?`<button class="bxsm" onclick="moveSponsorItem(${ci},${ii},-1)">↑</button>`:'<span style="width:28px"></span>'}
              ${ii<nItems-1?`<button class="bxsm" onclick="moveSponsorItem(${ci},${ii},1)">↓</button>`:'<span style="width:28px"></span>'}
            </div>
            <select style="width:auto;padding:5px 8px;font-size:12px" onchange="updateSponsorItem(${ci},${ii},'size',this.value)">${sizeOpts}</select>
            <input type="text" value="${escV(sp.nome)}" placeholder="Nome sponsor" style="flex:1" oninput="updateSponsorItem(${ci},${ii},'nome',this.value)">
            <button class="bxsm bd" onclick="delSponsorItem(${ci},${ii})">✕</button>
          </div>
          <input type="text" value="${escV(sp.frase)}" placeholder="Frase o slogan (opzionale)" style="margin-bottom:8px" oninput="updateSponsorItem(${ci},${ii},'frase',this.value)">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            ${sp.immagine?`<img src="${sp.immagine}" style="height:48px;border-radius:6px;object-fit:contain;background:#fff;padding:4px">`:'<span style="font-size:12px;color:var(--txt2)">Nessuna immagine</span>'}
            <label style="cursor:pointer"><span class="bp bxsm" style="display:inline-block">📎 ${sp.immagine?'Cambia':'Carica'}</span><input type="file" accept="image/*" style="display:none" onchange="uploadSponsorImg(${ci},${ii},this)"></label>
            <input type="text" value="${sp.immagine&&!sp.immagine.startsWith('data:')?escV(sp.immagine):''}" placeholder="...oppure URL immagine" style="flex:1;min-width:160px;font-size:12px" oninput="updateSponsorItem(${ci},${ii},'immagine',this.value)">
          </div>
        </div>`;
      });
      sponsorHtml+=`<button class="bsm" onclick="addSponsorItem(${ci})" style="margin-top:4px">+ Aggiungi sponsor</button></div>`;
    });
    sponsorHtml+=`<button class="bp bsm" onclick="addSponsorCat()">+ Nuova categoria</button></div>`;
  }
  sponsorHtml+=`</div>`;

  // ── INFO ──
  let infoHtml=`<div class="card" style="margin-bottom:1rem">
    <div style="${toggleStyle}">
      ${toggleEl(infoEnabled,'toggleInfoEnabled')}
      <div><div style="font-size:15px;font-weight:600">ℹ️ Tab Info</div>
      <div style="font-size:12px;color:var(--txt2)">Informazioni sull'evento nella pagina live</div></div>
    </div>`;
  if(infoEnabled){
    infoHtml+=`<div style="margin-top:.5rem">`;
    infoBlocks.forEach((bl,bi)=>{
      infoHtml+=`<div style="border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
          <input type="text" value="${escV(bl.titolo)}" placeholder="Titolo blocco" style="flex:1;font-weight:600" oninput="updateInfoBlock(${bi},'titolo',this.value)">
          <div style="display:flex;gap:4px">
            ${bi>0?`<button class="bxsm" onclick="moveInfoBlock(${bi},-1)">↑</button>`:''}
            ${bi<infoBlocks.length-1?`<button class="bxsm" onclick="moveInfoBlock(${bi},1)">↓</button>`:''}
            <button class="bxsm bd" onclick="delInfoBlock(${bi})">✕</button>
          </div>
        </div>
        <textarea rows="4" placeholder="Testo informativo..." style="width:100%;padding:8px;border:1px solid var(--border2);border-radius:8px;font-size:13px;background:var(--inp);color:var(--txt);resize:vertical;font-family:inherit" oninput="updateInfoBlock(${bi},'testo',this.value)">${escV(bl.testo)}</textarea>
      </div>`;
    });
    infoHtml+=`<button class="bp bsm" onclick="addInfoBlock()">+ Nuovo blocco</button></div>`;
  }
  infoHtml+=`</div>`;

  // ── MENU ──
  let menuHtml=`<div class="card">
    <div style="${toggleStyle}">
      ${toggleEl(menuEnabled,'toggleMenuEnabled')}
      <div><div style="font-size:15px;font-weight:600">🍽️ Tab Menu</div>
      <div style="font-size:12px;color:var(--txt2)">Mostra il menu dell'evento con prezzi nella pagina live</div></div>
    </div>`;
  if(menuEnabled){
    menuHtml+=`<div style="margin-top:.5rem">`;
    menuSezioni.forEach((sez,si)=>{
      const nSez=menuSezioni.length;
      menuHtml+=`<div style="border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:12px">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
          <div style="display:flex;gap:2px">
            ${si>0?`<button class="bxsm" onclick="moveMenuSezione(${si},-1)">↑</button>`:'<span style="width:28px"></span>'}
            ${si<nSez-1?`<button class="bxsm" onclick="moveMenuSezione(${si},1)">↓</button>`:'<span style="width:28px"></span>'}
          </div>
          <input type="text" value="${escV(sez.nome)}" placeholder="Nome sezione (es: Pizze, Bevande…)" style="flex:1;font-weight:600;font-size:14px" oninput="updateMenuSezione(${si},this.value)">
          <button class="bsm bd" onclick="delMenuSezione(${si})">✕ Sezione</button>
        </div>
        <div style="background:var(--info);border-radius:8px;padding:8px;margin-bottom:8px">
          <div style="display:grid;grid-template-columns:1fr 80px auto;gap:6px;align-items:center;padding:4px 6px;font-size:11px;font-weight:600;color:var(--txt2)">
            <div>VOCE</div><div style="text-align:center">PREZZO</div><div></div>
          </div>
          ${(sez.voci||[]).map((v,vi)=>{
            const nVoci=sez.voci.length;
            return`<div style="display:grid;grid-template-columns:1fr 80px auto;gap:6px;align-items:center;padding:4px 0;border-bottom:1px solid var(--border)">
              <div>
                <input type="text" value="${escV(v.nome)}" placeholder="Nome voce" style="margin-bottom:4px" oninput="updateMenuVoce(${si},${vi},'nome',this.value)">
                <input type="text" value="${escV(v.desc||'')}" placeholder="Descrizione (opz.)" style="font-size:12px" oninput="updateMenuVoce(${si},${vi},'desc',this.value)">
              </div>
              <input type="text" value="${escV(v.prezzo)}" placeholder="€ 0,00" style="text-align:center;font-weight:700"
                oninput="updateMenuVoce(${si},${vi},'prezzo',this.value)"
                onblur="const n=normalizzaPrezzo(this.value);if(n&&n!==this.value){this.value=n;updateMenuVoce(${si},${vi},'prezzo',n);}">
              <div style="display:flex;flex-direction:column;gap:2px">
                ${vi>0?`<button class="bxsm" onclick="moveMenuVoce(${si},${vi},-1)">↑</button>`:''}
                ${vi<nVoci-1?`<button class="bxsm" onclick="moveMenuVoce(${si},${vi},1)">↓</button>`:''}
                <button class="bxsm bd" onclick="delMenuVoce(${si},${vi})">✕</button>
              </div>
            </div>`;
          }).join('')}
        </div>
        <button class="bsm" onclick="addMenuVoce(${si})">+ Aggiungi voce</button>
      </div>`;
    });
    // Note generali menu
    const noteMenu=(t.pageConfig?.menu?.note)||'';
    menuHtml+=`<button class="bp bsm" onclick="addMenuSezione()" style="margin-bottom:14px">+ Nuova sezione</button>
    <div style="border:1px solid var(--border);border-radius:10px;padding:14px">
      <div style="font-size:13px;font-weight:600;margin-bottom:6px">📝 Note generali (es: dove pagare, orari…)</div>
      <textarea rows="3" placeholder="Es: Passare prima in cassa · Cassa aperta dalle 10:00" style="width:100%;padding:8px;border:1px solid var(--border2);border-radius:8px;font-size:13px;background:var(--inp);color:var(--txt);resize:vertical;font-family:inherit"
        oninput="ensurePageConfig().menu.note=this.value;sv()">${escV(noteMenu)}</textarea>
    </div>`;
    menuHtml+=`</div>`;
  }
  menuHtml+=`</div>`;

  return`<div class="card" style="background:var(--info);border-color:transparent;margin-bottom:1rem">
    <p style="font-size:13px;color:var(--txt2);line-height:1.6">
      Configura le tab opzionali nella pagina <strong>live.html</strong> pubblica. Attivale con il toggle.
    </p>
  </div>`+sponsorHtml+infoHtml+menuHtml;
}
