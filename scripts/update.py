"""Refresh SEC listings/financials and rebuild offline HTML, preserving curated research.

Usage: python scripts/update.py [--offline] [--limit N] [--tickers MSFT,AAPL]
SEC_USER_AGENT may contain a user's own contact identification; no API key is required.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
import tempfile
import urllib.error
import urllib.request
from datetime import date, datetime, timezone

from financials import extract
from financial_adjustments import apply_adjustments

ROOT=Path(__file__).resolve().parents[1]
CACHE=Path(os.environ.get("INDUSTRY_ARCHIVE_CACHE",str(Path(tempfile.gettempdir())/"industry-archive-sec-cache")))
DATA=ROOT/"data"
HEADERS={"User-Agent":os.environ.get("SEC_USER_AGENT","IndustryArchive/2.0 personal educational research"),"Accept":"application/json","Accept-Encoding":"identity"}
LAST_REQUEST=0.0


def read_json(path, default=None):
    return json.loads(path.read_text(encoding="utf-8-sig")) if path.exists() else default


def write_json(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    temp=path.with_suffix(path.suffix+".tmp")
    temp.write_text(json.dumps(value,ensure_ascii=False,indent=2)+"\n",encoding="utf-8",newline="\n")
    temp.replace(path)


def fetch(url, cache_file, offline=False):
    global LAST_REQUEST
    if offline:
        if not cache_file.exists():raise ValueError("No cached source")
        return read_json(cache_file)
    # Under 3 requests/second and sequential; respect SEC's 10 requests/second limit.
    delay=max(0,0.38-(time.monotonic()-LAST_REQUEST))
    if delay:time.sleep(delay)
    LAST_REQUEST=time.monotonic()
    req=urllib.request.Request(url,headers=HEADERS)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req,timeout=40) as response:
                result=json.loads(response.read())
            write_json(cache_file,result)
            return result
        except urllib.error.HTTPError as error:
            if error.code in (403,429):
                if attempt==2:raise
                time.sleep(3*(attempt+1))
            else:raise


def facts_cache_reusable(factfile,meta,accessions,force=False,now=None):
    """Advance this marker only after facts download succeeds; expire delayed XBRL."""
    age=(time.time() if now is None else now)-meta.get("fetchedAt",0)
    return bool(not force and factfile.exists() and meta.get("accessions")==accessions and 0<=age<86400 and meta.get("complete",False))


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--offline",action="store_true",help="Use local SEC cache only")
    p.add_argument("--limit",type=int,default=0)
    p.add_argument("--tickers",default="")
    p.add_argument("--force",action="store_true",help="Re-download facts even when filing list is unchanged")
    p.add_argument("--no-build",action="store_true")
    p.add_argument("--as-of",default=date.today().isoformat())
    args=p.parse_args()
    stamp=datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    CACHE.mkdir(parents=True,exist_ok=True)
    report={"startedAt":datetime.now(timezone.utc).isoformat(),"asOf":args.as_of,"mode":"offline" if args.offline else "SEC network","updated":[],"preserved":[],"errors":[],"warnings":[],"researchNote":"기업의 사업·연혁·강약점·경쟁 구도는 수동 검토 콘텐츠입니다. 이 배치는 상장 정보·공시 재무·최근 공시 목록을 갱신하고 HTML을 재생성합니다. 서술의 검토일은 자동 변경하지 않습니다."}
    sectors=[read_json(file) for file in sorted((DATA/"sectors").glob("*.json"))]
    companies=[{**c,"sectorId":s["id"]} for s in sectors for i in s["industries"] for c in i["companies"]]
    targets=set(args.tickers.upper().split(',')) if args.tickers else None
    selected=[c for c in companies if not targets or c["ticker"].upper() in targets]
    if args.limit:selected=selected[:args.limit]
    existing=read_json(DATA/"financials.json",{"asOf":None,"companies":{}})
    if (DATA/"financials.json").exists():
        backup=ROOT/"backups"/stamp;backup.mkdir(parents=True,exist_ok=True)
        shutil.copy2(DATA/"financials.json",backup/"financials.json")
        if (ROOT/"index.html").exists():shutil.copy2(ROOT/"index.html",backup/"index.html")
    try:
        listing=fetch("https://www.sec.gov/files/company_tickers_exchange.json",CACHE/"listings.json",args.offline)
    except Exception as exc:
        listing=read_json(CACHE/"listings.json")
        report["warnings"].append({"ticker":"LISTINGS","error":str(exc)+"; using saved identities and verifying each issuer through current SEC submissions","preserved":bool(listing)})
    prior=read_json(DATA/"listing-verification.json",{}).get("companies",[])
    lookup={r["ticker"].replace('.','-'):r for r in prior}
    if listing:
        for r in listing["data"]:
            saved=lookup.get(r[2],{})
            if saved.get("cik")!=r[0]:saved={}
            lookup[r[2]]={**saved,"cik":r[0],"sec_name":r[1],"ticker":r[2],"exchange":r[3]}
    company_financials=existing["companies"]
    adjustments=read_json(DATA/"financial-adjustments.json",{})
    supplements=read_json(DATA/"financial-supplements.json",{})
    for index,c in enumerate(selected,1):
        ticker=c["ticker"]
        identity=lookup.get(ticker.replace('.','-'))
        print(f"[{index}/{len(selected)}] {ticker}",flush=True)
        try:
            if not identity or not identity.get("cik"):raise ValueError("Ticker is absent from SEC listing map; manual identity review required")
            cik=int(identity["cik"])
            subfile=CACHE/f"{cik:010d}-submissions.json"
            sub=fetch(f"https://data.sec.gov/submissions/CIK{cik:010d}.json",subfile,args.offline)
            current_tickers=sub.get("tickers",[])
            current_exchanges=sub.get("exchanges",[])
            normalized=[t.replace('.','-') for t in current_tickers]
            if ticker.replace('.','-') in normalized:
                ix=normalized.index(ticker.replace('.','-'))
                if ix<len(current_exchanges):
                    identity["exchange"]=current_exchanges[ix]
                    identity["verifiedOn"]=datetime.fromtimestamp(subfile.stat().st_mtime,timezone.utc).date().isoformat() if args.offline else date.today().isoformat()
                    identity["identitySource"]=f"https://data.sec.gov/submissions/CIK{cik:010d}.json"
            else:
                report["warnings"].append({"ticker":ticker,"error":"Stored ticker is not in the issuer's current SEC submissions list; manual identity review required"})
            new_accessions=sub.get("filings",{}).get("recent",{}).get("accessionNumber",[])[:8]
            factfile=CACHE/f"{cik:010d}-facts.json"
            metafile=CACHE/f"{cik:010d}-facts-meta.json"
            metadata=read_json(metafile,{})
            downloaded=False
            if factfile.exists() and (args.offline or facts_cache_reusable(factfile,metadata,new_accessions,args.force)):
                facts=read_json(factfile)
            else:
                facts=fetch(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik:010d}.json",factfile,args.offline)
                downloaded=not args.offline
            extracted=extract(facts,sub,c,args.as_of)
            if downloaded:
                write_json(metafile,{"accessions":new_accessions,"fetchedAt":time.time(),"complete":not bool(extracted.get("coverageNotes"))})
            adjustment=adjustments.get(ticker,{})
            predecessor=None
            if adjustment.get("predecessorCik"):
                pcik=adjustment["predecessorCik"]
                pf=CACHE/f"{pcik:010d}-facts.json"
                ps=CACHE/f"{pcik:010d}-submissions.json"
                pfacts=read_json(pf) if pf.exists() and not args.force else fetch(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{pcik:010d}.json",pf,args.offline)
                psub=read_json(ps) if ps.exists() and not args.force else fetch(f"https://data.sec.gov/submissions/CIK{pcik:010d}.json",ps,args.offline)
                predecessor=extract(pfacts,psub,c,args.as_of)
            extracted=apply_adjustments(extracted,adjustment,predecessor,supplements.get(ticker),args.as_of)
            extracted["asOf"]=args.as_of
            extracted["retrievedOn"]=date.today().isoformat()
            if args.offline:
                extracted["retrievedOn"]=company_financials.get(ticker,{}).get("retrievedOn") or datetime.fromtimestamp(factfile.stat().st_mtime,timezone.utc).date().isoformat()
                extracted["cacheRebuiltOn"]=args.as_of
            if extracted["status"]=="unavailable" and ticker in company_financials:
                report["preserved"].append(ticker)
                report["warnings"].append({"ticker":ticker,"error":"No usable financial periods in fetched data; previous financials retained."})
            else:
                company_financials[ticker]=extracted
                report["updated"].append(ticker)
        except Exception as exc:
            report["errors"].append({"ticker":ticker,"error":str(exc),"preserved":ticker in company_financials})
            if ticker in company_financials:report["preserved"].append(ticker)
            else:company_financials[ticker]={"ticker":ticker,"status":"unavailable","retrievedOn":None,"annual":[],"latestQuarter":None,"filings":[],"notes":["SEC 표준 태그에서 재무 수치를 확보하지 못했습니다. 회사 IR의 최신 재무제표를 확인하세요."]}
        if index%10==0:write_json(DATA/"financials.json",{"asOf":args.as_of,"companies":company_financials})
    write_json(DATA/"financials.json",{"asOf":args.as_of,"companies":company_financials})
    # Listing differences are reported, never silently used to replace curated issuer identities.
    check=[]
    for c in companies:
        r=lookup.get(c["ticker"].replace('.','-'))
        if r and str(r.get("exchange","")).lower()!=c["exchange"].lower():
            report["warnings"].append({"ticker":c["ticker"],"error":f"표시 거래소 {c['exchange']}와 SEC 제출 목록의 {r.get('exchange')}가 다릅니다. 최근 거래소 이전과 SEC 반영 시차를 기업 공식 자료에서 확인하세요. 기업 분류는 자동 변경하지 않았습니다."})
        check.append({"ticker":c["ticker"],"name":c["name"],"exchange":c["exchange"],"sec_name":r.get("sec_name",r.get("name")) if r else None,"cik":r.get("cik") if r else None,"verifiedOn":r.get("verifiedOn") if r else None,"identitySource":r.get("identitySource") if r else None,"matched":bool(r and str(r.get("exchange","")).lower()==c["exchange"].lower())})
    write_json(DATA/"listing-verification.json",{"checkedOn":args.as_of if listing else None,"source":"https://www.sec.gov/files/company_tickers_exchange.json","scope":"Ticker/exchange identity; differences require manual review.","total":len(check),"mismatches":[x["ticker"] for x in check if not x["matched"]],"companies":sorted(check,key=lambda r:r["ticker"])})
    profiles={p.stem:read_json(p) for p in (DATA/"companies").glob("*.json")}
    report["researchReviewDue"]=[c["ticker"] for c in companies if c["ticker"] not in profiles or any(f["filed"]>profiles.get(c["ticker"],{}).get("reviewedOn","") for f in company_financials.get(c["ticker"],{}).get("filings",[]))]
    report["completedAt"]=datetime.now(timezone.utc).isoformat()
    write_json(DATA/"update-status.json",report)
    write_json(ROOT/"logs"/f"update-{stamp}.json",report)
    if not args.no_build:
        result=subprocess.run([sys.executable,str(ROOT/"scripts/build.py")],cwd=ROOT)
        if result.returncode:raise SystemExit(result.returncode)
    print(f"Updated: {len(report['updated'])}; preserved: {len(report['preserved'])}; errors: {len(report['errors'])}; narrative review due: {len(report['researchReviewDue'])}")
    print("Report: data/update-status.json | Personal notes were not modified.")
    if report["errors"]:raise SystemExit(2)


if __name__=="__main__":main()
