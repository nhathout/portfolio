#!/usr/bin/env python3
"""
Sprite / tile generator for the secret-level game.

All art is authored as ASCII pixel grids ('.' = transparent) so everything is
editable in a text editor. Run this script to regenerate every PNG in
../assets plus tiles.json (frame index map) and preview.png (zoomed contact
sheet for eyeballing the art).

    python3 make_sprites.py

Customize colors in the PALETTES section (her hair, Noah's hoodie, Mookie's
fur, ...) and re-run.
"""

import json
import os
import struct
import zlib

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.normpath(os.path.join(HERE, "..", "assets"))

# ---------------------------------------------------------------------------
# minimal PNG writer + canvas
# ---------------------------------------------------------------------------

def hex_rgba(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


TRANSPARENT = (0, 0, 0, 0)


class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.px = [[TRANSPARENT] * w for _ in range(h)]

    def set(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[y][x] = c

    def get(self, x, y):
        if 0 <= x < self.w and 0 <= y < self.h:
            return self.px[y][x]
        return TRANSPARENT

    def rect(self, x, y, w, h, c):
        for j in range(y, y + h):
            for i in range(x, x + w):
                self.set(i, j, c)

    def blit_ascii(self, x, y, rows, pal):
        for j, row in enumerate(rows):
            for i, ch in enumerate(row):
                if ch == ".":
                    continue
                if ch not in pal:
                    raise KeyError(f"no palette entry for {ch!r} (row {j}: {row})")
                self.set(x + i, y + j, pal[ch])

    def blit(self, other, x, y):
        for j in range(other.h):
            for i in range(other.w):
                c = other.px[j][i]
                if c[3] > 0:
                    self.set(x + i, y + j, c)

    def outline(self, color, x0=0, y0=0, x1=None, y1=None):
        """Add a 1px outline around every opaque pixel inside the region."""
        x1 = self.w if x1 is None else x1
        y1 = self.h if y1 is None else y1
        add = []
        for j in range(y0, y1):
            for i in range(x0, x1):
                if self.px[j][i][3] > 0:
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ni, nj = i + dx, j + dy
                    if x0 <= ni < x1 and y0 <= nj < y1 and self.px[nj][ni][3] > 0 \
                            and self.px[nj][ni] != color:
                        add.append((i, j))
                        break
        for i, j in add:
            self.px[j][i] = color

    def hflipped(self):
        c = Canvas(self.w, self.h)
        for j in range(self.h):
            for i in range(self.w):
                c.px[j][self.w - 1 - i] = self.px[j][i]
        return c

    def scaled(self, n):
        c = Canvas(self.w * n, self.h * n)
        for j in range(self.h):
            for i in range(self.w):
                col = self.px[j][i]
                for jj in range(n):
                    for ii in range(n):
                        c.px[j * n + jj][i * n + ii] = col
        return c

    def save(self, path):
        raw = b""
        for row in self.px:
            raw += b"\x00" + b"".join(struct.pack("4B", *p) for p in row)
        def chunk(tag, data):
            c = struct.pack(">I", len(data)) + tag + data
            return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        png = b"\x89PNG\r\n\x1a\n"
        png += chunk(b"IHDR", struct.pack(">IIBBBBB", self.w, self.h, 8, 6, 0, 0, 0))
        png += chunk(b"IDAT", zlib.compress(raw, 9))
        png += chunk(b"IEND", b"")
        with open(path, "wb") as f:
            f.write(png)
        print(f"wrote {os.path.relpath(path, HERE)} ({self.w}x{self.h})")


def from_ascii(rows, pal):
    c = Canvas(max(len(r) for r in rows), len(rows))
    c.blit_ascii(0, 0, rows, pal)
    return c


# ---------------------------------------------------------------------------
# PALETTES — tweak here
# ---------------------------------------------------------------------------

OUTLINE = hex_rgba("2b2028")          # universal dark outline

HER = {                                # the player <3
    "h": hex_rgba("e5b954"),           # hair main (blonde)
    "H": hex_rgba("f5d98c"),           # hair highlight
    "s": hex_rgba("fadcbe"),           # skin (light)
    "S": hex_rgba("e6bd98"),           # skin shade
    "e": hex_rgba("35241d"),           # eyes
    "t": hex_rgba("f278a2"),           # top (pink — her favorite)
    "T": hex_rgba("d1517f"),           # top shade
    "d": hex_rgba("5271a3"),           # denim shorts
    "D": hex_rgba("3e5780"),           # denim shade
    "w": hex_rgba("f6ecf0"),           # shoes (pinkish white)
}

NOAH = {
    "h": hex_rgba("2e2226"),           # hair (near-black afro)
    "H": hex_rgba("4a383e"),           # hair highlight
    "s": hex_rgba("d4a071"),           # skin
    "S": hex_rgba("b58252"),           # skin shade
    "e": hex_rgba("241a16"),           # eyes
    "t": hex_rgba("2f7f6f"),           # hoodie (teal)
    "T": hex_rgba("1f5d51"),           # hoodie shade
    "W": hex_rgba("e8e4d8"),           # hoodie drawstrings
    "d": hex_rgba("39445c"),           # jeans
    "D": hex_rgba("2a3346"),           # jeans shade
    "w": hex_rgba("d8d4c8"),           # sneakers
}

MOOKIE = {
    "g": hex_rgba("a97f4f"),           # fur main (warm brown)
    "G": hex_rgba("463930"),           # stripes (near-black)
    "w": hex_rgba("f2ead8"),           # chest + paws
    "p": hex_rgba("e8a0a8"),           # ears / nose pink
    "e": hex_rgba("3d6b4f"),           # eyes (green)
}

# generic townsfolk (background NPCs) — reuse the character templates, recolor
NPC_WOMAN = {
    "h": hex_rgba("7a4a2e"), "H": hex_rgba("9a6440"), "s": hex_rgba("e8c2a0"),
    "S": hex_rgba("cfa47f"), "e": hex_rgba("35241d"), "t": hex_rgba("8a6bb0"),
    "T": hex_rgba("6c4f92"), "d": hex_rgba("46608c"), "D": hex_rgba("35496b"),
    "w": hex_rgba("efe9db"),
}
NPC_MAN = {
    "h": hex_rgba("3a2a1e"), "H": hex_rgba("55402e"), "s": hex_rgba("d8a878"),
    "S": hex_rgba("b98a5c"), "e": hex_rgba("241a16"), "t": hex_rgba("c26a3c"),
    "T": hex_rgba("9c4f2a"), "W": hex_rgba("efe4d2"), "d": hex_rgba("4a4f57"),
    "D": hex_rgba("363a42"), "w": hex_rgba("d8d4c8"),
}
NPC_OLD = {
    "h": hex_rgba("cfcfd6"), "H": hex_rgba("eeeef2"), "s": hex_rgba("e2bb95"),
    "S": hex_rgba("c69a70"), "e": hex_rgba("2a2620"), "t": hex_rgba("4f8f8a"),
    "T": hex_rgba("3a6c68"), "W": hex_rgba("e8e4d8"), "d": hex_rgba("6a5c48"),
    "D": hex_rgba("4e4436"), "w": hex_rgba("cfc7b6"),
}

# world colors
C_GRASS = hex_rgba("7cbf58")
C_GRASS_D = hex_rgba("689e49")
C_GRASS_L = hex_rgba("93d06c")
C_PATH = hex_rgba("e3cf96")
C_PATH_D = hex_rgba("c9b47c")
C_SAND = hex_rgba("efdcae")
C_SAND_D = hex_rgba("d9c491")
C_WATER = hex_rgba("4f97d8")
C_WATER_L = hex_rgba("7fbbea")
C_WATER_D = hex_rgba("3f7fc0")
C_ROAD = hex_rgba("70747c")
C_ROAD_D = hex_rgba("5e6269")
C_ROAD_Y = hex_rgba("e8c74a")
C_WALK = hex_rgba("c9c5bd")
C_WALK_D = hex_rgba("aFAba3".lower())
C_WOOD = hex_rgba("b08a56")
C_WOOD_D = hex_rgba("8a683c")
C_LEAF = hex_rgba("4e9e4a")
C_LEAF_D = hex_rgba("3a7d3a")
C_LEAF_L = hex_rgba("6cbb5e")


# ---------------------------------------------------------------------------
# CHARACTERS  (16x24 frames, sheet 4 cols x 4 rows)
# rows: 0 = down, 1 = up, 2 = side(right; left is flipX at runtime), 3 = extra
# cols: [stand, stepA, stand, stepB]
# ---------------------------------------------------------------------------

FW, FH = 16, 28         # frame size (4 extra rows of headroom for the hat)
TORSO_H = 18            # torso art rows 0..17, legs rows 18..23
HEAD_PAD = 4            # body drawn this far down; the hat lives in the pad

HER_DOWN = [
    "................",
    "................",
    ".....hhhhhh.....",
    "....hhhhhhhh....",
    "...hhhhhhhhhh...",
    "...hHhhhhhhHh...",
    "...hhhhhhhhhh...",
    "...hhssssssshh..",
    "...hsssssssssh..",
    "...hssesssessh..",
    "...hssesssessh..",
    "...hsssssssssh..",
    "...hhSsssssShh..",
    "...hhtttttthh...",
    "....tttttttt....",
    "...stttttttts...",
    "...sTttttttTs...",
    "....TTTTTTTT....",
]

HER_UP = [
    "................",
    "................",
    ".....hhhhhh.....",
    "....hhhhhhhh....",
    "...hhhhhhhhhh...",
    "...hhhHhhHhhh...",
    "...hhHhhhhHhh...",
    "...hhHhhhhHhh...",
    "...hhhHhhHhhh...",
    "...hhhHhhHhhh...",
    "...hhhhHhhhhh...",
    "...hhhHhhHhhh...",
    "...hhhHhhHhhh...",
    "...hhhhHhhhh....",
    "....hhhHhhhh....",
    "...sthhhhhhts...",
    "...sThhhhhhTs...",
    "....ThhhhhhT....",
]

HER_SIDE = [   # facing right
    "................",
    "................",
    ".....hhhhhh.....",
    "....hhhhhhhh....",
    "....hhhhhhhhh...",
    "....hHhhhhhhh...",
    "....hhhhhssss...",
    "....hhhhsssss...",
    "....hhhhssess...",
    "....hhhhssess...",
    "....hhhhsssss...",
    "....hhhhSsss....",
    "....hhhhssss....",
    "....hhtttttt....",
    "....httttttt....",
    "....htttttss....",
    "....hTttttss....",
    ".....TTTTTT.....",
]

# legs: front view (shared by down + up)
LEGS_FRONT = {
    "stand": [
        "....dddddddd....",
        "....dDddddDd....",
        ".....ss..ss.....",
        ".....ss..ss.....",
        ".....ww..ww.....",
        "................",
    ],
    "a": [
        "....dddddddd....",
        "....dDddddDd....",
        ".....ss..ss.....",
        ".....ww..ss.....",
        "..........ww....",
        "................",
    ],
}

LEGS_SIDE = {
    "stand": [
        ".....dddddd.....",
        ".....dDddDd.....",
        "......ssss......",
        "......ssss......",
        "......wwww......",
        "................",
    ],
    "a": [
        ".....dddddd.....",
        ".....dDddDd.....",
        "......ssss......",
        ".....ss..ss.....",
        "....ww....ww....",
        "................",
    ],
}

# overlay arm poses (drawn on top of the base torso)
CHEER_ARMS = [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    ".ss..........ss.",
    ".s............s.",
    ".s............s.",
    "..s..........s..",
    "..s..........s..",
    "..s..........s..",
]

WAVE_ARM = [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    ".............ss.",
    "..............s.",
    "..............s.",
    ".............s..",
    ".............s..",
    ".............s..",
]

NOAH_DOWN = [
    "................",
    "....hhhhhhhh....",
    "..hhhhhhhhhhhh..",
    "..hhhhhhhhhhhh..",
    "..hhHhhhhhHhhh..",
    "..hhhhhhhhhhhh..",
    "...hhhhhhhhhh...",
    "....ssssssss....",
    "....sesssses....",
    "....sesssses....",
    "....ssssssss....",
    "....ssssssss....",
    "....SssssssS....",
    "...ttttttttt....",
    "...ttWttttWt....",
    "..sttttttttts...",
    "..sTttttttttTs..",
    "....TTTTTTTT....",
]

NOAH_UP = [
    "................",
    "....hhhhhhhh....",
    "..hhhhhhhhhhhh..",
    "..hhhhhhhhhhhh..",
    "..hhhHhhhHhhhh..",
    "..hhhhhhhhhhhh..",
    "..hhhhhhhhhhhh..",
    "..hhhhhhhhhhhh..",
    "..hhhhhhhhhhhh..",
    "...hhhhhhhhhh...",
    "...hhhhhhhhhh...",
    "....hhhhhhhh....",
    "....tttttttt....",
    "...tttttttttt...",
    "...tttttttttt...",
    "..stttttttttts..",
    "..sTttttttttTs..",
    "....TTTTTTTT....",
]

NOAH_SIDE = [
    "................",
    "....hhhhhh......",
    "...hhhhhhhh.....",
    "..hhhhhhhhhh....",
    "..hhHhhhhhhh....",
    "..hhhhhhhhhh....",
    "..hhhhhhhssss...",
    "..hhhhhsssssss..",
    "..hhhhhssssess..",
    "..hhhhhssssess..",
    "..hhhhhsssssss..",
    "...hhhssssssss..",
    "....hsssssss....",
    ".....tttttt.....",
    "....tttttttt....",
    "....tttttttss...",
    "....tTtttttss...",
    ".....TTTTTT.....",
]

NOAH_LEGS_FRONT = {
    "stand": [
        "....dddddddd....",
        "....dDddddDd....",
        ".....dd..dd.....",
        ".....dd..dd.....",
        ".....ww..ww.....",
        "................",
    ],
    "a": [
        "....dddddddd....",
        "....dDddddDd....",
        ".....dd..dd.....",
        ".....ww..dd.....",
        "..........ww....",
        "................",
    ],
}

NOAH_LEGS_SIDE = {
    "stand": [
        ".....dddddd.....",
        ".....dDddDd.....",
        "......dddd......",
        "......dddd......",
        "......wwww......",
        "................",
    ],
    "a": [
        ".....dddddd.....",
        ".....dDddDd.....",
        "......dddd......",
        ".....dd..dd.....",
        "....ww....ww....",
        "................",
    ],
}



def mirror_rows(rows):
    return [r[::-1] for r in rows]


# tiny party hat, drawn over the top of the head (birthday girl only ♥)
HAT_PAL = {
    "Y": hex_rgba("f0c040"),   # cone
    "R": hex_rgba("e8556a"),   # stripe
    "P": hex_rgba("f8a8c0"),   # pompom
}
# a proper kids' party cone: tall, striped, pompom on top
HAT_ROWS = [
    ".......PP.......",
    ".......YY.......",
    "......YYYY......",
    "......RRRR......",
    ".....YYYYYY.....",
    ".....RRRRRR.....",
]
HAT_DX = {"down": 0, "up": 0, "side": 1}


def compose_char(torsos, legsets, pal, extras=None, hat=False):
    """torsos: {down,up,side}; legsets: {front:{stand,a}, side:{stand,a}}"""
    hatpal = dict(pal)
    hatpal.update(HAT_PAL)
    sheet = Canvas(FW * 4, FH * 4)
    rows_spec = [
        ("down", "front"),
        ("up", "front"),
        ("side", "side"),
    ]
    for ri, (dirname, legkind) in enumerate(rows_spec):
        legs = legsets[legkind]
        frames = [legs["stand"], legs["a"], legs["stand"], mirror_rows(legs["a"])]
        for ci in range(4):
            f = Canvas(FW, FH)
            f.blit_ascii(0, HEAD_PAD, torsos[dirname], pal)
            f.blit_ascii(0, HEAD_PAD + TORSO_H, frames[ci], pal)
            if hat:
                # base row of the cone rests ON the hair's top row
                f.blit_ascii(HAT_DX[dirname], 1, HAT_ROWS, hatpal)
            f.outline(OUTLINE)
            sheet.blit(f, ci * FW, ri * FH)
    if extras:
        for ci, ex in enumerate(extras[:4]):
            f = Canvas(FW, FH)
            f.blit_ascii(0, HEAD_PAD, ex["torso"], pal)
            f.blit_ascii(0, HEAD_PAD + TORSO_H, ex["legs"], pal)
            if ex.get("overlay"):
                f.blit_ascii(0, HEAD_PAD, ex["overlay"], pal)
            if hat:
                f.blit_ascii(0, 1, HAT_ROWS, hatpal)
            f.outline(OUTLINE)
            sheet.blit(f, ci * FW, 3 * FH)
    return sheet


# ---------------------------------------------------------------------------
# MOOKIE (16x16 frames, 4x4)
# rows: down, up, side, extra (sit, sit-tail-up, loaf, loaf-blink)
# ---------------------------------------------------------------------------

MOOK = {
    "down": [
        "................",
        "....g....g......",
        "....gp..pg......",
        "....gggggg......",
        "...gggggggg.....",
        "...gegggge g...".replace(" ", "g"),
        "...ggeweegg.....",
        "....gwwwwg......",
        "...gggggggg..G..",
        "...gGggggGg..G..",
        "...gggggggg.GG..",
        "...ggggggggGG...",
        "....gggggg......",
        "....ww..ww......",
        "................",
        "................",
    ],
    "down_a": [
        "................",
        "....g....g......",
        "....gp..pg......",
        "....gggggg......",
        "...gggggggg..G..",
        "...gegggge g.G.".replace(" ", "g"),
        "...ggeweegg.G...",
        "....gwwwwg..G...",
        "...ggggggggGG...",
        "...gGggggGg.....",
        "...gggggggg.....",
        "...gggggggg.....",
        "....gggggg......",
        "....ww.ww.......",
        "................",
        "................",
    ],
    "up": [
        "................",
        "....g....g......",
        "....gg..gg......",
        "....gggggg......",
        "...gggggggg.....",
        "...gggGGggg.....",
        "...gggggggg..G..",
        "...gGggggGg..G..",
        "...gggggggg.GG..",
        "...gGggggGgGG...",
        "...gggggggg.....",
        "...gggggggg.....",
        "....gggggg......",
        "....ww..ww......",
        "................",
        "................",
    ],
    "up_a": [
        "................",
        "....g....g......",
        "....gg..gg......",
        "....gggggg......",
        "...gggggggg..G..",
        "...gggGGggg..G..",
        "...gggggggg.GG..",
        "...gGggggGgGG...",
        "...gggggggg.....",
        "...gGggggGg.....",
        "...gggggggg.....",
        "...gggggggg.....",
        "....gggggg......",
        "....ww.ww.......",
        "................",
        "................",
    ],
    "side": [   # facing right
        "................",
        "................",
        "..........g..g..",
        "..........gppg..",
        "..G.......gggg..",
        "..G......ggggg..",
        "..GG....gggegg..",
        "...GGggggggggw..",
        "....ggGggGggww..",
        "....ggggggggg...",
        "....ggggggggg...",
        "....gg.....gg...",
        "....ww.....ww...",
        "................",
        "................",
        "................",
    ],
    "side_a": [
        "................",
        "................",
        "..........g..g..",
        "..........gppg..",
        "...G......gggg..",
        "...G.....ggggg..",
        "...GG...gggegg..",
        "....GGggggggggw.",
        "....ggGggGggww..",
        "....gggggggggg..",
        "....ggggggggg...",
        "...gg....gg.....",
        "...ww.....ww....",
        "................",
        "................",
        "................",
    ],
    "sit": [
        "................",
        "................",
        "....g....g......",
        "....gp..pg......",
        "....gggggg......",
        "...gggggggg.....",
        "...gegggge g...".replace(" ", "g"),
        "...ggeweegg.....",
        "....gwwwwg......",
        "....gggggg......",
        "...gGggggGg.....",
        "...ggggggggG....",
        "...gwwggwwgG....",
        "....ww..ww.GG...",
        "................",
        "................",
    ],
    "sit_b": [
        "................",
        "................",
        "....g....g......",
        "....gp..pg......",
        "....gggggg......",
        "...gggggggg.G...",
        "...gegggge gG..".replace(" ", "g"),
        "...ggeweeggG....",
        "....gwwwwg.G....",
        "....ggggggG.....",
        "...gGggggGg.....",
        "...gggggggg.....",
        "...gwwggwwg.....",
        "....ww..ww......",
        "................",
        "................",
    ],
}


def compose_mookie(pal):
    sheet = Canvas(16 * 4, 16 * 4)
    rows = [
        [MOOK["down"], MOOK["down_a"], MOOK["down"], mirror_rows(MOOK["down_a"])],
        [MOOK["up"], MOOK["up_a"], MOOK["up"], mirror_rows(MOOK["up_a"])],
        [MOOK["side"], MOOK["side_a"], MOOK["side"], MOOK["side_a"]],
        [MOOK["sit"], MOOK["sit_b"], MOOK["sit"], MOOK["sit_b"]],
    ]
    for ri, frames in enumerate(rows):
        for ci, fr in enumerate(frames):
            f = Canvas(16, 16)
            f.blit_ascii(0, 0, fr, pal)
            f.outline(OUTLINE)
            sheet.blit(f, ci * 16, ri * 16)
    return sheet


# ---------------------------------------------------------------------------
# TILES (16x16, atlas 8 cols) — order matters, water/flower frames contiguous
# ---------------------------------------------------------------------------

def noise_tile(base, specks, seed, density=9):
    c = Canvas(16, 16)
    c.rect(0, 0, 16, 16, base)
    n = seed
    for _ in range(density):
        n = (n * 1103515245 + 12345) & 0x7FFFFFFF
        x = n % 16
        n = (n * 1103515245 + 12345) & 0x7FFFFFFF
        y = n % 16
        n = (n * 1103515245 + 12345) & 0x7FFFFFFF
        c.set(x, y, specks[n % len(specks)])
        c.set(x + 1, y, specks[n % len(specks)])
    return c


def tile_grass(seed=3):
    return noise_tile(C_GRASS, [C_GRASS_D, C_GRASS_L], seed)


def tile_flower(phase, variant=0):
    c = tile_grass(11 + variant * 7)
    pals = [
        {"a": hex_rgba("e26a6a"), "b": hex_rgba("f0d264"), "c": hex_rgba("f4f1e4"),
         "d": hex_rgba("e89b4a"), "g": C_LEAF_D},                       # red/yellow + white
        {"a": hex_rgba("f278a2"), "b": hex_rgba("f8c8d8"), "c": hex_rgba("c78ae0"),
         "d": hex_rgba("f4f1e4"), "g": C_LEAF_D},                       # pinks + lilac 🌸
        {"a": hex_rgba("7a9ce8"), "b": hex_rgba("f4f1e4"), "c": hex_rgba("f0d264"),
         "d": hex_rgba("aac8f4"), "g": C_LEAF_D},                       # blue + white
    ]
    pal = pals[variant % len(pals)]
    spots = [(2, 3, "aba"), (10, 9, "cdc")] if variant != 1 else \
            [(3, 2, "aba"), (9, 8, "cdc"), (5, 11, "bab")]
    for x, y, colors in spots:
        if phase == 0:
            c.blit_ascii(x, y, [colors, ".g."], pal)
        else:
            c.blit_ascii(x, y, [".g.", colors], pal)
    return c


def tile_tallgrass():
    c = tile_grass(7)
    pal = {"d": C_GRASS_D, "l": C_GRASS_L}
    art = [
        ".d..l..d..l..d..",
        ".dl.dl.dl.dl.dl.",
        "ddl.ddl.dl.ddl..",
        ".ddlddlddldldld.",
        "ddddldddlddlddl.",
        "dddddddddddddddd",
    ]
    c.blit_ascii(0, 10, art, pal)
    return c


def tile_path(seed=5):
    return noise_tile(C_PATH, [C_PATH_D], seed, 7)


def tile_sand(seed=9):
    return noise_tile(C_SAND, [C_SAND_D], seed, 7)


# ---- auto-edged path/sand tiles (16 variants by NESW neighbor mask) --------
# mask bits: 1 = N connected, 2 = E, 4 = S, 8 = W. Open sides get a wavy,
# rustic grass edge with a darker rim — old-Pokémon style rounded paths.
EDGE_WAVE = [2, 2, 1, 1, 2, 3, 3, 2, 2, 1, 1, 2, 3, 3, 2, 2]


def _grass_px(x, y):
    return C_GRASS_D if (x * 7 + y * 13) % 5 == 0 else C_GRASS


def apply_grass_edges(c, mask, rim):
    for x in range(16):
        if not mask & 1:  # north open
            d = EDGE_WAVE[x]
            for y in range(d):
                c.set(x, y, _grass_px(x, y))
            c.set(x, d, rim)
        if not mask & 4:  # south open
            d = EDGE_WAVE[15 - x]
            for y in range(d):
                c.set(x, 15 - y, _grass_px(x, 15 - y))
            c.set(x, 15 - d, rim)
    for y in range(16):
        if not mask & 2:  # east open
            d = EDGE_WAVE[(y + 5) % 16]
            for i in range(d):
                c.set(15 - i, y, _grass_px(15 - i, y))
            c.set(15 - d, y, rim)
        if not mask & 8:  # west open
            d = EDGE_WAVE[(y + 11) % 16]
            for i in range(d):
                c.set(i, y, _grass_px(i, y))
            c.set(d, y, rim)


def tile_path_m(mask):
    c = noise_tile(C_PATH, [C_PATH_D], 5 + mask * 3, 7)
    apply_grass_edges(c, mask, C_PATH_D)
    return c


def tile_sand_m(mask):
    c = noise_tile(C_SAND, [C_SAND_D], 9 + mask * 3, 7)
    apply_grass_edges(c, mask, C_SAND_D)
    return c


def tile_road():
    return noise_tile(C_ROAD, [C_ROAD_D], 13, 6)


def tile_road_dash():
    # horizontal dashes along the bottom edge (road is 2 tiles tall; this tile
    # is the upper row, so the dashes land on the road's center line)
    c = tile_road()
    c.rect(1, 14, 5, 2, C_ROAD_Y)
    c.rect(9, 14, 5, 2, C_ROAD_Y)
    return c


def tile_sidewalk():
    c = Canvas(16, 16)
    c.rect(0, 0, 16, 16, C_WALK)
    for y in (0, 8):
        c.rect(0, y, 16, 1, C_WALK_D)
    for x in (0, 8):
        c.rect(x, 0, 1, 16, C_WALK_D)
    return c


def tile_water(phase):
    c = Canvas(16, 16)
    c.rect(0, 0, 16, 16, C_WATER)
    waves = [(2, 3), (10, 7), (5, 12)]
    for i, (x, y) in enumerate(waves):
        xx = (x + phase * 2) % 14
        c.rect(xx, y, 3, 1, C_WATER_L)
        c.set(xx + 1, y + 1, C_WATER_D)
    return c


def tile_fence():
    c = Canvas(16, 16)
    pal = {"w": C_WOOD, "d": C_WOOD_D, "k": OUTLINE}
    art = [
        "................",
        "................",
        "kk....kk....kk..",
        "kwk...kwk...kwk.",
        "kwkkkkkwkkkkkwkk",
        "kwwwwwwwwwwwwwwk",
        "kdddddddddddddwk",
        "kwk...kwk...kwk.",
        "kwkkkkkwkkkkkwkk",
        "kwwwwwwwwwwwwwwk",
        "kdddddddddddddwk",
        "kdk...kdk...kdk.",
        "kkk...kkk...kkk.",
        "................",
        "................",
        "................",
    ]
    c.blit_ascii(0, 0, art, pal)
    return c


def tile_bush():
    c = Canvas(16, 16)
    pal = {"g": C_LEAF, "d": C_LEAF_D, "l": C_LEAF_L}
    art = [
        "................",
        "....gggggg......",
        "..gggglgggggg...",
        ".ggglggggglggg..",
        ".gggggddgggggg..",
        "gglggggggggglgg.",
        "ggggggdggdggggg.",
        ".ggdggggggggdg..",
        ".ggggglgggggggg.",
        "..ggdggggdggg...",
        "...ggggggggg....",
        "....dgdggd......",
        "................",
        "................",
        "................",
        "................",
    ]
    c.blit_ascii(0, 1, art[:13], pal)
    c.outline(OUTLINE)
    return c


def tile_bush_b():
    """rounder, berry-dotted bush variant"""
    c = Canvas(16, 16)
    pal = {"g": C_LEAF_D, "d": hex_rgba("2e6330"), "l": C_LEAF,
           "b": hex_rgba("d05a70")}
    art = [
        ".....gggggg.....",
        "...gggglgggggg..",
        "..ggglgggggdggg.",
        "..gdgggbggggggg.",
        ".gggggggggglggg.",
        ".ggblggdgggggbg.",
        ".gggggggglggggg.",
        "..ggdgggggggdg..",
        "..gggglgbggggg..",
        "...ggggggggdg...",
        "....dggddggg....",
        "................",
    ]
    c.blit_ascii(0, 2, art, pal)
    c.outline(OUTLINE)
    return c


def tile_rock():
    c = Canvas(16, 16)
    pal = {"r": hex_rgba("a8a4a0"), "d": hex_rgba("828078"), "l": hex_rgba("c8c4bc")}
    art = [
        ".....rrrr.......",
        "...rrrlrrr......",
        "..rrlrrrrrr.....",
        ".rrrrrrrdrrr....",
        ".rrrrrrrrrrr....",
        ".rdrrrrrrdrr....",
        "..rddrrrddr.....",
        "...rrdddrr......",
        "................",
    ]
    c.blit_ascii(0, 4, art, pal)
    c.outline(OUTLINE)
    return c


def tile_sign():
    c = Canvas(16, 16)
    pal = {"w": C_WOOD, "d": C_WOOD_D, "l": hex_rgba("caa46e")}
    art = [
        ".wwwwwwwwwwww...",
        ".wllllllllldw...",
        ".wldldlldlldw...",
        ".wllldllldllw...",
        ".wddddddddddw...",
        ".wwwwwwwwwwww...",
        "......ww........",
        "......ww........",
        "......ww........",
        "......dd........",
    ]
    c.blit_ascii(1, 3, art, pal)
    c.outline(OUTLINE)
    return c


TILE_ORDER = [
    ("grass_a", lambda: tile_grass(3)),
    ("grass_b", lambda: tile_grass(17)),
    ("grass_c", lambda: noise_tile(C_GRASS, [C_GRASS_L], 23, 6)),
    ("flower_0", lambda: tile_flower(0, 0)),
    ("flower_1", lambda: tile_flower(1, 0)),
    ("flower2_0", lambda: tile_flower(0, 1)),
    ("flower2_1", lambda: tile_flower(1, 1)),
    ("flower3_0", lambda: tile_flower(0, 2)),
    ("flower3_1", lambda: tile_flower(1, 2)),
    ("tallgrass", tile_tallgrass),
    ("road", tile_road),
    ("road_dash", tile_road_dash),
    ("sidewalk", tile_sidewalk),
    ("water_0", lambda: tile_water(0)),
    ("water_1", lambda: tile_water(1)),
    ("water_2", lambda: tile_water(2)),
    ("fence", tile_fence),
    ("bush", tile_bush),
    ("bush_b", tile_bush_b),
    ("rock", tile_rock),
    ("sign", tile_sign),
] + [(f"path_{m}", (lambda mm: (lambda: tile_path_m(mm)))(m)) for m in range(16)] \
  + [(f"sand_{m}", (lambda mm: (lambda: tile_sand_m(mm)))(m)) for m in range(16)]


def build_tiles():
    cols = 8
    rows = (len(TILE_ORDER) + cols - 1) // cols
    sheet = Canvas(cols * 16, rows * 16)
    frames = {}
    for i, (name, fn) in enumerate(TILE_ORDER):
        frames[name] = i
        sheet.blit(fn(), (i % cols) * 16, (i // cols) * 16)
    meta = {"tileSize": 16, "cols": cols, "rows": rows, "frames": frames}
    with open(os.path.join(ASSETS, "tiles.json"), "w") as f:
        json.dump(meta, f, indent=1)
    print("wrote assets/tiles.json")
    return sheet


# ---------------------------------------------------------------------------
# PROPS
# ---------------------------------------------------------------------------

def prop_tree():
    c = Canvas(24, 32)
    pal = {"g": C_LEAF, "d": C_LEAF_D, "l": C_LEAF_L,
           "t": C_WOOD_D, "T": hex_rgba("6e5230")}
    art = [
        "........gggggg..........",
        "......gggggggggg........",
        ".....ggglggggggggg......",
        "....gggggggggdgggg......",
        "...ggglgggggggggggg.....",
        "...ggggggdgggggglgg.....",
        "..gggggggggggggggggg....",
        "..gglggggdggglggggdg....",
        "..ggggggggggggggggggg...",
        "..gdggglgggggdgggggg....",
        "...gggggggdggggggdg.....",
        "...ggdggggggggglggg.....",
        "....gggggdggggggg.......",
        ".....ggggggggdgg........",
        "......ggdggggg..........",
        ".........tt.............",
        ".........tt.............",
        ".........Tt.............",
        "........TTtt............",
    ]
    c.blit_ascii(0, 2, art, pal)
    c.outline(OUTLINE)
    return c


def prop_palm():
    c = Canvas(24, 32)
    pal = {"g": C_LEAF, "d": C_LEAF_D, "l": C_LEAF_L,
           "t": hex_rgba("b08a56"), "T": hex_rgba("8a683c"), "c": hex_rgba("7d5b34")}
    art = [
        "....lggg....ggggl.......",
        "..ggggggg..ggggggg......",
        ".gggg..ggggggg..gggg....",
        "gggg....gglgg....ggg....",
        "ggg.....ggggg.....ggg...",
        ".g.....gg.t.gg.....g....",
        ".......g..t..g..........",
        "..........tt............",
        "..........tt............",
        ".........tt.............",
        ".........tt.............",
        ".........tT.............",
        "........ttT.............",
        "........tTT.............",
        "........tT..............",
    ]
    c.blit_ascii(0, 4, art, pal)
    c.outline(OUTLINE)
    return c


def prop_figtree(with_figs):
    c = Canvas(32, 32)
    pal = {"g": hex_rgba("47894b"), "d": hex_rgba("336637"), "l": hex_rgba("62a55c"),
           "t": hex_rgba("7d5b34"), "T": hex_rgba("5e4326"),
           "f": hex_rgba("7a4a8c"), "F": hex_rgba("5c3370")}
    art = [
        "..........gggggggg..............",
        ".......gggggggggggggg...........",
        ".....ggggglggggggglggg..........",
        "....ggggggggggdgggggggg.........",
        "...gggglgggggggggggglggg........",
        "..gggggggggdgggggglggggggg......",
        "..ggglgggggggggggggggggdgg......",
        ".gggggggdgggggglggggdggggg......",
        ".ggggglggggggdggggggggglggg.....",
        ".ggdgggggggggggggdgggggggg......",
        "..gggggggglggdggggggglggg.......",
        "..ggdgggdggggggggdggggggg.......",
        "...ggggggggglgggggggggg.........",
        "....gggdggggggggdgggggg.........",
        ".....ggggggglgggggggg...........",
        ".......ggggggggggg..............",
        "..........ttt.tt................",
        "...........ttttt................",
        "...........ttt..................",
        "..........Tttt..................",
        ".........TTtttT.................",
    ]
    c.blit_ascii(0, 2, art, pal)
    if with_figs:
        figs = [(6, 6), (12, 9), (18, 5), (22, 10), (9, 12), (16, 13), (24, 7)]
        for x, y in figs:
            c.set(x, y + 2, pal["f"])
            c.set(x + 1, y + 2, pal["f"])
            c.set(x, y + 3, pal["F"])
            c.set(x + 1, y + 3, pal["F"])
    c.outline(OUTLINE)
    return c


def prop_lamp():
    c = Canvas(16, 32)
    pal = {"p": hex_rgba("3a3d46"), "P": hex_rgba("23252c"),
           "y": hex_rgba("ffd978"), "Y": hex_rgba("f0b840")}
    art = [
        "....yyyy....",
        "...yYyyYy...",
        "...yyyyyy...",
        "...YyyyyY...",
        "....PPPP....",
        ".....pp.....",
        ".....pp.....",
        ".....pp.....",
        ".....pp.....",
        ".....pp.....",
        ".....pp.....",
        ".....pp.....",
        ".....pP.....",
        ".....pP.....",
        "....pPPp....",
        "...pPPPPp...",
    ]
    c.blit_ascii(2, 8, art, pal)
    c.outline(OUTLINE)
    return c


def prop_bench():
    c = Canvas(24, 16)
    pal = {"w": C_WOOD, "d": C_WOOD_D, "k": hex_rgba("3a3d46")}
    art = [
        "wwwwwwwwwwwwwwwwwwwww",
        "ddddddddddddddddddddd",
        "wwwwwwwwwwwwwwwwwwwww",
        "k..k.............k..k",
        "wwwwwwwwwwwwwwwwwwwww",
        "dwwwwwwwwwwwwwwwwwwwd",
        "k..k.............k..k",
        "k..k.............k..k",
    ]
    c.blit_ascii(1, 5, art, pal)
    c.outline(OUTLINE)
    return c


def prop_quad():
    c = Canvas(28, 20)
    pal = {"r": hex_rgba("d8504a"), "R": hex_rgba("a83832"), "k": hex_rgba("2a2a30"),
           "K": hex_rgba("44444c"), "s": hex_rgba("8c8c94"), "y": hex_rgba("f0d264")}
    art = [
        "........kk..............",
        "........kk..............",
        "......kkskk.............",
        "......ksssk....rrr......",
        ".......krrrrrrrrrrr.....",
        ".....rrrrRRrrrrrrRrr....",
        "....rrrrrrrrrrrrrrrrr...",
        "....yRrrrrRRRRrrrrrRr...",
        "....kkKkkkkkkkkkkKkkk...",
        "...kKKkKk......kKkKKk...",
        "...kKkkkK......kKkkkK...",
        "...kKKkKk......kKkKKk...",
        "....kkkk........kkkk....",
    ]
    c.blit_ascii(1, 4, art, pal)
    c.outline(OUTLINE)
    return c


def prop_torii():
    c = Canvas(64, 48)
    pal = {"r": hex_rgba("cf4436"), "R": hex_rgba("9c2e24"), "k": hex_rgba("2b2028"),
           "g": hex_rgba("d8b04a")}
    # top lintel
    c.rect(2, 6, 60, 5, pal["r"])
    c.rect(2, 9, 60, 2, pal["R"])
    c.rect(0, 4, 64, 3, pal["k"])
    c.rect(0, 4, 64, 2, pal["r"])
    # second beam
    c.rect(8, 16, 48, 4, pal["r"])
    c.rect(8, 18, 48, 2, pal["R"])
    # center plaque
    c.rect(29, 12, 6, 8, pal["g"])
    # pillars
    for x in (12, 46):
        c.rect(x, 11, 6, 35, pal["r"])
        c.rect(x + 4, 11, 2, 35, pal["R"])
        c.rect(x - 1, 44, 8, 2, pal["k"])
    c.outline(OUTLINE)
    return c


def prop_barrier():
    c = Canvas(24, 16)
    pal = {"y": hex_rgba("f0c93c"), "k": hex_rgba("2f2f36"), "s": hex_rgba("8c8c94")}
    art = [
        "yyyyyyyyyyyyyyyyyyyyyy",
        "ykkyyykkyyykkyyykkyyyy",
        "yykkyyykkyyykkyyykkyyy",
        "yyyyyyyyyyyyyyyyyyyyyy",
        "..ss..............ss..",
        "..ss..............ss..",
        ".ssss............ssss.",
    ]
    c.blit_ascii(1, 6, art, pal)
    c.outline(OUTLINE)
    return c


def prop_sailboat():
    c = Canvas(16, 20)
    pal = {"w": hex_rgba("f2efe4"), "W": hex_rgba("d8d4c8"), "h": hex_rgba("8a683c"),
           "H": hex_rgba("6e5230"), "m": hex_rgba("5e4326")}
    art = [
        "......m.........",
        "......mw........",
        "......mww.......",
        "......mwww......",
        "......mwwww.....",
        "......mwwwww....",
        "......mwww......",
        "......m.........",
        "..hhhhhhhhhhh...",
        "...hHHHHHHHh....",
        "....hhhhhhh.....",
    ]
    c.blit_ascii(0, 4, art, pal)
    c.outline(OUTLINE)
    return c


def prop_fig():
    """collectible fig, 2 frames 12x12 (idle, sparkle)"""
    sheet = Canvas(24, 12)
    pal = {"f": hex_rgba("7a4a8c"), "F": hex_rgba("5c3370"), "l": hex_rgba("9a6cb0"),
           "g": C_LEAF_D, "s": hex_rgba("fff7c0")}
    fig = [
        ".....g......",
        "....gg......",
        "....ff......",
        "...ffff.....",
        "..flffff....",
        "..flffff....",
        "..ffffFf....",
        "..fffFFf....",
        "...ffFF.....",
        "............",
    ]
    a = Canvas(12, 12)
    a.blit_ascii(0, 1, fig, pal)
    a.outline(OUTLINE)
    sheet.blit(a, 0, 0)
    b = Canvas(12, 12)
    b.blit_ascii(0, 1, fig, pal)
    b.outline(OUTLINE)
    b.set(1, 1, pal["s"])
    b.set(10, 3, pal["s"])
    b.set(2, 9, pal["s"])
    sheet.blit(b, 12, 0)
    return sheet


def prop_fx():
    """fx sheet 16x16 cells: heart, heart_small, sparkle_a, sparkle_b, bubble_e, bubble_excl"""
    sheet = Canvas(16 * 6, 16)
    pal = {"r": hex_rgba("e8556a"), "R": hex_rgba("c13a52"), "w": hex_rgba("ffffff"),
           "y": hex_rgba("ffe88a"), "k": OUTLINE, "b": hex_rgba("fffdf4")}
    heart = [
        ".rr..rr.",
        "rrrr.rrr".replace(".", "r"),
        "rwrrrrrr",
        "rrrrrrrr",
        ".rrrrrR.",
        "..rrrR..",
        "...rR...",
    ]
    c = Canvas(16, 16)
    c.blit_ascii(4, 4, heart, pal)
    c.outline(OUTLINE)
    sheet.blit(c, 0, 0)
    hs = [
        ".r.r.",
        "rrrrr",
        ".rrR.",
        "..r..",
    ]
    c = Canvas(16, 16)
    c.blit_ascii(6, 6, hs, pal)
    c.outline(OUTLINE)
    sheet.blit(c, 16, 0)
    sp_a = [
        "..y..",
        "..y..",
        "yyyyy",
        "..y..",
        "..y..",
    ]
    c = Canvas(16, 16)
    c.blit_ascii(6, 5, sp_a, pal)
    sheet.blit(c, 32, 0)
    sp_b = [
        "y...y",
        ".....",
        "..y..",
        ".....",
        "y...y",
    ]
    c = Canvas(16, 16)
    c.blit_ascii(6, 5, sp_b, pal)
    sheet.blit(c, 48, 0)

    def bubble(glyph_rows):
        c = Canvas(16, 16)
        c.rect(2, 1, 12, 11, pal["b"])
        c.rect(3, 0, 10, 1, pal["b"])
        c.rect(3, 12, 10, 1, pal["b"])
        # tail
        c.set(7, 13, pal["b"])
        c.set(8, 13, pal["b"])
        c.set(7, 14, pal["b"])
        c.blit_ascii(6, 3, glyph_rows, {"k": hex_rgba("3a3440")})
        c.outline(OUTLINE)
        return c

    glyph_e = [
        "kkkk",
        "k...",
        "kkk.",
        "k...",
        "k...",
        "kkkk",
    ]
    glyph_ex = [
        ".kk.",
        ".kk.",
        ".kk.",
        ".kk.",
        "....",
        ".kk.",
    ]
    sheet.blit(bubble(glyph_e), 64, 0)
    sheet.blit(bubble(glyph_ex), 80, 0)
    return sheet


def prop_pumpkin():
    """collectible pumpkin, 2 frames 12x12 (idle, sparkle) — PUMPKINN!!"""
    sheet = Canvas(24, 12)
    pal = {"o": hex_rgba("e8913c"), "O": hex_rgba("c06a24"), "l": hex_rgba("f5b568"),
           "g": hex_rgba("4e7e3a"), "s": hex_rgba("fff7c0")}
    pk = [
        ".....g......",
        "....gg......",
        "..oooooooo..",
        ".olooOooOoo.",
        ".olooOooOoo.",
        ".oloOoooOoo.",
        ".ooooOooOo..",
        "..oooooooo..",
        "...oooooo...",
        "............",
    ]
    for i, spark in enumerate((False, True)):
        c = Canvas(12, 12)
        c.blit_ascii(0, 1, pk, pal)
        c.outline(OUTLINE)
        if spark:
            c.set(1, 1, pal["s"])
            c.set(10, 4, pal["s"])
            c.set(2, 10, pal["s"])
        sheet.blit(c, i * 12, 0)
    return sheet


def prop_radio():
    """a little boombox with purple (💜) accents"""
    c = Canvas(16, 14)
    pal = {"k": hex_rgba("3a3540"), "K": hex_rgba("524a5c"), "p": hex_rgba("8b5cf6"),
           "P": hex_rgba("6d40d8"), "w": hex_rgba("e8e4d8"), "y": hex_rgba("f0c040")}
    art = [
        "....kk...kk.....",
        ".kkkkkkkkkkkkk..",
        ".kKKKKKKKKKKKk..",
        ".kKpPpKwKpPpKk..",
        ".kPppPKyKPppPk..",
        ".kKpPpKwKpPpKk..",
        ".kKKKKKKKKKKKk..",
        ".kkkkkkkkkkkkk..",
    ]
    c.blit_ascii(0, 4, art, pal)
    c.outline(OUTLINE)
    return c


def prop_horse():
    """a chill brown horse, side view (beach horse ♥) — full muzzle + nostril"""
    c = Canvas(28, 24)
    pal = {"b": hex_rgba("9c6a3c"), "B": hex_rgba("7a4e28"), "m": hex_rgba("4e3620"),
           "w": hex_rgba("efe9db"), "e": hex_rgba("2a2018"), "p": hex_rgba("d8a878"),
           "n": hex_rgba("5e4326")}
    art = [
        "...............mm...........",
        "..............mmmm..........",
        "..............mbbbb.........",
        ".............mbbbbbb........",
        ".............mbebbbbb.......",
        ".............mbbbbppp.......",
        "...mm........mbbbppnp.......",
        "..mbbbbbbbbbbbbbbbppp.......",
        ".mbbbbbbbbbbbbbbbb..........",
        ".mbBbbbbbbbbbbbbb...........",
        ".mbbbbbbbbbbbbbb............",
        "..mbbBbbbbbbbbbb............",
        "...bb.......bb.bb...........",
        "...bb.......bb..bb..........",
        "...BB.......BB..BB..........",
        "...ww.......ww..ww..........",
    ]
    c.blit_ascii(0, 6, art, pal)
    c.outline(OUTLINE)
    return c


def prop_column():
    """little Greek column (Little Everywhere · Greece pocket)"""
    c = Canvas(12, 22)
    pal = {"w": hex_rgba("efe9db"), "W": hex_rgba("cfc7b6"), "d": hex_rgba("aca492")}
    art = [
        "wwwwwwwwww..",
        "wWWWWWWWWw..",
        "..wWwWwW....",
        "..wWwWwW....",
        "..wWwWwW....",
        "..wWwWwW....",
        "..wWwWwW....",
        "..wWwWwW....",
        "..wWwWwW....",
        "..wWwWwW....",
        ".wWWWWWWw...",
        "wwwwwwwwww..",
        "wddddddddw..",
    ]
    c.blit_ascii(0, 8, art, pal)
    c.outline(OUTLINE)
    return c


def prop_pyramid():
    """tiny pyramid with a sand skirt (Little Everywhere · Egypt pocket)"""
    c = Canvas(30, 22)
    top = hex_rgba("e8cf9c")
    lit = hex_rgba("f2debc")
    dark = hex_rgba("caa670")
    sand = C_SAND
    for j in range(14):
        w = 2 + j * 2
        x = 15 - w // 2
        for i in range(w):
            side = i > w * 0.62
            c.set(x + i, 6 + j, dark if side else (lit if (i + j) % 5 == 0 else top))
    c.rect(2, 20, 26, 2, sand)
    c.outline(OUTLINE)
    return c


def prop_cypress():
    """tall thin cypress (Little Everywhere · Italy pocket)"""
    c = Canvas(12, 30)
    pal = {"g": hex_rgba("2f6b3c"), "d": hex_rgba("224e2c"), "l": hex_rgba("478a52"),
           "t": C_WOOD_D}
    art = [
        ".....g......",
        "....ggg.....",
        "....glg.....",
        "...ggggg....",
        "...gglgg....",
        "...glggg....",
        "..gggglgg...",
        "..gglgggg...",
        "..ggggdgg...",
        "..glgggdg...",
        "..gggdggg...",
        "...ggggg....",
        "...gdggg....",
        "...ggggg....",
        "....ggg.....",
        "....tt......",
        "....tt......",
    ]
    c.blit_ascii(0, 10, art, pal)
    c.outline(OUTLINE)
    return c


def prop_matryoshka():
    """little matryoshka doll (Little Everywhere · Moldova/Russia pocket)"""
    c = Canvas(12, 16)
    pal = {"r": hex_rgba("cf4436"), "R": hex_rgba("9c2e24"), "s": hex_rgba("f2d0a8"),
           "y": hex_rgba("f0c040"), "e": hex_rgba("2a2018"), "w": hex_rgba("f4f1e4")}
    art = [
        "...rrrr.....",
        "..rrrrrr....",
        "..rssssr....",
        "..rsesesr...",
        "..rssssr....",
        "..Rrrrrr....",
        ".rryyyyrr...",
        ".rrywwyrr...",
        ".rryyyyrr...",
        ".RrrrrrrR...",
        "..RRRRRR....",
    ]
    c.blit_ascii(0, 4, art, pal)
    c.outline(OUTLINE)
    return c


def prop_pisa():
    """leaning tower of Pisa (Little Everywhere · Italy) — tiered, leaning right"""
    c = Canvas(18, 34)
    w = hex_rgba("f2ead8")
    W = hex_rgba("d8cdb4")
    d = hex_rgba("b5a888")
    # (x, width, height) per tier, top first; x shrinks going down = top leans right
    tiers = [(9, 5, 3), (8, 7, 4), (7, 7, 4), (6, 7, 4), (5, 7, 4), (4, 9, 5)]
    y = 6
    for (x, wdt, h) in tiers:
        for j in range(h):
            for i in range(wdt):
                col = W if i >= wdt - 2 else w
                if j == 0:
                    col = d  # ring between tiers (the arcades)
                c.set(x + i, y + j, col)
        y += h
    c.rect(10, 4, 3, 2, w)  # little bell chamber on top
    c.outline(OUTLINE)
    return c


def prop_cactus():
    """saguaro wearing a sombrero (Little Everywhere · Mexico)"""
    c = Canvas(22, 28)
    pal = {"g": hex_rgba("4e9e5c"), "G": hex_rgba("397a44"), "l": hex_rgba("6cbb74"),
           "y": hex_rgba("e8c060"), "Y": hex_rgba("c89840"), "r": hex_rgba("cf4436")}
    art = [
        "........yyyy..........",
        "......yyyyyyyy........",
        "....yyYYryrYYyyy......",
        "..yyyyyyyyyyyyyyyy....",
        "........gGg...........",
        "........gGg...........",
        "..gg....glg....gg.....",
        "..gG....glg....Gg.....",
        "..gG....glg....Gg.....",
        "..ggg...glg...ggg.....",
        "...gggggglgggggg......",
        "........glg...........",
        "........glg...........",
        "........gGg...........",
        "........gGg...........",
        "........gGg...........",
    ]
    c.blit_ascii(0, 10, art, pal)
    c.outline(OUTLINE)
    return c


def prop_barrel():
    """wine barrel with grapes on top (Little Everywhere · Moldova 🍇)"""
    c = Canvas(16, 20)
    pal = {"w": hex_rgba("a87c48"), "W": hex_rgba("845c30"), "k": hex_rgba("3a3540"),
           "g": hex_rgba("7a4a8c"), "G": hex_rgba("5c3370"), "v": C_LEAF_D}
    art = [
        ".....v..........",
        "....ggg.........",
        "...gGggg........",
        "....gGg.........",
        "..wwwwwwwwww....",
        ".wwwwwwwwwwww...",
        ".kkkkkkkkkkkk...",
        ".wwWwwwwwWwww...",
        ".wwWwwwwwWwww...",
        ".wwWwwwwwWwww...",
        ".kkkkkkkkkkkk...",
        ".wwwwwwwwwwww...",
        "..wwwwwwwwww....",
    ]
    c.blit_ascii(0, 6, art, pal)
    c.outline(OUTLINE)
    return c


def prop_blower():
    """party blower for noah — 2 frames 16x8: rolled, fully extended"""
    sheet = Canvas(32, 8)
    pal = {"m": hex_rgba("e8c74a"), "r": hex_rgba("e8556a"), "y": hex_rgba("f0d264"),
           "b": hex_rgba("7a9ce8")}
    rolled = [
        "mm.rr...",
        "mmrrrr..",
        "mm.rr...",
    ]
    a = Canvas(16, 8)
    a.blit_ascii(1, 2, rolled, pal)
    a.outline(OUTLINE)
    sheet.blit(a, 0, 0)
    extended = [
        "mm.rryybbrry..",
        "mmrryybbrryyr.",
        "mm.rryybbrry..",
    ]
    b = Canvas(16, 8)
    b.blit_ascii(1, 2, extended, pal)
    b.outline(OUTLINE)
    sheet.blit(b, 16, 0)
    return sheet


def prop_station():
    """travel-log kiosk: wooden easel with a pinned map (Little Everywhere)"""
    c = Canvas(24, 26)
    pal = {"w": C_WOOD, "W": C_WOOD_D, "p": hex_rgba("efe9db"),
           "g": hex_rgba("9ccf8c"), "b": hex_rgba("8ec4e8"),
           "r": hex_rgba("e8556a"), "y": hex_rgba("f0c040"), "v": hex_rgba("8b5cf6")}
    art = [
        ".wwwwwwwwwwwwwwwwww.",
        ".wppppppppppppppppw.",
        ".wpbbggbbbgggbbbppw.",
        ".wpbggggbbggggbrpw..",
        ".wpbbgggybbgggbbpw..",
        ".wpbgggbbbvggggbpw..",
        ".wpbbbggbbbggbbbpw..",
        ".wppppppppppppppppw.",
        ".wwwwwwwwwwwwwwwwww.",
        "...ww..........ww...",
        "...ww..........ww...",
        "..wWw..........wWw..",
        "..ww..............ww",
        "..ww..............ww",
    ]
    c.blit_ascii(1, 8, art, pal)
    c.outline(OUTLINE)
    return c


def prop_garden():
    """tomato patch, 2 frames 36x22: ripe / picked 🍅"""
    sheet = Canvas(72, 22)
    pal = {"w": C_WOOD, "W": C_WOOD_D, "s": hex_rgba("6e5230"), "S": hex_rgba("57401f"),
           "g": C_LEAF, "G": C_LEAF_D, "l": C_LEAF_L, "t": hex_rgba("e04438"),
           "T": hex_rgba("b02c24")}
    for fi, ripe in enumerate((True, False)):
        c = Canvas(36, 22)
        # wooden bed + tilled soil
        c.rect(1, 6, 34, 15, pal["w"])
        c.rect(1, 6, 34, 1, pal["W"])
        c.rect(1, 20, 34, 1, pal["W"])
        c.rect(3, 8, 30, 11, pal["s"])
        for j in range(9, 19, 3):
            c.rect(3, j, 30, 1, pal["S"])
        # tomato plants
        plant = [
            "..g..g..",
            ".gglggG.",
            "gGgggglg",
            ".glgGgg.",
        ]
        for px in (4, 14, 24):
            c.blit_ascii(px, 4, plant, pal)
            if ripe:
                c.set(px + 2, 6, pal["t"])
                c.set(px + 3, 6, pal["t"])
                c.set(px + 3, 7, pal["T"])
                c.set(px + 6, 5, pal["t"])
                c.set(px + 5, 8, pal["t"])
                c.set(px + 6, 8, pal["T"])
        c.outline(OUTLINE)
        sheet.blit(c, fi * 36, 0)
    return sheet


def ride_sprites():
    """her + mookie on the quad — 3 cells 32x28: down, up, side(right)"""
    sheet = Canvas(96, 28)
    pal = {
        "r": hex_rgba("d8504a"), "R": hex_rgba("a83832"), "k": hex_rgba("2a2a30"),
        "K": hex_rgba("44444c"), "s": HER["s"], "h": HER["h"], "H": HER["H"],
        "e": HER["e"], "t": HER["t"], "T": HER["T"], "y": hex_rgba("f0d264"),
        "g": MOOKIE["g"], "G": MOOKIE["G"], "w": MOOKIE["w"], "p": MOOKIE["p"],
        "Y": HAT_PAL["Y"], "P": HAT_PAL["P"], "S": hex_rgba("8c8c94"),
    }
    down = [
        "..............P.................",
        "..............Y.................",
        ".............RRR................",
        ".............YYY................",
        "...........hhhhhh...............",
        "..........hhhhhhhh..............",
        "..........hhsssshh..............",
        "..........hsessesh..............",
        "..........hssssssh..............",
        "..........hhsssshh..............",
        "......kk..tttttttt..kk..........",
        "......kSkkttttttttkkSk..........",
        "......kkstttttttttskk...........",
        ".......rrrrttttttrrrr...........",
        "......rrRrrrrrrrrrRrr...........",
        "......rrrrryyrryyrrrr...........",
        "......kKkkkkkkkkkkKkk...........",
        ".....kKKkKk......kKkKKk.........",
        ".....kKkkkK......kKkkkK.........",
        "......kkkk........kkkk..........",
    ]
    up = [
        "..............P.................",
        "..............Y.................",
        ".............RRR................",
        ".............YYY................",
        "...........hhhhhh...............",
        "..........hhhhhhhh..............",
        "..........hhhhhhhh..............",
        "..........hhhhhhhh..............",
        "..........hhhhhhhh..............",
        "..........hhhhhhhh..............",
        "......kk..tthhhhtt..kk..........",
        "......kSkktthhhhttkkSk..........",
        "......kks..g..g...skk...........",
        ".......rrr.gppg..rrrr...........",
        "......rrRrggggggrrRrr...........",
        "......rrrrgeggegrrrrr...........",
        "......kKkkgwwwwgkkKkk...........",
        ".....kKKkKkgggggkKkKKk..........",
        ".....kKkkkK......kKkkkK.........",
        "......kkkk........kkkk..........",
    ]
    side = [
        "..........P.....................",
        "..........Y.....................",
        ".........RRR....................",
        ".........YYY....................",
        ".......hhhhh....................",
        "......hhhhhhh...................",
        "......hhhssss...................",
        "......hhhssess..................",
        "......hhhsssss..................",
        "......hhhsss..........g..g......",
        ".......ttttt..........gppg......",
        ".......tttttt........ggggg......",
        "......stttttt.......ggeggg......",
        "......krrrttt.......gggwg.......",
        ".....rrrrrrrrrrrggGggggw........",
        "....rrrrRRrrrrrrrrrrRrr.........",
        "...rrrrrrrrrrrrrrrrrrrrr........",
        "...yRrrrrRRRRrrrrrrrRrry........",
        "...kkKkkkkkkkkkkkkkKkkk.........",
        "..kKKkKk..........kKkKKk........",
        "..kKkkkK..........kKkkkK........",
        "...kkkk............kkkk.........",
    ]
    for i, art in enumerate((down, up, side)):
        f = Canvas(32, 28)
        f.blit_ascii(0, 28 - len(art) - 1, art, pal)
        f.outline(OUTLINE)
        sheet.blit(f, i * 32, 0)
    return sheet


def prop_shadow():
    c = Canvas(12, 6)
    sh = (20, 16, 24, 70)
    art = [
        "...xxxxxx...",
        ".xxxxxxxxxx.",
        "xxxxxxxxxxxx",
        ".xxxxxxxxxx.",
        "...xxxxxx...",
    ]
    c.blit_ascii(0, 0, art, {"x": sh})
    return c


# ---------------------------------------------------------------------------
# BUILDINGS — parameterized generator
# ---------------------------------------------------------------------------

def building(wt, ht, wall, wall_d, roof, roof_d, trim, door_col=None, style="house",
             awning=None, awning_b=None, sign_strip=False, stoop=False):
    """wt/ht in 16px tiles for the WALL portion; roof adds ~14-20px above.
    Returns canvas. Door is centered unless door_col (tile index) given."""
    W = wt * 16
    roof_h = 14 if style != "tower" else 10
    wallH = ht * 16
    H = roof_h + wallH + (6 if stoop else 2)
    c = Canvas(W, H)
    win = hex_rgba("aedcf0")
    win_hi = hex_rgba("e8f8ff")
    win_d = hex_rgba("74a8c4")
    sill = hex_rgba("efe9db")
    door = hex_rgba("7d5b34")
    door_d = hex_rgba("5e4326")

    # ---- roof
    if style in ("house",):
        # pitched roof (trapezoid)
        for j in range(roof_h):
            inset = max(0, (roof_h - 2 - j))
            c.rect(inset, j, W - inset * 2, 1, roof)
        c.rect(0, roof_h - 3, W, 2, roof_d)
        c.rect(0, roof_h - 1, W, 1, OUTLINE)
        # ridge highlight
        c.rect(roof_h - 2, 1, W - (roof_h - 2) * 2, 1,
               tuple(min(255, v + 28) for v in roof[:3]) + (255,))
    else:
        # flat roof w/ parapet
        c.rect(1, 2, W - 2, roof_h - 4, roof)
        c.rect(1, roof_h - 4, W - 2, 2, roof_d)
        c.rect(0, 0, W, 3, roof_d)
        c.rect(0, roof_h - 2, W, 2, OUTLINE)

    y0 = roof_h
    # ---- wall
    c.rect(0, y0, W, wallH, wall)
    # brick/texture: subtle horizontal lines every 4px
    for j in range(y0 + 3, y0 + wallH, 4):
        for i in range(0, W, 5):
            c.set(i + (j % 8) // 4 * 2, j, wall_d)
    # eave shadow
    c.rect(0, y0, W, 2, wall_d)

    # ---- windows (grid on upper floors)
    floors = ht
    for fl in range(floors):
        wy = y0 + fl * 16 + 4
        is_ground = fl == floors - 1
        n = max(2, wt - 1)
        gap = W // n
        for k in range(n):
            wx = gap * k + (gap - 8) // 2
            if is_ground and door_col is None and abs(wx + 4 - W // 2) < 10:
                continue  # leave room for centered door
            if is_ground and door_col is not None and abs(wx + 4 - (door_col * 16 + 8)) < 10:
                continue
            c.rect(wx, wy, 8, 9, OUTLINE)
            c.rect(wx + 1, wy + 1, 6, 7, win)
            c.rect(wx + 1, wy + 1, 6, 2, win_hi)
            c.rect(wx + 1, wy + 6, 6, 2, win_d)
            c.rect(wx + 2, wy + 4, 4, 1, win_d)
            c.rect(wx, wy + 9, 8, 1, sill)

    # ---- sign strip (shops / institutions)
    if sign_strip:
        c.rect(2, y0 + 2, W - 4, 7, trim)
        c.rect(2, y0 + 2, W - 4, 1, tuple(min(255, v + 30) for v in trim[:3]) + (255,))
        c.rect(2, y0 + 8, W - 4, 1, OUTLINE)

    # ---- awning
    if awning:
        ay = y0 + 10
        for j in range(5):
            for i in range(1, W - 1):
                stripe = (i // 4) % 2 == 0
                c.set(i, ay + j, awning if stripe else (awning_b or awning))
        c.rect(0, ay + 5, W, 1, OUTLINE)
        c.rect(1, ay + 4, W - 2, 1, tuple(max(0, v - 40) for v in (awning_b or awning)[:3]) + (255,))

    # ---- door
    dx = (W // 2 - 6) if door_col is None else door_col * 16 + 2
    dh = 14
    dy = y0 + wallH - dh
    c.rect(dx - 1, dy - 2, 14, 2, trim)
    c.rect(dx, dy - 1, 12, dh + 1, OUTLINE)
    c.rect(dx + 1, dy, 10, dh, door)
    c.rect(dx + 2, dy + 2, 8, 4, door_d)
    c.set(dx + 8, dy + 7, hex_rgba("e8c74a"))
    if stoop:
        sy = y0 + wallH
        c.rect(dx - 3, sy, 18, 3, C_WALK)
        c.rect(dx - 3, sy + 2, 18, 1, C_WALK_D)
        c.rect(dx - 5, sy + 3, 22, 3, C_WALK)
        c.rect(dx - 5, sy + 5, 22, 1, C_WALK_D)

    # base
    c.rect(0, y0 + wallH - 2, W, 2, wall_d)
    c.outline(OUTLINE)
    return c


BUILDINGS = {
    # LA
    "la_home": lambda: building(
        5, 2, hex_rgba("f0e2c4"), hex_rgba("d4c29e"),
        hex_rgba("d0704e"), hex_rgba("a85238"), hex_rgba("f4f1e4"), style="house"),
    "la_house_b": lambda: building(
        4, 2, hex_rgba("cfe3ea"), hex_rgba("aec7d0"),
        hex_rgba("6f8fa8"), hex_rgba("54718a"), hex_rgba("f4f1e4"), style="house"),
    "taco_shop": lambda: building(
        4, 2, hex_rgba("f7d98c"), hex_rgba("dcbd6f"),
        hex_rgba("b8503e"), hex_rgba("8c3a2c"), hex_rgba("cf4436"), style="shop",
        awning=hex_rgba("e8556a"), awning_b=hex_rgba("f4f1e4"), sign_strip=True),
    "theater": lambda: building(
        5, 2, hex_rgba("d8cfc0"), hex_rgba("b8ad9c"),
        hex_rgba("8465a8"), hex_rgba("64487f"), hex_rgba("e8c74a"), style="shop",
        sign_strip=True),
    # Boston
    "apartment": lambda: building(
        4, 3, hex_rgba("b06a4e"), hex_rgba("8c5038"),
        hex_rgba("6a6a72"), hex_rgba("4e4e56"), hex_rgba("efe9db"), style="shop",
        stoop=True),
    "brownstone_b": lambda: building(
        4, 3, hex_rgba("9c5e46"), hex_rgba("7a4634"),
        hex_rgba("5e5e66"), hex_rgba("46464e"), hex_rgba("efe9db"), style="shop",
        stoop=True),
    "bu_building": lambda: building(
        6, 2, hex_rgba("b8493f"), hex_rgba("933a32"),
        hex_rgba("6a6a72"), hex_rgba("4e4e56"), hex_rgba("f4f1e4"), style="shop",
        sign_strip=True),
    "neu_building": lambda: building(
        6, 2, hex_rgba("8f8f97"), hex_rgba("74747c"),
        hex_rgba("46464e"), hex_rgba("32323a"), hex_rgba("cf4436"), style="shop",
        sign_strip=True),
    "cafe": lambda: building(
        4, 2, hex_rgba("e8dcc8"), hex_rgba("ccc0aa"),
        hex_rgba("5f8f6f"), hex_rgba("47705a"), hex_rgba("47705a"), style="shop",
        awning=hex_rgba("5f8f6f"), awning_b=hex_rgba("f4f1e4"), sign_strip=True),
}


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main():
    os.makedirs(ASSETS, exist_ok=True)
    out = {}

    out["her"] = compose_char(
        {"down": HER_DOWN, "up": HER_UP, "side": HER_SIDE},
        {"front": LEGS_FRONT, "side": LEGS_SIDE}, HER, hat=True,
        extras=[{"torso": HER_DOWN, "legs": LEGS_FRONT["stand"], "overlay": CHEER_ARMS},
                {"torso": HER_DOWN, "legs": LEGS_FRONT["stand"]}])
    out["noah"] = compose_char(
        {"down": NOAH_DOWN, "up": NOAH_UP, "side": NOAH_SIDE},
        {"front": NOAH_LEGS_FRONT, "side": NOAH_LEGS_SIDE}, NOAH,
        extras=[{"torso": NOAH_DOWN, "legs": NOAH_LEGS_FRONT["stand"], "overlay": WAVE_ARM},
                {"torso": NOAH_DOWN, "legs": NOAH_LEGS_FRONT["stand"]}])
    out["mookie"] = compose_mookie(MOOKIE)

    # background townsfolk (no cheer/wave extras)
    out["npc_woman"] = compose_char(
        {"down": HER_DOWN, "up": HER_UP, "side": HER_SIDE},
        {"front": LEGS_FRONT, "side": LEGS_SIDE}, NPC_WOMAN)
    out["npc_man"] = compose_char(
        {"down": NOAH_DOWN, "up": NOAH_UP, "side": NOAH_SIDE},
        {"front": NOAH_LEGS_FRONT, "side": NOAH_LEGS_SIDE}, NPC_MAN)
    out["npc_old"] = compose_char(
        {"down": NOAH_DOWN, "up": NOAH_UP, "side": NOAH_SIDE},
        {"front": NOAH_LEGS_FRONT, "side": NOAH_LEGS_SIDE}, NPC_OLD)

    out["tiles"] = build_tiles()
    out["tree"] = prop_tree()
    out["palm"] = prop_palm()
    fig_sheet = Canvas(64, 32)
    fig_sheet.blit(prop_figtree(True), 0, 0)
    fig_sheet.blit(prop_figtree(False), 32, 0)
    out["figtree"] = fig_sheet
    out["lamp"] = prop_lamp()
    out["bench"] = prop_bench()
    out["quad"] = prop_quad()
    out["torii"] = prop_torii()
    out["barrier"] = prop_barrier()
    out["sailboat"] = prop_sailboat()
    out["fig"] = prop_fig()
    out["pumpkin"] = prop_pumpkin()
    out["radio"] = prop_radio()
    out["horse"] = prop_horse()
    out["column"] = prop_column()
    out["pyramid"] = prop_pyramid()
    out["cypress"] = prop_cypress()
    out["matryoshka"] = prop_matryoshka()
    out["pisa"] = prop_pisa()
    out["cactus"] = prop_cactus()
    out["barrel"] = prop_barrel()
    out["station"] = prop_station()
    out["garden"] = prop_garden()
    out["quad_ride"] = ride_sprites()
    out["fx"] = prop_fx()
    out["shadow"] = prop_shadow()

    for name, cv in out.items():
        cv.save(os.path.join(ASSETS, f"{name}.png"))

    # favicon: the fig, scaled up
    fig_frame = Canvas(12, 12)
    fig_frame.blit(prop_fig(), 0, 0)  # first 12px = frame 0
    fav = Canvas(12, 12)
    for j in range(12):
        for i in range(12):
            fav.px[j][i] = fig_frame.px[j][i]
    fav.scaled(4).save(os.path.join(ASSETS, "favicon.png"))

    # zoomed contact sheet for QA
    zoom = 5
    pad = 8
    row_items = [["her", "noah", "mookie", "npc_woman", "npc_man", "npc_old"],
                 ["tiles"],
                 ["tree", "palm", "figtree", "lamp", "bench", "quad", "sailboat"],
                 ["quad_ride", "horse", "column", "pyramid", "cypress", "matryoshka", "radio", "pumpkin"],
                 ["pisa", "cactus", "barrel", "station", "garden"],
                 ["torii", "barrier", "fig", "fx", "shadow"],
                 ["la_home", "la_house_b", "taco_shop", "theater"],
                 ["apartment", "brownstone_b", "bu_building", "neu_building", "cafe"]]
    bcanv = {n: fn() for n, fn in BUILDINGS.items()}
    for n, cv in bcanv.items():
        cv.save(os.path.join(ASSETS, f"b_{n}.png"))
    all_c = dict(out)
    all_c.update(bcanv)
    width = max(sum(all_c[n].w * zoom + pad for n in row) for row in row_items) + pad
    height = sum(max(all_c[n].h * zoom for n in row) + pad for row in row_items) + pad
    sheet = Canvas(width, height)
    sheet.rect(0, 0, width, height, hex_rgba("6a6a72"))
    y = pad
    for row in row_items:
        x = pad
        rh = 0
        for n in row:
            z = all_c[n].scaled(zoom)
            sheet.blit(z, x, y)
            x += z.w + pad
            rh = max(rh, z.h)
        y += rh + pad
    sheet.save(os.path.join(HERE, "preview.png"))


if __name__ == "__main__":
    main()
