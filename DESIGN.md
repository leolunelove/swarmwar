# SWARMWAR — Preview v0.1.2.5

## Design commitments

The arena fills the entire viewport. Menus, draft and pause may cover it while simulation is stopped. The live HUD stays on the edges. Native fullscreen is optional and falls back to the full window. The visual language stays minimal: one bright core, small mint drones, warm geometric threats, mint safe openings, and restrained glass controls. The v0.1.2.8 local visual prototype adds a deep-space backdrop: cached shaded planets, sparse parallax stars and chapter architecture on a foreshortened lower plane. Combat keeps the existing level camera and exact 2D aim projection. Ship hull shading adds thickness without shifting the main silhouette or hitbox. Reduced Motion removes decorative drift and extra background parallax.

Every primary is a manually aimed skill shot. Pointer movement alone fires nothing. No primary or payload searches for an enemy. Defensive interception, repair, movement and formation animation may operate without a trigger; direct weapon fire requires deliberate input. Ring stores capture energy until manual release. Its aimed center bolt deals 28 damage and additional wings deal 16, so a precise starter shot can kill a 26-hull Standard Skimmer. Spear assembles automatically while equipped and holds full charge until deliberate trigger release. Switching, pause and cancellation preserve its stored charge. The client queues a complete click between simulation frames; pause cancels queued intent. Blades contact damage and short cutters require the held trigger. Formation switching primes Conductor but never launches shots itself. Arc's branches follow fixed angles rather than selecting targets.

P toggles pause/resume without invoking browser fullscreen exit. H while paused shows the actual frozen field with a compact return/resume toolbar. Drafts reject pointer clicks for their first 450 ms so combat clicks do not select, reroll or abort on arrival; keyboard/gamepad activation still requires a new deliberate action.

## Campaign structure

Five chapters, each four timed waves and one guardian. Each of the first three wave breaks offers one module, then advances exactly one phase. The fourth wave clears leftover attacks and announces the guardian for 2.6 seconds before arrival. Defeating the guardian clears remaining pressure. Chapters 1–4 offer a module and enter a stopped route handoff; deployment starts the next chapter. Chapter 5 ends in a debrief. Nineteen choices span the campaign.

Array → Debris Belt → The Veil → Cinder Forge → Black Core. The Array teaches patrols and broken rings. The Belt adds debris and splitters. The Veil combines beam interruptions with slow corridor walls. The Forge combines shields, committed charges and paired heat circles with room between them. The Core combines the established rules. Each chapter has its own palette, background geometry, tempo, seeded variants, phase copy and spawn groups. The Archivist adapts Warden geometry to beam/ring phrases; the Crucible adapts Reaver geometry to dash/ring/volley phrases. This is five distinct encounters using three boss silhouette families.

Practice offers each chapter with a supplied swarm and three foundation modules. It uses a separate mode and cannot claim a campaign clear. Full campaigns always start at the Array. Existing three-sector checkpoints retain sector identity but are explicitly legacy runs, excluded from new ranks, badges and records.

## Progression and attack rules

Fabrication begins with one drone and a twelve-drone cap. Each wave expands capacity by nine through the twentieth wave. Drone cost progresses from two to three to four parts. Foundry reduces cost by one on its first level and adds eighteen capacity per level. Wave breaks bank remaining parts; they do not silently erase earnings. Three formation unlocks are also guaranteed by the first chapter's phase breaks so poor collection cannot trap the player without the next tool.

Wave healing remains six hull; chapter healing remains thirty-two plus five reserve drones. Retry retains the build, restores at least 65% hull and deducts 20% score. Retried clears are rank R. No global protocol damage, health or projectile-speed nerf was part of the visual audit.

Foundation modules open evolution choices; mutually exclusive core slots enforce build tradeoffs. Spear opens shields and interrupts ordinary enemies during warnings. Splitter melee kills prevent offspring. Ring cannot block geometry. Warnings commit before release, and boss recovery windows remain separate from the next attack phrase. The Sovereign shares a four-escort budget across periodic spawns and summons.

## Code ownership

Encounter data: `src/content.js`. DOM-free rules and saves: `src/sim.js`. Canvas: `src/render.js`. Audio: `src/audio.js`. Bindings: `src/bindings.js`. Input, menu and HUD: `src/client.js`. All interface copy and release notes: `src/strings.js`. Build outputs are generated, self-contained and offline.

Version 2.0 removes repeated target searches and sorts from primary weapons, caches DOM references, and draws drone triangles without per-drone point-array allocation. Bounded projectile, particle, enemy and event pools remain enforced. These are structural improvements; no browser frame-rate gain is claimed without a measured profile.
