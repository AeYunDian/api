<script setup>
import { ref, computed, onMounted, watch, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Dialog, Snackbar } from '@varlet/ui'
import { useIsAdmin } from '@/console/composables/useIsAdmin'
import { formatTime } from '@/shared/utils/format'
import '@varlet/ui/es/dialog/style'
import '@varlet/ui/es/snackbar/style'

/* ───────────── 上下文 ───────────── */

const route = useRoute()
const router = useRouter()
const user = inject('user')
const isAdmin = useIsAdmin()

const BASE = import.meta.env.PROD
    ? 'https://console.undz.cn'
    : 'https://console-dev.undz.cn'

const PUBLIC_BASE = 'https://files.undz.cn'
const ROUTE_PREFIX = '/console-panel/file-manager'

/* ───────────── 从 URL 派生当前目录 ───────────── */

/**
 * `route.params.pathMatch` 会是：
 *   /console-panel/file-manager              → ''
 *   /console-panel/file-manager/             → ''
 *   /console-panel/file-manager/folder/      → 'folder/'
 *   /console-panel/file-manager/folder/aaa/  → 'folder/aaa/'
 *   /console-panel/file-manager/folder/aaa    → 'folder/aaa'
 */
const rawSegments = computed(() => {
    const m = route.params.pathMatch
    const str = Array.isArray(m) ? m.join('/') : String(m || '')
    return str.split('/').filter(Boolean)
})

/** 面向业务：始终以 `/` 开头、末尾带 `/`，根目录就是 `/` */
const currentPath = computed(() => {
    const segs = rawSegments.value
    return segs.length ? '/' + segs.join('/') + '/' : '/'
})

/** 规范化后用于 API 的路径 */
const apiPrefix = computed(() => currentPath.value)

/* ───────────── 状态 ───────────── */

const allFiles = ref([])
const loading = ref(false)
const refreshing = ref(false)
const errorMsg = ref('')

const showUploadDialog = ref(false)
const showEditDialog = ref(false)
const uploading = ref(false)
const updating = ref(false)

const uploadForm = ref(emptyUploadForm())
const editForm = ref(emptyEditForm())

function emptyUploadForm() {
    return {
        name: '',
        file: null,
        fileName: '',
        needPassword: false,
        password: '',
        code: '',
        expirationat: '',
    }
}

function emptyEditForm() {
    return {
        path: '',
        original: null,
        file: null,
        fileName: '',
        needPassword: false,
        password: '',
        code: '',
        expirationat: '',
    }
}

/* ───────────── 计算 ───────────── */

/** 面包屑：根 / folder / aaa */
const breadcrumbs = computed(() => {
    const segs = rawSegments.value
    const list = [{ name: '根目录', path: '' }]
    let acc = ''
    for (const s of segs) {
        acc += '/' + s
        list.push({ name: s, path: acc })
    }
    return list
})

/** 当前层的目录和文件 */
const entries = computed(() => {
    const prefix = currentPath.value
    const dirs = new Set()
    const files = []

    for (const f of allFiles.value) {
        if (!f.path.startsWith(prefix)) continue
        const rest = f.path.slice(prefix.length)
        if (!rest) continue
        const slash = rest.indexOf('/')
        if (slash === -1) {
            files.push(f)
        } else {
            dirs.add(rest.slice(0, slash))
        }
    }

    const dirList = [...dirs].sort().map((name) => {
        const dirUrlPath = (currentPath.value === '/'
            ? ''
            : currentPath.value.slice(0, -1)) + '/' + name
        const dirPrefix = currentPath.value + name + '/'
        const count = allFiles.value.filter((f) =>
            f.path.startsWith(dirPrefix)
        ).length
        return { name, urlPath: dirUrlPath, count }
    })

    return {
        dirs: dirList,
        files: files.sort((a, b) => a.path.localeCompare(b.path)),
    }
})

/* ───────────── 数据加载 ───────────── */

async function loadFiles() {
    if (!isAdmin.value) return
    loading.value = true
    errorMsg.value = ''

    try {
        const res = await fetch(
            `${BASE}/api/filesmanager/?path=${encodeURIComponent(apiPrefix.value)}`,
            { credentials: 'include' }
        )
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
        allFiles.value = data.files || []
    } catch (e) {
        errorMsg.value = e.message || '加载失败'
        allFiles.value = []
    } finally {
        loading.value = false
    }
}

async function refresh() {
    refreshing.value = true
    try {
        await loadFiles()
    } finally {
        refreshing.value = false
    }
}

/* ───────────── 路由导航 ───────────── */

function navigateTo(urlPath) {
    const clean = String(urlPath || '').replace(/^\/+|\/+$/g, '')
    const target = clean ? `${ROUTE_PREFIX}/${clean}/` : `${ROUTE_PREFIX}/`
    router.push(target)
}

/* ───────────── 上传 ───────────── */

function openUpload() {
    uploadForm.value = emptyUploadForm()
    showUploadDialog.value = true
}

function onUploadFileChange(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    uploadForm.value.file = file
    uploadForm.value.fileName = file.name
    if (!uploadForm.value.name) {
        uploadForm.value.name = file.name
    }
}

function composeUploadPath() {
    const name = String(uploadForm.value.name || '').trim().replace(/^\/+/, '')
    if (!name) return ''
    return currentPath.value + name
}

async function handleUpload() {
    const f = uploadForm.value
    if (!f.file || !f.name.trim()) {
        Snackbar.warning('请选择文件并填写文件名')
        return
    }
    if (f.needPassword && !f.password) {
        Snackbar.warning('请输入访问密码')
        return
    }

    const finalPath = composeUploadPath()

    const fd = new FormData()
    fd.append('path', finalPath)
    fd.append('file', f.file)
    if (f.needPassword) {
        fd.append('needPassword', 'true')
        fd.append('password', f.password)
    }
    if (f.code) fd.append('code', f.code.trim())
    if (f.expirationat) {
        const ts = Math.floor(new Date(f.expirationat).getTime() / 1000)
        if (!isNaN(ts) && ts > 0) fd.append('expirationat', String(ts))
    }

    uploading.value = true
    try {
        const res = await fetch(`${BASE}/api/filesmanager/`, {
            method: 'POST',
            credentials: 'include',
            body: fd,
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || '上传失败')

        Snackbar.success('上传成功')
        showUploadDialog.value = false
        await loadFiles()

        const action = await Dialog({
            title: '上传成功',
            message: `存储路径：${data.path}\n公开链接：${data.url}`,
            dialogStyle: { whiteSpace: 'pre-line' },
            confirmButtonText: '复制链接',
            cancelButtonText: '关闭',
        })
        if (action === 'confirm') {
            try {
                await navigator.clipboard.writeText(data.url)
                Snackbar.success('已复制')
            } catch {
                Snackbar.warning('复制失败')
            }
        }
    } catch (e) {
        Snackbar.error(e.message || '上传失败')
    } finally {
        uploading.value = false
    }
}

/* ───────────── 编辑 ───────────── */

function openEdit(file) {
    editForm.value = {
        path: file.path,
        original: file,
        file: null,
        fileName: '',
        needPassword: !!file.need_password,
        password: '',
        code: file.code,
        expirationat: file.expiration_at
            ? toDatetimeLocal(file.expiration_at)
            : '',
    }
    showEditDialog.value = true
}

function onEditFileChange(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    editForm.value.file = file
    editForm.value.fileName = file.name
}

async function handleEdit() {
    const f = editForm.value
    if (!f.file) {
        Snackbar.warning('必须重新选择文件')
        return
    }
    if (f.needPassword && !f.password && !f.original?.need_password) {
        Snackbar.warning('请输入访问密码')
        return
    }

    const fd = new FormData()
    fd.append('path', f.path)
    fd.append('file', f.file)
    fd.append('needPassword', f.needPassword ? 'true' : 'false')
    if (f.needPassword && f.password) {
        fd.append('password', f.password)
    }
    if (f.code && f.code !== f.original?.code) {
        fd.append('code', f.code.trim())
    }
    if (f.expirationat) {
        const ts = Math.floor(new Date(f.expirationat).getTime() / 1000)
        fd.append('expirationat', String(ts))
    } else {
        fd.append('expirationat', '')
    }

    updating.value = true
    try {
        const res = await fetch(`${BASE}/api/filesmanager/`, {
            method: 'PUT',
            credentials: 'include',
            body: fd,
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || '更新失败')
        Snackbar.success('已更新')
        showEditDialog.value = false
        await loadFiles()
    } catch (e) {
        Snackbar.error(e.message || '更新失败')
    } finally {
        updating.value = false
    }
}

function toDatetimeLocal(unixSec) {
    const d = new Date(unixSec * 1000)
    const pad = (n) => String(n).padStart(2, '0')
    return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
        `T${pad(d.getHours())}:${pad(d.getMinutes())}`
    )
}

/* ───────────── 删除 ───────────── */

async function handleDeleteFile(file) {
    const action = await Dialog({
        title: '确认删除',
        message: `确定删除 "${file.path}" 吗？`,
        confirmButtonText: '删除',
        cancelButtonText: '取消',
    })
    if (action !== 'confirm') return

    try {
        const res = await fetch(
            `${BASE}/api/filesmanager/?path=${encodeURIComponent(file.path)}`,
            { method: 'DELETE', credentials: 'include' }
        )
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || '删除失败')
        Snackbar.success('已删除')
        await loadFiles()
    } catch (e) {
        Snackbar.error(e.message || '删除失败')
    }
}

async function handleDeleteDir(dir) {
    const action = await Dialog({
        title: '确认删除目录',
        message: `删除 "${dir.name}" 及其下 ${dir.count} 个文件？`,
        confirmButtonText: '删除',
        cancelButtonText: '取消',
    })
    if (action !== 'confirm') return

    try {
        const res = await fetch(
            `${BASE}/api/filesmanager/?path=${encodeURIComponent(dir.urlPath + '/')}`,
            { method: 'DELETE', credentials: 'include' }
        )
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || '删除失败')
        Snackbar.success(`已删除 ${data.deleted} 个文件`)
        await loadFiles()
    } catch (e) {
        Snackbar.error(e.message || '删除失败')
    }
}

/* ───────────── 下载 / 复制 ───────────── */

function downloadFile(file) {
    window.open(
        `${BASE}/api/filesmanager/?path=${encodeURIComponent(file.path)}`,
        '_blank'
    )
}

async function copyPublicUrl(file) {
    const url = `${PUBLIC_BASE}/files/${file.code}`
    try {
        await navigator.clipboard.writeText(url)
        Snackbar.success('已复制')
    } catch {
        Snackbar.warning('复制失败：' + url)
    }
}

/* ───────────── 工具 ───────────── */

function formatBytes(n) {
    if (!n) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let i = 0
    let v = n
    while (v >= 1024 && i < units.length - 1) {
        v /= 1024
        i++
    }
    return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`
}

function fmtTime(ts) {
    if (!ts) return '永久'
    return formatTime(ts)
}

function baseName(p) {
    const parts = String(p || '').split('/')
    return parts[parts.length - 1] || p
}

/* ───────────── 生命周期 ───────────── */

watch(
    () => route.path,
    () => {
        if (!route.path.startsWith(ROUTE_PREFIX)) return
        loadFiles()
    }
)

onMounted(() => {
    if (isAdmin.value) loadFiles()
})
</script>

<template>
    <var-pull-refresh v-model="refreshing" @refresh="refresh">
        <!-- 无权限 -->
        <div v-if="!isAdmin" class="no-access">
            <h2>仅管理员可访问</h2>
            <p>文件管理器只对超级管理员开放。</p>
        </div>

        <div v-else class="fm-wrap">
            <!-- 头部 -->
            <div class="page-header">
                <h2>文件管理器</h2>
                <div class="header-actions">
                    <var-button size="small" @click="refresh" :loading="refreshing">
                        刷新
                    </var-button>
                    <var-button type="primary" size="small" @click="openUpload">
                        上传文件
                    </var-button>
                </div>
            </div>

            <!-- 面包屑 -->
            <div class="breadcrumb">
                <template v-for="(b, i) in breadcrumbs" :key="b.path || 'root'">
                    <span v-if="i > 0" class="crumb-sep">/</span>
                    <span class="crumb" :class="{ current: i === breadcrumbs.length - 1 }"
                        @click="i === breadcrumbs.length - 1 ? null : navigateTo(b.path)">
                        {{ b.name }}
                    </span>
                </template>
            </div>

            <var-progress v-if="loading" indeterminate />

            <!-- 错误 -->
            <div v-else-if="errorMsg" class="empty-block">
                <p class="empty-text">{{ errorMsg }}</p>
                <var-button type="primary" @click="loadFiles">重试</var-button>
            </div>

            <!-- 空 -->
            <div v-else-if="!entries.dirs.length && !entries.files.length" class="empty-block">
                <p class="empty-text">此目录为空</p>
                <var-button type="primary" @click="openUpload">上传第一个文件</var-button>
            </div>

            <!-- 列表 -->
            <div v-else class="file-list">
                <!-- 目录 -->
                <div v-for="dir in entries.dirs" :key="'d-' + dir.urlPath" class="file-row dir-row"
                    @click="navigateTo(dir.urlPath)">
                    <div class="file-icon dir-icon">
                        <my-icon icon="folder-outline" size="1.2em" />
                    </div>
                    <div class="file-main">
                        <div class="file-name">{{ dir.name }}</div>
                        <div class="file-meta">
                            <span>{{ dir.count }} 个文件</span>
                        </div>
                    </div>
                    <div class="file-actions" @click.stop>
                        <var-button text size="small" type="danger" @click="handleDeleteDir(dir)">
                            删除
                        </var-button>
                    </div>
                </div>

                <!-- 文件 -->
                <div v-for="file in entries.files" :key="'f-' + file.path" class="file-row">
                    <div class="file-icon">
                        <my-icon icon="file-outline" size="1.2em" />
                    </div>
                    <div class="file-main">
                        <div class="file-name" :title="file.path">
                            {{ baseName(file.path) }}
                        </div>
                        <div class="file-meta">
                            <span>{{ formatBytes(file.size) }}</span>
                            <span v-if="file.need_password" class="tag tag-lock">
                                <my-icon icon="lock-outline" size="10px" />
                                密码
                            </span>
                            <span v-if="file.expiration_at" class="tag tag-exp" :title="fmtTime(file.expiration_at)">
                                至 {{ fmtTime(file.expiration_at) }}
                            </span>
                            <span class="tag tag-code" @click="copyPublicUrl(file)" title="点击复制公开链接">
                                {{ file.code }}
                            </span>
                        </div>
                    </div>
                    <div class="file-actions">
                        <var-button text size="small" @click="downloadFile(file)">
                            下载
                        </var-button>
                        <var-button text size="small" @click="openEdit(file)">
                            编辑
                        </var-button>
                        <var-button text size="small" type="danger" @click="handleDeleteFile(file)">
                            删除
                        </var-button>
                    </div>
                </div>
            </div>
        </div>
    </var-pull-refresh>

    <!-- ─── 上传对话框 ─── -->
    <var-popup v-model:show="showUploadDialog" class="var-dialog__popup" var-dialog-cover>
        <div class="var--box var-dialog">
            <div class="var-dialog__title">上传文件</div>
            <div class="dialog-message">
                <div class="field">
                    <label class="field-label">选择文件</label>
                    <input type="file" class="native-input" @change="onUploadFileChange" />
                    <div v-if="uploadForm.fileName" class="file-picked">
                        已选择：{{ uploadForm.fileName }}
                    </div>
                </div>

                <div class="field">
                    <label class="field-label">文件名</label>
                    <var-input v-model="uploadForm.name" placeholder="例如 setup.exe" />
                    <div class="hint">
                        将上传到 <code>{{ composeUploadPath() || currentPath + '...' }}</code>
                    </div>
                </div>

                <div class="field">
                    <label class="field-label">公开访问短码（可选）</label>
                    <var-input v-model="uploadForm.code" placeholder="留空自动生成" />
                    <div class="hint">4-128 位，只允许 A-Z a-z 0-9 _ -</div>
                </div>

                <div class="field">
                    <var-checkbox v-model="uploadForm.needPassword">
                        设置访问密码
                    </var-checkbox>
                </div>

                <div v-if="uploadForm.needPassword" class="field">
                    <label class="field-label">访问密码</label>
                    <var-input v-model="uploadForm.password" type="password" placeholder="下载时需要输入" />
                </div>

                <div class="field">
                    <label class="field-label">过期时间（可选）</label>
                    <input v-model="uploadForm.expirationat" type="datetime-local" class="native-input" />
                    <div class="hint">留空表示永久有效</div>
                </div>
            </div>
            <div class="var-dialog__actions">
                <var-button text type="primary" class="var--inline-flex var-dialog__button"
                    @click="showUploadDialog = false">
                    取消
                </var-button>
                <var-button text type="primary" class="var--inline-flex var-dialog__button" :loading="uploading"
                    @click="handleUpload">
                    上传
                </var-button>
            </div>
        </div>
    </var-popup>

    <!-- ─── 编辑对话框 ─── -->
    <var-popup v-model:show="showEditDialog" class="var-dialog__popup" var-dialog-cover>
        <div class="var--box var-dialog">
            <div class="var-dialog__title">编辑文件</div>
            <div class="dialog-message">
                <div class="field">
                    <label class="field-label">路径</label>
                    <div class="readonly-field">{{ editForm.path }}</div>
                </div>

                <div class="field">
                    <label class="field-label">重新选择文件（必选）</label>
                    <input type="file" class="native-input" @change="onEditFileChange" />
                    <div v-if="editForm.fileName" class="file-picked">
                        已选择：{{ editForm.fileName }}
                    </div>
                    <div class="hint warn">
                        接口限制：编辑会重写存储对象，必须重新选择文件。
                    </div>
                </div>

                <div class="field">
                    <label class="field-label">公开访问短码</label>
                    <var-input v-model="editForm.code" placeholder="留空保持原值" />
                </div>

                <div class="field">
                    <var-checkbox v-model="editForm.needPassword">
                        设置访问密码
                    </var-checkbox>
                </div>

                <div v-if="editForm.needPassword" class="field">
                    <label class="field-label">访问密码</label>
                    <var-input v-model="editForm.password" type="password" placeholder="留空则不修改" />
                </div>

                <div class="field">
                    <label class="field-label">过期时间</label>
                    <input v-model="editForm.expirationat" type="datetime-local" class="native-input" />
                    <div class="hint">清空表示永久有效</div>
                </div>
            </div>
            <div class="var-dialog__actions">
                <var-button text type="primary" class="var--inline-flex var-dialog__button"
                    @click="showEditDialog = false">
                    取消
                </var-button>
                <var-button text type="primary" class="var--inline-flex var-dialog__button" :loading="updating"
                    @click="handleEdit">
                    保存
                </var-button>
            </div>
        </div>
    </var-popup>
</template>

<style scoped>
/* ── 无权限 ── */
.no-access {
    text-align: center;
    padding: 90px 20px;
    color: var(--color-text-secondary, #888);
}

.no-access h2 {
    margin: 0 0 8px;
    font-size: 20px;
    color: var(--color-text, #222);
}

/* ── 头部 ── */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    gap: 12px;
    flex-wrap: wrap;
}

.page-header h2 {
    margin: 0;
}

.header-actions {
    display: flex;
    gap: 8px;
}

/* ── 面包屑 ── */
.breadcrumb {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    padding: 10px 12px;
    background: var(--color-surface-container, #f5f5f8);
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 12px;
    font-family: ui-monospace, Menlo, Consolas, monospace;
    word-break: break-all;
}

.crumb {
    color: var(--color-primary, #5b54e8);
    cursor: pointer;
    user-select: none;
}

.crumb:hover {
    text-decoration: underline;
}

.crumb.current {
    color: var(--color-text, #222);
    cursor: default;
}

.crumb.current:hover {
    text-decoration: none;
}

.crumb-sep {
    color: var(--color-text-secondary, #888);
}

/* ── 空态 ── */
.empty-block {
    text-align: center;
    padding: 60px 20px;
    color: var(--color-text-secondary, #888);
}

.empty-text {
    margin: 0 0 16px;
}

/* ── 文件列表 ── */
.file-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.file-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: var(--color-surface-container, #f5f5f8);
    border: 1px solid transparent;
    border-radius: 8px;
    transition: border-color 0.15s;
}

.file-row:hover {
    border-color: var(--color-outline-variant, rgba(0, 0, 0, 0.08));
}

.dir-row {
    cursor: pointer;
}

.dir-row:hover {
    background: var(--color-surface-container-high, #eee);
}

.file-icon {
    flex: none;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: var(--color-surface, #fff);
    color: var(--color-primary, #5b54e8);
}

.dir-icon {
    color: #f5b400;
}

.file-main {
    flex: 1;
    min-width: 0;
}

.file-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text, #222);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.file-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-text-secondary, #888);
}

.tag {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 11px;
    line-height: 1.6;
    font-family: ui-monospace, Menlo, Consolas, monospace;
}

.tag-lock {
    background: rgba(245, 180, 0, 0.15);
    color: #b8860b;
}

.tag-exp {
    background: rgba(91, 84, 232, 0.12);
    color: var(--color-primary, #5b54e8);
}

.tag-code {
    background: rgba(0, 0, 0, 0.06);
    color: var(--color-text-secondary, #666);
    cursor: pointer;
    user-select: none;
}

.tag-code:hover {
    background: rgba(91, 84, 232, 0.12);
    color: var(--color-primary, #5b54e8);
}

.file-actions {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
}

/* ── 对话框 ── */
.dialog-message {
    padding: 0 24px 16px;
}

.field {
    margin-bottom: 14px;
}

.field-label {
    display: block;
    font-size: 12.5px;
    font-weight: 500;
    color: var(--color-text-secondary, #666);
    margin-bottom: 6px;
}

.hint {
    font-size: 12px;
    color: var(--color-text-secondary, #888);
    margin-top: 4px;
}

.hint.warn {
    color: #c4553d;
}

.hint code {
    font-family: ui-monospace, Menlo, Consolas, monospace;
    padding: 1px 5px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
    font-size: 11.5px;
    word-break: break-all;
}

.readonly-field {
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 13px;
    padding: 8px 12px;
    background: var(--color-surface-container, #f5f5f8);
    border-radius: 6px;
    word-break: break-all;
    color: var(--color-text, #222);
}

.native-input {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.2));
    border-radius: 6px;
    background: var(--color-surface, #fff);
    color: var(--color-text, #222);
    font-size: 13px;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
}

.native-input:focus {
    border-color: var(--color-primary, #5b54e8);
}

.file-picked {
    font-size: 12px;
    color: var(--color-primary, #5b54e8);
    margin-top: 4px;
    word-break: break-all;
}

/* ── 移动端 ── */
@media (max-width: 640px) {
    .file-row {
        padding: 10px;
        gap: 8px;
    }

    .file-icon {
        width: 28px;
        height: 28px;
    }

    .file-actions {
        gap: 0;
    }

    .file-actions .var-button {
        padding: 0 4px;
    }

    .file-actions .var-button :deep(.var-button__content) {
        font-size: 12px;
    }
}
</style>