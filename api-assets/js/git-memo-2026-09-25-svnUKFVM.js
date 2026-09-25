import{F as e,d as t,m as n}from"./runtime-core.esm-bundler-Cz9CHoxa.js";var r={class:`markdown-body`},i=`Git 备忘录`,a=`2026-09-25T00:00:00.000Z`,o=`Git`,s=`08:00`,c=[`Git`,`备忘录`],l=`一份日常高频使用的 Git 命令速查表，覆盖提交、分支、回退、撤销、贮藏、远程协作等场景，附带常见问题的解决方案。`,u=!1,d=!0,f={__name:`git-memo-2026-09-25`,setup(i,{expose:a}){return a({frontmatter:{title:`Git 备忘录`,date:`2026-09-25T00:00:00.000Z`,category:`Git`,time:`08:00`,tags:[`Git`,`备忘录`],summary:`一份日常高频使用的 Git 命令速查表，覆盖提交、分支、回退、撤销、贮藏、远程协作等场景，附带常见问题的解决方案。`,featured:!1,listed:!0}}),(i,a)=>(e(),t(`div`,r,[...a[0]||=[n(`<p>日常高频命令速查。按&quot;场景&quot;而非&quot;命令字母&quot;组织，便于出问题时直接翻。</p><h2>一、配置</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-comment"># 用户信息（全局）</span>
git config --global user.name <span class="hljs-string">&quot;Your Name&quot;</span>
git config --global user.email <span class="hljs-string">&quot;you@example.com&quot;</span>

<span class="hljs-comment"># 换行符（Windows 推荐）</span>
git config --global core.autocrlf <span class="hljs-literal">true</span>

<span class="hljs-comment"># 中文文件名不乱码</span>
git config --global core.quotepath <span class="hljs-literal">false</span>

<span class="hljs-comment"># 默认分支名</span>
git config --global init.defaultBranch main

<span class="hljs-comment"># 常用别名</span>
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.lg <span class="hljs-string">&quot;log --oneline --graph --decorate --all&quot;</span>

<span class="hljs-comment"># 查看所有配置</span>
git config --list --show-origin
</code></pre></div><h2>二、基础工作流</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">git status                    <span class="hljs-comment"># 查看工作区状态</span>
git add &lt;file&gt;                <span class="hljs-comment"># 暂存指定文件</span>
git add .                     <span class="hljs-comment"># 暂存所有改动（不含删除）</span>
git add -A                    <span class="hljs-comment"># 暂存所有改动（含删除）</span>
git commit -m <span class="hljs-string">&quot;message&quot;</span>       <span class="hljs-comment"># 提交</span>
git commit -am <span class="hljs-string">&quot;message&quot;</span>      <span class="hljs-comment"># 跳过 add，直接提交已跟踪文件</span>
git push                      <span class="hljs-comment"># 推送</span>
git pull                      <span class="hljs-comment"># 拉取并合并</span>
</code></pre></div><h3>查看差异</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">git diff                      <span class="hljs-comment"># 工作区 vs 暂存区</span>
git diff --staged             <span class="hljs-comment"># 暂存区 vs 最新提交</span>
git diff HEAD                 <span class="hljs-comment"># 工作区 + 暂存区 vs 最新提交</span>
git diff &lt;branch1&gt;..&lt;branch2&gt; <span class="hljs-comment"># 两分支差异</span>
</code></pre></div><h2>三、分支</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">git branch                    <span class="hljs-comment"># 查看本地分支</span>
git branch -a                 <span class="hljs-comment"># 查看所有分支（含远程）</span>
git branch -vv                <span class="hljs-comment"># 查看分支及跟踪关系</span>
git branch &lt;name&gt;             <span class="hljs-comment"># 创建分支</span>
git switch &lt;name&gt;             <span class="hljs-comment"># 切换分支（新版推荐）</span>
git switch -c &lt;name&gt;          <span class="hljs-comment"># 创建并切换</span>
git checkout -b &lt;name&gt;        <span class="hljs-comment"># 同上（旧版写法）</span>
git branch -d &lt;name&gt;          <span class="hljs-comment"># 删除已合并分支</span>
git branch -D &lt;name&gt;          <span class="hljs-comment"># 强制删除</span>
git branch -m &lt;old&gt; &lt;new&gt;     <span class="hljs-comment"># 重命名分支</span>
</code></pre></div><h3>合并与变基</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">git merge &lt;branch&gt;            <span class="hljs-comment"># 合并到当前分支（保留历史）</span>
git merge --no-ff &lt;branch&gt;    <span class="hljs-comment"># 强制生成合并提交</span>
git rebase &lt;branch&gt;           <span class="hljs-comment"># 变基（线性历史）</span>
git rebase -i HEAD~3          <span class="hljs-comment"># 交互式变基，重写最近 3 条提交</span>
</code></pre></div><blockquote><p><strong>原则</strong>：已推送到共享远程的分支不要 rebase；只在本地分支上用。</p></blockquote><h2>四、撤销与回退</h2><p>这是最容易踩坑的地方，先分清三种&quot;撤销&quot;：</p><table><thead><tr><th>命令</th><th>作用范围</th><th>是否修改历史</th><th>使用场景</th></tr></thead><tbody><tr><td><code>git restore</code></td><td>工作区 / 暂存区</td><td>否</td><td>丢弃未提交的修改</td></tr><tr><td><code>git reset</code></td><td>暂存区 / 提交历史</td><td>是</td><td>撤销提交（未推送）</td></tr><tr><td><code>git revert</code></td><td>提交历史</td><td>否（新增反向提交）</td><td>撤销已推送的提交</td></tr></tbody></table><h3>丢弃工作区修改</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">git restore &lt;file&gt;            <span class="hljs-comment"># 丢弃单个文件的未暂存修改</span>
git restore .                 <span class="hljs-comment"># 丢弃所有未暂存修改（危险）</span>
git checkout -- &lt;file&gt;        <span class="hljs-comment"># 旧版写法</span>
</code></pre></div><h3>取消暂存</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">git restore --staged &lt;file&gt;   <span class="hljs-comment"># 从暂存区移回工作区</span>
git reset HEAD &lt;file&gt;         <span class="hljs-comment"># 旧版写法</span>
</code></pre></div><h3>撤销提交</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-comment"># 保留改动在工作区</span>
git reset --soft HEAD~1

<span class="hljs-comment"># 保留改动在暂存区</span>
git reset --mixed HEAD~1      <span class="hljs-comment"># 默认</span>

<span class="hljs-comment"># 彻底丢弃改动（危险）</span>
git reset --hard HEAD~1

<span class="hljs-comment"># 撤销已推送的提交（安全）</span>
git revert &lt;commit-hash&gt;
</code></pre></div><h3>找回丢失的提交</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">git reflog                    <span class="hljs-comment"># 查看 HEAD 移动历史</span>
git reset --hard &lt;<span class="hljs-built_in">hash</span>&gt;       <span class="hljs-comment"># 回到某个历史位置</span>
</code></pre></div><p><code>reset --hard</code> 后如果后悔，<code>reflog</code> 通常能救回来，除非已经 GC。</p><h2>五、贮藏（stash）</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">git stash                     <span class="hljs-comment"># 贮藏当前改动</span>
git stash -u                  <span class="hljs-comment"># 含未跟踪文件</span>
git stash list                <span class="hljs-comment"># 查看贮藏列表</span>
git stash pop                 <span class="hljs-comment"># 弹出最近贮藏并删除</span>
git stash apply stash@{0}     <span class="hljs-comment"># 应用指定贮藏（保留）</span>
git stash drop stash@{0}      <span class="hljs-comment"># 删除指定贮藏</span>
git stash clear               <span class="hljs-comment"># 清空所有贮藏</span>
</code></pre></div><p>常见场景：改了一半，突然要切分支修 bug。</p><h2>六、远程</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">git remote -v                 <span class="hljs-comment"># 查看远程仓库</span>
git remote add origin &lt;url&gt;   <span class="hljs-comment"># 添加远程</span>
git remote set-url origin &lt;url&gt; <span class="hljs-comment"># 修改远程地址</span>
git remote remove origin      <span class="hljs-comment"># 删除远程</span>

git fetch                     <span class="hljs-comment"># 拉取远程信息，不合并</span>
git pull                      <span class="hljs-comment"># fetch + merge</span>
git pull --rebase             <span class="hljs-comment"># fetch + rebase</span>
git push                      <span class="hljs-comment"># 推送</span>
git push -u origin &lt;branch&gt;   <span class="hljs-comment"># 首次推送并建立跟踪</span>
git push --force-with-lease   <span class="hljs-comment"># 安全强推（推荐）</span>
git push --force              <span class="hljs-comment"># 强推（危险）</span>
</code></pre></div><blockquote><p><strong>强推原则</strong>：永远用 <code>--force-with-lease</code>，它会检查远程是否有人推过新提交，避免误覆盖别人的工作。</p></blockquote><h2>七、标签</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">git tag                       <span class="hljs-comment"># 查看标签</span>
git tag v1.0.0                <span class="hljs-comment"># 轻量标签</span>
git tag -a v1.0.0 -m <span class="hljs-string">&quot;msg&quot;</span>    <span class="hljs-comment"># 附注标签（推荐）</span>
git push origin v1.0.0        <span class="hljs-comment"># 推送单个标签</span>
git push --tags               <span class="hljs-comment"># 推送所有标签</span>
git tag -d v1.0.0             <span class="hljs-comment"># 删除本地标签</span>
git push origin :refs/tags/v1.0.0  <span class="hljs-comment"># 删除远程标签</span>
</code></pre></div><h2>八、查看历史</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">git <span class="hljs-built_in">log</span>                       <span class="hljs-comment"># 完整日志</span>
git <span class="hljs-built_in">log</span> --oneline             <span class="hljs-comment"># 单行</span>
git <span class="hljs-built_in">log</span> --oneline --graph     <span class="hljs-comment"># 图形化</span>
git <span class="hljs-built_in">log</span> -p &lt;file&gt;             <span class="hljs-comment"># 查看某文件历史</span>
git <span class="hljs-built_in">log</span> --author=<span class="hljs-string">&quot;name&quot;</span>       <span class="hljs-comment"># 按作者过滤</span>
git <span class="hljs-built_in">log</span> --since=<span class="hljs-string">&quot;2 weeks ago&quot;</span> <span class="hljs-comment"># 按时间过滤</span>
git <span class="hljs-built_in">log</span> -S <span class="hljs-string">&quot;keyword&quot;</span>          <span class="hljs-comment"># 按内容变化搜索（pickaxe）</span>
git blame &lt;file&gt;              <span class="hljs-comment"># 逐行查看最后修改者</span>
git show &lt;commit&gt;             <span class="hljs-comment"># 查看某次提交详情</span>
</code></pre></div><h2>九、常见问题</h2><h3>1. 提交信息写错了（未推送）</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">git commit --amend -m <span class="hljs-string">&quot;new message&quot;</span>
</code></pre></div><p>如果只是想补充文件：</p><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">git add forgotten.txt
git commit --amend --no-edit
</code></pre></div><h3>2. 提交到了错误的分支</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-comment"># 假设应该提交到 feature 分支，却提交到了 main</span>
git branch feature                <span class="hljs-comment"># 在当前位置创建分支</span>
git reset --hard HEAD~1           <span class="hljs-comment"># main 回退</span>
git switch feature                <span class="hljs-comment"># 切到 feature</span>
</code></pre></div><h3>3. 本地分支落后，想同步远程</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">git fetch origin
git rebase origin/main
<span class="hljs-comment"># 或者</span>
git pull --rebase origin main
</code></pre></div><h3>4. 合并冲突</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">git status                        <span class="hljs-comment"># 查看冲突文件</span>
<span class="hljs-comment"># 手动编辑冲突文件，删除 &lt;&lt;&lt;&lt;&lt;&lt;&lt; ======= &gt;&gt;&gt;&gt;&gt;&gt;&gt; 标记</span>
git add &lt;resolved-file&gt;
git commit                        <span class="hljs-comment"># 或 git rebase --continue</span>
</code></pre></div><p>放弃合并：</p><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">git merge --abort
git rebase --abort
</code></pre></div><h3>5. 不小心提交了敏感信息</h3><p>如果还没推送，<code>git reset --hard</code> 即可。<br> 如果已推送，必须改写历史：</p><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">git filter-repo --path secrets.txt --invert-paths
git push --force-with-lease
</code></pre></div><p>同时立即更换泄露的密钥，因为 Git 服务器可能仍留有副本。</p><h3>6. 忽略文件不生效</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">git <span class="hljs-built_in">rm</span> -r --cached .
git add .
git commit -m <span class="hljs-string">&quot;fix gitignore&quot;</span>
</code></pre></div><p><code>.gitignore</code> 只对未跟踪文件生效，已跟踪的文件需要先 <code>rm --cached</code>。</p><h2>十、提交规范（Conventional Commits）</h2><pre><code><span class="hljs-tag">&lt;<span class="hljs-name">type</span>&gt;</span>(<span class="hljs-tag">&lt;<span class="hljs-name">scope</span>&gt;</span>): <span class="hljs-tag">&lt;<span class="hljs-name">subject</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">body</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">footer</span>&gt;</span>
</code></pre><p>常用 type：</p><table><thead><tr><th>type</th><th>说明</th></tr></thead><tbody><tr><td><code>feat</code></td><td>新功能</td></tr><tr><td><code>fix</code></td><td>修复 bug</td></tr><tr><td><code>docs</code></td><td>文档变更</td></tr><tr><td><code>style</code></td><td>格式调整（不影响代码逻辑）</td></tr><tr><td><code>refactor</code></td><td>重构</td></tr><tr><td><code>perf</code></td><td>性能优化</td></tr><tr><td><code>test</code></td><td>测试相关</td></tr><tr><td><code>chore</code></td><td>构建 / 工具 / 依赖变更</td></tr></tbody></table><p>示例：</p><pre><code><span class="hljs-title function_">feat</span>(auth): 支持 <span class="hljs-title class_">OAuth</span> <span class="hljs-number">2.0</span> 登录

- 新增 <span class="hljs-title class_">GitHub</span> / <span class="hljs-title class_">Google</span> 登录入口
- 补充 token 刷新逻辑

<span class="hljs-title class_">Closes</span> #<span class="hljs-number">123</span>
</code></pre><h2>十一、实用技巧</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-comment"># 快速查看某文件的最后一次修改</span>
git <span class="hljs-built_in">log</span> -1 --<span class="hljs-built_in">stat</span> &lt;file&gt;

<span class="hljs-comment"># 查找是哪次提交引入了某个字符串</span>
git <span class="hljs-built_in">log</span> -S <span class="hljs-string">&quot;search-string&quot;</span> --<span class="hljs-built_in">source</span> --all

<span class="hljs-comment"># 查看两个分支的共同祖先</span>
git merge-base main feature

<span class="hljs-comment"># 比较工作区和某个提交</span>
git diff &lt;commit&gt;

<span class="hljs-comment"># 临时切换到某个提交查看，不切分支</span>
git switch --detach &lt;commit&gt;

<span class="hljs-comment"># 查看暂存区的具体内容</span>
git diff --staged

<span class="hljs-comment"># 统计每个作者的提交数</span>
git shortlog -sn

<span class="hljs-comment"># 找出未被合并的分支</span>
git branch --no-merged
</code></pre></div><h2>十二、配置文件位置</h2><table><thead><tr><th>级别</th><th>路径</th></tr></thead><tbody><tr><td>系统</td><td><code>/etc/gitconfig</code>（Linux）/ <code>C:\\Program Files\\Git\\etc\\gitconfig</code>（Windows）</td></tr><tr><td>全局</td><td><code>~/.gitconfig</code> / <code>%USERPROFILE%\\.gitconfig</code></td></tr><tr><td>仓库</td><td><code>&lt;repo&gt;/.git/config</code></td></tr></tbody></table><p>优先级：仓库 &gt; 全局 &gt; 系统。</p><hr><h2>参考</h2><ul><li>官方文档：<a href="https://git-scm.com/docs">https://git-scm.com/docs</a></li><li>Pro Git（中文版）：<a href="https://git-scm.com/book/zh/v2">https://git-scm.com/book/zh/v2</a></li><li>Conventional Commits：<a href="https://www.conventionalcommits.org/zh-hans/">https://www.conventionalcommits.org/zh-hans/</a></li></ul>`,68)]]))}};export{o as category,a as date,f as default,u as featured,d as listed,l as summary,c as tags,s as time,i as title};