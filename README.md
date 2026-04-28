[![AGPL License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <img src="frontend/public/logo.png" width="100" height="100" alt="ByteSized Logo" />

  <h3 align="center">ByteSized</h3>

  <p align="center">
    A simplified recipe manager built on Mealie
    <br />
    <a href="https://docs.mealie.io/"><strong>Upstream Mealie docs »</strong></a>
    <br />
  </p>
</p>

---

## What Is ByteSized?

ByteSized is a UI-only fork of [Mealie](https://github.com/mealie-recipes/mealie) that strips the interface down to the essentials — recipes, a recipe finder, and organizers — while leaving the backend and API completely intact.

It is designed for home cooks who want a clean, distraction-free recipe manager and for households using the Mealie MCP server for AI-assisted meal planning. Every feature removed from the UI is still fully functional via the API.

## What's Different from Mealie

The following UI surfaces are hidden in ByteSized (all backend functionality is preserved):

- Meal planner and meal plan settings
- Shopping lists
- Cookbooks
- Recipe timeline
- Ingredient parser (auto-parse on import and manual parse button)
- Nutrition display
- Tools organizer
- Foods and Tools filter chips on the recipe explorer
- Edit as JSON in the recipe editor
- Bulk importer
- Data management (Foods, Units, Labels, Recipe Actions)
- Migrations
- Household notifiers and webhooks
- Announcements

## How It Works

ByteSized uses a single `MEALIE_LITE_MODE=true` build arg that is baked into the static frontend at compile time. All hidden elements use `v-if="!liteMode"` guards — nothing is deleted, so the fork stays easy to rebase against upstream Mealie.

## Quick Start

```bash
git clone https://github.com/your-org/bytesized.git
cd bytesized
docker compose -f docker/docker-compose.yml build
docker compose -f docker/docker-compose.yml up -d
```

Then open [http://localhost:9000](http://localhost:9000) and log in with the credentials set in `docker/docker-compose.yml` (`DEFAULT_EMAIL` / `DEFAULT_PASSWORD`).

> **Note:** Default credentials only apply on first run with a fresh database. Change them before your first launch or reset the volume with `docker compose down -v`.

## Configuration

All configuration lives in `docker/docker-compose.yml`. Key settings:

| Variable | Default | Notes |
|---|---|---|
| `DEFAULT_EMAIL` | `admin@example.com` | Admin login — first run only |
| `DEFAULT_PASSWORD` | `changeme123` | Admin password — first run only |
| `DB_ENGINE` | `sqlite` | Use `postgres` for multi-user scale |
| `LOG_LEVEL` | `DEBUG` | Set to `WARNING` in production |
| `ALLOW_SIGNUP` | `false` | Keep false; admin creates all accounts |
| `MEALIE_LITE_MODE` (build arg) | `true` | Baked at build time — requires rebuild to change |

## Rebuilding After Code Changes

Because the frontend is compiled as static assets, any change to Vue components or the `MEALIE_LITE_MODE` build arg requires a full rebuild:

```bash
docker compose -f docker/docker-compose.yml build
docker compose -f docker/docker-compose.yml up -d
```

## Upstream

ByteSized tracks the `mealie-next` branch of [mealie-recipes/mealie](https://github.com/mealie-recipes/mealie). All backend code, the API, and the database schema are unchanged. MCP server integrations that work with Mealie work with ByteSized without modification.

## License

Distributed under the AGPL License. See `LICENSE` for more information.

<!-- MARKDOWN LINKS -->
[license-shield]: https://img.shields.io/github/license/mealie-recipes/mealie.svg?style=flat-square
[license-url]: https://github.com/mealie-recipes/mealie/blob/mealie-next/LICENSE
