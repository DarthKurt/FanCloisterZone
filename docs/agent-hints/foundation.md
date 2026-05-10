# Monorepo Foundation

## Repository Layout

* `src/` - main code
* `scripts/` - shell utility scripts
* `docs/` - all human and agent documentation

## General Rules

* Never commit secrets, tokens, or passwords
* All new code requires tests; do not remove existing tests
* Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
* Branch naming: github flow with `topic/<name>` pattern

## Documentation

* Keep `docs/` up to date when changing behaviour
* Agent hints live in `docs/agent-hints/`
* do not edit `.kiro/steering/` or `.github/instructions/` directly unless explicitly asked, they are generated
