"""Structural sanity check for src/maps.js — row widths, asset names, overlaps.
Run after editing the maps: python tools/check_maps.py"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
src = open(os.path.join(ROOT, "src", "maps.js"), encoding="utf-8").read()
assets = {f[:-4] for f in os.listdir(os.path.join(ROOT, "assets")) if f.endswith(".png")}

errs, warns = [], []

# ---- split into map blocks by "  name: {" at two-space indent
blocks = {}
for m in re.finditer(r"\n  (\w+): \{", src):
    name = m.group(1)
    start = m.end()
    depth = 1
    i = start
    while depth:
        if src[i] == "{": depth += 1
        elif src[i] == "}": depth -= 1
        i += 1
    blocks[name] = src[start:i]

def grid(block, key):
    m = re.search(key + r":\s*\[(.*?)\]", block, re.S)
    if not m: return []
    return re.findall(r'"([^"]*)"', m.group(1))

def objs(block, key):
    """list of dicts for `key: [ {...}, ... ]`"""
    m = re.search(r"\n    " + key + r":\s*\[(.*?)\n    \],", block, re.S)
    if not m: return []
    out = []
    for o in re.finditer(r"\{([^{}]*)\}", m.group(1)):
        d = {}
        for kv in re.finditer(r'(\w+):\s*("([^"]*)"|-?[\d.]+|true|false)', o.group(1)):
            v = kv.group(3) if kv.group(3) is not None else kv.group(2)
            d[kv.group(1)] = v
        out.append(d)
    return out

PROP_SPRITE = {"figtree": "figtree", "quad": "quad", "garden": "garden"}

for name, b in blocks.items():
    g = grid(b, "ground")
    o = grid(b, "objects")
    if not g:
        continue
    w = len(g[0])
    for i, r in enumerate(g):
        if len(r) > w:
            errs.append(f"{name}: ground row {i} is {len(r)} wide, > {w} (will be truncated)")
    for i, r in enumerate(o):
        if len(r) > w:
            errs.append(f"{name}: objects row {i} is {len(r)} wide, > {w}")
    if len(o) > len(g):
        errs.append(f"{name}: {len(o)} object rows > {len(g)} ground rows")

    interior = "interior: true" in b
    legal = set(",;:#%VCD" if interior else ".*t-srRkw")
    for i, r in enumerate(g):
        bad = set(r) - legal
        if bad:
            errs.append(f"{name}: ground row {i} has unknown chars {sorted(bad)}")

    rows = len(g)
    def inb(x, y, what):
        if not (0 <= x < w and 0 <= y < rows):
            errs.append(f"{name}: {what} at ({x},{y}) is outside {w}x{rows}")

    for p in objs(b, "props"):
        x, y = float(p.get("x", -1)), float(p.get("y", -1))
        inb(int(x), int(y), f"prop {p.get('type')}")
        t = p.get("type")
        sprite = PROP_SPRITE.get(t, t)
        if sprite not in assets and t not in ("torii", "sailboat"):
            errs.append(f"{name}: prop type '{t}' has no assets/{sprite}.png")
    for p in objs(b, "points") + objs(b, "figs") + objs(b, "pumpkins"):
        inb(int(float(p.get("x", -1))), int(float(p.get("y", -1))), f"point/pickup {p.get('id')}")
    for n in objs(b, "npcs"):
        inb(int(float(n.get("x", -1))), int(float(n.get("y", -1))), f"npc {n.get('id')}")
        if n.get("sprite") not in assets:
            errs.append(f"{name}: npc {n.get('id')} sprite '{n.get('sprite')}' missing")
    for e in objs(b, "exits"):
        inb(int(float(e.get("x", -1))), int(float(e.get("y", -1))), "exit")
        if e.get("to") not in blocks:
            errs.append(f"{name}: exit -> unknown map '{e.get('to')}'")
        elif f'{e.get("spawn")}: [' not in blocks[e["to"]]:
            errs.append(f"{name}: exit -> {e.get('to')} has no spawn '{e.get('spawn')}'")

    # walkable spawn check
    for sm in re.finditer(r"(\w+): \[(\d+), (\d+)\]", b.split("spawns:")[1].split("}")[0] if "spawns:" in b else ""):
        sx, sy = int(sm.group(2)), int(sm.group(3))
        if 0 <= sy < rows and 0 <= sx < w:
            ch = g[sy][sx] if sx < len(g[sy]) else "."
            if ch in "w#%VCD":
                errs.append(f"{name}: spawn '{sm.group(1)}' at ({sx},{sy}) is inside solid '{ch}'")
        else:
            errs.append(f"{name}: spawn '{sm.group(1)}' at ({sx},{sy}) out of bounds")

# buildings reference known sprites + meta
meta = dict(re.findall(r"(b_\w+): \{ wt: (\d+)", src))
for name, b in blocks.items():
    for bd in objs(b, "buildings"):
        s = bd.get("sprite")
        if s and s not in assets:
            errs.append(f"{name}: building sprite {s} missing from assets")
        if s and s not in meta:
            errs.append(f"{name}: building sprite {s} has no BUILDING_META")

print("maps:", ", ".join(blocks))
for e in errs: print("ERROR:", e)
for x in warns: print("warn :", x)
print(("FAILED (%d)" % len(errs)) if errs else "OK")
sys.exit(1 if errs else 0)
