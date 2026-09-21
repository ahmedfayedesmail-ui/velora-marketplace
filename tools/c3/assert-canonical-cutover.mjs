#!/usr/bin/env node
/**
 * Velora C3 — Canonical Catalog Cutover Guard
 *
 * Default mode: report current legacy references.
 * --strict mode: fail when legacy catalog references remain.
 *
 * No runtime import. No network. Read-only source scanner.
 */

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, "src");

const patterns = [
  /MAHA_DATA\.PRODUCTS/g,
  /MAHA_DATA\?\.PRODUCTS/g,
  /\bgetAllProducts\s*\(/g,
  /\bgetProductById\s*\(/g,
  /\b(?:const|let|var)\s+PRODUCTS\s*=\s*\[/g
];

const extensions = new Set([".js", ".html", ".mjs", ".cjs"]);
const allowedCurrentFiles = new Set([
  "src/scripts/00-localization.js",
  "src/scripts/34-payments.js",
  "src/scripts/52-s2a-variants.js",
  "src/scripts/53-s2c-reviews.js",
  "src/scripts/54-s2b-wishlist.js",
  "src/scripts/57-s2-checkout-e2e.js"
]);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (extensions.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const findings = [];

for (const file of walk(srcRoot)) {
  const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");
  const text = fs.readFileSync(file, "utf8");
  for (const regex of patterns) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const line = text.slice(0, match.index).split("\n").length;
      findings.push({ file: rel, line, token: match[0] });
    }
  }
}

const unexpected = findings.filter((x) => !allowedCurrentFiles.has(x.file));
const summary = {
  strict: process.argv.includes("--strict"),
  totalFindings: findings.length,
  unexpectedFindings: unexpected.length,
  files: [...new Set(findings.map((x) => x.file))].sort(),
  unexpected
};

console.log(JSON.stringify(summary, null, 2));

if (summary.strict && unexpected.length > 0) {
  console.error("C3 FAIL: legacy catalog references remain outside the approved cutover set.");
  process.exit(1);
}

if (summary.strict) {
  console.log("C3 PASS: no legacy catalog references remain outside the approved cutover set.");
}
