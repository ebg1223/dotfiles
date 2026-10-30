#!/usr/bin/env python3
"""Exercise chezmoi's real modify scripts without reading live credentials."""
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
for name, fixture in [
    ("dot_pi/agent/modify_settings.json", {"lastChangelogVersion": "host-specific", "theme": "old"}),
    ("dot_claude/modify_private_settings.json.tmpl", {"env": {"TEST_LOCAL_KEY": "fixture-only"}, "model": "old"}),
]:
    path = ROOT / name
    script = path.read_bytes()
    if name.endswith(".tmpl"):
        script = subprocess.check_output(
            ["chezmoi", "--source", str(ROOT), "execute-template"], input=script,
        )

    def run(current):
        return subprocess.run(["python3", "-c", script.decode()], input=current, capture_output=True)

    for current in (b"", json.dumps(fixture).encode()):
        first = run(current)
        assert first.returncode == 0, first.stderr.decode()
        desired = json.loads(first.stdout)
        if current:
            if "lastChangelogVersion" in fixture:
                assert desired["lastChangelogVersion"] == "host-specific"
                assert desired["theme"] == "light"
            else:
                assert desired["env"]["TEST_LOCAL_KEY"] == "fixture-only"
                assert desired["model"] != "old"
        elif "lastChangelogVersion" in fixture:
            assert "lastChangelogVersion" not in desired
        second = run(first.stdout)
        assert second.returncode == 0 and second.stdout == first.stdout
    assert run(b"invalid JSON").returncode != 0
    print(f"{name}: local state preserved, empty input supported, repeat converges, malformed input rejected")
