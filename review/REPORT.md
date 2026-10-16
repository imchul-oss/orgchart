# BESIDE 변경 보고 (2026-10-16)

브랜치 `cloud/orgchart-beside`, 대상 `org-chart-local.html`. 데이터는 `review/fake-org.json`만 사용했습니다.
판정(`review/judges/*`, `review/run.mjs`, `review/units.json`)은 수정하지 않았습니다.

## 1. 판정 결과

실행: `PW_MODULE=/opt/node-tools/node_modules/playwright/index.js node review/run.mjs [--base]`

| 시점 | beside (new) | tf2 (new) | tb | rot | tree | 결과 |
|---|---|---|---|---|---|---|
| base (`review/refs/base.html`, `--base`) | RED (2) | RED (1) | - | - | - | 2 of 2 RED |
| 수정 전 후보 (`org-chart-local.html`) | RED (2) | RED (1) | GREEN | GREEN | GREEN | RESULT RED 3/5 |
| 수정 후 (커밋 35a126c) | GREEN | GREEN | GREEN | GREEN | GREEN | RESULT GREEN 5/5 |

수정 전 실패 내용 (base와 후보 동일):
- beside: `L: down layout check reports overlap 0 cross 9`, `B: tf3 is not beside its parent (dy -200, gap 4032)`
- tf2: `P: T3 is not beside its parent (dy -200, gap 4032)`

페이지 로드와 모든 시나리오에서 콘솔 오류, pageerror 0건 (자체 검토 스크립트에서 수집).

## 2. 변경 내용과 이유

### 2.1 커밋 96210c2: 직접 배치되는 leaf 자식에도 beside 목록과 자리를 만든다

`autoLayout()` 안 `place()`는 자식을 세 경로에서 `place()`를 거치지 않고 직접 좌표를 찍습니다.
(1) leaf와 서브트리가 섞인 그룹의 leaf 형제, (2) 줄바꿈 그룹(`kn`/`OPT.wrapN`), (3) 세로 1열 그룹(`kl='col'`).
이 경로의 leaf는 `_asides`가 만들어지지 않아 그 밑의 leaf side 카드가 `besideSide`에 들어가지 못하고
자유 side 행으로 밀려났고, 점선이 카드 행을 가로질렀습니다 (판정 시나리오에서 cross 9).

수정:
- `place()` 안에 `leafBeside(cn)` 헬퍼를 추가했습니다. 해당 leaf의 `sideKids`를 `_asides`로 넣고 `besideSide`에 등록한 뒤,
  부모 `ad`(좌/우/양쪽)와 `ac`(열 수)에 따라 왼쪽 예약 폭 `l`, 열 간격용 오른쪽 추가 폭 `rw`, 카드 위치 `lx`에서의
  beside 우측 끝 `r(lx)`를 돌려줍니다. 계산식은 기존 `fin()`과 같습니다.
- 혼합 그룹 leaf: 슬롯 시작을 `l`만큼 밀고, 슬롯 우측 끝을 `max(슬롯 끝, r(lx))`로 잡아 다음 형제가 겹치지 않게 했습니다.
- 줄바꿈 그룹: 열마다 `colL[j]`, `colR[j]`를 모아 열 피치를 넓혔습니다 (`colX(j)`). beside 카드가 없으면
  `x0 + j*(NW+COL_GAP)` 그대로라 기존 좌표와 같습니다. 부모 중심과 반환 폭도 같은 식으로 바꿨습니다.
- 세로 1열 그룹: 자식 중 가장 큰 왼쪽 예약 폭만큼 부모와 자식 열을 오른쪽으로 밀고, 반환 폭은 자식들의 `r(lx)` 최대값까지 늘렸습니다.
- 옆으로 눕힌 배치(`_sideLayout`)는 이미 `n._asides`를 읽어 부모 열 아래에 적재하므로, `_asides`가 채워지면서 그대로 동작합니다.

side 카드가 없는 시트는 모든 예약 폭이 0이라 좌표식이 수정 전과 동일합니다 (판정 R 검사와 regression 판정으로 확인).

### 2.2 커밋 35a126c: beside 카드 폭·높이를 형제 간격과 세로 적재에 반영

자체 검토에서 찾은 결함을 고친 커밋입니다 (3절).
- `equalizeSiblingGaps()`의 `getSubtreeBounds()`가 beside 카드 폭을 모른 채 간격을 재서, beside 카드 뒤의 간격이 부풀려 보였고
  그 값으로 모든 간격을 넓히다 서브트리가 다음 형제 서브트리를 침범했습니다. `_bs`(이 패스 전에 확정됨)를 보고 좌우 beside 열 폭을
  경계에 포함시켰습니다.
- 행 높이 계산에만 있던 "카드 높이 + beside 적재 높이" 식을 `bsH(n)` 헬퍼로 빼고, 줄바꿈 2행 이후의 y와 세로 1열 적재 y에도 썼습니다.
  beside 카드가 없으면 `bsH(n) === nh(n)`이라 기존과 같습니다.

## 3. 자체 검토

스크립트: `review/own-review-beside.mjs` (판정과 별개, 같은 Playwright로 실행). fake 데이터에 시나리오를 얹어
읽기 전용과 관리자 모드(`ADMIN = true; applyRO();`), `OPT.orient` down/right/left + `autoLayout()`, 접기(`collToggle`),
되돌리기/다시 하기(`undoEdit`/`redoEdit`), `_fileData()` 저장 후 재로드, `exportPNG()`, print 미디어를 확인합니다.
검사 항목: 카드 겹침(직접 계산)과 배치 점검 배지(overlap/cross/broken), beside 카드가 부모 옆(down) 또는 부모 열 아래(right/left)에 있는지,
TF 구역이 모든 카드 오른쪽에 있는지, 저장 왕복 후 좌표 보존과 `autoLayout()` 재실행 시 좌표 불변, 언더스코어 내부 속성의 파일 유출 여부.

시나리오: 판정 시나리오(tf1-tf4), 혼합 그룹에서 `ad='L'`·`ad='B'`·`ac=2`에 side 카드 1-3장, 줄바꿈 그룹(`kn=3`), 세로 1열 그룹(`kl='col'`),
sheet 1(모두 leaf인 그룹 + 서브트리 부모), 멤버 3명짜리 side 카드 2장을 적재하는 세로 1열·줄바꿈, 부모 자식 3개 이상인 그룹의 간격 균등화, side 카드 없는 원본 두 시트.

찾은 것과 처리:
1. **(수정) 형제 간격 균등화가 beside 카드를 밀어 겹침.** sheet 1에서 모두 leaf인 그룹의 한 leaf에 side 카드를 붙이면 옆 서브트리와 카드 2쌍이 겹쳤습니다.
   base에서도 같은 결과라 기존 결함이고, 이번 변경으로 혼합 그룹 leaf도 같은 경로를 타게 되어 함께 고쳤습니다 (2.2).
2. **(수정) 적재된 beside 카드가 다음 행·다음 자식의 beside 카드와 겹침.** 세로 1열 자식이나 줄바꿈 1행 카드에 side 카드 2장이 적재되고
   다음 자식에도 side 카드가 있으면 겹쳤습니다 (세로 1열 2쌍, 줄바꿈 1쌍 + cross 1). `bsH()`로 고쳤습니다 (2.2).
3. **(검사식 수정, 코드 아님) `ac=2`의 두 번째 열과 적재 2행.** 처음 검사식은 모든 side 카드가 부모 바로 옆 1열에 있어야 한다고 봤으나,
   `ac=2`면 두 번째 열, `ac=1`에 2장이면 아래로 적재되는 것이 기존 beside 동작입니다. 검사식을 그에 맞췄습니다.
4. 접기, 되돌리기/다시 하기, 저장 왕복, PNG, print, 관리자 모드에서는 결함이 없었습니다. 접은 부모의 beside 카드는 함께 숨고 배지가 0이며,
   관리자 모드 배치는 읽기 전용과 좌표가 같고, 저장 왕복 후 좌표가 보존되고 재배치해도 움직이지 않습니다. PNG는 beside 카드 제목을 그리고 print에서도 보입니다.

첫 커밋(96210c2) 기준으로 같은 스크립트를 돌리면 1, 2번이 11건 FAIL로 재현되고, 35a126c에서 모두 GREEN입니다.

## 4. 남은 것

- **side가 아닌 aside 카드(`aside === true`)에도 2.2가 적용됩니다.** 자식이 3개 이상인 부모 밑에 aside 카드가 있던 시트는 간격 균등화 결과가 달라질 수 있습니다
  (예전에는 beside 폭만큼 모든 간격이 부풀었고 겹치기도 했음). side 카드도 aside 카드도 없는 시트는 좌표가 그대로입니다.
  브리프의 "side 카드 없는 시트는 그대로"를 좁게 읽으면 벗어나는 점이라 적어 둡니다. 같은 결함을 side 카드에만 고치는 쪽이 낫다면 `getSubtreeBounds()`의
  조건에 `type === 'side'` 검사를 더하면 됩니다.
- 혼합 그룹의 leaf는 side 카드가 있어도 `NW x 1.2` 슬롯 중앙 정렬을 유지합니다. 모두 leaf인 그룹의 leaf(`place()` 경로, 슬롯 시작에 붙음)와 미세하게 다른 점은 기존 차이 그대로입니다.
- 옆으로 눕힌 배치에서는 `ad='L'` 카드도 오른쪽 카드와 똑같이 부모 열 아래로 갑니다 (기존 동작, 변경 없음).
- 검토는 API 호출 수준입니다. 마우스 드래그 같은 실제 입력과 PNG 픽셀은 보지 않았습니다.
- 판정 `tf2`의 info `shift` 값은 실행마다 다르게 보고되지만 참고 정보일 뿐이고 판정에 쓰이지 않습니다.
