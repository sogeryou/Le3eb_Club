# Laeeb v0.1 独立测试站

Railway 项目：Laeeb-v0.1-Staging（staging 环境），独立于正式站和 GitHub 主分支。

- `laeeb-web`：单实例，本次 Railway 自动构建成功（Railpack；另备 `Dockerfile.staging`），健康检查 `/healthz`。
- `Redis`：独立缓存与登录验证码状态；使用 Railway 私网引用 `${{Redis.REDIS_URL}}`。
- `laeeb-test-data`：独立持久数据卷，挂载 `/app/dist-server/backend/data`；头像保存在该测试卷。
- 访问：测试站密码 + 应用自身登录，测试站会话最长 12 小时。仅用于内部验收；不开放正式营业。
- 支付为 sandbox 且生产模式禁止沙盒支付，已关闭自动结算和演示数据导入。不使用真实付款或现有用户资料。
- Railway 获得单独生成的 JWT_SECRET、ADMIN_PASSWORD、STAGING_ACCESS_PASSWORD 后方可启动。凭据不得提交到 GitHub；不在本文记录。
- 真实邮箱需独立设置 RESEND_API_KEY、AUTH_EMAIL_FROM；Google 登录需 GOOGLE_AUTH_CLIENT_ID 和测试站 HTTPS origin。未验证前不能标记功能线上通过。

上线验收：访问受保护、健康检查正常、注册登录、邮箱发送和 Google 登录、18+ 日期、阿语昵称/地区、头像裁切及重启后保留、退出、返回发现页；通过后记录 v0.1 版本锁定。

## 2026-11-26（Asia/Manila）部署记录

- 测试站：https://laeeb-web-staging.up.railway.app/
- 部署：`eef72531-c5d7-4d7d-8d03-0d428ed10990`，成功。
- 线上 HTTPS 检查：健康入口 200、无访问凭据首页 401、有访问凭据首页 200、会话与 Redis 就绪 200、前端资源 200。容器内访问保护启动检查通过。
- 登录与注册的真实邮箱和 Google 配置仍待接入；头像线上上传与保留需注册后验收，不能封版。

- 邮箱服务：2026-11-26 已接入 Resend 测试发件地址并生效，部署 `9fe91315-1ed2-4e8d-8d0a-dc983d10c4f9` 成功。验证码发送请求通过 Resend 官方模拟地址 `delivered@resend.dev` 验证（HTTP 200）；真实个人邮箱的接收、验证及完整注册仍由项目负责人验收。

- Google 登录：2026-11-26 新建独立 Google Cloud 项目 `laeeb-staging`，Web 客户端仅授权测试站 HTTPS origin，外部测试模式且仅项目负责人加入测试用户列表。Railway 已配置 Google Client ID，部署 `a8f23e4d-3e1b-48bb-a27f-cb4023fbd602` 成功，Google 启动接口返回 200 与一次性挑战。真实 Google 授权及同邮箱账号关联仍待用户验收。

- Google 按钮多语言修复：部署 `b0fb02b5-b20a-4dde-a9c8-9942e58c52e4` 成功。Google SDK 与按钮同时指定 Laeeb 页面语言；中文浏览器中，阿语及英语的本地自动测试通过，线上 Google 官方框架标题和语言参数分别为 ar、en。线上隔离浏览器未确认按钮的完整可见渲染，需负责人复验。

- 最终记录（2026-11-26）：项目负责人明确确认 Google 按钮无问题；Railway HTTP 记录存在两次 Google 账号确认成功（200）。登录注册范围完成内部验收并冻结为 v0.1。未单独复现同邮箱关联结果和线上头像重启保留；正式域名、公开 Google 发布与正式头像存储仍属于上线前工作。
