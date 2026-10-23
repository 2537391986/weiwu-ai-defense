// Runtime and behavioral tests. No npm packages or browser required.
// Run: node ai/test-policy.mjs
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';

// Loading a data URL keeps this test compatible with any host package.json.
const source = await readFile(new URL('../dist/ai-model.js', import.meta.url), 'utf8');
const {AI_META, inferPolicy} = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const vectors = JSON.parse(await readFile(new URL('./test-vectors.json', import.meta.url), 'utf8'));
const report = JSON.parse(await readFile(new URL('./model-report.json', import.meta.url), 'utf8'));

assert.equal(AI_META.parameters, 3032);
assert.equal(AI_META.featureNames.length, 24);
assert.equal(AI_META.actions.length, 8);
assert.deepEqual(AI_META.actions, ['balanced', 'reinforce_north', 'reinforce_east', 'reinforce_south', 'reinforce_west', 'resupply', 'fallback', 'focus_heavy']);
assert.equal(AI_META.validationAccuracy, report.validationAccuracy);
assert.equal(AI_META.heldoutAccuracy, report.heldout.accuracy);

let greatestParityError = 0;
for (const vector of [...vectors.scenarios, ...vectors.parity]) {
  const result = inferPolicy(vector.features);
  assert.equal(result.probabilities.length, 8);
  assert(result.probabilities.every(p => Number.isFinite(p) && p >= 0 && p <= 1));
  assert(Math.abs(result.probabilities.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  const best = result.probabilities.indexOf(Math.max(...result.probabilities));
  assert.equal(result.action, AI_META.actions[best]);
  assert.equal(result.confidence, result.probabilities[best]);
  for (let i = 0; i < 8; i++) {
    const error = Math.abs(result.probabilities[i] - vector.probabilities[i]);
    greatestParityError = Math.max(error, greatestParityError);
    assert(error < 2e-5, `Python / JS parity error ${error}`);
  }
  if (vector.expectedAction) assert.equal(result.action, vector.expectedAction, vector.name);
  assert.deepEqual(inferPolicy(vector.features), result, 'inference is deterministic');
}

const baseline = vectors.scenarios[0].features;
assert.deepEqual(inferPolicy(new Float32Array(baseline)).action, inferPolicy(baseline).action);
for (const invalid of [null, [], baseline.slice(1), [...baseline, 0]]) {
  assert.throws(() => inferPolicy(invalid), TypeError);
}
for (const invalidValue of [NaN, Infinity, -Infinity, undefined, '0.5']) {
  const input = baseline.slice(); input[9] = invalidValue;
  assert.throws(() => inferPolicy(input), TypeError);
}
const outside = baseline.slice(); outside[0] = 4; outside[12] = -2;
const bounded = baseline.slice(); bounded[0] = 1; bounded[12] = 0;
assert.deepEqual(inferPolicy(outside), inferPolicy(bounded));

// Low-complexity mobile CPU workload: a shared squad policy, ~3k multiply-adds.
for (let i = 0; i < 1000; i++) inferPolicy(baseline);
const started = performance.now();
const repetitions = 20000;
for (let i = 0; i < repetitions; i++) inferPolicy(vectors.parity[i % vectors.parity.length].features);
const elapsed = performance.now() - started;
console.log(JSON.stringify({passed: true, contractScenarios: vectors.scenarios.length,
  pythonJsParityVectors: vectors.scenarios.length + vectors.parity.length,
  greatestParityError, benchmark: {repetitions, totalMs: elapsed, meanMs: elapsed / repetitions},
  benchmarkCaveat: 'This is the current Node host, not a measured mobile device.'}, null, 2));
