<script setup>
import { site } from '@/index/data/site'
</script>

<template>
    <footer class="site-footer">
        <div class="gov-container">
            <div class="footer-links">
                <router-link to="/about">关于本站</router-link>
                <span>|</span>
                <router-link to="/contact">联系我</router-link>
                <span>|</span>
                <router-link to="/privacy">隐私政策</router-link>
                <span>|</span>
                <router-link to="/terms">服务条款</router-link>
                <span>|</span>
                <router-link to="/cookies">Cookie 政策</router-link>
            </div>
            <div class="footer-meta">
                <p class="footer-org">主办单位：{{ site.org }}</p>
                <!-- <p>{{ site.icp }} &nbsp;|&nbsp; {{ site.police }}</p> -->
                <p class="footer-tip">{{ site.icp }} | 技术支持：{{ site.support }}</p>
                <p class="footer-tip">建议使用 IE8 及以上版本浏览器 / 360安全浏览器极速模式访问本站，以获得最佳显示效果</p>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.footer-org {
    font-size: 14px;
    color: #444;
    font-family: var(--gov-font-title);
}

.footer-tip {
    color: var(--gov-text-muted);
    font-family: var(--gov-font-num);
}

.site-footer {
    /* ★ 白底！不是深蓝底 */
    background: var(--gov-bg);
    border-top: 1px solid var(--gov-border-strong);
    /* 顶部深蓝细线 */
    color: var(--gov-text-sub);
    padding: 16px 0 24px;
    text-align: center;
    font-size: 13px;
    line-height: 2;
    margin-top: var(--gov-gap-2xl);
}

/* ★ 页脚链接：深灰蓝，不是浅蓝白字 */
.footer-links {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--gov-gap-md);
    padding-bottom: var(--gov-gap-md);
    /* 去掉白底线 */
}

.footer-links a {
    color: var(--gov-text-sub);
}

.footer-links a:hover {
    color: var(--gov-blue-deep);
    text-decoration: underline;
}

.footer-links span {
    color: var(--gov-border-deep);
}

.footer-meta {
    padding-top: var(--gov-gap-md);
}

/* ★ 主办单位：稍微深一点 + 政务标题字体 */
.footer-org {
    font-size: 14px;
    color: #444;
    font-family: var(--gov-font-title);
}

/* ★ 备案号：数字字体 */
.footer-beian {
    color: var(--gov-text-muted);
    font-family: var(--gov-font-num);
}
</style>