# Dotfiles for Linux and macOS

Chezmoi manages shell and application settings, 5 custom skills under
`~/.agents/skills`, and shared agent definitions under `~/.agents/agents`.
Claude and Codex skill links point to the shared files. The custom skills are
living-plan, architect, decision-trail, review-loop, and work. The shared
session-start hook and delegate definition are included. Removed local TDD and
agent definitions are no longer restored by chezmoi.

## Sync to a Mac

These changes must be committed and pushed before another machine can fetch them.
With chezmoi installed on the Mac:

1. Run `chezmoi init <your-dotfiles-repository>` on a new installation, or
   `chezmoi git -- pull --ff-only` if the repository is already initialized.
2. Run `chezmoi diff` to review changes against that Mac's existing settings.
3. Run `chezmoi apply` to write the reviewed configuration.

This sync copies configuration. It does not install the applications, recreate
agent sessions, or transfer credentials. Mise's tool configuration is included;
install the tools you need with mise on the destination machine.

### Mac bootstrap and shell behavior

Install Homebrew and Apple's command-line tools, then install `chezmoi`, `mise`,
`python`, `tmux`, `fish`, `jq`, and `sesh` with Homebrew. Python 3 is used by
chezmoi's settings transforms and the verification scripts. Prezto itself is
not vendored; install it separately without replacing the managed shell files.

On macOS, `.zshenv` preserves existing top-level `.zprofile` loading and exposes
Homebrew, `~/.local/bin`, and mise shims to noninteractive SSH commands. It
respects `MISE_DATA_DIR` and `XDG_DATA_HOME`. Linux keeps its simpler local-bin
PATH setup. Interactive shells use full mise activation in `.zshrc` on both.
The shared prompt theme is a plain file under `~/.config/oh-my-posh` because its
template expressions belong to oh-my-posh, not chezmoi. Cursor uses mise's native
`cursor-agent` backend rather than the old asdf plugin that requires GNU grep.
The Aqua btop recipe is Linux-only, so mise gates it to Linux. On macOS, use
Homebrew's `btop` formula if needed.
Infisical inherits the registry's platform-aware asset selection instead of
embedding OS expressions in the tool declaration. The shared lock includes
Linux x64 and macOS arm64 URLs without replacing one platform's assets with the
other's. Generating locks on another host must preserve those platform mappings.

### Simlock on mbair

Simlock 0.4.0 replaced Argent on mbair in the separately authorized 2026-10-30
cutover. Its native per-user LaunchAgent runs at login; chezmoi does not manage
the generated service file. After installing the mise tools and full Xcode,
install (or refresh after changing the Node/Simlock installation paths) with:

```sh
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer simlock daemon install
simlock daemon status --json
simlock catalog --platform ios --json
```

The service retains its own Xcode path without changing global `xcode-select`.
The console listens locally at `http://127.0.0.1:4701/`. Tailscale Serve forwards
tailnet TCP port 4701, making it available at `http://100.121.162.7:4701/`.
Traffic is encrypted by Tailscale, not HTTPS. The main hostname's port 443
endpoint was removed. No public Funnel is enabled. A dedicated operator key
is stored privately on mbair at `~/.config/simlock/tailnet-access.key` (mode 600);
use it for console sign-in or an API `Authorization: Bearer` header. Do not
commit the key. Missing or invalid keys receive HTTP 401 on protected API routes.
Service health and the iOS catalog are verified. Simulator
leases remain untested: roughly 5 GiB is free, below Simlock's default 10 GiB
disk-pressure threshold. Android SDK tools are not installed.

Argent's service, installation and active private state were removed; simulator
data was preserved. A private rollback archive remains on mbair, and its former
management source remains on the local backup branch. See the embedded
2026-10-30 Simlock cutover runbook in `living-plans/mac-sync.living-plan.html`.

## Mise cleanup

`dot_config/mise/config.toml` tracks the cleaned global tool list, including
native Grok, btop, T3 stable, and DuckDB. DuckDB uses the GitHub backend with a
CLI asset filter because version 2 renamed the archives expected by mise's
bundled Aqua recipe. Retired LFG and Prime Agent installation
recipes are removed, along with LFG's Codex MCP entry and the absent OMP
configuration. Release-age exceptions cover only tools still in the list.

To save future global tool changes, run
`chezmoi add --secrets=error ~/.config/mise/config.toml`, then review and commit
the source diff. Keep this file untemplated: its `{{ ... }}` expressions belong
to mise, not chezmoi. Existing settings for other removed tools remain available;
removing a tool declaration does not authorize deleting its data or credentials.
On other machines, review obsolete installations and MCP entries separately;
this repository does not automatically uninstall tools or erase local files.

### T3 stable updates

`~/.config/mise/conf.d/t3.toml` defines the native `http:t3` backend. It reads the version from npm's
`latest` metadata, then downloads the matching official GitHub archive.
Prereleases are disabled, matching the current local configuration.
The former `npm:t3 = "nightly"` entry stayed installed under the literal name
`nightly`, so mise compared that name with itself and missed new builds.

Install or update T3 with:

```sh
mise run --skip-tools t3:upgrade
```

This task uses mise's built-in global lock refresh and lock-aware install commands.
It fetches the current platform's published SHA256SUMS and fails if the checksum
is missing or wrong. `--skip-tools` prevents task startup from installing tools
before this verification workflow. Existing builds remain available for rollback.
The generated `~/.config/mise/mise.lock` is now tracked with the full mise config.
Review its platform-specific versions before applying on another machine.
Mise may also record currently installed global tools in that lock; this does
not install or upgrade those tools. Ordinary mise upgrades can advance them.

Ordinary `mise outdated http:t3` and `mise upgrade http:t3` now detect new builds.
Prefer the task above for updates: this mise version does not enforce
`checksum_url` on an ordinary unlocked HTTP install or upgrade.
Only Linux x64/arm64, Apple Silicon macOS, and Windows x64/arm64 archives are
configured. Upstream does not currently publish a native Intel macOS archive.

The existing local T3 service launcher uses `mise exec -- t3`, so its next start
selects the native build without a path edit. Installing a new version does not
restart the running server. Its session data and old npm installation are left
untouched.

Run `python3 scripts/check-t3-nightly.py` for an offline integration check using
real mise and temporary local releases. Despite its historical filename, it now
tests the stable channel. It checks first installation, detection
of a newer release, verified upgrades, rollback preservation, and rejection of
bad or missing checksums without touching the live tool store.

## Platform differences

- Home paths use `{{ .chezmoi.homeDir }}` where an absolute path is needed.
  Shared skill links use relative paths.
- Linux systemd and desktop configuration is excluded on macOS. BB's service
  definition is Linux-only; this repository does not create a Mac LaunchAgent.
- Omarchy terminal theme imports and the Neovim theme link are Linux-only.
- Zsh and fish support Homebrew in `/opt/homebrew` and `/usr/local` on macOS.
- Project roots saved as `/ethan/src` on Linux render as `$HOME/src` on macOS.
- Mise and skill files with their own `{{ ... }}` syntax remain plain files
  unless they need chezmoi substitution.

Downloaded skills recorded in the skills installer lockfile are not vendored
here. Reinstall them with their original installer when needed. Authentication
files, session databases, caches, and generated plugin installation records
are not part of this portability pass.

Claude settings use a chezmoi `modify_` script to preserve local environment
credentials and provider overrides while applying shared preferences. Only the
shared environment keys override local values. Pi settings use the same mechanism
to preserve the app-maintained `lastChangelogVersion` on each host. Neither value
is copied into Git. Avoid `chezmoi add` on these generated files; edit their
source transforms instead. The Hunk skill comes from its installed package rather
than tracking its machine-specific package symlink.

## Verify changes

Run `python3 scripts/check-portability.py` from this repository with Python 3.11
or newer, chezmoi, bash, and zsh installed. It renders Linux, Apple Silicon Mac,
and Intel Mac targets without applying them or running service scripts. It checks
agent links, JSON/TOML parsing, shell syntax, and Linux paths in Mac output.
Run `python3 scripts/check-local-state.py` for local-state preservation and
idempotence.

Rendering on Linux does not prove that every configured application works on
macOS. Review the diff on the destination Mac before applying it.
