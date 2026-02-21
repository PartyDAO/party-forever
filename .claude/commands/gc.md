---
description: Review all uncommitted changes, sanity-check them, stage appropriate files, commit with a good message, and push.
---

# Git Commit & Push

## Workflow

1. Run `git status` and `git diff` (unstaged) and `git diff --cached` (staged) to see all uncommitted changes.
2. Review every changed and untracked file. Flag and skip files that should not be committed:
   - OS junk (`.DS_Store`, `Thumbs.db`)
   - Editor artifacts (`.swp`, `.swo`)
   - Secrets or credentials (`.env`, API keys)
   - Build output, `node_modules`, or other generated files that belong in `.gitignore`
   - Anything that looks like an accidental or incomplete change
     If you spot any of these, tell the user and do NOT stage them.
3. Stage all appropriate files by name (do not use `git add -A` or `git add .`).
4. Write a concise commit message:
   - First line: imperative summary under 72 chars describing **why**, not just what
   - Blank line, then a short body with bullet points if multiple logical changes are included
   - End with `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
5. Commit and push to the current branch.
6. Show the final `git log --oneline -1` to confirm.
