# le3eb_club

## 愿景与定位

le3eb_club 致力于打造一个稳定、健康、可持续的游戏陪伴社区，围绕玩家真实的社交与组队需求，提供可信赖的匹配、履约与治理体验。

项目采用**同仓一体化交付**：用户 H5、运营后台与 API 服务放在同一仓库，由单一 Node 进程在开发/生产环境统一托管页面与接口，保证产品能力与系统实现持续对齐。

---

## 产品形态

| 形态 | 说明 | 现状 |
|------|------|------|
| **用户端 H5** | 移动优先的 React 单页应用（SPA），浏览器访问 | **已实现** — `http://localhost:3000/` |
| **运营后台 Web** | 与用户端同技术栈的管理控制台 | **已实现** — `http://localhost:3000/admin` |
| **Native App** | iOS / Android 原生或壳应用 | **未启动**（规划为 H5 稳定后再套壳） |

当前**不是**独立原生 App。用户通过手机/桌面浏览器打开 H5，UI 采用 App 式交互（底部 Tab、全屏布局），底层仍是 Web（HTML + React + Vite）。

路由入口：`client/app/AppRoot.tsx` 按路径切换用户端（`AppShell`）与后台（`AdminRoute` → `admin/AdminWorkbench.tsx`）。

---

## 同仓架构与 Express 4

### 三端 + 共享层

本仓库包含四个逻辑层，而非三个独立部署单元：

| 目录 | 角色 | 说明 |
|------|------|------|
| `client/` | 用户 H5 前端 | React 19 + Vite 6 + Tailwind 4 |
| `admin/` | 运营后台前端 | 与用户端共用构建与登录体系 |
| `backend/` | API 与业务逻辑 | Express 4 单进程服务 |
| `shared/` | 跨端契约 | TypeScript 类型、Zod schema、`apiClient` |

**运行模型**：`pnpm dev` 启动 `backend/server.ts` 一个进程，同时：

1. 暴露 REST API（约 67 个 `/api/*` 路由）
2. 开发模式下挂载 Vite 中间件（热更新）
3. 生产模式下托管 `dist/` 静态资源

### Express 4 是什么？

[Express](https://expressjs.com/) 是 **Node.js 上最常用的 HTTP Web 框架**，「4」指主版本号（Express 4.x）。

在本项目中 Express 负责：

- 监听端口（默认 `3000`）
- 注册路由与中间件（JSON 解析、CORS、限流、Helmet、JWT 鉴权）
- 返回 JSON 响应或静态前端资源

可类比关系：**Node.js** 是运行时 → **Express** 是在其上搭建 HTTP 服务的轻量框架。

---

## 技术栈

| Layer | Tech |
|-------|------|
| Runtime | Node.js 22+ |
| Frontend | React 19 + TypeScript 5.8 |
| Build | Vite 6 |
| Styling | Tailwind CSS 4 |
| Animation | Motion |
| Icons | Lucide React |
| Backend | Express 4 |
| 校验 | Zod（`shared/schemas.ts`） |
| ORM（预留） | Prisma + PostgreSQL |
| 缓存（可选） | Redis / 开发环境内存降级 |
| 对象存储（可选） | S3 兼容（MinIO / AWS） |
| 测试 | Vitest、Playwright、Supertest |

---

## 目录结构

```text
le3eb_club/
├── client/                    # 用户 H5 前端
│   ├── App.tsx                # 应用壳（< 20 行）
│   ├── app/                   # AppRoot、AppShell、useAppState、AdminRoute
│   ├── views/                 # 按页面拆分的 View 组件（30+）
│   ├── components/            # 可复用 UI 与卡片
│   ├── stores/                # Zustand 状态（逐步接入）
│   ├── router/                # 路由常量与鉴权守卫
│   ├── services/              # businessApi — 用户端 API 封装
│   ├── hooks/                 # useDeviceId、useExposure 等
│   ├── i18n/                  # 多语言（en/ar/zh-CN/fr/ru/tr）
│   └── constants.ts           # 共享真实游戏目录；演示陪玩/动态数组为空
├── admin/                     # 运营后台前端
│   ├── AdminWorkbench.tsx     # 后台主界面
│   └── services/adminApi.ts   # 管理端 API 封装
├── backend/                   # 服务端
│   ├── server.ts              # Express 入口与路由（主持久化读写）
│   ├── data/storage.json      # 当前运行时主存储（schema v11）
│   ├── auth/                  # argon2 密码、JWT / Refresh Token
│   ├── policy/                # 货币、等级定价、结算策略
│   ├── algo/                  # M5 等级引擎、M6 曝光池算法
│   ├── payments/              # 支付验单抽象、提现对账
│   ├── routes/ops.ts          # 代金券、设备封禁、工单等运营路由
│   ├── jobs/settlementCron.ts # 周结算定时任务
│   ├── cache/redis.ts         # Redis / 内存缓存抽象
│   ├── storage/objectStore.ts # S3 预签名上传
│   ├── observability/         # Prometheus metrics、Sentry
│   ├── middleware/            # Zod 校验中间件
│   ├── config/env.ts          # 环境变量
│   └── repos/                 # Repository 层（预留，待接 Postgres）
├── shared/                    # 前后端共享
│   ├── types.ts
│   ├── schemas.ts
│   └── apiClient.ts
├── prisma/
│   └── schema.prisma          # Postgres 表结构初稿（7 模型，未切主）
├── tests/                     # unit / regression / golden / integration / e2e
├── scripts/                   # validate、release、migrate-json-to-pg 等
├── .github/workflows/ci.yml
├── docker-compose.dev.yml     # Postgres + Redis + MinIO 本地栈
├── Dockerfile
├── vite.config.ts
└── package.json
```

---

## 架构示意

```text
                    ┌─────────────────────────────────────┐
                    │     backend/server.ts (Express 4)    │
                    │  API /api/*  ·  静态资源  ·  Vite(dev) │
                    └──────────────┬──────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
   ┌──────▼──────┐         ┌───────▼───────┐       ┌───────▼───────┐
   │ client/ H5  │         │  admin/ 后台   │       │   shared/     │
   │  AppShell   │         │ AdminWorkbench │       │ types/schemas │
   └─────────────┘         └───────────────┘       └───────────────┘
          │                        │
          └────────────┬───────────┘
                       │ fetch /api/*
                       ▼
              ┌────────────────┐
              │  storage.json   │  ← 当前主持久化（单机）
              │  Redis (缓存)   │  ← Token / 锁 / 撤销
              │  Postgres (预留)│  ← Prisma schema 已起草
              │  S3 (预留)      │  ← 媒体文件
              └────────────────┘
```

---

## 数据与存储

### 当前运行时：本地 JSON

**默认且唯一在用的业务数据库**是 `backend/data/storage.json`。

机制：

1. 启动时 `loadState()` 将整个 JSON 读入内存
2. 业务变更（注册、下单、改钱包等）更新内存对象
3. `persistState()` 同步写回文件（全量快照，schema v11，含版本迁移逻辑）

适用：本地开发、Demo、单机验收。  
局限：不支持多实例、无行级事务、高并发下全量写入有瓶颈。

README 与代码均明确：**正式多实例生产应迁移至 Postgres**。

### 目标库表：Prisma + PostgreSQL

`prisma/schema.prisma` 已定义 7 个模型的初稿：

`User`、`Wallet`、`Companion`、`Order`、`PaymentIdempotency`、`CompanionExposureLog`、`SettlementJob`

状态：

- 尚无 `prisma/migrations/`（未真正建库）
- `scripts/migrate-json-to-pg.ts` 为占位脚本
- 配置 `DATABASE_URL` 后 `/ready` 会报告 `pg: true`，但**业务读写仍走 JSON**

相对 JSON 内的完整实体集，Prisma schema **尚不完整**（缺 reviews、withdrawals、coupons、tickets、audit 等表的正式建模）。

### 三层数据来源

| 层级 | 位置 | 是否持久化 | 说明 |
|------|------|------------|------|
| 前端 Mock | `client/constants.ts` | 否 | 游戏列表、陪玩卡片、社区帖子；IM 部分逻辑在客户端 mock |
| 运行时主库 | `backend/data/storage.json` | 是 | 用户、订单、钱包、陪玩、运营、审计等 |
| 目标关系库 | PostgreSQL（Prisma） | 预留 | 工业级持久化目标，未启用 |

### 持久化数据（重启后须保留）

存于 `storage.json`（未来对应 Postgres 表）：

| 类别 | JSON 字段 / 概念 |
|------|------------------|
| 用户与权限 | `users`（含 `banModules` 七维封禁、`accountStatus`） |
| 陪玩 | `companions` |
| 交易 | `orders`、`reviews` |
| 钱包 | `wallets`、`diamondWallets`、`walletTransactions`、`rechargeOrders`、`dailyRechargeLimits` |
| 提现 | `withdrawalRequests` |
| 运营 | `couponTemplates`、`couponGrants`、`deviceBans`、`tickets` |
| 算法 | `exposureLogs`（M6 曝光埋点） |
| 治理 | `riskEvents`、`moderationReports`、`auditLogs`（哈希链） |
| 会话（遗留） | `sessions`（JWT 为主，逐步废弃） |

其他持久化相关：

- **浏览器 `localStorage`**：用户登录 token（`business_workbench_token`）
- **S3 / MinIO**（可选）：图片/视频文件本体；元数据仍在 JSON

### 缓存与临时数据（可过期、可重建）

| 存储 | 配置 | 典型用途 |
|------|------|----------|
| **Redis** | `REDIS_URL` | Refresh Token（`rt:*`）、JWT 撤销（`revoked:*`）、周结算分布式锁 |
| **内存 Map** | 开发无 Redis 时自动降级 | 同上 key 的进程内替代 |
| **进程内存** | 始终 | 从 JSON 加载的全量业务 state |
| **限流计数** | express-rate-limit | 默认进程内存；多实例需 Redis store |
| **JWT Access Token** | 无状态 | 短期有效，仅验签 + 查撤销列表 |

生产环境：`REDIS_URL` 未配置时服务会 fail-fast（见 `backend/cache/redis.ts`）。

---

## 核心功能

- **玩家侧**：注册登录、陪玩申请、订单流转、评价、钱包充值/提现、多语言（6 语 + RTL）。
- **交易与钱包**：订单创建、代金券抵扣、sandbox 支付验单、提现审核、拒付风控钩子。
- **管理后台**：陪玩/订单/评价/风控审核、用户运营、提现与举报、财务对账、审计导出、多维报表。
- **核心算法**：M5 陪玩等级结算引擎、M6 曝光池排序（`rankCompanions` + golden 测试）。
- **安全基线**：argon2 密码、JWT + Refresh Token、Helmet、CORS 白名单、按路由限流、Zod 入参校验。
- **可观测**：`/healthz`、`/ready`、`/metrics`（Prometheus）、Sentry（Node）。

---

## 项目完整度评估

评估基准：可演示原型、运营需求对齐、工业级 H5 上线能力（不含 Native App 与排期建议）。

### 总览

| 维度 | 完成度 | 说明 |
|------|--------|------|
| 可演示原型 | **~78%** | 本地可跑通注册 → 下单 → 钱包 → 后台审核 |
| 运营文档对齐 | **~58%** | 交易/后台 API 较完整；社区 mock、周结算未运营化 |
| 工业级 H5 上线 | **~48%** | JSON 主存储、Prisma 未切主、测试与 prod 栈未闭环 |
| 含 Native App 的完整产品 | **~34%** | App 未立项 |

### 业务域

| 业务域 | 完成度 | 已实现 | 主要缺口 |
|--------|--------|--------|----------|
| 认证与账号 | ~80% | JWT、argon2、角色模板、七维封禁、设备封禁 API | Refresh 未完全依赖 Redis 集群场景验证 |
| 陪玩与等级 M5 | ~70% | 纯函数引擎、golden 测试、定价强校 | 周结算 Cron 仅日志，未写库 |
| 曝光池 M6 | ~75% | 四池算法、排行 API、曝光 batch | 真实埋点灌数不足 |
| 订单与评价 | ~85% | 状态机、争议、后台审核 | — |
| 钱包/支付/提现 | ~75% | 提现公式、sandbox 验单、幂等结构 | 真 IAP、S3 上传 UI 未接 |
| 运营后台 | ~65% | AdminWorkbench、用户/提现/报表 | 代金券/设备封禁/工单有 API 无完整 UI |
| 社区/IM/动态 | ~35% | UI 完整 | 数据为 `constants.ts` mock |
| 多语言 | ~85% | 6 语 + RTL | Admin 端未本地化 |
| Native App | 0% | — | 未引入 Capacitor / RN |

### 工程层

| 模块 | 完成度 | 说明 |
|------|--------|------|
| 前端架构 | ~60% | `App.tsx` 已瘦身；`useAppState` / `AppShell` 仍偏大；Zustand 待接入 |
| 后端模块化 | ~55% | policy/algo/auth/payments 已抽离；`server.ts` 仍 ~2200 行 |
| 数据层 | ~40% | JSON 在用；Postgres schema 初稿；无 migrations |
| 测试与 CI | ~35% | 16 个自动化测试通过；集成场景少；E2E 未进 CI |
| 部署与观测 | ~55% | Dockerfile、dev compose、health/metrics 有；无 prod compose |

### 质量门禁（实测）

以下命令当前可通过：

```bash
pnpm run test:unit        # 15 tests — unit / regression / golden
pnpm run test:integration # 1 test — payment sandbox
pnpm run validate         # 政策 + M5/M6 golden
pnpm run lint             # tsc --noEmit
pnpm run build
```

---

## 快速开始

### 依赖

- Node.js 22+（推荐）
- pnpm 9.15.0（与仓库 `packageManager` 和 CI 一致）

### 从新目录安装与启动（本地 JSON／沙盒，不连接真实资金）

请使用新的本地目录，不要对已有资金记录所在目录执行种子命令。不要把本地数据文件或以下账号部署到生产环境。

```bash
git clone https://github.com/sogeryou/Le3eb_Club.git le3eb-local
cd le3eb-local
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm install --frozen-lockfile

export NODE_ENV=development
export STORAGE_BACKEND=json
export PAYMENT_PROVIDER=sandbox
export ALLOW_DEMO_SEED=false
export SETTLEMENT_CRON_DISABLED=true
unset DATABASE_URL REDIS_URL S3_BUCKET S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY
unset ADMIN_EMAIL ADMIN_PASSWORD

# 可选：仅在全新目录、尚未启动服务时执行。省略这一行即不创建本地种子账号。
LE3EB_LOCAL_SEED=1 pnpm exec tsx scripts/seed-local.ts --confirm-local
pnpm dev
```

浏览器打开下方地址。保持终端运行；停止服务按 Ctrl+C。后端直接读取当前终端环境变量，不会自动加载 `.env.example`。

种子命令只允许明确的 development/test 环境，拒绝生产或连接外部数据服务的环境；以独占创建方式写入文件，**已有任何 `backend/data/storage.json` 都会拒绝覆盖**。如果已经启动过服务，请使用另一个全新本地 clone，不要为了运行种子而删除原文件。所有种子余额为 0。

**已知历史问题：**当前启动代码在未显式设置 `ALLOW_DEMO_SEED=false` 时仍可能自动创建 `demo_user` 买家；设置管理员环境变量也会触发旧管理员引导。卡 7 未改业务代码，以上命令显式关闭这两条路径。该问题已由独立回归测试记录，不能视为已修复。

### 仅限本地的种子账号

以下六个账号共用密码 `Local-Only-Le3eb-2026!`，仅用于本机开发：

| 用途 | 邮箱 | 游戏 |
| --- | --- | --- |
| 管理员 | admin@local.le3eb.invalid | 后台审核 |
| 买家 1 | buyer1@local.le3eb.invalid | — |
| 买家 2 | buyer2@local.le3eb.invalid | — |
| 已审核陪玩 | pubg@local.le3eb.invalid | PUBG Mobile |
| 已审核陪玩 | fc@local.le3eb.invalid | EA Sports FC / FC Mobile |
| 已审核陪玩 | freefire@local.le3eb.invalid | Free Fire |

显示名和简介均标有 LOCAL，本地状态文件也有 `localSeedOnly` 标记。不要拷贝该文件到服务器。种子不会由 `pnpm dev`、构建或 CI 自动执行。

### 沙盒充值与回归检查

用户登录买家账号后，打开「Me → Wallet」，会看到明确的 Local sandbox 提示。点击 $1 档，在默认配置下只模拟到账 100 金币，不会发生真实 Apple/Google 扣款。

接口验证方式：先读取 `GET /api/recharge/packages` 中的 `id` 和 `moneyPolicy.policyId`；用登录 token 调用 `POST /api/recharge/create`，传 `packageId`、`paymentMethod` 和 `policyId`；再调用 `POST /api/recharge/verify`，传 `orderId: <create 响应中的 id>`、唯一的 `transactionId`、`status: "SUCCESS"` 和 `receipt: "sandbox-ok"`。真实充值和新提现仍未开放。

```bash
pnpm lint
pnpm test
pnpm build
pnpm validate

# 只在临时副本中把扣币多改 1 金币，证明回归断言会报红；原业务源码不变。
pnpm exec tsx scripts/prove-regression-guard.ts

# 显示上述自动 demo 买家问题的原始失败（预期命令返回非零）。
CARD7_SHOW_KNOWN_FAILURE=1 pnpm exec vitest run tests/integration/startup-seed-isolation.spec.ts
```

核心集成测试使用独立临时目录和独立端口，不连接本地服务，不读写现有业务数据。默认测试报告中的 KNOWN DEFECT 用例是明确标注的预期失败，不代表自动种子问题已通过验收。

卡 7 的逐项验收、历史缺陷复现及实际命令日志见 [验证记录](tests/evidence/card7-verification.md)。

### 默认访问地址

- 用户 H5：`http://localhost:3000/`
- 运营后台：`http://localhost:3000/admin`（与用户端共用登录体系，需管理员账号）

### 可选：本地 Postgres + Redis + MinIO

```bash
docker compose -f docker-compose.dev.yml up -d
```

需配置对应环境变量后，Redis 与 S3 能力才会启用；业务主存储仍默认为 JSON，直至 Postgres 迁移完成。

---

## 生产准备说明

- 生产启动前执行 `pnpm run build`，再以 `NODE_ENV=production` 运行 `pnpm start`（或 `node dist-server/backend/server.js`）。
- 服务端读取 `PORT` 环境变量；未设置时默认 `3000`。
- 首次生产启动若无管理员，需设置 `ADMIN_EMAIL` 与 `ADMIN_PASSWORD` 进行一次性引导。
- 生产环境不要启用 `ALLOW_DEMO_SEED`。
- `backend/data/storage.json` 适合单机预备上线和验收；**多实例生产须迁移 Postgres 并配置 Redis、备份与对象存储**。
- 生产环境必须配置 `REDIS_URL`、`JWT_SECRET`（≥ 64 字符）等（见 `backend/config/env.ts`）。

### 上线前检查

```bash
pnpm run lint
pnpm run test:unit
pnpm run validate
pnpm run build
```

可选：`pnpm run test:integration`、`pnpm run test:e2e`、`pnpm run test:smoke`
