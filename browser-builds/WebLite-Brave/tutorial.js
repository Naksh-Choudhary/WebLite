const EXT = globalThis.browser || globalThis.chrome;
const ACCENTS={ivorian:["#6aa6cd","106,166,205","#397bac"],ocean:["#60a5fa","96,165,250","#2563a8"],lavender:["#a78bfa","167,139,250","#8067d5"],sage:["#69b89a","105,184,154","#3c8c70"]};
function applyTheme(settings){const[a,rgb,strong]=ACCENTS[settings.accent]||ACCENTS.ivorian;document.documentElement.dataset.theme=settings.theme||"system";document.documentElement.style.setProperty("--accent",a);document.documentElement.style.setProperty("--accent-rgb",rgb);document.documentElement.style.setProperty("--accent-strong",strong)}
(async()=>{try{applyTheme(await EXT.runtime.sendMessage({type:"GET_SETTINGS"}))}catch{}})();
document.getElementById("openSettings").addEventListener("click",()=>EXT.runtime.openOptionsPage());
document.getElementById("closeTab").addEventListener("click",async()=>{try{const tab=await EXT.tabs.getCurrent();if(tab?.id)await EXT.tabs.remove(tab.id);else window.close()}catch{window.close()}});
