const { execSync } = require('child_process');
const fs = require('fs');
try {
  const diff = execSync('git diff -- "app/(admin)/products.tsx"').toString();
  fs.writeFileSync('scratch/diff_products.txt', diff);
  console.log('Saved git diff of products.tsx to scratch/diff_products.txt');
} catch (err) {
  console.error(err);
}
