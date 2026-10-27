import fs from "node:fs";
import path from "node:path";

const SRC_DIR = path.resolve(process.cwd(), "src");

const EXEMPT_FILES = new Set([
  path.normalize(path.resolve(SRC_DIR, "components/shared/navbar.tsx")),
  path.normalize(path.resolve(SRC_DIR, "components/shared/bottom-nav.tsx")),
  path.normalize(path.resolve(SRC_DIR, "app/globals.css")),
]);

function getFiles(dir, exts) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath, exts));
    } else {
      const ext = path.extname(fullPath);
      if (exts.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const files = getFiles(SRC_DIR, [".tsx", ".ts"]);
let errorCount = 0;

for (const filePath of files) {
  const normPath = path.normalize(filePath);
  if (EXEMPT_FILES.has(normPath)) {
    continue;
  }

  const relPath = path.relative(process.cwd(), filePath);
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // 1. Forbidden legacy surface utilities
    if (/\bbg-surface-(?:raised|sunken|subtle)\b/.test(line)) {
      console.error(
        `[DESIGN CHECK ERROR] ${relPath}:${lineNum} - Forbidden legacy surface utility used (use bg-surface or bg-card instead):\n  ${line.trim()}`
      );
      errorCount++;
    }

    // 2. Forbidden drop shadows outside navbar
    if (/\b(?:shadow-(?:sm|md|lg|xl|2xl|xs|card|soft)|drop-shadow)\b/.test(line)) {
      console.error(
        `[DESIGN CHECK ERROR] ${relPath}:${lineNum} - Drop shadow utility forbidden (only .btn-cta uses hard 3D depth):\n  ${line.trim()}`
      );
      errorCount++;
    }

    // 3. Forbidden gradient utilities
    if (/\b(?:bg-gradient-|bg-linear-)\b/.test(line)) {
      console.error(
        `[DESIGN CHECK ERROR] ${relPath}:${lineNum} - Gradient utility forbidden (only .btn-cta:hover allows gradient):\n  ${line.trim()}`
      );
      errorCount++;
    }

    // 4. Forbidden legacy button-primary
    if (/\bbutton-primary\b/.test(line)) {
      console.error(
        `[DESIGN CHECK ERROR] ${relPath}:${lineNum} - .button-primary is deprecated (use .btn-cta, .btn-secondary, or .btn-ghost):\n  ${line.trim()}`
      );
      errorCount++;
    }
  });
}

if (errorCount > 0) {
  console.error(`\nDesign check failed with ${errorCount} violation(s).\n`);
  process.exit(1);
} else {
  console.log(`Design check passed! Scanned ${files.length} application files with 0 violations.`);
}
