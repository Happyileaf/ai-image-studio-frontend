// Tailwind v4 官方推荐插件方式
// 注意：Next.js 16 Turbopack 优先识别 .js 后缀（CJS 格式），避免 .mjs 导致的读取失败
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
