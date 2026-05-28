# AIM Intelligence Org Chart

AIM Intelligence 조직도를 시각화·편집하는 단일 HTML 도구. 브라우저에서 바로 열리며, 필요 시 Supabase에 연결해 클라우드 동기화한다.

## 핵심 기능

- 카드 기반 조직도 (top / L1–L5 / Side / TF 8개 타입)
- 드래그·줌(15~300%)·자동 배치·화면 맞춤
- 실선/점선 연결선, 웨이포인트 편집
- Supabase 클라우드 동기화 (옵션)
- CSV / JSON 로컬 import·export
- 직무·직책·분야·상태 카테고리 자유 편집
- 카드 색상·폰트·간격·여백 슬라이더로 정밀 조정
- 인원 현황 플로팅 패널 (재직·예정·채용·퇴사 그룹 가시화)

## 빠른 시작

1. `org-chart.html`을 브라우저에서 연다.
2. (선택) 상단 **☁ Cloud** 버튼 → Supabase Project URL + Anon Key 입력 → 연결.
3. 좌상단 **＋ 조직 추가**로 카드 생성, **🔗 연결선 추가**로 카드 간 관계 표현.
4. **⚙ 옵션** / **◈ 데이터** 패널에서 색상·카테고리 커스터마이징.

## Cloud 연결 (Supabase)

기본 URL/Key는 비어 있다. 모달에서 직접 입력해야 동기화가 켜진다.

| 항목 | 값 |
|---|---|
| Project URL | Supabase 대시보드 → Project Settings → API → Project URL |
| Anon Key    | 같은 페이지의 `anon` `public` 키 |

Anon Key는 클라이언트 노출 전제이므로 **RLS 정책이 반드시 켜져 있어야 한다**.

## 데이터 저장

- **Local**: `localStorage` 단독 (키 `aim-org-chart-sb-v1`)
- **Cloud**: Supabase REST API (연결 시 자동 동기)
- **백업**: CSV·JSON export 권장 — Cloud DB 사고 대비

## 기술 스택

- Vanilla JS + HTML + CSS (런타임 의존성 없음)
- Supabase JS SDK v2 (CDN: jsdelivr)
- 단일 self-contained `.html` 파일 — 오프라인에서도 Local 모드로 동작

## 라이선스

내부 사용 (AIM Intelligence). 외부 배포 전 별도 협의 필요.
