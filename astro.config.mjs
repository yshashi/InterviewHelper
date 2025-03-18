// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import compress from 'astro-compress';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.interviewhelper.in',
  output: 'static',
  prefetch: true,
  adapter: vercel(),
  integrations: [
    mdx(),
    tailwind(),
    react(),
    compress(),
    sitemap()
  ],
  build: {
    format: 'directory'
  },
  vite: {
    build: {
      copyPublicDir: true
    }
  }
});
