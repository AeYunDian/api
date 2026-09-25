(function(){function e(e){return i(e)||r(e)||n(e)||t()}function t(){throw TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function n(e,t){if(e){if(typeof e==`string`)return a(e,t);var n={}.toString.call(e).slice(8,-1);return n===`Object`&&e.constructor&&(n=e.constructor.name),n===`Map`||n===`Set`?Array.from(e):n===`Arguments`||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?a(e,t):void 0}}function r(e){if(typeof Symbol<`u`&&e[Symbol.iterator]!=null||e[`@@iterator`]!=null)return Array.from(e)}function i(e){if(Array.isArray(e))return a(e)}function a(e,t){(t==null||t>e.length)&&(t=e.length);for(var n=0,r=Array(t);n<t;n++)r[n]=e[n];return r}function o(){var e,t,n=typeof Symbol==`function`?Symbol:{},r=n.iterator||`@@iterator`,i=n.toStringTag||`@@toStringTag`;function a(n,r,i,a){var o=r&&r.prototype instanceof l?r:l,u=Object.create(o.prototype);return s(u,`_invoke`,function(n,r,i){var a,o,s,l=0,u=i||[],d=!1,f={p:0,n:0,v:e,a:p,f:p.bind(e,4),d:function(t,n){return a=t,o=0,s=e,f.n=n,c}};function p(n,r){for(o=n,s=r,t=0;!d&&l&&!i&&t<u.length;t++){var i,a=u[t],p=f.p,m=a[2];n>3?(i=m===r)&&(s=a[(o=a[4])?5:(o=3,3)],a[4]=a[5]=e):a[0]<=p&&((i=n<2&&p<a[1])?(o=0,f.v=r,f.n=a[1]):p<m&&(i=n<3||a[0]>r||r>m)&&(a[4]=n,a[5]=r,f.n=m,o=0))}if(i||n>1)return c;throw d=!0,r}return function(i,u,m){if(l>1)throw TypeError(`Generator is already running`);for(d&&u===1&&p(u,m),o=u,s=m;(t=o<2?e:s)||!d;){a||(o?o<3?(o>1&&(f.n=-1),p(o,s)):f.n=s:f.v=s);try{if(l=2,a){if(o||(i=`next`),t=a[i]){if(!(t=t.call(a,s)))throw TypeError(`iterator result is not an object`);if(!t.done)return t;s=t.value,o<2&&(o=0)}else o===1&&(t=a.return)&&t.call(a),o<2&&(s=TypeError(`The iterator does not provide a '`+i+`' method`),o=1);a=e}else if((t=(d=f.n<0)?s:n.call(r,f))!==c)break}catch(t){a=e,o=1,s=t}finally{l=1}}return{value:t,done:d}}}(n,i,a),!0),u}var c={};function l(){}function u(){}function d(){}t=Object.getPrototypeOf;var f=[][r]?t(t([][r]())):(s(t={},r,function(){return this}),t),p=d.prototype=l.prototype=Object.create(f);function m(e){return Object.setPrototypeOf?Object.setPrototypeOf(e,d):(e.__proto__=d,s(e,i,`GeneratorFunction`)),e.prototype=Object.create(p),e}return u.prototype=d,s(p,`constructor`,d),s(d,`constructor`,u),u.displayName=`GeneratorFunction`,s(d,i,`GeneratorFunction`),s(p),s(p,i,`Generator`),s(p,r,function(){return this}),s(p,`toString`,function(){return`[object Generator]`}),(o=function(){return{w:a,m}})()}function s(e,t,n,r){var i=Object.defineProperty;try{i({},``,{})}catch(e){i=0}s=function(e,t,n,r){function a(t,n){s(e,t,function(e){return this._invoke(t,n,e)})}t?i?i(e,t,{value:n,enumerable:!r,configurable:!r,writable:!r}):e[t]=n:(a(`next`,0),a(`throw`,1),a(`return`,2))},s(e,t,n,r)}function c(e,t,n,r,i,a,o){try{var s=e[a](o),c=s.value}catch(e){n(e);return}s.done?t(c):Promise.resolve(c).then(r,i)}function l(e){return function(){var t=this,n=arguments;return new Promise(function(r,i){var a=e.apply(t,n);function o(e){c(a,r,i,o,s,`next`,e)}function s(e){c(a,r,i,o,s,`throw`,e)}o(void 0)})}}System.register([`./runtime-core.esm-bundler-legacy-BQidFryM.js`,`./index-legacy-Cv-7TQ_A.js`,`./common-legacy-CzXSH5Tm.js`,`./es-legacy-CbrTF-Eg.js`,`./chip-legacy-bqFTpLzk.js`,`./_plugin-vue_export-helper-legacy-CFxL1BgT.js`,`./style-legacy-B33YAsNv.js`],function(t,n){var r,i,a,s,c,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B;return{setters:[function(e){r=e.E,i=e.F,a=e.K,s=e.M,c=e.a,u=e.c,d=e.d,f=e.g,p=e.h,m=e.i,h=e.tt,g=e.v},function(e){_=e.d},function(e){},function(e){v=e.B,y=e.D,b=e.E,x=e.M,S=e.N,C=e.R,w=e.T,T=e.V,E=e.et,D=e.ft,O=e.q},function(e){k=e.t},function(e){A=e.t},function(e){}],execute:function(){var n;j=document.createElement(`style`),j.textContent=`:root{--overlay-background-color:rgba(0,0,0,.6)}.var-overlay{justify-content:center;align-items:center;display:flex;position:fixed;top:0;bottom:0;left:0;right:0}.var-overlay--fade-enter-from,.var-overlay--fade-leave-to{opacity:0}.var-overlay--fade-enter-active,.var-overlay--fade-leave-active{transition:opacity .25s}.var-overlay__overlay{background-color:var(--overlay-background-color);position:fixed;top:0;bottom:0;left:0;right:0}.var-overlay__content{position:relative}.coming-soon[data-v-ac34d191]{box-sizing:border-box;justify-content:center;align-items:center;width:100%;min-height:90vh;padding:2rem;display:flex}.coming-soon__content[data-v-ac34d191]{text-align:center;max-width:560px}.coming-soon__title[data-v-ac34d191]{background:linear-gradient(135deg,#6750a4,#2196f3);-webkit-text-fill-color:transparent;-webkit-background-clip:text;background-clip:text;margin:0 0 1rem;font-size:2.5rem;font-weight:700}.coming-soon__subtitle[data-v-ac34d191]{color:var(--color-text-secondary,#666);margin:0 0 2rem;font-size:1.15rem;line-height:1.6}.coming-soon__features[data-v-ac34d191]{flex-wrap:wrap;justify-content:center;gap:.6rem;margin:0 0 2rem;padding:0;list-style:none;display:flex}.coming-soon__features li[data-v-ac34d191]{color:var(--color-text-disabled,#888);background:color-mix(in srgb, currentColor 8%, transparent);border-radius:8px;padding:.35rem .9rem;font-size:.9rem}.coming-soon__hint[data-v-ac34d191]{color:var(--color-text-disabled,#888);margin:0;font-size:.95rem}.coming-soon__hint a[data-v-ac34d191]{color:var(--color-primary,#6750a4);text-decoration:none}.coming-soon__hint a[data-v-ac34d191]:hover{text-decoration:underline}@media (max-width:480px){.coming-soon__title[data-v-ac34d191]{font-size:2rem}.coming-soon__subtitle[data-v-ac34d191]{font-size:1rem}}
/*$vite$:1*/`,document.head.appendChild(j),t(`t`,M={show:Boolean,lockScroll:{type:Boolean,default:!0},teleport:[String,Object,Boolean],closeOnKeyEscape:{type:Boolean,default:!0},onClick:S(),onKeyEscape:S(),"onUpdate:show":S()}),n=x(`overlay`),N=n.name,P=n.n,F=g({name:N,inheritAttrs:!1,props:M,setup:function(e,t){var n=t.slots,i=t.attrs,a=w(function(){return e.show},3).zIndex,o=b(function(){return e.show},a).onStackTop,s=C().disabled;y(function(){return e.show},function(){return e.lockScroll}),O(function(){return window},`keydown`,l);function l(t){!o()||t.key!==`Escape`||!e.show||(E(e.onKeyEscape),e.closeOnKeyEscape&&(D(t),E(e[`onUpdate:show`],!1)))}function u(){E(e.onClick),E(e[`onUpdate:show`],!1)}function d(){return f(`div`,r({class:P(),style:{zIndex:a.value-2}},i),[f(`div`,{class:P(`overlay`),style:{zIndex:a.value-1},onClick:u},null),f(`div`,{class:P(`content`),style:{zIndex:a.value}},[E(n.default)])])}function p(){return f(_,{name:P(`--fade`)},{default:function(){return[e.show&&d()]}})}return function(){var t=e.teleport;return t?f(c,{to:t,disabled:s.value},{default:function(){return[p()]}}):p()}}}),v(F),T(F,M),I=F,L={class:`coming-soon`},R={class:`coming-soon__content`},z={class:`coming-soon__features`},B={__name:`NotFound`,setup:function(t){var n=h(!0);return s(function(){window.addEventListener(`click`,function(){n.value=!1}),(function(){var e=document.getElementById(`__ai-chat-overlay`);e&&e.remove();var t=document.getElementById(`__ai-chat-ball`);t&&t.remove(),document.querySelectorAll(`style[data-aichat]`).forEach(function(e){return e.remove()});var n=document.createElement(`style`);n.setAttribute(`data-aichat`,``),n.textContent=`
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
  `,document.head.appendChild(n);var r=document.createElement(`div`);r.id=`__ai-chat-overlay`,r.innerHTML=`
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
  `,document.body.appendChild(r);var i=document.createElement(`button`);i.id=`__ai-chat-ball`,i.title=`打开 AeYunDian AI`,i.innerHTML=`
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <span class="aichat-ball-badge" hidden></span>
    <span class="aichat-ball-pulse" hidden></span>
  `,document.body.appendChild(i);var a=r.querySelector(`#aichat-body`),s=r.querySelector(`#aichat-input`),c=r.querySelector(`#aichat-send`),u=r.querySelector(`#aichat-clear`),d=r.querySelector(`#aichat-close`),f=r.querySelector(`#aichat-status`),p=i.querySelector(`.aichat-ball-badge`),m=i.querySelector(`.aichat-ball-pulse`),h=[],g=!1,_=null,v=!1,y=0,b=!1,x=function(e){return String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)};function S(e){var t=x(e);return t=t.replace(/```(\w*)\n?([\s\S]*?)```/g,function(e,t,n){return`<pre><code${t?` class="lang-${t}"`:``}>${n.replace(/\n$/,``)}</code></pre>`}),t=t.replace(/`([^`\n]+)`/g,`<code>$1</code>`),t=t.replace(/\*\*([^*\n]+)\*\*/g,`<strong>$1</strong>`),t=t.replace(/(^|[^*])\*([^*\n]+)\*/g,`$1<em>$2</em>`),t=t.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g,`<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>`),t=t.replace(/^### (.+)$/gm,`<h3>$1</h3>`),t=t.replace(/^## (.+)$/gm,`<h2>$1</h2>`),t=t.replace(/^# (.+)$/gm,`<h1>$1</h1>`),t=t.replace(/^&gt; (.+)$/gm,`<blockquote>$1</blockquote>`),t=t.replace(/^---+$/gm,`<hr>`),t=t.replace(/^\s*[-*] (.+)$/gm,`<li>$1</li>`),t=t.replace(/(<li>[\s\S]*?<\/li>)/g,`<ul>$1</ul>`),t=t.replace(/^(?!<[hupbol]|<li|<hr|<pre|<blockquote)(.+)$/gm,`<p>$1</p>`),t=t.replace(/<\/p>\n<p>/g,`</p><p>`),t}function C(e,t){var n=arguments.length>2&&arguments[2]!==void 0?arguments[2]:{},r=a.querySelector(`.aichat-empty`);r&&r.remove();var i=document.createElement(`div`);if(i.className=`aichat-msg ${e}`,e===`assistant`){if(i.innerHTML=S(t),n.streaming){var o=document.createElement(`span`);o.className=`aichat-cursor`,i.appendChild(o)}}else i.textContent=t;return a.appendChild(i),a.scrollTop=a.scrollHeight,i}var w=function(e){var t=arguments.length>1&&arguments[1]!==void 0&&arguments[1];f.textContent=e||``,f.classList.toggle(`error`,t)},T=function(e){g=e,s.disabled=e,e?(c.textContent=`停止`,c.classList.remove(`primary`)):(c.textContent=`发送`,c.classList.add(`primary`)),E()};function E(){if(!v){p.hidden=!0,m.hidden=!0;return}b?(p.hidden=!0,m.hidden=!1):y>0?(p.textContent=y>99?`99+`:String(y),p.hidden=!1,m.hidden=!0):(p.hidden=!0,m.hidden=!0)}function D(){y=0,E()}function O(){v=!1,r.hidden=!1,i.hidden=!0,D(),s.focus(),a.scrollTop=a.scrollHeight}function k(){v=!0,r.hidden=!0,i.hidden=!1,E()}function A(){return j.apply(this,arguments)}function j(){return j=l(o().m(function e(){var t,n,r,i,c,l,u,d,f,p,m,x,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W,G;return o().w(function(e){for(;;)switch(e.p=e.n){case 0:if(t=s.value.trim(),!(!t||g)){e.n=1;break}return e.a(2);case 1:return s.value=``,s.style.height=`auto`,h.push({role:`user`,content:t}),C(`user`,t),n=C(`assistant`,``,{streaming:!0}),T(!0),w(`思考中...`),r=``,i=!0,c=0,l=function(){c||(c=requestAnimationFrame(function(){c=0,n.innerHTML=S(r);var e=document.createElement(`span`);e.className=`aichat-cursor`,n.appendChild(e),v||(a.scrollTop=a.scrollHeight)}))},u=function(){c&&(cancelAnimationFrame(c),c=0)},_=new AbortController,b=v,E(),e.p=2,e.n=3,fetch(`/api/chat-stream`,{method:`POST`,headers:{"Content-Type":`application/json`},credentials:`include`,signal:_.signal,body:JSON.stringify({messages:h})});case 3:if(d=e.v,f=d.headers.get(`content-type`)||``,d.ok){e.n=5;break}return e.n=4,d.text();case 4:throw p=e.v,Error(`HTTP ${d.status}${f?` · `+f:``} — ${p.slice(0,200)}`);case 5:if(f.includes(`event-stream`)){e.n=7;break}return u(),e.n=6,d.json();case 6:return A=e.v,r=(m=(x=(D=A==null||(O=A.choices)==null||(O=O[0])==null||(O=O.message)==null?void 0:O.content)==null?A==null||(k=A.choices)==null||(k=k[0])==null||(k=k.message)==null?void 0:k.reasoning:D)==null?A==null?void 0:A.response:x)==null?JSON.stringify(A):m,n.innerHTML=S(r)||`<em style="opacity:.5">（空回复）</em>`,h.push({role:`assistant`,content:r}),w(`完成 · ${r.length} 字符（非流式）`),e.a(2);case 7:j=d.body.getReader(),M=new TextDecoder,N=``;case 8:return e.n=9,j.read();case 9:if(P=e.v,F=P.done,I=P.value,!F){e.n=10;break}return e.a(3,19);case 10:N+=M.decode(I,{stream:!0}),L=void 0;case 11:if((L=N.indexOf(`
`))===-1){e.n=18;break}if(V=N.slice(0,L).trim(),N=N.slice(L+1),V.startsWith(`data:`)){e.n=12;break}return e.a(3,11);case 12:if(H=V.slice(5).trim(),!(!H||H===`[DONE]`)){e.n=13;break}return e.a(3,11);case 13:U=void 0,e.p=14,U=JSON.parse(H),e.n=16;break;case 15:return e.p=15,e.v,e.a(3,11);case 16:if(W=(R=(z=(B=U.choices)==null||(B=B[0])==null||(B=B.delta)==null?void 0:B.content)==null?U.response:z)==null?``:R,W){e.n=17;break}return e.a(3,11);case 17:i&&(i=!1,w(`生成中...`)),r+=W,l(),e.n=11;break;case 18:e.n=8;break;case 19:u(),n.innerHTML=S(r)||`<em style="opacity:.5">（空回复）</em>`,h.push({role:`assistant`,content:r}),w(`完成 · ${r.length} 字符`),v&&y++,e.n=21;break;case 20:e.p=20,G=e.v,u(),G.name===`AbortError`?(n.innerHTML=S(r)+`<em style="opacity:.5"> [已停止]</em>`,r&&h.push({role:`assistant`,content:r}),w(`已停止`)):(n.classList.add(`aichat-error`),n.innerHTML=``,n.textContent=`错误：${G.message}`,w(`请求失败`,!0),h.pop(),console.error(`[AI Chat]`,G),v&&y++);case 21:return e.p=21,_=null,b=!1,T(!1),v||s.focus(),E(),e.f(21);case 22:return e.a(2)}},e,null,[[14,15],[2,20,21,22]])})),j.apply(this,arguments)}c.addEventListener(`click`,function(){var e;g?(e=_)==null||e.abort():A()}),s.addEventListener(`keydown`,function(e){e.key===`Enter`&&!e.shiftKey&&!e.isComposing&&(e.preventDefault(),A())}),s.addEventListener(`input`,function(){s.style.height=`auto`,s.style.height=Math.min(s.scrollHeight,200)+`px`}),u.addEventListener(`click`,function(){g||(h.length=0,a.innerHTML=`
      <div class="aichat-empty">
        输入消息开始对话<br>
        <small>Enter 发送 · Shift+Enter 换行</small>
      </div>`,w(``))}),d.addEventListener(`click`,function(){k()}),i.addEventListener(`click`,function(){O()});var M=function(e){e.key===`Escape`&&!v&&k()};document.addEventListener(`keydown`,M),O(),console.log(`%c[AI Chat] 已启动`,`color:#58a6ff;font-weight:bold`),console.log(`  · Enter 发送，Shift+Enter 换行`),console.log(`  · Esc 或点「隐藏」收起面板，右下角悬浮球可恢复`),console.log(`  · window.__aiChat.history 查看对话历史`),console.log(`  · window.__aiChat.hide() / .show() / .destroy() 手动控制`),window.__aiChat={history:h,send:A,hide:k,show:O,close:function(){k()},destroy:function(){r.remove(),i.remove(),n.remove(),document.removeEventListener(`keydown`,M),delete window.__aiChat},overlay:r,ball:i,get hidden(){return v}},k()})()}),function(t,r){var o=I,s=k;return i(),d(m,null,[f(o,{show:n.value,"onUpdate:show":r[0]||(r[0]=function(e){return n.value=e}),style:{color:`#fff`}},{default:a(function(){return e(r[1]||(r[1]=[p(`看看右下角？`,-1)]))}),_:1},8,[`show`]),u(`div`,L,[u(`div`,R,[r[6]||(r[6]=u(`h1`,{class:`coming-soon__title`},`AyIntelligence`,-1)),r[7]||(r[7]=u(`p`,{class:`coming-soon__subtitle`},` 智能对话助手平台正在搭建中，即将与你见面。 `,-1)),u(`div`,z,[f(s,{type:`info`},{default:a(function(){return e(r[2]||(r[2]=[p(`多轮自然对话`,-1)]))}),_:1}),f(s,{type:`info`},{default:a(function(){return e(r[3]||(r[3]=[p(`代码与技术问答`,-1)]))}),_:1}),f(s,{type:`info`},{default:a(function(){return e(r[4]||(r[4]=[p(`Markdown 与公式渲染`,-1)]))}),_:1}),f(s,{type:`info`},{default:a(function(){return e(r[5]||(r[5]=[p(`流式响应`,-1)]))}),_:1})]),r[8]||(r[8]=u(`p`,{class:`coming-soon__hint`},[p(` 敬请期待。如有建议或合作意向，欢迎 `),u(`a`,{href:`https://console.undz.cn/console-panel/feedback-center`,target:`_blank`},`反馈`)],-1))])])],64)}}},t(`default`,A(B,[[`__scopeId`,`data-v-ac34d191`]]))}}})})();