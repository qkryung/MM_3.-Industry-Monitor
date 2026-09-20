"""Explicit, source-backed identity continuity and manually reviewed IR supplements."""
from financials import LABELS

def available_on(metric):
    return metric.get("filed") or metric.get("availableOn") or "9999-12-31"

def precedence_on(metric):
    return metric.get("filed") or metric.get("releasedOn") or metric.get("authorizedOn") or metric.get("availableOn") or ""


def refresh_derivations(metrics):
    for key in ("netMargin","operatingMargin","freeCashFlow"):
        metrics.pop(key,None)
    def same(a,b):return a and b and all(a.get(k)==b.get(k) for k in ("start","end","unit","basis"))
    for numerator,key in [("netIncome","netMargin"),("operatingIncome","operatingMargin")]:
        a,b=metrics.get(numerator),metrics.get("revenue")
        if same(a,b) and b["value"]>0:
            metrics[key]={**a,"label":LABELS[key],"value":a["value"]/b["value"]*100,"unit":"percent","derived":True,"formula":f"{LABELS[numerator]} ÷ 매출·영업수익 × 100","inputSources":[a["sourceUrl"],b["sourceUrl"]]}
    a,b=metrics.get("operatingCashFlow"),metrics.get("capex")
    if same(a,b):
        metrics["freeCashFlow"]={**a,"value":a["value"]-b["value"],"label":LABELS["freeCashFlow"],"derived":True,"formula":"영업현금흐름 − 유형자산 취득 지출","inputSources":[a["sourceUrl"],b["sourceUrl"]]}


def apply_adjustments(current, adjustment=None, predecessor=None, supplement=None, cutoff="9999-12-31"):
    adjustment=adjustment or {}
    if adjustment.get("note"):
        current["entityNote"]={"text":adjustment["note"],"sourceUrl":adjustment["sourceUrl"]}
    if predecessor:
        through=adjustment["historyThrough"]
        records={a["end"]:a for a in predecessor["annual"] if a["end"]<=through}
        records.update({a["end"]:a for a in current["annual"]})
        current["annual"]=[records[d] for d in sorted(records)[-3:]]
        oldq=predecessor.get("latestQuarter")
        if oldq and oldq["end"]<=through and (not current.get("latestQuarter") or oldq["end"]==current["latestQuarter"]["end"]):
            current["latestQuarter"]=oldq
    if supplement:
        by_end={a["end"]:a for a in current["annual"]}
        for extra in supplement.get("annual",[]):
            if extra["end"]>cutoff:continue
            if not any(available_on(m)<=cutoff for m in extra["metrics"].values()):continue
            existing=by_end.setdefault(extra["end"],{"end":extra["end"],"kind":"annual","metrics":{}})
            for key,metric in extra["metrics"].items():
                if available_on(metric)<=cutoff and precedence_on(metric)>=precedence_on(existing["metrics"].get(key,{})):
                    existing["metrics"][key]=metric
            refresh_derivations(existing["metrics"])
        current["annual"]=[by_end[d] for d in sorted(by_end)[-3:]]
        q=supplement.get("latestQuarter")
        if q and q["end"]<=cutoff and all(available_on(m)<=cutoff for m in q["metrics"].values()):
            if not current.get("latestQuarter") or q["end"]>current["latestQuarter"]["end"]:current["latestQuarter"]=q
            elif q["end"]==current["latestQuarter"]["end"]:
                for key,m in q["metrics"].items():
                    if precedence_on(m)>=precedence_on(current["latestQuarter"]["metrics"].get(key,{})):current["latestQuarter"]["metrics"][key]=m
            refresh_derivations(current["latestQuarter"]["metrics"])
        current["supplementNote"]=supplement.get("note","일부 지표는 공식 IR 원문을 직접 확인해 보완했습니다. 배치 갱신은 수동 보완 자료의 검토일을 바꾸지 않습니다.")
    coverage=[]
    last=current["annual"][-1] if current["annual"] else None
    expected=current.get("latestAnnualReportEnd")
    if expected and (not last or last["end"]<expected):coverage.append(f"최근 연차 공시 기간은 {expected}이지만, 확보한 연간 수치는 {last['end'] if last else '없음'}까지입니다.")
    if last and "revenue" not in last["metrics"]:coverage.append("최근 연간 매출에 해당하는 수치를 확보하지 못했습니다. 미제공은 0이 아닙니다.")
    expected_quarter=current.get("latestQuarterReportEnd")
    if expected_quarter and (not last or expected_quarter>last["end"]) and (not current.get("latestQuarter") or current["latestQuarter"]["end"]<expected_quarter):coverage.append(f"최근 분기 공시 기간 {expected_quarter}의 표준 분기 수치를 확보하지 못했습니다.")
    current["coverageNotes"]=coverage
    if current["annual"] or current.get("latestQuarter"):current["status"]="available"
    return current
