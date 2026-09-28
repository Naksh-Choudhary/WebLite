const EXT = globalThis.browser || globalThis.chrome;
const DEFAULT_SESSION = { nextRuleId: 1, tabs: {} };

const DEFAULT_SETTINGS = {
  defaultMode: "balanced",
  theme: "system",
  accent: "ivorian",
  showBadge: true,
  rememberSiteMode: true,
  customConfig: {
    images: "none",
    media: true,
    fonts: true,
    frames: "thirdParty",
    motionLevel: "reduce",
    pauseAutoplay: true,
    focusShield: false
  },
  siteModes: {}
};

const DEFAULT_STATS = {
  pagesOptimized: 0,
  measuredBytesSaved: 0,
  requestsSaved: 0,
  bestSavingPercent: 0
};

const PRESETS = {
  balanced: {
    images: "none",
    media: true,
    fonts: true,
    frames: "thirdParty",
    motionLevel: "reduce",
    pauseAutoplay: true,
    focusShield: false
  },
  study: {
    images: "thirdParty",
    media: true,
    fonts: false,
    frames: "thirdParty",
    motionLevel: "reduce",
    pauseAutoplay: true,
    focusShield: true
  },
  saver: {
    images: "thirdParty",
    media: true,
    fonts: true,
    frames: "all",
    motionLevel: "freeze",
    pauseAutoplay: true,
    focusShield: true
  },
  ultra: {
    images: "all",
    media: true,
    fonts: true,
    frames: "all",
    motionLevel: "freeze",
    pauseAutoplay: true,
    focusShield: true
  }
};

const MEDIA_REGEX = "^https?://.*\\.(?:mp4|webm|m4v|mov|mp3|m4a|aac|ogg|ogv|wav|flac|m3u8|mpd|m4s|ts)(?:[?#].*)?$";

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function pageKey(url) {
  try {
    const u = new URL(url);
    let path = u.pathname || "/";
    if (path.length > 1) path = path.replace(/\/+$/, "");
    return `${u.origin}${path}`;
  } catch { return url || ""; }
}

function getHost(url) {
  try { return new URL(url).hostname.toLowerCase(); }
  catch { return ""; }
}

async function getSession() {
  const data = await EXT.storage.session.get("webLiteSession");
  return data.webLiteSession || clone(DEFAULT_SESSION);
}

async function setSession(state) { await EXT.storage.session.set({ webLiteSession: state }); }

async function getSettings() {
  const data = await EXT.storage.local.get("webLiteSettings");
  const saved = data.webLiteSettings || {};
  const legacyAccents = { green: "sage", blue: "ocean", purple: "lavender", orange: "ivorian" };
  const accent = legacyAccents[saved.accent] || saved.accent || DEFAULT_SETTINGS.accent;
  const legacyCustom = saved.customConfig || {};
  const motionLevel = legacyCustom.motionLevel || (legacyCustom.reduceMotion === false ? "none" : "reduce");
  return {
    ...clone(DEFAULT_SETTINGS),
    ...saved,
    accent,
    customConfig: {
      ...clone(DEFAULT_SETTINGS.customConfig),
      ...legacyCustom,
      motionLevel
    },
    siteModes: { ...(saved.siteModes || {}) }
  };
}

async function setSettings(settings) { await EXT.storage.local.set({ webLiteSettings: settings }); }

async function getStats() {
  const data = await EXT.storage.local.get("webLiteStats");
  return { ...clone(DEFAULT_STATS), ...(data.webLiteStats || {}) };
}

async function setStats(stats) { await EXT.storage.local.set({ webLiteStats: stats }); }

function configFor(mode, customConfig, url = "") {
  const config = mode === "custom"
    ? { ...clone(DEFAULT_SETTINGS.customConfig), ...(customConfig || {}) }
    : clone(PRESETS[mode] || PRESETS.balanced);

  // Compatibility guard for animation-heavy Apple product pages.
  // Balanced/Study should remain usable rather than freezing sliders or typography.
  const host = getHost(url);
  if ((host === "apple.com" || host.endsWith(".apple.com")) && (mode === "balanced" || mode === "study")) {
    config.fonts = false;
    config.motionLevel = "none";
  }
  return config;
}

function ruleCondition(tabId, resourceTypes, scope = "all", extra = {}) {
  const condition = { tabIds: [tabId], resourceTypes, ...extra };
  if (scope === "thirdParty") condition.domainType = "thirdParty";
  return condition;
}

function buildRules(tabId, config, state) {
  const rules = [];
  const ids = [];
  const add = (condition) => {
    const id = state.nextRuleId++;
    rules.push({ id, priority: 1, action: { type: "block" }, condition });
    ids.push(id);
  };

  if (config.media) {
    add(ruleCondition(tabId, ["media"]));
    add(ruleCondition(tabId, ["xmlhttprequest", "other", "media"], "all", { regexFilter: MEDIA_REGEX }));
  }
  if (config.fonts) add(ruleCondition(tabId, ["font"]));
  if (config.frames && config.frames !== "none") add(ruleCondition(tabId, ["sub_frame"], config.frames));
  if (config.images && config.images !== "none") add(ruleCondition(tabId, ["image"], config.images));

  return { rules, ids };
}


function safeUrlFilter(url) {
  const value = String(url || "");
  if (!/^https?:/i.test(value)) return "";
  // DNR urlFilter is substring based. Keeping the complete normal URL makes
  // a user-selected image/frame exception narrow without fragile regex escaping.
  return value.length > 1800 ? value.slice(0, 1800) : value;
}

async function allowResourceOnce(tabId, kind, url) {
  const state = await getSession();
  const key = String(tabId);
  const tabState = state.tabs[key];
  if (!tabState?.enabled) return { ok: false, error: "WebLite is not active on this tab." };

  const rules = [];
  const ids = [];
  const addAllow = (condition) => {
    const id = state.nextRuleId++;
    ids.push(id);
    rules.push({ id, priority: 100, action: { type: "allow" }, condition });
  };

  if (kind === "image") {
    const filter = safeUrlFilter(url);
    if (!filter) return { ok: false, error: "This image cannot be reloaded directly." };
    addAllow(ruleCondition(tabId, ["image"], "all", { urlFilter: filter }));
  } else if (kind === "frame") {
    const filter = safeUrlFilter(url);
    if (!filter) return { ok: false, error: "This embed cannot be reloaded directly." };
    addAllow(ruleCondition(tabId, ["sub_frame"], "all", { urlFilter: filter }));
  } else if (kind === "media") {
    // Streaming video commonly uses MediaSource + XHR chunks. A temporary
    // per-tab allow is more reliable than allowing only the <video> URL.
    addAllow(ruleCondition(tabId, ["media"]));
    addAllow(ruleCondition(tabId, ["xmlhttprequest", "other", "media"], "all", { regexFilter: MEDIA_REGEX }));
  } else {
    return { ok: false, error: "Unknown resource type." };
  }

  await EXT.declarativeNetRequest.updateSessionRules({ addRules: rules, removeRuleIds: [] });
  tabState.tempRuleIds = [...(tabState.tempRuleIds || []), ...ids];
  state.tabs[key] = tabState;
  await setSession(state);
  return { ok: true, ruleIds: ids };
}

async function clearTemporaryAllows(tabId, state = null) {
  const session = state || await getSession();
  const tabState = session.tabs[String(tabId)];
  const ids = Array.isArray(tabState?.tempRuleIds) ? tabState.tempRuleIds : [];
  if (ids.length) {
    try { await EXT.declarativeNetRequest.updateSessionRules({ removeRuleIds: ids }); } catch {}
    tabState.tempRuleIds = [];
    session.tabs[String(tabId)] = tabState;
    await setSession(session);
  }
}

async function updateBadge(tabId, enabled, mode) {
  const settings = await getSettings();
  if (!enabled || !settings.showBadge) {
    await EXT.action.setBadgeText({ tabId, text: "" });
    return;
  }
  const label = mode === "ultra" ? "MAX" : mode === "saver" ? "SAVE" : mode === "study" ? "STDY" : mode === "custom" ? "C" : "LITE";
  await EXT.action.setBadgeText({ tabId, text: label });
  await EXT.action.setBadgeBackgroundColor({ tabId, color: "#397bac" });
  if (typeof EXT.action.setBadgeTextColor === "function") {
    try { await EXT.action.setBadgeTextColor({ tabId, color: "#fffaf0" }); } catch {}
  }
}

async function applyMode(tabId, { enabled, mode, baseline, customConfig, cookieActivityBaseline, url }) {
  const state = await getSession();
  const key = String(tabId);
  const previous = state.tabs[key] || {};
  const removeRuleIds = [
    ...(Array.isArray(previous.ruleIds) ? previous.ruleIds : []),
    ...(Array.isArray(previous.tempRuleIds) ? previous.tempRuleIds : [])
  ];
  let addRules = [];
  let ruleIds = [];

  const effectiveMode = mode || previous.mode || "balanced";
  const effectiveCustom = customConfig || previous.customConfig || clone(DEFAULT_SETTINGS.customConfig);
  const config = configFor(effectiveMode, effectiveCustom, url || previous.url || "");

  if (enabled) {
    const built = buildRules(tabId, config, state);
    addRules = built.rules;
    ruleIds = built.ids;
  }

  await EXT.declarativeNetRequest.updateSessionRules({ removeRuleIds, addRules });

  state.tabs[key] = {
    enabled: Boolean(enabled),
    mode: effectiveMode,
    customConfig: effectiveCustom,
    config,
    ruleIds,
    tempRuleIds: [],
    baseline: baseline !== undefined ? baseline : (previous.baseline || null),
    cookieActivityBaseline: cookieActivityBaseline !== undefined ? cookieActivityBaseline : (previous.cookieActivityBaseline || 0),
    url: url || previous.url || "",
    lastComparison: enabled ? (previous.lastComparison || null) : null,
    lastRecordedTimeOrigin: enabled ? (previous.lastRecordedTimeOrigin || null) : null
  };

  await setSession(state);
  await updateBadge(tabId, enabled, effectiveMode);
  return state.tabs[key];
}

async function rememberSiteMode(url, mode, customConfig) {
  const host = getHost(url);
  if (!host) return;
  const settings = await getSettings();
  if (!settings.rememberSiteMode) return;
  settings.siteModes = settings.siteModes || {};
  settings.siteModes[host] = { mode, customConfig };
  await setSettings(settings);
}

async function getSuggestedModeForUrl(url) {
  const settings = await getSettings();
  const host = getHost(url);
  const site = settings.rememberSiteMode && host ? settings.siteModes?.[host] : null;
  return {
    mode: site?.mode || settings.defaultMode || "balanced",
    customConfig: site?.customConfig || settings.customConfig || clone(DEFAULT_SETTINGS.customConfig)
  };
}

async function recordComparison(tabId, stats) {
  const session = await getSession();
  const key = String(tabId);
  const tabState = session.tabs[key];
  if (!tabState?.enabled || !tabState.baseline || !stats) return;
  if (tabState.lastRecordedTimeOrigin === stats.timeOrigin) return;
  if (pageKey(tabState.baseline.url || "") !== pageKey(stats.url || "")) return;

  const baselineBytes = Number(tabState.baseline.measuredBytes ?? tabState.baseline.transferBytes ?? 0);
  const currentBytes = Number(stats.measuredBytes ?? stats.transferBytes ?? 0);
  const bytesSaved = Math.max(0, baselineBytes - currentBytes);
  const requestsSaved = Math.max(0, Number(tabState.baseline.requestCount || 0) - Number(stats.requestCount || 0));
  const savingPercent = baselineBytes > 0 ? Math.max(0, Math.min(100, Math.round((bytesSaved / baselineBytes) * 100))) : 0;

  tabState.lastComparison = {
    bytesSaved,
    requestsSaved,
    savingPercent,
    measuredAt: Date.now(),
    url: stats.url
  };
  tabState.lastRecordedTimeOrigin = stats.timeOrigin;
  await setSession(session);

  const allTime = await getStats();
  allTime.pagesOptimized += 1;
  allTime.measuredBytesSaved += bytesSaved;
  allTime.requestsSaved += requestsSaved;
  allTime.bestSavingPercent = Math.max(allTime.bestSavingPercent || 0, savingPercent);
  await setStats(allTime);
}

// ---- Cookie telemetry -------------------------------------------------------
// Values are never returned. We only count cookies + change events.
async function getCookieActivityMap() {
  const data = await EXT.storage.session.get("webLiteCookieActivity");
  return data.webLiteCookieActivity || {};
}

async function getCookieActivityForHost(host) {
  if (!host) return 0;
  const map = await getCookieActivityMap();
  let total = 0;
  for (const [domain, count] of Object.entries(map)) {
    if (host === domain || host.endsWith(`.${domain}`)) total += Number(count || 0);
  }
  return total;
}

EXT.cookies.onChanged.addListener(async ({ cookie }) => {
  try {
    const domain = String(cookie?.domain || "").replace(/^\./, "").toLowerCase();
    if (!domain) return;
    const map = await getCookieActivityMap();
    map[domain] = Number(map[domain] || 0) + 1;
    await EXT.storage.session.set({ webLiteCookieActivity: map });
  } catch {}
});

async function cookieStatsForUrl(url) {
  if (!/^https?:/i.test(url || "")) return { count: 0, httpOnly: 0, secure: 0, session: 0, activity: 0 };
  const cookies = await EXT.cookies.getAll({ url });
  const host = getHost(url);
  return {
    count: cookies.length,
    httpOnly: cookies.filter(c => c.httpOnly).length,
    secure: cookies.filter(c => c.secure).length,
    session: cookies.filter(c => c.session).length,
    activity: await getCookieActivityForHost(host)
  };
}

EXT.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message.type === "CONTENT_READY") {
      const tabId = sender.tab?.id;
      if (tabId == null) return sendResponse({ enabled: false, mode: "balanced" });
      const session = await getSession();
      const tabState = session.tabs[String(tabId)];
      sendResponse({
        enabled: Boolean(tabState?.enabled),
        mode: tabState?.mode || "balanced",
        config: tabState?.config || configFor(tabState?.mode || "balanced", tabState?.customConfig, tabState?.url || "")
      });
      return;
    }

    if (message.type === "GET_TAB_STATE") {
      const session = await getSession();
      const existing = session.tabs[String(message.tabId)];
      if (existing) return sendResponse(existing);
      const suggested = await getSuggestedModeForUrl(message.url || "");
      sendResponse({
        enabled: false,
        mode: suggested.mode,
        customConfig: suggested.customConfig,
        config: configFor(suggested.mode, suggested.customConfig, message.url || ""),
        ruleIds: [],
        tempRuleIds: [],
        baseline: null,
        cookieActivityBaseline: 0,
        lastComparison: null
      });
      return;
    }

    if (message.type === "SET_LITE_MODE") {
      const tabState = await applyMode(message.tabId, {
        enabled: message.enabled,
        mode: message.mode,
        baseline: message.baseline,
        customConfig: message.customConfig,
        cookieActivityBaseline: message.cookieActivityBaseline,
        url: message.url
      });
      if (message.url && message.rememberMode) await rememberSiteMode(message.url, tabState.mode, tabState.customConfig);
      sendResponse({ ok: true, tabState });
      return;
    }

    if (message.type === "ALLOW_RESOURCE_ONCE") {
      const tabId = sender.tab?.id;
      if (tabId == null) return sendResponse({ ok: false, error: "No tab available." });
      sendResponse(await allowResourceOnce(tabId, message.kind, message.url));
      return;
    }

    if (message.type === "GET_COOKIE_STATS") {
      sendResponse(await cookieStatsForUrl(message.url || ""));
      return;
    }

    if (message.type === "ENSURE_SCRIPTS") {
      const tabId = Number(message.tabId);
      if (!Number.isInteger(tabId)) throw new Error("Invalid tab.");
      try {
        await EXT.scripting.executeScript({ target: { tabId, allFrames: true }, files: ["page-guard.js"], world: "MAIN" });
      } catch {}
      try {
        await EXT.scripting.executeScript({ target: { tabId, allFrames: true }, files: ["content.js"], world: "ISOLATED" });
      } catch {}
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "GET_SETTINGS") {
      sendResponse(await getSettings());
      return;
    }

    if (message.type === "SAVE_SETTINGS") {
      const current = await getSettings();
      const next = { ...current, ...(message.settings || {}) };
      if (message.settings?.customConfig) next.customConfig = { ...current.customConfig, ...message.settings.customConfig };
      await setSettings(next);
      if (Object.prototype.hasOwnProperty.call(message.settings || {}, "showBadge")) {
        const session = await getSession();
        for (const [tabKey, tabState] of Object.entries(session.tabs)) {
          const tabId = Number(tabKey);
          if (Number.isInteger(tabId)) await updateBadge(tabId, Boolean(tabState.enabled), tabState.mode || "balanced");
        }
      }
      sendResponse({ ok: true, settings: next });
      return;
    }

    if (message.type === "GET_GLOBAL_STATS") {
      sendResponse(await getStats());
      return;
    }

    if (message.type === "RESET_GLOBAL_STATS") {
      await setStats(clone(DEFAULT_STATS));
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "REPORT_PAGE_STATS") {
      const tabId = sender.tab?.id;
      if (tabId != null) await recordComparison(tabId, message.stats);
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "OPEN_TUTORIAL") {
      await EXT.tabs.create({ url: EXT.runtime.getURL("tutorial.html") });
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "OPEN_SETTINGS") {
      await EXT.runtime.openOptionsPage();
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "OPEN_ASSISTANT") {
      await EXT.tabs.create({ url: EXT.runtime.getURL("assistant.html") });
      sendResponse({ ok: true });
      return;
    }
  })().catch((error) => {
    console.error("WebLite background error:", error);
    sendResponse({ ok: false, error: error.message });
  });
  return true;
});

EXT.tabs.onRemoved.addListener(async (tabId) => {
  try {
    const state = await getSession();
    const key = String(tabId);
    const tabState = state.tabs[key];
    if (!tabState) return;
    const allRules = [...(tabState.ruleIds || []), ...(tabState.tempRuleIds || [])];
    if (allRules.length) await EXT.declarativeNetRequest.updateSessionRules({ removeRuleIds: allRules });
    delete state.tabs[key];
    await setSession(state);
  } catch (error) { console.error("WebLite cleanup error:", error); }
});

EXT.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  try {
    const state = await getSession();
    const tabState = state.tabs[String(tabId)];
    if (!tabState) return;

    if (changeInfo.status === "loading" && tabState.tempRuleIds?.length) {
      try { await EXT.declarativeNetRequest.updateSessionRules({ removeRuleIds: tabState.tempRuleIds }); } catch {}
      tabState.tempRuleIds = [];
    }

    if (changeInfo.url && tabState.baseline && pageKey(changeInfo.url) !== pageKey(tabState.baseline.url || "")) {
      tabState.baseline = null;
      tabState.lastComparison = null;
      tabState.lastRecordedTimeOrigin = null;
    }
    state.tabs[String(tabId)] = tabState;
    await setSession(state);
  } catch (error) { console.error("WebLite navigation state error:", error); }
});

EXT.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-weblite") return;
  try {
    const [tab] = await EXT.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https?:/i.test(tab.url || "")) return;
    const session = await getSession();
    const existing = session.tabs[String(tab.id)];

    if (existing?.enabled) {
      await applyMode(tab.id, { enabled: false, mode: existing.mode, customConfig: existing.customConfig, url: tab.url });
      await EXT.tabs.reload(tab.id);
      return;
    }

    const suggested = await getSuggestedModeForUrl(tab.url);
    let baseline = null;
    try { baseline = await EXT.tabs.sendMessage(tab.id, { type: "GET_PAGE_STATS" }, { frameId: 0 }); } catch {}
    const cookieStats = await cookieStatsForUrl(tab.url);

    await applyMode(tab.id, {
      enabled: true,
      mode: suggested.mode,
      customConfig: suggested.customConfig,
      baseline,
      cookieActivityBaseline: cookieStats.activity,
      url: tab.url
    });
    await EXT.tabs.reload(tab.id);
  } catch (error) { console.error("WebLite shortcut error:", error); }
});

EXT.runtime.onInstalled.addListener(async ({ reason }) => {
  const data = await EXT.storage.local.get(["webLiteSettings", "webLiteStats"]);
  if (!data.webLiteSettings) await setSettings(clone(DEFAULT_SETTINGS));
  if (!data.webLiteStats) await setStats(clone(DEFAULT_STATS));
  if (reason === "install") await EXT.tabs.create({ url: EXT.runtime.getURL("tutorial.html?welcome=1") });
});
