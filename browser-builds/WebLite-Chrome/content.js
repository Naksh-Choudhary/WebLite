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
  const configured = config.motionLevel || (config.reduceMotion ? "reduce" : "none");
  if (configured !== "reduce") return configured;
  try {
    const animationCount = document.getAnimations?.().length || 0;
    const visualEngines = document.querySelectorAll?.("video, canvas").length || 0;
    if (animationCount >= 5 || visualEngines >= 3) return "freeze";
  } catch {}
  return "reduce";
}

function setGuardState(config = {}) {
  const root = ensureRoot(); if (!root) return;
  root.dataset.weblite = "on";
  root.dataset.webliteMedia = (config.media || config.pauseAutoplay) ? "1" : "0";
  root.dataset.webliteFonts = config.fonts ? "1" : "0";
  root.dataset.webliteMotion = resolvedMotionLevel(config);
}
function clearGuardState() {
  const root = ensureRoot(); if (!root) return;
  delete root.dataset.weblite; delete root.dataset.webliteMedia;
  delete root.dataset.webliteFonts; delete root.dataset.webliteMotion;
}

function pauseOneMedia(media) {
  if (!(media instanceof HTMLMediaElement) || media.dataset.webliteAllowOnce === "1") return;
  try { media.autoplay = false; media.removeAttribute("autoplay"); media.preload = "none"; media.pause(); } catch {}
}
function stopMedia(root = document) {
  if (!(activeConfig?.media || activeConfig?.pauseAutoplay)) return;
  if (root instanceof HTMLMediaElement) pauseOneMedia(root);
  root.querySelectorAll?.("video, audio").forEach(pauseOneMedia);
}
function cancelMotion() {
  const level = resolvedMotionLevel(activeConfig || {});
  const root = ensureRoot(); if (root && activeConfig) root.dataset.webliteMotion = level;
  if (level === "none") return;
  try { document.getAnimations?.().forEach(a => { try { a.cancel(); } catch { try { a.pause(); } catch {} } }); } catch {}
}
function mediaEventGuard(event) {
  if (!(activeConfig?.media || activeConfig?.pauseAutoplay)) return;
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
      try { el.preload = "auto"; el.load(); await el.play(); } catch {}
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
  holder.className = "weblite-load-placeholder";
  holder.setAttribute(PLACEHOLDER_ATTR, id);
  holder.dataset.kind = kind;
  holder.style.width = `${size.width}px`;
  holder.style.height = `${size.height}px`;
  holder.style.maxWidth = "100%";
  if (size.display === "inline" || size.display === "inline-block") holder.style.display = "inline-flex";
  const [title, action] = placeholderLabel(kind);
  holder.innerHTML = `<span class="weblite-ph-mark">WL</span><span class="weblite-ph-copy"><b>${title}</b><small>WebLite saved this resource.</small></span><button type="button">${action}</button>`;
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
  if (!activeConfig?.fonts) return;
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

function startEnforcement() {
  if (!domObserver) {
    domObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;
          stopMedia(node); scanPlaceholders(node); applySafeFontFallbacks(node);
        }
      }
      cancelMotion();
    });
    domObserver.observe(document.documentElement || document, { childList: true, subtree: true });
  }
  document.addEventListener("play", mediaEventGuard, true);
  document.addEventListener("playing", mediaEventGuard, true);
  if (!enforcementTimer) enforcementTimer = setInterval(() => {
    stopMedia(document); cancelMotion(); scanPlaceholders(document);
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
  if (motionLevel !== "none") chunks.push(`
    html[data-weblite="on"] *, html[data-weblite="on"] *::before, html[data-weblite="on"] *::after {
      animation: none !important; animation-duration: 0s !important; animation-delay: 0s !important;
      animation-iteration-count: 1 !important; animation-play-state: paused !important;
      transition: none !important; transition-duration: 0s !important; transition-delay: 0s !important;
      scroll-behavior: auto !important;
    }
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
  stopMedia(document); cancelMotion(); applySafeFontFallbacks(document); scanPlaceholders(document); startEnforcement();
}
function removeLitePageTweaks() {
  activeConfig = null; clearGuardState(); document.getElementById(STYLE_ID)?.remove(); stopEnforcement(); clearPlaceholders(); clearFontFallbacks();
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
