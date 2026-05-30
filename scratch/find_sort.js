const fs = require('fs');
const code = fs.readFileSync('app/(admin)/products.tsx', 'utf8');

// Find all matches for 'sort' or '.sort' or 'compare'
const lines = code.split('\n');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('sort') || line.toLowerCase().includes('compare')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
