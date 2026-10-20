import { getCollection } from 'astro:content';
import { parsePostFilename, routeFor } from './posturl.mjs';

declare const __SITE_CONFIG__: Record<string, string>;

export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export const withBase = (path: string) => BASE + path;

// 한글 기준 분당 읽는 글자 수. 공백을 뺀 글자 수로 센다.
const CHARS_PER_MINUTE = 500;

export function readingMinutes(body: string): number {
  const text = body.replace(/```[\s\S]*?```/g, '').replace(/\s+/g, '');
  return Math.max(1, Math.ceil(text.length / CHARS_PER_MINUTE));
}

export async function loadPosts() {
  const entries = await getCollection('posts');
  const seen = new Map<string, string>();
  const posts = entries.map((entry) => {
    const path = routeFor(__SITE_CONFIG__, entry.id, entry.data);
    const clash = seen.get(path);
    if (clash) throw new Error(`글 주소가 겹쳐요: ${path} (${clash}, ${entry.id})`);
    seen.set(path, entry.id);
    const date = parsePostFilename(entry.id)?.date;
    if (!date) throw new Error(`글 파일 이름에 날짜가 없어요: ${entry.id}`);
    const [y, m, d] = date.split('-');
    return {
      entry,
      path,
      date,
      ym: `${y.slice(2)}.${m}`,
      ymd: `${y.slice(2)}.${m}.${d}`,
      minutes: readingMinutes(entry.body ?? ''),
    };
  });
  return posts.sort((a, b) => (a.date === b.date ? a.path.localeCompare(b.path) : a.date < b.date ? 1 : -1));
}
