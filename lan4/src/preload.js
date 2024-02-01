const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    response: (channel, listener) => {
        const onceListener = (event, ...args) => {
          ipcRenderer.removeListener(channel, onceListener);
          listener(...args);
        };
        
        ipcRenderer.on(channel, onceListener);
    },
    saveGraphData: (data) => ipcRenderer.send('save-graph-data', data),
    saveCodeData: (data) => ipcRenderer.send('save-code-data', data),

    getGraphData: (data) => ipcRenderer.send('get-graph-data', data),
    getCodeData: (data) => ipcRenderer.send('get-code-data', data),

    getFolderStructure: (target) => ipcRenderer.send('get-folder-structure', target),
    requestSaveFile: (fileName, fileData) => ipcRenderer.send('request-save-file', fileName, fileData),
    requestFileData: (fileName) => ipcRenderer.send('request-file-data', fileName),
})