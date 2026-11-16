#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# Copyright (C) 2026 Shaka Lei Kaumaka / Open Source Orchestra and the AI ʻohana
# Turn YOUR hand-drawn signature (a screenshot/photo with coloured strokes) into an SVG of pen strokes in drawing order,
# ready for the frame's signature piece. Usage: python3 -I tools/vectorize-signature.py crop.png media/signature.svg
# Needs numpy + Pillow. Tune the colour mask below (default: light-blue Markup ink).
"""Vectorize Shaka's hand-drawn signature (cyan Markup strokes) into ordered SVG pen strokes.

crop.png  -> mask (cyan) -> Zhang-Suen skeleton -> graph -> pen strokes (straightest continuation
through crossings) -> RDP simplify -> Catmull-Rom cubic Beziers -> signature.svg (+ debug png).
No scipy/skimage: numpy + PIL only.
"""
import json, math, sys
import numpy as np
from PIL import Image, ImageDraw

SRC = sys.argv[1] if len(sys.argv) > 1 else 'crop.png'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'signature.svg'
UP = 3  # upsample factor before thinning (smoother centre lines)

im = Image.open(SRC).convert('RGB')
im = im.resize((im.width * UP, im.height * UP), Image.LANCZOS)
a = np.asarray(im).astype(int)
R, G, B = a[..., 0], a[..., 1], a[..., 2]
mask = (B > 150) & (B - R > 55) & (G > 120)
print('mask px', int(mask.sum()), 'size', im.size)

# --- Zhang-Suen thinning -------------------------------------------------------
def zhang_suen(img):
    img = img.copy().astype(np.uint8)
    changed = True
    while changed:
        changed = False
        for step in range(2):
            P = np.pad(img, 1)
            p2 = P[:-2, 1:-1]; p3 = P[:-2, 2:]; p4 = P[1:-1, 2:]; p5 = P[2:, 2:]
            p6 = P[2:, 1:-1]; p7 = P[2:, :-2]; p8 = P[1:-1, :-2]; p9 = P[:-2, :-2]
            nb = [p2, p3, p4, p5, p6, p7, p8, p9]
            Bn = sum(n.astype(int) for n in nb)
            seq = nb + [p2]
            An = sum(((seq[i] == 0) & (seq[i + 1] == 1)).astype(int) for i in range(8))
            if step == 0:
                c1 = (p2 * p4 * p6) == 0; c2 = (p4 * p6 * p8) == 0
            else:
                c1 = (p2 * p4 * p8) == 0; c2 = (p2 * p6 * p8) == 0
            rm = (img == 1) & (Bn >= 2) & (Bn <= 6) & (An == 1) & c1 & c2
            if rm.any():
                img[rm] = 0; changed = True
    return img

sk = zhang_suen(mask)
ys, xs = np.nonzero(sk)
pts = set(zip(xs.tolist(), ys.tolist()))
print('skeleton px', len(pts))
N8 = [(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]
def nbrs(p):
    x, y = p
    return [(x + dx, y + dy) for dx, dy in N8 if (x + dx, y + dy) in pts]

# remove "staircase" redundancy: a pixel whose removal keeps 4-connectivity of neighbours is fine; keep simple

ORDER = [(0, -1), (1, -1), (1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1)]  # circular
def crossings(p):
    x, y = p
    ring = [((x + dx, y + dy) in pts) for dx, dy in ORDER]
    return sum(1 for i in range(8) if (not ring[i]) and ring[(i + 1) % 8])
deg = {p: len(nbrs(p)) for p in pts}
cn = {p: crossings(p) for p in pts}
endpoints = {p for p in pts if cn[p] == 1 and deg[p] <= 2}
junction_px = {p for p in pts if cn[p] >= 3}
# cluster junction pixels (8-connected, plus within 2px)
jid = {}
for p in junction_px:
    if p in jid: continue
    jid[p] = p; st = [p]
    while st:
        c = st.pop()
        for q in junction_px:
            if q not in jid and max(abs(q[0]-c[0]), abs(q[1]-c[1])) <= 2:
                jid[q] = p; st.append(q)
for p in endpoints: jid[p] = p
nodes = set(jid)
visited = set()
edges = []   # (start_node_id, end_node_id, path)
def walk(start, first):
    path = [start, first]; prev = start; cur = first
    while cur not in nodes:
        visited.add(cur)
        cand = [q for q in nbrs(cur) if q != prev and q not in visited and q not in path]
        if not cand: return path, None
        node_c = [q for q in cand if q in nodes and jid[q] != jid.get(start)]
        if node_c: cand = node_c
        cand.sort(key=lambda q: abs(q[0]-cur[0]) + abs(q[1]-cur[1]))
        prev, cur = cur, cand[0]; path.append(cur)
    return path, cur
for n in list(nodes):
    for m in nbrs(n):
        if m in nodes or m in visited: continue
        path, end = walk(n, m)
        if end is None: end = path[-1]
        edges.append([jid[n], jid.get(end, end), path])
# leftover pure loops / unvisited chains
print('edges', len(edges))
def plen(p): return sum(math.dist(p[i], p[i+1]) for i in range(len(p)-1))
# spur removal: endpoint→junction edges shorter than 7 px (orig)
def ends_count():
    c = {}
    for a, b, p in edges:
        c[a] = c.get(a, 0) + 1; c[b] = c.get(b, 0) + 1
    return c
changed = True
while changed:
    changed = False
    c = ends_count()
    for e in list(edges):
        a, b, p = e
        if plen(p) < 7 * UP and ((a in endpoints and c.get(b, 0) >= 3) or (b in endpoints and c.get(a, 0) >= 3)):
            edges.remove(e); changed = True; break
edges = [e for e in edges if plen(e[2]) >= 2 * UP or e[0] != e[1]]
print('edges after spurs', len(edges))
def tangent(path, at_start, k=7):
    k = min(k * UP, len(path) - 1)
    a, b = (path[k], path[0]) if at_start else (path[-1-k], path[-1])
    v = (b[0]-a[0], b[1]-a[1]); n = math.hypot(*v) or 1
    return (v[0]/n, v[1]/n)
ends = {}
for i, (a, b, p) in enumerate(edges):
    ends.setdefault(a, []).append((i, True)); ends.setdefault(b, []).append((i, False))
pair = {}
for j, lst in ends.items():
    if len(lst) == 2 and lst[0][0] != lst[1][0]:
        pair[lst[0]] = lst[1]; pair[lst[1]] = lst[0]; continue   # corner: always continue the pen
    cands = []
    for x in range(len(lst)):
        for y in range(x+1, len(lst)):
            (i1, s1), (i2, s2) = lst[x], lst[y]
            if i1 == i2: continue
            t1 = tangent(edges[i1][2], s1); t2 = tangent(edges[i2][2], s2)
            cands.append((t1[0]*t2[0] + t1[1]*t2[1], lst[x], lst[y]))
    cands.sort(); used = set()
    for dot, u, v in cands:
        if dot > -0.5: break
        if u in used or v in used: continue
        pair[u] = v; pair[v] = u; used |= {u, v}
seen = set(); strokes = []
for i in range(len(edges)):
    if i in seen: continue
    cur, cur_start = i, True; g = 0
    while (cur, cur_start) in pair and g < 60:
        nxt, ns = pair[(cur, cur_start)]
        if nxt == i: break
        cur, cur_start = nxt, not ns; g += 1
    chain = []; e_i, enter_start = cur, cur_start; g = 0
    while e_i not in seen and g < 60:
        seen.add(e_i)
        seg = edges[e_i][2] if enter_start else edges[e_i][2][::-1]
        chain.extend(seg if not chain else seg[1:])
        out = (e_i, not enter_start)
        if out not in pair: break
        e_i, s2 = pair[out]; enter_start = s2; g += 1
    strokes.append(chain)
print('strokes', len(strokes), [round(plen(s) / UP) for s in strokes])

# --- simplify + orient + order -------------------------------------------------------------
def rdp(points, eps):
    if len(points) < 3:
        return points
    a, b = np.array(points[0], float), np.array(points[-1], float)
    ab = b - a; L = np.hypot(*ab) or 1e-9
    d = [abs(ab[0]*(p[1]-a[1]) - ab[1]*(p[0]-a[0])) / L for p in points[1:-1]]
    i = int(np.argmax(d)) + 1
    if d[i - 1] > eps:
        return rdp(points[:i + 1], eps)[:-1] + rdp(points[i:], eps)
    return [points[0], points[-1]]

S = 1.0 / UP
polys = [[(x * S, y * S) for x, y in st] for st in strokes if plen(st) >= 2 * UP]
def tdir(p, at_start, k=6):
    k = min(k, len(p) - 1)
    a_, b_ = (p[k], p[0]) if at_start else (p[-1-k], p[-1])
    v = (b_[0]-a_[0], b_[1]-a_[1]); n = math.hypot(*v) or 1
    return (v[0]/n, v[1]/n)
def L(p): return sum(math.dist(p[i], p[i+1]) for i in range(len(p)-1))
# merge aligned fragments whose ends almost touch (crossings split them)
merged = True
while merged:
    merged = False
    best = None
    for i in range(len(polys)):
        for j in range(len(polys)):
            if i == j: continue
            for si in (True, False):
                for sj in (True, False):
                    pi = polys[i][0] if si else polys[i][-1]
                    pj = polys[j][0] if sj else polys[j][-1]
                    d = math.dist(pi, pj)
                    if d > 12: continue
                    ti, tj = tdir(polys[i], si), tdir(polys[j], sj)
                    dot = ti[0]*tj[0] + ti[1]*tj[1]
                    small = min(L(polys[i]), L(polys[j])) < 10
                    if dot < -0.85 or (small and d < 5):
                        score = d + (dot + 1) * 10
                        if best is None or score < best[0]:
                            best = (score, i, si, j, sj)
    if best:
        _, i, si, j, sj = best
        A = polys[i] if not si else polys[i][::-1]   # A ends at the joining end
        Bp = polys[j] if sj else polys[j][::-1]      # B starts at the joining end
        polys[i] = A + Bp
        del polys[j]
        merged = True
print('after merge', len(polys), [round(L(p)) for p in polys])
out = []
for p in polys:
    if L(p) < 6: continue
    (x0, y0), (x1, y1) = p[0], p[-1]
    if abs(y1 - y0) > abs(x1 - x0):
        if y1 < y0: p = p[::-1]
    else:
        if x1 < x0: p = p[::-1]
    out.append(rdp(p, 0.55))
def top(p): return min(y for _, y in p)
def bot(p): return max(y for _, y in p)
def cx(p): return sum(x for x, _ in p) / len(p)
word_top = sorted(top(p) for p in out)[len(out) // 2]
flour = [p for p in out if top(p) < word_top - 40 and bot(p) < word_top + 60]
word = [p for p in out if p not in flour]
# letters by x-gaps between stroke spans (sorted by centre)
word.sort(key=cx)
letters = []
for p in word:
    lo, hi = min(x for x, _ in p), max(x for x, _ in p)
    if letters and lo < letters[-1]['hi'] - 6 and cx(p) < letters[-1]['hi'] + 4:
        letters[-1]['s'].append(p); letters[-1]['hi'] = max(letters[-1]['hi'], hi)
    else:
        letters.append({'s': [p], 'hi': hi})
def vertical(p):
    (x0, y0), (x1, y1) = p[0], p[-1]
    return abs(y1 - y0) > abs(x1 - x0)
ordered = []
for l in letters:
    vs = sorted([p for p in l['s'] if vertical(p)], key=lambda p: min(x for x, _ in p))
    hs = sorted([p for p in l['s'] if not vertical(p)], key=top)
    ordered += vs + hs
print('letters', len(letters), [len(l['s']) for l in letters])
flour.sort(key=lambda p: min(x for x, _ in p))
ordered += flour
# --- Catmull-Rom → cubic Bezier -----------------------------------------------------------
def cr_path(p):
    if len(p) == 2:
        return 'M%.1f %.1fL%.1f %.1f' % (p[0][0], p[0][1], p[1][0], p[1][1])
    d = ['M%.1f %.1f' % p[0]]
    P = [p[0]] + p + [p[-1]]
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d.append('C%.1f %.1f %.1f %.1f %.1f %.1f' % (c1 + c2 + p2))
    return ''.join(d)

allx = [x for p in ordered for x, _ in p]; ally = [y for p in ordered for _, y in p]
pad = 6
minx, miny = min(allx) - pad, min(ally) - pad
W, H = max(allx) + pad - minx, max(ally) + pad - miny
paths = []
for p in ordered:
    q = [(x - minx, y - miny) for x, y in p]
    paths.append({'d': cr_path(q), 'len': round(sum(math.dist(q[i], q[i + 1]) for i in range(len(q) - 1)), 1)})
total = sum(x['len'] for x in paths)
svg = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %.0f %.0f" width="%.0f" height="%.0f" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" data-total="%.1f">' % (W, H, W, H, total),
       '<title>Shaka Lei Kaumaka — signature</title>',
       '<!-- SPDX-License-Identifier: CC-BY-SA-4.0 · drawn by Shaka Lei Kaumaka (16 Nov 2026, in Markup over the Open Source Orchestra home page); vectorized into pen strokes by the AI ʻohana · strokes are in drawing order; data-len = stroke length in viewBox units -->']
for x in paths:
    svg.append('<path pathLength="1" data-len="%s" d="%s"/>' % (x['len'], x['d']))
svg.append('</svg>')
open(OUT, 'w').write('\n'.join(svg) + '\n')
print('wrote', OUT, 'viewBox %.0fx%.0f' % (W, H), 'strokes', len(paths), 'total len', round(total))
pass  # (stroke json omitted)

# debug: draw strokes in order with colors
dbg = Image.new('RGB', (int(W * 3), int(H * 3)), (24, 16, 40))
dr = ImageDraw.Draw(dbg)
cols = [(255, 200, 80), (120, 220, 255), (255, 120, 180), (140, 255, 140), (200, 160, 255), (255, 255, 255)]
for k, p in enumerate(ordered):
    q = [((x - minx) * 3, (y - miny) * 3) for x, y in p]
    dr.line(q, fill=cols[k % len(cols)], width=5)
    dr.text((q[0][0] + 4, q[0][1] - 12), str(k), fill=(255, 255, 255))
dbg.save(OUT + '.debug.png')
