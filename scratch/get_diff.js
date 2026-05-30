const { execSync } = require('child_process');
try {
  const diff = execSync('git diff -- "app/(admin)/products.tsx"').toString();
  console.log('Diff Length:', diff.length);
  // Find all instances of lines removed or added around sortedAndFilteredProducts
  const index = diff.indexOf('sortedAndFilteredProducts');
  if (index !== -1) {
    console.log(diff.substring(index - 500, index + 2500));
  } else {
    console.log('No sortedAndFilteredProducts in diff');
  }
} catch (err) {
  console.error(err);
}
