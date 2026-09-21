"""Idempotently merge reviewed coverage manifests into the sector universe."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    paths = {p.stem:p for p in (ROOT / "data/sectors").glob("*.json")}
    sectors = {key:json.loads(p.read_text(encoding="utf-8-sig")) for key,p in paths.items()}
    extra = json.loads((ROOT / "data/expansion/industries.json").read_text(encoding="utf-8-sig"))
    for industry in extra:
        sector_id = industry.pop("sectorId")
        if not any(i["id"] == industry["id"] for i in sectors[sector_id]["industries"]):
            sectors[sector_id]["industries"].append(industry)
    industries = {i["id"]:i for s in sectors.values() for i in s["industries"]}
    existing = {c["ticker"]:(i,c) for i in industries.values() for c in i["companies"]}
    moves = {**dict.fromkeys(["MU","SNDK","WDC","STX"], "technology-memory-storage"), **dict.fromkeys(["IONQ","RGTI","QBTS","QUBT"], "technology-quantum-computing"), **dict.fromkeys(["SPCX","RKLB","LUNR","RDW"], "industrials-space")}
    for file in sorted((ROOT / "data/expansion").glob("*-additions.json")):
        for row in json.loads(file.read_text(encoding="utf-8-sig")):
            company = row["company"]
            if company["ticker"] not in existing:
                industry = industries[moves.get(company["ticker"],row["industryId"])]
                industry["companies"].append(company)
                existing[company["ticker"]] = (industry,company)
            else:
                existing[company["ticker"]][1].update(company)
    for ticker,target in moves.items():
        if ticker in existing:
            origin,company = existing[ticker]
            if origin["id"] != target:
                origin["companies"].remove(company)
                industries[target]["companies"].append(company)
    for key,sector in sectors.items():
        paths[key].write_text(json.dumps(sector,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Merged {len(existing)} companies / {len(industries)} industries")


if __name__ == "__main__":
    main()
