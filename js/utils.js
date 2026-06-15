/* Utility: calcoli, shuffle, helpers torneo */
'use strict';

// ============================================================
// UTILS BASE
// ============================================================
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function toggleTheme(){isDark=!isDark;document.documentElement.setAttribute('data-theme',isDark?'dark':'light');document.getElementById('themeBtn').textContent=isDark?'☀️':'🌙';}
function toggleCollapse(fid){if(collapsed.has(fid))collapsed.delete(fid);else collapsed.add(fid);render();}
function goHome(){view='home';currentTorneoId=null;localCat=null;IC={};builderState=null;socEditState=null;document.getElementById('torneoNomeHdr').textContent='Nessun torneo selezionato';render();}
function currentTorneo(){return currentTorneoId?DB.tornei[currentTorneoId]:null;}

// ============================================================
// HELPERS CATEGORIE DINAMICHE
// ============================================================
// Restituisce le categorie del torneo corrente (con migrazione da vecchio formato)
function getCats(){
  const t=currentTorneo();if(!t)return[];
  // Migrazione: vecchio formato cats:{white,green,red} → nuovo formato categorie:[]
  if(!t.categorie){
    t.categorie=[];
    const oldMap={white:{nome:'White',colore:'#1e40af',emoji:'⬜'},green:{nome:'Green',colore:'#166534',emoji:'🟩'},red:{nome:'Red',colore:'#991b1b',emoji:'🟥'}};
    for(const [id,meta] of Object.entries(oldMap)){
      const fasi=t.cats?.[id]?.fasi||[{id:uid(),label:'Fase 1',gironi:[]}];
      t.categorie.push({id,nome:meta.nome,colore:meta.colore,emoji:meta.emoji,fasi});
    }
    delete t.cats;
  }
  return t.categorie;
}

// Trova una categoria per id
function getCat(catId){return getCats().find(c=>c.id===catId)||null;}

// Etichetta e stile da una categoria
function catLabel(catId){const c=getCat(catId);return c?c.nome:catId;}
function catColore(catId){const c=getCat(catId);return c?c.colore:'#555';}
function catEmoji(catId){const c=getCat(catId);return c?c.emoji:'';}

// Badge inline style per una categoria
function catBadgeStyle(catId){
  const col=catColore(catId);
  // genera bg chiaro dal colore hex
  return`background:${col}22;color:${col};border:1px solid ${col}55;`;
}

// Prima categoria disponibile
function firstCat(){const cats=getCats();return cats.length?cats[0].id:null;}

// ============================================================
// GESTIONE CATEGORIE (CRUD)
// ============================================================
function addCategoria(nome,colore,emoji){
  const t=currentTorneo();if(!t)return;
  getCats(); // assicura migrazione
  const id=uid();
  t.categorie.push({id,nome:nome||'Nuova',colore:colore||'#7c3aed',emoji:emoji||'🟣',fasi:[{id:uid(),label:'Fase 1',gironi:[]}]});
  // Aggiungi sqPerCat e bambini per tutte le società
  for(const s of(t.societa||[])){
    if(!s.sqPerCat)s.sqPerCat={};
    if(!s.bambini)s.bambini={};
    s.sqPerCat[id]=0;s.bambini[id]=0;
  }
  sv();render();
}
function delCategoria(catId){
  const t=currentTorneo();if(!t)return;
  if(!confirm(`Eliminare la categoria "${catLabel(catId)}" e tutti i suoi gironi?`))return;
  t.categorie=t.categorie.filter(c=>c.id!==catId);
  if(localCat===catId)localCat=firstCat();
  sv();render();
}
function updateCategoria(catId,field,val){
  const c=getCat(catId);if(!c)return;
  c[field]=val;sv();
}
function moveCategoria(catId,dir){
  const t=currentTorneo();if(!t)return;
  const cats=t.categorie;
  const idx=cats.findIndex(c=>c.id===catId);
  const to=idx+dir;if(to<0||to>=cats.length)return;
  [cats[idx],cats[to]]=[cats[to],cats[idx]];
  sv();render();
}

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
// NOMI SQUADRE DINAMICI
// ============================================================
// Per categorie custom usa un pool generico
const NAMES_GENERIC=["STELLE","COMETE","METEORE","PIANETI","GALASSIE","NEBULOSE","QUASAR","PULSAR","NOVAS","AURORA","ZENITH","NADIR","SOLSTIZIO","EQUINOZIO","ECLISSI","CORONA","CROCE","ORIONE","VEGA","SIRIUS","ALTAIR","DENEB","RIGEL","ANTARES","POLLUCE","CASTORE","PROCIONE","ARTURO","ALDEBARAN","BETELGEUSE"];
function getNomiCat(catId){
  // Categorie di base usano NAMES da config.js se disponibili
  if(typeof NAMES!=='undefined'&&NAMES[catId])return NAMES[catId];
  return NAMES_GENERIC;
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
    e.q1={t1:nm(0),t2:nm(Math.min(7,last)),da1:lb(0),da2:lb(Math.min(7,last)),s1h:'',s1a:''};
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
  if(e.q1&&e.q2&&e.sf1){const w1=getWinner(e.q1),w2=getWinner(e.q2);if(w1)e.sf1.t1=w1;if(w2&&e.sf2)e.sf2.t1=w2;}
  if(e.q3&&e.q4){const w4=getWinner(e.q4),w3=getWinner(e.q3);if(w4&&e.sf1)e.sf1.t2=w4;if(w3&&e.sf2)e.sf2.t2=w3;}
  if(e.sf1&&e.sf2){const ws1=getWinner(e.sf1),ws2=getWinner(e.sf2),ls1=getLoser(e.sf1),ls2=getLoser(e.sf2);if(e.fin12){if(ws1)e.fin12.t1=ws1;if(ws2)e.fin12.t2=ws2;}if(e.fin34){if(ls1)e.fin34.t1=ls1;if(ls2)e.fin34.t2=ls2;}}
}

// ============================================================
// HELPERS FASI / GIRONI
// ============================================================
function getFasi(catId){
  const c=getCat(catId);if(!c)return[];
  if(!Array.isArray(c.fasi))c.fasi=[];
  return c.fasi;
}
function getFase(catId,fid){return getFasi(catId).find(f=>f.id===fid);}
function getGirone(catId,fid,gv){return getFase(catId,fid)?.gironi.find(g=>g.id===gv);}
function icKey(catId,fid,gv,pid,f){return`${catId}_${fid}_${gv}_${pid}_${f}`;}
function onInput(catId,fid,gv,pid,f,v){IC[icKey(catId,fid,gv,pid,f)]=v;}
function getV(catId,fid,gv,pid,f,saved){const k=icKey(catId,fid,gv,pid,f);return IC[k]!==undefined?IC[k]:saved;}

function setScat(c){
  localCat=c;
  if(builderState&&builderState.cat!==c)builderState=null;
  socEditState=null;
  render();
}

// ============================================================
// SUGGERIMENTO GIRONI DA NUMERO CAMPI
// ============================================================
function suggerisciGironi(totSq,nCampi){
  if(!totSq||!nCampi||nCampi<1)return null;
  let firstValid=null,bestEqual=null;
  for(let G=nCampi;G>=1;G--){
    const base=Math.floor(totSq/G),resto=totSq%G;
    if(base<3)continue;
    if(firstValid===null)firstValid={G,base,resto};
    if(resto===0&&bestEqual===null)bestEqual={G,base,resto};
  }
  if(!firstValid)return null;
  const chosen=(bestEqual&&bestEqual.G===firstValid.G)?bestEqual:firstValid;
  const arr=[];
  for(let i=0;i<chosen.G;i++)arr.push(i<chosen.resto?chosen.base+1:chosen.base);
  return arr;
}

function creaSuggeriti(catId){
  const t=currentTorneo();if(!t)return;
  getCats(); // assicura migrazione
  const cat=getCat(catId);if(!cat)return;
  if(!cat.fasi||!cat.fasi.length)cat.fasi=[{id:uid(),label:'Fase 1',gironi:[]}];
  const f1=cat.fasi[0];
  const totSq=(t.societa||[]).reduce((s,x)=>s+(x.sqPerCat?.[catId]||0),0);
  const nCampi=getPref(catId,'campi',0);
  const sug=suggerisciGironi(totSq,nCampi);
  if(!sug){alert('Nessun suggerimento disponibile. Verifica il numero di campi e le squadre iscritte.');return;}
  const sets=getPref(catId,'sets',2);
  const nomiDisp=[...getNomiCat(catId)];
  const socPool=[];
  for(const soc of(t.societa||[])){const n=soc.sqPerCat?.[catId]||0;for(let i=0;i<n;i++)socPool.push({soc:soc.nome});}
  for(let i=socPool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[socPool[i],socPool[j]]=[socPool[j],socPool[i]];}
  f1.gironi=[];
  for(let gi=0;gi<sug.length;gi++){
    const sz=sug[gi];const label=String.fromCharCode(65+gi);
    const squadre=[];const socInGirone=new Set();const remaining=[...socPool];
    for(let slot=0;slot<sz&&remaining.length>0;slot++){
      const diverse=remaining.filter(s=>!socInGirone.has(s.soc));
      const pick=(diverse.length?diverse:remaining)[0];
      socInGirone.add(pick.soc);remaining.splice(remaining.indexOf(pick),1);
      squadre.push({nome:nomiDisp.shift()||`Sq${squadre.length+1}`,soc:pick.soc});
    }
    // rimuovi usati dal pool globale
    for(const sq of squadre){const idx=socPool.findIndex(s=>s.soc===sq.soc);if(idx>=0)socPool.splice(idx,1);}
    while(squadre.length<sz)squadre.push({nome:nomiDisp.shift()||`Sq${squadre.length+1}`,soc:''});
    f1.gironi.push({id:uid(),label,squadre,sets,ritorno:false,partite:genPartite(sz,false,sets)});
  }
  sv();render();
}

// ============================================================
// PAGINA LIVE — helpers pageConfig
// ============================================================
function ensurePageConfig(){
  const t=currentTorneo();if(!t)return null;
  if(!t.pageConfig)t.pageConfig={sponsorEnabled:false,infoEnabled:false,menuEnabled:false,sponsor:{cats:[]},infoBlocks:[],menu:{sezioni:[]}};
  if(!t.pageConfig.sponsor)t.pageConfig.sponsor={cats:[]};
  if(!Array.isArray(t.pageConfig.sponsor.cats))t.pageConfig.sponsor.cats=[];
  if(!Array.isArray(t.pageConfig.infoBlocks))t.pageConfig.infoBlocks=[];
  if(!t.pageConfig.menu)t.pageConfig.menu={sezioni:[]};
  if(!Array.isArray(t.pageConfig.menu.sezioni))t.pageConfig.menu.sezioni=[];
  return t.pageConfig;
}
function toggleSponsorEnabled(){const cfg=ensurePageConfig();if(!cfg)return;cfg.sponsorEnabled=!cfg.sponsorEnabled;sv();render();}
function toggleInfoEnabled(){const cfg=ensurePageConfig();if(!cfg)return;cfg.infoEnabled=!cfg.infoEnabled;sv();render();}
function toggleMenuEnabled(){const cfg=ensurePageConfig();if(!cfg)return;cfg.menuEnabled=!cfg.menuEnabled;sv();render();}

// Sponsor categorie
function addSponsorCat(){const cfg=ensurePageConfig();if(!cfg)return;cfg.sponsor.cats.push({id:uid(),nome:'Nuova categoria',items:[]});sv();render();}
function delSponsorCat(ci){const cfg=ensurePageConfig();if(!cfg)return;if(!confirm('Eliminare questa categoria sponsor?'))return;cfg.sponsor.cats.splice(ci,1);sv();render();}
function updateSponsorCatNome(ci,val){const cfg=ensurePageConfig();if(!cfg)return;cfg.sponsor.cats[ci].nome=val;sv();}
function moveSponsorCat(ci,dir){const cfg=ensurePageConfig();if(!cfg)return;const to=ci+dir;if(to<0||to>=cfg.sponsor.cats.length)return;[cfg.sponsor.cats[ci],cfg.sponsor.cats[to]]=[cfg.sponsor.cats[to],cfg.sponsor.cats[ci]];sv();render();}

// Sponsor item
function addSponsorItem(ci){const cfg=ensurePageConfig();if(!cfg)return;cfg.sponsor.cats[ci].items.push({id:uid(),nome:'',frase:'',immagine:'',size:'medio'});sv();render();}
function delSponsorItem(ci,ii){const cfg=ensurePageConfig();if(!cfg)return;cfg.sponsor.cats[ci].items.splice(ii,1);sv();render();}
function updateSponsorItem(ci,ii,field,val){const cfg=ensurePageConfig();if(!cfg)return;cfg.sponsor.cats[ci].items[ii][field]=val;sv();}
function uploadSponsorImg(ci,ii,input){const file=input.files[0];if(!file)return;const reader=new FileReader();reader.onload=e=>{updateSponsorItem(ci,ii,'immagine',e.target.result);render();};reader.readAsDataURL(file);}
function moveSponsorItem(ci,ii,dir){const cfg=ensurePageConfig();if(!cfg)return;const items=cfg.sponsor.cats[ci].items;const to=ii+dir;if(to<0||to>=items.length)return;[items[ii],items[to]]=[items[to],items[ii]];sv();render();}

// Info blocchi
function addInfoBlock(){const cfg=ensurePageConfig();if(!cfg)return;cfg.infoBlocks.push({id:uid(),titolo:'',testo:''});sv();render();}
function delInfoBlock(bi){const cfg=ensurePageConfig();if(!cfg)return;cfg.infoBlocks.splice(bi,1);sv();render();}
function updateInfoBlock(bi,field,val){const cfg=ensurePageConfig();if(!cfg)return;cfg.infoBlocks[bi][field]=val;sv();}
function moveInfoBlock(bi,dir){const cfg=ensurePageConfig();if(!cfg)return;const to=bi+dir;if(to<0||to>=cfg.infoBlocks.length)return;[cfg.infoBlocks[bi],cfg.infoBlocks[to]]=[cfg.infoBlocks[to],cfg.infoBlocks[bi]];sv();render();}

// Menu sezioni
function addMenuSezione(){const cfg=ensurePageConfig();if(!cfg)return;cfg.menu.sezioni.push({id:uid(),nome:'Nuova sezione',voci:[]});sv();render();}
function delMenuSezione(si){const cfg=ensurePageConfig();if(!cfg)return;if(!confirm('Eliminare questa sezione?'))return;cfg.menu.sezioni.splice(si,1);sv();render();}
function updateMenuSezione(si,val){const cfg=ensurePageConfig();if(!cfg)return;cfg.menu.sezioni[si].nome=val;sv();}
function moveMenuSezione(si,dir){const cfg=ensurePageConfig();if(!cfg)return;const to=si+dir;if(to<0||to>=cfg.menu.sezioni.length)return;[cfg.menu.sezioni[si],cfg.menu.sezioni[to]]=[cfg.menu.sezioni[to],cfg.menu.sezioni[si]];sv();render();}
// Menu voci
function addMenuVoce(si){const cfg=ensurePageConfig();if(!cfg)return;cfg.menu.sezioni[si].voci.push({id:uid(),nome:'',prezzo:'',desc:''});sv();render();}
function delMenuVoce(si,vi){const cfg=ensurePageConfig();if(!cfg)return;cfg.menu.sezioni[si].voci.splice(vi,1);sv();render();}
function updateMenuVoce(si,vi,field,val){const cfg=ensurePageConfig();if(!cfg)return;cfg.menu.sezioni[si].voci[vi][field]=val;sv();}
function moveMenuVoce(si,vi,dir){const cfg=ensurePageConfig();if(!cfg)return;const voci=cfg.menu.sezioni[si].voci;const to=vi+dir;if(to<0||to>=voci.length)return;[voci[vi],voci[to]]=[voci[to],voci[vi]];sv();render();}
