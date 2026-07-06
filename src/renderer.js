const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

const state = {
  config: {},
  account: null,
  organizations: [],
  channels: [],
  posts: { pending: [], sent: [] },
  files: [],
  uploadedAssets: [],
  ollamaModels: [],
  aiTitle: '',
  sidebarAd: { items: [], index: 0, version: '', current: null, rotateTimer: null, refreshTimer: null }
};

const uploaderNames = {
  pixeldrain: 'Pixeldrain',
  catbox: 'Catbox',
  litterbox: 'Litterbox',
  tempsh: 'temp.sh',
  '0x0': '0x0.st',
  fileio: 'file.io'
};
const defaultUploaders = ['pixeldrain', 'catbox', 'litterbox', 'tempsh', '0x0', 'fileio'];

const i18n = {
  zh: {
    appTitle: 'Buffer发布器', navCompose: '发布', navPosts: '文章列表', navLogs: '运行日志', navSettings: '设置', navWatermark: '水印设置', navOllama: 'Ollama', navAbout: '关于软件', aboutTitle: '关于软件', aboutDesc: '了解 Buffer发布器的用途、工作方式和官方网站。', aboutPurpose: '软件用途', aboutPurposeText: 'Buffer发布器用于把图片、视频和文章内容批量发布到 Buffer。它会先将本地媒体转换为可被 Buffer 读取的公网直链，再提交到 Buffer 队列或按指定时间定时发布，适合集中管理多平台社交媒体内容。', aboutFeature1: '支持选择多个 Buffer 账号/频道后一次发布。', aboutFeature2: '支持临时媒体上传源、上传超时和本机 API 用量查看。', aboutFeature3: '支持图片/视频水印，以及本机 Ollama 自动生成标题建议。', officialSite: '官方网站', openOfficialSite: '打开官方网站', langButton: 'EN', hint: '官方 Buffer API + 临时直链上传',
    composeTitle: '创建文章', composeDesc: '先上传媒体获取直链，再提交到 Buffer 队列或定时发布。', refreshAccount: '刷新账号', uploadOnly: '只上传媒体', publish: '上传并发布到 Buffer', progressReady: '准备中...',
    orgLabel: '组织 / Organization', channelsEmpty: '还没有读取账号。请先到“设置”填写 Buffer Personal API Key，然后点击顶部“刷新账号”。读取成功后，这里会显示已绑定账号。',
    modeLabel: '发布方式', modeQueue: '加入 Buffer 队列', modeSchedule: '指定日期时间发布', dueAtLabel: '发布时间（本地时间，会自动转 UTC）', scheduleWarning: '定时发布前，软件会先把媒体上传成公网直链并提交给 Buffer。不同上传源保存时间不同；如果定时很久以后发布，建议优先使用 Pixeldrain/Catbox，并在 Buffer 队列里确认媒体已显示成功。',
    postTextLabel: '文章正文', postTextPlaceholder: '输入要发布到 Buffer 的内容...', mediaLabel: '图片 / 视频', pickFiles: '选择文件', dropStrong: '拖拽图片/视频到这里', dropHint: '也可以点击右上角“选择文件”', filesEmpty: '还没有添加图片或视频。可以拖拽文件到上方区域，或点击“选择文件”。', mediaLimitHint: 'Buffer 官方目前每篇文章最多支持 1 个视频；多图通常可以，但多视频请拆成多篇文章发布。', mediaLimitHintShort: 'Buffer 每篇最多 1 个视频，多视频请拆成多篇。', remove: '移除',
    postsTitle: '文章列表', postsDesc: '查看 Buffer 里还没有发布的文章，以及已经发布的文章。', refreshPosts: '刷新文章列表', pending: '未发布', sent: '已发布', pendingEmpty: '没有未发布文章，或还没有读取。', sentEmpty: '没有已发布文章，或还没有读取。', postsInitial: '还没有读取。请先刷新账号，再点击“刷新文章列表”。', noText: '(无正文)', unknownChannel: '未知账号', mediaCount: '个媒体', countUnit: '条',
    logsTitle: '运行日志', logsDesc: '上传、发布、错误信息都会显示在这里。', clearLog: '清空日志',
    settingsTitle: '设置', settingsDesc: 'API Key 保存在本机 Electron 用户数据目录，不写进项目代码。', show: '显示', hide: '隐藏', saveSettings: '保存设置', testKey: '测试并读取组织', logoutKey: '退出 API Key', openBufferApi: '打开 Buffer API 设置页',
    usageTitle: 'Buffer API 用量', refreshUsage: '刷新用量', usageDesc: 'Buffer 官方限制按客户端计算：15 分钟、24 小时、30 天滚动窗口。下方“响应头剩余量”来自 Buffer 最近一次 API 响应；“本机统计”是这个软件在本机记录的调用次数。', local15: '本机 15 分钟调用', local24: '本机 24 小时调用', local30: '本机 30 天调用', errors30: '30 天错误次数', remaining: '响应头剩余量', headerLimit: '响应头上限', unknown: '未知', noData: '暂无', officialLimits: '官方限制：Free = 15分钟100 / 24小时100 / 30天3000；Essentials = 15分钟100 / 24小时250 / 30天7500；Team = 15分钟100 / 24小时500 / 30天15000。', resetAt: '最近重置时间', updatedAt: '最近更新', lastError: '最近错误',
    uploadSettings: '临时上传源设置', saveUploadSettings: '保存上传源设置', uploadSettingsDesc: '按列表顺序尝试；失败、超时、或返回的不是图片/视频直链，就自动试下一个。', pixeldrainDesc: '保存时间：60 天未访问才删除；下载/访问会续期。上传需要 API Key。', catboxDesc: '保存时间：长期保存（适合兜底，但不保证永久 SLA）。', retention: '保存时间：', tempDesc: '保存时间：固定 3 天。', zeroDesc: '保存时间：服务端自动管理，通常至少约 30 天，软件不能指定。', oneHour: '1 小时', twelveHours: '12 小时', oneDay: '1 天', threeDays: '3 天', sevenDays: '7 天', fourteenDays: '14 天', thirtyDays: '30 天', timeoutLabel: '单个上传源超时（毫秒）',
    apiSaved: '设置已保存。', uploadSaved: '上传源设置已保存。', startup: '软件已启动。请先到设置填写 Buffer API Key。', autoLogin: '检测到已保存 Buffer API Key，正在自动登录并读取账号...', ollamaTitle: 'Ollama 设置', ollamaDesc: '对接安装在电脑里的 Ollama，用图片或视频截帧自动生成标题建议。', refreshOllamaModels: '读取模型', saveOllamaSettings: '保存 Ollama 设置', testOllama: '测试连接', aiTitleLabel: 'AI 标题建议', useAiTitle: '使用标题', regenerateAiTitle: '重新生成',
    ollamaEnabled: '启用 Ollama 自动取标题', ollamaUrlLabel: 'Ollama 地址', ollamaModelLabel: '视觉模型', ollamaNoModels: '请先读取模型', ollamaStatusIdle: '还没有测试连接。', ollamaUsageTitle: 'Ollama Token 用量（本机统计）', refreshOllamaUsage: '刷新本机用量', ollamaModelHelp: '建议使用支持图片的视觉模型，例如 llava、llava:13b、bakllava、qwen2.5vl 等。模型需要先在 Ollama 里 pull 好。', ollamaPromptLabel: '取标题要求 / Ollama 提示词', ollamaPromptPlaceholder: '例如：请根据图片/视频内容，生成一个适合社交媒体发布的中文标题。标题要简短、吸引人，不要超过 20 个字，只输出标题，不要解释。', ollamaPromptHelp: '这里填写的是给 Ollama 的取标题规则。你可以要求标题语言、长度、风格、是否带表情、是否只输出标题等。', ollamaTimeoutLabel: '超时时间（毫秒）', ollamaPrivacyHelp: '图片会直接提交给本机 Ollama；视频会在本机按总时长平均截取 8 张图后提交。不会上传到外网。', latestPromptTokens: '最近输入 Token', latestOutputTokens: '最近输出 Token', latestTotalTokens: '最近总 Token', localTotalTokens30d: '30 天累计 Token', latestModel: '最近模型', latestDuration: '最近耗时', localCalls30d: '30 天调用', localPrompt30d: '30 天输入', localOutput30d: '30 天输出', seconds: '秒', times: '次', ollamaUsageRefreshed: 'Ollama 本机用量已刷新。', ollamaUsageLoadFailed: '读取 Ollama 用量失败', ollamaConnecting: '正在连接 Ollama 并读取模型...', ollamaConnected: '连接成功，读取到 {count} 个模型。', ollamaConnectFailed: '连接失败', ollamaSettingsSaved: 'Ollama 设置已保存。', ollamaSettingsSaveFailed: '保存失败', aiTitleSource: '由本机 Ollama 根据已选择的图片/视频帧生成。', channelUnavailable: '不可用'
  },
  en: {
    appTitle: 'Buffer Publisher', navCompose: 'Compose', navPosts: 'Posts', navLogs: 'Logs', navSettings: 'Settings', navWatermark: 'Watermark', navOllama: 'Ollama', navAbout: 'About', aboutTitle: 'About', aboutDesc: 'Learn what Buffer Publisher does, how it works, and the official website.', aboutPurpose: 'Purpose', aboutPurposeText: 'Buffer Publisher helps publish images, videos, and post text to Buffer in batches. It uploads local media as public direct links that Buffer can read, then submits posts to the Buffer queue or schedules them for a specific time, making multi-platform social publishing easier to manage.', aboutFeature1: 'Publish to multiple Buffer accounts/channels in one workflow.', aboutFeature2: 'Use temporary media upload sources, upload timeouts, and local API usage stats.', aboutFeature3: 'Add image/video watermarks and generate title suggestions with local Ollama.', officialSite: 'Official website', openOfficialSite: 'Open Official Website', langButton: '中文', hint: 'Official Buffer API + temporary direct media links',
    composeTitle: 'Create Post', composeDesc: 'Upload media to get direct links, then submit to the Buffer queue or schedule.', refreshAccount: 'Refresh Account', uploadOnly: 'Upload Media Only', publish: 'Upload & Publish to Buffer', progressReady: 'Ready...',
    orgLabel: 'Organization', channelsEmpty: 'No account loaded yet. Go to Settings, enter your Buffer Personal API Key, then click Refresh Account. Connected channels will appear here.',
    modeLabel: 'Publish Mode', modeQueue: 'Add to Buffer Queue', modeSchedule: 'Schedule for Date/Time', dueAtLabel: 'Publish Time (local time, auto-converted to UTC)', scheduleWarning: 'Before scheduling, the app uploads media to public direct links and submits them to Buffer. Retention varies by host; for far-future schedules, prefer Pixeldrain/Catbox and confirm the media appears correctly in your Buffer queue.',
    postTextLabel: 'Post Text', postTextPlaceholder: 'Enter the content to publish through Buffer...', mediaLabel: 'Images / Videos', pickFiles: 'Choose Files', dropStrong: 'Drag images/videos here', dropHint: 'Or click “Choose Files” in the top-right', filesEmpty: 'No images or videos added yet. Drag files above or click “Choose Files”.', mediaLimitHint: 'Buffer currently supports at most 1 video per post. Multiple images are usually OK, but multiple videos should be split into separate posts.', mediaLimitHintShort: 'Buffer supports max 1 video per post. Split multiple videos.', remove: 'Remove',
    postsTitle: 'Posts', postsDesc: 'View unpublished posts and already published posts from Buffer.', refreshPosts: 'Refresh Posts', pending: 'Unpublished', sent: 'Published', pendingEmpty: 'No unpublished posts, or not loaded yet.', sentEmpty: 'No published posts, or not loaded yet.', postsInitial: 'Not loaded yet. Refresh account first, then click Refresh Posts.', noText: '(No text)', unknownChannel: 'Unknown channel', mediaCount: 'media item(s)', countUnit: 'posts',
    logsTitle: 'Logs', logsDesc: 'Uploads, publishing results, and errors appear here.', clearLog: 'Clear Logs',
    settingsTitle: 'Settings', settingsDesc: 'API keys are stored in this computer’s Electron user data folder, not in project source code.', show: 'Show', hide: 'Hide', saveSettings: 'Save Settings', testKey: 'Test & Load Organizations', logoutKey: 'Log out API Key', openBufferApi: 'Open Buffer API Settings',
    usageTitle: 'Buffer API Usage', refreshUsage: 'Refresh Usage', usageDesc: 'Buffer limits are per client across rolling 15-minute, 24-hour, and 30-day windows. “Header remaining” comes from the latest Buffer API response; “local stats” are calls recorded by this app on this computer.', local15: 'Local 15-min calls', local24: 'Local 24-hour calls', local30: 'Local 30-day calls', errors30: '30-day errors', remaining: 'Header remaining', headerLimit: 'Header limit', unknown: 'Unknown', noData: 'No data', officialLimits: 'Official limits: Free = 100/15min, 100/24h, 3000/30d; Essentials = 100/15min, 250/24h, 7500/30d; Team = 100/15min, 500/24h, 15000/30d.', resetAt: 'Reset time', updatedAt: 'Updated', lastError: 'Last error',
    uploadSettings: 'Temporary Upload Sources', saveUploadSettings: 'Save Upload Sources', uploadSettingsDesc: 'Sources are tried in order. If one fails, times out, or does not return an image/video direct link, the app tries the next one.', pixeldrainDesc: 'Retention: deleted after 60 days without access; downloads/views extend retention. Requires API Key for upload.', catboxDesc: 'Retention: long-term storage (good fallback, but no permanent SLA).', retention: 'Retention:', tempDesc: 'Retention: fixed 3 days.', zeroDesc: 'Retention: managed by server, usually at least around 30 days; cannot be configured by this app.', oneHour: '1 hour', twelveHours: '12 hours', oneDay: '1 day', threeDays: '3 days', sevenDays: '7 days', fourteenDays: '14 days', thirtyDays: '30 days', timeoutLabel: 'Per-source timeout (ms)',
    apiSaved: 'Settings saved.', uploadSaved: 'Upload source settings saved.', startup: 'App started. Please enter your Buffer API Key in Settings.', autoLogin: 'Saved Buffer API Key detected. Auto-loading account...', ollamaTitle: 'Ollama Settings', ollamaDesc: 'Connect to Ollama on this computer and generate title suggestions from images or video frames.', refreshOllamaModels: 'Load Models', saveOllamaSettings: 'Save Ollama Settings', testOllama: 'Test Connection', aiTitleLabel: 'AI Title Suggestion', useAiTitle: 'Use Title', regenerateAiTitle: 'Regenerate',
    ollamaEnabled: 'Enable Ollama title suggestions', ollamaUrlLabel: 'Ollama URL', ollamaModelLabel: 'Vision Model', ollamaNoModels: 'Load models first', ollamaStatusIdle: 'Connection has not been tested yet.', ollamaUsageTitle: 'Ollama Token Usage (local stats)', refreshOllamaUsage: 'Refresh Local Usage', ollamaModelHelp: 'Use a vision-capable model such as llava, llava:13b, bakllava, or qwen2.5vl. Pull the model in Ollama first.', ollamaPromptLabel: 'Title Requirements / Ollama Prompt', ollamaPromptPlaceholder: 'Example: Generate a short, catchy English social media title from the image/video content. Keep it under 20 words. Output only the title, no explanation.', ollamaPromptHelp: 'This field tells Ollama how to generate the title: language, length, tone, emoji rules, and whether to output only the title.', ollamaTimeoutLabel: 'Timeout (ms)', ollamaPrivacyHelp: 'Images are sent directly to local Ollama; videos are split into 8 equal time segments and sampled locally before sending. Nothing is uploaded to the public internet.', latestPromptTokens: 'Latest input tokens', latestOutputTokens: 'Latest output tokens', latestTotalTokens: 'Latest total tokens', localTotalTokens30d: '30-day total tokens', latestModel: 'Latest model', latestDuration: 'Latest duration', localCalls30d: '30-day calls', localPrompt30d: '30-day input', localOutput30d: '30-day output', seconds: 'sec', times: 'calls', ollamaUsageRefreshed: 'Ollama local usage refreshed.', ollamaUsageLoadFailed: 'Failed to load Ollama usage', ollamaConnecting: 'Connecting to Ollama and loading models...', ollamaConnected: 'Connected. Loaded {count} model(s).', ollamaConnectFailed: 'Connection failed', ollamaSettingsSaved: 'Ollama settings saved.', ollamaSettingsSaveFailed: 'Save failed', aiTitleSource: 'Generated locally by Ollama from the selected images/video frames.', channelUnavailable: 'Unavailable'
  }
};

function tr(key) {
  return i18n[state.config.language || 'zh']?.[key] || i18n.zh[key] || key;
}

function log(line, reset = false) {
  const box = $('#log');
  const text = `[${new Date().toLocaleTimeString()}] ${line}`;
  box.textContent = reset ? text : `${box.textContent}${box.textContent ? '\n' : ''}${text}`;
  box.scrollTop = box.scrollHeight;
}

function setBusy(busy) {
  ['#refreshChannels', '#refreshPosts', '#refreshUsage', '#refreshOllamaModels', '#refreshOllamaUsage', '#testOllama', '#pickFiles', '#uploadOnly', '#publish', '#saveSettings', '#saveUploadSettings', '#saveOllamaSettings', '#testKey', '#logoutKey', '#regenerateAiTitle', '#saveWatermarkSettings', '#pickWatermarkImage'].forEach(sel => { const el = $(sel); if (el) el.disabled = busy; });
}

function setProgress(value, text = '') {
  const wrap = $('#progressWrap');
  const bar = $('#progressBar');
  const percent = Math.max(0, Math.min(100, Math.round(value)));
  wrap.classList.remove('hidden');
  bar.value = percent;
  $('#progressPercent').textContent = `${percent}%`;
  if (text) $('#progressText').textContent = text;
}

function hideProgressLater() {
  setTimeout(() => $('#progressWrap').classList.add('hidden'), 1600);
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes; let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`;
}

function switchTab(name) {
  $$('.tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === name));
  $$('.panel').forEach(panel => panel.classList.toggle('active', panel.id === name));
}

function setText(selector, key) {
  const el = $(selector);
  if (el) el.textContent = tr(key);
}

function applyLanguage() {
  const lang = state.config.language || 'zh';
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  document.title = tr('appTitle');
  setText('h1', 'appTitle');
  setText('[data-tab="compose"]', 'navCompose');
  setText('[data-tab="posts"]', 'navPosts');
  setText('[data-tab="logs"]', 'navLogs');
  setText('[data-tab="settings"]', 'navSettings');
  setText('[data-tab="watermark"]', 'navWatermark');
  setText('[data-tab="ollama"]', 'navOllama');
  setText('#languageToggle', 'langButton');
  setText('.hint', 'hint');

  setText('#compose h2', 'composeTitle');
  setText('#compose .topbar p', 'composeDesc');
  setText('#refreshChannels', 'refreshAccount');
  setText('#uploadOnly', 'uploadOnly');
  setText('#publish', 'publish');
  setText('#progressText', 'progressReady');
  setText('#aiTitleCard label', 'aiTitleLabel');
  setText('#aiTitleCard .small', 'aiTitleSource');
  setText('#useAiTitle', 'useAiTitle');
  setText('#regenerateAiTitle', 'regenerateAiTitle');
  setText('#compose .grid.two .card:nth-child(1) > label', 'orgLabel');
  setText('#compose .grid.two .card:nth-child(2) > label', 'modeLabel');
  $('#mode option[value="addToQueue"]').textContent = tr('modeQueue');
  $('#mode option[value="customScheduled"]').textContent = tr('modeSchedule');
  setText('#scheduleBox label', 'dueAtLabel');
  setText('#scheduleBox .warning', 'scheduleWarning');
  $('#postText').previousElementSibling.textContent = tr('postTextLabel');
  $('#postText').placeholder = tr('postTextPlaceholder');
  setText('#pickFiles', 'pickFiles');
  setText('#dropZone strong', 'dropStrong');
  setText('#dropZone span', 'dropHint');
  setText('.mediaLimitHint', 'mediaLimitHintShort');
  $('#dropZone').previousElementSibling.querySelector('label').textContent = tr('mediaLabel');

  setText('#posts h2', 'postsTitle');
  setText('#posts .topbar p', 'postsDesc');
  setText('#refreshPosts', 'refreshPosts');
  $('#pendingPosts').closest('.card').querySelector('label').textContent = tr('pending');
  $('#sentPosts').closest('.card').querySelector('label').textContent = tr('sent');

  setText('#about h2', 'aboutTitle');
  setText('#about .topbar p', 'aboutDesc');
  setText('#openOfficialSite', 'openOfficialSite');
  setText('#about .aboutCard > label', 'aboutPurpose');
  setText('#about .aboutCard > p', 'aboutPurposeText');
  setText('#about .aboutList li:nth-child(1)', 'aboutFeature1');
  setText('#about .aboutList li:nth-child(2)', 'aboutFeature2');
  setText('#about .aboutList li:nth-child(3)', 'aboutFeature3');
  setText('#about .officialSiteBox span', 'officialSite');

  setText('#logs h2', 'logsTitle');
  setText('#logs .topbar p', 'logsDesc');
  setText('#clearLog', 'clearLog');

  setText('#ollama h2', 'ollamaTitle');
  setText('#ollama .topbar p', 'ollamaDesc');
  setText('#refreshOllamaModels', 'refreshOllamaModels');
  setText('#saveOllamaSettings', 'saveOllamaSettings');
  setText('#testOllama', 'testOllama');
  setText('#refreshOllamaUsage', 'refreshOllamaUsage');
  setText('#ollamaEnabledText', 'ollamaEnabled');
  setText('#ollamaUrlLabel', 'ollamaUrlLabel');
  setText('#ollamaModelLabel', 'ollamaModelLabel');
  setText('#ollamaUsageTitle', 'ollamaUsageTitle');
  setText('#ollamaModelHelp', 'ollamaModelHelp');
  setText('#ollamaPromptLabel', 'ollamaPromptLabel');
  $('#ollamaPrompt').placeholder = tr('ollamaPromptPlaceholder');
  setText('#ollamaPromptHelp', 'ollamaPromptHelp');
  setText('#ollamaTimeoutLabel', 'ollamaTimeoutLabel');
  setText('#ollamaPrivacyHelp', 'ollamaPrivacyHelp');
  if (!$('#ollamaStatus').dataset.touched) setText('#ollamaStatus', 'ollamaStatusIdle');

  setText('#settings h2', 'settingsTitle');
  setText('#settings .topbar p', 'settingsDesc');
  setText('#toggleKey', $('#bufferApiKey').type === 'password' ? 'show' : 'hide');
  setText('#saveSettings', 'saveSettings');
  setText('#testKey', 'testKey');
  setText('#logoutKey', 'logoutKey');
  setText('#openBufferApi', 'openBufferApi');
  setText('#refreshUsage', 'refreshUsage');
  $('#refreshUsage').closest('.card').querySelector('label').textContent = tr('usageTitle');
  $('#refreshUsage').closest('.card').querySelector('p').textContent = tr('usageDesc');
  setText('#saveUploadSettings', 'saveUploadSettings');
  $('#saveUploadSettings').closest('.card').querySelector('label').textContent = tr('uploadSettings');
  $('#saveUploadSettings').closest('.card').querySelector('p').textContent = tr('uploadSettingsDesc');
  $$('.sourceSetting')[0].querySelector('span').textContent = tr('pixeldrainDesc');
  $$('.sourceSetting')[1].querySelector('span').textContent = tr('catboxDesc');
  $$('.sourceSetting')[2].querySelector('span').textContent = tr('retention');
  $$('.sourceSetting')[3].querySelector('span').textContent = tr('tempDesc');
  $$('.sourceSetting')[4].querySelector('span').textContent = tr('zeroDesc');
  $$('.sourceSetting')[5].querySelector('span').textContent = tr('retention');
  $('#litterboxTime option[value="1h"]').textContent = tr('oneHour');
  $('#litterboxTime option[value="12h"]').textContent = tr('twelveHours');
  $('#litterboxTime option[value="24h"]').textContent = tr('oneDay');
  $('#litterboxTime option[value="72h"]').textContent = tr('threeDays');
  $('#fileioExpires option[value="1d"]').textContent = tr('oneDay');
  $('#fileioExpires option[value="3d"]').textContent = tr('threeDays');
  $('#fileioExpires option[value="7d"]').textContent = tr('sevenDays');
  $('#fileioExpires option[value="14d"]').textContent = tr('fourteenDays');
  $('#fileioExpires option[value="30d"]').textContent = tr('thirtyDays');
  $('#uploadTimeoutMs').previousElementSibling.textContent = tr('timeoutLabel');

  renderChannels();
  renderFiles();
  renderPosts();
  renderOllamaModels();
  refreshOllamaUsage({ quiet: true });
  refreshUsage();
}

function renderUploaders() {
  const selected = state.config.uploaders?.length ? state.config.uploaders : defaultUploaders;
  $('#uploaders').innerHTML = defaultUploaders.map(id => `
    <label><input type="checkbox" value="${id}" ${selected.includes(id) ? 'checked' : ''}> ${uploaderNames[id]}</label>
  `).join('');
}

function renderOrganizations() {
  const select = $('#organizationSelect');
  select.innerHTML = state.organizations.map(org => `<option value="${org.id}">${escapeHtml(org.name || org.id)}</option>`).join('');
}

function renderOllamaModels() {
  const select = $('#ollamaModel');
  const configured = state.config.ollamaModel || '';
  const names = [...new Set([configured, ...state.ollamaModels.map(model => model.name)].filter(Boolean))];
  select.innerHTML = names.length
    ? names.map(name => `<option value="${escapeHtml(name)}" ${name === configured ? 'selected' : ''}>${escapeHtml(name)}</option>`).join('')
    : `<option value="">${escapeHtml(tr('ollamaNoModels'))}</option>`;
}

function renderAiTitle(title = state.aiTitle) {
  state.aiTitle = title || '';
  $('#aiTitle').textContent = state.aiTitle;
  $('#aiTitleCard').classList.toggle('hidden', !state.aiTitle);
}

function renderChannels() {
  const box = $('#channels');
  if (!state.channels.length) {
    box.className = 'channels empty compactEmpty';
    box.textContent = tr('channelsEmpty');
    return;
  }
  box.className = 'channels';
  box.innerHTML = state.channels.map(ch => {
    const disabled = ch.isDisconnected || ch.isLocked;
    const label = ch.displayName || ch.name || ch.descriptor || ch.id;
    return `
      <label class="channel ${disabled ? 'locked' : ''}">
        <input type="checkbox" value="${ch.id}" ${disabled ? 'disabled' : ''}>
        <img src="${ch.avatar || ''}" onerror="this.style.display='none'">
        <div><strong>${escapeHtml(label)}</strong><span>${escapeHtml(ch.service)} · ${escapeHtml(ch.type)}${disabled ? ` · ${escapeHtml(tr('channelUnavailable'))}` : ''}</span></div>
      </label>
    `;
  }).join('');
}

function renderFiles() {
  const box = $('#files');
  if (!state.files.length) {
    box.className = 'files empty compactEmpty';
    box.textContent = tr('filesEmpty');
    return;
  }
  box.className = 'files';
  box.innerHTML = state.files.map((file, index) => {
    const uploaded = state.uploadedAssets[index];
    const previewUrl = window.appApi.fileUrl(file.path);
    const isImage = (file.mimeType || '').startsWith('image/');
    const isVideo = (file.mimeType || '').startsWith('video/');
    const preview = isImage
      ? `<img class="filePreview" src="${escapeHtml(previewUrl)}" alt="${escapeHtml(file.name)}">`
      : isVideo
        ? `<video class="filePreview" src="${escapeHtml(previewUrl)}" muted preload="metadata"></video>`
        : `<div class="filePreview filePreviewIcon">FILE</div>`;
    return `
      <div class="fileItem">
        ${preview}
        <div class="fileInfo">
          <strong>${escapeHtml(file.name)}</strong>
          <div class="small">${escapeHtml(file.mimeType)} · ${formatBytes(file.size)}</div>
        </div>
        <button data-remove-file="${index}">${escapeHtml(tr('remove'))}</button>
        ${uploaded ? `<div class="url">${escapeHtml(uploaded.uploader)} → ${escapeHtml(uploaded.url)}</div>` : ''}
      </div>
    `;
  }).join('');
  $$('[data-remove-file]').forEach(btn => btn.onclick = () => {
    const idx = Number(btn.dataset.removeFile);
    state.files.splice(idx, 1);
    state.uploadedAssets.splice(idx, 1);
    renderFiles();
  });
}

function postAssetUrl(asset) {
  const source = asset?.source || asset?.url || asset?.thumbnailUrl || '';
  if (typeof source === 'string') return source;
  return source?.url || source?.src || source?.downloadUrl || source?.thumbnailUrl || '';
}

function renderPostAssets(post) {
  const assets = (post.assets || []).filter(Boolean);
  if (!assets.length) return '';
  const items = assets.map((asset, index) => {
    const url = postAssetUrl(asset);
    const mimeType = (asset.mimeType || '').toLowerCase();
    const kind = mimeType.startsWith('video/') ? 'video' : mimeType.startsWith('image/') ? 'image' : 'media';
    if (!url) {
      return `<div class="postMediaPlaceholder"><span>${escapeHtml(kind.toUpperCase())}</span></div>`;
    }
    if (kind === 'video') {
      return `
        <a class="postMedia" href="${escapeHtml(url)}" title="${escapeHtml(url)}" data-open-url="${escapeHtml(url)}">
          <video src="${escapeHtml(url)}" muted preload="metadata"></video>
          <span class="mediaBadge">VIDEO</span>
        </a>
      `;
    }
    return `
      <a class="postMedia" href="${escapeHtml(url)}" title="${escapeHtml(url)}" data-open-url="${escapeHtml(url)}">
        <img src="${escapeHtml(url)}" alt="media ${index + 1}" loading="lazy">
        <span class="mediaBadge">${escapeHtml(kind.toUpperCase())}</span>
      </a>
    `;
  }).join('');
  return `<div class="postMediaGrid">${items}</div>`;
}


function adImageUrl(url, version) {
  try {
    const next = new URL(url);
    next.searchParams.set('_fo_ad_v', version || Date.now());
    return next.toString();
  } catch {
    const sep = String(url).includes('?') ? '&' : '?';
    return `${url}${sep}_fo_ad_v=${encodeURIComponent(version || Date.now())}`;
  }
}

function renderSidebarAdItem() {
  const box = $('#sidebarAd');
  if (!box) return;
  const item = state.sidebarAd.items[state.sidebarAd.index];
  if (!item) {
    state.sidebarAd.current = null;
    box.classList.add('disabled');
    box.innerHTML = '<div class="sidebarAdPlaceholder">广告位<br>250×250</div>';
    return;
  }
  state.sidebarAd.current = item;
  box.classList.remove('disabled');
  box.title = item.title || item.alt || '广告';
  box.innerHTML = `<img src="${escapeHtml(adImageUrl(item.imageUrl, state.sidebarAd.version))}" alt="${escapeHtml(item.alt || item.title || '广告')}">`;
}

function scheduleSidebarAd(ad) {
  clearInterval(state.sidebarAd.rotateTimer);
  clearTimeout(state.sidebarAd.refreshTimer);
  state.sidebarAd.items = ad.enabled ? (ad.ads || []) : [];
  state.sidebarAd.index = 0;
  state.sidebarAd.version = ad.updatedAt || ad.version || Date.now();
  renderSidebarAdItem();
  if (state.sidebarAd.items.length > 1) {
    state.sidebarAd.rotateTimer = setInterval(() => {
      state.sidebarAd.index = (state.sidebarAd.index + 1) % state.sidebarAd.items.length;
      renderSidebarAdItem();
    }, Math.max(3, Number(ad.intervalSeconds) || 5) * 1000);
  }
  state.sidebarAd.refreshTimer = setTimeout(loadSidebarAd, Math.max(30, Number(ad.refreshSeconds) || 300) * 1000);
}

async function loadSidebarAd() {
  try {
    scheduleSidebarAd(await window.appApi.getSidebarAd());
  } catch {
    scheduleSidebarAd({ enabled: false, ads: [], intervalSeconds: 5, refreshSeconds: 300 });
  }
}

function bindPostMediaLinks() {
  $$('[data-open-url]').forEach(link => {
    link.onclick = event => {
      event.preventDefault();
      window.appApi.openExternal(link.dataset.openUrl);
    };
  });
}

function renderPostList(kind, posts) {
  const box = kind === 'pending' ? $('#pendingPosts') : $('#sentPosts');
  const count = kind === 'pending' ? $('#pendingCount') : $('#sentCount');
  count.textContent = posts.length ? `${posts.length} ${tr('countUnit')}` : '';
  if (!posts.length) {
    box.className = 'postList empty compactEmpty';
    box.textContent = kind === 'pending' ? tr('pendingEmpty') : tr('sentEmpty');
    return;
  }
  box.className = 'postList';
  box.innerHTML = posts.map(post => {
    const ch = state.channels.find(c => c.id === post.channelId);
    const channelName = ch?.displayName || ch?.name || post.channelId || tr('unknownChannel');
    const time = post.dueAt || post.createdAt;
    const assets = post.assets?.length ? ` · ${post.assets.length} ${tr('mediaCount')}` : '';
    return `
      <div class="postItem">
        <div class="row between"><strong>${escapeHtml(channelName)}</strong><span>${escapeHtml(post.status || '')}</span></div>
        ${renderPostAssets(post)}
        <p>${escapeHtml(post.text || tr('noText')).slice(0, 500)}</p>
        <div class="small">${time ? new Date(time).toLocaleString() : ''}${assets} · ID: ${escapeHtml(post.id)}</div>
      </div>
    `;
  }).join('');
  bindPostMediaLinks();
}

function renderPosts() {
  renderPostList('pending', state.posts.pending || []);
  renderPostList('sent', state.posts.sent || []);
}

function renderUsage(usage) {
  const local = usage?.local || {};
  const latest = usage?.latestRateLimit || {};
  const lastError = usage?.lastError;
  $('#usageCards').innerHTML = `
    <div class="usageCard"><span>${escapeHtml(tr('local15'))}</span><strong>${local.last15m ?? 0}</strong></div>
    <div class="usageCard"><span>${escapeHtml(tr('local24'))}</span><strong>${local.last24h ?? 0}</strong></div>
    <div class="usageCard"><span>${escapeHtml(tr('local30'))}</span><strong>${local.last30d ?? 0}</strong></div>
    <div class="usageCard"><span>${escapeHtml(tr('errors30'))}</span><strong>${local.totalErrors30d ?? 0}</strong></div>
    <div class="usageCard"><span>${escapeHtml(tr('remaining'))}</span><strong>${latest.remaining ?? tr('unknown')}</strong></div>
    <div class="usageCard"><span>${escapeHtml(tr('headerLimit'))}</span><strong>${latest.limit ?? tr('unknown')}</strong></div>
  `;
  $('#usageLimits').innerHTML = `
    <div>${escapeHtml(tr('officialLimits'))}</div>
    <div>${escapeHtml(tr('resetAt'))}：${latest.reset ? escapeHtml(new Date(latest.reset).toLocaleString()) : escapeHtml(tr('unknown'))}；${escapeHtml(tr('updatedAt'))}：${latest.updatedAt ? escapeHtml(new Date(latest.updatedAt).toLocaleString()) : escapeHtml(tr('noData'))}</div>
    ${lastError ? `<div>${escapeHtml(tr('lastError'))}：${escapeHtml(lastError.at)} · HTTP ${escapeHtml(lastError.status)} · ${escapeHtml(lastError.message)}</div>` : ''}
  `;
}

function renderOllamaUsage(summary) {
  const latest = summary?.latest || {};
  const local = summary?.local || {};
  $('#ollamaUsageCards').innerHTML = `
    <div class="usageCard"><span>${escapeHtml(tr('latestPromptTokens'))}</span><strong>${latest.promptTokens ?? 0}</strong></div>
    <div class="usageCard"><span>${escapeHtml(tr('latestOutputTokens'))}</span><strong>${latest.outputTokens ?? 0}</strong></div>
    <div class="usageCard"><span>${escapeHtml(tr('latestTotalTokens'))}</span><strong>${latest.totalTokens ?? 0}</strong></div>
    <div class="usageCard"><span>${escapeHtml(tr('localTotalTokens30d'))}</span><strong>${local.totalTokens30d ?? 0}</strong></div>
  `;
  const duration = latest.durationMs ? `${(latest.durationMs / 1000).toFixed(1)} ${tr('seconds')}` : tr('noData');
  $('#ollamaUsageMeta').innerHTML = `
    <div>${escapeHtml(tr('latestModel'))}：${escapeHtml(latest.model || tr('noData'))}；${escapeHtml(tr('latestDuration'))}：${escapeHtml(duration)}；${escapeHtml(tr('localCalls30d'))}：${local.calls30d ?? 0} ${escapeHtml(tr('times'))}</div>
    <div>${escapeHtml(tr('localPrompt30d'))}：${local.promptTokens30d ?? 0}；${escapeHtml(tr('localOutput30d'))}：${local.outputTokens30d ?? 0}</div>
  `;
}

async function refreshOllamaUsage({ quiet = false } = {}) {
  try {
    const usage = await window.appApi.getOllamaUsage();
    renderOllamaUsage(usage);
    if (!quiet) setOllamaStatus(tr('ollamaUsageRefreshed'), 'success');
  } catch (err) {
    setOllamaStatus(`${tr('ollamaUsageLoadFailed')}：${err.message}`, 'danger');
  }
}

async function refreshUsage() {
  try {
    const usage = await window.appApi.getBufferUsage();
    renderUsage(usage);
  } catch (err) {
    log(`读取 API 用量失败：${err.message}`);
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}


function setWatermarkMode(mode) {
  state.config.watermarkMode = mode === 'image' ? 'image' : 'text';
  renderWatermarkSettings();
}
function renderWatermarkSettings() {
  const mode = state.config.watermarkMode === 'image' ? 'image' : 'text';
  const enabled = $('#watermarkEnabled');
  if (!enabled) return;
  enabled.checked = !!state.config.watermarkEnabled;
  $('#watermarkText').value = state.config.watermarkText || '';
  $('#watermarkImagePath').value = state.config.watermarkImagePath || '';
  $('#watermarkPosition').value = state.config.watermarkPosition || 'bottom-right';
  $('#watermarkOpacity').value = state.config.watermarkOpacity ?? 0.72;
  $('#watermarkFontSize').value = state.config.watermarkFontSize || 32;
  $('#watermarkImageScale').value = state.config.watermarkImageScale || 22;
  $('#watermarkImages').checked = state.config.watermarkImages !== false;
  $('#watermarkVideos').checked = state.config.watermarkVideos !== false;
  $('#watermarkTextBox').classList.toggle('hidden', mode === 'image');
  $('#watermarkImageBox').classList.toggle('hidden', mode !== 'image');
  $('#watermarkFontSizeBox').classList.toggle('hidden', mode === 'image');
  $('#watermarkImageScaleBox').classList.toggle('hidden', mode !== 'image');
  $('#watermarkTextMode').classList.toggle('active', mode === 'text');
  $('#watermarkImageMode').classList.toggle('active', mode === 'image');
  const preview = $('#watermarkPreview');
  preview.innerHTML = '';
  const pos = state.config.watermarkPosition || 'bottom-right';
  if (mode === 'image' && state.config.watermarkImagePath) {
    const img = document.createElement('img');
    img.src = window.appApi.fileUrl(state.config.watermarkImagePath);
    img.className = `watermarkPreviewImage ${pos}`;
    img.style.width = `${state.config.watermarkImageScale || 22}%`;
    img.style.opacity = state.config.watermarkOpacity ?? 0.72;
    preview.appendChild(img);
  } else {
    const span = document.createElement('span');
    span.className = `watermarkPreviewText ${pos}`;
    span.textContent = state.config.watermarkText || '水印预览';
    span.style.opacity = state.config.watermarkOpacity ?? 0.72;
    span.style.fontSize = `${Math.min(42, Number(state.config.watermarkFontSize || 32))}px`;
    preview.appendChild(span);
  }
}
function collectWatermarkSettings() {
  return {
    watermarkEnabled: $('#watermarkEnabled').checked,
    watermarkMode: state.config.watermarkMode === 'image' ? 'image' : 'text',
    watermarkText: $('#watermarkText').value.trim(),
    watermarkImagePath: $('#watermarkImagePath').value.trim(),
    watermarkPosition: $('#watermarkPosition').value,
    watermarkOpacity: Number($('#watermarkOpacity').value || 0.72),
    watermarkFontSize: Number($('#watermarkFontSize').value || 32),
    watermarkImageScale: Number($('#watermarkImageScale').value || 22),
    watermarkImages: $('#watermarkImages').checked,
    watermarkVideos: $('#watermarkVideos').checked
  };
}
function showWatermarkStatus(message, type = 'info') {
  const box = $('#watermarkStatus');
  if (!box) return;
  box.textContent = message;
  box.className = `statusLine ${type}`;
  box.classList.remove('hidden');
  clearTimeout(showWatermarkStatus.timer);
  showWatermarkStatus.timer = setTimeout(() => box.classList.add('hidden'), 3200);
}

async function saveWatermarkSettings() {
  const patch = collectWatermarkSettings();
  if (patch.watermarkEnabled && patch.watermarkMode === 'text' && !patch.watermarkText) {
    showWatermarkStatus('请先填写水印文字。', 'danger');
    return alert('请先填写水印文字。');
  }
  if (patch.watermarkEnabled && patch.watermarkMode === 'image' && !patch.watermarkImagePath) {
    showWatermarkStatus('请先选择水印图片。', 'danger');
    return alert('请先选择水印图片。');
  }
  try {
    state.config = await window.appApi.saveConfig(patch);
    renderWatermarkSettings();
    showWatermarkStatus('水印设置已保存。', 'success');
    log('水印设置已保存。');
  } catch (err) {
    showWatermarkStatus(`保存失败：${err.message}`, 'danger');
    alert(`保存失败：${err.message}`);
  }
}
async function chooseWatermarkImage() {
  const filePath = await window.appApi.pickWatermarkImage();
  if (!filePath) return;
  state.config.watermarkMode = 'image';
  state.config.watermarkImagePath = filePath;
  renderWatermarkSettings();
}

async function loadConfig() {
  state.config = { language: 'zh', ...(await window.appApi.getConfig()) };
  $('#bufferApiKey').value = state.config.bufferApiKey || '';
  $('#litterboxTime').value = state.config.litterboxTime || '72h';
  $('#uploadTimeoutMs').value = state.config.uploadTimeoutMs || 60000;
  $('#pixeldrainApiKey').value = state.config.pixeldrainApiKey || '';
  $('#fileioExpires').value = state.config.fileioExpires || '3d';
  $('#ollamaEnabled').checked = !!state.config.ollamaEnabled;
  $('#ollamaUrl').value = state.config.ollamaUrl || 'http://127.0.0.1:11434';
  $('#ollamaPrompt').value = state.config.ollamaPrompt || '';
  $('#ollamaTimeoutMs').value = state.config.ollamaTimeoutMs || 120000;
  renderWatermarkSettings();
  renderUploaders();
  renderOllamaModels();
  applyLanguage();
}

async function saveSettings() {
  const uploaders = $$('#uploaders input:checked').map(input => input.value);
  state.config = await window.appApi.saveConfig({
    bufferApiKey: $('#bufferApiKey').value.trim(),
    uploaders,
    litterboxTime: $('#litterboxTime').value,
    uploadTimeoutMs: Number($('#uploadTimeoutMs').value || 60000),
    pixeldrainApiKey: $('#pixeldrainApiKey').value.trim(),
    fileioExpires: $('#fileioExpires').value,
    ollamaEnabled: $('#ollamaEnabled').checked,
    ollamaUrl: $('#ollamaUrl').value.trim() || 'http://127.0.0.1:11434',
    ollamaModel: $('#ollamaModel').value,
    ollamaPrompt: $('#ollamaPrompt').value.trim(),
    ollamaTimeoutMs: Number($('#ollamaTimeoutMs').value || 120000),
    ...collectWatermarkSettings()
  });
  renderOllamaModels();
  log(tr('apiSaved'));
}

async function refreshAccount(options = {}) {
  const { resetLog = true, showAlert = true, saveBefore = true } = options;
  setBusy(true);
  try {
    if (saveBefore) await saveSettings();
    log('正在测试 Buffer API Key...', resetLog);
    state.account = await window.appApi.testBuffer();
    state.organizations = state.account.organizations || [];
    renderOrganizations();
    log(`API Key 有效：${state.account.email || state.account.id}`);
    if (state.organizations[0]) {
      await loadChannels(state.organizations[0].id);
    }
    await refreshUsage();
  } catch (err) {
    log(`失败：${err.message}`);
    if (showAlert) alert(err.message);
  } finally { setBusy(false); }
}

async function loadPosts() {
  const orgId = $('#organizationSelect').value;
  if (!orgId) return alert('请先刷新账号并选择 Organization。');
  setBusy(true);
  try {
    log(`读取 Buffer 文章列表：${orgId}`);
    state.posts = await window.appApi.getPosts(orgId);
    renderPosts();
    log(`文章列表读取完成：未发布 ${state.posts.pending.length} 条，已发布 ${state.posts.sent.length} 条。`);
    await refreshUsage();
  } catch (err) {
    log(`读取文章列表失败：${err.message}`);
    alert(err.message);
  } finally { setBusy(false); }
}

async function loadChannels(orgId) {
  if (!orgId) return;
  setBusy(true);
  try {
    log(`读取媒体账号：${orgId}`);
    state.channels = await window.appApi.getChannels(orgId);
    renderChannels();
    log(`读取到 ${state.channels.length} 个媒体账号。`);
    state.posts = { pending: [], sent: [] };
    renderPosts();
    await refreshUsage();
  } catch (err) {
    log(`读取媒体账号失败：${err.message}`);
    alert(err.message);
  } finally { setBusy(false); }
}


function waitForMediaEvent(el, eventName, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`等待媒体 ${eventName} 超时`)), timeoutMs);
    el.addEventListener(eventName, () => { clearTimeout(timer); resolve(); }, { once: true });
    el.addEventListener('error', () => { clearTimeout(timer); reject(new Error('媒体读取失败')); }, { once: true });
  });
}

function canvasBase64FromElement(el, maxSize = 1024, quality = 0.82) {
  const sourceWidth = el.videoWidth || el.naturalWidth || el.width;
  const sourceHeight = el.videoHeight || el.naturalHeight || el.height;
  if (!sourceWidth || !sourceHeight) throw new Error('无法读取媒体尺寸');
  const scale = Math.min(1, maxSize / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality).replace(/^data:image\/jpeg;base64,/, '');
}

async function imageToOllamaFrame(file) {
  const img = new Image();
  img.src = window.appApi.fileUrl(file.path);
  await waitForMediaEvent(img, 'load');
  return canvasBase64FromElement(img);
}

async function videoToOllamaFrames(file, count = 8) {
  const video = document.createElement('video');
  video.src = window.appApi.fileUrl(file.path);
  video.muted = true;
  video.preload = 'metadata';
  video.playsInline = true;
  await waitForMediaEvent(video, 'loadedmetadata', 20000);
  const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : count;
  const segmentLength = duration / count;
  const frames = [];
  for (let i = 0; i < count; i++) {
    // Split the video into 8 equal time segments and sample the midpoint of each segment.
    const segmentMidpoint = segmentLength * i + segmentLength / 2;
    const time = Math.min(Math.max(0.1, segmentMidpoint), Math.max(0.1, duration - 0.1));
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('视频截帧超时')), 15000);
      video.onseeked = () => { clearTimeout(timer); resolve(); };
      video.onerror = () => { clearTimeout(timer); reject(new Error('视频读取失败')); };
      video.currentTime = time;
    });
    frames.push(canvasBase64FromElement(video, 768, 0.78));
  }
  video.removeAttribute('src');
  video.load();
  return frames;
}

async function filesToOllamaImages(files) {
  const images = [];
  for (const file of files) {
    if ((file.mimeType || '').startsWith('image/')) {
      images.push(await imageToOllamaFrame(file));
    } else if ((file.mimeType || '').startsWith('video/')) {
      images.push(...await videoToOllamaFrames(file, 8));
    }
  }
  return images;
}

function setOllamaStatus(message, tone = 'neutral') {
  const box = $('#ollamaStatus');
  if (!box) return;
  box.textContent = message;
  box.dataset.touched = '1';
  box.className = `statusLine ${tone}`;
}

async function refreshOllamaModels() {
  setBusy(true);
  try {
    setOllamaStatus(tr('ollamaConnecting'), 'info');
    await saveSettings();
    state.ollamaModels = await window.appApi.getOllamaModels();
    renderOllamaModels();
    if (!$('#ollamaModel').value && state.ollamaModels[0]) $('#ollamaModel').value = state.ollamaModels[0].name;
    const msg = tr('ollamaConnected').replace('{count}', state.ollamaModels.length);
    setOllamaStatus(msg, 'success');
    log(`Ollama ${msg}`);
  } catch (err) {
    const msg = `${tr('ollamaConnectFailed')}：${err.message}`;
    setOllamaStatus(msg, 'danger');
    log(`Ollama ${msg}`);
  } finally { setBusy(false); }
}

async function generateAiTitle(files = state.files, manual = false) {
  if (!files.length) return;
  if (!state.config.ollamaEnabled && !manual) return;
  setBusy(true);
  try {
    await saveSettings();
    if (!state.config.ollamaEnabled) throw new Error('请先在 Ollama 设置页启用 Ollama');
    log('Ollama 正在分析媒体并生成标题...');
    setProgress(6, 'Ollama 正在准备图片/视频帧...');
    const images = await filesToOllamaImages(files);
    if (!images.length) throw new Error('没有可提交给 Ollama 的图片或视频帧');
    setProgress(35, `提交 ${images.length} 张图片/视频帧给 Ollama...`);
    const result = await window.appApi.generateOllamaTitle({ images, prompt: state.config.ollamaPrompt });
    renderAiTitle(result.title);
    if (result.usageSummary) renderOllamaUsage(result.usageSummary);
    setProgress(100, 'Ollama 标题生成完成');
    hideProgressLater();
    log(`Ollama 标题建议：${result.title}`);
  } catch (err) {
    if (manual) alert(err.message);
    log(`Ollama 标题生成失败：${err.message}`);
    setProgress(100, 'Ollama 标题生成失败');
    hideProgressLater();
  } finally { setBusy(false); }
}

async function addFiles(files) {
  if (!files.length) return;
  state.files.push(...files);
  state.uploadedAssets = [];
  renderFiles();
  log(`已添加 ${files.length} 个文件。`);
  await generateAiTitle(files, false);
}

async function pickFiles() {
  const files = await window.appApi.pickFiles();
  await addFiles(files);
}

async function addDroppedFiles(fileList) {
  const paths = [...fileList].map(file => window.appApi.getDroppedFilePath(file)).filter(Boolean);
  if (!paths.length) return;
  const files = await window.appApi.filesFromPaths(paths);
  await addFiles(files);
}

async function ensureUploaded(progressBase = 0, progressSpan = 70) {
  if (!state.files.length) return [];
  if (state.uploadedAssets.length === state.files.length) {
    setProgress(progressBase + progressSpan, '媒体已上传，跳过上传步骤');
    return state.uploadedAssets;
  }
  setBusy(true);
  try {
    log(`开始上传 ${state.files.length} 个媒体文件...`);
    state.uploadedAssets = [];
    for (let i = 0; i < state.files.length; i++) {
      const file = state.files[i];
      const start = progressBase + (i / state.files.length) * progressSpan;
      setProgress(start, `上传媒体 ${i + 1}/${state.files.length}：${file.name}`);
      const [uploaded] = await window.appApi.uploadMedia([file]);
      state.uploadedAssets.push(uploaded);
      log(`${uploaded.originalName} 上传成功${uploaded.watermarked ? '（已加水印）' : ''}${uploaded.optimized ? '（已压缩）' : ''}：${uploaded.uploader} ${uploaded.url}`);
      renderFiles();
      setProgress(progressBase + ((i + 1) / state.files.length) * progressSpan, `媒体 ${i + 1}/${state.files.length} 上传完成`);
    }
    return state.uploadedAssets;
  } finally { setBusy(false); }
}

function selectedChannelIds() {
  return $$('#channels input:checked').map(input => input.value);
}

function countVideos(items) {
  return items.filter(item => (item.mimeType || '').startsWith('video/') || item.kind === 'video').length;
}

function checkBufferMediaLimits(items) {
  const videoCount = countVideos(items);
  const total = items.length;
  if (videoCount > 1) {
    alert('Buffer 官方限制：目前每篇文章只能包含 1 个视频。\n\n你现在选择了 ' + videoCount + ' 个视频。请只保留 1 个视频，或拆成多篇文章分别发布。');
    return false;
  }
  if (videoCount === 1 && total > 1) {
    return confirm('注意：Buffer 官方只保证每篇文章 1 个视频。\n\n你现在选择了 1 个视频 + ' + (total - 1) + ' 个其他媒体，部分平台/Buffer 可能只保留视频或忽略其他媒体。是否继续？');
  }
  return true;
}

async function publish() {
  const text = $('#postText').value.trim();
  const channelIds = selectedChannelIds();
  const mode = $('#mode').value;
  if (!text) return alert('请先填写文章正文。');
  if (!channelIds.length) return alert('请选择至少一个 Buffer 媒体账号。');
  if (!checkBufferMediaLimits(state.files)) return;
  let dueAt = null;
  if (mode === 'customScheduled') {
    if (!$('#dueAt').value) return alert('请选择发布日期和时间。');
    dueAt = new Date($('#dueAt').value).toISOString();
  }
  setBusy(true);
  try {
    log('准备发布...', true);
    setProgress(3, '准备发布...');
    const uploaded = await ensureUploaded(5, 65);
    if (!checkBufferMediaLimits(uploaded)) return;
    const assets = uploaded.map(item => ({ kind: item.kind, url: item.url }));
    setProgress(75, `提交到 Buffer：${channelIds.length} 个账号`);
    log(`提交到 Buffer：${channelIds.length} 个账号，${assets.length} 个媒体。`);
    const results = await window.appApi.createPost({ text, channelIds, mode, dueAt, assets });
    setProgress(95, '处理 Buffer 返回结果...');
    await refreshUsage();
    for (const result of results) {
      const ch = state.channels.find(c => c.id === result.channelId);
      const name = ch?.displayName || ch?.name || result.channelId;
      if (result.ok) {
        const acceptedCount = result.post.assets?.length ?? 0;
        log(`成功：${name} → post ${result.post.id}${result.post.dueAt ? `，发布时间 ${result.post.dueAt}` : ''}`);
        if (assets.length && acceptedCount < assets.length) {
          log(`提醒：${name} 只返回/显示了 ${acceptedCount}/${assets.length} 个媒体。Buffer 或目标平台可能忽略了超出限制的媒体。`);
        }
      } else log(`失败：${name} → ${result.error}`);
    }
    setProgress(100, '完成');
    hideProgressLater();
  } catch (err) {
    log(`发布失败：${err.message}`);
    setProgress(100, '失败');
    alert(err.message);
  } finally { setBusy(false); }
}

function bindEvents() {
  $$('.tab').forEach(btn => btn.onclick = () => switchTab(btn.dataset.tab));
  $('#saveSettings').onclick = saveSettings;
  $('#saveWatermarkSettings').onclick = saveWatermarkSettings;
  $('#pickWatermarkImage').onclick = chooseWatermarkImage;
  $('#watermarkTextMode').onclick = () => setWatermarkMode('text');
  $('#watermarkImageMode').onclick = () => setWatermarkMode('image');
  ['#watermarkEnabled', '#watermarkText', '#watermarkPosition', '#watermarkOpacity', '#watermarkFontSize', '#watermarkImageScale', '#watermarkImages', '#watermarkVideos'].forEach(sel => { const el = $(sel); if (el) el.oninput = () => { Object.assign(state.config, collectWatermarkSettings()); renderWatermarkSettings(); }; });
  $('#saveUploadSettings').onclick = async () => { await saveSettings(); log(tr('uploadSaved')); };
  $('#saveOllamaSettings').onclick = async () => {
    try {
      await saveSettings();
      setOllamaStatus(tr('ollamaSettingsSaved'), 'success');
      log(tr('ollamaSettingsSaved'));
    } catch (err) {
      setOllamaStatus(`${tr('ollamaSettingsSaveFailed')}：${err.message}`, 'danger');
    }
  };
  $('#refreshOllamaModels').onclick = refreshOllamaModels;
  $('#refreshOllamaUsage').onclick = refreshOllamaUsage;
  $('#testOllama').onclick = refreshOllamaModels;
  $('#regenerateAiTitle').onclick = () => generateAiTitle(state.files, true);
  $('#useAiTitle').onclick = () => {
    const title = state.aiTitle.trim();
    if (!title) return;
    const text = $('#postText').value.trim();
    $('#postText').value = text ? `${title}

${text}` : title;
  };
  $('#languageToggle').onclick = async () => {
    state.config.language = (state.config.language || 'zh') === 'zh' ? 'en' : 'zh';
    state.config = await window.appApi.saveConfig({ language: state.config.language });
    applyLanguage();
  };
  $('#testKey').onclick = () => refreshAccount();
  $('#refreshChannels').onclick = () => refreshAccount();
  $('#pickFiles').onclick = pickFiles;
  $('#uploadOnly').onclick = async () => {
    try {
      setProgress(0, '准备上传媒体...');
      await ensureUploaded(0, 100);
      setProgress(100, '媒体上传完成');
      hideProgressLater();
      log('媒体上传完成。');
    } catch (err) {
      setProgress(100, '上传失败');
      log(`上传失败：${err.message}`);
      alert(err.message);
    }
  };
  $('#publish').onclick = publish;
  $('#organizationSelect').onchange = e => loadChannels(e.target.value);
  $('#mode').onchange = e => $('#scheduleBox').classList.toggle('hidden', e.target.value !== 'customScheduled');
  $('#toggleKey').onclick = () => {
    const input = $('#bufferApiKey');
    input.type = input.type === 'password' ? 'text' : 'password';
    $('#toggleKey').textContent = input.type === 'password' ? tr('show') : tr('hide');
  };
  $('#logoutKey').onclick = async () => {
    if (!confirm('确定要退出/清空当前 Buffer API Key 吗？')) return;
    $('#bufferApiKey').value = '';
    state.account = null;
    state.organizations = [];
    state.channels = [];
    state.posts = { pending: [], sent: [] };
    renderOrganizations();
    renderChannels();
    renderPosts();
    await saveSettings();
    log('已退出 API Key，媒体账号列表已清空。');
  };
  $('#refreshPosts').onclick = loadPosts;
  $('#refreshUsage').onclick = refreshUsage;
  $('#clearLog').onclick = () => { $('#log').textContent = ''; };
  $('#openBufferApi').onclick = () => window.appApi.openExternal('https://publish.buffer.com/settings/api');
  $('#openOfficialSite').onclick = () => window.appApi.openExternal('https://cangify.com');
  $('#sidebarAd').onclick = () => { if (state.sidebarAd.current?.linkUrl) window.appApi.openExternal(state.sidebarAd.current.linkUrl); };
  $('#sidebarAd').onkeydown = event => { if ((event.key === 'Enter' || event.key === ' ') && state.sidebarAd.current?.linkUrl) window.appApi.openExternal(state.sidebarAd.current.linkUrl); };
  bindPostMediaLinks();

  const dropZone = $('#dropZone');
  ['dragenter', 'dragover'].forEach(name => dropZone.addEventListener(name, event => {
    event.preventDefault();
    dropZone.classList.add('dragover');
  }));
  ['dragleave', 'drop'].forEach(name => dropZone.addEventListener(name, event => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
  }));
  dropZone.addEventListener('drop', async event => {
    try { await addDroppedFiles(event.dataTransfer.files); }
    catch (err) { log(`拖拽添加文件失败：${err.message}`); alert(err.message); }
  });
}


(async function init() {
  bindEvents();
  await loadConfig();
  loadSidebarAd();
  renderFiles();
  renderPosts();
  await refreshUsage();
  if (state.config.bufferApiKey) {
    log(tr('autoLogin'), true);
    await refreshAccount({ resetLog: false, showAlert: false, saveBefore: false });
  } else {
    log(tr('startup'), true);
  }
})();
