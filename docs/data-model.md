# 데이터 모델

학습 설명과 공시 숫자, 개인 기록을 별도 계층으로 관리합니다. JSON은 UTF-8이며 `scripts/build.py`가 현재 데이터와 화면 코드를 단일 `index.html`에 포함합니다. 브라우저는 실행 중 외부 API에서 데이터를 가져오지 않습니다.

## 식별자와 연결

| 계층 | 키 | 저장 위치 |
|---|---|---|
| 섹터 | `id` | `data/sectors/<id>.json` |
| 세부 산업 | 섹터 접두사가 붙은 고유 `id` | 섹터의 `industries` |
| 대표 기업 | 고유 `ticker` | 산업의 `companies` |
| 기업 상세 조사 | `ticker`와 같은 파일 이름 | `data/companies/<TICKER>.json` |
| 재무 | `companies[ticker]` | `data/financials.json` |
| 개인 메모·즐겨찾기 | `sector:<id>`, `industry:<id>`, `company:<ticker>` | 브라우저 저장소·개인 내보내기 JSON |

표시 이름·설명은 바꿀 수 있지만 ID·티커 변경은 개인 기록 연결에 영향을 줍니다. 동일 기업은 하나의 대표 산업에 배치하고 다른 사업 노출은 설명·경쟁사·관련 섹터로 연결합니다. 티커가 유지돼도 SEC CIK는 법인 승계로 바뀔 수 있습니다.

## 산업 콘텐츠

섹터는 `id`, `name`, `en`, GICS 대분류 참고 `code`, `color`, `summary`, `concept`, `drivers`, `watch`, `risks`, `valueChain`, `macro`, `valuation`, `pitfall`, `related`, `sources`, `industries`를 가집니다. `macro`의 키는 `growth`, `rates`, `inflation`, `dollar`입니다.

산업은 `id`, `name`, `en`, `summary`, `mechanics`, `watch`, `kpis`, `risks`, `valuation`, `questions`, `companies`로 구성합니다. KPI는 `{name, meaning, read}`로, 단순 지표명뿐 아니라 의미와 해석법을 보관합니다.

대표 기업 항목은 `{ticker, name, exchange, business, watch, ir, kind}`입니다. `kind`는 `보통주` 또는 `ADR`입니다. 본사가 미국 밖에 있다는 이유만으로 ADR로 분류하지 않습니다. 상장 식별자 대조는 `listing-verification.json`에 별도로 보관하며 불일치가 있다고 서술 파일의 종목을 자동 교체하지 않습니다.

## 기업 상세 조사

| 필드 | 의미 |
|---|---|
| `ticker`, `oneLiner` | 연결 키와 한 문장 사업 설명 |
| `businessModel` | 무엇을 누구에게 팔고 어떻게 현금을 얻는지 |
| `revenueStreams` | 주요 수익원 배열 |
| `history` | `{year, event}` 연혁 배열 |
| `strengths`, `weaknesses` | `{title, detail}` 분석 배열 |
| `competitors` | `{name, ticker, comparison}` 실제 경쟁사와 차이 |
| `macroLink` | 거시 변수의 기업별 전달 경로 |
| `monitoring` | 다음 공시에서 확인할 운영 질문 |
| `sources` | `{title, url, note}` 공식 근거와 적용 범위 |
| `reviewedOn` | 기업 설명을 검토한 날짜 |

`revenueStreams`의 각 항목은 `{name, description, share, period, sourceUrl}`입니다. `share`는 검증한 매출 비중의 백분율이며 알 수 없으면 `null`, `period`도 해당 확인 기간이 없으면 `null`입니다. 수익원을 나열했다는 이유로 같은 비중을 부여하지 않습니다. 현재 화면은 모든 수익원의 비중이 있고 같은 기간이며 합계가 약 100%일 때만 구성 비율을 그립니다. 그 밖에는 설명으로 표시합니다.

경쟁사는 수록 목록 밖의 기업일 수 있습니다. 미국 상장 티커가 없거나 비상장인 기업은 `ticker: null`로 보관합니다. 수록 기업이면 상세 페이지로 연결합니다. 강점·약점·경쟁 비교는 원문에 기초한 작성자 해석이며 회사의 확정 사실·실적과 구분합니다.

`reviewedOn`은 데이터 갱신 배치가 변경하지 않습니다. 새로운 공시 목록과 비교한 검토 대상은 `update-status.json`의 `researchReviewDue`에 기록합니다.

## 재무 데이터

`financials.json`의 최상위 구조는 `{asOf, companies}`입니다. `asOf`는 갱신 실행의 기준일이며 모든 기업·지표가 그날까지 최신이라는 뜻은 아닙니다.

기업별 레코드는 식별자 `ticker`, `cik`, `entityName`, `status`, `currency`, `retrievedOn`과 `annual`, `latestQuarter`, `filings`, `sourceUrl`, `coverageNotes`, `notes`를 포함합니다. 법인 승계·보완에는 `entityNote`, `supplementNote`가 추가될 수 있습니다. 오프라인 재처리는 `cacheRebuiltOn`으로 구분합니다.

기간 레코드는 `{end, kind, metrics}`입니다. `annual`은 확보된 최근 최대 3개 연간 기간을 오래된 순서로, `latestQuarter`는 확보 가능한 최신 분기를 보관합니다. `metrics`에는 매출·영업이익·순이익·희석 EPS·영업현금흐름·유형자산 투자·기말 자산·자본·현금 및 계산 가능한 비율·단순 FCF가 들어갑니다. 없는 지표는 0으로 채우지 않습니다.

각 지표는 다음 근거를 보존합니다.

```json
{
  "value": 123000000,
  "unit": "USD",
  "start": "2025-01-01",
  "end": "2025-12-31",
  "filed": "2026-02-20",
  "form": "10-K",
  "accession": "원문 공시 번호",
  "taxonomy": "us-gaap",
  "tag": "Revenues",
  "label": "매출·영업수익",
  "sourceUrl": "https://www.sec.gov/...",
  "basis": "US GAAP",
  "definition": "원문 태그 정의",
  "derived": false
}
```

위 숫자는 구조 설명용 예시입니다. 기말 잔액은 `start: null`, 연초누적 현금흐름은 `cumulative: true`, 계산값은 `derived: true`와 `formula`, `inputSources`를 추가합니다. 수동 보완 지표는 `sourceLabel` 등 근거 설명을 추가할 수 있습니다. 선택·계산 규칙은 [재무 방법론](financial-methodology.md)에 정리했습니다.

SEC 제출일을 확인하지 못한 수동 IR 자료는 `filed: null`과 `availableOn`(발표일 또는 보수적인 원문 확인일)을 사용합니다. `releasedOn`은 확인한 IR 발표일, `authorizedOn`은 이사회 승인일이며 제출일과 구분합니다. 실제 조회일 `retrievedOn`과 수치 필터의 기준일 `asOf`도 별도입니다. 캐시 재처리 날짜는 `cacheRebuiltOn`에 기록합니다.

## 수동 보완과 갱신 기록

- `financial-adjustments.json`: 티커별 법인 범위 주석·원문, 필요 시 `predecessorCik`, `historyThrough`를 명시합니다.
- `financial-supplements.json`: 공식 IR 원문에서 직접 확인한 `annual`·`latestQuarter` 지표와 보완 설명을 담습니다. 자동 API 수치와 같은 기간·단위·출처 필드를 사용합니다.
- `update-status.json`: 실행 기준일, 성공·보존·오류·경고 목록, 서술 검토 대상과 완료 시점을 담습니다.
- `listing-verification.json`: SEC 식별자·거래소와 서술의 대조 결과를 담습니다. 누락·불일치는 수동 검토 대상입니다.

다운로드 원본 캐시는 운영체제 임시 폴더에, 실행 로그·직전 백업은 저장소에서 제외되는 `logs/`·`backups/`에 둡니다. 갱신에 실패한 회사는 기존 수치가 남을 수 있으므로 실행 성공 건수만으로 모든 데이터의 최신성을 판단하지 않습니다.

## 개인 기록

브라우저 저장 키는 `mm-industry-archive-v1`이며 구조 버전은 `1`입니다. 개인 내보내기 파일에는 `application`, `exportedAt`, `version`, `bookmarks`, `completed`, `notes`가 포함됩니다. 메모는 항목별 `{text, updatedAt}`를 저장합니다. 테마·최근 화면은 내보내기 대상에서 제외합니다.

가져오기는 현재 데이터에 존재하는 키와 자료형·길이·날짜를 검증합니다. 즐겨찾기·진도는 중복 없이 합치고, 겹치는 메모는 기본적으로 현재 기기 값을 유지합니다. 이 파일은 공시 재무나 기업 설명의 수정 파일이 아니며 GitHub 동기화 기능도 아닙니다.
