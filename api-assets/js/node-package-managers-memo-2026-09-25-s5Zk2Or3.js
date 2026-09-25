import{F as e,d as t,m as n}from"./runtime-core.esm-bundler-Cz9CHoxa.js";var r={class:`markdown-body`},i=`Node包管理器备忘录`,a=`2026-09-25T00:00:00.000Z`,o=1200,s=`工具`,c=[`npm`,`yarn`,`pnpm`,`包管理`,`备忘录`],l=`npm / yarn (v1) / pnpm 命令对照，覆盖国内换源、镜像配置、私有源、各种 binary 加速、常见错误排查。`,u=!1,d=!0,f={__name:`node-package-managers-memo-2026-09-25`,setup(i,{expose:a}){return a({frontmatter:{title:`Node包管理器备忘录`,date:`2026-09-25T00:00:00.000Z`,time:1200,category:`工具`,tags:[`npm`,`yarn`,`pnpm`,`包管理`,`备忘录`],summary:`npm / yarn (v1) / pnpm 命令对照，覆盖国内换源、镜像配置、私有源、各种 binary 加速、常见错误排查。`,featured:!1,listed:!0}}),(i,a)=>(e(),t(`div`,r,[...a[0]||=[n(`<p>日常高频命令 + 国内换源方案。命令对照无差异时只写 npm。</p><h2>一、换源</h2><h3>1.1 一键切换：nrm</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">npm install -g nrm

nrm <span class="hljs-built_in">ls</span>                            <span class="hljs-comment"># 列出所有源</span>
nrm use taobao                    <span class="hljs-comment"># 切到淘宝源</span>
nrm use npm                       <span class="hljs-comment"># 切回官方</span>
nrm current                       <span class="hljs-comment"># 查看当前</span>
nrm <span class="hljs-built_in">test</span>                          <span class="hljs-comment"># 测速</span>
nrm add company http://npm.company.com/    <span class="hljs-comment"># 加私有源</span>
nrm del company
</code></pre></div><h3>1.2 手动切换</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-comment"># npm</span>
npm config <span class="hljs-built_in">set</span> registry https://registry.npmmirror.com
npm config get registry
npm config delete registry        <span class="hljs-comment"># 恢复默认</span>

<span class="hljs-comment"># yarn v1</span>
yarn config <span class="hljs-built_in">set</span> registry https://registry.npmmirror.com
yarn config get registry
yarn config delete registry

<span class="hljs-comment"># pnpm</span>
pnpm config <span class="hljs-built_in">set</span> registry https://registry.npmmirror.com
pnpm config get registry
</code></pre></div><h3>1.3 常用镜像源</h3><table><thead><tr><th>源</th><th>URL</th></tr></thead><tbody><tr><td>官方</td><td><code>https://registry.npmjs.org</code></td></tr><tr><td>淘宝 / npmmirror（推荐）</td><td><code>https://registry.npmmirror.com</code></td></tr><tr><td>腾讯云</td><td><code>https://mirrors.cloud.tencent.com/npm/</code></td></tr><tr><td>华为云</td><td><code>https://mirrors.huaweicloud.com/repository/npm/</code></td></tr><tr><td>cnpmjs</td><td><code>https://registry.cnpmjs.org</code></td></tr></tbody></table><blockquote><p>淘宝源域名 <code>registry.npm.taobao.org</code> 已废弃，新域名为 <code>registry.npmmirror.com</code>。</p></blockquote><h3>1.4 一次性使用（不改配置）</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">npm install --registry=https://registry.npmmirror.com
yarn add &lt;pkg&gt; --registry=https://registry.npmmirror.com
pnpm add &lt;pkg&gt; --registry=https://registry.npmmirror.com
</code></pre></div><h3>1.5 项目级 .npmrc</h3><p><strong>只在当前项目生效</strong>，适合团队统一配置。放项目根目录：</p><div class="md-code-block" data-lang="ini"><pre><code class="language-ini"><span class="hljs-comment"># .npmrc</span>
<span class="hljs-attr">registry</span>=https://registry.npmmirror.com
<span class="hljs-attr">strict-ssl</span>=<span class="hljs-literal">true</span>
<span class="hljs-attr">save-exact</span>=<span class="hljs-literal">true</span>
<span class="hljs-attr">engine-strict</span>=<span class="hljs-literal">true</span>
</code></pre></div><p><strong>提交到 Git</strong>，让所有成员和 CI 用同一套源。</p><h3>1.6 私有源 + 公共源混用（scoped registry）</h3><p>公司包放私有源，公共包走镜像：</p><div class="md-code-block" data-lang="ini"><pre><code class="language-ini"><span class="hljs-comment"># .npmrc</span>
<span class="hljs-attr">registry</span>=https://registry.npmmirror.com
@company:<span class="hljs-attr">registry</span>=https://npm.company.com/
//npm.company.com/:<span class="hljs-attr">_authToken</span>=<span class="hljs-variable">\${NPM_TOKEN}</span>
//registry.npmmirror.com/:<span class="hljs-attr">always-auth</span>=<span class="hljs-literal">false</span>
</code></pre></div><p><code>@company</code> 开头的包（如 <code>@company/ui</code>）走私有源，其余走淘宝源。</p><h3>1.7 认证 Token 配置</h3><div class="md-code-block" data-lang="ini"><pre><code class="language-ini"><span class="hljs-comment"># ~/.npmrc</span>
//registry.npmjs.org/:<span class="hljs-attr">_authToken</span>=npm_xxxxxxxxxxxx
//npm.pkg.github.com/:<span class="hljs-attr">_authToken</span>=ghp_xxxxxxxxxxxx
</code></pre></div><p>或用环境变量（推荐 CI 使用）：</p><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">export</span> NPM_TOKEN=xxxxx
<span class="hljs-comment"># .npmrc 里写</span>
//registry.npmjs.org/:_authToken=<span class="hljs-variable">\${NPM_TOKEN}</span>
</code></pre></div><h3>1.8 换源失败的排查</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-comment"># 1. 确认当前源</span>
npm config get registry

<span class="hljs-comment"># 2. 直接 curl 试</span>
curl -I https://registry.npmmirror.com/vue

<span class="hljs-comment"># 3. 清除 npm 缓存</span>
npm cache clean --force

<span class="hljs-comment"># 4. 检查是否有多个 .npmrc 冲突</span>
npm config list --show-origin
</code></pre></div><h2>二、其他 binary 镜像（换源只改 npm 包，不改 binary）</h2><p>很多包在 <code>postinstall</code> 阶段会下载<strong>非 npm 的二进制</strong>，换 registry 没用。这些要单独配：</p><h3>2.1 Node 版本管理器镜像</h3><p><strong>nvm</strong>：</p><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">export</span> NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
nvm install 20
</code></pre></div><p>写入 <code>~/.bashrc</code> 或 <code>~/.zshrc</code> 永久生效。</p><p><strong>fnm</strong>：</p><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">export</span> FNM_NODE_DIST_MIRROR=https://npmmirror.com/mirrors/node
</code></pre></div><h3>2.2 Electron</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-comment"># 项目 .npmrc</span>
electron_mirror=https://npmmirror.com/mirrors/electron/
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/
</code></pre></div><h3>2.3 Puppeteer / Playwright</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-comment"># .npmrc 或环境变量</span>
puppeteer_download_host=https://npmmirror.com/mirrors
PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright
</code></pre></div><h3>2.4 node-sass / sass-embedded</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-comment"># .npmrc</span>
sass_binary_site=https://npmmirror.com/mirrors/node-sass
</code></pre></div><p>现在多用 <code>sass</code>（dart-sass 纯 JS 实现），无需 binary。</p><h3>2.5 sharp / canvas</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-comment"># .npmrc</span>
sharp_binary_host=https://npmmirror.com/mirrors/sharp
sharp_libvips_binary_host=https://npmmirror.com/mirrors/sharp-libvips
canvas_binary_host_mirror=https://npmmirror.com/mirrors/node-canvas-prebuilt/
</code></pre></div><h3>2.6 Cypress</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">export</span> CYPRESS_DOWNLOAD_MIRROR=https://npmmirror.com/mirrors/cypress
</code></pre></div><h3>2.7 全家桶模板</h3><div class="md-code-block" data-lang="ini"><pre><code class="language-ini"><span class="hljs-comment"># ~/.npmrc 一份全搞定</span>
<span class="hljs-attr">registry</span>=https://registry.npmmirror.com
<span class="hljs-attr">electron_mirror</span>=https://npmmirror.com/mirrors/electron/
<span class="hljs-attr">electron_builder_binaries_mirror</span>=https://npmmirror.com/mirrors/electron-builder-binaries/
<span class="hljs-attr">puppeteer_download_host</span>=https://npmmirror.com/mirrors
<span class="hljs-attr">PLAYWRIGHT_DOWNLOAD_HOST</span>=https://npmmirror.com/mirrors/playwright
<span class="hljs-attr">sass_binary_site</span>=https://npmmirror.com/mirrors/node-sass
<span class="hljs-attr">sharp_binary_host</span>=https://npmmirror.com/mirrors/sharp
<span class="hljs-attr">sharp_libvips_binary_host</span>=https://npmmirror.com/mirrors/sharp-libvips
<span class="hljs-attr">canvas_binary_host_mirror</span>=https://npmmirror.com/mirrors/node-canvas-prebuilt/
<span class="hljs-attr">CYPRESS_DOWNLOAD_MIRROR</span>=https://npmmirror.com/mirrors/cypress
</code></pre></div><h2>三、命令对照速查</h2><table><thead><tr><th>操作</th><th>npm</th><th>yarn (v1)</th><th>pnpm</th></tr></thead><tbody><tr><td>安装全部</td><td><code>npm install</code></td><td><code>yarn</code></td><td><code>pnpm install</code></td></tr><tr><td>安装生产依赖</td><td><code>npm i &lt;pkg&gt;</code></td><td><code>yarn add &lt;pkg&gt;</code></td><td><code>pnpm add &lt;pkg&gt;</code></td></tr><tr><td>安装开发依赖</td><td><code>npm i -D &lt;pkg&gt;</code></td><td><code>yarn add -D &lt;pkg&gt;</code></td><td><code>pnpm add -D &lt;pkg&gt;</code></td></tr><tr><td>安装全局</td><td><code>npm i -g &lt;pkg&gt;</code></td><td><code>yarn global add &lt;pkg&gt;</code></td><td><code>pnpm add -g &lt;pkg&gt;</code></td></tr><tr><td>安装指定版本</td><td><code>npm i &lt;pkg&gt;@1.2.3</code></td><td>同</td><td>同</td></tr><tr><td>卸载</td><td><code>npm uninstall &lt;pkg&gt;</code></td><td><code>yarn remove &lt;pkg&gt;</code></td><td><code>pnpm remove &lt;pkg&gt;</code></td></tr><tr><td>卸载全局</td><td><code>npm uninstall -g &lt;pkg&gt;</code></td><td><code>yarn global remove &lt;pkg&gt;</code></td><td><code>pnpm remove -g &lt;pkg&gt;</code></td></tr><tr><td>更新全部</td><td><code>npm update</code></td><td><code>yarn upgrade</code></td><td><code>pnpm update</code></td></tr><tr><td>运行脚本</td><td><code>npm run &lt;s&gt;</code></td><td><code>yarn &lt;s&gt;</code></td><td><code>pnpm &lt;s&gt;</code></td></tr><tr><td>执行本地二进制</td><td><code>npx &lt;bin&gt;</code></td><td><code>yarn &lt;bin&gt;</code></td><td><code>pnpm exec &lt;bin&gt;</code></td></tr><tr><td>执行远程包</td><td><code>npx &lt;pkg&gt;</code></td><td>—</td><td><code>pnpm dlx &lt;pkg&gt;</code></td></tr><tr><td>查看顶层依赖</td><td><code>npm ls --depth=0</code></td><td><code>yarn list --depth=0</code></td><td><code>pnpm list --depth=0</code></td></tr><tr><td>查过时依赖</td><td><code>npm outdated</code></td><td><code>yarn outdated</code></td><td><code>pnpm outdated</code></td></tr><tr><td>清缓存</td><td><code>npm cache clean --force</code></td><td><code>yarn cache clean</code></td><td><code>pnpm store prune</code></td></tr><tr><td>查看为什么装了某包</td><td><code>npm why &lt;pkg&gt;</code></td><td><code>yarn why &lt;pkg&gt;</code></td><td><code>pnpm why &lt;pkg&gt;</code></td></tr></tbody></table><h2>四、锁文件</h2><table><thead><tr><th>包管理器</th><th>锁文件</th><th>提交 Git</th></tr></thead><tbody><tr><td>npm</td><td><code>package-lock.json</code></td><td>✅</td></tr><tr><td>yarn v1</td><td><code>yarn.lock</code></td><td>✅</td></tr><tr><td>pnpm</td><td><code>pnpm-lock.yaml</code></td><td>✅</td></tr></tbody></table><p><strong>同一仓库只保留一种锁文件</strong>。混用会导致依赖树不一致。</p><h3>清理重装</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-comment"># npm</span>
<span class="hljs-built_in">rm</span> -rf node_modules package-lock.json &amp;&amp; npm install

<span class="hljs-comment"># yarn</span>
<span class="hljs-built_in">rm</span> -rf node_modules yarn.lock &amp;&amp; yarn install

<span class="hljs-comment"># pnpm</span>
<span class="hljs-built_in">rm</span> -rf node_modules pnpm-lock.yaml &amp;&amp; pnpm install
</code></pre></div><h3>CI 严格安装</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">npm ci                            <span class="hljs-comment"># 严格按 lock 装，不更新</span>
pnpm install --frozen-lockfile
yarn install --frozen-lockfile
</code></pre></div><p><code>npm ci</code> 要求 <code>package-lock.json</code> 与 <code>package.json</code> 完全一致，否则直接报错退出。</p><h2>五、依赖版本语义</h2><table><thead><tr><th>写法</th><th>允许升级范围</th></tr></thead><tbody><tr><td><code>1.2.3</code></td><td>精确，不升级</td></tr><tr><td><code>~1.2.3</code></td><td><code>&gt;=1.2.3 &lt;1.3.0</code></td></tr><tr><td><code>^1.2.3</code></td><td><code>&gt;=1.2.3 &lt;2.0.0</code></td></tr><tr><td><code>^0.2.3</code></td><td><code>&gt;=0.2.3 &lt;0.3.0</code>（0.x 例外，锁次版本）</td></tr><tr><td><code>*</code> / <code>latest</code></td><td>不限（不推荐）</td></tr></tbody></table><h2>六、脚本（scripts）</h2><h3>钩子</h3><table><thead><tr><th>钩子</th><th>触发时机</th></tr></thead><tbody><tr><td><code>preinstall</code></td><td>install 之前</td></tr><tr><td><code>postinstall</code></td><td>install 之后</td></tr><tr><td><code>prepare</code></td><td>install 和 publish 之前都触发（husky 常用）</td></tr><tr><td><code>prepublishOnly</code></td><td>仅 <code>npm publish</code> 之前</td></tr><tr><td><code>pre&lt;script&gt;</code></td><td><code>npm run &lt;script&gt;</code> 之前</td></tr><tr><td><code>post&lt;script&gt;</code></td><td>执行之后</td></tr></tbody></table><h3>传参与环境变量</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">npm run build -- --mode production
yarn build --mode production
pnpm build --mode production

<span class="hljs-comment"># 跨平台环境变量</span>
npm i -D cross-env
<span class="hljs-string">&quot;build&quot;</span>: <span class="hljs-string">&quot;cross-env NODE_ENV=production vite build&quot;</span>
</code></pre></div><h2>七、依赖管理</h2><h3>overrides / resolutions（强制覆盖版本）</h3><p><strong>npm (&gt;= 8.3)</strong>：</p><div class="md-code-block" data-lang="json"><pre><code class="language-json"><span class="hljs-punctuation">{</span>
  <span class="hljs-attr">&quot;overrides&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">{</span>
    <span class="hljs-attr">&quot;lodash&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;4.17.21&quot;</span><span class="hljs-punctuation">,</span>
    <span class="hljs-attr">&quot;some-pkg&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">{</span> <span class="hljs-attr">&quot;lodash&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;4.17.21&quot;</span> <span class="hljs-punctuation">}</span>
  <span class="hljs-punctuation">}</span>
<span class="hljs-punctuation">}</span>
</code></pre></div><p><strong>yarn v1</strong>：</p><div class="md-code-block" data-lang="json"><pre><code class="language-json"><span class="hljs-punctuation">{</span>
  <span class="hljs-attr">&quot;resolutions&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">{</span>
    <span class="hljs-attr">&quot;lodash&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;4.17.21&quot;</span><span class="hljs-punctuation">,</span>
    <span class="hljs-attr">&quot;**/lodash&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;4.17.21&quot;</span>
  <span class="hljs-punctuation">}</span>
<span class="hljs-punctuation">}</span>
</code></pre></div><p><strong>pnpm</strong>：</p><div class="md-code-block" data-lang="json"><pre><code class="language-json"><span class="hljs-punctuation">{</span>
  <span class="hljs-attr">&quot;pnpm&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">{</span>
    <span class="hljs-attr">&quot;overrides&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">{</span>
      <span class="hljs-attr">&quot;lodash&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;4.17.21&quot;</span>
    <span class="hljs-punctuation">}</span>
  <span class="hljs-punctuation">}</span>
<span class="hljs-punctuation">}</span>
</code></pre></div><h3>依赖分析</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">npm <span class="hljs-built_in">ls</span> &lt;pkg&gt;                      <span class="hljs-comment"># 谁依赖了它</span>
npm why &lt;pkg&gt;                     <span class="hljs-comment"># 同上（npm 8+）</span>
pnpm why &lt;pkg&gt;
yarn why &lt;pkg&gt;
</code></pre></div><h2>八、npm 专属</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">npm view &lt;pkg&gt;                    <span class="hljs-comment"># 包信息</span>
npm view &lt;pkg&gt; versions           <span class="hljs-comment"># 所有版本</span>
npm view &lt;pkg&gt; dist-tags          <span class="hljs-comment"># 标签</span>
npm info &lt;pkg&gt; repository.url     <span class="hljs-comment"># 仓库地址</span>

npm login
npm publish                       <span class="hljs-comment"># 发布</span>
npm publish --access public       <span class="hljs-comment"># scoped 包首次发布</span>
npm publish --tag beta            <span class="hljs-comment"># 打标签</span>
npm unpublish &lt;pkg&gt;@1.0.0         <span class="hljs-comment"># 撤销（24h 内）</span>
</code></pre></div><h2>九、yarn v1 专属</h2><h3>workspaces</h3><div class="md-code-block" data-lang="json"><pre><code class="language-json"><span class="hljs-punctuation">{</span>
  <span class="hljs-attr">&quot;private&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-literal"><span class="hljs-keyword">true</span></span><span class="hljs-punctuation">,</span>
  <span class="hljs-attr">&quot;workspaces&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">[</span><span class="hljs-string">&quot;packages/*&quot;</span><span class="hljs-punctuation">]</span>
<span class="hljs-punctuation">}</span>
</code></pre></div><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">yarn workspace &lt;pkg&gt; add &lt;dep&gt;
yarn workspaces info
</code></pre></div><h3>常用</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">yarn licenses list                <span class="hljs-comment"># 许可证</span>
yarn audit                        <span class="hljs-comment"># 安全审计</span>
yarn autoclean --init
</code></pre></div><blockquote><p>yarn v1 已停止新功能开发，长期建议迁移到 pnpm 或 yarn berry (v2+)。</p></blockquote><h2>十、pnpm 专属</h2><h3>核心优势</h3><ul><li><strong>硬链接 + 内容寻址存储</strong>：磁盘只存一份包实体，多项目共享。</li><li><strong>非扁平化 node_modules</strong>：只有直接依赖可见，杜绝幽灵依赖。</li><li><strong>严格 peerDependencies</strong>：不隐式提升未声明依赖。</li></ul><h3>常用</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">pnpm store path                   <span class="hljs-comment"># store 位置</span>
pnpm store prune                  <span class="hljs-comment"># 清缓存</span>
pnpm dedupe                       <span class="hljs-comment"># 去重</span>
pnpm patch &lt;pkg&gt;                  <span class="hljs-comment"># 打补丁</span>
pnpm patch-commit &lt;path&gt;

pnpm add -O &lt;pkg&gt;                 <span class="hljs-comment"># optionalDependencies</span>
pnpm add -P &lt;pkg&gt;                 <span class="hljs-comment"># peerDependencies</span>
</code></pre></div><h3>工作区</h3><div class="md-code-block" data-lang="yaml"><pre><code class="language-yaml"><span class="hljs-comment"># pnpm-workspace.yaml</span>
<span class="hljs-attr">packages:</span>
  <span class="hljs-bullet">-</span> <span class="hljs-string">&quot;packages/*&quot;</span>
  <span class="hljs-bullet">-</span> <span class="hljs-string">&quot;apps/*&quot;</span>
</code></pre></div><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">pnpm -r build                     <span class="hljs-comment"># 递归所有包</span>
pnpm --filter web build           <span class="hljs-comment"># 只跑 web</span>
pnpm --filter <span class="hljs-string">&quot;web...&quot;</span> build      <span class="hljs-comment"># web 及其依赖</span>
pnpm --filter <span class="hljs-string">&quot;...web&quot;</span> build      <span class="hljs-comment"># web 及其被依赖者</span>
</code></pre></div><h3>.npmrc 常用</h3><div class="md-code-block" data-lang="ini"><pre><code class="language-ini"><span class="hljs-attr">shamefully-hoist</span>=<span class="hljs-literal">true</span>             <span class="hljs-comment"># 兼容老包（临时用）</span>
<span class="hljs-attr">strict-peer-dependencies</span>=<span class="hljs-literal">false</span>
<span class="hljs-attr">auto-install-peers</span>=<span class="hljs-literal">true</span>
<span class="hljs-attr">node-linker</span>=hoisted               <span class="hljs-comment"># 扁平常见兼容方案</span>
</code></pre></div><h2>十一、常见问题</h2><h3>1. <code>ERR_OSSL_EVP_UNSUPPORTED</code>（Node 17+）</h3><p>老项目 + 新 Node，OpenSSL 3 引起。</p><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">export</span> NODE_OPTIONS=--openssl-legacy-provider
<span class="hljs-comment"># 或降级 Node 16</span>
</code></pre></div><h3>2. <code>EACCES</code> 权限错误</h3><p><strong>别用 sudo</strong>，改 npm 全局目录：</p><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">mkdir</span> -p ~/.npm-global
npm config <span class="hljs-built_in">set</span> prefix <span class="hljs-string">&#39;~/.npm-global&#39;</span>
<span class="hljs-built_in">echo</span> <span class="hljs-string">&#39;export PATH=~/.npm-global/bin:$PATH&#39;</span> &gt;&gt; ~/.bashrc
<span class="hljs-built_in">source</span> ~/.bashrc
</code></pre></div><h3>3. <code>peer dep</code> 冲突（npm 7+）</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">npm install --legacy-peer-deps    <span class="hljs-comment"># 按 npm 6 行为忽略 peer 冲突</span>
npm install --force               <span class="hljs-comment"># 强制（危险）</span>
</code></pre></div><h3>4. 安装慢</h3><p>先换源（见第一节）。如果还慢，看是不是在下载 binary：</p><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">npm install --verbose 2&gt;&amp;1 | grep -i <span class="hljs-string">&quot;http&quot;</span>
</code></pre></div><p>看到下载 electron / puppeteer 之类的，就要配对应的 binary 镜像。</p><h3>5. 幽灵依赖</h3><p>代码用了没在 <code>package.json</code> 里声明的包（因为被提升到顶层才碰巧能用）。</p><p><strong>根治</strong>：用 pnpm。<strong>缓解</strong>：<code>npm ls --depth=0</code> 核对，把用到的都显式声明。</p><h3>6. CI 报 lock 不一致</h3><p>用 <code>npm ci</code> / <code>pnpm install --frozen-lockfile</code> 时，<code>package.json</code> 与 lock 必须同步。本地改完 <code>package.json</code> 一定要重跑一次 <code>install</code> 让 lock 更新，再提交。</p><h3>7. 强制项目使用某个包管理器</h3><div class="md-code-block" data-lang="json"><pre><code class="language-json"><span class="hljs-punctuation">{</span>
  <span class="hljs-attr">&quot;scripts&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">{</span>
    <span class="hljs-attr">&quot;preinstall&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;npx only-allow pnpm&quot;</span>
  <span class="hljs-punctuation">}</span>
<span class="hljs-punctuation">}</span>
</code></pre></div><h3>8. <code>npm audit fix --force</code> 引入 breaking change</h3><p><code>--force</code> 会跨越主版本升级。先看不 force 能修多少：</p><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">npm audit
npm audit fix
npm audit --production            <span class="hljs-comment"># 只看生产依赖</span>
</code></pre></div><h2>十二、安全审计</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">npm audit
yarn audit
pnpm audit
</code></pre></div><hr><h2>参考</h2><ul><li>npm 文档：<a href="https://docs.npmjs.com/">https://docs.npmjs.com/</a></li><li>yarn v1：<a href="https://classic.yarnpkg.com/">https://classic.yarnpkg.com/</a></li><li>pnpm：<a href="https://pnpm.io/zh/">https://pnpm.io/zh/</a></li><li>npmmirror：<a href="https://npmmirror.com/">https://npmmirror.com/</a></li></ul>`,120)]]))}};export{s as category,a as date,f as default,u as featured,d as listed,l as summary,c as tags,o as time,i as title};