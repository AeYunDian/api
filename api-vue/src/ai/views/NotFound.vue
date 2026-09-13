<script setup>
import { onMounted, ref } from 'vue';
const show = ref(true);
onMounted(() => {
    window.addEventListener('click', () => {
        show.value = false;
    });
    (() => {
        // ---------- 防重复 ----------
        const OLD = document.getElementById('__ai-chat-overlay');
        if (OLD) OLD.remove();
        const OLD_BALL = document.getElementById('__ai-chat-ball');
        if (OLD_BALL) OLD_BALL.remove();
        document.querySelectorAll('style[data-aichat]').forEach(el => el.remove());

        // ---------- 样式 ----------
        const style = document.createElement('style');
        style.setAttribute('data-aichat', '');
        style.textContent = `
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
  `;
        document.head.appendChild(style);

        // ---------- 面板 DOM ----------
        const overlay = document.createElement('div');
        overlay.id = '__ai-chat-overlay';
        overlay.innerHTML = `
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
  `;
        document.body.appendChild(overlay);

        // ---------- 悬浮球 DOM ----------
        const ball = document.createElement('button');
        ball.id = '__ai-chat-ball';
        ball.title = '打开 AeYunDian AI';
        ball.innerHTML = `
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <span class="aichat-ball-badge" hidden></span>
    <span class="aichat-ball-pulse" hidden></span>
  `;
        document.body.appendChild(ball);

        const $body = overlay.querySelector('#aichat-body');
        const $input = overlay.querySelector('#aichat-input');
        const $send = overlay.querySelector('#aichat-send');
        const $clear = overlay.querySelector('#aichat-clear');
        const $close = overlay.querySelector('#aichat-close');
        const $status = overlay.querySelector('#aichat-status');
        const $badge = ball.querySelector('.aichat-ball-badge');
        const $pulse = ball.querySelector('.aichat-ball-pulse');

        // ---------- 状态 ----------
        const history = [];
        let streaming = false;
        let currentAbort = null;
        let hidden = false;
        let unread = 0;                // 隐藏时收到的新回复数
        let streamingInBackground = false;  // 隐藏状态下是否还在跑

        // ---------- 工具 ----------
        const escapeHtml = (s) =>
            String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        function renderMarkdown(text) {
            let html = escapeHtml(text);

            html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
                const cls = lang ? ` class="lang-${lang}"` : '';
                return `<pre><code${cls}>${code.replace(/\n$/, '')}</code></pre>`;
            });

            html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
            html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
            html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
            html = html.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g,
                '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
            html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
            html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
            html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
            html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
            html = html.replace(/^---+$/gm, '<hr>');
            html = html.replace(/^\s*[-*] (.+)$/gm, '<li>$1</li>');
            html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
            html = html.replace(/^(?!<[hupbol]|<li|<hr|<pre|<blockquote)(.+)$/gm, '<p>$1</p>');
            html = html.replace(/<\/p>\n<p>/g, '</p><p>');

            return html;
        }

        function addMessage(role, content, opts = {}) {
            const empty = $body.querySelector('.aichat-empty');
            if (empty) empty.remove();

            const div = document.createElement('div');
            div.className = `aichat-msg ${role}`;
            if (role === 'assistant') {
                div.innerHTML = renderMarkdown(content);
                if (opts.streaming) {
                    const c = document.createElement('span');
                    c.className = 'aichat-cursor';
                    div.appendChild(c);
                }
            } else {
                div.textContent = content;
            }
            $body.appendChild(div);
            $body.scrollTop = $body.scrollHeight;
            return div;
        }

        const setStatus = (text, isError = false) => {
            $status.textContent = text || '';
            $status.classList.toggle('error', isError);
        };

        const setStreaming = (v) => {
            streaming = v;
            $input.disabled = v;
            if (v) {
                $send.textContent = '停止';
                $send.classList.remove('primary');
            } else {
                $send.textContent = '发送';
                $send.classList.add('primary');
            }
            updateBallBadge();
        };

        // ---------- 悬浮球状态 ----------
        function updateBallBadge() {
            // 隐藏时才显示 badge / pulse
            if (!hidden) {
                $badge.hidden = true;
                $pulse.hidden = true;
                return;
            }
            if (streamingInBackground) {
                $badge.hidden = true;
                $pulse.hidden = false;
            } else if (unread > 0) {
                $badge.textContent = unread > 99 ? '99+' : String(unread);
                $badge.hidden = false;
                $pulse.hidden = true;
            } else {
                $badge.hidden = true;
                $pulse.hidden = true;
            }
        }

        function clearUnread() {
            unread = 0;
            updateBallBadge();
        }

        // ---------- 显隐控制 ----------
        function showPanel() {
            hidden = false;
            overlay.hidden = false;
            ball.hidden = true;
            clearUnread();
            $input.focus();
            // 滚到底部
            $body.scrollTop = $body.scrollHeight;
        }

        function hidePanel() {
            hidden = true;
            overlay.hidden = true;
            ball.hidden = false;
            updateBallBadge();
        }

        // ---------- 发送 ----------
        async function send() {
            const text = $input.value.trim();
            if (!text || streaming) return;

            $input.value = '';
            $input.style.height = 'auto';

            history.push({ role: 'user', content: text });
            addMessage('user', text);

            const assistantDiv = addMessage('assistant', '', { streaming: true });
            setStreaming(true);
            setStatus('思考中...');

            let full = '';
            let firstChunk = true;
            let renderRaf = 0;

            const scheduleRender = () => {
                if (renderRaf) return;
                renderRaf = requestAnimationFrame(() => {
                    renderRaf = 0;
                    assistantDiv.innerHTML = renderMarkdown(full);
                    const c = document.createElement('span');
                    c.className = 'aichat-cursor';
                    assistantDiv.appendChild(c);
                    if (!hidden) $body.scrollTop = $body.scrollHeight;
                });
            };

            const flushRender = () => {
                if (renderRaf) {
                    cancelAnimationFrame(renderRaf);
                    renderRaf = 0;
                }
            };

            currentAbort = new AbortController();

            // 如果隐藏状态下发送，标记后台流式
            streamingInBackground = hidden;
            updateBallBadge();

            try {
                const res = await fetch('/api/chat-stream', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    signal: currentAbort.signal,
                    body: JSON.stringify({ messages: history }),
                });

                const ct = res.headers.get('content-type') || '';
                if (!res.ok) {
                    const errText = await res.text();
                    throw new Error(`HTTP ${res.status}${ct ? ' · ' + ct : ''} — ${errText.slice(0, 200)}`);
                }

                // 非流式兜底
                if (!ct.includes('event-stream')) {
                    flushRender();
                    const json = await res.json();
                    full = json?.choices?.[0]?.message?.content
                        ?? json?.choices?.[0]?.message?.reasoning
                        ?? json?.response
                        ?? JSON.stringify(json);
                    assistantDiv.innerHTML = renderMarkdown(full) || '<em style="opacity:.5">（空回复）</em>';
                    history.push({ role: 'assistant', content: full });
                    setStatus(`完成 · ${full.length} 字符（非流式）`);
                    return;
                }

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });

                    let nl;
                    while ((nl = buffer.indexOf('\n')) !== -1) {
                        const line = buffer.slice(0, nl).trim();
                        buffer = buffer.slice(nl + 1);

                        if (!line.startsWith('data:')) continue;
                        const data = line.slice(5).trim();
                        if (!data || data === '[DONE]') continue;

                        let json;
                        try { json = JSON.parse(data); } catch { continue; }

                        const chunk =
                            json.choices?.[0]?.delta?.content ??
                            json.response ??
                            '';
                        if (!chunk) continue;

                        if (firstChunk) {
                            firstChunk = false;
                            setStatus('生成中...');
                        }
                        full += chunk;
                        scheduleRender();
                    }
                }

                flushRender();
                assistantDiv.innerHTML = renderMarkdown(full) || '<em style="opacity:.5">（空回复）</em>';
                history.push({ role: 'assistant', content: full });
                setStatus(`完成 · ${full.length} 字符`);

                // 如果回复时面板是隐藏的，计未读
                if (hidden) {
                    unread++;
                }

            } catch (err) {
                flushRender();

                if (err.name === 'AbortError') {
                    assistantDiv.innerHTML = renderMarkdown(full) + '<em style="opacity:.5"> [已停止]</em>';
                    if (full) history.push({ role: 'assistant', content: full });
                    setStatus('已停止');
                } else {
                    assistantDiv.classList.add('aichat-error');
                    assistantDiv.innerHTML = '';
                    assistantDiv.textContent = `错误：${err.message}`;
                    setStatus('请求失败', true);
                    history.pop();
                    console.error('[AI Chat]', err);
                    if (hidden) unread++;
                }
            } finally {
                currentAbort = null;
                streamingInBackground = false;
                setStreaming(false);
                if (!hidden) $input.focus();
                updateBallBadge();
            }
        }

        // ---------- 事件 ----------
        $send.addEventListener('click', () => {
            if (streaming) {
                currentAbort?.abort();
            } else {
                send();
            }
        });

        $input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
                e.preventDefault();
                send();
            }
        });

        $input.addEventListener('input', () => {
            $input.style.height = 'auto';
            $input.style.height = Math.min($input.scrollHeight, 200) + 'px';
        });

        $clear.addEventListener('click', () => {
            if (streaming) return;
            history.length = 0;
            $body.innerHTML = `
      <div class="aichat-empty">
        输入消息开始对话<br>
        <small>Enter 发送 · Shift+Enter 换行</small>
      </div>`;
            setStatus('');
        });

        $close.addEventListener('click', () => {
            hidePanel();
        });

        // 悬浮球点击恢复
        ball.addEventListener('click', () => {
            showPanel();
        });

        // Esc：只在面板显示时隐藏
        const escHandler = (e) => {
            if (e.key === 'Escape' && !hidden) {
                hidePanel();
            }
        };
        document.addEventListener('keydown', escHandler);

        // ---------- 启动 ----------
        showPanel();
        console.log('%c[AI Chat] 已启动', 'color:#58a6ff;font-weight:bold');
        console.log('  · Enter 发送，Shift+Enter 换行');
        console.log('  · Esc 或点「隐藏」收起面板，右下角悬浮球可恢复');
        console.log('  · window.__aiChat.history 查看对话历史');
        console.log('  · window.__aiChat.hide() / .show() / .destroy() 手动控制');

        window.__aiChat = {
            history,
            send,
            hide: hidePanel,
            show: showPanel,
            close: () => {                    // 兼容旧调用
                hidePanel();
            },
            destroy: () => {                  // 彻底移除
                overlay.remove();
                ball.remove();
                style.remove();
                document.removeEventListener('keydown', escHandler);
                delete window.__aiChat;
            },
            overlay,
            ball,
            get hidden() { return hidden; },
        };
        hidePanel();
    })();
});
</script>

<template>
    <var-overlay v-model:show="show" style="color: #fff;">看看右下角？</var-overlay>
    <div class="coming-soon">
        <div class="coming-soon__content">
            <h1 class="coming-soon__title">AyIntelligence</h1>

            <p class="coming-soon__subtitle">
                智能对话助手平台正在搭建中，即将与你见面。
            </p>

            <div class="coming-soon__features">
                <var-chip type="info">多轮自然对话</var-chip>
                <var-chip type="info">代码与技术问答</var-chip>
                <var-chip type="info">Markdown 与公式渲染</var-chip>
                <var-chip type="info">流式响应</var-chip>
            </div>

            <p class="coming-soon__hint">
                敬请期待。如有建议或合作意向，欢迎
                <a href="https://console.undz.cn/console-panel/feedback-center" target="_blank">反馈</a>
            </p>
        </div>
    </div>
</template>

<style scoped>
.coming-soon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 90vh;
    padding: 2rem;
    box-sizing: border-box;
}

.coming-soon__content {
    max-width: 560px;
    text-align: center;
}

.coming-soon__title {
    font-size: 2.5rem;
    margin: 0 0 1rem;
    font-weight: 700;
    background: linear-gradient(135deg, #6750a4, #2196f3);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.coming-soon__subtitle {
    font-size: 1.15rem;
    color: var(--color-text-secondary, #666);
    margin: 0 0 2rem;
    line-height: 1.6;
}

.coming-soon__features {
    list-style: none;
    padding: 0;
    margin: 0 0 2rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    justify-content: center;
}

.coming-soon__features li {
    padding: 0.35rem 0.9rem;
    font-size: 0.9rem;
    color: var(--color-text-disabled, #888);
    background: color-mix(in srgb, currentColor 8%, transparent);
    border-radius: 8px;
}

.coming-soon__hint {
    font-size: 0.95rem;
    color: var(--color-text-disabled, #888);
    margin: 0;
}

.coming-soon__hint a {
    color: var(--color-primary, #6750a4);
    text-decoration: none;
}

.coming-soon__hint a:hover {
    text-decoration: underline;
}

@media (max-width: 480px) {
    .coming-soon__title {
        font-size: 2rem;
    }

    .coming-soon__subtitle {
        font-size: 1rem;
    }
}
</style>