/* Routes and delegated interactions. Keep rendering and content out of this layer. */
(() => {
  'use strict';
  const A=window.IA,{esc:e,state,views:V}=A;
  const main=document.getElementById('main'),nav=document.getElementById('navigation');
  let route={},mapFilter='all',pendingImport=null;
  const searchDialog=document.getElementById('search-dialog');
  const infoDialog=document.getElementById('info-dialog');
  function parseRoute(){const raw=location.hash.replace(/^#\/?/,'')||'overview';const [path,query='']=raw.split('?');const [type,id]=path.split('/');return{type,id,params:new URLSearchParams(query)};}
  function setTheme(){document.documentElement.dataset.theme=state.theme;document.getElementById('theme-toggle').setAttribute('aria-label',state.theme==='dark'?'라이트 모드로 전환':'다크 모드로 전환');}
  function closeMenu(){document.getElementById('sidebar').classList.remove('open');document.getElementById('sidebar-shade').hidden=true;document.getElementById('menu-toggle').setAttribute('aria-expanded','false');}
  function render({keepScroll=false,focus=false}={}){
    const y=scrollY;route=parseRoute();
    const pages={overview:()=>V.overview(mapFilter,route.params),sector:()=>V.sector(route.id),industry:()=>V.industry(route.id),connections:()=>V.connections(route.params.get('factor')||'growth'),glossary:()=>V.glossary(route.params.get('q')||''),library:()=>V.library(route.params.get('tab')||'bookmarks'),sources:()=>V.sources(),company:()=>V.company(route.id,route.params.get('period')||'recent'),updates:()=>V.updates()};
    if(route.type==='industry'&&A.industryMap.has(route.id)){state.recent=route.id;A.persist();}
    main.innerHTML=(pages[route.type]||V.notFound)();nav.innerHTML=V.navigation(route);
    main.querySelector('.anchor-tabs a')?.classList.add('active');
    main.querySelectorAll('.wide-wrap').forEach(el=>{el.tabIndex=0;el.setAttribute('role','region');el.setAttribute('aria-label',(el.querySelector('caption')?.textContent||'산업 비교 표')+' · 좌우로 스크롤할 수 있습니다');});
    document.title='Industry Archive';
    A.map?.mount();
    closeMenu();if(keepScroll)window.scrollTo(0,y);else window.scrollTo(0,0);if(focus)main.focus({preventScroll:true});
    const target=route.params.has('company')?document.getElementById('company-'+route.params.get('company')):route.params.has('theme')?document.getElementById('theme-'+route.params.get('theme')):null;
    if(target&&!keepScroll){requestAnimationFrame(()=>{target.scrollIntoView({block:'center',behavior:'auto'});target.classList.add('target-highlight');});}
    if(!A.isPersistent()){const foot=document.querySelector('.sidebar-footer');foot.innerHTML='<span class="local-dot"></span>학습 기록을 임시로 보관 중<small>서재에서 기록을 내보내 보관하세요.</small>';}
  }
  function refreshControls(){
    nav.innerHTML=V.navigation(route);
    document.querySelectorAll('[data-bookmark]').forEach(btn=>{const key=btn.dataset.bookmark;const saved=state.bookmarks.includes(key),large=btn.classList.contains('button');btn.classList.toggle('saved',saved);btn.classList.toggle('active',saved&&large);btn.setAttribute('aria-pressed',String(saved));btn.setAttribute('aria-label',`${A.keyInfo(key)?.name||'항목'} ${saved?'즐겨찾기 해제':'즐겨찾기 추가'}`);btn.title=saved?'즐겨찾기 해제':'즐겨찾기 추가';btn.innerHTML=(saved?'★':'☆')+(large?` <span>${saved?'저장됨':'즐겨찾기'}</span>`:'');});
    document.querySelectorAll('[data-complete]').forEach(btn=>{const complete=state.completed.includes(btn.dataset.complete);btn.classList.toggle('active',complete);btn.setAttribute('aria-pressed',String(complete));btn.textContent=complete?'✓ 학습 완료':'○ 학습 완료 표시';});
  }
  function updateDirectory(key,value){
    if(key==='reset'){['research-q','research-sector','research-page'].forEach(k=>route.params.delete(k));}
    else{
      if(value&&!(key==='research-sector'&&value==='all'))route.params.set(key,value);else route.params.delete(key);
      route.params.delete('research-page');
    }
    const query=route.params.toString();
    history.replaceState(null,'','#/overview'+(query?'?'+query:''));
    A.directory.update(route.params);
  }
  function showInfo(title,body,actions='<button class="button primary" data-close-dialog>확인</button>'){
    document.getElementById('info-content').innerHTML=`<div class="dialog-title"><h2 id="info-title">${e(title)}</h2><button class="icon-button" data-close-dialog aria-label="닫기">×</button></div>${body}<div class="dialog-actions">${actions}</div>`;
    if(!infoDialog.open)infoDialog.showModal();
  }
  function showHelp(){showInfo('산업 아카이브 사용 안내',`<p><b>1. 산업을 탐색하세요.</b><br>산업 지도에서 섹터를 고른 뒤 세부 산업으로 들어가면 수익 구조, 핵심 지표, 대표 기업과 스터디 질문을 읽을 수 있습니다. 왼쪽 화살표로 트리를 펼쳐 바로 이동할 수도 있습니다.</p><p><b>2. 나만의 기록을 쌓으세요.</b><br>☆로 관심 산업·기업을 저장하고, 관찰 노트에 생각을 적으세요. 입력하면 자동 저장됩니다. 공부가 끝나면 ‘학습 완료 표시’를 누르세요.</p><p><b>3. 다른 기기로 이어가세요.</b><br>서재에서 JSON 기록을 내보내고 새 기기에서 가져오세요. HTML이나 GitHub 저장소를 복사하는 것만으로 메모가 이동하지는 않습니다. 브라우저 기록을 지우거나 파일 경로를 옮기기 전에도 기록을 내보내세요.</p><p><b>빠른 사용</b><br><kbd>/</kbd> 또는 <kbd>Ctrl / ⌘ + K</kbd> 검색 · <kbd>Esc</kbd> 닫기 · 각 노트의 ‘인쇄 · PDF’로 출력</p><div class="callout neutral"><b>기록 보관 범위</b>브라우저와 파일 위치에 따라 저장 공간이 달라질 수 있습니다. 중요한 메모는 내보내기 파일로 함께 보관하세요.</div>`);}
  function openSearch(){if(!searchDialog.open)searchDialog.showModal();const input=document.getElementById('global-search');input.value='';renderSearch('');input.focus();}
  function renderSearch(query){const matches=A.search(query),results=document.getElementById('search-results');results.innerHTML=!query.trim()?`<div class="search-hint">찾고 싶은 산업이나 기업이 있나요?<br><br><span class="tag">반도체</span> <span class="tag">JPM</span> <span class="tag">보험</span> <span class="tag">현금흐름</span></div>`:matches.length?`<div class="subtitle" style="padding:5px 12px">${matches.length}개 결과${matches.length>60?' · 처음 60개 표시':''}</div>${matches.slice(0,60).map(r=>`<a class="search-result" href="${e(r.url)}"><span class="tag">${e(r.type)}</span><b>${e(r.name)}</b><small>${e(r.sub)}</small></a>`).join('')}`:`<div class="search-hint">‘${e(query)}’ 검색 결과가 없습니다.<br>다른 기업명이나 영문 티커로 검색해 보세요.</div>`;}
  function exportRecords(){const output={version:1,application:'Market Monitor Industry Archive',exportedAt:new Date().toISOString(),bookmarks:state.bookmarks,completed:state.completed,notes:state.notes};A.download(`industry-study-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(output,null,2));A.toast('학습 기록을 내보냈습니다. 새 컴퓨터에서 이 파일을 가져오세요.');}
  function onAction(action){
    if(action==='print'){window.print();return;}
    if(action==='export'){exportRecords();return;}
    if(action==='import'){document.getElementById('import-input').click();return;}
    if(action==='confirm-import'&&pendingImport){const kept=A.mergeImport(pendingImport,document.getElementById('overwrite-notes').checked);pendingImport=null;infoDialog.close();render({keepScroll:true});A.toast(`기록을 합쳤습니다.${kept?` 겹치는 메모 ${kept}개는 현재 기기 내용을 유지했습니다.`:''}`);}
  }
  document.addEventListener('click',event=>{
    const close=event.target.closest('[data-close-dialog]');if(close){close.closest('dialog')?.close();return;}
    const directoryReset=event.target.closest('[data-directory-reset]');if(directoryReset){updateDirectory('reset');document.getElementById('directory-search').focus({preventScroll:true});return;}
    const b=event.target.closest('[data-bookmark]');if(b){A.toggleBookmark(b.dataset.bookmark);if(route.type==='library'||route.type==='overview')render({keepScroll:true});else refreshControls();A.toast(state.bookmarks.includes(b.dataset.bookmark)?'나의 서재에 저장했습니다.':'즐겨찾기에서 해제했습니다.');return;}
    const c=event.target.closest('[data-complete]');if(c){A.toggleComplete(c.dataset.complete);if(route.type==='library')render({keepScroll:true});else refreshControls();A.toast(state.completed.includes(c.dataset.complete)?'학습 진도를 기록했습니다.':'학습 완료 표시를 해제했습니다.');return;}
    const tree=event.target.closest('[data-tree]');if(tree){const open=A.navigation.toggle(tree.dataset.tree),el=document.getElementById('tree-'+tree.dataset.tree);el.hidden=!open;tree.setAttribute('aria-expanded',String(open));tree.setAttribute('aria-label',`${tree.dataset.sectorName} 하위 산업 ${open?'접기':'펼치기'}`);tree.closest('.tree-group').classList.toggle('is-expanded',open);return;}
    const filter=event.target.closest('[data-map-filter]');if(filter){mapFilter=filter.dataset.mapFilter;render({keepScroll:true});main.querySelector(`[data-map-filter="${CSS.escape(mapFilter)}"]`)?.focus({preventScroll:true});return;}
    const mapView=event.target.closest('[data-map-view]');if(mapView){route.params.set('view',mapView.dataset.mapView);history.replaceState(null,'','#/overview?'+route.params);render({keepScroll:true});return;}
    const zoom=event.target.closest('[data-map-zoom]');if(zoom){route.params.set('sector',zoom.dataset.mapZoom);history.replaceState(null,'','#/overview?'+route.params);render({keepScroll:true});return;}
    const factor=event.target.closest('[data-factor]');if(factor){history.replaceState(null,'','#/connections?factor='+factor.dataset.factor);render({keepScroll:true});main.querySelector(`[data-factor="${CSS.escape(factor.dataset.factor)}"]`)?.focus({preventScroll:true});return;}
    const tab=event.target.closest('[data-library-tab]');if(tab){history.replaceState(null,'','#/library?tab='+tab.dataset.libraryTab);render({keepScroll:true});main.querySelector(`[data-library-tab="${CSS.escape(tab.dataset.libraryTab)}"]`)?.focus({preventScroll:true});return;}
    const anchor=event.target.closest('[data-anchor]');if(anchor){event.preventDefault();anchor.closest('nav').querySelectorAll('a').forEach(a=>a.classList.toggle('active',a===anchor));document.getElementById(anchor.dataset.anchor)?.scrollIntoView({behavior:'smooth'});return;}
    const action=event.target.closest('[data-action]');if(action){onAction(action.dataset.action);return;}
    const a=event.target.closest('a[href^="#/"]');if(a){if(searchDialog.open)searchDialog.close();if(infoDialog.open)infoDialog.close();closeMenu();if(a.getAttribute('href')===location.hash){event.preventDefault();render({focus:true});}}
  });
  document.addEventListener('input',event=>{
    const el=event.target;
    if(el.matches('[data-note]')){const ok=A.saveNote(el.dataset.note,el.value);document.getElementById('note-status').textContent=ok?'✓ 저장됨':'임시 보관 · 내보내기 필요';document.getElementById('note-count').textContent=el.value.length.toLocaleString()+' / 20,000';}
    if(el.id==='global-search')renderSearch(el.value);
    if(el.id==='directory-search')updateDirectory('research-q',el.value);
    if(el.id==='glossary-search'){const q=el.value.trim().toLocaleLowerCase();const terms=A.data.context.glossary.filter(g=>[g.term,g.en,g.meaning].join(' ').toLocaleLowerCase().includes(q));document.getElementById('glossary-results').innerHTML=V.glossaryResults(terms);document.getElementById('glossary-count').textContent=terms.length+'개 개념';history.replaceState(null,'','#/glossary'+(el.value?'?q='+encodeURIComponent(el.value):''));}
  });
  document.addEventListener('change',event=>{
    const el=event.target;
    if(el.id==='directory-sector')updateDirectory('research-sector',el.value);
    if(el.id==='map-sector'||el.id==='map-color'){route.params.set(el.id==='map-sector'?'sector':'color',el.value);history.replaceState(null,'','#/overview?'+route.params);render({keepScroll:true});document.getElementById(el.id)?.focus({preventScroll:true});}
    if(el.id==='financial-period'){route.params.set('period',el.value);history.replaceState(null,'',`#/company/${encodeURIComponent(el.dataset.company)}?`+route.params);render({keepScroll:true});document.getElementById('financial-period')?.focus({preventScroll:true});}
  });
  document.addEventListener('keydown',event=>{
    const editing=event.target.matches('input,textarea,select,[contenteditable="true"]');
    if((event.key==='/'&&!editing)||((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k')){event.preventDefault();if(!infoDialog.open)openSearch();}
    if(event.key==='Escape')closeMenu();
    if(searchDialog.open&&['ArrowDown','ArrowUp'].includes(event.key)){const links=[...document.querySelectorAll('.search-result')];if(!links.length)return;event.preventDefault();const ix=links.indexOf(document.activeElement);links[event.key==='ArrowDown'?Math.min(ix+1,links.length-1):Math.max(ix-1,0)].focus();}
    if(searchDialog.open&&event.key==='Enter'&&event.target.id==='global-search'){const first=document.querySelector('.search-result');if(first){event.preventDefault();first.click();}}
  });
  document.getElementById('import-input').addEventListener('change',async event=>{
    const file=event.target.files[0];event.target.value='';if(!file)return;
    try{if(file.size>10*1024*1024)throw new Error('10MB 이하의 학습 기록 파일을 선택해주세요.');const raw=JSON.parse(await file.text());pendingImport=A.validateImport(raw);const n=pendingImport;const conflicts=Object.keys(n.notes).filter(k=>state.notes[k]).length;showInfo('학습 기록 가져오기',`<p><b>${e(file.name)}</b>에서 읽은 기록입니다.</p><div class="flex wrap"><span class="tag blue">즐겨찾기 ${n.bookmarks.length}</span><span class="tag blue">완료한 산업 ${n.completed.length}</span><span class="tag blue">메모 ${Object.keys(n.notes).length}</span></div><p style="margin-top:16px">즐겨찾기와 진도는 중복 없이 합칩니다. 현재 아카이브에 없는 항목은 제외합니다. 같은 항목의 메모가 있으면 기본적으로 현재 기기의 내용을 유지합니다.</p><label class="check-row"><input id="overwrite-notes" type="checkbox"><span>겹치는 메모 ${conflicts}개를 가져온 파일의 내용으로 바꾸기</span></label>`,`<button class="button" data-close-dialog>취소</button><button class="button primary" data-action="confirm-import">기록 합치기</button>`);}catch(error){pendingImport=null;A.toast(error instanceof SyntaxError?'JSON 파일을 읽을 수 없습니다. 내보낸 원본 파일을 선택해주세요.':error.message);}
  });
  document.getElementById('menu-toggle').addEventListener('click',()=>{const sidebar=document.getElementById('sidebar'),open=sidebar.classList.toggle('open');document.getElementById('sidebar-shade').hidden=!open;document.getElementById('menu-toggle').setAttribute('aria-expanded',String(open));});
  document.getElementById('sidebar-shade').addEventListener('click',closeMenu);
  document.getElementById('theme-toggle').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';setTheme();A.persist();});
  document.getElementById('help-button').addEventListener('click',showHelp);
  document.getElementById('search-open').addEventListener('click',openSearch);
  window.addEventListener('hashchange',()=>render({focus:true}));
  window.addEventListener('storage',event=>{if(event.key==='mm-industry-archive-v1')A.toast('다른 창에서 기록이 변경되었습니다. 이 창의 기록을 먼저 내보낸 뒤 새로고침해 주세요.');});
  setTheme();render();
})();
