# SWARMWAR v0.1.2.7 — Standard campaign field fixes

A fresh public Standard campaign cleared all five chapters, twenty waves and five guardians with manual aim/fire, inspection pauses and **zero checkpoint retries**. The debrief recorded 18:49, 146,193 points, 703 enemies defeated and 150 peak drones. [Playtest evidence and limits](PLAYTEST.md).

- Quick Spear releases work immediately after Ring or Blades fire, using a separate rail release cooldown.
- The mouse formation dock yields to living enemy targets beneath it so aimed shots reach the arena. Keyboard controls remain available; touch buttons keep their behavior.
- Dash/recovery guidance names the actual guardian, including the Crucible.
- Sector-clear inputs no longer display a false drone requirement, and transient combat notices clear on screen changes.

Enemy damage, hazard timing, charge assembly, weapon damage, upgrade values and protocol multipliers are unchanged. The full campaign was played on v0.1.2.6; v0.1.2.7 received focused regression/browser checks rather than another complete manual run. The v0.1.2.5 tagged ZIP remains unchanged; current source and browser build are v0.1.2.7.

---

# SWARMWAR v0.1.2.6 — Clearer combat lanes

The live game gains stronger wall-corridor markings, offscreen beam/ring countdowns, announcements that fade over targets, a dock that yields to the core and mouse shots, and weapon feedback that stays inside the viewport. Boss state and health remain readable during frozen inspection. Combat simulation, encounter content and upgrade values are unchanged.

Full automated checks passed, including the packaged twenty-wave/five-guardian campaign and presentation regressions. A real-browser preview verified corridor tint, manual firing/switching, pause, bottom-edge labels and dock pointer passthrough, with no captured console errors. A subsequent fresh v0.1.2.6 Standard attempt completed all five chapters; the previous v0.1.2.5 attempt ended after a browser-control timeout in chapter three. See PLAYTEST.md for exact evidence and limits.

The original v0.1.2.5 tagged download below remains unchanged. This was the v0.1.2.6 Pages patch; the latest build is described above.

---

# SWARMWAR v0.1.2.5 — First preview release

[Play in your browser](https://leolunelove.github.io/swarmwar/)

A fullscreen vector action game about growing one drone into a coordinated swarm. Every primary weapon uses manual aim and trigger input.

## Included

- Five chapters with distinct encounter rules: The Array, Debris Belt, The Veil, Cinder Forge and Black Core.
- Twenty waves, five guardians and nineteen upgrade selections, with a campaign map and chapter handoffs.
- Ring capture-and-return fire, automatically assembled manual-release Spear, close Blades and aimed Kamikaze payloads.
- Gradual swarm fabrication, support units, upgrade evolutions and mutually exclusive weapon cores.
- Standard, Scout and Overclock protocols; Endless, Training, chapter practice and unlockable Boss Rush.
- Full-window arena, compact HUD, field manual, settings, remappable keys, checkpoints and local flight records.

## Fixes included

- Precise Ring center shot and reliable short Spear clicks between frames.
- Stored rail charge survives switching, pause and pointer cancellation.
- Draft input guard blocks combat clicks from accidentally selecting an upgrade.
- Resizing pauses combat and clears held input.
- Space launches the payload after keyboard pause/resume, including when a combat button has focus.
- Frozen View Field preserves weapon annotations and threat indicators.
- Guardian arrivals show one phase label and clear stale formation advice.
- Defeat guidance respects formations that are still locked.

## Download and controls

Download `SWARMWAR-v0.1.2.5.zip`, extract it, and open `index.html`. No installation, server or internet connection is required. `SHA256SUMS.txt` verifies the download.

WASD/arrows move; the mouse aims. Hold left click for Ring/Blades. Spear assembles while equipped; aim and click/release to fire. 1/2/3 select formations, Q/E cycles, Space launches Kamikaze, P pauses/resumes, H inspects while paused, and F requests native fullscreen. When fullscreen is unavailable, gameplay fills the browser window.

## Verification limits

Automated checks cover the full campaign, Boss Rush, progression, manual input contracts and a one-hour simulation soak. Release browser smoke checked the menu/changelog, chapter map, manual fire and switching, Space after resume, frozen inspection, resize pause and defeat without console errors.

The latest full manual Standard attempt cleared four chapters and 18/20 waves with zero checkpoint retries, then browser control disconnected. A complete manual campaign win, physical touch/gamepad performance and audible music acceptance remain unverified. This is a preview release; earlier 2.x labels identify development milestones rather than this release sequence.
