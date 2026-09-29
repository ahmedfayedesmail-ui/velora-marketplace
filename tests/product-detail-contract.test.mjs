import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(
  new URL("../src/scripts/52-s2a-variants.js", import.meta.url),
  "utf8"
);

assert.match(
  source,
  /select\("id,description,ingredients,benefits,how_to_use,warnings,skin_types,concerns,seasonal_fit"\)/
);

assert.match(source, /p\.description=p\.description\|\|""]/);
assert.match(source, /p\.usage=p\.usage\|\|p\.how_to_use\|\|""/);
assert.match(source, /p\.howToUse=p\.howToUse\|\|p\.how_to_use\|\|""/);
assert.match(source, /p\.skinTypes=Array\.isArray\(p\.skin_types\)\?p\.skin_types\.slice\(\):\[\]/);
assert.match(source, /p\.concerns=Array\.isArray\(p\.concerns\)\?p\.concerns\.slice\(\):\[\]/);
assert.match(source, /p\.ingredients=Array\.isArray\(p\.ingredients\)\?p\.ingredients\.slice\(\):\[\]/);
assert.match(source, /p\.benefits=Array\.isArray\(p\.benefits\)\?p\.benefits\.slice\(\):\[\]/);
assert.match(source, /p\.warnings=typeof p\.warnings==="string"\?p\.warnings:""/);
assert.match(source, /Benefits<\/h4>/);
assert.match(source, /Warnings<\/h4>/);

console.log("Product Detail canonical contract tests: PASS");
