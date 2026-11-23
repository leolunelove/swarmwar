# Visual hierarchy audit — 23 November 2026

Baseline: Flight Build 1.6, inspected in Chrome at a 1352×671 content viewport. Actual Standard campaign play reached the first draft and a 24-drone second wave, followed by defeat. No state injection, invulnerability, accelerated clock, or restored test scene was used for these observations. The run was deliberately not an attempt to clear the campaign.

The user then expanded the task into Campaign Edition 2.0 and explicitly requested manual weapons. The visual fixes below are separate from those authorized gameplay changes. The audit itself did not justify changing enemy damage, protocol multipliers, projectile speeds, or safe-gap collision rules.

## Five priorities

| Priority | Confirmed evidence | Effect on play — interpretation | Specific fix applied in 2.0 |
| --- | --- | --- | --- |
| 1. Available and locked formations look too similar | [Locked Spear attempt](audit-2026-11-23/04-locked-formation.jpg): pressing 2 with two drones did not change formation or show visible feedback. [Unlocked dock](audit-2026-11-23/06-wave2-unlocks.jpg): ready states were visually almost identical. DOM inspection confirmed status text clipped into a 1px region. | The player cannot reliably tell whether switching failed, the key is wrong, or the formation is unavailable. | Restore a small visible second line for READY, ACTIVE, drone requirement and payload charge; dim locked states; show feedback on an unavailable command. Retain one compact floating dock. |
| 2. The core competes with its own swarm and advice marker | [Busy combat](audit-2026-11-23/07-busy-combat.jpg) and [manual Spear formation](audit-2026-11-23/09-manual-veil-combat.jpg): mint drone triangles and trails crowd the mint-outlined core; the advice key sits close above it. Background route marks use a similar thin-line language. | Reacquiring the controlled core while dodging costs more attention than it should. This is a visual assessment, not measured reaction time. | Give the core an opaque dark backing and a distinct pale outline, lift the advice marker farther away, and lower scenery contrast. No extra gameplay panel or larger arena border. |
| 3. Critical hull is peripheral and small | At 00:43 in [busy combat](audit-2026-11-23/07-busy-combat.jpg), hull is 15/100 in the upper-left edge. The numeric readout was 10px; no persistent local critical-hull marker appeared by the core. | A player concentrating on nearby patterns may miss that the next hit is fatal. | Slightly increase the edge readout, strengthen the critical color/bar, and add a restrained dashed local ring plus remaining hull only below 30%. Keep the rest of the HUD compact. |
| 4. Draft choices require parsing equally weighted paragraphs | [First upgrade screen](audit-2026-11-23/05-upgrade-selection.jpg): Bastion's immediate effect and three unlock names share one paragraph; Foundry combines part cost, capacity, banked parts and an unlock; all cards carry similar visual weight. | Comparing an immediate benefit with a future build path requires unnecessary rereading. Newcomer comprehension has not been tested. | Promote each module's first effect as a separate bright line; keep secondary effects and unlock information quieter. Retain installed-build context and the three-choice layout. |
| 5. Defeat gives a lesson without naming the cause | [Defeat](audit-2026-11-23/08-defeat.jpg): SIGNAL LOST, a generic location, a combined tactical/retry paragraph, and eleven statistic tiles. The last-hit enemy/attack is not explicitly named. | The player has to infer which attack ended the run and whether the advice explains that attack. | Add a prominent LAST HIT line above the lesson. Keep retry cost text explicit; give score/time a slightly clearer first tier. Pause instructions also become specific to the active input type, with full controls in Settings. |

## What already worked

- The arena filled the browser viewport, with the live UI concentrated at the edges.
- Warm enemies and projectiles generally separated well from mint allies. The visible broken-ring gap and mint directional marks were legible in the sampled combat.
- Pause froze the run. Resume was the clear primary action; secondary settings/manual actions were correctly subordinate.
- The draft required an explicit selection; combat formation keys did not accidentally choose a module.

## Confirmed vs not established

The screenshots confirm visibility, density, spacing, state presentation and wording in the sampled states. They do **not** establish human reaction times, accessibility across all color-vision differences, equal balance among upgrades, or the fairness of every encounter. Claims about attention and learning above are design interpretations. The sampled baseline swarm had 24 peak drones; this is not evidence of readability at the new 237-drone maximum.

The subsequent 2.0 browser check inspected the revised terminal, map, changelog, practice launch and manual rail firing. Automated packaged-client tests separately complete twenty waves and five guardians and verify all chapter phase orders. Browser native-fullscreen automation was intermittent and is reported separately in PLAYTEST.md.
