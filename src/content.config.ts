import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// 글은 _posts/YYYY-MM-DD-slug.md. id 는 파일 이름 그대로(날짜·slug 는 lib/posts.ts 가 이름에서 읽는다).
const posts = defineCollection({
  loader: glob({ pattern: '*.md', base: './_posts', generateId: ({ entry }) => entry }),
  schema: z.object({
    title: z.string(),
    categories: z.union([z.string(), z.array(z.string())]).optional(),
    tags: z.array(z.string()).optional(),
    legacy_path: z.string().regex(/^\/.*\/$/).optional(),
  }),
});

export const collections = { posts };
