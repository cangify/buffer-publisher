const { app, BrowserWindow, ipcMain, dialog, shell, Menu, nativeImage } = require('electron');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { openAsBlob } = require('fs');
const execFileAsync = promisify(execFile);

const BUFFER_ENDPOINT = 'https://api.buffer.com';
const DEFAULT_UPLOADERS = ['pixeldrain', 'catbox', 'litterbox', 'tempsh', '0x0', 'fileio'];
const BUFFER_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_UPLOAD_TARGET_BYTES = Math.floor(BUFFER_IMAGE_MAX_BYTES * 0.94);
const SIDEBAR_AD_URL = 'https://cangify.com/globle/ads/buffer-publisher/buffer-publisher.json';

let mainWindow;

app.commandLine.appendSwitch('disable-gpu');
Menu.setApplicationMenu(null);

function configPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function usagePath() {
  return path.join(app.getPath('userData'), 'buffer-api-usage.json');
}

function ollamaUsagePath() {
  return path.join(app.getPath('userData'), 'ollama-usage.json');
}

function defaultConfig() {
  return {
    bufferApiKey: '',
    uploaders: DEFAULT_UPLOADERS,
    uploadTimeoutMs: 60000,
    litterboxTime: '72h',
    ollamaEnabled: false,
    ollamaUrl: 'http://127.0.0.1:11434',
    ollamaModel: '',
    ollamaPrompt: '请根据这些图片内容，为社交媒体帖子生成一个简短、自然、吸引人的中文标题。只输出标题，不要解释，不要加引号。',
    ollamaTimeoutMs: 120000,
    watermarkEnabled: false,
    watermarkMode: 'text',
    watermarkText: '',
    watermarkImagePath: '',
    watermarkPosition: 'bottom-right',
    watermarkOpacity: 0.72,
    watermarkFontSize: 32,
    watermarkImageScale: 22,
    watermarkImages: true,
    watermarkVideos: true
  };
}

async function readConfig() {
  try {
    const raw = await fs.readFile(configPath(), 'utf8');
    return { ...defaultConfig(), ...JSON.parse(raw) };
  } catch {
    return defaultConfig();
  }
}

async function writeConfig(next) {
  await fs.mkdir(path.dirname(configPath()), { recursive: true });
  await fs.writeFile(configPath(), JSON.stringify(next, null, 2));
  return next;
}

async function readUsage() {
  try {
    const raw = await fs.readFile(usagePath(), 'utf8');
    return JSON.parse(raw);
  } catch {
    return { events: [], latestRateLimit: null, lastError: null };
  }
}

async function writeUsage(usage) {
  await fs.mkdir(path.dirname(usagePath()), { recursive: true });
  await fs.writeFile(usagePath(), JSON.stringify(usage, null, 2));
  return usage;
}

async function readOllamaUsage() {
  try {
    const raw = await fs.readFile(ollamaUsagePath(), 'utf8');
    return JSON.parse(raw);
  } catch {
    return { events: [], latest: null };
  }
}

async function writeOllamaUsage(usage) {
  await fs.mkdir(path.dirname(ollamaUsagePath()), { recursive: true });
  await fs.writeFile(ollamaUsagePath(), JSON.stringify(usage, null, 2));
  return usage;
}

function summarizeOllamaUsage(usage) {
  const now = Date.now();
  const events = (usage.events || []).filter(event => now - event.at <= 30 * 24 * 60 * 60 * 1000);
  const sum = key => events.reduce((total, event) => total + Number(event[key] || 0), 0);
  return {
    latest: usage.latest || null,
    local: {
      calls30d: events.length,
      promptTokens30d: sum('promptTokens'),
      outputTokens30d: sum('outputTokens'),
      totalTokens30d: sum('totalTokens')
    }
  };
}

async function recordOllamaUsage(event) {
  const usage = await readOllamaUsage();
  const now = Date.now();
  const events = (usage.events || []).filter(item => now - item.at <= 30 * 24 * 60 * 60 * 1000);
  const nextEvent = { at: now, ...event };
  events.push(nextEvent);
  const next = { events, latest: { ...nextEvent, at: new Date(now).toISOString() } };
  await writeOllamaUsage(next);
  return summarizeOllamaUsage(next);
}

function summarizeUsage(usage) {
  const now = Date.now();
  const events = (usage.events || []).filter(event => now - event.at <= 30 * 24 * 60 * 60 * 1000);
  const countSince = ms => events.filter(event => now - event.at <= ms).length;
  return {
    local: {
      last15m: countSince(15 * 60 * 1000),
      last24h: countSince(24 * 60 * 60 * 1000),
      last30d: events.length,
      totalErrors30d: events.filter(event => !event.ok).length
    },
    latestRateLimit: usage.latestRateLimit || null,
    lastError: usage.lastError || null,
    planLimits: {
      free: { apiKeys: 1, appClients: 1, limit15m: 100, limit24h: 100, limit30d: 3000 },
      essentials: { apiKeys: 3, appClients: 3, limit15m: 100, limit24h: 250, limit30d: 7500 },
      team: { apiKeys: 5, appClients: 5, limit15m: 100, limit24h: 500, limit30d: 15000 }
    }
  };
}

async function recordBufferUsage({ ok, status, headers, error }) {
  const usage = await readUsage();
  const now = Date.now();
  const events = (usage.events || []).filter(event => now - event.at <= 30 * 24 * 60 * 60 * 1000);
  events.push({ at: now, ok, status });
  const latestRateLimit = {
    limit: headers?.get?.('ratelimit-limit') || null,
    remaining: headers?.get?.('ratelimit-remaining') || null,
    reset: headers?.get?.('ratelimit-reset') || null,
    retryAfter: headers?.get?.('retry-after') || null,
    updatedAt: new Date(now).toISOString()
  };
  const next = {
    events,
    latestRateLimit: latestRateLimit.limit || latestRateLimit.remaining || latestRateLimit.reset ? latestRateLimit : usage.latestRateLimit || null,
    lastError: ok ? usage.lastError || null : { at: new Date(now).toISOString(), status, message: error || 'Buffer API 请求失败' }
  };
  await writeUsage(next);
  return summarizeUsage(next);
}


function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

function normalizeSidebarAd(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};
  const version = String(data.updatedAt || data.version || Date.now());
  const ads = Array.isArray(data.ads) ? data.ads.map((item, index) => {
    const imageUrl = safeHttpUrl(item?.imageUrl);
    const linkUrl = safeHttpUrl(item?.linkUrl);
    if (!imageUrl) return null;
    return {
      title: String(item?.title || `广告 ${index + 1}`).slice(0, 80),
      alt: String(item?.alt || item?.title || `广告 ${index + 1}`).slice(0, 120),
      imageUrl,
      linkUrl: linkUrl || 'https://cangify.com/'
    };
  }).filter(Boolean) : [];
  return {
    enabled: Boolean(data.enabled) && ads.length > 0,
    intervalSeconds: Math.max(3, Math.min(3600, Number(data.intervalSeconds) || 5)),
    refreshSeconds: Math.max(30, Math.min(86400, Number(data.refreshSeconds) || 300)),
    updatedAt: data.updatedAt || '',
    version,
    ads
  };
}

async function getSidebarAd() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(SIDEBAR_AD_URL, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`广告 JSON HTTP ${res.status}`);
    return normalizeSidebarAd(await res.json());
  } catch (err) {
    return { enabled: false, intervalSeconds: 5, refreshSeconds: 300, updatedAt: '', version: '', ads: [], error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 980,
    minHeight: 700,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

function requireKey(config) {
  if (!config.bufferApiKey || !config.bufferApiKey.trim()) throw new Error('请先在设置里填写 Buffer API Key');
  return config.bufferApiKey.trim();
}

async function bufferGraphql(query, variables = {}, apiKey) {
  const res = await fetch(BUFFER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ query, variables })
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch {
    await recordBufferUsage({ ok: false, status: res.status, headers: res.headers, error: `Buffer 返回非 JSON：${text.slice(0, 300)}` });
    throw new Error(`Buffer 返回非 JSON：${text.slice(0, 300)}`);
  }
  if (!res.ok) {
    const msg = json?.errors?.[0]?.message || json?.message || text.slice(0, 300);
    await recordBufferUsage({ ok: false, status: res.status, headers: res.headers, error: msg });
    throw new Error(`Buffer HTTP ${res.status}: ${msg}`);
  }
  if (json.errors?.length) {
    const msg = json.errors.map(e => `${e.extensions?.code ? `${e.extensions.code}: ` : ''}${e.message}`).join('\n');
    await recordBufferUsage({ ok: false, status: res.status, headers: res.headers, error: msg });
    throw new Error(msg);
  }
  await recordBufferUsage({ ok: true, status: res.status, headers: res.headers });
  return json.data;
}

async function getOrganizations(apiKey) {
  const data = await bufferGraphql(`query GetOrganizations { account { id email organizations { id name } } }`, {}, apiKey);
  return data.account;
}

async function getChannels(apiKey, organizationId) {
  const data = await bufferGraphql(`
    query GetChannels($organizationId: OrganizationId!) {
      channels(input: { organizationId: $organizationId }) {
        id name displayName descriptor service type avatar isDisconnected isLocked timezone externalLink
      }
    }
  `, { organizationId }, apiKey);
  return data.channels || [];
}

function graphqlString(value) {
  return JSON.stringify(String(value ?? ''));
}

function createAssetInput(asset) {
  if (asset.kind === 'image') return `{ image: { url: ${graphqlString(asset.url)} } }`;
  if (asset.kind === 'video') return `{ video: { url: ${graphqlString(asset.url)}${asset.thumbnailUrl ? `, thumbnailUrl: ${graphqlString(asset.thumbnailUrl)}` : ''} } }`;
  throw new Error(`不支持的媒体类型：${asset.kind}`);
}

async function listBufferPosts(apiKey, organizationId, statusList) {
  const statuses = statusList.join(', ');
  const data = await bufferGraphql(`
    query GetPosts {
      posts(
        first: 50,
        input: {
          organizationId: ${graphqlString(organizationId)},
          sort: [{ field: dueAt, direction: desc }, { field: createdAt, direction: desc }],
          filter: { status: [${statuses}] }
        }
      ) {
        pageInfo { endCursor hasNextPage }
        edges {
          node {
            id text createdAt dueAt status channelId
            assets { id source mimeType }
          }
        }
      }
    }
  `, {}, apiKey);
  return {
    posts: (data.posts?.edges || []).map(edge => edge.node),
    pageInfo: data.posts?.pageInfo || {}
  };
}

async function createBufferPost(apiKey, post) {
  const assets = post.assets?.length ? `assets: [${post.assets.map(createAssetInput).join(', ')}]` : '';
  const dueAt = post.mode === 'customScheduled' ? `dueAt: ${graphqlString(post.dueAt)}` : '';
  const input = `text: ${graphqlString(post.text)} channelId: ${graphqlString(post.channelId)} schedulingType: automatic mode: ${post.mode} ${dueAt} ${assets}`;
  const data = await bufferGraphql(`
    mutation CreatePost {
      createPost(input: { ${input} }) {
        ... on PostActionSuccess {
          post { id text dueAt status assets { id source mimeType } }
        }
        ... on MutationError { message }
      }
    }
  `, {}, apiKey);
  const result = data.createPost;
  if (result?.message) throw new Error(result.message);
  return result.post;
}

async function pickFiles() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择图片或视频',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: '图片和视频', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });
  if (result.canceled) return [];
  return Promise.all(result.filePaths.map(async filePath => {
    const stat = await fs.stat(filePath);
    return { path: filePath, name: path.basename(filePath), size: stat.size, mimeType: mimeFromPath(filePath) };
  }));
}

async function pickWatermarkImage() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择水印图片',
    properties: ['openFile'],
    filters: [{ name: '水印图片', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] }]
  });
  if (result.canceled) return '';
  return result.filePaths[0] || '';
}

function mimeFromPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp',
    '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.mkv': 'video/x-matroska', '.avi': 'video/x-msvideo'
  };
  return map[ext] || 'application/octet-stream';
}

function assetKindFromMime(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return null;
}

async function withTimeout(promiseFactory, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try { return await promiseFactory(controller.signal); }
  finally { clearTimeout(timer); }
}

async function postMultipart(url, fields, filePath, fileField, timeoutMs) {
  return withTimeout(async signal => {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) form.append(key, value);
    const blob = typeof openAsBlob === 'function'
      ? await openAsBlob(filePath, { type: mimeFromPath(filePath) })
      : new Blob([await fs.readFile(filePath)], { type: mimeFromPath(filePath) });
    form.append(fileField, blob, path.basename(filePath));
    const res = await fetch(url, { method: 'POST', body: form, signal });
    const text = (await res.text()).trim();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    return text;
  }, timeoutMs);
}

async function uploadCatbox(filePath, timeoutMs) {
  return postMultipart('https://catbox.moe/user/api.php', { reqtype: 'fileupload' }, filePath, 'fileToUpload', timeoutMs);
}

async function uploadLitterbox(filePath, timeoutMs, time = '72h') {
  return postMultipart('https://litterbox.catbox.moe/resources/internals/api.php', { reqtype: 'fileupload', time }, filePath, 'fileToUpload', timeoutMs);
}

async function uploadTempSh(filePath, timeoutMs) {
  return postMultipart('https://temp.sh/upload', {}, filePath, 'file', timeoutMs);
}

async function upload0x0(filePath, timeoutMs) {
  return postMultipart('https://0x0.st', {}, filePath, 'file', timeoutMs);
}

async function uploadFileIo(filePath, timeoutMs, expires = '3d') {
  const safeExpires = /^[1-9]\d*[yQMwdhms]$/.test(expires) ? expires : '3d';
  const text = await postMultipart(`https://file.io/?expires=${encodeURIComponent(safeExpires)}&maxDownloads=10&autoDelete=false`, {}, filePath, 'file', timeoutMs);
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`file.io 返回非 JSON：${text.slice(0, 200)}`); }
  if (!json.success || !json.link) throw new Error(json.message || text.slice(0, 200));
  return json.link;
}

async function uploadPixeldrain(filePath, timeoutMs, apiKey) {
  if (!apiKey || !apiKey.trim()) throw new Error('需要在设置里填写 Pixeldrain API Key');
  return withTimeout(async signal => {
    const fileName = encodeURIComponent(path.basename(filePath));
    const blob = typeof openAsBlob === 'function'
      ? await openAsBlob(filePath, { type: mimeFromPath(filePath) })
      : new Blob([await fs.readFile(filePath)], { type: mimeFromPath(filePath) });
    const auth = Buffer.from(`:${apiKey.trim()}`).toString('base64');
    const res = await fetch(`https://pixeldrain.com/api/file/${fileName}`, {
      method: 'PUT',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': mimeFromPath(filePath) },
      body: blob,
      signal
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { throw new Error(`Pixeldrain 返回非 JSON：${text.slice(0, 200)}`); }
    if (!res.ok || !json.id) throw new Error(json.message || text.slice(0, 200));
    return `https://pixeldrain.com/api/file/${json.id}`;
  }, timeoutMs);
}

async function validateMediaUrl(url, expectedKind, timeoutMs) {
  if (!/^https?:\/\//i.test(url)) throw new Error(`返回的不是 URL：${url.slice(0, 120)}`);
  const headers = await withTimeout(async signal => {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal });
    if (!res.ok || !res.headers.get('content-type')) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', headers: { Range: 'bytes=0-1023' }, signal });
    }
    if (!res.ok && res.status !== 206) throw new Error(`URL 检测失败 HTTP ${res.status}`);
    return res.headers;
  }, Math.min(timeoutMs, 20000));
  const contentType = (headers.get('content-type') || '').toLowerCase();
  if (expectedKind === 'image' && !contentType.startsWith('image/')) throw new Error(`不是图片直链：${contentType || 'unknown'}`);
  if (expectedKind === 'video' && !contentType.startsWith('video/')) throw new Error(`不是视频直链：${contentType || 'unknown'}`);
  return { url, contentType };
}

function isImageMime(mime = '') { return String(mime).startsWith('image/'); }
function isVideoMime(mime = '') { return String(mime).startsWith('video/'); }
function safeBaseName(filePath = '') {
  return path.basename(filePath, path.extname(filePath)).replace(/[^\w\u4e00-\u9fff-]+/g, '_').slice(0, 48) || 'media';
}
function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}
function escapeXml(value = '') {
  return String(value).replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[char]));
}
function escapeFfmpegText(value = '') {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:').replace(/%/g, '\\%').replace(/\n/g, ' ');
}
function svgTextPosition(position = 'bottom-right', width = 0, height = 0, margin = 24) {
  if (position === 'bottom-left') return { x: margin, y: height - margin, anchor: 'start', baseline: 'auto' };
  if (position === 'top-left') return { x: margin, y: margin, anchor: 'start', baseline: 'hanging' };
  if (position === 'top-right') return { x: width - margin, y: margin, anchor: 'end', baseline: 'hanging' };
  if (position === 'center') return { x: Math.round(width / 2), y: Math.round(height / 2), anchor: 'middle', baseline: 'middle' };
  return { x: width - margin, y: height - margin, anchor: 'end', baseline: 'auto' };
}
function svgBoxPosition(position = 'bottom-right', width = 0, height = 0, boxWidth = 0, boxHeight = 0, margin = 24) {
  if (position === 'bottom-left') return { x: margin, y: height - boxHeight - margin };
  if (position === 'top-left') return { x: margin, y: margin };
  if (position === 'top-right') return { x: width - boxWidth - margin, y: margin };
  if (position === 'center') return { x: Math.round((width - boxWidth) / 2), y: Math.round((height - boxHeight) / 2) };
  return { x: width - boxWidth - margin, y: height - boxHeight - margin };
}
function ffmpegDrawtextPosition(position = 'bottom-right', margin = 24) {
  if (position === 'bottom-left') return { x: String(margin), y: `h-text_h-${margin}` };
  if (position === 'top-left') return { x: String(margin), y: String(margin) };
  if (position === 'top-right') return { x: `w-text_w-${margin}`, y: String(margin) };
  if (position === 'center') return { x: '(w-text_w)/2', y: '(h-text_h)/2' };
  return { x: `w-text_w-${margin}`, y: `h-text_h-${margin}` };
}
function ffmpegOverlayPosition(position = 'bottom-right', margin = 24) {
  if (position === 'bottom-left') return { x: String(margin), y: `main_h-overlay_h-${margin}` };
  if (position === 'top-left') return { x: String(margin), y: String(margin) };
  if (position === 'top-right') return { x: `main_w-overlay_w-${margin}`, y: String(margin) };
  if (position === 'center') return { x: '(main_w-overlay_w)/2', y: '(main_h-overlay_h)/2' };
  return { x: `main_w-overlay_w-${margin}`, y: `main_h-overlay_h-${margin}` };
}
function findFfmpeg() {
  try {
    const ffmpeg = require('@ffmpeg-installer/ffmpeg');
    const candidate = String(ffmpeg?.path || '').replace('app.asar', 'app.asar.unpacked');
    if (candidate && fsSync.existsSync(candidate)) return candidate;
  } catch {}
  return '';
}
async function prepareWatermarkedMedia(file, config = {}) {
  const mime = file.mimeType || mimeFromPath(file.path);
  if (isImageMime(mime)) {
    let outPath = file.path;
    let watermarked = false;
    if (config.watermarkEnabled && config.watermarkImages !== false) {
      const markedPath = await watermarkImageFile(file.path, config);
      if (markedPath !== file.path) {
        outPath = markedPath;
        watermarked = true;
      }
    }
    const optimizedPath = await optimizeImageForBuffer(outPath);
    const stat = await fs.stat(optimizedPath);
    return { ...file, path: optimizedPath, name: path.basename(optimizedPath), size: stat.size, mimeType: mimeFromPath(optimizedPath), originalName: file.name, watermarked, optimized: optimizedPath !== file.path && optimizedPath !== outPath || stat.size < Number(file.size || 0) };
  }
  if (config.watermarkEnabled && isVideoMime(mime) && config.watermarkVideos !== false) {
    const outPath = await watermarkVideoFile(file.path, config);
    if (outPath !== file.path) {
      const stat = await fs.stat(outPath);
      return { ...file, path: outPath, name: path.basename(outPath), size: stat.size, mimeType: mimeFromPath(outPath), originalName: file.name, watermarked: true };
    }
  }
  return file;
}

async function optimizeImageForBuffer(filePath = '') {
  let stat;
  try { stat = await fs.stat(filePath); } catch { return filePath; }
  const image = nativeImage.createFromPath(filePath);
  if (image.isEmpty()) return filePath;
  const originalSize = image.getSize();
  if (!originalSize.width || !originalSize.height) return filePath;
  if (stat.size <= IMAGE_UPLOAD_TARGET_BYTES && /\.(jpe?g|png|webp)$/i.test(filePath)) return filePath;
  const dir = path.join(app.getPath('temp'), 'buffer-publisher-watermark');
  await fs.mkdir(dir, { recursive: true });
  const maxOriginalSide = Math.max(originalSize.width, originalSize.height);
  const sideCaps = [2400, 2000, 1800, 1600, 1400, 1200, 1000, 820].map(side => Math.min(side, maxOriginalSide));
  const qualities = [88, 82, 76, 70, 64, 58, 52, 46, 40, 34, 30];
  let best = null;
  for (const maxSide of [...new Set(sideCaps)]) {
    const resized = resizeNativeImageToFit(image, originalSize, maxSide);
    for (const quality of qualities) {
      const buffer = resized.toJPEG(quality);
      if (!best || buffer.length < best.buffer.length) best = { buffer, quality, maxSide };
      if (buffer.length <= IMAGE_UPLOAD_TARGET_BYTES) return writeOptimizedImage(filePath, buffer, quality, maxSide);
    }
  }
  return writeOptimizedImage(filePath, best?.buffer || image.toJPEG(30), best?.quality || 30, best?.maxSide || 0);
}
function resizeNativeImageToFit(image, size = {}, maxSide = 2000) {
  const width = size.width || 0;
  const height = size.height || 0;
  if (!width || !height || Math.max(width, height) <= maxSide) return image;
  const scale = maxSide / Math.max(width, height);
  return image.resize({ width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)), quality: 'best' });
}
async function writeOptimizedImage(originalPath = '', buffer, quality = 0, maxSide = 0) {
  const dir = path.join(app.getPath('temp'), 'buffer-publisher-watermark');
  await fs.mkdir(dir, { recursive: true });
  const out = path.join(dir, `${Date.now()}-${safeBaseName(originalPath)}-buffer-${quality}-${maxSide}.jpg`);
  await fs.writeFile(out, buffer);
  return out;
}

async function watermarkImageFile(filePath = '', config = {}) {
  const mode = config.watermarkMode === 'image' ? 'image' : 'text';
  if (mode === 'text' && !String(config.watermarkText || '').trim()) return filePath;
  if (mode === 'image' && (!config.watermarkImagePath || !fsSync.existsSync(config.watermarkImagePath))) return filePath;
  const image = nativeImage.createFromPath(filePath);
  if (image.isEmpty()) return filePath;
  const { width, height } = image.getSize();
  if (!width || !height) return filePath;
  const input = await fs.readFile(filePath);
  const mime = mimeFromPath(filePath) || 'image/png';
  const opacity = clampNumber(config.watermarkOpacity, 0.15, 1, 0.72);
  let watermarkMarkup = '';
  if (mode === 'image') {
    const mark = nativeImage.createFromPath(config.watermarkImagePath);
    if (mark.isEmpty()) return filePath;
    const markSize = mark.getSize();
    const targetWidth = Math.max(24, Math.round(width * (clampNumber(config.watermarkImageScale, 6, 60, 22) / 100)));
    const targetHeight = Math.max(12, Math.round(targetWidth * ((markSize.height || 1) / (markSize.width || 1))));
    const margin = Math.max(18, Math.round(Math.min(width, height) * 0.035));
    const pos = svgBoxPosition(config.watermarkPosition || 'bottom-right', width, height, targetWidth, targetHeight, margin);
    const markBuffer = await fs.readFile(config.watermarkImagePath);
    watermarkMarkup = `<image href="data:${mimeFromPath(config.watermarkImagePath) || 'image/png'};base64,${markBuffer.toString('base64')}" x="${pos.x}" y="${pos.y}" width="${targetWidth}" height="${targetHeight}" opacity="${opacity}" preserveAspectRatio="xMidYMid meet"/>`;
  } else {
    const fontSize = clampNumber(config.watermarkFontSize, 14, 96, 32);
    const margin = Math.max(18, Math.round(fontSize * 0.75));
    const pos = svgTextPosition(config.watermarkPosition || 'bottom-right', width, height, margin);
    watermarkMarkup = `<text x="${pos.x}" y="${pos.y}" text-anchor="${pos.anchor}" dominant-baseline="${pos.baseline}" font-family="Microsoft YaHei, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="rgba(255,255,255,${opacity})" stroke="rgba(0,0,0,${Math.min(0.85, opacity)})" stroke-width="${Math.max(2, Math.round(fontSize / 12))}" paint-order="stroke">${escapeXml(config.watermarkText)}</text>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><image href="data:${mime};base64,${input.toString('base64')}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>${watermarkMarkup}</svg>`;
  const rendered = nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
  if (rendered.isEmpty()) return filePath;
  const dir = path.join(app.getPath('temp'), 'buffer-publisher-watermark');
  await fs.mkdir(dir, { recursive: true });
  const out = path.join(dir, `${Date.now()}-${safeBaseName(filePath)}.png`);
  await fs.writeFile(out, rendered.toPNG());
  return out;
}
async function watermarkVideoFile(filePath = '', config = {}) {
  const ffmpeg = findFfmpeg();
  if (!ffmpeg) throw new Error('内置 ffmpeg 不可用，无法处理视频水印');
  const mode = config.watermarkMode === 'image' ? 'image' : 'text';
  if (mode === 'text' && !String(config.watermarkText || '').trim()) return filePath;
  if (mode === 'image' && (!config.watermarkImagePath || !fsSync.existsSync(config.watermarkImagePath))) return filePath;
  const dir = path.join(app.getPath('temp'), 'buffer-publisher-watermark');
  await fs.mkdir(dir, { recursive: true });
  const ext = path.extname(filePath).toLowerCase() || '.mp4';
  const out = path.join(dir, `${Date.now()}-${safeBaseName(filePath)}${ext}`);
  const opacity = clampNumber(config.watermarkOpacity, 0.15, 1, 0.72);
  let args;
  if (mode === 'image') {
    const scale = clampNumber(config.watermarkImageScale, 6, 60, 22) / 100;
    const pos = ffmpegOverlayPosition(config.watermarkPosition || 'bottom-right', 24);
    args = ['-y', '-i', filePath, '-i', config.watermarkImagePath, '-filter_complex', `[1:v]format=rgba,colorchannelmixer=aa=${opacity.toFixed(2)}[mark];[mark][0:v]scale2ref=w=main_w*${scale.toFixed(3)}:h=ow/mdar[wm][base];[base][wm]overlay=${pos.x}:${pos.y}`, '-c:a', 'copy', '-movflags', '+faststart', out];
  } else {
    const fontSize = clampNumber(config.watermarkFontSize, 14, 96, 32);
    const pos = ffmpegDrawtextPosition(config.watermarkPosition || 'bottom-right', Math.max(18, Math.round(fontSize * 0.75)));
    const vf = `drawtext=text='${escapeFfmpegText(config.watermarkText)}':fontcolor=white@${opacity.toFixed(2)}:fontsize=${fontSize}:borderw=${Math.max(2, Math.round(fontSize / 12))}:bordercolor=black@${Math.min(0.85, opacity).toFixed(2)}:x=${pos.x}:y=${pos.y}`;
    args = ['-y', '-i', filePath, '-vf', vf, '-c:a', 'copy', '-movflags', '+faststart', out];
  }
  await execFileAsync(ffmpeg, args, { timeout: 10 * 60 * 1000, maxBuffer: 1024 * 1024 * 8 });
  return out;
}

async function uploadWithFallback(file, config) {
  const preparedFile = await prepareWatermarkedMedia(file, config);
  const timeoutMs = Number(config.uploadTimeoutMs || 60000);
  const expectedKind = assetKindFromMime(preparedFile.mimeType || mimeFromPath(preparedFile.path));
  if (!expectedKind) throw new Error(`不支持的文件类型：${file.name}`);
  const uploaders = (config.uploaders?.length ? config.uploaders : DEFAULT_UPLOADERS).filter(Boolean);
  const attempts = [];
  for (const uploader of uploaders) {
    try {
      let url;
      if (uploader === 'pixeldrain') url = await uploadPixeldrain(preparedFile.path, timeoutMs, config.pixeldrainApiKey || '');
      else if (uploader === 'catbox') url = await uploadCatbox(preparedFile.path, timeoutMs);
      else if (uploader === 'litterbox') url = await uploadLitterbox(preparedFile.path, timeoutMs, config.litterboxTime || '72h');
      else if (uploader === 'tempsh') url = await uploadTempSh(preparedFile.path, timeoutMs);
      else if (uploader === '0x0') url = await upload0x0(preparedFile.path, timeoutMs);
      else if (uploader === 'fileio') url = await uploadFileIo(preparedFile.path, timeoutMs, config.fileioExpires || '3d');
      else throw new Error(`未知上传源：${uploader}`);
      const checked = await validateMediaUrl(url.trim(), expectedKind, timeoutMs);
      return { ...checked, uploader, kind: expectedKind, originalName: file.name, watermarked: !!preparedFile.watermarked, optimized: !!preparedFile.optimized, uploadSize: preparedFile.size };
    } catch (err) {
      attempts.push({ uploader, error: err.message });
    }
  }
  const detail = attempts.map(a => `${a.uploader}: ${a.error}`).join('\n');
  throw new Error(`所有上传源都失败：\n${detail}`);
}


function normalizeOllamaUrl(url) {
  return String(url || 'http://127.0.0.1:11434').trim().replace(/\/+$/, '') || 'http://127.0.0.1:11434';
}

async function ollamaFetch(config, pathName, options = {}) {
  const timeoutMs = Number(config.ollamaTimeoutMs || 120000);
  return withTimeout(signal => fetch(`${normalizeOllamaUrl(config.ollamaUrl)}${pathName}`, { ...options, signal }), timeoutMs);
}

async function listOllamaModels(config) {
  const res = await ollamaFetch(config, '/api/tags');
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`Ollama 返回非 JSON：${text.slice(0, 200)}`); }
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}: ${text.slice(0, 200)}`);
  return (json.models || []).map(model => ({ name: model.name, modifiedAt: model.modified_at, size: model.size }));
}

async function generateOllamaTitle(config, images, prompt) {
  if (!config.ollamaEnabled) throw new Error('请先在 Ollama 设置页启用 Ollama');
  if (!config.ollamaModel) throw new Error('请先在 Ollama 设置页选择模型');
  if (!images?.length) throw new Error('没有可提交给 Ollama 的图片帧');
  const body = {
    model: config.ollamaModel,
    prompt: prompt || config.ollamaPrompt || defaultConfig().ollamaPrompt,
    images,
    stream: false,
    options: { temperature: 0.4 }
  };
  const res = await ollamaFetch(config, '/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`Ollama 返回非 JSON：${text.slice(0, 300)}`); }
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}: ${json.error || text.slice(0, 300)}`);
  const title = String(json.response || '').trim().replace(/^标题[:：]\s*/i, '').replace(/^[\'\"“”]+|[\'\"“”]+$/g, '').trim();
  if (!title) throw new Error('Ollama 没有返回标题');
  const promptTokens = Number(json.prompt_eval_count || 0);
  const outputTokens = Number(json.eval_count || 0);
  const totalTokens = promptTokens + outputTokens;
  const durationMs = json.total_duration ? Math.round(Number(json.total_duration) / 1e6) : null;
  const usage = await recordOllamaUsage({
    model: config.ollamaModel,
    promptTokens,
    outputTokens,
    totalTokens,
    durationMs
  });
  return { title, model: config.ollamaModel, usage: usage.latest, usageSummary: usage };
}

ipcMain.handle('config:get', async () => readConfig());
ipcMain.handle('config:save', async (_evt, patch) => writeConfig({ ...(await readConfig()), ...patch }));
ipcMain.handle('files:pick', pickFiles);
ipcMain.handle('files:pick-watermark-image', pickWatermarkImage);
ipcMain.handle('files:fromPaths', async (_evt, filePaths) => Promise.all(filePaths.map(async filePath => {
  const stat = await fs.stat(filePath);
  return { path: filePath, name: path.basename(filePath), size: stat.size, mimeType: mimeFromPath(filePath) };
})));
ipcMain.handle('shell:openExternal', async (_evt, url) => {
  const safeUrl = safeHttpUrl(url);
  if (!safeUrl) throw new Error('无效链接');
  return shell.openExternal(safeUrl);
});
ipcMain.handle('ads:sidebar', getSidebarAd);
ipcMain.handle('ollama:models', async () => listOllamaModels(await readConfig()));
ipcMain.handle('ollama:title', async (_evt, payload) => generateOllamaTitle(await readConfig(), payload.images || [], payload.prompt || ''));
ipcMain.handle('ollama:usage', async () => summarizeOllamaUsage(await readOllamaUsage()));

ipcMain.handle('buffer:test', async () => {
  const config = await readConfig();
  const account = await getOrganizations(requireKey(config));
  return account;
});

ipcMain.handle('buffer:usage', async () => summarizeUsage(await readUsage()));

ipcMain.handle('buffer:channels', async (_evt, organizationId) => {
  const config = await readConfig();
  return getChannels(requireKey(config), organizationId);
});

ipcMain.handle('buffer:posts', async (_evt, organizationId) => {
  const config = await readConfig();
  const apiKey = requireKey(config);
  const [pending, sent] = await Promise.all([
    listBufferPosts(apiKey, organizationId, ['draft', 'scheduled']),
    listBufferPosts(apiKey, organizationId, ['sent'])
  ]);
  return { pending: pending.posts, sent: sent.posts };
});

ipcMain.handle('media:upload', async (_evt, files) => {
  const config = await readConfig();
  const out = [];
  for (const file of files) out.push(await uploadWithFallback(file, config));
  return out;
});

ipcMain.handle('post:create', async (_evt, payload) => {
  const config = await readConfig();
  const apiKey = requireKey(config);
  const results = [];
  for (const channelId of payload.channelIds) {
    try {
      const post = await createBufferPost(apiKey, { ...payload, channelId });
      results.push({ channelId, ok: true, post });
    } catch (err) {
      results.push({ channelId, ok: false, error: err.message });
    }
  }
  return results;
});
