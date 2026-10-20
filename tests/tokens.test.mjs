import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// 대비 계산은 작업실 app/tests/tokens.test.ts 와 같다(WCAG 상대 휘도).
const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const contrast = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const lightBlock = css.match(/^:root\s*\{([^}]*)\}/m)[1];
const darkBlock = css.match(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{([^}]*)\}/)[1];
const parse = (block) => Object.fromEntries([...block.matchAll(/--([a-z]+):\s*(#[0-9a-fA-F]{6});/g)].map((m) => [m[1], m[2].toLowerCase()]));
const light = parse(lightBlock);
const dark = parse(darkBlock);

// 값 원본: 작업실 tokens.css · tokens-dark.css (명세 3절 표)
const LIGHT = { bg: '#f5f4f1', fg: '#181818', muted: '#666666', hairline: '#e5e5e5', fog: '#eeeeee', blue: '#0d6ea5', orange: '#fb631b' };
const DARK = { bg: '#151513', fg: '#efede8', muted: '#a8a6a0', hairline: '#302f2c', fog: '#292826', blue: '#5ab0e6', orange: '#fb631b' };

test('토큰 일곱 색이 명세 표의 값 그대로다 (밝게·어둡게)', () => {
  assert.deepEqual(light, LIGHT);
  assert.deepEqual(dark, DARK);
});

test('토큰 CSS의 색 값은 두 벌 14개뿐이고 다른 CSS에는 hex 색이 없다', () => {
  assert.equal([...css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].length, 14);
  const global = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
  assert.doesNotMatch(global, /#[0-9a-fA-F]{3,8}\b|\brgba?\(|box-shadow|text-shadow|drop-shadow/);
});

// 글자로 놓이는 쌍은 4.5 이상, 선·초점 같은 UI 쌍은 3 이상
const TEXT_PAIRS = [
  ['fg', 'bg'], ['muted', 'bg'], ['fg', 'fog'], ['muted', 'fog'],
  ['bg', 'blue'], // 링크 호버: 파랑 바탕 + 바탕색 글자
];
const UI_PAIRS = [
  ['blue', 'bg'], // 키보드 초점 고리
  ['muted', 'bg'], // 인용 왼쪽 선
  ['fg', 'bg'], // 카드 1px 선
];

// 코드 상자: 강조 줄 면 = color-mix(fg 6%, fog) (sRGB 선형 섞기)
const MIX = 0.03;
const mixHex = (fg, fog) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(fg.slice(i, i + 2), 16) * MIX + parseInt(fog.slice(i, i + 2), 16) * (1 - MIX)).toString(16).padStart(2, '0')).join('');
const cssMix = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8').match(/\.codebox \.ln\.hl\s*\{[^}]*color-mix\(in srgb, var\(--fg\) (\d+)%, var\(--fog\)\)/);
test('강조 줄 면의 섞는 비율이 시험의 계산과 같다', () => assert.equal(cssMix && +cssMix[1], MIX * 100));

for (const [name, palette] of [['밝게', light], ['어둡게', dark]]) {
  for (const [a, b] of TEXT_PAIRS) {
    test(`대비(글자 4.5) ${name}: ${a} on ${b}`, () => {
      const c = contrast(palette[a], palette[b]);
      assert.ok(c >= 4.5, `${a} on ${b} = ${c.toFixed(2)}`);
    });
  }
  const hl = mixHex(palette.fg, palette.fog);
  for (const [a, label] of [['fg', '글자'], ['muted', '줄 번호·주석'], ['blue', '문자열']]) {
    test(`대비(글자 4.5) ${name}: 코드 ${label}(${a}) on 강조 줄 면`, () => {
      const c = contrast(palette[a], hl);
      assert.ok(c >= 4.5, `${a} on ${hl} = ${c.toFixed(2)}`);
    });
  }
  test(`대비(글자 4.5) ${name}: 코드 문자열 blue on fog`, () => {
    assert.ok(contrast(palette.blue, palette.fog) >= 4.5);
  });
  for (const [a, b] of UI_PAIRS) {
    test(`대비(UI 3) ${name}: ${a} on ${b}`, () => {
      const c = contrast(palette[a], palette[b]);
      assert.ok(c >= 3, `${a} on ${b} = ${c.toFixed(2)}`);
    });
  }
}
