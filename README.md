# Industry Archive · 산업·기업 스터디

섹터 → 세부 산업 → 기업으로 내려가며 사업 구조와 실제 공시 숫자를 함께 읽는 개인 투자 공부용 아카이브입니다. **11개 섹터·61개 세부 산업·331개 기업 상세**를 수록합니다. Pretendard와 네이비·블루 팔레트를 사용하며, 결과물은 오프라인에서도 열리는 단일 HTML입니다.

저장소: [qkryung/MM_3.-Industry-Monitor](https://github.com/qkryung/MM_3.-Industry-Monitor)

## 바로 열기

[index.html](index.html)을 Chrome 또는 Edge에서 엽니다. 열람에는 설치·계정·API 키·서버가 필요하지 않습니다. 폰트·콘텐츠·화면 기능이 HTML에 포함되어 있으며, 공식 IR·공시 링크를 방문할 때는 인터넷이 필요합니다.

- 왼쪽 탐색 메뉴에서 섹터별 아이콘, 선택 상태, 산업·기업 수를 확인하고 하위 산업을 펼치거나 접습니다.
- 11개 섹터와 세부 산업을 트리맵·목록으로 탐색하고 기업 상세로 이동합니다.
- 산업 지도 아래의 **조사된 기업 모아보기**에서 기업명·티커·사업 키워드와 섹터로 검색하고, 대표 사업·설명 검토일을 확인해 기업 상세를 엽니다. 전체 기업을 섹터별로 묶어 간결한 행으로 표시하며, 섹터 안에서는 티커순으로 정렬합니다. 섹터 제목을 누르면 목록을 접거나 펼칠 수 있습니다.
- 기업이 파는 제품·서비스, 수익원, 연혁, 강점·약점, 경쟁사와의 차이, 확인할 질문을 읽습니다.
- 확보 가능한 최근 3개 연간 실적과 최신 분기, 수치별 기간·통화·원문을 확인합니다.
- 기업별 투자 논점, 매크로 환경, 경제적 해자, 재무 건전성, 상대·절대 밸류에이션, 정부 정책과 논지가 틀리는 조건을 투자보고서 형태로 읽습니다.
- 저장된 관측 주가·시가총액과 공시 기반 비교 배수를 확인하고, 명시된 가정에 따른 절대가치 민감도를 살펴봅니다.
- 산업별 KPI·가치평가 관점·위험, 경기·금리·물가·달러의 전달 경로와 개념 사전을 연결합니다.
- 검색, 즐겨찾기, 관심 기업, 관찰 메모, 학습 진도, 라이트·다크 모드, 인쇄/PDF를 지원합니다.

트리맵 면적은 **수록 기업 수**를 나타냅니다. 시가총액이나 투자 비중이 아닙니다. 영업이익률 색상은 기업별 최근 확보 연간 수치이므로 회계기간과 업종 차이를 함께 확인하세요. 상위 분류는 GICS 체계를 참고하고 하위 산업은 자체 학습 분류를 사용합니다. 시세는 갱신 때 저장한 관측값이며 화면을 열어도 실시간으로 바뀌지 않습니다. 컨센서스·목표주가·매매 추천은 제공하지 않습니다.

### 수록 자료의 범위

아래는 **2026-09-21 콘텐츠 기준**입니다. 기업별 재무 확보 상태는 HTML의 **업데이트 현황**, 시세 시점은 기업 페이지에서 확인하세요.

| 항목 | 범위 |
|---|---|
| 산업 학습 자료 | 11개 섹터, 61개 산업, KPI 183개, 용어 36개 |
| 기업 상세 | 331개: 사업·매출 구조·투자 논점·매크로·해자·재무·밸류에이션·정책·출처 |
| 공시 재무 | 확보 가능한 최근 3개 연간 실적과 최신 분기; 누락·반영 지연과 실제 기간을 표시 |
| 관측 시세 | 기업별 주가·거래일·관측시각, 확보한 공급자 시가총액과 조회시각 |
| 정량 매출 구성비 | 금액·분모·기간을 확인한 경우만 표시; 나머지는 수익원별 정성 설명 |

331개 기업을 조사 대상으로 수록했다는 뜻이며 모든 지표와 최신 분기가 완비되었다는 뜻은 아닙니다. 기업마다 결산월·공시 주기·통화가 다릅니다. **설명의 검토일, 실적의 보고기간, 공시 제출일, 주가 관측시각, 데이터 조회시각은 서로 다릅니다.** Nasdaq 시가총액은 별도 기준시각을 제공하지 않아 조회시각만 기록합니다. 비교 배수는 최근 확보 연간 공시 기준이며 TTM·선행 배수가 아닙니다. ADR·통화 불일치·합병 전후 범위 차이는 계산을 제한합니다. 자세한 확인 결과는 [검증 기록](docs/VALIDATION.md), 가정과 제한은 [재무·가치평가 방법론](docs/financial-methodology.md)을 참고하세요.

## 사용 순서

1. 산업 지도에서 섹터를 선택하거나 한글·영문·티커로 검색합니다.
2. 세부 산업의 수익 구조와 KPI를 읽고 기업 타일을 선택합니다.
3. 기업의 투자 논점·매크로·해자와 수익 구조·실적 추이를 함께 확인합니다.
4. 재무 기간을 선택해 원문을 확인하고, 밸류에이션의 관측값·계산값·미래 가정과 정책·촉매·반증 조건을 구분해 읽습니다.
5. 관찰 노트에 확인한 사실·가설·다음 확인 항목을 나누어 적습니다. 입력하면 현재 브라우저에 저장됩니다.
6. 즐겨찾기와 학습 완료 표시로 다시 볼 항목을 관리합니다. `/` 또는 `Ctrl/⌘ + K`는 검색, `Esc`는 창 닫기입니다.

## 다른 컴퓨터와 GitHub

**특정 드라이브·사용자 이름·상위 폴더 구조에 의존하지 않습니다.** 새 컴퓨터에 Git을 설치한 뒤 프로젝트를 둘 위치에서 실행합니다.

```powershell
git clone https://github.com/qkryung/MM_3.-Industry-Monitor.git
cd MM_3.-Industry-Monitor
```

폴더의 `index.html`을 Chrome 또는 Edge로 열면 됩니다. Git 없이 저장소의 **Code → Download ZIP**으로 내려받을 수도 있고, 읽기만 한다면 HTML 한 파일만 복사해도 됩니다. 비공개 저장소라면 해당 저장소에 접근할 수 있는 GitHub 계정으로 인증해야 합니다.

다음에 다른 컴퓨터에서 반영한 내용을 받으려면 프로젝트 폴더에서 실행합니다.

```powershell
git pull --ff-only
```

로컬 수정이 있으면 먼저 검토하고 커밋한 뒤 받아오세요. 데이터나 화면을 수정했다면 `build.bat`으로 생성한 `index.html`도 소스와 함께 커밋·푸시해야 다른 컴퓨터에서 같은 결과를 볼 수 있습니다. `update.bat`은 로컬 데이터와 HTML을 갱신하며 GitHub에 자동 업로드하지 않습니다.

개인 학습 기록은 브라우저에 저장되며 GitHub와 자동 동기화되지 않습니다.

1. 기존 컴퓨터의 **나의 서재 → 기록 내보내기**에서 `industry-study-YYYY-MM-DD.json`을 저장합니다.
2. 새 컴퓨터에서 프로젝트를 내려받고 `index.html`을 엽니다.
3. **나의 서재 → 기록 가져오기**에서 내보낸 JSON을 선택합니다.
4. 즐겨찾기·학습 진도는 합쳐집니다. 겹치는 메모는 기본적으로 현재 기기 내용을 유지하며, 가져온 메모로 바꾸려면 가져오기 창에서 선택합니다.

내보낸 개인 기록, `personal/`, `backups/`, `logs/`, `.cache/`는 `.gitignore`에서 제외합니다. 개인 기록 JSON은 별도 개인 보관 장소에 두세요. 브라우저를 바꾸거나 파일 경로를 옮기거나 브라우저 데이터를 지우기 전에도 기록을 내보내는 것이 좋습니다. `file://` 저장소 구분은 브라우저마다 다를 수 있습니다.

저장소에는 `src/`, `data/`, `assets/`, `scripts/`, `tests/`, 문서와 재생성한 `index.html`을 함께 관리합니다. 별도 상위 프로젝트 경로나 비밀 API 키는 필요하지 않습니다. GitHub Pages를 별도로 설정하면 저장소 루트를 게시 대상으로 사용할 수 있으며, 저장소 업로드만으로 웹사이트가 자동 공개되지는 않습니다.

## 갱신과 재빌드

수정·갱신에는 **Python 3.10 이상**이 필요하며, 외부 Python 패키지는 사용하지 않습니다.

| 실행 | 하는 일 | 인터넷 |
|---|---|---|
| `update.bat` | SEC 상장 식별자·최근 공시·재무 수치를 확인하고 HTML 재생성 | 필요 |
| `python scripts/update_market.py` | 주가·시가총액을 별도로 조회하여 `data/market-data.json` 저장; 이후 빌드 필요 | 필요 |
| `build.bat` | 현재 저장된 콘텐츠·재무·화면 코드를 검증하고 HTML 재생성 | 불필요 |

`update.bat`은 기존 재무 파일과 HTML을 `backups/`에 보관합니다. 기업별 조회에 실패하면 확보된 기존 자료를 유지하고 `data/update-status.json` 및 `logs/`에 결과를 기록합니다. 시세는 별도 명령으로 갱신합니다. **사업·연혁·투자 논점·해자·정책·가치평가 방법은 공식 자료를 읽고 수동으로 갱신하는 콘텐츠**입니다. 배치는 서술이나 브라우저 개인 메모를 자동 수정하지 않으며, 설명 검토일 이후의 공시가 확인된 기업을 다시 검토할 대상으로 표시합니다.

명령행에서도 실행할 수 있습니다.

```powershell
python scripts/update.py
python scripts/update.py --tickers MSFT,AAPL
python scripts/update.py --offline
python scripts/update_market.py
python scripts/build.py
```

`--offline`은 해당 컴퓨터에 이미 저장된 SEC 캐시로 재처리하며 새 정보를 조회하지 않습니다. 캐시 기본 위치는 운영체제 임시 폴더의 `industry-archive-sec-cache`입니다. Windows에서는 일반적으로 `%TEMP%\industry-archive-sec-cache`이며 저장소에 포함하지 않습니다. `INDUSTRY_ARCHIVE_CACHE` 환경변수로 위치를 변경할 수 있습니다. 필요하면 `SEC_USER_AGENT` 환경변수에 자신의 식별·연락 정보를 설정할 수 있고 API 키는 필요하지 않습니다.

추가 옵션은 `python scripts/update.py --help`에서 확인합니다. `--force`는 Company Facts 재다운로드, `--no-build`는 데이터 갱신만 실행, `--as-of YYYY-MM-DD`는 포함할 보고기간·공시일의 상한 설정입니다. `--as-of`는 당시의 상장 목록이나 뉴스 전체를 복원하는 기능은 아닙니다.

시세만 갱신하려면 `python scripts/update_market.py` 실행 후 `python scripts/build.py`를 실행합니다. `--tickers COIN,MU`로 대상을 제한할 수 있습니다. 시세 명령의 `--as-of`는 최신 관측값의 날짜 상한을 검사하며 과거 날짜의 시세를 복원하지 않습니다. 주가 조회 실패 시 기존 관측값이 남을 수 있고 오류는 `market-data.json`의 `errors`에 기록합니다. SEC 캐시를 사용하는 재무 갱신의 `--offline` 옵션과는 별개입니다.

## 콘텐츠 편집

생성된 HTML을 직접 수정하면 다음 빌드에서 덮어씁니다. 아래 원본을 수정한 뒤 `build.bat`을 실행하세요.

| 내용 | 원본 |
|---|---|
| 섹터·하위 산업·대표 기업 목록 | `data/sectors/<sector-id>.json` |
| 기업별 사업·연혁·투자보고서·평가 방법·출처 | `data/companies/<TICKER>.json`의 기본 필드와 `investmentResearch` |
| 용어·공통 매크로 설명·출처 | `data/context.json` |
| 자동 수집 재무 | `data/financials.json` |
| 관측 주가·공급자 시가총액·조회 오류 | `data/market-data.json` |
| 원문 검토를 거친 재무 보완 | `data/financial-supplements.json` |
| 법인 승계 등 공시 범위 조정 | `data/financial-adjustments.json` |
| UI·스타일 | `src/index.html`, `src/js/`, `src/css/` |

기업 설명은 공식 자료를 읽고 수동으로 갱신합니다. 사업부 매출 비중은 출처·기간이 확인된 값만 넣으며, 비중을 확인하지 않은 수익원은 정성 설명으로 표시합니다. 법인 승계·분사·인수 뒤에는 과거와 현재 실적의 범위를 함께 설명해야 합니다. 자세한 구조는 [데이터 모델](docs/data-model.md), 숫자의 선택·계산 규칙은 [재무 방법론](docs/financial-methodology.md)을 참고하세요.

## 파일 구조와 검증

```text
index.html                       바로 여는 완성본
build.bat / update.bat            재빌드 / 데이터 갱신
data/
  sectors/                       섹터별 JSON
  companies/                     기업별 JSON
  context.json                   공통 개념·분류·출처
  financials.json                공시 수치와 지표별 근거
  market-data.json               관측 시세·시가총액과 시점·출처
  financial-adjustments.json     법인·시계열 범위의 수동 조정
  financial-supplements.json     공식 원문에서 보완한 수치
  listing-verification.json       티커·거래소 대조 결과
  update-status.json              마지막 갱신 결과
src/
  index.html                     HTML 템플릿
  css/                           디자인 토큰·레이아웃·컴포넌트
  js/                            데이터·화면·트리맵·기업·이벤트
assets/fonts/                    Pretendard와 라이선스
assets/icons/                    SVG 아이콘과 라이선스
scripts/                         빌드·공시 갱신·재무 추출·독립 시세 갱신
tests/                           데이터·상태·재무 검증
docs/                            데이터·설계·방법론 문서
.github/workflows/validate.yml    빌드·테스트·HTML 일치 확인
```

기능 검증에는 Node.js 22 이상을 사용하며 npm 설치는 필요하지 않습니다.

```powershell
python -m unittest discover -s tests -p "test_*.py"
node --test tests/archive.test.cjs
```

GitHub 자동 검증은 빌드와 위 테스트, 커밋된 HTML이 소스와 일치하는지를 확인합니다. 자동 데이터 갱신이나 자동 배포를 수행하지 않습니다.

폰트는 [Pretendard](https://github.com/orioncactus/pretendard)의 SIL Open Font License 1.1을 따릅니다. [폰트 라이선스](assets/fonts/OFL.txt)는 저장소와 생성 HTML에 포함됩니다. SVG 아이콘은 [Lucide](https://lucide.dev/)를 사용하며 ISC 라이선스와 해당 Feather 파생 아이콘의 MIT 고지는 [아이콘 라이선스](assets/icons/LICENSE)에 보존합니다.
