// 블로그 고유 부품(명세 3절): trial·question 펜스, 출처 발췌, ==강조==, 출처 달린 그림.
// satteri(Astro 기본 마크다운 처리기)의 mdast 플러그인. 카드 안 글은 text 노드로만 만들어 HTML로 해석되지 않는다.

import { createHighlighter } from 'shiki';
import { createCssVariablesTheme } from 'shiki/core';

// 코드 색: 인라인 색 없이 클래스만(kw 굵게·str 파랑·com 보조색 기울임). 색은 CSS가 토큰으로 건다.
const THEME = createCssVariablesTheme({ name: 'css-variables', variablePrefix: '--shiki-', variableDefaults: {} });
const LANGS = ['python', 'ruby', 'dart', 'javascript', 'typescript', 'jsx', 'tsx', 'bash', 'shell', 'json', 'yaml', 'html', 'css', 'sql', 'swift', 'java', 'c', 'cpp', 'markdown', 'toml', 'diff'];
const highlighter = await createHighlighter({ themes: [THEME], langs: LANGS });
const ALIAS = { py: 'python', rb: 'ruby', js: 'javascript', ts: 'typescript', sh: 'bash', zsh: 'bash', yml: 'yaml', md: 'markdown' };

function tokenClass(t) {
  const c = t.color || '';
  if (c.includes('token-comment')) return 'com';
  if (c.includes('token-string')) return 'str';
  if (c.includes('token-keyword') && /^[A-Za-z_]/.test(t.content)) return 'kw';
  return null;
}

// ```python {3,5-6} 의 줄 범위. 잘못된 조각은 무시
function highlightLines(meta, total) {
  const set = new Set();
  const m = (meta || '').match(/\{([^}]*)\}/);
  if (!m) return set;
  for (const part of m[1].split(',')) {
    const r = part.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!r) continue;
    const a = +r[1];
    const b = r[2] ? +r[2] : a;
    if (a < 1 || b < a || b > total) continue;
    for (let i = a; i <= b; i++) set.add(i);
  }
  return set;
}

function codeBox(node) {
  const raw = node.value.replace(/\n$/, '');
  const lang = (node.lang || '').toLowerCase();
  const id = ALIAS[lang] || lang;
  const known = highlighter.getLoadedLanguages().includes(id);
  const lines = known
    ? highlighter.codeToTokens(raw, { lang: id, theme: 'css-variables' }).tokens
    : raw.split('\n').map((content) => [{ content }]);
  const numbered = lines.length >= 5;
  const hl = highlightLines(node.meta, lines.length);
  const rows = lines.map((toks, i) => {
    const cls = ['ln', hl.has(i + 1) ? 'hl' : null].filter(Boolean).join(' ');
    const spans = toks.map((t) => {
      const k = known ? tokenClass(t) : null;
      return k ? el('span', k, [text(t.content)]) : text(t.content);
    });
    return el('span', cls, [
      ...(numbered ? [el('span', 'n', [text(String(i + 1))], { ariaHidden: 'true' })] : []),
      el('span', 't', spans),
    ]);
  });
  const bar = el('div', 'codebar', [
    ...(lang ? [el('span', 'codelang', [text(lang)])] : [el('span', null, [])]),
    el('button', 'codecopy', [text('복사')], { type: 'button', hidden: true }),
  ]);
  return el('div', 'codebox', [bar, el('pre', 'code', [el('code', null, rows)])]);
}

const el = (hName, className, children, extra = {}) => ({
  type: 'blockPart',
  children,
  data: { hName, hProperties: className ? { className: [className], ...extra } : extra },
});
const text = (value) => ({ type: 'text', value });
const strong = (value) => ({ type: 'strong', children: [text(value)] });

// 글자 + `백틱` 인라인 코드만 노드로 바꾼다 (그 밖의 기호는 모두 글자)
function inline(s) {
  return s.split(/(`[^`\n]+`)/).filter(Boolean).map((part) =>
    /^`[^`\n]+`$/.test(part) ? { type: 'inlineCode', value: part.slice(1, -1) } : text(part),
  );
}

const TRIAL_LINE = /^(?:[-*]\s+)?(?:\*\*)?(시도|결과|왜)(?:\*\*)?\s*[:：]\s*(?:\*\*)?\s*(.*)$/;

function trialCard(value) {
  const rows = [];
  for (const raw of value.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(TRIAL_LINE);
    if (m) rows.push(el('p', 'card-row', [strong(m[1]), text(' '), ...inline(m[2].replace(/\*\*$/, ''))]));
    else rows.push(el('p', 'card-row', inline(line)));
  }
  return el('div', 'card trial', [el('p', 'card-head', [text('시행착오')]), ...rows]);
}

function questionCard(value) {
  const [first = '', ...rest] = value.split('\n');
  const answers = rest.join('\n').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return el('div', 'card question', [
    el('p', 'card-q', [{ type: 'strong', children: inline(first.trim()) }]),
    ...answers.map((p) => el('p', null, inline(p.replace(/\s*\n\s*/g, ' ')))),
  ]);
}

// 문단이 `출처: [이름](주소)`로 시작하면 그 링크를 돌려준다
function sourceLink(p) {
  if (!p || p.type !== 'paragraph') return null;
  const [first, second] = p.children;
  if (first?.type === 'text' && /^출처\s*[:：]\s*$/.test(first.value) && second?.type === 'link') return second;
  return null;
}

const isImageOnly = (p) => p.type === 'paragraph' && p.children.length === 1 && p.children[0].type === 'image';

export const blogParts = {
  name: 'blog-parts',

  code(node, ctx) {
    if (node.lang === 'trial') ctx.replaceNode(node, trialCard(node.value));
    else if (node.lang === 'question') ctx.replaceNode(node, questionCard(node.value));
    else ctx.replaceNode(node, codeBox(node));
  },

  // 출처 발췌: 인용 마지막 문단이 출처 줄이면
  blockquote(node, ctx) {
    const last = node.children[node.children.length - 1];
    if (!sourceLink(last)) return;
    ctx.setProperty(node, 'data', { hProperties: { className: ['excerpt'] } });
    ctx.setProperty(last, 'data', { hProperties: { className: ['source'] } });
  },

  // 그림 + 출처 → figure. 출처는 바로 다음 줄(같은 문단, 맥 점검 규칙 모양)이거나 다음 문단
  paragraph(node, ctx) {
    const [pic, gap, link, ...rest] = node.children;
    if (pic?.type === 'image' && gap?.type === 'text' && /^\s*\n\s*출처\s*[:：]\s*$/.test(gap.value) && link?.type === 'link') {
      ctx.replaceNode(node, el('figure', null, [
        { type: 'image', url: pic.url, alt: pic.alt, title: pic.title, data: { hProperties: { loading: 'lazy' } } },
        el('figcaption', null, [text(gap.value.trim() + ' '), link, ...rest]),
      ]));
      return;
    }
    if (!isImageOnly(node)) return;
    const parent = ctx.parent(node);
    const next = parent?.children[ctx.indexOf(node) + 1];
    if (!sourceLink(next)) return;
    const img = node.children[0];
    ctx.removeNode(next);
    ctx.replaceNode(node, el('figure', null, [
      { type: 'image', url: img.url, alt: img.alt, title: img.title, data: { hProperties: { loading: 'lazy' } } },
      el('figcaption', null, next.children),
    ]));
  },

  image(node, ctx) {
    ctx.setProperty(node, 'data', { hProperties: { loading: 'lazy' } });
  },

  // ==문장== → 주황 밑줄 (이 글의 한 줄)
  text(node, ctx) {
    if (!node.value.includes('==')) return;
    const parts = node.value.split(/==([^=\n]+?)==/);
    if (parts.length === 1) return;
    ctx.replaceNode(node, parts.flatMap((s, i) => {
      if (i % 2) return [{ type: 'blockPart', children: [text(s)], data: { hName: 'mark' } }];
      return s ? [text(s)] : [];
    }));
  },
};
