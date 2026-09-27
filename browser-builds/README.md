# Browser builds

This folder contains the unpacked WebLite source for each supported browser.

```text
browser-builds/
├── WebLite-Chrome/
├── WebLite-Edge/
├── WebLite-Brave/
└── WebLite-Firefox/
```

Each folder has its own `manifest.json` and can be loaded locally for testing.

## Local install

### Chrome

Open `chrome://extensions` → turn on **Developer mode** → **Load unpacked** → choose `WebLite-Chrome`.

### Edge

Open `edge://extensions` → turn on **Developer mode** → **Load unpacked** → choose `WebLite-Edge`.

### Brave

Open `brave://extensions` → turn on **Developer mode** → **Load unpacked** → choose `WebLite-Brave`.

### Firefox

Open `about:debugging` → **This Firefox** → **Load Temporary Add-on** → choose `manifest.json` inside `WebLite-Firefox`.

## Note

The four builds are intentionally kept separate. Chrome, Edge and Brave are close to each other, while Firefox needs a few browser-specific packaging choices.
