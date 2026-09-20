/* Shared data, search, persistence and safe HTML utilities. No runtime dependencies. */
(() => {
  'use strict';
  const data = JSON.parse(document.getElementById('archive-data').textContent);
  const sectors = data.sectors;
  const industries = sectors.flatMap(s => s.industries.map(i => ({...i, sectorId:s.id})));
  const companies = industries.flatMap(i => i.companies.map(c => ({...c, industryId:i.id, sectorId:i.sectorId})));
  const sectorMap = new Map(sectors.map(s=>[s.id,s]));
  const industryMap = new Map(industries.map(i=>[i.id,i]));
  const companyMap = new Map(companies.map(c=>[c.ticker,c]));
  const knownKeys = new Set([...sectors.map(s=>'sector:'+s.id),...industries.map(i=>'industry:'+i.id),...companies.map(c=>'company:'+c.ticker)]);
  const storageKey = 'mm-industry-archive-v1';
  const defaults = () => ({version:1,bookmarks:[],completed:[],notes:{},theme:'light',recent:null});
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function safeUrl(url, relative=false) {
    if (typeof url !== 'string' || /[\u0000-\u001f]/.test(url)) return '#';
    try { const u = new URL(url, 'https://archive.invalid/'); if (!['https:','http:'].includes(u.protocol)) return '#'; if(!relative && !/^https?:\/\//i.test(url)) return '#'; return url; } catch { return '#'; }
  }
  function validateImport(input) {
    if (!input || typeof input!=='object' || input.version!==1 || !Array.isArray(input.bookmarks) || !Array.isArray(input.completed) || !input.notes || typeof input.notes!=='object' || Array.isArray(input.notes)) throw new Error('이 아카이브에서 내보낸 버전 1 학습 기록 파일을 선택해주세요.');
    if (input.bookmarks.length>2000 || input.completed.length>2000 || Object.keys(input.notes).length>2000) throw new Error('학습 기록의 항목 수가 허용 범위를 초과했습니다.');
    if (input.bookmarks.some(k=>typeof k!=='string') || input.completed.some(k=>typeof k!=='string')) throw new Error('즐겨찾기 또는 진도 형식이 올바르지 않습니다.');
    const out={version:1,bookmarks:[...new Set(input.bookmarks.filter(k=>knownKeys.has(k)))],completed:[...new Set(input.completed.filter(k=>industryMap.has(k)))],notes:{}};
    for(const [key,value] of Object.entries(input.notes)) {
      if (!knownKeys.has(key)) continue;
      if(!value || typeof value.text!=='string' || value.text.length>20000 || typeof value.updatedAt!=='string' || !Number.isFinite(Date.parse(value.updatedAt))) throw new Error('메모 형식이 올바르지 않습니다.');
      out.notes[key]={text:value.text,updatedAt:value.updatedAt};
    }
    return out;
  }
  let storageAvailable=true, state=defaults();
  try { const raw=localStorage.getItem(storageKey); if(raw){const parsed=JSON.parse(raw);state={...state,...validateImport(parsed),theme:parsed.theme==='dark'?'dark':'light',recent:typeof parsed.recent==='string'&&industryMap.has(parsed.recent)?parsed.recent:null};} } catch { storageAvailable=false; }
  let toastTimer;
  function toast(msg){ const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3200); }
  function persist(){try{localStorage.setItem(storageKey,JSON.stringify(state));storageAvailable=true;return true;}catch{storageAvailable=false;toast('브라우저 저장을 사용할 수 없습니다. 서재에서 기록을 내보내 보관하세요.');return false;}}
  function toggleBookmark(key){if(!knownKeys.has(key))return;state.bookmarks=state.bookmarks.includes(key)?state.bookmarks.filter(k=>k!==key):[...state.bookmarks,key];persist();}
  function toggleComplete(id){if(!industryMap.has(id))return;state.completed=state.completed.includes(id)?state.completed.filter(k=>k!==id):[...state.completed,id];persist();}
  function saveNote(key,text){if(!knownKeys.has(key))return false;if(text.trim())state.notes[key]={text:text.slice(0,20000),updatedAt:new Date().toISOString()};else delete state.notes[key];return persist();}
  function mergeImport(input,overwrite=false){const next=validateImport(input);state.bookmarks=[...new Set([...state.bookmarks,...next.bookmarks])];state.completed=[...new Set([...state.completed,...next.completed])];let kept=0;for(const [key,note]of Object.entries(next.notes)){if(state.notes[key]&&!overwrite){kept++;continue;}state.notes[key]=note;}persist();return kept;}
  function download(name,content,type='application/json'){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const searchIndex=[...sectors.map(s=>({type:'섹터',name:s.name,sub:s.en+' · '+s.summary,url:'#/sector/'+s.id,hay:[s.name,s.en,s.summary,s.concept].join(' ')})),...industries.map(i=>({type:'세부 산업',name:i.name,sub:sectorMap.get(i.sectorId).name+' · '+i.summary,url:'#/industry/'+i.id,hay:[i.name,i.en,i.summary,...i.kpis.flatMap(k=>[k.name,k.meaning])].join(' ')})),...companies.map(c=>({type:'기업',name:c.ticker+' · '+c.name,sub:industryMap.get(c.industryId).name+' · '+c.business,url:'#/company/'+encodeURIComponent(c.ticker),hay:[c.ticker,c.name,c.business,c.watch,data.profiles?.[c.ticker]?.oneLiner||'',data.profiles?.[c.ticker]?.businessModel||''].join(' ')})),...data.context.glossary.map(g=>({type:'용어',name:g.term,sub:g.meaning,url:'#/glossary?q='+encodeURIComponent(g.term),hay:[g.term,g.en,g.meaning].join(' ')}))].map(r=>({...r,hay:r.hay.toLocaleLowerCase()}));
  const search = query => { const q=query.trim().toLocaleLowerCase();if(!q)return[];const parts=q.split(/\s+/);return searchIndex.filter(r=>parts.every(p=>r.hay.includes(p))).sort((a,b)=>Number(b.name.toLocaleLowerCase().startsWith(q))-Number(a.name.toLocaleLowerCase().startsWith(q))); };
  const dateLabel=iso=>{const d=new Date(iso);return Number.isFinite(d.getTime())?d.toLocaleDateString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit'}):'';};
  function keyInfo(key){const [type,id]=key.split(':');if(type==='sector'){const s=sectorMap.get(id);return s?{name:s.name,sub:s.en,url:'#/sector/'+id,type:'섹터'}:null;}if(type==='industry'){const i=industryMap.get(id);return i?{name:i.name,sub:sectorMap.get(i.sectorId).name,url:'#/industry/'+id,type:'세부 산업'}:null;}if(type==='company'){const c=companyMap.get(id);return c?{name:c.ticker+' · '+c.name,sub:industryMap.get(c.industryId).name,url:'#/company/'+encodeURIComponent(c.ticker),type:'기업'}:null;}return null;}
  window.IA={data,sectors,industries,companies,sectorMap,industryMap,companyMap,knownKeys,state,esc,safeUrl,toast,persist,toggleBookmark,toggleComplete,saveNote,validateImport,mergeImport,download,search,dateLabel,keyInfo,isPersistent:()=>storageAvailable};
})();
