# Dotfiles for Linux and macOS

Chezmoi manages shell and application settings, 2 custom skills under
`~/.agents/skills`, and shared agent definitions under `~/.agents/agents`.
Claude and Codex skill links point to the shared files. Paseo skills have been
removed from both the shared and Codex-specific skill directories.

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

## Platform differences

- Home paths use `{{ .chezmoi.homeDir }}` where an absolute path is needed.
  Shared skill links use relative paths.
- Linux systemd and desktop configuration is excluded on macOS. BB's service
  definition is Linux-only; this repository does not create a macOS launch agent.
- Omarchy terminal theme imports and the Neovim theme link are Linux-only.
- Zsh and fish support Homebrew in `/opt/homebrew` and `/usr/local` on macOS.
- Project roots saved as `/ethan/src` on Linux render as `$HOME/src` on macOS.
- Mise and skill files with their own `{{ ... }}` syntax remain plain files
  unless they need chezmoi substitution.

Downloaded skills recorded in the skills installer lockfile are not vendored
here. Reinstall them with their original installer when needed. Authentication
files, session databases, caches, and generated plugin installation records
are not part of this portability pass.

The local Claude `env.TYPESAFE_API_KEY` is deliberately excluded from Git.
Its removal is an expected difference in `chezmoi diff`; preserve the local
credential before applying that settings file. This sync does not modify
the live file. The Hunk skill is supplied by its installed package rather
than tracking its machine-specific package symlink.

## Verify changes

Run `python3 scripts/check-portability.py` from this repository with Python 3.11
or newer, chezmoi, bash, and zsh installed. It renders Linux, Apple Silicon Mac,
and Intel Mac targets without applying them or running service scripts. It checks
agent links, JSON/TOML parsing, shell syntax, and Linux paths in Mac output.

Rendering on Linux does not prove that every configured application works on
macOS. Review the diff on the destination Mac before applying it.
