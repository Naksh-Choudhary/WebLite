# Learning log

I wanted to keep this page simple and honest because "what did you learn?" is a big part of FirstCommit.

## 1. Blocking after load is too late

My first instinct was to hide or pause heavy elements after the page appeared.

That can make the page look lighter, but the browser may have already downloaded the resource.

The useful part was learning to move the actual saving logic closer to the network request stage and then reload the page with the rules active.

## 2. A website can play media in more than one way

Pausing a visible `<video>` element was not enough.

Some pages recreate media, call `.play()` from JavaScript, or use streaming formats that do not behave like a simple MP4 file.

That is why WebLite ended up with both request-level rules and page-side media guards.

## 3. "Remove custom fonts" sounds simpler than it is

I tried a very aggressive font override.

It worked technically, but it made some real sites ugly. On Apple.com, some text positioning looked wrong because the replacement font had different metrics.

The fix was not "more CSS." The fix was being less aggressive.

Now WebLite blocks font downloads where possible but avoids blindly rewriting every element on the page.

## 4. Not every animation is a CSS animation

I expected `animation: none` and `transition: none` to handle most motion.

Then I tested pages that use `requestAnimationFrame`, canvas drawing and scroll-linked effects.

That led to the stronger Motion Shield used in Saver / Ultra modes.

## 5. Browser measurements need careful wording

I originally wanted one clean "MB saved" number.

The problem is that resource timing data is not perfect. Cached resources and some cross-origin requests can have incomplete byte information.

So WebLite now says **measured saved** or **browser-observed data**. I would rather show a slightly less dramatic number than a fake exact one.

## 6. One setting cannot work for every website

Ultra blocking is useful on a text-heavy page. It can be terrible on a visual product page.

That is why WebLite has Balanced, Saver, Ultra and Custom instead of one switch.

## 7. Cross-browser support is mostly similar, not identical

Chrome, Edge and Brave share a lot because they are Chromium-based.

Firefox still needs its own extension packaging / manifest decisions, so I kept browser builds separate instead of pretending one folder was guaranteed to behave identically everywhere.

## Skills I touched during the project

- Manifest V3 browser extensions
- service workers / background scripts
- content scripts
- declarative network request rules
- browser storage
- performance resource timing
- cookie APIs
- DOM observation
- media playback control
- animation / requestAnimationFrame behavior
- cross-browser extension packaging

I am still learning several of these. The point of this project was not to pretend I already knew them.
