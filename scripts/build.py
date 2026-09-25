"""Validate sources and build the portable, fully offline HTML. Python 3.10+, stdlib only."""
from __future__ import annotations

import base64
import hashlib
import json
from pathlib import Path
from urllib.parse import urlparse
from datetime import date
import math

ROOT = Path(__file__).resolve().parents[1]
ORDER = ["communication", "consumer-discretionary", "consumer-staples", "energy", "financials", "real-estate", "health-care", "industrials", "materials", "technology", "utilities"]
CSS = ["tokens", "base", "layout", "components", "research", "navigation", "company-directory", "investment-report"]
JS = ["core", "views", "navigation", "company-directory", "treemap", "investment-report", "company", "app"]


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def validate(sectors: list, context: dict) -> dict:
    require([s["id"] for s in sectors] == ORDER, "Expected all 11 sectors in the documented order")
    industry_ids, tickers = set(), set()
    stats = {"sectors": len(sectors), "industries": 0, "companies": 0, "kpis": 0, "sources": len(context["sources"])}
    for s in sectors:
        for key in ["name", "en", "code", "summary", "concept", "valuation", "pitfall"]:
            require(isinstance(s[key], str) and bool(s[key].strip()), f"{s['id']}: empty {key}")
        require(len(s["color"]) == 7 and s["color"].startswith("#") and all(c in "0123456789abcdefABCDEF" for c in s["color"][1:]), "Invalid CSS color")
        require(len(s["industries"]) >= 4, f"{s['id']}: insufficient industry coverage")
        require(len(s["valueChain"]) == 4, f"{s['id']}: expected 4 value-chain nodes")
        require(all(r in ORDER for r in s["related"]), "Unknown related sector")
        require(set(s["macro"]) == {"growth", "rates", "inflation", "dollar"}, "Missing macro factor")
        stats["sources"] += len(s["sources"])
        for i in s["industries"]:
            require(i["id"] not in industry_ids and i["id"].startswith(s["id"] + "-") and ":" not in i["id"], f"Invalid or duplicate industry ID: {i['id']}")
            industry_ids.add(i["id"])
            require(len(i["kpis"]) >= 3 and len(i["companies"]) >= 2, f"Incomplete industry: {i['id']}")
            for key in ["name", "en", "summary", "mechanics", "valuation"]:
                require(isinstance(i[key], str) and bool(i[key].strip()), f"{i['id']}: empty {key}")
            for key, minimum in [("watch", 3), ("risks", 2), ("questions", 2)]:
                require(len(i[key]) >= minimum and all(isinstance(x, str) and x.strip() for x in i[key]), f"{i['id']}: incomplete {key}")
            for k in i["kpis"]:
                require(all(isinstance(k.get(f), str) and k[f].strip() for f in ["name", "meaning", "read"]), "Incomplete KPI")
            for c in i["companies"]:
                require(all(isinstance(c.get(f), str) and c[f].strip() for f in ["ticker", "name", "exchange", "business", "watch", "ir", "kind"]), f"Incomplete company in {i['id']}")
                require(c["kind"] in {"보통주", "ADR", "보통지분(MLP)"}, f"Unsupported security kind: {c['ticker']}")
                require(c["ticker"] not in tickers, f"Duplicate company ticker: {c['ticker']}")
                tickers.add(c["ticker"])
                require(urlparse(c["ir"]).scheme == "https", f"Invalid IR link: {c['ticker']}")
            stats["industries"] += 1
            stats["companies"] += len(i["companies"])
            stats["kpis"] += len(i["kpis"])
        for source in s["sources"]:
            require(urlparse(source["url"]).scheme == "https" and source["title"] and source["note"], "Invalid source record")
    require(len(context["glossary"]) >= 30, "Core glossary is incomplete")
    return stats


def main() -> None:
    context = json.loads(read(ROOT / "data/context.json"))
    sectors = [json.loads(read(ROOT / f"data/sectors/{name}.json")) for name in ORDER]
    stats = validate(sectors, context)
    font = base64.b64encode((ROOT / "assets/fonts/PretendardVariable.woff2").read_bytes()).decode("ascii")
    license_text = read(ROOT / "assets/fonts/OFL.txt")
    styles = f"/* Pretendard v1.3.9 — SIL Open Font License 1.1\n{license_text.replace('*/', '* /')}\n*/\n@font-face{{font-family:'Pretendard Variable';font-style:normal;font-weight:45 920;font-display:swap;src:url(data:font/woff2;base64,{font}) format('woff2')}}\n"
    styles += "\n".join(read(ROOT / f"src/css/{name}.css") for name in CSS)
    styles += "\n/* Lucide icon license\n" + read(ROOT / "assets/icons/LICENSE").replace("*/", "* /") + "\n*/\n"
    scripts = "\n".join(read(ROOT / f"src/js/{name}.js") for name in JS)
    extras = {}
    for key, filename, default in [("profiles", "companies.json", {}), ("financials", "financials.json", {"companies":{}}), ("marketData", "market-data.json", {"companies":{}}), ("updateStatus", "update-status.json", {})]:
        path = ROOT / "data" / filename
        extras[key] = json.loads(read(path)) if path.exists() else default
    if (ROOT / "data/companies").exists():
        extras["profiles"] = {p.stem:json.loads(read(p)) for p in sorted((ROOT / "data/companies").glob("*.json"))}
    tickers={c["ticker"] for s in sectors for i in s["industries"] for c in i["companies"]}
    require(set(extras["profiles"])==tickers,"Company profiles must exactly match the sector universe")
    for ticker,p in extras["profiles"].items():
        require(p["ticker"]==ticker and p.get("oneLiner") and p.get("businessModel") and p.get("macroLink"),f"Incomplete profile: {ticker}")
        date.fromisoformat(p["reviewedOn"])
        for key in ("revenueStreams","history","strengths","weaknesses","competitors","monitoring","sources"):
            require(len(p.get(key,[]))>=2,f"Incomplete {key}: {ticker}")
        for source in p["sources"]:
            require(urlparse(source["url"]).scheme=="https" and source.get("note"),f"Missing primary source: {ticker}")
        research=p.get("investmentResearch",{})
        require(research.get("thesis") and research.get("asOf"),f"Missing investment research: {ticker}")
        date.fromisoformat(research["asOf"])
        for key in ("businessDrivers","macro","moat","financialFocus","policy"):
            require(len(research.get(key,[]))>=(1 if key=="policy" else 2) and all(x.get("title") and x.get("detail") for x in research[key]),f"Incomplete investment {key}: {ticker}")
        for key in ("catalysts","falsifiers","sources"):
            require(len(research.get(key,[]))>=2,f"Incomplete investment {key}: {ticker}")
        for source in research["sources"]:
            require(urlparse(source.get("url","")).scheme=="https" and source.get("note"),f"Missing investment evidence: {ticker}")
        for key in ("relative","absolute"):
            require(research.get("valuation",{}).get(key,{}).get("method"),f"Missing {key} valuation method: {ticker}")
    require(set(extras["financials"]["companies"])==tickers,"Financial universe must match coverage")
    require(set(extras["marketData"]["companies"])==tickers,"Market snapshots must match coverage")
    for ticker,f in extras["financials"]["companies"].items():
        for period in f.get("annual",[])+([f["latestQuarter"]] if f.get("latestQuarter") else []):
            for key,m in period["metrics"].items():
                require(isinstance(m["value"],(int,float)) and math.isfinite(m["value"]),f"Non-finite metric: {ticker}/{key}")
                require(m.get("unit") and m.get("basis") and (m.get("filed") or m.get("availableOn")) and m["end"]==period["end"] and urlparse(m["sourceUrl"]).scheme=="https",f"Financial provenance missing: {ticker}/{key}")
    payload = json.dumps({"context": context, "sectors": sectors, **extras}, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    template = read(ROOT / "src/index.html")
    icon = read(ROOT / "assets/icons/chart.svg").replace('stroke="currentColor"', 'stroke="#5ce1c2"').replace('<svg', '<svg style="background:#152235;border-radius:5px;padding:2px"', 1)
    favicon = '<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,' + base64.b64encode(icon.encode()).decode() + '">'
    output = template.replace("<!--@FAVICON-->", favicon).replace("<!--@STYLES-->", f"<style>\n{styles}\n</style>").replace("<!--@DATA-->", f'<script type="application/json" id="archive-data">{payload}</script>').replace("<!--@SCRIPTS-->", f"<script>\n{scripts}\n</script>")
    require("<!--@" not in output, "Unreplaced template marker")
    require("</script" not in scripts.lower(), "Unsafe inline script close sequence")
    target = ROOT / "3. Industry Study.html"
    target.write_text(output, encoding="utf-8", newline="\n")
    print(f"Built {target.name}: {len(output.encode('utf-8')):,} bytes")
    print(json.dumps(stats, ensure_ascii=False))
    print("SHA256 " + hashlib.sha256(output.encode("utf-8")).hexdigest())


if __name__ == "__main__":
    main()
