import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/scripts/72-s1-e-customer-beauty-ai.js", import.meta.url), "utf8");

const document = {
  readyState: "complete",
  documentElement: { lang: "en" },
  body: { style: {} },
  head: { appendChild() {} },
  addEventListener() {},
  getElementById() { return null; },
  querySelector() { return null; },
  createElement() { return { style: {}, setAttribute() {}, addEventListener() {} }; }
};

const window = {
  STATE: { user: { id: "test-user" } },
  addEventListener() {},
  escapeHtml(value) { return String(value); }
};

vm.runInNewContext(source, { window, document, console, Set, Array, String, Error }, {
  filename: "src/scripts/72-s1-e-customer-beauty-ai.js"
});

const validate = window.veloraBeautyAI.validateCandidate;

assert.equal(
  JSON.stringify(validate({ decision: "ready", skin_type: "oily", goal: "hydration", routine_budget: "under_500", missing_fields: [] })),
  JSON.stringify({ decision: "ready", skin_type: "oily", goal: "hydration", routine_budget: "under_500", missing_fields: [] })
);

assert.equal(
  JSON.stringify(validate({ decision: "needs_clarification", skin_type: null, goal: "hydration", routine_budget: "unknown", missing_fields: ["skin_type"] }).missing_fields),
  JSON.stringify(["skin_type"])
);

assert.throws(
  () => validate({ decision: "ready", skin_type: "medical", goal: "hydration", routine_budget: "under_500", missing_fields: [] }),
  /AI_SKIN_TYPE_INVALID/
);

assert.throws(
  () => validate({ decision: "ready", skin_type: "oily", goal: null, routine_budget: "under_500", missing_fields: [] }),
  /AI_READY_CONTRACT_INVALID/
);

assert.throws(
  () => validate({ decision: "unsupported", skin_type: "oily", goal: null, routine_budget: null, missing_fields: [] }),
  /AI_NON_ACTIONABLE_CONTRACT_INVALID/
);

console.log("Customer Beauty AI contract tests: PASS");
