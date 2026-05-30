const { execSync } = require('child_process');
try {
  const code = execSync('git show "HEAD:app/(admin)/products.tsx"').toString();
  const matchIndex = code.indexOf('const sortedAndFilteredProducts');
  if (matchIndex !== -1) {
    console.log(code.substring(matchIndex, matchIndex + 2500));
  } else {
    console.log('Not found const sortedAndFilteredProducts');
    // Let's print around filteredProducts
    const altIndex = code.indexOf('filteredProducts');
    console.log(code.substring(altIndex, altIndex + 1000));
  }
} catch (err) {
  console.error(err);
}
