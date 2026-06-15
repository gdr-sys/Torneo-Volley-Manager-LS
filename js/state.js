/* Stato globale applicazione */
'use strict';

// ============================================================
// STATO GLOBALE
// ============================================================
// PREFS ora è un oggetto dinamico indicizzato per catId
let PREFS={}; // {catId: {sz:4, sets:2, campi:0}}
function getPref(catId,key,def){if(!PREFS[catId])PREFS[catId]={sz:4,sets:2,campi:0};return PREFS[catId][key]??def;}
function setPref(catId,key,val){if(!PREFS[catId])PREFS[catId]={sz:4,sets:2,campi:0};PREFS[catId][key]=val;}

const collapsed=new Set();
let isDark=false;
let saveTimer=null;
let builderState=null;
let IC={}; // input cache
let view='home'; // home | torneo-setup | torneo
let localCat=null; // id categoria attiva (null = prima disponibile)
let currentTorneoId=null;
let socEditState=null;

// Struttura dati principale
// tornei[id].categorie = [{id, nome, colore, emoji, fasi:[]}]
let DB={tornei:{}};

// ============================================================
// CATEGORIE DEFAULT (usate alla creazione di un nuovo torneo)
// ============================================================
const CAT_DEFAULT=[
  {id:'white', nome:'White',  colore:'#1e40af', emoji:'⬜'},
  {id:'green', nome:'Green',  colore:'#166534', emoji:'🟩'},
  {id:'red',   nome:'Red',    colore:'#991b1b', emoji:'🟥'},
];

// Colori predefiniti disponibili per categorie custom
const COLORI_DISPONIBILI=[
  {hex:'#7c3aed',label:'Viola'},
  {hex:'#b45309',label:'Arancio'},
  {hex:'#0e7490',label:'Ciano'},
  {hex:'#be185d',label:'Rosa'},
  {hex:'#065f46',label:'Smeraldo'},
  {hex:'#1d4ed8',label:'Blu'},
  {hex:'#dc2626',label:'Rosso'},
  {hex:'#ca8a04',label:'Giallo'},
  {hex:'#475569',label:'Grigio'},
  {hex:'#9a3412',label:'Mattone'},
];

const EMOJI_DISPONIBILI=['🟣','🟠','🔵','🟡','⚫','🟤','🔴','⚪','🩵','🩶','💜','🧡'];
