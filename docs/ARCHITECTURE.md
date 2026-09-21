# 구조와 확장 지점

## 휴대 가능한 단일 HTML

사용자가 서버 설치 없이 다른 컴퓨터에서도 열 수 있도록 빌드 결과를 `index.html` 한 파일로 제공합니다. 실행 시 `fetch`, CDN, JavaScript 모듈 로더, 외부 패키지가 필요하지 않습니다. 폰트도 포함하므로 오프라인에서 UI가 바뀌지 않습니다.

원본은 섹터별 JSON, CSS, JavaScript로 나뉩니다. `scripts/build.py`는 UTF-8 원본을 읽고 검증한 뒤 템플릿에 묶습니다. 날짜나 무작위 값을 빌드마다 삽입하지 않아 같은 소스는 같은 결과를 만듭니다. 글꼴 라이선스는 번들 안에도 포함합니다.

현재 콘텐츠는 11개 섹터·61개 산업·183개 KPI·331개 기업으로 구성합니다. 기업 서술, 공시 재무, 관측 시세를 독립 자료로 보관하고 기업 화면에서 연결합니다.

## 의존성 방향

```text
data/context.json + data/sectors/*.json
data/companies/*.json + data/financials.json
data/market-data.json + data/update-status.json
                    ↓
         core.js  데이터·검색·상태
                    ↓
         views.js 산업·공통 화면
         navigation.js 섹터 탐색·펼침 상태
         company-directory.js 조사된 기업 목록·검색·섹터별 묶음
         treemap.js 중첩 지도·목록
         investment-report.js 투자 논점·매크로·해자·정책·평가 계산
         company.js 기업 연구·재무·갱신 현황
                    ↓
         app.js   이벤트·화면 이동

src/index.html + src/css/* + font + 위 자료
                    ↓
         scripts/build.py → index.html
```

별도의 런타임 프레임워크가 필요하지 않은 규모이며, 구조 변경 시 콘텐츠와 이벤트 코드를 따로 수정할 수 있습니다. 전역 공개 범위는 `window.IA` 하나로 제한했습니다.

`investment-report.js`는 `company.js`보다 먼저 로드됩니다. 프로필의 `investmentResearch`를 렌더링하고 저장된 재무·시세로 실적 추이, 건전성 지표, 비교 배수와 가정 민감도를 계산합니다. `company.js`는 이를 사업·수익원·재무 표·연혁·경쟁 구도와 묶고 페이지 내 목차를 제공합니다. 관련 스타일은 `src/css/investment-report.css`에 둡니다. 서술 출처·공시 원문·시세 출처를 각각 연결하며 미래 가정과 관측값을 구분해 표시합니다.

계산 계층은 없는 항목을 0으로 채우지 않습니다. ADR·통화·이익과 자본의 귀속·합병 전후 기업 범위와 업종에 따라 계산을 보류합니다. 금융업·리츠에 일반 DCF를 일괄 적용하지 않으며 가정과 예외는 [재무·가치평가 방법론](financial-methodology.md)에 정의합니다.

## 주소와 탐색

- `#/overview`: 산업 지도
- `#/overview?sector=technology&color=margin&view=list`: 섹터 필터·재무 색상·목록
- `#/overview?research-sector=technology&research-q=반도체`: 지도 아래 기업 목록의 검색·섹터. 지도 필터와 별도로 유지하며 검색 결과 전체를 섹터별로 표시합니다. 이전 `research-page` 주소도 전체 결과로 열립니다.
- `#/sector/<id>`: 섹터 노트
- `#/industry/<id>`: 세부 산업 노트
- `#/industry/<id>?company=<ticker>`: 기업 행으로 이동
- `#/company/<ticker>`: 기업 상세 연구
- `#/company/<ticker>?period=2025-12-31`: 해당 연간 재무 선택
- `#/connections?factor=rates`: 매크로 요인 비교
- `#/connections?theme=ai`: 교차 섹터 스터디로 이동
- `#/glossary?q=ARR`: 개념 검색
- `#/library?tab=notes`: 내 메모
- `#/sources`: 자료 범위·출처
- `#/updates`: 자동 갱신 결과·기업 설명 재검토 대상

해시 주소이므로 `file://`와 GitHub Pages의 하위 디렉터리 모두에서 별도 서버 라우팅 없이 동작합니다. 뒤로/앞으로 이동을 지원합니다.

## 상태와 기록 이동

브라우저 저장 키는 `mm-industry-archive-v1`입니다. 즐겨찾기는 `sector:<id>`, `industry:<id>`, `company:<ticker>` 형태이며 완료 진도는 하위 산업 ID 목록입니다. 메모에는 내용과 수정 날짜를 저장합니다.

개인 기록과 UI 설정은 브라우저 로컬 저장소에 있습니다. 서버·클라우드 동기화는 없습니다. 저장이 차단되면 메모를 현재 창의 메모리에 유지하고 내보내기 안내를 표시합니다. 개인 기록 내보내기는 테마·최근 페이지를 제외합니다. 이전 버전과 저장 키·레코드 형식을 유지하므로 기존 즐겨찾기와 메모도 읽습니다.

가져오기는 버전·타입·길이·날짜·현재 데이터의 키를 검사합니다. 목록은 중복 없이 합치고, 기존 메모는 기본적으로 보존합니다. 덮어쓰기는 가져오기 창에서 선택합니다. 텍스트를 HTML로 렌더할 때 이스케이프하며 출처·IR 링크는 HTTP(S)만 허용합니다. JSON을 HTML에 넣을 때 `<`를 유니코드 이스케이프로 처리합니다.

## 갱신 계층과 확장

현재 재무 갱신 계층은 `scripts/update.py`(조회·캐시·백업), `financials.py`(기간·통화·표준 지표), `financial_adjustments.py`(근거 있는 법인 승계·수동 IR 보완)로 나눴습니다. 조회 실패 시 기존 수치를 보존하고 결과를 기록합니다. SEC 원본 캐시는 시스템 임시 폴더에 두며 GitHub에 포함하지 않습니다. 자동 갱신은 서술 콘텐츠의 검토일을 변경하지 않습니다.

시세는 `scripts/update_market.py`에서 독립적으로 조회합니다. Yahoo Finance chart의 가격·관측시각과 Nasdaq screener의 시가총액·조회시각을 `data/market-data.json`에 기록합니다. Nasdaq이 시가총액의 별도 기준시각을 제공하지 않으므로 해당 필드는 `null`입니다. 일부 기업의 조회가 실패하면 기존 관측값이 남을 수 있어 개별 시각과 오류를 보존합니다. 시세 명령은 HTML을 만들지 않으며 실행 후 `scripts/build.py`가 필요합니다.

```text
SEC API → update.py → financials.py → financial_adjustments.py
                                         ↑
                  financial-adjustments.json + financial-supplements.json
                                         ↓
                              financials.json + update-status.json

Yahoo chart + Nasdaq screener → update_market.py → market-data.json

공식 자료 수동 검토 → companies/*.json의 investmentResearch·기본 설명

위 저장 자료 + 화면 소스 → build.py → 오프라인 index.html
```

공식 원문 수동 보완은 자동 수집과 같은 기간·단위·출처 구조로 관리합니다. CNI의 CAD 재무, NU의 IFRS 귀속 이익·자본, SPCX의 투자설명서 연결 범위, AMH의 임대 매출처럼 표준 API만으로 부족한 항목을 추가하며 회사가 발표한 FCF·NOI·조정 매출과 혼용하지 않습니다. VMRK는 합병 전 EQR의 과거 실적임을 유지하고 현재 시가총액과 결합한 평가 계산을 보류합니다.

지도는 면적 비율과 사각형 모양을 함께 고려하는 트리맵입니다. 기업의 가중치는 모두 1이며, 섹터·세부 산업 면적은 기업 수의 합입니다. 색상은 섹터 또는 가장 최근 연간 영업이익률입니다. 가격·시가총액을 대신하는 값으로 해석하지 않습니다.

- 현재 시세는 저장된 관측값입니다. 실시간 화면이나 컨센서스를 추가하려면 인증·조회 제한·기준시점·원주 및 희석 기준을 검증하는 별도 설계가 필요합니다.
- 여러 기기 자동 동기화는 사용자 인증과 영구 저장소가 필요한 별도 기능입니다.
- 콘텐츠 검색 대상은 `core.js`의 인덱스 생성부에서 확장할 수 있습니다.
- 산업 ID 변경·티커 교체는 개인 기록 이전과 함께 설계해야 합니다.
- 디자인 토큰을 별도 CSS 파일에 모아 기존 MM 프로젝트와 동기화하기 쉽게 했습니다.

빌드는 수록 티커와 프로필·재무·시세 집합의 일치, 투자보고서 필수 필드와 출처, 재무 근거를 검증합니다. 기능 검증은 Python 콘텐츠·추출·보완 검사, Node 기본 테스트 러너, 실제 브라우저 확인으로 나눕니다. 브라우저에서는 탐색·검색·섹터별 기업 목록·보고서·비교표·가정 표의 표시와 모바일·인쇄 동작을 확인합니다. 자세한 실행 결과는 [검증 기록](VALIDATION.md)에 남깁니다.
