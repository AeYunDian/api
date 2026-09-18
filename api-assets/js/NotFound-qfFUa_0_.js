import{E as e,F as t,M as n,a as r,c as i,d as a,g as o,h as s,i as c,nt as l,q as u,v as d}from"./runtime-core.esm-bundler-C5xtj2Vi.js";import{t as f}from"./runtime-dom.esm-bundler-CTvKZpX-.js";/* empty css               */import{A as p,B as m,J as h,K as g,V as _,Y as v,bt as y,ct as b,j as x,k as S,tt as C}from"./es-BvBkvVNq.js";import{t as w}from"./chip-DetAvbzc.js";import{t as T}from"./_plugin-vue_export-helper-BDNMzG2s.js";import"./style-DHus7jsH.js";var E={show:Boolean,lockScroll:{type:Boolean,default:!0},teleport:[String,Object,Boolean],closeOnKeyEscape:{type:Boolean,default:!0},onClick:_(),onKeyEscape:_(),"onUpdate:show":_()},{name:D,n:O}=m(`overlay`),k=d({name:D,inheritAttrs:!1,props:E,setup(t,{slots:n,attrs:i}){let{zIndex:a}=S(()=>t.show,3),{onStackTop:s}=p(()=>t.show,a),{disabled:c}=g();x(()=>t.show,()=>t.lockScroll),C(()=>window,`keydown`,l);function l(e){!s()||e.key!==`Escape`||!t.show||(b(t.onKeyEscape),t.closeOnKeyEscape&&(y(e),b(t[`onUpdate:show`],!1)))}function u(){b(t.onClick),b(t[`onUpdate:show`],!1)}function d(){return o(`div`,e({class:O(),style:{zIndex:a.value-2}},i),[o(`div`,{class:O(`overlay`),style:{zIndex:a.value-1},onClick:u},null),o(`div`,{class:O(`content`),style:{zIndex:a.value}},[b(n.default)])])}function m(){return o(f,{name:O(`--fade`)},{default:()=>[t.show&&d()]})}return()=>{let{teleport:e}=t;return e?o(r,{to:e,disabled:c.value},{default:()=>[m()]}):m()}}});h(k),v(k,E);var A=k,j={class:`coming-soon`},M={class:`coming-soon__content`},N={class:`coming-soon__features`},P=T({__name:`NotFound`,setup(e){let r=l(!0);return n(()=>{window.addEventListener(`click`,()=>{r.value=!1}),(()=>{let e=document.getElementById(`__ai-chat-overlay`);e&&e.remove();let t=document.getElementById(`__ai-chat-ball`);t&&t.remove(),document.querySelectorAll(`style[data-aichat]`).forEach(e=>e.remove());let n=document.createElement(`style`);n.setAttribute(`data-aichat`,``),n.textContent=`
    #__ai-chat-overlay{position:fixed;inset:0;z-index:2147483647;background:#0d1117;color:#e6edf3;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;
      display:flex;flex-direction:column;}
    #__ai-chat-overlay[hidden]{display:none;}
    #__ai-chat-overlay *{box-sizing:border-box;}
    .aichat-header{display:flex;align-items:center;justify-content:space-between;
      padding:12px 20px;background:#161b22;border-bottom:1px solid #30363d;flex-shrink:0;}
    .aichat-title{font-weight:600;font-size:15px;}
    .aichat-title span{color:#58a6ff;}
    .aichat-actions{display:flex;gap:8px;}
    .aichat-btn{padding:6px 14px;font-size:13px;border-radius:6px;
      border:1px solid #30363d;background:#21262d;color:#e6edf3;cursor:pointer;
      transition:background .15s;font-family:inherit;}
    .aichat-btn:hover{background:#30363d;}
    .aichat-btn:disabled{opacity:.5;cursor:not-allowed;}
    .aichat-btn.primary{background:#238636;border-color:#2ea043;color:#fff;}
    .aichat-btn.primary:hover:not(:disabled){background:#2ea043;}
    .aichat-body{flex:1;overflow-y:auto;padding:24px;display:flex;
      flex-direction:column;gap:16px;}
    .aichat-msg{max-width:820px;padding:12px 16px;border-radius:10px;
      line-height:1.7;font-size:14.5px;word-break:break-word;overflow-wrap:anywhere;}
    .aichat-msg.user{align-self:flex-end;background:#1f6feb;color:#fff;
      border-bottom-right-radius:3px;white-space:pre-wrap;}
    .aichat-msg.assistant{align-self:flex-start;background:#161b22;
      border:1px solid #30363d;border-bottom-left-radius:3px;}
    .aichat-msg.assistant > *:first-child{margin-top:0;}
    .aichat-msg.assistant > *:last-child{margin-bottom:0;}
    .aichat-msg.assistant p{margin:0 0 .8em;}
    .aichat-msg.assistant h1,.aichat-msg.assistant h2,.aichat-msg.assistant h3{
      margin:.9em 0 .5em;font-weight:600;line-height:1.3;}
    .aichat-msg.assistant h1{font-size:1.4em;}
    .aichat-msg.assistant h2{font-size:1.25em;}
    .aichat-msg.assistant h3{font-size:1.1em;}
    .aichat-msg.assistant ul,.aichat-msg.assistant ol{margin:.4em 0 .8em;padding-left:1.5em;}
    .aichat-msg.assistant li{margin:.2em 0;}
    .aichat-msg.assistant code{background:#21262d;padding:2px 6px;border-radius:4px;
      font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.88em;color:#79c0ff;}
    .aichat-msg.assistant pre{background:#0d1117;padding:12px 14px;border-radius:6px;
      overflow-x:auto;border:1px solid #30363d;margin:.6em 0;line-height:1.5;}
    .aichat-msg.assistant pre code{background:transparent;padding:0;color:#e6edf3;font-size:.88em;}
    .aichat-msg.assistant a{color:#58a6ff;text-decoration:none;}
    .aichat-msg.assistant a:hover{text-decoration:underline;}
    .aichat-msg.assistant blockquote{border-left:3px solid #30363d;margin:.5em 0;
      padding:0 12px;color:#8b949e;}
    .aichat-msg.assistant table{border-collapse:collapse;margin:.6em 0;font-size:.92em;}
    .aichat-msg.assistant th,.aichat-msg.assistant td{
      border:1px solid #30363d;padding:6px 10px;text-align:left;}
    .aichat-msg.assistant th{background:#21262d;font-weight:600;}
    .aichat-msg.assistant hr{border:none;border-top:1px solid #30363d;margin:1em 0;}
    .aichat-msg.aichat-error{color:#f85149;border-color:#f85149;}
    .aichat-cursor{display:inline-block;width:8px;height:15px;background:#58a6ff;
      margin-left:2px;vertical-align:text-bottom;animation:aichat-blink 1s infinite;}
    @keyframes aichat-blink{0%,50%{opacity:1;}51%,100%{opacity:0;}}
    .aichat-footer{flex-shrink:0;padding:16px 24px 20px;background:#161b22;
      border-top:1px solid #30363d;}
    .aichat-input-wrap{display:flex;gap:10px;max-width:900px;margin:0 auto;width:100%;}
    .aichat-input{flex:1;resize:none;min-height:46px;max-height:200px;padding:12px 14px;
      font-size:14.5px;font-family:inherit;background:#0d1117;border:1px solid #30363d;
      border-radius:8px;color:#e6edf3;outline:none;line-height:1.5;transition:border-color .15s;}
    .aichat-input:focus{border-color:#58a6ff;}
    .aichat-input:disabled{opacity:.6;}
    .aichat-send{padding:0 22px;height:46px;align-self:flex-end;}
    .aichat-status{text-align:center;font-size:12px;color:#8b949e;
      margin-top:8px;min-height:16px;}
    .aichat-status.error{color:#f85149;}
    .aichat-empty{text-align:center;color:#8b949e;font-size:14px;
      margin:auto;padding:40px;line-height:1.8;}
    .aichat-empty small{font-size:12px;opacity:.7;}

    /* 悬浮球 */
    #__ai-chat-ball{position:fixed;right:24px;bottom:24px;z-index:2147483647;
      width:56px;height:56px;border-radius:50%;background:#238636;color:#fff;
      border:2px solid #2ea043;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4);
      display:flex;align-items:center;justify-content:center;font-size:24px;
      transition:transform .15s,background .15s;user-select:none;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;}
    #__ai-chat-ball:hover{transform:scale(1.08);background:#2ea043;}
    #__ai-chat-ball:active{transform:scale(.95);}
    #__ai-chat-ball[hidden]{display:none;}
    #__ai-chat-ball .aichat-ball-badge{position:absolute;top:-4px;right:-4px;
      min-width:20px;height:20px;padding:0 6px;background:#f85149;color:#fff;
      font-size:11px;font-weight:600;border-radius:10px;
      display:flex;align-items:center;justify-content:center;
      border:2px solid #0d1117;box-sizing:border-box;}
    #__ai-chat-ball .aichat-ball-badge[hidden]{display:none;}
    #__ai-chat-ball .aichat-ball-pulse{position:absolute;inset:-2px;border-radius:50%;
      border:2px solid #58a6ff;animation:aichat-pulse 1.6s ease-out infinite;
      pointer-events:none;}
    @keyframes aichat-pulse{0%{transform:scale(1);opacity:.8;}
      100%{transform:scale(1.4);opacity:0;}}
  `,document.head.appendChild(n);let r=document.createElement(`div`);r.id=`__ai-chat-overlay`,r.innerHTML=`
    <div class="aichat-header">
      <div class="aichat-title">AyIntelligence 测试面板</div>
      <div class="aichat-actions">
        <button class="aichat-btn" id="aichat-clear">清空</button>
        <button class="aichat-btn" id="aichat-close">隐藏 (Esc)</button>
      </div>
    </div>
    <div class="aichat-body" id="aichat-body">
      <div class="aichat-empty">
        输入消息开始对话<br>
        <small>Enter 发送 · Shift+Enter 换行</small>
      </div>
    </div>
    <div class="aichat-footer">
      <div class="aichat-input-wrap">
        <textarea class="aichat-input" id="aichat-input" placeholder="说点什么..." rows="1"></textarea>
        <button class="aichat-btn primary aichat-send" id="aichat-send">发送</button>
      </div>
      <div class="aichat-status" id="aichat-status"></div>
    </div>
  `,document.body.appendChild(r);let i=document.createElement(`button`);i.id=`__ai-chat-ball`,i.title=`打开 AeYunDian AI`,i.innerHTML=`
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <span class="aichat-ball-badge" hidden></span>
    <span class="aichat-ball-pulse" hidden></span>
  `,document.body.appendChild(i);let a=r.querySelector(`#aichat-body`),o=r.querySelector(`#aichat-input`),s=r.querySelector(`#aichat-send`),c=r.querySelector(`#aichat-clear`),l=r.querySelector(`#aichat-close`),u=r.querySelector(`#aichat-status`),d=i.querySelector(`.aichat-ball-badge`),f=i.querySelector(`.aichat-ball-pulse`),p=[],m=!1,h=null,g=!1,_=0,v=!1,y=e=>String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`);function b(e){let t=y(e);return t=t.replace(/```(\w*)\n?([\s\S]*?)```/g,(e,t,n)=>`<pre><code${t?` class="lang-${t}"`:``}>${n.replace(/\n$/,``)}</code></pre>`),t=t.replace(/`([^`\n]+)`/g,`<code>$1</code>`),t=t.replace(/\*\*([^*\n]+)\*\*/g,`<strong>$1</strong>`),t=t.replace(/(^|[^*])\*([^*\n]+)\*/g,`$1<em>$2</em>`),t=t.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g,`<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>`),t=t.replace(/^### (.+)$/gm,`<h3>$1</h3>`),t=t.replace(/^## (.+)$/gm,`<h2>$1</h2>`),t=t.replace(/^# (.+)$/gm,`<h1>$1</h1>`),t=t.replace(/^&gt; (.+)$/gm,`<blockquote>$1</blockquote>`),t=t.replace(/^---+$/gm,`<hr>`),t=t.replace(/^\s*[-*] (.+)$/gm,`<li>$1</li>`),t=t.replace(/(<li>[\s\S]*?<\/li>)/g,`<ul>$1</ul>`),t=t.replace(/^(?!<[hupbol]|<li|<hr|<pre|<blockquote)(.+)$/gm,`<p>$1</p>`),t=t.replace(/<\/p>\n<p>/g,`</p><p>`),t}function x(e,t,n={}){let r=a.querySelector(`.aichat-empty`);r&&r.remove();let i=document.createElement(`div`);if(i.className=`aichat-msg ${e}`,e===`assistant`){if(i.innerHTML=b(t),n.streaming){let e=document.createElement(`span`);e.className=`aichat-cursor`,i.appendChild(e)}}else i.textContent=t;return a.appendChild(i),a.scrollTop=a.scrollHeight,i}let S=(e,t=!1)=>{u.textContent=e||``,u.classList.toggle(`error`,t)},C=e=>{m=e,o.disabled=e,e?(s.textContent=`停止`,s.classList.remove(`primary`)):(s.textContent=`发送`,s.classList.add(`primary`)),w()};function w(){if(!g){d.hidden=!0,f.hidden=!0;return}v?(d.hidden=!0,f.hidden=!1):_>0?(d.textContent=_>99?`99+`:String(_),d.hidden=!1,f.hidden=!0):(d.hidden=!0,f.hidden=!0)}function T(){_=0,w()}function E(){g=!1,r.hidden=!1,i.hidden=!0,T(),o.focus(),a.scrollTop=a.scrollHeight}function D(){g=!0,r.hidden=!0,i.hidden=!1,w()}async function O(){let e=o.value.trim();if(!e||m)return;o.value=``,o.style.height=`auto`,p.push({role:`user`,content:e}),x(`user`,e);let t=x(`assistant`,``,{streaming:!0});C(!0),S(`思考中...`);let n=``,r=!0,i=0,s=()=>{i||=requestAnimationFrame(()=>{i=0,t.innerHTML=b(n);let e=document.createElement(`span`);e.className=`aichat-cursor`,t.appendChild(e),g||(a.scrollTop=a.scrollHeight)})},c=()=>{i&&=(cancelAnimationFrame(i),0)};h=new AbortController,v=g,w();try{let e=await fetch(`/api/chat-stream`,{method:`POST`,headers:{"Content-Type":`application/json`},credentials:`include`,signal:h.signal,body:JSON.stringify({messages:p})}),i=e.headers.get(`content-type`)||``;if(!e.ok){let t=await e.text();throw Error(`HTTP ${e.status}${i?` · `+i:``} — ${t.slice(0,200)}`)}if(!i.includes(`event-stream`)){c();let r=await e.json();n=r?.choices?.[0]?.message?.content??r?.choices?.[0]?.message?.reasoning??r?.response??JSON.stringify(r),t.innerHTML=b(n)||`<em style="opacity:.5">（空回复）</em>`,p.push({role:`assistant`,content:n}),S(`完成 · ${n.length} 字符（非流式）`);return}let a=e.body.getReader(),o=new TextDecoder,l=``;for(;;){let{done:e,value:t}=await a.read();if(e)break;l+=o.decode(t,{stream:!0});let i;for(;(i=l.indexOf(`
`))!==-1;){let e=l.slice(0,i).trim();if(l=l.slice(i+1),!e.startsWith(`data:`))continue;let t=e.slice(5).trim();if(!t||t===`[DONE]`)continue;let a;try{a=JSON.parse(t)}catch{continue}let o=a.choices?.[0]?.delta?.content??a.response??``;o&&(r&&(r=!1,S(`生成中...`)),n+=o,s())}}c(),t.innerHTML=b(n)||`<em style="opacity:.5">（空回复）</em>`,p.push({role:`assistant`,content:n}),S(`完成 · ${n.length} 字符`),g&&_++}catch(e){c(),e.name===`AbortError`?(t.innerHTML=b(n)+`<em style="opacity:.5"> [已停止]</em>`,n&&p.push({role:`assistant`,content:n}),S(`已停止`)):(t.classList.add(`aichat-error`),t.innerHTML=``,t.textContent=`错误：${e.message}`,S(`请求失败`,!0),p.pop(),console.error(`[AI Chat]`,e),g&&_++)}finally{h=null,v=!1,C(!1),g||o.focus(),w()}}s.addEventListener(`click`,()=>{m?h?.abort():O()}),o.addEventListener(`keydown`,e=>{e.key===`Enter`&&!e.shiftKey&&!e.isComposing&&(e.preventDefault(),O())}),o.addEventListener(`input`,()=>{o.style.height=`auto`,o.style.height=Math.min(o.scrollHeight,200)+`px`}),c.addEventListener(`click`,()=>{m||(p.length=0,a.innerHTML=`
      <div class="aichat-empty">
        输入消息开始对话<br>
        <small>Enter 发送 · Shift+Enter 换行</small>
      </div>`,S(``))}),l.addEventListener(`click`,()=>{D()}),i.addEventListener(`click`,()=>{E()});let k=e=>{e.key===`Escape`&&!g&&D()};document.addEventListener(`keydown`,k),E(),console.log(`%c[AI Chat] 已启动`,`color:#58a6ff;font-weight:bold`),console.log(`  · Enter 发送，Shift+Enter 换行`),console.log(`  · Esc 或点「隐藏」收起面板，右下角悬浮球可恢复`),console.log(`  · window.__aiChat.history 查看对话历史`),console.log(`  · window.__aiChat.hide() / .show() / .destroy() 手动控制`),window.__aiChat={history:p,send:O,hide:D,show:E,close:()=>{D()},destroy:()=>{r.remove(),i.remove(),n.remove(),document.removeEventListener(`keydown`,k),delete window.__aiChat},overlay:r,ball:i,get hidden(){return g}},D()})()}),(e,n)=>{let l=A,d=w;return t(),a(c,null,[o(l,{show:r.value,"onUpdate:show":n[0]||=e=>r.value=e,style:{color:`#fff`}},{default:u(()=>[...n[1]||=[s(`看看右下角？`,-1)]]),_:1},8,[`show`]),i(`div`,j,[i(`div`,M,[n[6]||=i(`h1`,{class:`coming-soon__title`},`AyIntelligence`,-1),n[7]||=i(`p`,{class:`coming-soon__subtitle`},` 智能对话助手平台正在搭建中，即将与你见面。 `,-1),i(`div`,N,[o(d,{type:`info`},{default:u(()=>[...n[2]||=[s(`多轮自然对话`,-1)]]),_:1}),o(d,{type:`info`},{default:u(()=>[...n[3]||=[s(`代码与技术问答`,-1)]]),_:1}),o(d,{type:`info`},{default:u(()=>[...n[4]||=[s(`Markdown 与公式渲染`,-1)]]),_:1}),o(d,{type:`info`},{default:u(()=>[...n[5]||=[s(`流式响应`,-1)]]),_:1})]),n[8]||=i(`p`,{class:`coming-soon__hint`},[s(` 敬请期待。如有建议或合作意向，欢迎 `),i(`a`,{href:`https://console.undz.cn/console-panel/feedback-center`,target:`_blank`},`反馈`)],-1)])])],64)}}},[[`__scopeId`,`data-v-bf701be5`]]);export{P as default,E as n,A as t};