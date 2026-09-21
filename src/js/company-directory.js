/* Existing company research, searchable from the overview without rebuilding the map. */
(() => {
  'use strict';
  const A=window.IA,e=A.esc;
  const entries=A.companies.filter(c=>A.data.profiles?.[c.ticker]).map(c=>{
    const profile=A.data.profiles[c.ticker],sector=A.sectorMap.get(c.sectorId),industry=A.industryMap.get(c.industryId);
    return {...c,profile,sector,industry,searchText:[c.ticker,c.name,c.business,profile.oneLiner,sector.name,sector.en,industry.name,industry.en].join(' ').toLocaleLowerCase()};
  }).sort((a,b)=>a.ticker.localeCompare(b.ticker,'en'));

  function query(params=new URLSearchParams()){
    const sector=A.sectorMap.has(params.get('research-sector'))?params.get('research-sector'):'all';
    const search=params.get('research-q')||'',terms=search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const matches=entries.filter(c=>(sector==='all'||c.sectorId===sector)&&terms.every(term=>c.searchText.includes(term)));
    const groups=A.sectors.map(s=>({sector:s,companies:matches.filter(c=>c.sectorId===s.id)})).filter(g=>g.companies.length);
    return {sector,search,matches,groups};
  }

  function results(params){
    const q=query(params);
    const count=`${q.groups.length}개 섹터 · ${q.matches.length}개 기업`;
    return `<div class="directory-result-bar"><p role="status" aria-live="polite" aria-atomic="true">${count}</p><span>섹터별 · 티커순 · 제목을 눌러 접기</span></div>${q.matches.length?`
      <div class="directory-columns" aria-hidden="true"><span>기업 · 티커</span><span>세부 산업</span><span>대표 사업</span><span>설명 검토일</span><span></span></div>
      <div class="directory-groups">${q.groups.map(g=>`<details class="directory-group" data-directory-group="${g.sector.id}" open>
        <summary><span class="directory-group-name"><i class="sector-dot" style="--sector:${g.sector.color}" aria-hidden="true"></i>${e(g.sector.name)}</span><span class="directory-group-count">${g.companies.length}개 기업</span></summary>
        <ul class="directory-list" aria-label="${e(g.sector.name)} 조사된 기업">${g.companies.map(c=>`<li><a class="directory-row" href="#/company/${encodeURIComponent(c.ticker)}" aria-label="${e(c.ticker+' · '+c.name+' 기업 상세 보기')}">
          <div class="directory-company"><strong>${e(c.ticker)}</strong><span title="${e(c.name)}">${e(c.name)}</span></div>
          <div class="directory-industry" title="${e(c.industry.name)}">${e(c.industry.name)}</div>
          <p class="directory-summary" title="${e(c.business)}">${e(c.business)}</p>
          <time class="directory-date" datetime="${e(c.profile.reviewedOn)}"><span>검토 </span>${e(c.profile.reviewedOn)}</time><span class="directory-arrow" aria-hidden="true">↗</span>
        </a></li>`).join('')}</ul>
      </details>`).join('')}</div>`:
      '<div class="empty directory-empty"><b>조건에 맞는 기업이 없습니다.</b><p>기업명·티커를 바꾸거나 섹터를 전체로 선택해 보세요.</p><button class="button" data-directory-reset>검색 조건 초기화</button></div>'}`;
  }

  function render(params=new URLSearchParams()){
    const q=query(params);
    return `<section class="company-directory" id="company-directory" aria-labelledby="directory-title">
      <div class="directory-heading"><div><div class="eyebrow">COMPANY RESEARCH</div><h2 id="directory-title">조사된 기업 모아보기 <span class="tag blue">${entries.length}개 기업</span></h2><p>같은 섹터의 기업을 모아 보고, 기업을 선택해 상세 조사로 이어서 읽어보세요.</p></div></div>
      <div class="directory-toolbar"><div class="directory-search"><label for="directory-search">기업 검색</label><input id="directory-search" type="search" placeholder="기업명, 티커, 사업 키워드" value="${e(q.search)}" autocomplete="off" aria-controls="directory-results"></div>
        <div class="directory-sector"><label for="directory-sector">섹터</label><select id="directory-sector" aria-controls="directory-results"><option value="all">전체 섹터</option>${A.sectors.map(s=>`<option value="${s.id}" ${q.sector===s.id?'selected':''}>${e(s.name)} · ${entries.filter(c=>c.sectorId===s.id).length}</option>`).join('')}</select></div>
        <button class="button directory-reset" data-directory-reset ${!q.search&&q.sector==='all'?'hidden':''}>초기화</button>
      </div>
      <div id="directory-results" tabindex="-1" aria-label="조사된 기업 검색 결과">${results(params)}</div>
      <p class="directory-footnote">설명 검토일은 기업 조사 내용을 검토한 날짜입니다. 재무 수치의 보고기간은 각 기업 상세에서 확인할 수 있습니다.</p>
    </section>`;
  }

  function update(params){
    const q=query(params),container=document.getElementById('directory-results');
    if(!container)return;
    container.innerHTML=results(params);
    document.getElementById('directory-search').value=q.search;
    document.getElementById('directory-sector').value=q.sector;
    document.querySelector('.directory-reset').hidden=!q.search&&q.sector==='all';
  }
  A.directory={render,results,query,update};
})();
