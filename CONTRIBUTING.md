# Contributing to ByteSized

ByteSized is a UI-only fork of [Mealie](https://github.com/mealie-recipes/mealie). Contributions should follow these principles so the fork stays rebasing-friendly against upstream.

## Core Rule: Hide, Don't Delete

Never remove a feature by deleting files or code. Always hide it with a `v-if="!liteMode"` guard. This keeps diffs minimal and makes future rebases against upstream straightforward.

## Adding a Hide

1. Import the composable in the component's `<script setup>`:
   ```ts
   import { useLiteMode } from "~/composables/use-lite-mode";
   const liteMode = useLiteMode();
   ```

2. Add the guard to the template element:
   ```html
   <SomeComponent v-if="!liteMode" ... />
   ```

3. For navigation entries built in JavaScript arrays (e.g. `DefaultLayout.vue`), use a spread conditional:
   ```ts
   ...(!liteMode ? [{ icon: ..., to: ..., title: ... }] : []),
   ```

4. For route-level blocks, add `lite-mode` middleware to `definePageMeta`:
   ```ts
   definePageMeta({ middleware: ["lite-mode"] });
   ```
   The middleware (`frontend/app/middleware/lite-mode.ts`) redirects to the group home page when `LITE_MODE` is true.

## How LITE_MODE Works

`MEALIE_LITE_MODE=true` is passed as a Docker build arg and baked into the static frontend at `yarn generate` time via `nuxt.config.ts`:

```ts
runtimeConfig: {
  public: {
    LITE_MODE: process.env.MEALIE_LITE_MODE === "true",
  },
},
```

The `useLiteMode()` composable (`frontend/app/composables/use-lite-mode.ts`) reads this value. Because the frontend is compiled as static assets (`ssr: false`), the value is fixed at build time — environment variables set only at container runtime have no effect on the frontend.

**Any change to a `v-if="!liteMode"` guard requires a full Docker rebuild:**

```bash
docker compose -f docker/docker-compose.yml build
docker compose -f docker/docker-compose.yml up -d
```

## Rebasing Against Upstream

```bash
git remote add upstream https://github.com/mealie-recipes/mealie.git
git fetch upstream
git rebase upstream/mealie-next
```

Because all ByteSized changes are additive (`v-if` guards, new composable, build arg), conflicts are rare and limited to lines we explicitly touched.

## Backend Changes

ByteSized makes no backend changes. Do not modify Python code, the API, database migrations, or the OpenAPI schema. The goal is full API compatibility with upstream Mealie at all times.

## What Belongs Here vs. Upstream

| Change | Where |
|---|---|
| Hide a UI element | ByteSized (`v-if="!liteMode"`) |
| Fix a bug in a hidden feature | Upstream Mealie |
| Add a new recipe import method | Upstream Mealie |
| Change app name / branding | ByteSized |
| Backend / API change | Upstream Mealie only |
