const fs = require('fs');
const path = require('path');

const SEARCH_DIR = 'c:/Users/COMPUTER 26/E-Commerce/Lumora';
const KEYWORDS = ['password', 'service_role', 'postgres', 'db.'];

function searchFile(filePath) {
  try {
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      if (filePath.includes('node_modules') || filePath.includes('.git') || filePath.includes('.expo') || filePath.includes('dist')) {
        return;
      }
      const files = fs.readdirSync(filePath);
      for (const file of files) {
        searchFile(path.join(filePath, file));
      }
    } else if (stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      if (['.ts', '.tsx', '.json', '.js', '.md', '.sql', '.txt', '.toml'].includes(ext)) {
        const content = fs.readFileSync(filePath, 'utf8');
        for (const word of KEYWORDS) {
          if (content.toLowerCase().includes(word.toLowerCase())) {
            console.log(`Match found for keyword "${word}" in file: ${filePath}`);
            // Print matching lines
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
              if (line.toLowerCase().includes(word.toLowerCase())) {
                console.log(`  Line ${idx + 1}: ${line.trim()}`);
              }
            });
          }
        }
      }
    }
  } catch (err) {
    // Ignore errors
  }
}

console.log('Searching for credentials in:', SEARCH_DIR);
searchFile(SEARCH_DIR);
console.log('Search finished.');
