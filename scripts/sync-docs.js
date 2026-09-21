import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const docsDir = path.resolve('docs');

try {
  if (fs.existsSync(distDir)) {
    // 1. Ensure docs directory exists
    fs.mkdirSync(docsDir, { recursive: true });

    // 2. Synchronize all files from dist to docs
    fs.cpSync(distDir, docsDir, { recursive: true });

    // 3. Create 404.html from index.html for SPA routing on GitHub Pages
    const distIndex = path.join(distDir, 'index.html');
    if (fs.existsSync(distIndex)) {
      fs.copyFileSync(distIndex, path.join(distDir, '404.html'));
      fs.copyFileSync(distIndex, path.join(docsDir, '404.html'));
    }

    // 4. Create .nojekyll to prevent GitHub Pages from ignoring files starting with _
    fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
    fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');

    console.log('Successfully synced dist to docs with 404.html and .nojekyll for GitHub Pages.');
  } else {
    console.warn('Warning: dist directory does not exist, skipping docs sync.');
  }
} catch (error) {
  console.error('Error syncing docs directory:', error);
  process.exit(1);
}
