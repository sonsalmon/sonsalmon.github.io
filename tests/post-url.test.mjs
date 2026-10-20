import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { computePostUrl, parsePostFilename, readSiteConfig, routeFor } from '../src/lib/posturl.mjs';

// 기대값은 맥 blogrepo.compute_post_url 을 python3 로 실제 호출해 뽑은 것이다(tests/fixtures/post-url-vectors.json).
const vectors = JSON.parse(readFileSync(new URL('./fixtures/post-url-vectors.json', import.meta.url), 'utf8'));

for (const { site, cases } of vectors) {
  for (const c of cases) {
    test(`맥 compute_post_url 과 같은 주소: ${site.permalink} ${c.categories.join('/') || '(분류 없음)'} ${c.slug}`, () => {
      assert.equal(computePostUrl(site, c.date, c.slug, c.categories), c.url);
    });
  }
}

test('분류 없음·하나·여럿·대문자·한글 분류 벡터가 모두 들어 있다', () => {
  const cases = vectors[0].cases;
  const has = (f) => assert.ok(cases.some(f));
  has((c) => c.categories.length === 0);
  has((c) => c.categories.length === 1 && /^[a-z]+$/.test(c.categories[0]));
  has((c) => c.categories.length >= 2);
  has((c) => c.categories.some((x) => /[A-Z]/.test(x)));
  has((c) => c.categories.some((x) => /[가-힣]/.test(x)));
});

test('실제 _config.yml 을 읽으면 벡터의 사이트 설정과 같다 (맥 read_site_config 와 같은 값)', () => {
  const site = readSiteConfig(new URL('../_config.yml', import.meta.url).pathname);
  assert.deepEqual(site, vectors[0].site);
});

test('파일 이름에서 날짜·slug', () => {
  assert.deepEqual(parsePostFilename('2026-10-20-my-post.md'), { date: '2026-10-20', slug: 'my-post' });
  assert.equal(parsePostFilename('no-date.md'), null);
});

test('_posts 의 모든 글이 주소를 만들 수 있고 서로 겹치지 않는다. 옛 4편은 옛 주소 그대로', () => {
  const site = readSiteConfig(new URL('../_config.yml', import.meta.url).pathname);
  const dir = new URL('../_posts/', import.meta.url);
  const seen = new Set();
  const legacy = {};
  for (const f of readdirSync(dir)) {
    const text = readFileSync(new URL(f, dir), 'utf8');
    const lp = text.match(/^legacy_path:\s*(.+)$/m)?.[1].trim();
    const cats = text.match(/^categories:\s*(.+)$/m)?.[1].trim();
    const path = routeFor(site, f, { legacy_path: lp, categories: cats });
    assert.ok(!seen.has(path), `겹침: ${path}`);
    seen.add(path);
    if (lp) legacy[f] = path;
  }
  assert.deepEqual([...seen].filter((p) => !Object.values(legacy).includes(p)), [], '새 글 주소는 아직 없어야 해요(시험 글은 별도)');
  assert.deepEqual(Object.values(legacy).sort(), [
    '/flutter/Flutter-Widget/',
    '/hello_world/',
    '/python/python-super()와-super(className,self)의-차이점/',
    '/spadework/ruby_has_defferent_version_with_rbenv/',
  ]);
});

test('주소를 못 만드는 글은 던진다', () => {
  const site = { url: 'https://x.test', permalink: '/:categories/:title/' };
  assert.throws(() => routeFor(site, 'bad.md', {}));
  assert.throws(() => routeFor(site, '2026-01-01-Bad_Slug.md', {}));
});
