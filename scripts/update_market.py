"""Fetch dated public price snapshots and Nasdaq market caps; no consensus is inferred."""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import json
from pathlib import Path
import tempfile
import time
import urllib.request
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path(tempfile.gettempdir()) / "industry-archive-market-cache"
HEADERS = {"User-Agent": "Mozilla/5.0 IndustryArchive educational research", "Accept": "application/json"}
SCREENER = "https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=0&offset=0&download=true"


def fetch(url):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=25) as response:
                return json.load(response)
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--as-of", default=datetime.now(timezone.utc).date().isoformat())
    parser.add_argument("--tickers", default="")
    args = parser.parse_args()
    CACHE.mkdir(exist_ok=True)
    target = ROOT / "data/market-data.json"
    prior = json.loads(target.read_text(encoding="utf-8")) if target.exists() else {}
    companies = prior.get("companies", {})
    universe = {c["ticker"] for p in (ROOT / "data/sectors").glob("*.json") for i in json.loads(p.read_text(encoding="utf-8-sig"))["industries"] for c in i["companies"]}
    for p in (ROOT / "data/expansion").glob("*-additions.json"):
        universe.update(r["company"]["ticker"] for r in json.loads(p.read_text(encoding="utf-8-sig")))
    if args.tickers:
        universe = set(args.tickers.split(","))
    stamp = datetime.now(timezone.utc).isoformat()
    errors = []
    try:
        raw = fetch(SCREENER)
        (CACHE / "nasdaq-screener.json").write_text(json.dumps(raw), encoding="utf-8")
        cap_lookup = {r["symbol"].replace("/", "."): r for r in raw["data"]["rows"]}
    except Exception as exc:
        cap_lookup = {}
        errors.append({"ticker": "MARKET_CAP", "error": str(exc)})

    def snapshot(ticker):
        symbol = ticker.replace(".", "-")
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{quote(symbol)}?interval=1d&range=5d"
        raw = fetch(url)
        meta = raw["chart"]["result"][0]["meta"]
        if meta.get("instrumentType") != "EQUITY" or meta.get("symbol", "").upper() != symbol:
            raise ValueError("Ticker is not the requested common-equity instrument")
        trade = datetime.fromtimestamp(meta["regularMarketTime"], timezone.utc)
        if trade.date().isoformat() > args.as_of:
            raise ValueError("Price observation is after the requested cutoff")
        price = meta["regularMarketPrice"]
        if not isinstance(price, (int, float)) or price <= 0:
            raise ValueError("Missing positive traded price")
        local_date = datetime.fromtimestamp(meta["regularMarketTime"] + meta.get("gmtoffset", 0), timezone.utc).date().isoformat()
        cap_row = cap_lookup.get(ticker, {})
        cap = float(cap_row.get("marketCap") or 0)
        cap_price = float((cap_row.get("lastsale") or "0").replace("$", "").replace(",", ""))
        notes = []
        if cap_price and abs(cap_price / price - 1) > .03:
            notes.append("시세 공급자 간 가격 차이가 3%를 넘어 시가총액 배수 계산을 제외했습니다.")
            cap = 0
        return {"ticker": ticker, "name": meta.get("longName", meta.get("shortName")), "price": price, "currency": meta["currency"], "priceTime": trade.isoformat(), "tradingDate": local_date, "retrievedAt": stamp,
                "marketCap": cap if cap > 0 else None, "marketCapCurrency": "USD", "marketCapAsOf": None,
                "marketCapRetrievedAt": stamp if cap > 0 else None, "marketCapSource": "Nasdaq stock screener", "priceSource": "Yahoo Finance chart",
                "sourceUrl": f"https://finance.yahoo.com/quote/{quote(symbol)}/", "priceApiUrl": url,
                "marketCapSourceUrl": "https://www.nasdaq.com" + cap_row.get("url", "/market-activity/stocks"), "notes": notes}

    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = {pool.submit(snapshot, ticker): ticker for ticker in sorted(universe)}
        for n, future in enumerate(as_completed(futures), 1):
            ticker = futures[future]
            try:
                companies[ticker] = future.result()
            except Exception as exc:
                errors.append({"ticker": ticker, "error": str(exc), "preserved": ticker in companies})
            if n % 25 == 0:
                print(f"Market snapshots {n}/{len(universe)}", flush=True)
    payload = {"asOf": args.as_of, "retrievedAt": stamp, "companies": companies, "errors": errors,
               "methodology": "주가는 Yahoo Finance 관측시각, 시가총액은 Nasdaq 조회값이며 별도 시가총액 기준시각은 미제공. 공시 원주와 ADR, 통화가 다르면 배수 계산을 제한합니다. 컨센서스·목표가는 수집하지 않습니다."}
    target.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {len(companies)} snapshots; {len(errors)} errors", flush=True)


if __name__ == "__main__":
    main()
