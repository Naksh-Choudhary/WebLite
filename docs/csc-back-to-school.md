# CSC Back-to-School notes

This page keeps the school-specific submission details separate from the main WebLite README.

## School-life problem

Students do not always study on fast, unlimited internet.

A student may be using a phone hotspot, a crowded school network, or a slower home connection. Even a page that is mainly text can load autoplay media, third-party embeds, web fonts, cross-site images and decorative motion.

The problem is not that every visual should disappear. The problem is that the browser gives the student very little control over what is worth loading.

## What WebLite adds for students

**Study mode** is the school-focused preset introduced in WebLite 1.4.

It:

- keeps readable text
- keeps same-site diagrams and images
- reduces cross-site images
- blocks media downloads and autoplay
- blocks web-font downloads
- reduces third-party embeds
- reduces distracting motion
- keeps **Load once** available for a diagram, video or embed the student actually needs

That makes Study mode less aggressive than Saver/Ultra and more useful for a real learning page.

## Who it is for

Primary users:

- students studying through mobile hotspots
- students on slow or crowded school Wi-Fi
- students with limited data
- students who want a quieter page while reading

The same feature can also help teachers or schools when a shared connection is limited.

## How to test it

1. Load a page normally.
2. Open WebLite.
3. Select **Study**.
4. Enable WebLite and let the page reload.
5. Check that text and same-site diagrams remain.
6. Watch live request / observed-data / cookie activity in the popup.
7. Use **Load once** if a blocked item is actually useful.

For a heavier stress test, one of the main sites used during development is **https://play.arc.gg/**.

## Technologies

- JavaScript
- HTML / CSS
- Manifest V3 browser extensions
- Declarative Net Request
- content scripts
- extension service worker / background script
- browser storage
- Resource Timing API
- Cookies API
- DOM / MutationObserver
- Chrome, Edge, Brave and Firefox builds

## AI-use disclosure

AI tools were used during brainstorming, coding assistance, debugging and documentation. They were not used as a hidden replacement for understanding the project.

The extension was manually tested on real websites, and the design changed based on problems found during testing — including broken typography, media that restarted through JavaScript, animation systems that ignored basic CSS controls, and incomplete browser timing measurements.

## Project ownership

WebLite remains an independent project after the hackathon. CSC Back-to-School is one event where the student-focused Study mode is being developed and demonstrated.
