<script setup>
import DocLayout from '@/index/components/common/DocLayout.vue'
import GovButton from '@/index/components/common/GovButton.vue'
import { site } from '@/index/data/site'

const FEEDBACK_URL = 'https://console.undz.cn/console-panel/feedback-center'
</script>

<template>
    <DocLayout title="联系我" updated="2026-09-13">
        <h2>一、电子邮箱</h2>
        <ul>
            <li><a href="mailto:aeyundian@gmail.com">aeyundian@gmail.com</a></li>
            <li><a href="mailto:aeyundian@qq.com">aeyundian@qq.com</a></li>
            <li><a href="mailto:aeyundian@foxmail.com">aeyundian@foxmail.com</a></li>
            <li><a href="mailto:zhanghaoyu19281@outlook.com">zhanghaoyu19281@outlook.com</a></li>
        </ul>

        <h2>二、即时通讯</h2>
        <table>
            <tbody>
                <tr>
                    <th style="width:140px">微信</th>
                    <td>yund_svc_166</td>
                </tr>
                <tr>
                    <th>QQ</th>
                    <td><a href="https://api.undz.cn/addqq?uid=2768223712" target="_blank" rel="noopener">2768223712</a>
                    </td>
                </tr>
            </tbody>
        </table>

        <h2>三、其他平台</h2>
        <table>
            <tbody>
                <tr>
                    <th style="width:140px">GitHub</th>
                    <td><a href="https://github.com/AeYunDian/" target="_blank" rel="noopener">AeYunDian</a></td>
                </tr>
                <tr>
                    <th>哔哩哔哩</th>
                    <td><a href="https://space.bilibili.com/3494370328185235" target="_blank"
                            rel="noopener">3494370328185235</a></td>
                </tr>
                <tr>
                    <th>YouTube</th>
                    <td><a href="https://www.youtube.com/@aeydundz" target="_blank" rel="noopener">@aeydundz</a></td>
                </tr>
            </tbody>
        </table>

        <h2>四、办公信息</h2>
        <table>
            <tbody>
                <tr>
                    <th style="width:140px">工作时间</th>
                    <td>{{ site.workTime }}</td>
                </tr>
            </tbody>
        </table>

        <h2>五、在线留言</h2>
        <p>留言反馈已统一迁移至 <b>反馈中心</b>。为便于跟踪处理进度、留存沟通记录，请前往反馈中心提交您的问题或建议。</p>

        <div class="feedback-entry">
            <a :href="FEEDBACK_URL" target="_blank" rel="noopener" class="feedback-link">
                <GovButton variant="primary">前往反馈中心留言</GovButton>
            </a>
            <p class="feedback-hint">
                反馈中心地址：<code>{{ FEEDBACK_URL }}</code>
            </p>
        </div>

        <h2>六、友情提示</h2>
        <ul>
            <li>请勿在留言中提交身份证号、银行卡等敏感信息。</li>
            <li>广告、推广类留言将被直接忽略。</li>
            <li>技术问题建议优先通过 GitHub Issue 反馈，便于追溯。</li>
        </ul>
    </DocLayout>
</template>

<style scoped>
.feedback-entry {
    padding: var(--gov-gap-lg) 0;
}

.feedback-link {
    display: inline-block;
    text-decoration: none;
}

.feedback-link:hover {
    text-decoration: none;
}

.feedback-hint {
    margin-top: var(--gov-gap-md);
    font-size: var(--gov-fs-sm);
    color: var(--gov-text-muted);
}

.feedback-hint code {
    font-family: var(--gov-font-num);
    font-size: .92em;
    background: var(--gov-bg-gray);
    padding: 1px 5px;
    border: 1px solid var(--gov-border);
    border-radius: var(--gov-radius-sm);
}
</style>