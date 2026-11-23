# SWARMWAR handoff

Current build: **Campaign Edition 2.0 / The Signal War**. Start here instead of rereading the chat.

- User decisions: fullscreen arena, compact HUD, minimal vector style, restrained iOS-inspired menus; both five chapters and five phases per chapter. Every primary uses manual aim/trigger input. No auto-aim or automatic shooting.
- Campaign: Array → Belt → Veil → Forge → Core. Four waves + guardian each; 20 waves, 19 module drafts. Route handoff stops time between chapters. Any chapter is playable as clearly labeled practice.
- Controls: WASD, mouse aim, hold left click for Ring/Blades; hold/release for Spear. 1/2/3 select, Q/E cycle, Space payload, Esc pause, F fullscreen.
- Source roles and workflow: see AGENTS.md. Run `python3 build.py`, then `python3 tests/check.py`. Optional `--stress` exercises an accelerated hour. The browser preview is a simple static server in this directory.
- Generated outputs: `Play Swarmwar.html` and `docs/index.html`. Never edit them directly.
- Records: v2 store; v1 history remains untouched. Earlier checkpoints are labeled legacy and excluded from new campaign ranks.
- Audit evidence and five findings: VISUAL_AUDIT.md. Verification: top of PLAYTEST.md. Browser evidence lives in `audit-2026-11-23/`.
- Validation limit: automated full runs establish completion and regression coverage, not human balance. Real touch/gamepad hardware and a human full five-chapter clear still need testing.
- Next focused design pass: human run with manual fire, especially late hull sustain and whether nineteen upgrades leave enough meaningful choices. Do not silently change damage or protocol rules during a visual audit.
