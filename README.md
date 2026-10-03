# EffortlessFlow portfolio site

The one-page home of the EffortlessFlow brand — the story of who we are, a
first look at toby, and an invitation to follow along on socials.

Built with [Astro](https://astro.build) (static output, no client-side
framework). Design follows `brand/docs/Visual_brand_identity.md`.

## Commands

| Command           | Action                                     |
| :---------------- | :----------------------------------------- |
| `bun install`     | Install dependencies                       |
| `bun run dev`     | Start local dev server at `localhost:4321` |
| `bun run build`   | Build the production site to `./dist/`     |
| `bun run preview` | Preview the production build locally       |

## Brand assets

`scripts/make-assets.mjs` regenerates the favicon set, OG image, and wordmark
variants from the master files in `~/EffortlessFlow/brand/Assets/`, normalizing
all colors to the canonical palette:

- Deep Forest `#014426` · Flush Orange `#FF6D00` · Floral White `#FFFAF0` ·
  Carbon Black `#191B19`
- Type: Nunito Sans (self-hosted via `@fontsource-variable/nunito-sans`)
- Logo: custom handwritten wordmark + compact E mark (favicons)

Run it with `bun scripts/make-assets.mjs` (requires `sharp`, included as a dev
dependency).

## Structure

- `src/pages/index.astro` — the whole page, composed of sections
- `src/components/` — Header, Hero, Story, Toby, Follow, Footer, FlowLine
- `src/styles/global.css` — design tokens (colors, type scale, spacing)
- `public/` — favicons, OG image
- `src/assets/` — wordmark variants, toby screenshots, mascot

The site deploys as plain static files — any static host works.
