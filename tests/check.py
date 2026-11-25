"""Build and test the offline game without dependencies."""
from html.parser import HTMLParser
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parent.parent
subprocess.run([sys.executable, str(root / "build.py")], check=True)
html = (root / "Play Swarmwar.html").read_text()
artifact = (root / "Play Swarmwar.html").read_bytes()
manifest = json.loads((root / 'docs/release.json').read_text())
version = (root / 'VERSION').read_text().strip()
assert artifact == (root / 'docs/index.html').read_bytes(), 'Offline and Pages builds differ'
assert manifest['version'] == version and manifest['bytes'] == len(artifact), 'Release identity mismatch'
assert manifest['sha256'] == hashlib.sha256(artifact).hexdigest(), 'Release hash mismatch'
assert f'CAMPAIGN EDITION / v{version}' in html and f'version:\'{version}\'' in html, 'Menu and changelog version mismatch'
assert '__SWARMWAR_VERSION__' not in html, 'Unresolved version placeholder'
jsc = Path("/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc")
runtime = shutil.which("node") or (str(jsc) if jsc.exists() else None)
if not runtime:
    sys.exit("The checks need Node.js or macOS JavaScriptCore.")

class Bundle(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = {}
        self.strings = []
        self.parts = []
        self.script = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        assert not any(a in attrs for a in ("src", "href")), "Offline page references an external resource"
        if "id" in attrs:
            assert attrs["id"] not in self.ids, f"Duplicate id: {attrs['id']}"
            self.ids[attrs["id"]] = tag
        if "data-t" in attrs:
            self.strings.append((attrs.get("id"), tag, attrs["data-t"]))
        if tag == "script":
            self.script = True
            self.parts.append("")
    def handle_data(self, data):
        if self.script:
            self.parts[-1] += data
    def handle_endtag(self, tag):
        if tag == "script":
            self.script = False

bundle = Bundle()
bundle.feed(html)
assert len(bundle.parts) == 7 and "/* @" not in html, "Incomplete offline bundle"
assert "#canvas{position:absolute;inset:0;" in html and "#game{position:fixed;inset:0;" in html, "Viewport contract missing"

def source(name):
    return (root / name).read_text()

def run(filename, parts, work):
    path = work / filename
    path.write_text("\n\n".join(parts))
    subprocess.run([runtime, str(path)], check=True)

with tempfile.TemporaryDirectory(prefix="swarmwar-check-") as scratch:
    work = Path(scratch)
    run("simulation.js", [*bundle.parts[1:3], source("tests/pilot.js"), source("tests/simulation.js"), source("tests/formation-balance.js"), source("tests/progression.js"), source("tests/combat-rules.js")], work)
    fixture = "const bundledMarkup = " + json.dumps({"ids": bundle.ids, "strings": bundle.strings}) + ";"
    run("client.js", [fixture, source("tests/dom.js"), *bundle.parts[:6],
                      source("tests/client-hook.js"), bundle.parts[6], source("tests/client.js")], work)
    run("flight.js", [fixture, source("tests/dom.js"), *bundle.parts[:6],
                      source("tests/client-hook.js"), bundle.parts[6],
                      source("tests/pilot.js"), source("tests/client-flight.js")], work)
    if "--samples" in sys.argv[1:]:
        run("samples.js", [*bundle.parts[1:3], source("tests/pilot.js"), source("tests/balance-samples.js")], work)
    if "--stress" in sys.argv[1:]:
        run("stress.js", [*bundle.parts[1:3], source("tests/pilot.js"), source("tests/stress.js")], work)
print("Offline build and checks passed.")
