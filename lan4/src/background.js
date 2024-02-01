'use strict'

import { app, protocol, BrowserWindow, ipcMain, dialog } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const path = require('path');
const fs = require('fs-extra');
const isDevelopment = process.env.NODE_ENV !== 'production'

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

import {User, Lan} from './classes/classes.js'

let win
let currentLan

function getTargetDirectory(directory) {
  if (fs.existsSync(directory)) {
    if (fs.statSync(directory).isDirectory()) {
      return directory;
    } else {
      const fileDirectory = path.dirname(directory);
      console.log(`Using directory of the file: ${fileDirectory}`);
      return fileDirectory;
    }
  }
  else {
    console.log('Invalid directory path');
    return null;
  }
}

function generateTreeData(dirPath) {
  function readDirectoryRecursively(currentPath, parentDirectories = []) {
    const files = fs.readdirSync(currentPath);

    const treeNodes = files.map((file) => {
      if (file === '.DS_Store' || file.endsWith('.json') || file.endsWith('.obsidian')) {
        return null;
      }

      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);
      const isDirectory = stat.isDirectory();
      const fileName = path.parse(file).name;

      const ancestors = [...parentDirectories];

      return {
        id: filePath,
        name: fileName,
        children: isDirectory ? readDirectoryRecursively(filePath, [...parentDirectories, fileName]) : [],
        open: false,
        isDirectory,
        ancestors,
      };
    });

    // Filter out the null values and sort the nodes.
    const sortedTreeNodes = treeNodes.filter((node) => node !== null)
      .sort((a, b) => {
        // Files come first, then directories.
        if (a.isDirectory === b.isDirectory) {
          return 0;
        } else if (a.isDirectory) {
          return -1; // 'a' is a directory, it should come after 'b'.
        } else {
          return 1; // 'a' is a file, it should come before 'b'.
        }
      });

    return sortedTreeNodes;
  }

  return readDirectoryRecursively(dirPath);
}

function handleRequestFileData(fileName) {
  const filePath = fileName;

  const stat = fs.statSync(filePath);
  const isDirectory = stat.isDirectory();
  console.log(fileName)
  if (isDirectory) {
    win.webContents.send('file-data-response', false);
  }
  else {
    fs.readFile(filePath, 'utf-8', (err, fileContent) => { 
      win.webContents.send('file-data-response', fileContent);
    });
  }
}

function createHomeWindow(devPath) {
  let win = new BrowserWindow({
    width: 700,
    height: 700,
    backgroundColor: '#121212',
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 11, y: 12 },
    frame: false,
    hasShadow: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      preload: path.join(__dirname, '../src/preload.js')
    }
  })
  win.setMaximizable(false);
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL + devPath)
  }
  else {
    createProtocol('app')
    win.loadURL('app://./index.html')
  }

  return win
}

function createLanWindow(devPath) {
  let win = new BrowserWindow({
    width: 875,
    height: 800,
    titleBarStyle: 'hidden',
    hasShadow: false,
    backgroundColor: '#121212',
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      preload: path.join(__dirname, '../src/preload.js')
    },
    resizable: true,
  })
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL + devPath)
  }
  else {
    createProtocol('app')
    win.loadURL('app://./index.html')
  }

  return win
}

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) { 
    win = createLanWindow('lan.html')//createHomeWindow('home.html')
  }
})

app.on('ready', async () => {
  protocol.registerFileProtocol('safe-protocol', (request, callback) => {
    const pathname = decodeURI(request.url.replace('safe-protocol://', ''));
    return callback(decodeURIComponent(pathname));
  });

  if (isDevelopment && !process.env.IS_TEST) {
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }

  win = createLanWindow('lan.html')//createHomeWindow('home.html')

  // ----------------------------------------------------------------------- //
  // -------------------------------- Both --------------------------------- //
  // ----------------------------------------------------------------------- //

  ipcMain.on('open-file-browser', (event, type) => {
    let filters;
    let options;

    if (type === 'image') {
      filters = [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg'] }];
      options = {
        filters: filters,
      }
    } 
    else if (type === 'text') {
      filters = [{ name: 'Markdown, Text, JSON', extensions: ['md', 'txt', 'json'] }];
      options = {
        filters: filters,
      }
    }
    else if (type === 'dir') {
      options = {
        properties: ['openDirectory'],
      };
    } 
    else {
      // Default to open any file type if type is not specified or recognized.
      filters = [];
      options = {
        filters: filters,
      }
    }

  
    dialog.showOpenDialog(win, options).then(result => {
      if (!result.canceled && result.filePaths.length > 0) {
        const selectedDocument = result.filePaths[0];
        if (type === 'text') {
          fs.readFile(selectedDocument, 'utf-8', (err, data) => {
            win.webContents.send('open-file-browser-response', data);
          });
        }
        else {
          win.webContents.send('open-file-browser-response', selectedDocument);
        }
      }
      else {
        win.webContents.send('open-file-browser-response' , null)
      }
    });
  });

  // ----------------------------------------------------------------------- //
  // ----------------------------- Home Window ----------------------------- //
  // ----------------------------------------------------------------------- //

  ipcMain.on('get-graph-data', () => {
    const filePath = path.join(__dirname, '../src/assets', '.data.json');
    fs.readFile(filePath, 'utf-8', (err, data) => {
      const message = JSON.parse(data);
      win.webContents.send('get-graph-data-response', message.graph);
    });
  });

  ipcMain.on('save-graph-data', (event, newData) => {
    const filePath = path.join(__dirname, '../src/assets', '.data.json');
    fs.readFile(filePath, 'utf-8', (err, data) => {
      try {
        let message = JSON.parse(data);
        message.graph = newData
        fs.writeFile(filePath, JSON.stringify(message), ()=>{});
      }
      catch {
        console.log(data)
      }
    });
  });

  ipcMain.on('get-code-data', () => {
    const filePath = path.join(__dirname, '../src/assets', '.data.json');
    fs.readFile(filePath, 'utf-8', (err, data) => {
      const message = JSON.parse(data);
      win.webContents.send('get-code-data-response', message.code);
    });
  });

  ipcMain.on('save-code-data', (event, newData) => {
    const filePath = path.join(__dirname, '../src/assets', '.data.json');
    fs.readFile(filePath, 'utf-8', (err, data) => {
      let message = JSON.parse(data);
      message.code = newData
      fs.writeFile(filePath, JSON.stringify(message), ()=>{});
    });
  });

  // ----------------------------------------------------------------------- //
  // ----------------------------- Lan Window ------------------------------ //
  // ----------------------------------------------------------------------- //

  ipcMain.on('request-file-data', (event, fileName) => {
    console.log("File data requested!\n")
    handleRequestFileData(fileName)
  })

  ipcMain.on('request-save-file', (event, fileName, fileData) => {
    console.log("Saving file requested!\n")
    fs.writeFile(fileName, fileData, ()=>{});
  });
  
  ipcMain.on('request-change-filename', (event, targetFile, value) => {
    console.log("Change filename requested!");
    console.log(targetFile);
    console.log("\n");
    const currentFilePath = path.dirname(targetFile);
    const currentFileName = path.basename(targetFile);

    const ext = path.extname(currentFileName);
    const newFileName = value + ext;
    const newFilePath = path.join(currentFilePath, newFileName);

    if (fs.existsSync(newFilePath)) {
      win.webContents.send('change-filename-response', false);
      return;
    }

    fs.rename(targetFile, newFilePath, () => {
        win.webContents.send('change-filename-response', newFilePath);
      });
  });
  
  ipcMain.on('request-file-deletion', (event, filePath) => {
    console.log('File deletion requested:', filePath);

    const absoluteFilePath = path.resolve(filePath);
    fs.remove(absoluteFilePath, ()=>{})
  });

  ipcMain.on('create-file', (event, directory) => {
    const targetDirectory = getTargetDirectory(directory);

    if (!targetDirectory) {
      return;
    }

    let fileName = 'untitled.md';
    let count = 1;
    let filePath = path.join(targetDirectory, fileName);

    while (fs.existsSync(filePath)) {
      fileName = `untitled ${count}.md`;
      filePath = path.join(targetDirectory, fileName);
      count++;
    }

    fs.writeFileSync(filePath, '', 'utf-8'); // Create an empty file

    win.webContents.send('create-file-response' ,filePath)
  });

  ipcMain.on('save-data', (event, data) => {
    const filePath = path.join(currentLan.location, currentLan.name,'.lan.json');
    fs.writeFile(filePath, JSON.stringify(data), ()=>{});
  });

  ipcMain.on('get-data', () => {
    const filePath = path.join(currentLan.location, currentLan.name,'.lan.json');

    fs.readFile(filePath, 'utf-8', (err, data) => {
      const message = JSON.parse(data);
      win.webContents.send('get-data-response', message);
    });
  });

  ipcMain.on('get-folder-structure', (event, target) => {
    win.webContents.send('get-folder-structure-response', generateTreeData(target))
  })

  //Move file from origin to destiny
  ipcMain.on('move-file-request', (event, origin, destiny) => {
    console.log('Moving file requested!')
    const originFilePath = path.resolve(origin);
    const destinyFilePath = path.resolve(destiny);

    if (fs.existsSync(originFilePath)) {
      if (fs.existsSync(destinyFilePath) && fs.statSync(destinyFilePath).isDirectory()) {
        const fileName = path.basename(originFilePath);

        const newFilePath = path.join(destinyFilePath, fileName);

        fs.rename(originFilePath, newFilePath, () => {});
      }
    }
  });
  
})

if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
