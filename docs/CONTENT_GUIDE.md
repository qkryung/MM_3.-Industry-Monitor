# 콘텐츠 수정 가이드

## 분류 원칙

상위 11개 섹터와 순서는 사용자가 지정한 구성을 유지합니다. 하위 산업은 사업 구조를 비교하기 위한 학습용 분류이며 공식 GICS의 모든 하위 코드를 재현하지 않습니다. 복합 기업의 실제 사업은 여러 섹터와 연결될 수 있습니다.

같은 종목은 한 대표 산업에 배치합니다. 다른 분야의 사업 노출은 기업의 `business`, `watch` 또는 관련 섹터 연결에 설명합니다. 산업용 가스는 주요 미국 상장 동종 기업 2개만 포함하며, 수를 채우기 위해 성격이 다른 종목을 추가하지 않았습니다.

## 수정 위치

- 섹터 개념·하위 산업·대표 기업: `data/sectors/<sector-id>.json`
- 기업의 사업·매출 구조·연혁·강약점·경쟁사: `data/companies/<ticker>.json`
- 자동 집계 재무: `data/financials.json` (`update.bat`으로 갱신)
- 공식 IR 수동 보완: `data/financial-supplements.json`
- 용어·매크로 공통 설명·교차 섹터 주제: `data/context.json`
- 색상·서체 크기: `src/css/tokens.css` 및 각 스타일 파일
- 산업 화면: `src/js/views.js`, 지도: `src/js/treemap.js`, 기업·재무: `src/js/company.js`

섹터 하나의 기본 구조는 다음과 같습니다. 실제 값과 필수 배열은 기존 파일을 참고하세요.

```json
{
  "id": "financials",
  "name": "금융",
  "en": "Financials",
  "code": "40",
  "color": "#2877e7",
  "summary": "한 문장으로 핵심 역할",
  "concept": "어떤 고객에게 어떤 가치를 제공하는지",
  "drivers": ["이익 동인 1", "이익 동인 2", "이익 동인 3"],
  "watch": ["관찰 포인트 1", "관찰 포인트 2", "관찰 포인트 3"],
  "risks": ["위험 1", "위험 2", "위험 3"],
  "valueChain": ["시작", "활동", "서비스", "수익"],
  "macro": {"growth": "경기 전달", "rates": "금리 전달", "inflation": "물가 전달", "dollar": "환율 전달"},
  "valuation": "비교할 가치평가 기준",
  "pitfall": "대표적인 해석 오류",
  "related": ["real-estate"],
  "sources": [{"title": "공식 자료명", "url": "https://example.com/", "note": "자료가 뒷받침하는 설명의 범위"}],
  "industries": []
}
```

`industries`의 각 항목에는 `id`, `name`, `en`, `summary`, `mechanics`, `watch`, `kpis`, `risks`, `valuation`, `questions`, `companies`가 있습니다. KPI에는 `name`, `meaning`, `read`, 기업에는 `ticker`, `name`, `exchange`, `business`, `watch`, `ir`, `kind`가 필요합니다. `kind`는 `보통주` 또는 `ADR`입니다. 미국 밖에 본사를 둔 기업이라고 모두 ADR은 아닙니다.

## 출처와 최신성

1. 기관·규제기관·협회 원문과 기업 IR·SEC 공시를 우선합니다.
2. 숫자를 추가할 때는 기간·단위·원문 위치·작성 또는 확인 날짜를 함께 남깁니다.
3. 실적, 경영진 전망, 작성자 해석을 구분합니다. 현재 구현은 실시간 시장 데이터를 자동 갱신하지 않습니다.
4. 상장명·티커·거래소는 인수·합병·분사·이전 시 바뀔 수 있습니다. SEC 목록과 회사 발표를 같이 확인합니다.
5. `context.asOf`는 전체 콘텐츠 검토일입니다. 원문 발행일이나 가격 기준일로 사용하지 않습니다. 부분 수정만으로 전체 최신성 검토가 끝난 것처럼 날짜를 올리지 마세요.
6. `listing-verification.json`은 SEC 상장 식별자 대조 기록입니다. `update.bat`은 SEC 목록과 각 발행사의 제출 기록을 확인하고 해당 파일을 갱신합니다. 상장 정보가 달라도 편집된 기업명·분류를 자동 교체하지 않습니다. 법인 변경은 회사 발표와 직접 대조하세요.

기업 프로필은 `oneLiner`, `businessModel`, `revenueStreams`, `history`, `strengths`, `weaknesses`, `competitors`, `macroLink`, `monitoring`, `sources`, `reviewedOn`을 갖습니다. 매출 비중을 확인하지 못하면 `share`·`period`를 `null`로 두세요. 일부 사업의 비중만 알고 있다면 나머지를 임의로 추정하지 않습니다. 관련 모든 사업의 동일 기간 비중이 약 100%로 합쳐질 때만 구성비 막대를 표시합니다. 기업을 추가할 때 프로필도 함께 추가해야 빌드가 통과합니다.

재무의 단위·회계기간·ADR 처리·법인 승계 원칙은 [재무 방법론](financial-methodology.md), 필드 상세는 [데이터 모델](data-model.md)을 참고하세요. `update.bat`은 수치와 공시를 갱신하며 기업 설명을 다시 작성하지 않습니다. 새로운 공시는 화면의 ‘업데이트 현황’에서 서술 재검토 대상으로 연결됩니다.

## 개인 기록을 지키는 확장

`sector.id`, `industry.id`, `ticker`는 즐겨찾기와 메모를 연결하는 키입니다. 이름·설명을 바꾸더라도 ID는 유지하세요. 티커나 ID를 바꿀 때에는 기존 개인 기록을 내보내고 별도 이전 방안을 마련하세요. 가져오기는 현재 데이터에 존재하지 않는 키를 제외합니다.

현재 빌드는 11개 섹터, 산업별 KPI 3개 이상, 기업 2개 이상 및 고유 ID를 검증합니다. 산업 수·대표 기업 수를 의도적으로 늘렸다면 `tests/archive.test.cjs`의 데이터 개수 기대값도 갱신하세요. 새로운 대분류 추가는 UI·검증 정책 변경을 포함하는 별도 작업입니다.

변경 후 `python scripts/build.py`, `python -m unittest discover -s tests -p "test_*.py"`, `node --test tests/archive.test.cjs`를 실행하고 `3. Industry Study.html`을 새로 열어 수정한 산업과 검색 결과를 확인하세요. GitHub에는 소스와 재생성한 HTML을 함께 올리면 됩니다.
