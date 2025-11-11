const fs = require('fs-extra');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const publicDir = path.join(__dirname, 'public');

// Ensure public directory exists
fs.ensureDirSync(publicDir);

// Copy directories
function copyDir(src, dest) {
  if (fs.existsSync(src)) {
    fs.copySync(src, dest, { overwrite: true });
    console.log(`✓ Copied ${src} to ${dest}`);
  }
}

// Copy components, CSS, JS
copyDir(path.join(srcDir, 'components'), path.join(publicDir, 'components'));
copyDir(path.join(srcDir, 'css'), path.join(publicDir, 'css'));
copyDir(path.join(srcDir, 'js'), path.join(publicDir, 'js'));

// Copy HTML files
const htmlFiles = ['index.html', 'dashboard.html', 'activity.html', 'hives.html', 'koloni.html', 'create.html'];
htmlFiles.forEach(file => {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(publicDir, file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✓ Copied ${file}`);
  }
});

// Copy ALL model files (GLTF, BIN, textures) automatically
const modelDir = path.join(srcDir, 'models');
const publicModelDir = path.join(publicDir, 'models');
fs.ensureDirSync(publicModelDir);

if (fs.existsSync(modelDir)) {
  fs.readdirSync(modelDir).forEach(file => {
    const srcPath = path.join(modelDir, file);
    const destPath = path.join(publicModelDir, file);
    fs.copyFileSync(srcPath, destPath);
    console.log(`✓ Copied model file: ${file}`);
  });
}

// Copy images
if (fs.existsSync(path.join(srcDir, 'images'))) {
  copyDir(path.join(srcDir, 'images'), path.join(publicDir, 'images'));
}

console.log('\n🎉 Build complete! Ready for Netlify deployment.\n');