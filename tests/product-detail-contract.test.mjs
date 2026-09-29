import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(
  new URL("../src/scripts/52-s2a-variants.js", import.meta.url),
  "utf8"
);

assert.ok(source.includes('select("id,description,ingredients,benefits,how_to_use,warnings,skin_types,concerns,seasonal_fit")'));


for (const token of [
  'p.description=p.description||""',
  'p.usage=p.usage||p.how_to_use||""',
  'p.howToUse=p.howToUse||p.how_to_use||""',
  'p.skinTypes=Array.isArray(p.skin_types)?p.skin_types.slice():[]',
  'p.concerns=Array.isArray(p.concerns)?p.concerns.slice():[]',
  'p.ingredients=Array.isArray(p.ingredients)?p.ingredients.slice():[]',
  'p.benefits=Array.isArray(p.benefits)?p.benefits.slice():[]',
  'p.warnings=typeof p.warnings==="string"?p.warnings:""',
  'Benefits</h4>',
  'Warnings</h4>'
]) assert.ok(source.includes(token), token);

console.log("Product Detail canonical contract tests: PASS");
