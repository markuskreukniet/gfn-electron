const { app, globalShortcut, BrowserWindow, session } = require('electron');
const path = require('path');
const { DiscordRPC } = require('./rpc.js');
const { switchFullscreenState } = require('./windowManager.js');

var homePage = 'https://play.geforcenow.com';
var userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.3';

console.log('Using user agent: ' + userAgent);
console.log('Process arguments: ' + process.argv);

app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,WaylandWindowDecorations,RawDraw');

app.commandLine.appendSwitch(
  'disable-features',
  'UseChromeOSDirectVideoDecoder'
);
app.commandLine.appendSwitch('enable-accelerated-mjpeg-decode');
app.commandLine.appendSwitch('enable-accelerated-video');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-gpu-memory-buffer-video-frames');
// TODO: This is going to depend per user, so we need to find a way to detect this
// egl should be a safe bet for now, as it allows for hardware video decode on most systems
app.commandLine.appendSwitch('use-gl', 'egl');

async function createWindow() {
  const mainWindow = new BrowserWindow({
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      userAgent: userAgent,
    },
  });

  if (process.argv.includes('--direct-start')) {
    mainWindow.loadURL('https://play.geforcenow.com/mall/#/streamer?launchSource=GeForceNOW&cmsId=' + process.argv[process.argv.indexOf('--direct-start') + 1]);
  } else {
    mainWindow.loadURL(homePage);
  }

  /*
  uncomment this to debug any errors with loading GFN landing page

  mainWindow.webContents.on("will-navigate", (event, url) => {
    console.log("will-navigate", url);
    event.preventDefault();
  });
  */
}

app.whenReady().then(async () => {
  createWindow();

  DiscordRPC('GeForce NOW');

  app.on('activate', async function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  globalShortcut.register('Super+F', async () => {
    switchFullscreenState();
  });

  globalShortcut.register('F11', async () => {
    switchFullscreenState();
  });

  globalShortcut.register('Alt+F4', async () => {
    app.quit();
  });

  globalShortcut.register('Alt+Home', async () => {
    BrowserWindow.getAllWindows()[0].loadURL(homePage);
  });

  globalShortcut.register('F4', async () => {
    app.quit();
  });

  globalShortcut.register('Control+Shift+I', () => {
    BrowserWindow.getAllWindows()[0].webContents.toggleDevTools();
  });

  globalShortcut.register('Esc', async () => {
    var window = BrowserWindow.getAllWindows()[0];

    window.webContents.sendInputEvent({
      type: 'keyDown',
      keyCode: 'Esc'
    });
    window.webContents.sendInputEvent({
      type: 'char',
      keyCode: 'Esc'
    });
    window.webContents.sendInputEvent({
      type: 'keyUp',
      keyCode: 'Esc'
    });

    window.webContents.sendInputEvent({
      type: 'keyDown',
      keyCode: 'Esc'
    });
    window.webContents.sendInputEvent({
      type: 'char',
      keyCode: 'Esc'
    });
    window.webContents.sendInputEvent({
      type: 'keyUp',
      keyCode: 'Esc'
    });
  });
});

app.on('browser-window-created', async function (e, window) {
  window.setBackgroundColor('#1A1D1F');
  window.setMenu(null);

  window.webContents.setUserAgent(userAgent);

  window.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    BrowserWindow.getAllWindows()[0].loadURL(url);
  });

  window.on('page-title-updated', async function (e, title) {
    DiscordRPC(title);
  });
});

app.on('will-quit', async () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', async function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
