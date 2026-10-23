# 围屋行动

GitHub Pages deployment is configured in `.github/workflows/pages.yml`. See [部署说明](DEPLOYMENT.md). Enable **Settings → Pages → Source: GitHub Actions** before deploying.

Buildless mobile web roguelike. Serve `dist/`; no installation, API credentials, CDN, or backend are required for game logic or inference.

- Four sites, two waves each. Clear or hold objectives; a mother appears in the final wave.
- Twelve starting soldiers, up to 35 through recruitment. Casualties persist within a run; survivors heal on transfer.
- Shared stock, magazines, personal reserves and physical hauler cargo are separate. Ammunition carries over between sites and is conserved.
- Portrait canvas battlefield, automatic deployment/combat, route choices, one of three rewards, pause and 1/2/4× speed, zoom/pan, unit details.
- Current run and the last 30 results are browser-local. New runs have no permanent growth. No telemetry or cloud AI.

## AI

`dist/ai-model.js` contains an actually trained, dependency-free 3,032-parameter 24→48→32→8 MLP. It runs every 1.2 simulation seconds and selects high-level tactics. The model selects reinforcement, fallback, supply and target emphasis; a local squad controller implements nearest-unit transfers, staggered fallback, reload covering and firing-lane repositioning. The game owns acceleration, avoidance, collision, projectile travel, ammo accounting and physical hauling. The model and the action controller are distinct; the controller is hand-authored, not learned. Switching AI off uses the engine's ordinary rule policy.

Training uses supervised imitation of a hand-authored synthetic utility teacher, **not reinforcement learning**. Synthetic heldout teacher agreement is **not a game win rate**. `ai/model-report.json` and `ai/README.md` document the model, reproduction and limits.

## Checks

```sh
npm test
node ai/test-policy.mjs
python ai/evaluate_policy.py
```

The game tests cover ammunition conservation, physical supply delivery/return, casualties, reward semantics, save/restore determinism, fixed emplacements, AI toggle/fallback, and full clear/hold routes. Model tests cover tactical scenarios and Python/JavaScript inference parity.

## Military equipment

Cartridge, published capacity and published range use original manufacturer or military references linked in the in-game manual. Damage, accuracy, reload timing, armor reduction, practical cadence and blast radius are gameplay approximations. MP5 and shotgun ranges are explicitly game values. Belt lengths are loadout choices. This is a game, not a validated combat simulator.
