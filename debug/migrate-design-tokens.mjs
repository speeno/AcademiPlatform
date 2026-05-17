#!/usr/bin/env node
/**
 * Design token migration — gray-* → semantic tokens, brand inline styles → Tailwind classes.
 * Run: node debug/migrate-design-tokens.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'frontend');

const GRAY_REPLACEMENTS = [
  [/text-gray-900/g, 'text-foreground'],
  [/text-gray-800/g, 'text-foreground'],
  [/text-gray-700/g, 'text-foreground'],
  [/text-gray-600/g, 'text-muted-foreground'],
  [/text-gray-500/g, 'text-muted-foreground'],
  [/text-gray-400/g, 'text-muted-foreground'],
  [/text-gray-300/g, 'text-muted-foreground'],
  [/hover:text-gray-900/g, 'hover:text-foreground'],
  [/hover:text-gray-800/g, 'hover:text-foreground'],
  [/hover:text-gray-700/g, 'hover:text-foreground'],
  [/hover:text-gray-600/g, 'hover:text-muted-foreground'],
  [/bg-gray-900/g, 'bg-brand-blue-dark'],
  [/bg-gray-800/g, 'bg-brand-blue-dark'],
  [/bg-gray-50/g, 'bg-muted/30'],
  [/bg-gray-100/g, 'bg-muted'],
  [/bg-gray-200/g, 'bg-muted'],
  [/hover:bg-gray-50/g, 'hover:bg-muted/50'],
  [/hover:bg-gray-100/g, 'hover:bg-muted'],
  [/border-gray-100/g, 'border-border'],
  [/border-gray-200/g, 'border-border'],
  [/border-gray-300/g, 'border-border'],
  [/divide-gray-200/g, 'divide-border'],
  [/ring-gray-200/g, 'ring-border'],
  [/ring-gray-300/g, 'ring-border'],
];

const STYLE_TO_CLASS = [
  { re: /style=\{\{\s*color:\s*'var\(--brand-blue\)'\s*\}\}/g, cls: 'text-brand-blue' },
  { re: /style=\{\{\s*color:\s*'var\(--brand-orange\)'\s*\}\}/g, cls: 'text-brand-orange' },
  { re: /style=\{\{\s*color:\s*'var\(--brand-sky\)'\s*\}\}/g, cls: 'text-brand-sky' },
  { re: /style=\{\{\s*color:\s*'#9ca3af'\s*\}\}/g, cls: 'text-muted-foreground' },
  { re: /style=\{\{\s*backgroundColor:\s*'var\(--brand-blue\)'\s*\}\}/g, cls: 'bg-brand-blue' },
  { re: /style=\{\{\s*backgroundColor:\s*'var\(--brand-orange\)'\s*\}\}/g, cls: 'bg-brand-orange' },
  { re: /style=\{\{\s*backgroundColor:\s*'var\(--brand-blue-subtle\)'\s*\}\}/g, cls: 'bg-brand-blue-subtle' },
];

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.next') continue;
      walk(p, acc);
    } else if (ent.name.endsWith('.tsx') || ent.name.endsWith('.ts')) {
      acc.push(p);
    }
  }
  return acc;
}

function injectClass(tagChunk, className) {
  const cnMatch = tagChunk.match(/className=(["'`])([\s\S]*?)\1/);
  if (cnMatch) {
    const quote = cnMatch[1];
    const val = cnMatch[2];
    if (val.includes(className)) return tagChunk;
    const merged = `${val} ${className}`.trim();
    return tagChunk.replace(cnMatch[0], `className=${quote}${merged}${quote}`);
  }
  return tagChunk.replace(/(<[A-Za-z][\w.]*)/, `$1 className="${className}"`);
}

function migrateInlineStyles(content) {
  let out = content;
  for (const { re, cls } of STYLE_TO_CLASS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(out)) !== null) {
      const styleStart = m.index;
      const styleEnd = styleStart + m[0].length;
      const before = out.slice(0, styleStart);
      const tagStart = before.lastIndexOf('<');
      const tagEnd = out.indexOf('>', styleEnd);
      if (tagStart === -1 || tagEnd === -1) continue;
      const tagChunk = out.slice(tagStart, tagEnd + 1);
      const updated = injectClass(tagChunk.replace(m[0], ''), cls);
      out = out.slice(0, tagStart) + updated + out.slice(tagEnd + 1);
      re.lastIndex = tagStart;
    }
  }
  return out;
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  for (const [re, rep] of GRAY_REPLACEMENTS) {
    content = content.replace(re, rep);
  }
  content = migrateInlineStyles(content);

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

const dirs = [
  path.join(ROOT, 'app'),
  path.join(ROOT, 'components'),
];
let changed = 0;
for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  for (const f of walk(dir)) {
    if (migrateFile(f)) {
      changed++;
      console.log('updated:', path.relative(ROOT, f));
    }
  }
}
console.log(`\nDone. ${changed} file(s) updated.`);
