// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
window.api = {
  send: (channel, data) => {
    // whitelist channels
    let validChannels = ['exit-app', 'keystroke', 'update-name', 'retry-keyboard-monitoring', 'reset-data'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    let validChannels = ['stats-update', 'keyboard-monitor-error', 'keystroke-after-timeout'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
};