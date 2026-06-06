# Domain Docs

This is a single-context repo.

## Before exploring, read these

- `CONTEXT.md` at the repo root for domain language.
- `docs/adr/` for architectural decisions that touch the area being changed.

If a file does not exist, proceed silently. Producer skills create domain docs lazily when terms or decisions are resolved.

## Use the glossary's vocabulary

When an output names a domain concept, use the term as defined in `CONTEXT.md`. Do not drift to synonyms the glossary explicitly avoids.

## Flag ADR conflicts

If an output contradicts an existing ADR, surface the conflict explicitly rather than silently overriding the decision.
