# OAuth 2.0 第三方登录接入规划文档

## 1. 背景与约束条件

本项目旨在为一套强依赖邮箱验证的账号体系接入第三方 OAuth 登录，以降低普通用户与开发者的注册门槛。

**硬性约束条件：**

- 开发者属性：个人开发者，无企业资质。
- 部署环境：Cloudflare (Workers/Pages)，无 ICP 备案。
- 资质限制：无银行卡、不支持手机号验证。
- 安全策略：系统采用**邮箱域名白名单机制**，只有受信任后缀的邮箱才被允许直接注册。

## 2. 核心认证策略（白名单拦截机制）

系统不再纠结第三方平台是否提供了 `email_verified` 标记，而是统一采用**“邮箱域名白名单判定”**逻辑。只要平台返回的 `email` 字段命中域名列表白名单规则，即视为有效注册凭证；否则，一律转到[/oauth2/account_notlinked.html](/oauth2/account_notlinked.html)。

**核心判定流程：**

1. 发起 OAuth 授权，获取用户信息（UserInfo）。
2. 提取唯一标识 `sub`（或 `id`）与邮箱 `email`。
3. 判定逻辑：
   - **分支 A**：存在 `sub/id` 且已绑定AyAccount \(\rightarrow\) 直接注册/登录。
   - **分支 B**：存在 `email` 且域名命中白名单 \(\rightarrow\) 直接注册/登录，并存入该账号的第三方绑定。
   - **分支 B**：存在 `email` 但域名未命中白名单 \(\rightarrow\) 转入/oauth2/新的中间页，提示不支持的邮箱。
   - **分支 C**：不存在 `email` \(\rightarrow\) ，转到 /oauth2/account_notlinked.html。

## 3. 平台接入矩阵

根据各平台 OAuth 接口的返回特性，将接入平台分为以下三类：

### 3.1 A类：可直接返回真实邮箱

此类平台接入后，通常可完成“一键快捷注册”。若用户使用了非白名单邮箱，转入/oauth2/新的中间页，提示不支持的邮箱。

| 平台名称       | 唯一标识 (`sub`) | 邮箱获取要求 / 注意事项                                                                                        | 目标群体           |
| :------------- | :--------------- | :------------------------------------------------------------------------------------------------------------- | :----------------- |
| **Google**     | 全局唯一，极稳定 | 请求 `email` scope。                                                                                           | 全球大众、技术圈   |
| **Cloudflare** | 稳定             | OIDC 仅返回 `sub`，需用 `access_token` 调用 `/client/v4/user` 接口换取真实邮箱。需设应用为 Public 并验证域名。 | 技术圈/建站开发者  |
| **Discord**    | 稳定             | 默认包含 `email` scope，存在极小概率返回 `null`。                                                              | 年轻群体、游戏用户 |
| **GitLab**     | 稳定             | 请求 `email` scope。                                                                                           | 开发者             |
| **Amazon**     | 稳定             | 开发者建应用免绑卡；用户端返回真实邮箱。                                                                       | 电商/普通大众      |
| **Spotify**    | 稳定             | **必须**显式配置 `user-read-email` scope。                                                                     | 娱乐向用户         |
| **Facebook**   | 稳定             | 请求 `email` 权限。不依赖其 `verified` 标记，依靠白名单放行。                                                  | 普通大众           |
| **Gitee**      | 稳定             | 需申请 `emails` 权限。                                                                                         | 国内开发者         |
| **Twitch**     | 稳定             | 需显式配置 `user:read:email` scope 及 `email` claim。                                                          | 游戏/直播用户      |

### 3.2 B类：返回虚拟/伪造邮箱（极难命中白名单）

此类平台会返回一个不可接收邮件的占位符邮箱。系统会自动将其识别为“未命中白名单”，转入/oauth2/新的中间页，提示不支持的邮箱。

| 平台名称        | 唯一标识 (`sub`) | 接口返回特性                                     | 目标群体    |
| :-------------- | :--------------- | :----------------------------------------------- | :---------- |
| **X (Twitter)** | 稳定             | 可能返回 `username@twitter.invalid` 等伪造地址。 | 极客/技术圈 |
| **Linux.do**    | 稳定 (`id`)      | 返回 `u{id}@linux.do` 虚拟地址，无法收信。       | 技术圈/极客 |

### 3.3 C类：完全不返回邮箱（仅凭 `sub` 绑定）

此类平台仅提供身份标识，直接进入/oauth2/account_notlinked.html。

| 平台名称   | 唯一标识 (`sub`) | 接口返回特性                           | 目标群体         |
| :--------- | :--------------- | :------------------------------------- | :--------------- |
| **阿里云** | 稳定 (`aliuid`)  | 官方无 `email` scope，实测不返回邮箱。 | 国内建站开发者   |
| **Reddit** | 稳定             | 官方 API 明确不暴露邮箱。              | 海外普通用户     |
| **PayPal** | 稳定             | 虽有邮箱但官方声明不可信，直接忽略。   | 海外支付场景用户 |

### 3.4 放弃接入的平台（不满足约束条件）

- **Microsoft Azure**：标准账户强制绑定银行卡。
- **Apple**：需 $99/年开发者年费。
- **QQ / 微信 / 支付宝 / 微博**：存在备案、企业资质或手机号等硬性门槛。

## 4. 开发与安全规范

### 4.1 回调路由规范

所有第三方 OAuth 登录的回调地址必须严格遵循统一的路径格式：
**`/api/auth/{provider}/callback`**

- **示例**：`https://online.undz.cn/api/auth/aliyun/callback`、`https://online.undz.cn/api/auth/google/callback`。
- **注意**：配置到各平台后台的回调地址必须与实际路由完全一致，包括大小写及末尾斜杠。`{provider}` 统一使用小写英文（如 `github`, `cloudflare`, `linuxdo`）。

### 4.2 白名单校验规范

- 正则校验必须严格匹配后缀，防止子域名绕过攻击（如防止 `user@gmail.com.evil.com` 绕过 `@gmail.com` 的校验）。
- 校验逻辑建议封装为独立中间件，统一处理所有平台返回的 `email` 字段。

### 4.3 流程降级规范

- 代码在解析 UserInfo 时，必须写判空逻辑。绝不能因为 `email` 字段的缺失导致整个注册/登录事务崩溃。
- 当进入“补填邮箱”流程时，用户的 `(provider, sub)` 关系应已在后台完成静默绑定，仅账号状态为“未激活”。

### 4.4 {provider}的应用ID和密钥

应用ID和密钥统一存入.env 格式是：
{provider}\_CLIENT_ID=
{provider}\_CLIENT_SECRET=
其中{provider}要转全部大写

### 4.5 厂商对接

接入时要翻看具体厂商文档，不同平台不同文档。

## 5. OAUTH 应用信息

应用ID和密钥在env中都配置为三个x，稍后用户手动填写
当前仅新增这里说明了的OAuth应用，没说的不加

api-vue\public\lib\ay-account 也需要修改使其支持新增的应用，只改这一个新的SDK，旧的不管。

同时login.html新增：新开一个page，在点击快捷登录时，如果这个方式不能快捷注册账户，比如接口不返回Email时，通过next动画切入新的页面，
说明这个方式不支持快捷注册账户，要继续吗，点是，back动画登陆页，然后window.open，点否，back动画返回登录页。

前端账户页api-vue\src\account\views\account\LinkAccount.vue也要改一下

SDK内置一个对象，不允许外部更改，被关闭的登录方式不在第三方登录页显示，但只是前端隐藏，后端还是可以用的，用于服务不可用时暂时关闭，如果都为false，隐藏登录页的第三方登录按钮

{
yzhyzxy: true,
github: true,
aliyun: true,
google: true,
cloudflare: true,
jihulab: true,
facebook: false,
discord: false
}

各个第三方登录时对应的svg地址：
yzhyzxy: /lib/ay-account/icon/yzhyzxy.svg
google: /lib/ay-account/icon/google.svg
github: /lib/ay-account/icon/github.svg
aliyun: /lib/ay-account/icon/aliyun.svg
cloudflare: /lib/ay-account/icon/cloudflare.svg
discord: /lib/ay-account/icon/discord.svg
jihulab: /lib/ay-account/icon/gitlab.svg
facebook: /lib/ay-account/icon/facebook.svg

### 5.1 阿里云（国内站）OAuth应用配置

应用名称
ayaccount@app.aeyd.onaliyun.com

显示名称
AyAccount

显示名称为 1～24 个字符。
OAuth 协议版本 2.0

应用类型
Web 应用
指基于浏览器交互的网络应用。应用通过浏览器交互，获得用户授权访问用户的资源。用户资源可以是应用本身管理的用户资源，也可以是其他服务通过 API 暴露的用户资源。

访问令牌有效期
3600秒

刷新令牌有效期
2592000秒

回调地址
https://online.undz.cn/api/auth/aliyun/callback
OAuth 范围
openid默认授权
获取 RAM 用户的 OpenID。（OpenID 是一个可以唯一代表用户的字符串，但并不包含 UID、用户名等信息。）
aliuid
获取阿里云颁发的唯一用户标志符 UID（包括 RAM 用户 UID 和所属主账号 UID）
profile
获取登录用户的 RAM 用户名称（主账号访问获取登录名称，RAM 用户访问获取登录名 UPN 名称和显示名称）。
3个OAuth都为必选，必须显式传入

### 5.2 Google OAuth应用配置

创建 OAuth 客户端 ID
客户端 ID 用于向 Google 的 OAuth 服务器标识单个应用。如果您的应用在多个平台上运行，那么每个平台都需要有自己的客户端 ID。如需了解详情，请参阅设置 OAuth 2.0 。 详细了解 OAuth 客户端类型。

应用类型
Web 应用
名称
AyAccount
OAuth 2.0 客户端的名称。此名称仅用于在控制台中标识客户端，而不会显示给最终用户。
您在下面添加的 URI 的网域将自动添加到 OAuth 权限请求页面作为已获授权的网域 。

已获授权的 JavaScript 来源
适用于来自浏览器的请求
URI 1
https://online.undz.cn
URI 2
https://console.undz.cn
URI 3
https://undz.cn

> 虽然架构是后端处理回调（非纯前端弹窗 SDK 登录），但部分 OAuth 流程或安全校验机制会校验来源。填上主域名是最稳妥的做法。

已获授权的重定向 URI
适用于来自 Web 服务器的请求
URI 1
https://online.undz.cn/api/auth/google/callback

[ ] 将此客户端用于 AI 赋能的智能体

已开启范围
.../auth/userinfo.email 查看您的 Google 账号的主电子邮件地址
.../auth/userinfo.profile 查看您的个人信息，包括您已公开的任何个人信息
openid 将您与您在 Google 上的个人信息关联起来

### 5.3 Cloudflare OAuth应用配置

配置 OAuth 客户端

应用名称
AyAccount
令牌身份验证方法
Client Secret Basic

响应类型：
Code
授权类型：
Authorization Code, Refresh Token
重定向（回调）URL:
https://online.undz.cn/api/auth/cloudflare/callback
客户端 URL：
无

高级选项
应用LOGO：
无
政策URL：
https://go.undz.cn/privacy/zh-cn
服务条款URL：
https://go.undz.cn/terms/zh-cn
登出后重定向 URL：
无
允许的 CORS 来源：
无

OAuth 权限范围：
user-details.read （必须）

### 5.4 GitLab （国内版，极狐GitLab）

应用
管理可以将极狐GitLab用作OAuth提供程序的应用程序，以及您已授权使用您的帐户的应用程序。
新建应用
Name
AyAccount
Redirect URI
https://online.undz.cn/api/auth/gitlab-cn/callback

私密
[x] 请仅对可安全存储客户端 secret 的可信任后端服务器专用的安全应用程序启用。不要为原生移动、单页或其他 JavaScript 应用程序启用，因为它们无法将客户端 secret 保密。

设备授权许可
[] 启用以允许设备授权许可流程。

Scopes
openid
授予使用 OpenID Connect 与 GitLab 进行身份验证的权限。还提供对用户配置文件和组成员关系的只读访问权限。
profile
使用 OpenID Connect 授予对用户配置文件数据的只读访问权。
email
使用 OpenID Connect 授予对用户主电子邮件地址的只读访问权。

注意，国内版域名是https://jihulab.com
授权端点：https://jihulab.com/oauth/authorize
Token 交换端点：https://jihulab.com/oauth/token
获取用户信息：https://jihulab.com/api/v4/user （这个接口返回的 JSON 里包含 id (即你的 sub) 和 email）

### 5.5 Facebook

OAuth 客户端授权设置

[x] OAuth 客户端授权登录
启用标准 OAuth 客户端口令流程。通过以下选项，指定允许的口令跳转 URI，保护应用安全，阻止违规行为。若不需要，则可全面禁用。

[x] OAuth 网页授权登录
启用基于网络的 OAuth 客户端登录。

[x] 强制启用 HTTPS
强烈建议对跳转 URI 和 JavaScript SDK 强制使用 HTTPS。

[] OAuth 网页授权强制再次验证
打开后，用户登录必须输入 Facebook 密码才能登录网站。

[] OAuth 嵌入式浏览器授权登录
启用 OAuth 客户端登录的网页视图跳转 URI。

[x] 对跳转 URI 使用严格模式
仅允许精确匹配有效 OAuth 跳转 URI 的跳转。强烈推荐。

有效 OAuth 跳转 URI
与网页登录功能结合使用、手动指定的 redirect_uri，必须精确匹配此处列出的任一 URI。JavaScript SDK 还会将这个列表用于阻止弹窗的应用内浏览器。
https://online.undz.cn/api/auth/facebook/callback

[] 从设备登录
为智能电视等设备启用 OAuth 客户端登录流程

[] 使用 JavaScript SDK 登录
通过 JavaScript SDK 启用登录和登录后的功能。

JavaScript SDK 允许使用的网域
无

取消授权回调网址
无

跳转 URI 来检查
无

Scopes
email, public_profile

### 5.6 discord

服务条款 URL
您 APP 的服务条款链接
https://go.undz.cn/terms/zh-cn
隐私政策 URL
您 APP 的隐私政策链接
https://go.undz.cn/privacy/zh-cn

OAuth2
将 Discord 作为授权系统，或代表用户调用我们的 API 接口。添加重定向 URI，选择权限范围，祝您好运，开始开发吧！

了解更多有关 OAuth2 的信息

客户端信息
客户端 ID
1566404839884456058

客户端密钥
出于安全原因已隐藏

重定向
https://online.undz.cn/api/auth/discord/callback
范围
identify
email
openid
