import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  server: {proxy: {'/api/play': 'http://127.0.0.1:8787'}},
  build: { rolldownOptions: { output: { codeSplitting: { groups: [{ name: 'three', test: /node_modules\/three/, maxSize: 300_000 }] } } } },
});
