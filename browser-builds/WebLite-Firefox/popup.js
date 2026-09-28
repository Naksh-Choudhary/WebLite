const EXT = globalThis.browser || globalThis.chrome;
const $ = (id) => document.getElementById(id);

const PRESETS = {
  balanced:{images:"none",media:true,fonts:true,frames:"thirdParty",motionLevel:"reduce",pauseAutoplay:true,focusShield:false},
  study:{images:"thirdParty",media:true,fonts:false,frames:"thirdParty",motionLevel:"reduce",pauseAutoplay:true,focusShield:true},
  saver:{images:"thirdParty",media:true,fonts:true,frames:"all",motionLevel:"freeze",pauseAutoplay:true,focusShield:true},
  ultra:{images:"all",media:true,fonts:true,frames:"all",motionLevel:"freeze",pauseAutoplay:true,focusShield:true}
};

const MODE_HINTS = {
  balanced:"Keeps images and core interactions, but trims heavy extras.",
  study:"For study sessions: keeps typography safer, trims cross-site images/media, hides recognized ad clutter and reduces motion.",
  saver:"Stronger media, embed and Motion Shield controls for hotspot use.",
  ultra:"Maximum saving: blocks images and freezes scripted motion too.",
  custom:"Choose exactly what WebLite should keep, reduce or freeze."
};

const ACCENTS = {
  ivorian:["#6aa6cd","106,166,205","#397bac"],
  ocean:["#60a5fa","96,165,250","#2563a8"],
  lavender:["#a78bfa","167,139,250","#8067d5"],
  sage:["#69b89a","105,184,154","#3c8c70"]
};

let settings, activeTab, tabState, busy = false, liveTimer = null, scriptEnsured = false;

const toggle=$("liteToggle"), statusLabel=$("statusLabel"), hostLabel=$("hostLabel"), modeHint=$("modeHint"), presetSummary=$("presetSummary"), customDetails=$("customDetails");
const imagesSelect=$("imagesSelect"), mediaToggle=$("mediaToggle"), fontsToggle=$("fontsToggle"), framesSelect=$("framesSelect"), motionSelect=$("motionSelect"), autoplayToggle=$("autoplayToggle"), focusShieldToggle=$("focusShieldToggle"), rememberMode=$("rememberMode"), restoreButton=$("restoreButton"), errorBox=$("errorBox");

function formatBytes(bytes){
  const v=Math.max(0,Number(bytes||0));
  if(v<1024)return`${Math.round(v)} B`;
  if(v<1024**2)return`${(v/1024).toFixed(v<10240?1:0)} KB`;
  if(v<1024**3)return`${(v/1024**2).toFixed(v<10*1024**2?1:0)} MB`;
  return`${(v/1024**3).toFixed(2)} GB`;
}

function applyTheme(s){
  const [a,rgb,strong]=ACCENTS[s.accent]||ACCENTS.ivorian;
  document.documentElement.dataset.theme=s.theme||"system";
  document.documentElement.style.setProperty("--accent",a);
  document.documentElement.style.setProperty("--accent-rgb",rgb);
  document.documentElement.style.setProperty("--accent-strong",strong);
}

function showError(text){ errorBox.textContent=text; errorBox.classList.remove("hidden"); }
function clearError(){ errorBox.textContent=""; errorBox.classList.add("hidden"); }

function pageKey(url){
  try{
    const u=new URL(url); let p=u.pathname||"/"; if(p.length>1)p=p.replace(/\/+$/,""); return`${u.origin}${p}`;
  }catch{return url||"";}
}

function currentConfig(){
  if(tabState.mode!=="custom") return {...PRESETS[tabState.mode]};
  return {
    images:imagesSelect.value,
    media:mediaToggle.checked,
    fonts:fontsToggle.checked,
    frames:framesSelect.value,
    motionLevel:motionSelect.value,
    pauseAutoplay:autoplayToggle.checked,
    focusShield:focusShieldToggle.checked
  };
}

function fillCustomControls(config){
  const c={...settings.customConfig,...(config||{})};
  imagesSelect.value=c.images||"none";
  mediaToggle.checked=!!c.media;
  fontsToggle.checked=!!c.fonts;
  framesSelect.value=c.frames||"thirdParty";
  motionSelect.value=c.motionLevel||(c.reduceMotion===false?"none":"reduce");
  autoplayToggle.checked=!!c.pauseAutoplay;
  focusShieldToggle.checked=!!c.focusShield;
}

function renderPresetSummary(config){
  const items=[];
  if(config.media)items.push("Media guard");
  if(config.fonts)items.push("System fonts");
  if(config.frames==="thirdParty")items.push("3rd-party embeds");
  if(config.frames==="all")items.push("Embeds");
  if(config.images==="thirdParty")items.push("3rd-party images");
  if(config.images==="all")items.push("Images");
  if(config.motionLevel==="reduce")items.push("Less motion");
  if(config.motionLevel==="freeze")items.push("Motion Shield");
  if(config.focusShield)items.push("Focus Shield");
  presetSummary.innerHTML=(items.length?items:["Core page only"]).map(x=>`<span class="pill on">${x}</span>`).join("");
}

function renderState(){
  toggle.checked=!!tabState.enabled;
  statusLabel.textContent=tabState.enabled?`${tabState.mode==="ultra"?"Ultra":tabState.mode==="saver"?"Saver":tabState.mode==="study"?"Study":tabState.mode==="custom"?"Custom":"Balanced"} active`:"Normal browsing";
  restoreButton.disabled=!tabState.enabled;
  document.querySelectorAll(".mode-tab").forEach(b=>b.classList.toggle("active",b.dataset.mode===tabState.mode));
  modeHint.textContent=MODE_HINTS[tabState.mode]||MODE_HINTS.balanced;
  customDetails.classList.toggle("hidden",tabState.mode!=="custom");
  if(tabState.mode==="custom")customDetails.open=true;
  renderPresetSummary(tabState.mode==="custom"?currentConfig():PRESETS[tabState.mode]||PRESETS.balanced);
}

async function ensureScripts(){
  if(scriptEnsured||!activeTab?.id)return;
  try{ await EXT.runtime.sendMessage({type:"ENSURE_SCRIPTS",tabId:activeTab.id}); scriptEnsured=true; }catch{}
}

async function getPageStats(){
  try{return await EXT.tabs.sendMessage(activeTab.id,{type:"GET_PAGE_STATS"},{frameId:0});}
  catch{
    await ensureScripts();
    await new Promise(r=>setTimeout(r,40));
    try{return await EXT.tabs.sendMessage(activeTab.id,{type:"GET_PAGE_STATS"},{frameId:0});}catch{return null;}
  }
}

async function getCookieStats(url){
  try{return await EXT.runtime.sendMessage({type:"GET_COOKIE_STATS",url:url||activeTab?.url||""});}
  catch{return{count:0,httpOnly:0,secure:0,session:0,activity:0};}
}

function countOf(stats,key){
  const v=stats?.breakdown?.[key];
  return typeof v==="number"?v:Number(v?.count||0);
}

function renderLiveStats(stats,cookies){
  const observed=Number(stats?.measuredBytes??stats?.transferBytes??0);
  $("sizeNow").textContent=formatBytes(observed);
  $("requestsNow").textContent=String(stats?.requestCount||0);
  $("thirdPartyNow").textContent=String(stats?.thirdPartyCount||0);
  $("cookiesNow").textContent=String(cookies?.count||0);
  $("cookieProtected").textContent=String(cookies?.httpOnly||0);
  $("domNodes").textContent=String(stats?.domNodes||0);
  $("loadTime").textContent=stats?.loadMs!=null?`${stats.loadMs} ms`:"live";
  $("resImages").textContent=String(countOf(stats,"image"));
  $("resScripts").textContent=String(countOf(stats,"script"));
  $("resCss").textContent=String(countOf(stats,"css"));
  $("resFonts").textContent=String(countOf(stats,"font"));
  $("resMedia").textContent=String(countOf(stats,"media"));
  $("resFrames").textContent=String(stats?.frameCount||countOf(stats,"frame"));

  const cookieChanges=Math.max(0,Number(cookies?.activity||0)-Number(tabState.cookieActivityBaseline||0));
  $("cookieChanges").textContent=String(tabState.enabled?cookieChanges:0);

  const baseline=tabState.baseline;
  const comparable=!!(tabState.enabled&&baseline&&stats&&pageKey(baseline.url)===pageKey(stats.url));
  let saved=0,reqSaved=0,pct=0;

  if(comparable){
    const baseBytes=Number(baseline.measuredBytes??baseline.transferBytes??0);
    saved=Math.max(0,baseBytes-observed);
    reqSaved=Math.max(0,Number(baseline.requestCount||0)-Number(stats.requestCount||0));
    pct=baseBytes>0?Math.max(0,Math.min(100,Math.round(saved/baseBytes*100))):0;
    $("comparisonStatus").textContent=stats.readyState==="complete"?"compared with this page's normal load":"live estimate while this page is loading";
    $("baselineMessage").classList.add("hidden");
  }else if(tabState.enabled&&tabState.lastComparison&&pageKey(tabState.lastComparison.url)===pageKey(stats?.url||activeTab.url)){
    saved=Number(tabState.lastComparison.bytesSaved||0);
    reqSaved=Number(tabState.lastComparison.requestsSaved||0);
    pct=Number(tabState.lastComparison.savingPercent||0);
    $("comparisonStatus").textContent="last completed comparison for this page";
    $("baselineMessage").classList.add("hidden");
  }else{
    $("comparisonStatus").textContent=tabState.enabled?"waiting for a comparable normal baseline":"switch WebLite on to compare this page";
    if(tabState.enabled){
      $("baselineMessage").textContent="WebLite has live page data, but no normal baseline for this exact page yet. Restore Normal once and switch WebLite on again to create one.";
      $("baselineMessage").classList.remove("hidden");
    }else $("baselineMessage").classList.add("hidden");
  }

  $("bytesSaved").textContent=formatBytes(saved);
  $("savedPercent").textContent=`${pct}%`;
  $("requestsSaved").textContent=String(reqSaved);
  $("ringLabel").textContent=`${pct}%`;
  $("savingRing").style.setProperty("--p",pct);

  if(!stats) $("liveStatus").textContent="connecting";
  else if(stats.readyState==="complete") $("liveStatus").textContent="live";
  else $("liveStatus").textContent="loading live";
}

async function refreshGlobalStats(){
  const s=await EXT.runtime.sendMessage({type:"GET_GLOBAL_STATS"});
  $("totalSaved").textContent=formatBytes(s?.measuredBytesSaved||0);
  $("pagesOptimized").textContent=String(s?.pagesOptimized||0);
}

async function refreshLive(){
  const stats=await getPageStats();
  const cookies=await getCookieStats(stats?.url||activeTab?.url);
  renderLiveStats(stats,cookies);
}

async function applyModeChange({reload=true}={}){
  if(busy||!activeTab?.id)return;
  busy=true; clearError();
  try{
    const customConfig=tabState.mode==="custom"?currentConfig():tabState.customConfig;
    const r=await EXT.runtime.sendMessage({
      type:"SET_LITE_MODE",tabId:activeTab.id,enabled:tabState.enabled,mode:tabState.mode,
      customConfig,baseline:tabState.baseline,cookieActivityBaseline:tabState.cookieActivityBaseline,
      url:activeTab.url,rememberMode:rememberMode.checked
    });
    if(!r?.ok)throw new Error(r?.error||"Could not update WebLite.");
    tabState=r.tabState; renderState();
    if(reload){ await EXT.tabs.reload(activeTab.id); window.close(); }
  }catch(e){showError(e.message||"WebLite could not update this page.");}
  finally{busy=false;}
}

async function setEnabled(enabled){
  if(busy)return;
  clearError();
  try{
    busy=true;
    let baseline=tabState.baseline;
    let cookieActivityBaseline=tabState.cookieActivityBaseline||0;

    if(enabled){
      baseline=await getPageStats();
      if(!baseline)throw new Error("WebLite could not read this page yet. Refresh the page once, then try again.");
      const cookieStats=await getCookieStats(baseline.url||activeTab.url);
      cookieActivityBaseline=Number(cookieStats?.activity||0);
    }

    const r=await EXT.runtime.sendMessage({
      type:"SET_LITE_MODE",tabId:activeTab.id,enabled,mode:tabState.mode,
      customConfig:tabState.mode==="custom"?currentConfig():tabState.customConfig,
      baseline,cookieActivityBaseline,url:activeTab.url,rememberMode:rememberMode.checked
    });
    if(!r?.ok)throw new Error(r?.error||"Could not update WebLite.");
    tabState=r.tabState;
    await EXT.tabs.reload(activeTab.id);
    window.close();
  }catch(e){showError(e.message||"WebLite could not run on this page.");toggle.checked=!enabled;}
  finally{busy=false;}
}

async function chooseMode(mode){
  if(busy||mode===tabState.mode)return;
  tabState.mode=mode;
  if(mode==="custom")fillCustomControls(tabState.customConfig||settings.customConfig);
  renderState();
  if(tabState.enabled)await applyModeChange({reload:true});
  else if(rememberMode.checked)await EXT.runtime.sendMessage({type:"SET_LITE_MODE",tabId:activeTab.id,enabled:false,mode,customConfig:tabState.mode==="custom"?currentConfig():tabState.customConfig,baseline:tabState.baseline,cookieActivityBaseline:tabState.cookieActivityBaseline,url:activeTab.url,rememberMode:true});
}

async function onCustomChanged(){
  tabState.customConfig=currentConfig();
  renderPresetSummary(tabState.customConfig);
  await EXT.runtime.sendMessage({type:"SAVE_SETTINGS",settings:{customConfig:tabState.customConfig}});
  if(tabState.enabled)await applyModeChange({reload:true});
  else if(rememberMode.checked)await EXT.runtime.sendMessage({type:"SET_LITE_MODE",tabId:activeTab.id,enabled:false,mode:"custom",customConfig:tabState.customConfig,baseline:tabState.baseline,cookieActivityBaseline:tabState.cookieActivityBaseline,url:activeTab.url,rememberMode:true});
}

async function init(){
  clearError();
  settings=await EXT.runtime.sendMessage({type:"GET_SETTINGS"});
  applyTheme(settings);
  rememberMode.checked=!!settings.rememberSiteMode;
  const [tab]=await EXT.tabs.query({active:true,currentWindow:true});
  activeTab=tab;

  if(!tab?.id||!/^https?:/i.test(tab.url||"")){
    hostLabel.textContent="Protected browser page";
    statusLabel.textContent="WebLite unavailable here";
    showError("Chrome internal pages, the Chrome Web Store, and some protected pages cannot be modified by normal extensions.");
    toggle.disabled=true; restoreButton.disabled=true;
    document.querySelectorAll(".mode-tab,.custom-controls input,.custom-controls select").forEach(el=>el.disabled=true);
    return;
  }

  await ensureScripts();
  try{hostLabel.textContent=new URL(tab.url).hostname.replace(/^www\./,"");}catch{hostLabel.textContent="Current website";}
  tabState=await EXT.runtime.sendMessage({type:"GET_TAB_STATE",tabId:tab.id,url:tab.url});
  fillCustomControls(tabState.customConfig||settings.customConfig);
  renderState();
  await refreshLive();
  await refreshGlobalStats();
  liveTimer=setInterval(refreshLive,650);
}

toggle.addEventListener("change",()=>setEnabled(toggle.checked));
restoreButton.addEventListener("click",()=>{if(tabState.enabled)setEnabled(false);});
document.querySelectorAll(".mode-tab").forEach(b=>b.addEventListener("click",()=>chooseMode(b.dataset.mode)));
[imagesSelect,mediaToggle,fontsToggle,framesSelect,motionSelect,autoplayToggle,focusShieldToggle].forEach(el=>el.addEventListener("change",onCustomChanged));
$("tutorialButton").addEventListener("click",async()=>{await EXT.runtime.sendMessage({type:"OPEN_TUTORIAL"});window.close();});
$("settingsButton").addEventListener("click",async()=>{await EXT.runtime.sendMessage({type:"OPEN_SETTINGS"});window.close();});
$("pageCoachButton").addEventListener("click",async()=>{await EXT.runtime.sendMessage({type:"OPEN_ASSISTANT"});window.close();});
rememberMode.addEventListener("change",async()=>{settings.rememberSiteMode=rememberMode.checked;await EXT.runtime.sendMessage({type:"SAVE_SETTINGS",settings:{rememberSiteMode:rememberMode.checked}});});
window.addEventListener("unload",()=>{if(liveTimer)clearInterval(liveTimer);});

init().catch(e=>showError(e.message||"WebLite failed to start."));
