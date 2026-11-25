# Live Standard v0.1.2.5 attempt — 25 November 2026

A fresh manual Standard campaign on the public Pages build cleared The Array (03:24) and Debris Belt (about 07:03), then The Veil waves 1–3. Browser control timed out after resuming Memory Lock at 09:24; the next successful observation was the defeat debrief at 09:35. Result: two sectors, 429 enemies, peak 65 drones, 324 switches, 150 blocks, 17 interrupts and **zero checkpoint retries**. This was not a campaign clear.

Normal CUA pointer/keyboard inputs controlled manual aim, held Ring/Blades fire, rail release, payloads, movement and drafts. Frequent inspection pauses were used. No runtime health, time, enemies, invulnerability or chapters were injected. Source/rule reads and the rendered DOM boss meter were used to understand UI feedback. Evidence remains in `live-standard-v0.1.2.5-2026-11-25/`.

Confirmed clarity problems: bottom-center core and targets can be covered by formation controls; encounter copy covers upper-center targets; offscreen wall openings are easy to mistake for the blocked side; offscreen beam/ring origins lack a readable release deadline; frozen inspection covers the boss meter. These are presentation findings, not proof that hazard timing or damage is unfair. The run also included avoidable contact and projectile hits while firing or switching late.

The v0.1.2.6 patch adds wall-corridor tint/boundaries and offscreen direction marks, edge countdowns, context-sensitive HUD fading, visible boss state and a lower frozen-inspection bar. Combat simulation and content are unchanged. Full automated checks passed, including the 20-wave/five-boss packaged campaign and new clarity regressions. A fresh full manual campaign after the fixes remains pending.

---

# Preview v0.1.2.5 release checks — 25 November 2026

The prior 2.1 development work is packaged as the requested first preview **v0.1.2.5**. No combat rules were changed in the release packaging pass. `VERSION` drives the menu, changelog and HTML metadata, and `docs/release.json` records the entry HTML's size and SHA-256.

`python3 tests/check.py --stress` passed: three seeded campaigns, progression/matchups/combat contracts, packaged UI, a complete automated 20-wave/five-guardian campaign in 1055 simulated seconds, Boss Rush in 100 seconds, and an hour-long simulation soak (33 sectors, 52 resizes). Packaging verifies matching offline/Pages bytes and ZIP integrity.

Fresh real-browser smoke used an isolated QA origin on port 8767. Confirmed: v0.1.2.5 menu/changelog, five-chapter map, campaign launch, pause/View Field, manual Ring fire and movement, Black Core practice, all formation selections, automatic Spear assembly and deliberate release (visible rail with charge reduced to 18%), default Space payload immediately after P/H/P resume (64→60 drones and 100→0 charge), resize to 390×844 pausing the live run, no horizontal overflow at that width, and a natural idle-defeat debrief. The native fullscreen request returned the full-window fallback; the arena filled 1280×720. No captured browser console errors or warnings. Screenshots: `release-qa-v0.1.2.5/`.

This smoke pass is separate from the previous long Standard run and does not complete it. The full manual campaign, physical touch/gamepad acceptance and audible music remain unverified. Deployment and release artifact evidence are recorded in RELEASE_HANDOFF.md.

---

# Standard real-browser continuation — 24 November 2026

**Partial real-browser campaign: four chapters cleared, 18 of 20 waves cleared, four guardians defeated, zero checkpoint retries. Full victory remains UNVERIFIED.** The same manual run reached Black Core / Prism Choir at **15:37**, with **86/144 hull**, before browser control disconnected completely. The final pause could not be confirmed after the connection dropped. Do not resume a checkpoint and call it the same no-retry run.

Normal pointer/keyboard inputs controlled movement, aim, trigger release, formations, payload and upgrades. Spear assembled automatically but was released manually. No runtime state, health, clock, invulnerability or chapter was injected. Frequent P/H pauses were used to inspect the field between short action batches; this is not evidence of an uninterrupted real-time human clear.

| Chapter | Guardian cleared at | Hull at clear | Result |
| --- | --- | --- | --- |
| The Array | 02:59 | 95/100 | All five phases and route handoff observed |
| Debris Belt / Salvage Tide | 06:52 | 55/100 | All five phases and route handoff observed |
| The Veil / Quiet Archive | 10:19 | 79/122 | All five phases and route handoff observed |
| Cinder Forge / Cooling Cycle | 14:05 | 122/122 | All five phases and route handoff observed |
| Black Core / Siege Matrix | Not cleared | 86/144 at 15:37 | Outer Membrane and Pulse Garden cleared; Prism Choir started |

Evidence: `standard-clean-2026-11-24/`, including each chapter route handoff. `chapter-04-to-05-route.jpg` records arrival at the final chapter. The last saved field capture is `496-pulse-garden-control-recovery.jpg`; later narrow-screen recovery and Prism Choir entry were observed in tool screenshots but did not persist in the local evidence directory before disconnection.

## Findings and fixes in this continuation

- **Confirmed: viewport change left combat running with invalid coordinates.** At 15:15, the panel unexpectedly shrank from landscape to 539×751. An aimed input was rejected, and delayed recovery left hull at 22, then 9 during escape. The same run recovered normally, without retry, and cleared Pulse Garden. The client now pauses before rescaling a changed play area and clears held input. This is an input safeguard; it does not change combat timing, damage or enemy rules.
- **Confirmed: Space could fail after keyboard pause/inspection when a button retained focus.** The run used Settings to remap payload to V from chapter three onward. Gameplay now reserves mapped Space for the payload even when a combat button has keyboard focus. Pause/resume also releases overlay focus as before.
- **Confirmed: frozen View Field omitted weapon annotations and offscreen threat indicators.** Inspection now draws the same annotations and edge contacts while simulation time stays frozen.
- **Confirmed: guardian arrival duplicated the phase prefix and could retain old formation advice.** The HUD now shows one guardian phase label and clears advice during arrival/secured states.
- **Observed, not established as unfair:** late beams were easy to miss when their casters were offscreen or a different warning dominated attention. Mint openings and locked beam lanes were present; several hits followed late routing or long input batches. No impossible overlap was confirmed. Banner overlap near the upper-center core remains a visual follow-up.

The played build used Bastion, Phase Conductor, Foundry, Nanite Mesh 2, Auxiliary Guns 2, Mirror Kernel, Core Plating, Thrusters 2, Rotor Edge 2, Vortex Spindle, Echo Shield, Battle Recycler and Hot Charge; Core Plating 2 was chosen after Pulse Garden. Ring capture returns, deliberate piercing rails, close Blades recovery damage and payload bursts were distinct in actual play. No Spear core was offered in this run. This single defensive build cannot establish all upgrade/core balance. Forge was comfortable with its sustain; Belt was substantially more dangerous before the build matured. No enemy, hazard, weapon or upgrade values were changed during this continuation.

## Validation of the local fixes

`python3 tests/check.py` passed, including focused regressions for resize pause/frozen time/cleared movement, payload Space on a focused combat button, frozen weapon annotations and the single guardian phase label. The packaged automated controller still completed all 20 waves, five guardians and 19 upgrades in 1055 simulated seconds, and Boss Rush in 100 seconds. These do not substitute for the unfinished browser run.

The new fixes are **not yet rechecked in a real browser**, because browser control remained disconnected even after a reset attempt. Local 2.1 remains unpublished; public 2.0 is unchanged. Still required: reconnect, inspect the original run's actual state, and finish Prism Choir, Heartlock and the Core Sovereign if the run survived. If it did not survive, a fresh chapter-one run is required for a valid no-checkpoint clear.

---

# Campaign Edition 2.1 — 24 November 2026

**Requested full real-browser Standard campaign with manual input and zero checkpoint retries: NOT COMPLETED.** Real runs reached Array phase two, then ended in defeat. Browser input repeatedly stalled in both Chrome and the in-app browser; some long gaps left the core stationary. Those contaminated attempts cannot establish a fair difficulty curve. No checkpoint retry was used, no chapter was skipped, and no runtime state, health, invulnerability or game clock was modified in the browser.

## Changes and observed evidence

- Spear previously required held charging. It now assembles automatically while equipped, never fires by itself, and releases along the manually selected bearing. Stored charge survives switching, pause and cancelled pointers. Real Array combat exercised automatic assembly, deliberate release and formation changes. Quick pointer down/up pairs between simulation frames are now queued once; pause cancels queued intent. Mouse, touch and gamepad paths also pass the client harness.
- Ring's old even-sized fans could leave no bolt on the exact aim line, and its 16-damage starter bolt needed two hits against a 26-hull Standard Skimmer. It now always has a 28-damage center bolt; extra wings remain 16. Real play showed aimed picks clearing lead chasers. This is a local opening-combat adjustment, not evidence that late Ring builds are balanced.
- One combat click selected Bastion as the first draft opened. A 450 ms pointer guard now protects selection, rerouting and abort. The next real run stopped correctly on its draft and deliberately rerouted to Foundry. Regression checks reject early clicks and accept a pointer selection after the guard expires.
- Defeat advice had recommended locked Blades. It now explains a Ring escape route and the phase/drone unlock until Blades is available. The revised text was observed in an Array defeat with locked Blades.
- P now toggles pause/resume without invoking fullscreen exit. H/View Field shows the actual frozen arena under a small toolbar. Repeated live checks used that frozen field to inspect enemies, gaps and shot directions. Simulation time stays frozen in the client regression.

Enemy stats, spawn groups, hazard timing/damage, upgrade values and global protocol multipliers were not changed in this pass. Foundry and Nanite choices were sampled in opening waves only; their late-campaign balance is still unverified.

## Real-browser coverage

The isolated local QA origin was `http://127.0.0.1:8766/`, keeping public-game browser progress separate. Screenshots are in `standard-2.1-2026-11-24/`.

| Build / browser | Observed outcome | Checkpoint retries | Qualification |
| --- | --- | --- | --- |
| Initial 2.1 / Chrome | Array phase two defeat, 00:50, 8 peak drones, 11 kills | 0 | Before precise Ring center shot |
| RC2 / Chrome | Healthy at 00:15; later observed defeat at 00:28 | 0 | Connection interrupted input |
| RC2 / in-app browser | Native fullscreen and held movement/fire verified; defeat at 00:20 | 0 | Control interruption |
| RC3 / in-app browser | Array phase two defeat, 00:48, 14 peak drones, 16 kills | 0 | Carried click chose Bastion; stationary inspection gap |
| RC4 / in-app browser | Array phase two defeat, 01:01, 24 peak drones, 24 kills | 0 | Foundry selected deliberately; final input stalled |
| RC5 / Chrome | Array phase two defeat, 00:48, 9 peak drones, 15 kills | 0 | Nanite Mesh; one input batch advanced 14 seconds for about 5 seconds of intended movement |

Native fullscreen succeeded in the in-app browser. Chrome retained the full-window fallback. The arena filled both tested content viewports (1280×720 and 1352×671). Ring, Spear, Blades, Kamikaze, first draft/reroute, phase-one-to-two transition, pause/inspection/resume, and defeat were exercised with normal pointer/keyboard input. Chapters two through five and later phase transitions were **not reached in these real campaign attempts**.

## Final automated verification

`python3 tests/check.py` passed after the final code changes. Three seeded simulation campaigns cleared in 1082, 1051 and 1082 simulated seconds, each peaking at 237 drones with 144 final hull. The packaged-client controller completed all 20 waves, five guardians and 19 choices in 1055 simulated seconds, including two viewport changes; Boss Rush completed in 100 seconds. Endless exercised ten sectors in 999 simulated seconds. These are automated controllers, not the requested manual browser campaign or a human win-rate estimate.

Checks include passive rail assembly without aim/fire, no automatic full-charge shot, stored charge across switching, manual miss direction, exact Ring center/wings, a complete mouse click between frames, cancellation/pause intent, draft click guard, locked defeat advice, and frozen-field inspection.

Final generated offline and Pages files match: SHA-256 `bbee308c66aa1c7834a8dbc5471cae096ec89af899b5a78ddc34a8813ccf9be2`; 227947 bytes each, self-contained with no external asset dependency. Version 2.1 is local and has not been deployed. The previous verified public release is 2.0.

Still required: a complete real-browser Standard campaign without retries on a reliable input connection, all five chapter handoffs, late weapon/core and sustain comparisons, maximum-swarm readability, physical touch/gamepad testing and audible music review. Do not mark this request complete from the automated results.

---

# Campaign Edition 2.0 — 23 November 2026

Current build changes the campaign to five chapters and makes every weapon manual. Earlier records below describe earlier builds and their automatic targeting; they are historical, not evidence for the new weapon balance.

## Current verification

- `python3 tests/check.py` passed after the final rules and input fixes. Three seeded simulation campaigns cleared in 1121, 1133 and 1096 simulated seconds; peaks 219–237 drones. A packaged-client campaign cleared in 1122 simulated seconds with twenty waves, five guardians, nineteen upgrade choices and two viewport changes. Packaged Boss Rush cleared in 129 seconds.
- The accelerated one-hour Overclock Endless soak passed: 3600 simulated seconds, 32 sectors, 52 resizes. Maxima: 13 enemies, 25 allied shots, 47 hostile shots, 384 effects, three hazards, 21 salvage and 1600 retained events. This soak maintains hull/invulnerability to exercise late encounters; it is not a survival or balance result.
- Added regressions: no-input weapons do not attack; pointer movement alone does not fire; rails hold full charge and fire on release; deliberately missed shots do not snap to enemies; capture/Mirror/Conductor damage is manually released; all twenty phase transitions and five guardian arrivals work; legacy saves cannot set new records; practice victory and redeploy retain practice identity and selected chapter; pause clears held fire without a phantom rail release; touch lift fires before clearing aim; neutral gamepad aim retains the manual bearing; pointer cancellation discards charge.
- In real Chrome: inspected baseline title, busy Standard combat, first upgrade, pause and defeat. Inspected revised terminal, playable chart, changelog, The Veil practice launch, manual rail release, and an Array Scout practice run through the first draft into phase two. Switched Ring → Spear → Blades → Ring with normal input. That practice run ended in defeat at 00:48; it was not a campaign clear. Revised defeat named Skimmer as the last hit.
- The live arena filled the 1352×671 browser content viewport. An explicit native-fullscreen request returned the game's visible “Fullscreen unavailable here” message; fallback remained playable. The automation connection also stalled during some reload/offscreen-control attempts. A fresh tab and scrolling to visible controls recovered inspection. Native-fullscreen success in this browser session is **not** claimed.
- Visual inspection caught and fixed duplicated draft punctuation, edge-clipped local weapon/hull labels, HUD overlap with the core in corners, and practice redeploy returning to the wrong chapter. The five prioritized audit findings and supporting screenshots are in VISUAL_AUDIT.md.

Human full-campaign balance under manual fire, readability at the 237-drone maximum, physical touch/gamepad hardware, and audible music review remain unverified. Automated full runs are completion checks, not human win-rate evidence. No global protocol health/damage/speed multiplier was changed during the visual audit.

Offline and Pages HTML SHA-256: `8b979ddcff88bf5dde29da19393558ec8e6950d5a5ce525ea03ad2c637320ca0`.

Publication: source and self-contained Pages build prepared for `leolunelove/swarmwar`; final remote commit and deployment are recorded in the release handoff.

---

> Latest verification: the 2026-11-13 fresh Standard campaign with zero retries and the 1.5 guidance/interface follow-up at the end of this document. Earlier timing and balance figures describe earlier builds.

# Flight Build 1.0 verification

Run `python3 tests/check.py` from this directory for the release checks. Add `--stress` for the one-hour simulated Endless soak. The checks build the exact offline HTML first and reject missing bundles, duplicate element IDs, external asset references, and regressions to the full-viewport layout contract.

## Results

- **Full client flight:** An automated pilot used the packaged pointer, keyboard, gamepad, and upgrade inputs to complete the standard campaign in 218 seconds. It fought all nine waves and three bosses, selected both upgrades, switched between landscape and portrait twice, and reached a debrief that saved its own score. It then unlocked and cleared Boss Rush through the same interface in 44 seconds.
- **Training and menus:** The four drills were completed through the packaged controls. Checks covered pause, the Field Manual, remapping, touch, native fullscreen entry and exit, fullscreen rejection fallback, checkpoints, records, and badge persistence.
- **Campaign balance:** A deterministic pilot that updated controls about every 217 ms cleared 16/16 Scout samples and 48/48 Standard samples across desktop, portrait, and ultrawide layouts. It did not clear Overclock in 16 attempts. A faster pilot cleared Overclock in 10 of 18 seeds, confirming the harder route remains beatable. These are bot results, not estimates of human win rate.
- **Endless:** A standard pilot cleared seven sectors before defeat in one ordinary run. The accelerated soak held the core alive to test late encounters: 3,600 simulated seconds, 31 sectors, and 52 viewport changes. Positions stayed finite; at peak the simulation held 37 enemies, 157 hostile shots, 1,213 effects, and 78 salvage pieces.
- **Visual checks:** The Canvas artwork was inspected separately using recorded draw commands and a software raster preview. The browser client was exercised against a DOM, Canvas, and audio contract harness. The in-app browser denied automation access to the local file URL, so native browser layout, audible playback, and human response times are unverified.

## Manual playtest checklist

1. Open the HTML in a desktop browser. Deploy with fullscreen on, press Esc, resume, and toggle fullscreen with F. Check that the arena reaches all edges in each state.
2. Complete training with default keys, remap one formation, and confirm the same key appears in the dock, guide, and Field Manual.
3. Play a standard campaign. Check that the recommended key is legible near the core while dodging. Watch for a charge, debris lane, core surge, and beam; the cues should say to evade, not suggest Ring.
4. Save and exit in the Belt, reopen the file, and continue the saved sector. Verify hull, modules, score, and difficulty. If the browser disallows local-file storage, run the game without saving.
5. On a narrow touch display, check that the drag controls work at the same time as the formation dock. On a connected standard gamepad, check sticks, formation buttons, pause, and menu selection.

## Live-browser compact-HUD pass

The revised build was played over a loopback-only HTTP server in the in-app browser and Google Chrome. Ring, Spear, and Blades were selected with real live input in training. A Scout campaign was played into wave 3, with Spear and Blades confirmed active during combat; movement, pausing, and resuming worked. Chrome native fullscreen was entered with a native keyboard gesture and exited with F. The embedded browser rejects native fullscreen, so its supported behavior remains a full-window arena.

The bottom telemetry panel was removed from the combat dock. Health and drone count now sit at the top edge, while formations occupy a single 33–44 px row. Repeated “hold” cues and redundant labels are hidden, and entry banners are smaller. A clamped camera enlarges the action by 34% in landscape and 42% in portrait while preserving the simulation and hitboxes. Pointer aim and touch controls project through that camera; off-screen threat arrows preserve awareness. The live drill also exposed a cropped practice target, which was moved into the closer camera view.

## Full campaign combat and balance pass

A live Scout campaign was completed across all three sectors in Chrome, using the normal controls and the sector checkpoints while changes were applied: **3:33, rank B, 246 enemies, 19 formation switches, and 26 blocked shots**. The run exposed accidental module choices from combat keys. Formation and burst keys no longer select upgrade cards; the draft starts focused on its heading and accepts pointer selection or Tab/Enter.

In eight matched seeded Standard runs, the original delayed-input controller cleared all eight with Spear alone and all eight adaptively. After the balance pass, the same adaptive controller cleared seven of eight, while Spear-only cleared one of eight. These are controlled bot comparisons, not human win-rate estimates. Independent matchup tests verify that Blades clears a surrounding pack fastest, Spear pierces an armored line fastest, and Ring absorbs a staggered volley that damages the other formations.

Changes made during the pass:
- Spear has a narrow, armor-focused volley and finite turn speed. Its shots follow its visible facing. Blades is more mobile and pushes light enemies back when its cutting arc connects.
- Shield contacts, piercing hits, armor deflections, blade cuts, and player damage have distinct short visual marks. Firing and hit cues differ by formation; damaged heavy enemies show small health traces.
- Boss entrances clear remaining wave enemies, bullets, and field hazards. Bosses arrive closer to the active fight with a brief invulnerability window for the core.
- Early ram charges have longer warnings. New environmental hazards begin later in a sector, and the Core introduces one surge circle before layering two.
- Boss recovery cannot be interrupted by a new attack. The Reaver's charge warning and recovery opening are longer.

The complete offline suite passed after these changes, including a packaged-client campaign, Boss Rush, training, checkpoint restoration, input regression checks, and an accelerated 3,600-second Endless soak. Final protocol samples also checked Scout in portrait and Overclock with the standard encounter controller.

## 2026-11-13 — Extended progression and glass interface

The campaign now has twelve waves, three bosses, and eleven module choices. Three seeded automated simulation clears took **603, 609, and 614 seconds**, including a portrait run. A campaign played through the packaged client controls took **579 seconds**, selected all eleven modules, changed viewport twice, and saved its debrief. Boss Rush cleared in 55 seconds. These are automated runs, not a new full human campaign clear.

The progression regression suite verifies:
- Two early parts fabricate one drone; the first wave caps at twelve drones, and later waves expand fabrication capacity.
- Rerouting offers three fresh choices when the eligible pool permits, is limited to once per sector, and persists through a saved wave.
- Echo Shield damages enemies after a block; Splinter Lance shards cannot recursively split; Vampire Rotor heals after three melee kills; Afterburn resolves once; Recycler banks a part; Conductor shares a three-second cooldown across formations.
- Wave saves preserve build, parts, reroute use, and encounter RNG without duplicating rewards. Testing found and fixed mismatched player positioning, spawn timers, and an initial salvage drop during restore.
- Different seeds produce varied module builds and independently selected sector variants. Evolution choices require their foundation module.
- The existing role matchups, all four drills, input bindings, pause, fullscreen fallback, records, and checkpoint flows still pass.

The accelerated Endless soak completed **3,600 simulated seconds, 34 sectors, and 52 resizes** while holding the core alive. Peak counts: 22 enemies, 41 allied shots, 110 hostile shots, 593 effects, three hazards, and 20 salvage parts. Positions remained finite and the event history stayed at its 1,600-entry limit.

Live Chrome checks exercised the slower opening, the first wave draft, rerouting, module selection, saved-wave continuation, Spear and Blades switching, pause, and the loss debrief. A temporary same-origin 402 × 874 iframe exercised the actual game layout at phone width; the browser's viewport override did not change its measured viewport, so the iframe supplied the narrow viewport. The title, settings sheet, and debrief fitted it. Holding Blades stationary against ranged fire resulted in defeat, rather than an unattended clear. Physical-device touch and a complete manual playthrough of this longer campaign remain unverified. Native fullscreen was not re-run in this pass; its entry, exit, and rejection fallback remain covered by the packaged client tests and the earlier live check above.

The Array's listening posts were reviewed in the title and live game. A temporary art-review page rendered the real sector renderer with a labeled preset swarm to inspect the Belt's derelict hulls and the Core's reactor conduits. That art fixture was a visual check, not a campaign clear.

The interface now has rounded translucent sheets, pill actions, segmented protocol controls, switch knobs, module icons, and a compact floating formation dock. The requested AI UX Playground kit's individual documentation URLs failed in both fetch tools and Chrome, so this is a locally implemented visual interpretation of the supplied reference. The hosted stylesheet and exact kit components were not integrated. The offline build still has no external dependencies.

## 2026-11-13 — Combat rules rebuild (1.3)

This pass changes the underlying weapon and enemy contracts. It preserves the full-viewport arena and compact glass controls.

### Implemented behavior

- Ring fires from orbital ports, banks three successful captures, then releases counterfire. Spear charges a single rail while aim settles and fires from its forward concentrator. Blades uses real swept contact arcs, with a drive that spools while moving. Kamikaze sends an aimed carrier, clears ordinary bullets, and preserves geometric hazards.
- Eight alternative cores bring the pool to 24 modules. Each weapon fits one core per run. Side-by-side specialization choices show explicit costs, and conflicting slots are rejected by the draft, selection, and checkpoint validator. Existing evolutions combine with these cores.
- Pulsars broadcast broken shock rings; Weavers announce interruptible beam lanes; Shield Relays protect nearby escorts while the core stays outside their perimeter. Prism facets can be flanked or opened, and close cuts or explosions suppress Splitter offspring.
- Ranged tells commit their direction before firing. Ordinary wind-ups can be interrupted; released beams persist. Three warning pips and short aim traces distinguish warnings from active damage.
- The sector beat epoch drives the score and ranged pattern timing. Spawn phrases include breathing space. The Sovereign’s corridor walls require a deliberate move, and the boss waits for its wall to pass before beginning another attack.

### Verification

The final offline suite passed. Seeded Standard simulation clears took **644, 634, and 639 seconds**, including a portrait layout. A campaign through the packaged controls cleared all twelve waves, three bosses, and eleven drafts in **633 seconds**, with two viewport changes. Boss Rush cleared in **74 seconds**.

An accelerated Endless soak held the core alive for **3,600 simulated seconds**, cleared **29 sectors**, and performed **52 resizes**. Peak counts were 14 enemies, 34 allied shots, 64 hostile shots, 532 effects, three geometric hazards, 25 salvage parts, six friendly slow fields, and six delayed echoes. Separate targeted tests exercise both kinds of slow field and all eight core alternatives. Array bounds and finite positions remained valid.

The new rule suite checks capture release, reflected targeting, rail charging and turn commitment, real blade arcs, orbital range and vortex tradeoffs, non-recursive arc chains, shield protection and openings, cancellable wind-ups, safe geometry gaps, projectile clearing, exposed boss damage, non-overlapping corridor phases, meaningful wall placement, contradictory core saves, and keyboard-only payload targeting. The client suite checks that pausing does not duplicate a score beat and that training instructions cannot be contradicted by the ordinary guide.

Optional `--samples` diagnostics update a controller every 13 simulation frames, about 217 ms. In four final Standard seeds, the adaptive controller cleared four runs in **628–677 seconds**. The Ring-only controller cleared one in **756 seconds** and lost the other three in the Belt. Both conditions use the same generic module-selection policy, rather than optimized builds for each strategy; these are diagnostic bot outcomes, not human win rates or a claim that defensive builds are unviable. Additional frame-accurate samples cleared Scout and Overclock.

### Live Chrome review

The four revised drills were completed with live keyboard and pointer input; the final repeat cleared them in 28 seconds of simulation time. The normal Scout campaign was continued through the Array’s second wave, a Mirror Kernel specialization was selected, and the next wave and debrief were reviewed. The debrief showed the fitted armament and three counter salvos from nine blocks. This was a partial live campaign with idle intervals between checks, not a new full manual campaign clear.

A clearly labeled, temporary combat fixture rendered the real simulation and renderer with durable targets and an invulnerable core. Frozen first discharges allowed inspection of the broken-ring opening, released Weaver beam, relay perimeter and escort links, and moving corridor. `tests/browser_preview.py` reproduces that fixture; it is not a difficulty or victory test. The ordinary campaign’s core choice is captured in `combat-upgrades-playtest.jpg`; the corrected corridor fixture is captured in `combat-patterns-playtest.jpg`.

Problems found and fixed during verification:
- Wave saves initially lost the sector beat epoch, changing subsequent encounter timing after resume.
- The payload drill showed an unrelated Spear recommendation, and a keyboard-only launch could inherit a stale facing. Training now keeps its own instructions; payloads use a pointer target or a nearby enemy.
- Weaver warnings initially left too little time for the guide, charge, and projectile travel. Their wind-up now supports an intentional interrupt.
- The first corridor placement included a stationary player’s position in its safe gap. It now shifts inward far enough to require movement, including near arena edges.
- Sovereign could begin another attack while its wall still crossed the arena. It now respects the full corridor phase.
- A fixed melee cooldown could let slow sweeps hit twice and undercut the benefit of spinning faster. Blade contacts now track each arm and pass; a controlled geometry test verifies the increased cut rate. The Reaver’s opened hinges retain a stronger close-range Blades counter than ranged alternatives.

Native fullscreen logic was unchanged and remains covered by the earlier live check and packaged-client regression tests. A full manual clear of this longer rebuild, audible music review, and physical-device touch remain unverified.

## 2026-11-13 — Live campaign and balance pass, Flight Build 1.4

### Real Chrome campaign

Played the normal campaign using live Chrome keyboard and pointer controls, observing the actual canvas and menus and pausing between inspections. No invulnerability fixture, hidden-state inspection, health injection, time acceleration, or simulation pilot was used in this browser campaign. The arena filled the browser viewport with the compact formation dock. Native fullscreen was not re-entered during this pass.

The first substantive attempt ended in Heartlock at 10:01, with 443 kills, 72 switches, and 31 interrupts. A fresh replay covered all twelve waves and the Warden and Reaver, then lost near the end of the Sovereign at 10:53. That fight exposed rail target churn and escort buildup. The visible Retry Wave button was exercised, the last-wave checkpoint was saved, and the final targeting/escort fixes were loaded through Continue Campaign. Heartlock and the entire Sovereign encounter were then replayed on the final 1.4 bundle.

The verified result screen shows **Campaign Complete / Array Liberated**: **10:37 campaign clock, three sectors, 111 peak drones, 443 enemies, 76 switches, 59 blocks, 16 counter salvos, 36 interrupts, rank R, and one checkpoint retry**. The clock rewinds to the saved checkpoint; it is not total wall-clock time or a clean uninterrupted clear. An earlier opening attempt left running during inspection was discarded as idle-time evidence.

Live coverage included base Ring, Spear, Blades, and payloads, plus Cryo Payload, Vortex Spindle, Siege Lens, Mirror Kernel, Long Orbit, and Arc Inductor. Siege's slower charge was conspicuous around fast targets; Arc's weaker direct boss damage required longer commitment. Long Orbit allowed safer pack cuts than Vortex. Mirror returned incoming fire but its slower passive guns let more enemies complete their patterns. Ring remained ineffective against geometry. The final fight exercised moving-wall corridors, the three-beam phase, shielded escorts, mines, close cuts, and charged recovery shots. Cluster Rack and Gravity Lattice were covered by rule tests and simulations, not a live run in this pass.

### Findings and changes

- Reaver's short, fixed dash could overshoot close dodge positions and leave its useful Blades opening too far away. Its dash now stops short of the locked position and leaves a 2.05-second recovery. The reachable-hinge prompt now recommends Blades before the generic exposed-core/Spear hint. Live close passes successfully exploited the revised opening.
- Keyboard Spear could aim at a nearer decoy while the guide called for a Weaver interrupt, and could abandon a nearly defeated boss as escorts approached. Weighted threat selection and charge/boss retention fix those cases; explicit mouse or stick aim still wins. The last boss was replayed after this change.
- Consecutive upgrade drafts repeatedly recycled ignored support choices. Drafts now favor unseen offers, retain intentional paired core choices, and offer an eligible hull repair below 55% hull. Reroute, mutually exclusive core selection, installed-build display, and checkpoint restoration worked in Chrome.
- The last two Core waves had a sharp pressure jump. Their group intervals increased from 1.85/1.75 to 2.05/1.95 seconds; surge warnings increased from 1.12 to 1.42 seconds. Enemy groups and wave lengths are preserved.
- Sovereign escorts made the fight drag and obscured its main pattern loop. Periodic escorts now arrive every 8.5 seconds before protocol scaling; scheduled escorts and summons share a four-living-enemy spawn budget. Splitter offspring retain their ordinary death behavior. The final live retest preserved pressure while making committed boss damage dependable.
- Friendly payload/Afterburn pulses used the warm warning palette. They now use ice blue; Cryo has a stronger dotted blue edge and center ticks. Ordinary payload effects were reviewed in the final fight; the revised Cryo styling was not separately reacquired in that final build.
- A late defeat erased the whole campaign. Retry Wave now preserves the checkpoint build, restores at least 65% hull, and deducts 20% of banked score. The retry count survives save/reload; assisted victories show rank R and cannot set a clean fastest time or earn Clean Run/Ace. The final result verifies this path.

### Final automated verification

`python3 tests/check.py --samples` and `python3 tests/check.py --stress` passed. The offline bundle, full simulation campaigns, formation matchups, upgrade prerequisites and core exclusivity, rail target retention/manual override, Weaver interruption, Reaver guidance/approach window, draft freshness and repairs, checkpoint retry persistence, client controls, and result saving all passed. The packaged-client campaign completed twelve waves, three bosses, and eleven upgrades in 614 simulated seconds, including two viewport changes; Boss Rush cleared in 68 seconds.

Four matched Standard adaptive samples cleared in 621–653 seconds with 11–22 hits. Four Ring-only samples also cleared, but took 698–752 seconds with 13–33 hits. This is diagnostic controller evidence, not a human win-rate estimate or proof that every build is equally strong. Scout and Overclock controller samples also cleared. The accelerated Endless soak covered 3,600 simulated seconds, 28 sectors, 52 resizes, and bounded entities/effects; that soak holds the player alive explicitly and is a stability test.

Evidence: `campaign-complete-playtest.jpg` is the actual final debrief; `campaign-retry-playtest.jpg` shows the real defeat/retry offer; `campaign-wall-playtest.jpg` shows the final live moving wall. Audible music, physical touch/gamepad hardware, and a fresh uninterrupted full Chrome campaign on the final bundle remain separate checks. Standard/Overclock were simulated rather than played end to end in Chrome during this pass.

## 2026-11-13 — Fresh Standard campaign, zero retries; guidance follow-up (1.5)

### Complete live run

Started a fresh **Standard** campaign in real Chrome and cleared **all twelve waves and all three bosses without a death, checkpoint retry, restore, reload, or save/continue**. Used normal keyboard controls, selected all eleven upgrades through the actual draft UI, and paused between observations. No fixture, hidden-state reads, health injection, accelerated clock, or automated simulation pilot was used for this campaign. Pausing excludes observation time from the campaign clock; this was not an uninterrupted wall-clock speedrun.

The victory debrief recorded **10:16, 103,433 points, rank C, three sectors, 111 peak drones, 505 enemies defeated, 173 switches, 204 blocked shots, 65 counter salvos, 29 interrupts, and a best chain of 23**. Flight Records subsequently showed **Standard / rank C / best clear 10:16**, independently confirming that the run qualified for the clean fastest-time record. This is a zero-retry clear, not the five-hit-or-fewer Clean Run badge.

Final build: Nanite Mesh 2, Auxiliary Guns 2, Long Lance, Core Plating 2, Siege Lens, Bastion, Mirror Kernel, and Vector Thrusters. The Warden fell with 40 hull remaining, the Reaver with 19. Heartlock was the hardest wave; Sovereign began at 28 hull and fell at 37. Recovery, defensive switching, ordinary payloads, close blade passes, retained rails, broken-ring gaps, both wall orientations, and the three-beam fan were exercised. Ring did not protect against geometry or body collisions. The arena filled the browser viewport; native fullscreen was not re-entered in this pass.

### Findings and final changes

- Boss summons discharge radial projectiles, but only spreads were recognized as charging volleys by the guide. Summons now receive Ring warnings. A nearly charged rail keeps its hint only if it can finish with 0.18 seconds left before volley release; imminent volley warnings bypass the normal hint delay.
- Rams could retain an armor/Spear recommendation during a committed collision course. A remaining charge path that can reach the core now calls for an immediate sidestep. Charges passing beside the core or stopping short do not create that warning.
- First-contact Pulsar, Weaver, and Relay introductions now explain their general behavior, avoiding stale wording that implied a dead caster was still attacking.
- Nanite Mesh shows both repair levels, intervals, and the Medic contribution. Core Plating distinguishes maximum hull from restored hull. Debriefs identify the protocol and show checkpoint retries even at zero.
- Investigated the hit near the Array's sector-clear banner. Boss defeat already clears hostile projectiles and hazards and prevents subsequent hull damage. No transition nerf was needed. The observed late losses primarily followed missed gaps, crossing a locked lane, or reversing into committed rams; enemy health, damage, timings, spawns, and upgrade strength are unchanged from the successful browser run.

The full live clear used 1.4. The subsequent 1.5 changes concern guidance and reporting, not combat values. A separate fresh browser UI check on 1.5 covered title, live play, pause, the real Nanite draft text, and loss debrief with **Standard / zero retries**. That short check deliberately stopped dodging to reach the result screen at 00:53; it was not another campaign-clear attempt, and Retry Wave was never clicked. Records retained the successful 10:16 Standard result. The final additional Ram guidance rule was checked by collision-course regression cases and the complete offline suite, not another full browser campaign.

### Verification and evidence

Final `python3 tests/check.py` and `git diff --check` passed. New decision tests cover summon volleys, safe versus unsafe rail completion, immediate hint replacement, a Ram collision course during wind-up and movement, and an off-path Ram. Existing weapon matchups, progression, saves, retries, controls, fullscreen fallback, and rendering contracts passed. Three simulated Standard campaigns cleared in **653, 636, and 640 seconds**; the packaged-client campaign cleared in **621 seconds**, with twelve waves, three bosses, eleven upgrades, and two viewport changes. Packaged-client Boss Rush cleared in **77 seconds**. These are separate automated results.

Evidence: `standard-protocol-playtest.jpg`, `standard-reaver-playtest.jpg`, `standard-final-shot-playtest.jpg`, `standard-campaign-complete.jpg`, and `standard-clean-record.jpg` document the actual run and saved record. `repair-upgrade-copy-1.5.jpg` and `retry-reporting-1.5.jpg` document the follow-up UI. Final offline HTML SHA-256: `3b7013e8b094de72ba8e90f507d71434b9a78cd28a4067663adc709504981f4b`.

## 2026-11-15 — Full Overclock Chrome clear, zero retries (1.6)

### Actual campaign and attempts

Completed a fresh **Overclock** campaign in real Chrome on the final 1.6 combat build: **11:18, 139,211 points, three sectors, 129 peak drones, 588 enemies defeated, 388 formation switches, 347 blocked shots, 112 counter salvos, 30 interrupts, best chain 36, rank C, and zero checkpoint retries**. The result awarded **Overclock Ace**. All twelve waves, three bosses, and eleven drafts were played through the normal keyboard/pointer controls. No checkpoint retry, restore, save/continue, reload, health/state injection, time acceleration, fixture, or simulation pilot was used within the successful run. Pauses between observations exclude inspection time from the campaign clock; this was not a continuous wall-clock speedrun.

There were **two earlier fresh losses**, not checkpoint retries hidden from the result: build 1.5 lost in Array wave 4 at 02:35 (22,755 points); the first 1.6 revision lost in Belt wave 2 at 04:23 (60,723 points). Both debriefs showed zero checkpoint retries. Each subsequent attempt restarted from deployment. The third attempt included both targeting fixes below and is the full clear reported here.

Successful armament: Auxiliary Guns 2, Nanite Mesh 2, Drone Foundry, Rotor Edge, Long Orbit, Vector Thrusters, Core Plating, Bastion, and Phase Conductor. Warden fell around 03:04 at 100 hull; Reaver fell around 06:49 at 100 hull. Sovereign began at 115/122 hull, the run fell as low as 19 hull during that encounter, and the boss fell at 46 hull around 11:16 before the 11:18 debrief. Ordinary bullets, mines, charges, broken rings, floor surges, moving walls, the three-beam fan, explicit targeting, payloads, and exposed-core rails were exercised. The arena filled the 1352 × 671 browser viewport with the compact dock. Native fullscreen was not re-entered in this pass.

### Fairness fixes included in the successful run

- **Offscreen shock-ring openings were hard to read.** A faint mint safe wedge, dashed angular boundaries, and directional chevrons now extend through the field from wind-up through travel. They remain useful when the broadcaster or arc endpoints leave the camera. The guide warns about a reachable ring during wind-up instead of waiting until its front is nearby. The gap, damage, speed, and collision rules are unchanged. The final campaign included successful ring/beam and ring/charge escapes using these cues.
- **A retained light target could monopolize automatic Spear while a Ram closed in.** A Ram within 150 units now displaces that retained light target, while Weaver interrupt priority and existing boss retention remain intact.
- **A heavy rail could abandon selected armor while turning, before it acquired any charge.** Acquired armor now remains selected during that turn. Explicit pointer/stick aim still overrides retention. This was included before the final fresh deployment, not patched into an active run.

No global reduction to Overclock health, damage, spawn pressure, or projectile speed was made. Long Orbit's safer reach still needed multiple cuts through healthy Splitters; base Spear's shorter commitment was useful against paired Rams; Ring required movement around dense volleys and did not stop geometry or body hits. Nanite Mesh 2 with a Medic supported recovery after mistakes while still leaving the final run at 19 hull. This one clear supports viability of that build, not equal balance across every draft or a human win-rate estimate. The earlier Belt loss used Siege Lens, whose longer commitment was conspicuous under that pressure.

Late damage followed leaving Ring into nearby bullets, attempting to outshoot an already committed Ram, or losing alignment with a moving wall's fixed corridor as the camera moved. The final run recovered through normal movement, shielding, repairs, and manual aim. No additional combat nerf was justified by those mistakes. Boss defeat cleared the remaining hostile pressure and the victory transition completed without post-clear hull damage.

### Verification and evidence

The final `python3 tests/check.py` passed after both targeting changes. New regressions cover a nearby Ram preempting a retained light target, a Siege rail retaining armor while turning from the opposite direction, early reachable-ring guidance, and no evade hint when already in the gap. Existing progression, weapon, save/retry, controls, rendering, and fullscreen fallback checks passed. The packaged-client campaign separately cleared in **616 simulated seconds**, with twelve waves, three bosses, eleven upgrades, and two viewport changes; Boss Rush cleared in **75 seconds**. Those automated results are separate from the Chrome run.

Evidence: `overclock-protocol-playtest.jpg` shows the selected protocol; `overclock-attempt-1-debrief.jpg` and `overclock-attempt-2-debrief.jpg` retain the earlier losses; `overclock-mint-lane-1.6.jpg` shows the revised ring cue in actual play; `overclock-1.6-campaign-clear.jpg` shows **Campaign Complete / Overclock** and **Checkpoint Retries 0**. Physical touch/gamepad hardware and audible music remain separate checks. No publication was performed. Final `git diff --check` passed. Offline HTML SHA-256: `d492468981038ee8373b86815c010c00f95d7d041fed5766f454f1aa68147770`.
