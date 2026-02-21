---
description: Perform a refactor pass focused on simplicity after recent changes. Use when the user asks for a refactor/cleanup pass, simplification, or dead-code removal and expects build/tests to verify behavior.
---

# Refactor Pass

## Workflow

1. Review uncommitted changes (`git diff` and `git diff --cached`) to identify simplification opportunities. Do not diff against main or any remote branch.
2. Apply refactors to:
   - Remove dead code and dead paths.
   - Straighten logic flows.
   - Remove excessive parameters.
   - Remove premature optimization.
3. Identify optional abstractions or reusable patterns; only suggest them if they clearly improve clarity and keep suggestions brief.
