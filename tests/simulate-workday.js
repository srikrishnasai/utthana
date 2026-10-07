// Simulates a workday minute by minute against background.js with a mocked Chrome API.
// Run: node tests/simulate-workday.js
const path=require('path'); const ROOT=path.join(__dirname,'..');
const fs=require('fs'); const store={}; const log=[];
global.importScripts=(f)=>{ eval.call(global, fs.readFileSync(path.join(ROOT,f),'utf8').replace('const ACTIVITIES','global.ACTIVITIES').replace('function availableActivities','global.availableActivities = function')); };
const L={}; const ev=n=>({addListener(f){(L[n]=L[n]||[]).push(f)}});
let idle='active', meetingTabs=[], fakeNow=new Date(2026,9,7,10,0,0).getTime();
const RealDate=Date; global.Date=class extends RealDate{constructor(...a){super(...(a.length?a:[fakeNow]))} static now(){return fakeNow}};
let winId=0;
global.chrome={runtime:{getURL:p=>p,onInstalled:ev('inst'),onStartup:ev('start'),onMessage:ev('msg')},
 storage:{local:{get:async k=>{const o={};[].concat(k).forEach(x=>{if(x in store)o[x]=JSON.parse(JSON.stringify(store[x]))});return o},set:async o=>Object.assign(store,JSON.parse(JSON.stringify(o))),remove:async k=>{delete store[k]}},onChanged:ev('chg')},
 alarms:{onAlarm:ev('alarm'),clear(){},create(){}},notifications:{onClicked:ev('nc'),onButtonClicked:ev('nb'),create:(id,o)=>log.push(`${new Date().toTimeString().slice(0,5)} NOTIFY ${o.title}`)},
 idle:{queryState:async()=>idle}, tabs:{query:async()=>meetingTabs, update:async()=>{}},
 permissions:{contains:async()=>true},
 scripting:{getRegisteredContentScripts:async()=>[],unregisterContentScripts:async()=>{},registerContentScripts:async()=>{}},
 windows:{get:async()=>null,getLastFocused:async()=>({left:0,top:0,width:1400,height:900,state:'normal'}),update:async()=>{},create:async o=>{log.push(`${new Date().toTimeString().slice(0,5)} WINDOW ${o.url}`);return{id:++winId}},onRemoved:ev('wr')}};
eval(fs.readFileSync(path.join(ROOT,'background.js'),'utf8'));
const msg=(m)=>new Promise(r=>L.msg[0](m,{},r));
(async()=>{
 await L.inst[0]();
 async function tick(n=1){ for(let i=0;i<n;i++){ fakeNow+=60000; await L.alarm[0]({name:'tick'}); await new Promise(r=>setTimeout(r,5)); } }
 await tick(20);                     // 10:20 micro due
 await tick(25);                     // 10:45
 meetingTabs=[{url:'https://meet.google.com/abc-defg-hij'}];
 await tick(10);                     // 10:55 move due during meeting -> deferred
 meetingTabs=[];
 await tick(1);                      // meeting ends -> show move (meeting)
 await msg({type:'breakDone',activity:'water',kind:'move'});
 idle='idle'; await tick(6); idle='active'; // away 6 min -> natural break
 await tick(30);
 fakeNow=new RealDate(2026,9,7,12,59,0).getTime(); await tick(2);   // lunch
 fakeNow=new RealDate(2026,9,7,18,29,0).getTime(); await tick(2);   // wrap-up
 console.log(log.join('\n'));
 console.log('stats', JSON.stringify(store.stats));
})();
