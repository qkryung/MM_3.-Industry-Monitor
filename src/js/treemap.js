/* Nested rectangular industry map. Areas encode coverage, never market capitalization. */
(() => {
  'use strict';
  const A=window.IA,e=A.esc;
  function partition(items,x,y,w,h){
    if(!items.length||w<=0||h<=0)return[];
    const total=items.reduce((s,i)=>s+i.weight,0),pending=items.map(item=>({item,area:item.weight/total*w*h})).sort((a,b)=>b.area-a.area),result=[];
    const worst=(row,side)=>{if(!row.length)return Infinity;const sum=row.reduce((n,r)=>n+r.area,0),areas=row.map(r=>r.area);return Math.max(side*side*Math.max(...areas)/(sum*sum),sum*sum/(side*side*Math.min(...areas)));};
    while(pending.length){
      const row=[pending.shift()],side=Math.min(w,h);
      while(pending.length&&worst([...row,pending[0]],side)<=worst(row,side))row.push(pending.shift());
      const area=row.reduce((n,r)=>n+r.area,0);
      if(w>=h){const rw=area/h;let cy=y;for(const r of row){const rh=r.area/rw;result.push({item:r.item,x,y:cy,w:rw,h:rh});cy+=rh;}x+=rw;w=Math.max(0,w-rw);}
      else{const rh=area/w;let cx=x;for(const r of row){const rw=r.area/rh;result.push({item:r.item,x:cx,y,w:rw,h:rh});cx+=rw;}y+=rh;h=Math.max(0,h-rh);}
    }
    return result;
  }
  const formatMargin=value=>Number.isFinite(value)?`${value>=0?'+':''}${value.toFixed(1)}%`:'미제공';
  function annualMargin(ticker){const f=A.data.financials?.companies?.[ticker];const p=f?.annual?.at(-1);return{metric:p?.metrics?.operatingMargin,period:p?.end};}
  function color(company,sector,mode){
    if(mode!=='margin')return '#'+sector.color.slice(1).match(/../g).map(c=>Math.round(parseInt(c,16)*.78).toString(16).padStart(2,'0')).join('');
    const value=annualMargin(company.ticker).metric?.value;
    if(!Number.isFinite(value))return'#637187';
    return value<0?(value<-20?'#963e55':'#b4656b'):value<10?'#4c8076':value<25?'#267e69':'#12644f';
  }
  function overview(filter='all',params=new URLSearchParams()){
    const chosen=A.sectorMap.has(params.get('sector'))?params.get('sector'):'all';
    const mode=params.get('color')==='margin'?'margin':'sector';
    const listMode=params.get('view')==='list';
    const sectors=chosen==='all'?A.sectors:[A.sectorMap.get(chosen)];
    const companies=sectors.flatMap(s=>s.industries.flatMap(i=>i.companies));
    return `<div class="breadcrumb"><span>산업 아카이브</span><span>/</span><span>산업 지도</span></div><section class="overview-intro"><div><div class="eyebrow">FROM INDUSTRY TO COMPANY</div><h1>산업을 읽는 나만의 관점.</h1><p>큰 흐름에서 개별 기업까지, 지도를 따라 한 단계씩 이해합니다.</p></div><div class="overview-stats"><div><b>11</b><small>SECTORS</small></div><div><b>${A.industries.length}</b><small>INDUSTRIES</small></div><div><b>${A.companies.length}</b><small>COMPANIES</small></div></div></section>
    <section class="study-banner" aria-label="산업을 읽는 세 가지 질문"><div class="study-banner-title"><span class="eyebrow">STUDY METHOD</span><h2>산업을 읽는<br>세 가지 질문</h2></div><div class="study-banner-step"><span>01</span><div><h3>어떻게 돈을 벌까?</h3><p>고객과 매출 구조부터 이해합니다.</p></div></div><div class="study-banner-step"><span>02</span><div><h3>왜 이 기업을 선택할까?</h3><p>경쟁사와 강점·약점을 비교합니다.</p></div></div><div class="study-banner-step"><span>03</span><div><h3>어떤 숫자로 확인할까?</h3><p>최근 공시로 성장과 현금을 봅니다.</p></div></div></section>
    <section class="map-panel"><div class="map-heading"><div><div class="eyebrow">INDUSTRY EXPLORER</div><h2>11개 섹터, 하나의 산업 지도</h2><p>섹터 제목은 산업 설명으로, 기업 타일은 상세 리서치로 연결됩니다.</p></div><div class="segmented" aria-label="지도 표시 방식"><button data-map-view="map" class="${!listMode?'active':''}" aria-pressed="${!listMode}">▦ 지도</button><button data-map-view="list" class="${listMode?'active':''}" aria-pressed="${listMode}">☷ 목록</button></div></div>
    <div class="map-controls"><label for="map-sector">탐색 범위</label><select id="map-sector"><option value="all">전체 11개 섹터</option>${A.sectors.map(s=>`<option value="${s.id}" ${chosen===s.id?'selected':''}>${e(s.name)}</option>`).join('')}</select><label for="map-color">색상 기준</label><select id="map-color"><option value="sector" ${mode==='sector'?'selected':''}>섹터 구분</option><option value="margin" ${mode==='margin'?'selected':''}>최근 연간 영업이익률</option></select><span class="push map-coverage">${companies.length}개 기업 · ${sectors.length}개 섹터</span></div>
    ${listMode?`<div class="map-company-list">${sectors.map(s=>`<section class="map-list-sector"><div class="flex"><span class="sector-dot" style="--sector:${s.color}"></span><h3><a href="#/sector/${s.id}">${e(s.name)} →</a></h3></div>${s.industries.map(i=>`<div class="map-list-industry"><a href="#/industry/${i.id}">${e(i.name)}</a><div>${i.companies.map(c=>`<a class="map-list-company" href="#/company/${encodeURIComponent(c.ticker)}"><strong>${e(c.ticker)}</strong><span>${e(c.name)}</span><small>${e(c.business)}</small><b>기업 읽기 →</b></a>`).join('')}</div></div>`).join('')}</section>`).join('')}</div>`:`<div id="industry-treemap" class="industry-treemap" data-sector="${chosen}" data-color="${mode}" aria-label="섹터·세부 산업·기업 트리맵"></div><div id="map-hover" class="map-hover" role="status"><span class="tag">MAP GUIDE</span><span>기업 위에 마우스를 올리거나 키보드로 이동하면 사업을 볼 수 있습니다. 선택하면 기업 상세가 열립니다.</span></div>`}
    <div class="map-legend">${mode==='margin'?'<span>영업적자 <i style="background:#963e55"></i></span><span>0–10% <i style="background:#4c8076"></i></span><span>10–25% <i style="background:#267e69"></i></span><span>25% 이상 <i style="background:#12644f"></i></span><span>미제공 <i style="background:#637187"></i></span>':'<span>색상 = 섹터 구분</span>'}<span class="push">타일 크기 = 학습용 배치 · 시가총액·주가 등락률을 의미하지 않습니다.</span></div>
    ${mode==='margin'?'<p class="map-footnote">각 기업의 가장 최근 연간 공시 기준입니다. 회계연도·통화·사업 모델이 서로 다르며, 은행·보험 등 표준 영업이익이 없는 기업은 회색으로 표시합니다. 색상은 주가 전망이나 투자 점수가 아닙니다.</p>':'<p class="map-footnote">각 기업을 균등 가중으로 배치하고, 섹터 면적은 수록 기업 수를 기준으로 나눴습니다. 좁은 화면에서는 섹터를 선택하거나 목록 보기를 이용하세요.</p>'}</section>
    ${A.directory.render(params)}
    <div class="archive-bottom"><span>개념 · 사업 구조 · 공식 공시 재무</span><a href="#/sources">출처 · 자료 기준 →</a><a href="#/updates">업데이트 현황 →</a></div>`;
  }
  function mount(){
    const el=document.getElementById('industry-treemap');if(!el)return;
    const chosen=el.dataset.sector,mode=el.dataset.color;
    const sectors=chosen==='all'?A.sectors:[A.sectorMap.get(chosen)];
    const width=el.clientWidth,height=chosen==='all'?Math.max(width<600?1050:700,Math.min(950,width*.72)):Math.max(470,Math.min(660,width*.5));
    el.style.height=height+'px';
    const groups=sectors.map(s=>({s,weight:s.industries.reduce((n,i)=>n+i.companies.length,0)})).sort((a,b)=>b.weight-a.weight);
    const rectangles=partition(groups,0,0,width,height);
    el.innerHTML=rectangles.map(({item,x,y,w,h})=>{
      const s=item.s,gap=3,pad=4,innerW=w-gap*2,innerH=h-gap*2;
      const nodes=partition(s.industries.map(i=>({i,weight:i.companies.length})).sort((a,b)=>b.weight-a.weight),pad,29,innerW-pad*2,innerH-33);
      return `<section class="map-sector" style="left:${x+gap}px;top:${y+gap}px;width:${innerW}px;height:${innerH}px;--sector:${s.color}"><header><a href="#/sector/${s.id}" title="${e(s.name)} 섹터 설명">${e(s.name)} <span>↗</span></a><button data-map-zoom="${s.id}" aria-label="${e(s.name)} 지도 확대" title="이 섹터 확대">⌕</button></header>${nodes.map(({item:node,x:ix,y:iy,w:iw,h:ih})=>{
        const label=chosen!=='all'&&ih>65;
        const tiles=partition(node.i.companies.map(c=>({c,weight:1})),ix,iy+(label?18:0),iw,ih-(label?18:0));
        return `${label?`<a class="map-industry-label" style="left:${ix}px;top:${iy}px;width:${iw}px" href="#/industry/${node.i.id}">${e(node.i.name)}</a>`:''}${tiles.map(({item:leaf,x:cx,y:cy,w:cw,h:ch})=>{const c=leaf.c,size=Math.max(9,Math.min(24,cw/4.3,ch/2.7));const margin=annualMargin(c.ticker);const sub=mode==='margin'?formatMargin(margin.metric?.value):c.name;return `<a class="map-tile" href="#/company/${encodeURIComponent(c.ticker)}" data-map-company="${e(c.ticker)}" style="left:${cx+1}px;top:${cy+1}px;width:${Math.max(0,cw-2)}px;height:${Math.max(0,ch-2)}px;background:${color(c,s,mode)};--tile-font:${size}px" aria-label="${e(c.ticker+' '+c.name+' 기업 상세')}" title="${e(c.ticker+' · '+c.name+'\n'+c.business+(mode==='margin'?'\n연간 영업이익률 '+formatMargin(margin.metric?.value)+' · '+(margin.period||'미제공'):''))}"><strong>${e(c.ticker)}</strong>${cw>68&&ch>43?`<small>${e(sub)}</small>`:''}</a>`;}).join('')}`;
      }).join('')}</section>`;
    }).join('');
    const show=event=>{const tile=event.target.closest('[data-map-company]');if(!tile)return;const c=A.companyMap.get(tile.dataset.mapCompany);document.getElementById('map-hover').innerHTML=`<span class="tag blue">${e(c.ticker)}</span><strong>${e(c.name)}</strong><span>${e(c.business)}</span><a class="push" href="#/company/${encodeURIComponent(c.ticker)}">기업 상세 →</a>`;};
    el.onpointerover=show;el.onfocusin=show;
  }
  let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(mount,100);});
  A.map={mount,partition};A.views.overview=overview;
})();
