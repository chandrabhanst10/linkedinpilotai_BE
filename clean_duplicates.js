import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

const cleanDuplicates = (dir) => {
  if (!fs.existsSync(dir)) return;
  
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        cleanDuplicates(fullPath);
      }
    } else if (file.endsWith('.js')) {
      const tsPath = fullPath.replace(/\.js$/, '.ts');
      if (fs.existsSync(tsPath)) {
        try {
          fs.unlinkSync(fullPath);
          console.log(`Deleted duplicate: ${fullPath}`);
        } catch (err) {
          console.error(`Error deleting ${fullPath}:`, err.message);
        }
      }
    }
  });
};

console.log('Starting duplicate JS files cleanup under backend/src...');
cleanDuplicates(srcDir);
console.log('Cleanup completed successfully.');
