"""Protect issuer continuity, manual provenance and as-of boundaries."""
import copy
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from financial_adjustments import apply_adjustments,refresh_derivations

def metric(value=100,filed='2026-02-01',unit='USD',end='2025-12-31'):
    return dict(value=value,filed=filed,unit=unit,start='2025-01-01',end=end,basis='US GAAP',sourceUrl='https://example.com/issuer-report')
def record(end='2025-12-31'):
    return dict(end=end,kind='annual',metrics={'revenue':metric(end=end)})
def issuer():
    return dict(annual=[],latestQuarter=None,status='unavailable')

class AdjustmentTests(unittest.TestCase):
    def test_continuity_is_explicit_and_respects_transition(self):
        old=issuer();old['annual']=[record('2024-12-31'),record('2025-12-31'),record('2026-12-31')]
        current=issuer()
        result=apply_adjustments(current,dict(historyThrough='2026-06-30',note='Legal successor, same business',sourceUrl='https://example.com/merger'),old)
        self.assertEqual([x['end'] for x in result['annual']],['2024-12-31','2025-12-31'])
        self.assertIn('Legal successor',result['entityNote']['text'])
        self.assertEqual(result['annual'][0]['metrics']['revenue']['sourceUrl'],'https://example.com/issuer-report')

    def test_future_manual_filing_cannot_create_empty_period(self):
        supplement={'annual':[record()]};supplement['annual'][0]['metrics']['revenue']['filed']='2027-01-01'
        result=apply_adjustments(issuer(),supplement=supplement,cutoff='2026-09-20')
        self.assertEqual(result['annual'],[])
        self.assertEqual(result['status'],'unavailable')

    def test_manual_period_merges_without_overwriting_newer_filing(self):
        current=issuer();current['annual']=[record()];current['annual'][0]['metrics']['revenue']['filed']='2026-08-01'
        supplement={'annual':[record()]};supplement['annual'][0]['metrics']['revenue']['value']=99
        result=apply_adjustments(current,supplement=supplement,cutoff='2026-09-20')
        self.assertEqual(result['annual'][0]['metrics']['revenue']['value'],100)

    def test_stale_ratios_are_removed_when_currency_or_period_changes(self):
        metrics={'revenue':metric(100),'netIncome':metric(20),'operatingIncome':metric(30)}
        refresh_derivations(metrics);self.assertEqual(metrics['netMargin']['value'],20)
        metrics['netIncome']['unit']='EUR';metrics['operatingIncome']['start']='2025-04-01'
        refresh_derivations(metrics);self.assertNotIn('netMargin',metrics);self.assertNotIn('operatingMargin',metrics)

    def test_unknown_sec_filing_date_uses_conservative_observation_date(self):
        extra=record();m=extra['metrics']['revenue'];m.update(filed=None,availableOn='2026-09-20',authorizedOn='2026-02-10')
        supplement={'annual':[extra]}
        before=apply_adjustments(issuer(),supplement=copy.deepcopy(supplement),cutoff='2026-09-19')
        self.assertEqual(before['annual'],[])
        after=apply_adjustments(issuer(),supplement=copy.deepcopy(supplement),cutoff='2026-09-20')
        self.assertIsNone(after['annual'][0]['metrics']['revenue']['filed'])
        self.assertEqual(after['annual'][0]['metrics']['revenue']['value'],100)

    def test_recent_annual_report_supersedes_older_quarter_warning(self):
        current=issuer();current['annual']=[record('2026-06-30')];current['latestQuarterReportEnd']='2026-03-31'
        self.assertEqual(apply_adjustments(current)['coverageNotes'],[])

if __name__=='__main__':unittest.main()
