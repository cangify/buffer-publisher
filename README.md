# Buffer发布器 / Buffer Publisher

[中文](#中文说明) | [English](#english-readme)

---

## 中文说明

Buffer发布器是一款桌面端社交媒体发布工具，用来把文字、图片和视频批量提交到 Buffer 队列，或按指定时间定时发布。软件基于 Electron 开发，支持 Windows 和 macOS，并内置中文/英文双语界面。

![创建文章](docs/screenshots/compose.png)

### 主要功能

- **Buffer 官方 API 发布**：填写 Buffer Personal API Key 后读取组织、账号和频道。
- **多账号/多频道发布**：可一次选择多个 Buffer 频道，每个频道单独创建文章。
- **队列或定时发布**：支持加入 Buffer 队列，也支持选择本地时间定时发布。
- **图片/视频上传直链**：本地媒体会先上传到可公网访问的临时直链，再提交给 Buffer。
- **多上传源 fallback**：支持 Pixeldrain、Catbox、Litterbox、temp.sh、0x0.st、file.io，失败或超时会自动尝试下一个。
- **水印处理**：支持图片/视频发布前自动添加文字水印或图片水印。
- **Ollama 本机 AI 标题建议**：可使用本机 Ollama 视觉模型，根据图片或视频截帧生成标题建议。
- **文章列表查看**：可读取 Buffer 未发布和已发布文章列表。
- **API 用量统计**：显示 Buffer API 和 Ollama 的本机调用统计。
- **中英文双语界面**：软件内置中文和英文两个界面版本，可一键切换。

### 软件截图

#### 创建文章

![创建文章](docs/screenshots/compose.png)

#### 设置 Buffer API 和上传源

![设置](docs/screenshots/settings.png)

#### 水印设置

![水印设置](docs/screenshots/watermark.png)

#### Ollama 标题建议

![Ollama](docs/screenshots/ollama.png)

#### 文章列表

![文章列表](docs/screenshots/posts.png)

### 界面语言

软件支持 **中文 / English** 双语界面。左侧菜单底部有语言切换按钮，可在中文界面和英文界面之间切换。

### 使用方法

#### 1. 下载并解压

在 GitHub Release 页面下载对应系统版本：

- Windows：下载 `BufferPublisher-windows-x64-版本号.zip`
- macOS Intel：下载 `BufferPublisher-mac-x64-版本号.zip`
- macOS Apple Silicon：下载 `BufferPublisher-mac-arm64-版本号.zip`

解压后运行 `Buffer发布器`。

#### 2. 获取 Buffer API Key

打开 Buffer API 设置页：

<https://publish.buffer.com/settings/api>

创建或复制 Personal API Key。

#### 3. 配置软件

1. 打开软件左侧的 **设置**。
2. 在 Buffer API Key 输入框粘贴 API Key。
3. 点击 **测试并读取组织**。
4. 读取成功后，回到 **发布** 页面点击 **刷新账号**。
5. 选择要发布的组织和频道。

API Key 只保存在本机 Electron 用户数据目录，不会写入项目代码或 GitHub 仓库。

#### 4. 发布文章

1. 在 **文章正文** 输入要发布的内容。
2. 拖入或选择图片/视频。
3. 选择发布方式：
   - **加入 Buffer 队列**：提交到 Buffer 队列。
   - **指定日期时间发布**：按选择的本地时间定时发布。
4. 点击 **上传并发布到 Buffer**。

如果只想先获取媒体直链，可以点击 **只上传媒体**。

### 重要说明

Buffer 官方 API 当前不直接接收本地文件上传。图片和视频必须先变成 Buffer 可以读取的公网直链，然后作为 assets 提交给 Buffer。

软件会验证上传源返回链接的 `Content-Type` 是否为 `image/*` 或 `video/*`，避免把普通网页链接提交给 Buffer。

Buffer 官方目前每篇文章最多支持 1 个视频。软件会在发布前拦截多视频，避免 Buffer 只保留第一个视频而静默丢失其他视频。

如果定时发布时间距离当前时间很久，临时直链可能在 Buffer 发布前失效。长时间定时发布建议优先使用 Pixeldrain 或 Catbox，并在 Buffer 队列里确认媒体已经显示成功。

### 水印功能

在 **水印设置** 页面可以开启自动水印：

- 支持文字水印和图片水印。
- 支持左上、右上、左下、右下、居中位置。
- 可调整透明度、文字字号、图片水印比例。
- 可分别控制图片和视频是否加水印。

视频水印依赖内置 ffmpeg，用户不需要单独安装。

### Ollama 标题建议

在 **Ollama** 页面可以配置本机 AI 标题建议：

- 默认地址：`http://127.0.0.1:11434`
- 需要先在电脑上安装并启动 Ollama。
- 需要安装支持视觉输入的模型，例如 `llava`、`bakllava`、`qwen2.5vl` 等。
- 图片会直接提交给本机 Ollama。
- 视频会在本机平均截取 8 张画面后提交给 Ollama。
- 生成结果只作为建议显示，不会自动覆盖正文；点击 **使用标题** 才会插入正文。

### 隐私和数据

- Buffer API Key、Pixeldrain API Key、水印设置、Ollama 设置等保存在本机用户数据目录。
- 项目源码中不包含用户 API Key。
- Ollama 标题建议在本机运行；图片/视频帧不会因为 Ollama 功能上传到外网。
- 发布到 Buffer 前，本地媒体会根据你的上传源设置上传到第三方临时文件服务，用于生成 Buffer 可读取的直链。

### 开发运行

由于 SMB/GVFS 共享盘不支持 npm 的部分 symlink/copyfile 行为，安装依赖时建议使用：

```bash
npm install --no-bin-links
```

运行：

```bash
npm start
```

语法检查：

```bash
npm run check
```

打包：

```bash
npm run dist:win
npm run dist:mac
```

> 注意：Windows 包通常可以在 Linux 上交叉打包；macOS 包在非 macOS 环境下可能只能生成部分 zip，具体以 electron-builder 输出为准。

---

## English README

Buffer Publisher is a desktop social media publishing tool for submitting text, images, and videos to Buffer queues, or scheduling posts for a specific time. It is built with Electron, supports Windows and macOS, and includes both Chinese and English interfaces.

![Compose](docs/screenshots/compose.png)

### Key Features

- **Buffer API publishing**: Connect with a Buffer Personal API Key and load organizations, accounts, and channels.
- **Multi-account / multi-channel publishing**: Select multiple Buffer channels and create separate posts for each channel.
- **Queue or scheduled publishing**: Add posts to the Buffer queue or schedule them for a specific local time.
- **Direct media link upload**: Local images and videos are uploaded first as public direct links that Buffer can read.
- **Multiple upload fallback sources**: Supports Pixeldrain, Catbox, Litterbox, temp.sh, 0x0.st, and file.io. If one source fails or times out, the app tries the next one automatically.
- **Watermark processing**: Add text or image watermarks to images and videos before publishing.
- **Local Ollama AI title suggestions**: Use a local Ollama vision model to generate title suggestions from images or sampled video frames.
- **Post list viewer**: View pending and sent Buffer posts.
- **API usage statistics**: Show local Buffer API and Ollama usage statistics.
- **Bilingual interface**: Built-in Chinese and English UI, switchable inside the app.

### Screenshots

#### Compose

![Compose](docs/screenshots/compose.png)

#### Buffer API and Upload Settings

![Settings](docs/screenshots/settings.png)

#### Watermark Settings

![Watermark](docs/screenshots/watermark.png)

#### Ollama Title Suggestions

![Ollama](docs/screenshots/ollama.png)

#### Post List

![Posts](docs/screenshots/posts.png)

### Interface Language

The app supports **Chinese / English** interfaces. Use the language switch button at the bottom of the left sidebar to switch between the Chinese and English UI.

### How to Use

#### 1. Download and unzip

Download the correct package from the GitHub Release page:

- Windows: `BufferPublisher-windows-x64-version.zip`
- macOS Intel: `BufferPublisher-mac-x64-version.zip`
- macOS Apple Silicon: `BufferPublisher-mac-arm64-version.zip`

Unzip the package and run `Buffer Publisher` / `Buffer发布器`.

#### 2. Get a Buffer API Key

Open the Buffer API settings page:

<https://publish.buffer.com/settings/api>

Create or copy your Personal API Key.

#### 3. Configure the app

1. Open **Settings** from the left sidebar.
2. Paste your Buffer API Key into the API Key field.
3. Click **Test and load organizations**.
4. After the account data loads successfully, go back to **Compose** and click **Refresh accounts**.
5. Select the organization and channels you want to publish to.

The API Key is stored only in the local Electron user data directory. It is not written into the project code or GitHub repository.

#### 4. Publish a post

1. Enter your content in the post text field.
2. Drag in or select image/video files.
3. Choose a publishing mode:
   - **Add to Buffer queue**: submit the post to the Buffer queue.
   - **Schedule for a specific time**: publish at the selected local time.
4. Click **Upload and publish to Buffer**.

If you only want to upload media and get direct links, click **Upload media only**.

### Important Notes

The Buffer official API does not directly accept local file uploads. Images and videos must first be converted into public direct media URLs, then submitted to Buffer as assets.

The app validates the returned `Content-Type` from upload sources and only accepts `image/*` or `video/*`, preventing normal webpage links from being submitted to Buffer.

Buffer currently supports at most 1 video per post. The app blocks multiple videos before publishing to avoid Buffer silently dropping extra videos.

For long scheduled posts, temporary direct links may expire before Buffer publishes the post. For long-term scheduling, Pixeldrain or Catbox is recommended, and you should confirm that the media appears correctly in the Buffer queue.

### Watermark

In the **Watermark** page, you can enable automatic watermarking:

- Text watermark or image watermark.
- Positions: top-left, top-right, bottom-left, bottom-right, or center.
- Adjustable opacity, text size, and image watermark scale.
- Separate toggles for image watermarking and video watermarking.

Video watermarking uses bundled ffmpeg. Users do not need to install ffmpeg separately.

### Ollama Title Suggestions

In the **Ollama** page, you can configure local AI title suggestions:

- Default URL: `http://127.0.0.1:11434`
- Ollama must be installed and running on the computer.
- A vision-capable model is required, such as `llava`, `bakllava`, or `qwen2.5vl`.
- Images are sent directly to local Ollama.
- Videos are sampled locally into 8 frames before being sent to Ollama.
- The generated title is shown as a suggestion only. It will not overwrite the post text unless you click **Use title**.

### Privacy and Data

- Buffer API Key, Pixeldrain API Key, watermark settings, and Ollama settings are stored in the local user data directory.
- The source code does not include user API keys.
- Ollama title generation runs locally. Images/video frames are not uploaded to the public internet for Ollama processing.
- Before publishing to Buffer, local media is uploaded to third-party temporary file services according to your upload source settings, so Buffer can read the direct media links.

### Development

When installing dependencies on SMB/GVFS shared folders, use:

```bash
npm install --no-bin-links
```

Run the app:

```bash
npm start
```

Syntax check:

```bash
npm run check
```

Build packages:

```bash
npm run dist:win
npm run dist:mac
```

> Note: Windows packages can usually be cross-built on Linux. macOS packages may be limited on non-macOS environments depending on electron-builder output.

## Tech Stack

- Electron
- electron-builder
- Buffer API
- ffmpeg
- Ollama API

## License

Copyright © Cangify. All rights reserved.
