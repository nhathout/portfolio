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
# tiny 3x5 sign font — every storefront in the game spells its own name, and
# hand-plotting caps per sign (the way ARUBA / CLOSED were done) doesn't scale
# past three signs. Same shapes, just shared.
# ---------------------------------------------------------------------------

FONT3 = {
    "A": "###/#.#/###/#.#/#.#", "B": "##./#.#/##./#.#/##.",
    "C": "###/#../#../#../###", "D": "##./#.#/#.#/#.#/##.",
    "E": "###/#../##./#../###", "F": "###/#../##./#../#..",
    "G": "###/#../#.#/#.#/###", "H": "#.#/#.#/###/#.#/#.#",
    "I": "###/.#./.#./.#./###", "J": "..#/..#/..#/#.#/###",
    "K": "#.#/#.#/##./#.#/#.#", "L": "#../#../#../#../###",
    "M": "#.#/###/###/#.#/#.#", "N": "##./#.#/#.#/#.#/#.#",
    "O": "###/#.#/#.#/#.#/###", "P": "###/#.#/###/#../#..",
    "Q": "###/#.#/#.#/###/..#", "R": "##./#.#/##./#.#/#.#",
    "S": "###/#../###/..#/###", "T": "###/.#./.#./.#./.#.",
    "U": "#.#/#.#/#.#/#.#/###", "V": "#.#/#.#/#.#/#.#/.#.",
    "W": "#.#/#.#/###/###/#.#", "X": "#.#/#.#/.#./#.#/#.#",
    "Y": "#.#/#.#/.#./.#./.#.", "Z": "###/..#/.#./#../###",
    "0": "###/#.#/#.#/#.#/###", "1": ".#./##./.#./.#./###",
    "2": "###/..#/###/#../###", "3": "###/..#/###/..#/###",
    "4": "#.#/#.#/###/..#/..#", "5": "###/#../###/..#/###",
    "6": "###/#../###/#.#/###", "7": "###/..#/..#/..#/..#",
    "8": "###/#.#/###/#.#/###", "9": "###/#.#/###/..#/###",
    "-": ".../.../###/.../...", ".": ".../.../.../.../.#.",
    "'": ".#./.#./.../.../...", "!": ".#./.#./.#./.../.#.",
    "&": ".#./#.#/.#./#.#/.##", "/": "..#/..#/.#./#../#..",
    " ": ".../.../.../.../...",
}


def text3_w(s, spacing=1, scale=1, narrow_space=True):
    """pixel width of `s` drawn by text3 (for centering)."""
    w = 0
    for ch in s.upper():
        cw = 2 if (ch == " " and narrow_space) else 3
        w += cw * scale + spacing * scale
    return max(0, w - spacing * scale)


def text3(c, x, y, s, color, spacing=1, scale=1, shadow=None,
          narrow_space=True):
    """draw `s` in the 3x5 font. `scale` fattens each pixel (2 = 6x10 caps).
    `shadow` drops a 1px offset copy first — reads much better on busy signs."""
    if shadow is not None:
        text3(c, x + scale, y + scale, s, shadow, spacing, scale, None,
              narrow_space)
    cx = x
    for ch in s.upper():
        if ch == " ":
            cx += (2 if narrow_space else 3) * scale + spacing * scale
            continue
        glyph = FONT3.get(ch)
        if glyph is None:
            raise KeyError(f"no 3x5 glyph for {ch!r}")
        for j, row in enumerate(glyph.split("/")):
            for i, px in enumerate(row):
                if px != "#":
                    continue
                for jj in range(scale):
                    for ii in range(scale):
                        c.set(cx + i * scale + ii, y + j * scale + jj, color)
        cx += 3 * scale + spacing * scale
    return cx - spacing * scale


def text3_centered(c, cx, y, s, color, spacing=1, scale=1, shadow=None):
    """same, centered on `cx`."""
    w = text3_w(s, spacing, scale)
    return text3(c, cx - w // 2, y, s, color, spacing, scale, shadow)


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
    "t": hex_rgba("f278a2"),           # dress bodice (pink — her favorite)
    "T": hex_rgba("d1517f"),           # bodice shade
    "d": hex_rgba("f6a8c8"),           # dress skirt (lighter pink)
    "D": hex_rgba("d876a6"),           # skirt shade / hem
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

# ---- the house crew 🏡 -----------------------------------------------------
MARINA = {                             # Marina — housekeeper, Russian blonde
    "h": hex_rgba("d8bd72"), "H": hex_rgba("f2e2a6"), "s": hex_rgba("f0d3b4"),
    "S": hex_rgba("d5b494"), "e": hex_rgba("46607a"), "t": hex_rgba("4a6fa5"),
    "T": hex_rgba("35507c"), "d": hex_rgba("5a5f6e"), "D": hex_rgba("43475a"),
    "w": hex_rgba("cfc7b6"),
    "a": hex_rgba("f8f5ec"), "A": hex_rgba("cec6b4"),   # apron
}

MOM = {                                # her mom — hazel curls
    "h": hex_rgba("8f6334"), "H": hex_rgba("bd8f4f"), "s": hex_rgba("f2d5b6"),
    "S": hex_rgba("d6b18e"), "e": hex_rgba("4a3524"), "t": hex_rgba("c96f92"),
    "T": hex_rgba("a04c6d"), "d": hex_rgba("5d6180"), "D": hex_rgba("454863"),
    "w": hex_rgba("efe9db"),
}

BRO = {                                # her little brother — blonde, hoodie
    "h": hex_rgba("edd06a"), "H": hex_rgba("f8e6a8"), "s": hex_rgba("f4d8bb"),
    "S": hex_rgba("d7b493"), "e": hex_rgba("35241d"), "t": hex_rgba("58a05f"),
    "T": hex_rgba("3f7d47"), "W": hex_rgba("efe9db"), "d": hex_rgba("46536e"),
    "D": hex_rgba("343e55"), "w": hex_rgba("e2ddcf"),
    "R": hex_rgba("a9793e"), "L": hex_rgba("d8dde2"),   # fishing rod + reel
}

# ---- the second house 🌻 ---------------------------------------------------
JACK = {                               # Jack — her big brother. tall, wide,
    "h": hex_rgba("352c36"),           # black hair…
    "H": hex_rgba("4e4250"),           # …and the beard, a shade up so the two
    "s": hex_rgba("e8bd94"), "S": hex_rgba("c39468"), "e": hex_rgba("241d1c"),
    "t": hex_rgba("94604a"),           # flannel shirt (rust)
    "T": hex_rgba("6e4232"),
    "W": hex_rgba("e6d8bc"),           # shirt placket
    "d": hex_rgba("3f4a5e"), "D": hex_rgba("2e3849"),  # work jeans
    "w": hex_rgba("6b5844"),           # boots
}

WIFE = {                               # Dez — Jack's wife. curls, near-black
                                       # brown hair (h = mass, H = the highlight
                                       # that keeps the curls legible at 1x)
    "h": hex_rgba("2a1b14"), "H": hex_rgba("42291c"), "s": hex_rgba("f2d2b0"),
    "S": hex_rgba("d4ac89"), "e": hex_rgba("3d2a1c"), "t": hex_rgba("d18a3f"),
    "T": hex_rgba("a3652a"), "d": hex_rgba("5f7a5a"), "D": hex_rgba("46604a"),
    "w": hex_rgba("efe9db"),
}

# ---- the burger place 🍔 -----------------------------------------------------
# White shirt, dark trousers, paper hat. The hat does all the work.
INOUT_A = {                            # on the register
    "h": hex_rgba("3a2a20"), "H": hex_rgba("55402f"), "s": hex_rgba("e3b58c"),
    "S": hex_rgba("c1926a"), "e": hex_rgba("2b201c"),
    "t": hex_rgba("f6f3e7"), "T": hex_rgba("d8d2c0"),
    "d": hex_rgba("3a3f4a"), "D": hex_rgba("2b303a"),
    "w": hex_rgba("f4f1e4"),
}
INOUT_B = {                            # on the fry station
    "h": hex_rgba("241c1a"), "H": hex_rgba("3d302c"), "s": hex_rgba("8a5f3f"),
    "S": hex_rgba("6e4a30"), "e": hex_rgba("1d1512"),
    "t": hex_rgba("f6f3e7"), "T": hex_rgba("d8d2c0"),
    "W": hex_rgba("da291c"),           # the red placket on the shirt
    "d": hex_rgba("3a3f4a"), "D": hex_rgba("2b303a"),
    "w": hex_rgba("f4f1e4"),
}

CHAKRA = {                             # Chakra — the big black dog 🖤
    "g": hex_rgba("4d4857"),           # coat
    "G": hex_rgba("332f3c"),           # ears / legs / shadow
    "l": hex_rgba("7a7389"),           # the shine along her back
    "w": hex_rgba("d6d2de"),           # muzzle, chest blaze, paw tips
    "p": hex_rgba("d98a94"), "e": hex_rgba("e8b44a"), "n": hex_rgba("1e1b24"),
}

LEO = {                                # Leo — big orange tabby 🐱
    "g": hex_rgba("e8913c"), "G": hex_rgba("b45f22"), "w": hex_rgba("f8ead2"),
    "p": hex_rgba("f0a8b0"), "e": hex_rgba("4f8f4f"),
}

CHARLIE = {                            # Charlie — small white dog 🐶
    "g": hex_rgba("f6f2e6"), "G": hex_rgba("bdb09a"), "w": hex_rgba("fdfbf4"),
    "p": hex_rgba("e8a0a8"), "e": hex_rgba("2b2028"), "n": hex_rgba("3a3230"),
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

FW, FH = 16, 28         # frame size (4 rows of headroom, kept for engine offsets)
TORSO_H = 18            # torso art rows 0..17, legs rows 18..23
HEAD_PAD = 4            # body drawn this far down (headroom above)

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

# Sasha's puffy princess dress (Peach-style ♥) — puff sleeves on the torso,
# bell skirt drawn in the leg rows so her shoes peek out while she walks.
# The plain HER_* torsos + LEGS_* below stay in use for npc_woman.
HER_DRESS_DOWN = HER_DOWN[:13] + [
    "...hhtttttthh...",
    "..tTttttttttTt..",
    "..stttttttttts..",
    "...sTttttttTs...",
    "...dddddddddd...",
]

HER_DRESS_UP = HER_UP[:15] + [
    "...sthhhhhhts...",
    "...sThhhhhhTs...",
    "...ddhhhhhhdd...",
]

HER_DRESS_SIDE = HER_SIDE[:13] + [
    "....hhtttttt....",
    "...httttttttt...",
    "....htttttss....",
    "...hdddddddd....",
    "...dddddddddd...",
]

SKIRT_FRONT = {
    "stand": [
        "..dddddddddddd..",
        ".ddDddddddddDdd.",
        ".dddddddddddddd.",
        ".DDDDDDDDDDDDDD.",
        ".....ww..ww.....",
        "................",
    ],
    "a": [
        "..dddddddddddd..",
        ".ddDddddddddDdd.",
        ".dddddddddddddd.",
        ".DDDDDDDDDDDDDD.",
        "....ww.....ww...",
        "................",
    ],
}

SKIRT_SIDE = {
    "stand": [
        "..dddddddddddd..",
        ".ddDddddddddDdd.",
        ".dddddddddddddd.",
        ".DDDDDDDDDDDDDD.",
        "......ww.ww.....",
        "................",
    ],
    "a": [
        "..dddddddddddd..",
        ".ddDddddddddDdd.",
        ".dddddddddddddd.",
        ".DDDDDDDDDDDDDD.",
        ".....ww...ww....",
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



# ---- her mom: same build as Sasha, but big hazel curls -------------------
MOM_DOWN = [
    "................",
    "...hh..hh..hh...",
    "..hhhhhhhhhhhh..",
    "..hHhhhhhhhhHh..",
    ".hhhhhhhhhhhhhh.",
    ".hHhhhhhhhhhhHh.",
    "..hhhhhhhhhhhh..",
    "..hhssssssshhh..",
    "..hsssssssssshh.",
    ".hhssesssessshh.",
    "..hssesssesssh..",
    "..hsssssssssh...",
    "..hhSsssssShhh..",
    "...htttttthh....",
    "....tttttttt....",
    "...stttttttts...",
    "...sTttttttTs...",
    "....TTTTTTTT....",
]

MOM_UP = [
    "................",
    "...hh..hh..hh...",
    "..hhhhhhhhhhhh..",
    ".hhhhhhhhhhhhhh.",
    ".hHhhhhhhhhhhHh.",
    ".hhhhhhhhhhhhhh.",
    "hHhhhhhhhhhhhhHh",
    ".hhhhhhhhhhhhhh.",
    ".hhhHhhhhhhHhhh.",
    ".hhhhhhhhhhhhhh.",
    "..hhhHhhhhHhhh..",
    "..hhhhhhhhhhhh..",
    "..hhhhhhhhhhhh..",
    "...hhhhhhhhhh...",
    "....hhhhhhhh....",
    "...sthhhhhhts...",
    "...sThhhhhhTs...",
    "....TTTTTTTT....",
]

MOM_SIDE = [
    "................",
    "...hh..hh..hh...",
    "..hhhhhhhhhhh...",
    ".hhhhhhhhhhhh...",
    ".hHhhhhhhhhhh...",
    ".hhhhhhhhhhhh...",
    ".hhhhhhhhssss...",
    ".hhhhhhsssssss..",
    ".hhhhhhssssess..",
    "hhhhhhhssssess..",
    ".hhhhhhsssssss..",
    ".hhhhhssssssss..",
    "..hhhsssssss....",
    "...hhtttttt.....",
    "...httttttt.....",
    "...htttttss.....",
    "...hTttttss.....",
    "....TTTTTT......",
]

# ---- Marina's apron legs (worn over the skirt) ---------------------------
APRON_FRONT = {
    "stand": [
        "....dddddddd....",
        "...aaaaaaaaaa...",
        "...aAaaaaaaAa...",
        ".....ss..ss.....",
        ".....ww..ww.....",
        "................",
    ],
    "a": [
        "....dddddddd....",
        "...aaaaaaaaaa...",
        "...aAaaaaaaAa...",
        ".....ss..ss.....",
        "....ww....ww....",
        "................",
    ],
}

APRON_SIDE = {
    "stand": [
        ".....dddddd.....",
        "....aaaaaaaa....",
        "....aAaaaaAa....",
        "......ssss......",
        "......wwww......",
        "................",
    ],
    "a": [
        ".....dddddd.....",
        "....aaaaaaaa....",
        "....aAaaaaAa....",
        ".....ss..ss.....",
        "....ww....ww....",
        "................",
    ],
}

# ---- her little brother: shorter frame, bigger head ---------------------
KID_TORSO_H = 14
KID_HEAD_PAD = 8

KID_DOWN = [
    "................",
    "....hhhhhhhh....",
    "..hhhhhhhhhhhh..",
    "..hhHhhhhhhHhh..",
    "..hhhhhhhhhhhh..",
    "...ssssssssss...",
    "...sesssssses...",
    "...ssssssssss...",
    "...sSssssssSs...",
    "...tttttttttt...",
    "..sttttWWtttts..",
    "..sTttttttttTs..",
    "...TTTTTTTTTT...",
    "................",
]

KID_UP = [
    "................",
    "....hhhhhhhh....",
    "..hhhhhhhhhhhh..",
    "..hhhHhhhhHhhh..",
    "..hhhhhhhhhhhh..",
    "..hhhhhhhhhhhh..",
    "...hhhhhhhhhh...",
    "...hhhhhhhhhh...",
    "....hhhhhhhh....",
    "...tttttttttt...",
    "..stttttttttts..",
    "..sTttttttttTs..",
    "...TTTTTTTTTT...",
    "................",
]

KID_SIDE = [
    "................",
    "...hhhhhhh......",
    "..hhhhhhhhh.....",
    "..hhHhhhhhh.....",
    "..hhhhhhhhh.....",
    "..hhhhsssss.....",
    "..hhhsssssss....",
    "..hhhsssssess...",
    "...hhssssssS....",
    "....tttttttt....",
    "...tttttttts....",
    "...tTtttttss....",
    "....TTTTTTT.....",
    "................",
]

KID_LEGS_FRONT = {
    "stand": [
        "....dddddddd....",
        "....dDddddDd....",
        ".....dd..dd.....",
        ".....ww..ww.....",
        "................",
    ],
    "a": [
        "....dddddddd....",
        "....dDddddDd....",
        ".....dd..dd.....",
        "....ww....ww....",
        "................",
    ],
}

KID_LEGS_SIDE = {
    "stand": [
        ".....dddddd.....",
        ".....dDddDd.....",
        "......dddd......",
        "......wwww......",
        "................",
    ],
    "a": [
        ".....dddddd.....",
        ".....dDddDd.....",
        ".....dd..dd.....",
        "....ww....ww....",
        "................",
    ],
}


def mirror_rows(rows):
    return [r[::-1] for r in rows]


def merge_rows(base, over):
    """paint `over` on top of `base` ('.' in over = keep the base pixel)"""
    out = []
    for j in range(max(len(base), len(over))):
        b = base[j] if j < len(base) else ""
        o = over[j] if j < len(over) else ""
        row = ""
        for i in range(max(len(b), len(o))):
            oc = o[i] if i < len(o) else "."
            row += oc if oc != "." else (b[i] if i < len(b) else ".")
        out.append(row)
    return out


# ---- her brother, take two: no TV, a fishing rod instead 🎣 ----------------
# The rod lives in the headroom above the kid frame, so his torso art moves up
# (head_pad 2 + torso_h 20) and his feet stay exactly where they were.
BRO_TORSO_H = 20
BRO_HEAD_PAD = 2
_BRO_PAD = ["." * 16] * 6

ROD_OVERLAY = [
    "................",
    "................",
    "................",
    "...............R",
    "...............R",
    "...............R",
    "...............R",
    "...............R",
    "..............R.",
    "..............R.",
    "..............R.",
    "..............R.",
    "..............R.",
    "..............R.",
    "..............R.",
    "..............R.",
    ".............RRL",
    "..............L.",
    "................",
    "................",
]

BRO_DOWN = merge_rows(_BRO_PAD + KID_DOWN, ROD_OVERLAY)
BRO_UP = merge_rows(_BRO_PAD + KID_UP, ROD_OVERLAY)
BRO_SIDE = merge_rows(_BRO_PAD + KID_SIDE, ROD_OVERLAY)


# ---- Jack: tall, broad, black hair and a full beard -----------------------
# 21 rows of torso at head_pad 1 → he stands three pixels taller than everyone
# else while his boots land on the same ground line.
JACK_TORSO_H = 21
JACK_HEAD_PAD = 1

JACK_DOWN = [
    "................",
    "....hhhhhhhh....",
    "...hhhhhhhhhh...",
    "..hhhhhhhhhhhh..",
    "..hHhhhhhhhhHh..",
    "..hhhhhhhhhhhh..",
    "..hhsssssssshh..",
    "..hssssssssssh..",
    "..hhseesseeshh..",
    "..hhseesseeshh..",
    "..hhsssssssshh..",
    "..hhHHssssHHhh..",
    "..hHHHHHHHHHHh..",
    "...HHHHHHHHHH...",
    "....HHHHHHHH....",
    ".tttttttttttttt.",
    ".tttttttttttttt.",
    ".ttttttWWtttttt.",
    "stttttttttttttts",
    "sTttttttttttttTs",
    ".TTTTTTTTTTTTTT.",
]

JACK_UP = [
    "................",
    "....hhhhhhhh....",
    "...hhhhhhhhhh...",
    "..hhhhhhhhhhhh..",
    "..hhHhhhhhhHhh..",
    "..hhhhhhhhhhhh..",
    "..hhhhhhhhhhhh..",
    "..hhhhhhhhhhhh..",
    "..hhhhhhhhhhhh..",
    "..hhhHhhhhHhhh..",
    "..hhhhhhhhhhhh..",
    "..hhhhhhhhhhhh..",
    "...hhhhhhhhhh...",
    "...hhhhhhhhhh...",
    "....hhhhhhhh....",
    ".tttttttttttttt.",
    ".tttttttttttttt.",
    ".tttttttttttttt.",
    "stttttttttttttts",
    "sTttttttttttttTs",
    ".TTTTTTTTTTTTTT.",
]

JACK_SIDE = [   # facing right
    "................",
    "...hhhhhhhh.....",
    "..hhhhhhhhhh....",
    "..hhhhhhhhhhh...",
    "..hhHhhhhhhhh...",
    "..hhhhhhhhhhh...",
    "..hhhhhhhssss...",
    "..hhhhhhsssssss.",
    "..hhhhhhssseess.",
    "..hhhhhhssseess.",
    "..hhhhhhsssssss.",
    "..hhhHHHHsssss..",
    "..hhHHHHHHHss...",
    "..hHHHHHHHHH....",
    "...HHHHHHHH.....",
    "..tttttttttttt..",
    "..tttttttttttt..",
    "..tttttttttttt..",
    ".tttttttttttttss",
    ".tTtttttttttttss",
    "..TTTTTTTTTTTT..",
]

JACK_LEGS_FRONT = {
    "stand": [
        "...dddddddddd...",
        "...dDddddddDd...",
        "....dd....dd....",
        "....dd....dd....",
        "....ww....ww....",
        "................",
    ],
    "a": [
        "...dddddddddd...",
        "...dDddddddDd...",
        "....dd....dd....",
        "....ww....dd....",
        "..........ww....",
        "................",
    ],
}

JACK_LEGS_SIDE = {
    "stand": [
        "....dddddddd....",
        "....dDddddDd....",
        ".....dddddd.....",
        ".....dddddd.....",
        ".....wwwwww.....",
        "................",
    ],
    "a": [
        "....dddddddd....",
        "....dDddddDd....",
        ".....dddddd.....",
        "....dd....dd....",
        "...ww......ww...",
        "................",
    ],
}


# tiny party hat, drawn over the top of the head (birthday girl only ♥)
# ---- hats. A hat is a spec, not a flag: {rows, pal, dy, dx}. `dy` is measured
# from HEAD_PAD so it follows a character's head up or down, and `dx` nudges the
# side-facing frames, whose heads sit one pixel over.
PARTY_HAT = {
    "pal": {
        "Y": hex_rgba("f0c040"),   # cone
        "R": hex_rgba("e8556a"),   # stripe
        "P": hex_rgba("f8a8c0"),   # pompom
    },
    # a proper kids' party cone: tall, striped, pompom on top
    "rows": [
        ".......PP.......",
        ".......YY.......",
        "......YYYY......",
        "......RRRR......",
        ".....YYYYYY.....",
        ".....RRRRRR.....",
    ],
    "dy": -3,
    "dx": {"down": 0, "up": 0, "side": 1},
}

# the folded paper cap the In-N-Out crew wear — white, red band. It's the
# whole reason the burger run is worth doing 🍔
PAPER_HAT = {
    "pal": {
        "N": hex_rgba("fbf8ee"),   # paper
        "M": hex_rgba("ffffff"),   # the fold catching the light
        "Q": hex_rgba("ded8c6"),   # paper shade
        "R": hex_rgba("da291c"),   # the band
        "V": hex_rgba("a81d13"),   # band shade
    },
    "rows": [
        ".....MMMMMM.....",
        "...MMNNNNNNMM...",
        "..MNNNNNNNNNNQ..",
        "..RRRRRRRRRRRR..",
        "..VRRRRRRRRRRV..",
    ],
    "dy": -1,
    "dx": {"down": 0, "up": 0, "side": 1},
}


def compose_char(torsos, legsets, pal, extras=None, hat=None,
                 torso_h=TORSO_H, head_pad=HEAD_PAD, hat_dy=0):
    """torsos: {down,up,side}; legsets: {front:{stand,a}, side:{stand,a}}
    torso_h/head_pad let shorter characters (kids) sit lower in the frame."""
    hatpal = dict(pal)
    if hat:
        hatpal.update(hat["pal"])
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
            f.blit_ascii(0, head_pad, torsos[dirname], pal)
            f.blit_ascii(0, head_pad + torso_h, frames[ci], pal)
            if hat:
                # the hat's bottom row lands ON the hair's top rows, so it reads
                # as sitting on the head rather than hovering over it
                f.blit_ascii(hat["dx"][dirname], head_pad + hat["dy"] + hat_dy,
                             hat["rows"], hatpal)
            f.outline(OUTLINE)
            sheet.blit(f, ci * FW, ri * FH)
    if extras:
        for ci, ex in enumerate(extras[:4]):
            f = Canvas(FW, FH)
            f.blit_ascii(0, head_pad, ex["torso"], pal)
            f.blit_ascii(0, head_pad + torso_h, ex["legs"], pal)
            if ex.get("overlay"):
                f.blit_ascii(0, head_pad, ex["overlay"], pal)
            if hat:
                f.blit_ascii(0, head_pad + hat["dy"] + hat_dy, hat["rows"], hatpal)
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


# ---------------------------------------------------------------------------
# CHARLIE — small white dog (same 16x16 / 4x4 layout as the cats)
# ---------------------------------------------------------------------------

DOG = {
    "down": [
        "................",
        "................",
        "....gggggggg....",
        "..GGgggggggGG...",
        "..GGgeggggeGG...",
        "..GGggwwwwggGG..",
        "..GGgwwnnwwgGG..",
        "...GgwwwwwwgG...",
        "....wwwwwwww....",
        ".....gggggg.....",
        "...gggggggggg...",
        "...gggwwwwggg...",
        "...gggggggggg.G.",
        "...gggggggggg...",
        "....ww....ww....",
        "................",
    ],
    "down_a": [
        "................",
        "................",
        "....gggggggg....",
        "..GGgggggggGG...",
        "..GGgeggggeGG...",
        "..GGggwwwwggGG..",
        "..GGgwwnnwwgGG..",
        "...GgwwwwwwgG...",
        "....wwwwwwww....",
        ".....gggggg.....",
        "...gggggggggg.G.",
        "...gggwwwwggg.G.",
        "...gggggggggg...",
        "...gggggggggg...",
        "...ww......ww...",
        "................",
    ],
    "up": [
        "................",
        "................",
        "....gggggggg....",
        "..GGgggggggGG...",
        "..GGgggggggGG...",
        "..GGgggggggGG...",
        "..GGgggggggGG...",
        "...Ggggggggg....",
        ".....gggggg.....",
        "...gggggggggg...",
        "...gGgggggGgg...",
        "...gggggggggg...",
        "...gggggggggg.G.",
        "...gggggggggg...",
        "....ww....ww....",
        "................",
    ],
    "up_a": [
        "................",
        "................",
        "....gggggggg....",
        "..GGgggggggGG...",
        "..GGgggggggGG...",
        "..GGgggggggGG...",
        "..GGgggggggGG...",
        "...Ggggggggg....",
        ".....gggggg...G.",
        "...gggggggggg.G.",
        "...gGgggggGgg...",
        "...gggggggggg...",
        "...gggggggggg...",
        "...gggggggggg...",
        "...ww......ww...",
        "................",
    ],
    "side": [   # facing right
        "................",
        "................",
        "................",
        "........gggg....",
        ".G.....ggggggg..",
        ".GG....gGgggegw.",
        "..GGgggGgggwwwn.",
        "...ggggGgggwww..",
        "...ggggggggww...",
        "...gggggggggg...",
        "...ggwwwwwggg...",
        "...gg.....gg....",
        "...ww.....ww....",
        "................",
        "................",
        "................",
    ],
    "side_a": [
        "................",
        "................",
        "................",
        "........gggg....",
        "..G....ggggggg..",
        "..GG...gGgggegw.",
        "...GGggGgggwwwn.",
        "...ggggGgggwww..",
        "...ggggggggww...",
        "...gggggggggg...",
        "...ggwwwwwggg...",
        "..gg.......gg...",
        "..ww.......ww...",
        "................",
        "................",
        "................",
    ],
    "sit": [
        "................",
        "................",
        "....gggggggg....",
        "..GGgggggggGG...",
        "..GGgeggggeGG...",
        "..GGggwwwwggGG..",
        "..GGgwwnnwwgGG..",
        "...GgwwwwwwgG...",
        "....wwwwwwww....",
        "....gggggggg....",
        "...ggwwwwwwgg...",
        "...gggggggggg.G.",
        "...gggggggggg.G.",
        "....ww....ww....",
        "................",
        "................",
    ],
    "sit_b": [
        "................",
        "................",
        "....gggggggg....",
        "..GGgggggggGG...",
        "..GGgggggggGG...",
        "..GGggwwwwggGG..",
        "..GGgwwnnwwgGG..",
        "...GgwwwwwwgG...",
        "....wwwwwwww....",
        "....gggggggg....",
        "...ggwwwwwwgg.G.",
        "...gggggggggg.G.",
        "...gggggggggg...",
        "....ww....ww....",
        "................",
        "................",
    ],
}


# ---------------------------------------------------------------------------
# CHAKRA — the big black dog. Same 16x16 / 4x4 layout, but she fills the whole
# frame: broader chest, longer legs, a proper blocky head.
# ---------------------------------------------------------------------------

BIGDOG = {
    "down": [
        "................",
        "...llllllllll...",
        ".GGlgggggggglGG.",
        ".GGgeggggggegGG.",
        ".GGggggggggggGG.",
        ".GGgggllllgggGG.",
        ".GGgglwnnwlggGG.",
        "..Ggllwwwwllg...",
        "...gllllllllg...",
        "....gggwwggg....",
        "..llgggwwgggll..",
        "..gggggwwggggg..",
        "..gggggwwggggg.G",
        "..gggggggggggg..",
        "..GG........GG..",
        "..ww........ww..",
    ],
    "down_a": [
        "................",
        "...llllllllll...",
        ".GGlgggggggglGG.",
        ".GGgeggggggegGG.",
        ".GGggggggggggGG.",
        ".GGgggllllgggGG.",
        ".GGgglwnnwlggGG.",
        "..Ggllwwwwllg...",
        "...gllllllllg...",
        "....gggwwggg...G",
        "..llgggwwgggll.G",
        "..gggggwwggggg..",
        "..gggggwwggggg..",
        "..gggggggggggg..",
        ".GG..........GG.",
        ".ww..........ww.",
    ],
    "up": [
        "................",
        "...llllllllll...",
        ".lGggggggggggGl.",
        ".lGggggggggggGl.",
        ".lGggggggggggGl.",
        ".GGggggggggggGG.",
        ".GGggggggggggGG.",
        "..GggggggggggG..",
        "...gggggggggg...",
        "....llllllll....",
        "..llgggggggggg..",
        "..gggggggggggg..",
        "..gggggggggggg.G",
        "..gggggggggggg..",
        "..GG........GG..",
        "..ww........ww..",
    ],
    "up_a": [
        "................",
        "...llllllllll...",
        ".lGggggggggggGl.",
        ".lGggggggggggGl.",
        ".lGggggggggggGl.",
        ".GGggggggggggGG.",
        ".GGggggggggggGG.",
        "..GggggggggggG..",
        "...gggggggggg...",
        "....llllllll...G",
        "..llgggggggggg.G",
        "..gggggggggggg..",
        "..gggggggggggg..",
        "..gggggggggggg..",
        ".GG..........GG.",
        ".ww..........ww.",
    ],
    "side": [   # facing right
        "................",
        "................",
        ".......gggggggg.",
        "G.....gggggggggg",
        "GG....gGgggeggww",
        ".GG...gGgggggwwn",
        "..GGllgGgggwwwwn",
        "...llllgGgggwww.",
        "..llgggggggggww.",
        "..gggggggggggg..",
        ".ggggggggggggg..",
        ".gggggggglwwlg..",
        ".gggggggggggg...",
        ".GG......GGG....",
        ".ww......www....",
        "................",
    ],
    "side_a": [
        "................",
        "................",
        ".......gggggggg.",
        "G.....gggggggggg",
        "GG....gGgggeggww",
        "GG....gGgggggwwn",
        ".GGGllgGgggwwwwn",
        "...llllgGgggwww.",
        "..llgggggggggww.",
        "..gggggggggggg..",
        ".ggggggggggggg..",
        ".gggggggglwwlg..",
        ".gggggggggggg...",
        "GG........GGG...",
        "ww........www...",
        "................",
    ],
    "sit": [
        "................",
        "...llllllllll...",
        ".GGlgggggggglGG.",
        ".GGgeggggggegGG.",
        ".GGggggggggggGG.",
        ".GGgggllllgggGG.",
        ".GGgglwnnwlggGG.",
        "..Ggllwwwwllg...",
        "...gllllllllg...",
        "..llgggwwgggll..",
        "..gggggwwggggg..",
        "..gggggwwggggg..",
        "..gggggggggggg.G",
        "..gggggggggggg.G",
        "..ww........ww..",
        "................",
    ],
    "sit_b": [
        "................",
        "...llllllllll...",
        ".GGlgggggggglGG.",
        ".GGggggggggggGG.",
        ".GGggggggggggGG.",
        ".GGgggllllgggGG.",
        ".GGgglwnnwlggGG.",
        "..Ggllwwwwllg...",
        "...gllllllllg...",
        "..llgggwwgggll.G",
        "..gggggwwggggg.G",
        "..gggggwwggggg..",
        "..gggggggggggg..",
        "..gggggggggggg..",
        "..ww........ww..",
        "................",
    ],
}


def compose_quad(grids, pal):
    """4x4 sheet for a 16x16 four-legged friend (cats + dogs)."""
    sheet = Canvas(16 * 4, 16 * 4)
    rows = [
        [grids["down"], grids["down_a"], grids["down"], mirror_rows(grids["down_a"])],
        [grids["up"], grids["up_a"], grids["up"], mirror_rows(grids["up_a"])],
        [grids["side"], grids["side_a"], grids["side"], grids["side_a"]],
        [grids["sit"], grids["sit_b"], grids["sit"], grids["sit_b"]],
    ]
    for ri, frames in enumerate(rows):
        for ci, fr in enumerate(frames):
            f = Canvas(16, 16)
            f.blit_ascii(0, 0, fr, pal)
            f.outline(OUTLINE)
            sheet.blit(f, ci * 16, ri * 16)
    return sheet


def compose_mookie(pal):
    return compose_quad(MOOK, pal)


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
    # ---- interiors 🏡
    ("wood_a", lambda: tile_wood(2)),
    ("wood_b", lambda: tile_wood(9)),
    ("wood_c", lambda: tile_wood(21)),
    ("ktile", lambda: tile_ktile()),
    ("rug_a", lambda: tile_rugf(0)),
    ("rug_b", lambda: tile_rugf(1)),
    ("boho_a", lambda: tile_boho(0)),
    ("boho_b", lambda: tile_boho(1)),
    ("walltop", lambda: tile_walltop()),
    ("wallface", lambda: tile_wallface()),
    ("wallwin", lambda: tile_wallwin()),
    ("wallpic", lambda: tile_wallpic()),
    ("wallmac", lambda: tile_wallmac()),
    ("wallherb", lambda: tile_wallherb()),
    ("indoor", lambda: tile_indoor()),
    # ---- the burger place 🍔
    ("chk_a", lambda: tile_checker(0)),
    ("chk_b", lambda: tile_checker(1)),
    ("io_top", lambda: tile_io_top()),
    ("io_face", lambda: tile_io_face()),
    ("io_win", lambda: tile_io_win()),
    ("io_door", lambda: tile_io_door()),
    ("io_counter", lambda: tile_io_counter()),
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


# ---------------------------------------------------------------------------
# ARUBA 🇦🇼 — the paradise beach oasis east of Mini Boston (the birthday trip)
# ---------------------------------------------------------------------------

C_SEA = hex_rgba("2fb5c4")
C_SEA_L = hex_rgba("6fe0e4")
C_SEA_D = hex_rgba("1d8a9c")


def prop_divi():
    """Aruba's divi-divi tree — permanently bent southwest by the trade winds."""
    c = Canvas(28, 32)
    pal = {"g": C_LEAF, "d": C_LEAF_D, "l": C_LEAF_L,
           "t": hex_rgba("a8845a"), "T": hex_rgba("7d5f38")}
    art = [
        "..............gggggl........",
        "..........gggggggggggg......",
        ".......lggggggggggggggg.....",
        ".....gggggdgggggggglgg......",
        "....ggglgggggggggggg........",
        ".....gggggggdggggg..........",
        ".......ggggggggg............",
        "..........ttT...............",
        "..........tT................",
        ".........ttT................",
        ".........tT.................",
        ".........tTT................",
        "........ttT.................",
        "........tTT.................",
        ".......tttT.................",
        "......ttTTT.................",
    ]
    c.blit_ascii(0, 4, art, pal)
    c.outline(OUTLINE)
    return c


def prop_turtle():
    """a sea turtle, facing right — she can talk to him ♥ (2 frames: blink)"""
    sheet = Canvas(48, 20)
    pal = {"g": hex_rgba("5aa05e"), "G": hex_rgba("3f7a45"), "l": hex_rgba("7cc47f"),
           "s": hex_rgba("8a6a3c"), "S": hex_rgba("6a4f2a"), "y": hex_rgba("d8c48a"),
           "e": hex_rgba("241a16")}
    for fi, blink in enumerate((False, True)):
        c = Canvas(24, 20)
        eye = "e" if not blink else "G"
        art = [
            "........................",
            "..gg..............gg....",
            ".gggg...ssssss...gggg...",
            ".gggg.ssSssSsss.ggggg...",
            "..gg.sSssSsssSss.gg.....",
            ".....sssSsssSsss...ggg..",
            "....ssSsssSsssSss.ggggg.",
            "....sssSsssSsssss.gg#gg.",
            "....ssSsssSsssSss..ggg..",
            ".....sssSsssSsss...gg...",
            "..gg..sSssSsssS..gg.....",
            ".gggg..ssssssss.gggg....",
            ".gggg...........gggg....",
            "..gg..............gg....",
        ]
        art = [r.replace("#", eye) for r in art]
        c.blit_ascii(0, 4, art, pal)
        c.outline(OUTLINE)
        sheet.blit(c, fi * 24, 0)
    return sheet


def prop_palapa():
    """thatched beach hut / tiki bar with a little CLOSED board nailed to it"""
    c = Canvas(48, 40)
    thatch = hex_rgba("d2a457")
    thatch_d = hex_rgba("a87f3c")
    post = hex_rgba("9a6f42")
    post_d = hex_rgba("74512d")
    board = hex_rgba("e8dcc0")
    ink = hex_rgba("c2413f")
    # thatched cone roof
    for j in range(16):
        w = 6 + j * 2.6
        x = int(24 - w / 2)
        c.rect(x, 4 + j, int(w), 1, thatch if j % 3 else thatch_d)
    c.rect(2, 19, 44, 2, thatch_d)
    # straw texture
    for i in range(3, 45, 3):
        c.rect(i, 12, 1, 7, thatch_d)
    # posts + counter
    c.rect(5, 21, 4, 15, post)
    c.rect(7, 21, 2, 15, post_d)
    c.rect(39, 21, 4, 15, post)
    c.rect(41, 21, 2, 15, post_d)
    c.rect(6, 28, 36, 5, post)
    c.rect(6, 31, 36, 2, post_d)
    # hanging CLOSED board
    c.rect(18, 21, 1, 3, post_d)
    c.rect(29, 21, 1, 3, post_d)
    c.rect(7, 23, 34, 11, board)
    c.rect(7, 23, 34, 1, hex_rgba("cbbfa2"))
    c.rect(7, 32, 34, 2, hex_rgba("cbbfa2"))
    word = [                                   # C L O S E D, 3px caps
        "###.#...###.###.###.##.",
        "#...#...#.#.#...#...#.#",
        "#...#...#.#.###.##..#.#",
        "#...#...#.#...#.#...#.#",
        "###.###.###.###.###.##.",
    ]
    for j, row in enumerate(word):
        for i, ch in enumerate(row):
            if ch == "#":
                c.set(13 + i, 25 + j, ink)
    c.outline(OUTLINE)
    return c


def prop_lounger():
    """striped beach lounger + a little umbrella"""
    c = Canvas(30, 32)
    um1 = hex_rgba("f278a2")
    um2 = hex_rgba("f4f1e4")
    pole = hex_rgba("cfc7b6")
    chair = hex_rgba("e8dcc0")
    chair_d = hex_rgba("c6b795")
    wood = hex_rgba("b08a56")
    # umbrella canopy
    for j in range(7):
        w = 24 - j * 3
        x = int(19 - w / 2)
        for i in range(max(0, x), min(30, x + w)):
            c.set(i, 2 + j, um1 if ((i - x) // 3) % 2 == 0 else um2)
    c.rect(18, 9, 2, 16, pole)
    # lounger
    c.rect(1, 20, 16, 3, chair)
    c.rect(1, 22, 16, 1, chair_d)
    for i in range(2, 16, 4):
        c.rect(i, 20, 2, 2, um1)
    c.rect(1, 14, 3, 7, chair)
    c.rect(2, 14, 2, 7, chair_d)
    c.rect(2, 23, 2, 4, wood)
    c.rect(14, 23, 2, 4, wood)
    c.outline(OUTLINE)
    return c


def prop_critters():
    """ambient wildlife strip, 4 frames of 12x12:
    0-1 butterfly (wings open/closed), 2-3 seagull (glide/flap)"""
    sheet = Canvas(48, 12)
    # monarch-ish: orange wings, dark veins, two white dots — reads as a
    # butterfly at 1x, where a two-tone pink blob just read as a bow
    bfly = {"w": hex_rgba("e8913c"), "W": hex_rgba("f4c46a"), "b": hex_rgba("2b2028"),
            "y": hex_rgba("f8f2e2")}
    gull = {"w": hex_rgba("f4f1e4"), "W": hex_rgba("cfc7b6"), "b": hex_rgba("2b2028"),
            "y": hex_rgba("e8913c")}
    frames = [
        (bfly, [
            "............",
            "..ww....ww..",
            ".wWWw..wWWw.",
            "wWWWWbbWWWWw",
            ".wWyWbbWyWw.",
            "..wWWbbWWw..",
            "...wwbbww...",
            "....b..b....",
            "............",
        ]),
        (bfly, [
            "............",
            "............",
            "....w..w....",
            "...wW..Ww...",
            "...wWbbWw...",
            "...wWbbWw...",
            "....wbbw....",
            "....b..b....",
            "............",
        ]),
        (gull, [
            "............",
            "...ww.......",
            "..wWww......",
            ".wwwwwwb....",
            "..wwwwwwby..",
            "....wwWww...",
            ".....wwww...",
            "............",
            "............",
        ]),
        (gull, [
            "............",
            "............",
            "....wwwb....",
            "..wwwwwwby..",
            ".wWwwwwWw...",
            "wwww...wwww.",
            "............",
            "............",
            "............",
        ]),
    ]
    for i, (pal, art) in enumerate(frames):
        c = Canvas(12, 12)
        c.blit_ascii(0, 1, art, pal)
        c.outline(OUTLINE)
        sheet.blit(c, i * 12, 0)
    return sheet


def prop_starfish():
    c = Canvas(14, 12)
    pal = {"o": hex_rgba("f0925a"), "O": hex_rgba("cf6f3c"), "y": hex_rgba("f8c88a")}
    art = [
        "......oo......",
        ".....oyyo.....",
        "....ooyyoo....",
        "oooooyyyyooooo",
        ".oOooyyyyooOo.",
        "..OoooyyoooO..",
        "...ooOooOoo...",
        "..ooO....Ooo..",
        ".oO........Oo.",
    ]
    c.blit_ascii(0, 1, art, pal)
    c.outline(OUTLINE)
    return c


def prop_beachsign():
    """a driftwood signpost — ARUBA, with a little heart underline ♥"""
    c = Canvas(28, 30)
    wood = hex_rgba("cbb089")
    wood_d = hex_rgba("a38a68")
    post = hex_rgba("8a683c")
    ink = hex_rgba("2b6f7a")
    c.rect(12, 14, 4, 15, post)
    c.rect(14, 14, 2, 15, hex_rgba("6e5230"))
    c.rect(1, 4, 26, 13, wood)
    c.rect(1, 4, 26, 1, hex_rgba("e0cba4"))
    c.rect(1, 15, 26, 2, wood_d)
    word = [                                   # A R U B A, 3px caps
        "###.##..#.#.##..###",
        "#.#.#.#.#.#.#.#.#.#",
        "###.##..#.#.##..###",
        "#.#.#.#.#.#.#.#.#.#",
        "#.#.#.#.###.##..#.#",
    ]
    for j, row in enumerate(word):
        for i, ch in enumerate(row):
            if ch == "#":
                c.set(5 + i, 6 + j, ink)
    c.rect(6, 13, 16, 1, hex_rgba("e8556a"))
    c.outline(OUTLINE)
    return c


# ---------------------------------------------------------------------------
# THE LA BEACH 🌊 — the strip got six tiles wider, so it needed furniture
# ---------------------------------------------------------------------------

IN_YELLOW = hex_rgba("ffc72c")
IN_YELLOW_D = hex_rgba("dfa513")
IN_RED = hex_rgba("da291c")
IN_RED_D = hex_rgba("a81d13")
IN_WHITE = hex_rgba("fffdf4")


def prop_innoutsign():
    """The sign. Crossed yellow arrow, red caps, two poles — the one thing
    that makes a white box read as In-N-Out from across the map."""
    c = Canvas(40, 56)
    pole = hex_rgba("b9b4ab")
    pole_d = hex_rgba("8b867e")

    # ---- the arrow: a stepped diagonal band, then a fat triangular head
    for i in range(3, 30):
        top = 5 + (i - 3) // 2
        c.rect(i, top, 1, 7, IN_YELLOW)
        c.set(i, top + 5, IN_YELLOW_D)
        c.set(i, top + 6, IN_YELLOW_D)
    for k in range(11):                     # apex right, base at x=28
        half = 10 - k
        c.rect(28 + k, 21 - half, 1, half * 2 + 1, IN_YELLOW)
        c.set(28 + k, 21 + half, IN_YELLOW_D)
        if half:
            c.set(28 + k, 21 + half - 1, IN_YELLOW_D)
    # In-N-Out's arrow is red-edged — outline the yellow before anything else
    # lands on top of it, then the universal dark outline goes outside that.
    c.outline(IN_RED)

    # ---- the name plaque, crossing the arrow like it should
    c.rect(1, 26, 38, 16, IN_WHITE)
    c.rect(1, 26, 38, 1, IN_RED)
    c.rect(1, 41, 38, 1, IN_RED)
    c.rect(1, 26, 1, 16, IN_RED)
    c.rect(38, 26, 1, 16, IN_RED)
    text3_centered(c, 20, 29, "IN-N-OUT", IN_RED)
    text3_centered(c, 20, 35, "BURGER", IN_RED)

    # ---- poles
    for px in (8, 28):
        c.rect(px, 41, 4, 15, pole)
        c.rect(px + 2, 41, 2, 15, pole_d)
    c.outline(OUTLINE)
    return c


def prop_lifeguard():
    """LA lifeguard tower: white hut, blue shed roof, red cross, up on stilts
    with a ladder. Reads as 'this is a real beach' more than any palm does."""
    c = Canvas(30, 42)
    hut = hex_rgba("eef3f6")
    hut_d = hex_rgba("c9d4dc")
    blue = hex_rgba("3f7fc0")
    blue_l = hex_rgba("62a2dd")
    blue_d = hex_rgba("2d5f96")
    wood = hex_rgba("9a6f42")
    wood_d = hex_rgba("74512d")
    glass = hex_rgba("aedcf0")
    glass_d = hex_rgba("74a8c4")

    # pennant on top
    c.rect(14, 0, 2, 8, hex_rgba("cfc7b6"))
    for j in range(5):
        c.rect(16, 1 + j, 8 - j, 1, IN_RED if j < 4 else IN_RED_D)
    # shed roof, sloping down to the right
    for j in range(5):
        c.rect(1 + j // 2, 7 + j, 28 - j // 2, 1, blue if j < 4 else blue_d)
    c.rect(1, 7, 28, 1, blue_l)
    # hut body
    c.rect(3, 12, 24, 15, hut)
    c.rect(3, 12, 24, 1, hex_rgba("fbfdff"))
    c.rect(3, 25, 24, 2, hut_d)
    # window band (where the guard actually sits)
    c.rect(5, 15, 20, 8, glass_d)
    c.rect(6, 16, 18, 6, glass)
    c.rect(6, 16, 18, 2, hex_rgba("e8f8ff"))
    c.rect(14, 15, 2, 8, hut)          # centre mullion
    # red cross on the left panel
    c.rect(7, 17, 5, 2, IN_RED)
    c.rect(8, 15, 2, 6, IN_RED)
    # deck + stilts
    c.rect(1, 27, 28, 3, wood)
    c.rect(1, 29, 28, 1, wood_d)
    for sx in (4, 24):
        c.rect(sx, 30, 3, 11, wood)
        c.rect(sx + 2, 30, 1, 11, wood_d)
    # ladder up the middle
    c.rect(12, 30, 2, 11, wood)
    c.rect(17, 30, 2, 11, wood)
    for ry in (32, 35, 38):
        c.rect(13, ry, 5, 1, wood_d)
    c.outline(OUTLINE)
    return c


def prop_umbrella():
    """big red-and-white umbrella with a towel and a cooler under it"""
    c = Canvas(32, 38)
    red = hex_rgba("e8433c")
    white = hex_rgba("fbf7ea")
    pole = hex_rgba("cfc7b6")
    pole_d = hex_rgba("a8a091")
    # domed canopy — a quarter-circle profile, not a flat awning
    for j in range(12):
        w = int(round(30 * (1 - (j / 12.4) ** 2) ** 0.5))
        x0 = 16 - w // 2
        for i in range(x0, x0 + w):
            c.set(i, 1 + j, red if ((i - x0 + 1) // 4) % 2 == 0 else white)
    for i in range(2, 30, 4):               # scalloped hem
        c.set(i, 13, red)
        c.set(i + 1, 13, red)
    c.rect(15, 12, 2, 20, pole)
    c.rect(16, 12, 1, 20, pole_d)
    # towel spread on the sand
    towel = hex_rgba("2fb3b3")
    towel_l = hex_rgba("f6f2e2")
    for j in range(5):
        c.rect(2 + j, 30 + j, 17, 1, towel if j % 2 == 0 else towel_l)
    # cooler
    c.rect(22, 27, 9, 8, white)
    c.rect(22, 27, 9, 3, hex_rgba("3f7fc0"))
    c.rect(22, 33, 9, 2, hex_rgba("d6d0c0"))
    c.rect(25, 29, 3, 1, hex_rgba("2d5f96"))
    c.outline(OUTLINE)
    return c


def prop_surfboards():
    """two boards planted nose-up in the sand, leaning apart"""
    c = Canvas(32, 38)
    teal = hex_rgba("2fb3b3")
    teal_d = hex_rgba("1d8a8f")
    coral = hex_rgba("f2705a")
    coral_d = hex_rgba("c4503e")
    cream = hex_rgba("f8f2e2")
    # half-widths down the board: pointed nose, belly at ~45%, rounded tail
    SHAPE = [1, 1, 2, 2, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 4, 4,
             4, 4, 4, 3, 3, 3, 3, 2, 2, 2]

    def board(cx0, top, body, dark, lean):
        for j, half in enumerate(SHAPE):
            x = cx0 + int(round(lean * j))
            c.rect(x - half, top + j, half * 2, 1, body)
            c.rect(x + half - 2, top + j, 2, 1, dark)
            if 3 < j < len(SHAPE) - 4:      # stringer down the middle
                c.set(x, top + j, cream)
        # fin at the tail
        fx = cx0 + int(round(lean * (len(SHAPE) - 1)))
        c.rect(fx, top + len(SHAPE), 2, 4, dark)
        c.rect(fx + 1, top + len(SHAPE), 1, 3, dark)

    board(9, 1, teal, teal_d, -0.07)
    board(23, 5, coral, coral_d, 0.06)
    c.outline(OUTLINE)
    return c


def prop_volley():
    """beach volleyball net + the ball, half-buried"""
    c = Canvas(46, 32)
    post = hex_rgba("cfc7b6")
    post_d = hex_rgba("a29a8b")
    net = hex_rgba("f4f1e4")
    for px in (2, 40):
        c.rect(px, 4, 4, 25, post)
        c.rect(px + 2, 4, 2, 25, post_d)
    c.rect(6, 6, 34, 2, net)                # top tape
    c.rect(6, 19, 34, 1, net)               # bottom tape
    for i in range(6, 40, 4):               # mesh
        c.rect(i, 8, 1, 11, net)
    for j in range(9, 19, 4):
        c.rect(6, j, 34, 1, net)
    # the ball
    ball = hex_rgba("fbf7ea")
    c.rect(21, 24, 8, 6, ball)
    c.rect(22, 23, 6, 8, ball)
    c.rect(23, 23, 4, 1, hex_rgba("e8433c"))
    c.rect(21, 26, 8, 1, hex_rgba("3f7fc0"))
    c.rect(24, 24, 1, 6, hex_rgba("d6d0c0"))
    c.outline(OUTLINE)
    return c


def prop_sandcastle():
    """somebody's afternoon: three towers, a gate, a flag, a bucket"""
    c = Canvas(26, 22)
    sand = hex_rgba("e6cd97")
    sand_l = hex_rgba("f4e3b8")
    sand_d = hex_rgba("c2a56c")
    # towers
    for tx, top in ((2, 8), (10, 4), (19, 9)):
        w = 5 if tx != 10 else 6
        c.rect(tx, top, w, 21 - top, sand)
        c.rect(tx, top, w, 1, sand_l)
        c.rect(tx + w - 2, top, 2, 21 - top, sand_d)
        for i in range(tx, tx + w, 2):      # crenellations
            c.set(i, top - 1, sand)
            c.set(i, top - 2, sand)
    # curtain wall between them
    c.rect(6, 13, 15, 8, sand)
    c.rect(6, 13, 15, 1, sand_l)
    c.rect(6, 19, 15, 2, sand_d)
    # arched gate
    c.rect(12, 16, 4, 5, hex_rgba("8f7546"))
    c.set(12, 16, sand)
    c.set(15, 16, sand)
    # flag on the middle tower
    c.rect(12, 0, 1, 5, hex_rgba("8a683c"))
    c.rect(13, 0, 5, 3, hex_rgba("e8433c"))
    # bucket + spade beside it
    c.rect(22, 16, 4, 5, hex_rgba("3f7fc0"))
    c.rect(22, 16, 4, 1, hex_rgba("62a2dd"))
    c.rect(21, 12, 1, 5, hex_rgba("e8c74a"))
    c.rect(20, 10, 3, 3, hex_rgba("e8c74a"))
    c.outline(OUTLINE)
    return c


# ---------------------------------------------------------------------------
# MINI BOSTON 🦞 — the esplanade along the Charles
# ---------------------------------------------------------------------------

def prop_bandshell():
    """the Hatch Shell: a half-dome of concentric limestone arcs over a stage"""
    c = Canvas(52, 36)
    stone = hex_rgba("e4dcc6")
    stone_l = hex_rgba("f4eeda")
    stone_d = hex_rgba("bfb49a")
    dark = hex_rgba("3a3040")
    import math

    def arc(radius, y_base, fn):
        """walk a round arch from the crown down to the springing line —
        half-width = sqrt(r^2 - h^2), which bulges out fast under the crown
        (a sine profile here comes out looking like a tent)"""
        for j in range(radius + 1):
            h = radius - j
            half = int(round(math.sqrt(max(0, radius * radius - h * h))))
            fn(half, y_base - radius + j)

    # the shell itself
    arc(25, 30, lambda half, y: c.rect(26 - half, y, half * 2, 1, stone))
    # ribs — the Hatch Shell is a stack of concentric arches, and without them
    # a filled dome just reads as a tunnel
    for r in range(24, 8, -3):
        arc(r, 30, lambda half, y: (c.set(26 - half, y, stone_d),
                                    c.set(26 + half - 1, y, stone_d)))
        arc(r - 1, 30, lambda half, y: (c.set(26 - half, y, stone_l),
                                        c.set(26 + half - 1, y, stone_l)))
    # the stage mouth
    arc(14, 30, lambda half, y: c.rect(26 - half, y, half * 2, 1, dark))
    # stage floor + apron
    c.rect(8, 29, 36, 3, hex_rgba("9a7f5c"))
    c.rect(8, 31, 36, 1, hex_rgba("74603f"))
    c.rect(5, 32, 42, 3, stone)
    c.rect(5, 34, 42, 1, stone_d)
    c.outline(OUTLINE)
    return c


def prop_swanboat():
    """A swan boat. SHELVED — the river already has sailboats on it and two
    kinds of white thing bobbing around read as clutter. Kept because it's
    finished art: add `out["swanboat"] = prop_swanboat()` in main() and put it
    back in main.js's load list to bring it back (a lagoon would suit it)."""
    c = Canvas(34, 26)
    white = hex_rgba("fbf7ea")
    white_l = hex_rgba("ffffff")
    white_d = hex_rgba("cec7b4")
    hull = hex_rgba("e8dcc0")
    hull_d = hex_rgba("b8ac92")
    orange = hex_rgba("e8913c")
    wood = hex_rgba("9a7f5c")

    # ---- the swan shell at the stern
    BODY = [(20, 12), (18, 15), (17, 16), (17, 16), (17, 16), (18, 15),
            (19, 14), (20, 12), (21, 10)]
    for j, (x0, w) in enumerate(BODY):
        c.rect(x0, 8 + j, w, 1, white)
        c.rect(x0 + w - 3, 8 + j, 3, 1, white_d)
    c.rect(18, 8, 12, 1, white_l)
    # tail feathers flicking up at the back
    for i, ty in ((30, 9), (31, 8), (32, 10)):
        c.rect(i, ty, 2, 4, white_d)
    # wing scallops along the flank
    for i in range(19, 30, 3):
        c.set(i, 13, white_d)
        c.set(i + 1, 14, white_d)
    # ---- neck: an unbroken S from the head down to the shell. Walk it from
    # the head end so every row overlaps the next, and land the last row on
    # the body's own first row (y=8, x=20) — otherwise the head floats.
    for j, x in enumerate((15, 15, 16, 17, 18, 19, 20)):
        c.rect(x, 2 + j, 2, 1, white)
        c.set(x + 1, 2 + j, white_d)
    c.rect(12, 0, 5, 4, white)                 # head
    c.rect(12, 0, 5, 1, white_l)
    c.set(16, 3, white_d)
    c.rect(9, 1, 3, 2, orange)                 # beak
    c.set(10, 3, hex_rgba("c26f24"))
    c.set(14, 1, OUTLINE)                      # eye
    # ---- hull, riding low
    for j, (x0, w) in enumerate(((2, 30), (1, 32), (1, 32), (2, 30), (4, 26))):
        c.rect(x0, 17 + j, w, 1, hull if j < 3 else hull_d)
    c.rect(1, 19, 32, 1, hex_rgba("d6c9ae"))   # gunwale
    c.rect(5, 13, 11, 4, wood)                 # the pedal bench
    c.rect(5, 16, 11, 1, hex_rgba("74603f"))
    c.rect(6, 11, 2, 3, wood)
    c.outline(OUTLINE)
    return c


def prop_willow():
    """weeping willow — the trees that lean over the Charles"""
    c = Canvas(28, 40)
    trunk = hex_rgba("7a5f3e")
    trunk_d = hex_rgba("5a4529")
    leaf = hex_rgba("7fb356")
    leaf_l = hex_rgba("9fce74")
    leaf_d = hex_rgba("5d8c3d")
    c.rect(12, 22, 5, 17, trunk)
    c.rect(15, 22, 2, 17, trunk_d)
    c.rect(9, 36, 3, 3, trunk_d)               # root flare
    c.rect(17, 36, 3, 3, trunk_d)
    # crown
    for j in range(14):
        t = j / 13
        half = int(round(13 * (0.45 + 0.55 * (1 - (t - 0.55) ** 2 * 2.4))))
        half = max(4, min(13, half))
        c.rect(14 - half, 4 + j, half * 2, 1, leaf)
    for i in range(2, 27, 3):                  # dappled top
        c.set(i, 5 + (i % 3), leaf_l)
        c.set(i + 1, 8 + (i % 4), leaf_l)
    # drooping fronds, different lengths
    for i, ln in ((2, 7), (5, 12), (8, 9), (11, 14), (14, 10), (17, 15),
                  (20, 8), (23, 12), (25, 6)):
        c.rect(i, 17, 2, ln, leaf_d if i % 2 else leaf)
        c.set(i, 17 + ln, leaf_d)
    c.outline(OUTLINE)
    return c


def prop_esplsign():
    """park sign at the top of the esplanade path"""
    c = Canvas(60, 30)
    board = hex_rgba("4a6b52")
    board_l = hex_rgba("5f8464")
    board_d = hex_rgba("35503c")
    post = hex_rgba("8a683c")
    ink = hex_rgba("f6f2e2")
    for px in (14, 43):
        c.rect(px, 16, 3, 13, post)
        c.rect(px + 2, 16, 1, 13, hex_rgba("6e5230"))
    c.rect(1, 2, 58, 16, board)
    c.rect(1, 2, 58, 1, board_l)
    c.rect(1, 16, 58, 2, board_d)
    text3_centered(c, 30, 5, "CHARLES RIVER", ink)
    text3_centered(c, 30, 11, "ESPLANADE", ink)
    c.outline(OUTLINE)
    return c


# ---------------------------------------------------------------------------
# THE BIG HOUSE — her place in Santa Clarita (pool, palms, the works)
# ---------------------------------------------------------------------------

def prop_pool():
    """a kidney-ish swimming pool, 2 frames (shimmer). 80x48"""
    sheet = Canvas(160, 48)
    deck = hex_rgba("e4ddcd")
    deck_d = hex_rgba("c4bca9")
    coping = hex_rgba("f4f1e4")
    for fi in range(2):
        c = Canvas(80, 48)
        c.rect(0, 6, 80, 40, deck)
        c.rect(0, 44, 80, 2, deck_d)
        for j in range(8, 44, 6):          # deck slabs
            c.rect(0, j, 80, 1, deck_d)
        # water basin
        c.rect(6, 12, 68, 28, coping)
        c.rect(8, 14, 64, 24, C_SEA)
        c.rect(8, 14, 64, 3, C_SEA_D)
        c.rect(8, 35, 64, 3, C_SEA_D)
        # shimmer lines
        for j, y in enumerate(range(18, 36, 4)):
            off = (fi * 5 + j * 7) % 12
            for x in range(10 + off, 70, 12):
                c.rect(x, y, 5, 1, C_SEA_L)
                c.rect(x + 2, y + 1, 3, 1, C_SEA_L)
        # ladder
        c.rect(60, 10, 2, 6, hex_rgba("cfc7b6"))
        c.rect(66, 10, 2, 6, hex_rgba("cfc7b6"))
        c.rect(60, 12, 8, 1, hex_rgba("cfc7b6"))
        c.outline(OUTLINE)
        sheet.blit(c, fi * 80, 0)
    return sheet


def big_house():
    """Her house in Santa Clarita: wide, two storeys, tile roof, garage,
    balcony, and a warm porch light. 8 tiles wide, 3 tall."""
    wt, ht = 8, 3
    W = wt * 16
    roof_h = 20
    wallH = ht * 16
    H = roof_h + wallH + 2
    c = Canvas(W, H)
    wall = hex_rgba("f3e6cb")
    wall_d = hex_rgba("d6c5a4")
    roof = hex_rgba("c96a4a")
    roof_d = hex_rgba("9d4a33")
    roof_l = hex_rgba("e08a63")
    trim = hex_rgba("f8f4e8")
    win = hex_rgba("9fd6ef")
    win_hi = hex_rgba("e4f6ff")
    win_d = hex_rgba("6b9fbe")
    door = hex_rgba("7d5b34")
    door_d = hex_rgba("5e4326")

    # ---- terracotta barrel-tile roof: rows of half-pipes, ridge on top
    for j in range(roof_h):
        inset = max(0, (roof_h - 4 - j))
        c.rect(inset, j, W - inset * 2, 1, roof)
    for j in range(roof_h - 4):
        inset = max(0, (roof_h - 4 - j))
        x0, x1 = inset, W - inset
        for i in range(x0, x1):
            phase = (i - inset) % 5
            if phase == 0:
                c.set(i, j, roof_d)
            elif phase == 2:
                c.set(i, j, roof_l)
        if j % 4 == 3:                      # course lines
            c.rect(x0, j, x1 - x0, 1, roof_d)
    c.rect(roof_h - 5, 0, W - (roof_h - 5) * 2, 1, roof_l)   # ridge cap
    c.rect(0, roof_h - 4, W, 3, roof_d)
    c.rect(0, roof_h - 1, W, 1, OUTLINE)

    y0 = roof_h
    c.rect(0, y0, W, wallH, wall)
    c.rect(0, y0, W, 2, wall_d)
    # stucco speckle
    for j in range(y0 + 4, y0 + wallH, 5):
        for i in range((j % 10), W, 7):
            c.set(i, j, wall_d)

    # ---- upper floor: three windows + a little balcony
    for wx in (10, 40, 70):
        c.rect(wx, y0 + 5, 14, 13, OUTLINE)
        c.rect(wx + 1, y0 + 6, 12, 11, win)
        c.rect(wx + 1, y0 + 6, 12, 3, win_hi)
        c.rect(wx + 1, y0 + 13, 12, 3, win_d)
        c.rect(wx + 6, y0 + 6, 2, 11, trim)
        c.rect(wx + 1, y0 + 11, 12, 1, trim)
        c.rect(wx - 1, y0 + 18, 16, 1, trim)
    # balcony railing over the door
    c.rect(96, y0 + 5, 26, 13, OUTLINE)
    c.rect(97, y0 + 6, 24, 11, win)
    c.rect(97, y0 + 6, 24, 3, win_hi)
    c.rect(97, y0 + 13, 24, 3, win_d)
    c.rect(108, y0 + 6, 2, 11, trim)
    c.rect(94, y0 + 18, 30, 2, trim)
    for i in range(95, 123, 4):
        c.rect(i, y0 + 20, 2, 5, trim)
    c.rect(94, y0 + 24, 30, 2, trim)

    # ---- ground floor: garage (left), door (center-right), big window
    c.rect(6, y0 + 28, 40, 20, OUTLINE)
    c.rect(7, y0 + 29, 38, 18, hex_rgba("e0d8c8"))
    for j in range(y0 + 31, y0 + 47, 4):
        c.rect(7, j, 38, 1, hex_rgba("bfb6a3"))
    c.rect(7, y0 + 29, 38, 2, hex_rgba("f4f1e4"))

    dx = 100
    dy = y0 + wallH - 18
    c.rect(dx - 3, dy - 3, 20, 3, trim)
    c.rect(dx - 1, dy - 1, 16, 19, OUTLINE)
    c.rect(dx, dy, 14, 18, door)
    c.rect(dx + 1, dy + 2, 12, 6, door_d)
    c.rect(dx + 1, dy + 10, 12, 5, door_d)
    c.set(dx + 11, dy + 9, hex_rgba("e8c74a"))
    # porch lamps
    for lx in (dx - 8, dx + 18):
        c.rect(lx, dy + 2, 4, 5, hex_rgba("f0d264"))
        c.rect(lx, dy + 1, 4, 1, OUTLINE)
    # big living-room window right of the door
    c.rect(58, y0 + 30, 30, 16, OUTLINE)
    c.rect(59, y0 + 31, 28, 14, win)
    c.rect(59, y0 + 31, 28, 4, win_hi)
    c.rect(59, y0 + 41, 28, 4, win_d)
    c.rect(72, y0 + 31, 2, 14, trim)

    c.rect(0, y0 + wallH - 3, W, 3, wall_d)
    c.outline(OUTLINE)
    return c


def jack_house():
    """Jack's place, a few streets down: long low ranch with a shingled gable,
    sage board-and-batten siding, a covered porch and a stone chimney.
    Same 8x3 footprint as her house, deliberately a different animal."""
    wt, ht = 8, 3
    W = wt * 16
    roof_h = 22
    wallH = ht * 16
    H = roof_h + wallH + 2
    c = Canvas(W, H)
    wall = hex_rgba("8fa77e")          # sage board-and-batten
    wall_d = hex_rgba("6e8560")
    wall_l = hex_rgba("a8be96")
    roof = hex_rgba("5c5148")          # cedar shingles
    roof_d = hex_rgba("453c35")
    roof_l = hex_rgba("74675c")
    trim = hex_rgba("f4efdf")
    win = hex_rgba("9fd6ef")
    win_hi = hex_rgba("e4f6ff")
    win_d = hex_rgba("6b9fbe")
    door = hex_rgba("4f7a52")
    door_d = hex_rgba("3a5c3d")
    stone = hex_rgba("9a968f")
    stone_d = hex_rgba("74716b")

    # ---- chimney behind the roof (drawn first so shingles overlap its base)
    c.rect(14, 0, 14, roof_h, stone)
    c.rect(14, 0, 14, 2, stone_d)
    for j in range(3, roof_h, 4):
        c.rect(14, j, 14, 1, stone_d)
    c.rect(16, 2, 3, 3, hex_rgba("bab6ae"))

    # ---- gabled shingle roof (steeper than hers, with a centre gable)
    for j in range(roof_h):
        inset = max(0, (roof_h - 6 - j) * 2)
        if inset >= W // 2:
            continue
        c.rect(inset, j, W - inset * 2, 1, roof)
        if j % 3 == 2:                       # shingle courses
            c.rect(inset, j, W - inset * 2, 1, roof_d)
        for i in range(inset + (j % 6), W - inset, 6):
            c.set(i, j, roof_l)
    c.rect(0, roof_h - 3, W, 3, roof_d)
    c.rect(0, roof_h - 1, W, 1, OUTLINE)

    y0 = roof_h
    c.rect(0, y0, W, wallH, wall)
    c.rect(0, y0, W, 2, wall_d)
    for i in range(3, W, 7):                 # vertical battens
        c.rect(i, y0 + 2, 1, wallH - 4, wall_l)

    # ---- chimney continues down the left wall
    c.rect(14, y0, 14, wallH, stone)
    for j in range(y0 + 2, y0 + wallH, 4):
        c.rect(14, j, 14, 1, stone_d)
        for i in range(14 + (j % 8) // 4 * 4, 28, 8):
            c.rect(i, j - 3, 1, 3, stone_d)

    # ---- windows: two big ones left, a wide one right of the porch
    for wx, ww in ((32, 20), (56, 14), (108, 14)):
        c.rect(wx, y0 + 8, ww, 15, OUTLINE)
        c.rect(wx + 1, y0 + 9, ww - 2, 13, win)
        c.rect(wx + 1, y0 + 9, ww - 2, 3, win_hi)
        c.rect(wx + 1, y0 + 18, ww - 2, 3, win_d)
        c.rect(wx + ww // 2 - 1, y0 + 9, 2, 13, trim)
        c.rect(wx - 1, y0 + 23, ww + 2, 1, trim)
        # window box of flowers ♥
        c.rect(wx - 1, y0 + 24, ww + 2, 4, hex_rgba("8a683c"))
        c.rect(wx - 1, y0 + 24, ww + 2, 1, hex_rgba("b08a56"))
        for i in range(wx, wx + ww, 4):
            c.rect(i, y0 + 22, 2, 2, C_LEAF)
            c.set(i + 1, y0 + 21, hex_rgba("f278a2") if i % 8 else hex_rgba("f0d264"))

    # ---- covered porch: posts + beam + the front door
    py = y0 + 18
    c.rect(72, py, 40, 3, trim)                 # beam
    c.rect(72, py + 3, 40, 1, hex_rgba("cfc7b6"))
    for px in (73, 106):
        c.rect(px, py + 3, 4, wallH - 21, trim)
        c.rect(px + 3, py + 3, 1, wallH - 21, hex_rgba("cfc7b6"))
    dx, dh = 84, 20
    dy = y0 + wallH - dh
    c.rect(dx - 2, dy - 3, 18, 3, trim)
    c.rect(dx - 1, dy - 1, 16, dh + 1, OUTLINE)
    c.rect(dx, dy, 14, dh, door)
    c.rect(dx + 2, dy + 3, 10, 6, door_d)
    c.rect(dx + 3, dy + 4, 8, 4, win)           # little window in the door
    c.set(dx + 11, dy + 12, hex_rgba("e8c74a"))
    # porch light + a hanging plant off the beam
    c.rect(80, py + 5, 3, 4, hex_rgba("f0d264"))
    c.rect(101, py + 4, 6, 3, hex_rgba("c2704e"))
    c.rect(102, py + 7, 4, 3, C_LEAF_D)
    c.rect(101, py + 6, 6, 2, C_LEAF)
    # porch step
    c.rect(dx - 5, y0 + wallH - 3, 24, 3, hex_rgba("cfc7b6"))

    c.rect(0, y0 + wallH - 2, W, 2, wall_d)
    c.outline(OUTLINE)
    return c


# ---------------------------------------------------------------------------
# THE GARDEN 🌻 — Jack's plot: raised beds, corn, sunflowers, a fire pit
# ---------------------------------------------------------------------------

def _leaf_blob(c, x, y, main, dark, light, r=4):
    """a round bushy plant"""
    for j in range(-r, r + 1):
        w = max(0, r - (abs(j) + 1) // 2)
        c.rect(x - w, y + j, w * 2 + 1, 1, main)
    c.rect(x - r + 1, y - r + 2, 2, 1, light)
    c.set(x - 1, y - r + 1, light)
    c.set(x + r - 2, y + r - 2, dark)
    c.set(x + 1, y + 1, dark)


def prop_vegbed(kind=0):
    """raised bed — tomatoes on stakes + lettuce, or carrots + peppers"""
    c = Canvas(40, 28)
    soil = hex_rgba("58402c")
    soil_d = hex_rgba("43301f")
    soil_l = hex_rgba("6d5138")
    wood = hex_rgba("b08a56")
    wood_d = hex_rgba("8a683c")
    stake = hex_rgba("c9a066")

    c.rect(2, 13, 36, 11, soil)
    c.rect(2, 13, 36, 2, soil_l)
    for i in range(3, 37, 5):
        c.set(i, 17 + (i % 3), soil_d)
        c.set(i + 2, 20 - (i % 2), soil_d)

    if kind == 0:
        for sx in (8, 30):                       # tomato vines up two stakes
            c.rect(sx, 1, 1, 15, stake)
            for j in range(3, 15, 3):
                c.rect(sx - 3, j, 7, 1, C_LEAF_D)
                c.rect(sx - 2, j - 1, 5, 1, C_LEAF)
            for j, dx in ((5, -4), (9, 3), (12, -3)):
                c.rect(sx + dx, j, 3, 3, hex_rgba("d8452f"))
                c.set(sx + dx, j, hex_rgba("f06a4a"))
        for lx, ly in ((18, 11), (25, 12), (15, 17), (21, 18), (29, 17)):
            _leaf_blob(c, lx, ly, C_LEAF, C_LEAF_D, C_LEAF_L, 4)
    else:
        for x in range(6, 37, 6):                # carrot tops
            for j in range(6):
                c.set(x + j - 3, 13 - j, C_LEAF_D)
                c.set(x - j + 3, 13 - j, C_LEAF)
                c.set(x, 12 - j, C_LEAF_L)
            c.rect(x - 2, 12, 5, 2, C_LEAF)
        for px, py in ((11, 18), (23, 19), (33, 18)):
            _leaf_blob(c, px, py, C_LEAF_D, C_LEAF_D, C_LEAF, 3)
            c.rect(px - 1, py + 1, 3, 5, hex_rgba("e8913c"))
            c.set(px - 1, py + 1, hex_rgba("f4b06a"))

    # the frame goes on last so the plants read as sitting inside it
    c.rect(0, 19, 40, 6, wood)
    c.rect(0, 19, 40, 1, hex_rgba("cba274"))
    c.rect(0, 22, 40, 1, wood_d)
    c.rect(0, 24, 40, 2, wood_d)
    for i in (0, 37):
        c.rect(i, 17, 3, 9, wood_d)
        c.rect(i, 17, 3, 1, wood)
    c.outline(OUTLINE)
    return c


def prop_corn():
    c = Canvas(24, 38)
    stalk = hex_rgba("6aa84f")
    stalk_d = hex_rgba("4d7f39")
    silk = hex_rgba("e8c74a")
    for i, (x, top) in enumerate(((4, 8), (12, 2), (19, 11))):
        c.rect(x, top, 2, 38 - top, stalk)
        c.rect(x, top, 1, 38 - top, stalk_d)
        for j in range(4):                       # tassel
            c.set(x - 1 + j % 2, top - 4 + j, silk)
            c.set(x + 2 - j % 2, top - 3 + j, silk)
        for kk, ly in enumerate(range(top + 5, 34, 7)):
            side = -1 if (kk + i) % 2 == 0 else 1
            for j in range(6):
                c.set(x + side * (j + 1), ly + j // 2, C_LEAF_D if j % 2 else C_LEAF)
                c.set(x + side * (j + 1), ly + j // 2 + 1, C_LEAF)
        if i != 2:                               # an ear, husk peeled back
            ey = top + 15
            c.rect(x + 2, ey, 3, 8, hex_rgba("f0d264"))
            c.rect(x + 2, ey, 1, 8, hex_rgba("d8b03c"))
            c.rect(x + 1, ey - 2, 4, 3, C_LEAF_D)
    c.outline(OUTLINE)
    return c


def prop_sunflower():
    c = Canvas(22, 38)
    stem = hex_rgba("5f9440")
    stem_d = hex_rgba("47772f")
    petal = hex_rgba("f5c542")
    petal_d = hex_rgba("d99b1f")
    heart = hex_rgba("6b4423")
    heart_d = hex_rgba("4d2f18")
    for x, top in ((5, 10), (15, 4), (10, 19)):
        cy = top + 2
        c.rect(x, cy, 2, 38 - cy, stem)
        c.rect(x, cy, 1, 38 - cy, stem_d)
        for ly, side in ((cy + 10, -1), (cy + 16, 1)):
            for j in range(5):
                px = x + (2 + j if side > 0 else -1 - j)
                c.rect(px, ly + j // 2, 1, 3 - j // 3, C_LEAF if j % 2 else C_LEAF_D)
        for j in range(-6, 7):                   # petals
            w = 6 - abs(j) // 2
            c.rect(x - w + 1, cy + j, w * 2, 1, petal)
        for j in range(-4, 5):
            w = 4 - abs(j) // 3
            c.rect(x - w + 1, cy + j, w * 2, 1, petal_d)
        for j in range(-3, 4):
            c.rect(x - 2, cy + j, 6, 1, heart)
        c.rect(x - 1, cy - 2, 3, 3, heart_d)
        c.set(x + 2, cy + 2, heart_d)
    c.outline(OUTLINE)
    return c


def prop_firepit():
    """stone ring, crossed logs, and a proper fire — 2 frames of flicker"""
    sheet = Canvas(72, 30)
    stone = hex_rgba("9a968f")
    stone_d = hex_rgba("74716b")
    stone_l = hex_rgba("bab6ae")
    ash = hex_rgba("4a4542")
    log = hex_rgba("7a5636")
    log_d = hex_rgba("583d26")
    for fi in range(2):
        c = Canvas(36, 30)
        c.rect(4, 14, 28, 12, ash)                 # the pit
        c.rect(6, 12, 24, 4, ash)
        for i, (sx, sy, w, h) in enumerate(         # back of the ring
                ((1, 12, 8, 8), (8, 10, 8, 8), (15, 9, 8, 8),
                 (22, 10, 8, 8), (28, 12, 7, 8))):
            c.rect(sx, sy, w, h, stone if i % 2 == 0 else stone_l)
            c.rect(sx, sy + h - 2, w, 2, stone_d)
        c.rect(8, 20, 20, 4, log)                   # logs
        c.rect(8, 23, 20, 1, log_d)
        c.rect(11, 16, 14, 5, log_d)
        c.rect(11, 16, 14, 1, log)
        flame = ["....##....", "...####...", "...####...", "..#####...",
                 "..######..", ".#######..", ".########.", "##########",
                 ".########.", "..######.."] if fi == 0 else \
                ["...##.....", "..####....", "..####....", "..#####...",
                 ".######...", ".#######..", "#########.", "##########",
                 ".#######..", "..#####..."]
        for j, row in enumerate(flame):
            for i, ch in enumerate(row):
                if ch == "#":
                    c.set(13 + i, 6 + j,
                          hex_rgba("f4d24a") if j < 4 else
                          (hex_rgba("f0a03c") if j < 8 else hex_rgba("e8556a")))
        for i, (sx, sy, w, h) in enumerate(         # front of the ring, on top
                ((0, 18, 8, 9), (7, 20, 9, 9), (15, 21, 9, 9),
                 (23, 20, 9, 9), (30, 18, 6, 9))):
            c.rect(sx, sy, w, h, stone_l if i % 2 == 0 else stone)
            c.rect(sx, sy + h - 2, w, 2, stone_d)
        c.outline(OUTLINE)
        sheet.blit(c, fi * 36, 0)
    return sheet


def prop_logseat():
    c = Canvas(24, 14)
    bark = hex_rgba("7a5636")
    bark_d = hex_rgba("583d26")
    ring = hex_rgba("c9a066")
    ring_d = hex_rgba("a37f47")
    c.rect(1, 2, 22, 8, bark)
    c.rect(1, 8, 22, 3, bark_d)
    for i in range(3, 21, 4):
        c.rect(i, 3, 1, 5, bark_d)
    c.rect(18, 1, 5, 10, ring)                   # sawn end
    c.rect(19, 3, 3, 6, ring_d)
    c.set(20, 5, ring)
    c.rect(3, 10, 3, 3, bark_d)                  # feet
    c.rect(16, 10, 3, 3, bark_d)
    c.outline(OUTLINE)
    return c


def prop_hammock():
    c = Canvas(46, 32)
    post = hex_rgba("8a683c")
    post_d = hex_rgba("6a4d2a")
    rope = hex_rgba("efe4cc")
    stripes = [hex_rgba("e8556a"), hex_rgba("f0d264"), hex_rgba("4f8f8a"), hex_rgba("efe4cc")]
    for x in (1, 40):
        c.rect(x, 4, 5, 25, post)
        c.rect(x + 3, 4, 2, 25, post_d)
        c.rect(x - 1, 27, 7, 3, post_d)
    for i in range(6, 40):
        u = (i - 6) / 33.0
        y = 6 + int(12 * (1 - (2 * u - 1) ** 2))
        if i < 10 or i > 35:
            c.rect(i, y, 1, 2, rope)
        else:
            col = stripes[(i // 3) % 4]
            c.rect(i, y, 1, 7, col)
            c.rect(i, y + 6, 1, 1, tuple(max(0, v - 45) for v in col[:3]) + (255,))
    c.outline(OUTLINE)
    return c


def prop_trellis():
    c = Canvas(30, 40)
    wood = hex_rgba("c9a066")
    wood_d = hex_rgba("9a744c")
    for x in (3, 13, 23):
        c.rect(x, 2, 2, 36, wood)
        c.rect(x + 1, 2, 1, 36, wood_d)
    for y in range(5, 38, 7):
        c.rect(2, y, 25, 2, wood)
        c.rect(2, y + 1, 25, 1, wood_d)
    path = [4, 5, 6, 8, 10, 12, 14, 15, 16, 17, 18, 20, 22, 23, 24, 24, 23, 22,
            20, 18, 16, 14, 12, 10, 8, 7, 6, 5, 5, 6, 8, 10, 12, 14, 16, 18]
    for j, x in enumerate(path):
        y = 3 + j
        c.set(x, y, C_LEAF_D)
        c.set(x + 1, y, C_LEAF)
        if j % 4 == 0:
            c.rect(x - 3, y, 3, 2, C_LEAF)
            c.rect(x + 2, y - 1, 3, 2, C_LEAF_L)
        if j % 9 == 5:
            c.rect(x + 2, y + 1, 2, 3, hex_rgba("d8452f"))
    c.outline(OUTLINE)
    return c


def prop_herbpots():
    c = Canvas(28, 20)
    pot = hex_rgba("c2704e")
    pot_d = hex_rgba("9a5238")
    pot_l = hex_rgba("d88a68")
    for i, (x, w, h) in enumerate(((1, 10, 9), (12, 8, 7), (21, 6, 6))):
        top = 19 - h
        c.rect(x, top, w, h, pot)
        c.rect(x, top, w, 2, pot_l)
        c.rect(x, top + h - 2, w, 2, pot_d)
        _leaf_blob(c, x + w // 2, top - 3, C_LEAF if i != 1 else C_LEAF_D,
                   C_LEAF_D, C_LEAF_L, 3 + (1 if i == 0 else 0))
    c.outline(OUTLINE)
    return c


def prop_dreamcatcher():
    """a dreamcatcher on a shepherd's hook, turning slowly in the yard"""
    c = Canvas(20, 36)
    post = hex_rgba("8a683c")
    post_d = hex_rgba("6a4d2a")
    hoop = hex_rgba("c9884a")
    hoop_d = hex_rgba("9a5f2c")
    web = hex_rgba("f4ead6")
    bead = hex_rgba("4f8f8a")
    c.rect(14, 2, 3, 32, post)                  # post
    c.rect(16, 2, 1, 32, post_d)
    c.rect(12, 33, 7, 3, post_d)
    c.rect(6, 1, 9, 2, post)                    # the hook arm
    c.rect(6, 3, 9, 1, post_d)
    c.rect(5, 1, 2, 4, post)
    c.rect(6, 4, 1, 3, hoop_d)                  # the cord down to the hoop
    # the hoop: a ring of 12 px around (6, 13) with radius 6
    ring = [(6, 7), (8, 8), (10, 9), (11, 11), (12, 13), (11, 15), (10, 17),
            (8, 18), (6, 19), (4, 18), (2, 17), (1, 15), (0, 13), (1, 11),
            (2, 9), (4, 8)]
    for i, (x, y) in enumerate(ring):
        c.rect(x, y, 2, 2, hoop if i % 2 else hoop_d)
    for j in range(-4, 5):                      # the web inside
        c.set(6 + j, 13 + (abs(j) // 2), web)
        c.set(6 + j, 13 - (abs(j) // 2), web)
    c.rect(5, 12, 2, 2, bead)
    for x, h in ((2, 5), (6, 7), (10, 4)):      # feathers
        c.rect(x, 20, 1, h, web)
        c.rect(x - 1, 20 + h, 3, 4, hex_rgba("e8dcc8"))
        c.set(x, 21 + h, hex_rgba("c9b48c"))
        c.set(x, 23 + h, hex_rgba("c9b48c"))
    c.outline(OUTLINE)
    return c


def prop_bus():
    """the van. of course they have a van."""
    c = Canvas(46, 30)
    body = hex_rgba("4f9e8f")
    body_d = hex_rgba("3a7a6e")
    cream = hex_rgba("f2ead8")
    cream_d = hex_rgba("d6cdb8")
    glass = hex_rgba("9fd6ef")
    glass_d = hex_rgba("6b9fbe")
    tire = hex_rgba("2f2c34")
    hub = hex_rgba("cfc7b6")
    c.rect(3, 1, 40, 12, cream)                  # roof + upper half
    c.rect(3, 1, 40, 2, hex_rgba("fdf8ec"))
    c.rect(2, 12, 42, 11, body)
    c.rect(2, 20, 42, 3, body_d)
    for x, w in ((5, 12), (19, 9), (30, 11)):    # windows
        c.rect(x, 4, w, 8, glass)
        c.rect(x, 9, w, 3, glass_d)
        c.rect(x, 4, w, 2, hex_rgba("dff2ff"))
    c.rect(17, 4, 2, 8, cream_d)
    c.rect(28, 4, 2, 8, cream_d)
    c.rect(19, 4, 4, 8, hex_rgba("e8913c"))      # a curtain, half drawn
    for i, col in enumerate((hex_rgba("e8556a"), hex_rgba("f0a03c"), hex_rgba("f0d264"),
                             hex_rgba("6aa84f"), hex_rgba("6f9ec4"))):
        c.rect(5 + i * 2, 13, 2, 9, col)         # rainbow stripe ♥
    c.rect(29, 13, 10, 9, cream)                 # peace sign
    c.rect(30, 14, 8, 7, body_d)
    c.rect(33, 14, 2, 7, cream)
    for j in range(3):
        c.rect(31 + j, 18 + j, 2, 1, cream)
        c.rect(35 - j + 2, 18 + j, 2, 1, cream)
    c.rect(2, 22, 42, 2, hex_rgba("d8d4c8"))     # bumper
    for wx in (7, 31):                           # wheels
        c.rect(wx, 21, 9, 8, tire)
        c.rect(wx + 2, 23, 5, 4, hub)
        c.rect(wx + 3, 24, 3, 2, hex_rgba("9c948a"))
    c.rect(41, 15, 3, 3, hex_rgba("f0d264"))     # headlight
    c.outline(OUTLINE)
    return c


# ---------------------------------------------------------------------------
# INTERIORS — furniture props for the house scenes
# ---------------------------------------------------------------------------

C_FLOOR = hex_rgba("cba274")
C_FLOOR_D = hex_rgba("a9814f")
C_FLOOR_L = hex_rgba("e0bd92")
C_WALLI = hex_rgba("f2e6d4")
C_WALLI_D = hex_rgba("d6c5aa")
C_WAINS = hex_rgba("bf9468")
C_WAINS_D = hex_rgba("9a744c")
C_RUG = hex_rgba("de89a2")
C_RUG_D = hex_rgba("bc6484")
C_KTILE = hex_rgba("ece7dd")
C_KTILE_D = hex_rgba("cbc5b8")


def tile_wood(seed=2):
    c = Canvas(16, 16)
    c.rect(0, 0, 16, 16, C_FLOOR)
    n = seed
    for j in (0, 5, 10, 15):
        c.rect(0, j, 16, 1, C_FLOOR_D)
    # plank seams, offset per row
    for j, x in ((0, 4 + seed % 5), (5, 11 - seed % 4), (10, 7)):
        c.rect(x, j + 1, 1, 4, C_FLOOR_D)
    for _ in range(5):
        n = (n * 1103515245 + 12345) & 0x7FFFFFFF
        c.set(n % 16, (n // 16) % 16, C_FLOOR_L)
    return c


def tile_rugf(kind=0):
    c = Canvas(16, 16)
    if kind == 0:
        c.rect(0, 0, 16, 16, C_RUG)
        for j in range(2, 16, 4):
            c.rect(0, j, 16, 1, C_RUG_D)
    else:  # rug edge/border tile
        c.rect(0, 0, 16, 16, C_RUG_D)
        c.rect(0, 2, 16, 12, C_RUG)
        c.rect(3, 5, 10, 6, hex_rgba("f4c3d2"))
    return c


def tile_ktile():
    c = Canvas(16, 16)
    for j in range(2):
        for i in range(2):
            col = C_KTILE if (i + j) % 2 == 0 else C_KTILE_D
            c.rect(i * 8, j * 8, 8, 8, col)
    c.rect(0, 7, 16, 1, hex_rgba("bdb7aa"))
    c.rect(7, 0, 1, 16, hex_rgba("bdb7aa"))
    return c


def tile_walltop():
    """upper wall / wallpaper — striped, with a picture rail"""
    c = Canvas(16, 16)
    c.rect(0, 0, 16, 16, C_WALLI)
    for i in range(1, 16, 5):
        c.rect(i, 0, 1, 16, C_WALLI_D)
    c.rect(0, 13, 16, 2, C_WAINS)
    c.rect(0, 15, 16, 1, C_WAINS_D)
    return c


def tile_wallface():
    """lower wall (the solid face the player bumps into)"""
    c = Canvas(16, 16)
    c.rect(0, 0, 16, 16, C_WALLI)
    for i in range(1, 16, 5):
        c.rect(i, 0, 1, 16, C_WALLI_D)
    c.rect(0, 10, 16, 4, C_WAINS)
    c.rect(0, 10, 16, 1, hex_rgba("d8ab7c"))
    c.rect(0, 14, 16, 2, C_WAINS_D)
    return c


def tile_wallwin():
    c = tile_wallface()
    c.rect(2, 1, 12, 10, OUTLINE)
    c.rect(3, 2, 10, 8, hex_rgba("9fd6ef"))
    c.rect(3, 2, 10, 3, hex_rgba("dff2ff"))
    c.rect(7, 2, 2, 8, hex_rgba("f4f1e4"))
    c.rect(3, 5, 10, 1, hex_rgba("f4f1e4"))
    return c


def tile_wallpic():
    """framed family photo on the wall ♥"""
    c = tile_wallface()
    c.rect(3, 1, 10, 9, hex_rgba("8a683c"))
    c.rect(4, 2, 8, 7, hex_rgba("f4f1e4"))
    c.rect(5, 5, 2, 3, hex_rgba("f278a2"))
    c.rect(8, 4, 2, 4, hex_rgba("2f7f6f"))
    c.rect(5, 3, 2, 2, hex_rgba("e5b954"))
    c.rect(8, 3, 2, 1, hex_rgba("2e2226"))
    return c


def tile_boho(kind=0):
    """woven kilim rug for the garden house — earthy, stripey, a bit hippy"""
    c = Canvas(16, 16)
    base = hex_rgba("c9784e")
    dark = hex_rgba("9c5334")
    cream = hex_rgba("efdcb4")
    teal = hex_rgba("4f8f8a")
    c.rect(0, 0, 16, 16, base)
    if kind == 0:
        for j in range(0, 16, 4):
            c.rect(0, j, 16, 1, dark)
        for j in range(2, 16, 4):
            for i in range(1, 16, 4):
                c.set(i, j, cream)
                c.set(i + 1, j, teal)
    else:   # diamond block
        c.rect(0, 1, 16, 14, dark)
        for j in range(7):
            c.rect(7 - j, 1 + j, 2 + j * 2, 1, cream)
        for j in range(7):
            c.rect(1 + j, 8 + j, 14 - j * 2, 1, teal)
        c.rect(0, 0, 16, 1, base)
        c.rect(0, 15, 16, 1, base)
    return c


def tile_wallmac():
    """macramé wall hanging — a dowel, knotted cotton, a fringe"""
    c = tile_wallface()
    cord = hex_rgba("f4ead6")
    cord_d = hex_rgba("c8b795")
    dowel = hex_rgba("b08a56")
    c.rect(1, 1, 14, 2, dowel)
    c.rect(1, 2, 14, 1, hex_rgba("8a683c"))
    for i in range(2, 15, 2):
        c.rect(i, 3, 1, 3, cord)
    for j, (x0, w) in enumerate(((2, 12), (3, 10), (4, 8))):
        c.rect(x0, 5 + j * 2, w, 1, cord_d)
        c.rect(x0, 6 + j * 2, w, 1, cord)
    for i in range(3, 14, 2):
        c.rect(i, 11, 1, 4, cord)
        c.set(i, 14, cord_d)
    return c


def tile_wallherb():
    """a little wall shelf: jars of dried herbs and a trailing pothos"""
    c = tile_wallface()
    shelf = hex_rgba("9a744c")
    glass = hex_rgba("bcd8c8")
    c.rect(1, 7, 14, 2, shelf)
    c.rect(1, 9, 14, 1, hex_rgba("74512d"))
    for x, col in ((2, glass), (6, hex_rgba("d8c48c")), (10, hex_rgba("cf9f8c"))):
        c.rect(x, 3, 3, 4, col)
        c.rect(x, 2, 3, 1, hex_rgba("b08a56"))
    c.rect(13, 2, 2, 5, C_LEAF)
    for j in range(10, 15):
        c.set(12 + (j % 2), j, C_LEAF_D)
    c.rect(2, 10, 3, 2, C_LEAF)
    c.set(3, 12, C_LEAF_D)
    return c


def tile_indoor():
    """the front door, seen from inside"""
    c = tile_wallface()
    c.rect(2, 0, 12, 16, OUTLINE)
    c.rect(3, 1, 10, 15, hex_rgba("7d5b34"))
    c.rect(4, 3, 8, 5, hex_rgba("5e4326"))
    c.rect(4, 10, 8, 4, hex_rgba("5e4326"))
    c.set(11, 9, hex_rgba("e8c74a"))
    return c


# ---------------------------------------------------------------------------
# THE BURGER PLACE 🍔 — its own tile set. Reusing the house's wallpaper and
# floorboards in here made it read as somebody's living room with a till in it.
# ---------------------------------------------------------------------------

IO_TILE = hex_rgba("f4f1e6")            # white wall/floor tile
IO_TILE_L = hex_rgba("fdfbf3")
IO_GROUT = hex_rgba("d9d3c2")
IO_CHK = hex_rgba("c04a3e")             # the diner red, muted so a whole floor
IO_CHK_D = hex_rgba("a13a30")           # of it doesn't shout over the booths


def tile_checker(kind=0):
    """One whole tile per square, so the checkerboard has a 16px pitch. At 8px
    it read as noise and the red booths sank into the floor."""
    c = Canvas(16, 16)
    red = kind == 1
    c.rect(0, 0, 16, 16, IO_CHK if red else IO_TILE)
    if red:
        c.rect(0, 0, 16, 1, hex_rgba("cf584b"))
        c.rect(0, 15, 16, 1, IO_CHK_D)
        c.rect(15, 0, 1, 16, IO_CHK_D)
        for i, j in ((3, 5), (11, 9), (7, 13)):      # a little wear
            c.set(i, j, hex_rgba("b5443a"))
    else:
        c.rect(0, 0, 16, 1, IO_TILE_L)
        c.rect(0, 15, 16, 1, IO_GROUT)
        c.rect(15, 0, 1, 16, IO_GROUT)
        for i, j in ((5, 4), (12, 11)):
            c.set(i, j, hex_rgba("e9e4d4"))
    return c


def _io_wall(stripe):
    """white subway tile. `stripe` adds the red band that runs the room."""
    c = Canvas(16, 16)
    c.rect(0, 0, 16, 16, IO_TILE)
    for j in range(0, 16, 4):                       # brick-bond grout
        c.rect(0, j + 3, 16, 1, IO_GROUT)
        c.rect(((j // 4) % 2) * 8, j, 1, 3, IO_GROUT)
        c.rect(((j // 4) % 2) * 8 + 8, j, 1, 3, IO_GROUT)
    if stripe:
        c.rect(0, 9, 16, 4, IO_CHK)
        c.rect(0, 9, 16, 1, hex_rgba("d75f50"))
        c.rect(0, 12, 16, 1, IO_CHK_D)
        c.rect(0, 14, 16, 2, IO_GROUT)              # skirting
    return c


def tile_io_top():
    return _io_wall(False)


def tile_io_face():
    return _io_wall(True)


def tile_io_win():
    """the wall of glass every In-N-Out has, with a palm outside it"""
    c = _io_wall(True)
    c.rect(1, 0, 14, 10, OUTLINE)
    c.rect(2, 1, 12, 8, hex_rgba("9fd6ef"))
    c.rect(2, 1, 12, 3, hex_rgba("dff2ff"))
    # a palm out in the lot, because of course there is one
    pal_s = hex_rgba("6b9fbe")
    c.rect(8, 4, 1, 5, pal_s)                       # trunk
    c.rect(4, 3, 9, 1, pal_s)                       # fronds, drooping at the tips
    c.set(3, 4, pal_s)
    c.set(13, 4, pal_s)
    c.set(5, 2, pal_s)
    c.set(11, 2, pal_s)
    c.rect(1, 9, 14, 1, hex_rgba("f8f5ea"))         # sill
    return c


def tile_io_counter():
    """The service counter as a *tile*, so it can run the width of the room and
    actually be solid. A 5-tile prop left gaps at both ends that she could walk
    through into the fry station."""
    c = Canvas(16, 16)
    steel = hex_rgba("cfd4d9")
    steel_l = hex_rgba("eef1f4")
    steel_d = hex_rgba("9aa1a9")
    c.rect(0, 0, 16, 4, hex_rgba("e8ebee"))     # the top she leans on
    c.rect(0, 0, 16, 1, hex_rgba("fbfdff"))
    c.rect(0, 3, 16, 2, steel_d)
    c.rect(0, 5, 16, 8, steel)                  # fluted stainless front
    for i in range(0, 16, 4):
        c.rect(i, 5, 1, 8, steel_l)
        c.rect(i + 1, 5, 1, 8, steel_d)
    c.rect(0, 13, 16, 2, IN_RED)                # the red kick rail
    c.rect(0, 15, 16, 1, IN_RED_D)
    return c


def tile_io_door():
    """the glass door, from inside — the tile below it is the way out"""
    c = _io_wall(True)
    c.rect(1, 0, 14, 16, OUTLINE)
    c.rect(2, 1, 12, 14, hex_rgba("aedcf0"))
    c.rect(2, 1, 12, 3, hex_rgba("e8f8ff"))
    c.rect(7, 1, 2, 14, IO_TILE)                    # centre stile
    c.rect(2, 8, 5, 1, IN_RED)                      # push bars
    c.rect(9, 8, 5, 1, IN_RED)
    return c


def in_ordercounter():
    """SUPERSEDED by tile_io_counter — a 5-tile prop can't span the room, and
    the gaps at its ends let her walk into the kitchen. Kept for reference."""
    c = Canvas(80, 30)
    steel = hex_rgba("cfd4d9")
    steel_l = hex_rgba("eef1f4")
    steel_d = hex_rgba("9aa1a9")
    top = hex_rgba("e8ebee")
    red = IN_RED
    # counter top + stainless front with vertical flutes
    c.rect(0, 6, 80, 5, top)
    c.rect(0, 6, 80, 1, hex_rgba("fbfdff"))
    c.rect(0, 10, 80, 2, steel_d)
    c.rect(0, 12, 80, 16, steel)
    for i in range(2, 79, 4):
        c.rect(i, 12, 1, 15, steel_l)
        c.rect(i + 1, 12, 1, 15, steel_d)
    c.rect(0, 24, 80, 2, red)                   # the red kick rail
    c.rect(0, 26, 80, 2, steel_d)
    # till
    c.rect(50, 0, 18, 7, hex_rgba("e6e2d6"))
    c.rect(50, 0, 18, 1, hex_rgba("f6f3e7"))
    c.rect(52, 1, 14, 3, hex_rgba("3f5a4a"))    # the little green screen
    for i in range(52, 66, 3):
        c.set(i, 5, steel_d)
    # tray of receipts / order slips
    c.rect(10, 2, 14, 5, hex_rgba("f6f3e7"))
    c.rect(10, 2, 14, 1, red)
    # napkin dispenser
    c.rect(30, 1, 10, 6, steel_l)
    c.rect(31, 2, 8, 2, hex_rgba("fbfdff"))
    c.rect(30, 6, 10, 1, steel_d)
    c.outline(OUTLINE)
    return c


def in_till():
    """the register, sitting on the counter — marks where she orders"""
    c = Canvas(22, 20)
    body = hex_rgba("e6e2d6")
    body_d = hex_rgba("c2bcac")
    steel = hex_rgba("cfd4d9")
    c.rect(2, 6, 18, 11, body)
    c.rect(2, 6, 18, 1, hex_rgba("f6f3e7"))
    c.rect(2, 15, 18, 2, body_d)
    c.rect(4, 0, 14, 7, body)                   # the screen on its stalk
    c.rect(4, 0, 14, 1, hex_rgba("f6f3e7"))
    c.rect(6, 1, 10, 4, hex_rgba("3f5a4a"))
    c.rect(6, 1, 10, 1, hex_rgba("5f7f6a"))
    for j in range(2):                          # keypad
        for i in range(4):
            c.rect(4 + i * 4, 9 + j * 3, 3, 2, steel)
    c.rect(1, 17, 20, 2, IN_RED)                # a red bumper, because In-N-Out
    c.outline(OUTLINE)
    return c


def in_menuboard():
    """the menu, spelled out. Prices deliberately 1970s — it's a love letter,
    not an invoice."""
    c = Canvas(76, 46)
    board = hex_rgba("fbf8ee")
    frame = IN_RED
    frame_d = IN_RED_D
    ink = hex_rgba("2f2a2a")
    c.rect(0, 0, 76, 46, frame)
    c.rect(0, 0, 76, 1, hex_rgba("ef4a3c"))
    c.rect(0, 44, 76, 2, frame_d)
    c.rect(2, 2, 72, 42, board)
    c.rect(2, 2, 72, 1, hex_rgba("ffffff"))
    # header
    c.rect(3, 3, 70, 7, frame)
    text3_centered(c, 38, 4, "IN-N-OUT BURGER", IN_WHITE)
    rows = [
        ("DOUBLE-DOUBLE", "2.45"),
        ("CHEESEBURGER", "1.65"),
        ("HAMBURGER", "1.45"),
        ("FRENCH FRIES", "1.15"),
        ("SHAKES", "1.40"),
    ]
    y = 12
    for i, (name, price) in enumerate(rows):
        text3(c, 5, y, name, ink)
        text3(c, 74 - text3_w(price), y, price, frame)
        if i < len(rows) - 1:
            c.rect(5, y + 5, 66, 1, hex_rgba("e4dfd0"))
        y += 6
    c.outline(OUTLINE)
    return c


def in_frystation():
    """potatoes going in whole at one end, fries coming out at the other"""
    c = Canvas(48, 32)
    steel = hex_rgba("cfd4d9")
    steel_l = hex_rgba("eef1f4")
    steel_d = hex_rgba("9aa1a9")
    fry = hex_rgba("f0c65a")
    fry_d = hex_rgba("cfa33c")
    lamp = hex_rgba("f6d98a")
    spud = hex_rgba("c9a274")
    # heat lamp hood
    c.rect(2, 0, 44, 4, steel_d)
    c.rect(2, 4, 44, 2, lamp)
    c.rect(3, 5, 42, 1, hex_rgba("f2bf5e"))
    # counter
    c.rect(0, 14, 48, 4, steel_l)
    c.rect(0, 17, 48, 2, steel_d)
    c.rect(0, 19, 48, 11, steel)
    for i in range(2, 47, 4):
        c.rect(i, 19, 1, 10, steel_l)
    c.rect(0, 28, 48, 2, steel_d)
    # a mound of fries in a paper tray, under the lamp
    c.rect(6, 9, 16, 5, hex_rgba("f4f1e4"))
    c.rect(6, 9, 16, 1, IN_RED)
    for i, h in ((7, 5), (9, 7), (11, 6), (13, 8), (15, 6), (17, 7), (19, 5)):
        c.rect(i, 14 - h, 1, h - 1, fry)
        c.set(i, 14 - h, fry_d)
    # the slicer, and the sack of potatoes beside it
    c.rect(30, 6, 10, 9, steel)
    c.rect(30, 6, 10, 1, steel_l)
    c.rect(33, 8, 4, 5, steel_d)
    c.rect(29, 14, 12, 2, steel_d)
    c.rect(42, 9, 6, 5, spud)
    c.rect(43, 7, 4, 3, spud)
    c.outline(OUTLINE)
    return c


def in_drinks():
    """soda fountain, cups stacked and ready"""
    c = Canvas(36, 34)
    steel = hex_rgba("cfd4d9")
    steel_l = hex_rgba("eef1f4")
    steel_d = hex_rgba("9aa1a9")
    cup = hex_rgba("f6f3e7")
    c.rect(2, 0, 32, 20, steel)
    c.rect(2, 0, 32, 2, steel_l)
    c.rect(2, 18, 32, 2, steel_d)
    # flavour buttons
    for i, col in enumerate((hex_rgba("6b3a24"), IN_RED, hex_rgba("e8913c"),
                             hex_rgba("d8d2c0"))):
        c.rect(5 + i * 7, 4, 5, 5, col)
        c.rect(5 + i * 7, 8, 5, 1, OUTLINE)
        c.rect(6 + i * 7, 13, 3, 4, steel_d)     # the nozzle
    # drip tray
    c.rect(0, 20, 36, 3, steel_d)
    c.rect(1, 23, 34, 2, steel)
    # a stack of cups on the left, one filled cup on the right
    for j in range(3):
        c.rect(3, 25 - j * 3, 9, 4, cup)
        c.rect(3, 28 - j * 3, 9, 1, hex_rgba("d8d2c0"))
    c.rect(3, 25, 9, 1, IN_RED)
    c.rect(24, 24, 8, 9, cup)
    c.rect(24, 24, 8, 2, IN_RED)
    c.rect(25, 27, 6, 5, hex_rgba("6b3a24"))
    c.rect(27, 20, 2, 5, hex_rgba("f4f1e4"))     # straw
    c.outline(OUTLINE)
    return c


def in_shakes():
    """milkshake machine — three spindles, one shake already going"""
    c = Canvas(30, 32)
    steel = hex_rgba("cfd4d9")
    steel_l = hex_rgba("eef1f4")
    steel_d = hex_rgba("9aa1a9")
    shake = hex_rgba("f2c8b0")
    c.rect(3, 0, 24, 6, steel_d)
    c.rect(3, 0, 24, 1, steel_l)
    c.rect(5, 6, 20, 4, steel)
    for i in (7, 13, 19):                        # spindles
        c.rect(i, 10, 2, 5, steel_d)
    # the cup on the middle spindle, mid-spin
    c.rect(11, 15, 8, 10, steel)
    c.rect(11, 15, 8, 1, steel_l)
    c.rect(12, 17, 6, 6, shake)
    c.rect(12, 17, 6, 2, hex_rgba("f8ddcc"))
    # base + a finished shake in a paper cup
    c.rect(1, 25, 28, 3, steel_d)
    c.rect(1, 28, 28, 2, steel)
    c.rect(21, 16, 7, 9, hex_rgba("f6f3e7"))
    c.rect(21, 16, 7, 2, IN_RED)
    c.rect(22, 19, 5, 5, shake)
    c.rect(24, 12, 2, 4, hex_rgba("f4f1e4"))     # straw
    c.outline(OUTLINE)
    return c


def in_booth():
    """a red booth: two benches and the table between them"""
    c = Canvas(46, 34)
    seat = hex_rgba("c8443c")
    seat_l = hex_rgba("de5c52")
    seat_d = hex_rgba("9d322c")
    table = hex_rgba("e8dcc0")
    table_d = hex_rgba("bfb49a")
    steel = hex_rgba("bfc4c9")
    # far bench (back to us)
    c.rect(2, 0, 42, 9, seat)
    c.rect(2, 0, 42, 2, seat_l)
    c.rect(2, 7, 42, 2, seat_d)
    for i in range(8, 40, 10):                   # button tufting
        c.set(i, 4, seat_d)
    # the table
    c.rect(4, 10, 38, 8, table)
    c.rect(4, 10, 38, 1, hex_rgba("f4f1e4"))
    c.rect(4, 16, 38, 2, table_d)
    c.rect(21, 18, 4, 6, steel)                  # pedestal
    # near bench
    c.rect(2, 22, 42, 10, seat)
    c.rect(2, 22, 42, 2, seat_l)
    c.rect(2, 30, 42, 2, seat_d)
    for i in range(8, 40, 10):
        c.set(i, 27, seat_d)
    c.outline(OUTLINE)
    return c


def in_hatstack():
    """the stack of paper hats by the till. Ask nicely and you get two."""
    c = Canvas(24, 22)
    for j in range(4):
        y = 16 - j * 4
        c.rect(3, y, 18, 3, hex_rgba("fbf8ee"))
        c.rect(3, y, 18, 1, hex_rgba("ffffff"))
        c.rect(3, y + 2, 18, 1, IN_RED)
    c.rect(2, 19, 20, 2, hex_rgba("ded8c6"))
    c.outline(OUTLINE)
    return c


def in_tray():
    """their order, landed: burgers, animal-style fries, drinks, a shake ♥"""
    c = Canvas(40, 24)
    tray = IN_RED
    tray_d = IN_RED_D
    paper = hex_rgba("f8f5ea")
    bun = hex_rgba("d9a25e")
    bun_l = hex_rgba("efbf7e")
    patty = hex_rgba("7a4a2c")
    cheese = hex_rgba("f0b93c")
    lettuce = hex_rgba("6fae4f")
    onion = hex_rgba("f4eee2")
    fry = hex_rgba("f0c65a")
    shake = hex_rgba("f2c8b0")
    # the tray
    c.rect(0, 8, 40, 14, tray)
    c.rect(0, 8, 40, 1, hex_rgba("ef4a3c"))
    c.rect(0, 20, 40, 2, tray_d)
    # two wrapped burgers, one unwrapped so you can see the stack
    c.rect(2, 4, 13, 8, paper)
    c.rect(2, 4, 13, 1, hex_rgba("ffffff"))
    c.rect(3, 10, 11, 2, hex_rgba("e0d9c8"))
    bx = 17
    c.rect(bx, 3, 11, 3, bun_l)                  # crown
    c.rect(bx, 5, 11, 1, bun)
    c.rect(bx - 1, 6, 13, 1, lettuce)
    c.rect(bx - 1, 7, 13, 1, onion)              # raw onion, as ordered
    c.rect(bx, 8, 11, 1, cheese)
    c.rect(bx, 9, 11, 2, patty)
    c.rect(bx, 11, 11, 1, cheese)                # extra cheese ♥
    c.rect(bx, 12, 11, 2, bun)
    # animal-style fries under the near edge
    c.rect(4, 13, 13, 7, paper)
    for i, h in ((5, 6), (7, 8), (9, 7), (11, 9), (13, 6), (15, 7)):
        c.rect(i, 13 - h + 6, 1, h - 2, fry)
    c.rect(5, 16, 11, 2, hex_rgba("f0b93c"))     # spread + grilled onion
    c.rect(6, 15, 3, 1, hex_rgba("cf8a3c"))
    c.rect(11, 15, 4, 1, hex_rgba("cf8a3c"))
    # a drink and a shake
    c.rect(30, 5, 7, 9, hex_rgba("f6f3e7"))
    c.rect(30, 5, 7, 2, IN_RED)
    c.rect(31, 8, 5, 5, hex_rgba("6b3a24"))
    c.rect(33, 1, 2, 4, hex_rgba("f4f1e4"))
    c.rect(30, 14, 8, 7, hex_rgba("f6f3e7"))
    c.rect(31, 16, 6, 4, shake)
    c.outline(OUTLINE)
    return c


def _furn(w, h):
    return Canvas(w, h)


def in_sofa():
    c = _furn(46, 26)
    body = hex_rgba("6f9ec4")
    body_d = hex_rgba("50789c")
    cush = hex_rgba("8fb9db")
    leg = hex_rgba("6e5230")
    c.rect(0, 2, 46, 14, body_d)          # backrest
    c.rect(1, 3, 44, 11, body)
    for i in (3, 17, 31):
        c.rect(i, 5, 12, 8, cush)
    c.rect(0, 14, 46, 8, body_d)          # seat
    c.rect(1, 15, 44, 6, body)
    for i in (2, 16, 30):
        c.rect(i, 16, 13, 4, cush)
    c.rect(0, 6, 5, 16, body_d)           # arms
    c.rect(41, 6, 5, 16, body_d)
    c.rect(2, 22, 4, 3, leg)
    c.rect(40, 22, 4, 3, leg)
    # throw pillow ♥
    c.rect(34, 7, 8, 7, hex_rgba("f278a2"))
    c.rect(35, 8, 6, 5, hex_rgba("f8c8d8"))
    c.outline(OUTLINE)
    return c


def in_tv():
    """flat screen on a low console, 2 frames (screen flicker)"""
    sheet = Canvas(72, 30)
    for fi in range(2):
        c = _furn(36, 30)
        c.rect(1, 1, 34, 18, OUTLINE)
        c.rect(2, 2, 32, 16, hex_rgba("2b3a52") if fi == 0 else hex_rgba("36486a"))
        c.rect(4, 4, 12, 6, hex_rgba("6f9ec4") if fi == 0 else hex_rgba("8fb9db"))
        c.rect(18, 8, 12, 7, hex_rgba("4a628a"))
        c.rect(15, 19, 6, 3, hex_rgba("46464e"))
        c.rect(4, 22, 28, 7, hex_rgba("8a683c"))
        c.rect(4, 22, 28, 1, hex_rgba("b08a56"))
        c.rect(6, 24, 10, 3, hex_rgba("6e5230"))
        c.rect(20, 24, 10, 3, hex_rgba("6e5230"))
        c.outline(OUTLINE)
        sheet.blit(c, fi * 36, 0)
    return sheet


def in_table():
    """round dining table with four chairs and a bowl of figs"""
    c = _furn(52, 34)
    wood = hex_rgba("b58551")
    wood_d = hex_rgba("8a6236")
    # chairs behind
    for x in (6, 34):
        c.rect(x, 2, 12, 10, wood_d)
        c.rect(x + 1, 3, 10, 8, wood)
    c.rect(4, 10, 44, 12, wood_d)
    c.rect(5, 11, 42, 9, wood)
    c.rect(5, 11, 42, 2, hex_rgba("cba274"))
    c.rect(10, 22, 4, 9, wood_d)
    c.rect(38, 22, 4, 9, wood_d)
    # chairs in front (lower, so she reads as behind them)
    for x in (6, 34):
        c.rect(x, 20, 12, 11, wood_d)
        c.rect(x + 1, 21, 10, 6, wood)
    # bowl of figs on top
    c.rect(21, 6, 10, 5, hex_rgba("e8e4d8"))
    c.rect(22, 4, 3, 3, hex_rgba("7a4a8c"))
    c.rect(26, 3, 3, 4, hex_rgba("8f5aa0"))
    c.outline(OUTLINE)
    return c


def in_counter():
    """kitchen run: counter, sink, cabinets"""
    c = _furn(64, 30)
    cab = hex_rgba("e8dcc8")
    cab_d = hex_rgba("c6b79c")
    top = hex_rgba("6a6a72")
    top_l = hex_rgba("8f8f97")
    c.rect(0, 6, 64, 6, top_l)
    c.rect(0, 10, 64, 2, top)
    c.rect(0, 12, 64, 16, cab)
    c.rect(0, 26, 64, 2, cab_d)
    for i in range(2, 62, 15):
        c.rect(i, 14, 13, 12, cab_d)
        c.rect(i + 1, 15, 11, 10, cab)
        c.rect(i + 5, 18, 4, 1, hex_rgba("8f8f97"))
    # sink
    c.rect(24, 2, 16, 8, hex_rgba("b8bcc4"))
    c.rect(25, 3, 14, 6, hex_rgba("8f939c"))
    c.rect(31, 0, 2, 4, hex_rgba("cfc7b6"))
    c.rect(31, 0, 5, 1, hex_rgba("cfc7b6"))
    c.outline(OUTLINE)
    return c


def in_fridge():
    c = _furn(20, 34)
    body = hex_rgba("dfe3e8")
    body_d = hex_rgba("b6bcc4")
    c.rect(1, 2, 18, 30, body)
    c.rect(1, 2, 18, 2, hex_rgba("f2f4f7"))
    c.rect(1, 12, 18, 1, body_d)
    c.rect(15, 5, 2, 6, hex_rgba("8f939c"))
    c.rect(15, 15, 2, 8, hex_rgba("8f939c"))
    c.rect(1, 30, 18, 2, body_d)
    # magnets ♥
    c.rect(4, 5, 3, 3, hex_rgba("f278a2"))
    c.rect(8, 6, 3, 2, hex_rgba("f0d264"))
    c.rect(5, 16, 4, 5, hex_rgba("f4f1e4"))
    c.outline(OUTLINE)
    return c


def in_shelf():
    c = _furn(26, 36)
    wood = hex_rgba("9a744c")
    wood_d = hex_rgba("74512d")
    c.rect(0, 0, 26, 34, wood_d)
    c.rect(2, 2, 22, 30, wood)
    books = [hex_rgba("e8556a"), hex_rgba("5f8f6f"), hex_rgba("7a9ce8"),
             hex_rgba("f0d264"), hex_rgba("c78ae0"), hex_rgba("e8913c")]
    for si, sy in enumerate((3, 13, 23)):
        c.rect(2, sy + 8, 22, 2, wood_d)
        x = 3
        bi = si * 2
        while x < 22:
            w = 2 + ((x + si) % 3)
            c.rect(x, sy + 1, w, 7, books[bi % len(books)])
            bi += 1
            x += w + 1
    c.outline(OUTLINE)
    return c


def in_plant():
    c = _furn(20, 30)
    pot = hex_rgba("c2704e")
    pot_d = hex_rgba("9a5238")
    pal = {"g": C_LEAF, "d": C_LEAF_D, "l": C_LEAF_L}
    art = [
        "....g...l...g.......",
        "...ggg.lgl.ggg......",
        "..gdggglgglggdg.....",
        "...gggggggggggg.....",
        "....ggglgggggg......",
        "......gggggg........",
        ".......gddg.........",
    ]
    c.blit_ascii(0, 1, art, pal)
    c.rect(5, 8, 10, 3, C_LEAF_D)
    c.rect(4, 18, 12, 10, pot)
    c.rect(4, 18, 12, 2, hex_rgba("d88a68"))
    c.rect(4, 26, 12, 2, pot_d)
    c.outline(OUTLINE)
    return c


def in_fireplace():
    """fireplace, 2 frames (flame flicker)"""
    sheet = Canvas(80, 38)
    brick = hex_rgba("b0705a")
    brick_d = hex_rgba("8d5443")
    mantle = hex_rgba("9a744c")
    for fi in range(2):
        c = _furn(40, 38)
        c.rect(0, 4, 40, 32, brick)
        for j in range(6, 36, 5):
            c.rect(0, j, 40, 1, brick_d)
            for i in range((j // 5 % 2) * 6, 40, 12):
                c.rect(i, j - 4, 1, 4, brick_d)
        c.rect(0, 0, 40, 5, mantle)
        c.rect(0, 3, 40, 2, hex_rgba("74512d"))
        c.rect(8, 14, 24, 22, OUTLINE)
        c.rect(9, 15, 22, 21, hex_rgba("2b2028"))
        # logs + fire
        c.rect(11, 31, 18, 3, hex_rgba("6e5230"))
        f1 = hex_rgba("f0a03c")
        f2 = hex_rgba("f4d24a")
        f3 = hex_rgba("e8556a")
        flame = [
            "...##...", "..####..", ".######.", "..####..",
        ] if fi == 0 else [
            "..##....", "..####..", ".######.", "..####..",
        ]
        for j, row in enumerate(flame):
            for i, ch in enumerate(row):
                if ch == "#":
                    c.set(16 + i, 22 + j, f1 if j < 2 else f2)
        c.rect(17, 28, 6, 3, f3)
        # stockings-free mantle decor
        c.rect(4, 0, 5, 3, hex_rgba("f278a2"))
        c.rect(30, 0, 6, 3, hex_rgba("5f8f6f"))
        c.outline(OUTLINE)
        sheet.blit(c, fi * 40, 0)
    return sheet


def in_petbeds():
    """Leo's cushion + Charlie's bed + a food bowl, one 48x20 strip"""
    c = _furn(48, 20)
    c.rect(1, 6, 20, 12, hex_rgba("e8913c"))
    c.rect(2, 7, 18, 8, hex_rgba("f4b06a"))
    c.rect(4, 9, 14, 5, hex_rgba("e8913c"))
    c.rect(25, 6, 20, 12, hex_rgba("7a9ce8"))
    c.rect(26, 7, 18, 8, hex_rgba("a8c2f0"))
    c.rect(28, 9, 14, 5, hex_rgba("7a9ce8"))
    c.outline(OUTLINE)
    return c


def in_bowl():
    c = _furn(14, 10)
    c.rect(1, 3, 12, 6, hex_rgba("e8556a"))
    c.rect(2, 4, 10, 3, hex_rgba("f4f1e4"))
    c.rect(3, 2, 8, 2, hex_rgba("b08a56"))
    c.outline(OUTLINE)
    return c


def in_lamp():
    c = _furn(16, 32)
    c.rect(3, 2, 10, 9, hex_rgba("f0d99a"))
    c.rect(3, 2, 10, 2, hex_rgba("f8ecc4"))
    c.rect(3, 9, 10, 2, hex_rgba("d4b874"))
    c.rect(7, 11, 2, 17, hex_rgba("8f8f97"))
    c.rect(4, 27, 8, 3, hex_rgba("74747c"))
    c.outline(OUTLINE)
    return c


# ---- her brother's corner of the living room 🎣 ⚽ -------------------------

def in_rods():
    """two fishing rods leaning in the corner + a tackle box"""
    c = _furn(26, 40)
    rod = hex_rgba("a9793e")
    rod_d = hex_rgba("7d5827")
    reel = hex_rgba("d8dde2")
    box = hex_rgba("2f7f6f")
    box_d = hex_rgba("1f5d51")
    for j in range(30):                          # rod one, leaning left
        c.rect(4 + j // 4, 2 + j, 2, 1, rod)
        c.set(4 + j // 4, 2 + j, rod_d)
    for j in range(26):                          # rod two, leaning right
        c.rect(18 - j // 5, 6 + j, 2, 1, rod)
        c.set(19 - j // 5, 6 + j, rod_d)
    c.rect(8, 22, 4, 5, reel)                    # reels
    c.rect(8, 22, 4, 1, hex_rgba("9c948a"))
    c.rect(14, 18, 4, 4, reel)
    c.rect(3, 28, 20, 10, box)                   # tackle box
    c.rect(3, 28, 20, 2, hex_rgba("4f9e8f"))
    c.rect(3, 32, 20, 1, box_d)
    c.rect(3, 36, 20, 2, box_d)
    c.rect(10, 25, 6, 3, hex_rgba("9c948a"))     # handle
    c.rect(11, 26, 4, 2, TRANSPARENT)
    c.rect(18, 33, 3, 2, hex_rgba("f0d264"))     # a lure clipped to the side
    c.outline(OUTLINE)
    return c


def in_ball():
    """a football. the good kind."""
    c = _furn(14, 14)
    white = hex_rgba("f4f1e4")
    dark = hex_rgba("3a3540")
    shade = hex_rgba("cfc7b6")
    for j in range(-5, 6):
        w = 5 - abs(j) // 3
        c.rect(7 - w, 7 + j, w * 2, 1, white)
    c.rect(5, 5, 4, 4, dark)
    c.rect(2, 9, 3, 2, dark)
    c.rect(9, 9, 3, 2, dark)
    c.rect(6, 2, 3, 2, dark)
    c.rect(3, 10, 8, 2, shade)
    c.outline(OUTLINE)
    return c


# ---- the garden house, inside 🌿 ------------------------------------------

def in_sofa2():
    """low earthy couch with a woven throw over the arm"""
    c = _furn(50, 28)
    body = hex_rgba("a86a4a")
    body_d = hex_rgba("834f36")
    cush = hex_rgba("c48b62")
    leg = hex_rgba("6e5230")
    c.rect(0, 3, 50, 14, body_d)
    c.rect(1, 4, 48, 11, body)
    for i in (3, 19, 35):
        c.rect(i, 6, 13, 8, cush)
    c.rect(0, 15, 50, 9, body_d)
    c.rect(1, 16, 48, 7, body)
    for i in (2, 18, 34):
        c.rect(i, 17, 14, 5, cush)
    c.rect(0, 7, 5, 17, body_d)
    c.rect(45, 7, 5, 17, body_d)
    c.rect(2, 24, 4, 3, leg)
    c.rect(44, 24, 4, 3, leg)
    for j, col in enumerate((hex_rgba("e8556a"), hex_rgba("f0d264"),
                             hex_rgba("4f8f8a"), hex_rgba("efe4cc"))):
        c.rect(0, 5 + j * 3, 8, 3, col)          # the throw
    c.rect(36, 8, 9, 8, hex_rgba("6f9ec4"))      # cushion
    c.rect(37, 9, 7, 6, hex_rgba("a8c2f0"))
    c.outline(OUTLINE)
    return c


def in_record():
    """record player on a crate, vinyl leaning against it"""
    c = _furn(28, 26)
    crate = hex_rgba("b08a56")
    crate_d = hex_rgba("8a683c")
    deck = hex_rgba("4a4048")
    plate = hex_rgba("2b2028")
    c.rect(2, 12, 24, 12, crate)
    c.rect(2, 12, 24, 2, hex_rgba("cba274"))
    c.rect(2, 18, 24, 1, crate_d)
    c.rect(2, 22, 24, 2, crate_d)
    c.rect(3, 5, 22, 8, deck)                    # the deck
    c.rect(3, 5, 22, 1, hex_rgba("6a6072"))
    for j in range(-3, 4):                       # platter
        w = 6 - abs(j) // 2
        c.rect(11 - w // 2 + 2, 9 + j, w, 1, plate)
    c.rect(11, 8, 3, 3, hex_rgba("e8556a"))
    c.rect(20, 4, 2, 6, hex_rgba("cfc7b6"))      # tone arm
    c.rect(18, 9, 4, 1, hex_rgba("cfc7b6"))
    c.rect(23, 13, 4, 11, plate)                 # a record leaning on the crate
    c.rect(24, 17, 2, 2, hex_rgba("f0d264"))
    c.outline(OUTLINE)
    return c


def in_guitar():
    c = _furn(18, 38)
    wood = hex_rgba("c9884a")
    wood_d = hex_rgba("9a5f2c")
    neck = hex_rgba("6e4d2a")
    for j in range(-8, 9):                       # lower bout
        w = 8 - abs(j) // 3
        c.rect(9 - w, 26 + j, w * 2, 1, wood)
    for j in range(-6, 7):                       # upper bout
        w = 6 - abs(j) // 3
        c.rect(9 - w, 14 + j, w * 2, 1, wood)
    c.rect(4, 19, 10, 2, wood)                   # the waist
    c.rect(3, 21, 12, 1, wood_d)
    c.rect(6, 22, 6, 6, hex_rgba("2b2028"))      # sound hole
    c.rect(7, 23, 4, 4, hex_rgba("4a3a2a"))
    c.rect(8, 2, 3, 11, neck)                    # neck
    c.rect(8, 2, 1, 11, hex_rgba("543a1e"))
    c.rect(7, 0, 5, 3, wood_d)                   # headstock
    for i in (8, 10):
        c.set(i, 1, hex_rgba("cfc7b6"))
    c.rect(8, 13, 3, 17, hex_rgba("e8dcc8"))     # strings
    c.rect(9, 13, 1, 17, hex_rgba("b8ac98"))
    c.rect(5, 33, 8, 3, hex_rgba("74747c"))      # stand
    c.rect(3, 35, 12, 2, hex_rgba("55555c"))
    c.outline(OUTLINE)
    return c


def in_hangplant():
    """a pothos in a macramé hanger — grows down from the ceiling"""
    c = _furn(22, 34)
    cord = hex_rgba("efe4cc")
    cord_d = hex_rgba("cbbb9c")
    pot = hex_rgba("c2704e")
    pot_d = hex_rgba("9a5238")
    c.rect(10, 0, 2, 6, cord)
    c.rect(4, 6, 14, 1, cord_d)
    for j in range(6):                           # the knotted cradle
        c.set(4 + j // 2, 7 + j, cord)
        c.set(17 - j // 2, 7 + j, cord)
    c.rect(5, 12, 12, 8, pot)
    c.rect(5, 12, 12, 2, hex_rgba("d88a68"))
    c.rect(5, 18, 12, 2, pot_d)
    c.rect(4, 20, 14, 1, cord_d)
    trail = [(3, 20), (2, 23), (3, 26), (2, 29), (4, 31),
             (18, 20), (19, 23), (18, 26), (19, 29), (17, 31)]
    for j, (x, y) in enumerate(trail):
        c.rect(x, y, 2, 3, C_LEAF if j % 2 else C_LEAF_D)
        c.set(x + (1 if x < 10 else -1), y + 1, C_LEAF_L)
    c.rect(6, 9, 10, 4, C_LEAF)                  # the crown of leaves
    c.rect(4, 10, 14, 2, C_LEAF_D)
    c.rect(7, 8, 7, 2, C_LEAF_L)
    c.outline(OUTLINE)
    return c


def in_bigplant():
    """monstera in a woven basket — the room's centrepiece"""
    c = _furn(30, 40)
    basket = hex_rgba("cba274")
    basket_d = hex_rgba("a37c4c")
    stem = hex_rgba("4a7a32")
    leaves = [(7, 8, 5), (21, 6, 5), (14, 3, 6), (5, 18, 4), (23, 17, 4), (14, 14, 6)]
    for x, y, r in leaves:
        c.rect(14, y + r, 2, 26 - y - r, stem)
        for j in range(-r, r + 1):
            w = r - abs(j) // 2
            c.rect(x - w, y + j, w * 2 + 1, 1, C_LEAF if (j + x) % 3 else C_LEAF_D)
        c.rect(x - 1, y - r + 1, 2, 2, C_LEAF_L)
        c.rect(x + r - 3, y - 1, 2, 3, TRANSPARENT)   # the monstera splits
        c.rect(x - r + 1, y + 2, 2, 3, TRANSPARENT)
    c.rect(6, 26, 18, 12, basket)
    c.rect(6, 26, 18, 2, hex_rgba("e0bd92"))
    for j in range(28, 38, 3):
        c.rect(6, j, 18, 1, basket_d)
    for i in range(7, 24, 4):
        c.rect(i, 27, 1, 11, basket_d)
    c.rect(6, 36, 18, 2, basket_d)
    c.outline(OUTLINE)
    return c


def in_jars():
    """open shelving: mason jars, dried herb bundles, a stack of bowls"""
    c = _furn(30, 34)
    wood = hex_rgba("9a744c")
    wood_d = hex_rgba("74512d")
    glass = hex_rgba("bcd8c8")
    lid = hex_rgba("b08a56")
    for sy in (8, 20):
        c.rect(0, sy + 9, 30, 3, wood)
        c.rect(0, sy + 11, 30, 1, wood_d)
    c.rect(0, 6, 2, 26, wood_d)
    c.rect(28, 6, 2, 26, wood_d)
    fills = [hex_rgba("d8c48c"), hex_rgba("cf9f8c"), hex_rgba("8fb56a"),
             hex_rgba("c9784e"), hex_rgba("e8dcc8")]
    for i, x in enumerate((3, 10, 17, 24)):
        c.rect(x, 11, 5, 6, glass)
        c.rect(x, 14, 5, 3, fills[i % len(fills)])
        c.rect(x, 10, 5, 2, lid)
    for i, x in enumerate((3, 11)):
        c.rect(x, 23, 6, 6, glass)
        c.rect(x, 26, 6, 3, fills[(i + 2) % len(fills)])
        c.rect(x, 22, 6, 2, lid)
    for j, x in enumerate((20, 24)):             # hanging herb bundles
        c.rect(x, 23, 1, 3, wood_d)
        c.rect(x - 2, 25, 5, 5, C_LEAF_D)
        c.rect(x - 1, 26, 3, 3, C_LEAF)
    c.rect(0, 4, 30, 3, wood)                    # top board
    c.rect(0, 6, 30, 1, wood_d)
    c.rect(6, 0, 10, 4, hex_rgba("e8dcc8"))      # stacked bowls
    c.rect(6, 2, 10, 1, hex_rgba("c6b79c"))
    c.rect(18, 1, 8, 3, hex_rgba("cf9f8c"))
    c.outline(OUTLINE)
    return c


def in_cushions():
    """floor cushions round a low kilim — where everyone actually sits"""
    c = _furn(34, 18)
    for i, (x, y, w, h, col, hi) in enumerate((
            (0, 5, 14, 10, hex_rgba("c9784e"), hex_rgba("e09a68")),
            (12, 2, 12, 9, hex_rgba("4f8f8a"), hex_rgba("6fb5ae")),
            (21, 6, 13, 10, hex_rgba("d8b03c"), hex_rgba("f0d264")))):
        c.rect(x, y, w, h, col)
        c.rect(x + 1, y + 1, w - 2, 3, hi)
        c.rect(x + 1, y + h - 2, w - 2, 1, tuple(max(0, v - 40) for v in col[:3]) + (255,))
        c.set(x + w // 2, y + h // 2, hi)
    c.outline(OUTLINE)
    return c


def in_dogbed():
    """Chakra's bed. it is enormous. she still hangs off the end."""
    c = _furn(34, 18)
    rim = hex_rgba("5f7a5a")
    rim_l = hex_rgba("7c9b76")
    inner = hex_rgba("c9b48c")
    c.rect(0, 3, 34, 14, rim)
    c.rect(1, 4, 32, 4, rim_l)
    c.rect(3, 7, 28, 8, inner)
    c.rect(4, 8, 26, 3, hex_rgba("ded0ab"))
    c.rect(3, 14, 28, 1, hex_rgba("a89774"))
    c.rect(0, 15, 34, 2, hex_rgba("47604a"))
    c.outline(OUTLINE)
    return c


def in_stove():
    """cast-iron wood stove with a pipe, 2 frames of firebox glow"""
    sheet = Canvas(60, 40)
    iron = hex_rgba("3f3b44")
    iron_l = hex_rgba("585361")
    iron_d = hex_rgba("2b2830")
    for fi in range(2):
        c = _furn(30, 40)
        c.rect(12, 0, 6, 14, iron)               # flue
        c.rect(12, 0, 2, 14, iron_l)
        c.rect(9, 12, 12, 3, iron_d)
        c.rect(3, 14, 24, 20, iron)              # body
        c.rect(3, 14, 24, 3, iron_l)
        c.rect(3, 30, 24, 2, iron_d)
        c.rect(7, 19, 16, 11, iron_d)            # firebox door
        c.rect(8, 20, 14, 9, hex_rgba("1e1a22"))
        glow = ["..####..", ".######.", "..####.."] if fi == 0 else \
               ["...##...", ".######.", "..####.."]
        for j, row in enumerate(glow):
            for i, ch in enumerate(row):
                if ch == "#":
                    c.set(11 + i, 22 + j,
                          hex_rgba("f4d24a") if j == 0 else
                          (hex_rgba("f0a03c") if j == 1 else hex_rgba("e8556a")))
        c.rect(22, 23, 2, 3, hex_rgba("b08a56"))  # handle
        c.rect(1, 33, 28, 4, iron_d)              # legs / ash lip
        c.rect(4, 36, 4, 3, iron_d)
        c.rect(22, 36, 4, 3, iron_d)
        c.rect(5, 8, 10, 6, hex_rgba("b8bcc4"))   # the kettle, always on
        c.rect(5, 8, 10, 2, hex_rgba("dfe3e8"))
        c.rect(7, 4, 6, 2, hex_rgba("8f939c"))
        c.rect(6, 5, 2, 3, hex_rgba("8f939c"))
        c.rect(12, 5, 2, 3, hex_rgba("8f939c"))
        c.rect(15, 9, 3, 2, hex_rgba("8f939c"))
        c.outline(OUTLINE)
        sheet.blit(c, fi * 30, 0)
    return sheet


def in_samovar():
    """a samovar on a side table, two glasses waiting ♥"""
    c = _furn(26, 30)
    wood = hex_rgba("b58551")
    wood_d = hex_rgba("8a6236")
    brass = hex_rgba("d8a83c")
    brass_l = hex_rgba("f0cc6a")
    brass_d = hex_rgba("a87c22")
    c.rect(1, 14, 24, 4, wood)                   # table top
    c.rect(1, 17, 24, 1, wood_d)
    c.rect(4, 18, 3, 10, wood_d)
    c.rect(19, 18, 3, 10, wood_d)
    c.rect(3, 27, 20, 2, wood_d)
    c.rect(7, 4, 10, 10, brass)                  # the samovar body
    c.rect(8, 5, 4, 8, brass_l)
    c.rect(7, 12, 10, 2, brass_d)
    c.rect(9, 1, 6, 3, brass)                    # the little teapot on top
    c.rect(9, 0, 6, 1, brass_l)
    c.rect(6, 8, 2, 3, brass_d)                  # tap + handles
    c.rect(16, 8, 2, 3, brass_d)
    c.rect(11, 13, 2, 2, brass_d)
    for x in (19, 22):                           # tea glasses
        c.rect(x, 10, 3, 4, hex_rgba("bcd8c8"))
        c.rect(x, 12, 3, 2, hex_rgba("a1522c"))
    c.outline(OUTLINE)
    return c


# ---------------------------------------------------------------------------
# TRAVEL MONUMENTS — premade sprites for countries/cities in the travel log.
# world.js COUNTRY_SPRITES maps typed names ("canada", "new york", …) to these.
# ---------------------------------------------------------------------------

def mon_maple():
    """Canada — a proud red maple leaf on a little plinth"""
    c = Canvas(16, 20)
    pal = {"r": hex_rgba("d63c3c"), "R": hex_rgba("a82828"), "s": hex_rgba("8f8f97"),
           "S": hex_rgba("74747c")}
    art = [
        ".......r........",
        "..r...rrr...r...",
        ".rrr.rrrrr.rrr..",
        ".rrrrrrrrrrrr...",
        "..rrrrrRrrrr....",
        "...rrrrrrrr.....",
        ".rrrrrRrrrrrr...",
        "..rrrrrrrrrr....",
        "....rrRrrr......",
        "......rr........",
        "......rr........",
    ]
    c.blit_ascii(0, 3, art, pal)
    c.rect(4, 15, 8, 2, pal["s"])
    c.rect(3, 17, 10, 2, pal["S"])
    c.outline(OUTLINE)
    return c


def mon_garita():
    """Puerto Rico — an El Morro garita (stone sentry turret)"""
    c = Canvas(14, 20)
    pal = {"s": hex_rgba("e8dcc0"), "S": hex_rgba("c8b894"), "d": hex_rgba("a89870"),
           "k": hex_rgba("3a3540")}
    art = [
        ".....ss.......",
        "...sssss......",
        "..sssssss.....",
        "..sSsssSs.....",
        "..sssssss.....",
        "..ssskksss....",
        "..ssskksss....",
        "..sSskksSs....",
        "..sssssss.....",
        "..sSsssSs.....",
        "..sssssss.....",
        "..dddddddd....",
    ]
    c.blit_ascii(0, 6, art, pal)
    c.set(6, 3, pal["d"])
    c.outline(OUTLINE)
    return c


def mon_lobster():
    """Boston — a very confident lobster"""
    c = Canvas(18, 16)
    pal = {"r": hex_rgba("d84838"), "R": hex_rgba("a83224"), "e": hex_rgba("2a2018"),
           "w": hex_rgba("f0b8a8")}
    art = [
        ".rr.........rr....",
        "rrrr.......rrrr...",
        "rrRr.......rRrr...",
        ".rr.........rr....",
        "..rr..rrrr..rr....",
        "...rrrreerrrr.....",
        "....rrrrrrrr......",
        "....RrrrrrrR......",
        ".....rrrrrr.......",
        "....rrRrrRrr......",
        ".....rrrrrr.......",
        "......rRRr........",
        ".....rrrrrr.......",
    ]
    c.blit_ascii(0, 2, art, pal)
    c.outline(OUTLINE)
    return c


def mon_liberty():
    """New York — a mini Statue of Liberty"""
    c = Canvas(16, 30)
    pal = {"g": hex_rgba("6fb89a"), "G": hex_rgba("4f927a"), "y": hex_rgba("f0d264"),
           "s": hex_rgba("b8ac90"), "S": hex_rgba("948a70")}
    art = [
        "............yy..",
        "............yy..",
        ".....g......gg..",
        "....ggg.....gg..",
        "...g.g.g....gg..",
        "....ggg....gg...",
        "....gGg...gg....",
        "....ggggggg.....",
        "....ggggg.......",
        "....gGggg.......",
        "....ggggg.......",
        "...ggGgggg......",
        "...ggggggg......",
        "..gggGggggg.....",
        "..ggggggggg.....",
    ]
    c.blit_ascii(0, 6, art, pal)
    c.rect(3, 21, 10, 3, pal["s"])
    c.rect(2, 24, 12, 3, pal["S"])
    c.outline(OUTLINE)
    return c


def mon_flamingo():
    """Miami — a pink flamingo (remember the beach horses?)"""
    c = Canvas(14, 22)
    pal = {"p": hex_rgba("f288a8"), "P": hex_rgba("d0608a"), "k": hex_rgba("2a2018"),
           "y": hex_rgba("e8c060")}
    art = [
        "....pp........",
        "...pppk.......",
        "...pp.........",
        "...pp.........",
        "...pp.........",
        "...pp..pppp...",
        "...pppppppppp.",
        "....pppPPppp..",
        ".....pppppp...",
        "......pppp....",
        ".......pp.....",
        ".......p......",
        ".......p......",
        "......pp......",
    ]
    c.blit_ascii(0, 4, art, pal)
    c.set(7, 18, pal["y"])
    c.set(7, 19, pal["y"])
    c.outline(OUTLINE)
    return c


def mon_eiffel():
    """Paris — the Eiffel Tower"""
    c = Canvas(18, 30)
    pal = {"i": hex_rgba("6a5f52"), "I": hex_rgba("4e4438"), "l": hex_rgba("8a7d6c")}
    art = [
        "........i.........",
        "........i.........",
        ".......iii........",
        ".......ili........",
        ".......iii........",
        "......iiIii.......",
        "......ii.ii.......",
        ".....iii.iii......",
        ".....ii...ii......",
        "....iiiIiIiii.....",
        "....ii.....ii.....",
        "...iii.....iii....",
        "...ii.......ii....",
        "..iii..iii..iii...",
        "..ii..ii.ii..ii...",
        ".iii.ii...ii.iii..",
        ".ii.ii.....ii.ii..",
    ]
    c.blit_ascii(0, 11, art, pal)
    c.outline(OUTLINE)
    return c


def mon_bigben():
    """London — Big Ben"""
    c = Canvas(14, 30)
    pal = {"t": hex_rgba("c8b088"), "T": hex_rgba("a08858"), "w": hex_rgba("f4f1e4"),
           "k": hex_rgba("3a3540"), "g": hex_rgba("5f8f6f")}
    art = [
        ".....t........",
        "....ttt.......",
        "...ttttt......",
        "...tTtTt......",
        "...ttttt......",
        "...twwwt......",
        "...twkwt......",
        "...twwwt......",
        "...ttttt......",
        "...tTtTt......",
        "...ttttt......",
        "...tTtTt......",
        "...ttttt......",
        "...tTtTt......",
        "...ttttt......",
        "..ttttttt.....",
    ]
    c.blit_ascii(0, 10, art, pal)
    c.outline(OUTLINE)
    return c


def mon_minitorii():
    """Japan — a little torii gate (the big one is still coming soon…)"""
    c = Canvas(20, 18)
    pal = {"r": hex_rgba("cf4436"), "R": hex_rgba("9c2e24"), "k": hex_rgba("2b2028")}
    art = [
        "kkkkkkkkkkkkkkkkkk..",
        ".rrrrrrrrrrrrrrrr...",
        ".RRrrrrrrrrrrrrRR...",
        "...rr.........rr....",
        "..rrrrrrrrrrrrrr....",
        "...rr.........rr....",
        "...rr.........rr....",
        "...rR.........Rr....",
        "...rr.........rr....",
        "...rr.........rr....",
        "..kkk.........kkk...",
    ]
    c.blit_ascii(0, 6, art, pal)
    c.outline(OUTLINE)
    return c


def mon_stein():
    """Germany — a beer stein with a proud head of foam"""
    c = Canvas(14, 16)
    pal = {"b": hex_rgba("7a9ce8"), "B": hex_rgba("5878c0"), "w": hex_rgba("f8f4e8"),
           "y": hex_rgba("e8c060"), "Y": hex_rgba("c89840")}
    art = [
        "..www.w.......",
        ".wwwwww.......",
        ".wwwwwww......",
        ".yyyyyyy......",
        ".ybyByby.ww...",
        ".ybbbbby.yy...",
        ".ybyByby.yy...",
        ".ybbbbbyyy....",
        ".ybyByby......",
        ".yyyyyyy......",
        ".YyyyyyY......",
    ]
    c.blit_ascii(0, 4, art, pal)
    c.outline(OUTLINE)
    return c


def mon_balloon():
    """Turkey — a Cappadocia hot-air balloon"""
    c = Canvas(14, 22)
    pal = {"r": hex_rgba("e8556a"), "y": hex_rgba("f0d264"), "t": hex_rgba("4fc4b8"),
           "k": hex_rgba("6e5230"), "K": hex_rgba("57401f")}
    art = [
        "....ryty......",
        "..rrytyryy....",
        ".rrytyrytyy...",
        ".ryty.rytyy...",
        ".rrytyrytyy...",
        ".rryty.ytyy...",
        "..rrytyryy....",
        "...ryytyy.....",
        "....k..k......",
        "....k..k......",
        "...kKKKKk.....",
        "...kkkkkk.....",
    ]
    c.blit_ascii(0, 4, art, pal)
    c.outline(OUTLINE)
    return c


def mon_windmill():
    """Netherlands — a windmill with lattice sails"""
    c = Canvas(20, 24)
    pal = {"b": hex_rgba("b06a4e"), "B": hex_rgba("8c5038"), "s": hex_rgba("8a7d6c"),
           "S": hex_rgba("6a5f52"), "w": hex_rgba("f4f1e4")}
    art = [
        "..s.......s.........",
        "...s..s..s..........",
        "....s.s.s...........",
        ".....sss............",
        "..sssSsSsss.........",
        ".....sss............",
        "....s.s.s...........",
        "...s..s..s..........",
        "..s...bbb...........",
        "......bbb...........",
        ".....bbbbb..........",
        ".....bBbBb..........",
        ".....bbwbb..........",
        ".....bbbbb..........",
        "....bbBbBbb.........",
        "....bbbbbbb.........",
    ]
    c.blit_ascii(0, 7, art, pal)
    c.outline(OUTLINE)
    return c


def mon_lantern():
    """China — a red paper lantern"""
    c = Canvas(12, 18)
    pal = {"r": hex_rgba("d84040"), "R": hex_rgba("a82c2c"), "y": hex_rgba("f0c040"),
           "Y": hex_rgba("c89830")}
    art = [
        "....yy......",
        "...yyyy.....",
        "..rrrrrr....",
        ".rrRrrRrr...",
        ".rrrrrrrr...",
        ".rRrrrrRr...",
        ".rrrrrrrr...",
        ".rrRrrRrr...",
        "..rrrrrr....",
        "...yyyy.....",
        "....yy......",
        "....Yy......",
        "....yY......",
    ]
    c.blit_ascii(0, 3, art, pal)
    c.outline(OUTLINE)
    return c


def mon_felucca():
    """Egypt, trip #2 — the Nile felucca they slept on for New Year's ♥"""
    c = Canvas(20, 20)
    pal = {"w": hex_rgba("f4f1e4"), "W": hex_rgba("d8d4c8"), "m": hex_rgba("5e4326"),
           "h": hex_rgba("8a683c"), "H": hex_rgba("6e5230"), "b": hex_rgba("4f97d8")}
    art = [
        "..........w.........",
        ".........ww.........",
        "........wwwm........",
        ".......wwwwm........",
        "......wwwWwm........",
        ".....wwwwwwm........",
        "....wwwWwwwm........",
        "...wwwwwwwwm........",
        "......m....m........",
        ".hhhhhhhhhhhhhh.....",
        "..hHHHHHHHHHHh......",
        "...hhhhhhhhhh.......",
        "..b.bb.b..bb.b......",
    ]
    c.blit_ascii(0, 5, art, pal)
    c.outline(OUTLINE)
    return c


def mon_wofstar():
    """Los Angeles — a Walk of Fame star (her name on it, obviously)"""
    c = Canvas(16, 16)
    pal = {"k": hex_rgba("4a4550"), "K": hex_rgba("3a3540"), "p": hex_rgba("f288a8"),
           "P": hex_rgba("d0608a"), "y": hex_rgba("e8c060")}
    art = [
        "kkkkkkkkkkkkkk",
        "kKkkkkkpkkkkKk",
        "kkkkkkppplkkkk".replace("l", "p"),
        "kkkpppppppppkk",
        "kkkkpppppppkkk",
        "kkkkkpppppkkkk",
        "kkkkpppKpppkkk",
        "kkkppkkkkkppkk",
        "kKkkkkkkkkkkKk",
        "kkkkkkyykkkkkk",
        "kkkkkkkkkkkkkk",
    ]
    c.blit_ascii(1, 3, art, pal)
    c.outline(OUTLINE)
    return c


def mon_needle():
    """Seattle — the Space Needle (World Cup trip, Egypt game!)"""
    c = Canvas(14, 26)
    pal = {"w": hex_rgba("f4f1e4"), "W": hex_rgba("c8c4b8"), "o": hex_rgba("e8913c"),
           "r": hex_rgba("d84040")}
    art = [
        "......r.......",
        "......w.......",
        ".....ooo......",
        "..wwwwwwwww...",
        ".wWWWWWWWWWw..",
        "..wwwwwwwww...",
        "....w.w.w.....",
        ".....wWw......",
        ".....wWw......",
        ".....wWw......",
        ".....wWw......",
        "....wwWww.....",
        "....w.W.w.....",
        "...wW.w.Ww....",
        "..ww..w..ww...",
        "..w...w...w...",
    ]
    c.blit_ascii(0, 8, art, pal)
    c.outline(OUTLINE)
    return c


def mon_seoulgate():
    """Korea — a little dancheong palace gate (soon ♥)"""
    c = Canvas(18, 18)
    pal = {"g": hex_rgba("3f9070"), "G": hex_rgba("2c6e54"), "r": hex_rgba("b04038"),
           "w": hex_rgba("f4f1e4"), "s": hex_rgba("8f8f97"), "S": hex_rgba("74747c"),
           "k": hex_rgba("2b2028")}
    art = [
        "g................g",
        "gg.gggggggggggg.gg",
        ".ggggGGGGGGGGgggg.",
        "..gggggggggggggg..",
        "...wwwwwwwwwwww...",
        "...rr..rrrr..rr...",
        "...rr..r..r..rr...",
        "..ssssssssssssss..",
        ".sssssSkkkkSsssss.",
        ".sssssSkkkkSsssss.",
        ".sssssSkkkkSsssss.",
    ]
    c.blit_ascii(0, 5, art, pal)
    c.outline(OUTLINE)
    return c


MONUMENTS = {
    "maple": mon_maple, "garita": mon_garita, "lobster": mon_lobster,
    "liberty": mon_liberty, "flamingo": mon_flamingo, "eiffel": mon_eiffel,
    "bigben": mon_bigben, "minitorii": mon_minitorii, "stein": mon_stein,
    "balloon": mon_balloon, "windmill": mon_windmill, "lantern": mon_lantern,
    "felucca": mon_felucca, "wofstar": mon_wofstar,
    "needle": mon_needle, "seoulgate": mon_seoulgate,
}


def ride_sprites():
    """her + mookie on the quad — 3 cells 32x28: down, up, side(right)"""
    sheet = Canvas(96, 28)
    pal = {
        "r": hex_rgba("d8504a"), "R": hex_rgba("a83832"), "k": hex_rgba("2a2a30"),
        "K": hex_rgba("44444c"), "s": HER["s"], "h": HER["h"], "H": HER["H"],
        "e": HER["e"], "t": HER["t"], "T": HER["T"], "y": hex_rgba("f0d264"),
        "g": MOOKIE["g"], "G": MOOKIE["G"], "w": MOOKIE["w"], "p": MOOKIE["p"],
        "Y": PARTY_HAT["pal"]["Y"], "P": PARTY_HAT["pal"]["P"],
        "S": hex_rgba("8c8c94"),
    }
    down = [
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


def innout():
    """In-N-Out: white box, red fascia, red base stripe, wall of glass.
    5x2 tiles. The crossed-arrow sign is a separate prop out front."""
    W, wallH, roof_h = 80, 32, 14
    c = Canvas(W, roof_h + wallH + 2)
    wall = IN_WHITE
    wall_d = hex_rgba("ded8ca")
    glass = hex_rgba("aedcf0")
    glass_hi = hex_rgba("e8f8ff")
    glass_d = hex_rgba("74a8c4")
    warm = hex_rgba("f4d894")

    # ---- parapet + red fascia band with the name
    c.rect(0, 0, W, 2, hex_rgba("fffdf4"))
    c.rect(1, 2, W - 2, 9, IN_RED)
    c.rect(1, 2, W - 2, 1, hex_rgba("ef4a3c"))
    c.rect(1, 10, W - 2, 1, IN_RED_D)
    text3_centered(c, W // 2, 4, "IN-N-OUT BURGER", IN_WHITE)
    c.rect(0, 11, W, 2, wall)
    c.rect(0, roof_h - 1, W, 1, OUTLINE)

    y0 = roof_h
    c.rect(0, y0, W, wallH, wall)
    c.rect(0, y0, W, 2, wall_d)
    for i in range(0, W, 16):               # panel joints
        c.rect(i, y0 + 2, 1, wallH - 6, wall_d)

    # ---- storefront glass either side of the doors
    for (gx, gw) in ((4, 30), (46, 30)):
        c.rect(gx, y0 + 6, gw, 20, OUTLINE)
        c.rect(gx + 1, y0 + 7, gw - 2, 18, glass)
        c.rect(gx + 1, y0 + 7, gw - 2, 4, glass_hi)
        c.rect(gx + 1, y0 + 20, gw - 2, 5, warm)     # warm room behind
        c.rect(gx + 1, y0 + 19, gw - 2, 1, glass_d)
        c.rect(gx + gw // 2 - 1, y0 + 7, 2, 18, wall)  # mullion
    # ---- glass double doors
    dx = 36
    c.rect(dx, y0 + 8, 8, 24, OUTLINE)
    c.rect(dx + 1, y0 + 9, 6, 22, glass)
    c.rect(dx + 1, y0 + 9, 6, 3, glass_hi)
    c.rect(dx + 3, y0 + 9, 1, 22, wall)
    c.rect(dx + 1, y0 + 18, 6, 1, IN_RED)   # push bars
    # ---- red base stripe
    c.rect(0, y0 + wallH - 4, W, 4, IN_RED)
    c.rect(0, y0 + wallH - 4, W, 1, hex_rgba("ef4a3c"))
    c.outline(OUTLINE)
    return c


def jvue_tower():
    """JVUE — her new place in the Longwood Medical Area. Glass curtain wall,
    warm panels, balconies, a lit lobby. 5x4 tiles, the tallest thing around."""
    W, wallH, roof_h = 80, 64, 16
    c = Canvas(W, roof_h + wallH + 6)
    frame = hex_rgba("48505e")
    frame_l = hex_rgba("616b7c")
    frame_d = hex_rgba("323842")
    glass = hex_rgba("8fc9e8")
    glass_hi = hex_rgba("c6e8f8")
    glass_d = hex_rgba("5d9cc0")
    warm = hex_rgba("f4d894")
    panel = hex_rgba("c98a5e")             # the warm spandrel panels
    panel_d = hex_rgba("a06843")
    slab = hex_rgba("e4e0d6")

    # ---- rooftop: mechanical box + parapet
    c.rect(52, 0, 18, 7, frame)
    c.rect(52, 0, 18, 1, frame_l)
    c.rect(52, 5, 18, 2, frame_d)
    c.rect(0, 7, W, roof_h - 8, frame)
    c.rect(0, 7, W, 1, frame_l)
    c.rect(0, roof_h - 3, W, 2, frame_d)
    c.rect(0, roof_h - 1, W, 1, OUTLINE)

    y0 = roof_h
    c.rect(0, y0, W, wallH, frame)
    # ---- four bays x four floors of glass
    bays = [(4, 16), (23, 16), (42, 16), (61, 15)]
    lit = {(0, 1), (1, 0), (2, 2), (3, 1), (1, 3), (3, 3)}
    for fl in range(4):
        fy = y0 + fl * 16
        for bi, (bx, bw) in enumerate(bays):
            c.rect(bx, fy + 3, bw, 11, glass_d)
            c.rect(bx + 1, fy + 4, bw - 2, 9, glass)
            c.rect(bx + 1, fy + 4, bw - 2, 3, glass_hi)
            if (bi, fl) in lit:
                c.rect(bx + 1, fy + 9, bw - 2, 4, warm)
            c.rect(bx + bw // 2, fy + 3, 1, 11, frame)      # mullion
        # spandrel band under each floor
        c.rect(0, fy + 14, W, 2, panel)
        c.rect(0, fy + 15, W, 1, panel_d)
    # ---- balconies on the two middle bays, floors 1-3
    for fl in (1, 2, 3):
        fy = y0 + fl * 16
        for bx, bw in (bays[1], bays[2]):
            c.rect(bx - 1, fy + 13, bw + 2, 2, slab)
            for i in range(bx, bx + bw, 3):
                c.set(i, fy + 11, slab)
                c.set(i, fy + 12, slab)

    # ---- lit lobby + entry canopy at street level
    ly = y0 + wallH - 16
    c.rect(2, ly, W - 4, 14, hex_rgba("2b303a"))
    c.rect(4, ly + 2, W - 8, 10, warm)
    c.rect(4, ly + 2, W - 8, 2, hex_rgba("fbe8b8"))
    for i in range(10, W - 8, 13):                          # lobby mullions
        c.rect(i, ly + 2, 2, 10, hex_rgba("2b303a"))
    dx = 34
    c.rect(dx, ly + 2, 12, 12, hex_rgba("3d4450"))
    c.rect(dx + 1, ly + 3, 10, 11, glass)
    c.rect(dx + 1, ly + 3, 10, 3, glass_hi)
    c.rect(dx + 5, ly + 3, 2, 11, hex_rgba("3d4450"))
    c.rect(dx - 6, ly - 2, 24, 3, slab)                     # canopy
    c.rect(dx - 6, ly, 24, 1, hex_rgba("bdb8ab"))
    # (the name lives on the monument sign out front — prop_jvuesign)
    # stoop
    c.rect(dx - 4, y0 + wallH, 20, 3, C_WALK)
    c.rect(dx - 4, y0 + wallH + 2, 20, 1, C_WALK_D)
    c.rect(dx - 6, y0 + wallH + 3, 24, 3, C_WALK)
    c.rect(dx - 6, y0 + wallH + 5, 24, 1, C_WALK_D)
    c.outline(OUTLINE)
    return c


def prop_jvuesign():
    """the monument sign out front — slate slab, cut metal letters"""
    c = Canvas(50, 30)
    slate = hex_rgba("353b46")
    slate_l = hex_rgba("4a5260")
    stone = hex_rgba("bdb8ab")
    stone_d = hex_rgba("948f83")
    steel = hex_rgba("e8eef2")
    c.rect(2, 22, 46, 5, stone)             # base
    c.rect(2, 25, 46, 2, stone_d)
    c.rect(4, 2, 42, 21, slate)
    c.rect(4, 2, 42, 1, slate_l)
    c.rect(4, 21, 42, 2, hex_rgba("262b34"))
    c.rect(5, 3, 40, 1, slate_l)
    text3_centered(c, 25, 5, "JVUE", steel, spacing=2, scale=2)
    c.rect(12, 16, 26, 1, hex_rgba("6f7a8a"))
    text3_centered(c, 25, 18, "AT THE LMA", stone)
    c.outline(OUTLINE)
    return c


def duplex_house():
    """her parents' place in Brookline: the bottom half of a big duplex.
    White clapboard, brown wood trim, covered porch, two front doors —
    theirs is the lit one. 6x3 tiles."""
    W, wallH, roof_h = 96, 48, 18
    c = Canvas(W, roof_h + wallH + 4)
    wall = hex_rgba("f7f5ee")
    wall_d = hex_rgba("dcd8ca")
    wood = hex_rgba("8a6a45")
    wood_l = hex_rgba("a8865c")
    wood_d = hex_rgba("6b5133")
    shingle = hex_rgba("7d6042")
    shingle_d = hex_rgba("5e472f")
    shingle_l = hex_rgba("96754f")
    glass = hex_rgba("9fd6ef")
    glass_hi = hex_rgba("e4f6ff")
    glass_d = hex_rgba("6b9fbe")
    warm = hex_rgba("f4d894")

    # ---- shingled gable roof
    for j in range(roof_h):
        inset = max(0, roof_h - 4 - j)
        c.rect(inset, j, W - inset * 2, 1, shingle)
        if j % 3 == 2:                      # shingle courses
            c.rect(inset, j, W - inset * 2, 1, shingle_d)
    c.rect(roof_h - 5, 0, W - (roof_h - 5) * 2, 1, shingle_l)
    c.rect(0, roof_h - 4, W, 3, wood_d)     # fascia board
    c.rect(0, roof_h - 1, W, 1, OUTLINE)
    # little gable dormer over the porch
    for j in range(7):
        c.rect(40 - j, roof_h - 5 - j, 16 + j * 2, 1, shingle if j % 3 else shingle_d)
    c.rect(42, roof_h - 6, 12, 5, wall)
    c.rect(45, roof_h - 5, 6, 4, glass)
    c.rect(45, roof_h - 5, 6, 1, glass_hi)

    y0 = roof_h
    c.rect(0, y0, W, wallH, wall)
    for j in range(y0 + 2, y0 + wallH, 4):  # clapboard courses
        c.rect(0, j, W, 1, wall_d)
    c.rect(0, y0, W, 2, wall_d)             # eave shadow
    for cx in (0, 92):                      # corner boards
        c.rect(cx, y0, 4, wallH, wood)
        c.rect(cx + 2, y0, 2, wallH, wood_d)

    # ---- upstairs (the neighbours): three trimmed windows
    for wx in (10, 41, 72):
        c.rect(wx - 1, y0 + 5, 16, 15, wood)
        c.rect(wx, y0 + 6, 14, 13, glass_d)
        c.rect(wx + 1, y0 + 7, 12, 11, glass)
        c.rect(wx + 1, y0 + 7, 12, 3, glass_hi)
        c.rect(wx + 6, y0 + 7, 2, 11, wall)
        c.rect(wx + 1, y0 + 12, 12, 1, wall)
        c.rect(wx - 2, y0 + 20, 18, 2, wood_l)      # sill
    # ---- belt course between the two halves
    c.rect(0, y0 + 24, W, 3, wood)
    c.rect(0, y0 + 26, W, 1, wood_d)

    # ---- downstairs: theirs. bay window + porch + the two doors
    c.rect(6, y0 + 31, 28, 15, wood)
    c.rect(7, y0 + 32, 26, 13, glass_d)
    c.rect(8, y0 + 33, 24, 11, glass)
    c.rect(8, y0 + 33, 24, 3, glass_hi)
    c.rect(8, y0 + 39, 24, 5, warm)                 # somebody's home
    c.rect(19, y0 + 33, 2, 11, wood)
    c.rect(5, y0 + 46, 30, 2, wood_l)

    # covered porch: roof beam, a post at each end, railing in the gaps,
    # and the two front doors side by side in the middle
    c.rect(38, y0 + 27, 54, 3, wood_d)
    c.rect(38, y0 + 27, 54, 1, wood_l)
    for px in (39, 88):
        c.rect(px, y0 + 30, 3, 18, wood)
        c.rect(px + 2, y0 + 30, 1, 18, wood_d)
    for rx0, rw in ((42, 7), (79, 9)):              # railing either side
        c.rect(rx0, y0 + 38, rw, 2, wood)
        c.rect(rx0, y0 + 44, rw, 2, wood)
        for i in range(rx0 + 1, rx0 + rw, 3):
            c.rect(i, y0 + 40, 2, 4, wood_l)
    # theirs (left, lit) + the stairs-up door for the neighbours (right)
    for ddx, tone, lit in ((50, hex_rgba("7d4a2c"), True),
                           (65, hex_rgba("5f6a72"), False)):
        c.rect(ddx - 1, y0 + 30, 14, 18, wood)
        c.rect(ddx, y0 + 31, 12, 17, tone)
        c.rect(ddx + 1, y0 + 35, 10, 6, warm if lit else glass_d)
        c.rect(ddx + 1, y0 + 32, 10, 2, warm if lit else glass)   # transom
        c.set(ddx + 9, y0 + 43, hex_rgba("e8c74a"))
    c.rect(40, y0 + wallH - 2, 50, 2, C_WALK)
    c.rect(0, y0 + wallH - 2, W, 2, wall_d)
    c.outline(OUTLINE)
    return c


def neu_hall():
    """Northeastern: red brick, limestone arch, NORTHEASTERN cut into the
    lintel, and a pair of NU-red banners either side of the door. 6x3."""
    W, wallH, roof_h = 96, 48, 16
    c = Canvas(W, roof_h + wallH + 2)
    brick = hex_rgba("9d4636")
    brick_d = hex_rgba("7d3628")
    brick_l = hex_rgba("b25644")
    stone = hex_rgba("ded5c2")
    stone_l = hex_rgba("f0e9d8")
    stone_d = hex_rgba("b6ac97")
    nured = hex_rgba("cc0000")
    nured_d = hex_rgba("990000")
    glass = hex_rgba("9fd6ef")
    glass_hi = hex_rgba("e4f6ff")
    glass_d = hex_rgba("6b9fbe")
    door = hex_rgba("5e3f28")

    # ---- limestone cornice / parapet
    c.rect(0, 1, W, roof_h - 6, brick_d)
    c.rect(0, roof_h - 7, W, 4, stone)
    c.rect(0, roof_h - 4, W, 2, stone_d)
    for i in range(2, W - 2, 6):            # dentils
        c.rect(i, roof_h - 3, 3, 2, stone_l)
    c.rect(0, roof_h - 1, W, 1, OUTLINE)

    y0 = roof_h
    c.rect(0, y0, W, wallH, brick)
    for j in range(y0 + 2, y0 + wallH, 3):  # brick coursing
        for i in range(((j // 3) % 2) * 3, W, 6):
            c.set(i, j, brick_d)
            c.set(i + 1, j, brick_l)

    # ---- the name band
    c.rect(2, y0 + 2, W - 4, 9, stone)
    c.rect(2, y0 + 2, W - 4, 1, stone_l)
    c.rect(2, y0 + 10, W - 4, 1, stone_d)
    text3_centered(c, W // 2, y0 + 4, "NORTHEASTERN", hex_rgba("6b2a20"))

    # ---- upper windows, limestone sills
    for wx in (8, 26, 58, 76):
        c.rect(wx, y0 + 15, 14, 16, stone_d)
        c.rect(wx + 1, y0 + 16, 12, 14, glass)
        c.rect(wx + 1, y0 + 16, 12, 4, glass_hi)
        c.rect(wx + 1, y0 + 25, 12, 4, glass_d)
        c.rect(wx + 6, y0 + 16, 2, 14, stone)
        c.rect(wx - 1, y0 + 31, 16, 2, stone)

    # ---- arched entrance, dead centre
    ax, aw = 38, 20
    for j in range(9):                      # limestone arch
        t = j / 8
        half = int(round((aw // 2 + 2) * (1 - (1 - t) ** 2) ** 0.5))
        c.rect(ax + aw // 2 - half, y0 + 14 + j, half * 2, 1, stone)
    c.rect(ax - 2, y0 + 22, aw + 4, 24, stone)
    c.rect(ax, y0 + 22, aw, 22, door)
    c.rect(ax + 1, y0 + 23, aw - 2, 8, hex_rgba("47301e"))
    c.rect(ax + aw // 2 - 1, y0 + 22, 2, 22, stone_d)
    c.set(ax + 7, y0 + 33, hex_rgba("e8c74a"))
    c.set(ax + 12, y0 + 33, hex_rgba("e8c74a"))
    c.rect(ax - 4, y0 + wallH - 3, aw + 8, 3, stone_l)      # steps
    c.rect(ax - 6, y0 + wallH - 1, aw + 12, 1, stone_d)

    # ---- the banners
    for bx in (ax - 12, ax + aw + 4):
        c.rect(bx, y0 + 14, 8, 20, nured)
        c.rect(bx, y0 + 14, 8, 1, hex_rgba("e83a2a"))
        c.rect(bx + 6, y0 + 14, 2, 20, nured_d)
        for i in range(0, 8, 3):            # swallow-tail hem
            c.set(bx + i, y0 + 34, nured)
            c.set(bx + i + 1, y0 + 33, nured)
        text3(c, bx + 2, y0 + 20, "N", stone_l)
    c.rect(0, y0 + wallH - 2, W, 2, brick_d)
    c.outline(OUTLINE)
    return c


def bu_robotics():
    """BU — specifically the robotics lab: scarlet band, glass-fronted bay
    with an arm and a rover behind it, dish on the roof. 6x3."""
    W, wallH, roof_h = 96, 48, 16
    c = Canvas(W, roof_h + wallH + 2)
    stone = hex_rgba("d3c7b0")
    stone_d = hex_rgba("ab9e88")
    stone_l = hex_rgba("e8dfcb")
    scarlet = hex_rgba("cc0000")
    scarlet_d = hex_rgba("990000")
    steel = hex_rgba("8f959e")
    steel_d = hex_rgba("6a707a")
    glass = hex_rgba("aedcf0")
    glass_hi = hex_rgba("e8f8ff")
    glass_d = hex_rgba("74a8c4")
    lab = hex_rgba("2b3440")

    # ---- roof: parapet, railing and a dish
    c.rect(0, 6, W, roof_h - 7, stone_d)
    c.rect(0, 6, W, 1, stone_l)
    c.rect(0, roof_h - 3, W, 2, hex_rgba("8d8371"))
    for i in range(2, W - 2, 5):            # roof railing
        c.rect(i, 3, 1, 3, steel)
    c.rect(1, 2, W - 2, 1, steel_d)
    # antenna mast with two crossbars — reads cleaner than a 7px dish
    c.rect(13, 0, 2, 7, steel)
    c.rect(14, 0, 1, 7, steel_d)
    c.rect(9, 2, 10, 1, steel)
    c.rect(10, 4, 8, 1, steel)
    c.set(13, 0, hex_rgba("e8433c"))
    c.rect(11, 6, 6, 1, steel_d)
    c.rect(0, roof_h - 1, W, 1, OUTLINE)

    y0 = roof_h
    c.rect(0, y0, W, wallH, stone)
    for j in range(y0 + 4, y0 + wallH, 5):  # ashlar courses
        c.rect(0, j, W, 1, stone_d)
    c.rect(0, y0, W, 2, stone_d)

    # ---- scarlet name band
    c.rect(1, y0 + 2, W - 2, 10, scarlet)
    c.rect(1, y0 + 2, W - 2, 1, hex_rgba("e83a2a"))
    c.rect(1, y0 + 11, W - 2, 1, scarlet_d)
    text3_centered(c, W // 2, y0 + 4, "BU ROBOTICS", IN_WHITE)

    # ---- upper storey: ribbon of lab windows
    c.rect(6, y0 + 16, 84, 13, glass_d)
    c.rect(7, y0 + 17, 82, 11, glass)
    c.rect(7, y0 + 17, 82, 3, glass_hi)
    for i in range(6, 90, 12):
        c.rect(i, y0 + 16, 2, 13, stone)
    c.rect(5, y0 + 29, 86, 2, stone_l)

    # ---- ground floor: the lab bay you can actually see into
    bx, bw = 8, 44
    c.rect(bx, y0 + 33, bw, 15, OUTLINE)
    c.rect(bx + 1, y0 + 34, bw - 2, 13, lab)
    c.rect(bx + 1, y0 + 34, bw - 2, 2, hex_rgba("3f4a58"))
    # robot arm: base, two links, a gripper
    ax = bx + 10
    c.rect(ax - 3, y0 + 44, 8, 3, steel)
    c.rect(ax, y0 + 38, 3, 6, steel)
    c.rect(ax, y0 + 38, 1, 6, steel_d)
    c.rect(ax + 2, y0 + 37, 9, 3, steel)
    c.rect(ax + 2, y0 + 39, 9, 1, steel_d)
    c.rect(ax + 10, y0 + 38, 2, 4, steel)
    c.set(ax + 12, y0 + 38, hex_rgba("e8c74a"))
    c.set(ax + 12, y0 + 41, hex_rgba("e8c74a"))
    # a little rover on the bench beside it
    rx = bx + 30
    c.rect(rx, y0 + 41, 11, 5, steel)
    c.rect(rx, y0 + 41, 11, 1, hex_rgba("b0b6bf"))
    c.rect(rx + 3, y0 + 38, 5, 3, scarlet)
    c.set(rx + 5, y0 + 37, steel)
    for wx2 in (rx + 1, rx + 5, rx + 9):
        c.rect(wx2, y0 + 46, 2, 2, hex_rgba("2b2028"))
    c.rect(bx + 20, y0 + 34, 1, 13, hex_rgba("3f4a58"))
    # ---- scarlet entrance, right of the bay
    dx = 62
    c.rect(dx - 2, y0 + 30, 22, 3, stone_l)
    c.rect(dx, y0 + 33, 18, 15, OUTLINE)
    c.rect(dx + 1, y0 + 34, 16, 14, scarlet)
    c.rect(dx + 2, y0 + 35, 14, 6, glass)
    c.rect(dx + 2, y0 + 35, 14, 2, glass_hi)
    c.rect(dx + 8, y0 + 33, 2, 15, scarlet_d)
    c.set(dx + 6, y0 + 43, hex_rgba("e8c74a"))
    c.set(dx + 11, y0 + 43, hex_rgba("e8c74a"))
    c.rect(0, y0 + wallH - 2, W, 2, stone_d)
    c.outline(OUTLINE)
    return c


def cafe_bene():
    """Cafe Bene — where they met, and where they still go to work. Chocolate
    fascia, cream letters, warm windows with two people at the near table. 5x2."""
    W, wallH, roof_h = 80, 32, 14
    c = Canvas(W, roof_h + wallH + 2)
    stucco = hex_rgba("efe3cf")
    stucco_d = hex_rgba("cfc2aa")
    choc = hex_rgba("4e352a")
    choc_l = hex_rgba("6b4a37")
    choc_d = hex_rgba("35231b")
    cream = hex_rgba("f6efdc")
    wood = hex_rgba("8a6a45")
    warm = hex_rgba("f4cf84")
    warm_d = hex_rgba("d9a95f")
    glass_hi = hex_rgba("fbeec4")
    green = hex_rgba("4a6b52")

    # ---- cornice + the name board
    c.rect(0, 0, W, 2, stucco)
    c.rect(0, 1, W, 2, stucco_d)
    c.rect(1, 3, W - 2, 9, choc)
    c.rect(1, 3, W - 2, 1, choc_l)
    c.rect(1, 11, W - 2, 1, choc_d)
    text3_centered(c, W // 2, 5, "CAFE BENE", cream)
    c.rect(0, roof_h - 2, W, 1, choc_d)
    c.rect(0, roof_h - 1, W, 1, OUTLINE)

    y0 = roof_h
    c.rect(0, y0, W, wallH, stucco)
    c.rect(0, y0, W, 2, stucco_d)

    # ---- awning over the windows
    ay = y0 + 2
    for j in range(5):
        for i in range(1, W - 1):
            c.set(i, ay + j, choc if (i // 5) % 2 == 0 else cream)
    c.rect(1, ay + 4, W - 2, 1, choc_d)
    c.rect(0, ay + 5, W, 1, OUTLINE)

    # ---- big warm windows: their table is the one on the left
    for (gx, gw) in ((3, 30), (47, 30)):
        c.rect(gx, y0 + 10, gw, 18, wood)
        c.rect(gx + 1, y0 + 11, gw - 2, 16, warm)
        c.rect(gx + 1, y0 + 11, gw - 2, 3, glass_hi)
        c.rect(gx + 1, y0 + 24, gw - 2, 3, warm_d)
        c.rect(gx + gw // 2 - 1, y0 + 11, 2, 16, wood)
    # two silhouettes at the near table ♥
    c.rect(8, y0 + 22, 5, 5, choc)          # her
    c.rect(9, y0 + 19, 3, 3, choc)
    c.rect(17, y0 + 21, 5, 6, choc)         # him
    c.rect(18, y0 + 18, 3, 3, choc)
    c.rect(13, y0 + 25, 4, 2, choc_l)       # the table between them
    # a plant on the sill of the other window
    c.rect(56, y0 + 21, 6, 6, green)
    c.rect(57, y0 + 25, 4, 3, hex_rgba("9a6f42"))
    # and their laptop table, because that's what they actually do here
    c.rect(60, y0 + 22, 9, 2, choc_l)
    c.rect(63, y0 + 24, 3, 4, choc_l)
    c.rect(61, y0 + 19, 6, 3, choc)

    # ---- door, right of centre
    dx = 36
    c.rect(dx, y0 + 12, 10, 20, choc_d)
    c.rect(dx + 1, y0 + 13, 8, 19, choc)
    c.rect(dx + 2, y0 + 14, 6, 8, warm)
    c.rect(dx + 2, y0 + 14, 6, 2, glass_hi)
    c.set(dx + 7, y0 + 24, hex_rgba("e8c74a"))
    # planters + a chalkboard leaning by the door
    for px in (33, 47):
        c.rect(px, y0 + 27, 6, 5, wood)
        c.rect(px, y0 + 25, 6, 2, green)
    c.rect(0, y0 + wallH - 2, W, 2, stucco_d)
    c.outline(OUTLINE)
    return c


BUILDINGS = {
    # LA — her house in Santa Clarita (8x3, the biggest sprite in the game)
    "la_home": big_house,
    # LA — Jack's place down the road, behind the garden (also 8x3)
    "la_jack": jack_house,
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
    "brownstone_b": lambda: building(
        4, 3, hex_rgba("9c5e46"), hex_rgba("7a4634"),
        hex_rgba("5e5e66"), hex_rgba("46464e"), hex_rgba("efe9db"), style="shop",
        stoop=True),
    # LA — the burger place (5x2). The arrow sign is prop_innoutsign.
    "innout": innout,
    # Boston — the real ones ♥
    "bu_building": bu_robotics,      # BU, robotics wing (6x3)
    "neu_building": neu_hall,        # Northeastern (6x3)
    "cafe": cafe_bene,               # Cafe Bene, where they met (5x2)
    "jvue": jvue_tower,              # her new place, at the LMA (5x4)
    "duplex": duplex_house,          # her parents', Brookline (6x3)
}


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main():
    os.makedirs(ASSETS, exist_ok=True)
    out = {}

    out["her"] = compose_char(
        {"down": HER_DRESS_DOWN, "up": HER_DRESS_UP, "side": HER_DRESS_SIDE},
        {"front": SKIRT_FRONT, "side": SKIRT_SIDE}, HER,
        extras=[{"torso": HER_DRESS_DOWN, "legs": SKIRT_FRONT["stand"], "overlay": CHEER_ARMS},
                {"torso": HER_DRESS_DOWN, "legs": SKIRT_FRONT["stand"]}])
    out["noah"] = compose_char(
        {"down": NOAH_DOWN, "up": NOAH_UP, "side": NOAH_SIDE},
        {"front": NOAH_LEGS_FRONT, "side": NOAH_LEGS_SIDE}, NOAH,
        extras=[{"torso": NOAH_DOWN, "legs": NOAH_LEGS_FRONT["stand"], "overlay": WAVE_ARM},
                {"torso": NOAH_DOWN, "legs": NOAH_LEGS_FRONT["stand"]}])
    # 🍔 the same two, in paper hats, for after the burger run. Her hair sits a
    # row lower than his afro, hence the per-character hat_dy.
    out["her_hat"] = compose_char(
        {"down": HER_DRESS_DOWN, "up": HER_DRESS_UP, "side": HER_DRESS_SIDE},
        {"front": SKIRT_FRONT, "side": SKIRT_SIDE}, HER, hat=PAPER_HAT, hat_dy=1,
        extras=[{"torso": HER_DRESS_DOWN, "legs": SKIRT_FRONT["stand"], "overlay": CHEER_ARMS},
                {"torso": HER_DRESS_DOWN, "legs": SKIRT_FRONT["stand"]}])
    out["noah_hat"] = compose_char(
        {"down": NOAH_DOWN, "up": NOAH_UP, "side": NOAH_SIDE},
        {"front": NOAH_LEGS_FRONT, "side": NOAH_LEGS_SIDE}, NOAH, hat=PAPER_HAT,
        extras=[{"torso": NOAH_DOWN, "legs": NOAH_LEGS_FRONT["stand"], "overlay": WAVE_ARM},
                {"torso": NOAH_DOWN, "legs": NOAH_LEGS_FRONT["stand"]}])
    out["npc_innout"] = compose_char(
        {"down": HER_DOWN, "up": HER_UP, "side": HER_SIDE},
        {"front": LEGS_FRONT, "side": LEGS_SIDE}, INOUT_A, hat=PAPER_HAT, hat_dy=1)
    out["npc_innout2"] = compose_char(
        {"down": NOAH_DOWN, "up": NOAH_UP, "side": NOAH_SIDE},
        {"front": NOAH_LEGS_FRONT, "side": NOAH_LEGS_SIDE}, INOUT_B, hat=PAPER_HAT)

    out["mookie"] = compose_mookie(MOOKIE)

    # ---- the house crew 🏡
    out["npc_marina"] = compose_char(
        {"down": HER_DOWN, "up": HER_UP, "side": HER_SIDE},
        {"front": APRON_FRONT, "side": APRON_SIDE}, MARINA)
    out["npc_mom"] = compose_char(
        {"down": MOM_DOWN, "up": MOM_UP, "side": MOM_SIDE},
        {"front": LEGS_FRONT, "side": LEGS_SIDE}, MOM)
    out["npc_bro"] = compose_char(
        {"down": BRO_DOWN, "up": BRO_UP, "side": BRO_SIDE},
        {"front": KID_LEGS_FRONT, "side": KID_LEGS_SIDE}, BRO,
        torso_h=BRO_TORSO_H, head_pad=BRO_HEAD_PAD)
    out["leo"] = compose_quad(MOOK, LEO)
    out["charlie"] = compose_quad(DOG, CHARLIE)

    # ---- the garden house 🌻
    out["npc_jack"] = compose_char(
        {"down": JACK_DOWN, "up": JACK_UP, "side": JACK_SIDE},
        {"front": JACK_LEGS_FRONT, "side": JACK_LEGS_SIDE}, JACK,
        torso_h=JACK_TORSO_H, head_pad=JACK_HEAD_PAD)
    out["npc_wife"] = compose_char(
        {"down": MOM_DOWN, "up": MOM_UP, "side": MOM_SIDE},
        {"front": LEGS_FRONT, "side": LEGS_SIDE}, WIFE)
    out["chakra"] = compose_quad(BIGDOG, CHAKRA)

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
    # ---- Aruba 🇦🇼
    out["divi"] = prop_divi()
    out["turtle"] = prop_turtle()
    out["palapa"] = prop_palapa()
    out["lounger"] = prop_lounger()
    out["starfish"] = prop_starfish()
    out["beachsign"] = prop_beachsign()
    out["critters"] = prop_critters()
    # ---- the LA beach 🌊 + the burger place
    out["innoutsign"] = prop_innoutsign()
    out["lifeguard"] = prop_lifeguard()
    out["umbrella"] = prop_umbrella()
    out["surfboards"] = prop_surfboards()
    out["volley"] = prop_volley()
    out["sandcastle"] = prop_sandcastle()
    # ---- the esplanade 🦆 + JVUE's monument sign
    out["bandshell"] = prop_bandshell()
    out["willow"] = prop_willow()
    out["esplsign"] = prop_esplsign()
    out["jvuesign"] = prop_jvuesign()
    # ---- house + interiors 🏡
    out["pool"] = prop_pool()
    out["in_sofa"] = in_sofa()
    out["in_tv"] = in_tv()
    out["in_table"] = in_table()
    out["in_counter"] = in_counter()
    out["in_fridge"] = in_fridge()
    out["in_shelf"] = in_shelf()
    out["in_plant"] = in_plant()
    out["in_fire"] = in_fireplace()
    out["in_petbeds"] = in_petbeds()
    out["in_bowl"] = in_bowl()
    out["in_lamp"] = in_lamp()
    out["in_rods"] = in_rods()
    out["in_ball"] = in_ball()
    # ---- the garden 🌻 + the house behind it
    out["vegbed"] = prop_vegbed(0)
    out["vegbed_b"] = prop_vegbed(1)
    out["corn"] = prop_corn()
    out["sunflower"] = prop_sunflower()
    out["firepit"] = prop_firepit()
    out["logseat"] = prop_logseat()
    out["hammock"] = prop_hammock()
    out["trellis"] = prop_trellis()
    out["herbpots"] = prop_herbpots()
    out["dreamcatcher"] = prop_dreamcatcher()
    out["bus"] = prop_bus()
    out["in_sofa2"] = in_sofa2()
    out["in_record"] = in_record()
    out["in_guitar"] = in_guitar()
    out["in_hangplant"] = in_hangplant()
    out["in_bigplant"] = in_bigplant()
    out["in_jars"] = in_jars()
    out["in_cushions"] = in_cushions()
    out["in_dogbed"] = in_dogbed()
    out["in_stove"] = in_stove()
    out["in_samovar"] = in_samovar()
    # ---- inside the burger place 🍔
    out["in_till"] = in_till()
    out["in_menuboard"] = in_menuboard()
    out["in_frystation"] = in_frystation()
    out["in_drinks"] = in_drinks()
    out["in_shakes"] = in_shakes()
    out["in_booth"] = in_booth()
    out["in_hatstack"] = in_hatstack()
    out["in_tray"] = in_tray()
    for mname, mfn in MONUMENTS.items():
        out[mname] = mfn()
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
                 ["npc_marina", "npc_mom", "npc_bro", "leo", "charlie"],
                 ["npc_jack", "npc_wife", "chakra"],
                 ["her_hat", "noah_hat", "npc_innout", "npc_innout2"],
                 ["tiles"],
                 ["tree", "palm", "figtree", "lamp", "bench", "quad", "sailboat"],
                 ["quad_ride", "horse", "column", "pyramid", "cypress", "matryoshka", "radio", "pumpkin"],
                 ["pisa", "cactus", "barrel", "station", "garden"],
                 ["maple", "garita", "lobster", "liberty", "flamingo", "eiffel",
                  "bigben", "minitorii", "stein", "balloon", "windmill", "lantern"],
                 ["divi", "turtle", "palapa", "lounger", "starfish", "beachsign", "critters"],
                 ["pool"],
                 ["in_sofa", "in_tv", "in_table", "in_counter", "in_fridge"],
                 ["in_shelf", "in_plant", "in_fire", "in_petbeds", "in_bowl", "in_lamp"],
                 ["in_rods", "in_ball", "in_sofa2", "in_record", "in_guitar", "in_hangplant"],
                 ["in_bigplant", "in_jars", "in_cushions", "in_dogbed", "in_stove", "in_samovar"],
                 ["vegbed", "vegbed_b", "corn", "sunflower", "firepit"],
                 ["logseat", "hammock", "trellis", "herbpots", "dreamcatcher", "bus"],
                 ["in_menuboard", "in_frystation", "in_till"],
                 ["in_drinks", "in_shakes", "in_booth", "in_hatstack", "in_tray"],
                 ["torii", "barrier", "fig", "fx", "shadow"],
                 ["innoutsign", "lifeguard", "umbrella", "surfboards", "volley",
                  "sandcastle"],
                 ["bandshell", "willow", "esplsign", "jvuesign"],
                 ["la_home", "la_jack", "la_house_b", "taco_shop", "theater"],
                 ["innout", "cafe", "brownstone_b"],
                 ["bu_building", "neu_building", "duplex", "jvue"]]
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
