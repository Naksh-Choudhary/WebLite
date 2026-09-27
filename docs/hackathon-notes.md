# FirstCommit notes

## Problem

Modern web pages can load a lot of optional content even when the user mainly wants the useful part of the page.

Heavy media, decorative motion, embeds and custom fonts can increase data transfer and make browsing less practical on limited or unstable connections.

## Idea

Give the user a lightweight layer on top of the browser:

- reduce optional resources
- keep the page usable
- show what changed
- let the user restore a blocked item when they actually need it

## Why this is different from just disabling images

The interesting part is not the checkbox.

The project tries to balance three things at the same time:

1. saving optional requests
2. not destroying the website
3. explaining the result with live page telemetry

The "Load once" idea came directly from this trade-off.

## Sustainability angle

WebLite does not claim that one blocked image "saves the planet."

The sustainability argument is simpler: transferring and processing unnecessary page resources uses network, device and server resources. A lighter browsing option can reduce avoidable transfer and computation, especially for people on limited connections or older hardware.

I am keeping the submission away from made-up CO2 numbers unless I can support them properly.

## Demo plan

A short demo should show:

1. open a heavy page normally
2. show the baseline
3. turn on Balanced or Saver
4. reload and show the measured difference
5. show a blocked image / video
6. press **Load once**
7. briefly show live resource / cookie activity
8. explain one real bug from development and how it changed the design

## What I would improve with more time

- better site-specific heuristics
- a cleaner per-resource history view
- accessibility testing across more websites
- automated regression tests for the browser builds
- store-ready packaging / signing for each browser
