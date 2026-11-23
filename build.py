from pathlib import Path

root = Path(__file__).resolve().parent
src = root / 'src'
page = (src / 'index.html').read_text()
for marker, name in [('STYLE','style.css'), ('STRINGS','strings.js'), ('CONTENT','content.js'), ('SIM','sim.js'), ('RENDER','render.js'), ('AUDIO','audio.js'), ('BINDINGS','bindings.js'), ('CLIENT','client.js')]:
    page = page.replace(f'/* @{marker} */', (src / name).read_text())
(root / 'Play Swarmwar.html').write_text(page)
(root / 'docs').mkdir(exist_ok=True)
(root / 'docs' / 'index.html').write_text(page)
