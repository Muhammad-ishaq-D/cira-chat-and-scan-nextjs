import fs from 'fs';
import path from 'path';

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      if (content.includes('react-router-dom')) {
        content = content.replace(/['"`]react-router-dom['"`]/g, "'@/lib/react-router-compat'");
        changed = true;
      }
      if (fullPath.endsWith('.tsx') && !content.startsWith('"use client"') && !content.startsWith("'use client'")) {
        content = '"use client";\n\n' + content;
        changed = true;
      }
      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDir('./src');
console.log('Migration done.');
