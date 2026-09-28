# Browser builds

This folder contains the unpacked WebLite source for each supported browser.

> **First time installing WebLite?**  
> Use the full beginner guide: **[Download & Install WebLite](../DOWNLOAD-AND-INSTALL.md)**.

```text
browser-builds/
├── WebLite-Chrome/
├── WebLite-Edge/
├── WebLite-Brave/
└── WebLite-Firefox/
```

Each browser folder directly contains its own `manifest.json`. WebLite 1.5 includes **Study mode** in all four builds.

## Important: this folder is not what Chrome asks you to select

For Chrome, Edge and Brave, do **not** choose the `browser-builds` folder itself.

Choose the folder for your browser:

```text
Chrome → WebLite-Chrome
Edge   → WebLite-Edge
Brave  → WebLite-Brave
```

Firefox is different: open `WebLite-Firefox` and choose its `manifest.json` file when Firefox asks for a temporary add-on.

## Download first

If you are viewing these folders on GitHub, you do not need to download each file one by one.

Return to the main WebLite repository page and use:

**Code → Download ZIP**

Then extract the ZIP on your computer.

If you cannot see the green **Code** button, you are probably still inside `browser-builds` or one of the browser folders. Click **WebLite** in the breadcrumb at the top of GitHub to return to the repository root.

Direct repository ZIP:

**https://github.com/Naksh-Choudhary/WebLite/archive/refs/heads/main.zip**

## Chrome

1. Extract the downloaded repository ZIP.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select:

```text
WebLite-main/browser-builds/WebLite-Chrome
```

The selected folder itself should contain `manifest.json`.

## Edge

1. Open `edge://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select:

```text
WebLite-main/browser-builds/WebLite-Edge
```

## Brave

1. Open `brave://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select:

```text
WebLite-main/browser-builds/WebLite-Brave
```

## Firefox

1. Open `about:debugging`.
2. Choose **This Firefox**.
3. Click **Load Temporary Add-on**.
4. Go to:

```text
WebLite-main/browser-builds/WebLite-Firefox
```

5. Select `manifest.json`.

## Confirm the correct build

The current build is **WebLite 1.5.0**.

When you open the extension, the modes should be:

**Balanced · Study · Saver · Ultra · Custom**

If Study is missing, you are using an older local copy.
