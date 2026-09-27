# Browser builds

This folder is where the final unpacked extension source goes.

Please keep the structure exactly like this:

```text
browser-builds/
├── chrome/
├── edge/
├── brave/
└── firefox/
```

Do **not** upload the old ZIP files here. Upload the extracted source folders.

Each browser folder should contain its own `manifest.json` directly inside it.

For example:

```text
browser-builds/chrome/manifest.json
browser-builds/firefox/manifest.json
```

## Local install

### Chrome

Open `chrome://extensions` → Developer mode → Load unpacked → choose the `chrome` folder.

### Edge

Open `edge://extensions` → Developer mode → Load unpacked → choose the `edge` folder.

### Brave

Open `brave://extensions` → Developer mode → Load unpacked → choose the `brave` folder.

### Firefox

Open `about:debugging` → This Firefox → Load Temporary Add-on → choose `manifest.json` from the `firefox` folder.
