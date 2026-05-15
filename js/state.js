/* Stato globale applicazione */
'use strict';

// ============================================================
// STATO GLOBALE
// ============================================================
let PREFS={white:{sz:4,sets:2},green:{sz:4,sets:2},red:{sz:4,sets:2}};
const collapsed=new Set();
let isDark=false;
let saveTimer=null;
let builderState=null;
let IC={}; // input cache
let view='home'; // home | torneo-setup | torneo
let localCat='white'; // local-only tab state, not synced
let currentTorneoId=null;

// Struttura dati principale
let DB={tornei:{}}; // {tornei: {id: {nome, createdAt, societa:[], cats:{white,green,red}}}}
