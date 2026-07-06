const { contextBridge, ipcRenderer, webUtils } = require('electron');
const { pathToFileURL } = require('url');

contextBridge.exposeInMainWorld('appApi', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: patch => ipcRenderer.invoke('config:save', patch),
  pickFiles: () => ipcRenderer.invoke('files:pick'),
  pickWatermarkImage: () => ipcRenderer.invoke('files:pick-watermark-image'),
  filesFromPaths: paths => ipcRenderer.invoke('files:fromPaths', paths),
  getDroppedFilePath: file => webUtils.getPathForFile(file),
  fileUrl: filePath => pathToFileURL(filePath).toString(),
  testBuffer: () => ipcRenderer.invoke('buffer:test'),
  getBufferUsage: () => ipcRenderer.invoke('buffer:usage'),
  getOllamaModels: () => ipcRenderer.invoke('ollama:models'),
  getOllamaUsage: () => ipcRenderer.invoke('ollama:usage'),
  generateOllamaTitle: payload => ipcRenderer.invoke('ollama:title', payload),
  getChannels: organizationId => ipcRenderer.invoke('buffer:channels', organizationId),
  getPosts: organizationId => ipcRenderer.invoke('buffer:posts', organizationId),
  uploadMedia: files => ipcRenderer.invoke('media:upload', files),
  createPost: payload => ipcRenderer.invoke('post:create', payload),
  openExternal: url => ipcRenderer.invoke('shell:openExternal', url)
});
