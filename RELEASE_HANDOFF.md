# SWARMWAR v0.1.2.8 orbital-depth build acceptance

- Repository: https://github.com/leolunelove/swarmwar. Pages destination: https://leolunelove.github.io/swarmwar/.
- Entry HTML: 238995 bytes; SHA-256 `69e3a3b2561c8ceddff80d4a6d27cdb27ed5ddf44368ad57cd1271a9e066bccf`. Offline HTML and `docs/index.html` are byte-identical. `docs/release.json` identifies v0.1.2.8.
- Full `python3 tests/check.py` acceptance covers packaged UI, finite Canvas coordinates, combat/progression contracts, automated twenty-wave/five-guardian campaign and Boss Rush.
- Real-browser visual checks: all five chapter backdrops, manual movement/fire/formation changes, Array wave-one upgrade transition, frozen pause inspection, Core idle defeat, reduced-motion option and 390×844 layout. No captured console warnings/errors. Evidence: `depth-preview-v0.1.2.8/`.
- This release changes the renderer and associated copy/test Canvas fixture. Simulation, encounters, aim projection, controls, damage and upgrade values are unchanged.
- Publication acceptance requires a successful Pages workflow for the pushed commit and byte-for-byte equality of live HTML/manifest with the files above. A local `dist/publication-receipt-v0.1.2.8.json` records the observed result.
- v0.1.2.5 remains the original tagged ZIP. This update publishes the current source and browser build.

---

# SWARMWAR v0.1.2.7 field-fix build acceptance

- Repository and deployment destination: https://github.com/leolunelove/swarmwar and https://leolunelove.github.io/swarmwar/.
- Source changes: independent Spear release cooldown; dock passthrough for living enemies; correct chapter guardian guidance; sector-clear command/toast cleanup. No encounter content, damage, charge assembly or upgrade values changed.
- Tested HTML: 233487 bytes, SHA-256 `4299238530eb9dbbceec614bea8b0a2e6d89ac954c2fac420b535d74f27efa83`. Offline and Pages HTML are byte-identical; `docs/release.json` identifies this build.
- Required full `python3 tests/check.py` passed, including new regressions and the automated 20-wave/five-guardian campaign. Real-browser final-build quick Ring/Blades-to-Spear release and enemy-target dock passthrough checks passed; no captured warnings/errors.
- Manual campaign acceptance: the public v0.1.2.6 build cleared all five chapters in 18:49, with manual aim/fire, inspection pauses and zero checkpoint retries. This is separate from automated checks and the focused v0.1.2.7 browser check. Evidence and exact limits: PLAYTEST.md and `release-qa-v0.1.2.7/`.
- v0.1.2.5 tagged download remains unchanged. This patch updates repository source and the Pages build; it does not replace the historical ZIP.
- After pushing, verify the Pages workflow SHA and compare live HTML/manifest to the hash above. A local publication receipt records the observed deployment result.

---

# SWARMWAR v0.1.2.5 published release — 25 November 2026

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
- Published release commit and tag: `36ad1121cd302a991c08ebba7e7c4d35d49055ef`, `v0.1.2.5`. GitHub confirms published, not draft, with the preview label and both download assets.
- Pages workflow `45690301325` completed successfully for that commit. A fresh public browser load showed v0.1.2.5 with no captured console errors/warnings. The fetched live manifest and HTML exactly matched local output.
- The uploaded ZIP was downloaded again and compared byte for byte with the local ZIP. Its checksum matched both SHA256SUMS.txt and GitHub's asset digest: `cf455c70c4b6a66893e9023f7c8f900b625857f6cc0f3ecf4d21da36add803b5`, 69505 bytes. ZIP integrity and its embedded HTML/manifest passed verification.
- Machine-readable publication receipt: `dist/publication-receipt.json` in the local checkout. Subsequent publication-record edits do not change the tagged game artifact.

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
