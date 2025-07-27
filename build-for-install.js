const fs = require('fs');
const path = require('path');

// Create dist directory
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Copy all necessary files for n8n
const filesToCopy = [
  { src: 'nodes', dest: 'dist/nodes' },
  { src: 'types', dest: 'dist/types' },
  { src: 'package.json', dest: 'dist/package.json' }
];

function copyRecursive(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(item => {
      copyRecursive(path.join(src, item), path.join(dest, item));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

filesToCopy.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    copyRecursive(src, dest);
  }
});

console.log('✅ Files copied to dist/ directory');
console.log('📦 Ready for installation');