const { execFile } = require('child_process');
const path = require('path');

const distPath = path.resolve(__dirname, '..', 'dist');
const pages = [
  'chrome://extensions',
  'edge://extensions',
  'brave://extensions',
  'opera://extensions',
  'about:debugging#/runtime/this-firefox',
];

function printInstructions() {
  console.log('Extension built successfully.');
  console.log(`Load unpacked folder: ${distPath}`);
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
      }
    });
    return;
  }

  execFile('xdg-open', [url], (error) => {
    if (error) printInstructions();
    else {
      console.log(`Opened ${url} in your default browser.`);
      console.log(`Select: ${distPath}`);
    }
  });
}

openDefaultBrowser('chrome://extensions');
