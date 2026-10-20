import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
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
  // 코드 색은 새 색을 만들지 않으려고 끈다. 코드 상자는 옅은 면 한 색.
  markdown: { syntaxHighlight: false },
  devToolbar: { enabled: false },
  vite: { define: { __SITE_CONFIG__: JSON.stringify(siteConfig) } },
});
