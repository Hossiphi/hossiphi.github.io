# Sophie Corallo — personal website

Source of <https://hossiphi.github.io>. Built with [Astro](https://astro.build/)
on the [astro-studia](https://github.com/dfuchss/astro-studia) template (MIT).
The template's own documentation is in [`docs/`](docs/).

## Run locally

Node 22 or newer.

```bash
npm install
npm run dev        # http://localhost:4321
```

Before pushing, run what CI runs:

```bash
npm ci && npm run check && npm run docs:check && npm run build && npm run audit
```

## Where the content lives

| What                       | File                                                                                                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Name, URL, email           | `src/consts.ts`                                                                                                                                                                                        |
| Sections on/off            | `src/features.ts`                                                                                                                                                                                      |
| Publications               | `src/data/papers.bib` (+ badges in `src/data/venues.yml`)                                                                                                                                              |
| Featured papers (home)     | `src/content/papers/*.md` (`featured: true`), `authors.yml`                                                                                                                                            |
| Citation counts            | `src/data/citations.yml` — refresh with `npm run data:citations`                                                                                                                                       |
| Replication packages count | `zenodo_repos` in `src/data/repositories.yml`                                                                                                                                                          |
| CV, teaching, projects     | `src/data/cv.yml`                                                                                                                                                                                      |
| Contact / profile links    | `src/data/contact.yml`, `src/data/socials.yml`                                                                                                                                                         |
| Every text on the site     | `src/content/pages/**.md`                                                                                                                                                                              |
| Photo                      | `src/assets/portrait.jpg`                                                                                                                                                                              |
| Icons (favicon)            | `src/assets/brand/icon.png` (= `variants/orange-bright.png`) → `npm run icons -- src/assets/brand/icon.png`; other colours in `variants/`, sources in `sources/`, cleanup: `scripts/clean-favicon.mjs` |

A new publication gets a citation chip once its `google_scholar_id` (the part
after the colon in `citations.yml`) is set in `papers.bib`.
`npm run data:citations` skips the fetch when `last_updated` is today.

## Publishing on GitHub Pages

1. Create the repository `Hossiphi/Hossiphi.github.io` on GitHub (empty).
2. `git remote add origin https://github.com/Hossiphi/Hossiphi.github.io.git`
3. `git push -u origin main`
4. The `deploy` workflow builds the site and pushes it to the `gh-pages`
   branch. In the repository settings → Pages, set the source to
   "Deploy from a branch", branch `gh-pages`, folder `/`.

Keep `public/.nojekyll`. For a custom domain later, add `public/CNAME` and
change `SITE.url` in `src/consts.ts`.

## Updating from astro-studia

This repository started from astro-studia `a76d134` (copied with degit, not a
GitHub fork), and its history was linked to upstream once, following
[`docs/Updating.md`](docs/Updating.md). To pull in template fixes:

```bash
git fetch upstream
git merge upstream/main
```

If the `upstream` remote is missing (e.g. in a fresh clone):
`git remote add upstream https://github.com/dfuchss/astro-studia.git`.

Conflicts in content files (`src/content/`, `src/data/`, `README.md`) are resolved
with `git checkout --ours -- <path>`. For files deleted here, use `git rm <path>`.
For `package-lock.json`, use `git checkout --theirs -- package-lock.json && npm install`.

Local changes to template code:

- `src/components/Figure.astro`: `var(--fig-max, 100%)` fallback, so the audit
  passes when no paper page has a figure. Worth proposing upstream.
- `src/components/hero/PersonHero.astro`: a "replication packages" stat
  (count of `zenodo_repos`), as on fuchss.org.
- `src/components/SocialRow.astro`: a `kit` icon (KIT logo, wide chip), as on
  janke.im; used for the staff-page link in `socials.yml`.
- `src/styles/tokens.css`: own palette values; at the end, the same background
  glows on every page, text accents per section, and no eyebrow labels.
- `src/pages/index.astro`: "Selected publications" instead of "Paper pages";
  the contact section states the email in its sentence (no rows, no cv link).

## Open TODOs

- Review the imprint (`src/content/pages/imprint.md`).
- Add the Bachelor's degree to `src/data/cv.yml`.
- Extend teaching (seminars, practical courses, WS 20/21) in `src/data/cv.yml`.
- Optional: figures for the paper pages, PDF links per publication.
