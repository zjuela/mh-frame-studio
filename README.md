# BrightFrame Studio website

Showcase site for a photo & video post-production service for dentists and dental marketing agencies.
Built on the [AstroWind](https://github.com/onwidget/astrowind) template (Astro + Tailwind CSS).

## Run locally

```bash
npm install
npm run dev      # http://localhost:4321/brightframe-studio
npm run build    # output in dist/
npm run check    # types, lint, formatting
```

## Where to edit

| What | File |
| --- | --- |
| Business name, site URL, base path, SEO | `src/config.yaml` |
| Email, form endpoint, booking link | `src/business.ts` |
| Menu and footer | `src/navigation.ts` |
| Colours | `src/components/CustomStyles.astro` |
| Before/after pairs and Reel cards | `src/data/samples.ts` |
| Pages | `src/pages/` (`index`, `services`, `work`, `pricing`, `agencies`, `contact`) |

Before/after slider: `src/components/ui/BeforeAfter.astro`. Reels grid: `src/components/widgets/Reels.astro`.

## Sample images

`src/assets/images/demo/` holds licensed stock photos from Unsplash (free for commercial use).
`node scripts/make-demo-pairs.mjs` builds the demo "before" versions into `src/assets/images/pairs/`.
Replace them with real, **consented** client work as soon as you have it: drop a matching
`name-before.jpg` / `name-after.jpg` pair (same size, 4:3) into `pairs/` and add it to `src/data/samples.ts`.

For real Reels, upload to YouTube Shorts / Vimeo / Instagram and add the link as `href` on the Reel in `samples.ts`.
Do not commit large video files to the repo.

## Deploy

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`
(enable it once in the repo: Settings → Pages → Source: **GitHub Actions**).

### Moving to your own domain later

1. In `src/config.yaml` set `site: 'https://yourdomain.com'` and `base: '/'`.
2. Add `public/CNAME` containing `yourdomain.com`.
3. Point the domain's DNS at GitHub Pages and set the custom domain in Settings → Pages.
