import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { satteri } from '@astrojs/markdown-satteri';
import { blogParts } from '../src/lib/blogparts.mjs';

const MD = [
  '```python {2,4-5}', 'import x', 's = "a" # c', 'print(1)', 'x', 'y', '```', '',
  '```js', 'let a = 1', '```', '',
  '```', 'plain <b>x</b>', '```', '',
  '```python {9,x,3-1}', 'a', 'b', '```', '',
  '```trial', '시도: 해봄', '```', '',
  '```question', '왜?', '', '그래서', '```', '',
  '인라인 `코드` 모양',
].join('\n');

let html;
before(async () => {
  const p = await satteri({ mdastPlugins: [blogParts] }).createRenderer({ syntaxHighlight: false });
  html = (await p.render(MD)).code;
});
const box = (i) => html.split('<div class="codebox">')[i].split('</pre></div>')[0];

test('언어 띠 + 복사 단추(자바스크립트가 켜 주기 전엔 hidden)', () => {
  assert.match(box(1), /<span class="codelang">python<\/span><button class="codecopy" type="button" hidden>복사<\/button>/);
});

test('줄 번호는 5줄 이상일 때만', () => {
  assert.equal(box(1).match(/class="n"/g).length, 5);
  assert.doesNotMatch(box(2), /class="n"/);
});

test('줄 범위 {2,4-5} 만 강조, 잘못된 범위는 무시', () => {
  assert.deepEqual([...box(1).matchAll(/<span class="ln( hl)?">/g)].map((m) => !!m[1]), [false, true, false, true, true]);
  assert.doesNotMatch(box(4), /class="ln hl"/);
});

test('언어 표시 없는 펜스는 언어 이름 없이 복사 단추만, 글은 이스케이프', () => {
  assert.match(box(3), /<span><\/span><button class="codecopy"/);
  assert.doesNotMatch(box(3), /codelang/);
  assert.match(box(3), /plain &lt;b&gt;x&lt;\/b&gt;/);
});

test('색은 클래스로만: 인라인 색·hex 가 HTML에 없다', () => {
  assert.doesNotMatch(html, /style=|#[0-9a-fA-F]{3,8}\b|rgb|--shiki/);
  assert.match(box(1), /<span class="kw">import<\/span>/);
  assert.match(box(1), /<span class="str">"a"<\/span>/);
  assert.match(box(1), /<span class="com"># c<\/span>/);
});

test('trial·question 은 그대로 카드, 인라인 코드는 그대로', () => {
  assert.match(html, /<div class="card trial">/);
  assert.match(html, /<div class="card question">/);
  assert.equal(html.match(/<div class="codebox">/g).length, 4);
  assert.match(html, /<code>코드<\/code>/);
});

test('복사 스크립트는 줄 번호를 빼고 .t 만 읽고, 코드 CSS 는 토큰만 쓴다', () => {
  const js = readFileSync(new URL('../src/scripts/copy-code.js', import.meta.url), 'utf8');
  assert.match(js, /querySelectorAll\('\.t'\)/);
  assert.match(js, /복사 못 했어요/);
  const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
  assert.match(css, /\.codebox \.ln \.n[^}]*user-select: none/);
  assert.match(css, /\.codecopy:focus-visible\s*\{\s*outline: 2px solid var\(--blue\);\s*outline-offset: 2px/);
});
