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
    saveTextData: (data) => ipcRenderer.send('save-text-data', data),
    saveCodeData: (data) => ipcRenderer.send('save-code-data', data),

    getGraphData: (data) => ipcRenderer.send('get-graph-data', data),
    getTextData: (data) => ipcRenderer.send('get-text-data', data),
    getCodeData: (data) => ipcRenderer.send('get-code-data', data),
})