#!/usr/bin/env node
/* eslint-disable no-console */
const { spawnSync } = require('node:child_process');

const autoDbSync = (process.env.AUTO_DB_SYNC ?? 'false').toLowerCase() === 'true';
const autoDbPush = (process.env.AUTO_DB_PUSH ?? 'false').toLowerCase() === 'true';

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!autoDbSync) {
  console.log('[db:auto] AUTO_DB_SYNC=false -> DB 자동 반영 건너뜀');
  process.exit(0);
}

console.log('[db:auto] AUTO_DB_SYNC=true -> prisma migrate deploy 실행');
run('npx', ['prisma', 'migrate', 'deploy']);

if (autoDbPush) {
  console.warn('[db:auto] AUTO_DB_PUSH=true -> 개발환경용 prisma db push 실행');
  run('npx', ['prisma', 'db', 'push']);
}

console.log('[db:auto] DB 자동 반영 완료');
