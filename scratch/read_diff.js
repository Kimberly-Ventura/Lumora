const fs = require('fs');
const diff = fs.readFileSync('scratch/diff_products.txt', 'utf8');

// Let's find lines with "+" that belong to sorting or the memoized hook
const lines = diff.split('\n');
let addedLines = [];
let capture = false;
let captureCount = 0;

for (const line of lines) {
  if (line.includes('sortedAndFilteredProducts') && line.startsWith('+')) {
    capture = true;
    captureCount = 0;
  }
  if (capture) {
    addedLines.push(line);
    captureCount++;
    if (captureCount > 40) {
      capture = false;
    }
  }
}

console.log('--- Added Lines for sortedAndFilteredProducts ---');
console.log(addedLines.join('\n'));
