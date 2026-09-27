# WebLite 1.3.0

- Added visible **Load once** placeholders for blocked images, videos, and embeds.
- Added temporary per-tab allow rules that clear on reload/navigation.
- Reworked font handling to avoid breaking complex typography: network fonts are blocked, while system-font replacement is conservative.
- Strengthened Freeze mode for scripted scroll/RAF animation while preserving native scrolling.
- Added cross-browser API shim and browser-specific packaging for Chrome, Edge, Brave, and Firefox.
- Kept live transfer/request/cookie telemetry and Ivorian Blue UI.

# WebLite 1.3.0 Final

## Reliability fixes
- Rebuilt the live comparison so **Data saved now**, **reduction %**, and **requests avoided** no longer sit at dashes. They now use a normal-page baseline plus browser-observed resource size and fall back to `0` instead of an undefined UI state.
- Baseline matching now follows the page origin + path, so harmless hash/query changes are less likely to destroy a comparison.
- WebLite can inject its scripts into an already-open HTTP/HTTPS tab after an extension reload, so users do not usually need to reopen the site.
- Resource timing buffer increased to 3000 entries for heavier pages.

## Stronger blocking
- Added a main-world **Media Guard** that intercepts scripted `HTMLMediaElement.play()` calls.
- Added repeated media enforcement for dynamically inserted videos/audio.
- Added blocking for common streamed media file/segment URLs requested through XHR/fetch.
- Added all-frame enforcement so media inside frames is handled too.
- Web-font mode now visually forces system fonts on ordinary text, including fonts that were cached or embedded before the network rule ran.

## Motion Shield
- CSS/Web Animations are cancelled directly.
- Saver and Ultra freeze `requestAnimationFrame`-driven visual loops.
- Balanced uses smart escalation on animation-heavy pages with several active animations, videos or canvases.
- Custom mode now has **Keep / Reduce / Freeze** instead of a vague motion checkbox.

## Real cookie telemetry
- Uses Chrome's Cookies API instead of `document.cookie`.
- Shows total applicable cookies, HttpOnly cookie count, and real cookie change events.
- WebLite never displays or stores cookie names/values.

## Live telemetry
- Live observed page data
- Current requests
- Cross-site requests
- Cookies + cookie changes
- Images / scripts / styles / fonts / media / frames
- DOM node count
- Load time
- All-time measured savings and optimized loads
