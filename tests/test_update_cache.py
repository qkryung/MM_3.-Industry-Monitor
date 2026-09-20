import sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from update import facts_cache_reusable

class CacheTests(unittest.TestCase):
    def test_changed_submission_cannot_validate_older_facts(self):
        with tempfile.TemporaryDirectory() as folder:
            f=Path(folder)/'facts.json';f.write_text('{}')
            old={'accessions':['OLD'],'fetchedAt':100000,'complete':True}
            self.assertFalse(facts_cache_reusable(f,old,['NEW'],now=100100))
            self.assertFalse(facts_cache_reusable(f,{},['NEW'],now=100100))
            self.assertTrue(facts_cache_reusable(f,old,['OLD'],now=100100))
    def test_expired_or_incomplete_xbrl_is_retried(self):
        with tempfile.TemporaryDirectory() as folder:
            f=Path(folder)/'facts.json';f.write_text('{}')
            meta={'accessions':['A'],'fetchedAt':100000,'complete':True}
            self.assertFalse(facts_cache_reusable(f,meta,['A'],now=200000))
            self.assertFalse(facts_cache_reusable(f,meta,['A'],force=True,now=100001))
            meta['complete']=False
            self.assertFalse(facts_cache_reusable(f,meta,['A'],now=100001))

if __name__=='__main__':unittest.main()
