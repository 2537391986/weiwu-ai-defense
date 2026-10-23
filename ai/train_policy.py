#!/usr/bin/env python3
"""Reproduce the tiny Weiwu tactical neural policy with NumPy only.

This is supervised imitation of an explicit synthetic utility teacher, NOT
reinforcement learning. The held-out score measures teacher imitation, not
game-win improvement. Run from any directory: python ai/train_policy.py
"""
from __future__ import annotations

import os
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")

import argparse
import json
import time
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SEED = 14621
FEATURES = [
    "pressure_north", "pressure_east", "pressure_south", "pressure_west",
    "gate_health_north", "gate_health_east", "gate_health_south", "gate_health_west",
    "ammo_readiness_north", "ammo_readiness_east", "ammo_readiness_south", "ammo_readiness_west",
    "shared_stock_fraction", "empty_ammo_soldier_fraction", "alive_count_div_35",
    "average_health", "armored_enemy_fraction", "close_core_threat", "wave_progress",
    "hauling_soldier_fraction", "casualty_fraction", "core_health", "boss_present",
    "average_depot_distance_normalized",
]
ACTIONS = ["balanced", "reinforce_north", "reinforce_east", "reinforce_south",
           "reinforce_west", "resupply", "fallback", "focus_heavy"]
SHAPES = [(24, 48), (48,), (48, 32), (32,), (32, 8), (8,)]
NAMES = ["w1", "b1", "w2", "b2", "w3", "b3"]


def generate_states(n: int, seed: int) -> np.ndarray:
    """Generate independent correlated states plus deliberately varied crises.

    General states correlate pressure, damage, casualties and close threats.
    Archetypes expand coverage of calm, single-lane, ammunition, breach and
    armored situations. Their labels are still computed by the same teacher.
    All 24 features are bounded in [0,1]; alive count is an integer / 35.
    """
    r = np.random.default_rng(seed)
    x = np.zeros((n, 24), dtype=np.float32)
    wave = r.random(n)
    p = np.clip(r.beta(1.6, 4.0, (n, 4)) + wave[:, None] * .22, 0, 1)
    hot = r.integers(4, size=n)
    p[np.arange(n), hot] += r.uniform(0, .28, n)
    p = np.clip(p, 0, 1)
    gates = np.clip(1 - p * wave[:, None] * r.uniform(.35, 1.4, (n, 4))
                    + r.normal(0, .07, (n, 4)), 0, 1)
    empty = r.beta(1.3, 4.1, n)
    stock = r.beta(2.0, 1.7, n)
    ammo = np.clip(1 - .8 * empty[:, None] - .3 * p + r.normal(0, .12, (n, 4)), 0, 1)
    alive = np.maximum(4, r.binomial(35, 1 - wave * r.uniform(.05, .55, n))) / 35
    close = np.clip(np.max(p * (1 - gates), axis=1) * r.uniform(.35, 1.25, n), 0, 1)
    x[:, :4], x[:, 4:8], x[:, 8:12] = p, gates, ammo
    x[:, 12], x[:, 13], x[:, 14] = stock, empty, alive
    x[:, 15] = np.clip(.96 - .28 * p.mean(1) - .25 * (1 - alive) + r.normal(0, .10, n), .12, 1)
    x[:, 16] = r.beta(1.1, 4.0, n)
    x[:, 17], x[:, 18] = close, wave
    x[:, 19] = np.clip(empty * stock * .38 + r.normal(0, .055, n), 0, .65)
    x[:, 20] = 1 - alive
    x[:, 21] = np.clip(1 - close * wave * r.uniform(.1, .9, n), .08, 1)
    x[:, 22] = r.random(n) < (.06 + wave * .12)
    x[:, 23] = r.beta(2.0, 3.0, n)
    kind = r.choice(6, n, p=[.35, .12, .24, .12, .10, .07])

    def fill(k, columns, lo, hi):
        ids = np.flatnonzero(kind == k)
        columns = np.atleast_1d(columns)
        if ids.size:
            x[np.ix_(ids, columns)] = r.uniform(lo, hi, (ids.size, columns.size))

    # Calm, adequately supplied states.
    for cols, lo, hi in [(range(4), .02, .28), (range(4, 8), .70, 1),
                         (range(8, 12), .60, 1), ([12], .35, 1), ([13], 0, .13),
                         ([14], .80, 1), ([15], .70, 1), ([16], 0, .20),
                         ([17], 0, .08), ([21], .90, 1), ([22], 0, 0)]:
        fill(1, cols, lo, hi)
    # Strong single-lane threats with sufficient ammunition.
    for cols, lo, hi in [(range(4), .05, .35), (range(4, 8), .40, 1),
                         (range(8, 12), .45, 1), ([13], 0, .18), ([14], .65, 1),
                         ([15], .55, .95), ([16], 0, .35), ([17], 0, .20),
                         ([21], .75, 1), ([22], 0, 0)]:
        fill(2, cols, lo, hi)
    ids = np.flatnonzero(kind == 2)
    x[ids, r.integers(4, size=len(ids))] = r.uniform(.72, 1, len(ids))
    # Empty firearms; enough depot stock to make a supply order meaningful.
    for cols, lo, hi in [(range(4), .08, .70), (range(4, 8), .35, 1),
                         (range(8, 12), .01, .28), ([12], .35, 1), ([13], .50, 1),
                         ([14], .50, 1), ([15], .40, .95), ([16], 0, .40),
                         ([17], 0, .30), ([19], 0, .20), ([21], .65, 1), ([22], 0, 0)]:
        fill(3, cols, lo, hi)
    # A penetrated defense and immediate danger at the core.
    for cols, lo, hi in [(range(4), .50, 1), (range(4, 8), 0, .45),
                         (range(8, 12), .15, .75), ([13], .10, .55), ([14], .25, .70),
                         ([15], .25, .75), ([16], 0, .60), ([17], .60, 1), ([21], .12, .65)]:
        fill(4, cols, lo, hi)
    # Heavy targets without an overriding supply or core emergency.
    for cols, lo, hi in [(range(4), .20, .75), (range(4, 8), .55, 1),
                         (range(8, 12), .50, 1), ([12], .35, 1), ([13], 0, .15),
                         ([14], .65, 1), ([15], .55, .95), ([16], .55, 1),
                         ([17], 0, .20), ([21], .80, 1)]:
        fill(5, cols, lo, hi)
    ids = np.flatnonzero(kind == 5)
    x[ids, 22] = r.random(len(ids)) < .65
    x[:, 14] = np.round(x[:, 14] * 35) / 35
    x[:, 20] = 1 - x[:, 14]
    return np.clip(x, 0, 1).astype(np.float32)


def teacher_utilities(x: np.ndarray) -> np.ndarray:
    """Hand-authored utility teacher, not a simulated or optimized outcome.

    Balanced rewards a healthy supplied formation. Reinforcement combines
    absolute pressure, excess over other lanes and threatened gate condition.
    Resupply rewards empty guns when depot stock exists, discounting active
    haulers. Fallback responds to close core danger, damage and casualties.
    Focus-heavy responds to armor/bosses, discounted by immediate emergencies.
    Coefficients encode design preferences; no combat outcome validates them.
    """
    p, gates, ammo = x[:, :4], x[:, 4:8], x[:, 8:12]
    stock, empty, alive, health, armor, close, wave, hauling, casualty, core, boss, distance = x[:, 12:].T
    mean_p, max_p = p.mean(1), p.max(1)
    mean_a, mean_g = ammo.mean(1), gates.mean(1)
    breach = np.max(p * (1 - gates), axis=1)
    y = np.empty((len(x), 8), dtype=np.float32)
    y[:, 0] = (.65 + .28 * mean_a + .18 * mean_g + .20 * alive + .12 * health
               + .25 * mean_p - .50 * max_p - .45 * empty - .30 * close
               - .20 * boss - .20 * armor + .08 * stock)
    y[:, 1:5] = (.10 + .85 * p + .90 * (p - mean_p[:, None])
                 + .65 * p * (1 - gates) + .20 * p * (1 - ammo)
                 + (.10 * health - .28 * empty - .20 * close - .10 * (1 - core))[:, None])
    y[:, 5] = (.12 + (1.55 * empty + .75 * (1 - mean_a)) * (.35 + .65 * stock)
               + .25 * stock - .55 * hauling - .25 * close + .10 * distance * empty)
    y[:, 6] = (.10 + 1.50 * close + .85 * (1 - core) + .45 * casualty
               + .35 * (1 - health) + .60 * breach + .20 * (1 - alive) - .35 * mean_g)
    y[:, 7] = (.15 + armor + .85 * boss + .25 * max_p + .10 * mean_a
               - .50 * empty - .20 * close + .10 * stock - .40 * (1 - core))
    # Progress and travel are weak urgency cues, not dominant action selectors.
    y[:, 6] += .05 * wave * close
    y[:, 1:5] += (.025 * wave)[:, None] * p
    return y


def softmax(a):
    exp = np.exp(a - a.max(axis=1, keepdims=True))
    return exp / exp.sum(axis=1, keepdims=True)


def forward(x, params, cache=False):
    w1, b1, w2, b2, w3, b3 = params
    z = x * 2 - 1
    h1 = np.maximum(z @ w1 + b1, 0)
    h2 = np.maximum(h1 @ w2 + b2, 0)
    logits = h2 @ w3 + b3
    return (logits, (z, h1, h2)) if cache else logits


def accuracy(x, labels, params):
    return float((forward(x, params).argmax(1) == labels).mean())


def make_cases():
    def base():
        return np.array([.14] * 4 + [.90] * 4 + [.80] * 4
                        + [.80, .04, 1, .90, .08, .03, .40, .07, 0, .98, 0, .35], np.float32)
    cases = []
    def add(name, x, expected):
        cases.append({"name": name, "features": x.tolist(), "expectedAction": expected})
    add("calm supplied formation", base(), "balanced")
    for lane in range(4):
        x = base()
        x[lane] = .98
        x[4 + lane] = .58
        add("strong " + ACTIONS[lane + 1].split("_")[1] + " pressure", x, ACTIONS[lane + 1])
    x = base(); x[8:12] = .05; x[13] = .92; x[19] = .04
    add("empty guns and stocked depot", x, "resupply")
    x = base(); x[:4] = [.95, .60, .50, .55]; x[4:8] = [.02, .35, .40, .32]
    x[14] = 14/35; x[15] = .40; x[17] = .92; x[20] = .60; x[21] = .30
    add("breach and close core danger", x, "fallback")
    x = base(); x[:4] = [.55, .45, .50, .45]; x[16] = .85; x[22] = 1
    add("armored boss with ready firearms", x, "focus_heavy")
    x = base(); x[16] = .95; x[:4] = .55
    add("large armored force without boss", x, "focus_heavy")
    x = base(); x[16] = .85; x[22] = 1; x[17] = .98; x[21] = .15; x[4:8] = .05
    add("core emergency overrides boss focus", x, "fallback")
    x = base(); x[8:12] = .02; x[13] = .98; x[16] = .50; x[22] = 1
    add("empty guns override boss focus", x, "resupply")
    return cases


def export_js(params, report):
    meta = {
        "name": "Weiwu Tiny Tactical Policy v1", "parameters": 3032,
        "architecture": [24, 48, 32, 8],
        "training": "Synthetic supervised imitation of a documented hand-authored utility teacher; not reinforcement learning.",
        "validationAccuracy": report["validationAccuracy"],
        "heldoutAccuracy": report["heldout"]["accuracy"],
        "seed": SEED, "featureNames": FEATURES, "actions": ACTIONS,
        "confidenceMeaning": "Maximum neural softmax score; not calibrated game-win probability.",
    }
    arrays = []
    for name, value in zip(NAMES, params):
        nums = ",".join(format(float(v), ".8g") for v in value.ravel())
        arrays.append("const " + name + " = new Float32Array([" + nums + "]);")
    code = '''// Generated by ai/train_policy.py. Actual trained MLP: 24 -> 48 -> 32 -> 8.
// Synthetic supervised teacher imitation; no RL or game-win claim.
export const AI_META = Object.freeze(METADATA);
Object.freeze(AI_META.actions);
Object.freeze(AI_META.featureNames);
WEIGHTS

function dense(input, weights, biases, outputSize, relu) {
  const output = new Float64Array(outputSize);
  for (let j = 0; j < outputSize; j++) {
    let value = biases[j];
    for (let i = 0; i < input.length; i++) value += input[i] * weights[i * outputSize + j];
    output[j] = relu ? Math.max(0, value) : value;
  }
  return output;
}

/** Infer a tactical action from exactly 24 finite normalized features.
 * Values outside [0,1] are clamped. Accepts arrays and typed arrays.
 * Call periodically (e.g. twice per second), not for every individual soldier.
 * Probabilities describe this synthetic policy, not combat outcome likelihood.
 */
export function inferPolicy(features) {
  if (!features || features.length !== 24) throw new TypeError('inferPolicy expects 24 features');
  const input = new Float64Array(24);
  for (let i = 0; i < 24; i++) {
    if (typeof features[i] !== 'number' || !Number.isFinite(features[i])) {
      throw new TypeError('inferPolicy features must be finite numbers');
    }
    input[i] = Math.min(1, Math.max(0, features[i])) * 2 - 1;
  }
  const hidden1 = dense(input, w1, b1, 48, true);
  const hidden2 = dense(hidden1, w2, b2, 32, true);
  const logits = dense(hidden2, w3, b3, 8, false);
  let best = 0;
  for (let i = 1; i < 8; i++) if (logits[i] > logits[best]) best = i;
  const probabilities = Array.from(logits, x => Math.exp(x - logits[best]));
  const total = probabilities.reduce((sum, x) => sum + x, 0);
  for (let i = 0; i < 8; i++) probabilities[i] /= total;
  return {action: AI_META.actions[best], confidence: probabilities[best], probabilities};
}
'''
    code = code.replace("METADATA", json.dumps(meta, separators=(",", ":"))).replace("WEIGHTS", "\n".join(arrays))
    (ROOT / "dist" / "ai-model.js").write_text(code)


def train(args):
    started = time.monotonic()
    r = np.random.default_rng(SEED)
    x = generate_states(args.train, SEED)
    vx = generate_states(args.validation, SEED + 1)
    utilities = teacher_utilities(x)
    labels = utilities.argmax(1)
    vl = teacher_utilities(vx).argmax(1)
    # Smoothed hard labels retain the teacher's decision boundaries and reduce
    # unbounded logit growth. There are no combat rewards or rollout episodes.
    targets = .08 * softmax(utilities / .35)
    targets[np.arange(len(x)), labels] += .92
    params = []
    for shape in SHAPES:
        params.append((r.normal(0, np.sqrt(2 / shape[0]), shape)
                       if len(shape) == 2 else np.zeros(shape)).astype(np.float32))
    m = [np.zeros_like(p) for p in params]
    v = [np.zeros_like(p) for p in params]
    best, best_score, best_epoch = None, -1, 0
    step = 0
    history = []
    for epoch in range(1, args.epochs + 1):
        order = r.permutation(len(x))
        lr = .0025 * (.25 + .75 * .5 * (1 + np.cos(np.pi * (epoch - 1) / args.epochs)))
        for start in range(0, len(x), args.batch):
            ids = order[start:start + args.batch]
            logits, (z, h1, h2) = forward(x[ids], params, True)
            d3 = (softmax(logits) - targets[ids]) / len(ids)
            d2 = (d3 @ params[4].T) * (h2 > 0)
            d1 = (d2 @ params[2].T) * (h1 > 0)
            grads = [z.T @ d1, d1.sum(0), h1.T @ d2, d2.sum(0), h2.T @ d3, d3.sum(0)]
            step += 1
            for i, (p, grad) in enumerate(zip(params, grads)):
                if p.ndim == 2:
                    grad += .00001 * p
                m[i] *= .9; m[i] += .1 * grad
                v[i] *= .999; v[i] += .001 * grad * grad
                p -= lr * (m[i] / (1 - .9 ** step)) / (np.sqrt(v[i] / (1 - .999 ** step)) + 1e-8)
        if epoch == 1 or epoch % 5 == 0 or epoch == args.epochs:
            score = accuracy(vx, vl, params)
            history.append({"epoch": epoch, "validationAccuracy": score})
            print(f"epoch {epoch:3d}: validation teacher agreement {score:.4%}", flush=True)
            if score > best_score:
                best, best_score, best_epoch = [p.copy() for p in params], score, epoch
    params = best
    # The test split is generated and evaluated only after model selection.
    tx = generate_states(args.test, SEED + 2)
    tu = teacher_utilities(tx)
    tl = tu.argmax(1)
    pred = forward(tx, params).argmax(1)
    confusion = np.zeros((8, 8), dtype=int)
    np.add.at(confusion, (tl, pred), 1)
    margin = np.sort(tu, axis=1)[:, -1] - np.sort(tu, axis=1)[:, -2]
    high_margin = margin >= .15
    score = float((pred == tl).mean())
    regret = tu[np.arange(len(tx)), tl] - tu[np.arange(len(tx)), pred]
    cases = make_cases()
    for case in cases:
        f = np.array([case["features"]], np.float32)
        probs = softmax(forward(f, params))[0]
        case["teacherAction"] = ACTIONS[int(teacher_utilities(f).argmax())]
        case["neuralAction"] = ACTIONS[int(probs.argmax())]
        case["probabilities"] = probs.tolist()
        if case["teacherAction"] != case["expectedAction"]:
            raise AssertionError(f"Scenario teacher mismatch: {case['name']}")
        if case["neuralAction"] != case["expectedAction"]:
            raise AssertionError(f"Scenario neural mismatch: {case['name']}: {case['neuralAction']}")
    # Independent ordinary/random vectors exercise serialization parity too.
    parity = generate_states(64, SEED + 3)
    parity_probs = softmax(forward(parity, params))
    report = {
        "name": "Weiwu Tiny Tactical Policy v1", "architecture": [24, 48, 32, 8],
        "parameters": int(sum(p.size for p in params)), "seed": SEED,
        "trainingMethod": "Supervised synthetic utility-teacher imitation with NumPy Adam and cross entropy (92% hard label, 8% teacher soft label).",
        "notClaimed": ["reinforcement learning", "training on human gameplay", "measured game-win improvement", "calibrated success probabilities"],
        "trainingSamples": args.train, "validationSamples": args.validation, "testSamples": args.test,
        "splitSeeds": {"train": SEED, "validation": SEED + 1, "test": SEED + 2},
        "epochs": args.epochs, "selectedEpoch": best_epoch, "batchSize": args.batch,
        "validationAccuracy": best_score,
        "heldout": {
            "accuracy": score, "majorityClassBaselineAccuracy": float(np.bincount(tl, minlength=8).max() / len(tl)),
            "highTeacherMarginThreshold": .15, "highTeacherMarginCount": int(high_margin.sum()),
            "highTeacherMarginAccuracy": float((pred[high_margin] == tl[high_margin]).mean()),
            "meanTeacherUtilityRegret": float(regret.mean()), "maxTeacherUtilityRegret": float(regret.max()),
            "perAction": {ACTIONS[i]: {"count": int((tl == i).sum()),
                                      "accuracy": float((pred[tl == i] == i).mean())} for i in range(8)},
            "confusionMatrix": confusion.tolist(), "confusionMatrixOrder": ACTIONS,
        },
        "contractScenariosPassed": len(cases), "trainingSeconds": round(time.monotonic() - started, 3),
        "featureNames": FEATURES, "actions": ACTIONS, "validationHistory": history,
        "limitations": [
            "Labels encode a hand-authored utility policy; teacher quality is unproven in the actual game.",
            "Held-out data comes from the same synthetic generator, not real gameplay or a combat simulator.",
            "No reinforcement learning, search, opponent model, memory, or online learning is used.",
            "Close decision boundaries and out-of-distribution combat states may yield unsuitable actions.",
            "Softmax confidence measures model preference and is not calibrated outcome probability.",
            "Action effects and feature normalization must match the integration contract.",
        ],
    }
    np.savez_compressed(ROOT / "ai" / "model-weights.npz", **dict(zip(NAMES, params)))
    (ROOT / "ai" / "model-report.json").write_text(json.dumps(report, indent=2) + "\n")
    (ROOT / "ai" / "test-vectors.json").write_text(json.dumps({
        "scenarios": cases, "parity": [{"features": f.tolist(), "probabilities": p.tolist()}
                                          for f, p in zip(parity, parity_probs)]}, indent=2) + "\n")
    export_js(params, report)
    print(f"Held-out teacher agreement: {score:.4%}; selected epoch {best_epoch}; "
          f"{report['parameters']} parameters; scenarios {len(cases)}/{len(cases)}.", flush=True)
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train", type=int, default=48000)
    parser.add_argument("--validation", type=int, default=10000)
    parser.add_argument("--test", type=int, default=12000)
    parser.add_argument("--epochs", type=int, default=80)
    parser.add_argument("--batch", type=int, default=512)
    train(parser.parse_args())
