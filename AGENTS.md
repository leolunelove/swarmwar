# SWARMWAR
- Concise handoff: PROJECT_STATUS.md. Design and guide checkpoint: DESIGN.md. Verification record: PLAYTEST.md.
- Combat rules belong in src/sim.js and encounter data in src/content.js. Keep both free of DOM, Canvas, audio, and browser storage.
- Keep visuals in src/render.js, audio in src/audio.js, key mapping in src/bindings.js, and interface and input routing in src/client.js. Put player-facing copy in src/strings.js.
- Preserve the full viewport playfield; gameplay information belongs in overlays. Native fullscreen is optional at runtime and must fall back to the full browser viewport.
- Generate the offline playable HTML with python3 build.py. Do not edit the generated file directly. Keep it self-contained.
- Run python3 tests/check.py after changing the game. Review title, live gameplay, draft, pause, and debrief in a browser when browser access is available.
