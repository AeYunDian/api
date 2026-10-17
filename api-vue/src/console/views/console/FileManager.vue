<script setup>
import { ref, computed, onMounted, watch, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Dialog, Snackbar } from '@varlet/ui'
import { useIsAdmin } from '@/console/composables/useIsAdmin'
import { formatTime } from '@/shared/utils/format'
import '@varlet/ui/es/dialog/style'
import '@varlet/ui/es/snackbar/style'
import '@varlet/ui/es/uploader/style'
import '@varlet/ui/es/date-input/style'
import '@varlet/ui/es/breadcrumbs/style'
import '@varlet/ui/es/fab/style'

/* ───────────── 上下文 ───────────── */

const route = useRoute()
const router = useRouter()
const user = inject('user')
const isAdmin = useIsAdmin()

const BASE = 'https://console.undz.cn'

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

/* var-uploader 的受控文件列表（VarFile[]） */
const uploadFiles = ref([])
const editFiles = ref([])

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
    uploadFiles.value = []
    showUploadDialog.value = true
}

/* var-uploader 读取完文件后回调（替代原生的 <input type="file">） */
function onUploadFileRead(file) {
    uploadForm.value.file = file.file
    uploadForm.value.fileName = file.name
    if (!uploadForm.value.name) {
        uploadForm.value.name = file.name
    }
}

function onUploadFileRemove() {
    uploadForm.value.file = null
    uploadForm.value.fileName = ''
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
    editFiles.value = []
    showEditDialog.value = true
}

function onEditFileRead(file) {
    editForm.value.file = file.file
    editForm.value.fileName = file.name
}

function onEditFileRemove() {
    editForm.value.file = null
    editForm.value.fileName = ''
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

/**
 * Unix 秒 → var-date-input 期望的 `YYYY-MM-DD HH:mm`（注意不是 ISO 的 T 分隔）
 */
function toDatetimeLocal(unixSec) {
    const d = new Date(unixSec * 1000)
    const pad = (n) => String(n).padStart(2, '0')
    return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
        ` ${pad(d.getHours())}:${pad(d.getMinutes())}`
    )
}

/* ───────────── 删除 ───────────── */

async function handleDeleteFile(file) {
    const action = await Dialog({
        title: '确认删除',
        confirmButtonProps: { text: false, type: 'danger' },
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
        confirmButtonProps: { text: false, type: 'danger' },
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

/* 面包屑下方的副标题：当前目录 + 条目统计 */
const pageSubtitle = computed(() => {
    if (!isAdmin.value) return '文件管理器只对超级管理员开放'
    if (loading.value && !allFiles.value.length) return '正在读取目录…'
    return `${currentPath.value} · ${entries.value.dirs.length} 个目录 / ${entries.value.files.length} 个文件`
})

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
        <var-result v-if="!isAdmin" type="warning" title="仅管理员可访问" description="文件管理器只对超级管理员开放。" />

        <div v-else class="fm-page">
            <!-- MD3 page header -->
            <div class="md-page-header">
                <div class="md-page-heading">
                    <h1 class="md-page-title">文件管理器</h1>
                    <p class="md-page-subtitle">{{ pageSubtitle }}</p>
                </div>
                <div class="md-page-actions">
                    <var-tooltip content="刷新当前目录">
                        <var-button round icon-container @click="refresh" :loading="refreshing">
                            <my-icon icon="refresh" size="1em + 8px" />
                        </var-button>
                    </var-tooltip>
                </div>
            </div>

            <!-- MD3 面包屑：使用 Varlet Breadcrumbs，而不是手写 span 路径 -->
            <var-breadcrumbs class="fm-breadcrumbs" separator="/">
                <var-breadcrumb v-for="(b, i) in breadcrumbs" :key="b.path || 'root'"
                    @click="i < breadcrumbs.length - 1 && navigateTo(b.path)">
                    {{ b.name }}
                </var-breadcrumb>
            </var-breadcrumbs>

            <var-progress v-if="loading" indeterminate />

            <!-- 错误 -->
            <var-result v-else-if="errorMsg" type="error" title="加载失败" :description="errorMsg">
                <template #footer>
                    <var-button type="primary" @click="loadFiles">重试</var-button>
                </template>
            </var-result>

            <!-- 空 -->
            <var-result v-else-if="!entries.dirs.length && !entries.files.length" type="empty" title="此目录为空"
                description="点击右下角的浮动按钮上传第一个文件。">
                <template #footer>
                    <var-button type="primary" @click="openUpload">上传文件</var-button>
                </template>
            </var-result>

            <!-- 列表：目录与文件都用 var-cell（MD3 list item） -->
            <div v-else class="fm-list">
                <var-cell v-for="dir in entries.dirs" :key="'d-' + dir.urlPath" :title="dir.name" :border="true"
                    class="fm-row fm-row--dir" v-ripple @click="navigateTo(dir.urlPath)">
                    <template #icon>
                        <my-icon icon="folder-outline" size="1.3em" class="fm-icon fm-icon--dir" />
                    </template>
                    <template #description>
                        <span class="fm-dir-count">{{ dir.count }} 个文件</span>
                    </template>
                    <template #extra>
                        <var-button text type="danger" size="small" @click.stop="handleDeleteDir(dir)">
                            删除
                        </var-button>
                    </template>
                </var-cell>

                <var-cell v-for="file in entries.files" :key="'f-' + file.path" :title="baseName(file.path)"
                    :border="true" class="fm-row">
                    <template #icon>
                        <my-icon icon="file-outline" size="1.3em" class="fm-icon" />
                    </template>
                    <template #description>
                        <div class="fm-meta">
                            <span>{{ formatBytes(file.size) }}</span>
                            <span v-if="file.need_password" class="fm-tag fm-tag--lock">
                                <my-icon icon="lock-outline" size="10px" />
                                密码
                            </span>
                            <span v-if="file.expiration_at" class="fm-tag fm-tag--exp"
                                :title="fmtTime(file.expiration_at)">
                                至 {{ fmtTime(file.expiration_at) }}
                            </span>
                            <span class="fm-tag fm-tag--code" @click="copyPublicUrl(file)" title="点击复制公开链接">
                                {{ file.code }}
                            </span>
                        </div>
                    </template>
                    <template #extra>
                        <div class="fm-actions">
                            <var-button text size="small" @click="downloadFile(file)">下载</var-button>
                            <var-button text size="small" @click="openEdit(file)">编辑</var-button>
                            <var-button text type="danger" size="small" @click="handleDeleteFile(file)">删除</var-button>
                        </div>
                    </template>
                </var-cell>
            </div>
        </div>
    </var-pull-refresh>

    <!-- MD3 FAB：上传入口 -->
    <var-fab class="fm-fab" type="primary" position="right-bottom" inactive-icon="plus" :elevation="3"
        :disabled="!isAdmin" @click="openUpload" />

    <!-- ─── 上传对话框：var-dialog + var-uploader + var-date-input ─── -->
    <var-dialog v-model:show="showUploadDialog" title="上传文件" :confirm-button="false" :cancel-button="false"
        :close-on-click-overlay="false" width="min(560px, calc(100vw - 32px))">
        <template #title>
            <div class="md-dialog-title">
                <my-icon icon="cloud-upload-outline" size="1.25em" class="md-dialog-title__icon" />
                <span>上传文件</span>
            </div>
        </template>
        <div class="md-dialog-form">
            <div class="fm-field">
                <label class="fm-field__label">选择文件</label>
                <var-uploader v-model="uploadFiles" accept="*/*" :maxlength="1" :previewed="false" :elevation="false"
                    @after-read="onUploadFileRead" @remove="onUploadFileRemove" />
            </div>

            <var-input v-model="uploadForm.name" variant="outlined" placeholder="文件名，例如 setup.exe" />
            <p class="md-hint">
                将上传到 <code>{{ composeUploadPath() || currentPath + '...' }}</code>
            </p>

            <var-input v-model="uploadForm.code" variant="outlined" placeholder="公开访问短码（可选，留空自动生成）" />
            <p class="md-hint">短码 4-128 位，只允许 A-Z a-z 0-9 _ -</p>

            <var-checkbox v-model="uploadForm.needPassword">设置访问密码</var-checkbox>
            <var-input v-if="uploadForm.needPassword" v-model="uploadForm.password" type="password" variant="outlined"
                placeholder="访问密码（下载时需要输入）" />

            <var-date-input v-model="uploadForm.expirationat" type="datetime" :use-seconds="false" clearable
                variant="outlined" placeholder="过期时间（可选，留空表示永久有效）" />
        </div>

        <template #actions="{ slotClass }">
            <div :class="slotClass" class="md-dialog-actions">
                <var-button text type="primary" @click="showUploadDialog = false">取消</var-button>
                <var-button type="primary" :loading="uploading" @click="handleUpload">上传</var-button>
            </div>
        </template>
    </var-dialog>

    <!-- ─── 编辑对话框 ─── -->
    <var-dialog v-model:show="showEditDialog" title="编辑文件" :confirm-button="false" :cancel-button="false"
        :close-on-click-overlay="false" width="min(560px, calc(100vw - 32px))">
        <template #title>
            <div class="md-dialog-title">
                <my-icon icon="pencil-outline" size="1.25em" class="md-dialog-title__icon" />
                <span>编辑文件</span>
            </div>
        </template>
        <div class="md-dialog-form">
            <div class="fm-field">
                <label class="fm-field__label">存储路径</label>
                <pre class="fm-readonly md-mono">{{ editForm.path }}</pre>
            </div>

            <div class="fm-field">
                <label class="fm-field__label">重新选择文件（必选）</label>
                <var-uploader v-model="editFiles" accept="*/*" :maxlength="1" :previewed="false" :elevation="false"
                    @after-read="onEditFileRead" @remove="onEditFileRemove" />
                <p class="md-hint">
                    接口限制：编辑会重写存储对象，必须重新选择文件。
                </p>
            </div>

            <var-input v-model="editForm.code" variant="outlined" placeholder="公开访问短码（留空保持原值）" />

            <var-checkbox v-model="editForm.needPassword">设置访问密码</var-checkbox>
            <var-input v-if="editForm.needPassword" v-model="editForm.password" type="password" variant="outlined"
                placeholder="访问密码（留空则不修改）" />

            <var-date-input v-model="editForm.expirationat" type="datetime" :use-seconds="false" clearable
                variant="outlined" placeholder="过期时间（清空表示永久有效）" />
        </div>

        <template #actions="{ slotClass }">
            <div :class="slotClass" class="md-dialog-actions">
                <var-button text type="primary" @click="showEditDialog = false">取消</var-button>
                <var-button type="primary" :loading="updating" @click="handleEdit">保存</var-button>
            </div>
        </template>
    </var-dialog>
</template>

<style scoped>
.fm-page {
    padding-bottom: var(--md-space-4);
}

/* 面包屑：MD3 次级信息条（内部使用 Varlet Breadcrumbs） */
.fm-breadcrumbs {
    margin-bottom: var(--md-space-3);
    padding: var(--md-space-2) var(--md-space-3);
    border-radius: var(--md-shape-sm);
    background: var(--color-surface-container-low);
    font-family: var(--md-font-mono);
    font-size: 13px;
    word-break: break-all;
}

/* 列表：目录与文件统一为 var-cell（MD3 list item） */
.fm-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.fm-row {
    border-radius: var(--md-shape-sm);
}

.fm-row--dir {
    cursor: pointer;
}

.fm-row--dir:hover {
    background: var(--color-surface-container);
}

.fm-icon {
    margin-right: var(--md-space-3);
    color: var(--color-primary);
}

.fm-icon--dir {
    color: var(--color-warning);
}

.fm-dir-count {
    font-size: 12px;
    letter-spacing: 0.4px;
    color: var(--color-text-secondary);
}

.fm-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--md-space-2);
    font-size: 12px;
    color: var(--color-text-secondary);
}

.fm-tag {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 1px 6px;
    border-radius: var(--md-shape-xs);
    font-size: 11px;
    line-height: 16px;
    font-family: var(--md-font-mono);
    user-select: none;
}

.fm-tag--lock {
    background: var(--color-warning-container);
    color: var(--color-on-warning-container);
}

.fm-tag--exp {
    background: var(--color-primary-container);
    color: var(--color-on-primary-container);
}

.fm-tag--code {
    background: var(--color-surface-container-high);
    color: var(--color-on-surface-variant);
    cursor: pointer;
}

.fm-tag--code:hover {
    background: var(--color-primary-container);
    color: var(--color-on-primary-container);
}

.fm-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
}

/* 对话框内的字段 */
.fm-field {
    display: flex;
    flex-direction: column;
    gap: var(--md-space-2);
}

.fm-field__label {
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0.5px;
    font-weight: 500;
    color: var(--color-text-secondary);
}

.fm-readonly {
    margin: 0;
    padding: var(--md-space-2) var(--md-space-3);
    border-radius: var(--md-shape-sm);
    background: var(--color-surface-container-high);
    font-size: 13px;
    line-height: 20px;
    color: var(--color-text);
    word-break: break-all;
}

.fm-fab {
    z-index: 92;
}

@media (max-width: 640px) {
    .fm-actions {
        gap: 0;
    }

    .fm-actions .var-button {
        padding: 0 4px;
    }
}
</style>
