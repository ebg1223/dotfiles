#!/usr/bin/env python3
"""Exercise T3 nightly installs/upgrades with real mise and local fixture releases."""
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import io
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import tarfile
import tempfile
import threading
import tomllib

ROOT = Path(__file__).resolve().parents[1]
CONFIG = tomllib.loads((ROOT / "dot_config/mise/conf.d/t3.toml").read_text())
MAIN_CONFIG = tomllib.loads((ROOT / "dot_config/mise/config.toml").read_text())
TOOL = CONFIG["tools"]["http:t3"]
UPGRADE = CONFIG["tasks"]["t3:upgrade"]
LOCK = CONFIG["tasks"]["t3:lock"]
MISE = shutil.which("mise")
assert MISE, "Install mise before running this integration check"
assert "npm:t3" not in MAIN_CONFIG["tools"], "The npm nightly entry must not shadow native T3"
assert TOOL["version"] == "latest" and TOOL["prerelease"] is True
assert TOOL["version_list_url"] == "https://registry.npmjs.org/t3/nightly"
assert TOOL["version_expr"] == "[fromJSON(body).version]"
assert TOOL["checksum_url"].endswith("/v{{ version }}/SHA256SUMS")
assert set(TOOL["platforms"]) == {
    "linux-x64", "linux-arm64", "macos-arm64", "windows-x64", "windows-arm64",
}, "Declare only platforms with official native archives"
assert "http:t3" in CONFIG["settings"]["minimum_release_age_excludes"]
assert LOCK["env"] == {"MISE_LOCKFILE_MODE": "generate"}
assert LOCK["run"] == "mise lock --global --bump http:t3 --platform {{ os() }}-{{ arch() }}"
assert "env" not in UPGRADE, "Generation mode must only apply to the checksum-lock step"
assert UPGRADE["run"] == "mise install http:t3" and UPGRADE["depends"] == ["t3:lock"]
assert UPGRADE["dir"] == LOCK["dir"] == "~"

OS_NAME = {"Linux": "linux", "Darwin": "macos"}.get(platform.system())
ARCH = {"x86_64": "x64", "aarch64": "arm64", "arm64": "arm64"}.get(platform.machine())
HOST = f"{OS_NAME}-{ARCH}"
assert HOST in TOOL["platforms"], f"Integration check needs a supported Unix host, got {HOST}"
VERSIONS = [f"0.1.1-nightly.20990101.{i}" for i in (1, 2, 3, 4)]
ASSETS = {}
for version in VERSIONS:
    content = f"#!/bin/sh\nprintf 't3 v{version}\\n'\n".encode()
    archive = io.BytesIO()
    with tarfile.open(fileobj=archive, mode="w:gz") as tar:
        info = tarfile.TarInfo(f"t3-{version}/t3")
        info.mode = 0o755
        info.size = len(content)
        tar.addfile(info, io.BytesIO(content))
    ASSETS[version] = archive.getvalue()


class Registry(BaseHTTPRequestHandler):
    version = VERSIONS[0]
    checksum_requests = []

    def log_message(self, *_args):
        pass

    def do_GET(self):
        if self.path == "/nightly":
            body = json.dumps({"version": self.version}).encode()
        else:
            parts = self.path.strip("/").split("/")
            if len(parts) != 2 or parts[0][1:] not in ASSETS:
                self.send_error(404)
                return
            version = parts[0][1:]
            filename = TOOL["platforms"][HOST]["url"].rsplit("/", 1)[1]
            filename = filename.replace("{{ version }}", version)
            if parts[1] == "SHA256SUMS":
                self.checksum_requests.append(version)
                if version == VERSIONS[3]:
                    self.send_error(404)
                    return
                digest = hashlib.sha256(ASSETS[version]).hexdigest()
                if version == VERSIONS[2]:
                    digest = "0" * 64
                body = f"{digest}  {filename}\n".encode()
            elif parts[1] == filename:
                body = ASSETS[version]
            else:
                self.send_error(404)
                return
        self.send_response(200)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


def run_test():
    with tempfile.TemporaryDirectory(prefix="t3-nightly-check-") as tmp:
        root = Path(tmp)
        config_dir = root / "home/.config/mise"
        (config_dir / "conf.d").mkdir(parents=True)
        server = ThreadingHTTPServer(("127.0.0.1", 0), Registry)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            base = f"http://127.0.0.1:{server.server_port}"
            lines = ['[tools."http:t3"]']
            for key, value in TOOL.items():
                if key == "platforms":
                    continue
                if key == "version_list_url":
                    value = base + "/nightly"
                elif key == "checksum_url":
                    value = base + "/v{{ version }}/SHA256SUMS"
                lines.append(f"{key} = {json.dumps(value)}")
            for host, options in TOOL["platforms"].items():
                lines.append(f'[tools."http:t3".platforms.{host}]')
                for key, value in options.items():
                    if key == "url":
                        value = base + "/v{{ version }}/" + value.rsplit("/", 1)[1]
                    lines.append(f"{key} = {json.dumps(value)}")
            lines.extend([
                "[settings]",
                'minimum_release_age_excludes = ["http:t3"]',
                'fetch_remote_versions_cache = "0s"',
                '[tasks."t3:upgrade"]',
                f'run = {json.dumps(UPGRADE["run"])}',
                f'dir = {json.dumps(UPGRADE["dir"])}',
                'depends = ["t3:lock"]',
                '[tasks."t3:lock"]',
                f'run = {json.dumps(LOCK["run"])}',
                f'dir = {json.dumps(LOCK["dir"])}',
                '[tasks."t3:lock".env]',
                'MISE_LOCKFILE_MODE = "generate"',
            ])
            config = config_dir / "config.toml"
            (config_dir / "conf.d/t3.toml").write_text("\n".join(lines) + "\n")
            other_url = base + "/v" + VERSIONS[0] + "/" + (
                TOOL["platforms"][HOST]["url"].rsplit("/", 1)[1]
                .replace("{{ version }}", VERSIONS[0])
            )
            config.write_text(
                '[tools."http:unrelated"]\n'
                f'version = {json.dumps(VERSIONS[0])}\n'
                f'url = {json.dumps(other_url)}\nstrip_components = 1\nbin_path = "unused"\n'
            )
            env = {k: v for k, v in os.environ.items() if not k.startswith("MISE_")}
            env.update({
                "HOME": str(root / "home"),
                "MISE_DATA_DIR": str(root / "data"),
                "MISE_CACHE_DIR": str(root / "cache"),
                "MISE_CONFIG_DIR": str(config_dir),
                "MISE_TRUSTED_CONFIG_PATHS": str(root),
                "MISE_YES": "1",
                "MISE_USE_VERSIONS_HOST": "0",
                "XDG_STATE_HOME": str(root / "state"),
                "XDG_CONFIG_HOME": str(root / "xdg-config"),
                "XDG_CACHE_HOME": str(root / "xdg-cache"),
            })

            def mise(*args, success=True):
                result = subprocess.run(
                    [MISE, *args], cwd=root, env=env,
                    capture_output=True, text=True, timeout=90,
                )
                if success and result.returncode:
                    raise AssertionError(result.stdout + result.stderr)
                return result

            assert mise("latest", "http:t3").stdout.strip() == VERSIONS[0]
            mise("install", "http:unrelated")
            other_path = Path(mise("where", "http:unrelated").stdout.strip())
            other_before = (other_path / "t3").read_bytes()
            mise("run", "--skip-tools", "t3:upgrade")
            assert VERSIONS[0] in mise("exec", "--", "t3", "--version").stdout
            assert json.loads(mise("outdated", "http:t3", "--json").stdout) == {}
            first_path = Path(mise("where", "http:t3").stdout.strip())
            print("ok: first nightly resolves, installs, executes, and reports up to date")

            Registry.version = VERSIONS[1]
            outdated = json.loads(mise("outdated", "http:t3", "--json").stdout)
            assert outdated["http:t3"]["current"] == VERSIONS[0], outdated
            assert outdated["http:t3"]["latest"] == VERSIONS[1], outdated
            plan = mise("upgrade", "http:t3", "--dry-run")
            assert VERSIONS[1] in plan.stdout + plan.stderr, plan.stdout + plan.stderr
            mise("run", "--skip-tools", "t3:upgrade")
            assert VERSIONS[1] in mise("exec", "--", "t3", "--version").stdout
            assert first_path.exists(), "The old build must remain available for rollback"
            assert json.loads(mise("outdated", "http:t3", "--json").stdout) == {}
            assert VERSIONS[1] in Registry.checksum_requests
            assert (other_path / "t3").read_bytes() == other_before
            assert Path(mise("where", "http:unrelated").stdout.strip()) == other_path
            print("ok: moving the tag is detected; checksum-locked upgrade preserves the old build")
            print("ok: unrelated installed tools remain unchanged")

            Registry.version = VERSIONS[2]
            result = mise("run", "--skip-tools", "t3:upgrade", success=False)
            assert result.returncode != 0, (
                "A bad published checksum must reject installation\n"
                + result.stdout + result.stderr
                + "\nChecksum requests: " + repr(Registry.checksum_requests)
                + "\nLocks: " + repr([(str(p), p.read_text()) for p in config_dir.glob("*.lock")])
            )
            assert "checksum" in (result.stdout + result.stderr).lower()
            assert VERSIONS[2] in Registry.checksum_requests
            print("ok: bad published checksum rejects the next nightly")

            Registry.version = VERSIONS[3]
            result = mise("run", "--skip-tools", "t3:upgrade", success=False)
            assert result.returncode != 0, "A missing checksum manifest must reject locking"
            assert VERSIONS[3] in Registry.checksum_requests, result.stdout + result.stderr
            print("ok: missing checksum manifest fails closed")
        finally:
            server.shutdown()
            server.server_close()
            thread.join()


if __name__ == "__main__":
    run_test()
