// 글 주소 계약. 맥 workroom_cli/blogrepo.py 의 read_site_config / compute_post_url 과 같은 알고리즘이다.
// 바꾸면 tests/fixtures/post-url-vectors.json 시험이 어긋나는지 먼저 본다.
import { readFileSync } from 'node:fs';

const SLUG_RE = /^[a-z0-9-]{1,60}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const NAMED = {
  pretty: '/:categories/:year/:month/:day/:title/',
  date: '/:categories/:year/:month/:day/:title.html',
  none: '/:categories/:title.html',
};
const ALLOWED = new Set([':categories', ':title', ':slug', ':year', ':month', ':day', ':i_month', ':i_day']);

export function parseSiteConfig(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    if (/^[ \t]/.test(line)) continue;
    const m = line.match(/^([a-zA-Z_0-9]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const [, key, rawVal0] = m;
    if (!['url', 'baseurl', 'permalink'].includes(key)) continue;
    const rawVal = rawVal0.trim();
    const q = rawVal.match(/^(['"])(.*?)\1(?:\s*#.*)?$/);
    out[key] = q ? q[2].trim() : rawVal.split('#')[0].trim().replace(/^['"]+|['"]+$/g, '');
  }
  return out;
}

export function readSiteConfig(file) {
  try {
    return parseSiteConfig(readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

// 사이트 안 경로(`/python/slug/`)만 낸다. null 이면 맥 compute_post_url 도 None 이다.
export function computePostPath(site, dateIso, slug, categories) {
  if (!site.url || !site.permalink) return null;
  const permalink = NAMED[site.permalink] ?? site.permalink;
  if (!permalink.startsWith('/')) return null;
  if (!DATE_RE.test(dateIso) || !SLUG_RE.test(slug)) return null;
  if (categories.some((c) => /\s/.test(c))) return null;
  const tokens = permalink.match(/:[a-zA-Z_0-9]+/g) ?? [];
  if (tokens.some((t) => !ALLOWED.has(t))) return null;
  const [year, month, day] = dateIso.split('-');
  const cat = categories.filter(Boolean).join('/');
  const path = permalink
    .replaceAll(':categories', cat)
    .replaceAll(':title', slug)
    .replaceAll(':slug', slug)
    .replaceAll(':year', year)
    .replaceAll(':month', month)
    .replaceAll(':day', day)
    .replaceAll(':i_month', String(parseInt(month, 10)))
    .replaceAll(':i_day', String(parseInt(day, 10)))
    .replace(/\/+/g, '/');
  return path.startsWith('/') ? path : '/' + path;
}

export function computePostUrl(site, dateIso, slug, categories) {
  const path = computePostPath(site, dateIso, slug, categories);
  if (path === null) return null;
  return site.url.replace(/\/+$/, '') + (site.baseurl ?? '').replace(/\/+$/, '') + path;
}

// `YYYY-MM-DD-slug.md` → { date, slug }. 모양이 다르면 null (옛 글은 legacy_path 로 주소를 낸다).
export function parsePostFilename(name) {
  const m = name.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  return m ? { date: m[1], slug: m[2] } : null;
}

export function normalizeCategories(c) {
  if (!c) return [];
  return (Array.isArray(c) ? c : String(c).split(/\s+/)).filter(Boolean);
}

// 글 한 편의 사이트 안 주소. 옛 글은 legacy_path 가 먼저, 새 글은 파일 이름 + permalink 규칙.
// 어느 쪽도 안 되면 던진다(빌드가 멈춘다. 틀린 주소로 조용히 내는 것보다 낫다).
export function routeFor(site, filename, data) {
  if (data.legacy_path) return data.legacy_path;
  const parsed = parsePostFilename(filename);
  if (!parsed) throw new Error(`글 파일 이름이 YYYY-MM-DD-slug.md 모양이 아니에요: ${filename}`);
  const path = computePostPath(site, parsed.date, parsed.slug, normalizeCategories(data.categories));
  if (path === null) throw new Error(`글 주소를 만들 수 없어요(slug·분류·permalink 확인): ${filename}`);
  return path;
}
