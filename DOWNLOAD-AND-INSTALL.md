# Download & Install WebLite

If you are here to **test WebLite**, this is the page to follow.

WebLite is currently provided as an **unpacked browser extension**. It is not being installed from the Chrome Web Store / Edge Add-ons / Firefox Add-ons yet.

That means the process has two parts:

1. download the repository to your computer
2. load the correct WebLite browser folder into your browser

---

## 1. Download WebLite

### Easiest method

Download the whole repository as a ZIP:

**[Download WebLite (main branch ZIP)](https://github.com/Naksh-Choudhary/WebLite/archive/refs/heads/main.zip)**

If you prefer using the GitHub interface:

1. Go to the main repository page:  
   **https://github.com/Naksh-Choudhary/WebLite**
2. Make sure you are at the repository root — you should see files such as `README.md`, `CHANGELOG.md`, `LICENSE`, `docs`, and `browser-builds`.
3. Click the green **Code** button.
4. Choose **Download ZIP**.
5. Wait for the ZIP to finish downloading.
6. Extract it.

After extraction, you should have a folder similar to:

```text
WebLite-main/
├── README.md
├── docs/
└── browser-builds/
    ├── WebLite-Chrome/
    ├── WebLite-Edge/
    ├── WebLite-Brave/
    └── WebLite-Firefox/
```

### If you cannot see the green Code button

You are probably inside a subfolder such as:

```text
WebLite / browser-builds / WebLite-Chrome
```

GitHub normally shows the **Code** download button at the main repository page, not inside every subfolder.

Click **WebLite** in the breadcrumb near the top to return to the repository root, then use **Code → Download ZIP**.

You can also skip the button completely and use the direct ZIP link above.

---

# 2. Install the correct browser build

## Google Chrome

After extracting the ZIP:

1. Open Chrome.
2. Enter this in the address bar:

   `chrome://extensions`

3. Turn on **Developer mode** in the top-right corner.
4. Click **Load unpacked**.
5. Browse to:

```text
WebLite-main/
└── browser-builds/
    └── WebLite-Chrome/
```

6. Select the **WebLite-Chrome** folder itself.
7. Click **Select Folder**.

Chrome should now show **WebLite 1.5.0** in your extensions.

### Important

Do **not** select:

```text
browser-builds/
```

and do not select an individual file such as:

```text
manifest.json
```

For Chrome, select the complete:

```text
WebLite-Chrome
```

folder.

---

## Microsoft Edge

1. Open Edge.
2. Enter:

   `edge://extensions`

3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select:

```text
WebLite-main/browser-builds/WebLite-Edge
```

6. Confirm the folder.

---

## Brave

1. Open Brave.
2. Enter:

   `brave://extensions`

3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select:

```text
WebLite-main/browser-builds/WebLite-Brave
```

6. Confirm the folder.

---

## Firefox

Firefox handles temporary development extensions differently.

1. Open Firefox.
2. Enter:

   `about:debugging`

3. Click **This Firefox**.
4. Click **Load Temporary Add-on**.
5. Open:

```text
WebLite-main/
└── browser-builds/
    └── WebLite-Firefox/
```

6. Select the `manifest.json` file.

Firefox will load WebLite temporarily for that browser session.

---

# 3. Confirm that you loaded the newest version

Open WebLite from your browser toolbar.

The mode selector should contain:

```text
Balanced | Study | Saver | Ultra | Custom
```

You should also see a small **✦ Page Coach** button in the popup. Study mode includes **Focus Shield**.

The extension version should be **1.5.0**.

If you only see:

```text
Balanced | Saver | Ultra | Custom
```

you are probably still using an older WebLite folder.

Remove the old unpacked extension, download the latest repository ZIP again, extract it, and reload the correct browser folder.

---

# 4. Quick test

For the main stress test, open:

**https://play.arc.gg/**

Then:

1. open WebLite
2. start from Normal browsing
3. try **Balanced**
4. try **Study**
5. try **Saver**
6. watch the live request / observed-data counters
7. use **Load once** if WebLite blocks something you want
8. use **Restore normal** when finished

For the CSC student use case, also try **Study mode** on a normal learning/article page and check that readable text and same-site diagrams stay usable while optional resources are reduced.

---

# Common problems

### "Load unpacked" is missing

Developer mode is probably turned off. Turn it on first.

### "Manifest file is missing or unreadable"

You selected the wrong folder.

For Chrome, Edge and Brave, the selected folder must directly contain `manifest.json`.

For example:

```text
WebLite-Chrome/
├── manifest.json
├── background.js
├── popup.html
└── ...
```

### I downloaded the ZIP but Chrome cannot load it

Extract the ZIP first. Browsers cannot use the repository ZIP itself as an unpacked extension.

### I am already inside WebLite-Chrome on GitHub. How do I download just this folder?

The simplest supported method for beginners is to download the **whole repository ZIP**, extract it, then open `browser-builds/WebLite-Chrome`.

### The old version is still showing

Go to your browser's extensions page, remove the old unpacked WebLite entry, then load the newly downloaded folder.

---

If you are a judge or first-time tester, you only need:

**Download ZIP → Extract → open your browser extensions page → Developer mode → Load unpacked → select the correct WebLite browser folder.**
