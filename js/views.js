/* Render: Home, Wizard, Torneo, Società, Setup, Categoria, Builder */
'use strict';

// ============================================================
// VIEW: HOME — lista tornei
// ============================================================
function renderHome(){
  const ids=Object.keys(DB.tornei||{}).sort((a,b)=>(DB.tornei[b].createdAt||0)-(DB.tornei[a].createdAt||0));
  let html=`<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:8px">
      <div class="card-title" style="margin-bottom:0">🏐 Gestione Tornei</div>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:1.5rem;flex-wrap:wrap">
      <button class="bp" style="flex:1;padding:12px;font-size:15px;min-width:160px" onclick="startNuovoTorneo()">+ Nuovo torneo</button>
      <button style="padding:12px 18px;font-size:13px" onclick="importTorneo()">⬆ Importa</button>
      <button style="padding:12px 18px;font-size:13px" class="bd" onclick="azzeraDB()">🗑 Azzera tutto</button>
    </div>
    ${ids.length?`<div class="sec">Tornei salvati</div>`:''} 
    ${ids.map(id=>{const t=DB.tornei[id];const nSoc=t.societa?.length||0;const date=t.createdAt?new Date(t.createdAt).toLocaleDateString('it-IT'):'';const isLive=getLiveId()===id;
    return`<div class="torneo-item${isLive?' active-t':''}" onclick="openTorneo('${id}')">
      <div>
        <div class="torneo-nome">${t.nome} ${isLive?'<span style=\'font-size:11px;background:#dcfce7;color:#166534;padding:1px 8px;border-radius:10px;font-weight:600\'>🔴 LIVE</span>':''}</div>
        <div class="torneo-meta">${nSoc} società · ${date}</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        ${isLive
          ?'<span style=\'font-size:11px;color:#166534;font-weight:500\'>In corso</span>'
          :`<button class="bsm" style="background:#dcfce7;color:#166534;border-color:#86efac;font-size:11px" onclick="event.stopPropagation();setTorneoLive('${id}')">▶ Live</button>`
        }
        <button class="bsm" onclick="event.stopPropagation();duplicaTorneo('${id}')">📋</button>
        <button class="bsm bd" onclick="event.stopPropagation();eliminaTorneo('${id}')">✕</button>
      </div>
    </div>`;}).join('')}
    ${!ids.length?`<p style="text-align:center;color:var(--txt2);font-size:13px;padding:1rem">Nessun torneo. Creane uno!</p>`:''}
  </div>`;
  return html;
}
function openTorneo(id){
  currentTorneoId=id;view='torneo';localCat='admin';builderState=null;socEditState=null;IC={};
  const t=DB.tornei[id];
  document.getElementById('torneoNomeHdr').textContent=t.nome;
  // Init fase1 for all cats on open, save once
  if(!t.cats)t.cats={white:{fasi:[]},green:{fasi:[]},red:{fasi:[]}};
  let needSave=false;
  for(const c of['white','green','red']){
    if(!t.cats[c])t.cats[c]={fasi:[]};
    if(!Array.isArray(t.cats[c].fasi))t.cats[c].fasi=[];
    if(!t.cats[c].fasi.length){t.cats[c].fasi.push({id:uid(),label:'Fase 1',gironi:[]});needSave=true;}
  }
  if(needSave)sv();
  render();
}
function eliminaTorneo(id){if(!confirm('Eliminare questo torneo?'))return;delete DB.tornei[id];sv();render();}
function setTorneoLive(id){
  localStorage.setItem('torneo_live_id',id);
  render();
}
function getLiveId(){
  return localStorage.getItem('torneo_live_id');
}
function duplicaTorneo(id){const t=DB.tornei[id];const newId=uid();DB.tornei[newId]=JSON.parse(JSON.stringify(t));DB.tornei[newId].nome=t.nome+' (copia)';DB.tornei[newId].createdAt=Date.now();sv();render();}

// ============================================================
// VIEW: NUOVO TORNEO — wizard setup
// Passo 1: nome torneo
// Passo 2: inserisci società e squadre per categoria
// ============================================================
let wizardState=null;

function startNuovoTorneo(){
  wizardState={step:1,nome:'',societa:[],nuovaSocNome:''};
  view='torneo-setup';render();
}

function renderTorneoSetup(){
  const w=wizardState;
  const steps=[w.step>=1,w.step>=2];
  let html=`<div class="step-indicator">${steps.map((d,i)=>`<div class="step${d?' done':''} ${w.step===i+1?' current':''}"></div>`).join('')}</div>`;

  if(w.step===1){
    html+=`<div class="card">
      <div class="card-title">Nuovo torneo — Nome</div>
      <label style="font-size:13px;color:var(--txt2);display:block;margin-bottom:6px">Nome del torneo</label>
      <input type="text" id="torneoNomeInput" value="${w.nome}" placeholder="Es: Torneo Primavera 2025" style="margin-bottom:1rem" oninput="wizardState.nome=this.value">
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button onclick="goHome()">Annulla</button>
        <button class="bp" onclick="wizardStep2()">Avanti →</button>
      </div>
    </div>`;
  } else if(w.step===2){
    html+=`<div class="card">
      <div class="card-title">Nuovo torneo — Società e squadre</div>
      <p style="font-size:13px;color:var(--txt2);margin-bottom:1rem">Inserisci le società partecipanti e il numero di squadre per ogni categoria. Lascia 0 se non partecipano in quella categoria.</p>
      
      <div style="display:flex;gap:8px;margin-bottom:1rem;flex-wrap:wrap">
        <input type="text" id="nuovaSocInput" placeholder="Nome società" style="flex:1" value="${w.nuovaSocNome}" oninput="wizardState.nuovaSocNome=this.value" onkeydown="if(event.key==='Enter')aggiungiSoc()">
        <button class="bp bsm" onclick="aggiungiSoc()">+ Aggiungi</button>
      </div>

      ${w.societa.length?`
      <div class="sec">Società inserite</div>
      <div style="background:var(--info);border-radius:8px;padding:8px;margin-bottom:1rem">
        <div style="display:grid;grid-template-columns:1fr repeat(3,80px) 36px;gap:6px;align-items:center;padding:4px 8px;font-size:11px;font-weight:600;color:var(--txt2)">
          <div>SOCIETÀ</div><div style="text-align:center">WHITE</div><div style="text-align:center">GREEN</div><div style="text-align:center">RED</div><div></div>
        </div>
        ${w.societa.map((s,si)=>`
        <div class="soc-row">
          <div class="soc-nome">${s.nome}</div>
          ${['white','green','red'].map(cat=>`
            <div style="text-align:center">
              <input type="number" min="0" max="20" value="${s.sqPerCat[cat]||0}" style="width:60px;text-align:center;padding:4px;font-size:13px" oninput="setSocCat(${si},'${cat}',parseInt(this.value)||0)">
            </div>`).join('')}
          <button class="bd bxsm" onclick="rimuoviSoc(${si})">✕</button>
        </div>`).join('')}
      </div>
      <div style="background:var(--info);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--txt2);margin-bottom:1rem">
        <strong>Riepilogo squadre per categoria:</strong><br>
        ${['white','green','red'].map(cat=>{const tot=w.societa.reduce((s,x)=>s+(x.sqPerCat[cat]||0),0);return`<span class="gbadge ${badge(cat)}" style="margin:2px">${catLabel(cat)}: ${tot} squadre</span>`;}).join(' ')}
      </div>
      `:`<p style="color:var(--txt2);font-size:13px;text-align:center;padding:1rem">Nessuna società ancora. Aggiungine una.</p>`}

      <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">
        <button onclick="wizardState.step=1;render()">← Indietro</button>
        <button class="bp" onclick="creaTorneo()">✓ Crea torneo</button>
      </div>
    </div>`;
  }
  return html;
}

function wizardStep2(){
  if(!wizardState.nome.trim()){alert('Inserisci un nome per il torneo.');document.getElementById('torneoNomeInput')?.focus();return;}
  wizardState.step=2;render();
}
function aggiungiSoc(){
  const nome=(wizardState.nuovaSocNome||document.getElementById('nuovaSocInput')?.value||'').trim();
  if(!nome)return;
  if(wizardState.societa.find(s=>s.nome.toLowerCase()===nome.toLowerCase())){alert('Società già presente.');return;}
  wizardState.societa.push({nome,sqPerCat:{white:0,green:0,red:0}});
  wizardState.nuovaSocNome='';render();
}
function rimuoviSoc(i){wizardState.societa.splice(i,1);render();}
function setSocCat(i,cat,n){wizardState.societa[i].sqPerCat[cat]=n;}

function creaTorneo(){
  if(!wizardState.nome.trim()){alert('Nome mancante.');return;}
  // Costruisce la lista squadre per ogni società e categoria
  const societa=wizardState.societa.map(s=>{
    const squadre=[];
    for(const cat of['white','green','red']){
      const n=s.sqPerCat[cat]||0;
      for(let i=0;i<n;i++) squadre.push({cat,nome:'',soc:s.nome}); // nome verrà assegnato alla creazione gironi
    }
    return{nome:s.nome,sqPerCat:s.sqPerCat,squadre};
  });
  const id=uid();
  DB.tornei[id]={nome:wizardState.nome.trim(),createdAt:Date.now(),societa,cats:{
    white:{fasi:[{id:uid(),label:'Fase 1',gironi:[]}]},
    green:{fasi:[{id:uid(),label:'Fase 1',gironi:[]}]},
    red:  {fasi:[{id:uid(),label:'Fase 1',gironi:[]}]}
  }};
  wizardState=null;sv();openTorneo(id);
}

// ============================================================
// VIEW: TORNEO — gestione completa
// ============================================================
function renderTorneo(){
  const t=currentTorneo();if(!t)return renderHome();
  const cat=localCat||'white';
  let tabsHtml=`<div class="tabs">
    <button class="tab tw${cat==='white'?' active':''}" onclick="setScat('white')">⬜ White</button>
    <button class="tab tg${cat==='green'?' active':''}" onclick="setScat('green')">🟩 Green</button>
    <button class="tab tr2${cat==='red'?' active':''}" onclick="setScat('red')">🟥 Red</button>
    <button class="tab${cat==='admin'?' active':''}" onclick="setScat('admin')">⚙️ Setup gironi</button>
    <button class="tab${cat==='societa'?' active':''}" onclick="setScat('societa')">🏢 Società</button>
  </div>`;
  let html='';
  if(cat==='admin') html=renderSetupGironi();
  else if(cat==='societa') html=renderSocieta();
  else html=renderCategoria(cat);
  return tabsHtml+html;
}

// ============================================================
// SCHEDA SOCIETÀ — modifica + export/import
// ============================================================
let socEditState=null;

function renderSocieta(){
  const t=currentTorneo();
  const soc=t.societa||(t.societa=[]);
  let html=`<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:8px">
      <div class="card-title" style="margin-bottom:0">🏢 Società partecipanti</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="bsm" onclick="importTorneo()">⬆ Importa torneo</button>
        <button class="bsm" onclick="exportTorneo()">⬇ Esporta torneo</button>
        <button class="bsm bp" onclick="socEditState={si:-1,nome:'',sqPerCat:{white:0,green:0,red:0}};render()">+ Società</button>
      </div>
    </div>
    ${socEditState&&socEditState.si===-1?renderSocForm(-1):''}
    ${soc.length?renderSocTable(soc):`<p style="color:var(--txt2);font-size:13px;text-align:center;padding:1rem">Nessuna società. Aggiungine una.</p>`}
  </div>`;
  return html;
}

function renderSocTable(soc){
  return`<div style="background:var(--info);border-radius:8px;padding:8px;margin-bottom:1rem">
    <div style="display:grid;grid-template-columns:1fr repeat(3,68px) 76px;gap:6px;align-items:center;padding:4px 8px;font-size:11px;font-weight:600;color:var(--txt2)">
      <div>SOCIETÀ</div><div style="text-align:center">W</div><div style="text-align:center">G</div><div style="text-align:center">R</div><div></div>
    </div>
    ${soc.map((s,si)=>socEditState&&socEditState.si===si?renderSocForm(si):
      `<div class="soc-row">
        <div class="soc-nome">${s.nome}</div>
        ${['white','green','red'].map(cat=>`<div style="text-align:center;font-size:14px;font-weight:700;color:${(s.sqPerCat?.[cat]||0)>0?'var(--txt)':'var(--txt2)'}">${s.sqPerCat?.[cat]||0}</div>`).join('')}
        <div style="display:flex;gap:4px">
          <button class="bxsm" onclick="socEditState={si:${si},nome:'${s.nome.replace(/'/g,"\\'")}',sqPerCat:{white:${s.sqPerCat?.white||0},green:${s.sqPerCat?.green||0},red:${s.sqPerCat?.red||0}}};render()">✏️</button>
          <button class="bxsm bd" onclick="rimuoviSocTorneo(${si})">✕</button>
        </div>
      </div>`
    ).join('')}
  </div>
  <div style="background:var(--info);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--txt2)">
    <strong>Totale:</strong>
    ${['white','green','red'].map(cat=>{const tot=soc.reduce((s,x)=>s+(x.sqPerCat?.[cat]||0),0);return`<span class="gbadge ${badge(cat)}" style="margin:2px">${catLabel(cat)}: ${tot} sq</span>`;}).join(' ')}
  </div>`;
}

function renderSocForm(si){
  const isNew=si===-1;const st=socEditState;
  return`<div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px">
    <div class="sec">${isNew?'Nuova società':'Modifica società'}</div>
    <input type="text" placeholder="Nome società" value="${st.nome}" style="margin-bottom:10px" oninput="socEditState.nome=this.value" onkeydown="if(event.key==='Enter')saveSoc()">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px">
      ${['white','green','red'].map(cat=>`<div>
        <label style="font-size:12px;color:var(--txt2);display:block;margin-bottom:4px"><span class="gbadge ${badge(cat)}">${catLabel(cat)}</span></label>
        <input type="number" min="0" max="30" value="${st.sqPerCat[cat]||0}" style="text-align:center" oninput="socEditState.sqPerCat['${cat}']=parseInt(this.value)||0">
      </div>`).join('')}
    </div>
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
  if(st.si===-1){t.societa.push({nome,sqPerCat:{...st.sqPerCat},squadre:[]});}
  else{t.societa[st.si].nome=nome;t.societa[st.si].sqPerCat={...st.sqPerCat};}
  socEditState=null;sv();render();
}
function rimuoviSocTorneo(si){
  const t=currentTorneo();if(!t||!t.societa)return;
  if(!confirm(`Rimuovere "${t.societa[si].nome}"?`))return;
  t.societa.splice(si,1);sv();render();
}

// ============================================================
// EXPORT / IMPORT TORNEO
// ============================================================
function exportTorneo(){
  const t=currentTorneo();if(!t)return;
  const data=JSON.stringify({torneo:JSON.parse(JSON.stringify(t))},null,2);
  const a=document.createElement('a');
  a.href='data:application/json;charset=utf-8,'+encodeURIComponent(data);
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
        const data=JSON.parse(ev.target.result);
        const t=data.torneo||data;
        if(!t.nome)throw new Error('File non valido');
        const id=uid();
        DB.tornei[id]={...t,nome:t.nome+' (importato)',createdAt:Date.now()};
        sv();openTorneo(id);
      }catch(err){alert('File non valido o corrotto: '+err.message);}
    };reader.readAsText(file);
  };input.click();
}

// ============================================================
// SETUP GIRONI — crea gironi con assegnazione società
// ============================================================
function renderSetupGironi(){
  const t=currentTorneo();
  // Assicura che fase1 esista in memoria (NO sv() qui — mai salvare dentro render)
  for(const c of['white','green','red']){const fa=getFasi(c);if(!fa.length)fa.push({id:uid(),label:'Fase 1',gironi:[]});}
  let html=`<div style="background:var(--info);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--txt2);margin-bottom:1rem;line-height:1.7">
    Crea i gironi iniziali (Fase 1). Scegli numero di squadre e set, poi clicca <strong>+ Girone</strong>. Le squadre e le società vengono assegnate automaticamente.
  </div>`;
  for(const cat of['white','green','red']){
    const fasi=getFasi(cat);
    const fase1=fasi[0];const gs=fase1.gironi;
    const pref=PREFS[cat];
    const b=badge(cat);const lbl=cat==='white'?'⬜ White':cat==='green'?'🟩 Green':'🟥 Red';
    // Quante squadre totali in questa categoria
    const totSq=(t.societa||[]).reduce((s,x)=>s+(x.sqPerCat?.[cat]||0),0);
    html+=`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
      <span style="font-size:15px;font-weight:600;color:var(--txt)">${lbl} — ${gs.length} giron${gs.length===1?'e':'i'} — ${totSq} squadre totali</span>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <select id="sz_${cat}" style="width:auto;padding:5px 8px;font-size:13px" onchange="PREFS['${cat}'].sz=parseInt(this.value)">
          ${[3,4,5,6,7,8].map(n=>`<option value="${n}"${pref.sz===n?' selected':''}>${n} sq/girone</option>`).join('')}
        </select>
        <select id="sets_${cat}" style="width:auto;padding:5px 8px;font-size:13px" onchange="PREFS['${cat}'].sets=parseInt(this.value)">
          <option value="1"${pref.sets===1?' selected':''}>1 set</option><option value="2"${pref.sets===2?' selected':''}>2 set</option>
        </select>
        <button class="bp bsm" onclick="addGirone('${cat}')">+ Girone</button>
      </div></div>`;
    for(const g of gs){
      html+=`<div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:6px">
          <div style="display:flex;align-items:center;gap:8px"><span class="gbadge ${b}">Girone ${g.label}</span><span style="font-size:12px;color:var(--txt2)">${g.squadre.length} sq · ${g.sets||2} set</span></div>
          <button class="bsm bd" onclick="delGirone('${cat}','${fase1.id}','${g.id}')">✕</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
        ${g.squadre.map((s,i)=>`<div style="display:flex;gap:6px;align-items:center">
          <span style="font-size:12px;color:var(--txt2);min-width:18px;text-align:right">${i+1}.</span>
          <input type="text" value="${s.nome}" placeholder="Squadra" style="flex:1.5" onchange="updSq('${cat}','${fase1.id}','${g.id}',${i},'nome',this.value)">
          <input type="text" value="${s.soc||''}" placeholder="Società" style="flex:1" onchange="updSq('${cat}','${fase1.id}','${g.id}',${i},'soc',this.value)">
        </div>`).join('')}
        </div>
        <button class="bp bsm" onclick="saveSquadre('${cat}','${fase1.id}','${g.id}')">✓ Rigenera partite</button>
      </div>`;
    }
    if(!gs.length)html+=`<div style="text-align:center;padding:1.5rem;color:var(--txt2);background:var(--info);border-radius:8px;font-size:13px">
        Nessun girone ancora. Scegli il numero di squadre e clicca <strong>+ Girone</strong>.
      </div>`;
    html+=`</div>`;
  }
  return html;
}

// Aggiunge girone con assegnazione automatica squadre+società
function addGirone(cat){
  const t=currentTorneo();
  if(!t){alert('Nessun torneo aperto.');return;}
  // Ensure cats structure exists
  if(!t.cats)t.cats={white:{fasi:[]},green:{fasi:[]},red:{fasi:[]}};
  if(!t.cats[cat])t.cats[cat]={fasi:[]};
  if(!t.cats[cat].fasi)t.cats[cat].fasi=[];
  // Ensure fase1 exists
  if(!t.cats[cat].fasi.length)t.cats[cat].fasi.push({id:uid(),label:'Fase 1',gironi:[]});
  const f1=t.cats[cat].fasi[0];
  if(!f1.gironi)f1.gironi=[];
  // Read from select if available, else use PREFS
  const szEl=document.getElementById('sz_'+cat);const setsEl=document.getElementById('sets_'+cat);
  if(szEl)PREFS[cat].sz=parseInt(szEl.value)||PREFS[cat].sz;
  if(setsEl)PREFS[cat].sets=parseInt(setsEl.value)||PREFS[cat].sets;
  const sz=PREFS[cat].sz;const sets=PREFS[cat].sets;
  const fasi=t.cats[cat].fasi;

  // Nomi già usati nei gironi esistenti
  const usedNomi=fasi.flatMap(f=>f.gironi?.flatMap(g=>g.squadre.map(s=>s.nome))||[]);
  const availNomi=NAMES[cat].filter(n=>!usedNomi.includes(n));

  // Quante squadre per società in questa categoria e girone
  const label=String.fromCharCode(65+f1.gironi.length);

  // Costruisce la squadra con la società
  // Prima determina quante squadre ogni società ha ancora da assegnare
  const socSquadre=[];
  for(const soc of(t.societa||[])){
    const nCat=soc.sqPerCat?.[cat]||0;
    if(!nCat)continue;
    // Quante ne ha già in gironi esistenti
    const giaAssegnate=fasi.flatMap(f=>f.gironi?.flatMap(g=>g.squadre.filter(s=>s.soc===soc.nome))||[]).length;
    const rimanenti=nCat-giaAssegnate;
    for(let i=0;i<rimanenti;i++) socSquadre.push({soc:soc.nome});
  }

  // Distribuisce in modo da massimizzare diversità
  let squadre=[];
  if(socSquadre.length>0){
    // Shuffle
    for(let i=socSquadre.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[socSquadre[i],socSquadre[j]]=[socSquadre[j],socSquadre[i]];}
    // Greedy: riempi il girone con max diversità
    const socInGirone=new Set();const remaining=[...socSquadre];
    for(let slot=0;slot<sz&&remaining.length>0;slot++){
      const diverse=remaining.filter(s=>!socInGirone.has(s.soc));
      const pick=(diverse.length>0?diverse:remaining)[0];
      socInGirone.add(pick.soc);
      remaining.splice(remaining.indexOf(pick),1);
      squadre.push({nome:availNomi[squadre.length]||`Sq${squadre.length+1}`,soc:pick.soc});
    }
    // Se non abbastanza squadre da società, riempi con vuote
    while(squadre.length<sz)squadre.push({nome:availNomi[squadre.length]||`Sq${squadre.length+1}`,soc:''});
  } else {
    // Nessuna info società: usa solo nomi
    squadre=Array.from({length:sz},(_,i)=>({nome:availNomi[i]||`Sq${i+1}`,soc:''}));
  }

  f1.gironi.push({id:uid(),label,squadre,sets,ritorno:false,partite:genPartite(sz,false,sets)});
  sv();render();
}

function delGirone(cat,fid,gv){const f=getFase(cat,fid);if(f)f.gironi=f.gironi.filter(g=>g.id!==gv);sv();render();}
function updSq(cat,fid,gv,idx,field,val){const g=getGirone(cat,fid,gv);if(g)g.squadre[idx][field]=val;}
function saveSquadre(cat,fid,gv){const g=getGirone(cat,fid,gv);if(!g)return;g.partite=genPartite(g.squadre.length,g.ritorno||false,g.sets||2);sv();render();}
function toggleRitorno(cat,fid,gv){const g=getGirone(cat,fid,gv);if(!g)return;g.ritorno=!g.ritorno;const old={};g.partite.filter(p=>p.leg===1||!p.leg).forEach(p=>{old[`${p.h}_${p.a}`]=p});const np=genPartite(g.squadre.length,g.ritorno,g.sets||2);np.forEach(p=>{if(p.leg===1){const o=old[`${p.h}_${p.a}`];if(o){p.s1h=o.s1h;p.s1a=o.s1a;p.s2h=o.s2h;p.s2a=o.s2a;}}});g.partite=np;sv();render();}
function saveResult(cat,fid,gv,pid){const g=getGirone(cat,fid,gv);if(!g)return;const p=g.partite[pid];['s1h','s1a','s2h','s2a'].forEach(f=>{const k=icKey(cat,fid,gv,pid,f);if(IC[k]!==undefined)p[f]=IC[k]});sv();render();}
function clearResult(cat,fid,gv,pid){const g=getGirone(cat,fid,gv);if(!g)return;const p=g.partite[pid];p.s1h='';p.s1a='';p.s2h='';p.s2a='';['s1h','s1a','s2h','s2a'].forEach(f=>delete IC[icKey(cat,fid,gv,pid,f)]);sv();render();}
function delFase(cat,fid){if(!confirm('Eliminare questa fase?'))return;getFasi(cat);const t=currentTorneo();t.cats[cat].fasi=t.cats[cat].fasi.filter(f=>f.id!==fid);sv();render();}
function saveElim(cat,fid,mk){const f=getFase(cat,fid);if(!f||!f.elim)return;const m=f.elim[mk];if(!m)return;['s1h','s1a'].forEach(field=>{const k=`elim_${fid}_${mk}_${field}`;if(IC[k]!==undefined)m[field]=IC[k];});propagateElim(f);sv();render();}
function onInputElim(fid,mk,field,val){IC[`elim_${fid}_${mk}_${field}`]=val;}
function getVElim(fid,mk,field,saved){const k=`elim_${fid}_${mk}_${field}`;return IC[k]!==undefined?IC[k]:saved;}

// ============================================================
// RENDER CATEGORIA
// ============================================================
function renderCategoria(cat){
  const fasi=getFasi(cat);const b=badge(cat);
  if(builderState&&builderState.cat===cat)return renderBuilder(b);
  if(!fasi.length||!fasi[0]?.gironi?.length)return`<div style="text-align:center;padding:3rem;color:var(--txt2)"><p>Nessun girone per questa categoria.<br>Vai in ⚙️ Setup gironi e clicca + Girone.</p></div>`;
  let html='';
  for(let fi=0;fi<fasi.length;fi++){
    const fase=fasi[fi];const isElim=fase.tipo==='elim';const isCollapsed=collapsed.has(fase.id);
    const giocate=fase.gironi?.reduce((s,g)=>s+g.partite.filter(p=>p.s1h!==''&&p.s1a!=='').length,0)||0;
    const totP=fase.gironi?.reduce((s,g)=>s+g.partite.length,0)||0;
    html+=`<div class="card"><div class="fase-hdr" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:8px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;cursor:pointer" onclick="toggleCollapse('${fase.id}')">
        <span style="font-size:18px;color:var(--txt2)">${isCollapsed?'▶':'▼'}</span>
        <span style="font-size:16px;font-weight:600;color:var(--txt)">${fase.label}</span>
        <span style="font-size:11px;padding:3px 10px;border-radius:20px;background:#fef9c3;color:#854d0e;font-weight:500">${isElim?'⚡ Eliminazione':isCollapsed?`${giocate}/${totP} partite`:`${fase.gironi?.length||0} giron${(fase.gironi?.length||0)===1?'e':'i'}`}</span>
        ${isCollapsed?`<span style="font-size:11px;color:var(--txt2)">(tocca per espandere)</span>`:''}
      </div>
      ${fi>0?`<button class="bsm bd" onclick="delFase('${cat}','${fase.id}')">✕ Elimina</button>`:''}
    </div>`;
    if(!isCollapsed){
      if(isElim)html+=renderElimBlock(cat,fase);
      else{
        for(const g of fase.gironi)html+=renderGironeContent(cat,fase,g,b);
        // avulsa
        const sizes=[...new Set(fase.gironi.map(g=>g.squadre.length))];
        if(fase.gironi.length>1&&sizes.length>1){
          html+=`<div style="background:var(--info);border-radius:8px;padding:12px;margin-top:4px"><div class="sec">Classifica avulsa passaggio turno</div>
          ${[0,1].map(pos=>{const cands=fase.gironi.map(g=>{const cl=calcCl(g);const tt=cl[pos];return tt?{...tt,girone:g.label,qs:tt.sp>0?tt.sv/tt.sp:tt.sv,qp:tt.pp>0?tt.pv/tt.pp:tt.pv}:null}).filter(Boolean);cands.sort((a,bb)=>Math.abs(bb.qs-a.qs)>0.001?bb.qs-a.qs:bb.qp-a.qp);return cands.length?`<div style="margin-bottom:10px"><div style="font-size:12px;font-weight:500;margin-bottom:6px">${pos+1}° per girone</div><table><thead><tr><th>#</th><th>Squadra</th><th>Soc</th><th>Girone</th><th>Q.Set</th><th>Q.Pt</th></tr></thead><tbody>${cands.map((tt,i)=>`<tr><td style="font-weight:700">${i+1}</td><td style="font-weight:500">${tt.nome}</td><td style="font-size:11px;color:var(--txt2)">${tt.soc||''}</td><td><span class="gbadge ${b}" style="font-size:10px">${tt.girone}</span></td><td>${tt.sp>0?(tt.sv/tt.sp).toFixed(2):tt.sv}</td><td>${tt.pp>0?(tt.pv/tt.pp).toFixed(2):tt.pv}</td></tr>`).join('')}</tbody></table></div>`:'';}).join('')}</div>`;
        }
      }
    }
    html+=`</div>`;
  }
  html+=`<div class="card" style="text-align:center;padding:1.5rem"><p style="font-size:13px;color:var(--txt2);margin-bottom:12px">Creare una fase successiva?</p><button class="bp" onclick="openBuilder('${cat}')">+ Fase successiva</button></div>`;
  return html;
}

function renderGironeContent(cat,fase,g,b){
  const cl=calcCl(g);const sets=g.sets||2;const andataP=g.partite.filter(p=>!p.leg||p.leg===1);const ritornoP=g.partite.filter(p=>p.leg===2);const giocate=g.partite.filter(p=>p.s1h!==''&&p.s1a!=='').length;
  let clHtml=`<table><thead><tr><th>#</th><th>Squadra</th><th>Soc</th><th>Pt</th>${sets===2?'<th>Sv</th><th>Sp</th><th>DS</th>':''}<th>DP</th></tr></thead><tbody>`;
  cl.forEach((tt,i)=>{clHtml+=`<tr><td class="${i===0?'pos1':i===1?'pos2':i===2?'pos3':''}" style="font-weight:700">${i+1}</td><td style="font-weight:500">${tt.nome}</td><td style="font-size:11px;color:var(--txt2)">${tt.soc||''}</td><td style="font-weight:700;font-size:15px">${tt.pt}</td>${sets===2?`<td>${tt.sv}</td><td>${tt.sp}</td><td class="${tt.ds>0?'dsp':tt.ds<0?'dsn':''}">${tt.ds>0?'+':''}${tt.ds}</td>`:''}<td class="${tt.dp>0?'dsp':tt.dp<0?'dsn':''}">${tt.dp>0?'+':''}${tt.dp}</td></tr>`;});
  clHtml+=`</tbody></table><p style="font-size:11px;color:var(--txt2);margin-top:6px">Pt=set vinti${sets===2?' · DS=diff set':''} · DP=diff punti</p>`;
  function rPL(pList){return pList.map(p=>{
    const pid=g.partite.indexOf(p);const hn=g.squadre[p.h].nome,an=g.squadre[p.a].nome;const hs=g.squadre[p.h].soc||'',as=g.squadre[p.a].soc||'';const played=p.s1h!==''&&p.s1a!=='';const V=(f,sv2)=>getV(cat,fase.id,g.id,pid,f,sv2);
    return`<div class="match-card">${p.leg===2?`<div style="font-size:10px;background:#fef9c3;color:#854d0e;border-radius:4px;padding:2px 8px;display:inline-block;margin-bottom:8px;font-weight:600">RITORNO</div>`:''}
      <div class="match-teams">${hn}<span class="soc-tag"> (${hs||'—'})</span><br><span style="font-weight:400;color:var(--txt2);font-size:12px">vs</span><br>${an}<span class="soc-tag"> (${as||'—'})</span></div>
      <div class="set-row"><span class="set-lbl">Set 1</span><input type="number" class="score" inputmode="numeric" value="${V('s1h',p.s1h)}" placeholder="0" oninput="onInput('${cat}','${fase.id}','${g.id}',${pid},'s1h',this.value)"><span class="sep">–</span><input type="number" class="score" inputmode="numeric" value="${V('s1a',p.s1a)}" placeholder="0" oninput="onInput('${cat}','${fase.id}','${g.id}',${pid},'s1a',this.value)"></div>
      ${sets===2?`<div class="set-row"><span class="set-lbl">Set 2</span><input type="number" class="score" inputmode="numeric" value="${V('s2h',p.s2h)}" placeholder="0" oninput="onInput('${cat}','${fase.id}','${g.id}',${pid},'s2h',this.value)"><span class="sep">–</span><input type="number" class="score" inputmode="numeric" value="${V('s2a',p.s2a)}" placeholder="0" oninput="onInput('${cat}','${fase.id}','${g.id}',${pid},'s2a',this.value)"></div>`:''}
      <div class="save-row"><button class="bp" style="flex:1;padding:8px;font-size:13px;font-weight:600" onclick="saveResult('${cat}','${fase.id}','${g.id}',${pid})">✓ Salva</button>${played?`<button style="padding:8px 14px;font-size:13px" class="bd" onclick="clearResult('${cat}','${fase.id}','${g.id}',${pid})">✕</button>`:''}</div>
      ${played?`<div class="saved">✓ Set1: ${p.s1h}–${p.s1a}${sets===2&&p.s2h!==''?' | Set2: '+p.s2h+'–'+p.s2a:''}</div>`:''}
    </div>`;}).join('');}
  return`<div class="girone-box"><div class="girone-hdr">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span class="gbadge ${b}">Girone ${g.label}</span><span style="font-size:12px;color:var(--txt2)">${giocate}/${g.partite.length} partite · ${sets} set</span></div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:8px"><label class="toggle"><input type="checkbox" ${g.ritorno?'checked':''} onchange="toggleRitorno('${cat}','${fase.id}','${g.id}')"><span class="slider"></span></label><span style="font-size:13px;color:var(--txt2)">A/R</span></div>
      <button class="bg bsm" onclick="exportPDF('${cat}','${fase.id}','${g.id}')">📄 PDF</button>
    </div></div>
    <div class="g2"><div><div class="sec">Classifica</div>${clHtml}</div><div><div class="sec">Partite${g.ritorno?' — Andata':''}</div>${rPL(andataP)}${ritornoP.length?`<div class="sec" style="margin-top:14px">Ritorno</div>${rPL(ritornoP)}`:''}</div></div>
  </div>`;
}

function renderElimMatch(cat,fid,mk,m,title){
  if(!m)return'';const w=getWinner(m);const played=m.s1h!==''&&m.s1a!=='';
  return`<div class="elim-card"><div class="elim-lbl">${title}</div>
    <div class="elim-team${w===m.t1?' win':played?' lose':''}"><div><div>${m.t1||'—'}</div>${m.da1?`<div class="org">${m.da1}</div>`:''}</div>${w===m.t1?'🏆':''}</div>
    <div class="elim-team${w===m.t2?' win':played?' lose':''}"><div><div>${m.t2||'—'}</div>${m.da2?`<div class="org">${m.da2}</div>`:''}</div>${w===m.t2?'🏆':''}</div>
    <div class="set-row" style="margin-top:10px"><span class="set-lbl">Set 1</span><input type="number" class="score" inputmode="numeric" value="${getVElim(fid,mk,'s1h',m.s1h||'')}" placeholder="0" oninput="onInputElim('${fid}','${mk}','s1h',this.value)"><span class="sep">–</span><input type="number" class="score" inputmode="numeric" value="${getVElim(fid,mk,'s1a',m.s1a||'')}" placeholder="0" oninput="onInputElim('${fid}','${mk}','s1a',this.value)"></div>
    <button class="bp bsm" style="width:100%;margin-top:6px" onclick="saveElim('${cat}','${fid}','${mk}')">✓ Salva</button>
    ${played?`<div class="saved" style="margin-top:6px">✓ Vince ${w}</div>`:''}
  </div>`;
}
function renderElimBlock(cat,fase){
  const e=fase.elim||{};propagateElim(fase);const hasQ=e.q1||e.q2||e.q3||e.q4;const wF=getWinner(e.fin12),lF=getLoser(e.fin12),wF34=getWinner(e.fin34);
  let html='';
  if(wF){html+=`<div class="podium-grid"><div class="podium p2" style="margin-top:20px"><div style="font-size:28px">🥈</div><div class="podium-name">${lF||'—'}</div><div class="podium-lbl">2° posto</div></div><div class="podium p1"><div style="font-size:28px">🥇</div><div class="podium-name">${wF}</div><div class="podium-lbl">1° posto</div></div><div class="podium p3" style="margin-top:30px"><div style="font-size:28px">🥉</div><div class="podium-name">${wF34||'—'}</div><div class="podium-lbl">3° posto</div></div></div>`;}
  if(hasQ){html+=`<div class="bracket-round"><div class="bracket-title">⚡ Quarti di Finale</div><div class="bracket-grid">${['q1','q2','q3','q4'].filter(k=>e[k]).map((k,i)=>renderElimMatch(cat,fase.id,k,e[k],`Quarto ${i+1}: ${['1°vs8°','2°vs7°','3°vs6°','4°vs5°'][i]}`)).join('')}</div></div>`;}
  html+=`<div class="bracket-round"><div class="bracket-title">🏅 Semifinali</div><div class="bracket-grid">${renderElimMatch(cat,fase.id,'sf1',e.sf1,'Semifinale 1')}${renderElimMatch(cat,fase.id,'sf2',e.sf2,'Semifinale 2')}</div></div>`;
  html+=`<div class="bracket-round"><div class="bracket-title">🏆 Finali</div><div class="bracket-grid">${renderElimMatch(cat,fase.id,'fin12',e.fin12,'Finale 1° - 2° posto')}${renderElimMatch(cat,fase.id,'fin34',e.fin34,'Finale 3° - 4° posto')}</div></div>`;
  return html;
}

// ============================================================
// BUILDER FASE SUCCESSIVA
// ============================================================
function openBuilder(cat){
  const fasi=getFasi(cat);const last=fasi[fasi.length-1];
  if(!last||!last.gironi?.length){alert('Prima crea almeno un girone.');return;}
  const generale=classificaGenerale(last.gironi);const top8=generale.slice(0,8);const dal9=generale.slice(8);
  const defaultElim=Math.min(8,generale.length);
  const topN=generale.slice(0,defaultElim);const dalN=generale.slice(defaultElim);
  builderState={cat,gironi:last.gironi,generale,top8:topN,dal9:dalN,numElim:defaultElim,mode:'entrambi',gironiSets:PREFS[cat].sets,maxGironi:2,draft:buildDraftGironi(dalN,2)};render();
}
function buildDraftGironi(squadre,maxG){if(!squadre.length)return[];const nG=Math.min(maxG,Math.max(1,Math.floor(squadre.length/2)));const draft=Array.from({length:nG},(_,i)=>({label:String.fromCharCode(65+i),squadre:[]}));squadre.forEach((tt,i)=>draft[i%nG].squadre.push({nome:tt.nome,soc:tt.soc||'',posLabel:tt.posLabel}));return draft.filter(g=>g.squadre.length>=2);}
function setBuilderMode(m){if(!builderState)return;builderState.mode=m;if(m==='gironi')builderState.draft=buildDraftGironi(builderState.generale,builderState.maxGironi);else builderState.draft=buildDraftGironi(builderState.dal9,builderState.maxGironi);render();}
function setNumElim(n){
  if(!builderState)return;
  builderState.numElim=n;
  builderState.top8=builderState.generale.slice(0,n);
  builderState.dal9=builderState.generale.slice(n);
  builderState.draft=buildDraftGironi(builderState.dal9,builderState.maxGironi);
  render();
}
function setMaxGironi(n){if(!builderState)return;builderState.maxGironi=n;builderState.draft=buildDraftGironi(builderState.mode==='gironi'?builderState.generale:builderState.dal9,n);render();}
function builderAddTeam(nome,soc,posLabel,gi){if(!builderState)return;builderState.draft.forEach(g=>{g.squadre=g.squadre.filter(s=>s.nome!==nome)});if(gi>=0&&gi<builderState.draft.length)builderState.draft[gi].squadre.push({nome,soc,posLabel});render();}
function builderAddGirone2(){if(!builderState)return;builderState.draft.push({label:String.fromCharCode(65+builderState.draft.length),squadre:[]});render();}
function builderRemoveGirone2(i){if(!builderState)return;builderState.draft.splice(i,1);render();}
function builderRemoveTeam2(gi,nome){if(!builderState)return;builderState.draft[gi].squadre=builderState.draft[gi].squadre.filter(s=>s.nome!==nome);render();}
function builderCancel(){builderState=null;render();}
function builderConfirm(){
  if(!builderState)return;const cat=builderState.cat;const fasi=getFasi(cat);const{mode,top8,dal9,draft,gironiSets,generale,maxGironi,numElim}=builderState;
  const prevFase=fasi[fasi.length-1];if(prevFase)collapsed.add(prevFase.id);
  if(mode==='gironi'){const allDraft=buildDraftGironi(generale,maxGironi);const valid=allDraft.filter(g=>g.squadre.length>=2);if(!valid.length){alert('Nessun girone valido.');return;}fasi.push({id:uid(),label:`Fase ${fasi.length+1}`,tipo:'gironi',gironi:valid.map((d,i)=>({id:uid(),label:String.fromCharCode(65+i),squadre:d.squadre.map(s=>({nome:s.nome,soc:s.soc})),sets:gironiSets,ritorno:false,partite:genPartite(d.squadre.length,false,gironiSets)}))});}
  else if(mode==='quarti'){fasi.push({id:uid(),label:'Fase eliminazione',tipo:'elim',gironi:[],elim:buildElimStruct(generale.slice(0,numElim))});}
  else{if(dal9.length>=2){const valid=draft.filter(g=>g.squadre.length>=2);if(valid.length)fasi.push({id:uid(),label:`Fase ${fasi.length+1} — Gironi (dal 9°)`,tipo:'gironi',gironi:valid.map((d,i)=>({id:uid(),label:String.fromCharCode(65+i),squadre:d.squadre.map(s=>({nome:s.nome,soc:s.soc})),sets:gironiSets,ritorno:false,partite:genPartite(d.squadre.length,false,gironiSets)}))});}fasi.push({id:uid(),label:`Fase eliminazione (Top ${numElim})`,tipo:'elim',gironi:[],elim:buildElimStruct(top8)});}
  builderState=null;sv();render();
}

function renderNumElimSelector(numElim, totSq){
  const options=[
    {n:2,  label:'2 — Finale diretta'},
    {n:4,  label:'4 — Semifinali'},
    {n:8,  label:'8 — Quarti di finale'},
    {n:16, label:'16 — Ottavi di finale'},
    {n:32, label:'32 — Sedicesimi di finale'},
  ];
  const opts=options.filter(x=>x.n<=totSq)
    .map(x=>'<option value="'+x.n+'"'+(numElim===x.n?' selected':'')+'>'+x.label+'</option>')
    .join('');
  const resto=totSq-numElim>0?'Le restanti '+(totSq-numElim)+' vanno ai gironi':'';
  return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap">'
    +'<div class="sec" style="margin:0">Squadre alle eliminatorie:</div>'
    +'<select class="set-sel" onchange="setNumElim(parseInt(this.value))">'+opts+'</select>'
    +(resto?'<span style="font-size:12px;color:var(--txt2)">'+resto+'</span>':'')
    +'</div>';
}

function renderBuilder(b){
  if(!builderState)return'';const{mode,top8,dal9,draft,gironiSets,maxGironi,numElim,generale}=builderState;const totSq=generale.length;const pool=mode==='gironi'?generale:dal9;
  let html=`<div class="card"><div class="card-title">Nuova fase</div><p style="font-size:13px;color:var(--txt2);margin-bottom:1rem">Squadre totali: <strong>${totSq}</strong></p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:1.2rem">
      <div class="type-btn${mode==='gironi'?' sel':''}" onclick="setBuilderMode('gironi')"><h3>🏆 Solo gironi</h3><p>Tutte le ${totSq} squadre in gironi</p></div>
      <div class="type-btn${mode==='quarti'?' sel':''}" onclick="setBuilderMode('quarti')"><h3>⚡ Solo eliminazione</h3><p>Top ${numElim} → elim diretta</p></div>
      <div class="type-btn${mode==='entrambi'?' sel':''}" onclick="setBuilderMode('entrambi')"><h3>🔀 Entrambi</h3><p>Top 8 → elim · Dal 9° → gironi</p></div>
    </div>
    ${mode!=='gironi'?renderNumElimSelector(numElim,totSq):''}
    <div style="background:var(--info);border-radius:8px;padding:12px;margin-bottom:12px">
      <div class="sec">Classifica generale — ordine selezione</div>
      <div style="font-size:11px;color:var(--txt2);margin-bottom:8px">Tutti i 1° (per Q.Set) → migliori 2° → migliori 3°, ecc.</div>
      <table><thead><tr><th>#</th><th>Squadra</th><th>Soc</th><th>Da</th><th>Q.Set</th><th>Destino</th></tr></thead><tbody>
      ${generale.map((tt,i)=>`<tr style="${i<numElim?'background:rgba(254,249,195,0.3)':''}"><td style="font-weight:700;color:${i<numElim?'#854d0e':'#166534'}">${i+1}</td><td style="font-weight:600">${tt.nome}</td><td style="font-size:11px;color:var(--txt2)">${tt.soc||''}</td><td style="font-size:11px;color:var(--txt2)">${tt.posLabel}</td><td>${tt.sp>0?(tt.sv/tt.sp).toFixed(2):tt.sv}</td><td style="font-size:11px;font-weight:700;color:${i<numElim?'#854d0e':'#166534'}">${i<numElim?(mode==='gironi'?'🏆':'⚡ Elim'):(mode==='quarti'?'—':'🏆 Girone')}</td></tr>`).join('')}
      </tbody></table>
    </div>`;
  if((mode==='entrambi'&&dal9.length>=2)||mode==='gironi'){
    html+=`<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;flex-wrap:wrap">
      <div class="sec" style="margin:0">Gironi${mode==='entrambi'?' (dal 9°)':''}:</div>
      <select class="set-sel" onchange="setMaxGironi(parseInt(this.value))">${[1,2,3,4,5,6].map(n=>`<option value="${n}"${maxGironi===n?' selected':''}>${n} giron${n===1?'e':'i'}</option>`).join('')}</select>
      <div class="sec" style="margin:0">Set:</div>
      <select class="set-sel" onchange="builderState.gironiSets=parseInt(this.value)"><option value="1"${gironiSets===1?' selected':''}>1 set</option><option value="2"${gironiSets===2?' selected':''}>2 set</option></select>
    </div>
    ${draft.map((g,gi)=>`<div class="fase2-box"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px"><span class="gbadge ${b}">Girone ${g.label} — ${g.squadre.length} sq</span><button class="bxsm bd" onclick="builderRemoveGirone2(${gi})">✕</button></div>
      <div style="min-height:28px;margin-bottom:8px;display:flex;flex-wrap:wrap;gap:4px">${g.squadre.length?g.squadre.map(s=>`<span class="team-chip">${s.nome}${s.soc?` <span style="opacity:.6;font-size:10px">(${s.soc})</span>`:''} <span style="font-size:10px;opacity:.5">${s.posLabel||''}</span><button onclick="builderRemoveTeam2(${gi},'${s.nome.replace(/'/g,"\\'")}')">×</button></span>`).join(''):'<span style="font-size:12px;color:var(--txt2)">Nessuna squadra</span>'}</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">${pool.filter(tt=>!g.squadre.find(s=>s.nome===tt.nome)).map(tt=>`<button class="bxsm" onclick="builderAddTeam('${tt.nome.replace(/'/g,"\\'")}','${(tt.soc||'').replace(/'/g,"\\'")}','${(tt.posLabel||'').replace(/'/g,"\\'")}',${gi})">${tt.nome}${tt.soc?` <span style="opacity:.5">(${tt.soc})</span>`:''}</button>`).join('')}</div>
    </div>`).join('')}
    <button class="bsm" style="margin-top:4px" onclick="builderAddGirone2()">+ Aggiungi girone</button>`;
  }
  html+=`<div style="display:flex;gap:10px;margin-top:1.5rem;justify-content:flex-end"><button onclick="builderCancel()">Annulla</button><button class="bp" onclick="builderConfirm()">✓ Crea fase</button></div></div>`;
  return html;
}
