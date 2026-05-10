# Shell Script Conventions

## Requirements

- Shebang: `#!/usr/bin/env sh`
- No hardcoded paths — use variables or detect with `$(command -v ...)`
- Quote all variable expansions: `"${VAR}"` not `$VAR`
- Ensure POSIX-compatible code, unless explicitly allowed

## Practices

- Functions over repeated blocks
