#!/usr/bin/env python3
"""Recheck the saved MLP on the held-out split without retraining it."""
import json
import numpy as np
from train_policy import ROOT, NAMES, ACTIONS, generate_states, teacher_utilities, forward

report = json.loads((ROOT / "ai" / "model-report.json").read_text())
with np.load(ROOT / "ai" / "model-weights.npz") as archive:
    params = [archive[name] for name in NAMES]
assert sum(p.size for p in params) == report["parameters"] == 3032
x = generate_states(report["testSamples"], report["splitSeeds"]["test"])
truth = teacher_utilities(x).argmax(1)
prediction = forward(x, params).argmax(1)
score = float(np.mean(truth == prediction))
assert abs(score - report["heldout"]["accuracy"]) < 1e-12
assert score >= .94, f"held-out teacher agreement fell to {score}"
for i, action in enumerate(ACTIONS):
    mask = truth == i
    assert int(mask.sum()) == report["heldout"]["perAction"][action]["count"]
    assert np.mean(prediction[mask] == i) >= .88, f"poor imitation for {action}"
print(json.dumps({"passed": True, "heldoutSamples": len(x), "accuracy": score,
                  "meaning": "agreement with synthetic teacher, not combat win rate"}, indent=2))
