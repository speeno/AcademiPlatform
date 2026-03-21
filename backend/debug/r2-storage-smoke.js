#!/usr/bin/env node
/* eslint-disable no-console */
require('dotenv').config();
const crypto = require('node:crypto');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

function pickFirst(...values) {
  for (const value of values) {
    const text = (value || '').trim();
    if (text) return text;
  }
  return '';
}

const endpoint = pickFirst(process.env.S3_ENDPOINT, process.env.AWS_S3_ENDPOINT);
const region = pickFirst(process.env.S3_REGION, process.env.AWS_REGION, 'auto');
const bucket = pickFirst(process.env.S3_BUCKET, process.env.AWS_S3_BUCKET_PRIVATE);
const accessKeyId = pickFirst(process.env.S3_ACCESS_KEY, process.env.AWS_ACCESS_KEY_ID);
const secretAccessKey = pickFirst(process.env.S3_SECRET_KEY, process.env.AWS_SECRET_ACCESS_KEY);

const missing = [];
if (!endpoint) missing.push('S3_ENDPOINT/AWS_S3_ENDPOINT');
if (!bucket) missing.push('S3_BUCKET/AWS_S3_BUCKET_PRIVATE');
if (!accessKeyId) missing.push('S3_ACCESS_KEY/AWS_ACCESS_KEY_ID');
if (!secretAccessKey) missing.push('S3_SECRET_KEY/AWS_SECRET_ACCESS_KEY');

if (missing.length > 0) {
  console.error(`[r2-smoke] 필수 env 누락: ${missing.join(', ')}`);
  process.exit(1);
}

async function run() {
  const mode = (process.env.STORAGE_SMOKE_MODE || 'network').trim().toLowerCase();
  const s3 = new S3Client({
    endpoint,
    region,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });

  if (mode === 'signed-url') {
    const now = Date.now();
    const cases = [
      { name: 'media-upload', key: `raw/lesson-smoke/${now}_video.mp4`, contentType: 'video/mp4' },
      { name: 'textbook-upload', key: `textbooks/${now}_book.pdf`, contentType: 'application/pdf' },
      { name: 'cms-upload', key: `cms/course-smoke/lesson-smoke/${now}_asset.pdf`, contentType: 'application/pdf' },
    ];

    for (const item of cases) {
      const uploadUrl = await getSignedUrl(
        s3,
        new PutObjectCommand({
          Bucket: bucket,
          Key: item.key,
          ContentType: item.contentType,
        }),
        { expiresIn: 600 },
      );
      const viewUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: bucket,
          Key: item.key,
        }),
        { expiresIn: 600 },
      );

      if (!uploadUrl.includes(item.key) || !viewUrl.includes(item.key)) {
        throw new Error(`[r2-smoke] signed-url 검증 실패(${item.name})`);
      }
      console.log(`[r2-smoke] signed-url ok: ${item.name}`);
    }

    console.log('[r2-smoke] success (signed-url mode)');
    return;
  }

  const nonce = crypto.randomBytes(4).toString('hex');
  const key = `smoke/r2-${Date.now()}-${nonce}.txt`;
  const body = Buffer.from(`r2 smoke ${new Date().toISOString()}`, 'utf-8');

  console.log(`[r2-smoke] start endpoint=${endpoint} bucket=${bucket} key=${key}`);

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: 'text/plain',
  }));
  console.log('[r2-smoke] put ok');

  const getResult = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const chunks = [];
  for await (const chunk of getResult.Body) {
    chunks.push(Buffer.from(chunk));
  }
  const downloaded = Buffer.concat(chunks);
  if (!downloaded.equals(body)) {
    throw new Error('[r2-smoke] get mismatch');
  }
  console.log('[r2-smoke] get ok');

  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  console.log('[r2-smoke] delete ok');
  console.log('[r2-smoke] success');
}

run().catch((error) => {
  console.error('[r2-smoke] failed', error);
  process.exit(1);
});

