import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const ossutilPath = path.join(rootDir, 'ossutil64');
const bucket = process.env.ALIYUN_OSS_BUCKET;
const manifestKey = '.deploy-manifest.json';
const previousManifestPath = path.join(rootDir, '.deploy-manifest.previous.json');
const currentManifestPath = path.join(rootDir, '.deploy-manifest.current.json');

if (!bucket) {
  throw new Error('ALIYUN_OSS_BUCKET is required.');
}

if (!fs.existsSync(distDir)) {
  throw new Error(`Build output not found: ${distDir}`);
}

if (!fs.existsSync(ossutilPath)) {
  throw new Error(`ossutil not found: ${ossutilPath}`);
}

const remoteUrl = (key) => `oss://${bucket}/${key}`;

const runOssutil = (args, { allowFailure = false, capture = false } = {}) => {
  const result = spawnSync(ossutilPath, args, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0 && !allowFailure) {
    const detail = capture ? `\n${result.stderr || result.stdout || ''}` : '';
    throw new Error(`ossutil ${args[0]} failed with exit code ${result.status}.${detail}`);
  }

  return result;
};

const walkFiles = (directory) => {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(absolutePath));
    else if (entry.isFile()) files.push(absolutePath);
  }
  return files;
};

const fingerprint = (absolutePath) => {
  const content = fs.readFileSync(absolutePath);
  return {
    md5: crypto.createHash('md5').update(content).digest('hex'),
    size: content.length,
  };
};

const parseRemoteStat = (text) => {
  const value = String(text || '');
  const etag = value.match(/(?:^|\n)ETag\s*:\s*"?([a-f\d-]+)"?/i)?.[1]?.toLowerCase();
  const size = value.match(/(?:^|\n)Content-Length\s*:\s*(\d+)/i)?.[1];
  const contentType = value.match(/(?:^|\n)Content-Type\s*:\s*([^\r\n]+)/i)?.[1]?.trim().toLowerCase();
  return {
    etag: etag || null,
    size: size ? Number(size) : null,
    contentType: contentType || null,
  };
};

const statRemote = (key) => {
  const result = runOssutil(['stat', remoteUrl(key)], { allowFailure: true, capture: true });
  if (result.status !== 0) return null;
  return parseRemoteStat(`${result.stdout || ''}\n${result.stderr || ''}`);
};

const loadPreviousManifest = () => {
  const result = runOssutil(
    ['cp', '-f', remoteUrl(manifestKey), previousManifestPath],
    { allowFailure: true, capture: true },
  );

  if (result.status !== 0 || !fs.existsSync(previousManifestPath)) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(previousManifestPath, 'utf8'));
    return parsed?.version === 1 && parsed?.entries ? parsed : null;
  } catch (error) {
    console.warn(`[deploy] Ignoring unreadable previous manifest: ${error.message}`);
    return null;
  }
};

const entries = {};
const sources = {};

for (const absolutePath of walkFiles(distDir).sort()) {
  const key = path.relative(distDir, absolutePath).split(path.sep).join('/');
  entries[key] = { ...fingerprint(absolutePath), kind: 'file' };
  sources[key] = absolutePath;
}

const indexPath = path.join(distDir, 'index.html');
const routeManifestPath = path.join(distDir, 'data', 'static-routes.json');

if (fs.existsSync(indexPath) && fs.existsSync(routeManifestPath)) {
  const indexFingerprint = fingerprint(indexPath);
  const routeManifest = JSON.parse(fs.readFileSync(routeManifestPath, 'utf8'));

  for (const rawRoute of Array.isArray(routeManifest.routes) ? routeManifest.routes : []) {
    const key = String(rawRoute || '').replace(/^\/+/, '').replace(/\/+$/, '');
    if (!key) continue;
    entries[key] = {
      ...indexFingerprint,
      kind: 'route',
      contentType: 'text/html',
    };
    sources[key] = indexPath;
  }
}

const previousManifest = loadPreviousManifest();
const previousEntries = previousManifest?.entries || {};
const bootstrapFromRemote = !previousManifest;

let uploaded = 0;
let metadataUpdated = 0;
let skipped = 0;

console.log(
  `[deploy] Comparing ${Object.keys(entries).length} objects (${bootstrapFromRemote ? 'remote bootstrap' : 'manifest mode'}).`,
);

for (const key of Object.keys(entries).sort()) {
  const current = entries[key];
  const previous = previousEntries[key];
  const sameAsManifest = previous
    && previous.md5 === current.md5
    && previous.size === current.size
    && previous.kind === current.kind
    && (previous.contentType || null) === (current.contentType || null);

  if (sameAsManifest) {
    skipped += 1;
    continue;
  }

  let remote = null;
  if (bootstrapFromRemote || !previous) remote = statRemote(key);

  const sameContentOnRemote = remote
    && remote.etag === current.md5
    && remote.size === current.size;
  const needsHtmlMetadata = current.contentType === 'text/html'
    && remote?.contentType !== 'text/html';

  if (sameContentOnRemote && !needsHtmlMetadata) {
    skipped += 1;
    continue;
  }

  if (!sameContentOnRemote) {
    console.log(`[deploy] Uploading ${key}`);
    runOssutil(['cp', '-f', sources[key], remoteUrl(key)]);
    uploaded += 1;
  }

  if (current.contentType === 'text/html') {
    runOssutil(['set-meta', remoteUrl(key), 'Content-Type:text/html', '--update']);
    metadataUpdated += 1;
  }
}

const currentManifest = {
  version: 1,
  generatedAt: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || null,
  entries,
};

fs.writeFileSync(currentManifestPath, `${JSON.stringify(currentManifest, null, 2)}\n`);
runOssutil(['cp', '-f', currentManifestPath, remoteUrl(manifestKey)]);

const summary = { uploaded, skipped, metadataUpdated, total: Object.keys(entries).length };
console.log(`[deploy] Complete: ${JSON.stringify(summary)}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    [
      '',
      '### Incremental upload',
      '',
      `- Uploaded: ${uploaded}`,
      `- Skipped unchanged: ${skipped}`,
      `- Metadata updates: ${metadataUpdated}`,
      `- Total objects: ${summary.total}`,
      '',
    ].join('\n'),
  );
}
