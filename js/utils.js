/* Utility: calcoli, shuffle, helpers torneo */
'use strict';

// ============================================================
// UTILS
// ============================================================
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function toggleTheme(){isDark=!isDark;document.documentElement.setAttribute('data-theme',isDark?'dark':'light');document.getElementById('themeBtn').textContent=isDark?'☀️':'🌙';}
function toggleCollapse(fid){if(collapsed.has(fid))collapsed.delete(fid);else collapsed.add(fid);render();}
function goHome(){view='home';currentTorneoId=null;localCat='white';IC={};builderState=null;socEditState=null;document.getElementById('torneoNomeHdr').textContent='Nessun torneo selezionato';render();}
function currentTorneo(){return currentTorneoId?DB.tornei[currentTorneoId]:null;}
function catLabel(c){return c==='white'?'White':c==='green'?'Green':'Red';}
function badge(c){return c==='white'?'bw':c==='green'?'bg2':'br2';}

// ============================================================
// SHUFFLE NO-CONSEC
// ============================================================
function shuffleNoConsec(arr){
  const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  for(let t=0;t<50;t++){let ok=true;for(let i=1;i<a.length;i++){const p=a[i-1],c=a[i];if(p.h===c.h||p.h===c.a||p.a===c.h||p.a===c.a){let sw=false;for(let j=i+1;j<a.length;j++){const x=a[j];if(!(p.h===x.h||p.h===x.a||p.a===x.h||p.a===x.a)&&(j+1>=a.length||!(x.h===c.h||x.h===c.a||x.a===c.h||x.a===c.a))){[a[i],a[j]]=[a[j],a[i]];sw=true;break;}}if(!sw){ok=false;break;}}}if(ok)break;}
  return a;
}
function genPartite(n,ritorno,sets){
  const a=[];for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)a.push({h:i,a:j,leg:1,s1h:'',s1a:'',s2h:'',s2a:'',sets:sets||2});
  const sh=shuffleNoConsec(a);if(!ritorno)return sh;
  return[...sh,...sh.map(p=>({h:p.a,a:p.h,leg:2,s1h:'',s1a:'',s2h:'',s2a:'',sets:sets||2}))];
}

// ============================================================
// ASSEGNAZIONE SQUADRE CON DIVERSITÀ SOCIETÀ
// ============================================================
function assegnaSquadre(cat,gironi,societa){
  const pool=[];
  for(const s of societa){
    const sqCat=s.squadre.filter(sq=>sq.cat===cat);
    for(const sq of sqCat) pool.push({nome:sq.nome,soc:s.nome});
  }
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}

  const result=gironi.map(g=>({n:g.n,squadre:[]}));
  const remaining=[...pool];

  for(let round=0;remaining.length>0;round++){
    for(let gi=0;gi<result.length&&remaining.length>0;gi++){
      const girone=result[gi];
      if(girone.squadre.length>=girone.n) continue;
      const socInGirone=new Set(girone.squadre.map(s=>s.soc));
      const diverse=remaining.filter(s=>!socInGirone.has(s.soc));
      const candidates=diverse.length>0?diverse:remaining;
      const chosen=candidates[0];
      girone.squadre.push(chosen);
      remaining.splice(remaining.indexOf(chosen),1);
    }
  }
  return result;
}

// ============================================================
// CALCOLO CLASSIFICA
// ============================================================
function calcCl(g){
  const t=g.squadre.map((s,i)=>({i,nome:s.nome,soc:s.soc||'',pt:0,sv:0,sp:0,pv:0,pp:0}));
  for(const p of g.partite){
    if(p.s1h===''||p.s1a==='')continue;
    const s1h=parseInt(p.s1h)||0,s1a=parseInt(p.s1a)||0;
    const sets=p.sets||g.sets||2;const has2=sets===2&&p.s2h!=='';
    const s2h=has2?parseInt(p.s2h)||0:0,s2a=has2?parseInt(p.s2a)||0:0;
    const sh=(s1h>s1a?1:0)+(has2&&s2h>s2a?1:0);const sa=(s1a>s1h?1:0)+(has2&&s2a>s2h?1:0);
    t[p.h].pt+=sh;t[p.a].pt+=sa;t[p.h].sv+=sh;t[p.a].sv+=sa;t[p.h].sp+=sa;t[p.a].sp+=sh;
    t[p.h].pv+=s1h+(has2?s2h:0);t[p.a].pv+=s1a+(has2?s2a:0);t[p.h].pp+=s1a+(has2?s2a:0);t[p.a].pp+=s1h+(has2?s2h:0);
  }
  t.forEach(x=>{x.ds=x.sv-x.sp;x.dp=x.pv-x.pp});
  t.sort((a,b)=>b.pt-a.pt||b.ds-a.ds||b.dp-a.dp);
  return t;
}

function classificaGenerale(gironi){
  const cls=gironi.map(g=>({label:g.label,cl:calcCl(g)}));
  const maxPos=Math.max(0,...cls.map(c=>c.cl.length-1));
  const res=[];
  for(let pos=0;pos<=maxPos;pos++){
    const gr=[];
    for(const{label,cl}of cls){const t=cl[pos];if(!t)continue;const qs=t.sp>0?t.sv/t.sp:t.sv;const qp=t.pp>0?t.pv/t.pp:t.pv;gr.push({...t,girone:label,pos,posLabel:`${pos+1}° Girone ${label}`,qs,qp});}
    gr.sort((a,b)=>Math.abs(b.qs-a.qs)>0.001?b.qs-a.qs:b.qp-a.qp);
    res.push(...gr);
  }
  return res;
}

function buildElimStruct(teams){
  const n=teams.length;
  const nm=i=>teams[i]?.nome||'?';
  const lb=i=>teams[i]?.posLabel||'?';
  const e={};

  if(n>=8){
    const last=Math.min(n-1,7);
    e.q1={t1:nm(0),t2:nm(Math.min(7,last)),  da1:lb(0),da2:lb(Math.min(7,last)),  s1h:'',s1a:''};
    e.q2={t1:nm(1),t2:nm(Math.min(6,last-1)),da1:lb(1),da2:lb(Math.min(6,last-1)),s1h:'',s1a:''};
    e.q3={t1:nm(2),t2:nm(Math.min(5,last-2)),da1:lb(2),da2:lb(Math.min(5,last-2)),s1h:'',s1a:''};
    e.q4={t1:nm(3),t2:nm(Math.min(4,last-3)),da1:lb(3),da2:lb(Math.min(4,last-3)),s1h:'',s1a:''};
    e.sf1={t1:'Vincente Q1',t2:'Vincente Q4',s1h:'',s1a:''};
    e.sf2={t1:'Vincente Q2',t2:'Vincente Q3',s1h:'',s1a:''};
  } else if(n>=4){
    e.sf1={t1:nm(0),t2:nm(Math.min(3,n-1)),da1:lb(0),da2:lb(Math.min(3,n-1)),s1h:'',s1a:''};
    e.sf2={t1:nm(1),t2:nm(Math.min(2,n-2)),da1:lb(1),da2:lb(Math.min(2,n-2)),s1h:'',s1a:''};
  } else if(n>=2){
    e.sf1={t1:nm(0),t2:nm(1),da1:lb(0),da2:lb(1),s1h:'',s1a:''};
    e.sf2=null;
  }

  e.fin12={t1:'Vincente SF1',t2:e.sf2?'Vincente SF2':nm(1),s1h:'',s1a:''};
  e.fin34={t1:'Perdente SF1',t2:e.sf2?'Perdente SF2':'',s1h:'',s1a:''};
  return e;
}

function getWinner(m){if(!m||m.s1h===''||m.s1a==='')return null;return(parseInt(m.s1h)||0)>(parseInt(m.s1a)||0)?m.t1:m.t2;}
function getLoser(m){if(!m||m.s1h===''||m.s1a==='')return null;return(parseInt(m.s1h)||0)<=(parseInt(m.s1a)||0)?m.t1:m.t2;}
function propagateElim(fase){
  const e=fase.elim;if(!e)return;
  if(e.q1&&e.q2&&e.sf1){const w1=getWinner(e.q1),w2=getWinner(e.q2);if(w1)e.sf1.t1=w1;if(w2)e.sf2&&(e.sf2.t1=w2);}
  if(e.q3&&e.q4){const w4=getWinner(e.q4),w3=getWinner(e.q3);if(w4&&e.sf1)e.sf1.t2=w4;if(w3&&e.sf2)e.sf2.t2=w3;}
  if(e.sf1&&e.sf2){const ws1=getWinner(e.sf1),ws2=getWinner(e.sf2),ls1=getLoser(e.sf1),ls2=getLoser(e.sf2);if(e.fin12){if(ws1)e.fin12.t1=ws1;if(ws2)e.fin12.t2=ws2;}if(e.fin34){if(ls1)e.fin34.t1=ls1;if(ls2)e.fin34.t2=ls2;}}
}

// ============================================================
// HELPERS TORNEO
// ============================================================
function getFasi(cat){
  const t=currentTorneo();
  if(!t)return[];
  if(!t.cats)t.cats={white:{fasi:[]},green:{fasi:[]},red:{fasi:[]}};
  if(!t.cats[cat])t.cats[cat]={fasi:[]};
  if(!Array.isArray(t.cats[cat].fasi))t.cats[cat].fasi=[];
  return t.cats[cat].fasi;
}
function getFase(cat,fid){return getFasi(cat).find(f=>f.id===fid);}
function getGirone(cat,fid,gv){return getFase(cat,fid)?.gironi.find(g=>g.id===gv);}
function icKey(cat,fid,gv,pid,f){return`${cat}_${fid}_${gv}_${pid}_${f}`;}
function onInput(cat,fid,gv,pid,f,v){IC[icKey(cat,fid,gv,pid,f)]=v;}
function getV(cat,fid,gv,pid,f,saved){const k=icKey(cat,fid,gv,pid,f);return IC[k]!==undefined?IC[k]:saved;}

function setScat(c){
  localCat=c;
  if(builderState&&builderState.cat!==c)builderState=null;
  socEditState=null;
  render();
}

// ============================================================
// PAGINA LIVE — helpers salvataggio pageConfig
// ============================================================
function ensurePageConfig(){
  const t=currentTorneo();if(!t)return null;
  if(!t.pageConfig) t.pageConfig={sponsorEnabled:false,infoEnabled:false,sponsor:{cats:[]},infoBlocks:[]};
  if(!t.pageConfig.sponsor) t.pageConfig.sponsor={cats:[]};
  if(!Array.isArray(t.pageConfig.sponsor.cats)) t.pageConfig.sponsor.cats=[];
  if(!Array.isArray(t.pageConfig.infoBlocks)) t.pageConfig.infoBlocks=[];
  return t.pageConfig;
}

function toggleSponsorEnabled(){
  const cfg=ensurePageConfig();if(!cfg)return;
  cfg.sponsorEnabled=!cfg.sponsorEnabled;sv();render();
}
function toggleInfoEnabled(){
  const cfg=ensurePageConfig();if(!cfg)return;
  cfg.infoEnabled=!cfg.infoEnabled;sv();render();
}

// ── Sponsor: gestione categorie ──────────────────────────
function addSponsorCat(){
  const cfg=ensurePageConfig();if(!cfg)return;
  cfg.sponsor.cats.push({id:uid(),nome:'Nuova categoria',items:[]});
  sv();render();
}
function delSponsorCat(ci){
  const cfg=ensurePageConfig();if(!cfg)return;
  if(!confirm('Eliminare questa categoria sponsor?'))return;
  cfg.sponsor.cats.splice(ci,1);sv();render();
}
function updateSponsorCatNome(ci,val){
  const cfg=ensurePageConfig();if(!cfg)return;
  cfg.sponsor.cats[ci].nome=val;sv();
}
function moveSponsorCat(ci,dir){
  const cfg=ensurePageConfig();if(!cfg)return;
  const to=ci+dir;if(to<0||to>=cfg.sponsor.cats.length)return;
  [cfg.sponsor.cats[ci],cfg.sponsor.cats[to]]=[cfg.sponsor.cats[to],cfg.sponsor.cats[ci]];
  sv();render();
}

// ── Sponsor: gestione item ────────────────────────────────
function addSponsorItem(ci){
  const cfg=ensurePageConfig();if(!cfg)return;
  cfg.sponsor.cats[ci].items.push({id:uid(),nome:'',frase:'',immagine:'',size:'medio'});
  sv();render();
}
function delSponsorItem(ci,ii){
  const cfg=ensurePageConfig();if(!cfg)return;
  cfg.sponsor.cats[ci].items.splice(ii,1);sv();render();
}
function updateSponsorItem(ci,ii,field,val){
  const cfg=ensurePageConfig();if(!cfg)return;
  cfg.sponsor.cats[ci].items[ii][field]=val;sv();
}
function uploadSponsorImg(ci,ii,input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{updateSponsorItem(ci,ii,'immagine',e.target.result);render();};
  reader.readAsDataURL(file);
}
function moveSponsorItem(ci,ii,dir){
  const cfg=ensurePageConfig();if(!cfg)return;
  const items=cfg.sponsor.cats[ci].items;
  const to=ii+dir;if(to<0||to>=items.length)return;
  [items[ii],items[to]]=[items[to],items[ii]];
  sv();render();
}

// ── Info: gestione blocchi ────────────────────────────────
function addInfoBlock(){
  const cfg=ensurePageConfig();if(!cfg)return;
  cfg.infoBlocks.push({id:uid(),titolo:'',testo:''});
  sv();render();
}
function delInfoBlock(bi){
  const cfg=ensurePageConfig();if(!cfg)return;
  cfg.infoBlocks.splice(bi,1);sv();render();
}
function updateInfoBlock(bi,field,val){
  const cfg=ensurePageConfig();if(!cfg)return;
  cfg.infoBlocks[bi][field]=val;sv();
}
function moveInfoBlock(bi,dir){
  const cfg=ensurePageConfig();if(!cfg)return;
  const to=bi+dir;if(to<0||to>=cfg.infoBlocks.length)return;
  [cfg.infoBlocks[bi],cfg.infoBlocks[to]]=[cfg.infoBlocks[to],cfg.infoBlocks[bi]];
  sv();render();
}

// ============================================================
// SUGGERIMENTO GIRONI DA NUMERO CAMPI
// ============================================================
// Dati N squadre e M campi (= max M gironi), distribuisce le
// squadre il più equamente possibile dando priorità a gironi
// tutti uguali (per evitare classifiche avulse).
// Restituisce un array di interi es. [5,5,4] oppure null.
function suggerisciGironi(totSq, nCampi){
  if(!totSq||!nCampi||nCampi<1)return null;
  // Numero di gironi: al massimo nCampi, ma non più del numero di squadre
  // Trova il numero di gironi G (1..nCampi) che minimizza la varianza
  // delle dimensioni, preferendo gironi più grandi (almeno 3 sq)
  let best=null;let bestScore=Infinity;
  for(let G=nCampi;G>=1;G--){
    const base=Math.floor(totSq/G);
    const resto=totSq%G;
    // resto gironi hanno base+1 squadre, gli altri base
    if(base<3)continue; // gironi troppo piccoli non hanno senso
    // score: varianza ponderata (0 se tutti uguali, 1 se c'è un girone diverso)
    const score=resto===0?0:1;
    if(score<bestScore){
      bestScore=score;
      // costruisce array: prima i gironi più grandi
      best=[];
      for(let i=0;i<G;i++) best.push(i<resto?base+1:base);
    }
    // Se già tutti uguali, non serve cercare oltre
    if(bestScore===0)break;
  }
  return best;
}

// Crea automaticamente i gironi suggeriti eliminando quelli esistenti
function creaSuggeriti(cat){
  const t=currentTorneo();if(!t)return;
  if(!t.cats)t.cats={white:{fasi:[]},green:{fasi:[]},red:{fasi:[]}};
  if(!t.cats[cat])t.cats[cat]={fasi:[]};
  if(!t.cats[cat].fasi.length)t.cats[cat].fasi.push({id:uid(),label:'Fase 1',gironi:[]});
  const f1=t.cats[cat].fasi[0];
  const totSq=(t.societa||[]).reduce((s,x)=>s+(x.sqPerCat?.[cat]||0),0);
  const nCampi=PREFS[cat].campi||0;
  const sug=suggerisciGironi(totSq,nCampi);
  if(!sug){alert('Nessun suggerimento disponibile. Verifica il numero di campi e le squadre iscritte.');return;}
  const sets=PREFS[cat].sets||2;

  // Costruisce pool squadre da società (stesso algoritmo di addGirone)
  const fasi=t.cats[cat].fasi;
  const usedNomi=[];
  const socPool=[];
  for(const soc of(t.societa||[])){
    const n=soc.sqPerCat?.[cat]||0;
    for(let i=0;i<n;i++) socPool.push({soc:soc.nome});
  }
  // Shuffle pool
  for(let i=socPool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[socPool[i],socPool[j]]=[socPool[j],socPool[i]];}

  // Reset gironi esistenti
  f1.gironi=[];
  const availNomi=[...NAMES[cat]];

  let poolIdx=0;
  for(let gi=0;gi<sug.length;gi++){
    const sz=sug[gi];
    const label=String.fromCharCode(65+gi);
    const squadre=[];
    const socInGirone=new Set();
    // Greedy: massimizza diversità società
    const remaining=socPool.slice(poolIdx);
    const chosen=[];
    for(let slot=0;slot<sz;slot++){
      const diverse=remaining.filter((s,idx)=>!socInGirone.has(s.soc)&&!chosen.includes(idx));
      const fallback=remaining.filter((_,idx)=>!chosen.includes(idx));
      const candidates=diverse.length>0?diverse:fallback;
      if(!candidates.length)break;
      const pick=candidates[0];
      const pickIdx=remaining.indexOf(pick);
      chosen.push(pickIdx);
      socInGirone.add(pick.soc);
      squadre.push({nome:availNomi.shift()||`Sq${squadre.length+1}`,soc:pick.soc});
    }
    // Rimuovi le scelte dal pool globale
    const pickedSocs=squadre.map(s=>s.soc);
    for(const ps of pickedSocs){
      const idx=socPool.findIndex((s,i)=>i>=poolIdx&&s.soc===ps);
      if(idx>=0)socPool.splice(idx,1);
    }
    // Se squadre insufficienti dal pool, completa con slot vuoti
    while(squadre.length<sz)squadre.push({nome:availNomi.shift()||`Sq${squadre.length+1}`,soc:''});

    f1.gironi.push({id:uid(),label,squadre,sets,ritorno:false,partite:genPartite(sz,false,sets)});
  }

  sv();render();
}
