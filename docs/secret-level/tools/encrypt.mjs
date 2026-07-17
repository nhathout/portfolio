#!/usr/bin/env node
// Encrypt memories.json → memories.enc (AES-GCM, key derived from password).
//
//   node encrypt.mjs ../data/memories.json "the-password" "optional hint shown after 3 wrong tries"
//
// Writes ../data/memories.enc next to the input file.

import { webcrypto as crypto } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const [, , file, password, hint] = process.argv;
if (!file || !password) {
  console.error('usage: node encrypt.mjs <memories.json> <password> ["hint"]');
  process.exit(1);
}

const ITER = 150000;
const data = readFileSync(file, "utf8");
JSON.parse(data); // validate before encrypting

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const raw = await crypto.subtle.importKey(
  "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" },
  raw, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const ct = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv }, key, new TextEncoder().encode(data));

const b64 = (buf) => Buffer.from(buf).toString("base64");
const out = join(dirname(file), "memories.enc");
writeFileSync(out, JSON.stringify({
  v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct),
  ...(hint ? { hint } : {}),
}));
console.log(`wrote ${out} (${JSON.parse(readFileSync(out)).ct.length} bytes ct)`);
