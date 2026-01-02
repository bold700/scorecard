const { execSync } = require('child_process');
const { copyFileSync, readdirSync, statSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');

// Make sure we're on main branch first
console.log('Ensuring we are on main branch...');
try {
  execSync('git checkout main', { stdio: 'inherit' });
} catch {}

console.log('Building project...');
execSync('npm run build', { stdio: 'inherit' });

console.log('Switching to gh-pages branch...');
let branchExists = true;
try {
  execSync('git checkout gh-pages', { stdio: 'pipe' });
} catch {
  branchExists = false;
  execSync('git checkout --orphan gh-pages', { stdio: 'inherit' });
}

if (branchExists) {
  console.log('Cleaning branch...');
  try {
    execSync('git rm -rf . --ignore-unmatch', { stdio: 'pipe' });
  } catch {}
}

// Copy dist contents to root
function copyRecursiveSync(src, dest) {
  const exists = existsSync(src);
  const stats = exists && statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }
    readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        join(src, childItemName),
        join(dest, childItemName)
      );
    });
  } else {
    copyFileSync(src, dest);
  }
}

console.log('Copying dist files...');
copyRecursiveSync('dist', '.');

console.log('Adding files...');
execSync('git add .', { stdio: 'inherit' });

console.log('Committing...');
try {
  execSync('git commit -m "Deploy to GitHub Pages"', { stdio: 'inherit' });
} catch {
  console.log('No changes to commit');
}

console.log('Pushing to gh-pages...');
execSync('git push origin gh-pages --force', { stdio: 'inherit' });

console.log('Switching back to main...');
execSync('git checkout main', { stdio: 'inherit' });

console.log('✅ Deployment complete! Visit https://bold700.github.io/scorecard/');
