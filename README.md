# WebLite

**A lightweight browser extension for pages that load more than you actually need.**

WebLite reduces optional page weight — things like heavy media, embeds, web fonts and motion — while trying to keep the site usable.

The project started from a simple annoyance: sometimes I only want the useful part of a page, but the browser still loads a lot of extra stuff around it. I did not want to make another "block everything" extension, so WebLite is built around different strength levels and user control.

## What it does

WebLite has four modes:

- **Balanced** — keeps normal browsing comfortable while reducing some optional weight
- **Saver** — stronger reduction for media, fonts, embeds and motion
- **Ultra** — the strictest mode for pages where visuals are not important
- **Custom** — lets you choose exactly what WebLite should reduce

The popup also shows browser-observed page activity such as:

- transferred resources
- request count
- cross-site requests
- image / media / font / frame activity
- cookie count and cookie changes
- measured savings compared with a normal-page baseline

If WebLite blocks something you actually want, images, videos and embeds can be loaded **once** without turning the extension off completely.

## Why it is not just an image blocker

The simple version was easy: hide images, pause videos, replace fonts and stop animations.

It also broke real websites.

One early build forced system fonts too aggressively and damaged text layout on Apple's website. Some videos kept playing because the page restarted them with JavaScript. Some scroll effects were not normal CSS animations at all.

That pushed WebLite toward a mix of network rules, page-side guards and more conservative visual changes.

## Browser builds

WebLite currently has separate builds for:

- Chrome
- Microsoft Edge
- Brave
- Firefox

The source is mostly shared, but the browser packages stay separate because extension manifests and background behavior are not identical everywhere.

Current folders:

```text
browser-builds/
├── WebLite-Chrome/
├── WebLite-Edge/
├── WebLite-Brave/
└── WebLite-Firefox/
```

See [browser-builds/README.md](browser-builds/README.md) for local install steps.

## Try it

One of the main sites I used while testing WebLite is **https://play.arc.gg/**.

If you are testing the project, a useful flow is:

1. Open the site normally.
2. Open WebLite and capture the normal-page baseline.
3. Turn on **Balanced** or **Saver**.
4. Let the page reload.
5. Watch the live request / transfer / resource numbers.
6. Try **Load once** on a blocked image, video or embed.
7. Restore normal mode and compare again.

I also test on other kinds of sites because one website cannot represent the whole web.

## How the measurement works

WebLite is **not** an ISP data meter.

It takes a normal-page baseline, enables the selected WebLite rules, reloads the page, and compares what the browser can observe afterwards.

Cached resources and some cross-origin resources are not always reported perfectly by browser APIs, so the interface uses wording such as **measured saved** and **browser-observed data** instead of pretending every number is exact.

```text
normal page
    ↓
capture baseline
    ↓
enable WebLite rules
    ↓
reload
    ↓
reduce optional resources / motion
    ↓
compare what the browser can observe
```

## Privacy

There is no WebLite account system and no WebLite server.

Cookie telemetry is used for counts/activity only. WebLite does not display or upload cookie values.

More detail: [PRIVACY.md](PRIVACY.md)

## Notes from development

I kept a few short notes from the project:

- [What I learned](docs/learning-log.md)
- [How it works](docs/architecture.md)
- [Testing notes](docs/testing-notes.md)
- [Project notes](docs/project-notes.md)

## Current limitations

- browser-protected pages cannot be modified by normal extensions
- some sites use unusual canvas / media systems that need stronger modes
- exact network byte counts are not exposed perfectly by browser APIs
- aggressive blocking can affect sites that depend heavily on third-party embeds

That is why WebLite has modes and one-time exceptions instead of one universal switch.

## Project origin

WebLite is an ongoing personal project. Its first public version was also developed and entered during the **Beginner's Paradise / FirstCommit** hackathon, which gave me a good reason to turn the early prototype into something more complete.

AI tools were used for brainstorming, debugging and code assistance during development. I manually tested the extension, changed approaches when they failed on real sites, and documented those trade-offs in this repository.

---

Built by **Naksh Choudhary**.

## Project links

- **GitHub profile:** [Naksh-Choudhary](https://github.com/Naksh-Choudhary)
- **Project ideas & roadmaps:** [project-ideas](https://github.com/Naksh-Choudhary/project-ideas)
- **ABLE accessibility project:** [ABLEHOST](https://github.com/Naksh-Choudhary/ABLEHOST)

## Feedback and development

WebLite is maintained as an ongoing project. Bug reports, browser-specific problems, testing results, and technical suggestions are welcome through GitHub Issues.
