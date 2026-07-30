# Project architecture

- Build every feature as an Elysia module under `src/modules/<feature>/`.
- Keep `src/index.ts` limited to registering modules, exporting the composed app, and starting the server.
- Follow a feature-based structure:
  - `index.ts`: Elysia controller, routes, lifecycle hooks, and HTTP concerns.
  - `service.ts`: implementation logic decoupled from Elysia `Context` where possible.
  - `model.ts`: Elysia validation schemas and their derived TypeScript types.
- Treat each Elysia instance as a controller. Keep route handlers inline so Elysia preserves type inference; never pass the complete `Context` into another module.
- Give reusable Elysia modules a stable `name` for plugin deduplication.
- Keep module interfaces small. Accept dependencies at the module seam when tests need a real alternate adapter.
- Validate changes with `bun run typecheck` and `bun run test`.

Reference: https://elysiajs.com/essential/best-practice.html
