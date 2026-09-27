# Project notes

## The problem

Some web pages load a lot of optional content even when the user mainly wants the useful part of the page.

Heavy media, decorative motion, embeds and custom fonts can increase transfer, processing and distraction, especially on limited connections or older hardware.

## The idea

WebLite sits between "normal browsing" and "block everything."

The goal is to:

- reduce optional resources
- keep the page usable
- show what changed
- let the user restore a blocked item when they actually need it

The **Load once** idea came directly from that trade-off.

## Student use case

A specific use case added in WebLite 1.4 is studying on limited or unreliable internet.

Students may be using a phone hotspot, crowded school Wi-Fi or a slower home connection. A learning page can still load autoplay video, third-party embeds, custom fonts, cross-site imagery and decorative motion that are not always necessary for reading the lesson.

**Study mode** keeps text and same-site diagrams, reduces those optional resources, and lets the student restore any blocked item with **Load once** if it turns out to be important.

This feature was developed for the CSC Back-to-School Hackathon, but it is part of the normal WebLite product rather than a separate hackathon-only version.

## Sustainability angle

WebLite does not claim that blocking one image creates a huge environmental impact.

The simpler argument is that unnecessary transfer and processing still use network, device and server resources. A lighter browsing option can reduce avoidable work, especially when repeated across many page loads.

I intentionally avoid made-up CO2 numbers unless there is a solid way to support them.

## Where the project can go next

- better site-specific heuristics
- a cleaner per-resource history view
- accessibility testing across more websites
- automated regression tests for the browser builds
- store-ready packaging / signing for each browser

## FirstCommit

The first public version of WebLite was also developed for the Beginner's Paradise / FirstCommit hackathon. The hackathon helped push the project from a basic Chrome prototype into a more complete multi-browser build, but WebLite is intended to continue as a normal standalone project after the event.
