"""Build the self-contained, playable GitHub release download."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

root = Path(__file__).resolve().parent
subprocess.run([sys.executable, str(root / 'build.py')], check=True)
version = (root / 'VERSION').read_text().strip()
manifest = json.loads((root / 'docs/release.json').read_text())
page = (root / 'docs/index.html').read_bytes()
assert hashlib.sha256(page).hexdigest() == manifest['sha256']
assert page == (root / 'Play Swarmwar.html').read_bytes()
instructions = f'''SWARMWAR v{version} — The Signal War

Unzip this folder and open index.html in a modern browser. No install, server,
account or internet connection is required. The game fills the browser window.
F toggles optional native fullscreen. P pauses/resumes; H inspects while paused.

WASD / arrows: move. Mouse: aim.
Ring and Blades: aim and hold left click to fire.
Spear: charge builds automatically while equipped; aim and click/release to fire.
1 / 2 / 3: formations. Q / E: cycle. Space: aimed Kamikaze payload.

Start with Training, then Campaign Map > Start Full Campaign.
Progress and settings are stored in this browser. Moving the file or switching
browsers may use a separate save. The online version uses separate browser saves.

This is a preview release. Automated checks cover all chapters and guardians.
The latest manual browser campaign cleared four chapters and 18/20 waves before
a browser-control interruption; a full manual no-retry clear remains unverified.
Physical touch/gamepad performance and audible music acceptance remain unverified.

Play online: https://leolunelove.github.io/swarmwar/
Source and updates: https://github.com/leolunelove/swarmwar
'''
out = root / 'dist'
out.mkdir(exist_ok=True)
archive = out / f'SWARMWAR-v{version}.zip'
with ZipFile(archive, 'w', compression=ZIP_DEFLATED) as bundle:
    for name, data in [('index.html', page), ('release.json', (root / 'docs/release.json').read_bytes()),
                       ('README.txt', instructions.encode())]:
        entry = ZipInfo(name, (2026, 11, 25, 0, 0, 0))
        entry.compress_type = ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        bundle.writestr(entry, data)
checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
(out / 'SHA256SUMS.txt').write_text(f'{checksum}  {archive.name}\n')
with ZipFile(archive) as bundle:
    assert bundle.testzip() is None
    assert bundle.read('index.html') == page
print(f'{archive.name}: {archive.stat().st_size} bytes; SHA-256 {checksum}')
