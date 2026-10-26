"""Extreme dummy for the org chart stress run (2026-10-26, owner: more people, more orgs, more cases, more values).
All names are invented. Usage: python gen-extreme.py [scale] > review/data/extreme.json   (scale 1 = default size)
Sheets:
  1 대형: wide and deep tree, about 900 cards and 6,000 members at scale 1
  2 글자: very long titles and names, names with spaces, Latin, digits, symbols, HTML and script text, emoji, blanks
  3 구성: one card with 120 members, 4 member columns, beside cards in 3 columns, many TF and side cards, folded cards,
          concurrent members, unknown statuses and categories, empty cards, a 12-level chain, orphans, broken,
          duplicate, self and cyclic links
  4 가로: the tree of sheet 1 cut down, laid out left to right;  5 오른쪽에서: same, right to left
  6 빈 시트: no cards;  7-14: twelve small sheets so the sheet bar overflows
"""
import json, random, sys
SCALE = float(sys.argv[1]) if len(sys.argv) > 1 else 1.0
rnd = random.Random(20261026)
FAM = list('김이박최정강조윤장임한오서신권황안송류홍전고문양손배백허유남심노하곽성차주우구민나진지엄채원천방공현함변염여추도소석선설마길연위표명기반왕금옥육인맹제모탁국어은편용예봉경')
SYL = list('가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허고노도로모보소오조초코토포호구누두루무부수우주추쿠투푸후기니디리미비시이지치키티피히민서준도윤하우현수연예은채원재성태영동진')
STATUS = ['active', 'leave', 'hire', 'resign', 'join', 'vacant']
RANKS = ['사원', '주임', '대리', '과장', '차장', '부장', '이사', '상무', '전무', '대표', '팀장', '파트장', '책임', '선임', '수석']
JOBS = ['직무%02d' % i for i in range(1, 61)]
AREAS = ['근무지%02d' % i for i in range(1, 21)]
nid = [0]
def new_id(p='x'):
    nid[0] += 1; return '%s%05d' % (p, nid[0])
def name(i=None):
    k = rnd.random()
    if k < 0.02: return ''  # blank name (vacant seat)
    if k < 0.04: return '응우옌 ' + rnd.choice(SYL) + ' ' + rnd.choice(SYL)  # names with spaces
    if k < 0.05: return 'John Smith-' + str(rnd.randint(1, 99))
    return rnd.choice(FAM) + ''.join(rnd.choice(SYL) for _ in range(rnd.choice([1, 2, 2, 2, 3])))
def member(cc_rate=0.03):
    m = {'n': name(), 'r': rnd.choice(RANKS), 'f': rnd.choice(JOBS + [''] * 6), 's': rnd.choice(STATUS * 6 + ['zz-unknown'])}
    if rnd.random() < 0.5: m['a'] = rnd.choice(AREAS)
    if rnd.random() < cc_rate: m['cc'] = True
    return m
def node(t, title, x=0, y=0, nm=None):
    n = {'id': new_id(), 'en': title, 'ko': rnd.choice(['', '', title + ' 부제']), 'type': t, 'x': x, 'y': y,
         'm': [member() for _ in range(nm if nm is not None else rnd.randint(0, 12))]}
    if rnd.random() < 0.15: n['color'] = '#%06x' % rnd.randint(0, 0xFFFFFF)
    return n
def tree(fan, depth_types, nm_avg):
    nodes, conns = [], []
    root = node('top', '대표 조직', nm=3); nodes.append(root)
    lvl = [root]
    for d, (t, f) in enumerate(zip(depth_types, fan)):
        nxt = []
        for p in lvl:
            for i in range(max(1, int(round(f * (0.5 + rnd.random()))))):
                c = node(t, '%s %d-%d' % (t.upper(), d + 1, len(nodes)), nm=max(0, int(rnd.gauss(nm_avg, nm_avg / 2))))
                nodes.append(c); conns.append({'id': new_id('e'), 'f': p['id'], 't': c['id'], 'd': 0}); nxt.append(c)
        lvl = nxt
    return nodes, conns
sheets = []
# 1 대형
n1, c1 = tree([8 * SCALE, 5, 4, 3, 1.2], ['l1', 'l2', 'l3', 'l4', 'l5'], 7)
sheets.append({'name': '대형 조직 (%d개)' % len(n1), 'nodes': n1, 'conns': c1})
# 2 글자
LONG = '아주 긴 조직 이름 ' * 8
weird = [LONG.strip(), 'A' * 90, '<b>굵게</b> & "따옴표" \'홑\' `역`', '<img src=x onerror="window.__xss=1">', '<script>window.__xss=2</script>',
         '줄\n바꿈\t탭', '   ', '', '😀 이모지 조직 🚀', '١٢٣ عربي', 'Ünïcødé Ωμέγα', '0', 'null', 'undefined', 'NaN', '${alert(1)}', '\\u0000 escape', '%s %d']
n2, c2 = [], []
r2 = node('top', '글자 시험', nm=2); n2.append(r2)
for i, w in enumerate(weird):
    nd = node('l1', w, nm=0)
    nd['ko'] = weird[(i + 3) % len(weird)]
    nd['m'] = [{'n': weird[(i + k) % len(weird)][:40] or '', 'r': weird[(i + k + 1) % len(weird)][:20], 'f': weird[(i + k + 2) % len(weird)][:30], 's': 'active'} for k in range(4)]
    nd['m'].append({'n': '김' * 30, 'r': '과' * 15, 'f': '직무' * 20, 's': 'leave'})
    n2.append(nd); c2.append({'id': new_id('e'), 'f': r2['id'], 't': nd['id'], 'd': 0})
sheets.append({'name': '글자 <시험> & "극단"', 'nodes': n2, 'conns': c2})
# 3 구성
n3, c3 = [], []
r3 = node('top', '구성 시험', nm=1); n3.append(r3)
big = node('l1', '120명 조직', nm=120); big['mc'] = 4; n3.append(big); c3.append({'id': new_id('e'), 'f': r3['id'], 't': big['id'], 'd': 0})
par = node('l1', '옆 카드 부모', nm=2); par['ac'] = 3; n3.append(par); c3.append({'id': new_id('e'), 'f': r3['id'], 't': par['id'], 'd': 0})
for i in range(14):
    a = node('l2', '옆 카드 %d' % i, nm=rnd.randint(0, 5)); a['aside'] = True; n3.append(a); c3.append({'id': new_id('e'), 'f': par['id'], 't': a['id'], 'd': 0})
for i in range(10):
    tf = node('tf', 'TF %d' % i, nm=rnd.randint(1, 8)); n3.append(tf); c3.append({'id': new_id('e'), 'f': rnd.choice([r3, big, par])['id'], 't': tf['id'], 'd': 1})
    sd = node('side', '사이드 %d' % i, nm=rnd.randint(0, 3)); n3.append(sd); c3.append({'id': new_id('e'), 'f': rnd.choice([r3, big, par])['id'], 't': sd['id'], 'd': 1})
chain = r3
for d in range(12):
    t = ['l1', 'l2', 'l3', 'l4', 'l5'][min(d, 4)]
    c = node(t, '사슬 %d' % d, nm=rnd.randint(0, 3)); n3.append(c); c3.append({'id': new_id('e'), 'f': chain['id'], 't': c['id'], 'd': 0}); chain = c
cc = node('l1', '겸직 많은 조직', nm=10)
for m in cc['m']: m['cc'] = True
n3.append(cc); c3.append({'id': new_id('e'), 'f': r3['id'], 't': cc['id'], 'd': 0})
for i in range(5): e = node('l2', '빈 조직 %d' % i, nm=0); n3.append(e); c3.append({'id': new_id('e'), 'f': cc['id'], 't': e['id'], 'd': 0})
for i in range(4): n3.append(node('l2', '고아 조직 %d' % i, nm=2))
a, b = n3[-1], n3[-2]
c3 += [{'id': new_id('e'), 'f': 'none-1', 't': a['id'], 'd': 0}, {'id': new_id('e'), 'f': a['id'], 't': 'none-2', 'd': 0},
       {'id': new_id('e'), 'f': a['id'], 't': a['id'], 'd': 0}, {'id': new_id('e'), 'f': a['id'], 't': b['id'], 'd': 0},
       {'id': new_id('e'), 'f': b['id'], 't': a['id'], 'd': 0}, {'id': new_id('e'), 'f': big['id'], 't': cc['id'], 'd': 0},
       {'id': new_id('e'), 'f': r3['id'], 't': big['id'], 'd': 0}]
sheets.append({'name': '구성 시험', 'nodes': n3, 'conns': c3, 'coll': [cc['id']]})
# 4, 5 orientations
for nm_, ori in (('가로 배치', 'right'), ('오른쪽에서 배치', 'left')):
    n4, c4 = tree([4, 3, 2], ['l1', 'l2', 'l3'], 4)
    sheets.append({'name': nm_, 'nodes': n4, 'conns': c4, 'posOrient': ori})
sheets.append({'name': '빈 시트', 'nodes': [], 'conns': []})
for i in range(12):
    n5, c5 = tree([2, 2], ['l1', 'l2'], 2)
    sheets.append({'name': '작은 시트 %02d 이름이 조금 긴 시트' % (i + 1), 'nodes': n5, 'conns': c5})
opt = {
    'statusItems': [{'key': k, 'label': l, 'color': c} for k, l, c in [('active', '재직', '#4CAF50'), ('join', '입사예정', '#2196F3'), ('leave', '휴직', '#FF9800'),
                    ('resign', '퇴사예정', '#9C27B0'), ('hire', '채용필요', '#F44336'), ('vacant', '채용 중', '#795548')]] + [{'key': 'x%02d' % i, 'label': '추가 상태 %02d' % i, 'color': '#%06x' % rnd.randint(0, 0xFFFFFF)} for i in range(10)],
    'jobCats': JOBS[:50], 'areaCats': AREAS, 'roleCats': RANKS,
}
out = {'v': 3, 'app': 'ssb-org-chart', 'savedAt': '2026-10-26T00:00:00+09:00', 'note': '스트레스 시험용 극단값 더미 (모두 지어낸 값)', 'activeSheet': 0, 'sheets': sheets, 'opt': opt}
tot_n = sum(len(s['nodes']) for s in sheets); tot_m = sum(len(n['m']) for s in sheets for n in s['nodes'])
sys.stderr.write('sheets %d cards %d members %d\n' % (len(sheets), tot_n, tot_m))
sys.stdout.reconfigure(encoding='utf-8'); print(json.dumps(out, ensure_ascii=False))
