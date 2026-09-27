# WebLite Final Test Checklist

Use normal HTTP/HTTPS pages, not protected browser-internal pages.

## Core
- [ ] Toggle WebLite ON → page reloads lighter.
- [ ] Restore Normal → rules disappear and page reloads normally.
- [ ] Balanced / Saver / Ultra / Custom can all be selected.
- [ ] Remember site mode works.

## Live telemetry
- [ ] Observed Data is a number, not a dash.
- [ ] Requests / Cross-site / Cookies update live.
- [ ] Data saved now shows `0 B` or a positive number, never a dash.
- [ ] Reduction % shows `0%` or a positive value, never a dash.
- [ ] Requests avoided shows `0` or a positive number, never a dash.
- [ ] Cookie changes increment when the site changes cookies.
- [ ] Resource details populate.

## Fonts
- [ ] On a site with a custom typeface, ordinary text switches to a local system font while WebLite's font control is active.
- [ ] Icon-like elements marked with icon classes/aria-hidden remain excluded where possible.

## Media
- [ ] Autoplay video/audio pauses.
- [ ] Dynamically inserted media is paused.
- [ ] Scripted `video.play()` is prevented while Media Guard is active.
- [ ] Common MP4/WebM/HLS/DASH media URLs are blocked before download.

## Motion
- [ ] CSS animations/transitions stop in Reduce/Freeze.
- [ ] Saver/Ultra stop requestAnimationFrame-driven animations.
- [ ] Balanced automatically escalates on pages with several animations/videos/canvases.
- [ ] If a site needs animation for core functionality, Custom → Motion → Keep restores it after reload.

## Privacy
- [ ] Cookie values never appear in the UI.
- [ ] No external network endpoint belongs to WebLite itself.
