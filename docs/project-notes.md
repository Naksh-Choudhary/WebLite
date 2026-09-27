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
