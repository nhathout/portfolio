#!/usr/bin/env python3
"""
Encrypt / decrypt data/memories.enc — pure stdlib, no pip installs, no node.

    python crypt.py decrypt ../data/memories.enc mookie ../data/memories.json
    python crypt.py encrypt ../data/memories.json mookie "furry roommate..."
    python crypt.py encrypt ../data/memories.json "fig,mookie" "the fruit or the cat"

Several passwords, comma-separated, all open the same bundle: the text is
encrypted once with a random data key, and that key is wrapped separately for
each password (v2 format). Nothing readable ends up in the public repo.

Same format as tools/encrypt.mjs (AES-256-GCM, PBKDF2-SHA256 150k), so the
browser gate reads either one. AES + GCM are implemented here because this
machine has neither `cryptography` nor `node`.
"""

import hashlib
import json
import os
import struct
import sys

# ---------------------------------------------------------------- AES-256 core

SBOX = []
INV_SBOX = [0] * 256


def _init_sbox():
    p = q = 1
    box = [0] * 256
    while True:
        # p *= 3 in GF(2^8)
        p = p ^ ((p << 1) & 0xFF) ^ (0x1B if p & 0x80 else 0)
        # q /= 3
        q ^= (q << 1) & 0xFF
        q ^= (q << 2) & 0xFF
        q ^= (q << 4) & 0xFF
        if q & 0x80:
            q ^= 0x09
        x = q ^ ((q << 1) | (q >> 7)) ^ ((q << 2) | (q >> 6)) \
            ^ ((q << 3) | (q >> 5)) ^ ((q << 4) | (q >> 4))
        box[p] = (x ^ 0x63) & 0xFF
        if p == 1:
            break
    box[0] = 0x63
    return box


SBOX = _init_sbox()
for _i, _v in enumerate(SBOX):
    INV_SBOX[_v] = _i

RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1B, 0x36,
        0x6C, 0xD8, 0xAB, 0x4D]


def _xtime(a):
    a <<= 1
    return (a ^ 0x1B) & 0xFF if a & 0x100 else a


def _mul(a, b):
    r = 0
    while b:
        if b & 1:
            r ^= a
        a = _xtime(a)
        b >>= 1
    return r


def _expand_key(key):
    nk = len(key) // 4
    nr = nk + 6
    w = [list(key[4 * i:4 * i + 4]) for i in range(nk)]
    for i in range(nk, 4 * (nr + 1)):
        t = list(w[i - 1])
        if i % nk == 0:
            t = t[1:] + t[:1]
            t = [SBOX[b] for b in t]
            t[0] ^= RCON[i // nk - 1]
        elif nk > 6 and i % nk == 4:
            t = [SBOX[b] for b in t]
        w.append([w[i - nk][j] ^ t[j] for j in range(4)])
    return w, nr


def _encrypt_block(block, w, nr):
    s = [list(block[i::4]) for i in range(4)]  # column-major -> row-major

    def add_round_key(rnd):
        for c in range(4):
            for r in range(4):
                s[r][c] ^= w[rnd * 4 + c][r]

    add_round_key(0)
    for rnd in range(1, nr + 1):
        for r in range(4):
            for c in range(4):
                s[r][c] = SBOX[s[r][c]]
        for r in range(1, 4):
            s[r] = s[r][r:] + s[r][:r]
        if rnd != nr:
            for c in range(4):
                a = [s[r][c] for r in range(4)]
                s[0][c] = _mul(a[0], 2) ^ _mul(a[1], 3) ^ a[2] ^ a[3]
                s[1][c] = a[0] ^ _mul(a[1], 2) ^ _mul(a[2], 3) ^ a[3]
                s[2][c] = a[0] ^ a[1] ^ _mul(a[2], 2) ^ _mul(a[3], 3)
                s[3][c] = _mul(a[0], 3) ^ a[1] ^ a[2] ^ _mul(a[3], 2)
        add_round_key(rnd)
    return bytes(s[r][c] for c in range(4) for r in range(4))


# ---------------------------------------------------------------- GCM

def _ghash_mul(x, y):
    """Multiply two 128-bit ints in GF(2^128), GCM bit order."""
    z = 0
    v = y
    for i in range(127, -1, -1):
        if (x >> i) & 1:
            z ^= v
        if v & 1:
            v = (v >> 1) ^ (0xE1 << 120)
        else:
            v >>= 1
    return z


def _ghash(h, data):
    y = 0
    for i in range(0, len(data), 16):
        blk = data[i:i + 16].ljust(16, b"\x00")
        y = _ghash_mul(y ^ int.from_bytes(blk, "big"), h)
    return y


def _gctr(w, nr, icb, data):
    out = bytearray()
    ctr = int.from_bytes(icb, "big")
    for i in range(0, len(data), 16):
        ks = _encrypt_block(ctr.to_bytes(16, "big"), w, nr)
        chunk = data[i:i + 16]
        out += bytes(a ^ b for a, b in zip(chunk, ks))
        ctr = (ctr & ~0xFFFFFFFF) | ((ctr + 1) & 0xFFFFFFFF)
    return bytes(out)


def _gcm_setup(key, iv):
    w, nr = _expand_key(key)
    h = int.from_bytes(_encrypt_block(b"\x00" * 16, w, nr), "big")
    if len(iv) == 12:
        j0 = iv + b"\x00\x00\x00\x01"
    else:
        pad = (16 - len(iv) % 16) % 16
        j0 = _ghash(h, iv + b"\x00" * pad + b"\x00" * 8 +
                    struct.pack(">Q", len(iv) * 8)).to_bytes(16, "big")
    return w, nr, h, j0


def _gcm_tag(w, nr, h, j0, ct):
    pad = (16 - len(ct) % 16) % 16
    s = _ghash(h, ct + b"\x00" * pad + struct.pack(">QQ", 0, len(ct) * 8))
    return _gctr(w, nr, j0, s.to_bytes(16, "big"))


def gcm_decrypt(key, iv, ct_with_tag):
    ct, tag = ct_with_tag[:-16], ct_with_tag[-16:]
    w, nr, h, j0 = _gcm_setup(key, iv)
    if _gcm_tag(w, nr, h, j0, ct) != tag:
        raise ValueError("auth tag mismatch — wrong password?")
    icb = (int.from_bytes(j0, "big") + 1).to_bytes(16, "big")
    return _gctr(w, nr, icb, ct)


def gcm_encrypt(key, iv, plain):
    w, nr, h, j0 = _gcm_setup(key, iv)
    icb = (int.from_bytes(j0, "big") + 1).to_bytes(16, "big")
    ct = _gctr(w, nr, icb, plain)
    return ct + _gcm_tag(w, nr, h, j0, ct)


# ---------------------------------------------------------------- bundle io

import base64

ITER = 150000


def derive(password, salt, iterations=ITER):
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations, 32)


def decrypt_file(enc_path, password):
    bundle = json.load(open(enc_path, encoding="utf-8"))
    iters = bundle.get("iter", ITER)
    if bundle.get("v", 1) >= 2:
        # v2: unwrap the data key with this password, then open the content
        data_key = None
        for slot in bundle["keys"]:
            try:
                data_key = gcm_decrypt(
                    derive(password, base64.b64decode(slot["salt"]), iters),
                    base64.b64decode(slot["iv"]), base64.b64decode(slot["ct"]))
                break
            except Exception:
                continue
        if data_key is None:
            raise ValueError("no key slot opens with that password")
    else:
        data_key = derive(password, base64.b64decode(bundle["salt"]), iters)
    plain = gcm_decrypt(data_key, base64.b64decode(bundle["iv"]),
                        base64.b64decode(bundle["ct"]))
    return plain.decode("utf-8")


def encrypt_file(json_path, passwords, hint=None):
    """passwords: one string, or several separated by commas — any of them opens it."""
    if isinstance(passwords, str):
        passwords = [p.strip() for p in passwords.split(",") if p.strip()]
    if not passwords:
        raise ValueError("need at least one password")
    data = open(json_path, encoding="utf-8").read()
    json.loads(data)  # validate before encrypting
    data_key = os.urandom(32)
    iv = os.urandom(12)
    ct = gcm_encrypt(data_key, iv, data.encode("utf-8"))
    slots = []
    for pw in passwords:
        salt = os.urandom(16)
        kiv = os.urandom(12)
        slots.append({"salt": base64.b64encode(salt).decode(),
                      "iv": base64.b64encode(kiv).decode(),
                      "ct": base64.b64encode(
                          gcm_encrypt(derive(pw, salt), kiv, data_key)).decode()})
    out = os.path.join(os.path.dirname(os.path.abspath(json_path)), "memories.enc")
    bundle = {"v": 2, "iter": ITER,
              "iv": base64.b64encode(iv).decode(),
              "ct": base64.b64encode(ct).decode(),
              "keys": slots}
    if hint:
        bundle["hint"] = hint
    with open(out, "w", encoding="utf-8") as f:
        json.dump(bundle, f)
    return out


def main(argv):
    if len(argv) < 4:
        print(__doc__)
        return 1
    mode, path, password = argv[1], argv[2], argv[3]
    if mode == "decrypt":
        text = decrypt_file(path, password)
        if len(argv) > 4:
            with open(argv[4], "w", encoding="utf-8") as f:
                f.write(text)
            print("wrote", argv[4], f"({len(text)} chars)")
        else:
            print(text)
    elif mode == "encrypt":
        out = encrypt_file(path, password, argv[4] if len(argv) > 4 else None)
        print("wrote", out)
        # round-trip check EVERY password so a bad build never ships
        for pw in [p.strip() for p in password.split(",") if p.strip()]:
            assert json.loads(decrypt_file(out, pw))
            print(f"  round-trip verified ✓  ({pw!r})")
    else:
        print(__doc__)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
