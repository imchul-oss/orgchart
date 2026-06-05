# AIM Intelligence Org Chart

AIM Intelligence 조직도를 시각화·편집하는 단일 HTML 도구. 브라우저에서 바로 열리며, 필요 시 Supabase에 연결해 클라우드 동기화한다.

## 핵심 기능

- 카드 기반 조직도 (top / L1–L5 / Side / TF 8개 타입)
- 드래그·줌(15~300%)·자동 배치·화면 맞춤
- 균등 슬롯 레이아웃 + leaf 패딩으로 시각 균형 자동 보정
- 멤버 행 드래그앤드롭 — 팀 간 이동 + 팀 내 순서 변경 (드롭 위치 미리보기)
- 실선/점선 연결선, 웨이포인트 편집
- Supabase 클라우드 동기화 (옵션) — 0.8초 debounce 자동 저장 + 수동 `💾 저장` 버튼
- CSV / JSON 로컬 import·export
- 직무·직책·분야·상태 카테고리 자유 편집
- 카드 색상·폰트·간격·여백 슬라이더로 정밀 조정
- 인원 현황 플로팅 패널 (재직·예정·채용·퇴사 그룹 가시화)
- 파일명 기반 localStorage 네임스페이스 — 파일 복사·이름변경 시 별도 저장소 자동 분리

## 빠른 시작

1. `org-chart.html`을 브라우저에서 연다.
2. (선택) 상단 **☁ Cloud** 버튼 → Supabase Project URL + Publishable key 입력 → 연결.
3. 좌상단 **＋ 조직 추가**로 카드 생성, **🔗 연결선 추가**로 카드 간 관계 표현.
4. **⚙ 옵션** / **◈ 데이터** 패널에서 색상·카테고리 커스터마이징.

## Supabase 셋업 (1회만)

### 새 Supabase 프로젝트에서 시작하는 경우

1. [Supabase 대시보드](https://supabase.com/dashboard) → **New project** 생성
2. 좌측 **SQL Editor** → **New query**
3. 본 레포의 [`supabase-schema.sql`](./supabase-schema.sql) 전체 복사·붙여넣기 → **Run**
4. **Project Settings → API**:
   - **Project URL** 복사
   - **Publishable key** (또는 Legacy `anon` key) 복사
5. `org-chart.html` 열고 ☁ **Cloud** 모달에 두 값 입력 → **연결**

### 신 UI 위치 안내 (2026 기준)

| 항목 | 경로 |
|---|---|
| Project URL | Project Settings → **Integrations → Data API → Overview** |
| API Keys | Project Settings → **API Keys** (좌측 사이드바) |

## ⚠ RLS (Row Level Security) 정책

본 도구는 **Publishable Key (anon)** 만으로 접근합니다. 따라서 Supabase가 anon 권한자에게 읽기·쓰기를 허용해야 동기화가 작동합니다.

### 자가 진단 — "저장됨 메시지는 뜨는데 실제로는 안 됨" 증상

`supabase-schema.sql`을 실행하지 않았거나, 별도로 RLS를 강화했다면 **silent fail**이 발생합니다:

- ✅ 화면에는 `✓ 저장됨` 표시
- ❌ 실제로는 Supabase DB에 row가 들어가지 않음
- 새로고침·다른 컴퓨터에서 열면 **옛 데이터로 되돌아감**

본 도구의 최신 빌드는 silent fail을 자동 감지해 다음 메시지를 띄웁니다:
> ⚠ 저장 실패: Silent fail 감지 — RLS 정책이 anon write를 차단했을 가능성. SQL Editor에서 supabase-schema.sql 의 anon 정책 부분을 실행하세요.

### 즉시 해결 — SQL Editor에서 4줄 실행

이미 테이블은 있는데 정책만 없는 경우, `supabase-schema.sql`의 다음 4줄만 실행하면 됩니다:

```sql
create policy "anon_all_nodes"   on public.nodes   for all to anon using (true) with check (true);
create policy "anon_all_members" on public.members for all to anon using (true) with check (true);
create policy "anon_all_conns"   on public.conns   for all to anon using (true) with check (true);
create policy "anon_all_options" on public.options for all to anon using (true) with check (true);
```

### 보안 모델 명시

위 정책은 **Publishable key를 가진 사람만 접근**하는 "Key = 비밀번호" 모델입니다. Key가 공개 레포·이메일 등에 노출될 가능성이 있다면:

1. 정책을 `to anon` → `to authenticated` 로 변경
2. Supabase Auth로 사용자 로그인 의무화
3. Key 재발급 (대시보드 → API Keys → New publishable key)

## 데이터 저장 구조

- **Local**: `localStorage` 키 `aim-org-chart-sb__<filename>-v1` (파일명 prefix로 네임스페이스 분리)
- **Cloud**: Supabase REST API — 4개 테이블(`nodes`/`members`/`conns`/`options`)
- **자동 저장 주기**: 마지막 편집 후 0.8초 (debounce) → 자동 push
- **수동 저장**: 우상단 `💾 저장` 버튼 → 즉시 push (debounce 우회)
- **백업**: CSV·JSON export 권장 — Cloud DB 사고 대비

## 기술 스택

- Vanilla JS + HTML + CSS (런타임 의존성 없음)
- Supabase JS SDK v2 (CDN: jsdelivr)
- 단일 self-contained `.html` 파일 — 오프라인에서도 Local 모드로 동작

## 라이선스

내부 사용 (AIM Intelligence). 외부 배포 전 별도 협의 필요.
