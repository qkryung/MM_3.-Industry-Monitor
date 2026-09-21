/* Sourced investment narratives and transparent, period-aware valuation screens. */
(() => {
  'use strict';
  const A=window.IA,e=A.esc;
  const link=(url,label)=>`<a href="${e(A.safeUrl(url))}" target="_blank" rel="noopener noreferrer">${e(label)} ↗</a>`;
  const money=n=>Number.isFinite(n)?'$'+(Math.abs(n)>=1e12?(n/1e12).toFixed(2)+'T':Math.abs(n)>=1e9?(n/1e9).toFixed(2)+'B':(n/1e6).toFixed(1)+'M'):'미확보';
  const num=(n,suffix='')=>Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:1})+suffix:'—';
  const metric=(period,key)=>period?.metrics?.[key];
  const equalUnits=(a,b)=>a&&b&&a.unit===b.unit;
  const ratio=(a,b)=>equalUnits(a,b)&&b.value>0?a.value/b.value:null;
  const samePeriod=(a,b)=>equalUnits(a,b)&&['start','end','basis'].every(k=>a[k]===b[k]);
  const periodRatio=(a,b)=>samePeriod(a,b)?ratio(a,b):null;
  const ownerIncome=m=>m&&m.tag!=='ProfitLoss';
  const ownerBook=m=>m&&!['StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest','Equity'].includes(m.tag);
  const isReit=c=>c?.sectorId==='real-estate'&&c.ticker!=='CBRE';
  const narrative=(items=[])=>`<div class="report-points">${items.map(x=>`<article><h3>${e(x.title)}</h3><p>${e(x.detail)}</p>${x.sourceUrl?`<small>${link(x.sourceUrl,'근거 원문')}</small>`:''}</article>`).join('')}</div>`;
  const bullets=(items=[])=>`<ul class="list">${items.map(x=>`<li>${e(x)}</li>`).join('')}</ul>`;
  function overview(c,p){
    const r=p.investmentResearch;if(!r)return'';
    return `<section id="company-investment" class="panel investment-summary"><div class="eyebrow">INVESTMENT RESEARCH</div><h2>투자 판단의 핵심 논점</h2><p class="report-thesis">${e(r.thesis)}</p><div class="report-posture"><span class="tag blue">공시 기반 분석 · ${e(r.asOf)}</span><span>사업·정책 해석과 가치평가 가정은 공시 사실과 구분해 읽습니다.</span></div><div class="report-split"><div><h3>확인할 촉매</h3>${bullets(r.catalysts)}</div><div><h3>투자 논지가 틀리는 조건</h3>${bullets(r.falsifiers)}</div></div></section>`;
  }
  function context(c,p){
    const r=p.investmentResearch;if(!r)return'';
    return `<section id="company-drivers" class="panel"><div class="eyebrow">BUSINESS ECONOMICS</div><h2>매출이 이익과 현금으로 바뀌는 구조</h2>${narrative(r.businessDrivers)}</section><section id="company-macro" class="panel"><div class="eyebrow">MACRO TRANSMISSION</div><h2>매크로 환경과 실적의 연결</h2>${narrative(r.macro)}</section><section id="company-moat" class="panel"><div class="eyebrow">ECONOMIC MOAT</div><h2>경제적 해자와 지속 가능성</h2>${narrative(r.moat)}</section>`;
  }
  function financialRead(c,p,f){
    const annual=f?.annual||[],last=annual.at(-1),previous=annual.at(-2),balance=f?.latestQuarter||last;
    const rev=metric(last,'revenue'),prevRev=metric(previous,'revenue'),income=metric(last,'netIncome'),ocf=metric(last,'operatingCashFlow');
    const growth=ratio(rev,prevRev),conversion=periodRatio(ocf,income),liquidity=periodRatio(metric(balance,'currentAssets'),metric(balance,'currentLiabilities'));
    const capital=periodRatio(metric(balance,'equity'),metric(balance,'assets')),sbcRatio=periodRatio(metric(last,'stockCompensation'),rev);
    const messages=[];
    if(growth!==null)messages.push(`${previous.end} → ${last.end} 연간 매출·영업수익은 ${num((growth-1)*100,'%')} 변했습니다. 인수·매각·환율 영향을 분리해야 유기적 성장과 구분할 수 있습니다.`);
    const margin=metric(last,'operatingMargin'),oldMargin=metric(previous,'operatingMargin');
    if(margin&&oldMargin)messages.push(`연간 영업이익률은 ${num(oldMargin.value,'%')}에서 ${num(margin.value,'%')}로 ${num(margin.value-oldMargin.value,'%p')} 변했습니다. 제품 구성과 가격·비용·일회성 요인의 기여를 다음 공시에서 확인합니다.`);
    if(conversion!==null&&!['financials','real-estate'].includes(c.sectorId))messages.push(`영업현금흐름/순이익은 ${num(conversion,'배')}입니다. 매출채권·재고·선수금 변화와 비현금 주식보상이 현금전환율을 높였는지 구분해야 합니다.`);
    if(sbcRatio!==null)messages.push(`주식보상비용은 연간 매출의 ${num(sbcRatio*100,'%')}입니다. 현금 유출이 없어도 주식 수 증가 또는 희석 상쇄용 자사주 매입은 주주 수익에 영향을 줍니다.`);
    if(capital!==null)messages.push(`최근 확보한 ${balance.end} 자본/자산은 ${num(capital*100,'%')}입니다. 이는 회계 비율이며 은행의 CET1이나 보험 지급여력 비율을 대신하지 않습니다.`);
    const snapshots=[['현금·현금성자산',metric(balance,'cash')],['장기차입금 · 원문 정의 확인',metric(balance,'longTermDebt')],['유동성 장기차입금',metric(balance,'currentDebt')],['단기차입금',metric(balance,'shortTermBorrowings')]];
    return `<section id="company-health" class="panel"><div class="eyebrow">EARNINGS QUALITY & BALANCE SHEET</div><h2>실적 추이와 재무 건전성 읽기</h2><p class="company-reading-guide">아래 계산은 위 공시 표의 기간·통화가 일치하는 항목을 사용합니다. 확보하지 못한 값은 0으로 보지 않습니다.</p><div class="report-facts">${snapshots.map(([label,m])=>`<div><small>${e(label)}</small><b>${e(A.company.shortValue(m))}</b><small>${m?e(m.end)+' · '+link(m.sourceUrl,'공시'):'표준 태그 미확보'}</small></div>`).join('')}</div>${liquidity!==null&&!['financials','real-estate'].includes(c.sectorId)?`<p class="report-calculation">유동비율 ${num(liquidity,'배')} · 유동자산/유동부채 · ${e(balance.end)}</p>`:''}${bullets(messages)}${narrative(p.investmentResearch?.financialFocus)}<p class="company-reading-guide">장·단기 차입금 태그는 포함 범위가 겹칠 수 있어 자동 합산하지 않습니다. 순차입금·차입 만기·리스·담보·약정 및 금융업 규제자본은 원문에서 별도로 확인해야 합니다. 현금만으로 재무 안전성을 판정하지 않습니다.</p></section>`;
  }
  function valuationData(ticker){
    const c=A.companyMap.get(ticker),f=A.data.financials?.companies?.[ticker],q=A.data.marketData?.companies?.[ticker],annual=f?.annual?.at(-1),balance=f?.latestQuarter||annual;
    const cap=q?.marketCap,rev=metric(annual,'revenue'),earn=metric(annual,'netIncome'),book=metric(balance,'equity'),fcf=metric(annual,'freeCashFlow');
    const scopeMismatch=ticker==='VMRK';
    const supported=Boolean(c&&q?.currency==='USD'&&q.marketCapCurrency==='USD'&&Number.isFinite(cap)&&cap>0&&c.kind!=='ADR'&&!scopeMismatch);
    const multiple=m=>supported&&m?.unit==='USD'&&m.value>0?cap/m.value:null;
    const isFinancial=c?.sectorId==='financials';
    return {c,f,q,annual,balance,supported,scopeMismatch,pe:ownerIncome(earn)?multiple(earn):null,ps:isFinancial?null:multiple(rev),pb:ownerBook(book)?multiple(book):null,fcfYield:!isFinancial&&!isReit(c)&&supported&&ownerIncome(earn)&&fcf?.unit==='USD'?fcf.value/cap*100:null};
  }
  function ownerCashDcf(cash,growth,discount,terminal){
    if(![cash,growth,discount,terminal].every(Number.isFinite)||cash<=0||discount<=terminal||discount<=0||growth<=-1)return null;
    let pv=0,flow=cash;
    for(let year=1;year<=5;year++){flow*=1+growth;pv+=flow/(1+discount)**year;}
    const tv=flow*(1+terminal)/(discount-terminal)/(1+discount)**5;
    return {value:pv+tv,terminalShare:tv/(pv+tv)};
  }
  function absoluteScreen(v){
    const {c,f,q,supported}=v;
    if(v.scopeMismatch)return '<p class="company-reading-guide">VMRK의 현재 시가총액은 합병 후 회사, 확보한 연간·분기 실적은 합병 전 EQR 범위입니다. 합병 후 연결 또는 검증된 pro forma 재무가 확보될 때까지 현재 시총과 과거 실적을 결합한 배수·가치 계산을 보류합니다.</p>';
    if(!supported)return '<p class="company-reading-guide">동일 통화의 시가총액·공시 수치를 확인하지 못했거나 ADR 원주 환산이 필요해 절대가치의 숫자 계산을 보류했습니다.</p>';
    if(['financials-banks','financials-insurance','financials-brokers'].includes(c.industryId)){
      const annual=f.annual||[],last=annual.at(-1),prior=annual.at(-2),profit=metric(last,'netIncome'),book=metric(last,'equity'),oldBook=metric(prior,'equity'),latestBook=metric(v.balance,'equity');
      if(ownerIncome(profit)&&[book,oldBook,latestBook].every(ownerBook)&&[profit,book,oldBook,latestBook].every(m=>m?.unit==='USD'&&m.value>0)){
        const roe=profit.value/((book.value+oldBook.value)/2),g=.02;
        if(roe>g)return `<h3 class="report-subhead">잔여이익 관점의 정당화 P/B</h3><p class="company-reading-guide">${e(last.end)} 연간 순이익/기초·기말 평균 자기자본으로 계산한 ROE는 ${num(roe*100,'%')}입니다. 이 ROE가 장기 유지된다는 가정하에 요구수익률별 지분가치를 비교합니다.</p><div class="wide-wrap"><table class="report-table"><caption class="visually-hidden">요구수익률별 정당화 P/B와 지분가치</caption><thead><tr><th>주주 요구수익률</th><th>정당화 P/B</th><th>지분가치</th><th>현재 시총 대비</th></tr></thead><tbody>${[.13,.11,.09].map(k=>{const pb=(roe-g)/(k-g),value=latestBook.value*pb;return`<tr><td>${num(k*100,'%')}</td><td>${num(pb,'×')}</td><td>${money(value)}</td><td>${num((value/q.marketCap-1)*100,'%')}</td></tr>`;}).join('')}</tbody></table></div><p class="report-formula">P/B = (ROE − 영구성장률) / (요구수익률 − 영구성장률). 영구성장률 2%, 청정잉여관계·안정 ROE·성장에 필요한 이익 유보를 가정합니다. 계산에는 ${e(v.balance.end)} 공시 자기자본을 사용합니다. 이는 주가 목표가 아닌 가정 민감도입니다.</p><p class="company-reading-guide">한 해 ROE를 정상 수익성으로 확정하지 않았습니다. 보험 투자손익·준비금, 은행 충당금·증권평가손익, 브로커 거래 사이클, 우선주·비지배지분·영업권, 지급여력과 배당 제한을 조정하면 결과가 달라집니다. 현재 배수의 할인·할증이 위 위험을 반영하는지 확인해야 합니다.</p>`;
      }
    }
    if(c.sectorId==='financials'||isReit(c))return `<div class="callout neutral"><b>회사별 평가에 필요한 추가 자료</b>${isReit(c)?'리츠의 자산별 NOI·환원율·유지보수 투자와 차입금을 확인해야 합니다.':'은행·보험·브로커는 규제자본·가용 배당을, 결제망·거래소는 고객자금과 기업 현금의 구분 및 순차입·희석을 확인해야 합니다.'} 위 공시 배수와 회사별 절대가치 평가 방법을 함께 읽으세요. 확보한 표준 자료만으로 사업별 현금 배분을 확인할 수 없어 일괄 DCF 계산은 보류했습니다.</div>`;
    const annual=(f.annual||[]).slice(-3),cash=[];
    for(const p of annual){const fcf=metric(p,'freeCashFlow'),sbc=metric(p,'stockCompensation');if(fcf?.unit==='USD'&&sbc?.unit==='USD'&&fcf.start===sbc.start&&fcf.end===sbc.end)cash.push(fcf.value-sbc.value);}
    const scenarios=[{name:'보수',growth:0,discount:.13,terminal:.02},{name:'중간',growth:.05,discount:.11,terminal:.02},{name:'낙관',growth:.10,discount:.09,terminal:.02}];
    const normalized=c.ticker!=='THC'&&c.kind==='보통주'&&annual.every(p=>ownerIncome(metric(p,'netIncome')))&&cash.length===annual.length&&cash.length>=2&&cash.every(n=>n>0)?cash.reduce((s,n)=>s+n,0)/cash.length:null;
    const required=scenarios.map(s=>({...s,required:q.marketCap*(s.discount-s.terminal)/(1+s.terminal),model:normalized?ownerCashDcf(normalized,s.growth,s.discount,s.terminal):null}));
    return `<h3 class="report-subhead">가정에 따른 절대가치와 시장 기대</h3><p class="company-reading-guide">아래는 회사 전망이나 목표가가 아닌 민감도 계산입니다. 주주에게 귀속될 현금의 요구수익률과 성장 가정을 바꿔 현재 시가총액이 요구하는 현금을 살펴봅니다.</p><div class="wide-wrap"><table class="report-table"><caption class="visually-hidden">${e(c.ticker)} 절대가치 가정과 계산</caption><thead><tr><th>가정</th><th>5년 성장률 / 요구수익률</th><th>시총을 지지할 정상 연간 현금</th>${normalized?'<th>5년 DCF 지분가치</th><th>현재 시총 대비</th>':''}</tr></thead><tbody>${required.map(s=>`<tr><td>${s.name}</td><td>${num(s.growth*100,'%')} / ${num(s.discount*100,'%')}</td><td>${money(s.required)}</td>${normalized?`<td>${money(s.model.value)}</td><td>${num((s.model.value/q.marketCap-1)*100,'%')}</td>`:''}</tr>`).join('')}</tbody></table></div><p class="report-formula">정상 연간 현금 = 시가총액 × (요구수익률 − 영구성장률) ÷ (1 + 영구성장률). 영구성장률은 세 경우 모두 2%라는 분석 가정입니다. 안정 상태가 지금 시작된다는 역산이며, 안정화까지의 적자·증자·부채 상환이 필요하면 요구 현금은 더 커질 수 있습니다.</p>${normalized?`<p class="report-formula">DCF 시작 현금 ${money(normalized)} = 확보한 ${annual.length}개 연간 (CFO − 유형자산 투자 − 주식보상)의 평균. 향후 5년 현금을 할인하고 6년 차 현금/(요구수익률−2%)을 잔존가치로 더했습니다. 중간 가정에서 잔존가치 비중은 ${num(required[1].model.terminalShare*100,'%')}입니다.</p><p class="company-reading-guide">이자 지급 후 현금을 사용하므로 부채를 다시 차감하거나 현금을 더하지 않습니다. 순차입 0, 별도 배당·증자·지분희석·매각 0을 가정하며 주식보상은 희석 비용의 대용치로 차감했습니다. 만기상환·성장 투자·운전자본 정상화·비지배주주 현금 배분·SBC 실제 희석을 반영한 완성 FCFE 모형은 아닙니다. ${['energy','materials'].includes(c.sectorId)?'원자재 기업의 최근 3년 평균은 완전한 중간사이클 현금이 아니므로 별도 정상화가 특히 중요합니다.':''} 낮은 주가 또는 높은 계산가치만으로 저평가를 확정할 수 없습니다.</p>`:'<p class="company-reading-guide">동일 기간의 양(+)의 FCF·주식보상·귀속 이익 자료가 최소 2개 연간 기간에 확보되지 않았거나 비지배지분·MLP 배분 조정이 필요해 기계적인 DCF 지분가치는 표시하지 않습니다. 필요한 미래 현금 규모를 매출·마진·재투자·희석 가정으로 검증해야 합니다.</p>'}`;
  }
  function valuation(c,p){
    const research=p.investmentResearch,method=research?.valuation,v=valuationData(c.ticker),q=v.q;
    const peers=[...new Set(method?.relative?.peers?.length?method.relative.peers:(p.competitors||[]).map(x=>x.ticker))].filter(t=>t!==c.ticker&&A.companyMap.has(t)).slice(0,5);
    const rows=[v,...peers.map(valuationData)];
    const peerPE=rows.slice(1).filter(x=>Math.abs(Date.parse(x.annual?.end)-Date.parse(v.annual?.end))<=120*864e5&&metric(x.annual,'netIncome')?.basis===metric(v.annual,'netIncome')?.basis).map(x=>x.pe).filter(Number.isFinite).sort((a,b)=>a-b),median=peerPE.length>=2?(peerPE[Math.floor((peerPE.length-1)/2)]+peerPE[Math.ceil((peerPE.length-1)/2)])/2:null;
    return `<section id="company-valuation" class="panel"><div class="eyebrow">VALUATION · OBSERVED & ASSUMED</div><h2>상대·절대 밸류에이션</h2><div class="report-facts"><div><small>관측 주가</small><b>${q?num(q.price)+' '+e(q.currency):'미확보'}</b><small>${q?e(q.tradingDate)+' 거래일 · '+link(q.sourceUrl,'Yahoo Finance'):'시세 확인 필요'}</small></div><div><small>공급자 시가총액 · USD</small><b>${money(q?.marketCap)}</b><small>${q?.marketCap?e(q.marketCapRetrievedAt?.slice(0,10))+' 조회 · '+link(q.marketCapSourceUrl,'Nasdaq'):'시가총액 미확보'}</small></div><div><small>시가총액 / 최근 확보 연간 순이익</small><b>${num(v.pe,'배')}</b><small>${v.annual?e(v.annual.end)+' 종료 연간':'비교 기간 미확보'}</small></div><div><small>FCF 수익률 · 최근 연간</small><b>${num(v.fcfYield,'%')}</b><small>(CFO − 유형자산 투자) / 시총</small></div></div><p class="company-reading-guide">주가는 ${q?e(q.priceTime):'관측시각 미확보'}. 시가총액은 Nasdaq 조회값이며 별도 기준시각은 미제공입니다. 아래 배수는 최근 확보한 연간 공시 기준으로 TTM·선행 컨센서스 배수가 아닙니다. 음수 이익의 P/E, 음수 자본의 P/B와 ADR·통화 불일치는 계산하지 않습니다. 비지배지분을 포함한 이익·자본만 있거나 합병 전후 연결 범위가 다르면 해당 배수를 보류합니다. 금융업 P/S·FCF 수익률, 리츠 FCF 수익률은 비교에서 제외합니다.</p>
      <h3 class="report-subhead">${e(method?.relative?.method||'동종기업의 공시 기반 배수 비교')}</h3><p>${e(method?.relative?.rationale||'동일한 수익모델과 회계기간을 갖는 기업을 우선 비교합니다.')}</p><div class="wide-wrap"><table class="report-table"><caption class="visually-hidden">${e(c.ticker)}와 비교기업의 공시 기반 배수</caption><thead><tr><th>기업 / 기간</th><th>주가 / 거래일</th><th>시가총액</th><th>P/E</th><th>P/S</th><th>P/B</th><th>FCF 수익률</th></tr></thead><tbody>${rows.map(x=>`<tr class="${x.c.ticker===c.ticker?'report-current':''}"><th scope="row"><a href="#/company/${encodeURIComponent(x.c.ticker)}">${e(x.c.ticker)}</a><small>${e(x.annual?.end||'연간 미확보')}</small></th><td>${x.q?num(x.q.price)+' '+e(x.q.currency):'—'}<small>${e(x.q?.tradingDate||'')}</small></td><td>${money(x.q?.marketCap)}</td><td>${num(x.pe,'×')}</td><td>${num(x.ps,'×')}</td><td>${num(x.pb,'×')}<small>${e(x.balance?.end||'')}</small></td><td>${num(x.fcfYield,'%')}</td></tr>`).join('')}</tbody></table></div>${median&&v.pe?`<p class="report-calculation">결산일 차이 120일 이내·동일 회계기준 ${peerPE.length}개 기업 P/E 중앙값 ${num(median,'배')} 대비 ${e(c.ticker)}의 P/E는 ${num((v.pe/median-1)*100,'%')} 차이입니다. 기간과 사업 구성 차이가 있으므로 이 차이를 곧바로 고평가·저평가로 해석하지 않습니다.</p>`:''}<p class="company-reading-guide">${e(method?.relative?.watch||'성장률·마진·회계정책·희석과 자본집약도의 차이가 배수 차이를 설명하는지 확인합니다.')} 비교표는 경제적 경쟁 관계를 보여주는 출발점이며 모든 기업이 동일한 평가 배수를 적용받는다는 뜻은 아닙니다.</p>
      <h3 class="report-subhead">절대가치 평가 방법 · ${e(method?.absolute?.method||'정상화 현금흐름')}</h3>${bullets(method?.absolute?.drivers)}<p>${e(method?.absolute?.watch||'미래 성장·수익성·재투자·자본비용을 개별 검증해야 합니다.')}</p>${absoluteScreen(v)}<p class="source-posture">평가 단계: 1차 검토용. 시장 컨센서스, 확정된 WACC, 완전희석 자본구조와 회사별 자본조달 일정은 포함하지 않았습니다. 관측 시세와 공시 수치는 위 원문, 계산은 표시된 공식, 미래 값은 명시된 가정에 근거합니다.</p></section>`;
  }
  function policy(c,p){
    const r=p.investmentResearch;if(!r)return'';
    return `<section id="company-policy" class="panel"><div class="eyebrow">POLICY & REGULATION</div><h2>정부 정책과 규제의 투자 영향</h2>${narrative(r.policy)}<p class="company-reading-guide">정책 원문과 기업 노출도를 연결한 투자 관점의 해석입니다. 시행 시점·적용 대상·소송·예외 규정은 연결된 원문에서 확인합니다.</p></section><section id="company-report-sources" class="panel"><h2>심화 분석의 근거와 범위</h2><div class="source-links">${(r.sources||[]).map(s=>`<div>${link(s.url,s.title)}<small>${e(s.note)}${s.accessedOn?' · 확인 '+e(s.accessedOn):''}</small></div>`).join('')}</div><p class="source-posture">분석 작성 기준 ${e(r.asOf)} · 기존 기업 설명 검토 ${e(p.reviewedOn)}. 기업 설명·정책 확인일, 재무 보고기간, 주가 관측시각은 서로 다른 기준입니다. 공시 사실과 이를 바탕으로 한 사업·가치평가 해석을 구분했습니다.</p></section>`;
  }
  A.report={overview,context,financialRead,valuation,policy,valuationData,ownerCashDcf};
})();
