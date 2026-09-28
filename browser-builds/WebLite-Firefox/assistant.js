const EXT=globalThis.browser||globalThis.chrome;
const $=id=>document.getElementById(id);
let context=null, model=null, modelChecked=false;

function fmt(bytes){const v=Math.max(0,Number(bytes||0));if(v<1024)return Math.round(v)+" B";if(v<1024**2)return (v/1024).toFixed(1)+" KB";return (v/1024**2).toFixed(1)+" MB"}
function addBubble(text,who="coach"){const d=document.createElement("div");d.className="bubble "+who;d.textContent=text;$("conversation").appendChild(d);$("conversation").scrollTop=$("conversation").scrollHeight}

async function getModel(){
  if(modelChecked)return model;
  modelChecked=true;
  try{
    if(globalThis.LanguageModel?.create){
      const availability=await globalThis.LanguageModel.availability?.();
      if(availability==="unavailable")return null;
      model=await globalThis.LanguageModel.create({
        initialPrompts:[{role:"system",content:"You are WebLite Page Coach. Answer only from the supplied webpage context. Be concise, student-friendly, and say when the page context is insufficient."}]
      });
      return model;
    }
  }catch{}
  try{
    if(globalThis.ai?.languageModel?.create){
      model=await globalThis.ai.languageModel.create({systemPrompt:"You are WebLite Page Coach. Answer only from supplied page context. Be concise and student-friendly."});
      return model;
    }
  }catch{}
  return null;
}

function localRecommendation(ctx){
  const s=ctx?.stats||{};const requests=Number(s.requestCount||0);const cross=Number(s.thirdPartyCount||0);
  const media=Number(s.breakdown?.media?.count||0);const images=Number(s.breakdown?.image?.count||0);
  if(media>0||cross>Math.max(10,requests*.35))return ["Study mode looks useful here.","This page has noticeable media or cross-site activity. Study mode can trim optional content while keeping the main reading flow safer."];
  if(requests>90||images>35)return ["Balanced or Study mode could help.","The page is fairly resource-heavy. Start with Balanced; use Study if you want fewer distractions and cross-site images."];
  return ["This page already looks fairly light.","Balanced is probably enough. Study mode still helps if you want Focus Shield and quieter browsing."];
}

function localAnswer(question,ctx){
  const terms=(question.toLowerCase().match(/[a-z0-9]{3,}/g)||[]).filter(x=>!["this","that","what","with","from","page","about","explain"].includes(x));
  const sentences=String(ctx?.text||"").split(/(?<=[.!?])\s+/).filter(x=>x.length>35&&x.length<500);
  const ranked=sentences.map(s=>({s,score:terms.reduce((n,t)=>n+(s.toLowerCase().includes(t)?1:0),0)})).sort((a,b)=>b.score-a.score);
  const hits=ranked.filter(x=>x.score>0).slice(0,3).map(x=>x.s);
  if(hits.length)return "From the visible page text:\n\n"+hits.join("\n\n");
  const top=sentences.slice(0,3);
  if(top.length)return "Built-in AI is not available in this browser, so I used local page text. The page mainly says:\n\n"+top.join("\n\n");
  return "I could not find enough readable page text to answer that. Try opening the main article/content area and re-analyzing.";
}

async function analyze(){
  $("pageTitle").textContent="Reading page…";$("analysisText").textContent="WebLite is reading the active page.";
  const requestedId=Number(new URLSearchParams(location.search).get("tabId"));
  let tab=null;
  if(Number.isInteger(requestedId)){
    try{tab=await EXT.tabs.get(requestedId)}catch{}
  }
  if(!tab){
    const tabs=await EXT.tabs.query({currentWindow:true});
    tab=tabs.find(t=>/^https?:/i.test(t.url||""));
  }
  if(!tab?.id||!/^https?:/i.test(tab.url||""))throw new Error("Open a normal website first, then re-open Page Coach.");
  context=await EXT.tabs.sendMessage(tab.id,{type:"GET_PAGE_CONTEXT"},{frameId:0});
  $("pageTitle").textContent=context?.title||"Untitled page";$("pageUrl").textContent=context?.url||tab.url;
  $("requestCount").textContent=String(context?.stats?.requestCount||0);$("crossSiteCount").textContent=String(context?.stats?.thirdPartyCount||0);$("observedSize").textContent=fmt(context?.stats?.measuredBytes||0);
  const [title,body]=localRecommendation(context);$("recommendation").textContent=title;$("analysisText").textContent=body;
  const m=await getModel();$("aiStatus").textContent=m?"Browser AI available":"Local analysis mode";
}

$("askForm").addEventListener("submit",async e=>{
  e.preventDefault();const q=$("question").value.trim();if(!q||!context)return;
  addBubble(q,"user");$("question").value="";$("askButton").disabled=true;$("askButton").textContent="Thinking…";
  try{
    const m=await getModel();
    if(m?.prompt){
      const prompt=`PAGE TITLE: ${context.title}\nURL: ${context.url}\nPAGE TEXT:\n${context.text.slice(0,10000)}\n\nUSER QUESTION: ${q}`;
      const answer=await m.prompt(prompt);addBubble(String(answer||"I could not generate a response."));
    }else addBubble(localAnswer(q,context));
  }catch{addBubble(localAnswer(q,context));}
  finally{$("askButton").disabled=false;$("askButton").textContent="Ask Page Coach";}
});
$("refreshPage").addEventListener("click",()=>analyze().catch(e=>addBubble(e.message||"Could not analyze the page.")));
analyze().catch(e=>{ $("pageTitle").textContent="Page Coach"; $("analysisText").textContent=e.message||"Could not analyze the current page."; $("aiStatus").textContent="Waiting"; });
