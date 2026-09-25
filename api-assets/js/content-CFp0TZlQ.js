const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["js/git-memo-2026-09-25-svnUKFVM.js","js/runtime-core.esm-bundler-Cz9CHoxa.js","js/linux-memo-20269-09-25-V4hy3DIw.js","js/markdown-vue-usage-2026-09-18-C7jgLAN7.js","js/dialog-CBA8G3pA.js","js/runtime-dom.esm-bundler-BJodgEXJ.js","js/device-DsCKXn2o.js","js/_plugin-vue_export-helper-BDNMzG2s.js","css/dialog-7hD9jMH3.css","js/GovPanel-CvGqG6L-.js","css/GovPanel-D5DBDg7o.css","js/GovButton-Cb4OYUjv.js","css/GovButton-DLmUySsV.css","js/node-package-managers-memo-2026-09-25-s5Zk2Or3.js","js/site-design-compliance-2026-09-16-CUyM36ak.js","js/welcome-2026-09-13-DDN7NMu8.js"])))=>i.map(i=>d[i]);
import{t as e}from"./preload-helper-Czpn1I53.js";var t=Object.assign({"./posts/git-memo-2026-09-25.md":`---\r
title: Git 备忘录\r
date: 2026-09-25\r
category: Git\r
time: 08:00\r
tags:\r
  - Git\r
  - 备忘录\r
summary: 一份日常高频使用的 Git 命令速查表，覆盖提交、分支、回退、撤销、贮藏、远程协作等场景，附带常见问题的解决方案。\r
featured: false\r
listed: true\r
---\r
\r
日常高频命令速查。按"场景"而非"命令字母"组织，便于出问题时直接翻。\r
\r
## 一、配置\r
\r
\`\`\`bash\r
# 用户信息（全局）\r
git config --global user.name "Your Name"\r
git config --global user.email "you@example.com"\r
\r
# 换行符（Windows 推荐）\r
git config --global core.autocrlf true\r
\r
# 中文文件名不乱码\r
git config --global core.quotepath false\r
\r
# 默认分支名\r
git config --global init.defaultBranch main\r
\r
# 常用别名\r
git config --global alias.st status\r
git config --global alias.co checkout\r
git config --global alias.br branch\r
git config --global alias.lg "log --oneline --graph --decorate --all"\r
\r
# 查看所有配置\r
git config --list --show-origin\r
\`\`\`\r
\r
## 二、基础工作流\r
\r
\`\`\`bash\r
git status                    # 查看工作区状态\r
git add <file>                # 暂存指定文件\r
git add .                     # 暂存所有改动（不含删除）\r
git add -A                    # 暂存所有改动（含删除）\r
git commit -m "message"       # 提交\r
git commit -am "message"      # 跳过 add，直接提交已跟踪文件\r
git push                      # 推送\r
git pull                      # 拉取并合并\r
\`\`\`\r
\r
### 查看差异\r
\r
\`\`\`bash\r
git diff                      # 工作区 vs 暂存区\r
git diff --staged             # 暂存区 vs 最新提交\r
git diff HEAD                 # 工作区 + 暂存区 vs 最新提交\r
git diff <branch1>..<branch2> # 两分支差异\r
\`\`\`\r
\r
## 三、分支\r
\r
\`\`\`bash\r
git branch                    # 查看本地分支\r
git branch -a                 # 查看所有分支（含远程）\r
git branch -vv                # 查看分支及跟踪关系\r
git branch <name>             # 创建分支\r
git switch <name>             # 切换分支（新版推荐）\r
git switch -c <name>          # 创建并切换\r
git checkout -b <name>        # 同上（旧版写法）\r
git branch -d <name>          # 删除已合并分支\r
git branch -D <name>          # 强制删除\r
git branch -m <old> <new>     # 重命名分支\r
\`\`\`\r
\r
### 合并与变基\r
\r
\`\`\`bash\r
git merge <branch>            # 合并到当前分支（保留历史）\r
git merge --no-ff <branch>    # 强制生成合并提交\r
git rebase <branch>           # 变基（线性历史）\r
git rebase -i HEAD~3          # 交互式变基，重写最近 3 条提交\r
\`\`\`\r
\r
> **原则**：已推送到共享远程的分支不要 rebase；只在本地分支上用。\r
\r
## 四、撤销与回退\r
\r
这是最容易踩坑的地方，先分清三种"撤销"：\r
\r
| 命令          | 作用范围          | 是否修改历史       | 使用场景           |\r
| ------------- | ----------------- | ------------------ | ------------------ |\r
| \`git restore\` | 工作区 / 暂存区   | 否                 | 丢弃未提交的修改   |\r
| \`git reset\`   | 暂存区 / 提交历史 | 是                 | 撤销提交（未推送） |\r
| \`git revert\`  | 提交历史          | 否（新增反向提交） | 撤销已推送的提交   |\r
\r
### 丢弃工作区修改\r
\r
\`\`\`bash\r
git restore <file>            # 丢弃单个文件的未暂存修改\r
git restore .                 # 丢弃所有未暂存修改（危险）\r
git checkout -- <file>        # 旧版写法\r
\`\`\`\r
\r
### 取消暂存\r
\r
\`\`\`bash\r
git restore --staged <file>   # 从暂存区移回工作区\r
git reset HEAD <file>         # 旧版写法\r
\`\`\`\r
\r
### 撤销提交\r
\r
\`\`\`bash\r
# 保留改动在工作区\r
git reset --soft HEAD~1\r
\r
# 保留改动在暂存区\r
git reset --mixed HEAD~1      # 默认\r
\r
# 彻底丢弃改动（危险）\r
git reset --hard HEAD~1\r
\r
# 撤销已推送的提交（安全）\r
git revert <commit-hash>\r
\`\`\`\r
\r
### 找回丢失的提交\r
\r
\`\`\`bash\r
git reflog                    # 查看 HEAD 移动历史\r
git reset --hard <hash>       # 回到某个历史位置\r
\`\`\`\r
\r
\`reset --hard\` 后如果后悔，\`reflog\` 通常能救回来，除非已经 GC。\r
\r
## 五、贮藏（stash）\r
\r
\`\`\`bash\r
git stash                     # 贮藏当前改动\r
git stash -u                  # 含未跟踪文件\r
git stash list                # 查看贮藏列表\r
git stash pop                 # 弹出最近贮藏并删除\r
git stash apply stash@{0}     # 应用指定贮藏（保留）\r
git stash drop stash@{0}      # 删除指定贮藏\r
git stash clear               # 清空所有贮藏\r
\`\`\`\r
\r
常见场景：改了一半，突然要切分支修 bug。\r
\r
## 六、远程\r
\r
\`\`\`bash\r
git remote -v                 # 查看远程仓库\r
git remote add origin <url>   # 添加远程\r
git remote set-url origin <url> # 修改远程地址\r
git remote remove origin      # 删除远程\r
\r
git fetch                     # 拉取远程信息，不合并\r
git pull                      # fetch + merge\r
git pull --rebase             # fetch + rebase\r
git push                      # 推送\r
git push -u origin <branch>   # 首次推送并建立跟踪\r
git push --force-with-lease   # 安全强推（推荐）\r
git push --force              # 强推（危险）\r
\`\`\`\r
\r
> **强推原则**：永远用 \`--force-with-lease\`，它会检查远程是否有人推过新提交，避免误覆盖别人的工作。\r
\r
## 七、标签\r
\r
\`\`\`bash\r
git tag                       # 查看标签\r
git tag v1.0.0                # 轻量标签\r
git tag -a v1.0.0 -m "msg"    # 附注标签（推荐）\r
git push origin v1.0.0        # 推送单个标签\r
git push --tags               # 推送所有标签\r
git tag -d v1.0.0             # 删除本地标签\r
git push origin :refs/tags/v1.0.0  # 删除远程标签\r
\`\`\`\r
\r
## 八、查看历史\r
\r
\`\`\`bash\r
git log                       # 完整日志\r
git log --oneline             # 单行\r
git log --oneline --graph     # 图形化\r
git log -p <file>             # 查看某文件历史\r
git log --author="name"       # 按作者过滤\r
git log --since="2 weeks ago" # 按时间过滤\r
git log -S "keyword"          # 按内容变化搜索（pickaxe）\r
git blame <file>              # 逐行查看最后修改者\r
git show <commit>             # 查看某次提交详情\r
\`\`\`\r
\r
## 九、常见问题\r
\r
### 1. 提交信息写错了（未推送）\r
\r
\`\`\`bash\r
git commit --amend -m "new message"\r
\`\`\`\r
\r
如果只是想补充文件：\r
\r
\`\`\`bash\r
git add forgotten.txt\r
git commit --amend --no-edit\r
\`\`\`\r
\r
### 2. 提交到了错误的分支\r
\r
\`\`\`bash\r
# 假设应该提交到 feature 分支，却提交到了 main\r
git branch feature                # 在当前位置创建分支\r
git reset --hard HEAD~1           # main 回退\r
git switch feature                # 切到 feature\r
\`\`\`\r
\r
### 3. 本地分支落后，想同步远程\r
\r
\`\`\`bash\r
git fetch origin\r
git rebase origin/main\r
# 或者\r
git pull --rebase origin main\r
\`\`\`\r
\r
### 4. 合并冲突\r
\r
\`\`\`bash\r
git status                        # 查看冲突文件\r
# 手动编辑冲突文件，删除 <<<<<<< ======= >>>>>>> 标记\r
git add <resolved-file>\r
git commit                        # 或 git rebase --continue\r
\`\`\`\r
\r
放弃合并：\r
\r
\`\`\`bash\r
git merge --abort\r
git rebase --abort\r
\`\`\`\r
\r
### 5. 不小心提交了敏感信息\r
\r
如果还没推送，\`git reset --hard\` 即可。  \r
如果已推送，必须改写历史：\r
\r
\`\`\`bash\r
git filter-repo --path secrets.txt --invert-paths\r
git push --force-with-lease\r
\`\`\`\r
\r
同时立即更换泄露的密钥，因为 Git 服务器可能仍留有副本。\r
\r
### 6. 忽略文件不生效\r
\r
\`\`\`bash\r
git rm -r --cached .\r
git add .\r
git commit -m "fix gitignore"\r
\`\`\`\r
\r
\`.gitignore\` 只对未跟踪文件生效，已跟踪的文件需要先 \`rm --cached\`。\r
\r
## 十、提交规范（Conventional Commits）\r
\r
\`\`\`\r
<type>(<scope>): <subject>\r
\r
<body>\r
\r
<footer>\r
\`\`\`\r
\r
常用 type：\r
\r
| type       | 说明                       |\r
| ---------- | -------------------------- |\r
| \`feat\`     | 新功能                     |\r
| \`fix\`      | 修复 bug                   |\r
| \`docs\`     | 文档变更                   |\r
| \`style\`    | 格式调整（不影响代码逻辑） |\r
| \`refactor\` | 重构                       |\r
| \`perf\`     | 性能优化                   |\r
| \`test\`     | 测试相关                   |\r
| \`chore\`    | 构建 / 工具 / 依赖变更     |\r
\r
示例：\r
\r
\`\`\`\r
feat(auth): 支持 OAuth 2.0 登录\r
\r
- 新增 GitHub / Google 登录入口\r
- 补充 token 刷新逻辑\r
\r
Closes #123\r
\`\`\`\r
\r
## 十一、实用技巧\r
\r
\`\`\`bash\r
# 快速查看某文件的最后一次修改\r
git log -1 --stat <file>\r
\r
# 查找是哪次提交引入了某个字符串\r
git log -S "search-string" --source --all\r
\r
# 查看两个分支的共同祖先\r
git merge-base main feature\r
\r
# 比较工作区和某个提交\r
git diff <commit>\r
\r
# 临时切换到某个提交查看，不切分支\r
git switch --detach <commit>\r
\r
# 查看暂存区的具体内容\r
git diff --staged\r
\r
# 统计每个作者的提交数\r
git shortlog -sn\r
\r
# 找出未被合并的分支\r
git branch --no-merged\r
\`\`\`\r
\r
## 十二、配置文件位置\r
\r
| 级别 | 路径                                                                       |\r
| ---- | -------------------------------------------------------------------------- |\r
| 系统 | \`/etc/gitconfig\`（Linux）/ \`C:\\Program Files\\Git\\etc\\gitconfig\`（Windows） |\r
| 全局 | \`~/.gitconfig\` / \`%USERPROFILE%\\.gitconfig\`                                |\r
| 仓库 | \`<repo>/.git/config\`                                                       |\r
\r
优先级：仓库 > 全局 > 系统。\r
\r
---\r
\r
## 参考\r
\r
- 官方文档：https://git-scm.com/docs\r
- Pro Git（中文版）：https://git-scm.com/book/zh/v2\r
- Conventional Commits：https://www.conventionalcommits.org/zh-hans/\r
`,"./posts/linux-memo-20269-09-25.md":`---\r
title: Linux 备忘录\r
date: 2026-09-25\r
time: 12:00\r
category: 工具\r
tags:\r
  - linux\r
  - 运维\r
  - 备忘录\r
summary: Linux 日常命令速查，覆盖 apt / yum / pacman 换国内源、pip / Docker 镜像加速、常用排查命令。\r
featured: false\r
listed: true\r
---\r
\r
国内环境下的高频命令。换源和镜像放在最前面。\r
\r
## 一、换源\r
\r
### 1.1 apt（Debian / Ubuntu）\r
\r
先备份，再替换：\r
\r
\`\`\`bash\r
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak\r
sudo sed -i 's|http://archive.ubuntu.com|https://mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list\r
sudo sed -i 's|http://security.ubuntu.com|https://mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list\r
sudo apt update\r
\`\`\`\r
\r
**Ubuntu 24.04+** 使用新格式 \`/etc/apt/sources.list.d/ubuntu.sources\`：\r
\r
\`\`\`bash\r
sudo sed -i 's|http://archive.ubuntu.com|https://mirrors.tuna.tsinghua.edu.cn|g' \\\r
  /etc/apt/sources.list.d/ubuntu.sources\r
\`\`\`\r
\r
**Debian 12+** 使用 \`/etc/apt/sources.list.d/debian.sources\`，同理。\r
\r
### 1.2 常用 apt 镜像源\r
\r
| 源     | URL                                    |\r
| ------ | -------------------------------------- |\r
| 清华   | \`https://mirrors.tuna.tsinghua.edu.cn\` |\r
| 阿里云 | \`https://mirrors.aliyun.com\`           |\r
| 中科大 | \`https://mirrors.ustc.edu.cn\`          |\r
| 华为云 | \`https://mirrors.huaweicloud.com\`      |\r
| 网易   | \`https://mirrors.163.com\`              |\r
\r
### 1.3 yum / dnf（RHEL / CentOS / Fedora）\r
\r
\`\`\`bash\r
# 备份\r
sudo cp -r /etc/yum.repos.d /etc/yum.repos.d.bak\r
\r
# CentOS 7 换阿里云\r
sudo sed -i 's|mirrorlist=|#mirrorlist=|g' /etc/yum.repos.d/CentOS-*.repo\r
sudo sed -i 's|#baseurl=http://mirror.centos.org|baseurl=https://mirrors.aliyun.com|g' \\\r
  /etc/yum.repos.d/CentOS-*.repo\r
\r
sudo yum clean all\r
sudo yum makecache\r
\`\`\`\r
\r
**CentOS 8 / Stream** 需要先换 vault（官方源已下线）：\r
\r
\`\`\`bash\r
sudo sed -i 's|mirror.centos.org|mirrors.aliyun.com|g' /etc/yum.repos.d/*.repo\r
sudo sed -i 's|^#baseurl|baseurl|g' /etc/yum.repos.d/*.repo\r
sudo sed -i 's|^mirrorlist|#mirrorlist|g' /etc/yum.repos.d/*.repo\r
sudo dnf clean all && sudo dnf makecache\r
\`\`\`\r
\r
**Fedora**：\r
\r
\`\`\`bash\r
sudo sed -i 's|^metalink=|#metalink=|g' /etc/yum.repos.d/fedora*.repo\r
sudo sed -i 's|^#baseurl=http://download.example/pub/fedora/linux|baseurl=https://mirrors.tuna.tsinghua.edu.cn/fedora|g' \\\r
  /etc/yum.repos.d/fedora*.repo\r
\`\`\`\r
\r
### 1.4 pacman（Arch）\r
\r
编辑 \`/etc/pacman.d/mirrorlist\`，把国内源放前面：\r
\r
\`\`\`\r
Server = https://mirrors.tuna.tsinghua.edu.cn/archlinux/$repo/os/$arch\r
Server = https://mirrors.ustc.edu.cn/archlinux/$repo/os/$arch\r
\`\`\`\r
\r
或者一键：\r
\r
\`\`\`bash\r
sudo pacman -S reflector\r
sudo reflector --country China --latest 5 --sort rate --save /etc/pacman.d/mirrorlist\r
sudo pacman -Syyu\r
\`\`\`\r
\r
### 1.5 pip 换源\r
\r
\`\`\`bash\r
# 永久\r
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple\r
pip config set global.trusted-host pypi.tuna.tsinghua.edu.cn\r
\r
# 或写入 ~/.pip/pip.conf (Linux) / %APPDATA%\\pip\\pip.ini (Windows)\r
# [global]\r
# index-url = https://pypi.tuna.tsinghua.edu.cn/simple\r
# trusted-host = pypi.tuna.tsinghua.edu.cn\r
\r
# 一次性\r
pip install <pkg> -i https://pypi.tuna.tsinghua.edu.cn/simple\r
\`\`\`\r
\r
常用 pip 镜像：\r
\r
| 源     | URL                                                       |\r
| ------ | --------------------------------------------------------- |\r
| 清华   | \`https://pypi.tuna.tsinghua.edu.cn/simple\`                |\r
| 阿里云 | \`https://mirrors.aliyun.com/pypi/simple/\`                 |\r
| 中科大 | \`https://pypi.mirrors.ustc.edu.cn/simple/\`                |\r
| 豆瓣   | \`https://pypi.douban.com/simple/\`                         |\r
| 华为云 | \`https://mirrors.huaweicloud.com/repository/pypi/simple/\` |\r
\r
### 1.6 Docker 镜像加速\r
\r
编辑 \`/etc/docker/daemon.json\`：\r
\r
\`\`\`json\r
{\r
  "registry-mirrors": [\r
    "https://docker.m.daocloud.io",\r
    "https://dockerproxy.com",\r
    "https://mirror.baidubce.com",\r
    "https://ccr.ccs.tencentyun.com"\r
  ]\r
}\r
\`\`\`\r
\r
\`\`\`bash\r
sudo systemctl daemon-reload\r
sudo systemctl restart docker\r
docker info | grep -A 5 "Registry Mirrors"\r
\`\`\`\r
\r
> 2024 年后很多公共镜像源已停服，以上仅供参考。企业环境建议自建 Harbor 或使用阿里云/腾讯云容器镜像服务。\r
\r
### 1.7 Go module 代理\r
\r
\`\`\`bash\r
go env -w GOPROXY=https://goproxy.cn,direct\r
go env -w GOSUMDB=sum.golang.google.cn\r
\`\`\`\r
\r
### 1.8 Maven 换源\r
\r
编辑 \`~/.m2/settings.xml\`：\r
\r
\`\`\`xml\r
<mirrors>\r
  <mirror>\r
    <id>aliyun</id>\r
    <mirrorOf>central</mirrorOf>\r
    <url>https://maven.aliyun.com/repository/public</url>\r
  </mirror>\r
</mirrors>\r
\`\`\`\r
\r
### 1.9 换源后必做\r
\r
\`\`\`bash\r
# apt\r
sudo apt update\r
\r
# yum / dnf\r
sudo yum clean all && sudo yum makecache\r
sudo dnf clean all && sudo dnf makecache\r
\r
# pacman\r
sudo pacman -Syyu\r
\`\`\`\r
\r
## 二、文件与目录\r
\r
\`\`\`bash\r
pwd                               # 当前目录\r
ls -alh                           # 详细列表\r
cd -                              # 上一个目录\r
mkdir -p a/b/c                    # 递归创建\r
rm -rf <dir>                      # 递归删除（危险）\r
cp -r <src> <dst>                 # 递归复制\r
mv <src> <dst>                    # 移动 / 重命名\r
ln -s <target> <link>             # 软链接\r
touch <file>\r
stat <file>\r
file <file>\r
\`\`\`\r
\r
### 查找\r
\r
\`\`\`bash\r
find . -name "*.log"                          # 按名\r
find . -type f -size +100M                    # >100M\r
find . -mtime -7                              # 7 天内\r
find . -name "*.tmp" -delete                  # 找到删除\r
find . -type f -exec chmod 644 {} \\;          # 批量执行\r
\r
which <cmd>                       # 命令路径\r
whereis <cmd>\r
locate <file>                     # 快速（需 updatedb）\r
\`\`\`\r
\r
## 三、文本处理\r
\r
\`\`\`bash\r
cat / less / head -n 20 / tail -n 20\r
tail -f <file>                    # 实时跟踪日志\r
tail -F <file>                    # rotate 后仍能跟踪\r
\r
grep "p" <file>                   # 基本\r
grep -r -n -i "p" .               # 递归+行号+忽略大小写\r
grep -v "p" <file>                # 反选\r
grep -E "a|b" <file>              # 扩展正则\r
rg "p"                            # ripgrep（快，推荐）\r
\r
sed 's/old/new/g' <file>          # 替换到 stdout\r
sed -i 's/old/new/g' <file>       # 原地替换\r
sed -i.bak 's/old/new/g' <file>   # 带备份\r
sed -n '10,20p' <file>            # 打印范围\r
\r
awk '{print $1}' <file>           # 第一列\r
awk -F: '{print $1}' /etc/passwd\r
awk '$3 > 100 {print $1}' <file>\r
\r
cut -d: -f1 /etc/passwd\r
sort <file>\r
sort -u <file>                    # 去重\r
uniq -c                           # 统计相邻（先 sort）\r
wc -l <file>\r
tr 'a-z' 'A-Z'\r
\`\`\`\r
\r
### 管道组合\r
\r
\`\`\`bash\r
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10\r
du -sh */ | sort -rh | head -10\r
\`\`\`\r
\r
## 四、权限\r
\r
\`\`\`bash\r
chmod 755 <file>\r
chmod +x <file>\r
chmod -R 644 <dir>\r
chown user:group <file>\r
chown -R user <dir>\r
chgrp group <file>\r
umask\r
\`\`\`\r
\r
数字权限：\r
\r
| 数字 | 权限 |\r
| ---- | ---- |\r
| 4    | r--  |\r
| 5    | r-x  |\r
| 6    | rw-  |\r
| 7    | rwx  |\r
\r
例：\`755\` = \`rwxr-xr-x\`，\`644\` = \`rw-r--r--\`。\r
\r
特殊权限：\r
\r
\`\`\`bash\r
chmod u+s <file>                  # SUID\r
chmod g+s <dir>                   # SGID\r
chmod +t <dir>                    # Sticky（如 /tmp）\r
\`\`\`\r
\r
## 五、进程管理\r
\r
\`\`\`bash\r
ps aux\r
ps aux | grep nginx\r
pgrep -f "pattern"\r
pidof <name>\r
\r
top                               # P 按 CPU，M 按内存\r
htop                              # 更友好\r
\r
kill <pid>                        # SIGTERM\r
kill -9 <pid>                     # 强制\r
pkill -f "pattern"\r
killall <name>\r
\r
nice -n 10 <cmd>\r
renice -n 5 -p <pid>\r
\r
Ctrl+Z                            # 挂起\r
bg / fg / jobs\r
\`\`\`\r
\r
信号：\r
\r
| 信号    | 编号 | 说明             |\r
| ------- | ---- | ---------------- |\r
| SIGHUP  | 1    | 挂起 / 重载      |\r
| SIGINT  | 2    | Ctrl+C           |\r
| SIGKILL | 9    | 强杀，不可捕获   |\r
| SIGTERM | 15   | 优雅退出（默认） |\r
\r
## 六、网络\r
\r
\`\`\`bash\r
ip addr                           # 查看 IP\r
ip route\r
ss -tunlp                         # 监听端口（推荐）\r
netstat -tunlp                    # 老命令\r
lsof -i :8080                     # 谁占端口\r
\r
ping <host>\r
ping -c 4 <host>\r
traceroute <host>\r
mtr <host>                        # 持续 traceroute\r
\r
curl -I <url>                     # 只看头\r
curl -v <url>                     # 详细\r
curl -o file.zip <url>            # 下载\r
curl -X POST -d '{}' -H "Content-Type: application/json" <url>\r
\r
wget <url>\r
wget -c <url>                     # 断点续传\r
wget -r -np <url>                 # 递归\r
\r
dig <domain>\r
dig +short <domain>\r
nslookup <domain>\r
host <domain>\r
\`\`\`\r
\r
### 防火墙\r
\r
\`\`\`bash\r
# ufw（Ubuntu）\r
ufw status\r
ufw allow 22\r
ufw allow 80/tcp\r
ufw delete allow 80\r
ufw enable\r
\r
# firewalld（CentOS）\r
firewall-cmd --list-all\r
firewall-cmd --add-port=8080/tcp --permanent\r
firewall-cmd --reload\r
\r
# iptables\r
iptables -L -n -v\r
iptables -A INPUT -p tcp --dport 8080 -j ACCEPT\r
\`\`\`\r
\r
## 七、磁盘与内存\r
\r
\`\`\`bash\r
df -h                             # 磁盘\r
df -i                             # inode\r
du -sh <dir>\r
du -sh * | sort -rh | head -10\r
\r
free -h                           # 内存\r
vmstat 1\r
iostat -x 1                       # 需 sysstat\r
\r
lsblk\r
fdisk -l\r
mount /dev/sdb1 /mnt\r
umount /mnt\r
\`\`\`\r
\r
找大文件：\r
\r
\`\`\`bash\r
find / -type f -size +1G 2>/dev/null\r
du -ah / | sort -rh | head -20\r
\`\`\`\r
\r
## 八、压缩与归档\r
\r
\`\`\`bash\r
tar -czvf a.tar.gz <dir>          # 打包\r
tar -xzvf a.tar.gz                # 解包\r
tar -tzvf a.tar.gz                # 查看内容\r
tar -xzvf a.tar.gz -C /tmp\r
\r
zip -r a.zip <dir>\r
unzip a.zip\r
unzip -l a.zip\r
unzip a.zip -d /tmp\r
\r
gzip <file>\r
gunzip <file>.gz\r
\r
zstd <file>                       # 快速压缩\r
xz -9 <file>                      # 高压缩\r
\`\`\`\r
\r
## 九、用户与权限\r
\r
\`\`\`bash\r
whoami\r
id\r
who\r
w\r
last\r
\r
useradd -m -s /bin/bash <user>\r
passwd <user>\r
usermod -aG sudo <user>\r
userdel -r <user>\r
\r
groupadd <group>\r
groups <user>\r
\r
su - <user>\r
sudo <cmd>\r
sudo -i                           # 进 root shell\r
sudo -u <user> <cmd>\r
\`\`\`\r
\r
sudoers：\r
\r
\`\`\`bash\r
visudo\r
\`\`\`\r
\r
\`\`\`\r
alice ALL=(ALL:ALL) ALL\r
%sudo ALL=(ALL:ALL) ALL\r
alice ALL=(ALL) NOPASSWD: ALL     # 免密\r
\`\`\`\r
\r
## 十、systemd\r
\r
\`\`\`bash\r
systemctl start/stop/restart/reload/status <svc>\r
systemctl enable/disable <svc>\r
systemctl is-active <svc>\r
systemctl list-units --type=service --state=running\r
systemctl daemon-reload\r
\r
journalctl -u <svc>\r
journalctl -u <svc> -f\r
journalctl -u <svc> --since "1 hour ago"\r
journalctl -xe                    # 最近错误\r
journalctl -b                     # 本次启动\r
journalctl --disk-usage\r
journalctl --vacuum-size=500M     # 清理\r
\`\`\`\r
\r
unit 文件示例 \`/etc/systemd/system/myapp.service\`：\r
\r
\`\`\`ini\r
[Unit]\r
Description=My App\r
After=network.target\r
\r
[Service]\r
Type=simple\r
User=appuser\r
WorkingDirectory=/opt/myapp\r
ExecStart=/usr/bin/node /opt/myapp/index.js\r
Restart=on-failure\r
RestartSec=5\r
\r
[Install]\r
WantedBy=multi-user.target\r
\`\`\`\r
\r
\`\`\`bash\r
sudo systemctl daemon-reload\r
sudo systemctl enable --now myapp\r
\`\`\`\r
\r
## 十一、SSH\r
\r
\`\`\`bash\r
ssh user@host\r
ssh -p 2222 user@host\r
ssh -i ~/.ssh/id_rsa user@host\r
\r
ssh-keygen -t ed25519 -C "comment"\r
ssh-copy-id user@host\r
\r
ssh -L 8080:localhost:80 user@host   # 本地转发\r
ssh -R 8080:localhost:80 user@host   # 远程转发\r
ssh -D 1080 user@host                # SOCKS 代理\r
\`\`\`\r
\r
\`~/.ssh/config\`：\r
\r
\`\`\`\r
Host myserver\r
    HostName 1.2.3.4\r
    User alice\r
    Port 2222\r
    IdentityFile ~/.ssh/id_ed25519\r
\`\`\`\r
\r
之后 \`ssh myserver\` 即可。\r
\r
### 传输\r
\r
\`\`\`bash\r
scp <file> user@host:/path/\r
scp user@host:/path/<file> .\r
scp -r <dir> user@host:/path/\r
\r
rsync -avz --progress <src> user@host:<dst>   # 增量同步\r
rsync -avz --delete <src> user@host:<dst>\r
\`\`\`\r
\r
## 十二、软件包管理\r
\r
### apt（Debian / Ubuntu）\r
\r
\`\`\`bash\r
sudo apt update                   # 更新索引\r
sudo apt upgrade                  # 升级\r
sudo apt full-upgrade             # 含依赖变化\r
sudo apt install <pkg>\r
sudo apt remove <pkg>             # 保留配置\r
sudo apt purge <pkg>              # 含配置\r
sudo apt autoremove               # 清理无用依赖\r
sudo apt search <kw>\r
sudo apt show <pkg>\r
apt list --installed\r
\r
sudo dpkg -i <pkg>.deb\r
dpkg -l | grep <pkg>\r
\`\`\`\r
\r
### yum / dnf（RHEL / CentOS）\r
\r
\`\`\`bash\r
sudo yum install <pkg>\r
sudo yum remove <pkg>\r
sudo yum update\r
sudo yum search <kw>\r
sudo yum info <pkg>\r
yum list installed\r
yum clean all && yum makecache\r
\r
sudo dnf install <pkg>            # 新一代\r
dnf upgrade\r
dnf clean all\r
\r
sudo rpm -ivh <pkg>.rpm\r
rpm -qa | grep <pkg>\r
sudo rpm -e <pkg>\r
\`\`\`\r
\r
### pacman（Arch）\r
\r
\`\`\`bash\r
sudo pacman -Syu                  # 同步并升级\r
sudo pacman -S <pkg>\r
sudo pacman -Rns <pkg>            # 卸载含依赖配置\r
pacman -Ss <kw>\r
pacman -Qs <pkg>\r
\`\`\`\r
\r
## 十三、日志\r
\r
\`\`\`bash\r
journalctl -xe\r
journalctl --since today\r
journalctl -p err                 # 只错误\r
\r
tail -f /var/log/syslog           # Debian/Ubuntu\r
tail -f /var/log/messages         # RHEL/CentOS\r
tail -f /var/log/auth.log         # 认证\r
tail -f /var/log/nginx/access.log\r
tail -f /var/log/nginx/error.log\r
\r
dmesg\r
dmesg -T                          # 人类可读时间\r
dmesg | tail -20\r
\`\`\`\r
\r
## 十四、环境变量\r
\r
\`\`\`bash\r
env\r
echo $PATH\r
export FOO=bar\r
unset FOO\r
\r
# 永久\r
~/.bashrc                         # bash 交互式\r
~/.bash_profile                   # bash 登录\r
~/.profile                        # 通用\r
/etc/profile                      # 全局\r
\r
source ~/.bashrc\r
\r
export PATH="$HOME/.local/bin:$PATH"      # 前置\r
export PATH="$PATH:/opt/tools/bin"        # 后置\r
\`\`\`\r
\r
## 十五、性能排查\r
\r
\`\`\`bash\r
uptime                            # 负载\r
top                               # 实时\r
free -h                           # 内存\r
df -h / df -i                     # 磁盘 / inode\r
iostat -x 1                       # IO\r
sar -u 1 5                        # CPU 历史\r
\`\`\`\r
\r
通用排查顺序：\r
\r
1. \`uptime\` + \`top\`：负载高不高、哪个进程占用。\r
2. \`free -h\`：内存是否耗尽、是否 swap。\r
3. \`df -h\` + \`df -i\`：空间 / inode 是否满。\r
4. \`iostat -x 1\`：IO 是否瓶颈。\r
5. \`ss -s\`：连接数是否异常。\r
\r
### 定位细节\r
\r
\`\`\`bash\r
lsof -p <pid>                     # 进程打开的文件\r
lsof -i :8080                     # 端口占用\r
lsof /var/log/syslog\r
\r
top -H -p <pid>                   # 线程\r
ps -T -p <pid>\r
\r
tcpdump -i eth0 -n\r
tcpdump -i eth0 port 80\r
tcpdump -i eth0 host 1.2.3.4\r
tcpdump -i eth0 -w cap.pcap       # 存盘（Wireshark 打开）\r
\`\`\`\r
\r
## 十六、定时任务\r
\r
\`\`\`bash\r
crontab -e                        # 编辑\r
crontab -l                        # 列出\r
crontab -r                        # 删除\r
\`\`\`\r
\r
格式：\r
\r
\`\`\`\r
* * * * * <command>\r
│ │ │ │ │\r
│ │ │ │ └─ 星期（0-7，0/7 都是周日）\r
│ │ │ └─── 月（1-12）\r
│ │ └───── 日（1-31）\r
│ └─────── 时（0-23）\r
└───────── 分（0-59）\r
\`\`\`\r
\r
例：\r
\r
\`\`\`\r
0 3 * * * /opt/backup.sh              # 每天 3:00\r
*/5 * * * * /usr/bin/check.sh         # 每 5 分钟\r
0 9-18 * * 1-5 /opt/work.sh           # 工作日 9-18 整点\r
\`\`\`\r
\r
注意事项：\r
\r
- PATH 与登录 shell 不同，用绝对路径。\r
- 输出默认发邮件，重定向：\`>> /var/log/job.log 2>&1\`。\r
- 秒级任务用 systemd timer。\r
\r
## 十七、实用技巧\r
\r
\`\`\`bash\r
history\r
history | grep <kw>\r
Ctrl+R                            # 反向搜索历史\r
!!                                # 上一条\r
!$                                # 上一条最后参数\r
!123                              # 历史编号 123\r
\r
pushd /path / popd / dirs -v\r
\r
nohup <cmd> > out.log 2>&1 &\r
disown\r
\r
openssl rand -base64 16           # 随机密码\r
uuidgen\r
md5sum <file>\r
sha256sum <file>\r
xxd <file>\r
time <cmd>\r
\r
python3 -m http.server 8000       # 快速 HTTP 服务\r
\`\`\`\r
\r
### 命令组合\r
\r
\`\`\`bash\r
cmd1 && cmd2                      # 成功才继续\r
cmd1 || cmd2                      # 失败才继续\r
cmd1 ; cmd2                       # 顺序\r
cmd1 &                            # 后台\r
(cmd1; cmd2)                      # 子 shell\r
\`\`\`\r
\r
### 变量\r
\r
\`\`\`bash\r
name="world"\r
echo "$name"\r
echo "\${name}"\r
echo "$(date)"\r
echo '$name'                      # 不替换\r
\r
: \${VAR:=default}                 # 默认值\r
\r
str="hello.txt"\r
echo \${str%.txt}                  # hello\r
echo \${str#hello.}                # txt\r
echo \${str/txt/md}                # hello.md\r
echo \${#str}                      # 9\r
\`\`\`\r
\r
## 十八、快捷键\r
\r
| 快捷键              | 作用          |\r
| ------------------- | ------------- |\r
| \`Ctrl+C\`            | 中断          |\r
| \`Ctrl+D\`            | 退出 shell    |\r
| \`Ctrl+L\`            | 清屏          |\r
| \`Ctrl+A\` / \`Ctrl+E\` | 行首 / 行尾   |\r
| \`Ctrl+U\` / \`Ctrl+K\` | 删光标前 / 后 |\r
| \`Ctrl+W\`            | 删前一个单词  |\r
| \`Ctrl+R\`            | 搜索历史      |\r
| \`Ctrl+Z\`            | 挂起          |\r
| \`Tab\` / \`Tab Tab\`   | 补全 / 列候选 |\r
\r
---\r
\r
## 参考\r
\r
- 清华镜像站：https://mirrors.tuna.tsinghua.edu.cn/\r
- 中科大镜像站：https://mirrors.ustc.edu.cn/\r
- 阿里云镜像站：https://developer.aliyun.com/mirror/\r
- npmmirror：https://npmmirror.com/\r
- man 手册：\`man <command>\`\r
- tldr：\`tldr <command>\`（需安装）\r
`,"./posts/markdown-vue-usage-2026-09-18.md":`---
title: 关于在 Markdown 中嵌入 Vue 组件的说明
date: 2026-09-18
time: 11:00
category: 技术文档
tags: [Vue, Markdown]
summary: 本站 Markdown 文件经 unplugin-vue-markdown 编译为 Vue 单文件组件，正文可直接使用 Vue 组件与响应式逻辑。现将使用方法与注意事项说明如下。
featured: true
listed: true
---

<script setup>
import { ref } from 'vue'
import GovPanel from '@/index/components/common/GovPanel.vue'
import GovButton from '@/index/components/common/GovButton.vue'
import { showAlert } from '@/index/components/common/dialog'

const count = ref(0)
const showTip = ref(true)

function increment() {
    count.value += 1
}

function handleAlert() {
    showAlert('来自文章内的事件')
}
<\/script>

本站的 \`.md\` 文件由 \`unplugin-vue-markdown\` 在构建时编译为 Vue 单文件组件。正文中的 Vue 组件标签会被当作模板的一部分解析，\`<script setup>\` 中的逻辑对正文完全可见。现将使用方法说明如下。

## 一、基本用法

在 frontmatter 之后、正文之前书写 \`<script setup>\`，导入所需组件与响应式 API 即可。

\`\`\`vue
<script setup>
import { ref } from "vue";
import GovButton from "@/index/components/common/GovButton.vue";

const count = ref(0);
<\/script>

正文中可以像这样使用：
<GovButton variant="primary">按钮</GovButton>
\`\`\`

组件标签与 Markdown 语法可以混用。以下为实际渲染效果：

<GovPanel title="示例一：响应式计数器">
  <p>当前计数：<b>{{ count }}</b></p>
  <GovButton variant="primary" @click="increment">
    <MyIcon icon="plus"></MyIcon>&nbsp;增加
  </GovButton> <br /><br />
  <GovButton variant="default" @click="count = 0">重置</GovButton>
</GovPanel>

<div class="md-alert md-alert--tip">
  文章内的 <code>ref</code> 是独立的响应式状态，作用域限于当前文章的组件实例，不会与其他文章或站点状态相互影响。
</div>

## 二、条件渲染与列表渲染

Vue 的 \`v-if\`、\`v-for\` 等指令在正文中同样有效。

<GovPanel title="示例二：条件渲染">
  <GovButton variant="primary" @click="showTip = !showTip">
    <MyIcon icon="eye"></MyIcon>&nbsp;切换显示
  </GovButton>
  <p v-if="showTip" style="margin-top: 12px;">
    这段文字由 <code>v-if</code> 控制，当前可见。
  </p>
  <p v-else style="margin-top: 12px; color: #999;">
    这段文字由 <code>v-else</code> 控制，当前显示的是它。
  </p>
</GovPanel>

下面的列表由 \`v-for\` 渲染，数据来自文章内的 \`<script setup>\`：

<ul>
  <li v-for="i in 3" :key="i">第 {{ i }} 项，共 3 项</li>
</ul>

## 三、嵌入组件

本站提供的政务组件均可在正文中直接使用。

<GovPanel title="示例三：组件组合" tone="red">
  <p>以下按钮均为 <code>GovButton</code> 组件的不同 <code>variant</code>：</p>
  <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px;">
    <GovButton variant="primary">主要操作</GovButton>
    <GovButton variant="danger">危险操作</GovButton>
    <GovButton variant="default">次要操作</GovButton>
  </div>
</GovPanel>

<GovPanel title="示例四：图标使用">
  <p>
    <MyIcon icon="download"></MyIcon> 下载
    <MyIcon icon="web"></MyIcon> 官网
    <MyIcon icon="code-tags"></MyIcon> 源码
    <MyIcon icon="file-document-outline"></MyIcon> 文档
  </p>
</GovPanel>

## 四、事件绑定

组件上的 \`@click\` 等事件可以直接绑定到文章内的函数。

<GovPanel title="示例五：事件处理">
  <GovButton variant="primary" @click="handleAlert">
    点击弹出提示
  </GovButton>
</GovPanel>

实际写法如下：

\`\`\`vue
<script setup>
function handleAlert() {
  alert("来自文章内的事件");
}
<\/script>

<GovButton variant="primary" @click="handleAlert">
  点击弹出提示
</GovButton>
\`\`\`

## 五、注意事项

（一）**组件需要显式导入**。方案 B 下文章是独立的 Vue 组件，组件不会自动注册。必须在 \`<script setup>\` 中 \`import\`，不能依赖全局注册。

（二）**自定义组件请显式闭合**。markdown-it 在处理块级 HTML 时，自闭合的自定义组件标签（\`<MyIcon ... />\`）容易丢失自闭合标志，导致 Vue 编译器报 \`Element is missing end tag\`。建议所有自定义组件都写成 \`<MyIcon ...></MyIcon>\`，HTML void 元素（\`<br>\`、\`<img>\`）不受影响。

（三）**旧版容器语法不再生效**。本站早期的 \`::: tip\` / \`::: warning\` / \`::: tabs\` 等自定义容器已在迁移中移除，改用原生 HTML 类表达，例如 \`<div class="md-alert md-alert--tip">…</div>\`。

（四）**构建时编译**。正文中的组件在构建阶段编译为 render function，而非运行时解析。若组件名拼写错误，会在构建时或开发时控制台提示，而不会静默忽略。

（五）**样式作用域**。文章内联写的 \`style\` 属性作用于当前元素，Markdown 渲染出的标签样式由 \`markdown.css\` 统一控制。若需要局部样式，建议在文章内使用内联 \`style\`，或封装为独立组件。

（六）**不要写 \`<style>\` 块**。本站暂不支持在 Markdown 中书写 \`<style>\`，会与 SFC 编译流程冲突。需要样式时优先使用已有 CSS 变量或内联样式。

## 六、小结

Markdown 与 Vue 的融合让静态内容具备了组件化的能力。文章不再只是纯文本，而是可以拥有响应式状态、可复用组件与事件交互的完整页面单元。这使得一些原本需要额外页面承载的功能，可以直接在文章内表达。

如需查看本站组件清单，可参阅[《关于本站对照国办发〔2017〕47号文开展设计规范调整的说明》](/articles/site-design-compliance-2017-47)。
`,"./posts/node-package-managers-memo-2026-09-25.md":`---\r
title: Node包管理器备忘录\r
date: 2026-09-25\r
time: 20:00\r
category: 工具\r
tags:\r
  - npm\r
  - yarn\r
  - pnpm\r
  - 包管理\r
  - 备忘录\r
summary: npm / yarn (v1) / pnpm 命令对照，覆盖国内换源、镜像配置、私有源、各种 binary 加速、常见错误排查。\r
featured: false\r
listed: true\r
---\r
\r
日常高频命令 + 国内换源方案。命令对照无差异时只写 npm。\r
\r
## 一、换源\r
\r
### 1.1 一键切换：nrm\r
\r
\`\`\`bash\r
npm install -g nrm\r
\r
nrm ls                            # 列出所有源\r
nrm use taobao                    # 切到淘宝源\r
nrm use npm                       # 切回官方\r
nrm current                       # 查看当前\r
nrm test                          # 测速\r
nrm add company http://npm.company.com/    # 加私有源\r
nrm del company\r
\`\`\`\r
\r
### 1.2 手动切换\r
\r
\`\`\`bash\r
# npm\r
npm config set registry https://registry.npmmirror.com\r
npm config get registry\r
npm config delete registry        # 恢复默认\r
\r
# yarn v1\r
yarn config set registry https://registry.npmmirror.com\r
yarn config get registry\r
yarn config delete registry\r
\r
# pnpm\r
pnpm config set registry https://registry.npmmirror.com\r
pnpm config get registry\r
\`\`\`\r
\r
### 1.3 常用镜像源\r
\r
| 源                       | URL                                               |\r
| ------------------------ | ------------------------------------------------- |\r
| 官方                     | \`https://registry.npmjs.org\`                      |\r
| 淘宝 / npmmirror（推荐） | \`https://registry.npmmirror.com\`                  |\r
| 腾讯云                   | \`https://mirrors.cloud.tencent.com/npm/\`          |\r
| 华为云                   | \`https://mirrors.huaweicloud.com/repository/npm/\` |\r
| cnpmjs                   | \`https://registry.cnpmjs.org\`                     |\r
\r
> 淘宝源域名 \`registry.npm.taobao.org\` 已废弃，新域名为 \`registry.npmmirror.com\`。\r
\r
### 1.4 一次性使用（不改配置）\r
\r
\`\`\`bash\r
npm install --registry=https://registry.npmmirror.com\r
yarn add <pkg> --registry=https://registry.npmmirror.com\r
pnpm add <pkg> --registry=https://registry.npmmirror.com\r
\`\`\`\r
\r
### 1.5 项目级 .npmrc\r
\r
**只在当前项目生效**，适合团队统一配置。放项目根目录：\r
\r
\`\`\`ini\r
# .npmrc\r
registry=https://registry.npmmirror.com\r
strict-ssl=true\r
save-exact=true\r
engine-strict=true\r
\`\`\`\r
\r
**提交到 Git**，让所有成员和 CI 用同一套源。\r
\r
### 1.6 私有源 + 公共源混用（scoped registry）\r
\r
公司包放私有源，公共包走镜像：\r
\r
\`\`\`ini\r
# .npmrc\r
registry=https://registry.npmmirror.com\r
@company:registry=https://npm.company.com/\r
//npm.company.com/:_authToken=\${NPM_TOKEN}\r
//registry.npmmirror.com/:always-auth=false\r
\`\`\`\r
\r
\`@company\` 开头的包（如 \`@company/ui\`）走私有源，其余走淘宝源。\r
\r
### 1.7 认证 Token 配置\r
\r
\`\`\`ini\r
# ~/.npmrc\r
//registry.npmjs.org/:_authToken=npm_xxxxxxxxxxxx\r
//npm.pkg.github.com/:_authToken=ghp_xxxxxxxxxxxx\r
\`\`\`\r
\r
或用环境变量（推荐 CI 使用）：\r
\r
\`\`\`bash\r
export NPM_TOKEN=xxxxx\r
# .npmrc 里写\r
//registry.npmjs.org/:_authToken=\${NPM_TOKEN}\r
\`\`\`\r
\r
### 1.8 换源失败的排查\r
\r
\`\`\`bash\r
# 1. 确认当前源\r
npm config get registry\r
\r
# 2. 直接 curl 试\r
curl -I https://registry.npmmirror.com/vue\r
\r
# 3. 清除 npm 缓存\r
npm cache clean --force\r
\r
# 4. 检查是否有多个 .npmrc 冲突\r
npm config list --show-origin\r
\`\`\`\r
\r
## 二、其他 binary 镜像（换源只改 npm 包，不改 binary）\r
\r
很多包在 \`postinstall\` 阶段会下载**非 npm 的二进制**，换 registry 没用。这些要单独配：\r
\r
### 2.1 Node 版本管理器镜像\r
\r
**nvm**：\r
\r
\`\`\`bash\r
export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node\r
nvm install 20\r
\`\`\`\r
\r
写入 \`~/.bashrc\` 或 \`~/.zshrc\` 永久生效。\r
\r
**fnm**：\r
\r
\`\`\`bash\r
export FNM_NODE_DIST_MIRROR=https://npmmirror.com/mirrors/node\r
\`\`\`\r
\r
### 2.2 Electron\r
\r
\`\`\`bash\r
# 项目 .npmrc\r
electron_mirror=https://npmmirror.com/mirrors/electron/\r
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/\r
\`\`\`\r
\r
### 2.3 Puppeteer / Playwright\r
\r
\`\`\`bash\r
# .npmrc 或环境变量\r
puppeteer_download_host=https://npmmirror.com/mirrors\r
PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright\r
\`\`\`\r
\r
### 2.4 node-sass / sass-embedded\r
\r
\`\`\`bash\r
# .npmrc\r
sass_binary_site=https://npmmirror.com/mirrors/node-sass\r
\`\`\`\r
\r
现在多用 \`sass\`（dart-sass 纯 JS 实现），无需 binary。\r
\r
### 2.5 sharp / canvas\r
\r
\`\`\`bash\r
# .npmrc\r
sharp_binary_host=https://npmmirror.com/mirrors/sharp\r
sharp_libvips_binary_host=https://npmmirror.com/mirrors/sharp-libvips\r
canvas_binary_host_mirror=https://npmmirror.com/mirrors/node-canvas-prebuilt/\r
\`\`\`\r
\r
### 2.6 Cypress\r
\r
\`\`\`bash\r
export CYPRESS_DOWNLOAD_MIRROR=https://npmmirror.com/mirrors/cypress\r
\`\`\`\r
\r
### 2.7 全家桶模板\r
\r
\`\`\`ini\r
# ~/.npmrc 一份全搞定\r
registry=https://registry.npmmirror.com\r
electron_mirror=https://npmmirror.com/mirrors/electron/\r
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/\r
puppeteer_download_host=https://npmmirror.com/mirrors\r
PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright\r
sass_binary_site=https://npmmirror.com/mirrors/node-sass\r
sharp_binary_host=https://npmmirror.com/mirrors/sharp\r
sharp_libvips_binary_host=https://npmmirror.com/mirrors/sharp-libvips\r
canvas_binary_host_mirror=https://npmmirror.com/mirrors/node-canvas-prebuilt/\r
CYPRESS_DOWNLOAD_MIRROR=https://npmmirror.com/mirrors/cypress\r
\`\`\`\r
\r
## 三、命令对照速查\r
\r
| 操作               | npm                       | yarn (v1)                  | pnpm                   |\r
| ------------------ | ------------------------- | -------------------------- | ---------------------- |\r
| 安装全部           | \`npm install\`             | \`yarn\`                     | \`pnpm install\`         |\r
| 安装生产依赖       | \`npm i <pkg>\`             | \`yarn add <pkg>\`           | \`pnpm add <pkg>\`       |\r
| 安装开发依赖       | \`npm i -D <pkg>\`          | \`yarn add -D <pkg>\`        | \`pnpm add -D <pkg>\`    |\r
| 安装全局           | \`npm i -g <pkg>\`          | \`yarn global add <pkg>\`    | \`pnpm add -g <pkg>\`    |\r
| 安装指定版本       | \`npm i <pkg>@1.2.3\`       | 同                         | 同                     |\r
| 卸载               | \`npm uninstall <pkg>\`     | \`yarn remove <pkg>\`        | \`pnpm remove <pkg>\`    |\r
| 卸载全局           | \`npm uninstall -g <pkg>\`  | \`yarn global remove <pkg>\` | \`pnpm remove -g <pkg>\` |\r
| 更新全部           | \`npm update\`              | \`yarn upgrade\`             | \`pnpm update\`          |\r
| 运行脚本           | \`npm run <s>\`             | \`yarn <s>\`                 | \`pnpm <s>\`             |\r
| 执行本地二进制     | \`npx <bin>\`               | \`yarn <bin>\`               | \`pnpm exec <bin>\`      |\r
| 执行远程包         | \`npx <pkg>\`               | —                          | \`pnpm dlx <pkg>\`       |\r
| 查看顶层依赖       | \`npm ls --depth=0\`        | \`yarn list --depth=0\`      | \`pnpm list --depth=0\`  |\r
| 查过时依赖         | \`npm outdated\`            | \`yarn outdated\`            | \`pnpm outdated\`        |\r
| 清缓存             | \`npm cache clean --force\` | \`yarn cache clean\`         | \`pnpm store prune\`     |\r
| 查看为什么装了某包 | \`npm why <pkg>\`           | \`yarn why <pkg>\`           | \`pnpm why <pkg>\`       |\r
\r
## 四、锁文件\r
\r
| 包管理器 | 锁文件              | 提交 Git |\r
| -------- | ------------------- | -------- |\r
| npm      | \`package-lock.json\` | ✅       |\r
| yarn v1  | \`yarn.lock\`         | ✅       |\r
| pnpm     | \`pnpm-lock.yaml\`    | ✅       |\r
\r
**同一仓库只保留一种锁文件**。混用会导致依赖树不一致。\r
\r
### 清理重装\r
\r
\`\`\`bash\r
# npm\r
rm -rf node_modules package-lock.json && npm install\r
\r
# yarn\r
rm -rf node_modules yarn.lock && yarn install\r
\r
# pnpm\r
rm -rf node_modules pnpm-lock.yaml && pnpm install\r
\`\`\`\r
\r
### CI 严格安装\r
\r
\`\`\`bash\r
npm ci                            # 严格按 lock 装，不更新\r
pnpm install --frozen-lockfile\r
yarn install --frozen-lockfile\r
\`\`\`\r
\r
\`npm ci\` 要求 \`package-lock.json\` 与 \`package.json\` 完全一致，否则直接报错退出。\r
\r
## 五、依赖版本语义\r
\r
| 写法           | 允许升级范围                           |\r
| -------------- | -------------------------------------- |\r
| \`1.2.3\`        | 精确，不升级                           |\r
| \`~1.2.3\`       | \`>=1.2.3 <1.3.0\`                       |\r
| \`^1.2.3\`       | \`>=1.2.3 <2.0.0\`                       |\r
| \`^0.2.3\`       | \`>=0.2.3 <0.3.0\`（0.x 例外，锁次版本） |\r
| \`*\` / \`latest\` | 不限（不推荐）                         |\r
\r
## 六、脚本（scripts）\r
\r
### 钩子\r
\r
| 钩子             | 触发时机                                    |\r
| ---------------- | ------------------------------------------- |\r
| \`preinstall\`     | install 之前                                |\r
| \`postinstall\`    | install 之后                                |\r
| \`prepare\`        | install 和 publish 之前都触发（husky 常用） |\r
| \`prepublishOnly\` | 仅 \`npm publish\` 之前                       |\r
| \`pre<script>\`    | \`npm run <script>\` 之前                     |\r
| \`post<script>\`   | 执行之后                                    |\r
\r
### 传参与环境变量\r
\r
\`\`\`bash\r
npm run build -- --mode production\r
yarn build --mode production\r
pnpm build --mode production\r
\r
# 跨平台环境变量\r
npm i -D cross-env\r
"build": "cross-env NODE_ENV=production vite build"\r
\`\`\`\r
\r
## 七、依赖管理\r
\r
### overrides / resolutions（强制覆盖版本）\r
\r
**npm (>= 8.3)**：\r
\r
\`\`\`json\r
{\r
  "overrides": {\r
    "lodash": "4.17.21",\r
    "some-pkg": { "lodash": "4.17.21" }\r
  }\r
}\r
\`\`\`\r
\r
**yarn v1**：\r
\r
\`\`\`json\r
{\r
  "resolutions": {\r
    "lodash": "4.17.21",\r
    "**/lodash": "4.17.21"\r
  }\r
}\r
\`\`\`\r
\r
**pnpm**：\r
\r
\`\`\`json\r
{\r
  "pnpm": {\r
    "overrides": {\r
      "lodash": "4.17.21"\r
    }\r
  }\r
}\r
\`\`\`\r
\r
### 依赖分析\r
\r
\`\`\`bash\r
npm ls <pkg>                      # 谁依赖了它\r
npm why <pkg>                     # 同上（npm 8+）\r
pnpm why <pkg>\r
yarn why <pkg>\r
\`\`\`\r
\r
## 八、npm 专属\r
\r
\`\`\`bash\r
npm view <pkg>                    # 包信息\r
npm view <pkg> versions           # 所有版本\r
npm view <pkg> dist-tags          # 标签\r
npm info <pkg> repository.url     # 仓库地址\r
\r
npm login\r
npm publish                       # 发布\r
npm publish --access public       # scoped 包首次发布\r
npm publish --tag beta            # 打标签\r
npm unpublish <pkg>@1.0.0         # 撤销（24h 内）\r
\`\`\`\r
\r
## 九、yarn v1 专属\r
\r
### workspaces\r
\r
\`\`\`json\r
{\r
  "private": true,\r
  "workspaces": ["packages/*"]\r
}\r
\`\`\`\r
\r
\`\`\`bash\r
yarn workspace <pkg> add <dep>\r
yarn workspaces info\r
\`\`\`\r
\r
### 常用\r
\r
\`\`\`bash\r
yarn licenses list                # 许可证\r
yarn audit                        # 安全审计\r
yarn autoclean --init\r
\`\`\`\r
\r
> yarn v1 已停止新功能开发，长期建议迁移到 pnpm 或 yarn berry (v2+)。\r
\r
## 十、pnpm 专属\r
\r
### 核心优势\r
\r
- **硬链接 + 内容寻址存储**：磁盘只存一份包实体，多项目共享。\r
- **非扁平化 node_modules**：只有直接依赖可见，杜绝幽灵依赖。\r
- **严格 peerDependencies**：不隐式提升未声明依赖。\r
\r
### 常用\r
\r
\`\`\`bash\r
pnpm store path                   # store 位置\r
pnpm store prune                  # 清缓存\r
pnpm dedupe                       # 去重\r
pnpm patch <pkg>                  # 打补丁\r
pnpm patch-commit <path>\r
\r
pnpm add -O <pkg>                 # optionalDependencies\r
pnpm add -P <pkg>                 # peerDependencies\r
\`\`\`\r
\r
### 工作区\r
\r
\`\`\`yaml\r
# pnpm-workspace.yaml\r
packages:\r
  - "packages/*"\r
  - "apps/*"\r
\`\`\`\r
\r
\`\`\`bash\r
pnpm -r build                     # 递归所有包\r
pnpm --filter web build           # 只跑 web\r
pnpm --filter "web..." build      # web 及其依赖\r
pnpm --filter "...web" build      # web 及其被依赖者\r
\`\`\`\r
\r
### .npmrc 常用\r
\r
\`\`\`ini\r
shamefully-hoist=true             # 兼容老包（临时用）\r
strict-peer-dependencies=false\r
auto-install-peers=true\r
node-linker=hoisted               # 扁平常见兼容方案\r
\`\`\`\r
\r
## 十一、常见问题\r
\r
### 1. \`ERR_OSSL_EVP_UNSUPPORTED\`（Node 17+）\r
\r
老项目 + 新 Node，OpenSSL 3 引起。\r
\r
\`\`\`bash\r
export NODE_OPTIONS=--openssl-legacy-provider\r
# 或降级 Node 16\r
\`\`\`\r
\r
### 2. \`EACCES\` 权限错误\r
\r
**别用 sudo**，改 npm 全局目录：\r
\r
\`\`\`bash\r
mkdir -p ~/.npm-global\r
npm config set prefix '~/.npm-global'\r
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc\r
source ~/.bashrc\r
\`\`\`\r
\r
### 3. \`peer dep\` 冲突（npm 7+）\r
\r
\`\`\`bash\r
npm install --legacy-peer-deps    # 按 npm 6 行为忽略 peer 冲突\r
npm install --force               # 强制（危险）\r
\`\`\`\r
\r
### 4. 安装慢\r
\r
先换源（见第一节）。如果还慢，看是不是在下载 binary：\r
\r
\`\`\`bash\r
npm install --verbose 2>&1 | grep -i "http"\r
\`\`\`\r
\r
看到下载 electron / puppeteer 之类的，就要配对应的 binary 镜像。\r
\r
### 5. 幽灵依赖\r
\r
代码用了没在 \`package.json\` 里声明的包（因为被提升到顶层才碰巧能用）。\r
\r
**根治**：用 pnpm。**缓解**：\`npm ls --depth=0\` 核对，把用到的都显式声明。\r
\r
### 6. CI 报 lock 不一致\r
\r
用 \`npm ci\` / \`pnpm install --frozen-lockfile\` 时，\`package.json\` 与 lock 必须同步。本地改完 \`package.json\` 一定要重跑一次 \`install\` 让 lock 更新，再提交。\r
\r
### 7. 强制项目使用某个包管理器\r
\r
\`\`\`json\r
{\r
  "scripts": {\r
    "preinstall": "npx only-allow pnpm"\r
  }\r
}\r
\`\`\`\r
\r
### 8. \`npm audit fix --force\` 引入 breaking change\r
\r
\`--force\` 会跨越主版本升级。先看不 force 能修多少：\r
\r
\`\`\`bash\r
npm audit\r
npm audit fix\r
npm audit --production            # 只看生产依赖\r
\`\`\`\r
\r
## 十二、安全审计\r
\r
\`\`\`bash\r
npm audit\r
yarn audit\r
pnpm audit\r
\`\`\`\r
\r
---\r
\r
## 参考\r
\r
- npm 文档：https://docs.npmjs.com/\r
- yarn v1：https://classic.yarnpkg.com/\r
- pnpm：https://pnpm.io/zh/\r
- npmmirror：https://npmmirror.com/\r
`,"./posts/site-design-compliance-2026-09-16.md":`---
title: 关于本站对照国办发〔2017〕47号文开展设计规范调整的说明
summary: 依据《政府网站发展指引》（国办发〔2017〕47号）及其附件《网页设计规范》，本站于2026年9月对站点色调、字体、内容加载、栏目结构等进行系统性调整，现将有关情况说明如下。
date: 2026-09-16
time: 21:50
category: 公告
tags: [公告]
featured: true
listed: true
---

为进一步规范本站页面展现形式，提升信息服务质量，根据《政府网站发展指引》（国办发〔2017〕47号）及其附件《网页设计规范》有关要求，结合《政府网站与政务新媒体检查指标》（国办秘函〔2019〕19号）有关考核标准，本站于2026年9月对整体设计进行系统性调整。现将调整依据及主要内容说明如下。

## 一、调整依据

（一）《政府网站发展指引》（国办发〔2017〕47号）。该文件由国务院办公厅印发，是全国政府网站建设的基本规范，其中附件《网页设计规范》对网站的展现布局、地址链接、网页标签等提出了明确要求。

（二）《政府网站与政务新媒体检查指标》（国办秘函〔2019〕19号）。该文件明确了政府网站考核的单项否决指标和扣分指标，其中涉及页面加载时长、栏目更新情况、内容发布规范等具体要求。

（三）《政府网站集约化试点工作方案》（国办函〔2018〕71号）。该方案要求实现"统一标准体系、统一技术平台、统一安全防护、统一运维监管"，对站点技术架构和设计模式具有指导意义。

（四）山西省地方标准《政府网站集约化平台 网页设计规范》（DB14/T 2544—2022）等行业性、地方性标准，作为本站在具体设计实施中的参考依据。

## 二、调整主要内容

（一）**规范色调使用**。规范要求"确定1种主色调，总色调不宜超过3种"。本站原设计围绕蓝色系展开了多个派生色，色值数量偏多。经调整，确立以深蓝（#015293）为主色调、白色为辅助色、红色（#e4393c）为强调色的三色体系，其余派生色统一收归为主色调的透明度变体，不再作为独立色值维护。

（二）**统一字体字号**。规范要求"同一类别的栏目和信息使用同一模板，统一字体、字号、行间距和布局"。经排查，原设计在 \`GovPanel\` 标题、\`markdown.css\` 的 \`h2\`、\`DocLayout\` 的 \`h2\` 等位置存在字号不一致问题。本次调整将上述位置的字号统一为 \`--gov-fs-lg\`，并清理了 \`SiteFooter\`、\`DocLayout\` 中重复定义的样式规则。

（三）**优化加载性能**。规范要求"页面加载时长不宜超过3秒"，检查指标将"网站打不开次数累计占比超过5%"列为单项否决。本站原内容层采用构建时全量内联方式，随内容数量增长将影响首屏体积。本次调整改为按需异步加载，配合空闲时预加载后续路由组件的方式，兼顾首屏速度与导航体验。

（四）**完善内容展示**。规范要求"网站内容要清晰显示发布时间，时间格式为YYYY—MM—DD HH:MM"。本站原列表项仅显示日期，本次调整在内容层增加 \`time\` 字段，列表与详情页均按规范格式显示完整时间。

（五）**健全栏目管理**。规范要求"栏目设置应科学合理，避免出现空白栏目"。本次调整新增"资源"栏目，统一收录开发工具、组件库等资源信息，并对文章列表、资源列表、搜索页的展示规则进行一致性梳理，明确各栏目数据来源，避免出现重复或空白栏目。

（六）**扩展检索范围**。在原站内搜索仅覆盖文章的基础上，新增资源检索，统一为 \`/search\` 页面，支持全部、文章、资源三类筛选，并可分享、可回退、可刷新，符合规范中"提供信息检索功能"的相关要求。

## 三、调整后效果

（一）**色调统一**。全站主色调、辅助色、强调色使用规范，页面整体观感协调一致。

（二）**字号规范**。同级标题字号一致，正文、辅助信息、数字等各级字号层级分明，符合用户阅读习惯。

（三）**加载优化**。首屏体积得到控制，配合路由预加载，主流网络环境下页面加载时长稳定控制在规范要求以内。

（四）**内容完整**。发布时间、信息来源、分类标签等要素展示完整，符合规范对内容展示的要求。

（五）**结构清晰**。头部标识区、中部内容区、底部功能区划分明确，底部功能区列明网站名称、备案编号、联系方式等信息。

## 四、后续工作

（一）持续跟踪国家关于政府网站建设的相关文件更新情况，及时对照调整本站设计。

（二）定期对站点进行自查，重点检查栏目更新、内容发布、页面性能等考核指标涉及的内容。

（三）结合用户反馈，进一步优化站内检索、无障碍访问、移动端适配等体验。

## 五、说明

本站为个人技术项目，非政府网站，本站视觉设计参照政府网站规范进行，旨在为用户提供规范、清晰、易读的信息服务。所有内容仅代表个人观点，与任何机构无关。

特此说明。

---

**附：主要参考文件**

<ul>
  <li><a href="https://www.gov.cn/zhengce/content/2017-06/08/content_5200760.htm" target="_blank" rel="noopener">国务院办公厅关于印发政府网站发展指引的通知（国办发〔2017〕47号）</a></li>
  <li><a href="https://www.gov.cn/zhengce/content/2019-04/18/content_5384134.htm" target="_blank" rel="noopener">国务院办公厅秘书局关于印发政府网站与政务新媒体检查指标、监管工作年度考核指标的通知（国办秘函〔2019〕19号）</a></li>
  <li><a href="https://www.gov.cn/gongbao/content/2018/content_5343741.htm" target="_blank" rel="noopener">国务院办公厅关于印发《政府网站集约化试点工作方案》的通知（国办函〔2018〕71号）</a></li>
  <li><a href="https://ba.sacinfo.org.cn/stdDetail/f0d57c3b3c953827ce262a46b434d20685261c7714f6a0060ce1c7467868eae2" target="_blank" rel="noopener">《政府网站集约化平台 网页设计规范》（DB14/T 2544—2022）</a></li>
</ul>

**简要说明**

- **国办发〔2017〕47号**：国务院办公厅2017年5月15日成文，6月8日发布，附件含《网页设计规范》。
- **国办秘函〔2019〕19号**：国务院办公厅秘书局2019年4月1日成文，4月18日发布，含单项否决指标和扣分、加分指标。
- **国办函〔2018〕71号**：国务院办公厅2018年10月27日成文，11月9日发布，要求“统一标准体系、统一技术平台”等。
- **DB14/T 2544—2022**：山西省地方标准，2022年9月30日发布，12月30日实施，技术归口为山西省电子政务信息标准化技术委员会。
`,"./posts/welcome-2026-09-13.md":`---
title: 韵典综合平台博客上线
date: 2026-09-13
time: 09:00
category: 公告
tags: [公告, 平台]
summary: 韵典综合平台博客子应用正式上线，采用政务门户视觉语言、纯静态架构与 SFC 化 Markdown 内容层。
featured: true
listed: true
---

## 缘起

韵典综合平台需要一个稳定、清晰、高密度的信息发布区。我们选择政务门户的视觉语言：深蓝导航、红色重点提示、白底内容区、1px 直角边框。

它追求的不是「好看」，而是**清晰、稳定、可长期维护**。

## 技术选型

| 层级 | 选型                                                          |
| ---- | ------------------------------------------------------------- |
| 框架 | Vue 3 + Vue Router 4                                          |
| 构建 | Vite 5                                                        |
| 内容 | Markdown + \`unplugin-vue-markdown\`（Markdown 编译为 Vue SFC） |
| 图标 | Material Design Icons                                         |

> 原则：无后端、无数据库、无运行时服务；新增文章 = 丢一个 \`.md\` 文件。

## 内容层：Markdown 即 Vue 组件

本站的 \`.md\` 文件在构建时由 \`unplugin-vue-markdown\` 编译为 Vue 单文件组件。这意味着：

- 正文里可以直接写 Vue 组件，例如 \`<GovButton variant="primary">查看详情</GovButton>\`；
- 每篇文章的 \`<script setup>\` 可以 import 自己的依赖，逻辑与展示完全内聚；
- 路由按需加载文章组件，首屏体积不随文章数量增长。

\`frontmatter\` 顶部元信息由内容层在构建时读取，用于列表、归档、分类、标签与检索，**不影响正文的渲染方式**。

## Frontmatter 字段约定

| 字段       | 类型         | 说明                                       |
| ---------- | ------------ | ------------------------------------------ |
| \`title\`    | string       | 文章标题，缺失时回退到正文首个 H1 或文件名 |
| \`date\`     | \`YYYY-MM-DD\` | 发布日期，缺失时回退到文件名中的日期       |
| \`time\`     | \`HH:MM\`      | 发布时间（可选），用于详情页完整展示       |
| \`category\` | string       | 分类，归档与侧边栏聚合依据                 |
| \`tags\`     | string[]     | 标签，用于标签云与相关阅读打分             |
| \`summary\`  | string       | 摘要，缺失时从正文提取                     |
| \`featured\` | boolean      | 是否列入首页「推荐阅读」                   |
| \`listed\`   | boolean      | 是否列入列表/聚合（默认 \`true\`）           |
| \`draft\`    | boolean      | 是否跳过构建（\`true\` 则完全不打包）        |

\`listed: false\` 与 \`draft: true\` 的语义不同：前者构建进包、详情页可直达，但不进列表；后者完全不构建。前者适合「有链接但不想公开收录」的场景。

## 目录结构

\`\`\`
src/index/
├── content/                # 文章内容层
│   ├── index.js
│   └── posts/
│       └── site-design-compliance-2017-47.md
├── resources/              # 资源内容层
│   ├── index.js
│   └── posts/
│       └── vite.md
├── components/
│   ├── common/             # GovPanel / GovButton / GovDialog / Breadcrumb 等
│   ├── blog/               # ArticleItem / ArticleSidebar
│   └── resource/           # ResourceCard / ResourceSidebar
├── views/                  # 路由视图
│   ├── HomeView.vue
│   ├── ArticleListView.vue
│   ├── ArticleDetailView.vue
│   ├── ResourceListView.vue
│   ├── ResourceDetailView.vue
│   ├── SearchView.vue
│   ├── ArchiveView.vue
│   ├── CategoryView.vue
│   ├── TagView.vue
│   └── ...
├── data/
│   └── site.js             # 站点配置与导航项
├── router/
│   └── index.js
└── styles/
    ├── tokens.css          # 设计令牌：颜色 / 字体 / 间距
    ├── base.css            # 基础样式与布局工具类
    └── markdown.css        # Markdown 内容渲染样式
\`\`\`

所有博客代码位于 \`src/index/\`，作为 MSPA 融合项目的一个子应用，与 \`account / console / relay / ai\` 等子应用按域名分流。

## 已上线功能

- **文章**：列表 / 详情 / 分类 / 标签 / 归档 / 相关阅读
- **资源**：总览 / 详情 / 分类与平台筛选 / 多下载通道
- **搜索**：\`/search\` 统一检索公开的文章与资源，支持全部 / 文章 / 资源三类筛选，输入防抖自动搜索
- **弹窗**：\`GovDialog\` 声明式组件 + \`showDialog / showAlert / showConfirm\` 函数式调用，支持多弹窗栈、ESC 关闭、滚动锁定与滚动条宽度补偿
- **Cookie 合规**：按 IP 国家判断是否弹出授权，符合 GDPR 场景
- **无障碍**：顶部工具栏提供「无障碍浏览」字号放大开关

## 内容约定

- 新增文章：在 \`src/index/content/posts/\` 下新增 \`.md\`，\`listed\` 缺省即为公开；
- 新增资源：在 \`src/index/resources/posts/\` 下新增 \`.md\`，支持 \`downloads\` 对象数组声明多通道下载；
- 引用其他文章：用 \`router-link\` 或 Markdown 链接，slug 即文件名（去掉 \`.md\`）；
- 插入组件：在 \`<script setup>\` 中显式 import，正文中直接使用组件标签。

## 设计原则

- **三色体系**：以深蓝 \`#015293\` 为主色、白色为辅助色、红色 \`#e4393c\` 为强调色，总色调不超过三种；
- **字体分层**：正文黑体、公文引用宋体、数字 Tinos、顶栏点阵宋体，各司其职；
- **直角优先**：模块容器一律直角，小控件圆角不超过 6px；
- **加载性能**：路由懒加载 + 空闲预加载，配合 Markdown 组件化，首屏体积受控。

## 说明

本站为个人技术项目，非政府网站，视觉设计参照《政府网站发展指引》（国办发〔2017〕47号）及其附件《网页设计规范》进行。所有内容仅代表个人观点，与任何机构无关。

如需了解本站对照国家规范的具体调整，可参阅[《关于本站对照国办发〔2017〕47号文开展设计规范调整的说明》](/articles/site-design-compliance-2017-47)。
`}),n=Object.assign({"./posts/git-memo-2026-09-25.md":()=>e(()=>import(`./git-memo-2026-09-25-svnUKFVM.js`),__vite__mapDeps([0,1])),"./posts/linux-memo-20269-09-25.md":()=>e(()=>import(`./linux-memo-20269-09-25-V4hy3DIw.js`),__vite__mapDeps([2,1])),"./posts/markdown-vue-usage-2026-09-18.md":()=>e(()=>import(`./markdown-vue-usage-2026-09-18-C7jgLAN7.js`),__vite__mapDeps([3,1,4,5,6,7,8,9,10,11,12])),"./posts/node-package-managers-memo-2026-09-25.md":()=>e(()=>import(`./node-package-managers-memo-2026-09-25-s5Zk2Or3.js`),__vite__mapDeps([13,1])),"./posts/site-design-compliance-2026-09-16.md":()=>e(()=>import(`./site-design-compliance-2026-09-16-CUyM36ak.js`),__vite__mapDeps([14,1])),"./posts/welcome-2026-09-13.md":()=>e(()=>import(`./welcome-2026-09-13-DDN7NMu8.js`),__vite__mapDeps([15,1]))});function r(e){let t=/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(e);if(!t)return{data:{},body:e};let n=t[1].split(/\r?\n/),r={},i=null,a=null;for(let e of n){let t=/^\s*-\s+(.*)$/.exec(e);if(t&&i){a||(a=[],r[i]=a),a.push(t[1].trim().replace(/^["']|["']$/g,``));continue}let n=/^([a-zA-Z][\w-]*)\s*:\s*(.*)$/.exec(e);if(n){let e=n[1],t=n[2].trim();i=e,a=null,t===``?(r[e]=[],a=r[e]):r[e]=t.startsWith(`[`)&&t.endsWith(`]`)?t.slice(1,-1).split(`,`).map(e=>e.trim().replace(/^["']|["']$/g,``)).filter(Boolean):t===`true`||t===`false`?t===`true`:t.replace(/^["']|["']$/g,``)}}return{data:r,body:t[2]}}function i(e){return e.replace(/<script[\s\S]*?<\/script>/gi,``).replace(/<style[\s\S]*?<\/style>/gi,``).replace(/<\/?[A-Z][\w-]*(\s[^>]*)?>/g,``).replace(/<!--[\s\S]*?-->/g,``).replace(/[#>*`\[\]()\-!\n\r]/g,` `).replace(/\s+/g,` `).trim()}function a(e,t){let a=e.replace(`./posts/`,``).replace(/\.md$/,``),{data:o,body:s}=r(t);if(o.draft===!0)return null;let c=/^#\s+(.+)$/m.exec(s),l=c?c[1].trim():a,u=o.category??o.categories??`未分类`,d=Array.isArray(u)?u[0]:u,f=o.tags??o.tag??[],p=Array.isArray(f)?f:[f],m=/\.(\d{4}-\d{2}-\d{2})\.md$/.exec(e)?.[1],h=o.date?String(o.date).slice(0,10):m||`1970-01-01`,g=i(s);return{slug:a,title:o.title||l,date:h,category:d,tags:p,listed:o.listed!==!1,summary:o.summary||g.slice(0,100),featured:!!o.featured,readingMinutes:Math.max(1,Math.round(g.length/350)),searchText:g.toLowerCase(),component:n[e]}}var o=Object.entries(t).map(([e,t])=>a(e,t)).filter(Boolean).sort((e,t)=>t.date.localeCompare(e.date)),s=o.filter(e=>e.listed),c=[...new Set(s.map(e=>e.category))].filter(Boolean).sort(),l=[...new Set(s.flatMap(e=>e.tags))].filter(Boolean).sort();function u(e){return o.find(t=>t.slug===e)}function d(e){return s.filter(t=>t.category===e)}function f(e){return s.filter(t=>t.tags.includes(e))}function p(){return s.filter(e=>e.featured)}function m(e=6){return s.slice(0,e)}function h(){let e={};for(let t of s){let n=t.date.slice(0,4);(e[n]??=[]).push(t)}return Object.entries(e).sort((e,t)=>t[0].localeCompare(e[0]))}function g(e){let t=String(e||``).trim().toLowerCase();return t?s.filter(e=>e.title.toLowerCase().includes(t)||e.summary.toLowerCase().includes(t)||e.category.toLowerCase().includes(t)||e.tags.some(e=>e.toLowerCase().includes(t))||e.searchText.includes(t)):[]}export{d as a,s as c,u as i,g as l,h as n,f as o,p as r,m as s,c as t,l as u};