# POLISH 변경 보고 (2026-10-16)

브랜치 `cloud/orgchart-polish`, 대상 파일 `org-chart-local.html`. 데이터는 `review/fake-org.json`만 사용했습니다.

**결론.** 변경 요청(BRIEF.md)의 네 가지 카드 수정을 모두 넣었고, `node review/run.mjs`는 `RESULT GREEN 5/5`로 끝납니다. 레이아웃(`autoLayout`)과 연결선 경로는 모든 방향에서 기준(refs/base.html)과 같습니다(판정 R). 자체 검토에서 PNG 내보내기의 인원 알약이 옛 색으로 남아 있던 것을 찾아 같은 브랜치에서 고쳤습니다. 미해결 항목은 마지막 절에 적었습니다.

## 1. 판정 결과

실행 환경: `PW_MODULE=/opt/node-tools/node_modules/playwright/index.js`, Chromium은 `/opt/pw-browsers`의 것을 사용했습니다.

### 변경 전

`node review/run.mjs --base` (기준 페이지 refs/base.html, 새 판정만):

```
== polish (new) on review/refs/base.html: RED (8 fails)
   T: down 3 toggles cover a member row
   G: right 3 of 3 toggles not at the side the children are on
   T: right 3 toggles cover a member row
   G: left 3 of 3 toggles not at the side the children are on
   T: left 3 toggles cover a member row
   T: toggle at 33% zoom is 5.3x5.3px
   C: 15 of 25 head counts below 4.5 contrast (min 3.37)
   P: _chartBounds still includes folded cards
BASE RUN (each new judge should be RED): 1 of 1 RED
```

`node review/run.mjs` (수정 전 후보, 기준과 동일 파일):

```
== polish (new) on org-chart-local.html: RED (8 fails)   (위와 같은 8건)
== tb   on org-chart-local.html: GREEN (0 fails)
== tf   on org-chart-local.html: GREEN (0 fails)
== rot  on org-chart-local.html: GREEN (0 fails)
== tree on org-chart-local.html: GREEN (0 fails)
RESULT RED 4/5
```

### 변경 후

`node review/run.mjs` (최종 커밋):

```
== polish (new) on org-chart-local.html: GREEN (0 fails)
   info {"contrast":{"cards":25,"min":"12.92"}}
== tb   on org-chart-local.html: GREEN (0 fails)
== tf   on org-chart-local.html: GREEN (0 fails)
== rot  on org-chart-local.html: GREEN (0 fails)
== tree on org-chart-local.html: GREEN (0 fails)
RESULT GREEN 5/5
```

페이지 오류(pageerror)와 console.error는 판정 실행과 자체 검토 모두에서 0건입니다.

## 2. 무엇을 어떻게 바꿨나

변경은 `org-chart-local.html` 한 파일, 15줄 추가 7줄 수정이며 커밋 4개로 나눴습니다. 바꾸지 않는 코드는 손대지 않았습니다.

### (1) 접기 토글이 배치 방향을 따른다 (커밋 f8d1662)

1. `collDecorate()`가 시트의 `posOrient`(현재 위치를 만든 방향)를 읽어 토글에 `ctog-r`(right) 또는 `ctog-l`(left) 클래스를 붙입니다. `OPT.orient`가 아니라 `posOrient`를 쓰므로, 방향 옵션만 바꾸고 아직 재배치하지 않은 시트에서는 토글이 현재 위치에 맞는 쪽에 남습니다.
2. CSS: down은 `left:50%; top:100%`(카드 아래 가장자리 가운데), right는 `left:100%; top:50%`(오른쪽 가장자리 세로 중앙), left는 `right:100%; top:50%`입니다.
3. 토글이 카드 바깥에 걸리므로 `.nd`의 `overflow:hidden`을 `visible`로 바꿨습니다. 그 대신 둥근 모서리 클리핑을 `.nh`(위 두 모서리)와 `.nb`(아래 두 모서리)에 `border-radius` + `overflow:hidden`으로 옮겨, 카드 모양은 전과 같습니다.

### (2) 토글이 멤버 행을 덮지 않고 어느 줌에서도 9px 이상 (같은 커밋)

1. 마지막 멤버 행은 카드 아래 가장자리까지 차지하므로, 가장자리에 걸치면 어떻게 두어도 행과 겹칩니다. 그래서 토글을 **가장자리 바깥에 붙여** 두었습니다. down은 윗변이 카드 아랫변에, right/left는 안쪽 변이 카드 옆변에 닿습니다. 판정 T("멤버 행과 겹치지 않음")와 G(가장자리에서 14px 이내)를 모두 만족하며, 마지막 행 가운데에 마우스를 올리면 `#mtip`이 뜹니다.
2. 크기: `updateSt()`가 줌이 바뀔 때마다 `--ctog-k = clamp(1, 1/S.scale, 4)`를 루트에 설정하고, 토글은 `scale(var(--ctog-k))`로 줌에 반비례해 커집니다. 25% 이상 줌에서는 화면상 항상 16px, 최소 줌 15%에서는 9.6px입니다. `transform-origin`을 카드에 닿는 변으로 두어 커져도 카드 가장자리에서 떨어지지 않습니다.
3. 클릭 처리와 드래그/연결/선택 차단은 기존 코드(토글의 mousedown/click/dblclick 캡처 리스너) 그대로입니다.

### (3) 인원 알약 대비 (커밋 e9745b2)

`.ncnt` 배경을 `rgba(255,255,255,.22)`에서 `rgba(0,0,0,.55)`로 바꾸고 글자는 흰색 그대로 두었습니다. 흰 글자의 대비가 4.5를 넘으려면 배경의 sRGB 밝기가 0.465 이하여야 하고, 검정 알파 0.55는 가장 밝은 헤더(흰색)에서도 0.45가 되어 대비 4.76이 나옵니다(계산값, 판정도 흰 헤더를 넣은 자체 검토에서 통과). 어두운 기본 헤더에서는 검은 알약이 묻히므로 1px 안쪽 흰 링(`box-shadow:inset`)을 더해 알약 윤곽만 살렸습니다. 링은 상자 크기와 위치를 바꾸지 않습니다. 판정 C의 최소 대비는 3.37에서 12.92로 올랐습니다.

### (4) 인쇄 범위에서 접힌 카드 제외 (커밋 c4b7d23)

`_chartBounds()`가 `collHidden()`으로 숨긴 카드를 빼고 잽니다. `exportPNG()`와 같은 방식이며, TF 존 프레임(`tfZoneInfo()`)은 이미 접힘을 반영하고 있어 그대로입니다.

## 3. 자체 검토

스크립트 `review/own-review-polish.mjs`(판정 아님, Playwright)로 가짜 데이터에서 사용자가 겪을 경로를 돌렸습니다. 실행: `PW_MODULE=... node review/own-review-polish.mjs`. 스크린샷은 `review/own-shots/`에 남기며 커밋하지 않았습니다.

검토 범위와 결과:

1. **읽기 전용·관리자 모드 × 시트 2개 × down/right/left**: 토글 수, 클래스, 가장자리 위치(1px 이내), 멤버 행 겹침, 다른 카드 겹침, 중심점 `elementFromPoint` 적중을 모두 확인. 12개 조합 전부 이상 없음.
2. **접기/펼치기**: 실제 마우스 클릭으로 접고, 자손 숨김과 `+N` 표시, 접힌 뒤 토글 위치, 다시 클릭해 펼침. 전부 정상. 토글 클릭으로 카드가 선택되거나 움직이지 않음.
3. **드래그·연결 차단(관리자)**: 토글에서 mousedown 후 120px 끌어도 카드 좌표 불변, `S.drag` null. 연결 모드에서 토글 클릭 시 `S.cfrom` null 유지, 접기만 수행.
4. **실행 취소/다시 실행(관리자)**: 헤더를 끌어 이동 후 `undoEdit()`로 좌표 복원, `redoEdit()`로 재적용. 두 경우 모두 토글이 `ctog ctog-r`로 다시 그려짐.
5. **저장·재로드**: 시트 1을 right, 시트 2를 left로 배치하고 하나를 접은 뒤 `_fileData()` → `_adoptData()` → `_finishLoad(true)`. 좌표, `posOrient`, 접힘 상태가 동일하고 토글 클래스도 시트별로 맞음.
6. **줌 15/25/33/50/75/100/150/200/300%**: 세 방향 모두 토글 화면 크기 최소 9.6px(15%), 25% 이상에서 16px, 100% 초과에서는 자연 확대. 모든 줌에서 중심점 적중.
7. **인쇄**: 접은 상태에서 `_chartBounds()`가 보이는 카드를 모두 포함하고 숨은 카드는 범위 밖임을 확인. `preparePrint()`/`restorePrint()` 왕복 후 `S.scale`, transform, `printing` 클래스가 원래대로. 인쇄 미디어 스크린샷에서 토글은 숨겨짐.
8. **PNG 내보내기**: 다운로드 앵커를 가로채 PNG를 저장해 확인.
9. **툴팁**: 토글이 있는 카드의 마지막 멤버 행 아래쪽 2px 지점에 마우스를 올려 `#mtip` 표시 확인(모든 조합).
10. **흰색 사용자 지정 헤더**: 카드 색을 `#FFFFFF`로 바꿔 알약이 읽히는지 확인.

찾아서 고친 것:

1. **PNG 내보내기의 인원 알약이 옛 색이었음** (커밋 fb4e1c9). `exportPNG()`는 알약을 캔버스에 직접 그리는데 `rgba(255,255,255,0.22)`가 남아 있어, 화면에서는 읽히고 PNG에서는 안 읽히는 상태였습니다. 화면과 같은 `rgba(0,0,0,0.55)`로 맞췄습니다. 모양(사각형)은 손대지 않았습니다.

검토 중 확인했으나 코드 변경이 필요 없던 것:

1. 접힘 상태는 localStorage에 남아 페이지를 다시 열어도 유지됩니다(기존 동작). 첫 검토 스크립트가 이전 단계의 접힘을 물려받아 PNG에 카드 하나만 나왔던 것은 스크립트 쪽 문제였고, 로드마다 localStorage를 비우도록 고쳤습니다.
2. down 배치에서 토글은 연결선이 시작하는 카드 아래 가운데에 놓입니다. 가짜 데이터에서 부모와 자식 사이 간격은 86~90px(down), 72px(right/left)로, 15% 줌에서도 토글(캔버스 기준 64px)이 자식 카드에 닿지 않았습니다.

## 4. 미해결·주의 사항

1. **"경계선에 걸치기"는 그대로 구현하지 않았습니다.** BRIEF는 토글이 경계선을 걸치도록 했지만, 판정 T는 멤버 행과 0.5px도 겹치지 않기를 요구하고 마지막 행은 카드 아랫변까지 차지합니다. 두 조건은 동시에 만족할 수 없어 판정을 따랐고, 토글은 가장자리 바깥에 닿아 있습니다. 판정이 틀렸다고 보지는 않습니다. 겹치지 않아야 툴팁이 가려지지 않기 때문입니다.
2. **줌 25% 미만에서는 토글이 16px보다 작아집니다** (배율 상한 4). 상한을 두지 않으면 15% 줌에서 캔버스 기준 107px짜리 토글이 되어 자식 카드를 덮을 수 있어 4로 잡았습니다. 15%에서 9.6px로 요구치 9px는 넘습니다.
3. **화면 맞춤(`fitScreen`)은 여전히 접힌 카드까지 포함해 잽니다.** BRIEF 범위가 인쇄뿐이라 손대지 않았습니다. 같은 `collHidden()` 필터 한 줄이면 됩니다.
4. **매우 어두운 헤더에서는 알약 배경이 거의 보이지 않고 링만 보입니다.** 글자 대비는 충분하나(최저 12.92), 알약의 존재감이 전보다 약합니다. 헤더 밝기에 따라 밝은/어두운 알약을 고르는 방식이 더 보기 좋을 수 있지만, 카드마다 계산 스타일을 읽어야 해서 이번에는 단순한 쪽을 택했습니다.
5. 토글 위 **우클릭(contextmenu)** 은 전과 같이 카드의 컨텍스트 메뉴로 전달됩니다. 기존 동작이며 이번 변경과 무관합니다.
6. 다른 세션이 같은 파일의 다른 변경을 만들고 있습니다. 이 브랜치가 건드린 자리는 `.nd`/`.nh`/`.nb`/`.ncnt`/`.ctog` CSS, `_chartBounds`, `exportPNG`의 알약 두 줄, `updateSt` 첫 줄, `collDecorate` 두 줄입니다. 병합 시 이 자리만 보면 됩니다.
