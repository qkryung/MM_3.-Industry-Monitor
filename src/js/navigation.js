/* Sector directory: visual hierarchy and session-only expansion state. */
(() => {
  'use strict';
  const A=window.IA,e=A.esc,expanded=new Set();
  let previousSector=null;
  const icons={
    communication:'<path d="M20 11a8 8 0 0 1-8 8H5l-3 3V11a9 9 0 0 1 18 0Z"/><path d="M7 9h8M7 13h5"/>',
    'consumer-discretionary':'<path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
    'consumer-staples':'<path d="m3 10 2 10h14l2-10H3ZM7 10l3-7m7 7-3-7M9 14v3m6-3v3"/>',
    energy:'<path d="m13 2-9 12h7l-1 8 10-13h-8l1-7Z"/>',
    financials:'<path d="m3 8 9-5 9 5H3Zm2 3v7m5-7v7m4-7v7m5-7v7M3 21h18"/>',
    'real-estate':'<path d="M4 21V5h10v16M14 11h6v10M2 21h20M8 9h2m-2 4h2m-2 4h2m6-2h1m-1 3h1"/>',
    'health-care':'<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z"/>',
    industrials:'<path d="M3 21V10l6 4V9l7 4V3h4v18H3Zm4-4h1m4 0h1m4 0h1"/>',
    materials:'<path d="m12 3 10 5-10 5L2 8l10-5Zm-9 10 9 5 9-5M3 18l9 5 9-5"/>',
    technology:'<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="10" y="10" width="4" height="4" rx=".5"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/>',
    utilities:'<path d="M8 3v5m8-5v5M6 8h12v3a6 6 0 0 1-12 0V8Zm6 9v5"/>'
  };
  const icon=id=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[id]||icons.materials}</svg>`;
  const chevron='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 4 4 4-4 4"/></svg>';
  function navigation(route){
    const currentIndustry=route.type==='industry'?route.id:route.type==='company'?A.companyMap.get(route.id)?.industryId:null;
    const currentSector=route.type==='sector'?route.id:A.industryMap.get(currentIndustry)?.sectorId;
    if(currentSector!==previousSector){if(currentSector)expanded.add(currentSector);previousSector=currentSector;}
    const items=[['overview','산업 지도','▦',String(A.sectors.length)],['connections','매크로 연결 지도','⇄',''],['library','나의 서재','▤',String(A.state.bookmarks.length)],['glossary','개념 · 용어 사전','Aa','']];
    return `<div class="nav-label">WORKSPACE</div>${items.map(([id,name,symbol,count])=>`<a class="nav-item ${route.type===id?'active':''}" ${route.type===id?'aria-current="page"':''} href="#/${id}"><span class="nav-symbol" aria-hidden="true">${symbol}</span>${name}${count?`<span class="count">${count}</span>`:''}</a>`).join('')}
      <div class="nav-label directory-heading" id="sector-directory-label"><span>EXPLORE</span><span class="directory-total">11 SECTORS</span></div>
      <div class="sector-directory" aria-labelledby="sector-directory-label">${A.sectors.map(s=>{
        const open=expanded.has(s.id),current=currentSector===s.id,count=s.industries.reduce((n,i)=>n+i.companies.length,0);
        return `<div class="tree-group ${current?'is-current':''} ${open?'is-expanded':''}" style="--sector:${s.color}"><div class="tree-head"><a class="sector-nav-link ${current?'active':''}" ${route.type==='sector'&&route.id===s.id?'aria-current="page"':''} href="#/sector/${s.id}" title="${e(s.en)}"><span class="sector-nav-icon">${icon(s.id)}</span><span class="sector-nav-copy"><strong>${e(s.name)}</strong><small>${s.industries.length} 산업<span aria-hidden="true">·</span>${count} 기업</small></span></a><button class="tree-toggle" data-tree="${s.id}" data-sector-name="${e(s.name)}" aria-label="${e(s.name)} 하위 산업 ${open?'접기':'펼치기'}" aria-expanded="${open}" aria-controls="tree-${s.id}">${chevron}</button></div><div id="tree-${s.id}" class="tree-children" ${open?'':'hidden'}>${s.industries.map(i=>`<a class="${currentIndustry===i.id?'active':''}" ${route.type==='industry'&&route.id===i.id?'aria-current="page"':''} href="#/industry/${i.id}"><span class="industry-nav-name">${e(i.name)}</span>${A.state.completed.includes(i.id)?'<span class="industry-complete" aria-label="학습 완료">✓</span>':''}<span class="industry-nav-count" title="${i.companies.length}개 기업">${i.companies.length}<span class="visually-hidden">개 기업</span></span></a>`).join('')}</div></div>`;
      }).join('')}</div>
      <div class="nav-label">REFERENCE</div><a href="#/sources" class="nav-item ${route.type==='sources'?'active':''}"><span class="nav-symbol">≡</span>출처 · 분류 기준</a><a href="#/updates" class="nav-item ${route.type==='updates'?'active':''}"><span class="nav-symbol">↻</span>업데이트 현황</a>`;
  }
  A.navigation={toggle(id){if(expanded.has(id)){expanded.delete(id);return false;}expanded.add(id);return true;}};
  A.views.navigation=navigation;
})();
