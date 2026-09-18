<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { showAlert } from '@/index/components/common/dialog'

const now = ref('')
const visits = ref('000000')
let timer
const WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function tick() {
    const d = new Date()
    const p = n => String(n).padStart(2, '0')
    now.value = `${d.getFullYear()}年${p(d.getMonth() + 1)}月${p(d.getDate())}日 ${WEEK[d.getDay()]} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
/* —— 设为首页 —— */
function setHomePage() {
    // 现代浏览器不允许 JS 修改主页，只能提示用户手动设置
    const url = window.location.origin + '/'
    showAlert(`设为首页失败，请在浏览器设置中手动添加：\n\n${url}\n\n（Chrome/Edge：设置 → 外观 → 显示"主页"按钮）`)
}

/* —— 加入收藏 —— */
function addFavorite() {
    const title = document.title || '韵典综合平台'
    const url = window.location.href

    // 1) 老 IE
    if (window.external && typeof window.external.addFavorite === 'function') {
        try { window.external.addFavorite(url, title); return } catch (e) { }
    }
    // 2) 老 Firefox
    if (window.sidebar && typeof window.sidebar.addPanel === 'function') {
        try { window.sidebar.addPanel(title, url, ''); return } catch (e) { }
    }
    // 3) 现代浏览器
    const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
    const hotkey = isMac ? 'Command + D' : 'Ctrl + D'
    showAlert(`加入收藏失败，请使用 ${hotkey} 手动添加。`)
}

onMounted(() => {
    tick()
    timer = setInterval(tick, 1000)
    const stored = localStorage.getItem('gov_visits')
    let n
    if (stored === null) {
        // 首次：随机初始值
        n = Math.floor(Math.random() * (120000 - 9000 + 1)) + 9000
    } else {
        n = Number(stored) + 1
        if (!Number.isFinite(n)) n = 9000   // 防脏数据
    }
    localStorage.setItem('gov_visits', String(n))
    visits.value = String(n).padStart(6, '0')
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
    <div class="topbar">
        <div class="gov-container topbar__inner">
            <div class="topbar__links">
                <a href="#" @click.prevent="setHomePage">设为首页</a>
                <span class="topbar__sep">|</span>
                <a href="#" @click.prevent="addFavorite">加入收藏</a>
                <span class="topbar__sep">|</span>
                <a href="#" id="wzaElder">适老化长辈模式</a>
                <span class="topbar__sep">|</span>

                <!-- <a href="#" @click.prevent="toggleAria">无障碍浏览</a> -->
                <a href="#" id="wzayd">无障碍浏览</a>

            </div>
            <div class="topbar__slogan">欢迎访问韵典综合平台！</div>
            <div class="topbar__right">
                <span class="topbar__visits">本站已被访问：<b>{{ visits }}</b> 次　|　</span>
                <span class="topbar__clock">今天是 {{ now }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.topbar {
    background: var(--gov-topbar-bg);
    color: var(--gov-topbar-text);
    font-family: var(--gov-font-xp);
    font-size: 12px;
    -webkit-font-smoothing: none;
    -moz-osx-font-smoothing: grayscale;
    font-smooth: never;
    text-rendering: optimizeSpeed;
    height: 36px;
    line-height: 36px;
    position: sticky;
    top: 0;
    z-index: 9000;
}

/* ★ 关键：flex 三段布局 */
.topbar__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 36px;
}

.topbar__links {
    display: flex;
    align-items: center;
    flex: none;
}

.topbar__links a {
    color: var(--gov-topbar-text);
    padding: 0 10px;
}

.topbar__links a:hover {
    color: #ffe9a8;
    text-decoration: underline;
}

.topbar__sep {
    color: rgba(255, 255, 255, .45);
}

.topbar__slogan {
    flex: 1;
    text-align: center;
    color: #ffd24a;
    font-weight: bold;
    letter-spacing: 1px;
    white-space: nowrap;
    overflow: hidden;
}

.topbar__right {
    flex: none;
    white-space: nowrap;
}

.topbar__visits b {
    color: #ffd24a;
}

.topbar__clock {
    font-family: var(--gov-font-xp);
    font-size: 12px;
}

@media (max-width: 700px) {
    .topbar__slogan {
        display: none;
    }

    .topbar__links a {
        padding: 0 6px;
    }
}
</style>