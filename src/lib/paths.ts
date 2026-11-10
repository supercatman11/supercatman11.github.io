/**
 * BASE_PATH(サブパス配信)を考慮した URL を返す。
 *   withBase('/favicon.svg') -> '/favicon.svg'          (base = '/')
 *   withBase('/favicon.svg') -> '/portfolio/favicon.svg' (base = '/portfolio/')
 */
const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

export function withBase(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}` || '/';
}
