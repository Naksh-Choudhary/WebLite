# WebLite — FirstCommit Demo Plan

## One-line pitch
**WebLite is a one-click low-data layer that blocks optional page weight before it downloads and shows the user, live, what their browser avoided.**

## 3–5 minute demo
1. Open a media-heavy webpage normally and show its baseline.
2. Enable Balanced and show live Data Saved, requests avoided, cookies and resource counts updating.
3. Show the same site using local system fonts and paused media.
4. Open an animation-heavy product page; switch to Saver to demonstrate Motion Shield.
5. Open Custom to show that the user can keep/reduce/freeze each category rather than using an all-or-nothing blocker.
6. Explain the learning journey: DNR rules, content scripts, MAIN vs ISOLATED worlds, Resource Timing limitations, Cookies API, and why hiding a resource after download does not save data.

## Learning story
- Learned Chrome Manifest V3 architecture.
- Learned tab-scoped Declarative Net Request rules.
- Learned why videos can bypass simple `media` blocking through blobs/XHR and built Media Guard.
- Learned that blocking font files alone does not replace cached/embedded fonts and added system-font enforcement.
- Learned the difference between CSS motion and JavaScript `requestAnimationFrame` animation.
- Learned browser Resource Timing privacy limitations and designed honest telemetry around them.
- Learned Chrome cookie telemetry without exposing private cookie values.
