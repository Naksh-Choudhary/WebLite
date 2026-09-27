# WebLite — Chrome build 1.2 Final

**A minimal, privacy-first low-data browsing layer for modern browsers.**

WebLite reduces optional page weight before it downloads, then shows live local telemetry so the user can see what changed.

## Modes

- **Balanced** — keeps images and core page behavior, blocks media downloads, web fonts and third-party embeds, and reduces motion. It can automatically activate Motion Shield on animation-heavy pages.
- **Saver** — Balanced plus third-party image blocking, all-embed blocking and Motion Shield.
- **Ultra** — blocks images, media, fonts and embeds, with Motion Shield enabled.
- **Custom** — choose Images, Media, Fonts, Embeds, Motion (Keep / Reduce / Freeze) and Autoplay separately.

## Live telemetry

The popup updates while the page is loading and shows:

- browser-observed page data
- measured data saved vs the normal baseline
- reduction percentage
- requests loaded and requests avoided
- cross-site requests
- applicable cookie count
- cookie change events
- HttpOnly cookie count
- images, scripts, CSS, fonts, media and frames
- DOM nodes
- page load time

WebLite does **not** inspect or display cookie values.

## Why the measurement says “observed”

Browser Resource Timing intentionally hides exact byte sizes for some cached/cross-origin resources. WebLite therefore reports browser-observed data rather than pretending to be an ISP-level meter.

## Stronger page controls

WebLite uses multiple layers rather than relying on one CSS trick:

1. the browser Declarative Net Request rules block selected resources before download.
2. Media Guard pauses dynamic media and intercepts scripted `play()` calls.
3. System-font mode visually replaces ordinary custom text fonts, including cached/embedded fonts.
4. Motion reduction cancels CSS/Web Animations.
5. Motion Shield suppresses scripted `requestAnimationFrame` loops in Saver/Ultra and on animation-heavy Balanced pages.
6. Rules are scoped to the current tab and are removed when WebLite is restored to Normal.

## Install

1. Unzip the WebLite folder.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `WebLite-v1.3.0-FINAL` folder.
6. Pin WebLite.

If upgrading from an older unpacked version, remove/reload the old one and load this folder. Existing settings are migrated where possible.

## Privacy

No account. No analytics. No cloud backend. No external API. Settings and impact totals stay in browser extension storage. Cookie names and values are never shown or stored by WebLite.

## Browser limitations

browser internal pages and extension stores and some browser-protected surfaces cannot be modified by normal extensions. Sites that deliberately bundle animation/media into unusual script pipelines can also require a stronger mode; use **Saver/Ultra** or Custom → Motion → Freeze.

## Load once

When WebLite blocks a visible image, video, or embed, it keeps the layout usable with a small placeholder. The user can choose **Load once** to allow only that resource for the current page load. Temporary exceptions are cleared on navigation/reload.

## Font safety

WebLite blocks web-font network requests, but only applies system-font fallback to simple text containers. It deliberately avoids complex positioned/animated typography so pages do not collapse or overlap.

## Browser build

This archive is the **Chrome** package of WebLite 1.3.0.
