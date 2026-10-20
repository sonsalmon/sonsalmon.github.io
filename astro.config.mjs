import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import { satteri } from '@astrojs/markdown-satteri';
import { blogParts } from './src/lib/blogparts.mjs';
import { readSiteConfig } from './src/lib/posturl.mjs';

// 주소 설정(url·baseurl·permalink)은 _config.yml 한 곳에서만 읽는다. 맥 blogrepo.read_site_config 와 같은 파서.
const siteConfig = readSiteConfig(fileURLToPath(new URL('./_config.yml', import.meta.url)));

export default defineConfig({
  site: siteConfig.url,
  base: siteConfig.baseurl || '/',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // 이미지 서비스를 쓰지 않는다(sharp 불필요).
  image: { service: { entrypoint: 'astro/assets/services/noop' } },
  // 코드 색칠은 Astro 기본(shiki 인라인 색) 대신 blogparts 의 코드 상자가 클래스로 한다(새 색 없음).
  // 블로그 고유 부품(trial·question·출처 발췌·==강조==·출처 달린 그림)은 직접 짠 mdast 플러그인
  markdown: { syntaxHighlight: false, processor: satteri({ mdastPlugins: [blogParts] }) },
  devToolbar: { enabled: false },
  vite: { define: { __SITE_CONFIG__: JSON.stringify(siteConfig) } },
});
