# Noah's Portfolio

![Maintained Badge](https://img.shields.io/badge/maintained-yes-brightgreen)
![Website Status](https://img.shields.io/badge/website-live-green)

Welcome to the repo containing my personal portfolio website/project.

## How the site is put together

Everything that ships lives in [`docs/`](docs/) (served by GitHub Pages at [noahhathout.com](https://noahhathout.com)).

| File | What it does |
| --- | --- |
| `docs/index.html` | Page markup plus most styles (inline `<style>` at the bottom) |
| `docs/script.js` | Theme toggle, nav, experience timeline, skills cubes, **project data** (`projectEntries`), project grid + detail dialog |
| `docs/interactions.js` | Command palette (`Ctrl/⌘ K` or `/`), scroll reveals, copy-email toast, flag-emoji fallback |
| `docs/hero-ascii.js` | The mouse-reactive ANSI/ASCII layer over the hero art |
| `docs/sections.js` | Experience timeline progress + durations, award unlocks/tilt, contact clock, CRT, and note composer |
| `docs/contact.js` | Contact pixel-art icons and the Boston skyline (sky follows Boston time) |
| `docs/pixel-kit.js` | Shared pixel-art palette + painter used by the Contact/Skills/Experience art |
| `docs/about.js` | About section: character sheet, photo deck (`aboutPhotos`), pixel-art world tour (`aboutStops`), side quests (`aboutQuests`) |
| `docs/bros2-playground.js` | Tealbloc (formerly BROS2) panel: in-browser node playground, video theater/pop-out, early-access waitlist |
| `docs/game.js` | Atari [Course]out: the Breakout mini-game and its shared leaderboard |
| `docs/assets/css/*.css` | Styles for the pieces above (`enhancements`, `sections`, `about`, `bros2-playground`, `game`) |
| `docs/assets/opt/` | Web-sized WebP/MP4 copies of the images and clips the page actually loads |

**Adding a project:** add an object to `projectEntries` in `docs/script.js`. `categories` drives the filter chips, `tags` show on the card, `details` show in the pop-up, and `status: 'live' | 'private' | 'building'` adds a badge. Use `upcoming: { ... }` for a locked "coming soon" card.

**About section:** add photos to `aboutPhotos` and tour stops to `aboutStops` at the top of `docs/about.js` (a stop's optional `photo` replaces its pixel scene).

**Server (`server.js`, deployed on Render):** besides the game leaderboard it hosts the Tealbloc (formerly BROS2) waitlist: `GET /api/bros2/interest` (count), `POST /api/bros2/interest` (`{ email, role? }`), and `GET /api/bros2/interest/export`, which needs the header `x-admin-key` to match the `INTEREST_ADMIN_KEY` environment variable (export is off when it's unset). `DB_DIR` overrides the database folder (default `/data/db`) for local testing.

**Adding images:** drop the original in `docs/assets/images/`, then save a web-sized copy (WebP, around 1000px wide for projects and 320px for logos) in `docs/assets/opt/` and point the page at that copy.

**Preview locally:** `cd docs && python -m http.server 8000`, then open http://localhost:8000.

## Starter Template

I also keep a starter template in [`portfolio-starter-template/`](portfolio-starter-template/) for people who want a simple portfolio template without copying my exact site, content, styling, resume files, or assets.

Best use: copy only the contents of `portfolio-starter-template/` into a new repo, edit `content.js`, and publish that new repo with GitHub Pages.

If this starter helps you, a repo star or source-code credit is much appreciated :)
