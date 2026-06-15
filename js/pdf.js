/* Export PDF girone — usa categorie dinamiche */
'use strict';

function exportPDF(catId,fid,gv){
  const t=currentTorneo();const fase=getFase(catId,fid),g=getGirone(catId,fid,gv);if(!g||!fase)return;
  if(!window.jspdf){alert('Libreria PDF non caricata.');return;}
  const{jsPDF}=window.jspdf;const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const W=210,M=15;

  // Colori dalla categoria dinamica
  const cat=getCat(catId);
  const colHex=cat?.colore||'#166534';
  // Converti hex in RGB
  function hexRgb(hex){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return[r,g,b];}
  function lighten(rgb,a=0.15){return rgb.map(v=>Math.round(v+(255-v)*a));}
  const CR=hexRgb(colHex);
  const CL=lighten(CR,0.85);
  const catName=cat?.nome||catId;

  const cl=calcCl(g);const sets=g.sets||2;
  const andataP=g.partite.filter(p=>!p.leg||p.leg===1);
  const ritornoP=g.partite.filter(p=>p.leg===2);
  let y=M;

  // Header
  doc.setFillColor(...CR);doc.rect(0,0,W,30,'F');
  doc.setTextColor(255,255,255);doc.setFontSize(17);doc.setFont('helvetica','bold');
  doc.text(`Torneo ${t.nome} — ${catName}`,M,12);
  doc.setFontSize(10);doc.setFont('helvetica','normal');
  doc.text(`${fase.label}  ·  Girone ${g.label}  ·  ${g.squadre.length} squadre  ·  ${g.ritorno?'A/R':'Solo andata'}  ·  ${sets} set`,M,21);
  doc.text(new Date().toLocaleDateString('it-IT'),M,27);y=36;

  function secTitle(tt){doc.setFillColor(...CL);doc.rect(M,y,W-M*2,7,'F');doc.setTextColor(...CR);doc.setFontSize(9);doc.setFont('helvetica','bold');doc.text(tt.toUpperCase(),M+3,y+5);doc.setTextColor(30,30,30);y+=10;}
  function tHead(cols){doc.setFillColor(245,245,245);doc.rect(M,y,W-M*2,6,'F');doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(100,100,100);let x=M+2;cols.forEach(c=>{doc.text(c.t,c.r?x+c.w-2:x,y+4.5,{align:c.r?'right':'left'});x+=c.w});doc.setTextColor(30,30,30);y+=6;}
  function chk(n=12){if(y+n>285){doc.addPage();y=M;}}

  // Squadre
  secTitle('Squadre');tHead([{t:'#',w:10},{t:'Squadra',w:70},{t:'Società',w:W-M*2-80}]);
  g.squadre.forEach((s,i)=>{chk();if(i%2===0){doc.setFillColor(250,250,250);doc.rect(M,y,W-M*2,6,'F');}doc.setFontSize(9);doc.setFont('helvetica','normal');doc.text(String(i+1),M+2,y+4.5);doc.setFont('helvetica','bold');doc.text(s.nome,M+12,y+4.5);doc.setFont('helvetica','normal');doc.text(s.soc||'—',M+82,y+4.5);y+=6;});y+=5;

  // Classifica
  chk(20);secTitle('Classifica');
  tHead(sets===2
    ?[{t:'#',w:10},{t:'Squadra',w:55},{t:'Soc',w:35},{t:'Pt',w:12,r:true},{t:'Sv',w:11,r:true},{t:'Sp',w:11,r:true},{t:'DS',w:12,r:true},{t:'DP',w:12,r:true}]
    :[{t:'#',w:10},{t:'Squadra',w:60},{t:'Soc',w:35},{t:'Pt',w:14,r:true},{t:'DP',w:14,r:true}]);
  cl.forEach((tt,i)=>{chk();const rh=7;
    if(i===0){doc.setFillColor(240,252,240);doc.rect(M,y,W-M*2,rh,'F');}
    else if(i%2===0){doc.setFillColor(250,250,250);doc.rect(M,y,W-M*2,rh,'F');}
    doc.setFontSize(9);const rc=i===0?[180,130,8]:i===1?[113,113,122]:i===2?[146,64,14]:[60,60,60];
    doc.setTextColor(...rc);doc.setFont('helvetica','bold');doc.text(String(i+1),M+2,y+5);
    doc.setTextColor(30,30,30);doc.setFont('helvetica','bold');doc.text(tt.nome,M+12,y+5);
    doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(100,100,100);doc.text(tt.soc||'—',M+67,y+5);
    doc.setFontSize(9);doc.setTextColor(...CR);doc.setFont('helvetica','bold');
    const off=sets===2?102:105;doc.text(String(tt.pt),M+off,y+5,{align:'right'});
    if(sets===2){doc.setTextColor(60,60,60);doc.setFont('helvetica','normal');doc.text(String(tt.sv),M+113,y+5,{align:'right'});doc.text(String(tt.sp),M+124,y+5,{align:'right'});const dc=tt.ds>0?[22,101,52]:tt.ds<0?[153,27,27]:[80,80,80];doc.setTextColor(...dc);doc.setFont('helvetica','bold');doc.text((tt.ds>0?'+':'')+tt.ds,M+136,y+5,{align:'right'});}
    const dpc=tt.dp>0?[22,101,52]:tt.dp<0?[153,27,27]:[80,80,80];doc.setTextColor(...dpc);doc.setFont('helvetica','bold');doc.text((tt.dp>0?'+':'')+tt.dp,M+(sets===2?148:119),y+5,{align:'right'});
    doc.setTextColor(30,30,30);y+=rh;});y+=5;

  // Partite
  function partiteSection(title,pList){
    chk(16);secTitle(title);
    tHead(sets===2
      ?[{t:'Casa',w:58},{t:'Ospite',w:58},{t:'Set 1',w:22,r:true},{t:'Set 2',w:22,r:true}]
      :[{t:'Casa',w:70},{t:'Ospite',w:70},{t:'Set',w:24,r:true}]);
    pList.forEach((p,i)=>{chk();const hn=g.squadre[p.h].nome,an=g.squadre[p.a].nome;const played=p.s1h!==''&&p.s1a!=='';
      if(i%2===0){doc.setFillColor(250,250,250);doc.rect(M,y,W-M*2,7,'F');}
      doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(30,30,30);doc.text(hn,M+2,y+5);
      doc.setFont('helvetica','normal');doc.text(an,sets===2?M+60:M+72,y+5);
      if(played){doc.setTextColor(...CR);doc.setFont('helvetica','bold');
        if(sets===2){doc.text(`${p.s1h}–${p.s1a}`,M+138,y+5,{align:'right'});doc.text(p.s2h!==''?`${p.s2h}–${p.s2a}`:'–',M+160,y+5,{align:'right'});}
        else doc.text(`${p.s1h}–${p.s1a}`,M+154,y+5,{align:'right'});}
      else{doc.setTextColor(190,190,190);doc.text('–',M+(sets===2?160:154),y+5,{align:'right'});}
      doc.setTextColor(30,30,30);y+=7;});y+=5;}

  partiteSection('Partite — Andata',andataP);
  if(ritornoP.length)partiteSection('Partite — Ritorno',ritornoP);
  doc.save(`${t.nome}_${catName}_${fase.label.replace(/ /g,'')}_${g.label}.pdf`);
}
