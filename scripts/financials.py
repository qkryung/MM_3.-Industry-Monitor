"""Conservative extraction of consolidated financial statements from SEC Company Facts.

No forecasts, currency conversions, market prices, or custom company tags are inferred.
Every value keeps its own period, unit, taxonomy, accession and filing date.
"""
from __future__ import annotations

from collections import Counter
from datetime import date

ANNUAL_FORMS = {"10-K", "10-K/A", "20-F", "20-F/A", "40-F", "40-F/A"}
QUARTER_FORMS = {"10-Q", "10-Q/A", "6-K", "6-K/A"}
TAGS = {
    "revenue": [("us-gaap", x) for x in ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueNet", "RevenueFromContractWithCustomerIncludingAssessedTax", "OperatingRevenues", "RegulatedAndUnregulatedOperatingRevenue"]] + [("ifrs-full", "Revenue"), ("ifrs-full", "RevenueFromContractsWithCustomers")],
    "operatingIncome": [("us-gaap", "OperatingIncomeLoss"), ("ifrs-full", "ProfitLossFromOperatingActivities")],
    "netIncome": [("us-gaap", "NetIncomeLossAvailableToCommonStockholdersBasic"), ("us-gaap", "NetIncomeLoss"), ("us-gaap", "ProfitLoss"), ("ifrs-full", "ProfitLossAttributableToOwnersOfParent"), ("ifrs-full", "ProfitLoss")],
    "eps": [("us-gaap", "EarningsPerShareDiluted"), ("ifrs-full", "DilutedEarningsLossPerShare")],
    "operatingCashFlow": [("us-gaap", "NetCashProvidedByUsedInOperatingActivities"), ("ifrs-full", "CashFlowsFromUsedInOperatingActivities")],
    "capex": [("us-gaap", "PaymentsToAcquirePropertyPlantAndEquipment"), ("ifrs-full", "PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities")],
    "assets": [("us-gaap", "Assets"), ("ifrs-full", "Assets")],
    "equity": [("us-gaap", "StockholdersEquity"), ("us-gaap", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"), ("ifrs-full", "EquityAttributableToOwnersOfParent"), ("ifrs-full", "Equity")],
    "cash": [("us-gaap", "CashAndCashEquivalentsAtCarryingValue"), ("ifrs-full", "CashAndCashEquivalents")],
    "liabilities": [("us-gaap", "Liabilities"), ("ifrs-full", "Liabilities")],
    "currentAssets": [("us-gaap", "AssetsCurrent"), ("ifrs-full", "CurrentAssets")],
    "currentLiabilities": [("us-gaap", "LiabilitiesCurrent"), ("ifrs-full", "CurrentLiabilities")],
    "longTermDebt": [("us-gaap", "LongTermDebtNoncurrent"), ("us-gaap", "LongTermDebt"), ("ifrs-full", "NoncurrentBorrowings")],
    "currentDebt": [("us-gaap", "LongTermDebtCurrent"), ("ifrs-full", "CurrentBorrowings")],
    "shortTermBorrowings": [("us-gaap", "ShortTermBorrowings")],
    "stockCompensation": [("us-gaap", "ShareBasedCompensation"), ("ifrs-full", "AdjustmentsForSharebasedPayments")],
    "dilutedShares": [("us-gaap", "WeightedAverageNumberOfDilutedSharesOutstanding"), ("ifrs-full", "AdjustedWeightedAverageShares")],
}
BALANCES = {"assets", "equity", "cash", "liabilities", "currentAssets", "currentLiabilities", "longTermDebt", "currentDebt", "shortTermBorrowings"}
LABELS = {"revenue":"매출·영업수익", "operatingIncome":"영업이익", "netIncome":"순이익", "eps":"희석 EPS", "operatingCashFlow":"영업현금흐름", "capex":"유형자산 투자", "assets":"총자산", "equity":"자기자본", "cash":"현금·현금성자산", "freeCashFlow":"단순 잉여현금흐름", "operatingMargin":"영업이익률", "netMargin":"순이익률"}
LABELS.update({"liabilities":"총부채", "currentAssets":"유동자산", "currentLiabilities":"유동부채", "longTermDebt":"장기차입금(표준 태그)", "currentDebt":"유동성 장기차입금", "shortTermBorrowings":"단기차입금", "stockCompensation":"주식보상비용", "dilutedShares":"가중평균 희석주식 수"})


def days(row):
    try:
        return (date.fromisoformat(row["end"]) - date.fromisoformat(row["start"])).days
    except (ValueError, KeyError):
        return None


def filing_link(cik, accession):
    return f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{accession.replace('-', '')}/{accession}-index.html"


def all_rows(facts, metric, cutoff, financial_sector=False):
    tags = TAGS[metric]
    if metric == "revenue" and financial_sector:
        tags = [("us-gaap", "RevenuesNetOfInterestExpense"), ("us-gaap", "Revenues"), ("us-gaap", "RevenueFromContractWithCustomerExcludingAssessedTax"), ("ifrs-full", "Revenue")]
    result = []
    for rank, (taxonomy, tag) in enumerate(tags):
        concept = facts.get("facts", {}).get(taxonomy, {}).get(tag, {})
        for unit, entries in concept.get("units", {}).items():
            if unit == "pure" or (unit == "shares" and metric != "dilutedShares"):
                continue
            for r in entries:
                if r.get("filed", "9999") > cutoff or r.get("end", "9999") > cutoff or not isinstance(r.get("val"), (int, float)):
                    continue
                if r.get("form") not in ANNUAL_FORMS | QUARTER_FORMS:
                    continue
                result.append({**r, "unit":unit, "taxonomy":taxonomy, "tag":tag, "rank":rank, "definition":concept.get("description", "")})
    return result


def normalize(row, cik, metric):
    return {"value":row["val"], "unit":row["unit"], "start":row.get("start"), "end":row["end"], "filed":row["filed"], "form":row["form"], "accession":row["accn"], "taxonomy":row["taxonomy"], "tag":row["tag"], "label":LABELS[metric], "sourceUrl":filing_link(cik, row["accn"]), "basis":"IFRS" if row["taxonomy"] == "ifrs-full" else "US GAAP", "definition":row["definition"], "derived":False}


def period_metrics(rows, cik, end, kind, currency, hint=None):
    metrics = {}
    for key, candidates in rows.items():
        available=[]
        for r in candidates:
            if r["end"] != end:
                continue
            duration = days(r)
            if key in BALANCES:
                okay = duration is None
            elif kind == "annual":
                okay = r["form"] in ANNUAL_FORMS and duration is not None and 330 <= duration <= 400
            elif key in {"operatingCashFlow", "capex", "stockCompensation"}:
                # Interim cash flow is usually year-to-date, and remains explicitly labeled.
                okay = r["form"] in QUARTER_FORMS and duration is not None and 60 <= duration <= 300
            else:
                okay = r["form"] in QUARTER_FORMS and duration is not None and 60 <= duration <= 110
            if okay:
                available.append(r)
        if not available:
            continue
        preferred = [r for r in available if r["unit"] == ("shares" if key == "dilutedShares" else currency + "/shares" if key == "eps" else currency)]
        if preferred:
            available = preferred
        # Choose recent restated facts, then the intended primary taxonomy concept.
        latest_filed=max(r["filed"] for r in available)
        available=[r for r in available if r["filed"]==latest_filed]
        available.sort(key=lambda r:(r.get("accn")==hint, -r["rank"], days(r) or 0), reverse=True)
        metrics[key]=normalize(available[0], cik, key)
        if kind == "quarter" and key in {"operatingCashFlow", "capex", "stockCompensation"} and days(available[0]) > 110:
            metrics[key]["cumulative"] = True
    def compatible(a, b):
        return all(a.get(k)==b.get(k) for k in ["unit","start","end","basis"])
    for numerator,key in [("operatingIncome","operatingMargin"),("netIncome","netMargin")]:
        a,b=metrics.get(numerator),metrics.get("revenue")
        if a and b and b["value"]>0 and compatible(a,b):
            metrics[key]={**a,"value":a["value"]/b["value"]*100,"unit":"percent","label":LABELS[key],"derived":True,"formula":f"{LABELS[numerator]} ÷ 매출·영업수익 × 100", "inputSources":[a["sourceUrl"],b["sourceUrl"]]}
    a,b=metrics.get("operatingCashFlow"),metrics.get("capex")
    if a and b and compatible(a,b):
        metrics["freeCashFlow"]={**a,"value":a["value"]-b["value"],"label":LABELS["freeCashFlow"],"derived":True,"formula":"영업현금흐름 − 유형자산 취득 지출; 기업의 조정 FCF 정의와 다를 수 있음", "inputSources":[a["sourceUrl"],b["sourceUrl"]]}
    return metrics


def extract(facts, submissions, company, cutoff):
    cik=int(facts["cik"])
    financial=company.get("sectorId")=="financials"
    rows={key:all_rows(facts,key,cutoff,financial) for key in TAGS}
    anchors=rows["revenue"]+rows["netIncome"]+rows["operatingCashFlow"]
    annual_rows=[r for r in anchors if r["form"] in ANNUAL_FORMS and days(r) is not None and 330<=days(r)<=400]
    by_year={}
    for r in annual_rows:
        year=r["end"][:4]
        by_year[year]=max(by_year.get(year,""),r["end"])
    ends=sorted(by_year.values(),reverse=True)[:3]
    latest_end=ends[0] if ends else None
    native=[r for r in rows["revenue"] if r["end"]==latest_end and r["form"] in ANNUAL_FORMS and days(r) is not None and 330<=days(r)<=400]
    if not native:
        native=[r for r in annual_rows if r["end"]==latest_end]
    if native:
        latest=max(r["filed"] for r in native)
        currencies=Counter(r["unit"] for r in native if r["filed"]==latest)
        currency=currencies.most_common(1)[0][0]
    else:
        currency="USD"
    annual=[{"end":end,"kind":"annual","metrics":period_metrics(rows,cik,end,"annual",currency)} for end in reversed(ends)]
    quarter_rows=[r for r in anchors if r["form"] in QUARTER_FORMS and days(r) is not None and 60<=days(r)<=110 and (not latest_end or r["end"]>latest_end)]
    qend=max((r["end"] for r in quarter_rows),default=None)
    quarter={"end":qend,"kind":"quarter","metrics":period_metrics(rows,cik,qend,"quarter",currency)} if qend else None
    recent=submissions.get("filings",{}).get("recent",{})
    filings=[]
    for n,form in enumerate(recent.get("form",[])):
        if form in ANNUAL_FORMS|QUARTER_FORMS|{"8-K","8-K/A"} and recent["filingDate"][n]<=cutoff:
            acc=recent["accessionNumber"][n]
            doc=recent["primaryDocument"][n]
            filings.append({"form":form,"filed":recent["filingDate"][n],"period":recent.get("reportDate",[""]*len(recent["form"]))[n],"url":f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc.replace('-','')}/{doc}","accession":acc})
            if len(filings)>=5:break
    latest_annual_filed=max((recent.get("reportDate",[])[n] for n,form in enumerate(recent.get("form",[])) if form in ANNUAL_FORMS and recent["filingDate"][n]<=cutoff),default=None)
    latest_quarter_filed=max((recent.get("reportDate",[])[n] for n,form in enumerate(recent.get("form",[])) if form in {"10-Q","10-Q/A"} and recent["filingDate"][n]<=cutoff),default=None)
    coverage=[]
    if latest_annual_filed and (not latest_end or latest_end<latest_annual_filed):coverage.append(f"최근 연차 공시의 보고기간은 {latest_annual_filed}이지만, 표준 태그에서 확보한 연간 수치는 {latest_end or '없음'}까지입니다. 최신 원문을 함께 확인하세요.")
    if latest_quarter_filed and (not latest_end or latest_quarter_filed>latest_end) and (not qend or qend<latest_quarter_filed):coverage.append(f"최근 분기 공시 보고기간 {latest_quarter_filed}의 표준 분기 수치를 모두 확보하지 못했습니다.")
    if annual and "revenue" not in annual[-1]["metrics"]:coverage.append("최근 연간 매출에 해당하는 표준 태그를 찾지 못했습니다. 없는 값은 0으로 처리하지 않습니다.")
    availability="available" if annual or quarter else "unavailable"
    return {"ticker":company["ticker"],"cik":cik,"entityName":facts.get("entityName"),"retrievedOn":cutoff,"status":availability,"currency":currency,"annual":annual,"latestQuarter":quarter,"filings":filings,"latestAnnualReportEnd":latest_annual_filed,"latestQuarterReportEnd":latest_quarter_filed,"coverageNotes":coverage,"sourceUrl":f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik:010d}.json","notes":["SEC 표준 XBRL 태그의 연결 재무 수치입니다. 공시가 수정되면 과거 수치도 바뀔 수 있습니다.","분기 손익은 3개월, 분기 현금흐름은 공시된 연초누적일 수 있습니다. 각 지표의 시작·종료일을 확인하세요.","자료에 없는 표준 지표는 미제공으로 표시합니다. IFRS·은행·보험·리츠의 지표를 일반 제조업과 단순 비교하지 마세요."]}
