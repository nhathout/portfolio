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
| `docs/sections.js` | Experience timeline progress + durations, award unlocks/tilt, contact clock, and note composer |
| `docs/contact.js` | Contact pixel-art icons and the Boston skyline (sky follows Boston time) |
| `docs/pixel-kit.js` | Shared pixel-art palette + painter (Contact/Skills/Experience art), plus `PixelKit.art`: dithered ramps, noise, bitmaps, glows, crisp sizing, and a visibility-aware animation loop used by the code-drawn scenes |
| `docs/hero-art.js` | Hero: the PixelMe portrait (a 52px sprite in `FACE`, peace sign on hover) and the landscape behind the copy (misty morning in light mode, aurora night in dark mode; the robot follows the cursor, taps send a paper plane or a shooting star) |
| `docs/tv-channels.js` | The Contact CRT's channels, drawn at 168×126: Giza, Roma, a [Course]out attract loop, and a test card (tap the screen to flip) |
| `docs/about.js` | About section: character sheet, photo deck (`aboutPhotos`), pixel-art world tour (`aboutStops`), side quests (`aboutQuests`) |
| `docs/about-portrait.js` | About section's pixel-art portrait (straw hat, Fuji, floating torii, sakura): drawn in code on a 240×300 canvas, with dusk/night palettes in `MODES` that follow the site theme, plus fireworks, ripples, and speech bubbles on tap |
| `docs/game.js` | Atari [Course]out: the Breakout mini-game and its shared leaderboard |
| `docs/assets/css/*.css` | Styles for the pieces above (`enhancements`, `sections`, `about`, `game`) |
| `docs/assets/opt/` | Web-sized WebP/MP4 copies of the images and clips the page actually loads |

**Adding a project:** add an object to `projectEntries` in `docs/script.js`. `categories` drives the filter chips, `tags` show on the card, `details` show in the pop-up, and `status: 'live' | 'private' | 'building'` adds a badge. Use `upcoming: { ... }` for a locked "coming soon" card.

**About section:** add photos to `aboutPhotos` and tour stops to `aboutStops` at the top of `docs/about.js` (a stop's optional `photo` replaces its pixel scene). The photo deck is parked for now: its `.about-intro__deck` block in `index.html` has `hidden`, and the pixel portrait (`.about-intro__portrait`) sits in its place. Move `hidden` from one block to the other to swap back (the deck loads no photos while it's hidden).

**Server (`server.js`, deployed on Render):** besides the game leaderboard it hosts the BROS2 early-access waitlist (the page doesn't call it right now): `GET /api/bros2/interest` (count), `POST /api/bros2/interest` (`{ email, role? }`), and `GET /api/bros2/interest/export`, which needs the header `x-admin-key` to match the `INTEREST_ADMIN_KEY` environment variable (export is off when it's unset). `DB_DIR` overrides the database folder (default `/data/db`) for local testing.

**PixelMe:** the sprite lives in `FACE` in `docs/hero-art.js`. The static copies (`assets/opt/PixelMe.webp`, `assets/images/pixelme-icon.png`, `pixelme-touch.png`, `PixelMe.png`, and the portrait on `assets/opt/og-card.jpg`) are that sprite exported at whole-number scales, so re-export them if you change it.

**Adding images:** drop the original in `docs/assets/images/`, then save a web-sized copy (WebP, around 1000px wide for projects and 320px for logos) in `docs/assets/opt/` and point the page at that copy.

**Preview locally:** `cd docs && python -m http.server 8000`, then open http://localhost:8000.

## Starter Template

I also keep a starter template in [`portfolio-starter-template/`](portfolio-starter-template/) for people who want a simple portfolio template without copying my exact site, content, styling, resume files, or assets.

Best use: copy only the contents of `portfolio-starter-template/` into a new repo, edit `content.js`, and publish that new repo with GitHub Pages.

If this starter helps you, a repo star or source-code credit is much appreciated :)
