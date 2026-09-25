import{F as e,d as t,m as n}from"./runtime-core.esm-bundler-Cz9CHoxa.js";var r={class:`markdown-body`},i=`Linux 备忘录`,a=`2026-09-25T00:00:00.000Z`,o=720,s=`工具`,c=[`linux`,`运维`,`备忘录`],l=`Linux 日常命令速查，覆盖 apt / yum / pacman 换国内源、pip / Docker 镜像加速、常用排查命令。`,u=!1,d=!0,f={__name:`linux-memo-20269-09-25`,setup(i,{expose:a}){return a({frontmatter:{title:`Linux 备忘录`,date:`2026-09-25T00:00:00.000Z`,time:720,category:`工具`,tags:[`linux`,`运维`,`备忘录`],summary:`Linux 日常命令速查，覆盖 apt / yum / pacman 换国内源、pip / Docker 镜像加速、常用排查命令。`,featured:!1,listed:!0}}),(i,a)=>(e(),t(`div`,r,[...a[0]||=[n(`<p>国内环境下的高频命令。换源和镜像放在最前面。</p><h2>一、换源</h2><h3>1.1 apt（Debian / Ubuntu）</h3><p>先备份，再替换：</p><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">sudo</span> <span class="hljs-built_in">cp</span> /etc/apt/sources.list /etc/apt/sources.list.bak
<span class="hljs-built_in">sudo</span> sed -i <span class="hljs-string">&#39;s|http://archive.ubuntu.com|https://mirrors.tuna.tsinghua.edu.cn|g&#39;</span> /etc/apt/sources.list
<span class="hljs-built_in">sudo</span> sed -i <span class="hljs-string">&#39;s|http://security.ubuntu.com|https://mirrors.tuna.tsinghua.edu.cn|g&#39;</span> /etc/apt/sources.list
<span class="hljs-built_in">sudo</span> apt update
</code></pre></div><p><strong>Ubuntu 24.04+</strong> 使用新格式 <code>/etc/apt/sources.list.d/ubuntu.sources</code>：</p><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">sudo</span> sed -i <span class="hljs-string">&#39;s|http://archive.ubuntu.com|https://mirrors.tuna.tsinghua.edu.cn|g&#39;</span> \\
  /etc/apt/sources.list.d/ubuntu.sources
</code></pre></div><p><strong>Debian 12+</strong> 使用 <code>/etc/apt/sources.list.d/debian.sources</code>，同理。</p><h3>1.2 常用 apt 镜像源</h3><table><thead><tr><th>源</th><th>URL</th></tr></thead><tbody><tr><td>清华</td><td><code>https://mirrors.tuna.tsinghua.edu.cn</code></td></tr><tr><td>阿里云</td><td><code>https://mirrors.aliyun.com</code></td></tr><tr><td>中科大</td><td><code>https://mirrors.ustc.edu.cn</code></td></tr><tr><td>华为云</td><td><code>https://mirrors.huaweicloud.com</code></td></tr><tr><td>网易</td><td><code>https://mirrors.163.com</code></td></tr></tbody></table><h3>1.3 yum / dnf（RHEL / CentOS / Fedora）</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-comment"># 备份</span>
<span class="hljs-built_in">sudo</span> <span class="hljs-built_in">cp</span> -r /etc/yum.repos.d /etc/yum.repos.d.bak

<span class="hljs-comment"># CentOS 7 换阿里云</span>
<span class="hljs-built_in">sudo</span> sed -i <span class="hljs-string">&#39;s|mirrorlist=|#mirrorlist=|g&#39;</span> /etc/yum.repos.d/CentOS-*.repo
<span class="hljs-built_in">sudo</span> sed -i <span class="hljs-string">&#39;s|#baseurl=http://mirror.centos.org|baseurl=https://mirrors.aliyun.com|g&#39;</span> \\
  /etc/yum.repos.d/CentOS-*.repo

<span class="hljs-built_in">sudo</span> yum clean all
<span class="hljs-built_in">sudo</span> yum makecache
</code></pre></div><p><strong>CentOS 8 / Stream</strong> 需要先换 vault（官方源已下线）：</p><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">sudo</span> sed -i <span class="hljs-string">&#39;s|mirror.centos.org|mirrors.aliyun.com|g&#39;</span> /etc/yum.repos.d/*.repo
<span class="hljs-built_in">sudo</span> sed -i <span class="hljs-string">&#39;s|^#baseurl|baseurl|g&#39;</span> /etc/yum.repos.d/*.repo
<span class="hljs-built_in">sudo</span> sed -i <span class="hljs-string">&#39;s|^mirrorlist|#mirrorlist|g&#39;</span> /etc/yum.repos.d/*.repo
<span class="hljs-built_in">sudo</span> dnf clean all &amp;&amp; <span class="hljs-built_in">sudo</span> dnf makecache
</code></pre></div><p><strong>Fedora</strong>：</p><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">sudo</span> sed -i <span class="hljs-string">&#39;s|^metalink=|#metalink=|g&#39;</span> /etc/yum.repos.d/fedora*.repo
<span class="hljs-built_in">sudo</span> sed -i <span class="hljs-string">&#39;s|^#baseurl=http://download.example/pub/fedora/linux|baseurl=https://mirrors.tuna.tsinghua.edu.cn/fedora|g&#39;</span> \\
  /etc/yum.repos.d/fedora*.repo
</code></pre></div><h3>1.4 pacman（Arch）</h3><p>编辑 <code>/etc/pacman.d/mirrorlist</code>，把国内源放前面：</p><pre><code>Server = https:<span class="hljs-regexp">//mi</span>rrors.tuna.tsinghua.edu.cn<span class="hljs-regexp">/archlinux/</span><span class="hljs-variable">$repo</span><span class="hljs-regexp">/os/</span><span class="hljs-variable">$arch</span>
Server = https:<span class="hljs-regexp">//mi</span>rrors.ustc.edu.cn<span class="hljs-regexp">/archlinux/</span><span class="hljs-variable">$repo</span><span class="hljs-regexp">/os/</span><span class="hljs-variable">$arch</span>
</code></pre><p>或者一键：</p><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">sudo</span> pacman -S reflector
<span class="hljs-built_in">sudo</span> reflector --country China --latest 5 --<span class="hljs-built_in">sort</span> rate --save /etc/pacman.d/mirrorlist
<span class="hljs-built_in">sudo</span> pacman -Syyu
</code></pre></div><h3>1.5 pip 换源</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-comment"># 永久</span>
pip config <span class="hljs-built_in">set</span> global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
pip config <span class="hljs-built_in">set</span> global.trusted-host pypi.tuna.tsinghua.edu.cn

<span class="hljs-comment"># 或写入 ~/.pip/pip.conf (Linux) / %APPDATA%\\pip\\pip.ini (Windows)</span>
<span class="hljs-comment"># [global]</span>
<span class="hljs-comment"># index-url = https://pypi.tuna.tsinghua.edu.cn/simple</span>
<span class="hljs-comment"># trusted-host = pypi.tuna.tsinghua.edu.cn</span>

<span class="hljs-comment"># 一次性</span>
pip install &lt;pkg&gt; -i https://pypi.tuna.tsinghua.edu.cn/simple
</code></pre></div><p>常用 pip 镜像：</p><table><thead><tr><th>源</th><th>URL</th></tr></thead><tbody><tr><td>清华</td><td><code>https://pypi.tuna.tsinghua.edu.cn/simple</code></td></tr><tr><td>阿里云</td><td><code>https://mirrors.aliyun.com/pypi/simple/</code></td></tr><tr><td>中科大</td><td><code>https://pypi.mirrors.ustc.edu.cn/simple/</code></td></tr><tr><td>豆瓣</td><td><code>https://pypi.douban.com/simple/</code></td></tr><tr><td>华为云</td><td><code>https://mirrors.huaweicloud.com/repository/pypi/simple/</code></td></tr></tbody></table><h3>1.6 Docker 镜像加速</h3><p>编辑 <code>/etc/docker/daemon.json</code>：</p><div class="md-code-block" data-lang="json"><pre><code class="language-json"><span class="hljs-punctuation">{</span>
  <span class="hljs-attr">&quot;registry-mirrors&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">[</span>
    <span class="hljs-string">&quot;https://docker.m.daocloud.io&quot;</span><span class="hljs-punctuation">,</span>
    <span class="hljs-string">&quot;https://dockerproxy.com&quot;</span><span class="hljs-punctuation">,</span>
    <span class="hljs-string">&quot;https://mirror.baidubce.com&quot;</span><span class="hljs-punctuation">,</span>
    <span class="hljs-string">&quot;https://ccr.ccs.tencentyun.com&quot;</span>
  <span class="hljs-punctuation">]</span>
<span class="hljs-punctuation">}</span>
</code></pre></div><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">sudo</span> systemctl daemon-reload
<span class="hljs-built_in">sudo</span> systemctl restart docker
docker info | grep -A 5 <span class="hljs-string">&quot;Registry Mirrors&quot;</span>
</code></pre></div><blockquote><p>2024 年后很多公共镜像源已停服，以上仅供参考。企业环境建议自建 Harbor 或使用阿里云/腾讯云容器镜像服务。</p></blockquote><h3>1.7 Go module 代理</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">go <span class="hljs-built_in">env</span> -w GOPROXY=https://goproxy.cn,direct
go <span class="hljs-built_in">env</span> -w GOSUMDB=sum.golang.google.cn
</code></pre></div><h3>1.8 Maven 换源</h3><p>编辑 <code>~/.m2/settings.xml</code>：</p><div class="md-code-block" data-lang="xml"><pre><code class="language-xml"><span class="hljs-tag">&lt;<span class="hljs-name">mirrors</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">mirror</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">id</span>&gt;</span>aliyun<span class="hljs-tag">&lt;/<span class="hljs-name">id</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">mirrorOf</span>&gt;</span>central<span class="hljs-tag">&lt;/<span class="hljs-name">mirrorOf</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">url</span>&gt;</span>https://maven.aliyun.com/repository/public<span class="hljs-tag">&lt;/<span class="hljs-name">url</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">mirror</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">mirrors</span>&gt;</span>
</code></pre></div><h3>1.9 换源后必做</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-comment"># apt</span>
<span class="hljs-built_in">sudo</span> apt update

<span class="hljs-comment"># yum / dnf</span>
<span class="hljs-built_in">sudo</span> yum clean all &amp;&amp; <span class="hljs-built_in">sudo</span> yum makecache
<span class="hljs-built_in">sudo</span> dnf clean all &amp;&amp; <span class="hljs-built_in">sudo</span> dnf makecache

<span class="hljs-comment"># pacman</span>
<span class="hljs-built_in">sudo</span> pacman -Syyu
</code></pre></div><h2>二、文件与目录</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">pwd</span>                               <span class="hljs-comment"># 当前目录</span>
<span class="hljs-built_in">ls</span> -alh                           <span class="hljs-comment"># 详细列表</span>
<span class="hljs-built_in">cd</span> -                              <span class="hljs-comment"># 上一个目录</span>
<span class="hljs-built_in">mkdir</span> -p a/b/c                    <span class="hljs-comment"># 递归创建</span>
<span class="hljs-built_in">rm</span> -rf &lt;<span class="hljs-built_in">dir</span>&gt;                      <span class="hljs-comment"># 递归删除（危险）</span>
<span class="hljs-built_in">cp</span> -r &lt;src&gt; &lt;dst&gt;                 <span class="hljs-comment"># 递归复制</span>
<span class="hljs-built_in">mv</span> &lt;src&gt; &lt;dst&gt;                    <span class="hljs-comment"># 移动 / 重命名</span>
<span class="hljs-built_in">ln</span> -s &lt;target&gt; &lt;<span class="hljs-built_in">link</span>&gt;             <span class="hljs-comment"># 软链接</span>
<span class="hljs-built_in">touch</span> &lt;file&gt;
<span class="hljs-built_in">stat</span> &lt;file&gt;
file &lt;file&gt;
</code></pre></div><h3>查找</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">find . -name <span class="hljs-string">&quot;*.log&quot;</span>                          <span class="hljs-comment"># 按名</span>
find . -<span class="hljs-built_in">type</span> f -size +100M                    <span class="hljs-comment"># &gt;100M</span>
find . -mtime -7                              <span class="hljs-comment"># 7 天内</span>
find . -name <span class="hljs-string">&quot;*.tmp&quot;</span> -delete                  <span class="hljs-comment"># 找到删除</span>
find . -<span class="hljs-built_in">type</span> f -<span class="hljs-built_in">exec</span> <span class="hljs-built_in">chmod</span> 644 {} \\;          <span class="hljs-comment"># 批量执行</span>

<span class="hljs-built_in">which</span> &lt;cmd&gt;                       <span class="hljs-comment"># 命令路径</span>
whereis &lt;cmd&gt;
locate &lt;file&gt;                     <span class="hljs-comment"># 快速（需 updatedb）</span>
</code></pre></div><h2>三、文本处理</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">cat</span> / less / <span class="hljs-built_in">head</span> -n 20 / <span class="hljs-built_in">tail</span> -n 20
<span class="hljs-built_in">tail</span> -f &lt;file&gt;                    <span class="hljs-comment"># 实时跟踪日志</span>
<span class="hljs-built_in">tail</span> -F &lt;file&gt;                    <span class="hljs-comment"># rotate 后仍能跟踪</span>

grep <span class="hljs-string">&quot;p&quot;</span> &lt;file&gt;                   <span class="hljs-comment"># 基本</span>
grep -r -n -i <span class="hljs-string">&quot;p&quot;</span> .               <span class="hljs-comment"># 递归+行号+忽略大小写</span>
grep -v <span class="hljs-string">&quot;p&quot;</span> &lt;file&gt;                <span class="hljs-comment"># 反选</span>
grep -E <span class="hljs-string">&quot;a|b&quot;</span> &lt;file&gt;              <span class="hljs-comment"># 扩展正则</span>
rg <span class="hljs-string">&quot;p&quot;</span>                            <span class="hljs-comment"># ripgrep（快，推荐）</span>

sed <span class="hljs-string">&#39;s/old/new/g&#39;</span> &lt;file&gt;          <span class="hljs-comment"># 替换到 stdout</span>
sed -i <span class="hljs-string">&#39;s/old/new/g&#39;</span> &lt;file&gt;       <span class="hljs-comment"># 原地替换</span>
sed -i.bak <span class="hljs-string">&#39;s/old/new/g&#39;</span> &lt;file&gt;   <span class="hljs-comment"># 带备份</span>
sed -n <span class="hljs-string">&#39;10,20p&#39;</span> &lt;file&gt;            <span class="hljs-comment"># 打印范围</span>

awk <span class="hljs-string">&#39;{print $1}&#39;</span> &lt;file&gt;           <span class="hljs-comment"># 第一列</span>
awk -F: <span class="hljs-string">&#39;{print $1}&#39;</span> /etc/passwd
awk <span class="hljs-string">&#39;$3 &gt; 100 {print $1}&#39;</span> &lt;file&gt;

<span class="hljs-built_in">cut</span> -d: -f1 /etc/passwd
<span class="hljs-built_in">sort</span> &lt;file&gt;
<span class="hljs-built_in">sort</span> -u &lt;file&gt;                    <span class="hljs-comment"># 去重</span>
<span class="hljs-built_in">uniq</span> -c                           <span class="hljs-comment"># 统计相邻（先 sort）</span>
<span class="hljs-built_in">wc</span> -l &lt;file&gt;
<span class="hljs-built_in">tr</span> <span class="hljs-string">&#39;a-z&#39;</span> <span class="hljs-string">&#39;A-Z&#39;</span>
</code></pre></div><h3>管道组合</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">awk <span class="hljs-string">&#39;{print $1}&#39;</span> access.log | <span class="hljs-built_in">sort</span> | <span class="hljs-built_in">uniq</span> -c | <span class="hljs-built_in">sort</span> -rn | <span class="hljs-built_in">head</span> -10
<span class="hljs-built_in">du</span> -sh */ | <span class="hljs-built_in">sort</span> -rh | <span class="hljs-built_in">head</span> -10
</code></pre></div><h2>四、权限</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">chmod</span> 755 &lt;file&gt;
<span class="hljs-built_in">chmod</span> +x &lt;file&gt;
<span class="hljs-built_in">chmod</span> -R 644 &lt;<span class="hljs-built_in">dir</span>&gt;
<span class="hljs-built_in">chown</span> user:group &lt;file&gt;
<span class="hljs-built_in">chown</span> -R user &lt;<span class="hljs-built_in">dir</span>&gt;
<span class="hljs-built_in">chgrp</span> group &lt;file&gt;
<span class="hljs-built_in">umask</span>
</code></pre></div><p>数字权限：</p><table><thead><tr><th>数字</th><th>权限</th></tr></thead><tbody><tr><td>4</td><td>r–</td></tr><tr><td>5</td><td>r-x</td></tr><tr><td>6</td><td>rw-</td></tr><tr><td>7</td><td>rwx</td></tr></tbody></table><p>例：<code>755</code> = <code>rwxr-xr-x</code>，<code>644</code> = <code>rw-r--r--</code>。</p><p>特殊权限：</p><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">chmod</span> u+s &lt;file&gt;                  <span class="hljs-comment"># SUID</span>
<span class="hljs-built_in">chmod</span> g+s &lt;<span class="hljs-built_in">dir</span>&gt;                   <span class="hljs-comment"># SGID</span>
<span class="hljs-built_in">chmod</span> +t &lt;<span class="hljs-built_in">dir</span>&gt;                    <span class="hljs-comment"># Sticky（如 /tmp）</span>
</code></pre></div><h2>五、进程管理</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">ps aux
ps aux | grep nginx
pgrep -f <span class="hljs-string">&quot;pattern&quot;</span>
pidof &lt;name&gt;

top                               <span class="hljs-comment"># P 按 CPU，M 按内存</span>
htop                              <span class="hljs-comment"># 更友好</span>

<span class="hljs-built_in">kill</span> &lt;pid&gt;                        <span class="hljs-comment"># SIGTERM</span>
<span class="hljs-built_in">kill</span> -9 &lt;pid&gt;                     <span class="hljs-comment"># 强制</span>
pkill -f <span class="hljs-string">&quot;pattern&quot;</span>
killall &lt;name&gt;

<span class="hljs-built_in">nice</span> -n 10 &lt;cmd&gt;
renice -n 5 -p &lt;pid&gt;

Ctrl+Z                            <span class="hljs-comment"># 挂起</span>
<span class="hljs-built_in">bg</span> / <span class="hljs-built_in">fg</span> / <span class="hljs-built_in">jobs</span>
</code></pre></div><p>信号：</p><table><thead><tr><th>信号</th><th>编号</th><th>说明</th></tr></thead><tbody><tr><td>SIGHUP</td><td>1</td><td>挂起 / 重载</td></tr><tr><td>SIGINT</td><td>2</td><td>Ctrl+C</td></tr><tr><td>SIGKILL</td><td>9</td><td>强杀，不可捕获</td></tr><tr><td>SIGTERM</td><td>15</td><td>优雅退出（默认）</td></tr></tbody></table><h2>六、网络</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">ip addr                           <span class="hljs-comment"># 查看 IP</span>
ip route
ss -tunlp                         <span class="hljs-comment"># 监听端口（推荐）</span>
netstat -tunlp                    <span class="hljs-comment"># 老命令</span>
lsof -i :8080                     <span class="hljs-comment"># 谁占端口</span>

ping &lt;host&gt;
ping -c 4 &lt;host&gt;
traceroute &lt;host&gt;
mtr &lt;host&gt;                        <span class="hljs-comment"># 持续 traceroute</span>

curl -I &lt;url&gt;                     <span class="hljs-comment"># 只看头</span>
curl -v &lt;url&gt;                     <span class="hljs-comment"># 详细</span>
curl -o file.zip &lt;url&gt;            <span class="hljs-comment"># 下载</span>
curl -X POST -d <span class="hljs-string">&#39;{}&#39;</span> -H <span class="hljs-string">&quot;Content-Type: application/json&quot;</span> &lt;url&gt;

wget &lt;url&gt;
wget -c &lt;url&gt;                     <span class="hljs-comment"># 断点续传</span>
wget -r -np &lt;url&gt;                 <span class="hljs-comment"># 递归</span>

dig &lt;domain&gt;
dig +short &lt;domain&gt;
nslookup &lt;domain&gt;
host &lt;domain&gt;
</code></pre></div><h3>防火墙</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-comment"># ufw（Ubuntu）</span>
ufw status
ufw allow 22
ufw allow 80/tcp
ufw delete allow 80
ufw <span class="hljs-built_in">enable</span>

<span class="hljs-comment"># firewalld（CentOS）</span>
firewall-cmd --list-all
firewall-cmd --add-port=8080/tcp --permanent
firewall-cmd --reload

<span class="hljs-comment"># iptables</span>
iptables -L -n -v
iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
</code></pre></div><h2>七、磁盘与内存</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">df</span> -h                             <span class="hljs-comment"># 磁盘</span>
<span class="hljs-built_in">df</span> -i                             <span class="hljs-comment"># inode</span>
<span class="hljs-built_in">du</span> -sh &lt;<span class="hljs-built_in">dir</span>&gt;
<span class="hljs-built_in">du</span> -sh * | <span class="hljs-built_in">sort</span> -rh | <span class="hljs-built_in">head</span> -10

free -h                           <span class="hljs-comment"># 内存</span>
vmstat 1
iostat -x 1                       <span class="hljs-comment"># 需 sysstat</span>

lsblk
fdisk -l
mount /dev/sdb1 /mnt
umount /mnt
</code></pre></div><p>找大文件：</p><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">find / -<span class="hljs-built_in">type</span> f -size +1G 2&gt;/dev/null
<span class="hljs-built_in">du</span> -ah / | <span class="hljs-built_in">sort</span> -rh | <span class="hljs-built_in">head</span> -20
</code></pre></div><h2>八、压缩与归档</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">tar -czvf a.tar.gz &lt;<span class="hljs-built_in">dir</span>&gt;          <span class="hljs-comment"># 打包</span>
tar -xzvf a.tar.gz                <span class="hljs-comment"># 解包</span>
tar -tzvf a.tar.gz                <span class="hljs-comment"># 查看内容</span>
tar -xzvf a.tar.gz -C /tmp

zip -r a.zip &lt;<span class="hljs-built_in">dir</span>&gt;
unzip a.zip
unzip -l a.zip
unzip a.zip -d /tmp

gzip &lt;file&gt;
gunzip &lt;file&gt;.gz

zstd &lt;file&gt;                       <span class="hljs-comment"># 快速压缩</span>
xz -9 &lt;file&gt;                      <span class="hljs-comment"># 高压缩</span>
</code></pre></div><h2>九、用户与权限</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">whoami</span>
<span class="hljs-built_in">id</span>
<span class="hljs-built_in">who</span>
w
last

useradd -m -s /bin/bash &lt;user&gt;
passwd &lt;user&gt;
usermod -aG <span class="hljs-built_in">sudo</span> &lt;user&gt;
userdel -r &lt;user&gt;

groupadd &lt;group&gt;
<span class="hljs-built_in">groups</span> &lt;user&gt;

su - &lt;user&gt;
<span class="hljs-built_in">sudo</span> &lt;cmd&gt;
<span class="hljs-built_in">sudo</span> -i                           <span class="hljs-comment"># 进 root shell</span>
<span class="hljs-built_in">sudo</span> -u &lt;user&gt; &lt;cmd&gt;
</code></pre></div><p>sudoers：</p><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">visudo
</code></pre></div><pre><code>alice <span class="hljs-literal">ALL</span>=(<span class="hljs-literal">ALL</span>:<span class="hljs-literal">ALL</span>) <span class="hljs-literal">ALL</span>
%sudo <span class="hljs-literal">ALL</span>=(<span class="hljs-literal">ALL</span>:<span class="hljs-literal">ALL</span>) <span class="hljs-literal">ALL</span>
alice <span class="hljs-literal">ALL</span>=(<span class="hljs-literal">ALL</span>) NOPASSWD: <span class="hljs-literal">ALL</span>     <span class="hljs-comment"># 免密</span>
</code></pre><h2>十、systemd</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">systemctl start/stop/restart/reload/status &lt;svc&gt;
systemctl <span class="hljs-built_in">enable</span>/disable &lt;svc&gt;
systemctl is-active &lt;svc&gt;
systemctl list-units --<span class="hljs-built_in">type</span>=service --state=running
systemctl daemon-reload

journalctl -u &lt;svc&gt;
journalctl -u &lt;svc&gt; -f
journalctl -u &lt;svc&gt; --since <span class="hljs-string">&quot;1 hour ago&quot;</span>
journalctl -xe                    <span class="hljs-comment"># 最近错误</span>
journalctl -b                     <span class="hljs-comment"># 本次启动</span>
journalctl --disk-usage
journalctl --vacuum-size=500M     <span class="hljs-comment"># 清理</span>
</code></pre></div><p>unit 文件示例 <code>/etc/systemd/system/myapp.service</code>：</p><div class="md-code-block" data-lang="ini"><pre><code class="language-ini"><span class="hljs-section">[Unit]</span>
<span class="hljs-attr">Description</span>=My App
<span class="hljs-attr">After</span>=network.target

<span class="hljs-section">[Service]</span>
<span class="hljs-attr">Type</span>=simple
<span class="hljs-attr">User</span>=appuser
<span class="hljs-attr">WorkingDirectory</span>=/opt/myapp
<span class="hljs-attr">ExecStart</span>=/usr/bin/node /opt/myapp/index.js
<span class="hljs-attr">Restart</span>=<span class="hljs-literal">on</span>-failure
<span class="hljs-attr">RestartSec</span>=<span class="hljs-number">5</span>

<span class="hljs-section">[Install]</span>
<span class="hljs-attr">WantedBy</span>=multi-user.target
</code></pre></div><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">sudo</span> systemctl daemon-reload
<span class="hljs-built_in">sudo</span> systemctl <span class="hljs-built_in">enable</span> --now myapp
</code></pre></div><h2>十一、SSH</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">ssh user@host
ssh -p 2222 user@host
ssh -i ~/.ssh/id_rsa user@host

ssh-keygen -t ed25519 -C <span class="hljs-string">&quot;comment&quot;</span>
ssh-copy-id user@host

ssh -L 8080:localhost:80 user@host   <span class="hljs-comment"># 本地转发</span>
ssh -R 8080:localhost:80 user@host   <span class="hljs-comment"># 远程转发</span>
ssh -D 1080 user@host                <span class="hljs-comment"># SOCKS 代理</span>
</code></pre></div><p><code>~/.ssh/config</code>：</p><pre><code><span class="hljs-title class_">Host</span> myserver
    <span class="hljs-title class_">HostName</span> <span class="hljs-number">1.2</span>.<span class="hljs-number">3.4</span>
    <span class="hljs-title class_">User</span> alice
    <span class="hljs-title class_">Port</span> <span class="hljs-number">2222</span>
    <span class="hljs-title class_">IdentityFile</span> ~/.ssh/id_ed25519
</code></pre><p>之后 <code>ssh myserver</code> 即可。</p><h3>传输</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">scp &lt;file&gt; user@host:/path/
scp user@host:/path/&lt;file&gt; .
scp -r &lt;<span class="hljs-built_in">dir</span>&gt; user@host:/path/

rsync -avz --progress &lt;src&gt; user@host:&lt;dst&gt;   <span class="hljs-comment"># 增量同步</span>
rsync -avz --delete &lt;src&gt; user@host:&lt;dst&gt;
</code></pre></div><h2>十二、软件包管理</h2><h3>apt（Debian / Ubuntu）</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">sudo</span> apt update                   <span class="hljs-comment"># 更新索引</span>
<span class="hljs-built_in">sudo</span> apt upgrade                  <span class="hljs-comment"># 升级</span>
<span class="hljs-built_in">sudo</span> apt full-upgrade             <span class="hljs-comment"># 含依赖变化</span>
<span class="hljs-built_in">sudo</span> apt install &lt;pkg&gt;
<span class="hljs-built_in">sudo</span> apt remove &lt;pkg&gt;             <span class="hljs-comment"># 保留配置</span>
<span class="hljs-built_in">sudo</span> apt purge &lt;pkg&gt;              <span class="hljs-comment"># 含配置</span>
<span class="hljs-built_in">sudo</span> apt autoremove               <span class="hljs-comment"># 清理无用依赖</span>
<span class="hljs-built_in">sudo</span> apt search &lt;kw&gt;
<span class="hljs-built_in">sudo</span> apt show &lt;pkg&gt;
apt list --installed

<span class="hljs-built_in">sudo</span> dpkg -i &lt;pkg&gt;.deb
dpkg -l | grep &lt;pkg&gt;
</code></pre></div><h3>yum / dnf（RHEL / CentOS）</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">sudo</span> yum install &lt;pkg&gt;
<span class="hljs-built_in">sudo</span> yum remove &lt;pkg&gt;
<span class="hljs-built_in">sudo</span> yum update
<span class="hljs-built_in">sudo</span> yum search &lt;kw&gt;
<span class="hljs-built_in">sudo</span> yum info &lt;pkg&gt;
yum list installed
yum clean all &amp;&amp; yum makecache

<span class="hljs-built_in">sudo</span> dnf install &lt;pkg&gt;            <span class="hljs-comment"># 新一代</span>
dnf upgrade
dnf clean all

<span class="hljs-built_in">sudo</span> rpm -ivh &lt;pkg&gt;.rpm
rpm -qa | grep &lt;pkg&gt;
<span class="hljs-built_in">sudo</span> rpm -e &lt;pkg&gt;
</code></pre></div><h3>pacman（Arch）</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">sudo</span> pacman -Syu                  <span class="hljs-comment"># 同步并升级</span>
<span class="hljs-built_in">sudo</span> pacman -S &lt;pkg&gt;
<span class="hljs-built_in">sudo</span> pacman -Rns &lt;pkg&gt;            <span class="hljs-comment"># 卸载含依赖配置</span>
pacman -Ss &lt;kw&gt;
pacman -Qs &lt;pkg&gt;
</code></pre></div><h2>十三、日志</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">journalctl -xe
journalctl --since today
journalctl -p err                 <span class="hljs-comment"># 只错误</span>

<span class="hljs-built_in">tail</span> -f /var/log/syslog           <span class="hljs-comment"># Debian/Ubuntu</span>
<span class="hljs-built_in">tail</span> -f /var/log/messages         <span class="hljs-comment"># RHEL/CentOS</span>
<span class="hljs-built_in">tail</span> -f /var/log/auth.log         <span class="hljs-comment"># 认证</span>
<span class="hljs-built_in">tail</span> -f /var/log/nginx/access.log
<span class="hljs-built_in">tail</span> -f /var/log/nginx/error.log

dmesg
dmesg -T                          <span class="hljs-comment"># 人类可读时间</span>
dmesg | <span class="hljs-built_in">tail</span> -20
</code></pre></div><h2>十四、环境变量</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">env</span>
<span class="hljs-built_in">echo</span> <span class="hljs-variable">$PATH</span>
<span class="hljs-built_in">export</span> FOO=bar
<span class="hljs-built_in">unset</span> FOO

<span class="hljs-comment"># 永久</span>
~/.bashrc                         <span class="hljs-comment"># bash 交互式</span>
~/.bash_profile                   <span class="hljs-comment"># bash 登录</span>
~/.profile                        <span class="hljs-comment"># 通用</span>
/etc/profile                      <span class="hljs-comment"># 全局</span>

<span class="hljs-built_in">source</span> ~/.bashrc

<span class="hljs-built_in">export</span> PATH=<span class="hljs-string">&quot;<span class="hljs-variable">$HOME</span>/.local/bin:<span class="hljs-variable">$PATH</span>&quot;</span>      <span class="hljs-comment"># 前置</span>
<span class="hljs-built_in">export</span> PATH=<span class="hljs-string">&quot;<span class="hljs-variable">$PATH</span>:/opt/tools/bin&quot;</span>        <span class="hljs-comment"># 后置</span>
</code></pre></div><h2>十五、性能排查</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">uptime</span>                            <span class="hljs-comment"># 负载</span>
top                               <span class="hljs-comment"># 实时</span>
free -h                           <span class="hljs-comment"># 内存</span>
<span class="hljs-built_in">df</span> -h / <span class="hljs-built_in">df</span> -i                     <span class="hljs-comment"># 磁盘 / inode</span>
iostat -x 1                       <span class="hljs-comment"># IO</span>
sar -u 1 5                        <span class="hljs-comment"># CPU 历史</span>
</code></pre></div><p>通用排查顺序：</p><ol><li><code>uptime</code> + <code>top</code>：负载高不高、哪个进程占用。</li><li><code>free -h</code>：内存是否耗尽、是否 swap。</li><li><code>df -h</code> + <code>df -i</code>：空间 / inode 是否满。</li><li><code>iostat -x 1</code>：IO 是否瓶颈。</li><li><code>ss -s</code>：连接数是否异常。</li></ol><h3>定位细节</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">lsof -p &lt;pid&gt;                     <span class="hljs-comment"># 进程打开的文件</span>
lsof -i :8080                     <span class="hljs-comment"># 端口占用</span>
lsof /var/log/syslog

top -H -p &lt;pid&gt;                   <span class="hljs-comment"># 线程</span>
ps -T -p &lt;pid&gt;

tcpdump -i eth0 -n
tcpdump -i eth0 port 80
tcpdump -i eth0 host 1.2.3.4
tcpdump -i eth0 -w cap.pcap       <span class="hljs-comment"># 存盘（Wireshark 打开）</span>
</code></pre></div><h2>十六、定时任务</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">crontab -e                        <span class="hljs-comment"># 编辑</span>
crontab -l                        <span class="hljs-comment"># 列出</span>
crontab -r                        <span class="hljs-comment"># 删除</span>
</code></pre></div><p>格式：</p><pre><code>* * * * * &lt;command&gt;
│ │ │ │ │
│ │ │ │ └─ 星期（0<span class="hljs-string">-7</span>，0/7 都是周日）
│ │ │ └─── 月（1<span class="hljs-string">-12</span>）
│ │ └───── 日（1<span class="hljs-string">-31</span>）
│ └─────── 时（0<span class="hljs-string">-23</span>）
└───────── 分（0<span class="hljs-string">-59</span>）
</code></pre><p>例：</p><pre><code><span class="hljs-number">0</span> <span class="hljs-number">3</span> * * * <span class="hljs-regexp">/opt/</span>backup.sh              <span class="hljs-comment"># 每天 3:00</span>
*<span class="hljs-regexp">/5 * * * * /u</span>sr<span class="hljs-regexp">/bin/</span>check.sh         <span class="hljs-comment"># 每 5 分钟</span>
<span class="hljs-number">0</span> <span class="hljs-number">9</span>-<span class="hljs-number">18</span> * * <span class="hljs-number">1</span>-<span class="hljs-number">5</span> <span class="hljs-regexp">/opt/</span>work.sh           <span class="hljs-comment"># 工作日 9-18 整点</span>
</code></pre><p>注意事项：</p><ul><li>PATH 与登录 shell 不同，用绝对路径。</li><li>输出默认发邮件，重定向：<code>&gt;&gt; /var/log/job.log 2&gt;&amp;1</code>。</li><li>秒级任务用 systemd timer。</li></ul><h2>十七、实用技巧</h2><div class="md-code-block" data-lang="bash"><pre><code class="language-bash"><span class="hljs-built_in">history</span>
<span class="hljs-built_in">history</span> | grep &lt;kw&gt;
Ctrl+R                            <span class="hljs-comment"># 反向搜索历史</span>
!!                                <span class="hljs-comment"># 上一条</span>
!$                                <span class="hljs-comment"># 上一条最后参数</span>
!123                              <span class="hljs-comment"># 历史编号 123</span>

<span class="hljs-built_in">pushd</span> /path / <span class="hljs-built_in">popd</span> / <span class="hljs-built_in">dirs</span> -v

<span class="hljs-built_in">nohup</span> &lt;cmd&gt; &gt; out.log 2&gt;&amp;1 &amp;
<span class="hljs-built_in">disown</span>

openssl rand -<span class="hljs-built_in">base64</span> 16           <span class="hljs-comment"># 随机密码</span>
uuidgen
<span class="hljs-built_in">md5sum</span> &lt;file&gt;
<span class="hljs-built_in">sha256sum</span> &lt;file&gt;
xxd &lt;file&gt;
<span class="hljs-keyword">time</span> &lt;cmd&gt;

python3 -m http.server 8000       <span class="hljs-comment"># 快速 HTTP 服务</span>
</code></pre></div><h3>命令组合</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">cmd1 &amp;&amp; cmd2                      <span class="hljs-comment"># 成功才继续</span>
cmd1 || cmd2                      <span class="hljs-comment"># 失败才继续</span>
cmd1 ; cmd2                       <span class="hljs-comment"># 顺序</span>
cmd1 &amp;                            <span class="hljs-comment"># 后台</span>
(cmd1; cmd2)                      <span class="hljs-comment"># 子 shell</span>
</code></pre></div><h3>变量</h3><div class="md-code-block" data-lang="bash"><pre><code class="language-bash">name=<span class="hljs-string">&quot;world&quot;</span>
<span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;<span class="hljs-variable">$name</span>&quot;</span>
<span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;<span class="hljs-variable">\${name}</span>&quot;</span>
<span class="hljs-built_in">echo</span> <span class="hljs-string">&quot;<span class="hljs-subst">$(date)</span>&quot;</span>
<span class="hljs-built_in">echo</span> <span class="hljs-string">&#39;$name&#39;</span>                      <span class="hljs-comment"># 不替换</span>

: <span class="hljs-variable">\${VAR:=default}</span>                 <span class="hljs-comment"># 默认值</span>

str=<span class="hljs-string">&quot;hello.txt&quot;</span>
<span class="hljs-built_in">echo</span> <span class="hljs-variable">\${str%.txt}</span>                  <span class="hljs-comment"># hello</span>
<span class="hljs-built_in">echo</span> <span class="hljs-variable">\${str#hello.}</span>                <span class="hljs-comment"># txt</span>
<span class="hljs-built_in">echo</span> <span class="hljs-variable">\${str/txt/md}</span>                <span class="hljs-comment"># hello.md</span>
<span class="hljs-built_in">echo</span> <span class="hljs-variable">\${#str}</span>                      <span class="hljs-comment"># 9</span>
</code></pre></div><h2>十八、快捷键</h2><table><thead><tr><th>快捷键</th><th>作用</th></tr></thead><tbody><tr><td><code>Ctrl+C</code></td><td>中断</td></tr><tr><td><code>Ctrl+D</code></td><td>退出 shell</td></tr><tr><td><code>Ctrl+L</code></td><td>清屏</td></tr><tr><td><code>Ctrl+A</code> / <code>Ctrl+E</code></td><td>行首 / 行尾</td></tr><tr><td><code>Ctrl+U</code> / <code>Ctrl+K</code></td><td>删光标前 / 后</td></tr><tr><td><code>Ctrl+W</code></td><td>删前一个单词</td></tr><tr><td><code>Ctrl+R</code></td><td>搜索历史</td></tr><tr><td><code>Ctrl+Z</code></td><td>挂起</td></tr><tr><td><code>Tab</code> / <code>Tab Tab</code></td><td>补全 / 列候选</td></tr></tbody></table><hr><h2>参考</h2><ul><li>清华镜像站：<a href="https://mirrors.tuna.tsinghua.edu.cn/">https://mirrors.tuna.tsinghua.edu.cn/</a></li><li>中科大镜像站：<a href="https://mirrors.ustc.edu.cn/">https://mirrors.ustc.edu.cn/</a></li><li>阿里云镜像站：<a href="https://developer.aliyun.com/mirror/">https://developer.aliyun.com/mirror/</a></li><li>npmmirror：<a href="https://npmmirror.com/">https://npmmirror.com/</a></li><li>man 手册：<code>man &lt;command&gt;</code></li><li>tldr：<code>tldr &lt;command&gt;</code>（需安装）</li></ul>`,119)]]))}};export{s as category,a as date,f as default,u as featured,d as listed,l as summary,c as tags,o as time,i as title};