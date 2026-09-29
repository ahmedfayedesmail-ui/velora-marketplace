import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/scripts/72-s1-e-customer-beauty-ai.js", import.meta.url), "utf8");

const quizSource = fs.readFileSync(new URL("../src/scripts/61-s1-c-quiz-v2.js", import.meta.url), "utf8");

assert.match(quizSource, /veloraQuizIntentInput/);
assert.match(quizSource, /veloraQuizIntentSubmit/);
assert.match(quizSource, /veloraBeautyAI\.interpret/);
assert.match(quizSource, /decision === 'ready'/);
assert.match(quizSource, /decision === 'needs_clarification'/);
assert.match(quizSource, /state\.ai\.mode === 'clarify'/);
assert.match(quizSource, /velora_save_beauty_passport_v2/);
assert.match(quizSource, /Confirm & build routine/);
assert.match(quizSource, /تأكيد وبناء الروتين/);
assert.match(quizSource, /No problem — we can continue with the regular questions/);
assert.doesNotMatch(quizSource, /Ask AI|AI Assistant|Chat with AI|AI Badge|Describe it your way/);


const window = {};
const document = {
  getElementById() { return null; },
  querySelector() { return null; },
  createElement() { throw new Error("CUSTOMER_AI_MUST_NOT_CREATE_DOM"); }
};

vm.runInNewContext(source, {
  window,
  document,
  console,
  Set,
  Array,
  String,
  Error,
  Object,
  Promise
}, {
  filename: "src/scripts/72-s1-e-customer-beauty-ai.js"
});

assert.equal(typeof window.veloraBeautyAI.interpret, "function");
assert.equal(typeof window.veloraBeautyAI.validateCandidate, "function");
assert.equal(window.veloraBeautyAI.maxInputChars, 800);
assert.equal(window.veloraBeautyIntentInterpreter, window.veloraBeautyAI);

assert.doesNotMatch(source, /createElement|appendChild|addEventListener|classList|innerHTML/);
assert.doesNotMatch(source, /veloraBeautyAiModal|veloraBeautyAiEntry|Describe it your way|Tell us in your own words/);

// vm.runInNewContext creates values with the VM realm's Array/Object prototypes.
// Normalize the return value through JSON before comparing so the contract test
// verifies structure/content instead of realm identity.
function normalize(value) {
  return JSON.parse(JSON.stringify(value));
}

assert.deepEqual(
  normalize(window.veloraBeautyAI.validateCandidate({
    decision: "ready",
    skin_type: "oily",
    goal: "hydration",
    routine_budget: "under_500",
    missing_fields: []
  })),
  {
    decision: "ready",
    skin_type: "oily",
    goal: "hydration",
    routine_budget: "under_500",
    missing_fields: []
  }
);

assert.deepEqual(
  normalize(window.veloraBeautyAI.validateCandidate({
    decision: "needs_clarification",
    skin_type: null,
    goal: "hydration",
    routine_budget: "unknown",
    missing_fields: ["skin_type"]
  }).missing_fields),
  ["skin_type"]
);

assert.throws(
  () => window.veloraBeautyAI.validateCandidate({
    decision: "ready",
    skin_type: "medical",
    goal: "hydration",
    routine_budget: "under_500",
    missing_fields: []
  }),
  /AI_SKIN_TYPE_INVALID/
);

assert.throws(
  () => window.veloraBeautyAI.validateCandidate({
    decision: "ready",
    skin_type: "oily",
    goal: null,
    routine_budget: "under_500",
    missing_fields: []
  }),
  /AI_READY_CONTRACT_INVALID/
);

assert.throws(
  () => window.veloraBeautyAI.validateCandidate({
    decision: "unsupported",
    skin_type: "oily",
    goal: null,
    routine_budget: null,
    missing_fields: []
  }),
  /AI_NON_ACTIONABLE_CONTRACT_INVALID/
);

console.log("Internal invisible Beauty AI contract tests: PASS");
