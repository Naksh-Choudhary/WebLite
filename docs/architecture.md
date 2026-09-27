# Architecture

WebLite is intentionally small. There is no backend.

## Main pieces

### Popup

The popup is the control surface.

It is responsible for:

- selecting the mode
- showing live / measured page information
- restoring normal browsing
- exposing advanced controls when needed

### Background script / service worker

The background side handles extension-level jobs such as:

- remembering state
- installing / removing request rules
- coordinating tab-specific behavior
- reacting to navigation and mode changes

### Content script

The content script runs inside normal webpages.

It is responsible for page-side behavior that cannot be solved only with network rules, including:

- pausing / guarding media
- reducing or freezing motion
- managing blocked-content placeholders
- Load once interactions
- observing dynamic elements

### Browser storage

WebLite stores preferences locally so the user does not need an account.

## Why two different kinds of blocking?

Network blocking and DOM changes solve different problems.

If the goal is to save a request, it should be blocked before the browser downloads it.

If the goal is to stop something that is already in the page — for example a scripted animation — the content script has to handle it.

So the extension roughly works like this:

```text
                 popup
                   │
                   ▼
          background / state
            │             │
            │             └──── browser storage
            ▼
     network request rules
            │
            ▼
          webpage
            ▲
            │
       content script
     media / motion / UI
```

## Mode idea

The presets are intentionally different in strength.

### Balanced

For normal use. It should reduce optional weight without making the page feel obviously damaged.

### Saver

For stronger savings. It can be more visible about what it removes.

### Ultra

For maximum reduction where visual fidelity matters less.

### Custom

For testing and for users who know exactly what they want.

## Measurement model

WebLite compares a normal baseline against the current Lite reload.

It does not claim exact ISP traffic measurement because browser APIs do not expose every resource byte consistently.

The extension therefore focuses on relative, browser-observed differences:

- requests
- observed transfer size
- resource types
- cross-site resource count
- cookie activity
