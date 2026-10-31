# M&H Frame Studio website

Showcase site for a photo & video post-production service for dentists and dental marketing agencies.
Built on the [AstroWind](https://github.com/onwidget/astrowind) template (Astro + Tailwind CSS).

## Run locally

```bash
npm install
npm run dev      # http://localhost:4321/mh-frame-studio
npm run build    # output in dist/
npm run check    # types, lint, formatting
```

## Where to edit

| What                                    | File                                                                         |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| Business name, site URL, base path, SEO | `src/config.yaml`                                                            |
| Email, form endpoint, booking link      | `src/business.ts`                                                            |
| Menu and footer                         | `src/navigation.ts`                                                          |
| Colours                                 | `src/components/CustomStyles.astro`                                          |
| Before/after pairs and Reel cards       | `src/data/samples.ts`                                                        |
| Pages                                   | `src/pages/` (`index`, `services`, `work`, `pricing`, `agencies`, `contact`) |

Before/after slider: `src/components/ui/BeforeAfter.astro`. Reels grid: `src/components/widgets/Reels.astro`.

## Sample images

`src/assets/images/demo/` holds licensed stock photos from Unsplash (free for commercial use), plus reference
portraits of dentists and assistants supplied by the owner (`female-dentist-1..3`, `male-dentist-1..2`,
`female-assistant`, `male-assistant`). Before adding a photo to a page or generator, check where it is already
used (`grep -rn <name> src scripts`) and pick one that isn't, so the same face doesn't appear twice.
`node scripts/make-demo-pairs.mjs` builds the demo "before" versions into `src/assets/images/pairs/`.
Replace them with real, **consented** client work as soon as you have it: drop a matching
`name-before.jpg` / `name-after.jpg` pair (same size, 4:3) into `pairs/` and add it to `src/data/samples.ts`.

Reel cards play a video in place when the Reel in `samples.ts` has `video: 'videos/<file>.mp4'` (a file in
`public/videos/`), or link out with `href` (YouTube Shorts, Vimeo, Instagram). Cards with neither are still previews.
Keep committed videos short and small (1080×1920 H.264, ideally under 10 MB); host anything bigger elsewhere.

The generators below (`scripts/`), and the photos and clips only they read, are kept local and listed in
`.gitignore`. Only what the site uses is committed: their output images and videos. When a photo moves from a
generator onto a page, remove its line from `.gitignore`.

Transformation Reel from one before/after pair (needs ffmpeg):

```sh
node scripts/make-transformation-reel.mjs --before before.jpg --after after.jpg \
  --procedure "Clear aligners" --hook "12 months of aligners" --brand "@yourpractice" --name aligners-reel
```

It writes `public/videos/aligners-reel.mp4` and a poster in `src/assets/images/reels/`. Add `--music track.mp3` for
a soundtrack (use licensed music only).

Myth vs Fact educational Reel: edit the hook, myths, facts and photos in `scripts/reels/myth-fact.json`
(copy it for new topics), then run `node scripts/make-myth-fact-reel.mjs scripts/reels/myth-fact.json`.
Testimonial filming guide for clients: edit the setup checklist and clips (shot, angle, tip, question to ask, and a
few stills each with `push-in` / `pull-out`) in `scripts/reels/testimonial-guide.json`, then run
`node scripts/make-testimonial-guide-reel.mjs scripts/reels/testimonial-guide.json`. The stills share the time left
in `length` (60s). The JSON also keeps the image prompts; photos not generated yet show a placeholder.

Educational Reel from video clips ("3 signs you grind your teeth"): edit the hook, signs, fix, captions and the clip
for each in `scripts/reels/grinding-signs.json`, then run
`node scripts/make-grinding-signs-reel.mjs scripts/reels/grinding-signs.json`. Clips are 1080×1920 MP4s, at least as
long as the seconds the JSON gives them; the text is laid over each clip.

All four generators share `scripts/lib/reel-kit.mjs`.

Labelled before/after images: add a post to `scripts/before-after/posts.json` (source photo, where the two shots
meet, which one is the before, crop, and a `side` or `stack` layout), then run
`node scripts/make-before-after.mjs scripts/before-after/posts.json`. Images go to `src/assets/images/before-after/`.
Photos are only cropped and labelled, never colour-corrected.

Meta ad mock-ups: edit the hooks, feed copy and photos in `scripts/ads/aligner-consult.json` (copy it for new ads),
then run `node scripts/make-ad-mockups.mjs scripts/ads/aligner-consult.json`. It writes the first frame of each hook
and a feed-post mock-up to `src/assets/images/ads/`. Each hook sets its photo, crop centre (`focusX`) and caption
(`*word*` is highlighted); text is kept inside the Reels safe zone (top 14%, bottom 35%) and the script warns if not.

Social post samples: edit `scripts/social/posts.json` (a `photo` post or a `carousel` of text slides, each with an `icon` from the list in the script), then run
`node scripts/make-social-posts.mjs scripts/social/posts.json`. Images (1080×1350) go to `src/assets/images/social/`.

## Deploy

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`
(enable it once in the repo: Settings → Pages → Source: **GitHub Actions**).

### Moving to your own domain later

1. In `src/config.yaml` set `site: 'https://yourdomain.com'` and `base: '/'`.
2. Add `public/CNAME` containing `yourdomain.com`.
3. Point the domain's DNS at GitHub Pages and set the custom domain in Settings → Pages.
