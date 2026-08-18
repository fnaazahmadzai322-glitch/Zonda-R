# Pagani Zonda R — Private Showroom, Dubai

A single-page, desktop-first showroom site for a Pagani Zonda R, built around
scroll-driven cinematic reveals. Black, carbon fibre, and the car's own lime.

The accent colour was sampled from `car photo/RH.jpg`: the Zonda R's lit body
panels average `#d0f020`, a chartreuse lime at roughly 69° hue. If you
restyle, re-sample the photo rather than guessing — reaching for a generic
"neon green" lands around 146°, a visibly different colour. All writing is a
single white; the lime is reserved for buttons and graphics.

> Concept/portfolio piece. Not affiliated with or endorsed by Pagani Automobili
> S.p.A. The showroom address, phone number and email are placeholders.

## Running it

No build step, no dependencies to install. Everything is vanilla HTML, CSS and
JavaScript, and GSAP/Lenis are vendored into `assets/vendor/`.

```bash
python3 -m http.server 8080   # then open http://localhost:8080
```

Any static host works for deployment: GitHub Pages, Netlify, Vercel, S3.

## Layout

```
index.html              all markup
css/style.css           design tokens + every component
js/main.js              scroll rig, showcase, particles, form
assets/vendor/          GSAP, ScrollTrigger, Lenis (pinned copies)
hero/                   hero video
performance/            second video — also reused for the Collection showcase
car photo/              Zonda R still — the accent's colour source, and the
                        Engineering section's background image
```

Fonts (Bebas Neue, Manrope) load from Google Fonts and fall back to system
faces if that host is unreachable. GSAP and Lenis are vendored deliberately so
the page keeps working without a CDN.

## The sections

| # | Section | What drives it |
|---|---------|----------------|
| 01 | Hero | Autoplaying video, scroll-scrubbed once engaged, masked title lines |
| 02 | Collection | 3D tilt showcase over the second video, Overview/Assembly/Detail zoom by scroll |
| 03 | Engineering | Still photo with a slow scroll-linked zoom, callouts wiped in per beat |
| 04 | Performance | Second video, ember/spark particles, heat wash |
| 05 | Heritage | Carbon-weave surface, staggered reveals |
| 06 | Showroom | Dubai location, animated map pin |
| 07 | Consultation | Validated booking form |
| 08 | Contact | Footer |

## Notes for anyone editing this

**Every remaining `<video>` carries `autoplay` and `loop` in the markup, and
that is load-bearing, not incidental.** (Only the hero and the Collection/
Performance clips are actual `<video>` elements now — Engineering moved to a
still photo, see below.) An earlier version dropped `autoplay` on the
scroll-scrubbed videos and made their visibility depend entirely on a custom
`fetch()`-to-blob step, on the theory that pre-buffering would make scroll
scrubbing smoother. In production that fetch silently failed — for reasons
never fully pinned down, likely specific to the host — and because nothing
else made the video visible, visitors saw a black rectangle where the hero
should be. `autoplay` is what every background-video site actually relies on:
it works with zero JavaScript, the browser owns loading the file, and there
is a frame on screen from first paint no matter what the script does or does
not manage to do. **Don't remove it in the name of "the video should only
play when you scroll" — scroll scrubbing is layered on top of autoplay, not
a replacement for it. See `createScrubber` in `js/main.js` for how the
handoff works: the first scroll-driven seek calls `.pause()` and strips the
`loop` attribute so the browser's own loop logic can't resume it later, and
if that seek never happens, the video just keeps looping — which is correct,
not a bug. A stray `play` event after the handoff is treated as a bug and
immediately re-paused, whatever caused it.**

**Seeks are coalesced, never queued.** Assigning `currentTime` while a seek is
already in flight makes the browser drop the intermediate targets — the usual
cause of stuttery scrubbing. `createScrubber` keeps exactly one seek in flight
and resumes toward the newest target on `seeked`, with a 400ms timeout so a
seek whose `seeked` event never fires can't wedge every seek after it.

**Engineering has no footage to scrub, so its motion comes from a CSS
transform instead.** The section's progress bar and callouts are pure scroll
math, unchanged from when there was a video — a `#revealImage` zoom
(`scale(1 → 1.18)` across the section's scroll range, applied directly in the
same `ScrollTrigger.onUpdate` in `js/main.js`) stands in for what scrubbing
used to provide. It's decorative, so — like the hero/performance/showroom
parallax — it's skipped under reduced motion; the bar and callouts never are,
because they're content.

**`transform` on `#collectionVideo` belongs solely to view switching.** A
scrubbed tween on that same property would silently revert the zoom on the
next scroll tick. Animate the wrapper (`#collectionVideoWrap`) if you need an
entrance effect.

**Reduced motion is honoured by not building the animations at all.** A
`.from()` tween that is created and then killed can strand an element
mid-fade. Guard with `REDUCED` at construction; counters still write their
real figures.

**If scrubbing feels chunky, it's the source file's keyframe interval, not
the JS.** Seeking a video with sparse keyframes forces a decode from the
nearest prior keyframe on every jump. Re-encode with denser keyframes:

```bash
ffmpeg -i in.mp4 -c:v libx264 -g 6 -crf 20 -an out.mp4
```

## Booking form

Front-end only. It validates, then shows a confirmation state — nothing is
sent anywhere. To make it real, POST from the submit handler in `js/main.js` to
Formspree, EmailJS or your own endpoint.

## Browser support

Current Chrome, Safari, Firefox and Edge. Needs H.264 playback for the videos
and CSS `aspect-ratio`.
