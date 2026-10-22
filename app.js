(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var pad=function(n){return String(n).padStart(2,'0')};
var iso=function(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
var parseD=function(s){var p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2])};
var addDays=function(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x};
var addMonths=function(k,n){var p=k.split('-').map(Number);var d=new Date(p[0],p[1]-1+n,1);return d.getFullYear()+'-'+pad(d.getMonth()+1)};
var monthLabel=function(k,short){var p=k.split('-').map(Number);return new Date(p[0],p[1]-1,1).toLocaleDateString('fr-FR',short?{month:'short'}:{month:'long',year:'numeric'})};
var todayIso=function(){return iso(new Date())};

var EXP=[['food','Alimentation et restaurants',1],['trans','Transport',2],['home','Logement',3],['bills','Factures',4],['health','Santé',5],['fun','Loisirs',6],['shop','Shopping',7],['oth','Autres dépenses',8]];
var INC=[['sal','Salaire',1],['free','Activité indépendante',2],['oinc','Autres revenus',3]];
var LEGACY={rest:'food',edu:'oth'};
var CATS={};EXP.concat(INC).forEach(function(c){CATS[c[0]]={name:c[1],color:'var(--c'+c[2]+')',dark:c[2]>=3&&c[2]<=5}});
var PEN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>',BIN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>';
var SUGG={exp:['Essence','Réparation voiture','STEG','Internet','SONEDE','Téléphone','Assurance','Scolarité'],inc:['Prime','Vente','Remboursement','Loyers perçus']};
function customCat(id){var l=(state&&state.cats)||[],i;for(i=0;i<l.length;i++)if(l[i].id===id)return {name:l[i].name,color:'var(--c'+l[i].c+')',dark:l[i].c>=3&&l[i].c<=5};return null}
function catOf(id){return CATS[LEGACY[id]||id]||customCat(id)||{name:'Autre',color:'var(--axis)',dark:false}}
function catList(kind){
  var b=(kind==='inc'?INC:EXP).map(function(c){return [c[0],c[1]]});
  ((state&&state.cats)||[]).forEach(function(c){if(c.kind===kind)b.push([c.id,c.name])});
  var last=function(x){return x[0]==='oth'||x[0]==='oinc'};
  var o=b.filter(last).sort(function(x,y){return abc(x[1],y[1])});
  return b.filter(function(x){return !last(x)}).sort(function(x,y){return abc(x[1],y[1])}).concat(o);
}
var TYPES={courant:'Compte courant',epargne:'Épargne',carte:'Carte prépayée',especes:'Espèces'};
var BANKS=['BIAT','STB','BNA','Attijari Bank','Amen Bank','ATB','UIB','BH Bank','Banque Zitouna','Banque de Tunisie','Poste Tunisienne','Wifak Bank','Al Baraka Bank'];
var APP_VERSION='1.1';
var abc=function(a,b){return String(a).localeCompare(String(b),'fr',{sensitivity:'base'})};
var ACOL=['#2B4ACB','#0E8A6B','#B5532A','#7B4CC2','#B0802A','#C23B6B'];

var nfs={};
function money(v,cur,sign){
  cur=cur||'TND';var d=cur==='TND'?3:2;
  nfs[d]=nfs[d]||new Intl.NumberFormat('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d});
  var unit=cur==='TND'?'DT':cur==='EUR'?'€':cur==='USD'?'$':cur;
  return (v<0?'−':(sign&&v>0?'+':''))+nfs[d].format(Math.abs(v)/1000)+' '+unit;
}
function parseAmount(s){
  s=String(s||'').replace(/[\s  ]/g,'').replace(',','.');
  if(!/^\d*\.?\d+$/.test(s)&&!/^\d+\.?$/.test(s))return NaN;
  return Math.round(parseFloat(s)*1000);
}
function amtInput(v){return v?String(v/1000).replace('.',','):''}
var uid=function(){return 'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)};
function initials(s){var w=String(s||'?').trim().split(/\s+/);return (w[0][0]+(w[1]?w[1][0]:(w[0][1]||''))).toUpperCase()}

/* ---------- demo data (marked as examples in the UI) ---------- */
function demo(){
  var today=new Date();today.setHours(0,0,0,0);
  var seed=11;var rnd=function(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  var tx=[],n=0;
  function put(type,amt,acc,cat,d,note,to){
    if(d>today)return;
    var t={id:'e'+(++n),type:type,amt:Math.round(amt*1000),acc:acc,cat:cat,date:iso(d),note:note};
    if(to)t.to=to;tx.push(t);
  }
  var r1=function(x){return Math.round(x*10)/10};
  for(var m=0;m<5;m++){
    var b=new Date(today.getFullYear(),today.getMonth()-m,1);
    var at=function(day){return new Date(b.getFullYear(),b.getMonth(),day)};
    put('inc',2850,'a1','sal',at(5),'Salaire');
    put('exp',750,'a1','home',at(3),'Loyer');
    put('exp',r1(86+rnd()*30),'a1','bills',at(9),'STEG électricité');
    put('exp',r1(26+rnd()*14),'a1','bills',at(11),'SONEDE eau');
    put('exp',39.9,'a1','bills',at(14),'Ooredoo internet');
    put('tr',300,'a1',null,at(6),'Épargne mensuelle','a2');
    put('exp',9.99,'a4','fun',at(20),'Abonnement musique');
    if(m%2===1)put('inc',180,'a4','free',at(18),'Mission freelance');
  }
  var spots=[['food','Carrefour Lac 2',28,95,'a1'],['food','Monoprix',12,40,'a3'],['food','Café du coin',3.5,9,'a3'],['food','Déjeuner',14,32,'a1'],['trans','Taxi Bolt',4,14,'a3'],['trans','Carburant',40,70,'a1'],['health','Pharmacie',8,45,'a3'],['fun','Cinéma',12,24,'a1'],['shop','Vêtements',45,160,'a1'],['oth','Livres',20,60,'a1']];
  var weights=[5,3,6,3,4,2,2,1,1,1];var wsum=weights.reduce(function(a,b){return a+b},0);
  for(var i=0;i<150;i++){
    var d=addDays(today,-i);
    if(rnd()<0.62){
      var x=rnd()*wsum,k=0;while(x>weights[k]){x-=weights[k];k++}
      var s=spots[k];put('exp',r1(s[2]+rnd()*(s[3]-s[2])),s[4],s[0],d,s[1]);
    }
  }
  return {v:1,demo:true,budget:1800000,cats:[],
    accounts:[
      {id:'a1',name:'Compte courant',bank:'BIAT',type:'courant',cur:'TND',open:2450000,color:ACOL[0]},
      {id:'a2',name:'Livret épargne',bank:'Amen Bank',type:'epargne',cur:'TND',open:8200000,color:ACOL[1]},
      {id:'a3',name:'Espèces',bank:'Portefeuille',type:'especes',cur:'TND',open:180500,color:ACOL[2]},
      {id:'a4',name:'Carte voyage',bank:'Attijari Bank',type:'carte',cur:'EUR',open:640000,color:ACOL[3]}
    ],tx:tx};
}
function normalize(d){
  d=d||{};return {v:1,demo:!!d.demo,budget:typeof d.budget==='number'?d.budget:null,
    cats:Array.isArray(d.cats)?d.cats.filter(function(c){return c&&c.id&&c.name&&(c.kind==='exp'||c.kind==='inc')}).map(function(c){return {id:String(c.id),name:String(c.name).slice(0,30),kind:c.kind,c:Math.max(1,Math.min(8,parseInt(c.c,10)||1))}}):[],
    accounts:Array.isArray(d.accounts)?d.accounts:[],
    tx:(Array.isArray(d.tx)?d.tx:[]).map(function(x){if(x.cat&&LEGACY[x.cat])x.cat=LEGACY[x.cat];return x})};
}

/* ---------- storage: private db document when available, else this browser ---------- */
var LS='carnet-comptes-v1';
var state=null,mode='local',ref=null,saving=false,dirty=false;
function loadLocal(){try{var r=localStorage.getItem(LS);if(r)return normalize(JSON.parse(r))}catch(e){}return null}
function saveLocal(){try{localStorage.setItem(LS,JSON.stringify(state))}catch(e){}}
function syncBadge(){
  var el=$('#sync');el.className='sync'+(mode==='db'?'':' local');
  el.lastChild.textContent=mode==='db'?'Enregistré sur votre compte':'Ce navigateur';
}
async function flush(){
  if(saving){dirty=true;return}
  saving=true;
  try{do{dirty=false;await ref.set(JSON.parse(JSON.stringify(state)))}while(dirty)}
  catch(e){mode='local';syncBadge();toast('Sauvegarde sur le compte impossible. Données gardées dans ce navigateur.')}
  saving=false;
}
function commit(){saveLocal();if(mode==='db')flush();render()}
async function initStorage(){
  try{
    if(!window.claude||!window.claude.use)return;
    var res=await Promise.all([window.claude.use('db'),window.claude.use('user')]);
    var db=res[0],user=res[1];if(!db||!user)return;
    var id=await user.id();if(!id)return;
    ref=db.doc('data/users/'+id+'/ledger');mode='db';syncBadge();
    ref.onSnapshot(function(snap){
      if(snap.exists){state=normalize(JSON.parse(JSON.stringify(snap.data())));saveLocal();render()}
    },function(){mode='local';syncBadge()});
  }catch(e){mode='local';syncBadge()}
}

/* ---------- calculations ---------- */
var ui={tab:'home',month:todayIso().slice(0,7),acc:'all',q:'',kind:'exp',cur:null,rc:{period:'m3',from:'',to:'',accs:[],cats:[],type:'all',cur:null}};
function accById(id){return state.accounts.find(function(a){return a.id===id})}
function balances(){
  var b={},t=todayIso();state.accounts.forEach(function(a){b[a.id]=a.open||0});
  state.tx.forEach(function(x){
    if(x.date>t)return;
    if(x.type==='inc'){if(b[x.acc]!=null)b[x.acc]+=x.amt}
    else if(x.type==='exp'){if(b[x.acc]!=null)b[x.acc]-=x.amt}
    else{if(b[x.acc]!=null)b[x.acc]-=x.amt;if(b[x.to]!=null)b[x.to]+=x.amt}
  });
  return b;
}
function baseCur(){return ui.cur||(state.accounts[0]&&state.accounts[0].cur)||'TND'}
function currencies(){var s=[];state.accounts.forEach(function(a){if(s.indexOf(a.cur)<0)s.push(a.cur)});return s}
function totals(key,cur){
  var inc=0,exp=0;
  state.tx.forEach(function(x){
    if(x.date.slice(0,7)!==key)return;var a=accById(x.acc);if(!a||a.cur!==cur)return;
    if(x.type==='inc')inc+=x.amt;else if(x.type==='exp')exp+=x.amt;
  });
  return {inc:inc,exp:exp};
}
function sorted(list){return list.slice().sort(function(a,b){return a.date<b.date?1:a.date>b.date?-1:(a.id<b.id?1:-1)})}
function dayLabel(s){
  var t=todayIso(),y=iso(addDays(new Date(),-1));
  if(s===t)return 'Aujourd’hui';if(s===y)return 'Hier';
  return parseD(s).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
}
function signedFor(x,accFilter){
  if(x.type==='inc')return x.amt;if(x.type==='exp')return -x.amt;
  if(accFilter&&accFilter===x.to)return x.amt;return -x.amt;
}

/* ---------- views ---------- */
function opRow(x,accFilter){
  var a=accById(x.acc);if(!a)return '';
  var cur=a.cur,col,title,sub,v;
  if(x.type==='tr'){
    var to=accById(x.to);col='var(--muted)';title=x.note||'Virement';
    sub='Virement · '+esc(a.name)+' → '+esc(to?to.name:'?');
    v=signedFor(x,accFilter);
    return '<button class="row" data-act="tx" data-id="'+esc(x.id)+'"><span class="mono-chip" style="background:var(--muted)">⇄</span><span style="min-width:0"><div class="t">'+esc(title)+'</div><div class="s">'+sub+'</div></span><span class="amt">'+money(accFilter?v:x.amt,cur)+'</span></button>';
  }
  var c=catOf(x.cat);
  title=x.note||c.name;
  return '<button class="row" data-act="tx" data-id="'+esc(x.id)+'"><span class="mono-chip" style="background:'+c.color+(c.dark?';color:#0b0b0b':'')+'">'+esc(initials(c.name))+'</span><span style="min-width:0"><div class="t">'+esc(title)+'</div><div class="s">'+esc(c.name)+' · '+esc(a.name)+'</div></span><span class="amt'+(x.type==='inc'?' pos':'')+'">'+money(x.type==='inc'?x.amt:-x.amt,cur,x.type==='inc')+'</span></button>';
}
function viewHome(){
  var h='';
  if(state.demo)h+='<div class="banner"><p><b>Données d’exemple.</b> Effacez-les pour saisir vos propres comptes.</p><button class="btn primary" data-act="clear-demo">Commencer à zéro</button></div>';
  if(!state.accounts.length){
    return h+'<div class="empty panel"><h3>Aucun compte pour le moment</h3><p>Ajoutez un compte bancaire, une carte ou votre caisse pour suivre vos soldes et vos dépenses.</p><button class="btn primary" data-act="new-acc">Ajouter un compte</button></div>';
  }
  var bal=balances(),per={};
  state.accounts.forEach(function(a){per[a.cur]=(per[a.cur]||0)+bal[a.id]});
  var curs=Object.keys(per);
  h+='<section class="hero"><p class="eyebrow">Solde total</p><p class="big'+(per[curs[0]]<0?' neg':'')+'">'+money(per[curs[0]],curs[0])+'</p>';
  curs.slice(1).forEach(function(c){h+='<p class="more">'+money(per[c],c)+'</p>'});
  h+='</section>';
  var bc=homeCur(),tm=totals(todayIso().slice(0,7),bc),net=tm.inc-tm.exp;
  h+='<p class="eyebrow" style="margin-bottom:8px">'+esc(monthLabel(todayIso().slice(0,7)))+'</p><div class="duo"><div class="panel"><p class="eyebrow">Revenus</p><p class="v pos">'+money(tm.inc,bc)+'</p></div><div class="panel"><p class="eyebrow">Dépenses</p><p class="v">'+money(tm.exp,bc)+'</p></div></div>';
  if(state.budget){
    var pct=Math.min(100,Math.round(tm.exp/state.budget*100)),cls=tm.exp>state.budget?' over':(tm.exp>state.budget*.85?' warn':'');
    h+='<div class="panel pad" style="margin-top:12px"><div class="meta"><span>Budget du mois</span><b>'+money(state.budget,bc)+'</b></div><div class="meter'+cls+'" role="progressbar" aria-valuenow="'+pct+'" aria-valuemin="0" aria-valuemax="100"><span style="width:'+pct+'%"></span></div><div class="meta"><span>'+(tm.exp>state.budget?'Dépassé de':'Il reste')+'</span><b>'+money(Math.abs(state.budget-tm.exp),bc)+'</b></div></div>';
  }
  h+='<div class="section-h"><h2>Mes comptes</h2><button class="link" data-act="new-acc">Ajouter</button></div><div class="panel">';
  state.accounts.forEach(function(a){
    h+='<div class="acc-wrap"><button class="row" data-act="acc-ops" data-id="'+esc(a.id)+'"><span class="mono-chip" style="background:'+esc(a.color||ACOL[0])+'">'+esc(initials(a.bank||a.name))+'</span><span style="min-width:0"><div class="t">'+esc(a.name)+'</div><div class="s">'+esc(a.bank||'')+' · '+esc(TYPES[a.type]||'')+'</div></span><span class="amt'+(bal[a.id]<0?' neg':'')+'" style="'+(bal[a.id]<0?'color:var(--exp)':'')+'">'+money(bal[a.id],a.cur)+'</span></button><button class="ibtn" data-act="edit-acc" data-id="'+esc(a.id)+'" aria-label="Modifier '+esc(a.name)+'" title="Modifier">'+PEN+'</button><button class="ibtn" data-act="del-acc" data-id="'+esc(a.id)+'" aria-label="Supprimer '+esc(a.name)+'" title="Supprimer">'+BIN+'</button></div>';
  });
  h+='</div>';
  var rec=sorted(state.tx).slice(0,5);
  h+='<div class="section-h"><h2>Dernières opérations</h2><button class="link" data-act="tab" data-tab="ops">Tout voir</button></div>';
  h+=rec.length?'<div class="panel">'+rec.map(function(x){return opRow(x)}).join('')+'</div>':'<div class="empty panel"><p style="margin:0 auto">Aucune opération. Touchez + pour en ajouter une.</p></div>';
  return h;
}
function filteredOps(){
  var q=ui.q.trim().toLowerCase();
  return sorted(state.tx).filter(function(x){
    if(x.date.slice(0,7)!==ui.month)return false;
    if(ui.acc!=='all'&&x.acc!==ui.acc&&x.to!==ui.acc)return false;
    if(q){var c=catOf(x.cat);var hay=((x.note||'')+' '+(c?c.name:'')).toLowerCase();if(hay.indexOf(q)<0)return false}
    return true;
  });
}
function opsList(){
  var list=filteredOps();
  if(!list.length)return '<div class="empty"><h3>Rien ce mois-ci</h3><p>Aucune opération ne correspond à ces filtres.</p></div>';
  var h='',cur='',buf=[];
  function close(){if(!buf.length)return;
    var sum=buf.reduce(function(s,x){var a=accById(x.acc);if(!a)return s;if(ui.acc==='all'&&x.type==='tr')return s;return s+signedFor(x,ui.acc!=='all'?ui.acc:null)},0);
    var curCode=(ui.acc!=='all'?accById(ui.acc):accById(buf[0].acc)).cur;
    var multi=ui.acc==='all'&&currencies().length>1;
    h+='<div class="day-h"><span>'+esc(dayLabel(cur))+'</span><span>'+(multi?'':money(sum,curCode,true))+'</span></div><div class="panel">'+buf.map(function(x){return opRow(x,ui.acc!=='all'?ui.acc:null)}).join('')+'</div>';buf=[]}
  list.forEach(function(x){if(x.date!==cur){close();cur=x.date}buf.push(x)});close();
  return h;
}
function monthNav(){
  var isNow=ui.month>=todayIso().slice(0,7);
  return '<div class="nav-month"><button class="step" data-act="month" data-d="-1" aria-label="Mois précédent"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg></button><strong>'+esc(monthLabel(ui.month))+'</strong><button class="step" data-act="month" data-d="1" aria-label="Mois suivant"'+(isNow?' disabled style="opacity:.4"':'')+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 5l7 7-7 7"/></svg></button></div>';
}
function viewOps(){
  if(!state.accounts.length)return '<div class="empty panel"><h3>Ajoutez d’abord un compte</h3><p>Les opérations sont rattachées à un compte.</p><button class="btn primary" data-act="new-acc">Ajouter un compte</button></div>';
  var h=monthNav()+'<div class="chips"><button class="chip" data-act="acc-filter" data-id="all" aria-pressed="'+(ui.acc==='all')+'">Tous</button>';
  state.accounts.forEach(function(a){h+='<button class="chip" data-act="acc-filter" data-id="'+esc(a.id)+'" aria-pressed="'+(ui.acc===a.id)+'">'+esc(a.name)+'</button>'});
  h+='</div><input class="search" id="q" type="search" placeholder="Rechercher une note ou une catégorie" value="'+esc(ui.q)+'" aria-label="Rechercher"><div id="oplist">'+opsList()+'</div>';
  return h;
}
/* ---------- statistics ---------- */
function homeCur(){return state.accounts[0]?state.accounts[0].cur:'TND'}
function sctx(){
  var curs=currencies(),cur=baseCur();if(curs.indexOf(cur)<0)cur=ui.cur=curs[0];
  return {cur:cur,key:ui.month,kind:ui.kind,col:ui.kind==='exp'?'var(--c2)':'var(--c1)'};
}
function niceMax(v){if(!(v>0))return 100;var p=Math.pow(10,Math.floor(Math.log(v)/Math.LN10)),n=v/p;return (n<=1?1:n<=2?2:n<=5?5:10)*p}
function compact(x){
  var a=Math.abs(x),s;
  if(a>=1000)s=(Math.round(a/100)/10).toString().replace('.',',')+' k';
  else if(a>=10)s=String(Math.round(a));
  else s=(Math.round(a*10)/10).toString().replace('.',',');
  return (x<0?'−':'')+s;
}
function dimOf(key){var p=key.split('-').map(Number);return new Date(p[0],p[1],0).getDate()}
function dayVals(key,cur,type){
  var a=[],n=dimOf(key),i;for(i=0;i<n;i++)a.push(0);
  state.tx.forEach(function(x){
    if(x.type!==type||x.date.slice(0,7)!==key)return;
    var ac=accById(x.acc);if(!ac||ac.cur!==cur)return;
    a[Number(x.date.slice(8,10))-1]+=x.amt;
  });
  return a;
}
function dShort(key,d){var p=key.split('-').map(Number);return new Date(p[0],p[1]-1,d).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}
function catTotals(c){
  var by={},tot=0;
  state.tx.forEach(function(x){
    if(x.type!==c.kind||x.date.slice(0,7)!==c.key)return;
    var a=accById(x.acc);if(!a||a.cur!==c.cur)return;
    var k=LEGACY[x.cat]||x.cat;by[k]=(by[k]||0)+x.amt;tot+=x.amt;
  });
  return {by:by,tot:tot,keys:Object.keys(by).sort(function(a,b){return by[b]-by[a]})};
}
function tipRows(head,rows){
  return '<div class="th">'+esc(head)+'</div>'+rows.map(function(r){
    return '<div class="tr"><span>'+(r.col?'<i style="border-color:'+r.col+'"></i>':'')+esc(r.l)+'</span><b>'+esc(r.v)+'</b></div>';
  }).join('');
}
function showTip(html,ev){
  var t=$('#tip');t.innerHTML=html;t.hidden=false;
  var r=t.getBoundingClientRect(),x=ev.clientX+14,y=ev.clientY-r.height-12;
  if(x+r.width>window.innerWidth-8)x=ev.clientX-r.width-14;
  if(x<8)x=8;if(y<8)y=ev.clientY+18;
  t.style.left=x+'px';t.style.top=y+'px';
}
function hideTip(){var t=$('#tip');if(t)t.hidden=true}
function yGrid(ticks,yf,ml,w,mr){
  return ticks.map(function(t,i){var y=yf(t).toFixed(1);
    return '<line class="'+(i===0?'base':'grid')+'" x1="'+ml+'" x2="'+(w-mr)+'" y1="'+y+'" y2="'+y+'"/><text x="'+(ml-6)+'" y="'+(Number(y)+4)+'" text-anchor="end">'+compact(t)+'</text>';
  }).join('');
}
function barPath(x,y,w,h,r){
  x=+x;y=+y;w=+w;h=+h;r=Math.max(0,Math.min(4,w/2,h));
  return 'M'+x+' '+(y+h)+'L'+x+' '+(y+r)+'Q'+x+' '+y+' '+(x+r)+' '+y+'L'+(x+w-r)+' '+y+'Q'+(x+w)+' '+y+' '+(x+w)+' '+(y+r)+'L'+(x+w)+' '+(y+h)+'Z';
}
function svgX(svg,ev,w){var r=svg.getBoundingClientRect();return (ev.clientX-r.left)*(w/(r.width||w))}
function bindHide(el){el.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')hideTip()})}
function xLabelEvery(i){return i===0||(i+1)%5===0}

var CH={};
CH.donut=function(h,w){var c=sctx();drawDonut(h,w,c,catTotals(c))};
function drawDonut(h,w,c,T){
  var size=Math.min(w,250),cx=w/2,cy=size/2,sw=28,rc=size/2-sw/2-4;
  var s='<svg viewBox="0 0 '+w+' '+size+'" role="img" aria-label="Répartition par catégorie">';
  if(!T.tot){
    h.innerHTML=s+'<circle cx="'+cx+'" cy="'+cy+'" r="'+rc+'" fill="none" style="stroke:var(--track)" stroke-width="'+sw+'"/><text x="'+cx+'" y="'+(cy+4)+'" text-anchor="middle">Aucune opération ce mois-ci</text></svg>';return;
  }
  var a=-Math.PI/2,gap=2/rc;
  T.keys.forEach(function(k){
    var f=T.by[k]/T.tot,a0=a,a1=a+f*2*Math.PI,col=catOf(k).color;a=a1;
    if(T.keys.length===1){s+='<circle class="dseg mk" data-k="'+k+'" cx="'+cx+'" cy="'+cy+'" r="'+rc+'" fill="none" style="stroke:'+col+'" stroke-width="'+sw+'"/>';return}
    var s0=a0+gap/2,s1=a1-gap/2;if(s1-s0<0.004)return;
    var x0=cx+rc*Math.cos(s0),y0=cy+rc*Math.sin(s0),x1=cx+rc*Math.cos(s1),y1=cy+rc*Math.sin(s1);
    s+='<path class="dseg mk" data-k="'+k+'" d="M'+x0.toFixed(2)+' '+y0.toFixed(2)+' A'+rc+' '+rc+' 0 '+(s1-s0>Math.PI?1:0)+' 1 '+x1.toFixed(2)+' '+y1.toFixed(2)+'" fill="none" style="stroke:'+col+'" stroke-width="'+sw+'"/>';
  });
  s+='<text x="'+cx+'" y="'+(cy-8)+'" text-anchor="middle">'+(c.kind==='exp'?'Dépenses':'Revenus')+'</text><text class="donut-c" x="'+cx+'" y="'+(cy+14)+'" text-anchor="middle">'+esc(money(T.tot,c.cur))+'</text></svg>';
  h.innerHTML=s;
  var svg=h.firstChild,segs=svg.querySelectorAll('.dseg');
  function over(e){
    var k=e.target.dataset&&e.target.dataset.k;if(!k)return;
    segs.forEach(function(g){g.setAttribute('stroke-width',g===e.target?sw+6:sw)});
    showTip(tipRows(catOf(k).name,[{l:Math.round(T.by[k]/T.tot*100)+' % du total',col:catOf(k).color,v:money(T.by[k],c.cur)}]),e);
  }
  svg.addEventListener('pointermove',over);svg.addEventListener('pointerdown',over);
  svg.addEventListener('pointerleave',function(e){segs.forEach(function(g){g.setAttribute('stroke-width',sw)});if(e.pointerType==='mouse')hideTip()});
}
CH.daily=function(h,w){
  var c=sctx(),vals=dayVals(c.key,c.cur,c.kind),n=vals.length,H=176,ml=36,mr=4,mt=18,mb=22,pw=w-ml-mr,ph=H-mt-mb;
  var mxu=niceMax(Math.max.apply(null,vals.map(function(v){return v/1000})));
  var yf=function(t){return mt+ph-t/mxu*ph},slot=pw/n,bw=Math.min(24,Math.max(2,slot-2)),mi=-1,mv=0;
  var s='<svg viewBox="0 0 '+w+' '+H+'" role="img" aria-label="Montant par jour du mois">'+yGrid([0,mxu/2,mxu],yf,ml,w,mr);
  vals.forEach(function(v,i){
    if(v>mv){mv=v;mi=i}
    var x=ml+i*slot+(slot-bw)/2,hh=v/1000/mxu*ph;
    if(v>0)s+='<path class="mk" id="db'+i+'" d="'+barPath(x.toFixed(1),(mt+ph-hh).toFixed(1),bw.toFixed(1),hh.toFixed(1))+'" style="fill:'+c.col+'"/>';
    if(xLabelEvery(i))s+='<text x="'+(ml+i*slot+slot/2).toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle">'+(i+1)+'</text>';
  });
  if(mi>=0){var lx=Math.min(w-22,Math.max(ml+16,ml+mi*slot+slot/2));s+='<text class="val" x="'+lx.toFixed(1)+'" y="'+(mt+ph-mv/1000/mxu*ph-6).toFixed(1)+'" text-anchor="middle">'+compact(mv/1000)+'</text>'}
  vals.forEach(function(v,i){s+='<rect class="hit" data-i="'+i+'" x="'+(ml+i*slot).toFixed(1)+'" y="'+mt+'" width="'+slot.toFixed(1)+'" height="'+ph+'"/>'});
  h.innerHTML=s+'</svg>';
  var svg=h.firstChild,last=null;
  function over(e){
    var i=e.target.dataset&&e.target.dataset.i;if(i==null)return;i=Number(i);
    if(last!=null){var p=svg.querySelector('#db'+last);if(p)p.style.opacity=''}
    var b=svg.querySelector('#db'+i);if(b)b.style.opacity='.75';last=i;
    showTip(tipRows(dShort(c.key,i+1),[{l:c.kind==='exp'?'Dépenses':'Revenus',col:c.col,v:money(vals[i],c.cur)}]),e);
  }
  svg.addEventListener('pointermove',over);svg.addEventListener('pointerdown',over);
  svg.addEventListener('pointerleave',function(e){if(last!=null){var p=svg.querySelector('#db'+last);if(p)p.style.opacity=''}last=null;if(e.pointerType==='mouse')hideTip()});
};
CH.cum=function(h,w){
  var c=sctx(),H=190,ml=36,mr=8,mt=18,mb=22,pw=w-ml-mr,ph=H-mt-mb;
  var cv=dayVals(c.key,c.cur,c.kind),pk=addMonths(c.key,-1),pv=dayVals(pk,c.cur,c.kind),N=cv.length,M=Math.max(N,pv.length);
  var nowKey=todayIso().slice(0,7),last=c.key===nowKey?Number(todayIso().slice(8,10)):(c.key>nowKey?0:N);
  function cumul(a,len){var r=[],t=0,i;for(i=0;i<len;i++){t+=a[i]/1000;r.push(t)}return r}
  var cc=cumul(cv,last),pc=cumul(pv,pv.length);
  var budget=(c.kind==='exp'&&state.budget&&c.cur===homeCur())?state.budget/1000:0;
  var mxu=niceMax(Math.max(cc.length?cc[cc.length-1]:0,pc.length?pc[pc.length-1]:0,budget));
  var xf=function(i){return ml+(M>1?i/(M-1)*pw:0)},yf=function(t){return mt+ph-t/mxu*ph};
  function path(a){return a.map(function(v,i){return (i?'L':'M')+xf(i).toFixed(1)+' '+yf(v).toFixed(1)}).join('')}
  var s='<svg viewBox="0 0 '+w+' '+H+'" role="img" aria-label="Cumul du mois comparé au mois précédent">'+yGrid([0,mxu/2,mxu],yf,ml,w,mr);
  if(pc.length)s+='<path d="'+path(pc)+'" fill="none" style="stroke:var(--prev)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
  if(budget)s+='<line x1="'+ml+'" x2="'+(w-mr)+'" y1="'+yf(budget).toFixed(1)+'" y2="'+yf(budget).toFixed(1)+'" style="stroke:var(--ink)" stroke-width="1"/><text x="'+(w-mr)+'" y="'+(yf(budget)-5).toFixed(1)+'" text-anchor="end">Budget '+compact(budget)+'</text>';
  if(cc.length){
    s+='<path d="'+path(cc)+'" fill="none" style="stroke:'+c.col+'" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
    var ex=xf(cc.length-1),ey=yf(cc[cc.length-1]);
    s+='<circle cx="'+ex.toFixed(1)+'" cy="'+ey.toFixed(1)+'" r="4.5" style="fill:'+c.col+';stroke:var(--surface)" stroke-width="2"/><text class="val" x="'+Math.max(ml+20,ex-8).toFixed(1)+'" y="'+Math.max(mt-2,ey-10).toFixed(1)+'" text-anchor="end">'+compact(cc[cc.length-1])+'</text>';
  }
  for(var i=0;i<M;i++)if(xLabelEvery(i))s+='<text x="'+xf(i).toFixed(1)+'" y="'+(H-6)+'" text-anchor="'+(i===0?'start':'middle')+'">'+(i+1)+'</text>';
  s+='<line id="xh" class="grid" style="stroke:var(--axis)" y1="'+mt+'" y2="'+(mt+ph)+'" x1="0" x2="0" visibility="hidden"/><rect class="hit" x="'+ml+'" y="'+mt+'" width="'+pw+'" height="'+ph+'"/></svg>';
  h.innerHTML=s;
  var svg=h.firstChild,xh=svg.querySelector('#xh');
  function move(e){
    var i=Math.max(0,Math.min(M-1,Math.round((svgX(svg,e,w)-ml)/pw*(M-1))));
    xh.setAttribute('x1',xf(i));xh.setAttribute('x2',xf(i));xh.setAttribute('visibility','visible');
    var rows=[{l:'Ce mois',col:c.col,v:i<cc.length?money(Math.round(cc[i]*1000),c.cur):'—'},{l:'Mois précédent',col:'var(--prev)',v:i<pc.length?money(Math.round(pc[i]*1000),c.cur):'—'}];
    showTip(tipRows('Jour '+(i+1),rows),e);
  }
  svg.addEventListener('pointermove',move);svg.addEventListener('pointerdown',move);
  svg.addEventListener('pointerleave',function(e){xh.setAttribute('visibility','hidden');if(e.pointerType==='mouse')hideTip()});
};
CH.bal=function(h,w){
  var c=sctx(),H=190,ml=44,mr=8,mt=18,mb=22,pw=w-ml-mr,ph=H-mt-mb,days=90,i;
  var open=0;state.accounts.forEach(function(a){if(a.cur===c.cur)open+=a.open||0});
  var ds=[],today=new Date();for(i=days-1;i>=0;i--)ds.push(iso(addDays(today,-i)));
  var bal=open,by={},endIso=ds[ds.length-1];
  state.tx.forEach(function(x){
    var a=accById(x.acc);if(!a||a.cur!==c.cur||x.type==='tr')return;
    var d=x.type==='inc'?x.amt:-x.amt;
    if(x.date<ds[0])bal+=d;else if(x.date<=endIso)by[x.date]=(by[x.date]||0)+d;
  });
  var ser=ds.map(function(d){bal+=by[d]||0;return bal/1000});
  var lo=Math.min.apply(null,ser),hi=Math.max.apply(null,ser);
  if(hi-lo<1){var pad1=Math.max(1,Math.abs(hi)*.1);lo-=pad1;hi+=pad1}
  var rough=(hi-lo)/3,mag=Math.pow(10,Math.floor(Math.log(rough)/Math.LN10)),step=[1,2,5,10].filter(function(m){return m*mag>=rough})[0]*mag;
  var tmin=Math.floor(lo/step)*step,tmax=Math.ceil(hi/step)*step,ticks=[],t;
  for(t=tmin;t<=tmax+step/2;t+=step)ticks.push(Math.round(t*1000)/1000);
  var yf=function(v){return mt+ph-(v-tmin)/(tmax-tmin)*ph},xf=function(k){return ml+k/(days-1)*pw};
  var line=ser.map(function(v,k){return (k?'L':'M')+xf(k).toFixed(1)+' '+yf(v).toFixed(1)}).join('');
  var s='<svg viewBox="0 0 '+w+' '+H+'" role="img" aria-label="Évolution du solde sur 90 jours">'+yGrid(ticks,yf,ml,w,mr);
  s+='<path d="'+line+'L'+xf(days-1).toFixed(1)+' '+(mt+ph)+'L'+xf(0).toFixed(1)+' '+(mt+ph)+'Z" style="fill:var(--c1)" fill-opacity=".1"/><path d="'+line+'" fill="none" style="stroke:var(--c1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
  var ex=xf(days-1),ey=yf(ser[days-1]);
  s+='<circle cx="'+ex.toFixed(1)+'" cy="'+ey.toFixed(1)+'" r="4.5" style="fill:var(--c1);stroke:var(--surface)" stroke-width="2"/><text class="val" x="'+(ex-8).toFixed(1)+'" y="'+Math.max(mt-2,ey-10).toFixed(1)+'" text-anchor="end">'+compact(ser[days-1])+'</text>';
  [0,30,60,89].forEach(function(k,j){var d=parseD(ds[k]);s+='<text x="'+xf(k).toFixed(1)+'" y="'+(H-6)+'" text-anchor="'+(j===0?'start':(j===3?'end':'middle'))+'">'+d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})+'</text>'});
  s+='<line id="xh" class="grid" style="stroke:var(--axis)" y1="'+mt+'" y2="'+(mt+ph)+'" x1="0" x2="0" visibility="hidden"/><rect class="hit" x="'+ml+'" y="'+mt+'" width="'+pw+'" height="'+ph+'"/></svg>';
  h.innerHTML=s;
  var svg=h.firstChild,xh=svg.querySelector('#xh');
  function move(e){
    var k=Math.max(0,Math.min(days-1,Math.round((svgX(svg,e,w)-ml)/pw*(days-1))));
    xh.setAttribute('x1',xf(k));xh.setAttribute('x2',xf(k));xh.setAttribute('visibility','visible');
    showTip(tipRows(parseD(ds[k]).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'}),[{l:'Solde',col:'var(--c1)',v:money(Math.round(ser[k]*1000),c.cur)}]),e);
  }
  svg.addEventListener('pointermove',move);svg.addEventListener('pointerdown',move);
  svg.addEventListener('pointerleave',function(e){xh.setAttribute('visibility','hidden');if(e.pointerType==='mouse')hideTip()});
};
CH.six=function(h,w){
  var c=sctx(),H=176,ml=36,mr=4,mt=16,mb=22,pw=w-ml-mr,ph=H-mt-mb,months=[],i;
  for(i=5;i>=0;i--)months.push(addMonths(todayIso().slice(0,7),-i));
  var data=months.map(function(m){return totals(m,c.cur)});
  var mxu=niceMax(Math.max.apply(null,data.map(function(d){return Math.max(d.inc,d.exp)/1000}))),slot=pw/6,bw=Math.min(24,(slot-14)/2);
  var yf=function(t){return mt+ph-t/mxu*ph};
  var s='<svg viewBox="0 0 '+w+' '+H+'" role="img" aria-label="Revenus et dépenses sur six mois">'+yGrid([0,mxu/2,mxu],yf,ml,w,mr);
  months.forEach(function(m,j){
    var d=data[j],x0=ml+j*slot+slot/2-bw-1,hi=d.inc/1000/mxu*ph,he=d.exp/1000/mxu*ph;
    if(d.inc>0)s+='<path d="'+barPath(x0.toFixed(1),(mt+ph-hi).toFixed(1),bw.toFixed(1),hi.toFixed(1))+'" style="fill:var(--c1)"/>';
    if(d.exp>0)s+='<path d="'+barPath((x0+bw+2).toFixed(1),(mt+ph-he).toFixed(1),bw.toFixed(1),he.toFixed(1))+'" style="fill:var(--c2)"/>';
    s+='<text x="'+(ml+j*slot+slot/2).toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle">'+esc(monthLabel(m,true).replace('.',''))+'</text><rect class="hit" data-i="'+j+'" x="'+(ml+j*slot).toFixed(1)+'" y="'+mt+'" width="'+slot.toFixed(1)+'" height="'+ph+'"/>';
  });
  h.innerHTML=s+'</svg>';
  var svg=h.firstChild;
  function over(e){
    var j=e.target.dataset&&e.target.dataset.i;if(j==null)return;var d=data[Number(j)];
    showTip(tipRows(monthLabel(months[Number(j)]),[{l:'Revenus',col:'var(--c1)',v:money(d.inc,c.cur)},{l:'Dépenses',col:'var(--c2)',v:money(d.exp,c.cur)},{l:'Solde',v:money(d.inc-d.exp,c.cur,true)}]),e);
  }
  svg.addEventListener('pointermove',over);svg.addEventListener('pointerdown',over);bindHide(svg);
};
function cssVar(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()}
function hexRgb(s){
  s=s.trim();
  if(s[0]==='#'){if(s.length===4)s='#'+s[1]+s[1]+s[2]+s[2]+s[3]+s[3];var n=parseInt(s.slice(1,7),16);return [n>>16&255,n>>8&255,n&255]}
  var m=s.match(/[\d.]+/g);return m?m.slice(0,3).map(Number):[128,128,128];
}
function lum(c){var a=c.map(function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*a[0]+.7152*a[1]+.0722*a[2]}
CH.cal=function(h,w){
  var c=sctx(),vals=dayVals(c.key,c.cur,c.kind),p=c.key.split('-').map(Number),off=(new Date(p[0],p[1]-1,1).getDay()+6)%7;
  var mx=Math.max.apply(null,vals.concat([1])),base=hexRgb(cssVar(c.kind==='exp'?'--c2':'--c1')),surf=hexRgb(cssVar('--surface')),P=[0,.24,.44,.64,.82,1];
  function mix(f){return base.map(function(v,i){return Math.round(v*f+surf[i]*(1-f))})}
  function bg(b){var m=mix(P[b]);return {css:'rgb('+m.join(',')+')',txt:lum(m)>.34?'#0b0b0b':'#ffffff'}}
  var html='<div class="cal">'+['L','M','M','J','V','S','D'].map(function(d){return '<div class="dow">'+d+'</div>'}).join(''),i,td=todayIso();
  for(i=0;i<off;i++)html+='<div class="d off"></div>';
  vals.forEach(function(v,k){
    var b=v>0?Math.max(1,Math.ceil(v/mx*5)):0,st=b?bg(b):null,ds=c.key+'-'+pad(k+1);
    html+='<button type="button" class="d'+(ds===td?' today':'')+'" data-d="'+k+'" aria-label="'+esc(dShort(c.key,k+1)+' : '+money(v,c.cur))+'"'+(st?' style="background:'+st.css+';color:'+st.txt+'"':'')+'><span>'+(k+1)+'</span>'+(v>0?'<small>'+compact(v/1000)+'</small>':'')+'</button>';
  });
  html+='</div><div class="ramp"><span>Moins</span>'+[1,2,3,4,5].map(function(b){return '<i style="background:'+bg(b).css+'"></i>'}).join('')+'<span>Plus</span></div>';
  h.innerHTML=html;
  function over(e){
    var b=e.target.closest('.d');if(!b||b.classList.contains('off'))return;var k=Number(b.dataset.d);
    showTip(tipRows(dShort(c.key,k+1),[{l:c.kind==='exp'?'Dépenses':'Revenus',col:c.col,v:money(vals[k],c.cur)}]),e);
  }
  h.addEventListener('pointermove',over);h.addEventListener('pointerdown',over);bindHide(h);
};
function drawCharts(){
  if((ui.tab!=='stats'&&ui.tab!=='recap')||!state.accounts.length)return;
  document.querySelectorAll('.host[data-chart]').forEach(function(h){
    var w=Math.floor(h.clientWidth);if(w<80)return;
    var f=CH[h.dataset.chart];if(f)f(h,w);
  });
}
function card(title,sub,chart,extra){
  return '<section class="card" style="margin-top:12px"><h3>'+title+'</h3><p class="sub">'+sub+'</p><div class="host" data-chart="'+chart+'"></div>'+(extra||'')+'</section>';
}
/* ---------- récapitulatif ---------- */
var PERIODS=[['cm','Mois en cours'],['pm','Mois précédent'],['d30','30 derniers jours'],['m3','Trois derniers mois'],['m6','Six derniers mois'],['ytd','Depuis le 1er janvier'],['ly','L’année dernière'],['all','Toutes périodes'],['custom','Personnalisé']];
var WD=['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
function lastDay(key){return key+'-'+pad(dimOf(key))}
function capEnd(c){var t=todayIso();return c.to>t?t:c.to}
function rRange(){
  var r=ui.rc,td=todayIso(),cm=td.slice(0,7),y=Number(td.slice(0,4)),f,t=td;
  switch(r.period){
    case 'cm':f=cm+'-01';break;
    case 'pm':f=addMonths(cm,-1)+'-01';t=lastDay(addMonths(cm,-1));break;
    case 'd30':f=iso(addDays(new Date(),-29));break;
    case 'm3':f=addMonths(cm,-2)+'-01';break;
    case 'm6':f=addMonths(cm,-5)+'-01';break;
    case 'ytd':f=y+'-01-01';break;
    case 'ly':f=(y-1)+'-01-01';t=(y-1)+'-12-31';break;
    case 'all':f=state.tx.reduce(function(m,x){return x.date<m?x.date:m},td);break;
    default:f=r.from||cm+'-01';t=r.to||td;
  }
  if(f>t){var s=f;f=t;t=s}
  return {from:f,to:t};
}
function rctx(){
  var r=ui.rc,curs=currencies(),g=rRange(),first=r.accs.length?accById(r.accs[0]):null;
  var cur=(r.cur&&curs.indexOf(r.cur)>=0)?r.cur:(first?first.cur:(curs[0]||'TND'));
  var accIds=state.accounts.filter(function(a){return a.cur===cur&&(!r.accs.length||r.accs.indexOf(a.id)>=0)}).map(function(a){return a.id});
  return {cur:cur,from:g.from,to:g.to,accIds:accIds,cats:r.cats.slice(),type:r.type,kind:r.type==='inc'?'inc':'exp',col:r.type==='inc'?'var(--c1)':'var(--c2)'};
}
function rItems(c){
  return state.tx.filter(function(x){
    if(x.type==='tr'||x.date<c.from||x.date>c.to||c.accIds.indexOf(x.acc)<0)return false;
    if(c.type!=='all'&&x.type!==c.type)return false;
    if(c.cats.length&&c.cats.indexOf(LEGACY[x.cat]||x.cat)<0)return false;
    return true;
  });
}
function rTotals(items){var i=0,e=0;items.forEach(function(x){if(x.type==='inc')i+=x.amt;else e+=x.amt});return {inc:i,exp:e}}
function rcatTotals(c){
  var by={},tot=0;
  rItems(c).forEach(function(x){if(x.type!==c.kind)return;var k=LEGACY[x.cat]||x.cat;by[k]=(by[k]||0)+x.amt;tot+=x.amt});
  return {by:by,tot:tot,keys:Object.keys(by).sort(function(a,b){return by[b]-by[a]})};
}
function rBalanceSeries(c){
  var endIso=capEnd(c);if(c.from>endIso)return null;
  var idset={},open=0,by={};c.accIds.forEach(function(id){idset[id]=1});
  state.accounts.forEach(function(a){if(idset[a.id])open+=a.open||0});
  state.tx.forEach(function(x){
    var d=0;
    if(x.type==='inc'){if(idset[x.acc])d=x.amt}
    else if(x.type==='exp'){if(idset[x.acc])d=-x.amt}
    else{if(idset[x.acc])d-=x.amt;if(idset[x.to])d+=x.amt}
    if(!d)return;
    if(x.date<c.from)open+=d;else if(x.date<=endIso)by[x.date]=(by[x.date]||0)+d;
  });
  var dates=[],vals=[],cur=parseD(c.from),last=parseD(endIso),bal=open;
  while(cur<=last){var k=iso(cur);bal+=by[k]||0;dates.push(k);vals.push(bal/1000);cur=addDays(cur,1)}
  var n=dates.length,step=Math.max(1,Math.ceil(n/160));
  if(step>1){var d2=[],v2=[],i;for(i=0;i<n;i+=step){d2.push(dates[i]);v2.push(vals[i])}if(d2[d2.length-1]!==dates[n-1]){d2.push(dates[n-1]);v2.push(vals[n-1])}dates=d2;vals=v2}
  return {dates:dates,vals:vals};
}
function rBuckets(c){
  var end=capEnd(c),span=Math.round((parseD(end)-parseD(c.from))/864e5)+1,b=[],d,k,ek;
  if(span<=62){
    d=parseD(c.from);d=addDays(d,-((d.getDay()+6)%7));
    while(iso(d)<=end){b.push({from:iso(d),to:iso(addDays(d,6)),label:d.getDate()+'/'+(d.getMonth()+1),title:'Semaine du '+d.toLocaleDateString('fr-FR',{day:'numeric',month:'long'})});d=addDays(d,7)}
  }else{
    k=c.from.slice(0,7);ek=end.slice(0,7);
    while(k<=ek){b.push({from:k+'-01',to:lastDay(k),label:monthLabel(k,true).replace('.',''),title:monthLabel(k)});k=addMonths(k,1)}
  }
  if(!b.length)b.push({from:c.from,to:c.to,label:'—',title:'Période'});
  return b;
}
CH.rdonut=function(h,w){var c=rctx();drawDonut(h,w,c,rcatTotals(c))};
CH.rbal=function(h,w){
  var c=rctx(),S=rBalanceSeries(c);
  if(!S){h.innerHTML='<p class="sub" style="margin:0">Cette période n’a pas encore commencé.</p>';return}
  var ds=S.dates.slice(),ser=S.vals.slice();if(ds.length<2){ds.push(ds[0]);ser.push(ser[0])}
  var n=ds.length,H=190,ml=44,mr=8,mt=18,mb=22,pw=w-ml-mr,ph=H-mt-mb;
  var lo=Math.min.apply(null,ser),hi=Math.max.apply(null,ser);
  if(hi-lo<1){var p1=Math.max(1,Math.abs(hi)*.1);lo-=p1;hi+=p1}
  var rough=(hi-lo)/3,mag=Math.pow(10,Math.floor(Math.log(rough)/Math.LN10)),step=[1,2,5,10].filter(function(m){return m*mag>=rough})[0]*mag;
  var tmin=Math.floor(lo/step)*step,tmax=Math.ceil(hi/step)*step,ticks=[],t;
  for(t=tmin;t<=tmax+step/2;t+=step)ticks.push(Math.round(t*1000)/1000);
  var yf=function(v){return mt+ph-(v-tmin)/(tmax-tmin)*ph},xf=function(k){return ml+k/(n-1)*pw};
  var line=ser.map(function(v,k){return (k?'L':'M')+xf(k).toFixed(1)+' '+yf(v).toFixed(1)}).join('');
  var longSpan=(parseD(ds[n-1])-parseD(ds[0]))/864e5>300;
  var fmt=function(d){return parseD(d).toLocaleDateString('fr-FR',longSpan?{month:'short',year:'2-digit'}:{day:'numeric',month:'short'})};
  var s='<svg viewBox="0 0 '+w+' '+H+'" role="img" aria-label="Évolution du solde sur la période">'+yGrid(ticks,yf,ml,w,mr);
  s+='<path d="'+line+'L'+xf(n-1).toFixed(1)+' '+(mt+ph)+'L'+xf(0).toFixed(1)+' '+(mt+ph)+'Z" style="fill:var(--c1)" fill-opacity=".1"/><path d="'+line+'" fill="none" style="stroke:var(--c1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
  var ex=xf(n-1),ey=yf(ser[n-1]);
  s+='<circle cx="'+ex.toFixed(1)+'" cy="'+ey.toFixed(1)+'" r="4.5" style="fill:var(--c1);stroke:var(--surface)" stroke-width="2"/><text class="val" x="'+(ex-8).toFixed(1)+'" y="'+Math.max(mt-2,ey-10).toFixed(1)+'" text-anchor="end">'+compact(ser[n-1])+'</text>';
  [0,Math.round((n-1)/2),n-1].forEach(function(k,j){s+='<text x="'+xf(k).toFixed(1)+'" y="'+(H-6)+'" text-anchor="'+(j===0?'start':(j===2?'end':'middle'))+'">'+esc(fmt(ds[k]))+'</text>'});
  s+='<line id="xh" class="grid" style="stroke:var(--axis)" y1="'+mt+'" y2="'+(mt+ph)+'" x1="0" x2="0" visibility="hidden"/><rect class="hit" x="'+ml+'" y="'+mt+'" width="'+pw+'" height="'+ph+'"/></svg>';
  h.innerHTML=s;
  var svg=h.firstChild,xh=svg.querySelector('#xh');
  function move(e){
    var k=Math.max(0,Math.min(n-1,Math.round((svgX(svg,e,w)-ml)/pw*(n-1))));
    xh.setAttribute('x1',xf(k));xh.setAttribute('x2',xf(k));xh.setAttribute('visibility','visible');
    showTip(tipRows(parseD(ds[k]).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short',year:'numeric'}),[{l:'Solde',col:'var(--c1)',v:money(Math.round(ser[k]*1000),c.cur)}]),e);
  }
  svg.addEventListener('pointermove',move);svg.addEventListener('pointerdown',move);
  svg.addEventListener('pointerleave',function(e){xh.setAttribute('visibility','hidden');if(e.pointerType==='mouse')hideTip()});
};
CH.rbars=function(h,w){
  var c=rctx(),items=rItems(c),B=rBuckets(c);
  var data=B.map(function(b){var ti=0,te=0;items.forEach(function(x){if(x.date>=b.from&&x.date<=b.to){if(x.type==='inc')ti+=x.amt;else te+=x.amt}});return {inc:ti,exp:te}});
  var H=176,ml=40,mr=4,mt=16,mb=22,pw=w-ml-mr,ph=H-mt-mb;
  var mxu=niceMax(Math.max.apply(null,data.map(function(d){return Math.max(d.inc,d.exp)/1000}).concat([0])));
  var yf=function(t){return mt+ph-t/mxu*ph},slot=pw/B.length,showI=c.type!=='exp',showE=c.type!=='inc',nb=(showI&&showE)?2:1;
  var bw=Math.max(2,Math.min(24,(slot-6)/nb)),every=Math.max(1,Math.ceil(B.length/Math.max(1,Math.floor(pw/40))));
  var s='<svg viewBox="0 0 '+w+' '+H+'" role="img" aria-label="Revenus et dépenses par période">'+yGrid([0,mxu/2,mxu],yf,ml,w,mr);
  B.forEach(function(b,j){
    var d=data[j],gw=nb*bw+(nb-1)*2,xx=ml+j*slot+(slot-gw)/2,hi=d.inc/1000/mxu*ph,he=d.exp/1000/mxu*ph;
    if(showI){if(d.inc>0)s+='<path d="'+barPath(xx.toFixed(1),(mt+ph-hi).toFixed(1),bw.toFixed(1),hi.toFixed(1))+'" style="fill:var(--c1)"/>';xx+=bw+2}
    if(showE&&d.exp>0)s+='<path d="'+barPath(xx.toFixed(1),(mt+ph-he).toFixed(1),bw.toFixed(1),he.toFixed(1))+'" style="fill:var(--c2)"/>';
    if(j%every===0)s+='<text x="'+(ml+j*slot+slot/2).toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle">'+esc(b.label)+'</text>';
    s+='<rect class="hit" data-i="'+j+'" x="'+(ml+j*slot).toFixed(1)+'" y="'+mt+'" width="'+slot.toFixed(1)+'" height="'+ph+'"/>';
  });
  h.innerHTML=s+'</svg>';
  var svg=h.firstChild;
  function over(e){
    var j=e.target.dataset&&e.target.dataset.i;if(j==null)return;var d=data[Number(j)],rows=[];
    if(showI)rows.push({l:'Revenus',col:'var(--c1)',v:money(d.inc,c.cur)});
    if(showE)rows.push({l:'Dépenses',col:'var(--c2)',v:money(d.exp,c.cur)});
    if(showI&&showE)rows.push({l:'Solde',v:money(d.inc-d.exp,c.cur,true)});
    showTip(tipRows(B[Number(j)].title,rows),e);
  }
  svg.addEventListener('pointermove',over);svg.addEventListener('pointerdown',over);bindHide(svg);
};
CH.rwd=function(h,w){
  var c=rctx(),items=rItems(c).filter(function(x){return x.type===c.kind});
  var sums=[0,0,0,0,0,0,0],cnt=[0,0,0,0,0,0,0],d=parseD(c.from),end=parseD(capEnd(c));
  while(d<=end){cnt[(d.getDay()+6)%7]++;d=addDays(d,1)}
  items.forEach(function(x){sums[(parseD(x.date).getDay()+6)%7]+=x.amt});
  var avg=sums.map(function(s,i){return cnt[i]?s/cnt[i]:0});
  var H=170,ml=40,mr=4,mt=18,mb=22,pw=w-ml-mr,ph=H-mt-mb;
  var mxu=niceMax(Math.max.apply(null,avg.map(function(v){return v/1000}).concat([0])));
  var yf=function(t){return mt+ph-t/mxu*ph},slot=pw/7,bw=Math.min(24,Math.max(6,slot-14)),mi=-1,mv=0;
  var s='<svg viewBox="0 0 '+w+' '+H+'" role="img" aria-label="Moyenne par jour de la semaine">'+yGrid([0,mxu/2,mxu],yf,ml,w,mr);
  avg.forEach(function(v,i){
    if(v>mv){mv=v;mi=i}
    var hh=v/1000/mxu*ph,x=ml+i*slot+(slot-bw)/2;
    if(v>0)s+='<path d="'+barPath(x.toFixed(1),(mt+ph-hh).toFixed(1),bw.toFixed(1),hh.toFixed(1))+'" style="fill:'+c.col+'"/>';
    s+='<text x="'+(ml+i*slot+slot/2).toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle">'+WD[i].slice(0,3)+'</text>';
  });
  if(mi>=0)s+='<text class="val" x="'+(ml+mi*slot+slot/2).toFixed(1)+'" y="'+(mt+ph-mv/1000/mxu*ph-6).toFixed(1)+'" text-anchor="middle">'+compact(mv/1000)+'</text>';
  avg.forEach(function(v,i){s+='<rect class="hit" data-i="'+i+'" x="'+(ml+i*slot).toFixed(1)+'" y="'+mt+'" width="'+slot.toFixed(1)+'" height="'+ph+'"/>'});
  h.innerHTML=s+'</svg>';
  var svg=h.firstChild;
  function over(e){
    var i=e.target.dataset&&e.target.dataset.i;if(i==null)return;i=Number(i);
    showTip(tipRows(WD[i],[{l:'Moyenne par '+WD[i],col:c.col,v:money(Math.round(avg[i]),c.cur)},{l:'Total',v:money(sums[i],c.cur)}]),e);
  }
  svg.addEventListener('pointermove',over);svg.addEventListener('pointerdown',over);bindHide(svg);
};
function recapAccounts(c){
  var items=rItems(c),end=capEnd(c),total=0,showI=c.type!=='exp',showE=c.type!=='inc';
  var rows=state.accounts.filter(function(a){return c.accIds.indexOf(a.id)>=0}).map(function(a){
    var i=0,e=0,bal=a.open||0;
    items.forEach(function(x){if(x.acc===a.id){if(x.type==='inc')i+=x.amt;else e+=x.amt}});
    state.tx.forEach(function(x){
      if(x.date>end)return;
      if(x.type==='inc'){if(x.acc===a.id)bal+=x.amt}
      else if(x.type==='exp'){if(x.acc===a.id)bal-=x.amt}
      else{if(x.acc===a.id)bal-=x.amt;if(x.to===a.id)bal+=x.amt}
    });
    total+=bal;return {a:a,inc:i,exp:e,bal:bal};
  });
  var mx=Math.max.apply(null,rows.map(function(r){return Math.max(r.inc,r.exp)}).concat([1]));
  var html=rows.map(function(r){
    var a=r.a;
    return '<div class="rc-acc"><div class="top"><span class="mono-chip" style="background:'+esc(a.color||ACOL[0])+'">'+esc(initials(a.bank||a.name))+'</span><span style="min-width:0"><b>'+esc(a.name)+'</b><small>'+esc(a.bank||'')+' · '+esc(TYPES[a.type]||'')+'</small></span><span class="amt"'+(r.bal<0?' style="color:var(--exp)"':'')+'>'+money(r.bal,a.cur)+'</span></div>'+
      (showI?'<div class="rc-line"><span>Revenus</span><div class="tr"><i style="width:'+Math.round(r.inc/mx*100)+'%;background:var(--c1)"></i></div><b>'+money(r.inc,a.cur)+'</b></div>':'')+
      (showE?'<div class="rc-line"><span>Dépenses</span><div class="tr"><i style="width:'+Math.round(r.exp/mx*100)+'%;background:var(--c2)"></i></div><b>'+money(r.exp,a.cur)+'</b></div>':'')+'</div>';
  }).join('');
  return {html:html,total:total,rows:rows};
}
function fmtRange(g){var o={day:'numeric',month:'short',year:'numeric'};return parseD(g.from).toLocaleDateString('fr-FR',o)+' – '+parseD(g.to).toLocaleDateString('fr-FR',o)}
function recapFilters(c){
  var r=ui.rc,g=rRange(),curs=currencies();
  var pl=(PERIODS.filter(function(p){return p[0]===r.period})[0]||PERIODS[3])[1];
  var al=r.accs.length?(r.accs.length===1&&accById(r.accs[0])?accById(r.accs[0]).name:r.accs.length+' comptes'):'Tous les comptes';
  var cl=r.cats.length?(r.cats.length===1?catOf(r.cats[0]).name:r.cats.length+' catégories'):'Toutes les catégories';
  var dirty=r.period!=='m3'||r.accs.length||r.cats.length||r.type!=='all'||r.cur;
  var h='<div class="chips"><button type="button" class="chip" data-act="rf-period" aria-pressed="'+(r.period!=='m3')+'">'+esc(pl)+' ▾</button><button type="button" class="chip" data-act="rf-accs" aria-pressed="'+(r.accs.length>0)+'">'+esc(al)+' ▾</button><button type="button" class="chip" data-act="rf-cats" aria-pressed="'+(r.cats.length>0)+'">'+esc(cl)+' ▾</button></div>';
  h+='<div class="seg" style="margin:4px 0 10px">'+[['all','Tout'],['exp','Dépenses'],['inc','Revenus']].map(function(t){return '<button type="button" data-act="rf-type" data-id="'+t[0]+'" aria-pressed="'+(r.type===t[0])+'">'+t[1]+'</button>'}).join('')+'</div>';
  if(curs.length>1)h+='<div class="chips">'+curs.map(function(x){return '<button type="button" class="chip" data-act="rf-cur" data-id="'+x+'" aria-pressed="'+(x===c.cur)+'">'+x+'</button>'}).join('')+'</div>';
  h+='<div class="rc-range"><span>'+esc(fmtRange(g))+'</span>'+(dirty?'<button type="button" class="link" data-act="rf-reset">Réinitialiser</button>':'')+'</div>';
  return h;
}
function viewRecap(){
  if(!state.accounts.length)return '<h2 class="page-t">Récapitulatif</h2><div class="empty panel"><h3>Pas encore de récapitulatif</h3><p>Ajoutez un compte et quelques opérations pour voir le récapitulatif de vos comptes.</p><button class="btn primary" data-act="new-acc">Ajouter un compte</button></div>';
  var c=rctx(),items=rItems(c),T=rTotals(items),net=T.inc-T.exp,A=recapAccounts(c);
  var days=Math.max(1,Math.round((parseD(capEnd(c))-parseD(c.from))/864e5)+1);
  var h='<h2 class="page-t">Récapitulatif</h2>'+recapFilters(c);
  h+='<div class="duo"><div class="panel"><p class="eyebrow">Revenus</p><p class="v pos">'+money(T.inc,c.cur)+'</p></div><div class="panel"><p class="eyebrow">Dépenses</p><p class="v">'+money(T.exp,c.cur)+'</p></div></div>';
  h+='<div class="duo" style="margin-top:12px"><div class="panel"><p class="eyebrow">Solde net</p><p class="v" style="color:'+(net<0?'var(--exp)':'var(--inc)')+'">'+money(net,c.cur,true)+'</p></div><div class="panel"><p class="eyebrow">Solde en fin de période</p><p class="v">'+money(A.total,c.cur)+'</p></div></div>';
  h+='<p class="rc-note">'+items.length+' opération'+(items.length>1?'s':'')+' · dépenses moyennes de '+money(Math.round(T.exp/days),c.cur)+' par jour'+(T.inc>0&&c.type==='all'?' · '+Math.round(net/T.inc*100)+' % des revenus restent disponibles':'')+'</p>';
  h+=card('Évolution du solde','Total des comptes sélectionnés, en '+esc(c.cur),'rbal');
  h+=card('Revenus et dépenses','Semaine par semaine ou mois par mois selon la période','rbars','<div class="keys">'+(c.type!=='exp'?'<span><i class="sq" style="background:var(--c1)"></i>Revenus</span>':'')+(c.type!=='inc'?'<span><i class="sq" style="background:var(--c2)"></i>Dépenses</span>':'')+'</div>');
  var Tc=rcatTotals(c),list=Tc.keys.map(function(k){var ct=catOf(k);
    return '<div class="row" style="grid-template-columns:14px minmax(0,1fr) auto;padding:9px 0"><i style="width:10px;height:10px;border-radius:3px;background:'+ct.color+'"></i><span class="t">'+esc(ct.name)+' <span style="color:var(--muted);font:400 12.5px var(--f-mono)">'+Math.round(Tc.by[k]/Tc.tot*100)+' %</span></span><span class="amt">'+money(Tc.by[k],c.cur)+'</span></div>';
  }).join('');
  h+=card(c.kind==='exp'?'Dépenses par catégorie':'Revenus par catégorie','Répartition sur la période','rdonut',list?'<div style="margin-top:8px">'+list+'</div>':'');
  h+='<section class="card" style="margin-top:12px"><h3>Par compte</h3><p class="sub">Solde en fin de période, revenus et dépenses de chaque compte</p>'+(A.html||'<p class="sub" style="margin:0">Aucun compte dans cette devise.</p>')+'</section>';
  h+=card(c.kind==='exp'?'Dépenses par jour de la semaine':'Revenus par jour de la semaine','Moyenne sur la période','rwd');
  var top=items.filter(function(x){return x.type===c.kind}).sort(function(a,b){return b.amt-a.amt}).slice(0,5);
  h+='<div class="section-h"><h2>Plus grosses '+(c.kind==='exp'?'dépenses':'entrées')+'</h2></div>'+(top.length?'<div class="panel">'+top.map(function(x){return opRow(x)}).join('')+'</div>':'<div class="empty panel"><p style="margin:0 auto">Aucune opération sur cette période.</p></div>');
  var B=rBuckets(c),rowsT=B.map(function(b){var ti=0,te=0;items.forEach(function(x){if(x.date>=b.from&&x.date<=b.to){if(x.type==='inc')ti+=x.amt;else te+=x.amt}});return '<tr><td style="font-family:var(--f-body)">'+esc(b.title)+'</td><td>'+money(ti,c.cur)+'</td><td>'+money(te,c.cur)+'</td></tr>'}).join('');
  h+='<details class="tbl"><summary>Afficher les chiffres en tableau</summary><div class="scroll"><table><thead><tr><th>Période</th><th>Revenus</th><th>Dépenses</th></tr></thead><tbody>'+rowsT+'</tbody></table></div></details>';
  return h;
}
function pickPeriod(){
  var r=ui.rc,showCustom=r.period==='custom';
  function paint(){
    var g=rRange();
    $('#sheet').innerHTML='<div class="pk-h"><button type="button" class="ibtn" data-pk="back" aria-label="Fermer">←</button><h2>Sélectionner</h2></div>'+
      PERIODS.map(function(p){return '<button type="button" class="pk-row" data-pk="p" data-id="'+p[0]+'"><span>'+esc(p[1])+'</span><span class="ck">'+(r.period===p[0]?'✓':'')+'</span></button>'}).join('')+
      (showCustom?'<div class="two" style="margin-top:12px"><div class="field"><label for="pk-from">Du</label><input id="pk-from" type="date" value="'+esc(r.from||g.from)+'"></div><div class="field"><label for="pk-to">Au</label><input id="pk-to" type="date" value="'+esc(r.to||g.to)+'"></div></div><div class="actions" style="margin-top:12px"><button type="button" class="btn primary" data-pk="apply">Appliquer</button></div>':'');
  }
  openSheet('');paint();
  $('#sheet').onclick=function(e){
    var b=e.target.closest('[data-pk]');if(!b)return;var a=b.dataset.pk;
    if(a==='back'){closeSheet(true);return}
    if(a==='p'){var id=b.dataset.id;if(id==='custom'){r.period='custom';showCustom=true;paint();return}r.period=id;closeSheet(true);render();return}
    if(a==='apply'){var f=$('#pk-from').value,t=$('#pk-to').value;if(!f||!t)return;r.period='custom';r.from=f;r.to=t;closeSheet(true);render()}
  };
}
function openPicker(cfg){
  var sel=cfg.sel.slice(),q='';
  function rows(){
    var h='',lastG='';
    cfg.items.forEach(function(i){
      if(q&&i.label.toLowerCase().indexOf(q)<0)return;
      if(i.group&&i.group!==lastG){h+='<p class="pk-g">'+esc(i.group)+'</p>';lastG=i.group}
      h+='<button type="button" class="pk-row" data-pk="it" data-id="'+esc(i.id)+'"><span>'+esc(i.label)+'</span><span class="ck">'+(sel.indexOf(i.id)>=0?'✓':'')+'</span></button>';
    });
    return (q?'':'<button type="button" class="pk-row" data-pk="all"><span>'+esc(cfg.allLabel)+'</span><span class="ck">'+(sel.length?'':'✓')+'</span></button>')+h;
  }
  openSheet('');
  $('#sheet').innerHTML='<div class="pk-h"><button type="button" class="ibtn" data-pk="back" aria-label="Fermer">←</button><h2>'+esc(cfg.title)+'</h2></div><input id="pk-q" class="pk-q" type="search" placeholder="Recherche" aria-label="Recherche" autocomplete="off"><div id="pk-list">'+rows()+'</div><div class="actions" style="margin-top:14px"><button type="button" class="btn primary" data-pk="done">Terminé</button></div>';
  $('#sheet').oninput=function(e){if(e.target.id==='pk-q'){q=e.target.value.trim().toLowerCase();$('#pk-list').innerHTML=rows()}};
  $('#sheet').onclick=function(e){
    var b=e.target.closest('[data-pk]');if(!b)return;var a=b.dataset.pk;
    if(a==='back'){closeSheet(true);return}
    if(a==='all'){sel=[];$('#pk-list').innerHTML=rows();return}
    if(a==='it'){var id=b.dataset.id,k=sel.indexOf(id);if(k>=0)sel.splice(k,1);else sel.push(id);$('#pk-list').innerHTML=rows();return}
    if(a==='done'){cfg.onApply(sel);closeSheet(true);render()}
  };
}
function pickAccs(){
  openPicker({title:'Sélectionner',allLabel:'Tous les comptes',sel:ui.rc.accs.filter(function(id){return accById(id)}),
    items:state.accounts.slice().sort(function(x,y){return abc(x.name,y.name)}).map(function(a){return {id:a.id,label:a.name+' ('+a.cur+')'}}),
    onApply:function(s){ui.rc.accs=s;ui.rc.cur=null}});
}
function pickCats(){
  var items=catList('exp').map(function(c){return {id:c[0],label:c[1],group:'Dépenses'}}).concat(catList('inc').map(function(c){return {id:c[0],label:c[1],group:'Revenus'}}));
  openPicker({title:'Sélectionner',allLabel:'Toutes les catégories',sel:ui.rc.cats,items:items,onApply:function(s){ui.rc.cats=s}});
}
function viewStats(){
  if(!state.accounts.length)return '<div class="empty panel"><h3>Pas encore de statistiques</h3><p>Ajoutez un compte et quelques opérations pour voir où va votre argent.</p><button class="btn primary" data-act="new-acc">Ajouter un compte</button></div>';
  var c=sctx(),curs=currencies(),exp=c.kind==='exp',h=monthNav();
  if(curs.length>1)h+='<div class="chips">'+curs.map(function(x){return '<button class="chip" data-act="stat-cur" data-id="'+x+'" aria-pressed="'+(x===c.cur)+'">'+x+'</button>'}).join('')+'</div>';
  h+='<div class="seg" style="margin-bottom:12px"><button data-act="kind" data-id="exp" aria-pressed="'+exp+'">Dépenses</button><button data-act="kind" data-id="inc" aria-pressed="'+!exp+'">Revenus</button></div>';
  var tm=totals(c.key,c.cur);
  h+='<div class="duo"><div class="panel"><p class="eyebrow">Revenus</p><p class="v pos">'+money(tm.inc,c.cur)+'</p></div><div class="panel"><p class="eyebrow">Dépenses</p><p class="v">'+money(tm.exp,c.cur)+'</p></div></div>';
  h+='<div class="panel pad" style="margin-top:12px"><div class="meta"><span>Solde du mois</span><b style="color:'+(tm.inc-tm.exp<0?'var(--exp)':'var(--inc)')+'">'+money(tm.inc-tm.exp,c.cur,true)+'</b></div></div>';
  var T=catTotals(c),list=T.keys.map(function(k){var ct=catOf(k);
    return '<div class="row" style="grid-template-columns:14px minmax(0,1fr) auto;padding:9px 0"><i style="width:10px;height:10px;border-radius:3px;background:'+ct.color+'"></i><span class="t">'+esc(ct.name)+' <span style="color:var(--muted);font:400 12.5px var(--f-mono)">'+Math.round(T.by[k]/T.tot*100)+' %</span></span><span class="amt">'+money(T.by[k],c.cur)+'</span></div>';
  }).join('');
  h+=card('Répartition par catégorie',exp?'Où part l’argent ce mois-ci':'D’où vient l’argent ce mois-ci','donut',list?'<div style="margin-top:8px">'+list+'</div>':'');
  h+=card(exp?'Dépenses jour par jour':'Revenus jour par jour','Un trait par jour du mois, le plus haut est annoté','daily');
  var hasBudget=exp&&state.budget&&c.cur===homeCur();
  h+=card(exp?'Dépenses cumulées':'Revenus cumulés','Ce mois comparé au mois précédent','cum','<div class="keys"><span><i style="border-color:'+c.col+'"></i>Ce mois</span><span><i style="border-color:var(--prev)"></i>Mois précédent</span>'+(hasBudget?'<span><i style="border-color:var(--ink)"></i>Budget</span>':'')+'</div>');
  h+=card('Calendrier','Plus la case est foncée, plus le montant du jour est élevé','cal');
  h+=card('6 derniers mois','Revenus et dépenses mois par mois','six','<div class="keys"><span><i class="sq" style="background:var(--c1)"></i>Revenus</span><span><i class="sq" style="background:var(--c2)"></i>Dépenses</span></div>');
  h+=card('Solde sur 90 jours','Total des comptes en '+esc(c.cur)+', jour après jour','bal');
  var spent=totals(c.key,homeCur()).exp;
  h+='<div class="section-h"><h2>Budget mensuel</h2><button class="link" data-act="budget">'+(state.budget?'Modifier':'Définir')+'</button></div><div class="panel pad">';
  if(state.budget){var pct=Math.min(100,Math.round(spent/state.budget*100)),cls=spent>state.budget?' over':(spent>state.budget*.85?' warn':'');
    h+='<div class="meta"><span>Dépenses en '+esc(homeCur())+'</span><b>'+money(spent,homeCur())+' / '+money(state.budget,homeCur())+'</b></div><div class="meter'+cls+'" role="progressbar" aria-valuenow="'+pct+'" aria-valuemin="0" aria-valuemax="100"><span style="width:'+pct+'%"></span></div>';
  }else h+='<div class="meta"><span>Aucun budget défini</span></div>';
  h+='</div>';
  var days=dayVals(c.key,c.cur,c.kind),months=[],i;for(i=5;i>=0;i--)months.push(addMonths(todayIso().slice(0,7),-i));
  h+='<details class="tbl"><summary>Afficher les chiffres en tableau</summary><div class="scroll"><table><caption style="text-align:left;color:var(--muted);padding-top:6px">6 derniers mois</caption><thead><tr><th>Mois</th><th>Revenus</th><th>Dépenses</th></tr></thead><tbody>'+months.map(function(m){var d=totals(m,c.cur);return '<tr><td style="font-family:var(--f-body)">'+esc(monthLabel(m))+'</td><td>'+money(d.inc,c.cur)+'</td><td>'+money(d.exp,c.cur)+'</td></tr>'}).join('')+'</tbody></table>';
  h+='<table><caption style="text-align:left;color:var(--muted);padding-top:12px">'+esc(monthLabel(c.key))+', par jour</caption><thead><tr><th>Jour</th><th>'+(exp?'Dépenses':'Revenus')+'</th></tr></thead><tbody>'+(days.some(function(v){return v>0})?days.map(function(v,k){return v?'<tr><td style="font-family:var(--f-body)">'+esc(dShort(c.key,k+1))+'</td><td>'+money(v,c.cur)+'</td></tr>':''}).join(''):'<tr><td colspan="2" style="font-family:var(--f-body);color:var(--muted)">Aucune opération.</td></tr>')+'</tbody></table></div></details>';
  return h;
}
function render(){
  var v=$('#view');
  document.querySelectorAll('.tab').forEach(function(t){if(t.dataset.tab===ui.tab)t.setAttribute('aria-current','page');else t.removeAttribute('aria-current')});
  hideTip();
  v.innerHTML=ui.tab==='home'?viewHome():ui.tab==='ops'?viewOps():ui.tab==='more'?viewMore():ui.tab==='recap'?viewRecap():viewStats();
  drawCharts();
}

/* ---------- sheets ---------- */
var lastFocus=null;
function openSheet(html){
  lastFocus=document.activeElement;
  $('#sheet').onclick=null;$('#sheet').onkeydown=null;$('#sheet').oninput=null;
  $('#sheet').innerHTML=html;$('#scrim').hidden=false;
  var f=$('#sheet input,#sheet select');if(f&&!/Android|iPhone|iPad/.test(navigator.userAgent))f.focus();
}
var reopen=null;
function closeSheet(final){var rp=reopen;reopen=null;$('#scrim').hidden=true;$('#sheet').onclick=null;$('#sheet').onkeydown=null;$('#sheet').oninput=null;$('#sheet').innerHTML='';if(lastFocus&&lastFocus.focus)try{lastFocus.focus()}catch(e){}if(rp&&final!==true)rp()}
var toastT;
function toast(m){var t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(function(){t.hidden=true},2600)}

function txSheet(id){
  if(!state.accounts.length){accSheet();return}
  var t=id?state.tx.find(function(x){return x.id===id}):null;
  var type=t?t.type:'exp',pendingCat=null;
  var defAcc=t?t.acc:(ui.acc!=='all'&&accById(ui.acc)?ui.acc:state.accounts[0].id);
  var accOpts=state.accounts.slice().sort(function(x,y){return abc(x.name,y.name)}).map(function(a){return '<option value="'+esc(a.id)+'"'+(a.id===defAcc?' selected':'')+'>'+esc(a.name)+' ('+esc(a.bank||'')+')</option>'}).join('');
  openSheet('<h2>'+(t?'Modifier l’opération':'Nouvelle opération')+'</h2>'+
  '<div class="seg" id="f-type"><button type="button" data-t="exp">Dépense</button><button type="button" data-t="inc">Revenu</button><button type="button" data-t="tr">Virement</button></div>'+
  '<div class="field"><label for="f-amt">Montant</label><div class="amount"><input id="f-amt" inputmode="decimal" autocomplete="off" placeholder="0,000" value="'+esc(t?amtInput(t.amt):'')+'"><span id="f-cur"></span></div></div>'+
  '<div class="field"><label for="f-acc" id="f-acc-l">Compte</label><select id="f-acc">'+accOpts+'</select></div>'+
  '<div class="field" id="f-to-w"><label for="f-to">Vers le compte</label><select id="f-to"></select></div>'+
  '<div class="field" id="f-cat-w"><label for="f-cat">Catégorie</label><div class="catrow"><select id="f-cat"></select><button type="button" class="plus" id="f-catadd" aria-label="Ajouter une catégorie" title="Ajouter une catégorie">+</button></div>'+
  '<div class="newcat" id="f-newcat" hidden><div class="rw"><input id="f-newname" maxlength="30" autocomplete="off" placeholder="Nouvelle catégorie, ex. Essence" aria-label="Nom de la nouvelle catégorie"><button type="button" class="btn primary" id="f-newok">Ajouter</button></div><div class="sug" id="f-sug"></div><div class="mine" id="f-mine"></div></div></div>'+
  '<div class="two"><div class="field"><label for="f-date">Date</label><input id="f-date" type="date" value="'+esc(t?t.date:todayIso())+'"></div><div class="field"><label for="f-note">Note</label><input id="f-note" autocomplete="off" maxlength="80" placeholder="Facultatif" value="'+esc(t?t.note:'')+'"></div></div>'+
  '<p class="err" id="f-err" role="alert"></p><div class="actions">'+(t?'<button type="button" class="btn danger" id="f-del">Supprimer</button>':'')+'<button type="button" class="btn" data-act="close">Annuler</button><button type="button" class="btn primary" id="f-save">Enregistrer</button></div>');
  function refresh(){
    document.querySelectorAll('#f-type button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.t===type))});
    var acc=accById($('#f-acc').value);$('#f-cur').textContent=acc?acc.cur:'';
    $('#f-acc-l').textContent=type==='tr'?'Depuis le compte':'Compte';
    $('#f-to-w').hidden=type!=='tr';$('#f-cat-w').hidden=type==='tr';
    var list=catList(type);
    var cur=pendingCat||$('#f-cat').value||(t&&t.cat);pendingCat=null;
    $('#f-cat').innerHTML=list.map(function(c){return '<option value="'+esc(c[0])+'">'+esc(c[1])+'</option>'}).join('');
    if(cur&&list.some(function(c){return c[0]===cur}))$('#f-cat').value=cur;
    renderSug();renderMine();
    var tos=state.accounts.filter(function(a){return acc&&a.id!==acc.id&&a.cur===acc.cur});
    $('#f-to').innerHTML=tos.map(function(a){return '<option value="'+esc(a.id)+'">'+esc(a.name)+'</option>'}).join('');
    if(t&&t.to&&tos.some(function(a){return a.id===t.to}))$('#f-to').value=t.to;
  }
  refresh();
  $('#f-type').onclick=function(e){var b=e.target.closest('button');if(!b)return;type=b.dataset.t;refresh()};
  $('#f-acc').onchange=refresh;
  function renderSug(){
    var have=catList(type).map(function(c){return c[1].toLowerCase()});
    var sg=(SUGG[type]||[]).filter(function(n){return have.indexOf(n.toLowerCase())<0}).sort(abc);
    $('#f-sug').innerHTML=sg.map(function(n){return '<button type="button" data-n="'+esc(n)+'">+ '+esc(n)+'</button>'}).join('');
  }
  function addCat(name){
    name=String(name||'').trim().replace(/\s+/g,' ');var err=$('#f-err');
    if(!name){err.textContent='Saisissez un nom de catégorie.';$('#f-newname').focus();return}
    var dup=catList(type).filter(function(c){return c[1].toLowerCase()===name.toLowerCase()})[0];
    if(dup){pendingCat=dup[0];err.textContent='';$('#f-newname').value='';$('#f-newcat').hidden=true;refresh();return}
    state.cats=state.cats||[];
    var used=state.cats.filter(function(c){return c.kind===type}).length;
    var rec={id:uid(),name:name,kind:type,c:used%8+1};
    state.cats.push(rec);pendingCat=rec.id;err.textContent='';
    $('#f-newname').value='';$('#f-newcat').hidden=true;
    commit();refresh();toast('Catégorie ajoutée : '+name);
  }
  var editCat=null;
  function renderMine(){
    var mine=(state.cats||[]).filter(function(c){return c.kind===type}).sort(function(x,y){return abc(x.name,y.name)});
    $('#f-mine').innerHTML=mine.length?'<p class="eyebrow" style="margin:6px 0 2px">Vos catégories</p>'+mine.map(function(c){
      return c.id===editCat
        ?'<div class="mrow" data-id="'+esc(c.id)+'"><input maxlength="30" value="'+esc(c.name)+'" aria-label="Nouveau nom"><button type="button" class="ibtn ok" data-a="save" aria-label="Enregistrer le nom">✓</button><button type="button" class="ibtn" data-a="cancel" aria-label="Annuler">×</button></div>'
        :'<div class="mrow" data-id="'+esc(c.id)+'"><span class="nm">'+esc(c.name)+'</span><button type="button" class="ibtn" data-a="ren" aria-label="Renommer '+esc(c.name)+'" title="Renommer">'+PEN+'</button><button type="button" class="ibtn" data-a="del" aria-label="Supprimer '+esc(c.name)+'" title="Supprimer">'+BIN+'</button></div>';
    }).join(''):'';
  }
  $('#f-mine').onclick=function(e){
    var b=e.target.closest('button');if(!b)return;
    var row=b.closest('.mrow'),id=row.dataset.id,a=b.dataset.a,err=$('#f-err');
    var c=(state.cats||[]).filter(function(x){return x.id===id})[0];if(!c)return;
    if(a==='ren'){editCat=id;renderMine();var i=$('#f-mine input');if(i){i.focus();i.select()}}
    else if(a==='cancel'){editCat=null;renderMine()}
    else if(a==='save'){
      var nm=row.querySelector('input').value.trim().replace(/\s+/g,' ');
      if(!nm){err.textContent='Le nom ne peut pas être vide.';return}
      var dup=catList(type).filter(function(x){return x[0]!==id&&x[1].toLowerCase()===nm.toLowerCase()})[0];
      if(dup){err.textContent='Une catégorie porte déjà ce nom.';return}
      err.textContent='';c.name=nm;editCat=null;pendingCat=$('#f-cat').value;commit();refresh();toast('Catégorie renommée');
    }else if(a==='del'){
      if(!b.classList.contains('arm')){b.classList.add('arm');b.setAttribute('aria-label','Confirmer la suppression');err.textContent='Touchez encore la corbeille pour confirmer.';return}
      var fb=type==='inc'?'oinc':'oth',n=0;
      state.tx.forEach(function(x){if(x.cat===id){x.cat=fb;n++}});
      state.cats=state.cats.filter(function(x){return x.id!==id});
      pendingCat=$('#f-cat').value===id?null:$('#f-cat').value;err.textContent='';
      commit();refresh();toast(n?'Catégorie supprimée. '+n+' opération'+(n>1?'s passent':' passe')+' en « Autres ».':'Catégorie supprimée');
    }
  };
  $('#f-catadd').onclick=function(){var w=$('#f-newcat');w.hidden=!w.hidden;if(!w.hidden)$('#f-newname').focus()};
  $('#f-newok').onclick=function(){addCat($('#f-newname').value)};
  $('#f-newname').onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();addCat(this.value)}};
  $('#f-sug').onclick=function(e){var b=e.target.closest('button');if(b)addCat(b.dataset.n)};
  $('#f-save').onclick=function(){
    var amt=parseAmount($('#f-amt').value),err=$('#f-err'),date=$('#f-date').value,acc=$('#f-acc').value;
    if(!(amt>0)){err.textContent='Saisissez un montant supérieur à zéro, par exemple 12,500.';$('#f-amt').focus();return}
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){err.textContent='Choisissez une date.';return}
    var rec={id:t?t.id:uid(),type:type,amt:amt,acc:acc,date:date,note:$('#f-note').value.trim()};
    if(type==='tr'){var to=$('#f-to').value;if(!to){err.textContent='Aucun autre compte en '+accById(acc).cur+' pour recevoir ce virement.';return}rec.to=to;rec.cat=null}
    else rec.cat=$('#f-cat').value;
    if(t)state.tx[state.tx.indexOf(t)]=rec;else state.tx.push(rec);
    closeSheet();commit();toast(t?'Opération modifiée':'Opération ajoutée');
  };
  if(t)$('#f-del').onclick=function(){
    var b=$('#f-del');if(!b.classList.contains('armed')){b.classList.add('armed');b.textContent='Confirmer la suppression';return}
    state.tx.splice(state.tx.indexOf(t),1);closeSheet();commit();toast('Opération supprimée');
  };
}
function accSheet(id){
  var a=id?accById(id):null;
  openSheet('<h2>'+(a?'Modifier le compte':'Nouveau compte')+'</h2>'+
  '<div class="field"><label for="a-name">Nom du compte</label><input id="a-name" maxlength="40" autocomplete="off" placeholder="Compte courant" value="'+esc(a?a.name:'')+'"></div>'+
  '<div class="field"><label for="a-bank">Banque</label><input id="a-bank" list="banks" maxlength="40" autocomplete="off" placeholder="BIAT, STB, Amen Bank…" value="'+esc(a?a.bank:'')+'"><datalist id="banks">'+BANKS.slice().sort(abc).map(function(b){return '<option value="'+esc(b)+'">'}).join('')+'</datalist></div>'+
  '<div class="two"><div class="field"><label for="a-type">Type</label><select id="a-type">'+Object.keys(TYPES).map(function(k){return '<option value="'+k+'"'+(a&&a.type===k?' selected':'')+'>'+TYPES[k]+'</option>'}).join('')+'</select></div>'+
  '<div class="field"><label for="a-cur">Devise</label><select id="a-cur">'+['TND','EUR','USD'].map(function(c){return '<option'+(a&&a.cur===c?' selected':'')+'>'+c+'</option>'}).join('')+'</select></div></div>'+
  '<div class="field"><label for="a-open">Solde initial</label><input id="a-open" inputmode="decimal" autocomplete="off" placeholder="0,000" value="'+esc(a?amtInput(a.open):'')+'"></div>'+
  '<p class="err" id="a-err" role="alert"></p><div class="actions">'+(a?'<button type="button" class="btn danger" id="a-del">Supprimer</button>':'')+'<button type="button" class="btn" data-act="close">Annuler</button><button type="button" class="btn primary" id="a-save">Enregistrer</button></div>');
  if(a)$('#a-cur').disabled=state.tx.some(function(x){return x.acc===a.id||x.to===a.id});
  $('#a-save').onclick=function(){
    var name=$('#a-name').value.trim(),err=$('#a-err'),raw=$('#a-open').value.trim(),open=raw===''?0:(raw[0]==='-'?-parseAmount(raw.slice(1)):parseAmount(raw));
    if(!name){err.textContent='Donnez un nom au compte.';$('#a-name').focus();return}
    if(isNaN(open)){err.textContent='Le solde initial doit être un nombre, par exemple 1 250,000.';$('#a-open').focus();return}
    var rec=a||{id:uid(),color:ACOL[state.accounts.length%ACOL.length]};
    rec.name=name;rec.bank=$('#a-bank').value.trim();rec.type=$('#a-type').value;rec.cur=$('#a-cur').value;rec.open=open;
    if(!a)state.accounts.push(rec);
    closeSheet();commit();toast(a?'Compte modifié':'Compte ajouté');
  };
  if(a)$('#a-del').onclick=function(){
    var b=$('#a-del'),n=state.tx.filter(function(x){return x.acc===a.id||x.to===a.id}).length;
    if(!b.classList.contains('armed')){b.classList.add('armed');b.textContent=n?'Supprimer avec '+n+' opération'+(n>1?'s':''):'Confirmer la suppression';return}
    state.tx=state.tx.filter(function(x){return x.acc!==a.id&&x.to!==a.id});
    state.accounts.splice(state.accounts.indexOf(a),1);if(ui.acc===a.id)ui.acc='all';
    closeSheet();commit();toast('Compte supprimé');
  };
}
/* ---------- Plus: thème, export, import, catégories, à propos ---------- */
var themeMode='auto';
function themeName(t){return t==='light'?'clair':t==='dark'?'sombre':'automatique'}
function applyTheme(t){var r=document.documentElement;if(t==='light'||t==='dark')r.setAttribute('data-theme',t);else r.removeAttribute('data-theme')}
function cycleTheme(){
  themeMode=themeMode==='auto'?'light':themeMode==='light'?'dark':'auto';
  applyTheme(themeMode);try{localStorage.setItem('carnet-theme',themeMode)}catch(e){}
  render();toast('Thème '+themeName(themeMode));
}
function viewMore(){
  var items=[['new-acc','Ajouter un compte',''],['accounts','Modifier mes comptes',''],['theme','Thème clair / sombre','Actuel : '+themeName(themeMode)],['export-csv','Exporter (CSV)',''],['export-json','Sauvegarde complète (JSON)',''],['import','Importer',''],['cats','Catégories',''],['about','À propos','']];
  return '<h2 class="page-t">Plus</h2><div class="menu">'+items.map(function(i){
    return '<button type="button" class="menu-btn" data-act="'+i[0]+'"><span>'+i[1]+'</span>'+(i[2]?'<small>'+esc(i[2])+'</small>':'')+'</button>';
  }).join('')+'</div><p class="credit">Créé par Kamel Nasralli · Version '+APP_VERSION+'</p>';
}
function csvCell(v){v=String(v==null?'':v);return /[;"\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function buildCsv(){
  var T={exp:'Dépense',inc:'Revenu',tr:'Virement'};
  var rows=[['Date','Type','Montant','Devise','Compte','Vers le compte','Catégorie','Note']];
  sorted(state.tx).reverse().forEach(function(x){
    var a=accById(x.acc),to=x.to?accById(x.to):null;if(!a)return;
    rows.push([x.date,T[x.type]||x.type,(x.amt/1000).toFixed(3).replace('.',','),a.cur,a.name,to?to.name:'',x.type==='tr'?'':catOf(x.cat).name,x.note||'']);
  });
  return '﻿'+rows.map(function(r){return r.map(csvCell).join(';')}).join('\r\n');
}
async function saveFile(name,data){
  var dl=null;
  try{if(window.claude&&window.claude.use)dl=await window.claude.use('downloads')}catch(e){}
  if(dl){
    try{await dl.save({filename:name,data:data});toast('Fichier prêt : '+name);return}
    catch(e){if(e&&e.code==='declined')return}
  }
  if(!window.claude){
    try{
      var b=new Blob([data],{type:/\.json$/i.test(name)?'application/json':'text/csv;charset=utf-8'}),u=URL.createObjectURL(b),a=document.createElement('a');
      a.href=u;a.download=name;document.body.appendChild(a);a.click();
      setTimeout(function(){a.remove();URL.revokeObjectURL(u)},1500);toast('Fichier prêt : '+name);return;
    }catch(e){}
  }
  textSheet(name,data);
}
function textSheet(name,data){
  openSheet('<h2>'+esc(name)+'</h2><p style="margin:0 0 10px;color:var(--muted)">Le téléchargement n’est pas disponible ici. Copiez ce contenu puis collez-le dans un fichier.</p><textarea class="exp-box" id="x-box" readonly aria-label="Contenu du fichier"></textarea><div class="actions" style="margin-top:12px"><button type="button" class="btn" data-act="close">Fermer</button><button type="button" class="btn primary" id="x-copy">Copier</button></div>');
  var box=$('#x-box');box.value=data.replace(/^﻿/,'');
  $('#x-copy').onclick=function(){
    var done=function(){toast('Contenu copié')},fail=function(){box.focus();box.select();toast('Contenu sélectionné, copiez-le avec le menu')};
    try{navigator.clipboard.writeText(box.value).then(done,fail)}catch(e){fail()}
  };
}
function parseCsv(t){
  var first=t.split('\n')[0],delim=first.split(';').length>=first.split(',').length?';':',';
  var rows=[],row=[],cell='',q=false,i,ch;
  for(i=0;i<t.length;i++){ch=t[i];
    if(q){if(ch==='"'){if(t[i+1]==='"'){cell+='"';i++}else q=false}else cell+=ch}
    else if(ch==='"')q=true;
    else if(ch===delim){row.push(cell);cell=''}
    else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell=''}
    else cell+=ch;
  }
  if(cell!==''||row.length){row.push(cell);rows.push(row)}
  return rows;
}
function importText(txt){
  var t=String(txt).replace(/^﻿/,'').trim();
  if(t[0]==='{'){
    var o;try{o=JSON.parse(t)}catch(e){toast('Fichier JSON invalide.');return}
    var d=o&&o.data&&o.data.accounts?o.data:o;
    if(!d||!Array.isArray(d.accounts)||!Array.isArray(d.tx)){toast('Ce fichier n’est pas une sauvegarde du Carnet de comptes.');return}
    var nd=normalize(d);
    nd.accounts=nd.accounts.filter(function(a){return a&&a.id&&a.name&&typeof a.cur==='string'}).map(function(a){a.id=String(a.id);a.name=String(a.name).slice(0,40);a.bank=String(a.bank||'').slice(0,40);a.open=Number(a.open)||0;if(!/^#[0-9a-f]{3,8}$/i.test(String(a.color||'')))a.color=ACOL[0];return a});
    nd.tx=nd.tx.filter(function(x){return x&&x.id&&typeof x.amt==='number'&&x.amt>0&&/^\d{4}-\d{2}-\d{2}$/.test(String(x.date))&&(x.type==='exp'||x.type==='inc'||x.type==='tr')&&nd.accounts.some(function(a){return a.id===x.acc})});
    openSheet('<h2>Restaurer la sauvegarde ?</h2><p style="margin:0;color:var(--muted)">Vos données actuelles ('+state.accounts.length+' compte'+(state.accounts.length>1?'s':'')+', '+state.tx.length+' opération'+(state.tx.length>1?'s':'')+') seront remplacées par celles du fichier ('+nd.accounts.length+' compte'+(nd.accounts.length>1?'s':'')+', '+nd.tx.length+' opération'+(nd.tx.length>1?'s':'')+').</p><div class="actions" style="margin-top:16px"><button type="button" class="btn" data-act="close">Annuler</button><button type="button" class="btn danger armed" id="i-ok">Remplacer</button></div>');
    $('#i-ok').onclick=function(){nd.demo=false;state=nd;ui.acc='all';closeSheet();commit();toast('Sauvegarde restaurée')};
    return;
  }
  importCsv(t);
}
function importCsv(t){
  var rows=parseCsv(t);if(rows.length<2){toast('Fichier vide ou format non reconnu.');return}
  var hd=rows[0].map(function(h){return String(h).trim().toLowerCase()});
  function col(names,def){for(var i=0;i<names.length;i++){var k=hd.indexOf(names[i]);if(k>=0)return k}return def}
  if(hd.indexOf('date')<0||hd.indexOf('montant')<0){toast('Format non reconnu. Utilisez un fichier exporté depuis ce carnet.');return}
  var iCu=col(['devise','monnaie'],3),iD=col(['date'],0),iT=col(['type'],1),iA=col(['montant'],2),iC=col(['compte'],4),iV=col(['vers le compte'],5),iK=col(['catégorie','categorie'],6),iN=col(['note'],7);
  var TM={'dépense':'exp','depense':'exp','revenu':'inc','virement':'tr'};
  var byName=function(n){n=String(n||'').trim().toLowerCase();return state.accounts.filter(function(a){return a.name.toLowerCase()===n})[0]};
  function key(x){return [x.date,x.type,x.amt,x.acc,x.to||'',x.cat||'',x.note||''].join('|')}
  var seen={};state.tx.forEach(function(x){seen[key(x)]=1});
  var ok=0,skip=0,made=0;
  rows.slice(1).forEach(function(r){
    if(!r.join('').trim())return;
    var date=String(r[iD]||'').trim(),m=date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(m)date=m[3]+'-'+m[2]+'-'+m[1];
    var type=TM[String(r[iT]||'').trim().toLowerCase()],amt=parseAmount(r[iA]);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!type||!(amt>0)){skip++;return}
    var cu=String(r[iCu]||'').trim().toUpperCase();if(cu==='DT'||cu==='TND')cu='TND';else if(cu==='€')cu='EUR';else if(cu==='$')cu='USD';
    if(['TND','EUR','USD'].indexOf(cu)<0)cu='TND';
    var an=String(r[iC]||'').trim().slice(0,40);if(!an){skip++;return}
    if(state.demo){state.accounts=[];state.tx=[];state.cats=state.cats||[];state.budget=null;state.demo=false;seen={};made=made||0}
    var acc=byName(an);
    if(!acc){acc={id:uid(),name:an,bank:'',type:'courant',cur:cu,open:0,color:ACOL[state.accounts.length%ACOL.length]};state.accounts.push(acc);made++}
    var tn=String(r[iV]||'').trim().slice(0,40),to=null;
    if(type==='tr'){
      if(!tn||tn.toLowerCase()===an.toLowerCase()){skip++;return}
      to=byName(tn);
      if(!to){to={id:uid(),name:tn,bank:'',type:'courant',cur:acc.cur,open:0,color:ACOL[state.accounts.length%ACOL.length]};state.accounts.push(to);made++}
      if(to.cur!==acc.cur){skip++;return}
    }
    var cat=null;
    if(type!=='tr'){
      var nm=String(r[iK]||'').trim().replace(/\s+/g,' ').slice(0,30);
      var f=nm?catList(type).filter(function(c){return c[1].toLowerCase()===nm.toLowerCase()})[0]:null;
      if(f)cat=f[0];
      else if(nm){state.cats=state.cats||[];var rec={id:uid(),name:nm,kind:type,c:state.cats.filter(function(c){return c.kind===type}).length%8+1};state.cats.push(rec);cat=rec.id}
      else cat=type==='inc'?'oinc':'oth';
    }
    var x={id:uid(),type:type,amt:amt,acc:acc.id,date:date,note:String(r[iN]||'').trim().slice(0,80),cat:cat};
    if(to)x.to=to.id;
    if(seen[key(x)]){skip++;return}
    state.tx.push(x);ok++;
  });
  if(ok||made)commit();
  toast(ok?ok+' opération'+(ok>1?'s importées':' importée')+(made?', '+made+' compte'+(made>1?'s créés':' créé'):'')+(skip?', '+skip+' ignorée'+(skip>1?'s':'')+' (compte inconnu, doublon ou ligne invalide)':''):'Rien à importer. '+skip+' ligne'+(skip>1?'s ignorées':' ignorée')+' (compte inconnu, doublon ou ligne invalide).');
}
function catSheet(kind){
  kind=kind||'exp';var editId=null,armId=null,msg='';
  function paint(){
    var cs=(state.cats||[]).filter(function(c){return c.kind===kind}).sort(function(x,y){return abc(x.name,y.name)});
    var have=catList(kind).map(function(c){return c[1].toLowerCase()});
    var sg=(SUGG[kind]||[]).filter(function(n){return have.indexOf(n.toLowerCase())<0}).sort(abc);
    var mine=cs.map(function(c){
      return c.id===editId
        ?'<div class="mrow" data-id="'+esc(c.id)+'"><input maxlength="30" value="'+esc(c.name)+'" aria-label="Nouveau nom"><button type="button" class="ibtn ok" data-cs="save" data-id="'+esc(c.id)+'" aria-label="Enregistrer le nom">✓</button><button type="button" class="ibtn" data-cs="cancel" aria-label="Annuler">×</button></div>'
        :'<div class="mrow" data-id="'+esc(c.id)+'"><span class="nm"><i style="display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:8px;background:'+catOf(c.id).color+'"></i>'+esc(c.name)+'</span><button type="button" class="ibtn" data-cs="ren" data-id="'+esc(c.id)+'" aria-label="Renommer '+esc(c.name)+'" title="Renommer">'+PEN+'</button><button type="button" class="ibtn'+(armId===c.id?' arm':'')+'" data-cs="del" data-id="'+esc(c.id)+'" aria-label="Supprimer '+esc(c.name)+'" title="Supprimer">'+BIN+'</button></div>';
    }).join('');
    var built=(kind==='inc'?INC:EXP).slice().sort(function(x,y){return ((x[0]==='oth'||x[0]==='oinc')-(y[0]==='oth'||y[0]==='oinc'))||abc(x[1],y[1])}).map(function(c){return '<div class="mrow" style="grid-template-columns:minmax(0,1fr)"><span class="nm"><i style="display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:8px;background:'+catOf(c[0]).color+'"></i>'+esc(c[1])+'</span></div>'}).join('');
    $('#sheet').innerHTML='<h2>Catégories</h2><div class="seg" style="margin-bottom:14px"><button type="button" data-cs="kind" data-k="exp" aria-pressed="'+(kind==='exp')+'">Dépenses</button><button type="button" data-cs="kind" data-k="inc" aria-pressed="'+(kind==='inc')+'">Revenus</button></div>'+
    '<div class="field" style="margin-top:0"><label for="cs-new">Nouvelle catégorie</label><div class="rw2"><input id="cs-new" maxlength="30" autocomplete="off" placeholder="Ex. Essence"><button type="button" class="btn primary" data-cs="add">Ajouter</button></div></div>'+
    (sg.length?'<div class="sug" style="margin-top:8px">'+sg.map(function(n){return '<button type="button" data-cs="sug" data-n="'+esc(n)+'">+ '+esc(n)+'</button>'}).join('')+'</div>':'')+
    '<p class="err" role="alert">'+esc(msg)+'</p>'+
    '<p class="eyebrow" style="margin:4px 0">Vos catégories</p>'+(cs.length?'<div class="mine">'+mine+'</div>':'<p style="color:var(--muted);margin:0 0 6px">Aucune pour le moment.</p>')+
    '<p class="eyebrow" style="margin:14px 0 4px">Par défaut</p><div class="mine">'+built+'</div>'+
    '<div class="actions" style="margin-top:16px"><button type="button" class="btn primary" data-act="close">Terminé</button></div>';
  }
  openSheet('');paint();
  $('#sheet').onkeydown=function(e){if(e.key==='Enter'&&e.target.id==='cs-new'){e.preventDefault();var b=$('#sheet [data-cs="add"]');if(b)b.click()}};
  $('#sheet').onclick=function(e){
    var b=e.target.closest('[data-cs]');if(!b)return;var a=b.dataset.cs,id=b.dataset.id;
    if(a==='kind'){kind=b.dataset.k;editId=armId=null;msg='';paint();return}
    if(a==='add'||a==='sug'){
      var name=String(a==='sug'?b.dataset.n:$('#cs-new').value).trim().replace(/\s+/g,' ');
      if(!name){msg='Saisissez un nom de catégorie.';paint();return}
      if(catList(kind).some(function(c){return c[1].toLowerCase()===name.toLowerCase()})){msg='Cette catégorie existe déjà.';paint();return}
      state.cats=state.cats||[];
      state.cats.push({id:uid(),name:name,kind:kind,c:state.cats.filter(function(c){return c.kind===kind}).length%8+1});
      msg='';commit();paint();toast('Catégorie ajoutée : '+name);return;
    }
    var c=(state.cats||[]).filter(function(x){return x.id===id})[0];
    if(a==='cancel'){editId=null;msg='';paint();return}
    if(!c)return;
    if(a==='ren'){editId=id;armId=null;msg='';paint();var i=$('#sheet .mrow input');if(i){i.focus();i.select()}}
    else if(a==='save'){
      var nm=b.closest('.mrow').querySelector('input').value.trim().replace(/\s+/g,' ');
      if(!nm){msg='Le nom ne peut pas être vide.';paint();return}
      if(catList(kind).some(function(x){return x[0]!==id&&x[1].toLowerCase()===nm.toLowerCase()})){msg='Une catégorie porte déjà ce nom.';paint();return}
      c.name=nm;editId=null;msg='';commit();paint();toast('Catégorie renommée');
    }else if(a==='del'){
      if(armId!==id){armId=id;msg='Touchez encore la corbeille pour confirmer.';paint();return}
      var fb=kind==='inc'?'oinc':'oth',n=0;
      state.tx.forEach(function(x){if(x.cat===id){x.cat=fb;n++}});
      state.cats=state.cats.filter(function(x){return x.id!==id});
      armId=null;msg='';commit();paint();
      toast(n?'Catégorie supprimée. '+n+' opération'+(n>1?'s passent':' passe')+' en « Autres ».':'Catégorie supprimée');
    }
  };
}
function importSheet(){
  openSheet('<h2>Importer</h2><p style="margin:0 0 12px;color:var(--muted)">Choisissez une sauvegarde JSON ou un fichier CSV exporté depuis ce carnet. Si le choix de fichier ne s’ouvre pas, collez le contenu dans la zone ci-dessous.</p>'+
  '<div class="field" style="margin-top:0"><label for="imp-file">Fichier</label><input type="file" id="imp-file" accept=".json,.csv,application/json,text/csv,text/plain"></div>'+
  '<div class="field"><label for="imp-text">Ou collez le contenu</label><textarea id="imp-text" class="exp-box" spellcheck="false" placeholder="Collez ici le contenu d’un fichier JSON ou CSV"></textarea></div>'+
  '<p class="err" id="imp-err" role="alert"></p><div class="actions"><button type="button" class="btn" data-act="close">Annuler</button><button type="button" class="btn primary" id="imp-go">Importer</button></div>');
  var err=$('#imp-err');
  function run(txt){
    if(!String(txt||'').trim()){err.textContent='Rien à importer : choisissez un fichier ou collez son contenu.';return}
    closeSheet(true);importText(txt);
  }
  $('#imp-file').onchange=function(){
    var f=this.files&&this.files[0];if(!f)return;
    var rd=new FileReader();
    rd.onload=function(){run(String(rd.result||''))};
    rd.onerror=function(){err.textContent='Lecture du fichier impossible. Collez son contenu dans la zone ci-dessous.'};
    try{rd.readAsText(f)}catch(e){rd.onerror()}
  };
  $('#imp-go').onclick=function(){run($('#imp-text').value)};
}
function accountsSheet(){
  reopen=accountsSheet;
  var bal=balances();
  var rows=state.accounts.map(function(a){
    return '<div class="acc-wrap"><div class="row"><span class="mono-chip" style="background:'+esc(a.color||ACOL[0])+'">'+esc(initials(a.bank||a.name))+'</span><span style="min-width:0"><div class="t">'+esc(a.name)+'</div><div class="s">'+esc(a.bank||'')+' · '+esc(TYPES[a.type]||'')+'</div></span><span class="amt">'+money(bal[a.id],a.cur)+'</span></div><button type="button" class="ibtn" data-act="edit-acc" data-id="'+esc(a.id)+'" aria-label="Modifier '+esc(a.name)+'" title="Modifier">'+PEN+'</button><button type="button" class="ibtn" data-act="del-acc" data-id="'+esc(a.id)+'" aria-label="Supprimer '+esc(a.name)+'" title="Supprimer">'+BIN+'</button></div>';
  }).join('');
  openSheet('<h2>Mes comptes</h2>'+(rows?'<div class="panel" style="padding:0 12px">'+rows+'</div>':'<div class="empty" style="padding:20px 0"><p style="margin:0 auto">Aucun compte pour le moment.</p></div>')+'<div class="actions" style="margin-top:16px"><button type="button" class="btn" data-act="close-all">Fermer</button><button type="button" class="btn primary" data-act="new-acc">Ajouter un compte</button></div>');
}
function aboutSheet(){
  openSheet('<h2>À propos</h2><p style="margin:0 0 10px">Carnet de comptes suit vos comptes bancaires, vos dépenses et vos revenus, en dinars tunisiens (trois décimales), en euros ou en dollars.</p><p style="margin:0 0 10px;color:var(--muted)">Vos données sont enregistrées sur votre compte lorsque c’est possible, sinon dans ce navigateur. La sauvegarde complète (JSON) vous permet d’en garder une copie.</p><p style="margin:0 0 4px;color:var(--muted)">Version '+APP_VERSION+'</p><p style="margin:0">Créé par Kamel Nasralli</p><div class="actions" style="margin-top:16px"><button type="button" class="btn primary" data-act="close">Fermer</button></div>');
}
function delAccSheet(id){
  var a=accById(id);if(!a)return;
  var n=state.tx.filter(function(x){return x.acc===a.id||x.to===a.id}).length;
  openSheet('<h2>Supprimer ce compte ?</h2><p style="margin:0;color:var(--muted)"><b style="color:var(--ink)">'+esc(a.name)+'</b>'+(n?' et ses '+n+' opération'+(n>1?'s':'')+' seront supprimés définitivement.':' sera supprimé définitivement.')+'</p><div class="actions" style="margin-top:16px"><button type="button" class="btn" data-act="close">Annuler</button><button type="button" class="btn danger armed" id="d-ok">Supprimer</button></div>');
  $('#d-ok').onclick=function(){
    state.tx=state.tx.filter(function(x){return x.acc!==a.id&&x.to!==a.id});
    state.accounts.splice(state.accounts.indexOf(a),1);if(ui.acc===a.id)ui.acc='all';
    closeSheet();commit();toast('Compte supprimé');
  };
}
function budgetSheet(){
  openSheet('<h2>Budget mensuel</h2><p style="margin:0;color:var(--muted)">Plafond de dépenses par mois, calculé sur la devise de votre premier compte.</p>'+
  '<div class="field"><label for="b-amt">Montant</label><div class="amount"><input id="b-amt" inputmode="decimal" autocomplete="off" placeholder="1 800,000" value="'+esc(state.budget?amtInput(state.budget):'')+'"><span>'+esc(homeCur())+'</span></div></div>'+
  '<p class="err" id="b-err" role="alert"></p><div class="actions">'+(state.budget?'<button type="button" class="btn danger" id="b-clear">Retirer</button>':'')+'<button type="button" class="btn" data-act="close">Annuler</button><button type="button" class="btn primary" id="b-save">Enregistrer</button></div>');
  $('#b-save').onclick=function(){var v=parseAmount($('#b-amt').value);if(!(v>0)){$('#b-err').textContent='Saisissez un montant supérieur à zéro.';return}state.budget=v;closeSheet();commit();toast('Budget enregistré')};
  if(state.budget)$('#b-clear').onclick=function(){state.budget=null;closeSheet();commit();toast('Budget retiré')};
}

/* ---------- events ---------- */
document.addEventListener('click',function(e){
  var tab=e.target.closest('.tab');if(tab){ui.tab=tab.dataset.tab;render();window.scrollTo(0,0);return}
  if(e.target.closest('#addBtn')){txSheet();return}
  if(e.target.id==='scrim'){closeSheet(true);return}
  var el=e.target.closest('[data-act]');if(!el)return;var act=el.dataset.act,id=el.dataset.id;
  if(act==='close')closeSheet();
  else if(act==='tab'){ui.tab=el.dataset.tab;render();window.scrollTo(0,0)}
  else if(act==='tx')txSheet(id);
  else if(act==='new-acc')accSheet();
  else if(act==='edit-acc')accSheet(id);
  else if(act==='del-acc')delAccSheet(id);
  else if(act==='theme')cycleTheme();
  else if(act==='export-csv'){if(!state.tx.length){toast('Aucune opération à exporter.');return}saveFile('operations-'+todayIso()+'.csv',buildCsv())}
  else if(act==='export-json')saveFile('carnet-de-comptes-'+todayIso()+'.json',JSON.stringify({app:'carnet-de-comptes',version:1,exportedAt:new Date().toISOString(),data:state},null,2));
  else if(act==='import')importSheet();
  else if(act==='cats')catSheet();
  else if(act==='accounts')accountsSheet();
  else if(act==='rf-period')pickPeriod();
  else if(act==='rf-accs')pickAccs();
  else if(act==='rf-cats')pickCats();
  else if(act==='rf-type'){ui.rc.type=id;render()}
  else if(act==='rf-cur'){ui.rc.cur=id;render()}
  else if(act==='rf-reset'){ui.rc={period:'m3',from:'',to:'',accs:[],cats:[],type:'all',cur:null};render()}
  else if(act==='close-all')closeSheet(true);
  else if(act==='about')aboutSheet();
  else if(act==='acc-ops'){ui.acc=id;ui.tab='ops';ui.month=todayIso().slice(0,7);render();window.scrollTo(0,0)}
  else if(act==='acc-filter'){ui.acc=id;render()}
  else if(act==='month'){var n=addMonths(ui.month,Number(el.dataset.d));if(n<=todayIso().slice(0,7)){ui.month=n;render()}}
  else if(act==='kind'){ui.kind=id;render()}
  else if(act==='stat-cur'){ui.cur=id;render()}
  else if(act==='budget')budgetSheet();
  else if(act==='clear-demo'){state={v:1,demo:false,budget:null,cats:[],accounts:[],tx:[]};ui.acc='all';commit();toast('Exemples effacés')}
});
document.addEventListener('change',function(e){
  if(e.target.id!=='imp')return;
  var f=e.target.files&&e.target.files[0];if(!f)return;
  var rd=new FileReader();
  rd.onload=function(){importText(String(rd.result||''))};
  rd.onerror=function(){toast('Lecture du fichier impossible.')};
  rd.readAsText(f);e.target.value='';
});
document.addEventListener('input',function(e){if(e.target.id==='q'){ui.q=e.target.value;$('#oplist').innerHTML=opsList()}});
window.addEventListener('resize',function(){clearTimeout(window.__rz);window.__rz=setTimeout(drawCharts,120)});
document.addEventListener('pointerdown',function(e){if(!e.target.closest('.host'))hideTip()});
try{
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){drawCharts()});
  new MutationObserver(function(){drawCharts()}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
}catch(e){}
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('#scrim').hidden)closeSheet(true)});

/* ---------- start ---------- */
$('#today').textContent=new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
try{themeMode=localStorage.getItem('carnet-theme')||'auto'}catch(e){}
applyTheme(themeMode);
state=loadLocal()||demo();
render();
initStorage();
})();
