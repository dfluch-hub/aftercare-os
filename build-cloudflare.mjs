import { mkdir, rm, copyFile } from 'node:fs/promises';

const files = [
  'index.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon.svg',
  'splash.svg',
  'sw.js'
];

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of files) {
  await copyFile(file, `dist/${file}`);
}
console.log(`Prepared ${files.length} MEND production assets in dist/`);
