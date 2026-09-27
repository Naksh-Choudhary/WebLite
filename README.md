# WebLite

**A small browser extension that makes heavy pages lighter without turning them into broken pages.**

WebLite started as a simple idea for the Beginner's Paradise / FirstCommit hackathon: a lot of websites load videos, custom fonts, embeds, motion and other optional things even when I only want to read or use the page.

The first version was too aggressive. It could save resources, but it also made some websites look bad. So the project slowly became less about "block everything" and more about **giving the user control**.

## What WebLite does

WebLite has four modes:

- **Balanced** — reduces optional page weight while trying to keep the site looking normal.
- **Saver** — stronger blocking for media, fonts, embeds and motion.
- **Ultra** — the strictest mode for pages where visuals are not important.
- **Custom** — lets you decide what WebLite should reduce.

The popup also shows browser-observed page activity such as:

- transferred resources
- request count
- cross-site requests
- image / media / font / frame activity
- cookie count and cookie changes
- measured savings compared with a normal-page baseline

If WebLite blocks something you actually need, it can show a small **Load once** control for that image, video or embed instead of making you disable the extension completely.

## The part that took the most fixing

The easiest version of a "lite mode" is also the worst one: hide images, pause videos, replace every font and stop animation.

That works until you try real websites.

One early build forced system fonts too aggressively and broke text layout on Apple's website. Some videos still played because websites were starting them with JavaScript. Some scroll animations were not normal CSS animations at all.

Those problems changed the project.

WebLite now uses a mix of network rules, page-side guards and conservative visual overrides. It also has different strength levels because one rule set does not fit every website.

## Browser builds

The current project has separate builds for:

- Chrome
- Microsoft Edge
- Brave
- Firefox

The code is mostly shared, but the packages stay separate because browser extension manifests and background behavior are not completely identical.

When the source folders are uploaded, they will live here:

```text
browser-builds/
├── chrome/
├── edge/
├── brave/
└── firefox/
```

See [browser-builds/README.md](browser-builds/README.md) for local install steps.

## How the measurement works

WebLite is **not** an ISP data meter.

It takes a normal-page baseline, enables the selected WebLite rules, reloads the page, and compares what the browser can observe afterwards.

That means the numbers are useful for comparison, but not every byte can be measured perfectly. Cached resources and some cross-origin resources can be reported differently by browser APIs.

That is why the interface says things like **measured saved** and **browser-observed data** instead of pretending the value is exact.

A simplified flow:

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

More detail is in [PRIVACY.md](PRIVACY.md).

## Development notes

I kept short notes from the build instead of writing a perfect story after everything was finished:

- [What I learned](docs/learning-log.md)
- [How it works](docs/architecture.md)
- [Testing notes](docs/testing-notes.md)
- [Hackathon notes](docs/hackathon-notes.md)

## Current limitations

WebLite still has some limits:

- browser-protected pages cannot be modified by normal extensions
- some websites use unusual canvas / media systems that need stronger modes
- exact network byte counts are not exposed perfectly by browser APIs
- aggressive blocking can still affect sites that depend on third-party embeds

That is also why WebLite has modes and one-time exceptions instead of one universal "block everything" switch.

## Built for FirstCommit

WebLite was started during the Beginner's Paradise / FirstCommit hackathon.

AI tools were used for brainstorming, debugging and code assistance. I tested the extension manually, changed parts that failed on real sites, and documented the technical decisions and limitations here.

---

Built by **Naksh Choudhary**.
