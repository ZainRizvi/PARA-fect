#!/usr/bin/env node

/**
 * Local release script - faster alternative to GitHub Actions workflow
 * Usage: node scripts/release.mjs [patch|minor|major]
 */

import { readFileSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';

const BUMP_TYPE = process.argv[2] || 'patch';

if (!['patch', 'minor', 'major'].includes(BUMP_TYPE)) {
  console.error('Usage: node scripts/release.mjs [patch|minor|major]');
  process.exit(1);
}

function run(cmd, args) {
  console.log(`$ ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { stdio: 'inherit' });
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

// Get current version
const manifest = readJson('manifest.json');
const [major, minor, patch] = manifest.version.split('.').map(Number);

console.log(`Current version: ${manifest.version}`);

// Calculate new version
let newVersion;
switch (BUMP_TYPE) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

console.log(`New version: ${newVersion}`);

// Update manifest.json
manifest.version = newVersion;
writeJson('manifest.json', manifest);
console.log('Updated manifest.json');

// Update package.json
const pkg = readJson('package.json');
pkg.version = newVersion;
writeJson('package.json', pkg);
console.log('Updated package.json');

// Update versions.json
const versions = readJson('versions.json');
versions[newVersion] = manifest.minAppVersion;
writeJson('versions.json', versions);
console.log('Updated versions.json');

// Build
run('npm', ['run', 'build']);

// Git commit, tag, push
run('git', ['add', 'manifest.json', 'package.json', 'versions.json']);
run('git', ['commit', '-m', `Bump version to ${newVersion}`]);
run('git', ['tag', newVersion]);
run('git', ['push', 'origin', 'main', '--tags']);

// Create GitHub release
run('gh', ['release', 'create', newVersion, `--title=v${newVersion}`, '--generate-notes', 'main.js', 'manifest.json']);

console.log(`\n✓ Released v${newVersion}`);
