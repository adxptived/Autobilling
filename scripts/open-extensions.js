const { execFile } = require('child_process');
const path = require('path');

const distPath = path.resolve(__dirname, '..', 'dist');
const firefoxDistPath = path.resolve(__dirname, '..', 'dist-firefox', 'manifest.json');
const pages = [
  'chrome://extensions',
  'edge://extensions',
  'brave://extensions',
  'opera://extensions',
  'about:debugging#/runtime/this-firefox',
];

function printInstructions() {
  console.log('Extension built successfully.');
  console.log(`Load unpacked folder for Chrome/Edge/Brave/Opera: ${distPath}`);
  console.log(`Load temporary add-on manifest for Firefox: ${firefoxDistPath}`);
  console.log('Open your browser extension page:');
  for (const page of pages) console.log(`- ${page}`);
}

function openDefaultBrowser(url) {
  if (process.platform === 'win32') {
    execFile('cmd', ['/c', 'start', '', url], (error) => {
      if (error) printInstructions();
      else {
        console.log(`Opened ${url} in your default browser.`);
        console.log(`Click "Load unpacked" and select: ${distPath}`);
        console.log(`For Firefox, use "Load Temporary Add-on" and select: ${firefoxDistPath}`);
      }
    });
    return;
  }

  if (process.platform === 'darwin') {
    execFile('open', [url], (error) => {
      if (error) printInstructions();
      else {
        console.log(`Opened ${url} in your default browser.`);
        console.log(`Select: ${distPath}`);
        console.log(`For Firefox, select: ${firefoxDistPath}`);
      }
    });
    return;
  }

  execFile('xdg-open', [url], (error) => {
    if (error) printInstructions();
    else {
      console.log(`Opened ${url} in your default browser.`);
      console.log(`Select: ${distPath}`);
      console.log(`For Firefox, select: ${firefoxDistPath}`);
    }
  });
}

openDefaultBrowser('chrome://extensions');
