const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');
const os = require('os');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;
let keystrokeCount = 0;
let currentLevel = 1;
let levelProgress = 0;
let keystrokesToNextLevel = 100; // Initial value for level 1

// SPM tracking
let keystrokesInLastMinute = [];
let currentSPM = 0;

// List of keys to monitor
const keysToMonitor = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
  'Space', 'Tab', 'Backspace', 'Delete', 'Enter', 'Up', 'Down', 'Left', 'Right',
  'Home', 'End', 'PageUp', 'PageDown', 'Escape',
  ';', '=', ',', '-', '.', '/', '\\', '[', ']', '\'', '`'
];

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 200,
    height: 280, // Increased height for SPM counter
    x: width - 220, // Position near the right edge
    y: 100,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  
  // For development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Set up keyboard monitoring
  setupKeyboardMonitoring();
  
  // Update UI with current stats every 100ms
  setInterval(() => {
    updateLevelSystem();
    sendStatsToRenderer();
  }, 100);

  // Update SPM calculation every second
  setInterval(() => {
    updateSPM();
  }, 1000);

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
    unregisterAllShortcuts();
  });
}

function updateSPM() {
  // Remove keystrokes older than 1 minute
  const oneMinuteAgo = Date.now() - 60000;
  keystrokesInLastMinute = keystrokesInLastMinute.filter(timestamp => timestamp > oneMinuteAgo);
  
  // Calculate current SPM
  currentSPM = keystrokesInLastMinute.length;
}

function setupKeyboardMonitoring() {
  // Use globalShortcut to detect key presses
  // Register each key as a global shortcut
  for (const key of keysToMonitor) {
    try {
      globalShortcut.register(`${key}`, () => {
        keystrokeCount++;
        keystrokesInLastMinute.push(Date.now());
      });
    } catch (error) {
      console.error(`Failed to register key: ${key}`, error);
    }
  }
  
  // For modifiers (special case as they can't be registered directly)
  const modifiers = ['CommandOrControl', 'Alt', 'Shift'];
  for (const modifier of modifiers) {
    try {
      // Use with A as a base key to detect modifier presses
      globalShortcut.register(`${modifier}+A`, () => {
        keystrokeCount++;
        keystrokesInLastMinute.push(Date.now());
      });
    } catch (error) {
      console.error(`Failed to register modifier: ${modifier}`, error);
    }
  }
}

function unregisterAllShortcuts() {
  globalShortcut.unregisterAll();
}

function calculateKeystrokesForLevel(level) {
  // Same exponential curve as Python version
  return 100 * Math.pow(2, level - 1);
}

function updateLevelSystem() {
  // Check if we've reached the next level
  while (keystrokeCount >= keystrokesToNextLevel) {
    currentLevel++;
    keystrokeCount -= keystrokesToNextLevel;
    keystrokesToNextLevel = calculateKeystrokesForLevel(currentLevel);
  }
  
  // Calculate level progress (0.0 to 1.0)
  levelProgress = keystrokeCount / keystrokesToNextLevel;
}

function sendStatsToRenderer() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('stats-update', {
      keystrokeCount,
      currentLevel,
      levelProgress,
      spm: currentSPM
    });
  }
}

// IPC handlers
ipcMain.on('exit-app', () => {
  app.quit();
});

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});