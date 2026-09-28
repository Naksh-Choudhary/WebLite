(function(){
if (globalThis.__webliteContentInstalled) return;
globalThis.__webliteContentInstalled = true;
const EXT = globalThis.browser || globalThis.chrome;
const STYLE_ID = "weblite-runtime-style";
const PLACEHOLDER_ATTR = "data-weblite-placeholder-for";
let activeConfig = null;
let domObserver = null;
let enforcementTimer = null;
let reportTimer = null;
let placeholderSeq = 0;

try { performance.setResourceTimingBufferSize?.(4000); } catch {}

function ensureRoot() { return document.documentElement || document.querySelector("html"); }
function safeHost(value) { try { return new URL(value, location.href).hostname.toLowerCase(); } catch { return ""; } }
function isCrossSite(url) {
  const resourceHost = safeHost(url);
  const pageHost = location.hostname.toLowerCase();
  if (!resourceHost || !pageHost) return false;
  return !(resourceHost === pageHost || resourceHost.endsWith(`.${pageHost}`) || pageHost.endsWith(`.${resourceHost}`));
}

function resolvedMotionLevel(config = {}) {
  return config.motionLevel || (config.reduceMotion ? "reduce" : "none");
}

function setGuardState(config = {}) {
  const root = ensureRoot(); if (!root) return;
  root.dataset.weblite = "on";
  root.dataset.webliteMedia = (config.media || config.pauseAutoplay) ? "1" : "0";
  root.dataset.webliteFonts = config.fonts ? "1" : "0";
  root.dataset.webliteMotion = resolvedMotionLevel(config);
  root.dataset.webliteFocusShield = config.focusShield ? "1" : "0";
}
function clearGuardState() {
  const root = ensureRoot(); if (!root) return;
  delete root.dataset.weblite; delete root.dataset.webliteMedia;
  delete root.dataset.webliteFonts; delete root.dataset.webliteMotion;
  delete root.dataset.webliteFocusShield; delete root.dataset.webliteMediaPass;
}

function mediaPassActive() { return ensureRoot()?.dataset.webliteMediaPass === "1"; }
function grantShortMediaPass(ms = 20000) {
  const root = ensureRoot(); if (!root) return;
  root.dataset.webliteMediaPass = "1";
  setTimeout(() => { if (root.dataset.webliteMediaPass === "1") delete root.dataset.webliteMediaPass; }, ms);
}
function pauseOneMedia(media) {
  if (mediaPassActive() || !(media instanceof HTMLMediaElement) || media.dataset.webliteAllowOnce === "1") return;
  try { media.autoplay = false; media.removeAttribute("autoplay"); media.preload = "none"; media.pause(); } catch {}
}
function stopMedia(root = document) {
  if (mediaPassActive() || !(activeConfig?.media || activeConfig?.pauseAutoplay)) return;
  if (root instanceof HTMLMediaElement) pauseOneMedia(root);
  root.querySelectorAll?.("video, audio").forEach(pauseOneMedia);
}
function cancelMotion() {
  const level = resolvedMotionLevel(activeConfig || {});
  const root = ensureRoot(); if (root && activeConfig) root.dataset.webliteMotion = level;
  if (level !== "freeze") return;
  try { document.getAnimations?.().forEach(a => { try { a.cancel(); } catch { try { a.pause(); } catch {} } }); } catch {}
}
function mediaEventGuard(event) {
  if (mediaPassActive() || !(activeConfig?.media || activeConfig?.pauseAutoplay)) return;
  const media = event.target;
  if (media instanceof HTMLMediaElement && media.dataset.webliteAllowOnce !== "1") pauseOneMedia(media);
}

function elementUrl(el, kind) {
  if (kind === "image") return el.currentSrc || el.getAttribute("src") || "";
  if (kind === "media") return el.currentSrc || el.getAttribute("src") || el.querySelector?.("source[src]")?.getAttribute("src") || "";
  if (kind === "frame") return el.getAttribute("src") || "";
  return "";
}
function scopeBlocks(scope, url) {
  if (!scope || scope === "none") return false;
  if (scope === "all") return true;
  return scope === "thirdParty" && isCrossSite(url);
}
function blockedKind(el) {
  if (!activeConfig || !(el instanceof Element)) return null;
  if (el.dataset.webliteAllowOnce === "1") return null;
  if (el instanceof HTMLImageElement && scopeBlocks(activeConfig.images, elementUrl(el, "image"))) return "image";
  if (el instanceof HTMLVideoElement && activeConfig.media) return "media";
  if (el instanceof HTMLIFrameElement && scopeBlocks(activeConfig.frames, elementUrl(el, "frame"))) return "frame";
  return null;
}

function placeholderSize(el, kind) {
  const rect = el.getBoundingClientRect?.() || { width: 0, height: 0 };
  const cs = getComputedStyle(el);
  let width = rect.width || parseFloat(cs.width) || Number(el.getAttribute("width")) || 0;
  let height = rect.height || parseFloat(cs.height) || Number(el.getAttribute("height")) || 0;
  if (width < 36 && height < 24) return null; // don't litter tiny icons/pixels
  if (width < 80) width = Math.max(80, width);
  if (height < 48) height = kind === "image" ? Math.min(160, Math.max(72, width * .56)) : 96;
  return { width: Math.round(width), height: Math.round(height), display: cs.display };
}

function restoreDisplay(el) {
  if (!el) return;
  const prev = el.dataset.weblitePrevDisplay;
  if (prev === "__empty__") el.style.removeProperty("display");
  else if (prev != null) el.style.display = prev;
  delete el.dataset.weblitePrevDisplay;
}
function hideForPlaceholder(el) {
  if (el.dataset.weblitePrevDisplay == null) el.dataset.weblitePrevDisplay = el.style.display || "__empty__";
  el.style.setProperty("display", "none", "important");
}

function placeholderLabel(kind) {
  if (kind === "image") return ["Image paused", "Load image once"];
  if (kind === "media") return ["Video paused", "Play this video"];
  return ["Embed paused", "Load embed once"];
}

async function loadOnce(el, placeholder, kind, url) {
  try {
    if (kind === "media") grantShortMediaPass();
    const response = await EXT.runtime.sendMessage({ type: "ALLOW_RESOURCE_ONCE", kind, url, pageUrl: location.href });
    if (!response?.ok) throw new Error(response?.error || "Couldn't allow resource");
    el.dataset.webliteAllowOnce = "1";
    restoreDisplay(el);
    placeholder?.remove();

    if (kind === "image") {
      const src = el.getAttribute("src");
      const srcset = el.getAttribute("srcset");
      if (srcset) { el.removeAttribute("srcset"); void el.offsetWidth; el.setAttribute("srcset", srcset); }
      if (src) { el.removeAttribute("src"); void el.offsetWidth; el.setAttribute("src", src); }
    } else if (kind === "media") {
      try {
        el.controls = true;
        el.preload = "auto";
        el.load();
        await new Promise(r => setTimeout(r, 120));
        await el.play();
      } catch {}
    } else if (kind === "frame") {
      const src = el.getAttribute("src");
      if (src) { el.setAttribute("src", "about:blank"); setTimeout(() => el.setAttribute("src", src), 0); }
    }
  } catch (error) {
    const btn = placeholder?.querySelector("button");
    if (btn) { btn.textContent = "Try again"; btn.disabled = false; }
  }
}

function ensurePlaceholder(el) {
  const kind = blockedKind(el); if (!kind || el.dataset.weblitePlaceholderId) return;
  const url = elementUrl(el, kind); if (!url || /^data:|^blob:/i.test(url) && kind === "image") return;
  const size = placeholderSize(el, kind); if (!size) return;
  const id = `wl-${++placeholderSeq}`;
  el.dataset.weblitePlaceholderId = id;
  const holder = document.createElement("div");
  holder.className = kind === "media" ? "weblite-load-placeholder weblite-media-card" : "weblite-load-placeholder";
  holder.setAttribute(PLACEHOLDER_ATTR, id);
  holder.dataset.kind = kind;
  holder.style.width = `${size.width}px`;
  holder.style.height = `${size.height}px`;
  holder.style.maxWidth = "100%";
  if (size.display === "inline" || size.display === "inline-block") holder.style.display = "inline-flex";
  const [title, action] = placeholderLabel(kind);
  holder.innerHTML = kind === "media"
    ? `<button class="weblite-media-play" type="button" aria-label="Play video once"><span class="weblite-play-icon">▶</span><span class="weblite-play-copy"><b>Play video</b><small>Load for this page only</small></span></button>`
    : `<span class="weblite-ph-mark">WL</span><span class="weblite-ph-copy"><b>${title}</b><small>WebLite saved this resource.</small></span><button type="button">${action}</button>`;
  const button = holder.querySelector("button");
  button.addEventListener("click", async (event) => {
    event.preventDefault(); event.stopPropagation(); button.disabled = true; button.textContent = "Loading…";
    await loadOnce(el, holder, kind, url);
  }, { capture: true });
  el.parentNode?.insertBefore(holder, el);
  hideForPlaceholder(el);
}

function scanPlaceholders(root = document) {
  if (!activeConfig) return;
  if (root instanceof Element) ensurePlaceholder(root);
  root.querySelectorAll?.("img,video,iframe").forEach(ensurePlaceholder);
}
function clearPlaceholders() {
  document.querySelectorAll?.(`[${PLACEHOLDER_ATTR}]`).forEach(p => p.remove());
  document.querySelectorAll?.("[data-weblite-placeholder-id]").forEach(el => {
    restoreDisplay(el); delete el.dataset.weblitePlaceholderId; delete el.dataset.webliteAllowOnce;
  });
}

const SYSTEM_FONT = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
const SAFE_TEXT_SELECTOR = "p,li,td,th,label,button,input,textarea,select,h1,h2,h3,h4,h5,h6,blockquote,figcaption";
function isSafeTextElement(el) {
  if (!(el instanceof HTMLElement)) return false;
  if (el.closest("svg,[class*='icon' i],[aria-hidden='true'],[role='img'],[data-weblite-placeholder-for]")) return false;
  if (el.children.length > 2) return false;
  const cs = getComputedStyle(el);
  if (["absolute","fixed","sticky"].includes(cs.position)) return false;
  if (cs.transform && cs.transform !== "none") return false;
  if (cs.display === "contents") return false;
  if (cs.whiteSpace === "nowrap" && (el.scrollWidth > el.clientWidth + 2)) return false;
  return true;
}
function applySafeFontFallbacks(root = document) {
  // Network font blocking remains available, but visual font replacement is
  // disabled by default because font metric changes can collapse real layouts.
  if (!activeConfig?.fonts || activeConfig.visualFontFallback !== true) return;
  const list = [];
  if (root instanceof Element && root.matches?.(SAFE_TEXT_SELECTOR)) list.push(root);
  root.querySelectorAll?.(SAFE_TEXT_SELECTOR).forEach(el => list.push(el));
  for (const el of list) {
    if (!isSafeTextElement(el) || el.dataset.webliteFontSafe === "1") continue;
    el.dataset.webliteFontSafe = "1";
    el.dataset.webliteFontPrev = el.style.fontFamily || "__empty__";
    el.style.setProperty("font-family", SYSTEM_FONT, "important");
  }
}
function clearFontFallbacks() {
  document.querySelectorAll?.("[data-weblite-font-safe='1']").forEach(el => {
    const prev = el.dataset.webliteFontPrev;
    if (prev === "__empty__") el.style.removeProperty("font-family"); else if (prev != null) el.style.fontFamily = prev;
    delete el.dataset.webliteFontSafe; delete el.dataset.webliteFontPrev;
  });
}

const FOCUS_HIDDEN = "data-weblite-focus-hidden";
function safeToHide(el) {
  if (!(el instanceof HTMLElement)) return false;
  const meta = `${el.id || ""} ${typeof el.className === "string" ? el.className : ""} ${el.getAttribute("aria-label") || ""} ${el.getAttribute("title") || ""}`.toLowerCase();
  if (/(cookie|consent|login|sign[- ]?in|checkout|payment|captcha|verification|verify|cart)/i.test(meta)) return false;
  return true;
}
function looksLikeAd(el) {
  if (!safeToHide(el)) return false;
  try {
    if (el.matches('ins.adsbygoogle,[data-ad],[data-ad-slot],[data-google-query-id],[aria-label*="advertisement" i],[id^="ad-" i],[id*="-ad-" i],[class~="ad"],[class*=" ad-" i],[class*="advert" i],[id*="advert" i],[class*="sponsor" i],[id*="sponsor" i],iframe[src*="doubleclick" i],iframe[src*="googlesyndication" i]')) return true;
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const z = Number.parseInt(cs.zIndex, 10) || 0;
    const text = `${el.getAttribute("aria-label") || ""} ${el.textContent || ""}`.slice(0,220).toLowerCase();
    const popupish = ["fixed","sticky"].includes(cs.position) && z >= 20 && rect.width > 80 && rect.height > 40 && rect.width * rect.height < innerWidth * innerHeight * .55;
    return popupish && /\b(ad|advertisement|sponsored|promoted)\b/i.test(text);
  } catch { return false; }
}
function hideFocusItem(el) {
  if (!(el instanceof HTMLElement) || el.hasAttribute(FOCUS_HIDDEN)) return;
  el.setAttribute(FOCUS_HIDDEN, el.style.display || "__empty__");
  el.style.setProperty("display", "none", "important");
}
function scanFocusShield(root = document) {
  if (!activeConfig?.focusShield) return;
  const selector = 'ins.adsbygoogle,[data-ad],[data-ad-slot],[data-google-query-id],[aria-label*="advertisement" i],[id^="ad-" i],[id*="-ad-" i],[class~="ad"],[class*=" ad-" i],[class*="advert" i],[id*="advert" i],[class*="sponsor" i],[id*="sponsor" i],iframe[src*="doubleclick" i],iframe[src*="googlesyndication" i]';
  if (root instanceof Element && looksLikeAd(root)) hideFocusItem(root);
  root.querySelectorAll?.(selector).forEach(el => { if (looksLikeAd(el)) hideFocusItem(el); });
}
function clearFocusShield() {
  document.querySelectorAll?.(`[${FOCUS_HIDDEN}]`).forEach(el => {
    const prev = el.getAttribute(FOCUS_HIDDEN);
    if (prev === "__empty__") el.style.removeProperty("display"); else el.style.display = prev || "";
    el.removeAttribute(FOCUS_HIDDEN);
  });
}

function startEnforcement() {
  if (!domObserver) {
    domObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;
          stopMedia(node); scanPlaceholders(node); applySafeFontFallbacks(node); scanFocusShield(node);
        }
      }
      cancelMotion();
    });
    domObserver.observe(document.documentElement || document, { childList: true, subtree: true });
  }
  document.addEventListener("play", mediaEventGuard, true);
  document.addEventListener("playing", mediaEventGuard, true);
  if (!enforcementTimer) enforcementTimer = setInterval(() => {
    stopMedia(document); cancelMotion(); scanPlaceholders(document); scanFocusShield(document);
  }, 700);
}
function stopEnforcement() {
  domObserver?.disconnect(); domObserver = null;
  document.removeEventListener("play", mediaEventGuard, true);
  document.removeEventListener("playing", mediaEventGuard, true);
  if (enforcementTimer) clearInterval(enforcementTimer); enforcementTimer = null;
}

function buildRuntimeCss(config = {}) {
  const chunks = [];
  const motionLevel = config.motionLevel || (config.reduceMotion ? "reduce" : "none");
  if (motionLevel === "freeze") chunks.push(`
    html[data-weblite="on"] *, html[data-weblite="on"] *::before, html[data-weblite="on"] *::after {
      animation: none !important; animation-duration: 0s !important; animation-delay: 0s !important;
      animation-iteration-count: 1 !important; animation-play-state: paused !important;
      transition: none !important; transition-duration: 0s !important; transition-delay: 0s !important;
      scroll-behavior: auto !important;
    }
  `);
  else if (motionLevel === "reduce") chunks.push(`
    html[data-weblite="on"] { scroll-behavior:auto !important; }
  `);
  chunks.push(`
    .weblite-load-placeholder{box-sizing:border-box!important;min-width:80px!important;min-height:48px!important;align-items:center!important;justify-content:center!important;gap:9px!important;padding:10px!important;border:1px solid rgba(65,122,165,.38)!important;border-radius:12px!important;background:linear-gradient(135deg,rgba(247,243,234,.96),rgba(227,238,246,.96))!important;color:#17344b!important;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Arial,sans-serif!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.45)!important;overflow:hidden!important;vertical-align:middle!important;}
    .weblite-ph-mark{display:grid!important;place-items:center!important;width:28px!important;height:28px!important;flex:0 0 auto!important;border-radius:9px!important;background:#346f9c!important;color:#fffaf0!important;font-size:9px!important;font-weight:900!important;letter-spacing:-.03em!important;}
    .weblite-ph-copy{display:flex!important;flex-direction:column!important;gap:1px!important;min-width:0!important;flex:1!important;line-height:1.2!important;}
    .weblite-ph-copy b{font-size:11px!important;color:#17344b!important;font-weight:800!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
    .weblite-ph-copy small{font-size:8px!important;color:#647b8e!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
    .weblite-load-placeholder button{appearance:none!important;border:1px solid rgba(52,111,156,.35)!important;border-radius:999px!important;background:#fffaf0!important;color:#245f8d!important;padding:6px 9px!important;font:700 9px/1 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Arial,sans-serif!important;cursor:pointer!important;white-space:nowrap!important;}
    .weblite-load-placeholder button:hover{background:#e9f2f8!important;}
    .weblite-load-placeholder button:disabled{opacity:.65!important;cursor:wait!important;}
    .weblite-media-card{padding:0!important;background:linear-gradient(145deg,rgba(8,23,37,.96),rgba(19,43,63,.96))!important;border-color:rgba(106,166,205,.4)!important;min-height:96px!important;}
    .weblite-media-play{width:100%!important;height:100%!important;min-height:96px!important;border:0!important;border-radius:12px!important;background:transparent!important;color:#f8f3e9!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:12px!important;padding:16px!important;cursor:pointer!important;}
    .weblite-media-play:hover{background:rgba(106,166,205,.08)!important;}
    .weblite-play-icon{width:46px!important;height:46px!important;border-radius:50%!important;display:grid!important;place-items:center!important;padding-left:3px!important;background:linear-gradient(135deg,#6aa6cd,#397bac)!important;color:#fff!important;font-size:18px!important;box-shadow:0 8px 24px rgba(57,123,172,.32)!important;}
    .weblite-play-copy{display:flex!important;flex-direction:column!important;align-items:flex-start!important;gap:3px!important;text-align:left!important;}
    .weblite-play-copy b{font:800 12px/1.1 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Arial,sans-serif!important;color:#fff!important;}
    .weblite-play-copy small{font:600 8px/1.2 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Arial,sans-serif!important;color:#9fb7ca!important;}
    html[data-weblite="on"] code, html[data-weblite="on"] pre, html[data-weblite="on"] kbd, html[data-weblite="on"] samp{font-family:ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace!important;}
  `);
  return chunks.join("\n");
}

function applyLitePageTweaks(config = {}) {
  activeConfig = { motionLevel: "none", ...config };
  const root = ensureRoot(); if (!root) { setTimeout(() => applyLitePageTweaks(config), 0); return; }
  setGuardState(activeConfig);
  let style = document.getElementById(STYLE_ID);
  if (!style) { style = document.createElement("style"); style.id = STYLE_ID; (document.head || root).appendChild(style); }
  style.textContent = buildRuntimeCss(activeConfig);
  stopMedia(document); cancelMotion(); applySafeFontFallbacks(document); scanPlaceholders(document); scanFocusShield(document); startEnforcement();
}
function removeLitePageTweaks() {
  activeConfig = null; clearGuardState(); document.getElementById(STYLE_ID)?.remove(); stopEnforcement(); clearPlaceholders(); clearFontFallbacks(); clearFocusShield();
}

function resourceKind(entry) {
  const type = String(entry.initiatorType || "").toLowerCase();
  const name = String(entry.name || "").toLowerCase();
  if (type === "img" || type === "image") return "image";
  if (type === "video" || type === "audio" || /\.(mp4|webm|m4v|mov|mp3|m4a|aac|ogg|ogv|wav|flac|m3u8|mpd|m4s|ts)(\?|#|$)/i.test(name)) return "media";
  if (type === "css" || type === "link") return "css";
  if (type === "script") return "script";
  if (type === "font" || /\.(woff2?|ttf|otf|eot)(\?|#|$)/i.test(name)) return "font";
  if (type === "iframe" || type === "frame") return "frame";
  return "other";
}
function observedBytes(entry) {
  const transfer = Number(entry.transferSize || 0); if (Number.isFinite(transfer) && transfer > 0) return transfer;
  const encoded = Number(entry.encodedBodySize || 0); if (Number.isFinite(encoded) && encoded > 0) return encoded;
  return 0;
}
function resourceBreakdown(entries) {
  const result = {image:{count:0,bytes:0},media:{count:0,bytes:0},font:{count:0,bytes:0},script:{count:0,bytes:0},css:{count:0,bytes:0},frame:{count:0,bytes:0},other:{count:0,bytes:0}};
  for (const entry of entries) { const kind = resourceKind(entry); result[kind].count += 1; result[kind].bytes += observedBytes(entry); }
  return result;
}
function makePageKey(url = location.href) { try { const u = new URL(url); let path=u.pathname||"/"; if(path.length>1)path=path.replace(/\/+$/,""); return `${u.origin}${path}`; } catch { return url; } }
function getPageStats() {
  const navigation = performance.getEntriesByType("navigation");
  const resources = performance.getEntriesByType("resource");
  const entries = [...navigation, ...resources];
  const transferBytes = entries.reduce((s,e)=>s+(Number(e.transferSize||0)||0),0);
  const measuredBytes = entries.reduce((s,e)=>s+observedBytes(e),0);
  const decodedBytes = entries.reduce((s,e)=>s+(Number(e.decodedBodySize||0)||0),0);
  const thirdPartyEntries = resources.filter(e=>isCrossSite(e.name));
  const nav = navigation[0];
  return {
    transferBytes, measuredBytes, decodedBytes, requestCount: resources.length,
    thirdPartyCount: thirdPartyEntries.length,
    thirdPartyMeasuredBytes: thirdPartyEntries.reduce((s,e)=>s+observedBytes(e),0),
    imageCount: document.images?.length || 0, mediaCount: document.querySelectorAll("video,audio").length,
    frameCount: document.querySelectorAll("iframe").length, domNodes: document.getElementsByTagName("*").length,
    fontFaceCount: document.fonts?.size || 0, breakdown: resourceBreakdown(resources), title: document.title,
    url: location.href, pageKey: makePageKey(), readyState: document.readyState, timeOrigin: performance.timeOrigin,
    elapsedMs: Math.max(0,performance.now()), loadMs: nav?.loadEventEnd>0?Math.round(nav.loadEventEnd):null
  };
}
function reportStatsSoon(delay = 900) {
  if (reportTimer) clearTimeout(reportTimer);
  reportTimer = setTimeout(async()=>{ try { await EXT.runtime.sendMessage({type:"REPORT_PAGE_STATS",stats:getPageStats()}); } catch {} },delay);
}

EXT.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_PAGE_STATS") { sendResponse(getPageStats()); return; }
  if (message.type === "GET_PAGE_CONTEXT") {
    const main = document.querySelector("main,article,[role='main']") || document.body;
    const parts = [];
    main?.querySelectorAll?.("h1,h2,h3,p,li").forEach(el => {
      const text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
      if (text && text.length > 20) parts.push(text);
    });
    sendResponse({
      title: document.title,
      url: location.href,
      text: parts.join("\n").slice(0, 14000),
      headings: [...document.querySelectorAll("h1,h2,h3")].map(el => (el.innerText || "").trim()).filter(Boolean).slice(0, 20),
      stats: getPageStats()
    });
    return;
  }
  if (message.type === "APPLY_LITE_TWEAKS") { applyLitePageTweaks(message.config || {}); sendResponse({ok:true}); return; }
  if (message.type === "REMOVE_LITE_TWEAKS") { removeLitePageTweaks(); sendResponse({ok:true}); return; }
});

(async function initializeFromBackground(){
  try { const response = await EXT.runtime.sendMessage({type:"CONTENT_READY"}); if(response?.enabled) applyLitePageTweaks(response.config || {}); } catch {}
  if (window.top === window) {
    if (document.readyState === "complete") reportStatsSoon(500);
    else window.addEventListener("load",()=>reportStatsSoon(1000),{once:true});
  }
})();
})();
