# Pagani Zonda R — Private Showroom, Dubai

A single-page, desktop-first showroom site for a Pagani Zonda R, built around
scroll-driven cinematic reveals. Black, neon green and carbon fibre.

> Concept/portfolio piece. Not affiliated with or endorsed by Pagani Automobili
> S.p.A. The showroom address, phone number and email are placeholders.

## Running it

No build step, no dependencies to install. Everything is vanilla HTML, CSS and
JavaScript, and GSAP/Lenis are vendored into `assets/vendor/`.

It must be served over HTTP rather than opened as a `file://` URL — the reveal
section fetches its video with `fetch()`, which `file://` blocks.

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
performance/            driving video
car photo/              Zonda R still
```

Fonts (Bebas Neue, Manrope) load from Google Fonts and fall back to system
faces if that host is unreachable. GSAP and Lenis are vendored deliberately so
the page keeps working without a CDN.

## The sections

| # | Section | What drives it |
|---|---------|----------------|
| 01 | Hero | Looping video, parallax layers, masked title lines |
| 02 | Collection | 3D tilt showcase + Profile/Front/Detail view switching |
| 03 | Engineering | Video scrubbed by scroll, callouts wiped in per beat |
| 04 | Performance | Driving video, ember/spark particles, heat wash |
| 05 | Heritage | Carbon-weave surface, staggered reveals |
| 06 | Showroom | Dubai location, animated map pin |
| 07 | Consultation | Validated booking form |
| 08 | Contact | Footer |

## Notes for anyone editing this

**The scrubbed video is buffered to a blob before it scrubs.**
`bufferRevealVideo()` fetches the clip, reports progress, then swaps
`video.src` to an object URL. Seeking against a *streamed* file issues a range
request per seek, so frames arrive late and the scrub looks broken. Buffering
starts when the visitor reaches the Collection so it never competes with the
hero for bandwidth, and it falls back to streaming if the fetch fails.

**Seeks are coalesced, never queued.** Assigning `currentTime` while a seek is
already in flight makes the browser drop the intermediate targets — the usual
cause of stuttery scrubbing. `flushSeek()` keeps exactly one seek in flight and
resumes toward the newest target on `seeked`.

**Scroll-driven visuals never depend on the video.** The progress bar and the
text reveals are pure scroll math, so a slow network or a missing codec leaves
the section degraded but alive rather than blank.

**`transform` on `#collectionImage` belongs solely to view switching.** A
scrubbed tween on that same property will silently revert the zoom on the next
scroll tick. Animate the wrapper instead.

**Reduced motion is honoured by not building the animations at all.** A
`.from()` tween that is created and then killed can strand an element
mid-fade. Guard with `REDUCED` at construction; counters still write their real
figures.

**Scrub quality depends on the clip's keyframe interval.** If scrubbing feels
chunky even when buffered, re-encode with denser keyframes:

```bash
ffmpeg -i in.mp4 -c:v libx264 -g 6 -crf 20 -an out.mp4
```

## Booking form

Front-end only. It validates, then shows a confirmation state — nothing is
sent anywhere. To make it real, POST from the submit handler in `js/main.js` to
Formspree, EmailJS or your own endpoint.

## Browser support

Current Chrome, Safari, Firefox and Edge. Needs H.264 playback for the videos,
`fetch` with streaming response bodies for buffering, and CSS `aspect-ratio`.
