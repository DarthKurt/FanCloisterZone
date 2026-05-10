# Agent Hints

This repository uses a single source of truth for AI coding-agent conventions,
located in [`docs/agent-hints/`](docs/agent-hints/).
It MUST be wired with regular contribution conventions.

## How It Works

| Layer | Path | Purpose |
| ------- | ------ | --------- |
| Source | `docs/agent-hints/*.md` | Human-editable hint files |
| Config | `docs/agent-hints/_config.yaml` | Per-hint metadata (inclusion mode, file patterns) |
| Generator | `scripts/gen-agent-hints.sh` | Produces agent-specific outputs |
| Kiro output | `.kiro/steering/*.md` | Generated — usually do not edit |
| Copilot output | `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md` | Generated — usually do not edit |

## Editing Hints

1. Edit or add Markdown files in `docs/agent-hints/`.
2. Register new files in `docs/agent-hints/_config.yaml`.
3. Run `bash scripts/gen-agent-hints.sh` locally (requires `yq`), or push to
   `main` and let CI handle it.

## Supported Agents

- **GitHub Copilot** (VS Code) — reads `.github/copilot-instructions.md` and
  scoped `.github/instructions/*.instructions.md`.
- **Kiro** — reads `.kiro/steering/*.md` with YAML frontmatter for inclusion
  rules.

Both consume this `AGENTS.md` as a top-level orientation file.
