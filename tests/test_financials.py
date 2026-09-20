"""Financial accuracy boundaries: periods, currencies, restatements and derivations."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
from financials import extract


def fact(value,start="2025-01-01",end="2025-12-31",filed="2026-02-01",form="10-K",accn="0000000001-26-000001"):
    result={"val":value,"end":end,"filed":filed,"form":form,"accn":accn}
    if start:result["start"]=start
    return result


def companyfacts(**tags):
    return {"cik":1,"entityName":"Test Issuer","facts":{"us-gaap":{tag:{"units":units} for tag,units in tags.items()}}}


class ExtractionTests(unittest.TestCase):
    def run_extract(self,facts,submissions=None,sector="technology"):
        return extract(facts,submissions or {},{"ticker":"TEST","sectorId":sector},"2026-09-20")

    def test_annual_quarter_and_ytd_are_not_interchanged(self):
        f=companyfacts(Revenues={"USD":[fact(120),fact(70,end="2026-06-30",start="2026-01-01",form="10-Q",filed="2026-08-01"),fact(40,end="2026-06-30",start="2026-04-01",form="10-Q",filed="2026-08-01")]},NetCashProvidedByUsedInOperatingActivities={"USD":[fact(30),fact(19,end="2026-06-30",start="2026-01-01",form="10-Q",filed="2026-08-01")]})
        result=self.run_extract(f)
        self.assertEqual(result["annual"][-1]["metrics"]["revenue"]["value"],120)
        q=result["latestQuarter"]["metrics"]
        self.assertEqual(q["revenue"]["value"],40)
        self.assertEqual(q["operatingCashFlow"]["value"],19)
        self.assertTrue(q["operatingCashFlow"]["cumulative"])

    def test_restatement_and_asof_cutoff(self):
        f=companyfacts(Revenues={"USD":[fact(120),fact(118,filed="2026-03-01"),fact(999,filed="2026-10-01")]})
        self.assertEqual(self.run_extract(f)["annual"][-1]["metrics"]["revenue"]["value"],118)

    def test_derivations_require_matching_period_and_currency(self):
        f=companyfacts(Revenues={"USD":[fact(100)]},OperatingIncomeLoss={"EUR":[fact(20)]},NetCashProvidedByUsedInOperatingActivities={"USD":[fact(30)]},PaymentsToAcquirePropertyPlantAndEquipment={"EUR":[fact(10)]})
        metrics=self.run_extract(f)["annual"][-1]["metrics"]
        self.assertNotIn("operatingMargin",metrics)
        self.assertNotIn("freeCashFlow",metrics)

    def test_negative_cash_flow_preserved_and_capex_subtracted(self):
        f=companyfacts(Revenues={"USD":[fact(100)]},OperatingIncomeLoss={"USD":[fact(-10)]},NetCashProvidedByUsedInOperatingActivities={"USD":[fact(-3)]},PaymentsToAcquirePropertyPlantAndEquipment={"USD":[fact(4)]})
        m=self.run_extract(f)["annual"][-1]["metrics"]
        self.assertEqual(m["operatingMargin"]["value"],-10)
        self.assertEqual(m["freeCashFlow"]["value"],-7)
        self.assertTrue(m["freeCashFlow"]["derived"])

    def test_bank_net_revenue_takes_precedence_over_fee_revenue(self):
        f=companyfacts(RevenuesNetOfInterestExpense={"USD":[fact(180)]},RevenueFromContractWithCustomerExcludingAssessedTax={"USD":[fact(30)]})
        self.assertEqual(self.run_extract(f,sector="financials")["annual"][-1]["metrics"]["revenue"]["value"],180)

    def test_missing_values_stay_missing_and_source_period_is_explicit(self):
        f=companyfacts(NetIncomeLoss={"USD":[fact(10)]})
        r=self.run_extract(f)
        self.assertNotIn("revenue",r["annual"][-1]["metrics"])
        self.assertTrue(r["coverageNotes"])
        m=r["annual"][-1]["metrics"]["netIncome"]
        self.assertEqual(m["start"],"2025-01-01")
        self.assertIn("-index.html",m["sourceUrl"])

    def test_more_recent_filing_than_available_facts_is_visible(self):
        f=companyfacts(Revenues={"USD":[fact(100,end="2024-12-31",start="2024-01-01",filed="2025-02-01")]})
        sub={"filings":{"recent":{"form":["10-K"],"reportDate":["2025-12-31"],"filingDate":["2026-02-01"],"accessionNumber":["0000000001-26-000001"],"primaryDocument":["report.htm"]}}}
        r=self.run_extract(f,sub)
        self.assertEqual(r["latestAnnualReportEnd"],"2025-12-31")
        self.assertTrue(any("2024-12-31" in x for x in r["coverageNotes"]))


if __name__=="__main__":unittest.main()
