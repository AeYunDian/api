<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { site } from '@/index/data/site'

const keyword = ref('')
const router = useRouter()
function search() {
    const q = keyword.value.trim()
    if (!q) return
    router.push({ path: '/search', query: { q } })
}
</script>

<template>
    <header class="site-header">
        <div class="gov-container site-header__inner">
            <router-link to="/" class="brand">
                <div class="brand__text">
                    <h1 class="brand__name">{{ site.name }}</h1>
                    <p class="brand__sub">{{ site.subtitle }}</p>
                </div>
            </router-link>

            <div class="search">
                <input v-model="keyword" class="search__input" type="search" placeholder="请输入关键词检索站内信息"
                    @keyup.enter="search" />
                <button class="search__btn" type="button" @click="search">查询</button>
            </div>
        </div>
    </header>
</template>

<style scoped>
.site-header {
    background: var(--gov-bg);
    border-bottom: 1px solid var(--gov-border-strong);
    padding: 14px 0;
}

/* ★ 关键：左右两端布局 */
.site-header__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 92px;
    gap: var(--gov-gap-xl);
}

/* ★ 关键：品牌区 flex 横排 */
.brand {
    display: flex;
    align-items: center;
    gap: var(--gov-gap-lg);
    flex: 1;
    min-width: 0;
}

.brand:hover {
    text-decoration: none;
}


.brand__text {
    min-width: 0;
}

.brand__name {
    font-family: var(--gov-font-title);
    font-size: 30px;
    font-weight: 900;
    color: var(--gov-blue-deep);
    letter-spacing: 2px;
    line-height: 1.2;
}

.brand__sub {
    font-family: var(--gov-font-serif);
    font-size: 15px;
    letter-spacing: 4px;
    color: var(--gov-text-sub);
    margin-top: 4px;
}

/* ★ 关键：搜索框 flex */
.search {
    display: flex;
    align-items: center;
    height: 38px;
    flex: none;
}

.search__input {
    width: 240px;
    height: 100%;
    padding: 0 16px;
    background: #f0f0f0;
    border: 1px solid #d9d9d9;
    border-right: 0;
    border-radius: 0;
    outline: none;
}

.search__input:focus {
    border-color: var(--gov-blue);
}

.search__btn {
    width: 74px;
    height: 100%;
    background: var(--gov-btn-primary);
    color: #fff;
    border: 0;
    border-left: 1px solid #d9d9d9;
    font-weight: bold;
    letter-spacing: 3px;
    cursor: pointer;
}

.search__btn:hover {
    background: var(--gov-btn-primary-hover);
}

@media (max-width: 860px) {
    .site-header__inner {
        flex-direction: column;
        align-items: stretch;
    }

    .search__input {
        width: 100%;
    }

    .brand__name {
        font-size: var(--gov-fs-2xl);
    }
}
</style>