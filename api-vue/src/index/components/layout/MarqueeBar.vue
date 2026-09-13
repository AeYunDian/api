<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { site } from '@/index/data/site'

const messages = [
    '韵典综合平台博客子应用正式上线，欢迎体验。',
    site.slogan,
    '所有文章仅代表个人观点，与任何机构无关。',
    '如需转载，请注明出处并保留原文链接。',
]

const track = ref(null)
const hovered = ref(false)      // ★ 新增：悬浮状态
let offset = 0
let raf

function loop() {
    if (!track.value) return

    // 悬浮时冻结 offset（不推进），但 raf 继续跑，以便鼠标移开后立即恢复
    if (!hovered.value) {
        const w = track.value.scrollWidth / 2
        offset -= 0.7                       // 速度：每帧 0.7px
        if (-offset >= w) offset = 0
        track.value.style.transform = `translateX(${offset}px)`
    }

    raf = requestAnimationFrame(loop)
}

function onEnter() { hovered.value = true }
function onLeave() { hovered.value = false }

onMounted(() => { raf = requestAnimationFrame(loop) })
onUnmounted(() => cancelAnimationFrame(raf))
</script>

<template>
    <div class="marquee">
        <div class="gov-container marquee__inner">
            <span class="marquee__label">重要通知</span>
            <!-- ★ 关键：给 viewport 挂 mouseenter/mouseleave -->
            <div class="marquee__viewport" @mouseenter="onEnter" @mouseleave="onLeave">
                <div ref="track" class="marquee__track">
                    <span v-for="(m, i) in messages" :key="'a' + i" class="marquee__item">{{ m }}</span>
                    <span v-for="(m, i) in messages" :key="'b' + i" class="marquee__item">{{ m }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.marquee {
    background: var(--gov-bg);
    border: 1px solid var(--gov-border);
    border-top: 0;
    height: 34px;
    line-height: 32px;
    overflow: hidden;

    /* ★ 字体：XP 点阵宋体 + 关闭抗锯齿（这是政务风的灵魂） */
    font-family: var(--gov-font-xp);
    font-size: 12px;
    -webkit-font-smoothing: none;
    -moz-osx-font-smoothing: grayscale;
    font-smooth: never;
    text-rendering: optimizeSpeed;
}

.marquee__inner {
    display: flex;
    align-items: center;
    height: 100%;
}

/* ★ 标签：红底白字，不是红字 */
.marquee__label {
    flex: none;
    height: 100%;
    display: inline-flex;
    align-items: center;
    padding: 0 10px;
    background: var(--gov-red);
    /* #e4393c */
    color: #fff;
    font-weight: bold;
    letter-spacing: 1px;
    position: relative;
    z-index: 2;
}

/* ★ 通道隔离：viewport 必须 overflow hidden */
.marquee__viewport {
    flex: 1;
    min-width: 0;
    height: 100%;
    overflow: hidden;
    position: relative;
    cursor: default;
    /* 悬浮时不需要 pointer，但保留交互 */
}

.marquee__track {
    position: absolute;
    top: 0;
    left: 0;
    display: inline-flex;
    white-space: nowrap;
    will-change: transform;
}

.marquee__item {
    padding: 0 26px;
    /* ★ 从 80 改 26，贴合 gov.css */
    color: #444;
    /* ★ 用 #444 而不是 --gov-text-sub */
    font-size: 12px;
}
</style>