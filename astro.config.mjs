// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 本番 / テストで異なる値は環境変数(ビルド引数)で切り替える。
//   SITE_URL  : 公開 URL(canonical / sitemap / OG に使用)
//   BASE_PATH : サブパス配信時のベース(GitHub Pages のプロジェクトサイトなら "/<repo>/")
const site = process.env.SITE_URL ?? 'https://supercatman11.github.io';
const base = process.env.BASE_PATH ?? '/';
const usePolling = process.env.WATCH_POLLING === 'true';

export default defineConfig({
  site,
  base,
  // 完全静的サイト。サーバーサイドコードを持たないことで攻撃面を最小化する。
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  build: {
    // CSS を <style> にインライン化しない。
    // すべて外部ファイルにすることで CSP を style-src 'self' の厳格設定にできる。
    inlineStylesheets: 'never',
  },
  vite: {
    server: {
      // Docker Desktop(Windows)のバインドマウントでファイル変更を検知するためのポーリング
      watch: usePolling ? { usePolling: true, interval: 500 } : undefined,
    },
  },
});
