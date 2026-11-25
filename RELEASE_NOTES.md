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
