# Weiwu tiny tactical policy

This asset is a real, offline-trained neural network. It imitates a documented
hand-authored utility teacher on synthetic battlefield states. It does **not** use
reinforcement learning, recorded player gameplay, combat rollouts, or online
learning. Held-out teacher agreement is not measured combat effectiveness.

The dependency-free browser ES module is `../dist/ai-model.js`. It performs a
24 → 48 → 32 → 8 multilayer perceptron with ReLU hidden layers, 3,032 learned
parameters, and a final softmax. There are no rule-based action overrides inside
`inferPolicy`. Input checks and clipping are the only runtime preprocessing.

```js
import {AI_META, inferPolicy} from './ai-model.js';
// Features follow AI_META.featureNames exactly. Keep all values in [0, 1].
const {action, confidence, probabilities} = inferPolicy(features);
// probabilities uses the order in AI_META.actions.
```

Use one squad-level decision periodically, for example twice per second. Apply
the returned action to the game's own soldier orders. The model has no memory;
an integration may separately retain an order briefly to prevent rapid changes.
Confidence is the largest softmax score, not a calibrated chance of success.
`inferPolicy` accepts arrays or typed arrays containing exactly 24 finite numbers,
throws on malformed inputs, and clamps numeric values to `[0,1]`.

## Feature and action contracts

| Index | Feature |
|---|---|
| 0–3 | Pressure north, east, south, west |
| 4–7 | Gate health north, east, south, west |
| 8–11 | Ammunition readiness north, east, south, west |
| 12 | Shared ammunition stock fraction |
| 13 | Soldier fraction with empty ammunition |
| 14 | Alive soldier count divided by 35 |
| 15 | Average soldier health |
| 16 | Armored fraction of enemies |
| 17 | Threat close to the core |
| 18 | Wave progress |
| 19 | Hauling soldier fraction |
| 20 | Casualty fraction |
| 21 | Core health fraction |
| 22 | Boss present, 0 or 1 |
| 23 | Average distance to depot, normalized |

Outputs, in order: `balanced`, `reinforce_north`, `reinforce_east`,
`reinforce_south`, `reinforce_west`, `resupply`, `fallback`, `focus_heavy`.

## Teacher and training

`teacher_utilities` in `train_policy.py` is the complete labeling specification.
The highest of its eight continuous utility scores supplies each target label.
It values intact, supplied formations for balance; pressure and damaged gates
for directional reinforcement; empty guns with available stock for resupply;
close core threats, damage and losses for fallback; armor and bosses for heavy
focus. Supply and core emergencies can outweigh boss focus. Coefficients are
explicit design preferences, not utilities learned from game outcomes.

The generator mixes 35% general correlated states, 12% calm states, 24% single-lane
threats, 12% supply crises, 10% penetrated defenses, and 7% armored situations.
Pressure, gate damage, casualties, close threat and readiness are correlated in
general states. Directional threats are sampled symmetrically. This generator
deliberately covers action extremes but does not recreate the actual simulation.

The default run uses 48,000 training, 10,000 validation, and 12,000 independently
generated test states. Seeds are 14621, 14622 and 14623. A NumPy Adam optimizer
trains cross entropy with 92% hard labels and 8% teacher soft labels for 80 epochs.
The best validation checkpoint is selected; the test set is evaluated afterwards.
The report contains exact overall/per-action scores, confusion matrix, utility
regret, validation history and limitations. `AI_META.validationAccuracy` is a
fraction, not a percentage.

## Reproduce and verify

Requires Python with NumPy and Node.js for the JavaScript checks. No Python or
NumPy dependency is shipped to the browser.

```sh
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 python ai/train_policy.py
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 python ai/evaluate_policy.py
node ai/test-policy.mjs
```

Training regenerates the browser module, compressed NumPy checkpoint, JSON
report, scenario tests, and Python/JavaScript parity vectors. Minor floating-point
variation across NumPy/BLAS implementations can change the exact checkpoint.
The JavaScript tests verify all eight tactical actions, crisis precedence,
normalization, finite-input handling, determinism and parity with the trained
Python model. The runtime benchmark is reported for the current Node host and
does not imply a measured mobile-device latency.

Known limits: the teacher can be wrong, held-out samples share its generator,
near-tie decisions can change under small perturbations, and real game feature
distributions or different action effects can invalidate the synthetic results.
Validate actual wave outcomes before claiming improved play.
