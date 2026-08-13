# AI Image Style Transfer Studio — 前端（Frontend）

AI 图片风格迁移工作台的前端应用，使用 Next.js 官方脚手架初始化。

## 技术栈（由 create-next-app 生成）

| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | 16.3.0 | App Router |
| React | 19.2.8 | UI 渲染 |
| React DOM | 19.2.8 | 与 React 同版本 |
| TypeScript | 7.0.2 | 类型安全（由 5.0.2 升级，Next 16 要求 ≥ 5.1） |
| Tailwind CSS | 4.x | 原子化 CSS（PostCSS 插件模式） |
| ESLint | 9.x | 代码检查（eslint-config-next） |
| Node.js | ≥ 24.0.0 | 运行时 |
| pnpm | 11.15.1 | 包管理器（通过 `packageManager` 字段锁定） |

## 前置条件

- **Node.js** ≥ 24.0.0
- **pnpm** ≥ 11（项目已锁定 `packageManager: pnpm@11.15.1`，corepack 会自动激活）

## 快速开始

```bash
# 1. 进入项目目录
cd ai-image-studio-frontend

# 2. 安装依赖（首次或拉取后）
pnpm install

# 3. 启动开发服务器
pnpm dev
# → http://localhost:3000
```

## 常用命令

```bash
# 开发模式（默认 3000 端口，支持热更新）
pnpm dev

# 生产构建（产出 .next/ 和 standalone 产物）
pnpm build

# 以生产模式运行（需先 build）
pnpm start

# ESLint 检查
pnpm lint
```

## 目录结构

```
ai-image-studio-frontend/
├── public/                       # 静态资源（favicon、图标等）
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   └── app/                      # Next.js App Router 路由
│       ├── favicon.ico
│       ├── globals.css           # 全局样式（Tailwind 入口）
│       ├── layout.tsx            # 根布局
│       └── page.tsx              # 首页（默认欢迎页）
├── .gitignore
├── eslint.config.mjs             # ESLint 配置
├── next.config.ts                # Next.js 配置
├── package.json                  # 依赖与脚本
├── pnpm-lock.yaml                # 锁定依赖版本
├── postcss.config.mjs            # PostCSS（Tailwind）配置
├── tsconfig.json                 # TypeScript 配置
└── LICENSE
```

## 配置说明

### Next.js 配置（next.config.ts）

当前为默认脚手架配置，生产部署时可按需添加：

```typescript
const nextConfig = {
  // output: "standalone",          // Docker 多阶段构建精简镜像
  // reactStrictMode: true,          // 严格模式（默认开启）
  // images: {                        // 远程图片白名单
  //   remotePatterns: [
  //     { protocol: "http", hostname: "localhost" },
  //     { protocol: "https", hostname: "**" },
  //   ],
  // },
  // env: {                           // 注入前端可见变量
  //   NEXT_PUBLIC_API_BASE:
  //     process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080/api/v1",
  // },
};
```

### Tailwind CSS 4.x

Next.js 16 使用 Tailwind 4 的 PostCSS 插件模式（`@tailwindcss/postcss`），不再需要 `tailwind.config.ts`。样式入口在 `src/app/globals.css`：

```css
@import "tailwindcss";
```

## 验证项目

```bash
# 1. 构建验证（TypeScript + 产物生成）
pnpm build
# 成功输出：✓ Compiled successfully / ✓ Generating static pages (4/4)

# 2. 启动验证
pnpm dev
# 另开终端：
curl -I http://localhost:3000
# → HTTP/1.1 200 OK
```

## 故障排查

| 问题 | 解决方案 |
|------|----------|
| `next: command not found` | 先执行 `pnpm install` 安装依赖；若仍不行，执行 `corepack enable && corepack prepare pnpm@11.15.1 --activate` |
| TypeScript `<5.1` 警告 | 已在本项目中升级至 `^7`，可执行 `pnpm add -D typescript@latest` |
| 端口 3000 被占用 | `lsof -ti:3000 \| xargs kill -9`，或指定端口：`pnpm dev -p 3001` |
| `pnpm build` 静态生成失败 | 检查 `src/app/` 下的页面是否引用了不存在的文件或环境变量 |
| Tailwind 样式不生效 | 确认 `src/app/globals.css` 首行有 `@import "tailwindcss";` 且 `postcss.config.mjs` 存在 |

## 全项目启动顺序

```bash
# 1. 基础设施（MySQL / Redis / RabbitMQ / MinIO）
cd ../ai-image-studio-infra && ./scripts/start-dev.sh

# 2. 后端（需 Java 25 + Maven）
cd ../ai-image-studio-backend && ./scripts/start-dev.sh
# → http://localhost:8080/swagger-ui.html

# 3. 前端
cd ../ai-image-studio-frontend && pnpm install && pnpm dev
# → http://localhost:3000
```

## License

MIT