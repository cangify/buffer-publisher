# Buffer发布器

Electron 桌面软件：使用 Buffer 官方 GraphQL API 发布文字、图片和视频文章。

## 第一版功能

- 在设置页填写并保存 Buffer API Key
- 测试 API Key，读取 Buffer 账号和 Organizations
- 读取 Buffer 已绑定的媒体账号 / Channels
- 多选发布账号
- 输入文章正文
- 选择本地图片 / 视频
- 临时图床 fallback 上传并验证直链：
  1. Catbox
  2. Litterbox
  3. temp.sh
  4. 0x0.st
  5. file.io
- 支持 Buffer 发布方式：
  - 加入队列：`addToQueue`
  - 指定时间发布：`customScheduled + dueAt`
- 每个 Channel 单独创建一条 Buffer Post，并显示成功 / 失败信息
- Ollama 本机 AI 标题建议：图片直接分析，视频自动截取 8 帧后分析

## 重要说明

Buffer 官方 API 当前不直接接收本地文件上传。图片和视频需要先上传到公网可访问的直接文件 URL，然后作为 `assets` 提交给 Buffer。

软件会先验证临时图床返回链接的 `Content-Type` 是否是 `image/*` 或 `video/*`，避免把网页分享页提交给 Buffer。

注意：Buffer 官方目前每篇文章最多支持 1 个视频。软件会在发布前拦截多视频，避免 Buffer 只保留第一个视频而静默丢失其他视频。

如果定时发布时间超过临时图床有效期，存在 Buffer 还没处理媒体时链接失效的风险。第一版会在界面提醒；建议先确认 Buffer 队列中媒体已经显示成功。

## Ollama 标题建议

软件有单独的“Ollama”设置页，可配置：

- Ollama 地址，默认 `http://127.0.0.1:11434`
- 是否启用自动取标题
- 视觉模型选择
- 取标题提示词
- 请求超时时间

启用后：

- 上传/拖入图片：软件会把图片缩放成 JPEG 后提交给本机 Ollama，生成标题建议。
- 上传/拖入视频：软件会在本机从视频中截取 8 张图，再提交给 Ollama，生成标题建议。
- 生成结果显示在“AI 标题建议”卡片中，不会自动覆盖正文；点击“使用标题”才会插入正文开头。

需要先在电脑上启动 Ollama，并安装支持图片的视觉模型，例如 `llava`、`bakllava`、`qwen2.5vl` 等。

## 开发运行

由于 SMB/GVFS 共享盘不支持 npm 的部分 symlink/copyfile 行为，安装依赖时请使用：

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

## Buffer API Key

到 Buffer 后台创建：

<https://publish.buffer.com/settings/api>

软件只需要填写 API Key；请求会发送：

```http
Authorization: Bearer YOUR_API_KEY
```

## 后续可增强

- 保存草稿模式
- 发布后反查 Post 详情，确认 Buffer 已接收 assets
- Windows 打包脚本（建议在非 SMB 本地目录打包）
- 更细的上传源排序和单源开关 UI 拖拽
- Cloudinary / R2 长期媒体源备用
