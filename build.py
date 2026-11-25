from pathlib import Path
import hashlib
import json
import re

root = Path(__file__).resolve().parent
src = root / 'src'
version = (root / 'VERSION').read_text().strip()
if not re.fullmatch(r'\d+\.\d+\.\d+\.\d+', version):
    raise ValueError('VERSION must contain the four-part release number')
page = (src / 'index.html').read_text()
for marker, name in [('STYLE','style.css'), ('STRINGS','strings.js'), ('CONTENT','content.js'), ('SIM','sim.js'), ('RENDER','render.js'), ('AUDIO','audio.js'), ('BINDINGS','bindings.js'), ('CLIENT','client.js')]:
    page = page.replace(f'/* @{marker} */', (src / name).read_text())
page = page.replace('__SWARMWAR_VERSION__', version)
(root / 'Play Swarmwar.html').write_text(page)
(root / 'docs').mkdir(exist_ok=True)
(root / 'docs' / 'index.html').write_text(page)
artifact = page.encode('utf-8')
manifest = {'name': 'SWARMWAR', 'version': version, 'channel': 'preview',
            'entry': 'index.html', 'sha256': hashlib.sha256(artifact).hexdigest(),
            'bytes': len(artifact)}
(root / 'docs' / 'release.json').write_text(json.dumps(manifest, indent=2) + '\n')
