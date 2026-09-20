/* Data integration and record portability checks; no packages required. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const order=['communication','consumer-discretionary','consumer-staples','energy','financials','real-estate','health-care','industrials','materials','technology','utilities'];
const data={context:JSON.parse(fs.readFileSync(path.join(root,'data/context.json'),'utf8')),sectors:order.map(id=>JSON.parse(fs.readFileSync(path.join(root,'data/sectors',id+'.json'),'utf8')))};
data.profiles=Object.fromEntries(fs.readdirSync(path.join(root,'data/companies')).filter(f=>f.endsWith('.json')).map(f=>[f.slice(0,-5),JSON.parse(fs.readFileSync(path.join(root,'data/companies',f),'utf8'))]));
data.financials=JSON.parse(fs.readFileSync(path.join(root,'data/financials.json'),'utf8'));
data.updateStatus=JSON.parse(fs.readFileSync(path.join(root,'data/update-status.json'),'utf8'));
function boot(saved=null,unavailable=false){
  const memory=new Map(saved?[['mm-industry-archive-v1',JSON.stringify(saved)]]:[]);
  const doc={getElementById:id=>id==='archive-data'?{textContent:JSON.stringify(data)}:{textContent:'',classList:{add(){},remove(){}}}};
  const sandbox={document:doc,window:{addEventListener(){}},URL,URLSearchParams,Map,Set,Date,Blob,console,setTimeout:()=>0,clearTimeout(){},localStorage:{getItem:k=>{if(unavailable)throw Error('blocked');return memory.get(k);},setItem:(k,v)=>{if(unavailable)throw Error('blocked');memory.set(k,v);}}};
  vm.createContext(sandbox);
  for(const name of ['core','views','navigation','treemap','company'])vm.runInContext(fs.readFileSync(path.join(root,'src/js',name+'.js'),'utf8'),sandbox);
  return {A:sandbox.window.IA,memory};
}
test('all requested sectors, industries and companies produce navigable views',()=>{
  const {A}=boot();assert.equal(A.sectors.length,11);assert.equal(A.industries.length,58);assert.equal(A.companies.length,206);
  const pages=[A.views.overview(),A.views.connections(),A.views.glossary(),A.views.library(),A.views.sources(),A.views.updates(),...A.sectors.map(s=>A.views.sector(s.id)),...A.industries.map(i=>A.views.industry(i.id)),...A.companies.map(c=>A.views.company(c.ticker))];
  for(const html of pages){assert.ok(html.includes('<h1>'));assert.ok(!html.includes('undefined'));}
  for(const c of A.companies){assert.ok(A.industryMap.has(c.industryId));assert.ok(A.knownKeys.has('company:'+c.ticker));assert.ok(A.views.industry(c.industryId).includes(`id="company-${c.ticker}"`));}
});
test('every company has complete sourced research and financial periods',()=>{
  const {A}=boot();
  for(const c of A.companies){const p=data.profiles[c.ticker],f=data.financials.companies[c.ticker];assert.ok(p,c.ticker+' research');for(const key of ['revenueStreams','history','strengths','weaknesses','competitors','monitoring','sources'])assert.ok(p[key].length>=2,c.ticker+' '+key);assert.ok(f?.annual.length,c.ticker+' annual financials');assert.ok(f.annual.at(-1).metrics.revenue,c.ticker+' revenue');assert.ok(A.views.company(c.ticker).includes('company-history'));}
});
test('map preserves weighted areas, has no overlaps and offers a readable list',()=>{
  const {A}=boot(),items=[1,2,3,4,5].map(weight=>({weight})),rects=A.map.partition(items,0,0,1200,800);assert.equal(rects.length,5);
  for(const r of rects){assert.ok(r.w>0&&r.h>0);assert.ok(Math.abs(r.w*r.h/(1200*800)-r.item.weight/15)<1e-9);assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=1200.001&&r.y+r.h<=800.001);}
  for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],b=rects[j];assert.ok(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)<1e-7||Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)<1e-7);}
  const html=A.views.overview('all',new URLSearchParams('sector=technology&view=list'));assert.ok(html.includes('NVDA'));assert.ok(!html.includes('data-map-company="JPM"'));assert.ok(!html.includes('MY LEARNING'));assert.ok(!html.includes('MM_1.-Daily-News'));
});
test('search finds Korean industries, case-insensitive tickers, concepts and unique results',()=>{
  const {A}=boot();assert.ok(A.search('반도체').some(r=>r.type==='세부 산업'));assert.ok(A.search('jpm').some(r=>r.name.startsWith('JPM')));assert.ok(A.search('현금흐름').length);assert.equal(A.search('unmatchable-xyz-445').length,0);
  assert.equal(new Set(A.companies.map(c=>c.ticker)).size,A.companies.length);
});
test('bookmarks, completion and escaped multiline notes survive a fresh session',()=>{
  const {A,memory}=boot();const id=A.industries[0].id,key='industry:'+id;const text='첫 번째 관찰\n</textarea><img src=x onerror=alert(1)>';
  A.toggleBookmark(key);A.toggleComplete(id);A.saveNote(key,text);
  const restored=boot(JSON.parse(memory.get('mm-industry-archive-v1'))).A;
  assert.ok(restored.state.bookmarks.includes(key));assert.ok(restored.state.completed.includes(id));assert.equal(restored.state.notes[key].text,text);
  const html=restored.views.industry(id);assert.ok(html.includes('&lt;/textarea&gt;'));assert.ok(!html.includes('<img src=x'));
});
test('import merges records, preserves existing notes by default, and supports explicit overwrite',()=>{
  const {A}=boot();const id=A.industries[0].id,key='industry:'+id;A.saveNote(key,'current device note');
  const incoming={version:1,bookmarks:[key,key,'company:REMOVED'],completed:[id,id,'unknown'],notes:{[key]:{text:'imported note',updatedAt:'2026-09-20T00:00:00Z'}}};
  assert.equal(A.mergeImport(incoming),1);assert.equal(A.state.notes[key].text,'current device note');assert.equal(A.state.bookmarks.length,1);assert.equal(A.state.completed.length,1);
  A.mergeImport(incoming,true);assert.equal(A.state.notes[key].text,'imported note');
});
test('malformed imports cannot replace notes or inject prototype keys',()=>{
  const {A}=boot();const key='industry:'+A.industries[0].id;A.saveNote(key,'keep me');
  assert.throws(()=>A.mergeImport({version:2,bookmarks:[],completed:[],notes:{}}));
  assert.throws(()=>A.mergeImport({version:1,bookmarks:[],completed:[],notes:{[key]:{text:[],updatedAt:'yesterday'}}}));
  const crafted=JSON.parse('{"version":1,"bookmarks":[],"completed":[],"notes":{"__proto__":{"text":"bad","updatedAt":"2026-09-20"}}}');
  assert.equal(Object.keys(A.validateImport(crafted).notes).length,0);assert.equal(A.state.notes[key].text,'keep me');
  assert.equal(A.safeUrl('javascript:alert(1)',true),'#');assert.equal(A.safeUrl('data:text/html,bad',true),'#');assert.equal(A.safeUrl('../MM_1.-Daily-News/index.html',true),'../MM_1.-Daily-News/index.html');
});
test('blocked browser storage still supports temporary records and exportable state',()=>{
  const {A}=boot(null,true);const key='industry:'+A.industries[0].id;A.saveNote(key,'temporary');assert.equal(A.isPersistent(),false);assert.equal(A.state.notes[key].text,'temporary');assert.ok(A.views.library().includes('영구 저장'));
});
test('committed HTML embeds content, scripts and font without runtime network dependencies',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.ok(html.includes('data:font/woff2;base64,'));assert.ok(html.includes('id="archive-data"'));assert.ok(!/<script[^>]+src=/.test(html));assert.ok(!/<link[^>]+rel="stylesheet"/.test(html));assert.ok(!html.includes('<!--@'));assert.ok(html.includes('Vivmark Residential'));
});
