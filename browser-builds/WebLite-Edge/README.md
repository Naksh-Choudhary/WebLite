# WebLite — Microsoft Edge

This folder contains the Microsoft Edge build of **WebLite 1.4.0**.

WebLite is a lightweight browsing extension that reduces optional page resources while keeping the user in control of anything that gets blocked.

## Main features

- **AI Smart Filter** with reversible ad/promo cleanup and conversational restore controls

- Balanced, **Study**, Saver, Ultra and Custom modes
- **Study mode** keeps text and same-site diagrams while trimming cross-site images, media, web fonts, third-party embeds and distracting motion
- request-level blocking for selected resources
- Media Guard for autoplay / scripted media
- Motion Shield for heavy page animation
- conservative font handling
- **Load once** controls for blocked images, video and embeds
- live browser-observed request / transfer / cookie telemetry
- local settings with no WebLite account or cloud backend

## Install locally

1. Open `edge://extensions`.
2. Turn on developer mode if the browser asks for it.
3. Choose **Load unpacked** and select this folder.
4. Pin WebLite if you want quick access to the popup.

## Good test site

One of the main pages used during development is **https://play.arc.gg/**. It is useful for comparing Normal, Balanced and Saver modes and for watching the live resource counters change.

## Measurement note

WebLite reports **browser-observed** data. Browser APIs can hide or report cached / cross-origin byte sizes differently, so these numbers are useful for comparison but should not be treated as ISP billing totals.

## Privacy

WebLite has no account, analytics service or remote backend. Cookie telemetry is used for counts and change activity; cookie values are not displayed by the extension.

For the main project documentation, see the repository root README.
