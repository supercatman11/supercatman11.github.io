import type { APIRoute } from 'astro';

// robots.txt は SITE_URL / BASE_PATH に応じてビルド時に生成する(sitemap の URL を正しく保つため)。
// テスト環境では nginx 側(docker/nginx/test.conf)が全拒否の内容で上書きする。
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(`${import.meta.env.BASE_URL.replace(/\/+$/, '')}/sitemap-index.xml`, site);
  const body = ['User-agent: *', 'Allow: /', '', `Sitemap: ${sitemap.href}`, ''].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
