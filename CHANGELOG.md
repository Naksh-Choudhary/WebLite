# Changelog

This is a short record of the versions built during the hackathon.

## v0.1

The first working prototype.

- Chrome extension shell
- Balanced and Extreme-style saving
- tab-specific network blocking
- basic request / transfer comparison
- simple dark popup

The important lesson from this version was that hiding something after it loads does not really save the network request. The extension needed to block resources before the page finished loading.

## v1.0

The project became a real product instead of a proof of concept.

- Balanced, Saver, Ultra and Custom modes
- settings page
- tutorial page
- per-site remembered mode
- theme and accent controls
- before / after measurements
- keyboard shortcut
- clearer restore behavior

## v1.1

The visual design was rebuilt around an ivory + blue system.

- Ivorian Blue theme
- subtle botanical background details
- more compact popup layout
- live page telemetry
- cookie activity view
- expanded resource counters

This version exposed a measurement problem: some values stayed blank because browser timing APIs can return zero or hide cross-origin sizes.

## v1.2

Focused on reliability.

- better fallback measurement logic
- stronger media guard
- safer handling of custom fonts
- motion shield for CSS and scripted animation
- better cookie telemetry
- stronger Saver / Ultra behavior

Testing on Apple.com showed that forcing fonts everywhere could damage layout and that some animation systems were more complex than normal CSS transitions.

## v1.3

Focused on usability after blocking.

- conservative font replacement
- Load once controls for blocked images, video and embeds
- one-time media exceptions
- browser-specific packages for Chrome, Edge, Brave and Firefox
- updated tutorial and compatibility notes

This is the version being prepared for the FirstCommit submission.
