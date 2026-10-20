import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { satteri } from '@astrojs/markdown-satteri';
import { blogParts } from '../src/lib/blogparts.mjs';

// 실제 Astro 마크다운 처리기에 같은 플러그인을 끼워 견본 글을 렌더한다 (시험 글은 _posts 에 두지 않는다).
let html;
before(async () => {
  const p = await satteri({ mdastPlugins: [blogParts] }).createRenderer({ syntaxHighlight: false });
  html = (await p.render(readFileSync(new URL('./fixtures/blog-parts.md', import.meta.url), 'utf8'))).code;
});

test('trial 펜스: 카드 머리 + 줄마다 굵은 이름 (목록 표시·굵은 이름 모두 인식)', () => {
  assert.match(html, /<div class="card trial"><p class="card-head">시행착오<\/p>/);
  for (const n of ['시도', '결과', '왜']) assert.match(html, new RegExp(`<p class="card-row"><strong>${n}</strong> `));
  assert.match(html, /<code>a&lt;b<\/code>/);
});

test('trial·question 카드 안 글은 HTML로 해석되지 않고 이스케이프된다', () => {
  assert.doesNotMatch(html, /<script/);
  assert.doesNotMatch(html, /<b>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /<strong>왜 &lt;b&gt;이렇게&lt;\/b&gt; 될까\?<\/strong>/);
});

test('question 펜스: 첫 줄 굵은 질문 + 답 문단들', () => {
  assert.match(html, /<div class="card question"><p class="card-q"><strong>/);
  assert.match(html, /<p>답 문단 하나 &lt;script&gt;x\(\)&lt;\/script&gt;<\/p><p>답 문단 둘<\/p>/);
});

test('출처 발췌: 인용 마지막 문단이 출처 줄이면 excerpt + source', () => {
  assert.match(html, /<blockquote class="excerpt">[\s\S]*<p class="source">출처: <a href="https:\/\/example.com\/book">어떤 책<\/a><\/p>/);
});

test('==문장== 은 mark 로', () => {
  assert.match(html, /<mark>이 글의 한 줄<\/mark>/);
});

test('그림 + 출처 줄은 figure/figcaption, lazy', () => {
  assert.match(html, /<figure><img src="https:\/\/example.com\/meme.png" alt="밈 대체 글" loading="lazy"><figcaption>출처: <a href="https:\/\/example.com\/origin">원작자<\/a><\/figcaption><\/figure>/);
});

test('그림 바로 다음 줄(빈 줄 없이)의 출처도 figure/figcaption — 맥 점검 규칙(명세 3-1)과 같은 모양', () => {
  assert.match(html, /<figure><img src="https:\/\/example.com\/tight.png" alt="바로 아래 출처" loading="lazy"><figcaption>출처: <a href="https:\/\/example.com\/tight-origin">바로 아래<\/a><\/figcaption><\/figure>/);
});

test('출처 없는 그림은 figure 가 아니라 일반 문단 + lazy', () => {
  assert.match(html, /<p><img src="https:\/\/example.com\/plain.png" alt="출처 없는 그림" loading="lazy"><\/p>/);
  assert.equal(html.match(/<figure>/g).length, 2);
});

test('바깥 링크 ↗ 는 CSS(a[href^=http]::after)로 붙고, 새 색 없이 토큰만 쓴다', () => {
  const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
  assert.match(css, /a\[href\^='http'\]::after/);
  assert.doesNotMatch(css.slice(css.indexOf('블로그 고유 부품')), /#[0-9a-fA-F]{3,6}\b/);
});
