# 데이터 모델

학습 설명·투자 해석, 공시 숫자, 관측 시세, 개인 기록을 별도 계층으로 관리합니다. 현재 범위는 11개 섹터·61개 산업·183개 KPI·331개 기업입니다. JSON은 UTF-8이며 `scripts/build.py`가 현재 데이터와 화면 코드를 단일 `3. Industry Study.html`에 포함합니다. 브라우저는 실행 중 외부 API에서 데이터를 가져오지 않습니다.

## 식별자와 연결

| 계층 | 키 | 저장 위치 |
|---|---|---|
| 섹터 | `id` | `data/sectors/<id>.json` |
| 세부 산업 | 섹터 접두사가 붙은 고유 `id` | 섹터의 `industries` |
| 대표 기업 | 고유 `ticker` | 산업의 `companies` |
| 기업 상세 조사 | `ticker`와 같은 파일 이름 | `data/companies/<TICKER>.json` |
| 재무 | `companies[ticker]` | `data/financials.json` |
| 관측 시세 | `companies[ticker]` | `data/market-data.json` |
| 개인 메모·즐겨찾기 | `sector:<id>`, `industry:<id>`, `company:<ticker>` | 브라우저 저장소·개인 내보내기 JSON |

표시 이름·설명은 바꿀 수 있지만 ID·티커 변경은 개인 기록 연결에 영향을 줍니다. 동일 기업은 하나의 대표 산업에 배치하고 다른 사업 노출은 설명·경쟁사·관련 섹터로 연결합니다. 티커가 유지돼도 SEC CIK는 법인 승계로 바뀔 수 있습니다.

## 산업 콘텐츠

섹터는 `id`, `name`, `en`, GICS 대분류 참고 `code`, `color`, `summary`, `concept`, `drivers`, `watch`, `risks`, `valueChain`, `macro`, `valuation`, `pitfall`, `related`, `sources`, `industries`를 가집니다. `macro`의 키는 `growth`, `rates`, `inflation`, `dollar`입니다.

산업은 `id`, `name`, `en`, `summary`, `mechanics`, `watch`, `kpis`, `risks`, `valuation`, `questions`, `companies`로 구성합니다. KPI는 `{name, meaning, read}`로, 단순 지표명뿐 아니라 의미와 해석법을 보관합니다.

대표 기업 항목은 `{ticker, name, exchange, business, watch, ir, kind}`이며 확인한 SEC 식별자 `cik`를 추가할 수 있습니다. `kind`는 `보통주`, `ADR`, `보통지분(MLP)`입니다. 본사가 미국 밖에 있다는 이유만으로 ADR로 분류하지 않습니다. 상장 식별자 대조는 `listing-verification.json`에 별도로 보관하며 불일치가 있다고 서술 파일의 종목을 자동 교체하지 않습니다.

## 기업 상세 조사

| 필드 | 의미 |
|---|---|
| `ticker`, `oneLiner` | 연결 키와 한 문장 사업 설명 |
| `businessModel` | 무엇을 누구에게 팔고 어떻게 현금을 얻는지 |
| `revenueStreams` | 주요 수익원 배열 |
| `history` | `{year, event}` 확인한 기업 연혁·검토 기록; 연도를 확인하지 않은 사업 설명에는 `사업 기반` 등 텍스트 사용 |
| `strengths`, `weaknesses` | `{title, detail}` 분석 배열 |
| `competitors` | `{name, ticker, comparison}` 실제 경쟁사와 차이 |
| `macroLink` | 거시 변수의 기업별 전달 경로 |
| `monitoring` | 다음 공시에서 확인할 운영 질문 |
| `sources` | `{title, url, note}` 공식 근거와 적용 범위; `accessedOn`으로 조회일 추가 가능 |
| `reviewedOn` | 기업 설명을 검토한 날짜 |
| `investmentResearch` | 아래 투자보고서 스키마의 회사별 분석 |

`revenueStreams`의 각 항목은 `{name, description, share, period, sourceUrl}`입니다. `share`는 검증한 매출 비중의 백분율이며 알 수 없으면 `null`, `period`도 해당 확인 기간이 없으면 `null`입니다. 수익원을 나열했다는 이유로 같은 비중을 부여하지 않습니다. 현재 화면은 모든 수익원의 비중이 있고 같은 기간이며 합계가 약 100%일 때만 구성 비율을 그립니다. 그 밖에는 설명으로 표시합니다.

경쟁사는 수록 목록 밖의 기업일 수 있습니다. 미국 상장 티커가 없거나 비상장인 기업은 `ticker: null`로 보관합니다. 수록 기업이면 상세 페이지로 연결합니다. 강점·약점·경쟁 비교는 원문에 기초한 작성자 해석이며 회사의 확정 사실·실적과 구분합니다.

`reviewedOn`은 데이터 갱신 배치가 변경하지 않습니다. 새로운 공시 목록과 비교한 검토 대상은 `update-status.json`의 `researchReviewDue`에 기록합니다.

## 투자보고서

`investmentResearch`는 모든 수록 기업에 존재하며 다음 구조를 사용합니다. 사실의 근거, 작성자의 해석, 미래 계산 가정을 구분합니다.

| 필드 | 구조·의미 |
|---|---|
| `asOf`, `thesis` | `YYYY-MM-DD` 분석 기준일과 핵심 투자 논점 |
| `businessDrivers` | `{title, detail}` 배열: 매출이 이익·현금으로 전환되는 구조 |
| `macro` | `{title, detail}` 배열: 경기·금리·환율·산업 투자 등 기업별 전달 경로 |
| `moat` | `{title, detail}` 배열: 경쟁우위의 원천·제약·지속 조건 |
| `financialFocus` | `{title, detail}` 배열: 실적 추이·현금전환·부채·희석 등 확인할 항목 |
| `valuation.relative` | `{method, peers, rationale, watch}`: 비교 방법, 티커 배열, 비교 근거와 조정할 차이 |
| `valuation.absolute` | `{method, drivers, watch}`: 절대가치 방법, 핵심 가정·변수 문자열 배열과 한계 |
| `policy` | `{title, detail, sourceUrl}` 배열: 정책 원문과 기업 영향에 관한 해석 |
| `catalysts`, `falsifiers` | 문자열 배열: 확인할 촉매와 투자 논지가 틀리는 조건 |
| `sources` | `{title, url, note, accessedOn}` 배열: 근거 원문·적용 범위·조회일 |

정책의 존재·시행 상태와 매출·비용·자본 배분에 미칠 해석은 `detail`에서 구분합니다. `peers`는 경제적 비교 대상이며 동일 배수를 적용할 수 있다는 뜻은 아닙니다. 비교표는 수록 기업 중 본인을 제외한 최대 5개를 표시합니다. 수치가 없는 평가 방법·전망을 공시 숫자로 채우지 않습니다.

`src/js/investment-report.js`가 투자 논점·사업 동인·매크로·해자·재무 건전성·밸류에이션·정책·근거를 렌더링하고 `company.js`가 기존 사업 설명·재무 표·연혁과 통합합니다. 시세와 재무에서 계산한 배수·성장률·가치 민감도는 화면에서 생성하며 서술 JSON의 확정 사실로 저장하지 않습니다. 빌드는 분석 기준일, 핵심 배열, HTTPS 출처와 양쪽 평가 방법을 검증합니다.

## 재무 데이터

`financials.json`의 최상위 구조는 `{asOf, companies}`입니다. `asOf`는 갱신 실행의 기준일이며 모든 기업·지표가 그날까지 최신이라는 뜻은 아닙니다.

기업별 레코드는 식별자 `ticker`, `cik`, `entityName`, `status`, `currency`, `retrievedOn`과 `annual`, `latestQuarter`, `filings`, `sourceUrl`, `coverageNotes`, `notes`를 포함합니다. 법인 승계·보완에는 `entityNote`, `supplementNote`가 추가될 수 있습니다. 오프라인 재처리는 `cacheRebuiltOn`으로 구분합니다.

기간 레코드는 `{end, kind, metrics}`입니다. `annual`은 확보된 최근 최대 3개 연간 기간을 오래된 순서로, `latestQuarter`는 확보 가능한 최신 분기를 보관합니다. `metrics`에는 매출·영업이익·순이익·희석 EPS·영업현금흐름·유형자산 투자·기말 자산·자본·현금 및 계산 가능한 비율·단순 FCF가 들어갑니다. 확보한 경우 주식보상, 희석 주식 수, 유동자산·부채, 장기차입금·유동성 장기차입금·단기차입금도 보관합니다. 없는 지표는 0으로 채우지 않습니다. 차입금 태그는 범위가 겹칠 수 있어 단순 합산하지 않습니다.

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

귀속 범위는 태그와 정의에 보존합니다. 연결 전체 손익인 `ProfitLoss`만 확보한 경우 이를 주주 귀속 이익으로 간주하지 않고 P/E·ROE 및 과거 현금에 기초한 DCF를 보류합니다. 비지배지분 포함 자본 태그도 P/B·정당화 P/B 계산에서 제외합니다. VMRK처럼 현재 시가총액과 확보 실적의 합병 전후 범위가 다른 경우 해당 배수·가치 계산을 보류합니다.

## 관측 시세

`market-data.json`의 최상위 구조는 `{asOf, retrievedAt, companies, errors, methodology}`입니다. `scripts/update_market.py`가 독립적으로 갱신하고 `scripts/build.py`를 실행해야 HTML에 반영됩니다. `asOf`는 관측값의 날짜 상한이며 과거 시점의 시장 데이터를 복원했다는 뜻이 아닙니다.

| 기업별 필드 | 의미 |
|---|---|
| `ticker`, `name` | 조회 대상 티커와 시세 공급자 표시 이름 |
| `price`, `currency` | Yahoo Finance chart에서 관측한 가격과 거래 통화 |
| `priceTime`, `tradingDate` | 공급자 가격 관측시각(UTC ISO 형식), 거래소 현지 기준 거래일 |
| `retrievedAt` | 해당 조회 실행의 UTC 시각 |
| `marketCap`, `marketCapCurrency` | Nasdaq screener가 제공한 시가총액과 통화; 미확보는 `null` |
| `marketCapAsOf` | 공급자가 별도 기준시각을 제공하지 않아 `null` 유지 |
| `marketCapRetrievedAt` | 시가총액 조회 실행 시각; 가격 관측시각과 다름 |
| `priceSource`, `marketCapSource` | 공급자 이름 |
| `sourceUrl`, `priceApiUrl`, `marketCapSourceUrl` | 주가 화면·조회 API·시가총액 원문 링크 |
| `notes` | 시세 대조 과정에서 발견한 주의점 |

Nasdaq의 가격과 Yahoo의 관측 가격 차이가 3%를 넘으면 시가총액을 보류합니다. 이 대조는 정확한 동일 시점·동일 자본구조 검증을 대신하지 않습니다. 주가 조회에 실패하면 기존 기업 관측값을 보존하고 `errors`에 기록하므로 최상위 조회시각만으로 개별 값의 최신성을 판단하지 않습니다.

평가 계산은 USD 주가·USD 시가총액·USD 공시 수치와 귀속 범위가 맞는 경우로 제한하며 ADR 원주 환산은 구현하지 않았습니다. 최근 확보 연간 실적과 최근 확보 자본을 사용하므로 TTM·선행 배수가 아닙니다. 금융·리츠 예외, 음수 분모, DCF 가정은 [재무·가치평가 방법론](financial-methodology.md)을 따릅니다.

## 수동 보완과 갱신 기록

- `financial-adjustments.json`: 티커별 법인 범위 주석·원문, 필요 시 `predecessorCik`, `historyThrough`를 명시합니다.
- `financial-supplements.json`: 공식 IR·공시 원문에서 직접 확인한 `annual`·`latestQuarter` 지표와 보완 설명을 담습니다. 자동 API 수치와 같은 기간·단위·출처 필드를 사용합니다. TM·TSM·VMRK에 더해 CNI·NU·SPCX·AMH의 필요한 기간·항목을 보완하며 원문별 통화·귀속·합병 전후 범위를 명시합니다.
- `update-status.json`: 실행 기준일, 성공·보존·오류·경고 목록, 서술 검토 대상과 완료 시점을 담습니다.
- `listing-verification.json`: SEC 식별자·거래소와 서술의 대조 결과를 담습니다. 누락·불일치는 수동 검토 대상입니다.

다운로드 원본 캐시는 운영체제 임시 폴더에, 실행 로그·직전 백업은 저장소에서 제외되는 `logs/`·`backups/`에 둡니다. 갱신에 실패한 회사는 기존 수치가 남을 수 있으므로 실행 성공 건수만으로 모든 데이터의 최신성을 판단하지 않습니다.

## 개인 기록

브라우저 저장 키는 `mm-industry-archive-v1`이며 구조 버전은 `1`입니다. 개인 내보내기 파일에는 `application`, `exportedAt`, `version`, `bookmarks`, `completed`, `notes`가 포함됩니다. 메모는 항목별 `{text, updatedAt}`를 저장합니다. 테마·최근 화면은 내보내기 대상에서 제외합니다.

가져오기는 현재 데이터에 존재하는 키와 자료형·길이·날짜를 검증합니다. 즐겨찾기·진도는 중복 없이 합치고, 겹치는 메모는 기본적으로 현재 기기 값을 유지합니다. 이 파일은 공시 재무나 기업 설명의 수정 파일이 아니며 GitHub 동기화 기능도 아닙니다.
