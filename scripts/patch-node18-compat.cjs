const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const patches = [
  {
    file: path.join(rootDir, 'node_modules', 'expo', 'bin', 'cli'),
    transform(source) {
      const requireLine = "require('@expo/cli');";
      if (!source.includes(requireLine)) {
        return source;
      }

      const injected = "require('../../../scripts/node18-polyfills.cjs');\n" + requireLine;
      return source.includes("node18-polyfills.cjs")
        ? source
        : source.replace(requireLine, injected);
    },
  },
  {
    file: path.join(rootDir, 'node_modules', 'expo', 'node_modules', '@expo', 'cli', 'build', 'bin', 'cli'),
    transform(source) {
      return source.replace(
        /const NODE_MIN = \[\s*20,\s*19,\s*4\s*\];/,
        'const NODE_MIN = [18, 0, 0];'
      );
    },
  },
];

for (const patch of patches) {
  if (!fs.existsSync(patch.file)) {
    continue;
  }

  const current = fs.readFileSync(patch.file, 'utf8');
  const next = patch.transform(current);

  if (next !== current) {
    fs.writeFileSync(patch.file, next, 'utf8');
    console.log(`Patched ${path.relative(rootDir, patch.file)}`);
  }
}
