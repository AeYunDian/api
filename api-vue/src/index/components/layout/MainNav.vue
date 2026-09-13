<script setup>
import { useRoute } from 'vue-router'
import { navItems } from '@/index/data/site'

const route = useRoute()
const isActive = (item) => route.meta?.nav === item.name
</script>

<template>
    <nav class="mainnav">
        <div class="gov-container mainnav__inner">
            <router-link v-for="item in navItems" :key="item.name" :to="item.path" class="mainnav__link"
                :class="{ 'is-active': isActive(item) }">{{ item.label }}</router-link>
        </div>
    </nav>
</template>

<style scoped>
.mainnav {
    background: var(--gov-blue-deep);
    height: 50px;
    line-height: 50px;
    border-bottom: 3px solid var(--gov-nav-gold);
}

/* ★ 关键：导航项横排 */
.mainnav__inner {
    display: flex;
    align-items: stretch;
    height: 50px;
}

.mainnav__link {
    display: inline-flex;
    align-items: center;
    height: 50px;
    padding: 0 34px;
    color: #fff;
    font-size: 18px;
    font-weight: bold;
    font-family: var(--gov-font-title);
    letter-spacing: 2px;
    border-right: 1px solid rgba(255, 255, 255, .18);
    border-left: 1px solid rgba(255, 255, 255, .08);
    transition: background .15s;
    white-space: nowrap;
}

.mainnav__link:first-child {
    border-left: 0;
}

.mainnav__link:hover {
    background: var(--gov-blue-hover);
    color: #fff;
    text-decoration: none;
}

.mainnav__link.is-active {
    background: #ffffff;
    color: var(--gov-blue-deep);
}

@media (max-width: 700px) {
    .mainnav__inner {
        overflow-x: auto;
    }

    .mainnav__link {
        padding: 0 var(--gov-gap-lg);
    }
}
</style>