const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // The regex finds aria-label="Botão" title="Botão" 
  // Let's just remove title="Botão" or title="Ação" etc that we injected
  // But wait, the script injected: aria-label="Label" title="Label"
  // So we can remove the `title="Label"` part we injected.
  content = content.replace(/aria-label="([^"]+)" title="\1"/g, 'aria-label="$1"');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed duplicates in: ${path.basename(filePath)}`);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

walk(srcDir);
console.log('Fix complete.');
