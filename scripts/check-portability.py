#!/usr/bin/env python3
"""Render Linux and macOS targets without applying files or running hooks."""
import io
import json
from pathlib import Path
import posixpath
import subprocess
import tarfile
import tomllib

ROOT = Path(__file__).resolve().parents[1]
MISE_CONFIG = tomllib.loads((ROOT / "dot_config/mise/config.toml").read_text())
MISE_CONFIGS = {
    ".config/mise/" + str(path.relative_to(ROOT / "dot_config/mise")): tomllib.loads(path.read_text())
    for path in (ROOT / "dot_config/mise").rglob("*.toml")
}
mise_tools = {tool for config in MISE_CONFIGS.values() for tool in config.get("tools", {})}
for name, config in MISE_CONFIGS.items():
    unused_excludes = (
        set(config.get("settings", {}).get("minimum_release_age_excludes", [])) - mise_tools
    )
    assert not unused_excludes, (name, "Release-age exceptions for undeclared tools", sorted(unused_excludes))


def chezmoi(*args, data, content=None):
    return subprocess.check_output(
        ["chezmoi", "--source", str(ROOT), "--override-data", json.dumps(data), *args],
        input=content,
    )


for os_name, arch, home in [
    ("linux", "amd64", "/home/ethan"),
    ("darwin", "arm64", "/Users/mac-test"),
    ("darwin", "amd64", "/Users/mac-test"),
]:
    data = {"chezmoi": {
        "os": os_name, "arch": arch, "homeDir": home,
        "username": home.rsplit("/", 1)[1], "hostname": "portability-test",
    }}
    archive = tarfile.open(fileobj=io.BytesIO(chezmoi("archive", "--format=tar", data=data)))
    members = archive.getmembers()
    names = {m.name.rstrip("/") for m in members}
    links = 0
    for member in members:
        name = member.name
        assert not name.startswith(("living-plans/", "scripts/", "README.md")), name
        if os_name == "darwin":
            assert not name.startswith((".config/systemd/", ".config/hypr/", ".config/waybar/")), name
        if member.issym() and name.startswith((".agents/", ".claude/", ".codex/", ".grok/")):
            target = member.linkname
            if target.startswith(home + "/"):
                target = target[len(home) + 1:]
            elif not target.startswith("/"):
                target = posixpath.normpath(posixpath.join(posixpath.dirname(name), target))
            assert target in names, (name, member.linkname)
            links += 1
        if not member.isfile():
            continue
        body = archive.extractfile(member).read()
        if os_name == "darwin":
            assert b"/home/ethan" not in body and b"/ethan/" not in body, name
            if name.startswith(".config/"):
                assert b".config/omarchy/" not in body, name
        if name.endswith(".json") and name.startswith((".config/", ".claude/", ".codex/", ".factory/", ".pi/")):
            # Skill fixtures are not application configuration.
            if "/skills/" not in name:
                json.loads(body)
        if name.endswith(".toml"):
            config = tomllib.loads(body.decode())
            if name in MISE_CONFIGS:
                assert config == MISE_CONFIGS[name], (os_name, name, "Mise config changed during rendering")
            if name == ".codex/config.toml":
                if "github:BennyKok/lfg" not in MISE_CONFIG["tools"]:
                    assert "lfg" not in config.get("mcp_servers", {}), "LFG MCP requires the retired mise tool"
        if name in (".bashrc", ".bash_profile"):
            subprocess.run(["bash", "-n"], input=body, check=True)
        if name == ".zshrc":
            subprocess.run(["zsh", "-n"], input=body, check=True)
    for script in ROOT.glob("run_*.tmpl"):
        rendered = chezmoi("execute-template", data=data, content=script.read_bytes())
        subprocess.run(["sh", "-n"], input=rendered, check=True)
        if os_name == "darwin":
            assert b"systemctl" not in rendered and b"loginctl" not in rendered, script.name
    print(f"{os_name}/{arch}: {len(members)} entries, {links} agent links; checks passed")
