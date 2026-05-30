const { execSync } = require('child_process');
try {
  const commits = execSync('git log --oneline').toString().split('\n').filter(Boolean);
  console.log(`Found ${commits.length} commits.`);
  for (const commit of commits) {
    const hash = commit.split(' ')[0];
    try {
      const code = execSync(`git show "${hash}:app/(admin)/products.tsx"`).toString();
      if (code.includes('sortedAndFilteredProducts')) {
        console.log(`Commit ${commit} has sortedAndFilteredProducts!`);
        const idx = code.indexOf('sortedAndFilteredProducts');
        console.log(code.substring(idx, idx + 1000));
      }
    } catch (e) {
      // Might not exist in this commit
    }
  }
} catch (err) {
  console.error(err);
}
