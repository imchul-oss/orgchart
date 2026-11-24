-- ════════════════════════════════════════════════════════════════════
-- AIM Intelligence Org Chart — Supabase 스키마
-- ────────────────────────────────────────────────────────────────────
-- 사용법:
--   1. Supabase 대시보드 → 새 프로젝트 만들기
--   2. 좌측 SQL Editor → New query
--   3. 본 파일 전체 복사·붙여넣기 → Run
--   4. 프로젝트 설정 → API:
--        - Project URL    복사 → org-chart.html "☁ Cloud" 모달에 입력
--        - Publishable key 복사 → 같은 모달에 입력
--   5. 끝. 자동 동기화 시작됨.
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. nodes — 조직 카드 ────────────────────────────────────────────
create table if not exists public.nodes (
  id          text primary key,
  en          text        not null default '',
  ko          text        not null default '',
  type        text        not null default 'l2',
  -- type 허용 값: 'top','l1','l2','l3','l4','l5','side','tf'
  color       text        not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── 2. members — 카드 내 멤버 행 ────────────────────────────────────
create table if not exists public.members (
  id          bigserial   primary key,
  node_id     text        not null references public.nodes(id) on delete cascade,
  name        text        not null default '',
  func        text        not null default '',
  role        text        not null default '',
  area        text        not null default '',
  status      text        not null default 'active',
  -- status 기본 값: 'active','joining','leaving','needed','hiring' (커스텀 가능)
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists idx_members_node_id   on public.members(node_id);
create index if not exists idx_members_node_sort on public.members(node_id, sort_order);

-- ─── 3. conns — 연결선 ───────────────────────────────────────────────
create table if not exists public.conns (
  id          text        primary key,
  from_id     text        not null references public.nodes(id) on delete cascade,
  to_id       text        not null references public.nodes(id) on delete cascade,
  dashed      int         not null default 0,
  -- 0=실선, 1=점선
  from_side   text        not null default '',
  to_side     text        not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists idx_conns_from on public.conns(from_id);
create index if not exists idx_conns_to   on public.conns(to_id);

-- ─── 4. options — UI 옵션·카테고리·색상 ─────────────────────────────
create table if not exists public.options (
  key         text        primary key,
  value       jsonb       not null,
  updated_at  timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════
-- RLS (Row Level Security)
--
-- ⚠ 본 도구는 "Publishable Key (anon)" 만으로 접근하는 단일 사용자 SaaS-
--    형 구성입니다. 아래 정책은 anon 권한자에게 모든 CRUD 허용 — Key를
--    가진 사람만 접근하는 사실상의 비밀번호 모델입니다.
--
--    공개 레포 등에 Key가 노출될 위험이 있다면, 정책을 'authenticated'
--    로 변경하고 Supabase Auth로 로그인을 의무화하세요.
-- ════════════════════════════════════════════════════════════════════

alter table public.nodes   enable row level security;
alter table public.members enable row level security;
alter table public.conns   enable row level security;
alter table public.options enable row level security;

-- 기존 정책 있으면 제거 후 재생성 (재실행 안전)
drop policy if exists "anon_all_nodes"   on public.nodes;
drop policy if exists "anon_all_members" on public.members;
drop policy if exists "anon_all_conns"   on public.conns;
drop policy if exists "anon_all_options" on public.options;

create policy "anon_all_nodes"   on public.nodes   for all to anon using (true) with check (true);
create policy "anon_all_members" on public.members for all to anon using (true) with check (true);
create policy "anon_all_conns"   on public.conns   for all to anon using (true) with check (true);
create policy "anon_all_options" on public.options for all to anon using (true) with check (true);

-- ════════════════════════════════════════════════════════════════════
-- updated_at 자동 갱신 트리거 (선택)
-- ════════════════════════════════════════════════════════════════════
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_nodes_updated   on public.nodes;
drop trigger if exists trg_options_updated on public.options;

create trigger trg_nodes_updated   before update on public.nodes   for each row execute function public.set_updated_at();
create trigger trg_options_updated before update on public.options for each row execute function public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════
-- 검증 쿼리 (실행 후 결과 확인용)
-- ════════════════════════════════════════════════════════════════════
-- 4개 테이블 모두 존재하는지 확인
select tablename from pg_tables
where  schemaname = 'public'
  and  tablename in ('nodes','members','conns','options')
order  by tablename;

-- RLS가 켜져 있는지 확인 (모두 true여야 함)
select tablename, rowsecurity from pg_tables
where  schemaname = 'public'
  and  tablename in ('nodes','members','conns','options');

-- 정책 4개 모두 등록되었는지 확인
select tablename, policyname from pg_policies
where  schemaname = 'public'
  and  tablename in ('nodes','members','conns','options')
order  by tablename;
