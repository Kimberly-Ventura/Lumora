const fs = require('fs');
const diff = fs.readFileSync('scratch/diff_products.txt', 'utf8');

const lines = diff.split('\n');
const deletedLines = lines.filter(l => l.startsWith('-') && !l.startsWith('---'));
console.log('Found', deletedLines.length, 'deleted lines.');
deletedLines.slice(0, 50).forEach((l, i) => {
  console.log(`${i + 1}: ${l}`);
});
