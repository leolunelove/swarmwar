# SWARMWAR v0.1.2.5 release package — 25 November 2026

- Repository: https://github.com/leolunelove/swarmwar
- Online destination: https://leolunelove.github.io/swarmwar/
- Tagged release destination: https://github.com/leolunelove/swarmwar/releases/tag/v0.1.2.5
- Channel: first preview release. Earlier 2.x labels are development milestones.
- Offline package: `dist/SWARMWAR-v0.1.2.5.zip`, with `index.html`, `README.txt` and `release.json`; checksum in `dist/SHA256SUMS.txt`.
- Entry HTML: 228716 bytes, self-contained, SHA-256 `02544221e77b0097d9dbd7705ebd2d716e2c781497e398f85c33e4b2524e7619`. `Play Swarmwar.html` and `docs/index.html` are identical.
- Full check command: `python3 tests/check.py --stress`. All checks passed, including the automated campaign, Boss Rush and one-hour simulation soak.
- Real release smoke: menu/changelog, five-chapter route, launch, manual Ring/Spear/Blades, default Space after resume, frozen weapon annotations, resize pause, narrow viewport and practice defeat. Browser console had no captured errors/warnings. Native fullscreen used its full-window fallback.
- Known limit: the prior manual Standard campaign cleared four chapters and 18/20 waves before disconnection; full manual victory is not verified. No new combat balance claims are made. Physical touch/gamepad and audible music acceptance remain outstanding.
- Screenshots: `release-qa-v0.1.2.5/`. Player-facing notes: `RELEASE_NOTES.md`. Build instructions: README.md.
- Final publication should be checked against `docs/release.json`; expected artifact metadata is above. Publication receipts are kept separately so the source artifact need not change after tagging.

---

## Historical release handoff

# SWARMWAR 2.0 release handoff — 23 November 2026

- Play: https://leolunelove.github.io/swarmwar/
- Source: https://github.com/leolunelove/swarmwar
- Published commit: `571870c62222cf2b4f2feaff259162183d0a3570`.
- Pages deployment `45251430567` completed successfully. Public HTML was fetched after the live browser launch and exactly matches the tested local build: SHA-256 `8b979ddcff88bf5dde29da19393558ec8e6950d5a5ce525ea03ad2c637320ca0`.
- Current local branch `github-main` tracks `origin/main`. Original local history remains on `main`, including the complete implementation commit `21c5578`. Tracked files are clean. Earlier untracked playtest images were preserved.
- The source includes five chapters, twenty waves, five guardian encounters, nineteen drafts, chapter practice, map handoffs, manual weapons, a revised terminal and a menu changelog. See PROJECT_STATUS.md for the short implementation handoff.
- Final checks passed: simulation, packaged UI, full automated campaign and Boss Rush, all twenty phase orders, mouse/touch/gamepad trigger-release contracts, cancellation and pause safety. A prior soak of the unchanged simulation rules exercised an hour, 32 sectors and 52 resizes.
- Real-browser evidence includes the baseline audit, revised menu/map/changelog, manual weapon and formation changes, a real draft-to-phase-two transition, defeat cause, Forge heat warnings, corner HUD clearance, and a fresh public Standard launch. The Forge sample retained 100 hull at 00:14. The published launch showed directed manual shots and the unavailable-Spear requirement at two drones.
- Native fullscreen returned the fallback message in the local test browser. Full-window gameplay was verified. Human full-five-chapter balance, maximum-swarm readability, physical touch/gamepad hardware and audible music remain unverified.
- Final local proof images: `release-map-2.0.jpg`, `release-forge-2.0.jpg`, `release-edge-2.0.jpg`, `published-run-2.0.jpg`. The original sixteen audit images are committed in `audit-2026-11-23/`.

Future work should begin with a human manual-fire campaign and examine late sustain and upgrade choice quality. Preserve the full-viewport arena and manual aiming; avoid treating automated clears as a human difficulty estimate.
